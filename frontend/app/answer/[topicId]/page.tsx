"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, FileText, CheckCircle2, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentInfoModal } from "@/components/payment-info-modal";
import { useWallet } from "@/contexts/wallet-context";
import AnalysisResults from "@/components/analysis-results";
import MarkdownRenderer from "@/components/markdown-renderer";
import DiffViewer from "@/components/diff-viewer";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// @ts-ignore - x402-axios types
import { withPaymentInterceptor } from "x402-axios";

interface AnswerData {
  originalContent: string;
  correctedContent: string;
  analysisResult?: any;
  topic: string;
}

// Axios instance for Next.js API routes (relative URLs)
const nextApiClient = axios.create({
  baseURL: "", // Empty baseURL means relative to current origin
  headers: {
    "Content-Type": "application/json",
  },
});

export default function AnswerPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = decodeURIComponent(params.topicId as string);
  const { walletConnected, walletClient, connectWallet } = useWallet();
  
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<AnswerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [needsPayment, setNeedsPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ priceUsd: number; title: string } | null>(null);
  const [progressStatus, setProgressStatus] = useState<{
    current_step?: string;
    step_number?: number;
    total_steps?: number;
    progress_percentage?: number;
    message?: string;
  } | null>(null);
  const [isFetching, setIsFetching] = useState(false); // Guard to prevent concurrent fetches
  const [hasPublished, setHasPublished] = useState(false); // Track if we've already published for this topicId
  const [publishedUal, setPublishedUal] = useState<string | null>(null); // Store published UAL

  // Handle mounting and load from sessionStorage
  useEffect(() => {
    setMounted(true);
    
    // Try to load from sessionStorage after mount
    const cached = sessionStorage.getItem(`answer_${topicId}`);
    if (cached) {
      try {
        const parsedData = JSON.parse(cached);
        setData(parsedData);
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse cached answer data:", e);
      }
    }
  }, [topicId]);

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    if (mounted && data) {
      sessionStorage.setItem(`answer_${topicId}`, JSON.stringify(data));
    }
  }, [data, topicId, mounted]);

  // Clear sessionStorage when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      sessionStorage.removeItem(`answer_${topicId}`);
    };
  }, [topicId]);

  // Fetch data if not cached
  useEffect(() => {
    if (mounted && topicId && !data && !isFetching) {
      fetchAnswer();
    }
  }, [topicId, mounted, data, isFetching]);

  const pollAnalyzeLiteProgress = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      let isCompleted = false;
      const intervalId = setInterval(async () => {
        if (isCompleted) {
          console.log("⚠️ Already completed, skipping poll");
          return;
        }

        try {
          console.log("📡 Polling /api/analyze-lite/progress...");
          const response = await fetch("/api/analyze-lite/progress");
          
          if (!response.ok) {
            throw new Error("Failed to fetch progress");
          }

          const data = await response.json();
          console.log("📥 Progress response:", JSON.stringify(data, null, 2));

          // Check for completion FIRST before checking in_progress
          if (data.status === "completed" || data.current_step === "completed" || (data.results && data.progress_percentage === 100)) {
            // Analysis complete - transform the structure to match expected format
            console.log("✅ Analysis complete! Stopping polling.");
            isCompleted = true;
            clearInterval(intervalId);
            setProgressStatus(null);
            
            // Transform the nested structure: data.results.results -> data.results
            const transformedData = {
              status: data.status || "success",
              analysis_id: data.analysis_id,
              topic: data.results?.topic || data.topic,
              steps_completed: data.results?.steps_completed || [],
              results: data.results?.results || data.results,
              errors: data.errors || [],
              timestamp: data.timestamp,
              execution_time_seconds: data.execution_time_seconds || 0,
              image_urls: data.results?.image_urls || data.image_urls,
            };
            
            resolve(transformedData);
          } else if (data.status === "in_progress" || (data.current_step && data.current_step !== "completed")) {
            console.log(`⏳ In progress: ${data.current_step} (${data.progress_percentage}%)`);
            setProgressStatus({
              current_step: data.current_step,
              step_number: data.step_number,
              total_steps: data.total_steps,
              progress_percentage: data.progress_percentage,
              message: data.message,
            });
            setLoadingStep(data.message || data.current_step || "Processing...");
          } else if (data.status === "error" || data.errors?.length > 0) {
            console.log("❌ Analysis error:", data.errors?.[0]);
            isCompleted = true;
            clearInterval(intervalId);
            setProgressStatus(null);
            reject(new Error(data.errors?.[0] || "Analysis failed"));
          } else {
            console.log("⚠️ Unexpected response format:", data);
          }
        } catch (err) {
          console.error("❌ Error polling progress:", err);
          isCompleted = true;
          clearInterval(intervalId);
          setProgressStatus(null);
          reject(err);
        }
      }, 25000); // Poll every 25 seconds
    });
  };

  const fetchAnswer = async () => {
    // Prevent concurrent execution
    if (isFetching) {
      console.log("⚠️ fetchAnswer already in progress, skipping duplicate call");
      return;
    }

    try {
      setIsFetching(true);
      setLoading(true);
      setLoadingStep("Checking DKG for existing data...");
      setError(null);
      setNeedsPayment(false);

      console.log("🔍 Fetching answer for topic:", topicId);

      // Use Next.js API route with payment interceptor if wallet is connected
      const apiClient = walletClient 
        ? withPaymentInterceptor(nextApiClient, walletClient)
        : nextApiClient;

      let dkgData = null;
      let analysisResult = null;
      let contradictions = [];

      // Try to fetch from DKG with payment support via API route
      try {
        const dkgResponse = await apiClient.get(
          `/api/dkgpedia/query/${encodeURIComponent(topicId)}`
        );
        dkgData = dkgResponse.data;
        
        if (dkgData.found && dkgData.analysisResult) {
          console.log("✓ Asset found in DKG and accessible");
          analysisResult = dkgData.analysisResult;
          // Limit contradictions to 10
          const allContradictions = dkgData.analysisResult?.results?.triple?.contradictions?.contradictions || [];
          contradictions = allContradictions.slice(0, 10);
        }
      } catch (dkgError: any) {
        // Check if it's a 402 Payment Required error
        if (dkgError.response?.status === 402 || 
            dkgError.response?.data?.x402Version ||
            dkgError.response?.data?.error === "X-PAYMENT header is required") {
          console.log("💳 Payment required for this asset");
          const paymentData = dkgError.response?.data;
          
          if (!walletConnected) {
            setNeedsPayment(true);
            setPaymentInfo({
              priceUsd: paymentData?.maxAmountRequired ? parseFloat(paymentData.maxAmountRequired) / 10000 : 0,
              title: topicId,
            });
            setLoading(false);
            return;
          }
          
          // If wallet is connected but payment failed, show error
          throw new Error("Payment required but failed to process");
        }
        
        // If not a payment error, continue to analyze-lite
        console.log("⚠ Asset not found or error fetching, running analyze-lite");
      }

        // If we don't have data yet, run analyze-lite
        if (!analysisResult) {
          setLoadingStep("Running lite analysis...");
          const analyzeLiteResponse = await fetch("/api/analyze-lite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: topicId }),
          });

          if (!analyzeLiteResponse.ok) {
            throw new Error("Failed to analyze topic");
          }

          const analyzeLiteData = await analyzeLiteResponse.json();
          
          // Check if analysis started (we need to poll for progress)
          if (analyzeLiteData.status === "started") {
            console.log("⏳ Analysis started, tracking progress...");
            setLoadingStep("Analysis in progress...");
            // Start polling for progress
            analysisResult = await pollAnalyzeLiteProgress();
          } else {
            // If we got immediate results
            analysisResult = analyzeLiteData;
          }
          
          // After getting analysis results (from polling or immediate), publish to DKG via API route
          // Use the SAME topicId for both publishing and fetching to ensure they match
          // Check if we've already published or if asset already exists to prevent duplicates
          if (analysisResult && !hasPublished) {
            // Double-check if asset already exists in DKG before publishing
            try {
              const checkResponse = await apiClient.get(
                `/api/dkgpedia/query/${encodeURIComponent(topicId)}`
              );
              if (checkResponse.data.found) {
                console.log("✓ Asset already exists in DKG, skipping publish");
                setHasPublished(true);
              }
            } catch (checkError: any) {
              // Asset doesn't exist (404) or other error, proceed with publishing
              if (checkError.response?.status !== 404) {
                console.warn("⚠️ Error checking for existing asset:", checkError);
              }
            }

            // Only publish if we haven't published yet and asset doesn't exist
            if (!hasPublished) {
              console.log("📤 Publishing analyze-lite results to DKG...");
              setLoadingStep("Publishing to DKG...");
              
              // Use the same topicId from URL for both publishing and fetching
              // This ensures they match and the asset can be retrieved after publishing
              const publishPayload = {
                topicId: topicId, // Use the same topicId from URL
                title: analysisResult.topic || topicId,
                contributionType: "regular",
                analysisResult: analysisResult,
              };

              console.log(`📤 Publishing with topicId: ${topicId} (same as fetch topicId)`);

              // Retry logic for publishing
              const maxRetries = 3;
              const retryDelay = 2000; // 2 seconds
              let lastError: Error | null = null;

              for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                  setLoadingStep(`Publishing to DKG... (Attempt ${attempt}/${maxRetries})`);
                  
                  const publishResponse = await fetch("/api/dkgpedia/publish", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(publishPayload),
                  });

                  if (!publishResponse.ok) {
                    const errorData = await publishResponse.json();
                    throw new Error(`Failed to publish to DKG: ${errorData.error || publishResponse.status}`);
                  }

                  const publishData = await publishResponse.json();
                  console.log(`✅ Successfully published to DKG with UAL: ${publishData.ual}, topicId: ${topicId} (attempt ${attempt})`);
                  setHasPublished(true); // Mark as published to prevent duplicates
                  setPublishedUal(publishData.ual); // Store UAL for display
                  setLoadingStep(`✅ Published to DKG! UAL: ${publishData.ual}`);
                  lastError = null;
                  break; // Success, exit retry loop
                } catch (error) {
                  lastError = error instanceof Error ? error : new Error(String(error));
                  console.error(`❌ Publish attempt ${attempt}/${maxRetries} failed:`, lastError.message);
                  
                  if (attempt < maxRetries) {
                    console.log(`⏳ Retrying in ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                  } else {
                    // All retries exhausted
                    throw lastError;
                  }
                }
              }

              if (lastError) {
                throw lastError;
              }
            }
          } else if (hasPublished) {
            console.log("⚠️ Already published for this topicId, skipping duplicate publish");
          }
          
          // Limit contradictions to 10
          const allContradictions = analysisResult?.results?.triple?.contradictions?.contradictions || [];
          contradictions = allContradictions.slice(0, 10);
        }

      // Determine the actual topic name for Grokipedia search
      // Use analysisResult.topic or dkgData.title instead of topicId (which might be a UUID)
      const actualTopicName = analysisResult?.topic || dkgData?.title || topicId;
      console.log(`📄 Fetching Grokipedia article for topic: ${actualTopicName} (topicId: ${topicId})`);

      // Fetch Grokipedia article
      setLoadingStep("Fetching Grokipedia article...");
      const grokResponse = await fetch("/api/grokipedia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: actualTopicName }),
      });

      if (!grokResponse.ok) {
        throw new Error("Failed to fetch Grokipedia article");
      }

      const grokData = await grokResponse.json();
      const grokContent = grokData.content_text || "";
      setLoadingStep("Grokipedia article fetched. Generating corrected version...");

      // Generate corrected version using contradictions
      console.log(`🔧 Generating corrected version with ${contradictions.length} contradictions`);
      const answerResponse = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grokipediaContent: grokContent,
          contradictions,
        }),
      });

      if (!answerResponse.ok) {
        throw new Error("Failed to generate corrected content");
      }

      const answerData = await answerResponse.json();
      setLoadingStep("Corrected version generated. Finalizing...");

      setData({
        originalContent: grokContent,
        correctedContent: answerData.correctedContent,
        analysisResult,
        topic: actualTopicName, // Use actual topic name instead of topicId (which might be a UUID)
      });
    } catch (err) {
      console.error("Error fetching answer:", err);
      setError(err instanceof Error ? err.message : "Failed to load answer");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      // After connecting, retry fetching
      fetchAnswer();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Show loading state with progress
  if (loading) {
    return (
      <div className="min-h-screen pt-36 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="default"
            onClick={() => router.back()}
            className="mb-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {progressStatus ? (
            <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-8">
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
              
              {/* Show UAL and explorer link if published */}
              {publishedUal && (
                <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg w-full">
                  <p className="text-sm font-mono text-primary mb-2 uppercase">Published to DKG</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">UAL:</span>
                    <a
                      href={`https://dkg-testnet.origintrail.io/explore?ual=${encodeURIComponent(publishedUal)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-primary hover:text-primary/80 underline break-all"
                    >
                      {publishedUal}
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xl text-muted-foreground text-center">{loadingStep}</p>
                
                {/* Show UAL and explorer link if published */}
                {publishedUal && (
                  <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg w-full max-w-2xl">
                    <p className="text-sm font-mono text-primary mb-2 uppercase">Published to DKG</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">UAL:</span>
                      <a
                        href={`https://dkg-testnet.origintrail.io/explore?ual=${encodeURIComponent(publishedUal)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-primary hover:text-primary/80 underline break-all"
                      >
                        {publishedUal}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show payment modal if payment is required
  if (needsPayment && paymentInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <PaymentInfoModal
          open={true}
          onOpenChange={() => router.back()}
          onPayAndOpen={handleConnectWallet}
          title={paymentInfo.title}
          priceUsd={paymentInfo.priceUsd}
          loading={false}
        />
      </div>
    );
  }

  if (false) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-2xl font-sentient font-light text-foreground">Processing Answer</p>
            <p className="text-lg text-primary font-mono">{loadingStep}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Button onClick={() => router.back()} className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error || "Failed to load answer"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => router.back()}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 mb-6">
          <h1 className="font-sentient text-4xl font-light mb-2">
            {data.topic}
          </h1>
          <p className="text-sm uppercase font-mono text-muted-foreground">
            AI-Corrected Answer
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="corrected" className="w-full">
          <TabsList className="bg-black/90 border border-input rounded-lg p-2 w-full justify-start overflow-x-auto h-auto scrollbar-hide mb-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx global>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <TabsTrigger 
              value="corrected" 
              className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
            >
              <CheckCircle2 className="h-5 w-5" />
              Corrected Version
            </TabsTrigger>
            <TabsTrigger 
              value="original" 
              className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
            >
              <FileText className="h-5 w-5" />
              Original Grokipedia
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="gap-2 px-4 py-3 text-base font-mono font-bold data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:border-yellow-500"
            >
              <BarChart3 className="h-5 w-5" />
              Full Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="corrected" className="mt-0">
            <div className="bg-black/90 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <h2 className="text-xl uppercase text-green-400 font-mono">
                  Corrected Version
                </h2>
              </div>
              <MarkdownRenderer content={data.correctedContent} />
            </div>
          </TabsContent>

          <TabsContent value="original" className="mt-0">
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl uppercase text-primary font-mono">
                  Original Grokipedia Article
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-3 w-3 rounded bg-red-500/40 border border-red-500/60"></div>
                  <span className="font-mono">Highlighted = Changed</span>
                </div>
              </div>
              <DiffViewer 
                original={data.originalContent} 
                corrected={data.correctedContent} 
              />
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-0">
            {data.analysisResult ? (
              <AnalysisResults 
                data={data.analysisResult}
                showHeader={false}
              />
            ) : (
              <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-8 text-center">
                <p className="text-muted-foreground">No analysis data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}