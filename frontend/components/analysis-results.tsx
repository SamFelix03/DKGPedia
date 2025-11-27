"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  FileText, 
  Brain, 
  Image, 
  Scale,
  Database,
  Shield,
  MessageSquare,
  Eye
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MarkdownRenderer from "@/components/markdown-renderer";

interface AnalysisResult {
  status: string;
  analysis_id: string;
  topic: string;
  steps_completed: string[];
  results: {
    fetch: {
      status: string;
      grokipedia: {
        word_count: number;
        char_count: number;
        references_count: number;
        sections?: number;
      };
      wikipedia: {
        word_count: number;
        char_count: number;
        references_count: number;
      };
      files?: {
        grokipedia: string;
        wikipedia: string;
      };
    };
    triple: {
      status: string;
      basic_stats: {
        source_a_triples: number;
        source_b_triples: number;
        total_triples: number;
      };
      triple_overlap?: {
        exact_overlap_count: number;
        exact_overlap_score: number;
        fuzzy_overlap_count: number;
        fuzzy_overlap_score: number;
        unique_to_source_a: number;
        unique_to_source_b: number;
      };
      semantic_similarity: {
        average_similarity: number;
        max_similarity: number;
        similar_pairs_count?: number;
        similar_pairs_percentage?: number;
        method?: string;
      };
      graph_embeddings?: {
        TransE: {
          average_similarity: number;
          max_similarity: number;
          entity_count: number;
          relation_count: number;
        };
        DistMult: {
          average_similarity: number;
          max_similarity: number;
          entity_count: number;
          relation_count: number;
        };
        ComplEx: {
          average_similarity: number;
          max_similarity: number;
          entity_count: number;
          relation_count: number;
        };
      };
      graph_density?: {
        source_a_density: number;
        source_b_density: number;
        density_delta: number;
        density_ratio: number;
      };
      entity_coherence?: {
        common_entities: number;
        consistent_entities: number;
        partially_consistent_entities: number;
        coherence_score: number;
        average_overlap_ratio: number;
        inconsistent_examples?: Array<{
          entity: string;
          overlap_ratio: number;
          source_a_relations: string[];
          source_b_relations: string[];
        }>;
      };
      provenance_analysis?: {
        source_a_cited: number;
        source_a_cited_percentage: number;
        source_b_cited: number;
        source_b_cited_percentage: number;
        citation_gap: number;
        cited_overlap: number;
        provenance_quality_score_a: number;
        provenance_quality_score_b: number;
        extraction_methods_a: {
          dependency_parsing: number;
          openie_pattern: number;
          entity_relation: number;
          nominal_relation: number;
        };
        extraction_methods_b: {
          dependency_parsing: number;
          openie_pattern: number;
          entity_relation: number;
          nominal_relation: number;
        };
        unsourced_triples_a: number;
        unsourced_triples_b: number;
        unsourced_percentage_a: number;
        unsourced_percentage_b: number;
      };
      contradictions: {
        contradiction_count: number;
        contradictions: Array<{
          subject: string;
          predicate: string;
          source_a_object: string;
          source_b_object: string;
        }>;
        filtered_noise_triples_a?: number;
        filtered_noise_triples_b?: number;
      };
    };
    semanticdrift: {
      status: string;
      semantic_drift_score: {
        overall_drift_score: number;
        drift_percentage: number;
        component_scores?: {
          sentence_embedding_drift: number;
          cross_encoder_drift: number;
          kg_embedding_drift: number;
          topic_drift: number;
        };
        interpretation: string;
      };
      sentence_embeddings?: {
        average_similarity: number;
        max_similarity: number;
        min_similarity: number;
      };
      cross_encoder?: {
        average_similarity: number;
      };
      knowledge_graph_embeddings?: {
        TransE: {
          grokipedia_entities: number;
          wikipedia_entities: number;
          common_entities: number;
          average_entity_similarity: number;
        };
        DistMult: {
          grokipedia_entities: number;
          wikipedia_entities: number;
          common_entities: number;
          average_entity_similarity: number;
        };
        ComplEx: {
          grokipedia_entities: number;
          wikipedia_entities: number;
          common_entities: number;
          average_entity_similarity: number;
        };
      };
      topic_modeling?: {
        method: string;
        topics: number[];
        probabilities: number[][];
        topic_info: {
          Topic: Record<string, number>;
          Count: Record<string, number>;
          Name: Record<string, string>;
          Representation: Record<string, string[]>;
          Representative_Docs: Record<string, string[]>;
        };
        topic_count: number;
        grokipedia_topics: number[];
        wikipedia_topics: number[];
        topic_divergence: number;
      };
      claim_alignment?: {
        total_claims_grokipedia: number;
        total_claims_wikipedia: number;
        exact_matches: number;
        semantic_matches: number;
        total_aligned_claims: number;
        alignment_percentage: number;
      };
    };
    factcheck: {
      status: string;
      summary: {
        total_contradictions: number;
        grok_claims_verified: number;
        wiki_claims_verified: number;
      };
      metrics: {
        grokipedia: {
          unsourced_claim_ratio?: {
            unsourced_ratio: number;
            unsourced_count: number;
            sourced_count: number;
            total_count: number;
          };
          external_verification_score: {
            verification_score: number;
            external_verification_score?: number;
            verified_count?: number;
            partially_verified_count?: number;
            unverified_count?: number;
            total_count?: number;
          };
          temporal_consistency?: {
            inconsistencies: Array<{
              type: string;
              entity?: string;
              claim_id?: string;
              claim_text?: string;
              issue: string;
              values?: string[];
              verification_status?: string;
            }>;
            inconsistency_count: number;
            total_entities_checked: number;
          };
          fabrication_risk_score: {
            fabrication_risk_score: number;
            risk_level: string;
            high_risk_claims?: Array<{
              claim_id: string;
              claim_text: string;
              risk_score: number;
              factors: string[];
            }>;
            high_risk_count?: number;
            total_claims?: number;
          };
        };
        wikipedia: {
          unsourced_claim_ratio?: {
            unsourced_ratio: number;
            unsourced_count: number;
            sourced_count: number;
            total_count: number;
          };
          external_verification_score: {
            verification_score: number;
            external_verification_score?: number;
            verified_count?: number;
            partially_verified_count?: number;
            unverified_count?: number;
            total_count?: number;
          };
          temporal_consistency?: {
            inconsistencies: Array<{
              type: string;
              entity?: string;
              claim_id?: string;
              claim_text?: string;
              issue: string;
              values?: string[];
              verification_status?: string;
            }>;
            inconsistency_count: number;
            total_entities_checked: number;
          };
          fabrication_risk_score: {
            fabrication_risk_score: number;
            risk_level: string;
            high_risk_claims?: Array<{
              claim_id: string;
              claim_text: string;
              risk_score: number;
              factors: string[];
            }>;
            high_risk_count?: number;
            total_claims?: number;
          };
        };
      };
      contradictory_claims?: {
        total_pairs: number;
        pairs: Array<{
          contradiction_number: number;
          subject_predicate: string;
          grok_object: string;
          wiki_object: string;
          grok_sentence: string;
          wiki_sentence: string;
          grok_claim: any;
          wiki_claim: any;
          grok_verification: any;
          wiki_verification: any;
        }>;
      };
    };
    sentiment: {
      status: string;
      sentiment_analysis: {
        grokipedia_average_polarity: number;
        wikipedia_average_polarity: number;
        sentiment_shifts_count: number;
        sentiment_shifts?: Array<{
          section: string;
          grok_polarity: number;
          wiki_polarity: number;
          shift_magnitude: number;
          shift_direction: string;
        }>;
      };
      framing_analysis: {
        grokipedia_bias_score: number;
        wikipedia_bias_score: number;
        representation_balance?: {
          grokipedia: number;
          wikipedia: number;
        };
      };
      political_leaning: {
        grokipedia: string;
        wikipedia: string;
        grokipedia_scores?: {
          left_right_score: number;
          auth_lib_score: number;
          left_keywords_count: number;
          right_keywords_count: number;
          authoritarian_keywords_count: number;
          libertarian_keywords_count: number;
          quadrant: string;
          political_keywords_found: boolean;
        };
        wikipedia_scores?: {
          left_right_score: number;
          auth_lib_score: number;
          left_keywords_count: number;
          right_keywords_count: number;
          authoritarian_keywords_count: number;
          libertarian_keywords_count: number;
          quadrant: string;
          political_keywords_found: boolean;
        };
      };
    };
    multimodal: {
      status: string;
      summary: {
        wikipedia_article?: string;
        images_found: number;
        images_processed?: number;
        videos_found: number;
        audio_found?: number;
        media_processed?: number;
        text_chunks?: number;
      };
      textual_similarity?: {
        average_similarity: number;
        average_image_similarity: number;
        average_media_similarity: number;
        max_similarity: number;
        min_similarity: number;
        highest_matching_segments?: Array<{
          type: string;
          index: number;
          title: string;
          similarity: number;
          description: string;
        }>;
        lowest_matching_segments?: Array<{
          type: string;
          index: number;
          title: string;
          similarity: number;
          description: string;
        }>;
      };
      image_to_text_alignment?: {
        image_relevance_score: number;
        image_text_match_score: number;
        well_matched_images: number;
        total_images: number;
      };
      media_to_text_alignment?: {
        media_relevance_score: number;
        media_text_match_score: number;
        well_matched_media: number;
        total_media: number;
        videos_processed?: number;
        audio_processed?: number;
      };
      multimodal_consistency_index: {
        mci_score: number;
        image_alignment_component?: number;
        media_alignment_component?: number;
        multimodal_consistency_component?: number;
        breakdown?: {
          image_alignment_weight: number;
          media_alignment_weight: number;
          consistency_weight: number;
        };
      };
    };
    judging: {
      status: string;
      model: string;
      report_length?: number;
      report_preview: string;
      full_report?: string;
    };
  };
  errors?: string[];
  timestamp?: string;
  execution_time_seconds: number;
}

