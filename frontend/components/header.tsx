"use client";

import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { useEffect, useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";

export const Header = () => {
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
    <div className={`fixed z-[100] pt-8 md:pt-14 top-0 left-0 w-full transition-all duration-300 ${
      scrolled ? "bg-black/95 backdrop-blur-md pt-4 md:pt-6" : ""
    }`}>
      <header className="flex items-center justify-between container">
        <Link href="/">
          <img src="/logo.png" alt="DKGPedia logo" className="w-[60px] md:w-[80px]" />
        </Link>
        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-10">
          <Link
            className="uppercase text-white inline-block font-mono text-lg md:text-xl text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out"
            href="/"
          >
            Query
          </Link>
          <Link
            className="uppercase text-white inline-block font-mono text-lg md:text-xl text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out"
            href="/marketplace"
          >
            Marketplace
          </Link>
          <Link
            className="uppercase text-white inline-block font-mono text-lg md:text-xl text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out"
            href="/contribute"
          >
            Contribute
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {walletConnected && walletAddress ? (
            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm border border-input rounded-full px-4 py-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm text-foreground">
                {truncateAddress(walletAddress)}
              </span>
              <Button
                size="sm"
                onClick={disconnectWallet}
                className="h-6 w-6 p-0 bg-transparent border-transparent hover:bg-destructive/10 hover:text-destructive hover:border-transparent"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              className="bg-primary hover:bg-primary/90 text-black font-bold font-mono text-sm px-4 py-2"
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
