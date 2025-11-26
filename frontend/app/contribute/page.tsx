"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";

interface CategoryMetric {
  name: string;
  value: number;
}

interface NotableInstance {
  category: string;
  content: string;
}

export default function ContributePage() {
  const router = useRouter();
  const { walletAddress } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state (pre-filled for testing)
  const [topicId, setTopicId] = useState("artificial-intelligence-2024");
  const [title, setTitle] = useState("Artificial Intelligence in 2024");
  const [summary, setSummary] = useState("A comprehensive analysis of AI developments in 2024, including breakthrough models, ethical considerations, and real-world applications. This knowledge asset covers major advancements in large language models, computer vision, and autonomous systems, while addressing concerns about AI safety, bias, and regulation.");
  const [trustScore, setTrustScore] = useState(85);
  const [primarySource, setPrimarySource] = useState("AI Research Database 2024");
  const [secondarySource, setSecondarySource] = useState("Technology Industry Reports");
  const [priceUsd, setPriceUsd] = useState("0.10");
  
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetric[]>([
    { name: "accuracy", value: 95 },
    { name: "citations", value: 42 },
    { name: "peer-reviews", value: 8 },
  ]);
  
  const [notableInstances, setNotableInstances] = useState<NotableInstance[]>([
    { 
      category: "breakthrough", 
      content: "GPT-4 and similar models achieved human-level performance on various professional exams and creative tasks." 
    },
    { 
      category: "application", 
      content: "AI-powered medical diagnosis systems demonstrated 98% accuracy in detecting certain cancers from imaging data." 
    },
    { 
      category: "concern", 
      content: "Deepfake technology raised significant concerns about misinformation and digital identity verification." 
    },
  ]);

  const addCategoryMetric = () => {
    setCategoryMetrics([...categoryMetrics, { name: "", value: 0 }]);
  };

  const removeCategoryMetric = (index: number) => {
    if (categoryMetrics.length > 1) {
      setCategoryMetrics(categoryMetrics.filter((_, i) => i !== index));
    }
  };

  const updateCategoryMetric = (index: number, field: "name" | "value", value: string | number) => {
    const updated = [...categoryMetrics];
    if (field === "name") {
      updated[index].name = String(value);
    } else {
      updated[index].value = Number(value);
    }
    setCategoryMetrics(updated);
  };

  const addNotableInstance = () => {
    setNotableInstances([...notableInstances, { category: "", content: "" }]);
  };

  const removeNotableInstance = (index: number) => {
    if (notableInstances.length > 1) {
      setNotableInstances(notableInstances.filter((_, i) => i !== index));
    }
  };

  const updateNotableInstance = (index: number, field: "category" | "content", value: string) => {
    const updated = [...notableInstances];
    updated[index][field] = value;
    setNotableInstances(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert categoryMetrics array to object
      const metricsObj: Record<string, number> = {};
      categoryMetrics.forEach((metric) => {
        if (metric.name && metric.value !== undefined) {
          metricsObj[metric.name] = parseInt(String(metric.value));
        }
      });

      // Filter out empty notable instances
      const filteredInstances = notableInstances.filter(
        (inst) => inst.content && inst.category
      );

      const payload = {
        topicId,
        title: title || topicId,
        summary,
        trustScore: parseInt(String(trustScore)),
        categoryMetrics: metricsObj,
        notableInstances: filteredInstances,
        primarySource,
        secondarySource,
        contributionType: "User contributed",
        walletAddress: walletAddress,
        priceUsd: parseFloat(priceUsd),
      };

      const response = await fetch("/api/dkgpedia/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Reset form after 2 seconds and redirect
        setTimeout(() => {
          router.push(`/asset/${encodeURIComponent(topicId)}`);
        }, 2000);
      } else {
        setError(data.error || "Failed to publish knowledge asset");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish knowledge asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-sentient text-5xl font-light mb-4">
            <i>Contribute</i>
          </h1>
          <p className="text-base font-mono text-muted-foreground">
            Share your knowledge with the DKG community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-mono uppercase text-primary">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  Topic ID *
                </label>
                <input
                  type="text"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  placeholder="e.g., artificial-intelligence-2024"
                  required
                  className="w-full bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional title for the knowledge asset"
                  className="w-full bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  Summary *
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Comprehensive summary of findings..."
                  required
                  rows={6}
                  className="w-full bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  Trust Score: {trustScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trustScore}
                  onChange={(e) => setTrustScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs font-mono text-muted-foreground mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-mono uppercase text-primary">Sources</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  Primary Source *
                </label>
                <input
                  type="text"
                  value={primarySource}
                  onChange={(e) => setPrimarySource(e.target.value)}
                  placeholder="e.g., Research Database 2024"
                  required
                  className="w-full bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-2">
                  Secondary Source *
                </label>
                <input
                  type="text"
                  value={secondarySource}
                  onChange={(e) => setSecondarySource(e.target.value)}
                  placeholder="e.g., Historical Records"
                  required
                  className="w-full bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Category Metrics */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-mono uppercase text-primary">Category Metrics</h2>
              <Button
                type="button"
                onClick={addCategoryMetric}
                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </div>

            <div className="space-y-3">
              {categoryMetrics.map((metric, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Category name (e.g., accuracy)"
                    value={metric.name}
                    onChange={(e) => updateCategoryMetric(index, "name", e.target.value)}
                    className="flex-1 bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="number"
                    placeholder="Count"
                    value={metric.value}
                    onChange={(e) => updateCategoryMetric(index, "value", parseInt(e.target.value) || 0)}
                    className="w-32 bg-black/50 border border-input rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {categoryMetrics.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeCategoryMetric(index)}
                      className="bg-transparent border-transparent hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notable Instances */}
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-mono uppercase text-primary">Notable Instances</h2>
              <Button
                type="button"
                onClick={addNotableInstance}
                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Instance
              </Button>
            </div>

            <div className="space-y-4">
              {notableInstances.map((instance, index) => (
                <div key={index} className="bg-black/50 border border-input/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Category"
                      value={instance.category}
                      onChange={(e) => updateNotableInstance(index, "category", e.target.value)}
                      className="flex-1 bg-black/50 border border-input rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {notableInstances.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeNotableInstance(index)}
                        className="ml-3 bg-transparent border-transparent hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <textarea
                    placeholder="Content"
                    value={instance.content}
                    onChange={(e) => updateNotableInstance(index, "content", e.target.value)}
                    rows={3}
                    className="w-full bg-black/50 border border-input rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              ))}
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
                  Users will pay this amount to access your knowledge asset
                </p>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm font-mono text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <p className="text-sm font-mono text-primary">
                ✅ Knowledge asset published successfully! Redirecting...
              </p>
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
                Publishing to DKG...
              </>
            ) : (
              "🚀 Publish to DKG"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

