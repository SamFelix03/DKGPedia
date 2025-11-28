# 1. Knowledge Graph Triple Extraction & Comparison System

## 1.1 Overview

This system extracts semantic triples (subject-predicate-object relationships) from text documents, builds RDF knowledge graphs, and performs comprehensive comparisons between two knowledge sources (typically Grokipedia vs Wikipedia). It uses multiple NLP techniques, graph embeddings, and similarity metrics to analyze and compare the semantic content of documents.

## 1.2 What This Code Does

The `triple.py` module implements a complete pipeline that:

1. **Extracts Semantic Triples**: Parses text documents to extract structured knowledge in the form of (subject, predicate, object) triples using multiple extraction methods
2. **Builds Knowledge Graphs**: Converts extracted triples into RDF (Resource Description Framework) graphs with Schema.org ontology mappings
3. **Generates Graph Embeddings**: Creates vector representations of entities and relations using TransE, DistMult, and ComplEx algorithms
4. **Compares Knowledge Graphs**: Performs multi-dimensional comparison between two knowledge graphs including:
   - Exact and fuzzy triple overlap
   - Semantic similarity using sentence transformers or TF-IDF
   - Graph embedding similarity
   - Information density analysis
   - Entity coherence checking
   - Provenance and citation analysis
   - Contradiction detection

## 1.3 Components

### 1.3.1 TripleExtractor
**Purpose**: Extracts semantic triples from raw text using NLP techniques.

**Key Features**:
- Loads spaCy models (en_core_web_lg/md/sm) with automatic fallback and download
- Uses 4 extraction methods:
  - **Dependency Parsing**: Extracts Subject-Verb-Object patterns from dependency trees
  - **OpenIE Patterns**: Regex-based extraction for common patterns ("X is Y", "X has Y", "X located in Y", etc.)
  - **Entity Relations**: Extracts relationships between named entities (PERSON, ORG, GPE, etc.)
  - **Nominal Relations**: Handles noun-noun and prepositional phrase relationships ("X of Y")
- Detects citations using comprehensive pattern matching (brackets, years, "et al.", etc.)
- Optionally uses SentenceTransformer for semantic embeddings (falls back to TF-IDF)

**Output**: List of dictionaries, each containing:
```python
{
    "subject": str,
    "predicate": str,
    "object": str,
    "source": str,              # "grokipedia" or "wikipedia"
    "sentence": str,            # Original sentence context
    "has_citation": bool,       # Whether citation markers detected
    "extraction_method": str    # "dependency_parsing", "openie_pattern", etc.
}
```

### 1.3.2 GraphEmbedding
**Purpose**: Creates vector embeddings for knowledge graph entities and relations.

**Key Features**:
- Supports three embedding methods:
  - **TransE**: `h + r ≈ t` (translational model)
  - **DistMult**: Element-wise product `h * r * t`
  - **ComplEx**: Complex-valued embeddings (simplified implementation)
- Uses PyTorch if available, otherwise NumPy
- Creates embeddings for both entities (subjects/objects) and relations (predicates)
- Generates triple embeddings by combining entity and relation embeddings

**Output**: Embedding vectors (50-dimensional by default) for entities, relations, and complete triples.

### 1.3.3 KnowledgeGraphBuilder
**Purpose**: Converts triples into RDF knowledge graphs with semantic web standards.

**Key Features**:
- Maps predicates to Schema.org properties (e.g., "is" → `rdfs:subClassOf`, "has" → `schema:hasPart`)
- Creates URIs for entities using normalized text
- Adds provenance metadata using PROV-O ontology
- Includes citation information and extraction methods
- Binds multiple namespaces (Schema.org, DCTERMS, PROV, RDFS)

**Output**: RDFLib Graph objects containing structured triples with full metadata.

### 1.3.4 GraphComparator
**Purpose**: Performs comprehensive comparison between two knowledge graphs.

**Comparison Metrics**:

1. **Basic Statistics**: Triple counts for each source
2. **Triple Overlap**: 
   - Exact match (case-sensitive string comparison)
   - Fuzzy match (normalized, case-insensitive)
   - Unique triples per source
3. **Semantic Similarity**: 
   - Uses SentenceTransformer embeddings (if available) or TF-IDF
   - Calculates cosine similarity between all triple pairs
   - Identifies similar pairs (threshold > 0.7)
4. **Graph Embeddings**: 
   - Trains TransE, DistMult, and ComplEx models
   - Calculates similarity between triple embeddings from both sources
5. **Graph Density**: 
   - Triples per 1000 words
   - Density ratio and delta between sources
6. **Entity Coherence**: 
   - Finds common entities across sources
   - Checks if entities have consistent relations
   - Calculates overlap ratios and coherence scores
7. **Provenance Analysis**: 
   - Citation percentages for each source
   - Extraction method distribution
   - Citation overlap between sources
   - Unsourced triple counts
8. **Contradiction Detection**: 
   - Finds triples with same subject-predicate but different objects
   - Filters noise triples (metadata, navigation links, etc.)
   - Returns all contradictions with examples

**Output**: Dictionary containing all comparison metrics.

### 1.3.5 KnowledgeGraphAnalyzer
**Purpose**: Main orchestrator class that coordinates the entire pipeline.

**Workflow**:
1. Reads input files (Grokipedia and Wikipedia text files)
2. Extracts reference counts from metadata
3. Extracts triples from both sources
4. Builds RDF knowledge graphs
5. Performs comprehensive comparison
6. Returns structured results

**Output**: Dictionary with:
- Sample triples from both sources (first 20)
- Complete comparison results
- Metadata (file paths, triple counts)

### 1.3.6 TeeOutput
**Purpose**: Utility class to capture stdout and write to both console and file simultaneously.

## 1.4 Output Structure

When executed, the system produces:

### Programmatic Output (Return Value):
```python
{
    "grokipedia_triples": [List of 20 sample triples],
    "wikipedia_triples": [List of 20 sample triples],
    "comparison": {
        "basic_stats": {...},
        "triple_overlap": {...},
        "semantic_similarity": {...},
        "graph_embeddings": {
            "TransE": {...},
            "DistMult": {...},
            "ComplEx": {...}
        },
        "graph_density": {...},
        "entity_coherence": {...},
        "provenance_analysis": {...},
        "contradictions": {
            "contradiction_count": int,
            "contradictions": [List of all contradictions],
            "filtered_noise_triples_a": int,
            "filtered_noise_triples_b": int
        }
    },
    "metadata": {
        "grokipedia_file": str,
        "wikipedia_file": str,
        "total_grokipedia_triples": int,
        "total_wikipedia_triples": int
    }
}
```

## 1.5 System Architecture Diagram

```mermaid
graph TB
    Start([Start: main function]) --> Init[Initialize KnowledgeGraphAnalyzer]
    Init --> TE[Create TripleExtractor]
    Init --> GB[Create KnowledgeGraphBuilder]
    Init --> GC[Create GraphComparator]
    
    TE --> LoadSpaCy[Load spaCy Model<br/>en_core_web_lg/md/sm]
    LoadSpaCy --> LoadST{Load SentenceTransformer?}
    LoadST -->|Yes| STModel[Load all-MiniLM-L6-v2]
    LoadST -->|No| TFIDF[Use TF-IDF Fallback]
    
    Start --> ReadFiles[Read Input Files<br/>grokipedia.txt & wikipedia.txt]
    ReadFiles --> ExtractGrok[Extract Triples from Grokipedia]
    ReadFiles --> ExtractWiki[Extract Triples from Wikipedia]
    
    ExtractGrok --> ExtractMethods[Apply 4 Extraction Methods]
    ExtractWiki --> ExtractMethods
    
    ExtractMethods --> DepParse[Dependency Parsing<br/>Subject-Verb-Object]
    ExtractMethods --> OpenIE[OpenIE Patterns<br/>X is Y, X has Y, etc.]
    ExtractMethods --> EntityRel[Entity Relations<br/>Named Entity Pairs]
    ExtractMethods --> NominalRel[Nominal Relations<br/>X of Y patterns]
    
    DepParse --> CheckCitation[Check for Citations]
    OpenIE --> CheckCitation
    EntityRel --> CheckCitation
    NominalRel --> CheckCitation
    
    CheckCitation --> TriplesGrok[List of Grokipedia Triples]
    CheckCitation --> TriplesWiki[List of Wikipedia Triples]
    
    TriplesGrok --> BuildGraphGrok[Build RDF Graph<br/>with Schema.org mapping]
    TriplesWiki --> BuildGraphWiki[Build RDF Graph<br/>with Schema.org mapping]
    
    BuildGraphGrok --> MapSchema[Map Predicates to Schema.org]
    BuildGraphWiki --> MapSchema
    MapSchema --> AddProvenance[Add Provenance Metadata<br/>PROV-O ontology]
    AddProvenance --> RDFGraphGrok[RDF Graph: Grokipedia]
    AddProvenance --> RDFGraphWiki[RDF Graph: Wikipedia]
    
    RDFGraphGrok --> Compare[Compare Graphs]
    RDFGraphWiki --> Compare
    
    Compare --> BasicStats[Calculate Basic Statistics]
    Compare --> TripleOverlap[Calculate Triple Overlap<br/>Exact & Fuzzy]
    Compare --> SemanticSim[Calculate Semantic Similarity<br/>SentenceTransformer/TF-IDF]
    Compare --> GraphEmbed[Build Graph Embeddings<br/>TransE, DistMult, ComplEx]
    Compare --> GraphDensity[Calculate Graph Density<br/>triples/1000 words]
    Compare --> EntityCoherence[Check Entity Coherence<br/>Consistent relations?]
    Compare --> Provenance[Analyze Provenance Chain<br/>Citations & Methods]
    Compare --> Contradictions[Detect Contradictions<br/>Filter noise]
    
    GraphEmbed --> TrainTransE[Train TransE Model<br/>h + r ≈ t]
    GraphEmbed --> TrainDistMult[Train DistMult Model<br/>h * r * t]
    GraphEmbed --> TrainComplEx[Train ComplEx Model<br/>Complex embeddings]
    
    TrainTransE --> EmbedSimilarity[Calculate Embedding Similarity]
    TrainDistMult --> EmbedSimilarity
    TrainComplEx --> EmbedSimilarity
    
    BasicStats --> Results[Compile Results Dictionary]
    TripleOverlap --> Results
    SemanticSim --> Results
    EmbedSimilarity --> Results
    GraphDensity --> Results
    EntityCoherence --> Results
    Provenance --> Results
    Contradictions --> Results
    
    Results --> PrintSummary[Print Analysis Summary<br/>to Console & File]
    PrintSummary --> SaveOutput[Save to kg_analysis_results.txt]
    SaveOutput --> End([End])
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style Compare fill:#fff4e1
    style Results fill:#e8f5e9
    style ExtractMethods fill:#f3e5f5
    style GraphEmbed fill:#f3e5f5
```

