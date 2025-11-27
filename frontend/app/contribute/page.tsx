"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, BarChart3, FileText, Brain, Image, Scale, Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

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
      };
      wikipedia: {
        word_count: number;
        char_count: number;
        references_count: number;
      };
    };
    triple: {
      status: string;
      basic_stats: {
        source_a_triples: number;
        source_b_triples: number;
        total_triples: number;
      };
      semantic_similarity: {
        average_similarity: number;
        max_similarity: number;
      };
      contradictions: {
        contradiction_count: number;
        contradictions: Array<{
          subject: string;
          predicate: string;
          source_a_object: string;
          source_b_object: string;
        }>;
      };
    };
    semanticdrift: {
      status: string;
      semantic_drift_score: {
        overall_drift_score: number;
        drift_percentage: number;
        interpretation: string;
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
          fabrication_risk_score: {
            fabrication_risk_score: number;
            risk_level: string;
          };
          external_verification_score: {
            verification_score: number;
          };
        };
        wikipedia: {
          fabrication_risk_score: {
            fabrication_risk_score: number;
            risk_level: string;
          };
          external_verification_score: {
            verification_score: number;
          };
        };
      };
    };
    sentiment: {
      status: string;
      sentiment_analysis: {
        grokipedia_average_polarity: number;
        wikipedia_average_polarity: number;
        sentiment_shifts_count: number;
      };
      framing_analysis: {
        grokipedia_bias_score: number;
        wikipedia_bias_score: number;
      };
      political_leaning: {
        grokipedia: string;
        wikipedia: string;
      };
    };
    multimodal: {
      status: string;
      summary: {
        images_found: number;
        images_processed: number;
        videos_found: number;
      };
      multimodal_consistency_index: {
        mci_score: number;
      };
    };
    judging: {
      status: string;
      model: string;
      report_preview: string;
    };
  };
  execution_time_seconds: number;
}

