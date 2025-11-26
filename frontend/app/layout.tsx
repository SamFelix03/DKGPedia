import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ConditionalHeader } from "@/components/conditional-header";
import { WalletProvider } from "@/contexts/wallet-context";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DKGPedia",
  description: "A better Grokipedia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <WalletProvider>
          <ConditionalHeader />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