## 1.6 Key Dependencies

- **spaCy**: NLP library for dependency parsing and named entity recognition
- **rdflib**: RDF graph construction and manipulation
- **sentence-transformers** (optional): Semantic embeddings
- **scikit-learn**: TF-IDF vectorization and cosine similarity
- **numpy**: Numerical operations
- **PyTorch** (optional): Deep learning for graph embeddings

---

# 2. Semantic Drift Detection System

## 2.1 Overview

This system detects semantic differences and drift between two text sources (typically Grokipedia vs Wikipedia) using multiple embedding methods, topic modeling, and knowledge graph analysis. It measures how much the semantic content diverges between sources using sentence-level embeddings, cross-encoders, knowledge graph embeddings, and topic modeling techniques.

## 2.2 What This Code Does

The `semanticdrift.py` module implements a comprehensive semantic drift detection pipeline that:

1. **Splits Documents into Sections**: Intelligently parses text documents into sections using multiple heuristics (Wikipedia-style headers, Grokipedia-style separators, plain text headings)
2. **Generates Multiple Embeddings**: Creates semantic embeddings using:
   - Sentence-level transformers (SentenceTransformer)
   - Cross-encoder models for accurate similarity scoring
   - Knowledge graph embeddings (TransE, DistMult, ComplEx)
3. **Performs Topic Modeling**: Analyzes topic distributions using BERTopic, Gensim LDA, or sklearn LDA with automatic fallback
4. **Calculates Semantic Drift**: Computes overall drift scores combining multiple metrics:
   - Sentence embedding similarity
   - Cross-encoder similarity
   - Knowledge graph entity similarity
   - Topic divergence
5. **Analyzes Claim Alignment**: Measures claim-level alignment between sources using exact and semantic matching
6. **Generates Visualizations**: Creates similarity heatmaps and embedding space visualizations (t-SNE/UMAP)

## 2.3 Components

### 2.3.1 SemanticDriftDetector
**Purpose**: Main class that orchestrates semantic drift detection between two text sources.

**Key Features**:
- Automatically installs missing dependencies (sentence-transformers, umap-learn, bertopic, gensim)
- Initializes multiple embedding models with fallback options:
  - SentenceTransformer (`all-MiniLM-L6-v2`) for sentence embeddings
  - CrossEncoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) for accurate similarity
  - BERTopic for topic modeling (with LDA fallbacks)
- Integrates with `triple.py` components (TripleExtractor, KnowledgeGraphBuilder, GraphEmbedding)
- Splits documents into sections using intelligent heuristics
- Generates multiple types of embeddings and similarity metrics
- Calculates overall semantic drift scores
- Produces visualization outputs

**Output**: Dictionary containing:
```python
{
    "topic_modeling": {
        "method": str,              # "BERTopic", "Gensim LDA", "sklearn LDA", or "none"
        "topics": List,             # Topic assignments or distributions
        "grokipedia_topics": List,  # Topics for Grokipedia sections
        "wikipedia_topics": List,   # Topics for Wikipedia sections
        "topic_divergence": float,  # Measure of topic difference
        "topic_count": int          # Number of topics found
    },
    "semantic_drift_score": {
        "overall_drift_score": float,      # Overall drift (0-1)
        "drift_percentage": float,         # Drift as percentage
        "component_scores": {
            "sentence_embedding_drift": float,
            "cross_encoder_drift": float,
            "kg_embedding_drift": float,
            "topic_drift": float
        },
        "interpretation": str              # Human-readable interpretation
    },
    "claim_alignment": {
        "total_claims_grokipedia": int,
        "total_claims_wikipedia": int,
        "exact_matches": int,
        "semantic_matches": int,
        "total_aligned_claims": int,
        "alignment_percentage": float
    },
    "visualization": {
        "sentence_embeddings_grok": List[List[float]],
        "sentence_embeddings_wiki": List[List[float]],
        "section_titles_grok": List[str],
        "section_titles_wiki": List[str]
    }
}
```

### 2.3.2 Section Splitting (`_split_into_sections`)
**Purpose**: Intelligently splits text documents into sections for granular analysis.

**Key Features**:
- Detects multiple section marker formats:
  - Wikipedia-style: `== Section ==`, `=== Subsection ===`, `## Section`, etc.
  - Grokipedia-style: Separator lines with titles (`======================================================================`)
  - Plain text headings: Heuristic detection of title-like lines
- Filters out noise (data tables, definitions, citations at end of lines)
- Handles edge cases (single section, no sections found)
- Falls back to paragraph-based splitting if no sections detected

**Output**: List of dictionaries with `title` and `content` fields.

### 2.3.3 Sentence Embeddings (`_generate_sentence_embeddings`)
**Purpose**: Generates vector embeddings for text sections.

**Key Features**:
- Uses SentenceTransformer if available (all-MiniLM-L6-v2)
- Falls back to TF-IDF vectorization if transformers unavailable
- Processes multiple texts in batch

**Output**: NumPy array of embedding vectors.

### 2.3.4 Cross-Encoder Similarity (`_generate_cross_encoder_similarities`)
**Purpose**: Calculates accurate pairwise similarity scores using cross-encoder models.

**Key Features**:
- Uses CrossEncoder model for more accurate similarity than cosine similarity
- Creates all pairs between two text sets
- Truncates texts to 512 characters for model input
- Falls back to cosine similarity if cross-encoder unavailable

**Output**: NumPy array similarity matrix.

### 2.3.5 Knowledge Graph Embeddings (`_generate_kg_embeddings`)
**Purpose**: Generates knowledge graph embeddings for entities extracted from triples.

**Key Features**:
- Uses GraphEmbedding from `triple.py` (TransE, DistMult, ComplEx)
- Extracts entity embeddings for all subjects and objects
- Creates embedding dictionary for entity lookup

**Output**: Dictionary with entity embeddings and embedding model.

### 2.3.6 Topic Modeling (`_perform_topic_modeling`)
**Purpose**: Performs topic modeling to identify semantic themes in documents.

**Key Features**:
- Tries multiple methods in order:
  1. **BERTopic**: Advanced topic modeling with transformer embeddings
  2. **Gensim LDA**: Latent Dirichlet Allocation with Gensim
  3. **sklearn LDA**: Fallback LDA implementation
- Adapts number of topics based on dataset size
- Handles outliers and edge cases (all documents as outliers, insufficient texts)
- Returns topic distributions or dominant topics

**Output**: Dictionary with method used, topic assignments, and topic count.

### 2.3.7 Drift Score Calculation (`_calculate_drift_score`)
**Purpose**: Computes overall semantic drift score from multiple component metrics.

**Key Features**:
- Combines drift scores from:
  - Sentence embedding similarity (converted to drift: 1 - similarity)
  - Cross-encoder similarity (converted to drift)
  - Knowledge graph entity similarity (averaged across methods)
  - Topic divergence (normalized)
- Calculates weighted average of component scores
- Provides human-readable interpretation:
  - Very Low Drift (< 0.2): Highly aligned
  - Low Drift (< 0.4): Well aligned
  - Moderate Drift (< 0.6): Some divergence
  - High Drift (< 0.8): Significant divergence
  - Very High Drift (≥ 0.8): Major semantic differences

**Output**: Dictionary with overall score, component scores, and interpretation.

### 2.3.8 Claim Alignment (`_calculate_claim_alignment`)
**Purpose**: Measures alignment between claims (triples) from both sources.

**Key Features**:
- Converts triples to claim strings (subject-predicate-object)
- Finds exact matches (identical claims)
- Finds semantic matches using embeddings (similarity > 0.7 threshold)
- Calculates alignment percentage

**Output**: Dictionary with match counts and alignment percentage.

### 2.3.9 Visualization (`visualize_embeddings`)
**Purpose**: Generates visualization plots for semantic drift analysis.

**Key Features**:
- Creates similarity heatmap (section-by-section cosine similarity matrix)
- Generates embedding space visualization using t-SNE or UMAP:
  - Reduces high-dimensional embeddings to 2D
  - Colors points by source (Grokipedia vs Wikipedia)
  - Labels sections for identification
- Saves plots as PNG files in specified directory

**Output**: Saves visualization files to disk.

## 2.4 Output Structure

When executed, the system produces:

### 2.4.1 Programmatic Output (Return Value):
```python
{
    "topic_modeling": {
        "method": str,                    # "BERTopic", "Gensim LDA", "sklearn LDA", or "none"
        "topics": List,                   # Topic assignments/distributions for all sections
        "grokipedia_topics": List,        # Topics for Grokipedia sections only
        "wikipedia_topics": List,         # Topics for Wikipedia sections only
        "topic_divergence": float,        # Measure of topic distribution difference
        "topic_count": int,               # Number of topics discovered
        "probabilities": List[float],     # Topic probabilities (if available)
        "topic_info": Dict                # Topic information (BERTopic only)
    },
    "semantic_drift_score": {
        "overall_drift_score": float,     # Overall drift score (0.0 = identical, 1.0 = completely different)
        "drift_percentage": float,        # Drift as percentage (0-100)
        "component_scores": {
            "sentence_embedding_drift": float,    # Drift from sentence embeddings
            "cross_encoder_drift": float,         # Drift from cross-encoder
            "kg_embedding_drift": float,          # Drift from knowledge graph embeddings
            "topic_drift": float                  # Drift from topic modeling
        },
        "interpretation": str             # Human-readable interpretation
    },
    "claim_alignment": {
        "total_claims_grokipedia": int,    # Total claims extracted from Grokipedia
        "total_claims_wikipedia": int,     # Total claims extracted from Wikipedia
        "exact_matches": int,              # Claims that match exactly
        "semantic_matches": int,           # Claims that match semantically (>0.7 similarity)
        "total_aligned_claims": int,       # Total aligned claims (exact + semantic)
        "alignment_percentage": float      # Percentage of claims that align
    },
    "visualization": {
        "sentence_embeddings_grok": List[List[float]],  # Embedding vectors for Grokipedia sections
        "sentence_embeddings_wiki": List[List[float]],  # Embedding vectors for Wikipedia sections
        "section_titles_grok": List[str],                # Section titles from Grokipedia
        "section_titles_wiki": List[str]                 # Section titles from Wikipedia
    }
}
```

