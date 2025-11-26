# DKGPedia

A modern web interface for the Decentralized Knowledge Graph (DKG) - a better Grokipedia.

## Overview

DKGPedia is a Next.js application that provides an intuitive interface for searching, browsing, and contributing to knowledge assets on the DKG. Users can explore verified knowledge with trust scores, access paywalled premium content, and publish their own contributions to the network.

## Features

- 🔍 **Smart Search** - Real-time search with autocomplete and trust score indicators
- 📚 **Marketplace** - Browse all knowledge assets with filtering options
- ✍️ **Contribute** - Publish your own knowledge assets with customizable metadata
- 🔐 **Wallet Integration** - Connect with MetaMask for secure transactions
- 💎 **Trust Scores** - View credibility metrics for each knowledge asset
- 💰 **Monetization** - Support paywalled content with USD pricing

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **3D Graphics**: Three.js with React Three Fiber
- **Wallet**: Viem for Ethereum integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
npm install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/              # Next.js app router pages
│   ├── api/         # API routes
│   ├── asset/       # Asset detail pages
│   ├── contribute/  # Contribution form
│   └── marketplace/ # Marketplace browsing
├── components/      # React components
├── contexts/        # React contexts (wallet, etc.)
└── lib/            # Utility functions
```

## License

Private - All rights reserved
