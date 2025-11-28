import { NextRequest, NextResponse } from "next/server";

const ANALYZE_LITE_API_URL = `${process.env.ANALYZE_API_URL}/analyze-lite`;

const dummyResponse = {
  "status": "success",
  "analysis_id": "lite_20251127_170611_Cattle",
  "topic": "Cattle",
  "steps_completed": [
      "fetch",
      "triple"
  ],
  "results": {
      "fetch": {
          "status": "success",
          "grokipedia": {
              "word_count": 9431,
              "char_count": 89928,
              "references_count": 100,
              "sections": 0
          },
          "wikipedia": {
              "word_count": 4472,
              "char_count": 28245,
              "references_count": 100
          },
          "files": {
              "grokipedia": "dual_scraper_output/grokipedia.txt",
              "wikipedia": "dual_scraper_output/wikipedia.txt"
          }
      },
      "triple": {
          "status": "success",
          "basic_stats": {
              "source_a_triples": 4351,
              "source_b_triples": 817,
              "total_triples": 5168
          },
          "triple_overlap": {
              "exact_overlap_count": 1,
              "exact_overlap_score": 0.09,
              "fuzzy_overlap_count": 1,
              "fuzzy_overlap_score": 0.09,
              "unique_to_source_a": 1154,
              "unique_to_source_b": 800
          },
          "semantic_similarity": {
              "average_similarity": 0.1042,
              "max_similarity": 1.0,
              "similar_pairs_count": 1411,
              "similar_pairs_percentage": 0.04,
              "method": "sentence-transformers"
          },
          "graph_embeddings": {
              "TransE": {
                  "average_similarity": 0.0142,
                  "max_similarity": 0.6089,
                  "entity_count": 1874,
                  "relation_count": 1125
              },
              "DistMult": {
                  "average_similarity": -0.0138,
                  "max_similarity": 0.4325,
                  "entity_count": 1874,
                  "relation_count": 1125
              },
              "ComplEx": {
                  "average_similarity": -0.0187,
                  "max_similarity": 0.4236,
                  "entity_count": 1874,
                  "relation_count": 1125
              }
          },
          "graph_density": {
              "source_a_density": 446.9,
              "source_b_density": 173.57,
              "density_delta": 273.33,
              "density_ratio": 2.57
          },
          "entity_coherence": {
              "common_entities": 135,
              "consistent_entities": 0,
              "partially_consistent_entities": 1,
              "coherence_score": 0.0,
              "average_overlap_ratio": 0.15,
              "inconsistent_examples": [
                  {
                      "entity": "87",
                      "overlap_ratio": 0.0,
                      "source_a_relations": [
                          "] https://www.sciencedirect.com/science/article/pii/s0168159125000462 \n   [ 88 ] https://www.freenature.nl/en/nieuws/2024/what-does-maternal-herd-cattle-look \n   [:89",
                          "] https://www.sciencedirect.com/science/article/pii/s0168159125000462 \n   [:88"
                      ],
                      "source_b_relations": [
                          "] https://api.semanticscholar.org/CorpusID:39755371 \n   [ 88 ] https://api.semanticscholar.org/corpusid:13283847 \n   [:89",
                          "] https://api.semanticscholar.org/CorpusID:39755371 \n   [:88"
                      ]
                  },
                  {
                      "entity": "europe",
                      "overlap_ratio": 0.0,
                      "source_a_relations": [
                          "neolithic farmer:around 8,500 years ago"
                      ],
                      "source_b_relations": [
                          ", know individual die:Mazovia",
                          ",:North Africa",
                          "temperate area:Asia"
                      ]
                  },
                  {
                      "entity": "39",
                      "overlap_ratio": 0.0,
                      "source_a_relations": [
                          "] https://www.vetvoice.com.au/articles/difference-between-beef-and-dairy-cattle/ \n   [:40",
                          "] https://www.vetvoice.com.au/articles/difference-between-beef-and-dairy-cattle/ \n   [ 40 ] https://uwmril.wisc.edu/wp-content/uploads/sites/306/2021/08/1_tech_1_cowintroudderanatomy.pdf \n   [:41"
                      ],
                      "source_b_relations": [
                          "] https://web.archive.org/web/20150518064015/http://ukcows.com/holsteinuk/publicweb/education/huk_edu_dairycows.aspx?cmh=66 \n   [:40",
                          "] https://web.archive.org/web/20150518064015/http://ukcows.com/holsteinuk/publicweb/education/huk_edu_dairycows.aspx?cmh=66 \n   [ 40 ] https://web.archive.org/web/20150518074913/http://www.ciwf.org.uk/farm-animals/cows/dairy-cows/ \n   [:41"
                      ]
                  },
                  {
                      "entity": "2009",
                      "overlap_ratio": 0.0,
                      "source_a_relations": [
                          "yield annual net merit gain $:85",
                          "yield:annual"
                      ],
                      "source_b_relations": [
                          ", National Institutes Health:the US Department of Agriculture",
                          ",:the National Institutes of Health"
                      ]
                  },
                  {
                      "entity": "61",
                      "overlap_ratio": 0.0,
                      "source_a_relations": [
                          "] https://pubmed.ncbi.nlm.nih.gov/18638138/ \n   [ 62 ] https://boumatic.com/eu_en/expert-blog/look-through-the-eyes-of-a-cow/ \n   [:63",
                          "] https://pubmed.ncbi.nlm.nih.gov/18638138/ \n   [:62"
                      ],
                      "source_b_relations": [
                          "] https://www.avma.org/KB/Resources/LiteratureReviews/Pages/Welfare-Implications-of-Dehorning-and-Disbudding-Cattle.aspx \n   [ 62 ] https://www.nytimes.com/2012/01/26/us/ear-tagging-proposal-may-mean-fewer-branded-cattle.html \n   [:63",
                          "] https://www.avma.org/KB/Resources/LiteratureReviews/Pages/Welfare-Implications-of-Dehorning-and-Disbudding-Cattle.aspx \n   [:62"
                      ]
                  }
              ]
          },
          "provenance_analysis": {
              "source_a_cited": 3725,
              "source_a_cited_percentage": 85.61,
              "source_b_cited": 54,
              "source_b_cited_percentage": 6.61,
              "citation_gap": 3671,
              "cited_overlap": 0,
              "provenance_quality_score_a": 85.61,
              "provenance_quality_score_b": 6.61,
              "extraction_methods_a": {
                  "dependency_parsing": 3579,
                  "openie_pattern": 21,
                  "entity_relation": 608,
                  "nominal_relation": 143
              },
              "extraction_methods_b": {
                  "dependency_parsing": 171,
                  "openie_pattern": 67,
                  "entity_relation": 429,
                  "nominal_relation": 150
              },
              "unsourced_triples_a": 626,
              "unsourced_triples_b": 763,
              "unsourced_percentage_a": 14.39,
              "unsourced_percentage_b": 93.39
          },
          "contradictions": {
              "contradiction_count": 4,
              "contradictions": [
                  {
                      "subject": "Cattle",
                      "predicate": "be",
                      "source_a_object": "large quadrupedal ungulates",
                      "source_b_object": "large artiodactyls"
                  },
                  {
                      "subject": "Cattle",
                      "predicate": "be",
                      "source_a_object": "large quadrupedal ungulates",
                      "source_b_object": "ruminants"
                  },
                  {
                      "subject": "which",
                      "predicate": "transmit",
                      "source_a_object": "anaplasmosis",
                      "source_b_object": "diseases"
                  },
                  {
                      "subject": "which",
                      "predicate": "reduce",
                      "source_a_object": "agonistic interactions",
                      "source_b_object": "the carrying capacity of the land"
                  }
              ],
              "filtered_noise_triples_a": 44,
              "filtered_noise_triples_b": 58
          }
      }
  },
  "errors": [],
  "timestamp": "2025-11-27T17:07:32.005739",
  "execution_time_seconds": 80.65157341957092
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Topic is required and must be a string" },
        { status: 400 }
      );
    }

    console.log(`Starting analyze-lite for topic: ${topic}`);

    // Step 1: Call analyze-lite endpoint with form data
    const formData = new FormData();
    formData.append("topic", topic);

    const analyzeResponse = await fetch(ANALYZE_LITE_API_URL, {
      method: "POST",
      body: formData,
    });

    if (!analyzeResponse.ok) {
      throw new Error(`Analyze-lite API returned ${analyzeResponse.status}`);
    }

    const analysisData = await analyzeResponse.json();
    
    // Return the analysis data immediately (frontend will handle polling and publishing)
    return NextResponse.json(analysisData, { status: 200 });
  } catch (error) {
    console.error("Analyze-lite error:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze topic",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

