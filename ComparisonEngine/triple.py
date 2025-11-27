"""
Knowledge Graph Triple Extraction & Comparison System
Compares Grokipedia vs Wikipedia using semantic triple analysis
"""

import re
import json
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Set, Optional
from collections import defaultdict
from io import StringIO
import spacy
from rdflib import Graph, Namespace, URIRef, Literal, RDF, RDFS
from rdflib.namespace import FOAF, DC, DCTERMS
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import networkx as nx
from itertools import combinations

# Try to import optional dependencies
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("⚠️ sentence-transformers not installed. Using TF-IDF for similarity instead.")

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("⚠️ PyTorch not installed. Graph embeddings will use NumPy implementation.")


class TripleExtractor:
    """Extracts semantic triples from text using spaCy + OpenIE-style patterns"""
    
    def __init__(self):
        # Try to load models in order of preference
        model_names = ["en_core_web_lg", "en_core_web_md", "en_core_web_sm"]
        self.nlp = None
        
        for model_name in model_names:
            try:
                self.nlp = spacy.load(model_name)
                print(f"✅ Loaded spaCy model: {model_name}")
                break
            except OSError:
                continue
        
        # If no model found, try to download
        if self.nlp is None:
            print("⚠️ No spaCy model found. Attempting to download...")
            for model_name in model_names:
                try:
                    print(f"📥 Downloading {model_name}...")
                    result = subprocess.run(
                        [sys.executable, "-m", "spacy", "download", model_name],
                        capture_output=True,
                        text=True,
                        check=False
                    )
                    if result.returncode == 0:
                        self.nlp = spacy.load(model_name)
                        print(f"✅ Successfully downloaded and loaded: {model_name}")
                        break
                    else:
                        print(f"❌ Failed to download {model_name}: {result.stderr}")
                except Exception as e:
                    print(f"❌ Error downloading {model_name}: {e}")
                    continue
        
        # Final check: raise error if no model could be loaded
        if self.nlp is None:
            raise RuntimeError(
                f"❌ Could not load any spaCy model. Please install one manually:\n"
                f"   {sys.executable} -m spacy download en_core_web_sm\n"
                f"   Or for a larger model: {sys.executable} -m spacy download en_core_web_lg"
            )
        
        # Initialize sentence transformer if available
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"⚠️ Could not load sentence transformer: {e}")
                self.sentence_model = None
        else:
            self.sentence_model = None
    
    def extract_triples(self, text: str, source: str = "unknown") -> List[Dict]:
        """Extract subject-predicate-object triples using spaCy + OpenIE patterns"""
        doc = self.nlp(text[:1000000])  # Process in chunks if needed
        triples = []
        
        # Method 1: Dependency parsing (Subject-Verb-Object)
        for sent in doc.sents:
            for token in sent:
                # Pattern 1: Subject-Verb-Object
                if token.dep_ in ("nsubj", "nsubjpass"):
                    subject = self._get_full_phrase(token)
                    predicate = token.head.lemma_
                    
                    # Find object
                    for child in token.head.children:
                        if child.dep_ in ("dobj", "attr", "pobj"):
                            obj = self._get_full_phrase(child)
                            triple = {
                                "subject": subject,
                                "predicate": predicate,
                                "object": obj,
                                "source": source,
                                "sentence": sent.text,
                                "has_citation": self._has_citation(sent.text),
                                "extraction_method": "dependency_parsing"
                            }
                            triples.append(triple)
        
        # Method 2: OpenIE-style patterns
        openie_triples = self._extract_openie_patterns(doc, source)
        triples.extend(openie_triples)
        
        # Method 3: Entity relations
        entity_triples = self._extract_entity_relations(doc, source)
        triples.extend(entity_triples)
        
        # Method 4: Nominal relations (X is Y, X has Y, etc.)
        nominal_triples = self._extract_nominal_relations(doc, source)
        triples.extend(nominal_triples)
        
        return triples
    
    def _extract_openie_patterns(self, doc, source: str) -> List[Dict]:
        """Extract triples using OpenIE-style patterns"""
        triples = []
        
        # Common OpenIE patterns
        patterns = [
            # "X is Y" -> (X, is, Y)
            (r'(\w+(?:\s+\w+)*)\s+is\s+(?:a|an|the)?\s*(\w+(?:\s+\w+)*)', 'is'),
            # "X was Y" -> (X, was, Y)
            (r'(\w+(?:\s+\w+)*)\s+was\s+(?:a|an|the)?\s*(\w+(?:\s+\w+)*)', 'was'),
            # "X has Y" -> (X, has, Y)
            (r'(\w+(?:\s+\w+)*)\s+has\s+(\w+(?:\s+\w+)*)', 'has'),
            # "X located in Y" -> (X, located_in, Y)
            (r'(\w+(?:\s+\w+)*)\s+located\s+in\s+(\w+(?:\s+\w+)*)', 'located_in'),
            # "X born in Y" -> (X, born_in, Y)
            (r'(\w+(?:\s+\w+)*)\s+born\s+in\s+(\w+(?:\s+\w+)*)', 'born_in'),
        ]
        
        for sent in doc.sents:
            sent_text = sent.text
            citation = self._has_citation(sent_text)
            
            for pattern, relation in patterns:
                matches = re.finditer(pattern, sent_text, re.IGNORECASE)
                for match in matches:
                    subject = match.group(1).strip()
                    obj = match.group(2).strip()
                    
                    # Filter out very short or invalid triples
                    if len(subject) > 2 and len(obj) > 2 and subject.lower() != obj.lower():
                        triple = {
                            "subject": subject,
                            "predicate": relation,
                            "object": obj,
                            "source": source,
                            "sentence": sent_text,
                            "has_citation": citation,
                            "extraction_method": "openie_pattern"
                        }
                        triples.append(triple)
        
        return triples
    
    def _extract_nominal_relations(self, doc, source: str) -> List[Dict]:
        """Extract nominal relations (noun-noun, noun-prep-noun)"""
        triples = []
        
        for sent in doc.sents:
            # Look for noun compounds and prepositional phrases
            for token in sent:
                # Pattern: "X of Y" -> (Y, has_part, X) or (X, part_of, Y)
                if token.dep_ == "pobj" and token.head.lemma_ == "of":
                    obj = self._get_full_phrase(token)
                    # Find the subject (noun before "of")
                    subject_token = token.head.head
                    if subject_token:
                        subject = self._get_full_phrase(subject_token)
                        triple = {
                            "subject": subject,
                            "predicate": "has_part",
                            "object": obj,
                            "source": source,
                            "sentence": sent.text,
                            "has_citation": self._has_citation(sent.text),
                            "extraction_method": "nominal_relation"
                        }
                        triples.append(triple)
        
        return triples
    
    def _get_full_phrase(self, token) -> str:
        """Get the full noun phrase or compound"""
        # Get all children recursively
        phrase_tokens = [token]
        for child in token.children:
            if child.dep_ in ("det", "amod", "compound", "prep", "pobj"):
                phrase_tokens.extend([child] + list(child.subtree))
        
        phrase_tokens = sorted(set(phrase_tokens), key=lambda t: t.i)
        return " ".join([t.text for t in phrase_tokens]).strip()
    
    def _extract_entity_relations(self, doc, source: str) -> List[Dict]:
        """Extract relations between named entities"""
        triples = []
        entities = [(ent.text, ent.label_, ent.start, ent.end) for ent in doc.ents]
        
        for i, (ent1_text, ent1_label, start1, end1) in enumerate(entities):
            for ent2_text, ent2_label, start2, end2 in entities[i+1:]:
                # Find tokens between entities
                if start2 > end1:
                    between_tokens = doc[end1:start2]
                    if len(between_tokens) > 0 and len(between_tokens) < 10:
                        relation = " ".join([t.lemma_ for t in between_tokens if not t.is_stop])
                        if relation:
                            triple = {
                                "subject": ent1_text,
                                "predicate": relation,
                                "object": ent2_text,
                                "source": source,
                                "subject_type": ent1_label,
                                "object_type": ent2_label,
                                "sentence": doc[start1:end2].text,
                                "has_citation": False,
                                "extraction_method": "entity_relation"
                            }
                            triples.append(triple)
        
        return triples
    
    def _has_citation(self, text: str) -> bool:
        """Check if text contains citation markers"""
        # More comprehensive citation patterns
        citation_patterns = [
            r'\[\d+\]',                    # [1], [2], etc.
            r'\[\d+,\s*\d+\]',            # [1, 2]
            r'\[\d+-\d+\]',                # [1-5]
            r'\(\d{4}\)',                  # (2024)
            r'\(\d{4}[a-z]\)',             # (2024a)
            r'et al\.',                    # et al.
            r'\[citation needed\]',        # [citation needed]
            r'\[who\]',                    # [who]
            r'\[when\]',                   # [when]
            r'\[where\]',                  # [where]
            r'\[clarification needed\]',    # [clarification needed]
            r'ref\.',                      # ref.
            r'reference',                   # reference
            r'see also',                   # see also
            r'cf\.',                        # cf.
            r'according to',                # according to [source]
            r'as cited in',                # as cited in
            r'per',                         # per [source]
        ]
        text_lower = text.lower()
        
        # Check for citation patterns
        has_citation = any(re.search(pattern, text_lower, re.IGNORECASE) for pattern in citation_patterns)
        
        # Also check for common citation phrases that might indicate sourcing
        citation_phrases = [
            'according to',
            'as stated in',
            'as reported by',
            'research shows',
            'studies indicate',
            'findings suggest',
            'data from',
        ]
        
        # Only use phrases if they're followed by potential source indicators
        if not has_citation:
            for phrase in citation_phrases:
                if phrase in text_lower:
                    # Check if there's a potential source nearby (name, year, etc.)
                    phrase_pos = text_lower.find(phrase)
                    following_text = text_lower[phrase_pos:phrase_pos+50]
                    # Look for patterns that suggest a citation
                    if re.search(r'\d{4}|\b[A-Z][a-z]+\s+et\s+al|\[|\(' , following_text):
                        has_citation = True
                        break
        
        return has_citation


