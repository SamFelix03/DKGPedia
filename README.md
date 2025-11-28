# DKGPedia - A Better Grokipedia

> **Decentralized Knowledge Graph-powered platform for accurate, hallucination-free information retrieval**

DKGPedia is a platform that leverages the OriginTrail Decentralized Knowledge Graph (DKG) to provide users with accurate, verified information free from AI hallucinations. By combining AI-powered analysis, blockchain-based verification, and decentralized storage, DKGPedia creates a trusted knowledge ecosystem where contributors are incentivized to provide high-quality, verifiable data.

---

## 🔗 Important Links

### Deployed Services
- **Deployed DKG Node**: [https://8a7ad71b6b20.ngrok-free.app](https://8a7ad71b6b20.ngrok-free.app)
- **Deployed Comparison Engine Endpoint**: [https://db5a4d46576e.ngrok-free.app](https://db5a4d46576e.ngrok-free.app)
- **Deployed Frontend**: [https://dkg-pedia.vercel.app](https://dkg-pedia.vercel.app)

### Sample Data & Assets
- **Sample Response**: [`response.json`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/response.json) - Example of a complete AI analysis result
- **UAL of Complete Analysis Asset** (full contributor workflow): [View on DKG Explorer](https://dkg-testnet.origintrail.io/explore?ual=did%3Adkg%3Aotp%3A20430%2F0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37%2F405405)
- **UAL of Analysis-Lite Asset** (search-triggered workflow): Coming soon

### Documentation & Resources
- **DKGPedia Plugin**: [`@plugin-dkgpedia`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia) - Detailed plugin documentation
- **Pitch Deck**: Coming soon
- **Demo Video**: Coming soon

---

## Demo Instructions

### To Contribute a Knowledge Asset

If you want to contribute verified knowledge to the DKGPedia network:

1. **Visit the Contribute Page**: Navigate to [https://dkgpedia.vercel.app/contribute](https://dkgpedia.vercel.app/contribute)

2. **Enter Topic Information**: 
   - Enter the topic you want to contribute to (e.g., "artificial-intelligence-2024")
   - Fill in the suggested edit or correction you want to make
   - Provide relevant sources that support your contribution

3. **Submit for Analysis**: Click submit to trigger the comprehensive AI analysis

4. **Wait for Processing**: 
   - ⏱️ **AI Analysis**: Takes approximately **15-20 minutes** to complete
   - ⏱️ **DKG Publishing**: Takes an additional **25+ minutes** to publish to the blockchain
   - **Total Time**: Expect **40-45 minutes** for the entire process

> **💡 Tip**: Due to the long processing time, we recommend trying the **Search** feature first instead of contributing. Searching for a term not available in the DKG triggers the "analyze-lite" workflow, which only performs content fetching and knowledge triple extraction. This takes significantly less time to publish and retrieve.

---

### To Search/Query Knowledge

The fastest way to experience DKGPedia is through the search feature:

1. **Visit DKGPedia**: Go to [https://dkgpedia.vercel.app](https://dkgpedia.vercel.app)

2. **Enter Your Search Query**: Type your search term in the search bar (e.g., "Climate Change", "Quantum Computing")

3. **View Recommendations**: 
   - The search results will show **topics available in the DKG** with priority (these are verified, analyzed knowledge assets)
   - After DKG results, you'll see **regular search terms** available in Grokipedia

4. **Select a Topic**: Click on any result to view the knowledge asset

#### What Happens Next Depends on the Topic Type:

##### 🔓 **Free Topic (Available in DKG)**
- The system fetches the verified knowledge asset from the DKG
- Compares it against the Grokipedia result
- Displays your **final corrected article** with verified information, free from hallucinations
- Shows trust scores, analysis metrics, and source verification

##### 💰 **Paid Topic (User-Contributed in DKG)**
- The server returns a **402 Payment Required** response
- You'll be prompted to pay the required amount (in USDC) to access the content
- **To pay**: You need USDC on Base Sepolia testnet
  - Claim free USDC from the faucet: [https://faucet.circle.com/](https://faucet.circle.com/)
  - Connect your wallet and complete the payment
- Once paid, you'll receive the full verified knowledge asset with all analysis data

##### 🔍 **Topic Not Available in DKG**
- The system performs a **partial analysis workflow** (analyze-lite):
  - Fetches content from Grokipedia and Wikipedia
  - Extracts knowledge graph triples
  - Performs basic comparison and analysis
- Stores the analysis data in the DKG (faster than full analysis)
- Fetches the newly stored data
- Combines it with Grokipedia content to provide you with **corrected, verified information**
- This process is much faster than full contribution (typically 5-10 minutes)

---

### Quick Start Recommendation

**For First-Time Users**: 
1. Start with **Search** to see how DKGPedia works
2. Try searching for a topic that might not be in the DKG to see the analyze-lite workflow
3. If you find a paid topic, use the faucet to get test USDC and experience the payment flow
4. Once familiar, consider contributing a full knowledge asset (remember: it takes 40-45 minutes!)

---

## 📖 Table of Contents

- [Introduction](#introduction)
- [Three-Layer Architecture](#three-layer-architecture)
- [How It All Works](#how-it-all-works)
  - [User Types and Workflows](#user-types-and-workflows)
  - [DKG Node Interaction](#dkg-node-interaction)
  - [x402 Payment Protocol Implementation](#x402-payment-protocol-implementation)
  - [Data Structure](#data-structure)

---

## Introduction

DKGPedia addresses a critical problem in the age of AI-generated content: **hallucinations and inaccuracies**. When users search for information that would typically be available in Grokipedia, DKGPedia uses an AI agent powered by the OriginTrail DKG MCP server to fetch all relevant data related to hallucinations and deviations from authoritative sources like Wikipedia.

### How It Works

1. **Search & Query**: Users search for topics through the DKGPedia interface
2. **AI Agent Processing**: An AI agent queries the DKG network to retrieve Community Notes (knowledge assets) related to the topic
3. **Verification & Analysis**: The system uses comprehensive analysis data stored in the DKG to provide accurate, verified information
4. **Hallucination-Free Results**: By cross-referencing multiple sources and using detailed analysis metrics, users receive accurate information free from AI hallucinations

### Contribution System

Users can contribute proof and generate detailed metrics by:

- **Submitting Topics**: Contributors provide topics and relevant source materials
- **AI Analysis**: The system triggers comprehensive AI analysis that generates extensive metrics including:
  - **Fetch Results**: Comparison between Grokipedia and Wikipedia sources (word counts, character counts, references, sections)
  - **Triple Extraction**: Knowledge graph triples with overlap analysis, semantic similarity, graph embeddings (TransE, DistMult, ComplEx), graph density, entity coherence, provenance analysis, and contradiction detection
  - **Semantic Drift Analysis**: Sentence embeddings, cross-encoder comparisons, knowledge graph embeddings, topic modeling (BERTopic), and claim alignment
  - **Fact Checking**: Unsourced claim ratios, external verification scores, temporal consistency checks, and fabrication risk assessments
  - **Sentiment Analysis**: Polarity scores, sentiment shifts, framing analysis, and political leaning detection
  - **Multimodal Analysis**: Textual similarity with images/videos, image-to-text alignment, media-to-text alignment, and multimodal consistency indices
  - **Judging Reports**: Comprehensive evaluation reports comparing sources with detailed accuracy assessments

These analysis results are then published as Knowledge Assets to the OriginTrail Decentralized Knowledge Graph using our **custom DKGPedia Plugin** ([`@plugin-dkgpedia`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia)).

### Trusted Knowledge Assets

Once published, these assets serve as trusted sources for the DKGPedia platform, enabling:
- **Accurate Information Retrieval**: AI agents can query verified knowledge assets
- **Source Verification**: Users can verify the provenance and trustworthiness of information
- **Economic Incentives**: Contributors can monetize their verified knowledge through the x402 payment protocol

---

## Three-Layer Architecture

DKGPedia implements a robust three-layer architecture that ensures trust, decentralization, and economic sustainability:

### 🤖 Agent Layer

**AI agents built on the DKG Node, or custom frameworks, communicating via MCP (Model Context Protocol)**

The Agent Layer consists of AI agents that act as knowledge creators, verifiers, and brokers, reasoning over decentralized data stored in the DKG.

**Implementation in DKGPedia:**

- **MCP Tools**: The DKGPedia plugin provides MCP tools for AI agents to interact with the DKG:
  - `dkgpedia-get-community-note`: Retrieves Community Notes for specific topics
  - `dkgpedia-search-community-notes`: Searches Community Notes by keywords
  
  **Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 281-608, 614-820)

- **AI Analysis Pipeline**: The frontend triggers comprehensive AI analysis through the `/api/analyze` endpoint, which processes topics and generates detailed metrics
  
  **Location**: [`frontend/app/api/analyze/route.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/api/analyze/route.ts)

- **Agent Integration**: The DKG Node's MCP server enables AI agents to query and publish knowledge assets seamlessly

### 🧠 Knowledge Layer

**The knowledge layer – OriginTrail Decentralized Knowledge Graph on NeuroWeb powered by Polkadot**

The Knowledge Layer serves as the connective tissue of the ecosystem, storing all knowledge assets in a decentralized, immutable format.

**Implementation in DKGPedia:**

- **DKG Integration**: The DKGPedia plugin directly interacts with the OriginTrail DKG through:
  - SPARQL queries for retrieving knowledge assets
  - Asset creation and publishing via the DKG SDK
  
  **Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 321-356, 880-915, 1399-1422)

- **Knowledge Asset Structure**: Community Notes are stored as structured JSON-LD with comprehensive metadata including analysis results, provenance, and trust scores
  
  **Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 1348-1383)



### 🔗 Trust Layer

**Implements the economic and reputational backbone for trust**

The Trust Layer provides the economic and reputational mechanisms that incentivize quality contributions and ensure trust in the knowledge ecosystem.

**Implementation in DKGPedia:**

- **TRAC Token Staking**: Contributors stake TRAC tokens when publishing knowledge assets to the DKG, ensuring commitment and quality
  
  **Location**: Asset creation with epochs configuration in [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 1403-1407)

- **x402 Payment Protocol**: User-contributed assets can be monetized through the x402 protocol, enabling:
  - Verifiable, machine-to-machine micropayments
  - Gated data access with USDC payments
  - Direct revenue to contributors
  
  **Location**: 
  - Server-side implementation: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 236-266, 1034-1054)
  - Client-side payment handling: [`frontend/app/asset/[topicId]/page.tsx`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/asset/[topicId]/page.tsx) (lines 76-158)

- **Trust Scores**: Analysis results include trust metrics such as:
  - Trust scores for knowledge assets
  - Verification scores and fabrication risk assessments
  - Provenance quality scores
  
  **Location**: Analysis results structure in [`frontend/app/api/analyze/route.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/api/analyze/route.ts)

---

## The DKGPedia Plugin

The DKGPedia Plugin (`@dkg/plugin-dkgpedia`) is a custom plugin for the OriginTrail DKG Node that provides the core functionality for managing Community Notes - verified knowledge assets that serve as trusted sources for accurate, hallucination-free information.

### Overview

The plugin extends the DKG Node with:

- **MCP Tools**: Enables AI agents to query and search Community Notes via Model Context Protocol
- **REST API Endpoints**: Provides HTTP endpoints for querying, searching, and publishing Community Notes
- **x402 Payment Integration**: Implements paywalled content access using the x402 protocol for monetizing user-contributed knowledge assets
- **DKG Integration**: Seamlessly interacts with the OriginTrail Decentralized Knowledge Graph for storing and retrieving knowledge assets

### Key Functionalities

1. **Community Note Retrieval**: Query specific Community Notes by topic ID with full analysis results
2. **Community Note Search**: Search Community Notes by keywords with pagination support
3. **Community Note Publishing**: Publish new knowledge assets to the DKG with comprehensive analysis data
4. **Payment Gating**: Automatically applies x402 payment middleware for user-contributed paywalled content
5. **Remote Node Validation**: Ensures queries are made against remote DKG nodes, not local instances

### JSON-LD Structure

Community Notes are stored in the DKG as structured JSON-LD using the `dkgpedia` namespace (`https://dkgpedia.org/schema/`). The structure includes:

#### Core Fields
- `dkgpedia:topicId`: Unique topic identifier
- `dkgpedia:name`: Title of the Community Note
- `dkgpedia:dateCreated`: ISO 8601 timestamp
- `dkgpedia:contributionType`: Either "regular" or "User contributed"
- `dkgpedia:summary`: Brief summary extracted from analysis
- `dkgpedia:primarySource`: Primary source file path
- `dkgpedia:secondarySource`: Secondary source file path

#### Analysis Results (Stored as JSON Strings)
- `dkgpedia:analysisResult`: Complete analysis result object
- `dkgpedia:fetchResults`: Source comparison data
- `dkgpedia:tripleResults`: Knowledge graph triple extraction results
- `dkgpedia:semanticDriftResults`: Semantic drift analysis
- `dkgpedia:factCheckResults`: Fact-checking verification results
- `dkgpedia:sentimentResults`: Sentiment and bias analysis
- `dkgpedia:multimodalResults`: Image/video alignment analysis
- `dkgpedia:judgingResults`: Comprehensive evaluation reports

#### Metadata Fields
- `dkgpedia:categoryMetrics`: Category-specific metrics (JSON string)
- `dkgpedia:notableInstances`: Notable instances and examples (JSON string)
- `dkgpedia:analysisId`: Unique analysis identifier
- `dkgpedia:analysisStatus`: Analysis completion status
- `dkgpedia:stepsCompleted`: Array of completed analysis steps (JSON string)
- `dkgpedia:executionTimeSeconds`: Analysis execution time
- `dkgpedia:analysisTimestamp`: Analysis completion timestamp
- `dkgpedia:imageUrls`: URLs for analysis visualization images (JSON string)

#### Payment Fields (User-Contributed Only)
- `dkgpedia:walletAddress`: Contributor's wallet address for receiving payments
- `dkgpedia:priceUsd`: Price in USD for accessing the content

#### Retrieval Structure

When retrieved from the DKG, Community Notes are returned with:
- All core fields as clean strings
- Parsed JSON objects for analysis results and metadata
- Full asset details from the DKG SDK
- Payment requirements (if applicable)

**Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts)

For detailed documentation on all functionalities, tools, and API routes, see the [Plugin README](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/README.md).

---

## How It All Works

### User Types and Workflows

#### 1. Contributors

<img width="1159" height="644" alt="Screenshot 2025-11-28 at 9 31 14 PM" src="https://github.com/user-attachments/assets/1e191dba-d1cc-4f30-97a0-0ee82e330b9d" />



Contributors are users who create and publish knowledge assets to the DKG. Their workflow involves:

**Step 1: Topic Submission**
- Navigate to the Contribute page (`/contribute`)
- Enter topic information including:
  - Topic ID (e.g., "artificial-intelligence-2024")
  - Title
  - Suggested edit
  - List of Sources
  - Payment Settings (wallet address and price in USD)

**Location**: [`frontend/app/contribute/page.tsx`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/contribute/page.tsx)

**Step 2: AI Analysis Trigger**
- The contribution form submits data to `/api/dkgpedia/publish`
- The system triggers comprehensive AI analysis through `/api/analyze`
- Analysis generates detailed metrics across multiple dimensions:
  - Fetch: Source comparison (Grokipedia vs Wikipedia)
  - Triple: Knowledge graph extraction and analysis
  - Semantic Drift: Semantic similarity and topic modeling
  - Fact Check: Verification and consistency checks
  - Sentiment: Polarity and framing analysis
  - Multimodal: Image/video alignment with text
  - Judging: Comprehensive evaluation reports

**Location**: 
- Publish endpoint: [`frontend/app/api/dkgpedia/publish/route.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/api/dkgpedia/publish/route.ts)
- Analysis endpoint: [`frontend/app/api/analyze/route.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/api/analyze/route.ts)

**Step 3: DKG Publishing**
- Analysis results are packaged into a JSON-LD structure
- The asset is published to the OriginTrail DKG with:
  - Epochs configuration (2 epochs)
  - Minimum finalization confirmations (3)
  - Minimum node replications (1)
- Contributors stake TRAC tokens during the publishing process
- A Unique Asset Locator (UAL) is returned upon successful publication

**Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 1239-1443)

**Step 4: Monetization (Optional)**
- If the contribution type is "User contributed", the asset becomes paywalled
- Users must pay USDC (via x402 protocol) to access the full content
- Payments go directly to the contributor's wallet address
- This incentivizes high-quality contributions

#### 2. End Users / Query Users

<img width="1159" height="644" alt="Screenshot 2025-11-28 at 9 30 58 PM" src="https://github.com/user-attachments/assets/8f1dfccb-4a4d-4bd0-a060-afe9c099b615" />


End users search for topics and retrieve verified information from the DKG.

**Step 1: Search**
- Users enter search queries in the DKGPedia interface
- The system queries the DKG for matching Community Notes
- Results are displayed with trust scores and pricing information

**Location**: 
- Search UI: [`frontend/components/hero.tsx`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/components/hero.tsx) (lines 56-79)
- Search API: [`frontend/app/api/dkgpedia/search/route.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/api/dkgpedia/search/route.ts)

**Step 2: Asset Retrieval**
- Users click on a search result to view the full knowledge asset
- The system queries the DKG for the specific Community Note
- If the asset is user-contributed and paywalled:
  - The system detects payment requirements via x402 protocol
  - Users are prompted to pay USDC to access the content
  - Payment is processed through the x402 facilitator

**Location**: 
- Asset page: [`frontend/app/asset/[topicId]/page.tsx`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/asset/[topicId]/page.tsx)
- Query endpoint: [`frontend/app/api/dkgpedia/query/[topicId]/route.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/api/dkgpedia/query/[topicId]/route.ts)

**Step 3: Access & Verification**
- Upon payment (if required), users receive:
  - Full analysis results
  - Trust scores and verification metrics
  - Source provenance information
  - Detailed judging reports comparing sources

### DKG Node Interaction

The DKGPedia plugin provides seamless interaction with the OriginTrail DKG Node through multiple interfaces:

#### 1. MCP Tools for AI Agents

AI agents can interact with the DKG through Model Context Protocol (MCP) tools:

**Get Community Note Tool**:
```typescript
// Location: https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts (lines 281-608)
mcp.registerTool("dkgpedia-get-community-note", {
  // Queries DKG using SPARQL
  // Returns full Community Note with analysis results
})
```

**Search Community Notes Tool**:
```typescript
// Location: https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts (lines 614-820)
mcp.registerTool("dkgpedia-search-community-notes", {
  // Searches DKG by keyword
  // Returns list of matching Community Notes
})
```

#### 2. REST API Endpoints

The plugin exposes REST endpoints for direct DKG interaction:

**GET `/dkgpedia/community-notes/:topicId`**:
- Queries the DKG using SPARQL to retrieve a specific Community Note
- Applies x402 payment middleware if content is paywalled
- Returns full asset data including analysis results

**Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 827-1068)

**GET `/dkgpedia/community-notes`** (Search):
- Searches Community Notes by keyword
- Returns paginated results with metadata

**Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 1074-1233)

**POST `/dkgpedia/community-notes`** (Publish):
- Publishes new Community Notes to the DKG
- Validates user-contributed content requirements
- Creates Knowledge Assets with comprehensive metadata

**Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 1239-1443)

#### 3. SPARQL Queries

The plugin uses SPARQL queries to interact with the DKG's graph database:

**Query Structure**:
```sparql
PREFIX dkgpedia: <https://dkgpedia.org/schema/>

SELECT * WHERE {
  ?asset a dkgpedia:CommunityNote .
  ?asset dkgpedia:topicId "${topicId}" .
  OPTIONAL { ?asset dkgpedia:summary ?summary . }
  OPTIONAL { ?asset dkgpedia:name ?title . }
  # ... additional optional fields
}
ORDER BY DESC(?createdAt)
LIMIT 1
```

**Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 321-356, 880-915)

#### 4. Asset Creation

Knowledge Assets are created using the DKG SDK:

```typescript
// Location: https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts (lines 1399-1407)
const createAsset = await ctx.dkg.asset.create(wrapped, {
  epochsNum: 2,
  minimumNumberOfFinalizationConfirmations: 3,
  minimumNumberOfNodeReplications: 1,
});
```

### x402 Payment Protocol Implementation

The x402 protocol enables verifiable, machine-to-machine micropayments for gated data access. DKGPedia implements x402 for monetizing user-contributed knowledge assets.

#### Server-Side Implementation

**Payment Middleware Application**:
When a user-contributed asset is requested, the system checks if payment is required and applies the x402 payment middleware:

```typescript
// Location: https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts (lines 1034-1054)
if (isUserContributed && walletAddress && priceUsd) {
  const facilitatorUrl = "https://x402.org/facilitator" as Resource;
  
  return applyPaymentMiddleware(
    req,
    res,
    () => {
      // Payment verified, return full data
      res.json(responseData);
    },
    walletAddress,
    priceUsd,
    facilitatorUrl,
    process.env.X402_NETWORK || "base-sepolia"
  );
}
```

**Payment Middleware Function**:
The middleware wraps the x402 payment verification:

```typescript
// Location: https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts (lines 240-266)
function applyPaymentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
  walletAddress: string,
  priceUsd: string,
  facilitatorUrl: Resource,
  network: string = "base-sepolia"
) {
  const routePath = `GET /dkgpedia/community-notes/${topicId}`;
  
  const mw = paymentMiddleware(
    walletAddress as `0x${string}` | SolanaAddress,
    {
      [routePath]: {
        price: `$${priceUsd}`,
        network: "base-sepolia",
      },
    },
    {
      url: facilitatorUrl,
    }
  );

  return mw(req, res, next);
}
```

**Paywall Detection**:
The system identifies paywalled content:

```typescript
// Location: https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts (lines 231-234)
function isPaywalled(note: any): boolean {
  const contributionType = extractValue(note.contributionType || note.contribution_type);
  return contributionType === "User contributed" || contributionType === "user contributed";
}
```

#### Client-Side Implementation

**Payment Interceptor**:
The frontend uses a payment interceptor to handle x402 payment requirements:

```typescript
// Location: https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/asset/[topicId]/page.tsx (lines 85-87)
const apiClient = walletClient
  ? withPaymentInterceptor(baseApiClient, walletClient)
  : baseApiClient;
```

**Payment Error Handling**:
When a 402 Payment Required response is received, the client extracts payment information and initiates the payment flow:

```typescript
// Location: https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/asset/[topicId]/page.tsx (lines 102-158)
catch (fetchErr: any) {
  // Check if it's an x402 payment error
  if (fetchErr.response?.data?.error === "X-PAYMENT header is required" || 
      fetchErr.response?.data?.x402Version) {
    console.log("💰 Payment required for this asset");
    
    // Extract payment info from error response
    const paymentInfo = fetchErr.response?.data?.accepts?.[0];
    
    if (walletClient) {
      // Initiate payment flow
      // ...
    }
  }
}
```

**Payment Flow**:
1. User requests a paywalled asset
2. Server returns 402 Payment Required with payment details
3. Client extracts payment information (price, network, facilitator URL)
4. User's wallet initiates payment via x402 facilitator
5. Payment is verified by the facilitator
6. Client retries request with X-PAYMENT header
7. Server verifies payment and returns full asset data

### Data Structure

The knowledge assets published to the DKG contain comprehensive analysis data structured as JSON-LD. Here's the detailed structure:

#### Core Asset Structure

```json
{
  "@context": {
    "dkgpedia": "https://dkgpedia.org/schema/"
  },
  "@type": "dkgpedia:CommunityNote",
  "dkgpedia:topicId": "string",
  "dkgpedia:name": "string",
  "dkgpedia:dateCreated": "ISO 8601 timestamp",
  "dkgpedia:contributionType": "regular" | "User contributed",
  "dkgpedia:summary": "string",
  "dkgpedia:categoryMetrics": "JSON string",
  "dkgpedia:notableInstances": "JSON string",
  "dkgpedia:primarySource": "string",
  "dkgpedia:secondarySource": "string"
}
```

**Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 1348-1383)

#### Analysis Results Structure

The `analysisResult` field contains a comprehensive analysis object with the following structure:

```json
{
  "status": "success",
  "analysis_id": "string",
  "topic": "string",
  "steps_completed": ["fetch", "triple", "semanticdrift", "factcheck", "sentiment", "multimodal", "judging"],
  "results": {
    "fetch": {
      "status": "success",
      "grokipedia": {
        "word_count": number,
        "char_count": number,
        "references_count": number,
        "sections": number
      },
      "wikipedia": {
        "word_count": number,
        "char_count": number,
        "references_count": number
      },
      "files": {
        "grokipedia": "string",
        "wikipedia": "string"
      }
    },
    "triple": {
      "status": "success",
      "basic_stats": {
        "source_a_triples": number,
        "source_b_triples": number,
        "total_triples": number
      },
      "triple_overlap": {
        "exact_overlap_count": number,
        "exact_overlap_score": number,
        "fuzzy_overlap_count": number,
        "fuzzy_overlap_score": number,
        "unique_to_source_a": number,
        "unique_to_source_b": number
      },
      "semantic_similarity": {
        "average_similarity": number,
        "max_similarity": number,
        "similar_pairs_count": number,
        "similar_pairs_percentage": number,
        "method": "sentence-transformers"
      },
      "graph_embeddings": {
        "TransE": {
          "average_similarity": number,
          "max_similarity": number,
          "entity_count": number,
          "relation_count": number
        },
        "DistMult": { /* same structure */ },
        "ComplEx": { /* same structure */ }
      },
      "graph_density": {
        "source_a_density": number,
        "source_b_density": number,
        "density_delta": number,
        "density_ratio": number
      },
      "entity_coherence": {
        "common_entities": number,
        "consistent_entities": number,
        "partially_consistent_entities": number,
        "coherence_score": number,
        "average_overlap_ratio": number,
        "inconsistent_examples": [...]
      },
      "provenance_analysis": {
        "source_a_cited": number,
        "source_a_cited_percentage": number,
        "source_b_cited": number,
        "source_b_cited_percentage": number,
        "citation_gap": number,
        "cited_overlap": number,
        "provenance_quality_score_a": number,
        "provenance_quality_score_b": number,
        "extraction_methods_a": {...},
        "extraction_methods_b": {...},
        "unsourced_triples_a": number,
        "unsourced_triples_b": number,
        "unsourced_percentage_a": number,
        "unsourced_percentage_b": number
      },
      "contradictions": {
        "contradiction_count": number,
        "contradictions": [...],
        "filtered_noise_triples_a": number,
        "filtered_noise_triples_b": number
      }
    },
    "semanticdrift": {
      "status": "success",
      "semantic_drift_score": {
        "overall_drift_score": number,
        "drift_percentage": number,
        "component_scores": {
          "sentence_embedding_drift": number,
          "cross_encoder_drift": number,
          "kg_embedding_drift": number,
          "topic_drift": number
        },
        "interpretation": "string"
      },
      "sentence_embeddings": {...},
      "cross_encoder": {...},
      "knowledge_graph_embeddings": {
        "TransE": {...},
        "DistMult": {...},
        "ComplEx": {...}
      },
      "topic_modeling": {
        "method": "BERTopic",
        "topics": [...],
        "probabilities": [...],
        "topic_info": {...}
      },
      "claim_alignment": {
        "total_claims_grokipedia": number,
        "total_claims_wikipedia": number,
        "exact_matches": number,
        "semantic_matches": number,
        "total_aligned_claims": number,
        "alignment_percentage": number
      }
    },
    "factcheck": {
      "status": "success",
      "summary": {
        "total_contradictions": number,
        "grok_claims_verified": number,
        "wiki_claims_verified": number
      },
      "metrics": {
        "grokipedia": {
          "unsourced_claim_ratio": {...},
          "external_verification_score": {...},
          "temporal_consistency": {...},
          "fabrication_risk_score": {...}
        },
        "wikipedia": {
          "unsourced_claim_ratio": {...},
          "external_verification_score": {...},
          "temporal_consistency": {...},
          "fabrication_risk_score": {...}
        }
      },
      "contradictory_claims": {
        "total_pairs": number,
        "pairs": [...]
      }
    },
    "sentiment": {
      "status": "success",
      "sentiment_analysis": {
        "grokipedia_average_polarity": number,
        "wikipedia_average_polarity": number,
        "sentiment_shifts_count": number,
        "sentiment_shifts": [...]
      },
      "framing_analysis": {
        "grokipedia_bias_score": number,
        "wikipedia_bias_score": number,
        "representation_balance": {...}
      },
      "political_leaning": {
        "grokipedia": "string",
        "wikipedia": "string",
        "grokipedia_scores": {...},
        "wikipedia_scores": {...}
      }
    },
    "multimodal": {
      "status": "success",
      "summary": {
        "wikipedia_article": "string",
        "images_found": number,
        "images_processed": number,
        "videos_found": number,
        "audio_found": number,
        "media_processed": number,
        "text_chunks": number
      },
      "textual_similarity": {
        "average_similarity": number,
        "average_image_similarity": number,
        "average_media_similarity": number,
        "max_similarity": number,
        "min_similarity": number,
        "highest_matching_segments": [...],
        "lowest_matching_segments": [...]
      },
      "image_to_text_alignment": {
        "image_relevance_score": number,
        "image_text_match_score": number,
        "well_matched_images": number,
        "total_images": number
      },
      "media_to_text_alignment": {
        "media_relevance_score": number,
        "media_text_match_score": number,
        "well_matched_media": number,
        "total_media": number,
        "videos_processed": number,
        "audio_processed": number
      },
      "multimodal_consistency_index": {
        "mci_score": number,
        "image_alignment_component": number,
        "media_alignment_component": number,
        "multimodal_consistency_component": number,
        "breakdown": {...}
      }
    },
    "judging": {
      "status": "success",
      "model": "string",
      "report_length": number,
      "report_preview": "string",
      "full_report": "string"
    }
  },
  "errors": [],
  "timestamp": "ISO 8601 timestamp",
  "execution_time_seconds": number
}
```

**Location**: [`frontend/app/api/analyze/route.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/frontend/app/api/analyze/route.ts) (lines 4-1908)

#### Storage in DKG

The analysis results are stored in multiple formats for efficient querying:

1. **Complete Analysis Result**: Stored as a JSON string in `dkgpedia:analysisResult`
2. **Individual Result Sections**: Stored separately for granular queries:
   - `dkgpedia:fetchResults`
   - `dkgpedia:tripleResults`
   - `dkgpedia:semanticDriftResults`
   - `dkgpedia:factCheckResults`
   - `dkgpedia:sentimentResults`
   - `dkgpedia:multimodalResults`
   - `dkgpedia:judgingResults`
3. **Analysis Metadata**: Stored for quick access:
   - `dkgpedia:analysisId`
   - `dkgpedia:analysisStatus`
   - `dkgpedia:stepsCompleted`
   - `dkgpedia:executionTimeSeconds`
   - `dkgpedia:analysisTimestamp`

**Location**: [`DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts`](https://github.com/SamFelix03/DKGPedia/tree/main/DKG-Node-With-Plugin/packages/plugin-dkgpedia/src/index.ts) (lines 1367-1382)

This comprehensive data structure ensures that:
- **Quick Queries**: Basic metadata can be retrieved without parsing large JSON objects
- **Detailed Analysis**: Full analysis results are available when needed
- **Flexible Access**: Individual result sections can be queried independently
- **Efficient Storage**: JSON strings are stored efficiently in the DKG's graph database



