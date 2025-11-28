# DKGPedia - A Better Grokipedia

> **Decentralized Knowledge Graph-powered platform for accurate, hallucination-free information retrieval**

<img width="1342" height="765" alt="DKGPedia Screenshot" src="https://github.com/user-attachments/assets/c61ca179-fdc0-4d57-b754-8703edf13c90" />

## What is DKGPedia?

DKGPedia is a platform that provides accurate, verified information free from AI hallucinations. When you search for topics that would typically be available in Grokipedia, DKGPedia uses AI agents and the OriginTrail Decentralized Knowledge Graph to cross-reference information with authoritative sources like Wikipedia, ensuring you get reliable, verified results.

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

## Three-Layer Architecture

DKGPedia implements a robust three-layer architecture that ensures trust, decentralization, and economic sustainability:

### 🤖 Agent Layer

**AI agents built on the DKG Node, or custom frameworks, communicating via MCP (Model Context Protocol)**

The Agent Layer consists of AI agents that act as knowledge creators, verifiers, and brokers, reasoning over decentralized data stored in the DKG. These agents:

- Query and retrieve knowledge assets from the DKG
- Perform comprehensive analysis comparing multiple sources
- Verify information accuracy and detect hallucinations
- Publish verified knowledge back to the DKG

### 🧠 Knowledge Layer

**The knowledge layer – OriginTrail Decentralized Knowledge Graph on NeuroWeb powered by Polkadot**

The Knowledge Layer serves as the connective tissue of the ecosystem, storing all knowledge assets in a decentralized, immutable format. This ensures:

- **Permanent Storage**: All verified knowledge is stored immutably on the blockchain
- **Transparency**: Anyone can verify the provenance and trustworthiness of information
- **Decentralization**: No single point of failure or control
- **Accessibility**: Knowledge assets are queryable via SPARQL and accessible through MCP tools

### 🔗 Trust Layer

**Implements the economic and reputational backbone for trust**

The Trust Layer provides the economic and reputational mechanisms that incentivize quality contributions and ensure trust in the knowledge ecosystem:

- **TRAC Token Staking**: Contributors stake TRAC tokens when publishing knowledge assets, ensuring commitment and quality
- **x402 Payment Protocol**: User-contributed assets can be monetized through verifiable, machine-to-machine micropayments using USDC
- **Trust Scores**: Analysis results include trust metrics such as verification scores, fabrication risk assessments, and provenance quality scores
- **Economic Sustainability**: Creates sustainable incentives for high-quality contributions while maintaining free access to community-verified content

---

## The Problem We Solve

AI-generated content often contains **hallucinations and inaccuracies**. DKGPedia addresses this by:

- **Cross-referencing multiple sources** to verify information accuracy
- **Storing verified knowledge** on a decentralized blockchain (OriginTrail DKG)
- **Providing detailed analysis metrics** showing trust scores and verification data
- **Enabling community contributions** of verified knowledge with economic incentives

## Key Features

### 🔍 **Accurate Search Results**
Search for any topic and receive verified, hallucination-free information with trust scores and source verification.

### 🤝 **Community Contributions**
Anyone can contribute verified knowledge by providing topics, sources, and corrections. The system performs comprehensive AI analysis to verify and validate the information before publishing it to the decentralized knowledge graph.

### 💰 **Economic Incentives**
Contributors can monetize their verified knowledge through micropayments, creating sustainable incentives for high-quality contributions.

### 🔐 **Decentralized Trust**
All verified knowledge is stored immutably on the OriginTrail Decentralized Knowledge Graph, ensuring transparency and trust.

## Benefits

✅ **Accurate Information**: Cross-referenced with multiple authoritative sources  
✅ **Transparent**: All verification data is publicly accessible on the blockchain  
✅ **Community-Driven**: Anyone can contribute and verify knowledge  
✅ **Sustainable**: Economic incentives reward quality contributions  
✅ **Decentralized**: No single point of failure or control  

---

## Getting Started

**New to DKGPedia?** Start by searching for a topic you're interested in. The search feature is the fastest way to experience how DKGPedia works and see verified, accurate information in action.

For detailed technical documentation, including comprehensive system architecture, API details, code examples, and in-depth explanations of the comparison engine subsystems, see the [full README](README.md).

---

**DKGPedia** - Building a more trustworthy, decentralized, and accurate information ecosystem for the future.