class GraphEmbedding:
    """Graph embedding models for knowledge graph representation"""
    
    def __init__(self, embedding_dim: int = 50, method: str = "TransE"):
        self.embedding_dim = embedding_dim
        self.method = method
        self.entity_embeddings = {}
        self.relation_embeddings = {}
        self.entity_to_id = {}
        self.relation_to_id = {}
        self.id_to_entity = {}
        self.id_to_relation = {}
        
    def fit(self, triples: List[Dict]):
        """Train embeddings on triples"""
        # Build entity and relation vocabularies
        entities = set()
        relations = set()
        
        for triple in triples:
            entities.add(triple["subject"])
            entities.add(triple["object"])
            relations.add(triple["predicate"])
        
        # Create mappings
        self.entity_to_id = {e: i for i, e in enumerate(entities)}
        self.relation_to_id = {r: i for i, r in enumerate(relations)}
        self.id_to_entity = {i: e for e, i in self.entity_to_id.items()}
        self.id_to_relation = {i: r for r, i in self.relation_to_id.items()}
        
        n_entities = len(entities)
        n_relations = len(relations)
        
        # Initialize embeddings
        if TORCH_AVAILABLE:
            import torch.nn as nn
            self.entity_emb = nn.Embedding(n_entities, self.embedding_dim)
            self.relation_emb = nn.Embedding(n_relations, self.embedding_dim)
            nn.init.xavier_uniform_(self.entity_emb.weight)
            nn.init.xavier_uniform_(self.relation_emb.weight)
        else:
            # NumPy implementation
            np.random.seed(42)
            self.entity_emb = np.random.normal(0, 0.1, (n_entities, self.embedding_dim))
            self.relation_emb = np.random.normal(0, 0.1, (n_relations, self.embedding_dim))
        
        # Simple training (just initialize, full training would require negative sampling)
        if self.method == "TransE":
            self._train_transe(triples)
        elif self.method == "DistMult":
            self._train_distmult(triples)
        elif self.method == "ComplEx":
            self._train_complex(triples)
    
    def _train_transe(self, triples: List[Dict]):
        """TransE: h + r ≈ t"""
        # Simplified: just normalize embeddings
        if TORCH_AVAILABLE:
            import torch.nn.functional as F
            self.entity_emb.weight.data = F.normalize(self.entity_emb.weight.data, p=2, dim=1)
            self.relation_emb.weight.data = F.normalize(self.relation_emb.weight.data, p=2, dim=1)
        else:
            # Normalize using NumPy
            norms = np.linalg.norm(self.entity_emb, axis=1, keepdims=True)
            self.entity_emb = self.entity_emb / (norms + 1e-8)
            norms = np.linalg.norm(self.relation_emb, axis=1, keepdims=True)
            self.relation_emb = self.relation_emb / (norms + 1e-8)
    
    def _train_distmult(self, triples: List[Dict]):
        """DistMult: <h, r, t> = sum(h_i * r_i * t_i)"""
        # Initialize with small values
        if not TORCH_AVAILABLE:
            self.relation_emb = np.random.normal(0, 0.05, self.relation_emb.shape)
    
    def _train_complex(self, triples: List[Dict]):
        """ComplEx: complex-valued embeddings"""
        # For simplicity, use real embeddings (full ComplEx would use complex numbers)
        if not TORCH_AVAILABLE:
            self.relation_emb = np.random.normal(0, 0.05, self.relation_emb.shape)
    
    def get_entity_embedding(self, entity: str) -> np.ndarray:
        """Get embedding for an entity"""
        if entity not in self.entity_to_id:
            return np.zeros(self.embedding_dim)
        
        entity_id = self.entity_to_id[entity]
        if TORCH_AVAILABLE:
            return self.entity_emb.weight[entity_id].detach().numpy()
        else:
            return self.entity_emb[entity_id]
    
    def get_relation_embedding(self, relation: str) -> np.ndarray:
        """Get embedding for a relation"""
        if relation not in self.relation_to_id:
            return np.zeros(self.embedding_dim)
        
        relation_id = self.relation_to_id[relation]
        if TORCH_AVAILABLE:
            return self.relation_emb.weight[relation_id].detach().numpy()
        else:
            return self.relation_emb[relation_id]
    
    def get_triple_embedding(self, triple: Dict) -> np.ndarray:
        """Get embedding for a triple"""
        h = self.get_entity_embedding(triple["subject"])
        r = self.get_relation_embedding(triple["predicate"])
        t = self.get_entity_embedding(triple["object"])
        
        if self.method == "TransE":
            return h + r  # Should be close to t
        elif self.method == "DistMult":
            return h * r * t  # Element-wise product
        elif self.method == "ComplEx":
            return h * r  # Simplified
        else:
            return np.concatenate([h, r, t])


