"""
Multimodal Analysis System
Fetches Wikipedia images and compares them with Grokipedia text using GPT-4o embeddings
"""

import re
import json
import sys
import os
import base64
import requests
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from collections import defaultdict
import time
from urllib.parse import urlparse, unquote
from io import BytesIO
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("[WARNING] PIL/Pillow not available. Image processing will be limited.")

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

# Check if OpenAI API key is available
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_AVAILABLE = False
OPENAI_CLIENT = None
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        OPENAI_CLIENT = OpenAI(api_key=OPENAI_API_KEY)
        OPENAI_AVAILABLE = True
        print(f"[OK] OpenAI API key loaded (length: {len(OPENAI_API_KEY)} characters)")
    except ImportError:
        print("[WARNING] OpenAI package not installed. Install with: pip install openai")
    except Exception as e:
        print(f"[WARNING] Error initializing OpenAI client: {e}")
else:
    print("[WARNING] OpenAI API key not found. Set OPENAI_API_KEY in .env file or environment variables.")

# Check if Google API key is available for Gemini
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GEMINI_AVAILABLE = False
genai = None
if GOOGLE_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        GEMINI_AVAILABLE = True
        print(f"[OK] Google API key loaded for Gemini (length: {len(GOOGLE_API_KEY)} characters)")
    except ImportError:
        print("[WARNING] google-generativeai package not installed. Install with: pip install google-generativeai")
        genai = None
    except Exception as e:
        print(f"[WARNING] Error initializing Gemini client: {e}")
        genai = None
else:
    print("[WARNING] Google API key not found. Set GOOGLE_API_KEY in .env file for video/audio processing.")
    genai = None

# Try to import optional dependencies
try:
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    print("[WARNING] numpy/scikit-learn not available. Install with: pip install numpy scikit-learn")


