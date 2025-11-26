'use client'

import { Hero } from "@/components/hero";
import { Leva } from "leva";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { walletConnected, connectWallet, isInitializing } = useWallet();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient font-light">
            <i>DKGPedia</i>
          </h1>
          <p className="text-base font-mono text-muted-foreground max-w-md">
            Connect your wallet to access DKGPedia
          </p>
        </div>
        <Button
          onClick={connectWallet}
          className="bg-primary hover:bg-primary/90 text-black font-bold font-mono text-lg px-8 py-6"
        >
          🦊 Connect MetaMask
        </Button>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <Leva hidden />
    </>
  );
}