export default function ContributePage() {
  const { walletAddress } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Form state
  const [title, setTitle] = useState("Cattle");
  const [sources, setSources] = useState<string[]>([
    "https://grok.com/grokipedia/cattle",
    "https://en.wikipedia.org/wiki/Cattle",
  ]);
  const [priceUsd, setPriceUsd] = useState("0.10");

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
    setAnalysisResult(null);

    try {
      const topicId = `topic_${uuidv4()}`;

      // Filter out empty sources
      const validSources = sources.filter((source) => source.trim() !== "");

      const payload = {
        topicId,
        topic: title,
        sources: validSources,
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setAnalysisResult(data);
      } else {
        setError(data.error || "Failed to analyze topic");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze topic");
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
          /* Analysis Results Display */
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-sentient font-light text-primary">
                    Analysis Complete
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Topic: <span className="text-foreground">{analysisResult.topic}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Analysis ID</p>
                  <p className="text-sm text-foreground/70">{analysisResult.analysis_id}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.steps_completed.map((step) => (
                  <span
                    key={step}
                    className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary"
                  >
                    ✓ {step}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Completed in {analysisResult.execution_time_seconds.toFixed(2)}s
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Fetch Stats */}
              <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg uppercase text-blue-400">Content Fetched</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Grokipedia</span>
                    <span className="text-lg text-foreground">
                      {analysisResult.results.fetch.grokipedia.word_count.toLocaleString()} words
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Wikipedia</span>
                    <span className="text-lg text-foreground">
                      {analysisResult.results.fetch.wikipedia.word_count.toLocaleString()} words
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">References</span>
                    <span className="text-lg text-foreground">
                      {analysisResult.results.fetch.grokipedia.references_count + analysisResult.results.fetch.wikipedia.references_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Triple Analysis */}
              <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg uppercase text-purple-400">Knowledge Triples</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Triples</span>
                    <span className="text-lg text-foreground">
                      {analysisResult.results.triple.basic_stats.total_triples.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Similarity</span>
                    <span className="text-lg text-foreground">
                      {(analysisResult.results.triple.semantic_similarity.average_similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contradictions</span>
                    <span className={`text-lg ${analysisResult.results.triple.contradictions.contradiction_count > 0 ? "text-yellow-400" : "text-green-400"}`}>
                      {analysisResult.results.triple.contradictions.contradiction_count}
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Drift Score</span>
                    <span className={`text-lg ${getDriftColor(analysisResult.results.semanticdrift.semantic_drift_score.drift_percentage)}`}>
                      {analysisResult.results.semanticdrift.semantic_drift_score.overall_drift_score.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Drift %</span>
                    <span className={`text-lg ${getDriftColor(analysisResult.results.semanticdrift.semantic_drift_score.drift_percentage)}`}>
                      {analysisResult.results.semanticdrift.semantic_drift_score.drift_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysisResult.results.semanticdrift.semantic_drift_score.interpretation}
                  </p>
                </div>
              </div>

              {/* Fact Check - Grokipedia */}
              <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg uppercase text-green-400">Grokipedia Verification</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Verification Score</span>
                    <span className={`text-lg ${getScoreColor(analysisResult.results.factcheck.metrics.grokipedia.external_verification_score.verification_score)}`}>
                      {analysisResult.results.factcheck.metrics.grokipedia.external_verification_score.verification_score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fabrication Risk</span>
                    <span className={`text-lg ${getScoreColor(analysisResult.results.factcheck.metrics.grokipedia.fabrication_risk_score.fabrication_risk_score, true)}`}>
                      {analysisResult.results.factcheck.metrics.grokipedia.fabrication_risk_score.fabrication_risk_score.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysisResult.results.factcheck.metrics.grokipedia.fabrication_risk_score.risk_level}
                  </p>
                </div>
              </div>

              {/* Fact Check - Wikipedia */}
              <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg uppercase text-orange-400">Wikipedia Verification</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Verification Score</span>
                    <span className={`text-lg ${getScoreColor(analysisResult.results.factcheck.metrics.wikipedia.external_verification_score.verification_score)}`}>
                      {analysisResult.results.factcheck.metrics.wikipedia.external_verification_score.verification_score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fabrication Risk</span>
                    <span className={`text-lg ${getScoreColor(analysisResult.results.factcheck.metrics.wikipedia.fabrication_risk_score.fabrication_risk_score, true)}`}>
                      {analysisResult.results.factcheck.metrics.wikipedia.fabrication_risk_score.fabrication_risk_score.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysisResult.results.factcheck.metrics.wikipedia.fabrication_risk_score.risk_level}
                  </p>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="h-5 w-5 text-pink-400" />
                  <h3 className="text-lg uppercase text-pink-400">Sentiment & Bias</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Grok Polarity</span>
                    <span className="text-lg text-foreground flex items-center gap-1">
                      {analysisResult.results.sentiment.sentiment_analysis.grokipedia_average_polarity > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      {analysisResult.results.sentiment.sentiment_analysis.grokipedia_average_polarity.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Wiki Polarity</span>
                    <span className="text-lg text-foreground flex items-center gap-1">
                      {analysisResult.results.sentiment.sentiment_analysis.wikipedia_average_polarity > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      {analysisResult.results.sentiment.sentiment_analysis.wikipedia_average_polarity.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sentiment Shifts</span>
                    <span className="text-lg text-foreground">
                      {analysisResult.results.sentiment.sentiment_analysis.sentiment_shifts_count}
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Images Found</span>
                    <span className="text-lg text-foreground">
                      {analysisResult.results.multimodal.summary.images_found}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Videos Found</span>
                    <span className="text-lg text-foreground">
                      {analysisResult.results.multimodal.summary.videos_found}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">MCI Score</span>
                    <span className={`text-lg ${getScoreColor(analysisResult.results.multimodal.multimodal_consistency_index.mci_score)}`}>
                      {analysisResult.results.multimodal.multimodal_consistency_index.mci_score.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contradictions List */}
            {analysisResult.results.triple.contradictions.contradictions.length > 0 && (
              <div className="bg-black/90 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
                <h3 className="text-xl uppercase text-yellow-500 mb-4">
                  Detected Contradictions
                </h3>
                <div className="space-y-3">
                  {analysisResult.results.triple.contradictions.contradictions.map((contradiction, index) => (
                    <div
                      key={index}
                      className="bg-black/50 border border-yellow-500/20 rounded-lg p-4"
                    >
                      <p className="text-sm text-muted-foreground mb-2">
                        Subject: <span className="text-foreground">{contradiction.subject}</span> | 
                        Predicate: <span className="text-foreground">{contradiction.predicate}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-blue-400 mb-1">Grokipedia says:</p>
                          <p className="text-sm text-foreground">{contradiction.source_a_object}</p>
                        </div>
                        <div>
                          <p className="text-xs text-orange-400 mb-1">Wikipedia says:</p>
                          <p className="text-sm text-foreground">{contradiction.source_b_object}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Judging Report Preview */}
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6">
              <h3 className="text-xl uppercase text-primary mb-4">
                AI Judge Report Preview
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Model: {analysisResult.results.judging.model}
              </p>
              <div className="bg-black/50 border border-input rounded-lg p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {analysisResult.results.judging.report_preview}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => setAnalysisResult(null)}
                className="flex-1 bg-transparent border border-input hover:bg-white/5 text-foreground"
              >
                ← Analyze Another Topic
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold font-mono"
              >
                🚀 Publish to DKG (${priceUsd})
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
