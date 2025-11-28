"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PaymentInfoModal } from "@/components/payment-info-modal";
import { Loader2 } from "lucide-react";

interface Asset {
  topicId: string;
  summary: string;
  title?: string;
  contributionType?: string;
  walletAddress?: string;
  priceUsd?: number;
  isPaywalled?: boolean;
  ual?: string;
  categoryMetrics?: Record<string, number>;
  notableInstances?: Array<{ content: string; category: string }>;
  primarySource?: string;
  secondarySource?: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    fetchAllAssets();
  }, []);

  const fetchAllAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dkgpedia/search?limit=100");
      const data = await response.json();

      if (data.found && data.notes) {
        setAssets(data.notes);
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (activeTab === "user-contributed") {
      return asset.contributionType === "User contributed" || asset.isPaywalled;
    } else if (activeTab === "regular") {
      return asset.contributionType === "Regular" || !asset.isPaywalled;
    }
    return true;
  });

  const handleAssetClick = (asset: Asset) => {
    // If paywalled, show payment modal instead of navigating directly
    if (asset.isPaywalled && asset.priceUsd !== undefined) {
      setSelectedAsset(asset);
      setPaymentModalOpen(true);
    } else {
      // Free content, navigate directly
      router.push(`/asset/${encodeURIComponent(asset.topicId)}`);
    }
  };

  const handlePayAndOpen = () => {
    if (selectedAsset) {
      setIsProcessingPayment(true);
      // Navigate to asset page - payment will be handled there via x402
      router.push(`/asset/${encodeURIComponent(selectedAsset.topicId)}`);
      setPaymentModalOpen(false);
      setSelectedAsset(null);
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen pt-36 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-sentient text-5xl font-light mb-4 text-center">
          <i>Marketplace</i>
        </h1>
        <p className="text-center text-muted-foreground mb-12 font-mono">
          Browse all knowledge assets on the DKG
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-12">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-black/90 border border-input p-1 font-mono">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:font-bold transition-all"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="user-contributed"
              className="data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:font-bold transition-all"
            >
              User Contributed
            </TabsTrigger>
            <TabsTrigger 
              value="regular"
              className="data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:font-bold transition-all"
            >
              Regular
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading assets...</span>
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <button
                key={asset.topicId}
                onClick={() => handleAssetClick(asset)}
                className={`text-left border rounded-2xl p-6 transition-all hover:shadow-lg ${
                  asset.isPaywalled
                    ? "bg-black/95 backdrop-blur-sm border-primary/40 hover:border-primary hover:shadow-primary/20"
                    : "bg-black/90 backdrop-blur-sm border-input hover:border-primary/50 hover:shadow-primary/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="font-sentient text-xl font-bold flex-1 line-clamp-2">
                    {asset.title || asset.topicId}
                  </h3>
                  <div className="flex flex-col items-end flex-shrink-0">
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                  {asset.summary}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs uppercase font-mono text-muted-foreground">
                    {asset.contributionType || "Regular"}
                  </span>
                  {asset.isPaywalled && asset.priceUsd !== undefined && (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-mono text-yellow-500/70">$</span>
                      <span className="text-xl font-mono font-bold text-yellow-500">
                        {asset.priceUsd.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No assets found</p>
          </div>
        )}

        {/* Payment Info Modal */}
        {selectedAsset && (
          <PaymentInfoModal
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            onPayAndOpen={handlePayAndOpen}
            title={selectedAsset.title || selectedAsset.topicId}
            priceUsd={selectedAsset.priceUsd || 0}
            loading={isProcessingPayment}
          />
        )}
      </div>
    </div>
  );
}