## 2.5 System Architecture Diagram

```mermaid
graph TB
    Start([Start: main function]) --> Init[Initialize SemanticDriftDetector]
    Init --> LoadModels[Load Embedding Models]
    LoadModels --> LoadST{Load SentenceTransformer?}
    LoadST -->|Yes| STModel[Load all-MiniLM-L6-v2]
    LoadST -->|No| TFIDF[Use TF-IDF Fallback]
    
    LoadModels --> LoadCE{Load CrossEncoder?}
    LoadCE -->|Yes| CEModel[Load cross-encoder/ms-marco]
    LoadCE -->|No| CosineFallback[Use Cosine Similarity]
    
    LoadModels --> LoadTopic{Load Topic Model?}
    LoadTopic -->|Yes| BERTopic[Initialize BERTopic]
    LoadTopic -->|No| LDABackup[Use LDA Fallback]
    
    Init --> InitTriple[Initialize TripleExtractor<br/>from triple.py]
    Init --> InitGraph[Initialize KnowledgeGraphBuilder<br/>from triple.py]
    
    Start --> ReadFiles[Read Input Files<br/>grokipedia.txt & wikipedia.txt]
    ReadFiles --> SplitSections[Split into Sections<br/>Multiple heuristics]
    
    SplitSections --> DetectWiki[Detect Wikipedia Headers<br/>== Section ==]
    SplitSections --> DetectGrok[Detect Grokipedia Separators<br/>=== Title ===]
    SplitSections --> DetectPlain[Detect Plain Text Headings<br/>Heuristic detection]
    
    DetectWiki --> SectionsGrok[List of Grokipedia Sections]
    DetectGrok --> SectionsGrok
    DetectPlain --> SectionsGrok
    
    DetectWiki --> SectionsWiki[List of Wikipedia Sections]
    DetectGrok --> SectionsWiki
    DetectPlain --> SectionsWiki
    
    SectionsGrok --> ExtractTriples[Extract Triples<br/>Using TripleExtractor]
    SectionsWiki --> ExtractTriples
    
    ExtractTriples --> TriplesGrok[List of Grokipedia Triples]
    ExtractTriples --> TriplesWiki[List of Wikipedia Triples]
    
    SectionsGrok --> GenSentEmbed[Generate Sentence Embeddings<br/>SentenceTransformer/TF-IDF]
    SectionsWiki --> GenSentEmbed
    
    GenSentEmbed --> EmbedGrok[Grokipedia Embeddings]
    GenSentEmbed --> EmbedWiki[Wikipedia Embeddings]
    
    EmbedGrok --> CalcSentSim[Calculate Sentence Similarity<br/>Cosine Similarity Matrix]
    EmbedWiki --> CalcSentSim
    
    SectionsGrok --> CalcCrossEnc[Calculate Cross-Encoder Similarity<br/>CrossEncoder Model]
    SectionsWiki --> CalcCrossEnc
    
    TriplesGrok --> GenKGEmbed[Generate KG Embeddings<br/>TransE, DistMult, ComplEx]
    TriplesWiki --> GenKGEmbed
    
    GenKGEmbed --> CalcKGSim[Calculate Entity Similarity<br/>Common entities only]
    
    SectionsGrok --> TopicModel[Perform Topic Modeling<br/>BERTopic/LDA]
    SectionsWiki --> TopicModel
    
    TopicModel --> CalcTopicDiv[Calculate Topic Divergence<br/>Compare distributions]
    
    CalcSentSim --> CalcDrift[Calculate Semantic Drift Score<br/>Combine all metrics]
    CalcCrossEnc --> CalcDrift
    CalcKGSim --> CalcDrift
    CalcTopicDiv --> CalcDrift
    
    TriplesGrok --> ClaimAlign[Calculate Claim Alignment<br/>Exact + Semantic matches]
    TriplesWiki --> ClaimAlign
    
    CalcDrift --> Results[Compile Results Dictionary]
    ClaimAlign --> Results
    
    Results --> Visualize[Generate Visualizations<br/>Heatmap + Embedding Space]
    Results --> SaveJSON[Save Results to JSON]
    
    Visualize --> Heatmap[Similarity Heatmap<br/>Section-by-section]
    Visualize --> EmbedSpace[Embedding Space Plot<br/>t-SNE/UMAP 2D]
    
    Heatmap --> End([End])
    EmbedSpace --> End
    SaveJSON --> End
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style CalcDrift fill:#fff4e1
    style Results fill:#e8f5e9
    style SplitSections fill:#f3e5f5
    style TopicModel fill:#f3e5f5
```

## 2.6 Key Dependencies

- **sentence-transformers**: Sentence-level embeddings and cross-encoder models
- **bertopic** (optional): Advanced topic modeling with transformer embeddings
- **gensim** (optional): LDA topic modeling implementation
- **umap-learn** (optional): UMAP dimensionality reduction (falls back to t-SNE)
- **scikit-learn**: TF-IDF, cosine similarity, t-SNE, LDA fallback
- **matplotlib**: Plotting and visualization
- **seaborn**: Statistical visualizations and heatmaps
- **numpy**: Numerical operations
- **triple.py**: TripleExtractor, KnowledgeGraphBuilder, GraphEmbedding (imported)

---

# 3. Fact-Checking & Hallucination Detection System

## 3.1 Overview

This system performs fact-checking and hallucination detection by verifying contradictions between Grokipedia and Wikipedia using OpenAI web search. It parses contradictions from knowledge graph analysis results, finds the actual sentences containing conflicting claims, searches the web for verification, and calculates comprehensive metrics including unsourced claim ratios, external verification scores, temporal consistency checks, and fabrication risk scores.

## 3.2 What This Code Does

The `factcheck.py` module implements a comprehensive fact-checking pipeline that:

1. **Parses Contradictions**: Reads contradictions from `kg_analysis_results.txt` generated by `triple.py`
2. **Finds Source Sentences**: Locates the actual sentences in both sources that contain the contradictory claims
3. **Web Search Verification**: Uses GPT-4o-search-preview to search the web for each claim
4. **Structured Analysis**: Uses GPT-4o to analyze web search results and generate structured verification data
5. **Calculates Metrics**: Computes multiple fact-checking metrics:
   - Unsourced claim ratios (percentage of claims without citations)
   - External verification scores (percentage verified by third-party sources)
   - Temporal consistency (date/number mismatches)
   - Fabrication risk scores (hallucination detection)
6. **Detects Hallucinations**: Identifies potential LLM hallucinations based on multiple risk factors

## 3.3 Components

### 3.3.1 FactChecker
**Purpose**: Main class that orchestrates fact-checking and hallucination detection.

**Key Features**:
- Initializes TripleExtractor from `triple.py` for sentence processing
- Uses OpenAI client for web search (gpt-4o-search-preview) and structured analysis (gpt-4o)
- Parses contradictions from knowledge graph analysis results
- Finds source sentences using spaCy or fallback text search
- Performs web search verification for each claim
- Calculates comprehensive fact-checking metrics

**Output**: Dictionary with verification results and metrics.

### 3.3.2 Citation Detection (`_has_citation` / `_count_citations`)
**Purpose**: Detects and counts citations in text.

**Key Features**:
- Detects multiple citation patterns:
  - Numbered citations: `[1]`, `[2]`, `[1, 2]`, `[1-5]`
  - Year citations: `(2024)`, `(2024a)`
  - Academic patterns: `et al.`, `[citation needed]`, `ref.`, `reference`
  - Citation phrases: `according to`, `as stated in`, `research shows`
- Counts unique citation numbers
- Returns boolean flag and count

**Output**: Boolean indicating citation presence, or integer count of unique citations.

### 3.3.3 Date Extraction (`_extract_dates`)
**Purpose**: Extracts dates and years from text for temporal consistency checking.

**Key Features**:
- Detects years (1000-2099)
- Detects full dates (month day, year format)
- Detects date formats (MM/DD/YYYY, DD/MM/YYYY)
- Returns dates with position and type information

**Output**: List of dictionaries with date text, position, and type.

### 3.3.4 Number Extraction (`_extract_numbers`)
**Purpose**: Extracts numerical values from text for consistency checking.

**Key Features**:
- Detects large numbers (million, billion, thousand, trillion)
- Detects percentages
- Detects measurements (kg, g, mg, km, m, cm, mm, years, months, days, hours)
- Detects general numbers
- Returns numbers with position and type information

**Output**: List of dictionaries with number text, position, and type.

### 3.3.5 Contradiction Parsing (`_parse_contradictions_from_results`)
**Purpose**: Parses contradictions from `kg_analysis_results.txt` file.

**Key Features**:
- Reads the "All Contradictions:" section from results file
- Parses numbered contradictions with subject-predicate and objects
- Extracts Grokipedia and Wikipedia objects for each contradiction
- Handles file not found and parsing errors gracefully

**Output**: List of contradiction dictionaries with number, subject_predicate, grok_object, and wiki_object.

### 3.3.6 Sentence Finding (`_find_sentences_for_contradiction`)
**Purpose**: Finds the actual sentences containing contradictory claims in source files.

**Key Features**:
- Uses spaCy for sentence segmentation (if available)
- Searches for sentences containing subject-predicate and object terms
- Falls back to simple text search if spaCy unavailable
- Uses fuzzy matching (word-level) to find sentences even if exact match not found
- Returns both sentences and formatted claim strings

**Output**: Dictionary with grok_sentence, wiki_sentence, grok_claim, and wiki_claim.

### 3.3.7 Web Search (`_search_web_for_excerpt`)
**Purpose**: Searches the web for a claim using OpenAI's web search model.

**Key Features**:
- Uses `gpt-4o-search-preview` model with web search enabled
- Requests comprehensive information from authoritative sources
- Returns detailed web search results with citations
- Handles API errors gracefully

**Output**: Raw web search response text.

