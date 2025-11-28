"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, X, CheckCircle2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import AnalysisResults from "@/components/analysis-results";

interface AnalysisResult {
  status: string;
  analysis_id: string;
  topic: string;
  steps_completed: string[];
  image_urls?: {
    "similarity_heatmap.png"?: string;
    "embedding_space.png"?: string;
    "bias_compass.png"?: string;
  };
  results: {
    fetch: {
      status: string;
      grokipedia: {
        word_count: number;
        char_count: number;
        references_count: number;
        sections: number;
      };
      wikipedia: {
        word_count: number;
        char_count: number;
        references_count: number;
      };
      files: {
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
      triple_overlap: {
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
        similar_pairs_count: number;
        similar_pairs_percentage: number;
        method: string;
      };
      graph_embeddings: {
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
      graph_density: {
        source_a_density: number;
        source_b_density: number;
        density_delta: number;
        density_ratio: number;
      };
      entity_coherence: {
        common_entities: number;
        consistent_entities: number;
        partially_consistent_entities: number;
        coherence_score: number;
        average_overlap_ratio: number;
        inconsistent_examples: Array<{
          entity: string;
          overlap_ratio: number;
          source_a_relations: string[];
          source_b_relations: string[];
        }>;
      };
      provenance_analysis: {
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
        filtered_noise_triples_a: number;
        filtered_noise_triples_b: number;
      };
    };
    semanticdrift: {
      status: string;
      semantic_drift_score: {
        overall_drift_score: number;
        drift_percentage: number;
        component_scores: {
          sentence_embedding_drift: number;
          cross_encoder_drift: number;
          kg_embedding_drift: number;
          topic_drift: number;
        };
        interpretation: string;
      };
      sentence_embeddings: {
        average_similarity: number;
        max_similarity: number;
        min_similarity: number;
      };
      cross_encoder: {
        average_similarity: number;
      };
      knowledge_graph_embeddings: {
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
      topic_modeling: {
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
      claim_alignment: {
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
          unsourced_claim_ratio: {
            unsourced_ratio: number;
            unsourced_count: number;
            sourced_count: number;
            total_count: number;
          };
          external_verification_score: {
            verification_score: number;
            external_verification_score: number;
            verified_count: number;
            partially_verified_count: number;
            unverified_count: number;
            total_count: number;
          };
          temporal_consistency: {
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
            high_risk_claims: Array<{
              claim_id: string;
              claim_text: string;
              risk_score: number;
              factors: string[];
            }>;
            high_risk_count: number;
            total_claims: number;
          };
        };
        wikipedia: {
          unsourced_claim_ratio: {
            unsourced_ratio: number;
            unsourced_count: number;
            sourced_count: number;
            total_count: number;
          };
          external_verification_score: {
            verification_score: number;
            external_verification_score: number;
            verified_count: number;
            partially_verified_count: number;
            unverified_count: number;
            total_count: number;
          };
          temporal_consistency: {
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
            high_risk_claims: Array<{
              claim_id: string;
              claim_text: string;
              risk_score: number;
              factors: string[];
            }>;
            high_risk_count: number;
            total_claims: number;
          };
        };
      };
      contradictory_claims: {
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
        sentiment_shifts: Array<{
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
        representation_balance: {
          grokipedia: number;
          wikipedia: number;
        };
      };
      political_leaning: {
        grokipedia: string;
        wikipedia: string;
        grokipedia_scores: {
          left_right_score: number;
          auth_lib_score: number;
          left_keywords_count: number;
          right_keywords_count: number;
          authoritarian_keywords_count: number;
          libertarian_keywords_count: number;
          quadrant: string;
          political_keywords_found: boolean;
        };
        wikipedia_scores: {
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
        wikipedia_article: string;
        images_found: number;
        images_processed: number;
        videos_found: number;
        audio_found: number;
        media_processed: number;
        text_chunks: number;
      };
      textual_similarity: {
        average_similarity: number;
        average_image_similarity: number;
        average_media_similarity: number;
        max_similarity: number;
        min_similarity: number;
        highest_matching_segments: Array<{
          type: string;
          index: number;
          title: string;
          similarity: number;
          description: string;
        }>;
        lowest_matching_segments: Array<{
          type: string;
          index: number;
          title: string;
          similarity: number;
          description: string;
        }>;
      };
      image_to_text_alignment: {
        image_relevance_score: number;
        image_text_match_score: number;
        well_matched_images: number;
        total_images: number;
      };
      media_to_text_alignment: {
        media_relevance_score: number;
        media_text_match_score: number;
        well_matched_media: number;
        total_media: number;
        videos_processed: number;
        audio_processed: number;
      };
      multimodal_consistency_index: {
        mci_score: number;
        image_alignment_component: number;
        media_alignment_component: number;
        multimodal_consistency_component: number;
        breakdown: {
          image_alignment_weight: number;
          media_alignment_weight: number;
          consistency_weight: number;
        };
      };
    };
    judging: {
      status: string;
      model: string;
      report_length: number;
      report_preview: string;
      full_report: string;
    };
  };
  errors: string[];
  timestamp: string;
  execution_time_seconds: number;
}

export default function ContributePage() {
  const { walletAddress } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ ual: string; verification_url?: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [progressStatus, setProgressStatus] = useState<{
    current_step?: string;
    step_number?: number;
    total_steps?: number;
    progress_percentage?: number;
    message?: string;
  } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [sources, setSources] = useState<string[]>([""]);
  const [priceUsd, setPriceUsd] = useState("");
  const [suggestedEdit, setSuggestedEdit] = useState("");

  const addSource = () => {
    setSources([...sources, ""]);
  };

  const removeSource = (index: number) => {
    if (sources.length > 1) {
      setSources(sources.filter((_, i) => i !== index));
    }
  };

  const updateSource = (index: number, value: string) => {
    const updated = [...sources];
    updated[index] = value;
    setSources(updated);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setAnalysisResult(null);
    setProgressStatus(null);

    try {
      // Filter out empty sources
      const validSources = sources.filter((source) => source.trim() !== "");

      if (validSources.length === 0) {
        setError("Please add at least one source");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("topic", title);
      validSources.forEach((source) => formData.append("sources", source));
      if (suggestedEdit) {
        formData.append("suggested_edit", suggestedEdit);
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      
      // Check if analysis has started and needs progress tracking
      if (data.status === "started") {
        // Start polling for progress
        pollProgress();
      } else {
        // Analysis completed immediately
        setAnalysisResult(data);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setLoading(false);
    }
  };

  const pollProgress = async () => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("/api/analyze/progress");
        
        if (!response.ok) {
          throw new Error("Failed to fetch progress");
        }

        const data = await response.json();

        if (data.status === "in_progress" || data.current_step) {
          setProgressStatus({
            current_step: data.current_step,
            step_number: data.step_number,
            total_steps: data.total_steps,
            progress_percentage: data.progress_percentage,
            message: data.message,
          });
        } else if (data.status === "success" || data.results) {
          // Analysis complete
          clearInterval(intervalId);
          setProgressStatus(null);
          setAnalysisResult(data);
          setLoading(false);
        } else if (data.status === "error" || data.errors?.length > 0) {
          clearInterval(intervalId);
          setProgressStatus(null);
          setError(data.errors?.[0] || "Analysis failed");
          setLoading(false);
        }
      } catch (err) {
        clearInterval(intervalId);
        setProgressStatus(null);
        setError(err instanceof Error ? err.message : "Failed to fetch progress");
        setLoading(false);
      }
    }, 25000); // Poll every 25 seconds
  };

  const handlePublish = async () => {
    if (!analysisResult) {
      setError("No analysis result to publish");
      return;
    }

    if (!walletAddress) {
      setError("Please connect your wallet to publish");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Extract topicId from analysis_id or generate a new one
      // analysis_id format: "analysis_20251127_161539_Cattle" or "topic_<uuid>"
      let topicId = analysisResult.analysis_id;
      if (topicId.startsWith("analysis_")) {
        // Extract the topic name from analysis_id and create topic_<uuid>
        topicId = `topic_${uuidv4()}`;
      } else if (!topicId.startsWith("topic_")) {
        // If it doesn't start with topic_, add the prefix
        topicId = `topic_${topicId}`;
      }

      // Ensure all required data is included
      const payload = {
        topicId,
        title: title || analysisResult.topic,
        contributionType: "User contributed" as const,
        walletAddress: walletAddress,
        priceUsd: parseFloat(priceUsd) || 0,
        // Send the complete analysis result with all fields
        analysisResult: {
          status: analysisResult.status,
          analysis_id: analysisResult.analysis_id,
          topic: analysisResult.topic,
          steps_completed: analysisResult.steps_completed,
          image_urls: analysisResult.image_urls || undefined,
          results: {
            fetch: analysisResult.results.fetch,
            triple: analysisResult.results.triple,
            semanticdrift: analysisResult.results.semanticdrift,
            factcheck: analysisResult.results.factcheck,
            sentiment: analysisResult.results.sentiment,
            multimodal: analysisResult.results.multimodal,
            judging: analysisResult.results.judging,
          },
          errors: analysisResult.errors || [],
          timestamp: analysisResult.timestamp || new Date().toISOString(),
          execution_time_seconds: analysisResult.execution_time_seconds,
        },
      };

      console.log("Publishing payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/dkgpedia/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message with DKG response
        setSuccess({
          ual: data.ual || "N/A",
          verification_url: data.verification_url,
        });
        // Reset to initial state
        setAnalysisResult(null);
        setError(null);
      } else {
        setError(data.error || "Failed to publish to DKG");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish to DKG");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen pt-36 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-sentient text-5xl font-light mb-4 text-center">
            <i>Contribute</i>
          </h1>
          <p className="text-base font-mono text-muted-foreground text-center">
            Help Us Create a More Accurate Grokipedia, one search term at a time.
          </p>
        </div>

        {/* Progress Status */}
        {loading && progressStatus && (
          <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <h2 className="text-2xl font-sentient text-primary">Analyzing Content</h2>
            </div>
            
            {progressStatus.progress_percentage !== undefined && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-mono text-muted-foreground">
                    Step {progressStatus.step_number} of {progressStatus.total_steps}
                  </span>
                  <span className="text-sm font-mono text-primary">
                    {progressStatus.progress_percentage}%
                  </span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-3 border border-input overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressStatus.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}

            {progressStatus.current_step && (
              <div className="text-center space-y-2">
                <p className="text-lg font-mono text-foreground uppercase tracking-wide">
                  {progressStatus.current_step}
                </p>
                {progressStatus.message && (
                  <p className="text-sm text-muted-foreground">
                    {progressStatus.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Simple Loading State (when no progress data yet) */}
        {loading && !progressStatus && !analysisResult && (
          <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xl text-muted-foreground">Starting analysis...</p>
            </div>
          </div>
        )}

        {!analysisResult ? (
          <form onSubmit={handleAnalyze} className="space-y-6 max-w-2xl mx-auto">
            {/* Basic Information */}
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-mono uppercase text-primary">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-mono text-muted-foreground mb-2">
                    Title / Topic *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Cattle, Artificial Intelligence, etc."
                    required
                    className="w-full bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-mono uppercase text-primary">Sources</h2>
                <Button
                  type="button"
                  onClick={addSource}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>

              <div className="space-y-3">
                {sources.map((source, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => updateSource(index, e.target.value)}
                      placeholder="e.g., https://grok.com/grokipedia/topic"
                      required
                      className="flex-1 bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {sources.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeSource(index)}
                        className="bg-transparent border-transparent hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Add at least one source URL to support your contribution
              </p>
            </div>

            {/* Suggested Edit (Optional) */}
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-mono uppercase text-primary">Suggested Edit</h2>
              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  Provide any corrections or suggestions for the analysis
                </label>
                <textarea
                  value={suggestedEdit}
                  onChange={(e) => setSuggestedEdit(e.target.value)}
                  placeholder="e.g., The article incorrectly states that... It should be..."
                  rows={4}
                  className="w-full bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  This will be used to improve the analysis quality
                </p>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-gradient-to-br from-yellow-500/10 via-black/90 to-yellow-500/5 backdrop-blur-sm border-2 border-yellow-500/30 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-mono uppercase text-yellow-500">Payment Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-mono text-muted-foreground mb-2">
                    Wallet Address (Auto-filled)
                  </label>
                  <input
                    type="text"
                    value={walletAddress || ""}
                    disabled
                    className="w-full bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground/50 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono text-muted-foreground mb-2">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 font-mono">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      placeholder="0.10"
                      required
                      className="w-full bg-black/50 border border-yellow-500/30 rounded-lg pl-8 pr-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    />
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-2">
                    Users will pay this amount to access your analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="text-sm font-mono text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold font-mono text-lg py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "🔍 Analyze Topic"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <AnalysisResults 
              data={analysisResult}
              showHeader={true}
            />

            {/* Action Buttons */}
            <div className="flex gap-4 max-w-4xl mx-auto">
              <Button
                onClick={() => setAnalysisResult(null)}
                disabled={loading}
                className="flex-1 bg-transparent border border-input hover:bg-white/5 text-foreground"
              >
                ← Analyze Another Topic
              </Button>
              <Button
                onClick={handlePublish}
                disabled={loading || !walletAddress}
                className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold font-mono"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  `🚀 Publish to DKG`
                )}
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 max-w-4xl mx-auto">
                <p className="text-sm font-mono text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Modal */}
      <Dialog open={!!success} onOpenChange={(open) => {
        if (!open) {
          setSuccess(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Successfully Published
            </DialogTitle>
            <DialogDescription className="pt-2">
              Your analysis has been successfully published to OriginTrail DKG.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">Universal Asset Locator (UAL):</p>
                {success?.ual ? (
                  <a
                    href={`https://dkg-testnet.origintrail.io/explore?ual=${encodeURIComponent(success.ual)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono bg-black/50 border border-input rounded-lg px-3 py-2 break-all inline-block text-yellow-500 hover:underline"
                  >
                    {success.ual}
                  </a>
                ) : (
                  <span className="text-sm font-mono bg-black/50 border border-input rounded-lg px-3 py-2 break-all">
                    N/A
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setSuccess(null)}
              className="bg-primary hover:bg-primary/90 text-black font-bold font-mono"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
