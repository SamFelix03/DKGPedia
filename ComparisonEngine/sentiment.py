"""
Sentiment Analysis & Bias Detection System
Analyzes sentiment polarity shifts, framing bias, and political leaning
"""

import re
import json
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from collections import defaultdict, Counter
import time

def _install_package(package_name: str, import_name: str = None) -> bool:
    """Install a package if not available"""
    if import_name is None:
        import_name = package_name
    
    # Check if already available
    try:
        __import__(import_name)
        return True
    except ImportError:
        pass  # Not available, will try to install
    
    # Try to install
    try:
        print(f"Installing {package_name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name, "--quiet"], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Verify installation
        __import__(import_name)
        print(f"Successfully installed {package_name}")
        return True
    except Exception as e:
        print(f"Failed to install {package_name}: {e}")
        return False

# Try to import optional dependencies and install if missing
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
except ImportError:
    if _install_package("vaderSentiment"):
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        VADER_AVAILABLE = True
    else:
        VADER_AVAILABLE = False
        print("[WARNING] vaderSentiment not available. Some features will be limited.")

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    if _install_package("textblob"):
        from textblob import TextBlob
        TEXTBLOB_AVAILABLE = True
        # Download NLTK data for TextBlob
        try:
            import nltk
            nltk.download('punkt', quiet=True)
            nltk.download('brown', quiet=True)
            nltk.download('movie_reviews', quiet=True)
        except Exception:
            pass  # NLTK data download is optional
    else:
        TEXTBLOB_AVAILABLE = False
        print("[WARNING] textblob not available. Some features will be limited.")

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
    # Try to import torch, but don't fail if it's not available
    try:
        import torch
    except ImportError:
        pass  # torch is optional
except ImportError:
    # Try installing transformers (torch is optional)
    if _install_package("transformers"):
        try:
            from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
            TRANSFORMERS_AVAILABLE = True
            # Try to import torch, but don't fail if it's not available
            try:
                import torch
            except ImportError:
                print("[WARNING] torch not available. Transformer models will use CPU.")
        except ImportError:
            TRANSFORMERS_AVAILABLE = False
    else:
        TRANSFORMERS_AVAILABLE = False
        print("[WARNING] transformers not available. Advanced sentiment analysis will be limited.")

try:
    import matplotlib.pyplot as plt
    import numpy as np
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    if _install_package("matplotlib") and _install_package("numpy"):
        import matplotlib.pyplot as plt
        import numpy as np
        MATPLOTLIB_AVAILABLE = True
    else:
        MATPLOTLIB_AVAILABLE = False
        print("[WARNING] matplotlib/numpy not available. Visualizations will be skipped.")

# Load environment variables
import os
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass


class SentimentBiasAnalyzer:
    """Sentiment analysis and bias detection system"""
    
    def __init__(self):
        # Initialize sentiment analyzers
        self.vader = SentimentIntensityAnalyzer() if VADER_AVAILABLE else None
        self.transformer_sentiment = None
        self.political_bias_model = None
        
        # Try to load transformer-based sentiment model
        if TRANSFORMERS_AVAILABLE:
            try:
                print("   Loading transformer sentiment model (this may take a moment)...")
                # Check if torch is available for GPU
                try:
                    import torch
                    device = 0 if torch.cuda.is_available() else -1
                except ImportError:
                    device = -1  # CPU only
                
                self.transformer_sentiment = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    device=device
                )
                print("   [OK] Transformer sentiment model loaded")
            except Exception as e:
                print(f"   [WARNING] Could not load transformer sentiment model: {e}")
                print(f"   -> Model will be downloaded automatically on first use")
        
        # Loaded language patterns
        self.loaded_language_patterns = [
            r'\b(alleged|claimed|supposedly|reportedly|purportedly|apparently)\b',
            r'\b(controversial|scandal|outrage|shocking|devastating)\b',
            r'\b(hero|villain|victim|perpetrator|mastermind)\b',
            r'\b(radical|extreme|fringe|mainstream|establishment)\b',
            r'\b(conspiracy|cover-up|exposed|revealed)\b'
        ]
        
        # Hedging words
        self.hedging_words = [
            'alleged', 'claimed', 'reportedly', 'supposedly', 'purportedly',
            'apparently', 'seemingly', 'ostensibly', 'presumably', 'arguably',
            'possibly', 'perhaps', 'maybe', 'might', 'could', 'may'
        ]
        
        # Political keywords (left-right spectrum)
        self.left_keywords = [
            'progressive', 'liberal', 'socialist', 'democratic', 'equality',
            'redistribution', 'welfare', 'union', 'regulation', 'environmental',
            'climate', 'social justice', 'diversity', 'inclusion'
        ]
        
        self.right_keywords = [
            'conservative', 'republican', 'libertarian', 'free market', 'capitalism',
            'deregulation', 'traditional', 'family values', 'national security',
            'military', 'patriotism', 'individual liberty', 'small government'
        ]
        
        # Authoritarian vs Libertarian keywords
        self.authoritarian_keywords = [
            'authority', 'order', 'discipline', 'control', 'regulation',
            'surveillance', 'security', 'enforcement', 'compliance', 'obedience'
        ]
        
        self.libertarian_keywords = [
            'freedom', 'liberty', 'autonomy', 'choice', 'voluntary',
            'consent', 'rights', 'privacy', 'individual', 'self-determination'
        ]
    
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
    
    def _split_into_sections(self, text: str) -> List[Dict]:
        """Split text into sections (same logic as semanticdrift.py)"""
        sections = []
        lines = text.split('\n')
        
        current_section = {
            "title": "Introduction",
            "content": []
        }
        
        section_patterns = [
            r'^==\s*(.+?)\s*==$',  # == Section ==
            r'^===\s*(.+?)\s*===$',  # === Subsection ===
            r'^====\s*(.+?)\s*====$',  # ==== Sub-subsection ====
        ]
        
        skip_lines = set()
        
        for i, line in enumerate(lines):
            if i in skip_lines:
                continue
            
            is_section_header = False
            stripped = line.strip()
            
            # Check for Grokipedia-style section markers
            if stripped and stripped.startswith('=') and all(c == '=' for c in stripped) and len(stripped) >= 20:
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if i + 2 < len(lines):
                        next_next_line = lines[i + 2].strip()
                        if (next_next_line and next_next_line.startswith('=') and 
                            all(c == '=' for c in next_next_line) and len(next_next_line) >= 20):
                            if current_section["content"]:
                                sections.append({
                                    "title": current_section["title"],
                                    "content": "\n".join(current_section["content"]).strip()
                                })
                            
                            current_section = {
                                "title": next_line if next_line else "Untitled Section",
                                "content": []
                            }
                            is_section_header = True
                            skip_lines.add(i)
                            skip_lines.add(i + 1)
                            skip_lines.add(i + 2)
                            continue
            
            # Check for Wikipedia-style markers
            for pattern in section_patterns:
                match = re.match(pattern, stripped)
                if match:
                    if current_section["content"]:
                        sections.append({
                            "title": current_section["title"],
                            "content": "\n".join(current_section["content"]).strip()
                        })
                    
                    current_section = {
                        "title": match.group(1).strip(),
                        "content": []
                    }
                    is_section_header = True
                    break
            
            if not is_section_header and stripped:
                current_section["content"].append(line)
        
        # Add last section
        if current_section["content"]:
            sections.append({
                "title": current_section["title"],
                "content": "\n".join(current_section["content"]).strip()
            })
        
        return sections
    
    def _analyze_sentiment_vader(self, text: str) -> Dict:
        """Analyze sentiment using VADER"""
        if not self.vader:
            return {}
        
        scores = self.vader.polarity_scores(text)
        return {
            "compound": scores["compound"],
            "positive": scores["pos"],
            "neutral": scores["neu"],
            "negative": scores["neg"],
            "method": "vader"
        }
    
    def _analyze_sentiment_textblob(self, text: str) -> Dict:
        """Analyze sentiment using TextBlob"""
        if not TEXTBLOB_AVAILABLE:
            return {}
        
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        return {
            "polarity": polarity,
            "subjectivity": subjectivity,
            "method": "textblob"
        }
    
    def _analyze_sentiment_transformer(self, text: str) -> Dict:
        """Analyze sentiment using transformer model"""
        if not self.transformer_sentiment:
            return {}
        
        try:
            # Process in chunks if text is too long
            max_length = 512
            if len(text) > max_length:
                text = text[:max_length]
            
            result = self.transformer_sentiment(text)[0]
            label = result["label"].upper()
            score = result["score"]
            
            # Map labels to polarity
            if "POSITIVE" in label:
                polarity = score
            elif "NEGATIVE" in label:
                polarity = -score
            else:
                polarity = 0.0
            
            return {
                "polarity": polarity,
                "label": label,
                "confidence": score,
                "method": "transformer"
            }
        except Exception as e:
            return {"error": str(e)}
    
    def analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment using all available methods"""
        results = {}
        
        if self.vader:
            results["vader"] = self._analyze_sentiment_vader(text)
        
        if TEXTBLOB_AVAILABLE:
            results["textblob"] = self._analyze_sentiment_textblob(text)
        
        if self.transformer_sentiment:
            results["transformer"] = self._analyze_sentiment_transformer(text)
        
        # Calculate average polarity
        polarities = []
        if "vader" in results:
            polarities.append(results["vader"].get("compound", 0))
        if "textblob" in results:
            polarities.append(results["textblob"].get("polarity", 0))
        if "transformer" in results and "polarity" in results["transformer"]:
            polarities.append(results["transformer"]["polarity"])
        
        if polarities:
            results["average_polarity"] = sum(polarities) / len(polarities)
            if results["average_polarity"] > 0.1:
                results["overall_sentiment"] = "positive"
            elif results["average_polarity"] < -0.1:
                results["overall_sentiment"] = "negative"
            else:
                results["overall_sentiment"] = "neutral"
        else:
            results["average_polarity"] = 0.0
            results["overall_sentiment"] = "neutral"
        
        return results
    
    def detect_loaded_language(self, text: str) -> Dict:
        """Detect loaded language and hedging words"""
        text_lower = text.lower()
        
        loaded_matches = []
        for pattern in self.loaded_language_patterns:
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                loaded_matches.append(match.group())
        
        hedging_matches = []
        for word in self.hedging_words:
            pattern = r'\b' + re.escape(word) + r'\b'
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                hedging_matches.append(match.group())
        
        return {
            "loaded_language_count": len(loaded_matches),
            "loaded_language_examples": list(set(loaded_matches))[:10],
            "hedging_words_count": len(hedging_matches),
            "hedging_words_examples": list(set(hedging_matches))[:10],
            "bias_score": (len(loaded_matches) + len(hedging_matches)) / max(len(text.split()), 1) * 100
        }
    
    def analyze_source_selection(self, text: str) -> Dict:
        """Analyze source selection bias (citations and references)"""
        # Extract citations
        citations = re.findall(r'\[(\d+)\]', text)
        citation_count = len(set(citations))
        
        # Extract reference patterns
        reference_patterns = [
            r'according to ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+reports?',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+states?',
            r'cited by ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        ]
        
        sources_mentioned = []
        for pattern in reference_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                source = match.group(1).strip()
                if len(source) > 2 and source not in sources_mentioned:
                    sources_mentioned.append(source)
        
        return {
            "citation_count": citation_count,
            "sources_mentioned": sources_mentioned[:20],
            "sources_count": len(sources_mentioned)
        }
    
    def analyze_representation_bias(self, text: str) -> Dict:
        """Analyze representation bias (different perspectives)"""
        # Look for perspective indicators
        perspective_patterns = {
            "support": [r'support', r'favor', r'advocate', r'endorse', r'approve'],
            "oppose": [r'oppose', r'against', r'reject', r'criticize', r'condemn'],
            "neutral": [r'according to', r'states', r'reports', r'notes']
        }
        
        perspective_counts = {}
        for perspective, patterns in perspective_patterns.items():
            count = 0
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                count += len(matches)
            perspective_counts[perspective] = count
        
        # Check for balanced representation
        total_perspectives = sum(perspective_counts.values())
        if total_perspectives > 0:
            support_ratio = perspective_counts["support"] / total_perspectives
            oppose_ratio = perspective_counts["oppose"] / total_perspectives
            balance_score = 1.0 - abs(support_ratio - oppose_ratio)  # 1.0 = perfectly balanced
        else:
            balance_score = 0.0
        
        return {
            "perspective_counts": perspective_counts,
            "balance_score": balance_score,
            "is_balanced": balance_score > 0.6
        }
    
    def analyze_emphasis_bias(self, grok_sections: List[Dict], wiki_sections: List[Dict]) -> Dict:
        """Compare section lengths for opposing viewpoints"""
        # Map sections by title similarity
        section_mapping = {}
        
        for grok_section in grok_sections:
            title = grok_section["title"].lower()
            content_length = len(grok_section["content"])
            
            # Find matching Wikipedia section
            best_match = None
            best_similarity = 0.0
            
            for wiki_section in wiki_sections:
                wiki_title = wiki_section["title"].lower()
                # Simple similarity (word overlap)
                grok_words = set(title.split())
                wiki_words = set(wiki_title.split())
                if grok_words and wiki_words:
                    similarity = len(grok_words & wiki_words) / len(grok_words | wiki_words)
                    if similarity > best_similarity and similarity > 0.3:
                        best_similarity = similarity
                        best_match = wiki_section
            
            if best_match:
                section_mapping[grok_section["title"]] = {
                    "grok_length": content_length,
                    "wiki_length": len(best_match["content"]),
                    "grok_title": grok_section["title"],
                    "wiki_title": best_match["title"],
                    "length_ratio": content_length / max(len(best_match["content"]), 1)
                }
        
        # Calculate emphasis differences
        emphasis_differences = []
        for title, data in section_mapping.items():
            if data["length_ratio"] > 1.5:
                emphasis_differences.append({
                    "section": title,
                    "grok_emphasized": True,
                    "ratio": data["length_ratio"]
                })
            elif data["length_ratio"] < 0.67:
                emphasis_differences.append({
                    "section": title,
                    "grok_emphasized": False,
                    "ratio": data["length_ratio"]
                })
        
        return {
            "section_mapping": section_mapping,
            "emphasis_differences": emphasis_differences,
            "total_sections_compared": len(section_mapping)
        }
    
    def detect_political_leaning(self, text: str) -> Dict:
        """Detect political leaning (left-right, authoritarian-libertarian)"""
        text_lower = text.lower()
        
        # Count keywords
        left_count = sum(1 for keyword in self.left_keywords if keyword in text_lower)
        right_count = sum(1 for keyword in self.right_keywords if keyword in text_lower)
        
        # Calculate left-right score (-1.0 to 1.0, negative = left, positive = right)
        total_political = left_count + right_count
        if total_political > 0:
            left_right_score = (right_count - left_count) / total_political
        else:
            left_right_score = 0.0
        
        # Count authoritarian-libertarian keywords
        auth_count = sum(1 for keyword in self.authoritarian_keywords if keyword in text_lower)
        lib_count = sum(1 for keyword in self.libertarian_keywords if keyword in text_lower)
        
        # Calculate auth-lib score (-1.0 to 1.0, negative = libertarian, positive = authoritarian)
        total_auth_lib = auth_count + lib_count
        if total_auth_lib > 0:
            auth_lib_score = (auth_count - lib_count) / total_auth_lib
        else:
            auth_lib_score = 0.0
        
        # Determine quadrant
        if abs(left_right_score) < 0.1 and abs(auth_lib_score) < 0.1:
            quadrant = "centrist"
        elif left_right_score < -0.1 and auth_lib_score < -0.1:
            quadrant = "left-libertarian"
        elif left_right_score < -0.1 and auth_lib_score > 0.1:
            quadrant = "left-authoritarian"
        elif left_right_score > 0.1 and auth_lib_score < -0.1:
            quadrant = "right-libertarian"
        elif left_right_score > 0.1 and auth_lib_score > 0.1:
            quadrant = "right-authoritarian"
        else:
            quadrant = "moderate"
        
        return {
            "left_right_score": left_right_score,
            "auth_lib_score": auth_lib_score,
            "left_keywords_count": left_count,
            "right_keywords_count": right_count,
            "authoritarian_keywords_count": auth_count,
            "libertarian_keywords_count": lib_count,
            "quadrant": quadrant,
            "political_keywords_found": total_political > 0
        }
    
    def create_bias_compass(self, grok_political: Dict, wiki_political: Dict, output_path: str = "sentiment_visualizations/bias_compass.png"):
        """Create bias compass visualization"""
        if not MATPLOTLIB_AVAILABLE:
            print("   [WARNING] matplotlib not available, skipping visualization")
            return
        
        try:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            
            fig, ax = plt.subplots(figsize=(10, 10))
            
            # Plot axes
            ax.axhline(y=0, color='k', linestyle='-', linewidth=0.5)
            ax.axvline(x=0, color='k', linestyle='-', linewidth=0.5)
            
            # Plot points
            grok_x = grok_political.get("left_right_score", 0)
            grok_y = grok_political.get("auth_lib_score", 0)
            wiki_x = wiki_political.get("left_right_score", 0)
            wiki_y = wiki_political.get("auth_lib_score", 0)
            
            ax.scatter([grok_x], [grok_y], s=200, c='red', marker='o', label='Grokipedia', zorder=5)
            ax.scatter([wiki_x], [wiki_y], s=200, c='blue', marker='s', label='Wikipedia', zorder=5)
            
            # Labels
            ax.set_xlabel('Left ← → Right', fontsize=12, fontweight='bold')
            ax.set_ylabel('Libertarian ← → Authoritarian', fontsize=12, fontweight='bold')
            ax.set_title('Political Bias Compass', fontsize=14, fontweight='bold')
            
            # Set limits
            ax.set_xlim(-1.1, 1.1)
            ax.set_ylim(-1.1, 1.1)
            
            # Add quadrant labels
            ax.text(0.5, 0.5, 'Right-Authoritarian', ha='center', va='center', 
                   fontsize=10, alpha=0.3, rotation=0)
            ax.text(-0.5, 0.5, 'Left-Authoritarian', ha='center', va='center', 
                   fontsize=10, alpha=0.3, rotation=0)
            ax.text(0.5, -0.5, 'Right-Libertarian', ha='center', va='center', 
                   fontsize=10, alpha=0.3, rotation=0)
            ax.text(-0.5, -0.5, 'Left-Libertarian', ha='center', va='center', 
                   fontsize=10, alpha=0.3, rotation=0)
            
            ax.legend(loc='upper right')
            ax.grid(True, alpha=0.3)
            
            plt.tight_layout()
            plt.savefig(output_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            print(f"   [OK] Bias compass saved to {output_path}")
        except Exception as e:
            print(f"   [WARNING] Error creating bias compass: {e}")
    
    def analyze_article(self, grokipedia_file: str, wikipedia_file: str) -> Dict:
        """Perform comprehensive sentiment and bias analysis"""
        print("=" * 80)
        print("Sentiment Analysis & Bias Detection System")
        print("=" * 80)
        print()
        
        # Read files
        print("Step 1/5: Reading files...")
        grok_content = self._read_file(grokipedia_file)
        wiki_content = self._read_file(wikipedia_file)
        print(f"   [OK] Grokipedia content loaded ({len(grok_content)} characters)")
        print(f"   [OK] Wikipedia content loaded ({len(wiki_content)} characters)")
        print()
        
        # Split into sections
        print("Step 2/5: Splitting into sections...")
        grok_sections = self._split_into_sections(grok_content)
        wiki_sections = self._split_into_sections(wiki_content)
        print(f"   [OK] Grokipedia: {len(grok_sections)} sections")
        print(f"   [OK] Wikipedia: {len(wiki_sections)} sections")
        print()
        
        # Sentiment analysis
        print("Step 3/5: Analyzing sentiment...")
        grok_sentiments = []
        wiki_sentiments = []
        
        for i, section in enumerate(grok_sections):
            if section["content"]:
                sentiment = self.analyze_sentiment(section["content"])
                sentiment["section_title"] = section["title"]
                grok_sentiments.append(sentiment)
        
        for i, section in enumerate(wiki_sections):
            if section["content"]:
                sentiment = self.analyze_sentiment(section["content"])
                sentiment["section_title"] = section["title"]
                wiki_sentiments.append(sentiment)
        
        print(f"   [OK] Analyzed {len(grok_sentiments)} Grokipedia sections")
        print(f"   [OK] Analyzed {len(wiki_sentiments)} Wikipedia sections")
        print()
        
        # Detect sentiment shifts
        sentiment_shifts = []
        for i in range(min(len(grok_sentiments), len(wiki_sentiments))):
            grok_sent = grok_sentiments[i]
            wiki_sent = wiki_sentiments[i]
            
            grok_polarity = grok_sent.get("average_polarity", 0)
            wiki_polarity = wiki_sent.get("average_polarity", 0)
            
            if abs(grok_polarity - wiki_polarity) > 0.2:
                sentiment_shifts.append({
                    "section": grok_sent.get("section_title", "Unknown"),
                    "grok_polarity": grok_polarity,
                    "wiki_polarity": wiki_polarity,
                    "shift_magnitude": abs(grok_polarity - wiki_polarity),
                    "shift_direction": "positive" if grok_polarity > wiki_polarity else "negative"
                })
        
        print(f"   [OK] Found {len(sentiment_shifts)} significant sentiment shifts")
        print()
        
        # Framing analysis
        print("Step 4/5: Analyzing framing and bias...")
        
        # Word choice bias
        grok_loaded = self.detect_loaded_language(grok_content)
        wiki_loaded = self.detect_loaded_language(wiki_content)
        
        # Source selection bias
        grok_sources = self.analyze_source_selection(grok_content)
        wiki_sources = self.analyze_source_selection(wiki_content)
        
        # Representation bias
        grok_representation = self.analyze_representation_bias(grok_content)
        wiki_representation = self.analyze_representation_bias(wiki_content)
        
        # Emphasis bias
        emphasis_analysis = self.analyze_emphasis_bias(grok_sections, wiki_sections)
        
        print(f"   [OK] Framing analysis complete")
        print()
        
        # Political leaning detection
        print("Step 5/5: Detecting political leaning...")
        grok_political = self.detect_political_leaning(grok_content)
        wiki_political = self.detect_political_leaning(wiki_content)
        
        print(f"   [OK] Grokipedia: {grok_political.get('quadrant', 'unknown')}")
        print(f"   [OK] Wikipedia: {wiki_political.get('quadrant', 'unknown')}")
        print()
        
        # Create bias compass
        if MATPLOTLIB_AVAILABLE:
            print("Creating bias compass visualization...")
            self.create_bias_compass(grok_political, wiki_political)
            print()
        
        # Build results
        results = {
            "summary": {
                "grok_sections": len(grok_sections),
                "wiki_sections": len(wiki_sections),
                "sentiment_shifts_detected": len(sentiment_shifts)
            },
            "sentiment_analysis": {
                "grokipedia": {
                    "sections": grok_sentiments,
                    "average_polarity": sum(s.get("average_polarity", 0) for s in grok_sentiments) / max(len(grok_sentiments), 1)
                },
                "wikipedia": {
                    "sections": wiki_sentiments,
                    "average_polarity": sum(s.get("average_polarity", 0) for s in wiki_sentiments) / max(len(wiki_sentiments), 1)
                },
                "sentiment_shifts": sentiment_shifts
            },
            "framing_analysis": {
                "word_choice_bias": {
                    "grokipedia": grok_loaded,
                    "wikipedia": wiki_loaded
                },
                "source_selection_bias": {
                    "grokipedia": grok_sources,
                    "wikipedia": wiki_sources
                },
                "representation_bias": {
                    "grokipedia": grok_representation,
                    "wikipedia": wiki_representation
                },
                "emphasis_bias": emphasis_analysis
            },
            "political_leaning": {
                "grokipedia": grok_political,
                "wikipedia": wiki_political
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
    output_file = "sentiment_results.txt"
    tee = TeeOutput(output_file)
    original_stdout = sys.stdout
    sys.stdout = tee
    
    try:
        analyzer = SentimentBiasAnalyzer()
        
        results = analyzer.analyze_article(
            "dual_scraper_output/grokipedia.txt",
            "dual_scraper_output/wikipedia.txt"
        )
        
        # Print summary
        print("\n" + "=" * 80)
        print("SENTIMENT & BIAS ANALYSIS SUMMARY")
        print("=" * 80)
        
        print("\nSENTIMENT ANALYSIS:")
        grok_avg = results["sentiment_analysis"]["grokipedia"]["average_polarity"]
        wiki_avg = results["sentiment_analysis"]["wikipedia"]["average_polarity"]
        print(f"   Grokipedia Average Polarity: {grok_avg:.3f}")
        print(f"   Wikipedia Average Polarity: {wiki_avg:.3f}")
        print(f"   Sentiment Shifts Detected: {len(results['sentiment_analysis']['sentiment_shifts'])}")
        
        if results["sentiment_analysis"]["sentiment_shifts"]:
            print("\n   Significant Sentiment Shifts:")
            for shift in results["sentiment_analysis"]["sentiment_shifts"][:5]:
                print(f"      • {shift['section']}: {shift['shift_direction']} shift ({shift['shift_magnitude']:.3f})")
        
        print("\nFRAMING ANALYSIS:")
        grok_bias = results["framing_analysis"]["word_choice_bias"]["grokipedia"]["bias_score"]
        wiki_bias = results["framing_analysis"]["word_choice_bias"]["wikipedia"]["bias_score"]
        print(f"   Grokipedia Bias Score: {grok_bias:.2f}")
        print(f"   Wikipedia Bias Score: {wiki_bias:.2f}")
        
        grok_balance = results["framing_analysis"]["representation_bias"]["grokipedia"]["balance_score"]
        wiki_balance = results["framing_analysis"]["representation_bias"]["wikipedia"]["balance_score"]
        print(f"   Grokipedia Representation Balance: {grok_balance:.2f}")
        print(f"   Wikipedia Representation Balance: {wiki_balance:.2f}")
        
        print("\nPOLITICAL LEANING:")
        grok_quad = results["political_leaning"]["grokipedia"]["quadrant"]
        wiki_quad = results["political_leaning"]["wikipedia"]["quadrant"]
        print(f"   Grokipedia: {grok_quad}")
        print(f"   Wikipedia: {wiki_quad}")
        
        grok_lr = results["political_leaning"]["grokipedia"]["left_right_score"]
        wiki_lr = results["political_leaning"]["wikipedia"]["left_right_score"]
        print(f"   Grokipedia Left-Right Score: {grok_lr:.3f} (negative=left, positive=right)")
        print(f"   Wikipedia Left-Right Score: {wiki_lr:.3f} (negative=left, positive=right)")
        
        # Save JSON results
        with open("sentiment_results.json", 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n[SAVED] Results saved to sentiment_results.json")
        
        print("\n" + "=" * 80)
        print("Analysis complete!")
        print("=" * 80)
        
    finally:
        sys.stdout = original_stdout
        tee.close()
        print(f"[SAVED] All output saved to {output_file}")


if __name__ == "__main__":
    main()