### 3.3.8 Structured Verification (`_get_structured_verification`)
**Purpose**: Analyzes web search results and generates structured verification data.

**Key Features**:
- Uses GPT-4o with JSON response format
- Generates structured verification with multiple fields:
  - Verification status (verified, partially_verified, unverified, contradicted)
  - Confidence score (0.0-1.0)
  - Verification score (0-100)
  - External verification score (based on source count)
  - Sources count and URLs
  - Key facts
  - Analysis explanation
  - Temporal consistency flag
  - Fabrication risk score (0-100)
  - Citation presence
  - Hallucination indicators
- Parses JSON response with fallback extraction

**Output**: Dictionary with structured verification data.

### 3.3.9 Claim Verification (`verify_contradiction_excerpt`)
**Purpose**: Orchestrates the complete verification process for a single claim.

**Workflow**:
1. Searches web for the excerpt
2. Gets structured verification from GPT-4o
3. Returns comprehensive verification data

**Output**: Dictionary with verification status, scores, sources, and analysis.

### 3.3.10 Unsourced Claim Ratio (`calculate_unsourced_claim_ratio`)
**Purpose**: Calculates percentage of claims without citations.

**Key Features**:
- Counts claims with and without citations
- Calculates unsourced ratio as percentage
- Returns counts and ratio

**Output**: Dictionary with unsourced_ratio, unsourced_count, sourced_count, and total_count.

### 3.3.11 External Verification Score (`calculate_external_verification_score`)
**Purpose**: Calculates percentage of claims verified by third-party sources.

**Key Features**:
- Counts verified, partially verified, and unverified claims
- Calculates verification score (fully verified = 1.0, partially = 0.5, unverified = 0.0)
- Calculates average external verification score from source counts
- Returns counts and scores

**Output**: Dictionary with verification_score, external_verification_score, and counts.

### 3.3.12 Temporal Consistency (`check_temporal_consistency`)
**Purpose**: Checks for date and number mismatches across claims.

**Key Features**:
- Groups claims by entity
- Extracts dates and numbers for each entity
- Detects large date ranges (>100 years) that might indicate inconsistency
- Detects large numeric discrepancies (>50% difference)
- Checks temporal consistency flags from verifications
- Returns list of inconsistencies

**Output**: Dictionary with inconsistencies list, inconsistency_count, and total_entities_checked.

### 3.3.13 Fabrication Risk Score (`calculate_fabrication_risk_score`)
**Purpose**: Calculates fabrication risk score to detect LLM hallucinations.

**Key Features**:
- Uses fabrication_risk_score from verification if available
- Otherwise calculates from risk factors:
  - No citations (+0.3)
  - Unverified by external sources (+0.4)
  - Partially verified (+0.2)
  - Low confidence score (<0.3) (+0.2)
  - No source count (+0.1)
  - Vague language (multiple vague words) (+0.1)
- Calculates average risk score across all claims
- Provides risk level interpretation:
  - Very High (≥70): Likely hallucinations
  - High (≥50): Potential hallucinations
  - Moderate (≥30): Some unverified claims
  - Low (≥15): Mostly verified
  - Very Low (<15): Well-sourced
- Identifies high-risk claims (score > 50)

**Output**: Dictionary with fabrication_risk_score, risk_level, high_risk_claims, and counts.

### 3.3.14 Main Analysis (`fact_check_article`)
**Purpose**: Orchestrates complete fact-checking pipeline.

**Workflow**:
1. Reads Grokipedia and Wikipedia content
2. Parses contradictions from `kg_analysis_results.txt`
3. For each contradiction:
   - Finds source sentences
   - Creates claim objects with metadata
   - Verifies both Grokipedia and Wikipedia claims via web search
4. Calculates metrics:
   - Unsourced claim ratios
   - External verification scores
   - Temporal consistency checks
   - Fabrication risk scores
5. Compiles comprehensive results

**Output**: Dictionary with summary, contradictory_claims, and metrics.

## 3.4 Output Structure

When executed, the system produces:

### 3.4.1 Programmatic Output (Return Value):
```python
{
    "summary": {
        "total_contradictions": int,        # Total contradictions found
        "grok_claims_verified": int,         # Grokipedia claims verified
        "wiki_claims_verified": int          # Wikipedia claims verified
    },
    "contradictory_claims": {
        "total_pairs": int,                  # Number of contradiction pairs
        "pairs": [                           # List of contradiction pairs
            {
                "contradiction_number": int,
                "subject_predicate": str,
                "grok_object": str,
                "wiki_object": str,
                "grok_sentence": str,
                "wiki_sentence": str,
                "grok_claim": {
                    "claim_id": str,
                    "source": "grokipedia",
                    "subject": str,
                    "predicate": str,
                    "object": str,
                    "sentence": str,
                    "claim_text": str,
                    "has_citation": bool,
                    "citation_count": int,
                    "extracted_dates": List[Dict],
                    "extracted_numbers": List[Dict],
                    "entities": List[str]
                },
                "wiki_claim": {...},         # Same structure as grok_claim
                "grok_verification": {
                    "verification_status": str,      # "verified" | "partially_verified" | "unverified" | "contradicted"
                    "confidence_score": float,       # 0.0-1.0
                    "verification_score": int,       # 0-100
                    "external_verification_score": int,  # 0-100
                    "sources_count": int,
                    "sources": List[str],            # Source URLs
                    "key_facts": List[str],
                    "analysis": str,
                    "temporal_consistency": bool,
                    "fabrication_risk_score": int,   # 0-100
                    "citation_present": bool,
                    "hallucination_indicators": List[str]
                },
                "wiki_verification": {...}  # Same structure as grok_verification
            }
        ]
    },
    "metrics": {
        "grokipedia": {
            "unsourced_claim_ratio": {
                "unsourced_ratio": float,    # Percentage
                "unsourced_count": int,
                "sourced_count": int,
                "total_count": int
            },
            "external_verification_score": {
                "verification_score": float, # Percentage
                "external_verification_score": float,
                "verified_count": int,
                "partially_verified_count": int,
                "unverified_count": int,
                "total_count": int
            },
            "temporal_consistency": {
                "inconsistencies": List[Dict],
                "inconsistency_count": int,
                "total_entities_checked": int
            },
            "fabrication_risk_score": {
                "fabrication_risk_score": float,  # 0-100
                "risk_level": str,                # "Very High", "High", etc.
                "high_risk_claims": List[Dict],
                "high_risk_count": int,
                "total_claims": int
            }
        },
        "wikipedia": {...}                   # Same structure as grokipedia
    }
}
```

## 3.5 System Architecture Diagram

```mermaid
graph TB
    Start([Start: main function]) --> CheckAPI[Check OpenAI API Key]
    CheckAPI --> CheckOpenAI{OpenAI Available?}
    CheckOpenAI -->|Yes| InitOpenAI[Initialize OpenAI Client<br/>gpt-4o-search-preview + gpt-4o]
    CheckOpenAI -->|No| SkipOpenAI[Skip Fact-Checking]
    
    Start --> InitChecker[Initialize FactChecker]
    InitChecker --> InitTriple[Initialize TripleExtractor<br/>from triple.py]
    
    Start --> ReadFiles[Read Input Files<br/>grokipedia.txt & wikipedia.txt]
    ReadFiles --> ReadResults[Read kg_analysis_results.txt<br/>Parse Contradictions]
    
    ReadResults --> ParseContradictions[Parse Contradictions<br/>Extract Subject-Predicate-Object]
    ParseContradictions --> ContradictionList[List of Contradictions]
    
    ContradictionList --> ProcessContradiction[For Each Contradiction]
    ProcessContradiction --> FindSentences[Find Source Sentences<br/>spaCy or Text Search]
    
    FindSentences --> ExtractMetadata[Extract Metadata<br/>Citations, Dates, Numbers]
    ExtractMetadata --> CreateGrokClaim[Create Grokipedia Claim Object]
    ExtractMetadata --> CreateWikiClaim[Create Wikipedia Claim Object]
    
    CreateGrokClaim --> VerifyGrok[Verify Grokipedia Claim]
    CreateWikiClaim --> VerifyWiki[Verify Wikipedia Claim]
    
    VerifyGrok --> WebSearchGrok[Web Search<br/>gpt-4o-search-preview]
    VerifyWiki --> WebSearchWiki[Web Search<br/>gpt-4o-search-preview]
    
    WebSearchGrok --> StructuredAnalysisGrok[Structured Analysis<br/>gpt-4o JSON]
    WebSearchWiki --> StructuredAnalysisWiki[Structured Analysis<br/>gpt-4o JSON]
    
    StructuredAnalysisGrok --> GrokVerification[Grokipedia Verification Data]
    StructuredAnalysisWiki --> WikiVerification[Wikipedia Verification Data]
    
    GrokVerification --> CalculateMetrics[Calculate Metrics]
    WikiVerification --> CalculateMetrics
    
    CalculateMetrics --> UnsourcedRatio[Unsourced Claim Ratio<br/>Percentage without citations]
    CalculateMetrics --> ExternalVerif[External Verification Score<br/>Percentage verified by sources]
    CalculateMetrics --> TemporalCheck[Temporal Consistency<br/>Date/Number mismatches]
    CalculateMetrics --> FabricationRisk[Fabrication Risk Score<br/>Hallucination detection]
    
    UnsourcedRatio --> Results[Compile Results Dictionary]
    ExternalVerif --> Results
    TemporalCheck --> Results
    FabricationRisk --> Results
    GrokVerification --> Results
    WikiVerification --> Results
    
    Results --> SaveJSON[Save Results to JSON<br/>factcheck_results.json]
    SaveJSON --> End([End])
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style VerifyGrok fill:#fff4e1
    style VerifyWiki fill:#fff4e1
    style CalculateMetrics fill:#e8f5e9
    style Results fill:#e8f5e9
```

## 3.6 Key Dependencies

- **openai**: GPT-4o-search-preview for web search and GPT-4o for structured analysis
- **spacy**: Sentence segmentation and NLP processing (from triple.py)
- **triple.py**: TripleExtractor for sentence processing
- **python-dotenv** (optional): Environment variable loading for API keys
- **re**: Regular expressions for pattern matching
- **json**: JSON parsing and generation

---

# 4. Sentiment Analysis & Bias Detection System

## 4.1 Overview