class WikipediaMediaFinder:
    """Find and download videos/audio from Wikipedia"""
    
    def __init__(self):
        self.base_url = "https://en.wikipedia.org/w/api.php"
        self.commons_api = "https://commons.wikimedia.org/w/api.php"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'WikipediaMediaBot/1.0 (Educational Project)'
        })
    
    def get_page_media(self, page_title: str) -> dict:
        """Get all media files (videos and audio) from a Wikipedia page"""
        params = {
            "action": "query",
            "titles": page_title,
            "prop": "images",
            "format": "json",
            "imlimit": "max"
        }
        response = self.session.get(self.base_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        page_id = list(pages.keys())[0]
        images = pages[page_id].get("images", [])
        
        # Separate video and audio extensions
        video_extensions = ['.webm', '.ogv', '.mp4', '.mov', '.avi', '.mkv']
        audio_extensions = ['.ogg', '.mp3', '.wav', '.m4a', '.flac']
        
        videos = []
        audio_files = []
        
        for img in images:
            img_title = img.get("title", "")
            img_lower = img_title.lower()
            
            if any(img_lower.endswith(ext) for ext in video_extensions):
                videos.append(img_title)
            elif any(img_lower.endswith(ext) for ext in audio_extensions):
                audio_files.append(img_title)
        
        return {"videos": videos, "audio": audio_files}
    
    def get_media_url(self, media_title: str) -> dict:
        """Get URL and metadata for a media file"""
        params = {
            "action": "query",
            "titles": media_title,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|mediatype",
            "format": "json"
        }
        response = self.session.get(self.commons_api, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        page_id = list(pages.keys())[0]
        imageinfo = pages[page_id].get("imageinfo", [])
        if not imageinfo:
            return None
        info = imageinfo[0]
        return {
            "title": media_title,
            "url": info.get("url"),
            "size": info.get("size", 0),
            "mime": info.get("mime"),
            "mediatype": info.get("mediatype")
        }
    
    def download_media(self, media_info: dict, output_dir: str = "downloads", max_size_mb: int = 50) -> str:
        """Download a media file"""
        os.makedirs(output_dir, exist_ok=True)
        filename = media_info["title"].replace("File:", "").replace(" ", "_")
        filepath = os.path.join(output_dir, filename)
        
        # Check file size
        file_size_mb = media_info.get("size", 0) / (1024 * 1024)
        if file_size_mb > max_size_mb:
            raise ValueError(f"Media file too large: {file_size_mb:.2f}MB (max: {max_size_mb}MB)")
        
        if os.path.exists(filepath):
            return filepath
        
        url = media_info["url"]
        response = self.session.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        return filepath


class GeminiMediaSummarizer:
    """Generate summaries for videos/audio using Gemini"""
    
    def __init__(self, model_name=None):
        if not GEMINI_AVAILABLE:
            raise ValueError("Gemini API not available. Set GOOGLE_API_KEY in .env file")
        
        # Remove "models/" prefix if present
        if model_name and model_name.startswith("models/"):
            model_name = model_name[7:]
        
        # Try different model names if not specified
        if model_name is None:
            possible_models = [
                "gemini-2.5-flash",
                "gemini-2.5-flash-latest",
                "gemini-2.0-flash-exp",
                "gemini-2.0-flash",
                "gemini-1.5-pro-latest",
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro",
                "gemini-1.5-flash",
                "gemini-pro"
            ]
            
            model_name = None
            for model in possible_models:
                try:
                    test_model = genai.GenerativeModel(model)
                    model_name = model
                    print(f"[OK] Found working Gemini model: {model}")
                    break
                except Exception:
                    continue
        
        # If still no model, list available models
        if not model_name:
            try:
                models = genai.list_models()
                for m in models:
                    if 'generateContent' in m.supported_generation_methods:
                        name = m.name
                        if name.startswith("models/"):
                            name = name[7:]
                        model_name = name
                        break
            except Exception as e:
                print(f"[WARNING] Could not list models: {e}")
            
            if not model_name:
                model_name = "gemini-1.5-pro"
        
        try:
            self.model = genai.GenerativeModel(model_name)
            print(f"[OK] Initialized Gemini model: {model_name}")
        except Exception as e:
            raise ValueError(f"Could not initialize Gemini model: {e}")
    
    def upload_media(self, media_path: str) -> Any:
        """Upload video/audio file to Gemini"""
        print(f"  [INFO] Uploading to Gemini: {os.path.basename(media_path)}")
        media_file = genai.upload_file(path=media_path)
        while media_file.state.name == "PROCESSING":
            time.sleep(2)
            media_file = genai.get_file(media_file.name)
        if media_file.state.name == "FAILED":
            raise ValueError("Media processing failed")
        print(f"  [OK] Media ready for analysis")
        return media_file
    
    def generate_summary(self, media_file: Any, media_type: str = "video") -> str:
        """Generate summary for video/audio"""
        prompt = f"Summarize this {media_type} in detail, including key visual/audio elements, actions, information presented, and any text or narration."
        try:
            response = self.model.generate_content(
                [prompt, media_file],
                request_options={"timeout": 600}
            )
            return response.text
        except Exception as e:
            # Try without request_options
            try:
                response = self.model.generate_content([prompt, media_file])
                return response.text
            except Exception as e2:
                raise ValueError(f"Could not generate summary: {e2}")
    
    def delete_file(self, media_file: Any):
        """Delete uploaded file from Gemini"""
        genai.delete_file(media_file.name)


class MultimodalAnalyzer:
    """Multimodal analysis system for image, video, audio, and text alignment"""
    
    def __init__(self):
        self.openai_client = OPENAI_CLIENT if OPENAI_AVAILABLE else None
        self.image_cache = {}  # Cache for downloaded images
        self.media_finder = WikipediaMediaFinder() if GEMINI_AVAILABLE else None
        self.media_summarizer = GeminiMediaSummarizer() if GEMINI_AVAILABLE else None
        
        # Create a session with persistent headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MultimodalAnalyzer/1.0 (Educational Project; contact@example.com)',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://en.wikipedia.org/'
        })
        
    def _read_file(self, filepath: str) -> str:
        """Read and extract content from file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract the full content section
        match = re.search(r'📄 Full Content:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        match = re.search(r'📄 ARTICLE CONTENT:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        return content
    
    def fetch_wikipedia_images(self, article_title: str, max_images: int = 10) -> List[Dict]:
        """Fetch images from Wikipedia article"""
        print(f"Fetching images from Wikipedia article: {article_title}")
        
        images = []
        
        try:
            # Use Wikipedia API to get article info
            api_url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "titles": article_title,
                "prop": "images",
                "imlimit": max_images * 2  # Get more to filter
            }
            
            response = self.session.get(api_url, params=params, timeout=10)
            response.raise_for_status()
            
            # Check if response is valid JSON
            if not response.text or not response.text.strip():
                print(f"[ERROR] Empty response from Wikipedia API")
                return images
            
            try:
                data = response.json()
            except json.JSONDecodeError as e:
                print(f"[ERROR] Invalid JSON response from Wikipedia API: {e}")
                print(f"[DEBUG] Response text (first 200 chars): {response.text[:200]}")
                return images
            
            if "error" in data:
                print(f"[ERROR] Wikipedia API error: {data['error']}")
                return images
            
            pages = data.get("query", {}).get("pages", {})
            if not pages:
                print(f"[WARNING] Article '{article_title}' not found on Wikipedia")
                return images
            
            page_id = list(pages.keys())[0]
            page_data = pages[page_id]
            
            # Check if page exists
            if page_id == "-1" or "missing" in page_data:
                print(f"[WARNING] Article '{article_title}' does not exist on Wikipedia")
                return images
            
            # Check if page has images property
            if "images" not in page_data:
                print(f"[WARNING] Article '{article_title}' has no images property")
                return images
            
            image_list = page_data.get("images", [])
            
            if not image_list:
                print(f"[WARNING] Article '{article_title}' has no images")
                return images
            
            print(f"Found {len(image_list)} image references in Wikipedia")
            
            # Get image URLs and download them
            for i, img_info in enumerate(image_list[:max_images]):
                img_title = img_info.get("title", "")
                if not img_title.startswith("File:"):
                    continue
                
                # Get image URL (prefer thumbnail for smaller downloads)
                img_params = {
                    "action": "query",
                    "format": "json",
                    "titles": img_title,
                    "prop": "imageinfo",
                    "iiprop": "url|size|mime|thumburl|thumbmime",
                    "iiurlwidth": 800  # Request thumbnail width
                }
                
                img_response = self.session.get(api_url, params=img_params, timeout=10)
                img_response.raise_for_status()
                
                # Check if response is valid JSON
                if not img_response.text or not img_response.text.strip():
                    print(f"  [WARNING] Empty response for image: {img_title}")
                    continue
                
                try:
                    img_data = img_response.json()
                except json.JSONDecodeError as e:
                    print(f"  [WARNING] Invalid JSON for image {img_title}: {e}")
                    continue
                
                img_pages = img_data.get("query", {}).get("pages", {})
                if not img_pages:
                    continue
                
                img_page_id = list(img_pages.keys())[0]
                imageinfo = img_pages[img_page_id].get("imageinfo", [])
                
                if imageinfo:
                    # Prefer thumbnail URL if available (smaller, less likely to be blocked)
                    thumb_url = imageinfo[0].get("thumburl", "")
                    full_url = imageinfo[0].get("url", "")
                    img_size = imageinfo[0].get("size", 0)
                    img_mime = imageinfo[0].get("thumbmime") or imageinfo[0].get("mime", "")
                    
                    # Skip very large images (only check if using full URL)
                    if not thumb_url and img_size > 5 * 1024 * 1024:  # 5MB limit
                        print(f"  [SKIP] Image too large: {img_title} ({img_size / 1024 / 1024:.1f}MB)")
                        continue
                    
                    # Try thumbnail first, fallback to full URL
                    img_url = thumb_url if thumb_url else full_url
                    
                    # Download image
                    try:
                        print(f"  Downloading image {i+1}/{min(len(image_list), max_images)}: {img_title}")
                        # Use session for image downloads (maintains cookies and headers)
                        img_response = self.session.get(img_url, timeout=15, stream=True)
                        
                        # If 403 and we used thumbnail, try full URL as fallback
                        if img_response.status_code == 403 and thumb_url and img_url == thumb_url:
                            print(f"    [RETRY] Thumbnail blocked (403), trying full-size image...")
                            img_response = self.session.get(full_url, timeout=15, stream=True)
                        
                        img_response.raise_for_status()
                        
                        img_bytes = img_response.content
                        
                        images.append({
                            "title": img_title.replace("File:", ""),
                            "url": img_url,
                            "bytes": img_bytes,
                            "size": img_size,
                            "mime": img_mime,
                            "index": len(images)
                        })
                        
                        time.sleep(0.5)  # Rate limiting
                        
                    except Exception as e:
                        print(f"  [WARNING] Failed to download {img_title}: {e}")
                        continue
            
            print(f"[OK] Successfully fetched {len(images)} images from Wikipedia")
            
        except Exception as e:
            print(f"[ERROR] Error fetching Wikipedia images: {e}")
        
        return images
    
    def get_image_embedding(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[List[float]]:
        """Get embedding for an image using GPT-4o vision embedding model"""
        if not self.openai_client:
            return None
        
        try:
            # Convert image to base64
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Determine image format for data URL
            if "png" in mime_type.lower():
                data_url_prefix = "data:image/png;base64,"
            elif "jpeg" in mime_type.lower() or "jpg" in mime_type.lower():
                data_url_prefix = "data:image/jpeg;base64,"
            elif "gif" in mime_type.lower():
                data_url_prefix = "data:image/gif;base64,"
            elif "webp" in mime_type.lower():
                data_url_prefix = "data:image/webp;base64,"
            else:
                # Default to JPEG
                data_url_prefix = "data:image/jpeg;base64,"
            
            # Use GPT-4o vision to describe image, then embed the description
            return self._get_image_embedding_via_description(image_bytes, image_base64, data_url_prefix)
                
        except Exception as e:
            print(f"[WARNING] Error getting image embedding: {e}")
            return None
    
    def _get_image_embedding_via_description(self, image_bytes: bytes, image_base64: str, data_url_prefix: str = "data:image/jpeg;base64,") -> Optional[List[float]]:
        """Get image embedding by first describing it with GPT-4o vision, then embedding the description"""
        if not self.openai_client:
            return None
        
        try:
            # Step 1: Get image description using GPT-4o vision
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Describe this image in detail, including all visible objects, text, colors, layout, and context. Be comprehensive and specific."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"{data_url_prefix}{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )
            
            description = response.choices[0].message.content
            
            if not description:
                print(f"[WARNING] Empty description from GPT-4o vision")
                return None
            
            # Step 2: Get embedding for the description
            embedding_response = self.openai_client.embeddings.create(
                model="text-embedding-3-large",
                input=description
            )
            
            return embedding_response.data[0].embedding
            
        except Exception as e:
            print(f"[WARNING] Error getting image embedding via description: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_text_embedding(self, text: str, chunk_size: int = 1000) -> List[List[float]]:
        """Get embeddings for text chunks"""
        if not self.openai_client:
            return []
        
        # Split text into chunks
        chunks = []
        words = text.split()
        current_chunk = []
        current_length = 0
        
        for word in words:
            word_length = len(word) + 1  # +1 for space
            if current_length + word_length > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_length = word_length
            else:
                current_chunk.append(word)
                current_length += word_length
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        embeddings = []
        for i, chunk in enumerate(chunks):
            try:
                response = self.openai_client.embeddings.create(
                    model="text-embedding-3-large",
                    input=chunk
                )
                embeddings.append(response.data[0].embedding)
                time.sleep(0.1)  # Rate limiting
            except Exception as e:
                print(f"[WARNING] Error embedding chunk {i+1}: {e}")
                continue
        
        return embeddings
    
    def get_media_summary_embedding(self, summary: str) -> Optional[List[float]]:
        """Get embedding for a video/audio summary"""
        if not self.openai_client:
            return None
        
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-large",
                input=summary
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"[WARNING] Error embedding media summary: {e}")
            return None
    
    def compute_similarities(self, image_embeddings: List[Optional[List[float]]], 
                           media_embeddings: List[Optional[List[float]]],
                           text_embeddings: List[List[float]]) -> Dict:
        """Compute cosine similarities between all multimedia and text embeddings"""
        if not NUMPY_AVAILABLE:
            print("[WARNING] NumPy not available for similarity computation")
            return {}
        
        # Combine all multimedia embeddings
        all_media_embeddings = [emb for emb in image_embeddings + media_embeddings if emb is not None]
        
        if not all_media_embeddings or not text_embeddings:
            print(f"[WARNING] Missing embeddings: {len(all_media_embeddings)} valid media embeddings, {len(text_embeddings)} text embeddings")
            return {}
        
        # Flatten: use average of text embeddings for comparison
        if len(text_embeddings) > 1:
            avg_text_embedding = np.mean(text_embeddings, axis=0)
        else:
            avg_text_embedding = text_embeddings[0] if text_embeddings else None
        
        if avg_text_embedding is None:
            return {}
        
        # Image similarities
        image_similarities = []
        for img_emb in image_embeddings:
            if img_emb is None:
                image_similarities.append(0.0)
                continue
            try:
                similarity = cosine_similarity([img_emb], [avg_text_embedding])[0][0]
                image_similarities.append(float(similarity))
            except Exception as e:
                image_similarities.append(0.0)
        
        # Media (video/audio) similarities
        media_similarities = []
        for media_emb in media_embeddings:
            if media_emb is None:
                media_similarities.append(0.0)
                continue
            try:
                similarity = cosine_similarity([media_emb], [avg_text_embedding])[0][0]
                media_similarities.append(float(similarity))
            except Exception as e:
                media_similarities.append(0.0)
        
        # Combined similarities
        all_similarities = image_similarities + media_similarities
        
        # Per-chunk similarities
        chunk_similarities = []
        for text_emb in text_embeddings:
            chunk_sims = []
            # Image similarities
            for img_emb in image_embeddings:
                if img_emb is None:
                    chunk_sims.append(0.0)
                else:
                    try:
                        sim = cosine_similarity([img_emb], [text_emb])[0][0]
                        chunk_sims.append(float(sim))
                    except:
                        chunk_sims.append(0.0)
            # Media similarities
            for media_emb in media_embeddings:
                if media_emb is None:
                    chunk_sims.append(0.0)
                else:
                    try:
                        sim = cosine_similarity([media_emb], [text_emb])[0][0]
                        chunk_sims.append(float(sim))
                    except:
                        chunk_sims.append(0.0)
            chunk_similarities.append(chunk_sims)
        
        return {
            "image_text_similarities": image_similarities,
            "media_text_similarities": media_similarities,
            "all_media_similarities": all_similarities,
            "chunk_similarities": chunk_similarities,
            "average_similarity": float(np.mean(all_similarities)) if all_similarities else 0.0,
            "max_similarity": float(np.max(all_similarities)) if all_similarities else 0.0,
            "min_similarity": float(np.min(all_similarities)) if all_similarities else 0.0,
            "average_image_similarity": float(np.mean(image_similarities)) if image_similarities else 0.0,
            "average_media_similarity": float(np.mean(media_similarities)) if media_similarities else 0.0
        }
    
    def analyze_multimodal_alignment(self, grokipedia_file: str, wikipedia_article_title: str) -> Dict:
        """Perform comprehensive multimodal analysis"""
        print("=" * 80)
        print("Multimodal Analysis System")
        print("=" * 80)
        print()
        
        # Read Grokipedia content
        print("Step 1/7: Reading Grokipedia content...")
        grok_content = self._read_file(grokipedia_file)
        print(f"[OK] Grokipedia content loaded ({len(grok_content)} characters)")
        print()
        
        # Fetch Wikipedia images
        print("Step 2/7: Fetching Wikipedia images...")
        wikipedia_images = self.fetch_wikipedia_images(wikipedia_article_title, max_images=10)
        print(f"[OK] Found {len(wikipedia_images)} images")
        print()
        
        # Fetch Wikipedia videos and audio
        print("Step 3/7: Fetching Wikipedia videos and audio...")
        wikipedia_videos = []
        wikipedia_audio = []
        
        if self.media_finder:
            try:
                media_files = self.media_finder.get_page_media(wikipedia_article_title)
                video_titles = media_files.get("videos", [])[:5]  # Max 5 videos
                audio_titles = media_files.get("audio", [])[:3]   # Max 3 audio files
                
                print(f"  Found {len(video_titles)} video files, {len(audio_titles)} audio files")
                
                # Download videos
                for video_title in video_titles:
                    try:
                        video_info = self.media_finder.get_media_url(video_title)
                        if video_info and video_info.get("url"):
                            # Check if it's actually video (not audio)
                            mime_type = video_info.get("mime", "").lower()
                            if "audio" not in mime_type:
                                video_path = self.media_finder.download_media(video_info, max_size_mb=50)
                                wikipedia_videos.append({
                                    "title": video_title.replace("File:", ""),
                                    "path": video_path,
                                    "type": "video",
                                    "mime": video_info.get("mime", ""),
                                    "size": video_info.get("size", 0)
                                })
                                print(f"  [OK] Downloaded video: {os.path.basename(video_path)}")
                    except Exception as e:
                        print(f"  [WARNING] Failed to download video {video_title}: {e}")
                        continue
                
                # Download audio files
                for audio_title in audio_titles:
                    try:
                        audio_info = self.media_finder.get_media_url(audio_title)
                        if audio_info and audio_info.get("url"):
                            audio_path = self.media_finder.download_media(audio_info, max_size_mb=30)
                            wikipedia_audio.append({
                                "title": audio_title.replace("File:", ""),
                                "path": audio_path,
                                "type": "audio",
                                "mime": audio_info.get("mime", ""),
                                "size": audio_info.get("size", 0)
                            })
                            print(f"  [OK] Downloaded audio: {os.path.basename(audio_path)}")
                    except Exception as e:
                        print(f"  [WARNING] Failed to download audio {audio_title}: {e}")
                        continue
            except Exception as e:
                print(f"[WARNING] Error fetching media files: {e}")
        else:
            print("[WARNING] Media finder not available (Gemini API key missing)")
        
        print(f"[OK] Found {len(wikipedia_videos)} videos and {len(wikipedia_audio)} audio files")
        print()
        
        if not wikipedia_images and not wikipedia_videos and not wikipedia_audio:
            print("[WARNING] No multimedia content found. Analysis will be limited.")
            return {
                "error": "No multimedia content found in Wikipedia article",
                "summary": {"images_found": 0, "videos_found": 0, "audio_found": 0}
            }
        
        print()
        
        # Get image embeddings
        print("Step 4/7: Getting image embeddings...")
        image_embeddings = []
        image_descriptions = []
        
        for i, img_data in enumerate(wikipedia_images):
            print(f"  Processing image {i+1}/{len(wikipedia_images)}: {img_data['title']}")
            embedding = self.get_image_embedding(img_data['bytes'], img_data.get('mime', 'image/jpeg'))
            image_embeddings.append(embedding)
            
            if embedding:
                print(f"    [OK] Generated embedding (length: {len(embedding)})")
            else:
                print(f"    [WARNING] Failed to generate embedding")
            
            if embedding:
                # Get description for reference
                try:
                    image_base64 = base64.b64encode(img_data['bytes']).decode('utf-8')
                    response = self.openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Briefly describe this image in one sentence."},
                                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                                ]
                            }
                        ],
                        max_tokens=100
                    )
                    image_descriptions.append(response.choices[0].message.content)
                except:
                    image_descriptions.append(f"Image {i+1}: {img_data['title']}")
            
            time.sleep(1)  # Rate limiting
        
        print(f"[OK] Processed {len([e for e in image_embeddings if e])} image embeddings")
        print()
        
        # Process videos and audio with Gemini
        print("Step 5/7: Processing videos and audio with Gemini...")
        media_summaries = []
        media_embeddings = []
        media_metadata = []
        
        all_media = wikipedia_videos + wikipedia_audio
        
        if all_media and self.media_summarizer:
            for i, media_item in enumerate(all_media):
                print(f"  Processing {media_item['type']} {i+1}/{len(all_media)}: {media_item['title']}")
                try:
                    # Upload to Gemini
                    media_file = self.media_summarizer.upload_media(media_item['path'])
                    
                    # Generate summary
                    summary = self.media_summarizer.generate_summary(media_file, media_item['type'])
                    media_summaries.append(summary)
                    
                    print(f"    [OK] Generated summary ({len(summary)} characters)")
                    
                    # Get embedding for summary
                    embedding = self.get_media_summary_embedding(summary)
                    media_embeddings.append(embedding)
                    
                    if embedding:
                        print(f"    [OK] Generated embedding (length: {len(embedding)})")
                    else:
                        print(f"    [WARNING] Failed to generate embedding")
                    
                    media_metadata.append({
                        "title": media_item['title'],
                        "type": media_item['type'],
                        "summary": summary,
                        "path": media_item['path']
                    })
                    
                    # Clean up uploaded file
                    self.media_summarizer.delete_file(media_file)
                    
                    time.sleep(2)  # Rate limiting
                    
                except Exception as e:
                    print(f"    [ERROR] Failed to process {media_item['title']}: {e}")
                    media_summaries.append("")
                    media_embeddings.append(None)
                    media_metadata.append({
                        "title": media_item['title'],
                        "type": media_item['type'],
                        "summary": "",
                        "path": media_item['path'],
                        "error": str(e)
                    })
        else:
            if not all_media:
                print("  [INFO] No videos or audio files to process")
            else:
                print("  [WARNING] Gemini summarizer not available (API key missing)")
        
        print(f"[OK] Processed {len([e for e in media_embeddings if e])} media embeddings")
        print()
        
        # Get text embeddings
        print("Step 6/7: Getting Grokipedia text embeddings...")
        text_embeddings = self.get_text_embedding(grok_content)
        print(f"[OK] Generated {len(text_embeddings)} text embeddings")
        print()
        
        # Compute similarities
        print("Step 7/7: Computing similarities...")
        similarity_results = self.compute_similarities(image_embeddings, media_embeddings, text_embeddings)
        print("[OK] Similarity computation complete")
        print()
        
        # Generate metrics
        print("Generating metrics...")
        
        # Textual Similarity Metrics
        avg_similarity = similarity_results.get("average_similarity", 0.0)
        max_sim = similarity_results.get("max_similarity", 0.0)
        min_sim = similarity_results.get("min_similarity", 0.0)
        avg_image_sim = similarity_results.get("average_image_similarity", 0.0)
        avg_media_sim = similarity_results.get("average_media_similarity", 0.0)
        
        # Find highest and lowest matching segments
        image_text_sims = similarity_results.get("image_text_similarities", [])
        media_text_sims = similarity_results.get("media_text_similarities", [])
        all_sims = similarity_results.get("all_media_similarities", [])
        chunk_sims = similarity_results.get("chunk_similarities", [])
        
        highest_matches = []
        lowest_matches = []
        
        # Image matches
        for i, sim in enumerate(image_text_sims):
            if sim >= max_sim * 0.9:  # Top 10%
                highest_matches.append({
                    "type": "image",
                    "index": i,
                    "title": wikipedia_images[i]["title"],
                    "similarity": sim,
                    "description": image_descriptions[i] if i < len(image_descriptions) else ""
                })
        
        # Media matches
        for i, sim in enumerate(media_text_sims):
            if sim >= max_sim * 0.9:
                highest_matches.append({
                    "type": media_metadata[i]["type"] if i < len(media_metadata) else "media",
                    "index": i,
                    "title": media_metadata[i]["title"] if i < len(media_metadata) else f"Media {i+1}",
                    "similarity": sim,
                    "description": media_metadata[i].get("summary", "")[:200] if i < len(media_metadata) else ""
                })
        
        # Lowest matches
        for i, sim in enumerate(image_text_sims):
            if sim <= min_sim + (max_sim - min_sim) * 0.1:  # Bottom 10%
                lowest_matches.append({
                    "type": "image",
                    "index": i,
                    "title": wikipedia_images[i]["title"],
                    "similarity": sim,
                    "description": image_descriptions[i] if i < len(image_descriptions) else ""
                })
        
        for i, sim in enumerate(media_text_sims):
            if sim <= min_sim + (max_sim - min_sim) * 0.1:
                lowest_matches.append({
                    "type": media_metadata[i]["type"] if i < len(media_metadata) else "media",
                    "index": i,
                    "title": media_metadata[i]["title"] if i < len(media_metadata) else f"Media {i+1}",
                    "similarity": sim,
                    "description": media_metadata[i].get("summary", "")[:200] if i < len(media_metadata) else ""
                })
        
        # Image-to-Text Alignment Metrics
        image_relevance_score = avg_image_sim * 100 if avg_image_sim > 0 else 0.0
        
        # Media-to-Text Alignment Metrics
        media_relevance_score = avg_media_sim * 100 if avg_media_sim > 0 else 0.0
        
        # Overall multimedia relevance score
        overall_relevance_score = avg_similarity * 100
        
        # Match scores
        threshold = 0.5  # Similarity threshold for "good match"
        well_matched_images = sum(1 for sim in image_text_sims if sim >= threshold)
        well_matched_media = sum(1 for sim in media_text_sims if sim >= threshold)
        well_matched_total = well_matched_images + well_matched_media
        
        image_text_match_score = (well_matched_images / len(image_text_sims) * 100) if image_text_sims else 0.0
        media_text_match_score = (well_matched_media / len(media_text_sims) * 100) if media_text_sims else 0.0
        overall_match_score = (well_matched_total / len(all_sims) * 100) if all_sims else 0.0
        
        # Missing multimedia score
        missing_multimedia_score = (1.0 - avg_similarity) * 100
        
        # Multimodal Consistency Index (MCI)
        text_similarity_component = avg_similarity
        image_alignment_component = image_relevance_score / 100.0 if image_relevance_score > 0 else 0.0
        media_alignment_component = media_relevance_score / 100.0 if media_relevance_score > 0 else 0.0
        multimodal_consistency_component = 1.0 - (max_sim - min_sim) if max_sim > min_sim else 1.0
        
        # Weighted MCI: images (40%), media (30%), consistency (30%)
        mci = (0.4 * image_alignment_component + 
               0.3 * media_alignment_component + 
               0.3 * multimodal_consistency_component) * 100
        
        results = {
            "summary": {
                "wikipedia_article": wikipedia_article_title,
                "images_found": len(wikipedia_images),
                "images_processed": len([e for e in image_embeddings if e]),
                "videos_found": len(wikipedia_videos),
                "audio_found": len(wikipedia_audio),
                "media_processed": len([e for e in media_embeddings if e]),
                "text_chunks": len(text_embeddings)
            },
            "textual_similarity": {
                "average_similarity": avg_similarity,
                "average_image_similarity": avg_image_sim,
                "average_media_similarity": avg_media_sim,
                "max_similarity": max_sim,
                "min_similarity": min_sim,
                "highest_matching_segments": highest_matches[:10],
                "lowest_matching_segments": lowest_matches[:10]
            },
            "image_to_text_alignment": {
                "image_relevance_score": image_relevance_score,
                "image_text_match_score": image_text_match_score,
                "well_matched_images": well_matched_images,
                "total_images": len(image_text_sims)
            },
            "media_to_text_alignment": {
                "media_relevance_score": media_relevance_score,
                "media_text_match_score": media_text_match_score,
                "well_matched_media": well_matched_media,
                "total_media": len(media_text_sims),
                "videos_processed": len(wikipedia_videos),
                "audio_processed": len(wikipedia_audio)
            },
            "overall_multimedia_alignment": {
                "overall_relevance_score": overall_relevance_score,
                "overall_match_score": overall_match_score,
                "missing_multimedia_score": missing_multimedia_score,
                "well_matched_total": well_matched_total,
                "total_multimedia": len(all_sims)
            },
            "multimodal_consistency_index": {
                "mci_score": mci,
                "image_alignment_component": image_alignment_component * 100,
                "media_alignment_component": media_alignment_component * 100,
                "multimodal_consistency_component": multimodal_consistency_component * 100,
                "breakdown": {
                    "image_alignment_weight": 0.4,
                    "media_alignment_weight": 0.3,
                    "consistency_weight": 0.3
                }
            },
            "detailed_results": {
                "images": [
                    {
                        "title": img["title"],
                        "url": img["url"],
                        "similarity": image_text_sims[i] if i < len(image_text_sims) else 0.0,
                        "description": image_descriptions[i] if i < len(image_descriptions) else ""
                    }
                    for i, img in enumerate(wikipedia_images)
                ],
                "media": media_metadata,
                "media_similarities": [
                    {
                        "title": media_metadata[i]["title"] if i < len(media_metadata) else f"Media {i+1}",
                        "type": media_metadata[i]["type"] if i < len(media_metadata) else "unknown",
                        "similarity": media_text_sims[i] if i < len(media_text_sims) else 0.0,
                        "summary": media_metadata[i].get("summary", "")[:500] if i < len(media_metadata) else ""
                    }
                    for i in range(len(media_text_sims))
                ],
                "chunk_similarities": chunk_sims
            }
        }
        
        print("[SUCCESS] Analysis complete!")
        
        return results


def main():
    """Main execution function"""
    import sys
    from io import StringIO
    
    class TeeOutput:
        """Class to capture stdout and write to both console and file"""
        def __init__(self, file_path: str):
            self.file = open(file_path, 'w', encoding='utf-8')
            self.stdout = sys.stdout
            
        def write(self, text: str):
            self.stdout.write(text)
            self.file.write(text)
            self.file.flush()
            
        def flush(self):
            self.stdout.flush()
            self.file.flush()
            
        def close(self):
            self.file.close()
    
    # Set up output capture
    output_file = "multimodal_results.txt"
    tee = TeeOutput(output_file)
    original_stdout = sys.stdout
    sys.stdout = tee
    
    try:
        # Print API key status
        print("\n" + "=" * 80)
        print("API KEY STATUS CHECK")
        print("=" * 80)
        if OPENAI_AVAILABLE:
            print(f"[OK] OpenAI API key is loaded")
            print(f"  Key length: {len(OPENAI_API_KEY)} characters")
            print(f"  First 10 chars: {OPENAI_API_KEY[:10]}...")
            print(f"  Using models: gpt-4o (vision) + text-embedding-3-large")
        else:
            print("[WARNING] OpenAI API key NOT loaded")
            print("  Make sure OPENAI_API_KEY is set in .env file")
        print("=" * 80 + "\n")
        
        # Get article title from Grokipedia file or user input
        # Try to extract from file first
        grokipedia_file = "dual_scraper_output/grokipedia.txt"
        
        # Try to get Wikipedia article title from the file
        wikipedia_title = None
        try:
            with open(grokipedia_file, 'r', encoding='utf-8') as f:
                content = f.read()
                # Look for Wikipedia URL or title
                match = re.search(r'wikipedia\.org/wiki/([^\s\)]+)', content, re.IGNORECASE)
                if match:
                    wikipedia_title = unquote(match.group(1)).replace('_', ' ')
                else:
                    # Try to get from query or title
                    title_match = re.search(r'Title:\s*(.+?)(?:\n|$)', content, re.IGNORECASE)
                    if title_match:
                        wikipedia_title = title_match.group(1).strip()
        except:
            pass
        
        if not wikipedia_title:
            # Default: try common patterns
            wikipedia_title = "Cattle"  # Default fallback
        
        analyzer = MultimodalAnalyzer()
        
        results = analyzer.analyze_multimodal_alignment(
            grokipedia_file,
            wikipedia_title
        )
        
        # Print summary
        print("\n" + "=" * 80)
        print("MULTIMODAL ANALYSIS SUMMARY")
        print("=" * 80)
        
        if "error" in results:
            print(f"\n[ERROR] {results['error']}")
        else:
            print("\nSUMMARY:")
            summary = results["summary"]
            print(f"   Wikipedia Article: {summary['wikipedia_article']}")
            print(f"   Images Found: {summary['images_found']} (Processed: {summary['images_processed']})")
            print(f"   Videos Found: {summary['videos_found']}")
            print(f"   Audio Found: {summary['audio_found']}")
            print(f"   Media Processed: {summary['media_processed']}")
            print(f"   Text Chunks: {summary['text_chunks']}")
            
            print("\nTEXTUAL SIMILARITY:")
            textual = results["textual_similarity"]
            print(f"   Average Similarity (All): {textual['average_similarity']:.3f}")
            print(f"   Average Image Similarity: {textual['average_image_similarity']:.3f}")
            print(f"   Average Media Similarity: {textual['average_media_similarity']:.3f}")
            print(f"   Max Similarity: {textual['max_similarity']:.3f}")
            print(f"   Min Similarity: {textual['min_similarity']:.3f}")
            
            if textual['highest_matching_segments']:
                print("\n   Highest Matching Multimedia:")
                for match in textual['highest_matching_segments'][:5]:
                    print(f"      • [{match['type']}] {match['title']}: {match['similarity']:.3f}")
            
            print("\nIMAGE-TO-TEXT ALIGNMENT:")
            alignment = results["image_to_text_alignment"]
            print(f"   Image Relevance Score: {alignment['image_relevance_score']:.2f}%")
            print(f"   Image Text-Match Score: {alignment['image_text_match_score']:.2f}%")
            print(f"   Well-Matched Images: {alignment['well_matched_images']}/{alignment['total_images']}")
            
            print("\nMEDIA-TO-TEXT ALIGNMENT:")
            media_alignment = results["media_to_text_alignment"]
            print(f"   Media Relevance Score: {media_alignment['media_relevance_score']:.2f}%")
            print(f"   Media Text-Match Score: {media_alignment['media_text_match_score']:.2f}%")
            print(f"   Well-Matched Media: {media_alignment['well_matched_media']}/{media_alignment['total_media']}")
            print(f"   Videos Processed: {media_alignment['videos_processed']}")
            print(f"   Audio Processed: {media_alignment['audio_processed']}")
            
            print("\nOVERALL MULTIMEDIA ALIGNMENT:")
            overall = results["overall_multimedia_alignment"]
            print(f"   Overall Relevance Score: {overall['overall_relevance_score']:.2f}%")
            print(f"   Overall Match Score: {overall['overall_match_score']:.2f}%")
            print(f"   Missing Multimedia Score: {overall['missing_multimedia_score']:.2f}%")
            print(f"   Well-Matched Total: {overall['well_matched_total']}/{overall['total_multimedia']}")
            
            print("\nMULTIMODAL CONSISTENCY INDEX (MCI):")
            mci = results["multimodal_consistency_index"]
            print(f"   MCI Score: {mci['mci_score']:.2f}%")
            print(f"   Image Alignment Component: {mci['image_alignment_component']:.2f}%")
            print(f"   Media Alignment Component: {mci['media_alignment_component']:.2f}%")
            print(f"   Consistency Component: {mci['multimodal_consistency_component']:.2f}%")
        
        # Save JSON results
        with open("multimodal_results.json", 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n[SAVED] Results saved to multimodal_results.json")
        
        print("\n" + "=" * 80)
        print("Analysis complete!")
        print("=" * 80)
        
    finally:
        sys.stdout = original_stdout
        tee.close()
        print(f"[SAVED] All output saved to {output_file}")


if __name__ == "__main__":
    main()