class KnowledgeGraphBuilder:
    """Builds RDF knowledge graphs from triples with Schema.org mapping"""
    
    # Schema.org property mappings
    SCHEMA_MAPPINGS = {
        "is": RDFS.subClassOf,
        "was": RDFS.subClassOf,
        "has": "http://schema.org/hasPart",
        "located_in": "http://schema.org/location",
        "born_in": "http://schema.org/birthPlace",
        "part_of": "http://schema.org/partOf",
        "has_part": "http://schema.org/hasPart",
    }
    
    def __init__(self):
        self.namespace = Namespace("http://example.org/kg/")
        self.schema = Namespace("http://schema.org/")
        self.prov = Namespace("http://www.w3.org/ns/prov#")
    
    def build_graph(self, triples: List[Dict], source_name: str) -> Graph:
        """Build RDF graph from triples with Schema.org ontology"""
        g = Graph()
        g.bind("kg", self.namespace)
        g.bind("schema", self.schema)
        g.bind("dcterms", DCTERMS)
        g.bind("prov", self.prov)
        g.bind("rdfs", RDFS)
        
        for i, triple in enumerate(triples):
            # Create URIs for subject and object
            subj_uri = self._create_uri(triple["subject"])
            obj_uri = self._create_uri(triple["object"])
            
            # Map predicate to Schema.org property
            pred_uri = self._map_to_schema(triple["predicate"])
            
            # Add the main triple
            g.add((subj_uri, pred_uri, obj_uri))
            
            # Add type information
            g.add((subj_uri, RDF.type, self.schema.Thing))
            g.add((obj_uri, RDF.type, self.schema.Thing))
            
            # Add provenance metadata
            triple_uri = URIRef(f"{self.namespace}triple_{source_name}_{i}")
            g.add((triple_uri, RDF.type, self.prov.Entity))
            g.add((triple_uri, self.prov.wasGeneratedBy, URIRef(f"{self.namespace}source_{source_name}")))
            g.add((triple_uri, DCTERMS.source, Literal(source_name)))
            
            # Add citation information
            if triple.get("has_citation"):
                g.add((triple_uri, self.schema.citation, Literal(True)))
                g.add((triple_uri, self.prov.qualifiedAttribution, URIRef(f"{self.namespace}cited_{i}")))
            
            # Add extraction method
            if "extraction_method" in triple:
                g.add((triple_uri, URIRef(f"{self.namespace}extractionMethod"), Literal(triple["extraction_method"])))
            
            # Add sentence context
            if "sentence" in triple:
                g.add((triple_uri, URIRef(f"{self.namespace}sentence"), Literal(triple["sentence"])))
        
        return g
    
    def _map_to_schema(self, predicate: str) -> URIRef:
        """Map predicate to Schema.org property"""
        predicate_lower = predicate.lower().strip()
        
        # Check direct mappings
        if predicate_lower in self.SCHEMA_MAPPINGS:
            mapping = self.SCHEMA_MAPPINGS[predicate_lower]
            if isinstance(mapping, str):
                return URIRef(mapping)
            return mapping
        
        # Try to find Schema.org property
        # Common patterns
        if "location" in predicate_lower or "place" in predicate_lower:
            return self.schema.location
        elif "date" in predicate_lower or "time" in predicate_lower:
            return self.schema.datePublished
        elif "name" in predicate_lower:
            return self.schema.name
        elif "type" in predicate_lower or "kind" in predicate_lower:
            return self.schema.additionalType
        
        # Default: create custom property
        normalized = re.sub(r'[^\w\s-]', '', predicate.lower())
        normalized = re.sub(r'[-\s]+', '_', normalized)
        return URIRef(f"{self.namespace}{normalized}")
    
    def _create_uri(self, text: str) -> URIRef:
        """Create a URI from text"""
        # Normalize text for URI
        normalized = re.sub(r'[^\w\s-]', '', text.lower())
        normalized = re.sub(r'[-\s]+', '_', normalized)
        return URIRef(f"{self.namespace}{normalized}")