This system analyzes sentiment polarity shifts, framing bias, and political leaning between two text sources (typically Grokipedia vs Wikipedia). It uses multiple sentiment analysis methods, detects various types of bias (word choice, source selection, representation, emphasis), and visualizes political positioning on a two-dimensional compass (left-right and authoritarian-libertarian axes).

## 4.2 What This Code Does

The `sentiment.py` module implements a comprehensive sentiment and bias detection pipeline that:

1. **Performs Multi-Method Sentiment Analysis**: Uses three different sentiment analysis approaches:
   - VADER (Valence Aware Dictionary and sEntiment Reasoner) for rule-based sentiment
   - TextBlob for pattern-based sentiment with subjectivity scores
   - Transformer models (RoBERTa-based) for deep learning sentiment analysis
2. **Detects Sentiment Shifts**: Compares sentiment polarity between corresponding sections to identify significant shifts
3. **Analyzes Framing Bias**: Detects multiple types of bias:
   - **Word Choice Bias**: Identifies loaded language and hedging words
   - **Source Selection Bias**: Analyzes citation patterns and source mentions
   - **Representation Bias**: Measures balance between supporting and opposing perspectives
   - **Emphasis Bias**: Compares section lengths to detect emphasis differences
4. **Detects Political Leaning**: Identifies political positioning on two axes:
   - Left-Right spectrum (progressive/conservative)
   - Authoritarian-Libertarian spectrum
5. **Generates Visualizations**: Creates bias compass plots showing political positioning

## 4.3 Components

### 4.3.1 SentimentBiasAnalyzer
**Purpose**: Main class that orchestrates sentiment analysis and bias detection.

**Key Features**:
- Automatically installs missing dependencies (vaderSentiment, textblob, transformers, matplotlib)
- Initializes multiple sentiment analyzers with fallback options:
  - VADER sentiment analyzer (rule-based)
  - TextBlob (pattern-based with subjectivity)
  - Transformer model (`cardiffnlp/twitter-roberta-base-sentiment-latest`) with GPU support
- Maintains keyword lists for:
  - Loaded language patterns (alleged, controversial, hero/villain, etc.)
  - Hedging words (alleged, reportedly, possibly, etc.)
  - Political keywords (left-right and authoritarian-libertarian spectrums)
- Splits documents into sections for granular analysis
- Combines results from multiple sentiment methods

**Output**: Comprehensive analysis dictionary with sentiment, bias, and political leaning metrics.

### 4.3.2 Section Splitting (`_split_into_sections`)
**Purpose**: Splits text documents into sections for section-by-section sentiment analysis.

**Key Features**:
- Detects Wikipedia-style section markers (`== Section ==`, `=== Subsection ===`)
- Detects Grokipedia-style section markers (separator lines with titles)
- Handles edge cases and fallbacks
- Returns list of sections with titles and content

**Output**: List of dictionaries with `title` and `content` fields.

### 4.3.3 VADER Sentiment Analysis (`_analyze_sentiment_vader`)
**Purpose**: Analyzes sentiment using VADER (Valence Aware Dictionary and sEntiment Reasoner).

**Key Features**:
- Rule-based sentiment analysis optimized for social media text
- Returns compound score (-1.0 to 1.0) and individual positive/neutral/negative scores
- Handles negations, capitalization, punctuation, and word-shape

**Output**: Dictionary with compound, positive, neutral, negative scores, and method identifier.

### 4.3.4 TextBlob Sentiment Analysis (`_analyze_sentiment_textblob`)
**Purpose**: Analyzes sentiment using TextBlob pattern-based approach.

**Key Features**:
- Returns polarity score (-1.0 to 1.0)
- Provides subjectivity score (0.0 to 1.0) indicating how opinionated the text is
- Uses NLTK corpus for training

**Output**: Dictionary with polarity, subjectivity, and method identifier.

### 4.3.5 Transformer Sentiment Analysis (`_analyze_sentiment_transformer`)
**Purpose**: Analyzes sentiment using deep learning transformer models.

**Key Features**:
- Uses RoBERTa-based model (`cardiffnlp/twitter-roberta-base-sentiment-latest`)
- Supports GPU acceleration if available
- Truncates text to 512 characters for model input
- Maps labels (POSITIVE/NEGATIVE/NEUTRAL) to polarity scores

**Output**: Dictionary with polarity, label, confidence score, and method identifier.

### 4.3.6 Combined Sentiment Analysis (`analyze_sentiment`)
**Purpose**: Combines results from all available sentiment analysis methods.

**Key Features**:
- Runs all available sentiment analyzers (VADER, TextBlob, Transformer)
- Calculates average polarity from all methods
- Determines overall sentiment classification (positive/negative/neutral) based on threshold (>0.1 positive, <-0.1 negative)

**Output**: Dictionary containing results from all methods plus average polarity and overall sentiment.

### 4.3.7 Loaded Language Detection (`detect_loaded_language`)
**Purpose**: Detects biased word choice through loaded language and hedging words.

**Key Features**:
- Identifies loaded language patterns:
  - Uncertainty markers (alleged, claimed, supposedly, reportedly)
  - Emotional language (controversial, scandal, outrage, shocking)
  - Character framing (hero, villain, victim, perpetrator)
  - Political positioning (radical, extreme, fringe, mainstream)
  - Conspiracy framing (conspiracy, cover-up, exposed, revealed)
- Counts hedging words (alleged, reportedly, possibly, perhaps, etc.)
- Calculates bias score as percentage of biased words

**Output**: Dictionary with counts, examples, and bias score.

### 4.3.8 Source Selection Analysis (`analyze_source_selection`)
**Purpose**: Analyzes source selection bias by examining citations and references.

**Key Features**:
- Extracts citation markers (`[1]`, `[2]`, etc.)
- Identifies source mentions using patterns:
  - "according to [Source]"
  - "[Source] reports"
  - "[Source] states"
  - "cited by [Source]"
- Counts unique citations and sources mentioned

**Output**: Dictionary with citation count, sources mentioned, and source count.

### 4.3.9 Representation Bias Analysis (`analyze_representation_bias`)
**Purpose**: Analyzes whether different perspectives are represented in the text.

**Key Features**:
- Identifies perspective indicators:
  - Support patterns (support, favor, advocate, endorse, approve)
  - Oppose patterns (oppose, against, reject, criticize, condemn)
  - Neutral patterns (according to, states, reports, notes)
- Calculates balance score (1.0 = perfectly balanced, 0.0 = completely unbalanced)
- Determines if representation is balanced (threshold > 0.6)

**Output**: Dictionary with perspective counts, balance score, and balanced flag.

### 4.3.10 Emphasis Bias Analysis (`analyze_emphasis_bias`)
**Purpose**: Compares section lengths between sources to detect emphasis differences.

**Key Features**:
- Maps corresponding sections between sources using title similarity
- Calculates length ratios for each section pair
- Identifies sections where one source emphasizes more (ratio > 1.5) or less (ratio < 0.67)
- Uses word overlap for section matching

**Output**: Dictionary with section mappings, emphasis differences, and comparison count.

### 4.3.11 Political Leaning Detection (`detect_political_leaning`)
**Purpose**: Detects political positioning on two-dimensional compass.

**Key Features**:
- Left-Right spectrum analysis:
  - Left keywords: progressive, liberal, socialist, equality, welfare, regulation, climate, social justice
  - Right keywords: conservative, republican, libertarian, free market, capitalism, deregulation, traditional, national security
- Authoritarian-Libertarian spectrum analysis:
  - Authoritarian keywords: authority, order, discipline, control, regulation, surveillance, security, enforcement
  - Libertarian keywords: freedom, liberty, autonomy, choice, voluntary, consent, rights, privacy
- Calculates scores for both axes (-1.0 to 1.0)
- Determines political quadrant:
  - Left-Libertarian, Left-Authoritarian
  - Right-Libertarian, Right-Authoritarian
  - Centrist, Moderate

**Output**: Dictionary with scores, keyword counts, quadrant classification, and political keywords flag.

### 4.3.12 Bias Compass Visualization (`create_bias_compass`)
**Purpose**: Creates two-dimensional political bias compass visualization.

**Key Features**:
- Plots sources on X-axis (Left-Right) and Y-axis (Libertarian-Authoritarian)
- Colors points by source (Grokipedia vs Wikipedia)
- Labels quadrants
- Saves as high-resolution PNG file

**Output**: Saves visualization file to disk.

### 4.3.13 Main Analysis (`analyze_article`)
**Purpose**: Orchestrates complete sentiment and bias analysis pipeline.

**Workflow**:
1. Reads input files (Grokipedia and Wikipedia)
2. Splits documents into sections
3. Performs sentiment analysis on all sections
4. Detects sentiment shifts between corresponding sections
5. Analyzes framing bias (word choice, source selection, representation, emphasis)
6. Detects political leaning for both sources
7. Generates bias compass visualization
8. Compiles comprehensive results

**Output**: Dictionary with complete analysis results.

## 4.4 Output Structure

When executed, the system produces:

### 4.4.1 Programmatic Output (Return Value):
```python
{
    "summary": {
        "grok_sections": int,              # Number of Grokipedia sections
        "wiki_sections": int,              # Number of Wikipedia sections
        "sentiment_shifts_detected": int   # Number of significant sentiment shifts
    },
    "sentiment_analysis": {
        "grokipedia": {
            "sections": [                  # List of sentiment results per section
                {
                    "vader": {...},        # VADER scores
                    "textblob": {...},     # TextBlob scores
                    "transformer": {...},  # Transformer scores
                    "average_polarity": float,
                    "overall_sentiment": str,
                    "section_title": str
                }
            ],
            "average_polarity": float       # Overall average polarity
        },
        "wikipedia": {
            "sections": [...],             # Same structure as Grokipedia
            "average_polarity": float
        },
        "sentiment_shifts": [              # Significant shifts detected
            {
                "section": str,
                "grok_polarity": float,
                "wiki_polarity": float,
                "shift_magnitude": float,
                "shift_direction": str      # "positive" or "negative"
            }
        ]
    },
    "framing_analysis": {
        "word_choice_bias": {
            "grokipedia": {
                "loaded_language_count": int,
                "loaded_language_examples": List[str],
                "hedging_words_count": int,
                "hedging_words_examples": List[str],
                "bias_score": float        # Percentage of biased words
            },
            "wikipedia": {...}             # Same structure
        },
        "source_selection_bias": {
            "grokipedia": {
                "citation_count": int,
                "sources_mentioned": List[str],
                "sources_count": int
            },
            "wikipedia": {...}             # Same structure
        },
        "representation_bias": {
            "grokipedia": {
                "perspective_counts": {
                    "support": int,
                    "oppose": int,
                    "neutral": int
                },
                "balance_score": float,    # 1.0 = perfectly balanced
                "is_balanced": bool
            },
            "wikipedia": {...}             # Same structure
        },
        "emphasis_bias": {
            "section_mapping": Dict,       # Section-by-section length comparisons
            "emphasis_differences": [       # Sections with significant differences
                {
                    "section": str,
                    "grok_emphasized": bool,
                    "ratio": float
                }
            ],
            "total_sections_compared": int
        }
    },
    "political_leaning": {
        "grokipedia": {
            "left_right_score": float,     # -1.0 (left) to 1.0 (right)
            "auth_lib_score": float,       # -1.0 (libertarian) to 1.0 (authoritarian)
            "left_keywords_count": int,
            "right_keywords_count": int,
            "authoritarian_keywords_count": int,
            "libertarian_keywords_count": int,
            "quadrant": str,               # "left-libertarian", "right-authoritarian", etc.
            "political_keywords_found": bool
        },
        "wikipedia": {...}                 # Same structure
    }
}
```

## 4.5 System Architecture Diagram

```mermaid
graph TB
    Start([Start: main function]) --> Init[Initialize SentimentBiasAnalyzer]
    Init --> LoadVADER{Load VADER?}
    LoadVADER -->|Yes| VADER[Initialize VADER Analyzer]
    LoadVADER -->|No| SkipVADER[Skip VADER]
    
    Init --> LoadTextBlob{Load TextBlob?}
    LoadTextBlob -->|Yes| TextBlob[Initialize TextBlob<br/>Download NLTK data]
    LoadTextBlob -->|No| SkipTextBlob[Skip TextBlob]
    
    Init --> LoadTransformer{Load Transformer?}
    LoadTransformer -->|Yes| Transformer[Load RoBERTa Model<br/>cardiffnlp/twitter-roberta]
    LoadTransformer -->|No| SkipTransformer[Skip Transformer]
    
    Transformer --> CheckGPU{GPU Available?}
    CheckGPU -->|Yes| UseGPU[Use GPU Device]
    CheckGPU -->|No| UseCPU[Use CPU]
    
    Start --> ReadFiles[Read Input Files<br/>grokipedia.txt & wikipedia.txt]
    ReadFiles --> SplitSections[Split into Sections<br/>Wikipedia & Grokipedia markers]
    
    SplitSections --> SectionsGrok[List of Grokipedia Sections]
    SplitSections --> SectionsWiki[List of Wikipedia Sections]
    
    SectionsGrok --> SentimentAnalysis[Analyze Sentiment<br/>All Sections]
    SectionsWiki --> SentimentAnalysis
    
    SentimentAnalysis --> VADERSent[VADER Analysis<br/>Rule-based]
    SentimentAnalysis --> TextBlobSent[TextBlob Analysis<br/>Pattern-based]
    SentimentAnalysis --> TransformerSent[Transformer Analysis<br/>Deep learning]
    
    VADERSent --> CombineSent[Combine Results<br/>Calculate Average Polarity]
    TextBlobSent --> CombineSent
    TransformerSent --> CombineSent
    
    CombineSent --> DetectShifts[Detect Sentiment Shifts<br/>Compare Corresponding Sections]
    
    SectionsGrok --> FramingAnalysis[Analyze Framing Bias]
    SectionsWiki --> FramingAnalysis
    
    FramingAnalysis --> WordChoice[Word Choice Bias<br/>Loaded Language & Hedging]
    FramingAnalysis --> SourceSelect[Source Selection Bias<br/>Citations & References]
    FramingAnalysis --> Representation[Representation Bias<br/>Perspective Balance]
    FramingAnalysis --> Emphasis[Emphasis Bias<br/>Section Length Comparison]
    
    SectionsGrok --> PoliticalAnalysis[Detect Political Leaning]
    SectionsWiki --> PoliticalAnalysis
    
    PoliticalAnalysis --> LeftRight[Left-Right Analysis<br/>Keyword Counting]
    PoliticalAnalysis --> AuthLib[Authoritarian-Libertarian<br/>Keyword Counting]
    
    LeftRight --> CalcQuadrant[Calculate Political Quadrant]
    AuthLib --> CalcQuadrant
    
    CalcQuadrant --> BiasCompass[Create Bias Compass<br/>2D Visualization]
    
    DetectShifts --> Results[Compile Results Dictionary]
    WordChoice --> Results
    SourceSelect --> Results
    Representation --> Results
    Emphasis --> Results
    CalcQuadrant --> Results
    
    Results --> SaveJSON[Save Results to JSON<br/>sentiment_results.json]
    BiasCompass --> SavePNG[Save Bias Compass PNG<br/>sentiment_visualizations/]
    
    SaveJSON --> End([End])
    SavePNG --> End
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style SentimentAnalysis fill:#fff4e1
    style FramingAnalysis fill:#f3e5f5
    style PoliticalAnalysis fill:#e8f5e9
    style Results fill:#e8f5e9
```

## 4.6 Key Dependencies

- **vaderSentiment**: Rule-based sentiment analysis optimized for social media
- **textblob**: Pattern-based sentiment analysis with subjectivity scores
- **transformers**: Deep learning sentiment analysis using RoBERTa models
- **torch** (optional): GPU acceleration for transformer models
- **matplotlib**: Plotting and visualization (bias compass)
- **numpy**: Numerical operations
- **nltk**: Natural language toolkit (used by TextBlob, auto-downloads data)
- **python-dotenv** (optional): Environment variable loading

---

# 5. Multimodal Analysis System

## 5.1 Overview

This system analyzes alignment between Wikipedia multimedia content (images, videos, audio) and Grokipedia text using GPT-4o vision embeddings and Gemini video/audio summarization. It fetches multimedia from Wikipedia articles, generates embeddings for images (via GPT-4o vision descriptions) and media (via Gemini summaries), and computes similarity scores to measure how well multimedia content aligns with the text.

## 5.2 What This Code Does

The `multimodal.py` module implements a comprehensive multimodal alignment analysis pipeline that:

1. **Fetches Wikipedia Multimedia**: Retrieves images, videos, and audio files from Wikipedia articles using the Wikipedia API
2. **Processes Images**: 
   - Downloads images from Wikipedia
   - Uses GPT-4o vision to generate detailed descriptions
   - Creates embeddings from descriptions using text-embedding-3-large
3. **Processes Videos and Audio**: 
   - Downloads media files from Wikipedia
   - Uses Gemini models to generate summaries of video/audio content
   - Creates embeddings from summaries
4. **Generates Text Embeddings**: Splits Grokipedia text into chunks and generates embeddings for each chunk
5. **Computes Similarities**: Calculates cosine similarity between multimedia embeddings and text embeddings
6. **Calculates Alignment Metrics**: 
   - Image-to-text alignment scores
   - Media-to-text alignment scores
   - Overall multimedia relevance scores
   - Multimodal Consistency Index (MCI)

## 5.3 Components

### 5.3.1 WikipediaMediaFinder
**Purpose**: Finds and downloads videos/audio files from Wikipedia articles.

**Key Features**:
- Uses Wikipedia API to query page media files
- Separates video files (`.webm`, `.ogv`, `.mp4`, `.mov`, `.avi`, `.mkv`) from audio files (`.ogg`, `.mp3`, `.wav`, `.m4a`, `.flac`)
- Gets media URLs and metadata from Wikimedia Commons API
- Downloads media files with size limits (50MB for videos, 30MB for audio)
- Handles rate limiting and error cases

**Output**: Dictionary with lists of video and audio file titles, or media file paths after download.

### 5.3.2 GeminiMediaSummarizer
**Purpose**: Generates summaries for videos and audio files using Google's Gemini models.

**Key Features**:
- Automatically detects and uses available Gemini models (gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-pro, etc.)
- Uploads media files to Gemini API
- Waits for processing to complete
- Generates detailed summaries including visual/audio elements, actions, information, and narration
- Deletes uploaded files after processing
- Handles timeouts and errors gracefully

**Output**: Text summary of video/audio content.

### 5.3.3 MultimodalAnalyzer
**Purpose**: Main class that orchestrates multimodal analysis between Wikipedia multimedia and Grokipedia text.

**Key Features**:
- Initializes OpenAI client for GPT-4o vision and embeddings
- Initializes Gemini client for video/audio processing (if API key available)
- Maintains HTTP session with proper headers for Wikipedia API
- Caches downloaded images
- Coordinates all analysis steps

**Output**: Comprehensive analysis dictionary with alignment metrics.

### 5.3.4 Image Fetching (`fetch_wikipedia_images`)
**Purpose**: Fetches and downloads images from Wikipedia articles.

**Key Features**:
- Uses Wikipedia API to get list of images from article
- Prefers thumbnail URLs (smaller, less likely to be blocked)
- Falls back to full-size images if thumbnails fail
- Handles 403 errors by retrying with full-size images
- Skips very large images (>5MB for full-size)
- Downloads images with proper headers and rate limiting
- Supports multiple image formats (JPEG, PNG, GIF, WebP)

**Output**: List of dictionaries with image data (title, URL, bytes, size, mime type).

### 5.3.5 Image Embedding (`get_image_embedding` / `_get_image_embedding_via_description`)
**Purpose**: Generates embeddings for images using GPT-4o vision.

**Key Features**:
- Converts images to base64 for API transmission
- Uses GPT-4o vision model to generate detailed image descriptions
- Descriptions include visible objects, text, colors, layout, and context
- Embeds the description using text-embedding-3-large model
- Handles different image formats (PNG, JPEG, GIF, WebP)

**Output**: Embedding vector (list of floats) or None if failed.

### 5.3.6 Text Embedding (`get_text_embedding`)
**Purpose**: Generates embeddings for Grokipedia text content.

**Key Features**:
- Splits text into chunks (default 1000 characters)
- Generates embeddings for each chunk using text-embedding-3-large
- Handles rate limiting between API calls
- Returns list of embeddings (one per chunk)

