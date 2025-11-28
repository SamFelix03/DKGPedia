"""
Semantic Drift Detection System
Detects semantic differences between Grokipedia and Wikipedia using multiple embedding methods
"""

import re
import json
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Set, Optional
from collections import defaultdict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import seaborn as sns

def _install_package(package_name: str, import_name: str = None) -> bool:
    """Install a package if not available"""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        return True
    except ImportError:
        print(f"📥 Installing {package_name}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_name, "--quiet"])
            __import__(import_name)
            print(f"✅ Successfully installed {package_name}")
            return True
        except Exception as e:
            print(f"❌ Failed to install {package_name}: {e}")
            return False

# Try to import optional dependencies and install if missing
try:
    from sentence_transformers import SentenceTransformer, CrossEncoder
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    if _install_package("sentence-transformers"):
        from sentence_transformers import SentenceTransformer, CrossEncoder
        SENTENCE_TRANSFORMERS_AVAILABLE = True
    else:
        SENTENCE_TRANSFORMERS_AVAILABLE = False
        print("⚠️ sentence-transformers not available. Some features will be limited.")

try:
    import umap
    UMAP_AVAILABLE = True
except ImportError:
    if _install_package("umap-learn", "umap"):
        import umap
        UMAP_AVAILABLE = True
    else:
        UMAP_AVAILABLE = False
        print("⚠️ umap-learn not available. Will use t-SNE instead.")

try:
    from bertopic import BERTopic
    from sklearn.feature_extraction.text import CountVectorizer
    BERTOPIC_AVAILABLE = True
except ImportError:
    if _install_package("bertopic"):
        from bertopic import BERTopic
        from sklearn.feature_extraction.text import CountVectorizer
        BERTOPIC_AVAILABLE = True
    else:
        BERTOPIC_AVAILABLE = False
        print("⚠️ bertopic not available. Will use LDA for topic modeling.")

try:
    from gensim import corpora, models
    GENSIM_AVAILABLE = True
except ImportError:
    if _install_package("gensim"):
        from gensim import corpora, models
        GENSIM_AVAILABLE = True
    else:
        GENSIM_AVAILABLE = False
        print("⚠️ gensim not available. Will use sklearn LDA for topic modeling.")

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("⚠️ PyTorch not installed. Some embeddings will use NumPy.")

# Import from triple.py
from triple import TripleExtractor, KnowledgeGraphBuilder, GraphEmbedding


class SemanticDriftDetector:
    """Detects semantic drift between two text sources using multiple embedding methods"""
    
    def __init__(self):
        # Initialize embedding models
        self.sentence_model = None
        self.cross_encoder = None
        self.topic_model = None
        
        # Initialize from triple.py
        self.triple_extractor = TripleExtractor()
        self.graph_builder = KnowledgeGraphBuilder()
        
        # Initialize embeddings
        self._initialize_embeddings()
        
    def _initialize_embeddings(self):
        """Initialize all embedding models"""
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                # Sentence-level embeddings (UAE-Large or Sentence-BERT)
                print("📥 Loading sentence transformer model...")
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
                print("✅ Loaded sentence transformer")
                
                # Cross-encoder for more accurate similarity
                print("📥 Loading cross-encoder model...")
                self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
                print("✅ Loaded cross-encoder")
            except Exception as e:
                print(f"⚠️ Error loading transformer models: {e}")
                self.sentence_model = None
                self.cross_encoder = None
        
        # Initialize topic model
        if BERTOPIC_AVAILABLE:
            try:
                print("📥 Initializing BERTopic model...")
                # Configure BERTopic with better parameters for small datasets
                self.topic_model = BERTopic(
                    embedding_model=self.sentence_model if self.sentence_model else None,
                    min_topic_size=2,  # Lower threshold for small datasets
                    nr_topics="auto",  # Automatically determine number of topics
                    calculate_probabilities=True,
                    verbose=True
                )
                print("✅ Initialized BERTopic")
            except Exception as e:
                print(f"⚠️ Error initializing BERTopic: {e}")
                self.topic_model = None
    
    def _read_file(self, filepath: str) -> str:
        """Read and extract content from file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract the full content section
        match = re.search(r'📄 Full Content:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        return content
    
    def _split_into_sections(self, text: str) -> List[Dict]:
        """Split text into sections for section-by-section analysis"""
        sections = []
        
        # Split by common section markers (Wikipedia style)
        section_patterns = [
            r'^==\s+(.+?)\s+==',  # == Section ==
            r'^===\s+(.+?)\s+===',  # === Subsection ===
            r'^####\s+(.+?)',       # #### Subsection
            r'^###\s+(.+?)',        # ### Subsection
            r'^##\s+(.+?)',         # ## Subsection
            r'^#\s+(.+?)',          # # Section
        ]
        
        lines = text.split('\n')
        current_section = {"title": "Introduction", "content": []}
        skip_lines = set()  # Track lines to skip (separators and titles)
        
        for i, line in enumerate(lines):
            # Skip lines that are part of Grokipedia section markers
            if i in skip_lines:
                continue
                
            is_section_header = False
            stripped = line.strip()
            
            # Check for Grokipedia-style section markers: ======================================================================
            # Pattern: separator line, section title, separator line
            if stripped and stripped.startswith('=') and all(c == '=' for c in stripped) and len(stripped) >= 20:
                # Check if next line is a section title
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # Check if line after next is also a separator
                    if i + 2 < len(lines):
                        next_next_line = lines[i + 2].strip()
                        if (next_next_line and next_next_line.startswith('=') and 
                            all(c == '=' for c in next_next_line) and len(next_next_line) >= 20):
                            # This is a Grokipedia section header!
                            if current_section["content"]:
                                sections.append({
                                    "title": current_section["title"],
                                    "content": "\n".join(current_section["content"]).strip()
                                })
                            
                            # Start new section with the title from next line
                            current_section = {
                                "title": next_line if next_line else "Untitled Section",
                                "content": []
                            }
                            is_section_header = True
                            # Mark the current separator, title line, and closing separator to skip
                            skip_lines.add(i)      # Current separator line
                            skip_lines.add(i + 1)  # Title line
                            skip_lines.add(i + 2)  # Closing separator line
                            continue
            
            # Check for Wikipedia-style markers
            for pattern in section_patterns:
                match = re.match(pattern, stripped)
                if match:
                    # Save previous section
                    if current_section["content"]:
                        sections.append({
                            "title": current_section["title"],
                            "content": "\n".join(current_section["content"]).strip()
                        })
                    
                    # Start new section
                    current_section = {
                        "title": match.group(1).strip(),
                        "content": []
                    }
                    is_section_header = True
                    break
            
            # Check for plain text headings (Grokipedia style)
            if not is_section_header and stripped:
                # Heuristic: Heading-like lines
                # - Short line (less than 100 chars)
                # - Mostly capitalized words or title case
                # - Not a sentence (no period at end, not too long)
                # - Followed by content (next line has text)
                # - Not all caps (which might be emphasis)
                
                is_short = len(stripped) < 100
                is_title_case = (stripped[0].isupper() if stripped else False) and not stripped.isupper()
                has_no_ending_punct = not stripped.rstrip().endswith(('.', '!', '?', ':', ';'))
                next_line_has_content = (i + 1 < len(lines) and lines[i + 1].strip())
                
                # Check if it looks like a heading
                words = stripped.split()
                
                # Exclude lines that look like data/statistics (numbers, percentages, etc.)
                has_numbers = any(char.isdigit() for char in stripped)
                has_percent = '%' in stripped or 'µg' in stripped or 'mg' in stripped
                looks_like_data = has_numbers and (has_percent or ':' in stripped or len(words) <= 3)
                
                # Exclude table rows or definitions
                is_table_row = '|' in stripped or stripped.count('\t') > 1
                is_definition = len(words) == 2 and words[0][0].isupper() and words[1][0].isupper()
                
                # Check for definition pattern: Single capitalized word followed by description
                # Pattern: "Word Description text [citation]" or "Word Description text"
                is_definition_pattern = False
                if len(words) >= 2:
                    first_word = words[0]
                    # If first word is capitalized and short (likely a term), and rest is description
                    if (first_word[0].isupper() and len(first_word) < 20 and 
                        not first_word.endswith('.') and
                        (any(char.islower() for char in stripped[len(first_word):]) or 
                         '[' in stripped or ']' in stripped)):
                        # Check if it looks like a definition entry (term: description)
                        # Common patterns: "Term Description", "Term Description [ref]"
                        remaining_text = stripped[len(first_word):].strip()
                        if remaining_text and not remaining_text.startswith(('and', 'or', 'the', 'a', 'an')):
                            # Likely a definition if it has citation markers or descriptive text
                            if '[' in remaining_text or len(remaining_text) > 20:
                                is_definition_pattern = True
                
                # Exclude lines with citation markers at the end (likely definitions or data)
                # Also check for citations anywhere in the line if it looks like a definition
                has_end_citation = bool(re.search(r'\[\d+\]\s*$', stripped))
                # Also exclude if citation is in the middle/end and line looks like definition
                has_mid_citation = bool(re.search(r'\[\d+\]', stripped)) and len(words) >= 3
                first_word_check = words[0] if words else ""
                is_likely_definition = has_mid_citation and (first_word_check[0].isupper() if first_word_check else False) and len(first_word_check) < 15
                
                if (is_short and is_title_case and has_no_ending_punct and 
                    next_line_has_content and len(words) >= 1 and len(words) <= 8 and
                    not looks_like_data and not is_table_row and not is_definition and 
                    not is_definition_pattern and not has_end_citation and not is_likely_definition):
                    # Additional check: not a list item or citation
                    if not stripped.startswith(('•', '-', '*', '[', '(', 'http', 'https')):
                        # More flexible heading detection for Grokipedia style
                        # Check if previous line was blank, short, or ends with sentence punctuation
                        prev_line = lines[i-1].strip() if i > 0 else ""
                        prev_line_empty = (i == 0 or not prev_line)
                        prev_line_short = len(prev_line) < 50 if prev_line else False
                        # If previous line ends with sentence punctuation, it's likely a paragraph end, so next line could be a heading
                        prev_line_ends_sentence = prev_line and prev_line.endswith(('.', '!', '?', ']'))
                        # Check if previous line looks like content (has lowercase letters and is longer)
                        prev_line_is_content = prev_line and any(c.islower() for c in prev_line) and len(prev_line) > 30
                        
                        # Additional validation: heading should not be a single word that's too common
                        is_common_word = len(words) == 1 and stripped.lower() in ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']
                        
                        # Accept as heading if:
                        # 1. Previous line is empty/short (traditional pattern), OR
                        # 2. Previous line ends with sentence punctuation and current line looks like a heading (Grokipedia pattern), OR
                        # 3. Previous line is content and current line is clearly a heading (multiple capitalized words)
                        is_multi_word_heading = (len(words) >= 2 and 
                                                all(w and w[0].isupper() for w in words[:2] if w))
                        
                        if not is_common_word:
                            if (prev_line_empty or prev_line_short or 
                                (prev_line_ends_sentence and is_multi_word_heading) or
                                (prev_line_is_content and is_multi_word_heading and len(words) >= 2)):
                                # Save previous section
                                if current_section["content"]:
                                    sections.append({
                                        "title": current_section["title"],
                                        "content": "\n".join(current_section["content"]).strip()
                                    })
                                
                                # Start new section
                                current_section = {
                                    "title": stripped,
                                    "content": []
                                }
                                is_section_header = True
            
            if not is_section_header:
                current_section["content"].append(line)
        
        # Add final section
        if current_section["content"]:
            sections.append({
                "title": current_section["title"],
                "content": "\n".join(current_section["content"]).strip()
            })
        
        # If no sections found or only one section, try to split by paragraphs
        if len(sections) <= 1:
            # Split by double newlines or long paragraphs
            paragraphs = re.split(r'\n\n+', text)
            if len(paragraphs) > 1:
                sections = []
                for i, para in enumerate(paragraphs):
                    # Extract first line as potential title
                    para_lines = para.strip().split('\n')
                    if para_lines:
                        title = para_lines[0][:50] if len(para_lines[0]) > 50 else para_lines[0]
                        content = '\n'.join(para_lines[1:]) if len(para_lines) > 1 else para_lines[0]
                        sections.append({
                            "title": f"Section {i+1}: {title}",
                            "content": content
                        })
        
        # Final fallback
        if not sections or len(sections) == 1:
            sections = [{"title": "Full Content", "content": text}]
        
        return sections
    
    def _generate_sentence_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate sentence-level embeddings"""
        if self.sentence_model:
            return self.sentence_model.encode(texts, show_progress_bar=False)
        else:
            # Fallback to TF-IDF
            from sklearn.feature_extraction.text import TfidfVectorizer
            vectorizer = TfidfVectorizer(max_features=300)
            return vectorizer.fit_transform(texts).toarray()
    
    def _generate_cross_encoder_similarities(self, texts_a: List[str], texts_b: List[str]) -> np.ndarray:
        """Generate cross-encoder similarity scores"""
        if not self.cross_encoder:
            # Fallback to cosine similarity
            embeddings_a = self._generate_sentence_embeddings(texts_a)
            embeddings_b = self._generate_sentence_embeddings(texts_b)
            return cosine_similarity(embeddings_a, embeddings_b)
        
        # Create pairs for cross-encoder
        pairs = []
        for text_a in texts_a:
            for text_b in texts_b:
                pairs.append([text_a[:512], text_b[:512]])  # Limit length
        
        # Get scores
        scores = self.cross_encoder.predict(pairs)
        
        # Reshape to matrix
        n_a, n_b = len(texts_a), len(texts_b)
        return scores.reshape(n_a, n_b)
    
    def _generate_kg_embeddings(self, triples: List[Dict], method: str = "TransE") -> Dict:
        """Generate knowledge graph embeddings"""
        embedding_model = GraphEmbedding(embedding_dim=50, method=method)
        embedding_model.fit(triples)
        
        # Get embeddings for all entities and relations
        entity_embeddings = {}
        for triple in triples:
            subj = triple["subject"]
            obj = triple["object"]
            if subj not in entity_embeddings:
                entity_embeddings[subj] = embedding_model.get_entity_embedding(subj)
            if obj not in entity_embeddings:
                entity_embeddings[obj] = embedding_model.get_entity_embedding(obj)
        
        return {
            "entity_embeddings": entity_embeddings,
            "model": embedding_model
        }
    
    def _perform_topic_modeling(self, texts: List[str]) -> Dict:
        """Perform topic modeling using BERTopic, Gensim LDA, or sklearn LDA"""
        if BERTOPIC_AVAILABLE and self.topic_model:
            try:
                # Filter out very short texts
                filtered_texts = [t for t in texts if len(t.strip()) > 50]
                if len(filtered_texts) < 2:
                    print("⚠️ Too few valid texts for BERTopic, using LDA")
                    raise ValueError("Insufficient texts")
                
                # Create a new BERTopic instance with better parameters for this dataset
                from bertopic import BERTopic
                topic_model = BERTopic(
                    embedding_model=self.sentence_model if self.sentence_model else None,
                    min_topic_size=max(2, len(filtered_texts) // 15),  # Adaptive: smaller for small datasets
                    nr_topics="auto",  # Automatically determine number of topics
                    calculate_probabilities=True,
                    verbose=False
                )
                
                topics, probs = topic_model.fit_transform(filtered_texts)
                topic_info = topic_model.get_topic_info()
                
                # Convert topics to list (handle both numpy arrays and lists)
                if hasattr(topics, 'tolist'):
                    topics_list = topics.tolist()
                else:
                    topics_list = list(topics) if isinstance(topics, (list, tuple)) else [int(t) for t in topics]
                
                # Convert probabilities if available
                probs_list = None
                if probs is not None:
                    if hasattr(probs, 'tolist'):
                        probs_list = probs.tolist()
                    else:
                        probs_list = list(probs) if isinstance(probs, (list, tuple)) else [float(p) for p in probs]
                
                # Count actual topics (excluding -1 outliers)
                unique_topics = set([t for t in topics_list if t != -1])
                topic_count = len(unique_topics)
                
                # If all are outliers, BERTopic didn't work well - fall back
                if topic_count == 0:
                    print("⚠️ BERTopic assigned all documents to outliers, falling back to LDA")
                    raise ValueError("All documents are outliers")
                
                # Pad topics list back to original length if we filtered
                if len(filtered_texts) < len(texts):
                    # Map filtered indices back to original
                    original_topics = [-1] * len(texts)
                    filtered_idx = 0
                    for i, text in enumerate(texts):
                        if len(text.strip()) > 50:
                            original_topics[i] = topics_list[filtered_idx]
                            filtered_idx += 1
                    topics_list = original_topics
                
                return {
                    "method": "BERTopic",
                    "topics": topics_list,
                    "probabilities": probs_list,
                    "topic_info": topic_info.to_dict() if hasattr(topic_info, 'to_dict') else None,
                    "topic_count": topic_count
                }
            except Exception as e:
                print(f"⚠️ BERTopic failed: {e}, falling back to LDA")
        
        # Try Gensim LDA
        if GENSIM_AVAILABLE:
            try:
                # Preprocess texts
                texts_processed = [text.lower().split() for text in texts]
                
                # Create dictionary and corpus
                dictionary = corpora.Dictionary(texts_processed)
                corpus = [dictionary.doc2bow(text) for text in texts_processed]
                
                # Train LDA model
                num_topics = min(10, len(texts) // 2)  # Adaptive number of topics
                if num_topics < 2:
                    num_topics = 2
                
                lda_model = models.LdaModel(
                    corpus,
                    num_topics=num_topics,
                    id2word=dictionary,
                    passes=10,
                    alpha='auto',
                    per_word_topics=True
                )
                
                # Get topic distributions
                topics = []
                for doc in corpus:
                    topic_dist = lda_model.get_document_topics(doc)
                    topics.append([prob for _, prob in topic_dist])
                
                return {
                    "method": "Gensim LDA",
                    "topics": topics,
                    "topic_count": num_topics,
                    "model": "Gensim LDA Model"
                }
            except Exception as e:
                print(f"⚠️ Gensim LDA failed: {e}, trying sklearn LDA")
        
        # Fallback to sklearn LDA
        try:
            from sklearn.decomposition import LatentDirichletAllocation
            from sklearn.feature_extraction.text import CountVectorizer
            
            # Vectorize texts
            vectorizer = CountVectorizer(max_features=100, stop_words='english', min_df=2)
            doc_term_matrix = vectorizer.fit_transform(texts)
            
            # Determine number of topics
            num_topics = min(10, len(texts) // 2)
            if num_topics < 2:
                num_topics = 2
            
            # Train LDA
            lda = LatentDirichletAllocation(n_components=num_topics, random_state=42, max_iter=10)
            lda.fit(doc_term_matrix)
            
            # Get topic distributions for each document
            topic_distributions = lda.transform(doc_term_matrix)
            
            # Get dominant topic for each document
            dominant_topics = topic_distributions.argmax(axis=1)
            
            return {
                "method": "sklearn LDA",
                "topics": topic_distributions.tolist(),
                "dominant_topics": dominant_topics.tolist(),
                "topic_count": num_topics
            }
        except Exception as e:
            print(f"⚠️ sklearn LDA failed: {e}")
        
        return {
            "method": "none",
            "topics": None,
            "topic_count": 0,
            "error": "All topic modeling methods failed"
        }
    
    def calculate_semantic_drift(self, grokipedia_file: str, wikipedia_file: str) -> Dict:
        """Calculate comprehensive semantic drift metrics"""
        
        print("=" * 80)
        print("🔍 Semantic Drift Detection System")
        print("=" * 80)
        print()
        
        # Read files
        print("📚 Reading files...")
        grok_content = self._read_file(grokipedia_file)
        wiki_content = self._read_file(wikipedia_file)
        
        # Split into sections
        print("📑 Splitting into sections...")
        grok_sections = self._split_into_sections(grok_content)
        wiki_sections = self._split_into_sections(wiki_content)
        print(f"   Grokipedia: {len(grok_sections)} sections")
        print(f"   Wikipedia: {len(wiki_sections)} sections")
        
        # Extract triples
        print("🔍 Extracting triples...")
        grok_triples = self.triple_extractor.extract_triples(grok_content, "grokipedia")
        wiki_triples = self.triple_extractor.extract_triples(wiki_content, "wikipedia")
        print(f"   Grokipedia: {len(grok_triples)} triples")
        print(f"   Wikipedia: {len(wiki_triples)} triples")
        
        results = {}
        
        # 1. Sentence-level embeddings
        print("\n📊 Generating sentence-level embeddings...")
        grok_sentences = [s["content"] for s in grok_sections]
        wiki_sentences = [s["content"] for s in wiki_sections]
        
        grok_embeddings = self._generate_sentence_embeddings(grok_sentences)
        wiki_embeddings = self._generate_sentence_embeddings(wiki_sentences)
        
        sentence_similarity = cosine_similarity(grok_embeddings, wiki_embeddings)
        results["sentence_embeddings"] = {
            "grokipedia_sections": len(grok_sections),
            "wikipedia_sections": len(wiki_sections),
            "similarity_matrix": sentence_similarity.tolist(),
            "average_similarity": float(np.mean(sentence_similarity)),
            "max_similarity": float(np.max(sentence_similarity)),
            "min_similarity": float(np.min(sentence_similarity))
        }
        
        # 2. Cross-encoder similarity
        print("📊 Calculating cross-encoder similarities...")
        cross_encoder_similarity = self._generate_cross_encoder_similarities(
            grok_sentences, wiki_sentences
        )
        results["cross_encoder"] = {
            "similarity_matrix": cross_encoder_similarity.tolist(),
            "average_similarity": float(np.mean(cross_encoder_similarity)),
            "max_similarity": float(np.max(cross_encoder_similarity)),
            "min_similarity": float(np.min(cross_encoder_similarity))
        }
        
        # 3. Knowledge graph embeddings
        print("📊 Generating knowledge graph embeddings...")
        kg_results = {}
        for method in ["TransE", "DistMult", "ComplEx"]:
            try:
                grok_kg = self._generate_kg_embeddings(grok_triples, method)
                wiki_kg = self._generate_kg_embeddings(wiki_triples, method)
                
                # Calculate similarity between entity embeddings
                grok_entities = list(grok_kg["entity_embeddings"].keys())
                wiki_entities = list(wiki_kg["entity_embeddings"].keys())
                
                common_entities = set(grok_entities).intersection(set(wiki_entities))
                
                if common_entities:
                    grok_vecs = np.array([grok_kg["entity_embeddings"][e] for e in common_entities])
                    wiki_vecs = np.array([wiki_kg["entity_embeddings"][e] for e in common_entities])
                    
                    entity_similarity = cosine_similarity(grok_vecs, wiki_vecs)
                    # Diagonal represents same entities
                    avg_entity_sim = float(np.mean(np.diag(entity_similarity)))
                else:
                    avg_entity_sim = 0.0
                
                kg_results[method] = {
                    "grokipedia_entities": len(grok_entities),
                    "wikipedia_entities": len(wiki_entities),
                    "common_entities": len(common_entities),
                    "average_entity_similarity": avg_entity_sim
                }
            except Exception as e:
                print(f"⚠️ Error with {method}: {e}")
                kg_results[method] = {"error": str(e)}
        
        results["knowledge_graph_embeddings"] = kg_results
        
        # 4. Topic modeling
        print("📊 Performing topic modeling...")
        all_texts = grok_sentences + wiki_sentences
        topic_results = self._perform_topic_modeling(all_texts)
        
        # Split topic results
        if topic_results["topics"]:
            n_grok = len(grok_sentences)
            grok_topics = topic_results["topics"][:n_grok]
            wiki_topics = topic_results["topics"][n_grok:]
            
            # Calculate topic divergence
            try:
                if isinstance(grok_topics[0], list):  # LDA format (list of distributions)
                    # Handle variable-length distributions by padding or truncating
                    max_len = max(len(gt) for gt in grok_topics + wiki_topics)
                    
                    # Pad all distributions to same length
                    grok_padded = []
                    wiki_padded = []
                    for gt in grok_topics:
                        padded = list(gt) + [0.0] * (max_len - len(gt))
                        grok_padded.append(padded[:max_len])  # Truncate if too long
                    
                    for wt in wiki_topics:
                        padded = list(wt) + [0.0] * (max_len - len(wt))
                        wiki_padded.append(padded[:max_len])  # Truncate if too long
                    
                    grok_topic_dist = np.array(grok_padded)
                    wiki_topic_dist = np.array(wiki_padded)
                    
                    # Normalize distributions
                    grok_topic_dist = grok_topic_dist / (grok_topic_dist.sum(axis=1, keepdims=True) + 1e-10)
                    wiki_topic_dist = wiki_topic_dist / (wiki_topic_dist.sum(axis=1, keepdims=True) + 1e-10)
                    
                    topic_divergence = float(np.mean([
                        np.linalg.norm(g - w) for g, w in zip(grok_topic_dist, wiki_topic_dist)
                    ]))
                elif "dominant_topics" in topic_results:  # sklearn LDA with dominant topics
                    grok_dominant = topic_results["dominant_topics"][:n_grok]
                    wiki_dominant = topic_results["dominant_topics"][n_grok:]
                    topic_divergence = float(sum(1 for g, w in zip(grok_dominant, wiki_dominant) if g != w) / max(len(grok_dominant), 1))
                else:  # BERTopic format (list of topic IDs)
                    topic_divergence = float(sum(1 for g, w in zip(grok_topics, wiki_topics) if g != w) / max(len(grok_topics), 1))
            except Exception as e:
                print(f"⚠️ Error calculating topic divergence: {e}")
                topic_divergence = 0.0
            
            topic_results["grokipedia_topics"] = grok_topics
            topic_results["wikipedia_topics"] = wiki_topics
            topic_results["topic_divergence"] = topic_divergence
        
        results["topic_modeling"] = topic_results
        
        # 5. Calculate semantic drift score
        print("📊 Calculating semantic drift score...")
        drift_score = self._calculate_drift_score(results)
        results["semantic_drift_score"] = drift_score
        
        # 6. Claim-level alignment
        print("📊 Calculating claim-level alignment...")
        claim_alignment = self._calculate_claim_alignment(grok_triples, wiki_triples)
        results["claim_alignment"] = claim_alignment
        
        # 7. Prepare visualization data
        print("📊 Preparing visualization data...")
        results["visualization"] = {
            "sentence_embeddings_grok": grok_embeddings.tolist(),
            "sentence_embeddings_wiki": wiki_embeddings.tolist(),
            "section_titles_grok": [s["title"] for s in grok_sections],
            "section_titles_wiki": [s["title"] for s in wiki_sections]
        }
        
        # Store full results for visualization (needed by visualize_embeddings method)
        self._last_full_results = results
        
        # Return only the specified sections: topic_modeling, semantic_drift_score, claim_alignment, visualization
        filtered_results = {
            "topic_modeling": results.get("topic_modeling", {}),
            "semantic_drift_score": results.get("semantic_drift_score", {}),
            "claim_alignment": results.get("claim_alignment", {}),
            "visualization": results.get("visualization", {})
        }
        
        print("\n✅ Semantic drift analysis complete!")
        
        return filtered_results
    
    def _calculate_drift_score(self, results: Dict) -> Dict:
        """Calculate overall semantic drift score"""
        scores = []
        
        # Sentence embedding similarity
        if "sentence_embeddings" in results:
            avg_sim = results["sentence_embeddings"]["average_similarity"]
            scores.append(1.0 - avg_sim)  # Convert similarity to drift
        
        # Cross-encoder similarity
        if "cross_encoder" in results:
            avg_sim = results["cross_encoder"]["average_similarity"]
            scores.append(1.0 - avg_sim)
        
        # KG embeddings
        if "knowledge_graph_embeddings" in results:
            kg_scores = []
            for method, data in results["knowledge_graph_embeddings"].items():
                if "average_entity_similarity" in data:
                    kg_scores.append(1.0 - data["average_entity_similarity"])
            if kg_scores:
                scores.append(np.mean(kg_scores))
        
        # Topic divergence
        if "topic_modeling" in results and "topic_divergence" in results["topic_modeling"]:
            # Normalize topic divergence (assuming max divergence of 2.0)
            topic_drift = min(results["topic_modeling"]["topic_divergence"] / 2.0, 1.0)
            scores.append(topic_drift)
        
        overall_drift = np.mean(scores) if scores else 0.0
        
        return {
            "overall_drift_score": float(overall_drift),
            "drift_percentage": float(overall_drift * 100),
            "component_scores": {
                "sentence_embedding_drift": scores[0] if len(scores) > 0 else None,
                "cross_encoder_drift": scores[1] if len(scores) > 1 else None,
                "kg_embedding_drift": scores[2] if len(scores) > 2 else None,
                "topic_drift": scores[3] if len(scores) > 3 else None
            },
            "interpretation": self._interpret_drift_score(overall_drift)
        }
    
    def _interpret_drift_score(self, score: float) -> str:
        """Interpret drift score"""
        if score < 0.2:
            return "Very Low Drift - Highly aligned"
        elif score < 0.4:
            return "Low Drift - Well aligned"
        elif score < 0.6:
            return "Moderate Drift - Some divergence"
        elif score < 0.8:
            return "High Drift - Significant divergence"
        else:
            return "Very High Drift - Major semantic differences"
    
    def _calculate_claim_alignment(self, triples_a: List[Dict], triples_b: List[Dict]) -> Dict:
        """Calculate claim-level alignment percentage"""
        # Convert triples to claim strings
        claims_a = {f"{t['subject']} {t['predicate']} {t['object']}" for t in triples_a}
        claims_b = {f"{t['subject']} {t['predicate']} {t['object']}" for t in triples_b}
        
        # Exact matches
        exact_matches = claims_a.intersection(claims_b)
        
        # Semantic matches (using embeddings)
        if self.sentence_model and len(claims_a) > 0 and len(claims_b) > 0:
            claims_a_list = list(claims_a)
            claims_b_list = list(claims_b)
            
            embeddings_a = self._generate_sentence_embeddings(claims_a_list)
            embeddings_b = self._generate_sentence_embeddings(claims_b_list)
            
            similarity_matrix = cosine_similarity(embeddings_a, embeddings_b)
            
            # Find semantic matches (similarity > 0.7)
            semantic_matches = 0
            for i, claim_a in enumerate(claims_a_list):
                if claim_a not in exact_matches:
                    max_sim = np.max(similarity_matrix[i])
                    if max_sim > 0.7:
                        semantic_matches += 1
        else:
            semantic_matches = 0
        
        total_claims_a = len(claims_a)
        total_claims_b = len(claims_b)
        aligned_claims = len(exact_matches) + semantic_matches
        
        alignment_percentage = (aligned_claims / max(total_claims_a, total_claims_b) * 100) if max(total_claims_a, total_claims_b) > 0 else 0
        
        return {
            "total_claims_grokipedia": total_claims_a,
            "total_claims_wikipedia": total_claims_b,
            "exact_matches": len(exact_matches),
            "semantic_matches": semantic_matches,
            "total_aligned_claims": aligned_claims,
            "alignment_percentage": float(alignment_percentage)
        }
    
    def visualize_embeddings(self, results: Dict, output_dir: str = "semantic_drift_visualizations"):
        """Generate visualization plots"""
        Path(output_dir).mkdir(exist_ok=True)
        
        print(f"\n📊 Generating visualizations in {output_dir}/...")
        
        # Use full results if available (for internal visualization), otherwise use provided results
        full_results = getattr(self, '_last_full_results', results)
        
        # 1. Cosine similarity heatmap
        if "sentence_embeddings" in full_results:
            similarity_matrix = np.array(full_results["sentence_embeddings"]["similarity_matrix"])
            
            plt.figure(figsize=(12, 10))
            sns.heatmap(
                similarity_matrix,
                annot=True,
                fmt='.2f',
                cmap='RdYlGn',
                vmin=0,
                vmax=1,
                xticklabels=[f"Wiki {i+1}" for i in range(similarity_matrix.shape[1])],
                yticklabels=[f"Grok {i+1}" for i in range(similarity_matrix.shape[0])]
            )
            plt.title("Section-by-Section Cosine Similarity Matrix")
            plt.xlabel("Wikipedia Sections")
            plt.ylabel("Grokipedia Sections")
            plt.tight_layout()
            plt.savefig(f"{output_dir}/similarity_heatmap.png", dpi=300)
            plt.close()
            print("   ✅ Saved similarity_heatmap.png")
        
        # 2. t-SNE/UMAP visualization
        if "visualization" in full_results:
            grok_emb = np.array(full_results["visualization"]["sentence_embeddings_grok"])
            wiki_emb = np.array(full_results["visualization"]["sentence_embeddings_wiki"])
            
            # Combine embeddings
            all_embeddings = np.vstack([grok_emb, wiki_emb])
            
            # Reduce dimensionality
            if UMAP_AVAILABLE:
                reducer = umap.UMAP(n_components=2, random_state=42)
                print("   Using UMAP for dimensionality reduction...")
            else:
                reducer = TSNE(n_components=2, random_state=42, perplexity=min(30, len(all_embeddings)-1))
                print("   Using t-SNE for dimensionality reduction...")
            
            embeddings_2d = reducer.fit_transform(all_embeddings)
            
            # Plot
            plt.figure(figsize=(12, 8))
            n_grok = len(grok_emb)
            plt.scatter(embeddings_2d[:n_grok, 0], embeddings_2d[:n_grok, 1], 
                       c='blue', label='Grokipedia', alpha=0.6, s=100)
            plt.scatter(embeddings_2d[n_grok:, 0], embeddings_2d[n_grok:, 1], 
                       c='red', label='Wikipedia', alpha=0.6, s=100)
            
            # Add labels
            grok_titles = full_results["visualization"]["section_titles_grok"]
            wiki_titles = full_results["visualization"]["section_titles_wiki"]
            
            for i, title in enumerate(grok_titles[:10]):  # Limit to first 10
                plt.annotate(f"G{i+1}", (embeddings_2d[i, 0], embeddings_2d[i, 1]), 
                           fontsize=8, alpha=0.7)
            
            for i, title in enumerate(wiki_titles[:10]):
                plt.annotate(f"W{i+1}", (embeddings_2d[n_grok+i, 0], embeddings_2d[n_grok+i, 1]), 
                           fontsize=8, alpha=0.7)
            
            plt.title("Embedding Space Visualization (t-SNE/UMAP)")
            plt.xlabel("Dimension 1")
            plt.ylabel("Dimension 2")
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(f"{output_dir}/embedding_space.png", dpi=300)
            plt.close()
            print("   ✅ Saved embedding_space.png")
        
        print(f"\n✅ All visualizations saved to {output_dir}/")
    
    def save_results(self, results: Dict, output_file: str = "semantic_drift_results.json"):
        """Save results to JSON file"""
        # Remove non-serializable objects
        cleaned_results = self._clean_results(results)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_results, f, indent=2, ensure_ascii=False)
        print(f"💾 Results saved to {output_file}")
    
    def _clean_results(self, results: Dict) -> Dict:
        """Remove non-serializable objects from results"""
        cleaned = {}
        for key, value in results.items():
            if key == "visualization":
                # Keep only serializable parts
                cleaned[key] = {
                    "section_titles_grok": value.get("section_titles_grok", []),
                    "section_titles_wiki": value.get("section_titles_wiki", [])
                }
            elif isinstance(value, dict):
                cleaned[key] = self._clean_results(value)
            elif isinstance(value, (list, tuple, str, int, float, bool, type(None))):
                cleaned[key] = value
            else:
                # Skip non-serializable objects
                cleaned[key] = str(type(value))
        return cleaned


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
    output_file = "semantic_drift_results.txt"
    tee = TeeOutput(output_file)
    original_stdout = sys.stdout
    sys.stdout = tee
    
    try:
        detector = SemanticDriftDetector()
        
        results = detector.calculate_semantic_drift(
            "dual_scraper_output/grokipedia.txt",
            "dual_scraper_output/wikipedia.txt"
        )
        
        # Print summary
        print("\n" + "=" * 80)
        print("📈 SEMANTIC DRIFT ANALYSIS SUMMARY")
        print("=" * 80)
        
        print(f"\n🎯 Overall Semantic Drift Score: {results['semantic_drift_score']['drift_percentage']:.2f}%")
        print(f"   Interpretation: {results['semantic_drift_score']['interpretation']}")
        
        print(f"\n📊 Sentence Embeddings:")
        se = results['sentence_embeddings']
        print(f"   Average Similarity: {se['average_similarity']:.4f}")
        print(f"   Max Similarity: {se['max_similarity']:.4f}")
        print(f"   Min Similarity: {se['min_similarity']:.4f}")
        
        print(f"\n🔗 Cross-Encoder Similarity:")
        ce = results['cross_encoder']
        print(f"   Average Similarity: {ce['average_similarity']:.4f}")
        
        print(f"\n🧠 Knowledge Graph Embeddings:")
        for method, data in results['knowledge_graph_embeddings'].items():
            if 'error' not in data:
                print(f"   {method}:")
                print(f"     Common Entities: {data.get('common_entities', 0)}")
                print(f"     Entity Similarity: {data.get('average_entity_similarity', 0):.4f}")
        
        print(f"\n📚 Topic Modeling:")
        tm = results['topic_modeling']
        print(f"   Method: {tm['method']}")
        topic_count = tm.get('topic_count', 0)
        print(f"   Topics: {topic_count}")
        if topic_count == 0:
            print(f"   ⚠️  Note: No topics found. This may indicate:")
            print(f"      - Documents are too diverse or too short")
            print(f"      - BERTopic parameters need adjustment")
            print(f"      - Consider using LDA instead")
        if 'topic_divergence' in tm:
            print(f"   Topic Divergence: {tm['topic_divergence']:.4f}")
        
        print(f"\n✅ Claim-Level Alignment:")
        ca = results['claim_alignment']
        print(f"   Alignment Percentage: {ca['alignment_percentage']:.2f}%")
        print(f"   Exact Matches: {ca['exact_matches']}")
        print(f"   Semantic Matches: {ca['semantic_matches']}")
        
        # Generate visualizations
        detector.visualize_embeddings(results)
        
        # Save JSON results
        detector.save_results(results, "semantic_drift_results.json")
        
        print("\n" + "=" * 80)
        print("✨ Analysis complete!")
        print("=" * 80)
        
    finally:
        sys.stdout = original_stdout
        tee.close()
        print(f"💾 All output saved to {output_file}")


if __name__ == "__main__":
    main()

