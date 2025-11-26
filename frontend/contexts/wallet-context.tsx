"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createWalletClient, custom } from "viem";
import { baseSepolia } from "viem/chains";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextType {
  walletConnected: boolean;
  walletAddress: string | null;
  walletClient: any;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isInitializing: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          await initializeWalletClient(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
    setIsInitializing(false);
  };

  const initializeWalletClient = async (address: string) => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        // Switch to Base Sepolia if not already on it
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        const baseSepoliaChainId = "0x14a34"; // 84532 in hex

        if (chainId !== baseSepoliaChainId) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: baseSepoliaChainId }],
            });
          } catch (switchError: any) {
            // Chain not added to MetaMask, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: baseSepoliaChainId,
                    chainName: "Base Sepolia",
                    nativeCurrency: {
                      name: "Ether",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://sepolia.base.org"],
                    blockExplorerUrls: ["https://sepolia.basescan.org"],
                  },
                ],
              });
            } else {
              throw switchError;
            }
          }
        }

        const client = createWalletClient({
          account: address as `0x${string}`,
          chain: baseSepolia,
          transport: custom(window.ethereum),
        });

        setWalletClient(client);
        console.log("💳 Wallet client initialized for Base Sepolia payments");
      } catch (error) {
        console.error("Error initializing wallet client:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
      alert("Please install MetaMask to access DKGPedia!");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      await initializeWalletClient(accounts[0]);
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet: " + (error.message || "Unknown error"));
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setWalletConnected(false);
    setWalletClient(null);
  };

  return (
    <WalletContext.Provider
      value={{
        walletConnected,
        walletAddress,
        walletClient,
        connectWallet,
        disconnectWallet,
        isInitializing,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