**Output**: List of embedding vectors (one per text chunk).

### 5.3.7 Media Summary Embedding (`get_media_summary_embedding`)
**Purpose**: Generates embeddings for video/audio summaries.

**Key Features**:
- Takes text summary from Gemini
- Generates embedding using text-embedding-3-large
- Simple wrapper for embedding text summaries

**Output**: Embedding vector or None if failed.

### 5.3.8 Similarity Computation (`compute_similarities`)
**Purpose**: Computes cosine similarities between multimedia and text embeddings.

**Key Features**:
- Combines image and media embeddings
- Calculates average text embedding from all chunks
- Computes pairwise cosine similarities:
  - Image-to-text similarities
  - Media-to-text similarities
  - Per-chunk similarities (each text chunk vs each multimedia item)
- Calculates aggregate statistics (average, max, min)

**Output**: Dictionary with similarity matrices and statistics.

### 5.3.9 Main Analysis (`analyze_multimodal_alignment`)
**Purpose**: Orchestrates complete multimodal analysis pipeline.

**Workflow**:
1. Reads Grokipedia content
2. Fetches Wikipedia images
3. Fetches Wikipedia videos and audio
4. Gets image embeddings (via GPT-4o vision descriptions)
5. Processes videos/audio with Gemini to get summaries and embeddings
6. Gets text embeddings for Grokipedia content
7. Computes similarities between all multimedia and text
8. Calculates alignment metrics:
   - Image-to-text alignment scores
   - Media-to-text alignment scores
   - Overall multimedia relevance
   - Multimodal Consistency Index (MCI)

**Output**: Dictionary with complete analysis results.

## 5.4 Output Structure

When executed, the system produces:

### 5.4.1 Programmatic Output (Return Value):
```python
{
    "summary": {
        "wikipedia_article": str,          # Wikipedia article title
        "images_found": int,                # Total images found
        "images_processed": int,            # Images successfully processed
        "videos_found": int,                # Total videos found
        "audio_found": int,                 # Total audio files found
        "media_processed": int,             # Media files successfully processed
        "text_chunks": int                  # Number of text chunks
    },
    "textual_similarity": {
        "average_similarity": float,        # Average similarity across all multimedia
        "average_image_similarity": float,  # Average image-to-text similarity
        "average_media_similarity": float, # Average media-to-text similarity
        "max_similarity": float,            # Maximum similarity found
        "min_similarity": float,            # Minimum similarity found
        "highest_matching_segments": [      # Top matching multimedia items
            {
                "type": str,                # "image" or "video"/"audio"
                "index": int,
                "title": str,
                "similarity": float,
                "description": str          # Image description or media summary
            }
        ],
        "lowest_matching_segments": [...]   # Lowest matching multimedia items
    },
    "image_to_text_alignment": {
        "image_relevance_score": float,     # Image alignment score (0-100)
        "image_text_match_score": float,    # Percentage of well-matched images
        "well_matched_images": int,          # Images with similarity >= 0.5
        "total_images": int
    },
    "media_to_text_alignment": {
        "media_relevance_score": float,     # Media alignment score (0-100)
        "media_text_match_score": float,    # Percentage of well-matched media
        "well_matched_media": int,          # Media with similarity >= 0.5
        "total_media": int,
        "videos_processed": int,
        "audio_processed": int
    },
    "overall_multimedia_alignment": {
        "overall_relevance_score": float,   # Overall alignment score (0-100)
        "overall_match_score": float,       # Percentage of well-matched multimedia
        "missing_multimedia_score": float,  # Score indicating missing multimedia
        "well_matched_total": int,          # Total well-matched items
        "total_multimedia": int
    },
    "multimodal_consistency_index": {
        "mci_score": float,                 # Multimodal Consistency Index (0-100)
        "image_alignment_component": float, # Image component contribution
        "media_alignment_component": float, # Media component contribution
        "multimodal_consistency_component": float, # Consistency component
        "breakdown": {
            "image_alignment_weight": 0.4,
            "media_alignment_weight": 0.3,
            "consistency_weight": 0.3
        }
    },
    "detailed_results": {
        "images": [                         # Detailed image results
            {
                "title": str,
                "url": str,
                "similarity": float,
                "description": str
            }
        ],
        "media": [                          # Detailed media results
            {
                "title": str,
                "type": str,                # "video" or "audio"
                "summary": str,
                "path": str
            }
        ],
        "media_similarities": [             # Media similarity scores
            {
                "title": str,
                "type": str,
                "similarity": float,
                "summary": str
            }
        ]
    }
}
```

## 5.5 System Architecture Diagram

```mermaid
graph TB
    Start([Start: main function]) --> CheckAPI[Check API Keys<br/>OpenAI & Google]
    CheckAPI --> CheckOpenAI{OpenAI Available?}
    CheckOpenAI -->|Yes| InitOpenAI[Initialize OpenAI Client<br/>GPT-4o + text-embedding-3-large]
    CheckOpenAI -->|No| SkipOpenAI[Skip OpenAI Features]
    
    CheckAPI --> CheckGemini{Google API Available?}
    CheckGemini -->|Yes| InitGemini[Initialize Gemini Client<br/>Auto-detect model]
    CheckGemini -->|No| SkipGemini[Skip Gemini Features]
    
    Start --> InitAnalyzer[Initialize MultimodalAnalyzer]
    InitAnalyzer --> InitMediaFinder[Initialize WikipediaMediaFinder]
    InitAnalyzer --> InitMediaSummarizer[Initialize GeminiMediaSummarizer]
    
    Start --> ReadGrok[Read Grokipedia Content]
    
    Start --> FetchImages[Fetch Wikipedia Images<br/>Wikipedia API]
    FetchImages --> GetImageList[Get Image List<br/>from Article]
    GetImageList --> DownloadImages[Download Images<br/>Prefer Thumbnails]
    DownloadImages --> ImageList[List of Image Data]
    
    Start --> FetchMedia[Fetch Wikipedia Media<br/>Videos & Audio]
    FetchMedia --> GetMediaList[Get Media List<br/>Separate Videos/Audio]
    GetMediaList --> DownloadVideos[Download Videos<br/>Max 50MB]
    GetMediaList --> DownloadAudio[Download Audio<br/>Max 30MB]
    DownloadVideos --> VideoList[List of Video Files]
    DownloadAudio --> AudioList[List of Audio Files]
    
    ImageList --> ProcessImages[Process Images<br/>Generate Embeddings]
    ProcessImages --> GPT4Vision[GPT-4o Vision<br/>Generate Description]
    GPT4Vision --> EmbedDescription[Embed Description<br/>text-embedding-3-large]
    EmbedDescription --> ImageEmbeddings[List of Image Embeddings]
    
    VideoList --> ProcessVideos[Process Videos<br/>Gemini Summarization]
    AudioList --> ProcessAudio[Process Audio<br/>Gemini Summarization]
    ProcessVideos --> UploadGemini[Upload to Gemini<br/>Wait for Processing]
    ProcessAudio --> UploadGemini
    UploadGemini --> GenerateSummary[Generate Summary<br/>Gemini Model]
    GenerateSummary --> EmbedSummary[Embed Summary<br/>text-embedding-3-large]
    EmbedSummary --> MediaEmbeddings[List of Media Embeddings]
    GenerateSummary --> DeleteFile[Delete Uploaded File]
    
    ReadGrok --> ChunkText[Chunk Text<br/>1000 chars per chunk]
    ChunkText --> EmbedText[Embed Text Chunks<br/>text-embedding-3-large]
    EmbedText --> TextEmbeddings[List of Text Embeddings]
    
    ImageEmbeddings --> ComputeSimilarities[Compute Similarities<br/>Cosine Similarity]
    MediaEmbeddings --> ComputeSimilarities
    TextEmbeddings --> ComputeSimilarities
    
    ComputeSimilarities --> ImageTextSim[Image-Text Similarities]
    ComputeSimilarities --> MediaTextSim[Media-Text Similarities]
    ComputeSimilarities --> ChunkSim[Per-Chunk Similarities]
    
    ImageTextSim --> CalcMetrics[Calculate Alignment Metrics]
    MediaTextSim --> CalcMetrics
    ChunkSim --> CalcMetrics
    
    CalcMetrics --> ImageAlignment[Image Alignment Scores<br/>Relevance & Match]
    CalcMetrics --> MediaAlignment[Media Alignment Scores<br/>Relevance & Match]
    CalcMetrics --> OverallAlignment[Overall Multimedia Alignment<br/>Relevance & Match]
    CalcMetrics --> MCI[Multimodal Consistency Index<br/>Weighted Components]
    
    ImageAlignment --> Results[Compile Results Dictionary]
    MediaAlignment --> Results
    OverallAlignment --> Results
    MCI --> Results
    
    Results --> SaveJSON[Save Results to JSON<br/>multimodal_results.json]
    SaveJSON --> End([End])
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style ProcessImages fill:#fff4e1
    style ProcessVideos fill:#f3e5f5
    style ComputeSimilarities fill:#e8f5e9
    style CalcMetrics fill:#e8f5e9
```

## 5.6 Key Dependencies

- **openai**: GPT-4o vision model and text-embedding-3-large embeddings
- **google-generativeai**: Gemini models for video/audio summarization
- **requests**: HTTP requests for Wikipedia API and media downloads
- **PIL/Pillow** (optional): Image processing
- **numpy**: Numerical operations and array handling
- **scikit-learn**: Cosine similarity computation
- **python-dotenv** (optional): Environment variable loading for API keys

---

# 6. Editorial Judging System

## 6.1 Overview

This system uses GPT-5.1 to perform comprehensive editorial comparison between Grokipedia and Wikipedia content. It identifies bias, framing differences, factual discrepancies, and provides actionable editorial suggestions for improving Grokipedia articles. The system leverages OpenAI's Responses API (with fallback to Chat Completions API) to generate detailed comparison reports covering factual accuracy, bias analysis, structural differences, and specific improvement recommendations.

## 6.2 What This Code Does

The `judging.py` module implements an editorial judging pipeline that:

1. **Reads Article Content**: Extracts content from both Grokipedia and Wikipedia files, handling metadata and content extraction
2. **Generates Comprehensive Comparison Reports**: Uses GPT-5.1 to analyze and compare articles across multiple dimensions:
   - Executive summary of overall quality and differences
   - Factual accuracy analysis (errors, missing facts, additional claims)
   - Bias and framing analysis (word choice, source selection, representation, emphasis, political leaning, temporal framing, attribution)
   - Structural and organizational differences
   - Editorial suggestions for improvements
   - Detailed examples with quotes
   - Overall recommendations with priority levels
3. **Leverages Advanced AI**: Uses GPT-5.1 with Responses API for detailed reasoning and analysis
4. **Saves Results**: Outputs comprehensive reports to text and JSON files

## 6.3 Components

### 6.3.1 EditorialJudge
**Purpose**: Main class that orchestrates editorial comparison and judgment using GPT-5.1.

**Key Features**:
- Initializes OpenAI client with API key validation
- Uses GPT-5.1 model via Responses API (with fallback to Chat Completions API)
- Configures reasoning effort (low) and verbosity (medium) for optimal performance
- Handles multiple API access methods (Responses API, Chat Completions, direct HTTP)
- Generates comprehensive editorial comparison reports
- Saves results to multiple output formats

**Output**: Dictionary with comparison report, status, and metadata.

### 6.3.2 File Reading (`_read_file`)
**Purpose**: Reads content from files with error handling.

**Key Features**:
- Handles file encoding (UTF-8)
- Provides error messages for file not found and other exceptions
- Returns empty string on error

**Output**: File content as string, or empty string on error.

### 6.3.3 Grokipedia Content Extraction (`_read_grokipedia`)
**Purpose**: Extracts main content from Grokipedia files.

**Key Features**:
- Reads Grokipedia file (default: `dual_scraper_output/grokipedia.txt`)
- Extracts main content using regex patterns:
  - `📄 Full Content:` pattern
  - `📄 ARTICLE CONTENT:` pattern
- Strips metadata and returns only article content
- Falls back to full file content if patterns not found

**Output**: Grokipedia article content as string.

### 6.3.4 Wikipedia Content Extraction (`_read_wikipedia`)
**Purpose**: Extracts main content from Wikipedia files.

**Key Features**:
- Reads Wikipedia file (default: `dual_scraper_output/wikipedia.txt`)
- Uses same extraction patterns as Grokipedia
- Handles metadata removal
- Returns clean article content

**Output**: Wikipedia article content as string.

### 6.3.5 Comparison Report Generation (`generate_comparison_report`)
**Purpose**: Generates detailed editorial comparison report using GPT-5.1.

**Key Features**:
- Constructs comprehensive prompt with both article contents (limited to 50,000 characters each)
- Requests analysis across 7 major sections:
  1. Executive Summary
  2. Factual Accuracy Analysis
  3. Bias and Framing Analysis (critical section)
  4. Structural and Organizational Differences
  5. Editorial Suggestions for Grokipedia
  6. Detailed Examples (5-10 specific examples)
  7. Overall Recommendations
- Uses GPT-5.1 Responses API with:
  - Reasoning effort: low
  - Verbosity: medium
- Falls back to Chat Completions API if Responses API unavailable
- Handles HTTP direct requests as final fallback
- Provides detailed error handling and logging

**Output**: Dictionary with status, report text, model info, and configuration.

### 6.3.6 Main Analysis (`analyze_articles`)
**Purpose**: Orchestrates complete editorial analysis pipeline.

**Workflow**:
1. Reads Grokipedia and Wikipedia articles
2. Validates content availability
3. Generates comparison report using GPT-5.1
4. Saves results to files
5. Returns comprehensive results dictionary

**Output**: Dictionary with analysis results and status.

### 6.3.7 Results Saving (`_save_results`)
**Purpose**: Saves analysis results to multiple file formats.

**Key Features**:
- Saves full report to `editorial_judgment_report.txt`:
  - Includes model information
  - Includes reasoning effort and verbosity settings
  - Contains complete comparison report
- Saves metadata to `editorial_judgment_results.json`:
  - Status, report text, model, configuration
  - Error information if analysis failed

**Output**: Writes files to disk.

## 6.4 Output Structure

When executed, the system produces:

### 6.4.1 Programmatic Output (Return Value):
```python
{
    "status": str,                    # "success" or "error"
    "report": str,                    # Full comparison report text (if success)
    "model": str,                     # "gpt-5.1"
    "reasoning_effort": str,          # "low"
    "verbosity": str,                 # "medium"
    "error": str,                     # Error message (if error)
    "error_type": str                 # Error type name (if error)
}
```

### 6.4.2 Report Structure (Text Output):
The generated report contains the following sections:

1. **Executive Summary**:
   - Overall assessment of content quality and accuracy
   - Key differences in coverage and depth
   - Overall tone and neutrality comparison

2. **Factual Accuracy Analysis**:
   - Factual claims that differ between versions
   - Factual errors or inaccuracies in Grokipedia
   - Missing critical facts in Grokipedia
   - Additional facts in Grokipedia (with verification)

3. **Bias and Framing Analysis**:
   - **Word choice bias**: Loaded language, hedging words, tone
   - **Source selection bias**: Citations and source mentions
   - **Representation bias**: Perspective and viewpoint mentions
   - **Emphasis bias**: Section lengths and emphasis differences
   - **Political/ideological leaning**: Political framing
   - **Temporal framing**: Chronological/causal presentation
   - **Attribution bias**: Credit, blame, responsibility attribution

4. **Structural and Organizational Differences**:
   - Section organization and hierarchy
   - Information architecture differences
   - Missing or extra sections
   - Flow and readability comparison

5. **Editorial Suggestions for Grokipedia**:
   - Content additions
   - Content corrections
   - Bias corrections
   - Source improvements
   - Structural improvements
   - Tone adjustments
   - Clarity improvements

6. **Detailed Examples**:
   - 5-10 specific examples with quotes from both versions
   - Subtle bias or framing differences
   - Factual discrepancies
   - Missing critical information
   - Editorial improvements needed

7. **Overall Recommendations**:
   - Priority fixes (high/medium/low)
   - Estimated impact of suggested changes
   - Risk assessment for current Grokipedia version

### 6.4.3 File Outputs:
- **editorial_judgment_report.txt**: Full formatted report
- **editorial_judgment_results.json**: JSON metadata and results
- **editorial_judgment_output.txt**: Complete console output

## 6.5 System Architecture Diagram

```mermaid
graph TB
    Start([Start: main function]) --> CheckAPI[Check OpenAI API Key]
    CheckAPI --> ValidateKey{API Key Valid?}
    ValidateKey -->|No| ErrorExit[Exit with Error]
    ValidateKey -->|Yes| InitClient[Initialize OpenAI Client]
    
    InitClient --> InitJudge[Initialize EditorialJudge]
    InitJudge --> SetModel[Set Model: gpt-5.1]
    InitJudge --> SetConfig[Set Config:<br/>Reasoning: low<br/>Verbosity: medium]
    
    Start --> ReadGrok[Read Grokipedia File<br/>dual_scraper_output/grokipedia.txt]
    ReadGrok --> ExtractGrok[Extract Main Content<br/>Remove Metadata]
    ExtractGrok --> GrokContent[Grokipedia Content]
    
    Start --> ReadWiki[Read Wikipedia File<br/>dual_scraper_output/wikipedia.txt]
    ReadWiki --> ExtractWiki[Extract Main Content<br/>Remove Metadata]
    ExtractWiki --> WikiContent[Wikipedia Content]
    
    GrokContent --> ValidateContent{Content Valid?}
    WikiContent --> ValidateContent
    ValidateContent -->|No| ErrorExit
    ValidateContent -->|Yes| GenerateReport[Generate Comparison Report]
    
    GenerateReport --> ConstructPrompt[Construct Comprehensive Prompt<br/>7 Analysis Sections]
    ConstructPrompt --> LimitContent[Limit Content<br/>50,000 chars each]
    
    LimitContent --> TryResponsesAPI{Try Responses API?}
    TryResponsesAPI -->|Yes| ResponsesAPI[GPT-5.1 Responses API<br/>reasoning: low<br/>verbosity: medium]
    TryResponsesAPI -->|No| TryChatAPI{Try Chat Completions?}
    
    ResponsesAPI --> ExtractResponse[Extract Output Text]
    TryChatAPI -->|Yes| ChatAPI[GPT-5.1 Chat Completions API<br/>Fallback]
    TryChatAPI -->|No| TryHTTP{Try HTTP Request?}
    
    ChatAPI --> ExtractResponse
    TryHTTP -->|Yes| HTTPRequest[Direct HTTP POST<br/>Final Fallback]
    TryHTTP -->|No| ErrorExit
    
    HTTPRequest --> ExtractResponse
    ExtractResponse --> ReportText[Comparison Report Text]
    
    ReportText --> SaveResults[Save Results]
    SaveResults --> SaveTXT[Save to TXT<br/>editorial_judgment_report.txt]
    SaveResults --> SaveJSON[Save to JSON<br/>editorial_judgment_results.json]
    SaveResults --> SaveOutput[Save Console Output<br/>editorial_judgment_output.txt]
    
    SaveTXT --> End([End])
    SaveJSON --> End
    SaveOutput --> End
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style GenerateReport fill:#fff4e1
    style ResponsesAPI fill:#e8f5e9
    style SaveResults fill:#e8f5e9
```

## 6.6 Key Dependencies

- **openai**: OpenAI Python SDK for GPT-5.1 Responses API and Chat Completions API
- **python-dotenv**: Environment variable loading for API keys
- **requests** (optional): Direct HTTP requests as fallback method
- **re**: Regular expressions for content extraction
- **json**: JSON serialization for results

---

# Content Fetching System

The `fetch.py` module provides dual scraping capabilities to fetch content from both Wikipedia and Grokipedia for comparison analysis. It uses the **MediaWiki API** for Wikipedia (fast and reliable) and **Selenium WebDriver** for Grokipedia (handles dynamic JavaScript content). 

**How it works:**
- **Wikipedia**: Uses the official MediaWiki API to search for articles and retrieve full page content, metadata, and external references.
- **Grokipedia**: Uses Selenium WebDriver to navigate the website, perform searches, and extract structured content (sections, paragraphs) with multiple fallback strategies for result selection and content extraction.

The scraped content is saved to formatted text files (`grokipedia.txt` and `wikipedia.txt`) in the `dual_scraper_output` directory, ready for downstream analysis by the comparison systems.
