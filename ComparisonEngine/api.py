"""
FastAPI Orchestrator for Multi-Level Comparison Analysis
Orchestrates all analysis modules in sequence with detailed logging
"""

import os
import sys
import json
import logging
import traceback
import asyncio
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime
import time

# Load environment variables for AWS
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv()
except ImportError:
    pass

# Import boto3 for S3
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

# Import pyngrok for URL tunneling
try:
    from pyngrok import ngrok
    PYNGROK_AVAILABLE = True
except ImportError:
    PYNGROK_AVAILABLE = False

from fastapi import FastAPI, Form, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Configure logging with UTF-8 encoding
# Set up UTF-8 encoding for stdout on Windows
if sys.platform == 'win32':
    # Reconfigure stdout to use UTF-8
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Create handlers with UTF-8 encoding
file_handler = logging.FileHandler('orchestrator.log', encoding='utf-8', errors='replace')
console_handler = logging.StreamHandler(sys.stdout)

# Set format
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler]
)
logger = logging.getLogger(__name__)

# Log boto3 availability after logger is initialized
if not BOTO3_AVAILABLE:
    logger.warning("[WARNING] boto3 not available. S3 uploads will be disabled.")

# Log pyngrok availability after logger is initialized
if not PYNGROK_AVAILABLE:
    logger.warning("[WARNING] pyngrok not available. URL tunneling will be disabled.")

# Import all analysis modules
try:
    from fetch import WikipediaAPIScraper, GrokipediaSeleniumScraper, save_to_file
    logger.info("[OK] Successfully imported fetch.py")
except ImportError as e:
    logger.error(f"[ERROR] Failed to import fetch.py: {e}")
    raise

try:
    from triple import KnowledgeGraphAnalyzer
    logger.info("[OK] Successfully imported triple.py")
except ImportError as e:
    logger.error(f"[ERROR] Failed to import triple.py: {e}")
    raise

try:
    from semanticdrift import SemanticDriftDetector
    logger.info("[OK] Successfully imported semanticdrift.py")
except ImportError as e:
    logger.error(f"[ERROR] Failed to import semanticdrift.py: {e}")
    raise

try:
    from factcheck import FactChecker
    logger.info("[OK] Successfully imported factcheck.py")
except ImportError as e:
    logger.error(f"[ERROR] Failed to import factcheck.py: {e}")
    raise

try:
    from sentiment import SentimentBiasAnalyzer
    logger.info("[OK] Successfully imported sentiment.py")
except ImportError as e:
    logger.error(f"[ERROR] Failed to import sentiment.py: {e}")
    raise

try:
    from multimodal import MultimodalAnalyzer
    logger.info("[OK] Successfully imported multimodal.py")
except ImportError as e:
    logger.error(f"[ERROR] Failed to import multimodal.py: {e}")
    raise

try:
    from judging import EditorialJudge
    logger.info("[OK] Successfully imported judging.py")
except ImportError as e:
    logger.error(f"[ERROR] Failed to import judging.py: {e}")
    raise

# Initialize FastAPI app
app = FastAPI(
    title="Multi-Level Comparison Analysis API",
    description="Orchestrates comprehensive analysis of Grokipedia vs Wikipedia content",
    version="1.0.0"
)

# Global results storage (in production, use a database)
analysis_results = {}

# Global progress tracker - single current processing state
current_progress = None

# Global variable to store ngrok tunnel
ngrok_tunnel = None


@app.on_event("startup")
async def startup_event():
    """Set up ngrok tunnel when the app starts"""
    global ngrok_tunnel
    
    if PYNGROK_AVAILABLE:
        try:
            # Load ngrok authtoken from environment variables
            ngrok_authtoken = os.environ.get("NGROK_AUTHTOKEN")
            if ngrok_authtoken:
                ngrok.set_auth_token(ngrok_authtoken)
                logger.info("[NGROK] Authtoken loaded from environment variable")
            else:
                logger.warning("[WARNING] NGROK_AUTHTOKEN not found in environment. Using default ngrok configuration.")
            
            # Create ngrok tunnel on port 8000
            ngrok_tunnel = ngrok.connect(8000, "http")
            public_url = ngrok_tunnel.public_url
            logger.info("=" * 80)
            logger.info("[NGROK] Tunnel established successfully!")
            logger.info(f"[NGROK] Public URL: {public_url}")
            logger.info(f"[NGROK] Local URL: http://0.0.0.0:8000")
            logger.info("=" * 80)
            print("\n" + "=" * 80)
            print(f"🌐 NGROK TUNNEL ACTIVE")
            print("=" * 80)
            print(f"📍 Public URL: {public_url}")
            print(f"🔗 Local URL: http://localhost:8000")
            print(f"📚 API Docs: {public_url}/docs")
            print("=" * 80 + "\n")
        except Exception as e:
            logger.warning(f"[WARNING] Failed to create ngrok tunnel: {e}")
            logger.warning("[WARNING] Running without tunnel (local access only)")
            ngrok_tunnel = None


@app.on_event("shutdown")
async def shutdown_event():
    """Close ngrok tunnel when the app shuts down"""
    global ngrok_tunnel
    if ngrok_tunnel:
        try:
            ngrok.disconnect(ngrok_tunnel.public_url)
            logger.info("[NGROK] Tunnel closed")
        except Exception as e:
            logger.warning(f"[WARNING] Error closing ngrok tunnel: {e}")

# S3 Configuration
S3_BUCKET_NAME = "cummaimages"
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")

# Initialize S3 client if credentials are available
s3_client = None
if BOTO3_AVAILABLE and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        logger.info("[OK] S3 client initialized")
    except Exception as e:
        logger.warning(f"[WARNING] Failed to initialize S3 client: {e}")
        s3_client = None
else:
    logger.warning("[WARNING] S3 credentials not found. Image uploads will be disabled.")


def upload_file_to_s3(file_path: str, s3_key: str) -> Optional[str]:
    """
    Upload a file to S3 bucket
    
    Args:
        file_path: Local path to the file
        s3_key: S3 object key (path in bucket)
    
    Returns:
        S3 URL if successful, None otherwise
    """
    if not s3_client:
        logger.warning(f"[WARNING] S3 client not available. Skipping upload of {file_path}")
        return None
    
    if not os.path.exists(file_path):
        logger.warning(f"[WARNING] File not found: {file_path}")
        return None
    
    try:
        logger.info(f"[INFO] Uploading {file_path} to S3 as {s3_key}...")
        s3_client.upload_file(
            file_path,
            S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': 'image/png'} if file_path.endswith('.png') else {}
        )
        
        # Generate S3 URL (using standard S3 URL format)
        s3_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        logger.info(f"[OK] Successfully uploaded to S3")
        logger.info(f"[INFO] S3 URL: {s3_url}")
        return s3_url
    except ClientError as e:
        logger.error(f"[ERROR] Failed to upload {file_path} to S3: {e}")
        return None
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error uploading {file_path} to S3: {e}")
        return None


