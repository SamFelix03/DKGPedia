"use client";

import { usePathname } from "next/navigation";
import { useWallet } from "@/contexts/wallet-context";
import { Header } from "./header";

export function ConditionalHeader() {
  const pathname = usePathname();
  const { walletConnected, isInitializing } = useWallet();

  // Hide header on home page when wallet is not connected
  if (pathname === "/" && (!walletConnected || isInitializing)) {
    return null;
  }

  return <Header />;
}