interface AnalysisResultsProps {
  data: AnalysisResult;
  showHeader?: boolean;
}

export default function AnalysisResults({
  data,
  showHeader = true,
}: AnalysisResultsProps) {
  const getScoreColor = (score: number, inverse: boolean = false) => {
    if (inverse) {
      if (score < 20) return "text-green-400";
      if (score < 50) return "text-yellow-400";
      return "text-red-400";
    }
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getDriftColor = (percentage: number) => {
    if (percentage < 50) return "text-green-400";
    if (percentage < 100) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      {showHeader && (
        <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-sentient font-light text-primary">
                Analysis Details
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Topic: <span className="text-foreground">{data.topic}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Analysis ID</p>
              <p className="text-sm text-foreground/70">{data.analysis_id}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.steps_completed.map((step) => (
              <span
                key={step}
                className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary"
              >
                ✓ {step}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Completed in {data.execution_time_seconds.toFixed(2)}s
          </p>
        </div>
      )}

      {/* Tabs Interface */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-black/90 border border-input rounded-lg p-2 w-full justify-start overflow-x-auto h-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',    // For Firefox
            msOverflowStyle: 'none',   // For Internet Explorer and Edge
          }}
        >
          <style jsx global>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <TabsTrigger 
            value="overview" 
            className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
          >
            <BarChart3 className="h-5 w-5" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="content" 
            className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
          >
            <FileText className="h-5 w-5" />
            Content
          </TabsTrigger>
          <TabsTrigger 
            value="triples" 
            className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
          >
            <Database className="h-5 w-5" />
            Knowledge Triples
          </TabsTrigger>
          <TabsTrigger 
            value="semantic" 
            className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
          >
            <Brain className="h-5 w-5" />
            Semantic Drift
          </TabsTrigger>
          <TabsTrigger 
            value="factcheck" 
            className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
          >
            <Shield className="h-5 w-5" />
            Fact Check
          </TabsTrigger>
          <TabsTrigger 
            value="sentiment" 
            className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
          >
            <MessageSquare className="h-5 w-5" />
            Sentiment & Bias
          </TabsTrigger>
          <TabsTrigger 
            value="multimodal" 
            className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
          >
            <Image className="h-5 w-5" />
            Multimodal
          </TabsTrigger>
          <TabsTrigger 
            value="judge" 
            className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
          >
            <Eye className="h-5 w-5" />
            AI Judge
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Fetch Stats */}
        <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg uppercase text-blue-400">Content Fetched</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Grokipedia</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.fetch.grokipedia.word_count.toLocaleString()} words
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Grokipedia Chars</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.fetch.grokipedia.char_count.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Wikipedia</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.fetch.wikipedia.word_count.toLocaleString()} words
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Wikipedia Chars</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.fetch.wikipedia.char_count.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">References</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.fetch.grokipedia.references_count + data.results.fetch.wikipedia.references_count}
              </span>
            </div>
            {data.results.fetch.grokipedia.sections !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-base text-muted-foreground">Sections</span>
                <span className="text-xl font-bold text-yellow-500 font-mono">
                  {data.results.fetch.grokipedia.sections}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Triple Analysis */}
        <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg uppercase text-purple-400">Knowledge Triples</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Total Triples</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.triple.basic_stats.total_triples.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Source A</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.triple.basic_stats.source_a_triples.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Source B</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.triple.basic_stats.source_b_triples.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Avg Similarity</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {(data.results.triple.semantic_similarity.average_similarity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Max Similarity</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {(data.results.triple.semantic_similarity.max_similarity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Contradictions</span>
              <span className={`text-xl font-bold font-mono ${data.results.triple.contradictions.contradiction_count > 0 ? "text-yellow-500" : "text-green-400"}`}>
                {data.results.triple.contradictions.contradiction_count}
              </span>
            </div>
          </div>
        </div>

        {/* Semantic Drift */}
        <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg uppercase text-cyan-400">Semantic Drift</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Drift Score</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.semanticdrift.semantic_drift_score.overall_drift_score.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Drift %</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.semanticdrift.semantic_drift_score.drift_percentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.results.semanticdrift.semantic_drift_score.interpretation}
            </p>
          </div>
        </div>

        {/* Fact Check - Grokipedia */}
        <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <h3 className="text-lg uppercase text-green-400">Grokipedia Verification</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Verification Score</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.factcheck.metrics.grokipedia.external_verification_score.verification_score}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Fabrication Risk</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.factcheck.metrics.grokipedia.fabrication_risk_score.fabrication_risk_score.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.results.factcheck.metrics.grokipedia.fabrication_risk_score.risk_level}
            </p>
          </div>
        </div>

        {/* Fact Check - Wikipedia */}
        <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg uppercase text-orange-400">Wikipedia Verification</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Verification Score</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.factcheck.metrics.wikipedia.external_verification_score.verification_score}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Fabrication Risk</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.factcheck.metrics.wikipedia.fabrication_risk_score.fabrication_risk_score.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.results.factcheck.metrics.wikipedia.fabrication_risk_score.risk_level}
            </p>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-pink-400" />
            <h3 className="text-lg uppercase text-pink-400">Sentiment & Bias</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Grok Polarity</span>
              <span className="text-xl font-bold text-yellow-500 font-mono flex items-center gap-1">
                {data.results.sentiment.sentiment_analysis.grokipedia_average_polarity > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                )}
                {data.results.sentiment.sentiment_analysis.grokipedia_average_polarity.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Wiki Polarity</span>
              <span className="text-xl font-bold text-yellow-500 font-mono flex items-center gap-1">
                {data.results.sentiment.sentiment_analysis.wikipedia_average_polarity > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                )}
                {data.results.sentiment.sentiment_analysis.wikipedia_average_polarity.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Sentiment Shifts</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.sentiment.sentiment_analysis.sentiment_shifts_count}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Grok Bias</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.sentiment.framing_analysis.grokipedia_bias_score.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Wiki Bias</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.sentiment.framing_analysis.wikipedia_bias_score.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Multimodal */}
        <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Image className="h-5 w-5 text-teal-400" />
            <h3 className="text-lg uppercase text-teal-400">Multimodal Analysis</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Images Found</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.multimodal.summary.images_found}
              </span>
            </div>
            {data.results.multimodal.summary.images_processed !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-base text-muted-foreground">Images Processed</span>
                <span className="text-xl font-bold text-yellow-500 font-mono">
                  {data.results.multimodal.summary.images_processed}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">Videos Found</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.multimodal.summary.videos_found}
              </span>
            </div>
            {data.results.multimodal.summary.text_chunks !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-base text-muted-foreground">Text Chunks</span>
                <span className="text-xl font-bold text-yellow-500 font-mono">
                  {data.results.multimodal.summary.text_chunks}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">MCI Score</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">
                {data.results.multimodal.multimodal_consistency_index.mci_score.toFixed(1)}%
              </span>
            </div>
            {data.results.multimodal.image_to_text_alignment && (
              <div className="flex justify-between items-center">
                <span className="text-base text-muted-foreground">Image Alignment</span>
                <span className="text-xl font-bold text-yellow-500 font-mono">
                  {data.results.multimodal.image_to_text_alignment.image_relevance_score.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-6 space-y-6">
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
            <h3 className="text-xl uppercase text-blue-400 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Fetching Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-base font-mono font-bold text-primary mb-4">Grokipedia</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">Words</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.fetch.grokipedia.word_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">Characters</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.fetch.grokipedia.char_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">References</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.fetch.grokipedia.references_count}
                    </span>
                  </div>
                  {data.results.fetch.grokipedia.sections !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-base text-muted-foreground">Sections</span>
                      <span className="text-2xl font-bold text-yellow-500 font-mono">
                        {data.results.fetch.grokipedia.sections}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-base font-mono font-bold text-orange-400 mb-4">Wikipedia</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">Words</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.fetch.wikipedia.word_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">Characters</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.fetch.wikipedia.char_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">References</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.fetch.wikipedia.references_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {data.results.fetch.files && (
              <div className="mt-4 pt-4 border-t border-input">
                <h4 className="text-sm font-mono text-muted-foreground mb-2">Files</h4>
                <div className="space-y-1">
                  <p className="text-xs text-foreground">Grokipedia: {data.results.fetch.files.grokipedia}</p>
                  <p className="text-xs text-foreground">Wikipedia: {data.results.fetch.files.wikipedia}</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Knowledge Triples Tab */}
        <TabsContent value="triples" className="mt-6 space-y-6">
          {/* Basic Stats */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
            <h3 className="text-xl uppercase text-purple-400 mb-6 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Basic Statistics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Total Triples</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.triple.basic_stats.total_triples.toLocaleString()}
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Source A Triples</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.triple.basic_stats.source_a_triples.toLocaleString()}
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Source B Triples</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.triple.basic_stats.source_b_triples.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-input">
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Avg Similarity</p>
                <p className="text-2xl font-bold text-yellow-500 font-mono">
                  {(data.results.triple.semantic_similarity.average_similarity * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Max Similarity</p>
                <p className="text-2xl font-bold text-yellow-500 font-mono">
                  {(data.results.triple.semantic_similarity.max_similarity * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Contradictions List */}
          {data.results.triple.contradictions.contradictions.length > 0 && (
            <div className="bg-black/90 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
              <h3 className="text-xl uppercase text-yellow-500 mb-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Detected Contradictions
              </h3>
              <div className="space-y-4">
                {data.results.triple.contradictions.contradictions.map((contradiction, index) => (
                  <div
                    key={index}
                    className="bg-black/50 border-2 border-yellow-500/30 rounded-xl p-6"
                  >
                    <div className="mb-4">
                      <p className="text-base font-mono text-muted-foreground mb-1">
                        Subject: <span className="text-lg font-bold text-foreground">{contradiction.subject}</span>
                      </p>
                      <p className="text-base font-mono text-muted-foreground">
                        Predicate: <span className="text-lg font-bold text-foreground">{contradiction.predicate}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-4">
                        <p className="text-sm font-mono font-bold text-red-400 mb-2 uppercase tracking-wide">Grokipedia says:</p>
                        <p className="text-lg font-bold text-red-500 leading-relaxed">{contradiction.source_a_object}</p>
                      </div>
                      <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-4">
                        <p className="text-sm font-mono font-bold text-green-400 mb-2 uppercase tracking-wide">Wikipedia says:</p>
                        <p className="text-lg font-bold text-green-500 leading-relaxed">{contradiction.source_b_object}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Triple Overlap Details */}
          {data.results.triple.triple_overlap && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-purple-400 mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Triple Overlap Analysis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Exact Overlap</p>
                  <p className="text-3xl font-bold text-yellow-500 font-mono mb-1">
                    {data.results.triple.triple_overlap.exact_overlap_count}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    Score: {(data.results.triple.triple_overlap.exact_overlap_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Fuzzy Overlap</p>
                  <p className="text-3xl font-bold text-yellow-500 font-mono mb-1">
                    {data.results.triple.triple_overlap.fuzzy_overlap_count}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    Score: {(data.results.triple.triple_overlap.fuzzy_overlap_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Unique to Source A</p>
                  <p className="text-3xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.triple_overlap.unique_to_source_a.toLocaleString()}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Unique to Source B</p>
                  <p className="text-3xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.triple_overlap.unique_to_source_b.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Graph Embeddings */}
          {data.results.triple.graph_embeddings && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-purple-400 mb-6 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Graph Embeddings Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(data.results.triple.graph_embeddings).map(([method, methodData]: [string, any]) => (
                  <div key={method} className="bg-black/50 border border-input rounded-xl p-5">
                    <h4 className="text-base font-mono font-bold text-primary mb-4 text-center">{method}</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Avg Similarity</span>
                        <span className="text-xl font-bold text-yellow-500 font-mono">{(methodData.average_similarity * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Max Similarity</span>
                        <span className="text-xl font-bold text-yellow-500 font-mono">{(methodData.max_similarity * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Entities</span>
                        <span className="text-xl font-bold text-yellow-500 font-mono">{methodData.entity_count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Relations</span>
                        <span className="text-xl font-bold text-yellow-500 font-mono">{methodData.relation_count.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graph Density & Entity Coherence */}
          {data.results.triple.graph_density && data.results.triple.entity_coherence && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-purple-400 mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Graph Density & Entity Coherence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Source A Density</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.graph_density.source_a_density.toFixed(2)}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Source B Density</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.graph_density.source_b_density.toFixed(2)}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Density Delta</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.graph_density.density_delta.toFixed(2)}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Density Ratio</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.graph_density.density_ratio.toFixed(2)}x
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-6 border-t border-input">
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Common Entities</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.entity_coherence.common_entities}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Consistent</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.entity_coherence.consistent_entities}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Partially Consistent</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.entity_coherence.partially_consistent_entities}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Coherence Score</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.entity_coherence.coherence_score.toFixed(2)}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Avg Overlap Ratio</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {(data.results.triple.entity_coherence.average_overlap_ratio * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Provenance Analysis */}
          {data.results.triple.provenance_analysis && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-purple-400 mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Provenance Analysis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Source A Cited</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono mb-1">
                    {data.results.triple.provenance_analysis.source_a_cited.toLocaleString()}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    ({data.results.triple.provenance_analysis.source_a_cited_percentage.toFixed(1)}%)
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Source B Cited</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono mb-1">
                    {data.results.triple.provenance_analysis.source_b_cited.toLocaleString()}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    ({data.results.triple.provenance_analysis.source_b_cited_percentage.toFixed(1)}%)
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Citation Gap</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.provenance_analysis.citation_gap.toLocaleString()}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Quality Score A</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.provenance_analysis.provenance_quality_score_a.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-input">
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Quality Score B</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.triple.provenance_analysis.provenance_quality_score_b.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Unsourced A</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono mb-1">
                    {data.results.triple.provenance_analysis.unsourced_triples_a.toLocaleString()}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    ({data.results.triple.provenance_analysis.unsourced_percentage_a.toFixed(1)}%)
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Unsourced B</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono mb-1">
                    {data.results.triple.provenance_analysis.unsourced_triples_b.toLocaleString()}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    ({data.results.triple.provenance_analysis.unsourced_percentage_b.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Semantic Drift Tab */}
        <TabsContent value="semantic" className="mt-6 space-y-6">
          {/* Overall Drift Score */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
            <h3 className="text-xl uppercase text-cyan-400 mb-6 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Semantic Drift Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Overall Drift Score</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.semanticdrift.semantic_drift_score.overall_drift_score.toFixed(2)}
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Drift Percentage</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.semanticdrift.semantic_drift_score.drift_percentage.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="pt-6 border-t border-input">
              <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Interpretation</p>
              <p className="text-base text-foreground">
                {data.results.semanticdrift.semantic_drift_score.interpretation}
              </p>
            </div>
          </div>

          {/* Component Scores */}
          {data.results.semanticdrift.semantic_drift_score.component_scores && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-cyan-400 mb-6 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Component Scores
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Sentence Embedding Drift</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.semanticdrift.semantic_drift_score.component_scores.sentence_embedding_drift.toFixed(3)}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Cross Encoder Drift</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.semanticdrift.semantic_drift_score.component_scores.cross_encoder_drift.toFixed(3)}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">KG Embedding Drift</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.semanticdrift.semantic_drift_score.component_scores.kg_embedding_drift.toFixed(3)}
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Topic Drift</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {data.results.semanticdrift.semantic_drift_score.component_scores.topic_drift.toFixed(3)}
                  </p>
                </div>
              </div>
              {data.results.semanticdrift.sentence_embeddings && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-input">
                  <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                    <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Sentence Avg Similarity</p>
                    <p className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.semanticdrift.sentence_embeddings.average_similarity.toFixed(3)}
                    </p>
                  </div>
                  {data.results.semanticdrift.cross_encoder && (
                    <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                      <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Cross Encoder Avg</p>
                      <p className="text-2xl font-bold text-yellow-500 font-mono">
                        {data.results.semanticdrift.cross_encoder.average_similarity.toFixed(3)}
                      </p>
                    </div>
                  )}
                  {data.results.semanticdrift.topic_modeling && (
                    <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                      <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Topic Divergence</p>
                      <p className="text-2xl font-bold text-yellow-500 font-mono">
                        {(data.results.semanticdrift.topic_modeling.topic_divergence * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              )}
              {data.results.semanticdrift.claim_alignment && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-input">
                  <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                    <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Total Claims Grokipedia</p>
                    <p className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.semanticdrift.claim_alignment.total_claims_grokipedia.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                    <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Total Claims Wikipedia</p>
                    <p className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.semanticdrift.claim_alignment.total_claims_wikipedia.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                    <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Alignment %</p>
                    <p className="text-2xl font-bold text-yellow-500 font-mono">
                      {data.results.semanticdrift.claim_alignment.alignment_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Knowledge Graph Embeddings */}
          {data.results.semanticdrift.knowledge_graph_embeddings && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-cyan-400 mb-6 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Knowledge Graph Embeddings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(data.results.semanticdrift.knowledge_graph_embeddings).map(([method, methodData]: [string, any]) => (
                  <div key={method} className="bg-black/50 border border-input rounded-xl p-5 text-center">
                    <h4 className="text-base font-mono font-bold text-primary mb-4">{method}</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Common Entities</p>
                        <p className="text-2xl font-bold text-yellow-500 font-mono">
                          {methodData.common_entities.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Avg Entity Similarity</p>
                        <p className="text-2xl font-bold text-yellow-500 font-mono">
                          {(methodData.average_entity_similarity * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </TabsContent>

        {/* Fact Check Tab */}
        <TabsContent value="factcheck" className="mt-6 space-y-6">
          {/* Summary */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
            <h3 className="text-xl uppercase text-green-400 mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Fact Check Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Total Contradictions</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.factcheck.summary.total_contradictions}
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Grok Claims Verified</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.factcheck.summary.grok_claims_verified}
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Wiki Claims Verified</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.factcheck.summary.wiki_claims_verified}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          {data.results.factcheck.metrics.grokipedia.unsourced_claim_ratio && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-green-400 mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Fact Check Detailed Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-base font-mono font-bold text-primary mb-4">Grokipedia</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base text-muted-foreground">Unsourced Ratio</span>
                      <span className="text-2xl font-bold text-yellow-500 font-mono">
                        {data.results.factcheck.metrics.grokipedia.unsourced_claim_ratio.unsourced_ratio.toFixed(1)}%
                      </span>
                    </div>
                    {data.results.factcheck.metrics.grokipedia.external_verification_score.external_verification_score !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">External Verification</span>
                        <span className="text-2xl font-bold text-yellow-500 font-mono">
                          {data.results.factcheck.metrics.grokipedia.external_verification_score.external_verification_score.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {data.results.factcheck.metrics.grokipedia.temporal_consistency && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Temporal Inconsistencies</span>
                        <span className="text-2xl font-bold text-yellow-500 font-mono">
                          {data.results.factcheck.metrics.grokipedia.temporal_consistency.inconsistency_count}
                        </span>
                      </div>
                    )}
                    {data.results.factcheck.metrics.grokipedia.fabrication_risk_score.high_risk_count !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">High Risk Claims</span>
                        <span className="text-2xl font-bold text-yellow-500 font-mono">
                          {data.results.factcheck.metrics.grokipedia.fabrication_risk_score.high_risk_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-mono font-bold text-orange-400 mb-4">Wikipedia</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base text-muted-foreground">Unsourced Ratio</span>
                      <span className="text-2xl font-bold text-yellow-500 font-mono">
                        {data.results.factcheck.metrics.wikipedia.unsourced_claim_ratio?.unsourced_ratio.toFixed(1)}%
                      </span>
                    </div>
                    {data.results.factcheck.metrics.wikipedia.external_verification_score.external_verification_score !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">External Verification</span>
                        <span className="text-2xl font-bold text-yellow-500 font-mono">
                          {data.results.factcheck.metrics.wikipedia.external_verification_score.external_verification_score.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {data.results.factcheck.metrics.wikipedia.temporal_consistency && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Temporal Inconsistencies</span>
                        <span className="text-2xl font-bold text-yellow-500 font-mono">
                          {data.results.factcheck.metrics.wikipedia.temporal_consistency.inconsistency_count}
                        </span>
                      </div>
                    )}
                    {data.results.factcheck.metrics.wikipedia.fabrication_risk_score.high_risk_count !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">High Risk Claims</span>
                        <span className="text-2xl font-bold text-yellow-500 font-mono">
                          {data.results.factcheck.metrics.wikipedia.fabrication_risk_score.high_risk_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Sentiment & Bias Tab */}
        <TabsContent value="sentiment" className="mt-6 space-y-6">
          {/* Overview */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
            <h3 className="text-xl uppercase text-pink-400 mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Sentiment Analysis Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Grok Polarity</p>
                <p className="text-2xl font-bold text-yellow-500 font-mono flex items-center justify-center gap-2">
                  {data.results.sentiment.sentiment_analysis.grokipedia_average_polarity > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  )}
                  {data.results.sentiment.sentiment_analysis.grokipedia_average_polarity.toFixed(2)}
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Wiki Polarity</p>
                <p className="text-2xl font-bold text-yellow-500 font-mono flex items-center justify-center gap-2">
                  {data.results.sentiment.sentiment_analysis.wikipedia_average_polarity > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  )}
                  {data.results.sentiment.sentiment_analysis.wikipedia_average_polarity.toFixed(2)}
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Sentiment Shifts</p>
                <p className="text-2xl font-bold text-yellow-500 font-mono">
                  {data.results.sentiment.sentiment_analysis.sentiment_shifts_count}
                </p>
              </div>
            </div>
          </div>

          {/* Bias Scores */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
            <h3 className="text-xl uppercase text-pink-400 mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Framing & Bias Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Grokipedia Bias Score</p>
                <p className="text-2xl font-bold text-yellow-500 font-mono">
                  {data.results.sentiment.framing_analysis.grokipedia_bias_score.toFixed(3)}
                </p>
              </div>
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Wikipedia Bias Score</p>
                <p className="text-2xl font-bold text-yellow-500 font-mono">
                  {data.results.sentiment.framing_analysis.wikipedia_bias_score.toFixed(3)}
                </p>
              </div>
            </div>
            {data.results.sentiment.framing_analysis.representation_balance && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-input">
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Grokipedia Representation</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {(data.results.sentiment.framing_analysis.representation_balance.grokipedia * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Wikipedia Representation</p>
                  <p className="text-2xl font-bold text-yellow-500 font-mono">
                    {(data.results.sentiment.framing_analysis.representation_balance.wikipedia * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sentiment Shifts */}
          {data.results.sentiment.sentiment_analysis.sentiment_shifts && data.results.sentiment.sentiment_analysis.sentiment_shifts.length > 0 && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-pink-400 mb-6 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Sentiment Shifts by Section
              </h3>
              <div className="space-y-4">
                {data.results.sentiment.sentiment_analysis.sentiment_shifts.slice(0, 5).map((shift, index) => (
                  <div key={index} className="bg-black/50 border border-input rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-base font-mono font-bold text-primary">{shift.section}</span>
                      <span className="text-sm text-muted-foreground">
                        {shift.shift_direction} ({shift.shift_magnitude.toFixed(3)})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Grokipedia</span>
                        <span className="text-xl font-bold text-yellow-500 font-mono">{shift.grok_polarity.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Wikipedia</span>
                        <span className="text-xl font-bold text-yellow-500 font-mono">{shift.wiki_polarity.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Multimodal Tab */}
        <TabsContent value="multimodal" className="mt-6 space-y-6">
          {/* Summary */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
            <h3 className="text-xl uppercase text-teal-400 mb-6 flex items-center gap-2">
              <Image className="h-5 w-5" />
              Multimodal Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Images Found</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.multimodal.summary.images_found}
                </p>
              </div>
              {data.results.multimodal.summary.images_processed !== undefined && (
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Images Processed</p>
                  <p className="text-3xl font-bold text-yellow-500 font-mono">
                    {data.results.multimodal.summary.images_processed}
                  </p>
                </div>
              )}
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Videos Found</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.multimodal.summary.videos_found}
                </p>
              </div>
              {data.results.multimodal.summary.text_chunks !== undefined && (
                <div className="bg-black/50 border border-input rounded-xl p-5 text-center">
                  <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">Text Chunks</p>
                  <p className="text-3xl font-bold text-yellow-500 font-mono">
                    {data.results.multimodal.summary.text_chunks}
                  </p>
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-input">
              <div className="bg-black/50 border border-input rounded-xl p-5 text-center max-w-xs mx-auto">
                <p className="text-sm font-mono text-muted-foreground mb-2 uppercase tracking-wide">MCI Score</p>
                <p className="text-3xl font-bold text-yellow-500 font-mono">
                  {data.results.multimodal.multimodal_consistency_index.mci_score.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Textual Similarity */}
          {data.results.multimodal.textual_similarity && (
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-teal-400 mb-6 flex items-center gap-2">
                <Image className="h-5 w-5" />
                Multimodal Textual Similarity
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">Avg Similarity</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {(data.results.multimodal.textual_similarity.average_similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">Image Similarity</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {(data.results.multimodal.textual_similarity.average_image_similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">Media Similarity</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {(data.results.multimodal.textual_similarity.average_media_similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-muted-foreground">Max Similarity</span>
                    <span className="text-2xl font-bold text-yellow-500 font-mono">
                      {(data.results.multimodal.textual_similarity.max_similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {data.results.multimodal.image_to_text_alignment && (
                  <div className="pt-6 border-t border-input">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Image Match Score</span>
                        <span className="text-2xl font-bold text-yellow-500 font-mono">
                          {data.results.multimodal.image_to_text_alignment.image_text_match_score.toFixed(1)}%
                        </span>
                      </div>
                      {data.results.multimodal.media_to_text_alignment && (
                        <div className="flex justify-between items-center">
                          <span className="text-base text-muted-foreground">Media Match Score</span>
                          <span className="text-2xl font-bold text-yellow-500 font-mono">
                            {data.results.multimodal.media_to_text_alignment.media_text_match_score.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-base text-muted-foreground">Well Matched Images</span>
                        <span className="text-2xl font-bold text-yellow-500 font-mono">
                          {data.results.multimodal.image_to_text_alignment.well_matched_images} / {data.results.multimodal.image_to_text_alignment.total_images}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* AI Judge Tab */}
        <TabsContent value="judge" className="mt-6">
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
            <h3 className="text-xl uppercase text-primary mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              AI Judge Report
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Model: <span className="text-foreground font-mono">{data.results.judging.model}</span>
              </p>
              {data.results.judging.report_length !== undefined && (
                <p className="text-sm text-muted-foreground">
                  Length: <span className="text-foreground font-mono">{data.results.judging.report_length.toLocaleString()} chars</span>
                </p>
              )}
            </div>
            <div className="bg-black/50 border border-input rounded-lg p-6 max-h-[600px] overflow-y-auto">
              <MarkdownRenderer content={data.results.judging.report_preview} />
            </div>
            {data.results.judging.full_report && (
              <details className="mt-6">
                <summary className="text-base font-mono text-primary cursor-pointer hover:text-yellow-500 transition-colors py-2">
                  View Full Report ({data.results.judging.report_length?.toLocaleString() || "N/A"} characters)
                </summary>
                <div className="bg-black/50 border border-input rounded-lg p-6 mt-4 max-h-[600px] overflow-y-auto">
                  <MarkdownRenderer content={data.results.judging.full_report} />
                </div>
              </details>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}