def update_progress(current_step: str, total_steps: int, step_number: int, status: str = "in_progress", message: str = "", analysis_id: Optional[str] = None):
    """
    Update global progress tracker
    
    Args:
        current_step: Name of the current step (e.g., "fetch", "triple")
        total_steps: Total number of steps in the analysis
        step_number: Current step number (1-indexed)
        status: Status of the step ("in_progress", "completed", "error")
        message: Optional message about the current step
        analysis_id: Optional analysis ID to link progress with results
    """
    global current_progress
    
    progress_percentage = int((step_number / total_steps) * 100) if total_steps > 0 else 0
    
    current_progress = {
        "current_step": current_step,
        "step_number": step_number,
        "total_steps": total_steps,
        "progress_percentage": progress_percentage,
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if analysis_id:
        current_progress["analysis_id"] = analysis_id


def clear_progress():
    """Clear the current progress tracker"""
    global current_progress
    current_progress = None


def upload_all_images(analysis_id: str) -> Dict[str, str]:
    """
    Upload all generated images to S3 and return their URLs
    
    Args:
        analysis_id: Unique identifier for this analysis
    
    Returns:
        Dictionary mapping image names to S3 URLs
    """
    image_urls = {}
    
    # List of potential image files to upload
    image_files = [
        ("semantic_drift_visualizations/similarity_heatmap.png", f"{analysis_id}/similarity_heatmap.png"),
        ("semantic_drift_visualizations/embedding_space.png", f"{analysis_id}/embedding_space.png"),
        ("sentiment_visualizations/bias_compass.png", f"{analysis_id}/bias_compass.png"),
    ]
    
    for local_path, s3_key in image_files:
        if os.path.exists(local_path):
            s3_url = upload_file_to_s3(local_path, s3_key)
            if s3_url:
                # Extract just the filename for the key
                filename = os.path.basename(local_path)
                image_urls[filename] = s3_url
        else:
            logger.debug(f"[DEBUG] Image not found: {local_path}")
    
    return image_urls


class AnalysisResponse(BaseModel):
    """Response model for analysis results"""
    status: str
    analysis_id: str
    topic: str
    steps_completed: List[str]
    results: Dict[str, Any]
    errors: List[str]
    timestamp: str
    execution_time_seconds: float
    image_urls: Optional[Dict[str, str]] = None


def modify_factcheck_with_context(factchecker: FactChecker, suggested_edit: str, resource_links: List[str]):
    """
    Modify the factchecker to include suggested_edit and resource_links in both:
    1. Web search queries (_search_web_for_excerpt)
    2. Structured verification analysis (_get_structured_verification)
    
    This ensures the context about areas where Grokipedia is wrong and additional
    resource links are used throughout the fact-checking process.
    """
    original_search_method = factchecker._search_web_for_excerpt
    original_structured_method = factchecker._get_structured_verification
    
    def enhanced_search_web_for_excerpt(excerpt: str, verbose: bool = False) -> str:
        """Enhanced web search that includes suggested_edit and resource_links"""
        if not factchecker.openai_client:
            if verbose:
                logger.warning(f"[Web Search] [WARNING] OpenAI not available")
            return ""
        
        try:
            # Build enhanced query with context
            enhanced_query = f"""
Original Excerpt to Verify:
{excerpt}

Suggested Edit Context:
{suggested_edit}

Additional Resource Links to Consider:
{chr(10).join(f"- {link}" for link in resource_links) if resource_links else "None provided"}

Please search the web and provide comprehensive information about the excerpt above, 
taking into account the suggested edit context and the provided resource links. 
Verify the accuracy of the excerpt and provide detailed information from authoritative sources with citations.
"""
            
            if verbose:
                logger.info(f"[Web Search] Searching web with enhanced context...")
                logger.info(f"[Web Search] Excerpt: {excerpt[:100]}...")
                logger.info(f"[Web Search] Suggested Edit: {suggested_edit[:100]}...")
                logger.info(f"[Web Search] Resource Links: {len(resource_links)} links provided")
            
            completion = factchecker.openai_client.chat.completions.create(
                model="gpt-4o-search-preview",
                web_search_options={},
                messages=[
                    {
                        "role": "user",
                        "content": enhanced_query
                    }
                ],
                max_tokens=2000
            )
            
            response_content = completion.choices[0].message.content
            
            if verbose:
                logger.info(f"[Web Search] [OK] Received response ({len(response_content)} characters)")
            
            return response_content
        
        except Exception as e:
            if verbose:
                logger.error(f"[Web Search] [ERROR] Exception: {e}")
            return ""
    
    def enhanced_get_structured_verification(raw_web_response: str, excerpt: str, claim_text: str, verbose: bool = False) -> Dict:
        """Enhanced structured verification that includes suggested_edit and resource_links"""
        if not factchecker.openai_client:
            if verbose:
                logger.warning(f"[Structured Analysis] [WARNING] OpenAI not available")
            return {}
        
        system_prompt = """You are a fact-checking expert. Analyze the web search results and provide a structured JSON response with the following fields:

{
  "verification_status": "verified" | "partially_verified" | "unverified" | "contradicted",
  "confidence_score": 0.0-1.0 (float),
  "verification_score": 0-100 (integer, percentage of how well the claim is verified),
  "external_verification_score": 0-100 (integer, percentage based on number of external sources that support the claim),
  "sources_count": integer (number of authoritative sources found),
  "sources": ["url1", "url2", ...] (list of source URLs),
  "key_facts": ["fact1", "fact2", ...] (list of key facts that support or contradict the claim),
  "analysis": "detailed explanation of why the claim is verified/unverified",
  "temporal_consistency": true/false (whether dates/numbers are consistent),
  "fabrication_risk_score": 0-100 (integer, higher = more likely to be hallucination),
  "citation_present": true/false (whether the original excerpt had citations),
  "hallucination_indicators": ["indicator1", "indicator2", ...] (list of reasons why this might be a hallucination)
}

Scoring Guidelines:
- verification_score: 0-100 based on how well external sources support the claim
- external_verification_score: Based on number of authoritative sources (0 sources = 0, 1-2 sources = 30, 3-5 sources = 60, 6+ sources = 90)
- fabrication_risk_score: Higher if claim lacks citations, has no external verification, contains vague language, or contradicts authoritative sources
- confidence_score: Overall confidence in the verification (0.0-1.0)

IMPORTANT: Pay special attention to the "Suggested Edit Context" and "Additional Resource Links" provided below. 
These indicate areas where the source (Grokipedia) may be wrong or need correction. Use this context to:
1. Cross-reference the suggested corrections with the web search results
2. Check if the provided resource links support or contradict the claim
3. Identify if the claim aligns with the suggested corrections or contradicts them
4. Adjust your verification scores accordingly - if the suggested edit indicates an error, and web search confirms it, 
   mark the claim as contradicted or unverified with higher fabrication_risk_score

Return ONLY valid JSON, no additional text."""
        
        # Build enhanced user prompt with context
        resource_links_text = chr(10).join(f"- {link}" for link in resource_links) if resource_links else "None provided"
        
        user_prompt = f"""Original Claim: {claim_text}

Original Excerpt: {excerpt}

Suggested Edit Context (Areas where Grokipedia may be wrong):
{suggested_edit}

Additional Resource Links to Consider:
{resource_links_text}

Web Search Results:
{raw_web_response}

Analyze the web search results in the context of the suggested edit and resource links. 
Pay special attention to:
1. Whether the web search results confirm or contradict the suggested edit
2. Whether the provided resource links support or refute the claim
3. If the suggested edit indicates an error, verify if the web search confirms this error
4. Provide a comprehensive analysis that considers both the web search results AND the suggested edit context

Provide a structured JSON response evaluating the claim."""
        
        try:
            if verbose:
                logger.info(f"[Structured Analysis] Sending to gpt-4o with enhanced context...")
                logger.info(f"[Structured Analysis] Suggested Edit: {suggested_edit[:100]}...")
                logger.info(f"[Structured Analysis] Resource Links: {len(resource_links)} links provided")
            
            completion = factchecker.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=1500
            )
            
            response_content = completion.choices[0].message.content
            
            if verbose:
                logger.info(f"[Structured Analysis] [OK] Received structured response")
            
            # Parse JSON response
            try:
                import json
                structured_data = json.loads(response_content)
                return structured_data
            except json.JSONDecodeError as e:
                if verbose:
                    logger.warning(f"[Structured Analysis] [WARNING] Failed to parse JSON: {e}")
                # Try to extract JSON from response
                import re
                json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if json_match:
                    try:
                        return json.loads(json_match.group())
                    except:
                        pass
                return {}
        
        except Exception as e:
            if verbose:
                logger.error(f"[Structured Analysis] [ERROR] Exception: {e}")
            return {}
    
    # Replace both methods
    factchecker._search_web_for_excerpt = enhanced_search_web_for_excerpt
    factchecker._get_structured_verification = enhanced_get_structured_verification
    logger.info("[OK] Enhanced factchecker with suggested_edit and resource_links context (both web search and structured analysis)")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Multi-Level Comparison Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "/analyze": "POST - Start comprehensive analysis (7 steps)",
            "/analyze-lite": "POST - Start lightweight analysis (2 steps: fetch + triple)",
            "/status/{analysis_id}": "GET - Check analysis status",
            "/results/{analysis_id}": "GET - Get analysis results",
            "/progress": "GET - Get current progress of ongoing analysis"
        }
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_content(
    topic: str = Form(..., description="Topic to analyze"),
    suggested_edit: str = Form(..., description="Suggested edit context"),
    resource_links: Optional[List[str]] = Form(default=None, description="Additional resource links (can be multiple)")
):
    """
    Main analysis endpoint that orchestrates all analysis modules
    
    Starts the analysis in a background thread and returns immediately.
    Use /progress endpoint to track progress.
    
    Steps:
    1. Fetch content from Grokipedia and Wikipedia (fetch.py)
    2. Knowledge Graph Triple Analysis (triple.py)
    3. Semantic Drift Detection (semanticdrift.py)
    4. Fact-Checking with enhanced context (factcheck.py)
    5. Sentiment & Bias Analysis (sentiment.py)
    6. Multimodal Analysis (multimodal.py)
    7. Editorial Judgment (judging.py)
    """
    analysis_id = f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{topic[:20].replace(' ', '_')}"
    
    # Handle resource_links - convert to list if needed
    if resource_links is None:
        resource_links = []
    elif isinstance(resource_links, str):
        # If single string provided, check if it's comma-separated
        if ',' in resource_links:
            resource_links = [link.strip() for link in resource_links.split(',') if link.strip()]
        else:
            resource_links = [resource_links] if resource_links.strip() else []
    elif not isinstance(resource_links, list):
        resource_links = [str(resource_links)]
    
    # Filter out empty strings
    resource_links = [link for link in resource_links if link and link.strip()]
    
    # Clear any previous progress and initialize new progress tracker
    clear_progress()
    update_progress("initializing", 7, 0, "in_progress", "Starting comprehensive analysis...", analysis_id)
    
    # Run analysis in background thread so endpoint returns immediately
    asyncio.create_task(asyncio.to_thread(run_analysis, analysis_id, topic, suggested_edit, resource_links))
    
    # Return immediately with analysis_id
    return AnalysisResponse(
        status="started",
        analysis_id=analysis_id,
        topic=topic,
        steps_completed=[],
        results={},
        errors=[],
        timestamp=datetime.now().isoformat(),
        execution_time_seconds=0.0,
        image_urls=None
    )


