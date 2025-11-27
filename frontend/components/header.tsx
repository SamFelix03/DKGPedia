"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileMenu } from "./mobile-menu";
import { useEffect, useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";

export const Header = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { walletConnected, walletAddress, connectWallet, disconnectWallet } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={`fixed z-[100] pt-6 md:pt-10 top-0 left-0 w-full transition-all duration-300 ${
      scrolled ? "bg-black/95 backdrop-blur-md pt-3 md:pt-4" : ""
    }`}>
      <header className="flex items-center justify-between container">
        <Link href="/">
          <img src="/logo.png" alt="DKGPedia logo" className="w-[50px] md:w-[70px]" />
        </Link>
        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-10">
          <Link
            className={`uppercase inline-block font-mono text-base md:text-lg duration-150 transition-colors ease-out ${
              pathname === "/" 
                ? "text-yellow-500 font-bold" 
                : "text-white text-foreground/60 hover:text-foreground/100"
            }`}
            href="/"
          >
            Query
          </Link>
          <Link
            className={`uppercase inline-block font-mono text-base md:text-lg duration-150 transition-colors ease-out ${
              pathname === "/marketplace" 
                ? "text-yellow-500 font-bold" 
                : "text-white text-foreground/60 hover:text-foreground/100"
            }`}
            href="/marketplace"
          >
            Marketplace
          </Link>
          <Link
            className={`uppercase inline-block font-mono text-base md:text-lg duration-150 transition-colors ease-out ${
              pathname === "/contribute" 
                ? "text-yellow-500 font-bold" 
                : "text-white text-foreground/60 hover:text-foreground/100"
            }`}
            href="/contribute"
          >
            Contribute
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {walletConnected && walletAddress ? (
            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm border border-input rounded-full px-3 py-1.5">
              <User className="h-3 w-3 text-primary" />
              <span className="font-mono text-xs text-foreground">
                {truncateAddress(walletAddress)}
              </span>
              <Button
                size="sm"
                onClick={disconnectWallet}
                className="h-5 w-5 p-0 bg-transparent border-transparent hover:bg-destructive/10 hover:text-destructive hover:border-transparent"
              >
                <LogOut className="h-2.5 w-2.5" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              className="bg-primary hover:bg-primary/90 text-black font-bold font-mono text-xs px-3 py-1.5"
            >
              🦊 Connect Wallet
            </Button>
          )}
          <MobileMenu />
        </div>
      </header>
    </div>
  );
};
