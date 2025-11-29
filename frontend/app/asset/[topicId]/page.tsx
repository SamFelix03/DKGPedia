"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";
import { useWallet } from "@/contexts/wallet-context";
import AnalysisResults from "@/components/analysis-results";

// @ts-ignore - x402-axios types
import { withPaymentInterceptor } from "x402-axios";

interface AnalysisResult {
  status: string;
  analysis_id: string;
  topic: string;
  steps_completed: string[];
  results: {
    fetch: any;
    triple: any;
    semanticdrift: any;
    factcheck: any;
    sentiment: any;
    multimodal: any;
    judging: any;
  };
  errors?: string[];
  timestamp?: string;
  execution_time_seconds: number;
}

interface AssetData {
  topicId: string;
  summary: string;
  title?: string;
  contributionType?: string;
  walletAddress?: string;
  priceUsd?: number;
  isPaywalled?: boolean;
  ual?: string;
  found: boolean;
  error?: string;
  categoryMetrics?: Record<string, number>;
  notableInstances?: Array<{ content: string; category: string }>;
  primarySource?: string;
  secondarySource?: string;
  provenance?: any;
  analysisResult?: AnalysisResult;
}

// Axios instance for Next.js API routes (relative URLs)
const nextApiClient = axios.create({
  baseURL: "", // Empty baseURL means relative to current origin
  headers: {
    "Content-Type": "application/json",
  },
});

