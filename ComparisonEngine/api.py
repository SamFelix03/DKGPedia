"""
FastAPI Orchestrator for Multi-Level Comparison Analysis
Orchestrates all analysis modules in sequence with detailed logging
"""

import os
import sys
import json
import logging
import traceback
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
    Modify the factchecker to include suggested_edit and resource_links in web search queries
    This patches the _search_web_for_excerpt method to include additional context
    """
    original_search_method = factchecker._search_web_for_excerpt
    
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
    
    # Replace the method
    factchecker._search_web_for_excerpt = enhanced_search_web_for_excerpt
    logger.info("[OK] Enhanced factchecker with suggested_edit and resource_links context")


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
            "/results/{analysis_id}": "GET - Get analysis results"
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
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info(f"[START] STARTING COMPREHENSIVE ANALYSIS")
    logger.info("=" * 80)
    logger.info(f"Analysis ID: {analysis_id}")
    logger.info(f"Topic: {topic}")
    logger.info(f"Suggested Edit: {suggested_edit[:100]}...")
    
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
    
    logger.info(f"Resource Links: {len(resource_links)} links provided")
    if resource_links:
        for i, link in enumerate(resource_links, 1):
            logger.info(f"  {i}. {link}")
    logger.info("=" * 80)
    
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
            
            # Close browser
            grokipedia_scraper.close()
            
        except Exception as e:
            error_msg = f"Step 1 (Fetch) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["fetch"] = {"status": "error", "error": str(e)}
            raise
        
        # ====================================================================
        # STEP 2: KNOWLEDGE GRAPH TRIPLE ANALYSIS (triple.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 2/7: KNOWLEDGE GRAPH TRIPLE EXTRACTION & COMPARISON")
        logger.info("=" * 80)
        
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
            
        except Exception as e:
            error_msg = f"Step 2 (Triple) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["triple"] = {"status": "error", "error": str(e)}
        
        # ====================================================================
        # STEP 3: SEMANTIC DRIFT DETECTION (semanticdrift.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 3/7: SEMANTIC DRIFT DETECTION")
        logger.info("=" * 80)
        
        try:
            detector = SemanticDriftDetector()
            
            drift_results = detector.calculate_semantic_drift(
                grokipedia_filename,
                wikipedia_filename
            )
            
            logger.info("[OK] Semantic drift analysis complete")
            
            logger.info("[INFO] Overall Semantic Drift Score:")
            drift_score = drift_results['semantic_drift_score']
            logger.info(f"  - Drift Percentage: {drift_score['drift_percentage']:.2f}%")
            logger.info(f"  - Interpretation: {drift_score['interpretation']}")
            
            logger.info("[INFO] Sentence Embeddings:")
            se = drift_results['sentence_embeddings']
            logger.info(f"  - Average Similarity: {se['average_similarity']:.4f}")
            logger.info(f"  - Max Similarity: {se['max_similarity']:.4f}")
            logger.info(f"  - Min Similarity: {se['min_similarity']:.4f}")
            
            logger.info("[INFO] Cross-Encoder Similarity:")
            ce = drift_results['cross_encoder']
            logger.info(f"  - Average Similarity: {ce['average_similarity']:.4f}")
            
            logger.info("[OK] Claim-Level Alignment:")
            ca = drift_results['claim_alignment']
            logger.info(f"  - Alignment Percentage: {ca['alignment_percentage']:.2f}%")
            logger.info(f"  - Exact Matches: {ca['exact_matches']}")
            logger.info(f"  - Semantic Matches: {ca['semantic_matches']}")
            
            # Generate visualizations
            detector.visualize_embeddings(drift_results)
            logger.info("[OK] Visualizations generated")
            
            results["semanticdrift"] = {
                "status": "success",
                "semantic_drift_score": drift_score,
                "sentence_embeddings": {
                    "average_similarity": se['average_similarity'],
                    "max_similarity": se['max_similarity'],
                    "min_similarity": se['min_similarity']
                },
                "cross_encoder": {
                    "average_similarity": ce['average_similarity']
                },
                "knowledge_graph_embeddings": drift_results.get('knowledge_graph_embeddings', {}),
                "topic_modeling": drift_results.get('topic_modeling', {}),
                "claim_alignment": ca
            }
            
            steps_completed.append("semanticdrift")
            logger.info("[OK] STEP 3 COMPLETE: Semantic drift analysis complete")
            
        except Exception as e:
            error_msg = f"Step 3 (Semantic Drift) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["semanticdrift"] = {"status": "error", "error": str(e)}
        
        # ====================================================================
        # STEP 4: FACT-CHECKING WITH ENHANCED CONTEXT (factcheck.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 4/7: FACT-CHECKING & HALLUCINATION DETECTION")
        logger.info("=" * 80)
        
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
            
        except Exception as e:
            error_msg = f"Step 4 (Fact-Check) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["factcheck"] = {"status": "error", "error": str(e)}
        
        # ====================================================================
        # STEP 5: SENTIMENT & BIAS ANALYSIS (sentiment.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 5/7: SENTIMENT & BIAS ANALYSIS")
        logger.info("=" * 80)
        
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
            
        except Exception as e:
            error_msg = f"Step 5 (Sentiment) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["sentiment"] = {"status": "error", "error": str(e)}
        
        # ====================================================================
        # STEP 6: MULTIMODAL ANALYSIS (multimodal.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 6/7: MULTIMODAL ANALYSIS")
        logger.info("=" * 80)
        
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
            
            results["multimodal"] = {
                "status": "success" if "error" not in multimodal_results else "partial",
                "summary": multimodal_results.get("summary", {}),
                "textual_similarity": multimodal_results.get("textual_similarity", {}),
                "image_to_text_alignment": multimodal_results.get("image_to_text_alignment", {}),
                "media_to_text_alignment": multimodal_results.get("media_to_text_alignment", {}),
                "multimodal_consistency_index": multimodal_results.get("multimodal_consistency_index", {})
            }
            
            steps_completed.append("multimodal")
            logger.info("[OK] STEP 6 COMPLETE: Multimodal analysis complete")
            
        except Exception as e:
            error_msg = f"Step 6 (Multimodal) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["multimodal"] = {"status": "error", "error": str(e)}
        
        # ====================================================================
        # STEP 7: EDITORIAL JUDGMENT (judging.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 7/7: EDITORIAL JUDGMENT")
        logger.info("=" * 80)
        
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
            
        except Exception as e:
            error_msg = f"Step 7 (Judging) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["judging"] = {"status": "error", "error": str(e)}
        
        # ====================================================================
        # UPLOAD IMAGES TO S3
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("UPLOADING IMAGES TO S3")
        logger.info("=" * 80)
        
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
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "analysis_id": analysis_id,
                "error": error_msg,
                "steps_completed": steps_completed,
                "execution_time_seconds": execution_time
            }
        )


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


@app.post("/analyze-lite")
async def analyze_lite(topic: str = Form(..., description="Topic to analyze")):
    """
    Lightweight analysis endpoint that only performs:
    1. Fetch content from Grokipedia and Wikipedia (fetch.py)
    2. Knowledge Graph Triple Analysis (triple.py)
    
    This is a faster, lighter version of the full analysis.
    """
    analysis_id = f"lite_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{topic[:20].replace(' ', '_')}"
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info("[START] STARTING LITE ANALYSIS")
    logger.info("=" * 80)
    logger.info(f"Analysis ID: {analysis_id}")
    logger.info(f"Topic: {topic}")
    logger.info("=" * 80)
    
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
            
            # Close browser
            grokipedia_scraper.close()
            
        except Exception as e:
            error_msg = f"Step 1 (Fetch) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["fetch"] = {"status": "error", "error": str(e)}
            raise
        
        # ====================================================================
        # STEP 2: KNOWLEDGE GRAPH TRIPLE ANALYSIS (triple.py)
        # ====================================================================
        logger.info("\n" + "=" * 80)
        logger.info("STEP 2/2: KNOWLEDGE GRAPH TRIPLE EXTRACTION & COMPARISON")
        logger.info("=" * 80)
        
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
            
        except Exception as e:
            error_msg = f"Step 2 (Triple) failed: {str(e)}"
            logger.error(f"[ERROR] {error_msg}")
            logger.error(traceback.format_exc())
            errors.append(error_msg)
            results["triple"] = {"status": "error", "error": str(e)}
        
        # ====================================================================
        # FINAL SUMMARY
        # ====================================================================
        execution_time = time.time() - start_time
        
        logger.info("\n" + "=" * 80)
        logger.info("[SUCCESS] LITE ANALYSIS COMPLETE")
        logger.info("=" * 80)
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
        
        analysis_results[analysis_id] = {
            "topic": topic,
            "steps_completed": steps_completed,
            "results": results,
            "errors": errors + [error_msg],
            "timestamp": datetime.now().isoformat(),
            "execution_time_seconds": execution_time
        }
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "analysis_id": analysis_id,
                "error": error_msg,
                "steps_completed": steps_completed,
                "execution_time_seconds": execution_time
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

