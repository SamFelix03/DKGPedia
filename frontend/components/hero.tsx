"use client";

import { GL } from "./gl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion";
import { Button } from "./ui/button";
import { PaymentInfoModal } from "@/components/payment-info-modal";
import { ArrowUpIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
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

export function Hero() {
  const router = useRouter();
  const [hovering, setHovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("query");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(true);

    try {
      const response = await fetch(
        `/api/dkgpedia/search?keyword=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();

      if (data.found && data.notes) {
        setSearchResults(data.notes);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (result: SearchResult) => {
    setShowSuggestions(false);
    
    // If paywalled, show payment modal instead of navigating directly
    if (result.isPaywalled && result.priceUsd !== undefined) {
      setSelectedAsset(result);
      setPaymentModalOpen(true);
    } else {
      // Free content, navigate directly
      router.push(`/asset/${encodeURIComponent(result.topicId)}`);
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
    <div className="flex flex-col h-svh">
      <GL hovering={hovering} />
      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Centered Header and Search */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient mb-8">
          <i className="font-light">DKGPedia</i>
        </h1>

        {/* Search Bar with Autocomplete */}
        <div className="w-full max-w-3xl mb-12">
          <div className="flex flex-col items-start justify-center gap-4">
            <PromptInput
              className="border-input bg-black/90 backdrop-blur-sm relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xl"
              value={searchQuery}
              onValueChange={setSearchQuery}
              onSubmit={handleSearch}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              <PromptInputTextarea
                placeholder="Query DKGPedia..."
                className="min-h-[44px] pt-3 pl-4 text-base font-mono leading-[1.3] sm:text-base md:text-base"
                onKeyDown={handleKeyDown}
              />
              <PromptInputActions className="mt-5 flex w-full items-end justify-end gap-2 px-3 pb-3">
                <Button
                  size="sm"
                  className="h-9 w-9 rounded-full"
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4" />
                  )}
                </Button>
              </PromptInputActions>
            </PromptInput>
            
            {/* Search Results - Scrollable with max 4 entries */}
            {showSuggestions && searchQuery.trim() && (
              <div className="w-full max-h-[280px] overflow-y-auto overflow-x-hidden space-y-2 pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8 bg-black/90 backdrop-blur-sm rounded-2xl">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.topicId}
                      onClick={() => handleSuggestionClick(result)}
                      className={`w-full text-left border rounded-2xl px-5 py-3 transition-all ${
                        result.isPaywalled
                          ? "bg-black/95 backdrop-blur-sm border-primary/40 hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20"
                          : "bg-black/90 backdrop-blur-sm hover:bg-black/95 border-input hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-sentient text-lg font-bold truncate">
                            {result.title || result.topicId}
                          </h4>
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0">
                          
                          {/* Price for Paywalled Content */}
                          {result.isPaywalled && result.priceUsd !== undefined && (
                            <div className="flex items-center gap-2 pl-6 border-l border-primary/20">
                              <span className="text-[10px] uppercase font-mono text-yellow-500/70">
                                Price
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xs font-mono text-yellow-500/70">$</span>
                                <span className="text-2xl font-mono font-bold text-yellow-500">
                                  {result.priceUsd.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground bg-black/90 backdrop-blur-sm rounded-2xl">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

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
  );
}