export default function AssetPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { walletConnected, walletClient, connectWallet } = useWallet();
  
  const [mounted, setMounted] = useState(false);
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPayment, setNeedsPayment] = useState(false);

  // Handle mounting and load from sessionStorage
  useEffect(() => {
    setMounted(true);
    
    // Try to load from sessionStorage after mount
    const cached = sessionStorage.getItem(`asset_${topicId}`);
    if (cached) {
      try {
        const parsedData = JSON.parse(cached);
        setAsset(parsedData);
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse cached asset data:", e);
      }
    }
  }, [topicId]);

  // Save asset to sessionStorage whenever it changes
  useEffect(() => {
    if (mounted && asset) {
      sessionStorage.setItem(`asset_${topicId}`, JSON.stringify(asset));
    }
  }, [asset, topicId, mounted]);

  // Clear sessionStorage when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      sessionStorage.removeItem(`asset_${topicId}`);
    };
  }, [topicId]);

  // Fetch data if not cached
  useEffect(() => {
    if (mounted && topicId && !asset) {
      fetchAsset();
    }
  }, [topicId, walletClient, mounted, asset]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsPayment(false);

      console.log("🔍 Querying topic:", topicId);

      // Use Next.js API route with payment interceptor if wallet is connected
      const apiClient = walletClient 
        ? withPaymentInterceptor(nextApiClient, walletClient)
        : nextApiClient;

      try {
        const response = await apiClient.get(
          `/api/dkgpedia/query/${encodeURIComponent(topicId)}`
        );
        
        console.log("✅ Query successful:", response.data);
        
        if (response.data.found) {
          setAsset(response.data);
          setNeedsPayment(false);
        } else {
          setError(response.data.error || "Asset not found");
        }
      } catch (fetchErr: any) {
        // Check if it's a 402 Payment Required error
        if (fetchErr.response?.status === 402 || 
            fetchErr.response?.data?.x402Version ||
            fetchErr.response?.data?.error === "X-PAYMENT header is required") {
          console.log("💰 Payment required for this asset");
          
          // Extract payment info from error response
          const paymentData = fetchErr.response?.data;
          const paymentInfo = paymentData?.accepts?.[0] || paymentData;
          
          if (!walletConnected) {
            // No wallet connected, show payment screen
            setNeedsPayment(true);
            const priceInDollars = paymentInfo?.maxAmountRequired 
              ? parseFloat(paymentInfo.maxAmountRequired) / 10000 
              : 0;
            setAsset({
              topicId,
              summary: "",
              found: false,
              isPaywalled: true,
              priceUsd: priceInDollars,
              walletAddress: paymentInfo?.payTo || paymentData?.walletAddress,
              contributionType: "User contributed",
            });
          } else {
            // Wallet connected but payment failed
            setError("Payment required. Please try again or check your wallet connection.");
          }
        } else {
          // Other error
          throw fetchErr;
        }
      }
    } catch (err: any) {
      console.error("❌ Query error:", err);
      if (err.response?.data) {
        setError(err.response.data.error || "Failed to fetch asset");
      } else {
        setError("Failed to fetch asset");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || (!asset && !needsPayment)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">{error || "Asset not found"}</p>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    );
  }

  // Show payment required screen
  if (needsPayment && asset) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => router.back()} className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="bg-gradient-to-br from-yellow-500/10 via-black/90 to-yellow-500/5 backdrop-blur-sm border-2 border-yellow-500/30 rounded-2xl p-12 text-center">
            <div className="mb-8">
              <div className="inline-block p-4 bg-yellow-500/10 rounded-full mb-4">
                <svg
                  className="w-16 h-16 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="font-sentient text-4xl font-light mb-4">
                Premium Content
              </h1>
              <p className="text-xl text-muted-foreground mb-2">
                {asset.title || asset.topicId}
              </p>
              <div className="flex items-baseline justify-center gap-2 mt-6">
                <span className="text-2xl font-mono text-yellow-500/70">$</span>
                <span className="text-6xl font-mono font-bold text-yellow-500">
                  {asset.priceUsd?.toFixed(2)}
                </span>
                <span className="text-xl font-mono text-yellow-500/70">USD</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                This is a user-contributed knowledge asset.
                <br />
                Connect your wallet to access this content via x402 payment.
              </p>
              <Button
                onClick={async () => {
                  await connectWallet();
                  // Retry fetching the asset with wallet connected
                  fetchAsset();
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-6"
              >
                🦊 Connect MetaMask to Access
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return null;
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

        {/* Header with Price */}
        <div className="bg-black/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="font-sentient text-4xl font-light mb-2">
                {asset.title || asset.topicId}
              </h1>
              <p className="text-sm uppercase font-mono text-muted-foreground">
                {asset.contributionType || "Regular"} Contribution
              </p>
              {asset.ual && (
                <a
                  href={`https://dkg-testnet.origintrail.io/explore?ual=${encodeURIComponent(asset.ual)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-primary/70 hover:text-primary hover:underline mt-2 inline-block break-all"
                >
                  UAL: {asset.ual}
                </a>
              )}
            </div>
            <div className="flex gap-6">
              {asset.isPaywalled && asset.priceUsd !== undefined && (
                <div className="flex flex-col items-end pl-6 border-l border-primary/20">
                  <span className="text-xs uppercase font-mono text-yellow-500/70 mb-2">
                    Price
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-mono text-yellow-500/70">$</span>
                    <span className="text-4xl font-mono font-bold text-yellow-500">
                      {asset.priceUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {asset.analysisResult ? (
          <AnalysisResults 
            data={asset.analysisResult}
            showHeader={true}
          />
        ) : (
          /* Fallback: Show summary if no analysis result available */
          <div className="bg-black/90 backdrop-blur-sm border border-input rounded-2xl p-8">
            <div className="space-y-6">
              {asset.summary && (
                <div>
                  <h2 className="text-xl font-mono uppercase text-primary mb-4">Summary</h2>
                  <p className="text-base leading-relaxed text-foreground/90">
                    {asset.summary}
                  </p>
                </div>
              )}

              {/* Sources */}
              {(asset.primarySource || asset.secondarySource) && (
                <div>
                  <h2 className="text-xl font-mono uppercase text-primary mb-4">Sources</h2>
                  <div className="space-y-3">
                    {asset.primarySource && (
                      <div>
                        <span className="text-sm font-mono text-muted-foreground">Primary: </span>
                        <span className="text-base text-foreground/90">{asset.primarySource}</span>
                      </div>
                    )}
                    {asset.secondarySource && (
                      <div>
                        <span className="text-sm font-mono text-muted-foreground">Secondary: </span>
                        <span className="text-base text-foreground/90">{asset.secondarySource}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Category Metrics */}
              {asset.categoryMetrics && Object.keys(asset.categoryMetrics).length > 0 && (
                <div>
                  <h2 className="text-xl font-mono uppercase text-primary mb-4">Category Metrics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(asset.categoryMetrics).map(([category, count]) => (
                      <div key={category} className="bg-black/50 p-4 rounded-lg">
                        <div className="text-sm font-mono text-muted-foreground capitalize mb-1">
                          {category}
                        </div>
                        <div className="text-2xl font-mono font-bold text-primary">
                          {typeof count === 'number' ? count : String(count)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notable Instances */}
              {asset.notableInstances && asset.notableInstances.length > 0 && (
                <div>
                  <h2 className="text-xl font-mono uppercase text-primary mb-4">Notable Instances</h2>
                  <div className="space-y-3">
                    {asset.notableInstances.map((instance, idx) => (
                      <div key={idx} className="bg-black/50 p-4 rounded-lg">
                        {typeof instance === 'object' && 'category' in instance ? (
                          <>
                            <div className="text-sm font-mono text-primary mb-2 capitalize">
                              {instance.category}
                            </div>
                            <p className="text-base text-foreground/90 leading-relaxed">
                              {instance.content}
                            </p>
                          </>
                        ) : (
                          <p className="text-base text-foreground/90 leading-relaxed">
                            {JSON.stringify(instance)}
                          </p>
                        )}
                      </div>
                    ))}
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

