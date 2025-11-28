"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, FileText, CheckCircle2, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentInfoModal } from "@/components/payment-info-modal";
import { AnalysisProgressModal } from "@/components/analysis-progress-modal";
import { useWallet } from "@/contexts/wallet-context";
import AnalysisResults from "@/components/analysis-results";
import MarkdownRenderer from "@/components/markdown-renderer";
import axios from "axios";

// @ts-ignore - x402-axios types
import { withPaymentInterceptor } from "x402-axios";

interface AnswerData {
  originalContent: string;
  correctedContent: string;
  analysisResult?: any;
  topic: string;
}

// Base axios instance
const baseApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DKG_API_URL || "http://localhost:9200",
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
  const [showProgress, setShowProgress] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

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
    if (mounted && topicId && !data) {
      fetchAnswer();
    }
  }, [topicId, mounted, data]);

  const fetchAnswer = async () => {
    try {
      setLoading(true);
      setLoadingStep("Checking DKG for existing data...");
      setError(null);
      setNeedsPayment(false);

      console.log("🔍 Fetching answer for topic:", topicId);

      // Use payment-enabled client if wallet is connected
      const apiClient = walletClient 
        ? withPaymentInterceptor(baseApiClient, walletClient)
        : baseApiClient;

      let dkgData = null;
      let analysisResult = null;
      let contradictions = [];

      // Try to fetch from DKG with payment support
      try {
        const dkgResponse = await apiClient.get(
          `/dkgpedia/community-notes/topic/${encodeURIComponent(topicId)}`
        );
        dkgData = dkgResponse.data;
        
        if (dkgData.found && dkgData.analysisResult) {
          console.log("✓ Asset found in DKG and accessible");
          analysisResult = dkgData.analysisResult;
          contradictions = dkgData.analysisResult?.results?.triple?.contradictions?.contradictions || [];
        }
      } catch (dkgError: any) {
        // Check if it's a 402 Payment Required error
        if (dkgError.response?.status === 402) {
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
          if (analyzeLiteData.status === "started" && analyzeLiteData.analysis_id) {
            console.log("⏳ Analysis started, tracking progress...");
            setAnalysisId(analyzeLiteData.analysis_id);
            setShowProgress(true);
            setLoading(false);
            return; // Exit and wait for progress modal to complete
          }

          // If we got immediate results (shouldn't happen but handle it)
          analysisResult = analyzeLiteData;
          contradictions = analyzeLiteData?.results?.triple?.contradictions?.contradictions || [];
        }

      // Fetch Grokipedia article
      console.log("📄 Fetching Grokipedia article");
      const grokResponse = await fetch("/api/grokipedia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: topicId }),
      });

      if (!grokResponse.ok) {
        throw new Error("Failed to fetch Grokipedia article");
      }

      const grokData = await grokResponse.json();
      const grokContent = grokData.content_text || "";

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

      setData({
        originalContent: grokContent,
        correctedContent: answerData.correctedContent,
        analysisResult,
        topic: topicId,
      });
    } catch (err) {
      console.error("Error fetching answer:", err);
      setError(err instanceof Error ? err.message : "Failed to load answer");
    } finally {
      setLoading(false);
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

  const handleAnalysisComplete = async (analysisData: any) => {
    console.log("✓ Analysis completed, processing results");
    setShowProgress(false);
    setLoading(true);
    setLoadingStep("Analysis complete, fetching Grokipedia article...");

    try {
      const contradictions = analysisData?.results?.triple?.contradictions?.contradictions || [];

      // Fetch Grokipedia article
      console.log("📄 Fetching Grokipedia article");
      const grokResponse = await fetch("/api/grokipedia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: topicId }),
      });

      if (!grokResponse.ok) {
        throw new Error("Failed to fetch Grokipedia article");
      }

      const grokData = await grokResponse.json();
      const grokContent = grokData.content_text || "";

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

      setData({
        originalContent: grokContent,
        correctedContent: answerData.correctedContent,
        analysisResult: analysisData,
        topic: topicId,
      });
    } catch (err) {
      console.error("Error processing analysis results:", err);
      setError(err instanceof Error ? err.message : "Failed to process results");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisError = (errorMessage: string) => {
    console.error("Analysis error:", errorMessage);
    setShowProgress(false);
    setError(errorMessage);
    setLoading(false);
  };

  // Show analysis progress modal
  if (showProgress && analysisId) {
    return (
      <>
        <AnalysisProgressModal
          open={showProgress}
          analysisId={analysisId}
          progressEndpoint="http://localhost:8000"
          onComplete={handleAnalysisComplete}
          onError={handleAnalysisError}
        />
      </>
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

  if (loading) {
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
                  Wikipedia-Corrected Version
                </h2>
              </div>
              <MarkdownRenderer content={data.correctedContent} />
            </div>
          </TabsContent>

          <TabsContent value="original" className="mt-0">
            <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-8">
              <h2 className="text-xl uppercase text-primary mb-6 font-mono">
                Original Grokipedia Article
              </h2>
              <MarkdownRenderer content={data.originalContent} />
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