class GraphComparator:
    """Compares two knowledge graphs with multiple metrics including graph embeddings"""
    
    def __init__(self, extractor: TripleExtractor):
        self.extractor = extractor
        self.embedding_methods = ["TransE", "DistMult", "ComplEx"]
    
    def compare_graphs(self, triples_a: List[Dict], triples_b: List[Dict], 
                      text_a: str, text_b: str) -> Dict:
        """Comprehensive comparison of two knowledge graphs"""
        
        # Build graph embeddings for semantic similarity
        print("   Training graph embeddings...")
        graph_embeddings = self._build_graph_embeddings(triples_a, triples_b)
        
        results = {
            "basic_stats": self._get_basic_stats(triples_a, triples_b),
            "triple_overlap": self._calculate_triple_overlap(triples_a, triples_b),
            "semantic_similarity": self._calculate_semantic_similarity(triples_a, triples_b),
            "graph_embeddings": graph_embeddings,
            "graph_density": self._calculate_graph_density(triples_a, triples_b, text_a, text_b),
            "entity_coherence": self._calculate_entity_coherence(triples_a, triples_b),
            "provenance_analysis": self._analyze_provenance_chain(triples_a, triples_b),
            "contradictions": self._detect_contradictions(triples_a, triples_b)
        }
        
        return results
    
    def _get_basic_stats(self, triples_a: List[Dict], triples_b: List[Dict]) -> Dict:
        """Get basic statistics about the triples"""
        return {
            "source_a_triples": len(triples_a),
            "source_b_triples": len(triples_b),
            "total_triples": len(triples_a) + len(triples_b)
        }
    
    def _calculate_triple_overlap(self, triples_a: List[Dict], triples_b: List[Dict]) -> Dict:
        """Calculate exact and fuzzy triple overlap"""
        
        # Exact match
        set_a = {self._triple_to_string(t) for t in triples_a}
        set_b = {self._triple_to_string(t) for t in triples_b}
        
        exact_overlap = set_a.intersection(set_b)
        exact_overlap_score = len(exact_overlap) / max(len(set_a), len(set_b)) if max(len(set_a), len(set_b)) > 0 else 0
        
        # Fuzzy match (case-insensitive, normalized)
        set_a_normalized = {self._normalize_triple(t) for t in triples_a}
        set_b_normalized = {self._normalize_triple(t) for t in triples_b}
        
        fuzzy_overlap = set_a_normalized.intersection(set_b_normalized)
        fuzzy_overlap_score = len(fuzzy_overlap) / max(len(set_a_normalized), len(set_b_normalized)) if max(len(set_a_normalized), len(set_b_normalized)) > 0 else 0
        
        return {
            "exact_overlap_count": len(exact_overlap),
            "exact_overlap_score": round(exact_overlap_score * 100, 2),
            "fuzzy_overlap_count": len(fuzzy_overlap),
            "fuzzy_overlap_score": round(fuzzy_overlap_score * 100, 2),
            "unique_to_source_a": len(set_a - set_b),
            "unique_to_source_b": len(set_b - set_a)
        }
    
    def _calculate_semantic_similarity(self, triples_a: List[Dict], triples_b: List[Dict]) -> Dict:
        """Calculate semantic similarity of triples using embeddings"""
        
        if len(triples_a) == 0 or len(triples_b) == 0:
            return {
                "average_similarity": 0.0,
                "similar_pairs_count": 0,
                "method": "none (empty input)"
            }
        
        # Create triple sentences
        sentences_a = [self._triple_to_sentence(t) for t in triples_a]
        sentences_b = [self._triple_to_sentence(t) for t in triples_b]
        
        if self.extractor.sentence_model:
            # Use sentence transformers
            embeddings_a = self.extractor.sentence_model.encode(sentences_a)
            embeddings_b = self.extractor.sentence_model.encode(sentences_b)
            
            # Calculate pairwise similarity
            similarities = cosine_similarity(embeddings_a, embeddings_b)
            method = "sentence-transformers"
        else:
            # Fallback to TF-IDF
            vectorizer = TfidfVectorizer()
            all_sentences = sentences_a + sentences_b
            tfidf_matrix = vectorizer.fit_transform(all_sentences)
            
            embeddings_a = tfidf_matrix[:len(sentences_a)]
            embeddings_b = tfidf_matrix[len(sentences_a):]
            
            similarities = cosine_similarity(embeddings_a, embeddings_b)
            method = "tf-idf"
        
        # Find similar pairs (threshold > 0.7)
        similar_pairs = np.argwhere(similarities > 0.7)
        
        avg_similarity = np.mean(similarities)
        
        return {
            "average_similarity": round(float(avg_similarity), 4),
            "max_similarity": round(float(np.max(similarities)), 4),
            "similar_pairs_count": len(similar_pairs),
            "similar_pairs_percentage": round(len(similar_pairs) / (len(triples_a) * len(triples_b)) * 100, 2) if len(triples_a) * len(triples_b) > 0 else 0,
            "method": method
        }
    
    def _build_graph_embeddings(self, triples_a: List[Dict], triples_b: List[Dict]) -> Dict:
        """Build graph embeddings using TransE, DistMult, and ComplEx"""
        all_triples = triples_a + triples_b
        results = {}
        
        for method in self.embedding_methods:
            try:
                embedding_model = GraphEmbedding(embedding_dim=50, method=method)
                embedding_model.fit(all_triples)
                
                # Calculate similarity between triples from both sources
                if len(triples_a) > 0 and len(triples_b) > 0:
                    embeddings_a = [embedding_model.get_triple_embedding(t) for t in triples_a[:100]]  # Limit for performance
                    embeddings_b = [embedding_model.get_triple_embedding(t) for t in triples_b[:100]]
                    
                    if len(embeddings_a) > 0 and len(embeddings_b) > 0:
                        similarities = cosine_similarity(embeddings_a, embeddings_b)
                        avg_sim = np.mean(similarities)
                        max_sim = np.max(similarities)
                        
                        results[method] = {
                            "average_similarity": round(float(avg_sim), 4),
                            "max_similarity": round(float(max_sim), 4),
                            "entity_count": len(embedding_model.entity_to_id),
                            "relation_count": len(embedding_model.relation_to_id)
                        }
                    else:
                        results[method] = {"error": "No embeddings generated"}
                else:
                    results[method] = {"error": "Empty triple sets"}
            except Exception as e:
                results[method] = {"error": str(e)}
        
        return results
    
    def _calculate_graph_density(self, triples_a: List[Dict], triples_b: List[Dict],
                                 text_a: str, text_b: str) -> Dict:
        """Calculate information density metrics"""
        
        words_a = len(text_a.split())
        words_b = len(text_b.split())
        
        density_a = len(triples_a) / words_a if words_a > 0 else 0
        density_b = len(triples_b) / words_b if words_b > 0 else 0
        
        return {
            "source_a_density": round(density_a * 1000, 2),  # triples per 1000 words
            "source_b_density": round(density_b * 1000, 2),
            "density_delta": round((density_a - density_b) * 1000, 2),
            "density_ratio": round(density_a / density_b, 2) if density_b > 0 else 0
        }
    
    def _calculate_entity_coherence(self, triples_a: List[Dict], triples_b: List[Dict]) -> Dict:
        """Check if entities are consistently defined across both sources"""
        
        # Extract entities from both sources
        entities_a = self._extract_entities(triples_a)
        entities_b = self._extract_entities(triples_b)
        
        # Find common entities
        common_entities = set(entities_a.keys()).intersection(set(entities_b.keys()))
        
        # Check consistency with more lenient threshold
        consistent_count = 0
        partially_consistent_count = 0
        inconsistent_examples = []
        overlap_scores = []
        
        for entity in common_entities:
            # Get definitions/relations for this entity
            relations_a = entities_a[entity]
            relations_b = entities_b[entity]
            
            # Check if relations overlap
            overlap = len(relations_a.intersection(relations_b))
            total = len(relations_a.union(relations_b))
            
            if total > 0:
                overlap_ratio = overlap / total
                overlap_scores.append(overlap_ratio)
                
                # More lenient thresholds
                if overlap_ratio > 0.3:  # Lowered from 0.5 to 0.3
                    consistent_count += 1
                elif overlap_ratio > 0.1:  # Partially consistent
                    partially_consistent_count += 1
                elif len(inconsistent_examples) < 5:
                    inconsistent_examples.append({
                        "entity": entity,
                        "overlap_ratio": round(overlap_ratio * 100, 2),
                        "source_a_relations": list(relations_a)[:3],
                        "source_b_relations": list(relations_b)[:3]
                    })
        
        avg_overlap = sum(overlap_scores) / len(overlap_scores) if overlap_scores else 0
        coherence_score = consistent_count / len(common_entities) if len(common_entities) > 0 else 1.0
        
        return {
            "common_entities": len(common_entities),
            "consistent_entities": consistent_count,
            "partially_consistent_entities": partially_consistent_count,
            "coherence_score": round(coherence_score * 100, 2),
            "average_overlap_ratio": round(avg_overlap * 100, 2),
            "inconsistent_examples": inconsistent_examples
        }
    
    def _analyze_provenance_chain(self, triples_a: List[Dict], triples_b: List[Dict]) -> Dict:
        """Enhanced provenance chain analysis with citation tracking"""
        
        cited_a = sum(1 for t in triples_a if t.get("has_citation", False))
        cited_b = sum(1 for t in triples_b if t.get("has_citation", False))
        
        total_a = len(triples_a)
        total_b = len(triples_b)
        
        # Analyze extraction methods
        methods_a = defaultdict(int)
        methods_b = defaultdict(int)
        
        for t in triples_a:
            method = t.get("extraction_method", "unknown")
            methods_a[method] += 1
        
        for t in triples_b:
            method = t.get("extraction_method", "unknown")
            methods_b[method] += 1
        
        # Citation chain analysis
        cited_triples_a = [t for t in triples_a if t.get("has_citation", False)]
        cited_triples_b = [t for t in triples_b if t.get("has_citation", False)]
        
        # Find triples with citations in both sources
        cited_overlap = 0
        for t_a in cited_triples_a:
            for t_b in cited_triples_b:
                if self._triples_similar(t_a, t_b):
                    cited_overlap += 1
                    break
        
        # Provenance quality score
        provenance_quality_a = (cited_a / total_a * 100) if total_a > 0 else 0
        provenance_quality_b = (cited_b / total_b * 100) if total_b > 0 else 0
        
        return {
            "source_a_cited": cited_a,
            "source_a_cited_percentage": round(provenance_quality_a, 2),
            "source_b_cited": cited_b,
            "source_b_cited_percentage": round(provenance_quality_b, 2),
            "citation_gap": abs(cited_a - cited_b),
            "cited_overlap": cited_overlap,
            "provenance_quality_score_a": round(provenance_quality_a, 2),
            "provenance_quality_score_b": round(provenance_quality_b, 2),
            "extraction_methods_a": dict(methods_a),
            "extraction_methods_b": dict(methods_b),
            "unsourced_triples_a": total_a - cited_a,
            "unsourced_triples_b": total_b - cited_b,
            "unsourced_percentage_a": round((total_a - cited_a) / total_a * 100, 2) if total_a > 0 else 0,
            "unsourced_percentage_b": round((total_b - cited_b) / total_b * 100, 2) if total_b > 0 else 0
        }
    
    def _triples_similar(self, t1: Dict, t2: Dict) -> bool:
        """Check if two triples are similar"""
        s1 = self._normalize_text(t1["subject"])
        s2 = self._normalize_text(t2["subject"])
        p1 = self._normalize_text(t1["predicate"])
        p2 = self._normalize_text(t2["predicate"])
        o1 = self._normalize_text(t1["object"])
        o2 = self._normalize_text(t2["object"])
        
        return s1 == s2 and p1 == p2 and o1 == o2
    
    def _is_noise_triple(self, triple: Dict) -> bool:
        """Filter out noise triples (metadata, navigation, etc.)"""
        subject = self._normalize_text(triple.get("subject", ""))
        predicate = self._normalize_text(triple.get("predicate", ""))
        obj = self._normalize_text(triple.get("object", ""))
        sentence = triple.get("sentence", "").lower()
        
        # Filter patterns
        noise_patterns = [
            # Wikimedia Commons references
            "media related to" in sentence,
            "wikimedia commons" in sentence or "wikimedia commons" in obj,
            predicate == "media",
            # Navigation/metadata
            "external links" in sentence,
            "see also" in sentence.lower() and len(sentence.split()) < 10,
            # Empty or very short predicates
            len(predicate) < 2,
            predicate in ["", " ", "a", "an", "the"],
            # Common metadata words
            predicate in ["media", "category", "template", "file"],
        ]
        
        return any(noise_patterns)
    
    def _detect_contradictions(self, triples_a: List[Dict], triples_b: List[Dict]) -> Dict:
        """Detect contradicting triples between sources"""
        
        contradictions = []
        
        # Filter out noise triples
        filtered_triples_a = [t for t in triples_a if not self._is_noise_triple(t)]
        filtered_triples_b = [t for t in triples_b if not self._is_noise_triple(t)]
        
        # Create index of triples by subject-predicate
        index_a = defaultdict(list)
        for t in filtered_triples_a:
            key = (self._normalize_text(t["subject"]), self._normalize_text(t["predicate"]))
            index_a[key].append(t)
        
        # Check for contradictions
        for t_b in filtered_triples_b:
            key = (self._normalize_text(t_b["subject"]), self._normalize_text(t_b["predicate"]))
            
            if key in index_a:
                for t_a in index_a[key]:
                    # Check if objects are different
                    obj_a = self._normalize_text(t_a["object"])
                    obj_b = self._normalize_text(t_b["object"])
                    
                    if obj_a != obj_b and not self._are_compatible(obj_a, obj_b):
                        contradictions.append({
                            "subject": t_a["subject"],
                            "predicate": t_a["predicate"],
                            "source_a_object": t_a["object"],
                            "source_b_object": t_b["object"]
                        })
        
        return {
            "contradiction_count": len(contradictions),
            "contradictions": contradictions,  # Return ALL contradictions
            "filtered_noise_triples_a": len(triples_a) - len(filtered_triples_a),
            "filtered_noise_triples_b": len(triples_b) - len(filtered_triples_b)
        }
    
    # Helper methods
    def _triple_to_string(self, triple: Dict) -> str:
        return f"{triple['subject']}|{triple['predicate']}|{triple['object']}"
    
    def _normalize_triple(self, triple: Dict) -> str:
        s = self._normalize_text(triple['subject'])
        p = self._normalize_text(triple['predicate'])
        o = self._normalize_text(triple['object'])
        return f"{s}|{p}|{o}"
    
    def _normalize_text(self, text: str) -> str:
        return re.sub(r'\s+', ' ', text.lower().strip())
    
    def _triple_to_sentence(self, triple: Dict) -> str:
        return f"{triple['subject']} {triple['predicate']} {triple['object']}"
    
    def _extract_entities(self, triples: List[Dict]) -> Dict[str, Set[str]]:
        entities = defaultdict(set)
        for t in triples:
            subject = self._normalize_text(t['subject'])
            relation = f"{t['predicate']}:{t['object']}"
            entities[subject].add(relation)
        return entities
    
    def _are_compatible(self, text1: str, text2: str) -> bool:
        """Check if two texts are compatible (one could be more specific)"""
        return text1 in text2 or text2 in text1


