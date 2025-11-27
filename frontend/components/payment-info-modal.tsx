"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";

interface PaymentInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayAndOpen: () => void;
  title: string;
  priceUsd: number;
  loading?: boolean;
}

export function PaymentInfoModal({
  open,
  onOpenChange,
  onPayAndOpen,
  title,
  priceUsd,
  loading = false,
}: PaymentInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/95 backdrop-blur-sm border-input">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-yellow-500" />
            Premium Content
          </DialogTitle>
          <DialogDescription className="pt-2">
            This content is contributed by a community member and requires payment to access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Asset Info */}
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground uppercase">Asset</p>
            <p className="text-base font-sentient font-semibold">{title}</p>
          </div>

          {/* Price */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-yellow-500/70 uppercase mb-1">
                  Price to Access
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-mono text-yellow-500/70">$</span>
                  <span className="text-3xl font-mono font-bold text-yellow-500">
                    {priceUsd.toFixed(2)}
                  </span>
                  <span className="text-sm font-mono text-yellow-500/70 ml-1">USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Support Message */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Your payment supports DKGPedia's contributors in their quest to uphold trust and 
              provide accurate, verified knowledge on the Decentralized Knowledge Graph.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={onPayAndOpen}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold font-mono text-lg py-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "💳 Pay to Open"
            )}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            variant="default"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