def run_analysis(analysis_id: str, topic: str, suggested_edit: str, resource_links: List[str]):
    """
    Synchronous function that runs the analysis in a separate thread
    This allows the endpoint to return immediately while progress is tracked
    """
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info(f"[START] STARTING COMPREHENSIVE ANALYSIS")
    logger.info("=" * 80)
    logger.info(f"Analysis ID: {analysis_id}")
    logger.info(f"Topic: {topic}")
    logger.info(f"Suggested Edit: {suggested_edit[:100]}...")
    
    logger.info(f"Resource Links: {len(resource_links)} links provided")
    if resource_links:
        for i, link in enumerate(resource_links, 1):
            logger.info(f"  {i}. {link}")
    logger.info("=" * 80)
    
    # Update progress
    update_progress("initializing", 7, 0, "in_progress", "Starting comprehensive analysis...", analysis_id)
    
    results = {
        "fetch": None,
        "triple": None,
        "semanticdrift": None,
        "factcheck": None,
        "sentiment": None,
        "multimodal": None,
        "judging": None
    }
    
    errors = []
    steps_completed = []
    
    try:
        # ====================================================================
        # STEP 1: FETCH CONTENT (fetch.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 1/7: FETCHING CONTENT FROM GROKIPEDIA AND WIKIPEDIA")
        logger.info("=" * 80)
        update_progress("fetch", 7, 1, "in_progress", "Fetching content from Grokipedia and Wikipedia...", analysis_id)
        
        try:
            output_dir = "dual_scraper_output"
            os.makedirs(output_dir, exist_ok=True)
            
            # Scrape Wikipedia
            logger.info("[INFO] Scraping Wikipedia...")
            wikipedia_scraper = WikipediaAPIScraper()
            wikipedia_data = wikipedia_scraper.search_and_scrape(topic)
            
            if "error" in wikipedia_data:
                raise Exception(f"Wikipedia scraping failed: {wikipedia_data['error']}")
            
            logger.info(f"[OK] Wikipedia scraped successfully")
            logger.info(f"  - Word count: {wikipedia_data.get('word_count', 0):,}")
            logger.info(f"  - Character count: {wikipedia_data.get('char_count', 0):,}")
            logger.info(f"  - References: {wikipedia_data.get('references_count', 0)}")
            
            # Scrape Grokipedia
            logger.info("[INFO] Scraping Grokipedia...")
            grokipedia_scraper = GrokipediaSeleniumScraper(headless=True)
            grokipedia_data = grokipedia_scraper.search_and_scrape(topic)
            
            if "error" in grokipedia_data:
                raise Exception(f"Grokipedia scraping failed: {grokipedia_data['error']}")
            
            logger.info(f"[OK] Grokipedia scraped successfully")
            logger.info(f"  - Word count: {grokipedia_data.get('word_count', 0):,}")
            logger.info(f"  - Character count: {grokipedia_data.get('char_count', 0):,}")
            logger.info(f"  - References: {grokipedia_data.get('references_count', 0)}")
            if grokipedia_data.get('structured_content'):
                logger.info(f"  - Sections: {len(grokipedia_data['structured_content'])}")
            
            # Save to files
            grokipedia_filename = f"{output_dir}/grokipedia.txt"
            wikipedia_filename = f"{output_dir}/wikipedia.txt"
            
            save_to_file(grokipedia_data, grokipedia_filename, "Grokipedia", topic)
            save_to_file(wikipedia_data, wikipedia_filename, "Wikipedia", topic)
            
            logger.info(f"[OK] Files saved:")
            logger.info(f"  - {grokipedia_filename}")
            logger.info(f"  - {wikipedia_filename}")
            
            # Safely get structured_content, handling None values
            grok_structured = grokipedia_data.get('structured_content') or []
            grok_sections_count = len(grok_structured) if isinstance(grok_structured, list) else 0
            
            results["fetch"] = {
                "status": "success",
                "grokipedia": {
                    "word_count": grokipedia_data.get('word_count', 0),
                    "char_count": grokipedia_data.get('char_count', 0),
                    "references_count": grokipedia_data.get('references_count', 0),
                    "sections": grok_sections_count
                },
                "wikipedia": {
                    "word_count": wikipedia_data.get('word_count', 0),
                    "char_count": wikipedia_data.get('char_count', 0),
                    "references_count": wikipedia_data.get('references_count', 0)
                },
                "files": {
                    "grokipedia": grokipedia_filename,
                    "wikipedia": wikipedia_filename
                }
            }
            
            steps_completed.append("fetch")
            logger.info("[OK] STEP 1 COMPLETE: Content fetched successfully")
            update_progress("fetch", 7, 1, "completed", "Content fetched successfully", analysis_id)
            
            # Close browser
            grokipedia_scraper.close()
            
        except Exception as e:
            error_msg = f"Step 1 (Fetch) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["fetch"] = {"status": "error", "error": str(e)}
            update_progress("fetch", 7, 1, "error", error_msg, analysis_id)
            raise
        
        # ====================================================================
        # STEP 2: KNOWLEDGE GRAPH TRIPLE ANALYSIS (triple.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 2/7: KNOWLEDGE GRAPH TRIPLE EXTRACTION & COMPARISON")
        logger.info("=" * 80)
        update_progress("triple", 7, 2, "in_progress", "Extracting and comparing knowledge graph triples...")
        
        try:
            analyzer = KnowledgeGraphAnalyzer()
            
            triple_results = analyzer.analyze_files(
                grokipedia_filename,
                wikipedia_filename
            )
            
            logger.info("[OK] Triple extraction complete")
            comp = triple_results["comparison"]
            
            logger.info("[INFO] Basic Statistics:")
            logger.info(f"  - Grokipedia Triples: {comp['basic_stats']['source_a_triples']}")
            logger.info(f"  - Wikipedia Triples: {comp['basic_stats']['source_b_triples']}")
            
            logger.info("[INFO] Triple Overlap:")
            logger.info(f"  - Exact Match: {comp['triple_overlap']['exact_overlap_score']}%")
            logger.info(f"  - Fuzzy Match: {comp['triple_overlap']['fuzzy_overlap_score']}%")
            logger.info(f"  - Unique to Grokipedia: {comp['triple_overlap']['unique_to_source_a']}")
            logger.info(f"  - Unique to Wikipedia: {comp['triple_overlap']['unique_to_source_b']}")
            
            logger.info("[INFO] Semantic Similarity:")
            logger.info(f"  - Average Similarity: {comp['semantic_similarity']['average_similarity']:.4f}")
            logger.info(f"  - Similar Pairs: {comp['semantic_similarity']['similar_pairs_count']}")
            logger.info(f"  - Method: {comp['semantic_similarity']['method']}")
            
            logger.info("[INFO] Provenance Analysis:")
            prov = comp['provenance_analysis']
            logger.info(f"  - Grokipedia Cited: {prov['source_a_cited']} ({prov['source_a_cited_percentage']}%)")
            logger.info(f"  - Wikipedia Cited: {prov['source_b_cited']} ({prov['source_b_cited_percentage']}%)")
            
            logger.info("[WARNING] Contradictions:")
            logger.info(f"  - Contradictions Detected: {comp['contradictions']['contradiction_count']}")
            
            results["triple"] = {
                "status": "success",
                "basic_stats": comp['basic_stats'],
                "triple_overlap": comp['triple_overlap'],
                "semantic_similarity": comp['semantic_similarity'],
                "graph_embeddings": comp.get('graph_embeddings', {}),
                "graph_density": comp.get('graph_density', {}),
                "entity_coherence": comp.get('entity_coherence', {}),
                "provenance_analysis": prov,
                "contradictions": comp['contradictions']
            }
            
            steps_completed.append("triple")
            logger.info("[OK] STEP 2 COMPLETE: Knowledge graph analysis complete")
            update_progress("triple", 7, 2, "completed", "Knowledge graph analysis complete", analysis_id)
            
        except Exception as e:
            error_msg = f"Step 2 (Triple) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["triple"] = {"status": "error", "error": str(e)}
            update_progress("triple", 7, 2, "error", error_msg)
        
        # ====================================================================
        # STEP 3: SEMANTIC DRIFT DETECTION (semanticdrift.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 3/7: SEMANTIC DRIFT DETECTION")
        logger.info("=" * 80)
        update_progress("semanticdrift", 7, 3, "in_progress", "Detecting semantic drift between sources...")
        
        try:
            detector = SemanticDriftDetector()
            
            drift_results = detector.calculate_semantic_drift(
                grokipedia_filename,
                wikipedia_filename
            )
            
            logger.info("[OK] Semantic drift analysis complete")
            
            logger.info("[INFO] Overall Semantic Drift Score:")
            drift_score = drift_results.get('semantic_drift_score', {})
            if drift_score:
                logger.info(f"  - Drift Percentage: {drift_score.get('drift_percentage', 0):.2f}%")
                logger.info(f"  - Interpretation: {drift_score.get('interpretation', 'N/A')}")
            
            logger.info("[INFO] Topic Modeling:")
            topic_modeling = drift_results.get('topic_modeling', {})
            if topic_modeling:
                logger.info(f"  - Method: {topic_modeling.get('method', 'N/A')}")
                logger.info(f"  - Topic Count: {topic_modeling.get('topic_count', 0)}")
                if 'topic_divergence' in topic_modeling:
                    logger.info(f"  - Topic Divergence: {topic_modeling['topic_divergence']:.4f}")
            
            logger.info("[OK] Claim-Level Alignment:")
            ca = drift_results.get('claim_alignment', {})
            if ca:
                logger.info(f"  - Alignment Percentage: {ca.get('alignment_percentage', 0):.2f}%")
                logger.info(f"  - Exact Matches: {ca.get('exact_matches', 0)}")
                logger.info(f"  - Semantic Matches: {ca.get('semantic_matches', 0)}")
            
            # Generate visualizations (uses internal full results)
            detector.visualize_embeddings(drift_results)
            logger.info("[OK] Visualizations generated")
            
            # Return only the specified sections: topic_modeling, semantic_drift_score, claim_alignment, visualization
            # Filter out unwanted fields like 'probabilities' from topic_modeling
            topic_modeling = drift_results.get('topic_modeling', {})
            if isinstance(topic_modeling, dict):
                topic_modeling = topic_modeling.copy()
                if 'probabilities' in topic_modeling:
                    del topic_modeling['probabilities']
                if 'topics' in topic_modeling:
                    del topic_modeling['topics']  # Also remove raw topics array if present
            
            results["semanticdrift"] = {
                "status": "success",
                "topic_modeling": topic_modeling,
                "semantic_drift_score": drift_results.get('semantic_drift_score', {}),
                "claim_alignment": drift_results.get('claim_alignment', {}),
                "visualization": drift_results.get('visualization', {})
            }
            
            steps_completed.append("semanticdrift")
            logger.info("[OK] STEP 3 COMPLETE: Semantic drift analysis complete")
            update_progress("semanticdrift", 7, 3, "completed", "Semantic drift analysis complete", analysis_id)
            
        except Exception as e:
            error_msg = f"Step 3 (Semantic Drift) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["semanticdrift"] = {"status": "error", "error": str(e)}
            update_progress("semanticdrift", 7, 3, "error", error_msg)
        
        # ====================================================================
        # STEP 4: FACT-CHECKING WITH ENHANCED CONTEXT (factcheck.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 4/7: FACT-CHECKING & HALLUCINATION DETECTION")
        logger.info("=" * 80)
        update_progress("factcheck", 7, 4, "in_progress", "Fact-checking and detecting hallucinations...")
        
        try:
            checker = FactChecker()
            
            # Enhance factchecker with suggested_edit and resource_links
            modify_factcheck_with_context(checker, suggested_edit, resource_links)
            logger.info("[OK] Factchecker enhanced with suggested_edit and resource_links context")
            
            factcheck_results = checker.fact_check_article(
                grokipedia_filename,
                wikipedia_filename,
                "kg_analysis_results.txt"
            )
            
            logger.info("[OK] Fact-checking analysis complete")
            
            if factcheck_results.get("summary", {}).get("total_contradictions", 0) > 0:
                logger.info("[INFO] Summary:")
                logger.info(f"  - Total Contradictions: {factcheck_results['summary']['total_contradictions']}")
                logger.info(f"  - Grokipedia Claims Verified: {factcheck_results['summary']['grok_claims_verified']}")
                logger.info(f"  - Wikipedia Claims Verified: {factcheck_results['summary']['wiki_claims_verified']}")
                
                logger.info("[INFO] Grokipedia Metrics:")
                grok_metrics = factcheck_results['metrics']['grokipedia']
                logger.info(f"  - Unsourced Claim Ratio: {grok_metrics['unsourced_claim_ratio']['unsourced_ratio']:.2f}%")
                logger.info(f"  - External Verification Score: {grok_metrics['external_verification_score']['external_verification_score']:.2f}%")
                logger.info(f"  - Fabrication Risk Score: {grok_metrics['fabrication_risk_score']['fabrication_risk_score']:.2f}% ({grok_metrics['fabrication_risk_score']['risk_level']})")
                
                logger.info("[INFO] Wikipedia Metrics:")
                wiki_metrics = factcheck_results['metrics']['wikipedia']
                logger.info(f"  - Unsourced Claim Ratio: {wiki_metrics['unsourced_claim_ratio']['unsourced_ratio']:.2f}%")
                logger.info(f"  - External Verification Score: {wiki_metrics['external_verification_score']['external_verification_score']:.2f}%")
                logger.info(f"  - Fabrication Risk Score: {wiki_metrics['fabrication_risk_score']['fabrication_risk_score']:.2f}% ({wiki_metrics['fabrication_risk_score']['risk_level']})")
            else:
                logger.warning("[WARNING] No contradictions found for fact-checking")
            
            results["factcheck"] = {
                "status": "success",
                "summary": factcheck_results.get("summary", {}),
                "metrics": factcheck_results.get("metrics", {}),
                "contradictory_claims": factcheck_results.get("contradictory_claims", {})
            }
            
            steps_completed.append("factcheck")
            logger.info("[OK] STEP 4 COMPLETE: Fact-checking analysis complete")
            update_progress("factcheck", 7, 4, "completed", "Fact-checking analysis complete", analysis_id)
            
        except Exception as e:
            error_msg = f"Step 4 (Fact-Check) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["factcheck"] = {"status": "error", "error": str(e)}
            update_progress("factcheck", 7, 4, "error", error_msg)
        
        # ====================================================================
        # STEP 5: SENTIMENT & BIAS ANALYSIS (sentiment.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 5/7: SENTIMENT & BIAS ANALYSIS")
        logger.info("=" * 80)
        update_progress("sentiment", 7, 5, "in_progress", "Analyzing sentiment and bias...")
        
        try:
            analyzer = SentimentBiasAnalyzer()
            
            sentiment_results = analyzer.analyze_article(
                grokipedia_filename,
                wikipedia_filename
            )
            
            logger.info("[OK] Sentiment analysis complete")
            
            logger.info("[INFO] Sentiment Analysis:")
            grok_avg = sentiment_results["sentiment_analysis"]["grokipedia"]["average_polarity"]
            wiki_avg = sentiment_results["sentiment_analysis"]["wikipedia"]["average_polarity"]
            logger.info(f"  - Grokipedia Average Polarity: {grok_avg:.3f}")
            logger.info(f"  - Wikipedia Average Polarity: {wiki_avg:.3f}")
            logger.info(f"  - Sentiment Shifts Detected: {len(sentiment_results['sentiment_analysis']['sentiment_shifts'])}")
            
            logger.info("[INFO] Framing Analysis:")
            grok_bias = sentiment_results["framing_analysis"]["word_choice_bias"]["grokipedia"]["bias_score"]
            wiki_bias = sentiment_results["framing_analysis"]["word_choice_bias"]["wikipedia"]["bias_score"]
            logger.info(f"  - Grokipedia Bias Score: {grok_bias:.2f}")
            logger.info(f"  - Wikipedia Bias Score: {wiki_bias:.2f}")
            
            logger.info("[INFO] Political Leaning:")
            grok_quad = sentiment_results["political_leaning"]["grokipedia"]["quadrant"]
            wiki_quad = sentiment_results["political_leaning"]["wikipedia"]["quadrant"]
            logger.info(f"  - Grokipedia: {grok_quad}")
            logger.info(f"  - Wikipedia: {wiki_quad}")
            
            results["sentiment"] = {
                "status": "success",
                "sentiment_analysis": {
                    "grokipedia_average_polarity": grok_avg,
                    "wikipedia_average_polarity": wiki_avg,
                    "sentiment_shifts_count": len(sentiment_results['sentiment_analysis']['sentiment_shifts']),
                    "sentiment_shifts": sentiment_results['sentiment_analysis']['sentiment_shifts'][:5]  # Top 5
                },
                "framing_analysis": {
                    "grokipedia_bias_score": grok_bias,
                    "wikipedia_bias_score": wiki_bias,
                    "representation_balance": {
                        "grokipedia": sentiment_results["framing_analysis"]["representation_bias"]["grokipedia"]["balance_score"],
                        "wikipedia": sentiment_results["framing_analysis"]["representation_bias"]["wikipedia"]["balance_score"]
                    }
                },
                "political_leaning": {
                    "grokipedia": grok_quad,
                    "wikipedia": wiki_quad,
                    "grokipedia_scores": sentiment_results["political_leaning"]["grokipedia"],
                    "wikipedia_scores": sentiment_results["political_leaning"]["wikipedia"]
                }
            }
            
            steps_completed.append("sentiment")
            logger.info("[OK] STEP 5 COMPLETE: Sentiment & bias analysis complete")
            update_progress("sentiment", 7, 5, "completed", "Sentiment & bias analysis complete", analysis_id)
            
        except Exception as e:
            error_msg = f"Step 5 (Sentiment) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["sentiment"] = {"status": "error", "error": str(e)}
            update_progress("sentiment", 7, 5, "error", error_msg)
        
        # ====================================================================
        # STEP 6: MULTIMODAL ANALYSIS (multimodal.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 6/7: MULTIMODAL ANALYSIS")
        logger.info("=" * 80)
        update_progress("multimodal", 7, 6, "in_progress", "Analyzing multimodal content alignment...")
        
        try:
            # Extract Wikipedia article title from the fetched data
            wikipedia_title = topic  # Use topic as Wikipedia title (can be improved)
            
            analyzer = MultimodalAnalyzer()
            
            multimodal_results = analyzer.analyze_multimodal_alignment(
                grokipedia_filename,
                wikipedia_title
            )
            
            if "error" in multimodal_results:
                logger.warning(f"[WARNING] Multimodal analysis warning: {multimodal_results['error']}")
            else:
                logger.info("[OK] Multimodal analysis complete")
                
                logger.info("[INFO] Summary:")
                summary = multimodal_results["summary"]
                logger.info(f"  - Images Found: {summary['images_found']} (Processed: {summary['images_processed']})")
                logger.info(f"  - Videos Found: {summary['videos_found']}")
                logger.info(f"  - Audio Found: {summary['audio_found']}")
                logger.info(f"  - Media Processed: {summary['media_processed']}")
                
                logger.info("[INFO] Textual Similarity:")
                textual = multimodal_results["textual_similarity"]
                logger.info(f"  - Average Similarity: {textual['average_similarity']:.3f}")
                logger.info(f"  - Average Image Similarity: {textual['average_image_similarity']:.3f}")
                logger.info(f"  - Average Media Similarity: {textual['average_media_similarity']:.3f}")
                
                logger.info("[INFO] Multimodal Consistency Index:")
                mci = multimodal_results["multimodal_consistency_index"]
                logger.info(f"  - MCI Score: {mci['mci_score']:.2f}%")
            
            # Return only the specified sections: summary, textual_similarity, image_to_text_alignment,
            # media_to_text_alignment, overall_multimedia_alignment, multimodal_consistency_index, detailed_results
            # Filter out unwanted fields like 'chunk_similarities' from detailed_results
            detailed_results = multimodal_results.get("detailed_results", {})
            if isinstance(detailed_results, dict):
                detailed_results = detailed_results.copy()
                if 'chunk_similarities' in detailed_results:
                    del detailed_results['chunk_similarities']
            
            results["multimodal"] = {
                "status": "success" if "error" not in multimodal_results else "partial",
                "summary": multimodal_results.get("summary", {}),
                "textual_similarity": multimodal_results.get("textual_similarity", {}),
                "image_to_text_alignment": multimodal_results.get("image_to_text_alignment", {}),
                "media_to_text_alignment": multimodal_results.get("media_to_text_alignment", {}),
                "overall_multimedia_alignment": multimodal_results.get("overall_multimedia_alignment", {}),
                "multimodal_consistency_index": multimodal_results.get("multimodal_consistency_index", {}),
                "detailed_results": detailed_results
            }
            
            steps_completed.append("multimodal")
            logger.info("[OK] STEP 6 COMPLETE: Multimodal analysis complete")
            update_progress("multimodal", 7, 6, "completed", "Multimodal analysis complete", analysis_id)
            
        except Exception as e:
            error_msg = f"Step 6 (Multimodal) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["multimodal"] = {"status": "error", "error": str(e)}
            update_progress("multimodal", 7, 6, "error", error_msg)
        
        # ====================================================================
        # STEP 7: EDITORIAL JUDGMENT (judging.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 7/7: EDITORIAL JUDGMENT")
        logger.info("=" * 80)
        update_progress("judging", 7, 7, "in_progress", "Generating editorial judgment...")
        
        try:
            judge = EditorialJudge()
            
            judgment_results = judge.analyze_articles(
                grokipedia_filename,
                wikipedia_filename
            )
            
            logger.info("[OK] Editorial judgment complete")
            
            if judgment_results.get("status") == "success":
                logger.info(f"  - Model Used: {judgment_results.get('model', 'N/A')}")
                logger.info(f"  - Report Length: {len(judgment_results.get('report', ''))} characters")
                logger.info("  - Report sections include:")
                logger.info("    * Executive Summary")
                logger.info("    * Factual Accuracy Analysis")
                logger.info("    * Bias and Framing Analysis")
                logger.info("    * Structural Differences")
                logger.info("    * Editorial Suggestions")
                logger.info("    * Detailed Examples")
                logger.info("    * Overall Recommendations")
            else:
                logger.warning(f"[WARNING] Editorial judgment returned error: {judgment_results.get('error', 'Unknown')}")
            
            results["judging"] = {
                "status": judgment_results.get("status", "unknown"),
                "model": judgment_results.get("model", "N/A"),
                "report_length": len(judgment_results.get("report", "")),
                "report_preview": judgment_results.get("report", "")[:500] if judgment_results.get("report") else None,
                "full_report": judgment_results.get("report", "") if judgment_results.get("report") else None
            }
            
            steps_completed.append("judging")
            logger.info("[OK] STEP 7 COMPLETE: Editorial judgment complete")
            update_progress("judging", 7, 7, "completed", "Editorial judgment complete", analysis_id)
            
        except Exception as e:
            error_msg = f"Step 7 (Judging) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["judging"] = {"status": "error", "error": str(e)}
            update_progress("judging", 7, 7, "error", error_msg)
        
        # ====================================================================
        # UPLOAD IMAGES TO S3
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("UPLOADING IMAGES TO S3")
        logger.info("=" * 80)
        update_progress("uploading_images", 7, 7, "in_progress", "Uploading images to S3...", analysis_id)
        
        image_urls = upload_all_images(analysis_id)
        logger.info(f"[OK] Uploaded {len(image_urls)} images to S3")
        if image_urls:
            for filename, url in image_urls.items():
                logger.info(f"  - {filename}: {url}")
        
        # ====================================================================
        # FINAL SUMMARY
        # ====================================================================
        execution_time = time.time() - start_time
        
        logger.info("\n" + "=" * 80)
        logger.info("[SUCCESS] ANALYSIS COMPLETE")
        logger.info("=" * 80)
        logger.info(f"Analysis ID: {analysis_id}")
        logger.info(f"Steps Completed: {len(steps_completed)}/7")
        logger.info(f"  - {', '.join(steps_completed)}")
        logger.info(f"Errors: {len(errors)}")
        if errors:
            for error in errors:
                logger.error(f"  - {error}")
        logger.info(f"Execution Time: {execution_time:.2f} seconds")
        logger.info(f"Images Uploaded: {len(image_urls)}")
        logger.info("=" * 80)
        
        # Update progress to completed
        update_progress("completed", 7, 7, "completed", f"Analysis complete. {len(steps_completed)}/7 steps completed successfully.", analysis_id)
        
        # Store results
        analysis_results[analysis_id] = {
            "topic": topic,
            "suggested_edit": suggested_edit,
            "resource_links": resource_links,
            "steps_completed": steps_completed,
            "results": results,
            "errors": errors,
            "timestamp": datetime.now().isoformat(),
            "execution_time_seconds": execution_time,
            "image_urls": image_urls
        }
        
        return AnalysisResponse(
            status="success" if len(errors) == 0 else "partial",
            analysis_id=analysis_id,
            topic=topic,
            steps_completed=steps_completed,
            results=results,
            errors=errors,
            timestamp=datetime.now().isoformat(),
            execution_time_seconds=execution_time,
            image_urls=image_urls if image_urls else None
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        error_msg = f"Critical error in analysis: {str(e)}"
        logger.error(f"[ERROR] {error_msg}")
        logger.error(traceback.format_exc())
        
        # Update progress to show error
        update_progress("error", 7, len(steps_completed), "error", error_msg, analysis_id)
        
        analysis_results[analysis_id] = {
            "topic": topic,
            "suggested_edit": suggested_edit,
            "resource_links": resource_links,
            "steps_completed": steps_completed,
            "results": results,
            "errors": errors + [error_msg],
            "timestamp": datetime.now().isoformat(),
            "execution_time_seconds": execution_time
        }
        
        # Return error response instead of raising
        return {
            "status": "error",
            "analysis_id": analysis_id,
            "error": error_msg,
            "steps_completed": steps_completed,
            "execution_time_seconds": execution_time
        }


@app.get("/status/{analysis_id}")
async def get_status(analysis_id: str):
    """Get status of an analysis"""
    if analysis_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    result = analysis_results[analysis_id]
    return {
        "analysis_id": analysis_id,
        "status": "complete",
        "steps_completed": result["steps_completed"],
        "total_steps": 7,
        "errors": result["errors"],
        "timestamp": result["timestamp"],
        "execution_time_seconds": result["execution_time_seconds"]
    }


@app.get("/results/{analysis_id}")
async def get_results(analysis_id: str):
    """Get full results of an analysis"""
    if analysis_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis_results[analysis_id]


@app.get("/progress")
async def get_progress():
    """
    Get current progress of any ongoing analysis
    
    Returns:
        Progress information including:
        - current_step: Name of the current step
        - step_number: Current step number (1-indexed)
        - total_steps: Total number of steps
        - progress_percentage: Percentage complete (0-100)
        - status: Status of the current step (in_progress, completed, error)
        - message: Descriptive message about the current step
        - timestamp: When the progress was last updated
        - results: Full analysis results (only when status is "completed")
        
    Returns null if no analysis is currently running.
    """
    global current_progress
    
    if current_progress is None:
        return {
            "status": "idle",
            "message": "No analysis currently running"
        }
    
    # If analysis is completed or errored, also include the results
    if current_progress.get("status") in ("completed", "error") and "analysis_id" in current_progress:
        analysis_id = current_progress["analysis_id"]
        if analysis_id in analysis_results:
            # Merge progress with results
            result = current_progress.copy()
            result["results"] = analysis_results[analysis_id]
            return result
    
    return current_progress


@app.post("/analyze-lite")
async def analyze_lite(topic: str = Form(..., description="Topic to analyze")):
    """
    Lightweight analysis endpoint that only performs:
    1. Fetch content from Grokipedia and Wikipedia (fetch.py)
    2. Knowledge Graph Triple Analysis (triple.py)
    
    Starts the analysis in a background thread and returns immediately.
    Use /progress endpoint to track progress.
    
    This is a faster, lighter version of the full analysis.
    """
    analysis_id = f"lite_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{topic[:20].replace(' ', '_')}"
    
    # Clear any previous progress and initialize new progress tracker
    clear_progress()
    update_progress("initializing", 2, 0, "in_progress", "Starting lite analysis...", analysis_id)
    
    # Run analysis in background thread so endpoint returns immediately
    asyncio.create_task(asyncio.to_thread(run_lite_analysis, analysis_id, topic))
    
    # Return immediately with analysis_id
    return {
        "status": "started",
        "analysis_id": analysis_id,
        "topic": topic,
        "steps_completed": [],
        "results": {},
        "errors": [],
        "timestamp": datetime.now().isoformat(),
        "execution_time_seconds": 0.0
    }


def run_lite_analysis(analysis_id: str, topic: str):
    """
    Synchronous function that runs the lite analysis in a separate thread
    This allows the endpoint to return immediately while progress is tracked
    """
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info("[START] STARTING LITE ANALYSIS")
    logger.info("=" * 80)
    logger.info(f"Analysis ID: {analysis_id}")
    logger.info(f"Topic: {topic}")
    logger.info("=" * 80)
    
    # Update progress
    update_progress("initializing", 2, 0, "in_progress", "Starting lite analysis...", analysis_id)
    
    results = {
        "fetch": None,
        "triple": None
    }
    
    errors = []
    steps_completed = []
    
    try:
        # ====================================================================
        # STEP 1: FETCH CONTENT (fetch.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 1/2: FETCHING CONTENT FROM GROKIPEDIA AND WIKIPEDIA")
        logger.info("=" * 80)
        update_progress("fetch", 2, 1, "in_progress", "Fetching content from Grokipedia and Wikipedia...")
        
        try:
            output_dir = "dual_scraper_output"
            os.makedirs(output_dir, exist_ok=True)
            
            # Scrape Wikipedia
            logger.info("[INFO] Scraping Wikipedia...")
            wikipedia_scraper = WikipediaAPIScraper()
            wikipedia_data = wikipedia_scraper.search_and_scrape(topic)
            
            if "error" in wikipedia_data:
                raise Exception(f"Wikipedia scraping failed: {wikipedia_data['error']}")
            
            logger.info(f"[OK] Wikipedia scraped successfully")
            logger.info(f"  - Word count: {wikipedia_data.get('word_count', 0):,}")
            logger.info(f"  - Character count: {wikipedia_data.get('char_count', 0):,}")
            logger.info(f"  - References: {wikipedia_data.get('references_count', 0)}")
            
            # Scrape Grokipedia
            logger.info("[INFO] Scraping Grokipedia...")
            grokipedia_scraper = GrokipediaSeleniumScraper(headless=True)
            grokipedia_data = grokipedia_scraper.search_and_scrape(topic)
            
            if "error" in grokipedia_data:
                raise Exception(f"Grokipedia scraping failed: {grokipedia_data['error']}")
            
            logger.info(f"[OK] Grokipedia scraped successfully")
            logger.info(f"  - Word count: {grokipedia_data.get('word_count', 0):,}")
            logger.info(f"  - Character count: {grokipedia_data.get('char_count', 0):,}")
            logger.info(f"  - References: {grokipedia_data.get('references_count', 0)}")
            
            # Save to files
            grokipedia_filename = f"{output_dir}/grokipedia.txt"
            wikipedia_filename = f"{output_dir}/wikipedia.txt"
            
            save_to_file(grokipedia_data, grokipedia_filename, "Grokipedia", topic)
            save_to_file(wikipedia_data, wikipedia_filename, "Wikipedia", topic)
            
            logger.info(f"[OK] Files saved:")
            logger.info(f"  - {grokipedia_filename}")
            logger.info(f"  - {wikipedia_filename}")
            
            # Safely get structured_content, handling None values
            grok_structured = grokipedia_data.get('structured_content') or []
            grok_sections_count = len(grok_structured) if isinstance(grok_structured, list) else 0
            
            results["fetch"] = {
                "status": "success",
                "grokipedia": {
                    "word_count": grokipedia_data.get('word_count', 0),
                    "char_count": grokipedia_data.get('char_count', 0),
                    "references_count": grokipedia_data.get('references_count', 0),
                    "sections": grok_sections_count
                },
                "wikipedia": {
                    "word_count": wikipedia_data.get('word_count', 0),
                    "char_count": wikipedia_data.get('char_count', 0),
                    "references_count": wikipedia_data.get('references_count', 0)
                },
                "files": {
                    "grokipedia": grokipedia_filename,
                    "wikipedia": wikipedia_filename
                }
            }
            
            steps_completed.append("fetch")
            logger.info("[OK] STEP 1 COMPLETE: Content fetched successfully")
            update_progress("fetch", 2, 1, "completed", "Content fetched successfully", analysis_id)
            
            # Close browser
            grokipedia_scraper.close()
            
        except Exception as e:
            error_msg = f"Step 1 (Fetch) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["fetch"] = {"status": "error", "error": str(e)}
            update_progress("fetch", 2, 1, "error", error_msg)
            raise
        
        # ====================================================================
        # STEP 2: KNOWLEDGE GRAPH TRIPLE ANALYSIS (triple.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 2/2: KNOWLEDGE GRAPH TRIPLE EXTRACTION & COMPARISON")
        logger.info("=" * 80)
        update_progress("triple", 2, 2, "in_progress", "Extracting and comparing knowledge graph triples...")
        
        try:
            analyzer = KnowledgeGraphAnalyzer()
            
            triple_results = analyzer.analyze_files(
                grokipedia_filename,
                wikipedia_filename
            )
            
            logger.info("[OK] Triple extraction complete")
            comp = triple_results["comparison"]
            
            logger.info("[INFO] Basic Statistics:")
            logger.info(f"  - Grokipedia Triples: {comp['basic_stats']['source_a_triples']}")
            logger.info(f"  - Wikipedia Triples: {comp['basic_stats']['source_b_triples']}")
            
            logger.info("[INFO] Triple Overlap:")
            logger.info(f"  - Exact Match: {comp['triple_overlap']['exact_overlap_score']}%")
            logger.info(f"  - Fuzzy Match: {comp['triple_overlap']['fuzzy_overlap_score']}%")
            logger.info(f"  - Unique to Grokipedia: {comp['triple_overlap']['unique_to_source_a']}")
            logger.info(f"  - Unique to Wikipedia: {comp['triple_overlap']['unique_to_source_b']}")
            
            logger.info("[INFO] Semantic Similarity:")
            logger.info(f"  - Average Similarity: {comp['semantic_similarity']['average_similarity']:.4f}")
            logger.info(f"  - Similar Pairs: {comp['semantic_similarity']['similar_pairs_count']}")
            logger.info(f"  - Method: {comp['semantic_similarity']['method']}")
            
            logger.info("[INFO] Provenance Analysis:")
            prov = comp['provenance_analysis']
            logger.info(f"  - Grokipedia Cited: {prov['source_a_cited']} ({prov['source_a_cited_percentage']}%)")
            logger.info(f"  - Wikipedia Cited: {prov['source_b_cited']} ({prov['source_b_cited_percentage']}%)")
            
            logger.info("[WARNING] Contradictions:")
            logger.info(f"  - Contradictions Detected: {comp['contradictions']['contradiction_count']}")
            
            results["triple"] = {
                "status": "success",
                "basic_stats": comp['basic_stats'],
                "triple_overlap": comp['triple_overlap'],
                "semantic_similarity": comp['semantic_similarity'],
                "graph_embeddings": comp.get('graph_embeddings', {}),
                "graph_density": comp.get('graph_density', {}),
                "entity_coherence": comp.get('entity_coherence', {}),
                "provenance_analysis": prov,
                "contradictions": comp['contradictions']
            }
            
            steps_completed.append("triple")
            logger.info("[OK] STEP 2 COMPLETE: Knowledge graph analysis complete")
            update_progress("triple", 2, 2, "completed", "Knowledge graph analysis complete", analysis_id)
            
        except Exception as e:
            error_msg = f"Step 2 (Triple) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["triple"] = {"status": "error", "error": str(e)}
            update_progress("triple", 2, 2, "error", error_msg)
        
        # ====================================================================
        # FINAL SUMMARY
        # ====================================================================
        execution_time = time.time() - start_time
        
        logger.info("\n" + "=" * 80)
        logger.info("[SUCCESS] LITE ANALYSIS COMPLETE")
        logger.info("=" * 80)
        
        # Update progress to completed
        update_progress("completed", 2, 2, "completed", f"Lite analysis complete. {len(steps_completed)}/2 steps completed successfully.", analysis_id)
        logger.info(f"Analysis ID: {analysis_id}")
        logger.info(f"Steps Completed: {len(steps_completed)}/2")
        logger.info(f"  - {', '.join(steps_completed)}")
        logger.info(f"Errors: {len(errors)}")
        if errors:
            for error in errors:
                logger.error(f"  - {error}")
        logger.info(f"Execution Time: {execution_time:.2f} seconds")
        logger.info("=" * 80)
        
        # Store results
        analysis_results[analysis_id] = {
            "topic": topic,
            "steps_completed": steps_completed,
            "results": results,
            "errors": errors,
            "timestamp": datetime.now().isoformat(),
            "execution_time_seconds": execution_time
        }
        
        return {
            "status": "success" if len(errors) == 0 else "partial",
            "analysis_id": analysis_id,
            "topic": topic,
            "steps_completed": steps_completed,
            "results": results,
            "errors": errors,
            "timestamp": datetime.now().isoformat(),
            "execution_time_seconds": execution_time
        }
        
    except Exception as e:
        execution_time = time.time() - start_time
        error_msg = f"Critical error in lite analysis: {str(e)}"
        logger.error(f"[ERROR] {error_msg}")
        logger.error(traceback.format_exc())
        
        # Update progress to show error
        update_progress("error", 2, len(steps_completed), "error", error_msg, analysis_id)
        
        analysis_results[analysis_id] = {
            "topic": topic,
            "steps_completed": steps_completed,
            "results": results,
            "errors": errors + [error_msg],
            "timestamp": datetime.now().isoformat(),
            "execution_time_seconds": execution_time
        }
        
        # Return error result instead of raising
        return {
            "status": "error",
            "analysis_id": analysis_id,
            "error": error_msg,
            "steps_completed": steps_completed,
            "execution_time_seconds": execution_time
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