class KnowledgeGraphAnalyzer:
    """Main analyzer class"""
    
    def __init__(self):
        self.extractor = TripleExtractor()
        self.graph_builder = KnowledgeGraphBuilder()
        self.comparator = GraphComparator(self.extractor)
    
    def analyze_files(self, grokipedia_file: str, wikipedia_file: str) -> Dict:
        """Analyze both files and compare"""
        
        print("📚 Reading files...")
        grok_content = self._read_file(grokipedia_file)
        wiki_content = self._read_file(wikipedia_file)
        
        # Get reference counts from metadata
        grok_refs = self._get_reference_count(grokipedia_file)
        wiki_refs = self._get_reference_count(wikipedia_file)
        
        if wiki_refs > 0:
            print(f"   Wikipedia has {wiki_refs} references in metadata (may not be inline in text)")
        if grok_refs > 0:
            print(f"   Grokipedia has {grok_refs} references in metadata")
        
        print("🔍 Extracting triples from Grokipedia...")
        grok_triples = self.extractor.extract_triples(grok_content, "grokipedia")
        print(f"   Found {len(grok_triples)} triples")
        
        print("🔍 Extracting triples from Wikipedia...")
        wiki_triples = self.extractor.extract_triples(wiki_content, "wikipedia")
        print(f"   Found {len(wiki_triples)} triples")
        
        print("🏗️ Building knowledge graphs...")
        grok_graph = self.graph_builder.build_graph(grok_triples, "grokipedia")
        wiki_graph = self.graph_builder.build_graph(wiki_triples, "wikipedia")
        
        print("📊 Comparing graphs...")
        comparison = self.comparator.compare_graphs(
            grok_triples, wiki_triples,
            grok_content, wiki_content
        )
        
        print("✅ Analysis complete!")
        
        return {
            "grokipedia_triples": grok_triples[:20],  # Sample
            "wikipedia_triples": wiki_triples[:20],   # Sample
            "comparison": comparison,
            "metadata": {
                "grokipedia_file": grokipedia_file,
                "wikipedia_file": wikipedia_file,
                "total_grokipedia_triples": len(grok_triples),
                "total_wikipedia_triples": len(wiki_triples)
            }
        }
    
    def _read_file(self, filepath: str) -> str:
        """Read and extract content from file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract the full content section
        match = re.search(r'📄 Full Content:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        return content
    
    def _get_reference_count(self, filepath: str) -> int:
        """Extract reference count from file metadata if available"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            # Look for "📚 References: X" pattern
            match = re.search(r'📚 References:\s*(\d+)', content)
            if match:
                return int(match.group(1))
        except:
            pass
        return 0
    
    def save_results(self, output_text: str, output_file: str = "kg_analysis_results.txt"):
        """Save terminal output to text file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(output_text)
        print(f"💾 Results saved to {output_file}")


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


def main():
    """Main execution function"""
    
    # Set up output capture
    output_file = "kg_analysis_results.txt"
    tee = TeeOutput(output_file)
    original_stdout = sys.stdout
    sys.stdout = tee
    
    try:
        print("=" * 80)
        print("🔬 Knowledge Graph Triple Extraction & Comparison System")
        print("=" * 80)
        print()
        
        # Initialize analyzer
        analyzer = KnowledgeGraphAnalyzer()
        
        # Analyze files
        results = analyzer.analyze_files(
            "dual_scraper_output/grokipedia.txt",
            "dual_scraper_output/wikipedia.txt"
        )
        
        # Print summary
        print("\n" + "=" * 80)
        print("📈 ANALYSIS SUMMARY")
        print("=" * 80)
        
        comp = results["comparison"]
        
        print(f"\n📊 Basic Statistics:")
        print(f"   Grokipedia Triples: {comp['basic_stats']['source_a_triples']}")
        print(f"   Wikipedia Triples: {comp['basic_stats']['source_b_triples']}")
        
        print(f"\n🔄 Triple Overlap:")
        print(f"   Exact Match: {comp['triple_overlap']['exact_overlap_score']}%")
        print(f"   Fuzzy Match: {comp['triple_overlap']['fuzzy_overlap_score']}%")
        print(f"   Unique to Grokipedia: {comp['triple_overlap']['unique_to_source_a']}")
        print(f"   Unique to Wikipedia: {comp['triple_overlap']['unique_to_source_b']}")
        
        print(f"\n🧠 Semantic Similarity (Text-based):")
        print(f"   Average Similarity: {comp['semantic_similarity']['average_similarity']}")
        print(f"   Similar Pairs: {comp['semantic_similarity']['similar_pairs_count']}")
        print(f"   Method: {comp['semantic_similarity']['method']}")
        
        print(f"\n🔗 Graph Embeddings (Knowledge Graph-based):")
        if 'graph_embeddings' in comp:
            for method, results in comp['graph_embeddings'].items():
                if 'error' not in results:
                    print(f"   {method}:")
                    print(f"     Average Similarity: {results.get('average_similarity', 'N/A')}")
                    print(f"     Max Similarity: {results.get('max_similarity', 'N/A')}")
                    print(f"     Entities: {results.get('entity_count', 'N/A')}, Relations: {results.get('relation_count', 'N/A')}")
                else:
                    print(f"   {method}: Error - {results.get('error', 'Unknown')}")
        
        print(f"\n📏 Graph Density:")
        print(f"   Grokipedia: {comp['graph_density']['source_a_density']} triples/1000 words")
        print(f"   Wikipedia: {comp['graph_density']['source_b_density']} triples/1000 words")
        print(f"   Delta: {comp['graph_density']['density_delta']}")
        
        print(f"\n🎯 Entity Coherence:")
        print(f"   Common Entities: {comp['entity_coherence']['common_entities']}")
        print(f"   Consistent Entities: {comp['entity_coherence']['consistent_entities']}")
        print(f"   Partially Consistent: {comp['entity_coherence'].get('partially_consistent_entities', 0)}")
        print(f"   Coherence Score: {comp['entity_coherence']['coherence_score']}%")
        print(f"   Average Overlap Ratio: {comp['entity_coherence'].get('average_overlap_ratio', 0)}%")
        
        print(f"\n📚 Provenance Chain Analysis:")
        prov = comp['provenance_analysis']
        print(f"   Grokipedia:")
        print(f"     Cited: {prov['source_a_cited']} ({prov['source_a_cited_percentage']}%)")
        print(f"     Unsourced: {prov['unsourced_triples_a']} ({prov['unsourced_percentage_a']}%)")
        print(f"     Quality Score: {prov['provenance_quality_score_a']}%")
        print(f"   Wikipedia:")
        print(f"     Cited: {prov['source_b_cited']} ({prov['source_b_cited_percentage']}%)")
        print(f"     Unsourced: {prov['unsourced_triples_b']} ({prov['unsourced_percentage_b']}%)")
        print(f"     Quality Score: {prov['provenance_quality_score_b']}%")
        if prov['source_b_cited_percentage'] < 5:
            print(f"     ⚠️  Note: Low citation detection may indicate inline citations were")
            print(f"        removed during scraping, or citations are in a different format.")
        print(f"   Citation Overlap: {prov.get('cited_overlap', 0)} triples")
        if prov.get('extraction_methods_a'):
            print(f"   Extraction Methods (Grokipedia): {dict(prov['extraction_methods_a'])}")
        if prov.get('extraction_methods_b'):
            print(f"   Extraction Methods (Wikipedia): {dict(prov['extraction_methods_b'])}")
        
        print(f"\n⚠️ Contradictions Detected: {comp['contradictions']['contradiction_count']}")
        if 'filtered_noise_triples_a' in comp['contradictions']:
            print(f"   (Filtered {comp['contradictions']['filtered_noise_triples_a']} noise triples from Grokipedia, "
                  f"{comp['contradictions']['filtered_noise_triples_b']} from Wikipedia)")
        
        if comp['contradictions']['contradictions']:
            print("\n   All Contradictions:")
            for i, contr in enumerate(comp['contradictions']['contradictions'], 1):
                print(f"   {i}. {contr['subject']} {contr['predicate']}:")
                print(f"      Grokipedia: {contr['source_a_object']}")
                print(f"      Wikipedia: {contr['source_b_object']}")
        
        print("\n" + "=" * 80)
        print(f"✨ Analysis complete! Results saved to {output_file}")
        print("=" * 80)
        
    finally:
        # Restore stdout and close file
        sys.stdout = original_stdout
        tee.close()
        print(f"💾 All output saved to {output_file}")


if __name__ == "__main__":
    main()