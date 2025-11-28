# DKGPedia Plugin

> **Custom DKG Node plugin for managing Community Notes and knowledge verification**

The DKGPedia Plugin (`@dkg/plugin-dkgpedia`) extends the OriginTrail DKG Node with comprehensive functionality for managing Community Notes - verified knowledge assets that serve as trusted sources for accurate, hallucination-free information retrieval.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [MCP Tools](#mcp-tools)
  - [Get Community Note](#get-community-note)
  - [Search Community Notes](#search-community-notes)
- [REST API Endpoints](#rest-api-endpoints)
  - [GET /dkgpedia/community-notes/:topicId](#get-dkgpediacommunity-notestopicid)
  - [GET /dkgpedia/community-notes](#get-dkgpediacommunity-notes)
  - [POST /dkgpedia/community-notes](#post-dkgpediacommunity-notes)
- [x402 Payment Protocol Integration](#x402-payment-protocol-integration)
- [JSON-LD Data Structure](#json-ld-data-structure)
- [Helper Functions](#helper-functions)
- [Error Handling](#error-handling)

---

## Overview

The DKGPedia Plugin provides:

- **MCP Tools**: Enable AI agents to query and search Community Notes via Model Context Protocol
- **REST API Endpoints**: HTTP endpoints for querying, searching, and publishing Community Notes
- **x402 Payment Integration**: Paywalled content access using the x402 protocol for monetizing user-contributed knowledge assets
- **DKG Integration**: Seamless interaction with the OriginTrail Decentralized Knowledge Graph
- **Remote Node Validation**: Ensures queries are made against remote DKG nodes, not local instances

**Source Code**: [`src/index.ts`](src/index.ts)

---

## Installation

The plugin is included as a dependency in the DKG Node. To use it:

1. Ensure the plugin is listed in your DKG Node's dependencies
2. The plugin will be automatically loaded when the DKG Node starts
3. Configure the required environment variables (see [Configuration](#configuration))

---

## Configuration

### Required Environment Variables

#### `DKG_OTNODE_URL`

**Required**: URL of the remote OriginTrail OT-Node

**Example**: `https://v6-pegasus-node-02.origin-trail.network:8900`

**Important**: 
- Must be a remote node URL (not localhost or 127.0.0.1)
- Community Notes must be queried from the remote DKG network
- The plugin validates this on startup and throws an error if localhost is detected

**Validation**: The plugin includes `validateRemoteOtnode()` function that:
- Checks if `DKG_OTNODE_URL` is set
- Verifies it's not pointing to localhost/127.0.0.1
- Ensures it's a valid remote URL

**Location**: [`src/index.ts`](src/index.ts) (lines 13-55)

#### `X402_NETWORK` (Optional)

**Default**: `base-sepolia`

**Description**: Blockchain network for x402 payments

**Supported Networks**: 
- `base-sepolia` (default)
- Other networks supported by x402-express

---

## MCP Tools

The plugin registers MCP (Model Context Protocol) tools that enable AI agents to interact with Community Notes stored in the DKG.

### Get Community Note

**Tool Name**: `dkgpedia-get-community-note`

**Description**: Retrieves a Community Note for a specific topic from the DKG. Returns summary, analysis results, and key information.

**Input Schema**:
```typescript
{
  topicId: string  // Topic identifier (e.g., 'Climate_change', 'Artificial_intelligence')
}
```

**Output**:
```json
{
  "topicId": "string",
  "found": boolean,
  "summary": "string",
  "title": "string",
  "createdAt": "string",
  "ual": "string | null",
  "contributionType": "regular" | "User contributed",
  "walletAddress": "string | null",
  "priceUsd": number | null,
  "isPaywalled": boolean,
  "categoryMetrics": object | null,
  "notableInstances": object | null,
  "primarySource": "string",
  "secondarySource": "string",
  "provenance": object | null,
  "analysisResult": {
    "status": "success",
    "analysis_id": "string",
    "topic": "string",
    "steps_completed": string[],
    "results": {
      "fetch": object,
      "triple": object,
      "semanticdrift": object,
      "factcheck": object,
      "sentiment": object,
      "multimodal": object,
      "judging": object
    },
    "execution_time_seconds": number,
    "timestamp": "string"
  },
  "assetDetails": object | null
}
```

**Error Response**:
```json
{
  "topicId": "string",
  "found": false,
  "error": "string" | "message": "string"
}
```

**Implementation Details**:

1. **Remote Node Validation**: Validates that queries are made against remote DKG nodes
   - **Location**: [`src/index.ts`](src/index.ts) (lines 296-317)

2. **SPARQL Query**: Executes a SPARQL query to retrieve the Community Note
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
   - **Location**: [`src/index.ts`](src/index.ts) (lines 321-356)

3. **Asset Details Retrieval**: If UAL is available, fetches full asset details from DKG SDK
   - **Location**: [`src/index.ts`](src/index.ts) (lines 411-424)

4. **JSON Parsing**: Safely parses JSON fields from SPARQL results
   - Uses `safeJsonParse()` to handle double-encoding and encoding issues
   - **Location**: [`src/index.ts`](src/index.ts) (lines 431-485)

5. **Response Construction**: Builds comprehensive response with all analysis results
   - Merges data from SPARQL results, asset details, and parsed JSON fields
   - **Location**: [`src/index.ts`](src/index.ts) (lines 487-574)

6. **Source Knowledge Assets**: Wraps response with source knowledge assets for MCP context
   - **Location**: [`src/index.ts`](src/index.ts) (lines 576-594)

**Location**: [`src/index.ts`](src/index.ts) (lines 281-614)

---

### Search Community Notes

**Tool Name**: `dkgpedia-search-community-notes`

**Description**: Searches for Community Notes by topic keywords. Returns a list of matching Community Notes.

**Input Schema**:
```typescript
{
  keyword?: string,  // Search keyword to match against topic IDs or titles
  limit?: number     // Maximum number of results (default: 10)
}
```

**Output**:
```json
{
  "found": boolean,
  "count": number,
  "notes": [
    {
      "topicId": "string",
      "summary": "string",
      "title": "string",
      "createdAt": "string",
      "ual": "string | null",
      "contributionType": "regular" | "User contributed",
      "walletAddress": "string | null",
      "priceUsd": number | null,
      "isPaywalled": boolean,
      "categoryMetrics": object | null,
      "notableInstances": object | null,
      "primarySource": "string",
      "secondarySource": "string",
      "analysisResult": object | null
    }
  ]
}
```

**Error Response**:
```json
{
  "found": false,
  "count": 0,
  "notes": [],
  "error": "string" | "message": "string"
}
```

**Implementation Details**:

1. **Remote Node Validation**: Validates remote DKG node configuration
   - **Location**: [`src/index.ts`](src/index.ts) (lines 642-664)

2. **SPARQL Query with Filtering**: Builds dynamic SPARQL query with optional keyword filter
   ```sparql
   PREFIX dkgpedia: <https://dkgpedia.org/schema/>
   
   SELECT * WHERE {
     ?asset a dkgpedia:CommunityNote .
     ?asset dkgpedia:topicId ?topicId .
     OPTIONAL { ?asset dkgpedia:summary ?summary . }
     OPTIONAL { ?asset dkgpedia:name ?title . }
     # ... additional optional fields
     FILTER (
       CONTAINS(LCASE(?topicId), LCASE("${keyword}")) ||
       CONTAINS(LCASE(?title), LCASE("${keyword}"))
     )  # Only if keyword is provided
   }
   ORDER BY DESC(?createdAt)
   LIMIT ${limit}
   ```
   - **Location**: [`src/index.ts`](src/index.ts) (lines 666-701)

3. **Result Mapping**: Maps SPARQL results to clean note objects
   - Extracts and parses all fields
   - Handles JSON parsing for complex fields
   - **Location**: [`src/index.ts`](src/index.ts) (lines 752-788)

**Location**: [`src/index.ts`](src/index.ts) (lines 617-826)

---

## REST API Endpoints

The plugin exposes REST API endpoints for direct HTTP access to Community Notes functionality.

### GET /dkgpedia/community-notes/:topicId

**Description**: Retrieves a Community Note for a specific topic. Automatically applies x402 payment middleware if the content is paywalled.

**Parameters**:
- `topicId` (path parameter): Topic identifier

**Query Parameters**: None

**Request Example**:
```http
GET /dkgpedia/community-notes/Climate_change
```

**Response (200 OK)**:
```json
{
  "topicId": "Climate_change",
  "found": true,
  "summary": "string",
  "title": "string",
  "createdAt": "string",
  "ual": "string | null",
  "contributionType": "regular" | "User contributed",
  "walletAddress": "string | null",
  "priceUsd": number | null,
  "isPaywalled": boolean,
  "categoryMetrics": object | null,
  "notableInstances": object | null,
  "primarySource": "string",
  "secondarySource": "string",
  "provenance": object | null,
  "analysisResult": {
    "status": "success",
    "analysis_id": "string",
    "topic": "string",
    "steps_completed": string[],
    "results": {
      "fetch": object,
      "triple": object,
      "semanticdrift": object,
      "factcheck": object,
      "sentiment": object,
      "multimodal": object,
      "judging": object
    },
    "execution_time_seconds": number,
    "timestamp": "string"
  }
}
```

**Response (402 Payment Required)**:
```json
{
  "x402Version": "1.0",
  "accepts": [
    {
      "paymentType": "USDC",
      "network": "base-sepolia",
      "amount": "0.10",
      "facilitator": "https://x402.org/facilitator"
    }
  ]
}
```

**Response (404 Not Found)**:
```json
{
  "topicId": "string",
  "found": false,
  "ual": null
}
```

**Response (400 Bad Request)**:
```json
{
  "topicId": "string",
  "found": false,
  "error": "DKG_OTNODE_URL is not configured..."
}
```

**Implementation Details**:

1. **Parameter Extraction**: Extracts `topicId` from request parameters
   - **Location**: [`src/index.ts`](src/index.ts) (line 872)

2. **Remote Node Validation**: Validates DKG node configuration
   - **Location**: [`src/index.ts`](src/index.ts) (lines 875-884)

3. **SPARQL Query**: Executes query to retrieve Community Note
   - **Location**: [`src/index.ts`](src/index.ts) (lines 886-923)

4. **Data Parsing**: Parses SPARQL results and JSON fields
   - **Location**: [`src/index.ts`](src/index.ts) (lines 955-1004)

5. **Payment Middleware Application**: 
   - Checks if content is paywalled (`isPaywalled()`)
   - If paywalled, applies x402 payment middleware
   - Middleware verifies payment before returning data
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1034-1054)

6. **Response Construction**: Builds response with all analysis data
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1006-1032)

**x402 Payment Flow**:

1. Request arrives for paywalled content
2. System checks `contributionType === "User contributed"`
3. If paywalled and has `walletAddress` and `priceUsd`:
   - Applies `applyPaymentMiddleware()` function
   - Middleware checks for `X-PAYMENT` header
   - If missing, returns 402 with payment details
   - If present, verifies payment with x402 facilitator
   - If verified, calls `next()` to return data
   - If not verified, returns 402 error

**Location**: [`src/index.ts`](src/index.ts) (lines 827-1068)

---

### GET /dkgpedia/community-notes

**Description**: Searches for Community Notes by keyword with pagination support.

**Parameters**: None

**Query Parameters**:
- `keyword` (optional): Search keyword to match against topic IDs or titles
- `limit` (optional, default: 10): Maximum number of results to return

**Request Example**:
```http
GET /dkgpedia/community-notes?keyword=artificial&limit=20
```

**Response (200 OK)**:
```json
{
  "found": true,
  "count": 5,
  "notes": [
    {
      "topicId": "string",
      "summary": "string",
      "title": "string",
      "createdAt": "string",
      "ual": "string | null",
      "contributionType": "regular" | "User contributed",
      "walletAddress": "string | null",
      "priceUsd": number | null,
      "isPaywalled": boolean,
      "categoryMetrics": object | null,
      "notableInstances": object | null,
      "primarySource": "string",
      "secondarySource": "string",
      "analysisResult": object | null
    }
  ]
}
```

**Response (200 OK - No Results)**:
```json
{
  "found": false,
  "count": 0,
  "notes": []
}
```

**Response (400 Bad Request)**:
```json
{
  "found": false,
  "count": 0,
  "notes": [],
  "error": "DKG_OTNODE_URL is not configured..."
}
```

**Implementation Details**:

1. **Query Parameter Extraction**: Extracts `keyword` and `limit` from query string
   - **Location**: [`src/index.ts`](src/index.ts) (line 1120)

2. **Remote Node Validation**: Validates DKG node configuration
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1123-1133)

3. **Dynamic SPARQL Query**: Builds query with optional keyword filter
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1135-1171)

4. **Result Mapping**: Maps SPARQL results to clean note objects
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1193-1228)

**Location**: [`src/index.ts`](src/index.ts) (lines 1074-1233)

---

### POST /dkgpedia/community-notes

**Description**: Publishes a new Community Note to the DKG as a Knowledge Asset with comprehensive analysis results.

**Request Body**:
```json
{
  "topicId": "string",
  "title": "string (optional)",
  "contributionType": "regular" | "User contributed",
  "walletAddress": "string (required if contributionType is 'User contributed')",
  "priceUsd": number (required if contributionType is 'User contributed', must be > 0),
  "analysisResult": {
    "status": "success",
    "analysis_id": "string",
    "topic": "string",
    "steps_completed": string[],
    "image_urls": {
      "similarity_heatmap.png": "string (optional)",
      "embedding_space.png": "string (optional)",
      "bias_compass.png": "string (optional)"
    },
    "results": {
      "fetch": object,
      "triple": object,
      "semanticdrift": object,
      "factcheck": object,
      "sentiment": object,
      "multimodal": object,
      "judging": object
    },
    "errors": string[],
    "timestamp": "string",
    "execution_time_seconds": number
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "ual": "did:dkg:...",
  "error": null,
  "verification_url": "/api/dkg/assets?ual=did:dkg:..."
}
```

**Response (400 Bad Request)**:
```json
{
  "success": false,
  "ual": null,
  "error": "walletAddress is required when contributionType is 'User contributed'"
}
```

**Response (500 Internal Server Error)**:
```json
{
  "success": false,
  "ual": null,
  "error": "Failed to publish Community Note: ..."
}
```

**Implementation Details**:

1. **Request Body Validation**:
   - Validates `analysisResult` is present and contains `results`
   - If `contributionType === "User contributed"`:
     - Validates `walletAddress` is provided
     - Validates `priceUsd` is provided and > 0
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1323-1348)

2. **Data Extraction**:
   - Extracts summary from judging report preview or full report
   - Extracts category metrics from triple analysis
   - Extracts notable instances from contradictions
   - Extracts primary and secondary sources from fetch results
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1351-1364)

3. **JSON-LD Structure Creation**:
   - Creates structured JSON-LD using `dkgpedia` namespace
   - Stores complete analysis results as JSON strings
   - Stores individual result sections separately for granular queries
   - Adds payment fields if user-contributed
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1366-1409)

4. **DKG Asset Creation**:
   - Wraps JSON-LD in `{ public: jsonld }` structure
   - Calls `ctx.dkg.asset.create()` with configuration:
     - `epochsNum: 2`
     - `minimumNumberOfFinalizationConfirmations: 3`
     - `minimumNumberOfNodeReplications: 1`
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1411-1428)

5. **UAL Extraction**: Extracts Unique Asset Locator from response
   - **Location**: [`src/index.ts`](src/index.ts) (lines 1430-1435)

**Location**: [`src/index.ts`](src/index.ts) (lines 1239-1443)

---

## x402 Payment Protocol Integration

The plugin integrates the **x402 protocol** for implementing paywalled content access. x402 enables verifiable, machine-to-machine micropayments for gated data access.

### Overview

x402 is a protocol that extends HTTP with payment capabilities, allowing servers to require payment before serving content. The plugin uses `x402-express` middleware to implement this functionality.

**Package**: `x402-express` (version ^0.7.3)

**Location**: [`package.json`](package.json) (line 24)

### Implementation

#### Payment Middleware Function

The plugin includes a helper function `applyPaymentMiddleware()` that wraps the x402 payment middleware:

```typescript
function applyPaymentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
  walletAddress: string,
  priceUsd: string,
  facilitatorUrl: Resource,
  network: string = "base-sepolia"
)
```

**Parameters**:
- `req`: Express request object
- `res`: Express response object
- `next`: Express next function (called after payment verification)
- `walletAddress`: Contributor's wallet address (receives payments)
- `priceUsd`: Price in USD for accessing the content
- `facilitatorUrl`: x402 facilitator URL (default: `https://x402.org/facilitator`)
- `network`: Blockchain network (default: `base-sepolia`)

**Implementation**:
```typescript
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
```

**Location**: [`src/index.ts`](src/index.ts) (lines 236-266)

#### Paywall Detection

The plugin includes `isPaywalled()` function to detect if content requires payment:

```typescript
function isPaywalled(note: any): boolean {
  const contributionType = extractValue(note.contributionType || note.contribution_type);
  return contributionType === "User contributed" || contributionType === "user contributed";
}
```

**Location**: [`src/index.ts`](src/index.ts) (lines 231-234)

#### Payment Flow

1. **Request Arrives**: User requests a Community Note via `GET /dkgpedia/community-notes/:topicId`

2. **Content Retrieval**: System queries DKG and retrieves Community Note data

3. **Paywall Check**: System checks if content is paywalled:
   ```typescript
   if (isUserContributed && walletAddress && priceUsd) {
     // Apply payment middleware
   }
   ```

4. **Payment Middleware Application**: If paywalled, applies x402 middleware:
   - Middleware checks for `X-PAYMENT` header in request
   - If missing, returns **402 Payment Required** with payment details:
     ```json
     {
       "x402Version": "1.0",
       "accepts": [{
         "paymentType": "USDC",
         "network": "base-sepolia",
         "amount": "0.10",
         "facilitator": "https://x402.org/facilitator"
       }]
     }
     ```
   - If present, verifies payment with x402 facilitator
   - If verified, calls `next()` to return full data
   - If not verified, returns 402 error

5. **Data Return**: After payment verification, full Community Note data is returned

**Location**: [`src/index.ts`](src/index.ts) (lines 1034-1054)

### Configuration

#### Environment Variables

- `X402_NETWORK` (optional): Blockchain network for payments (default: `base-sepolia`)

#### Hardcoded Values

- **Facilitator URL**: `https://x402.org/facilitator`
- **Network**: `base-sepolia` (can be overridden via `X402_NETWORK`)

### Payment Details Structure

When returning 402 Payment Required, the response includes:

```json
{
  "x402Version": "1.0",
  "accepts": [
    {
      "paymentType": "USDC",
      "network": "base-sepolia",
      "amount": "0.10",
      "facilitator": "https://x402.org/facilitator"
    }
  ]
}
```

### Client-Side Integration

Clients must:
1. Detect 402 responses
2. Extract payment details from `accepts` array
3. Initiate payment through user's wallet
4. Obtain payment proof from x402 facilitator
5. Retry request with `X-PAYMENT` header containing payment proof

**Example Client Implementation**: See [`frontend/app/asset/[topicId]/page.tsx`](../../../../frontend/app/asset/[topicId]/page.tsx)

---

## JSON-LD Data Structure

Community Notes are stored in the DKG as structured JSON-LD using the `dkgpedia` namespace.

### Namespace

```
https://dkgpedia.org/schema/
```

### Core Structure

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

### Analysis Results (Stored as JSON Strings)

Complex nested objects are stored as JSON strings to avoid SPARQL parsing issues:

```json
{
  "dkgpedia:analysisResult": "JSON string of complete analysis",
  "dkgpedia:fetchResults": "JSON string of fetch analysis",
  "dkgpedia:tripleResults": "JSON string of triple extraction",
  "dkgpedia:semanticDriftResults": "JSON string of semantic drift",
  "dkgpedia:factCheckResults": "JSON string of fact checking",
  "dkgpedia:sentimentResults": "JSON string of sentiment analysis",
  "dkgpedia:multimodalResults": "JSON string of multimodal analysis",
  "dkgpedia:judgingResults": "JSON string of judging report"
}
```

### Metadata Fields

```json
{
  "dkgpedia:analysisId": "string",
  "dkgpedia:analysisStatus": "success" | "error",
  "dkgpedia:stepsCompleted": "JSON string array",
  "dkgpedia:executionTimeSeconds": number,
  "dkgpedia:analysisTimestamp": "ISO 8601 timestamp",
  "dkgpedia:imageUrls": "JSON string object"
}
```

### Payment Fields (User-Contributed Only)

```json
{
  "dkgpedia:walletAddress": "0x...",
  "dkgpedia:priceUsd": 0.10
}
```

### Retrieval Structure

When retrieved from DKG, the plugin:
1. Extracts clean string values from SPARQL results
2. Parses JSON strings back into objects using `safeJsonParse()`
3. Merges data from multiple sources (SPARQL, asset details)
4. Returns structured response with all fields

**Location**: [`src/index.ts`](src/index.ts) (lines 1366-1409)

---

## Helper Functions

The plugin includes several helper functions for data processing and validation.

### validateRemoteOtnode()

Validates that the DKG is configured to use a remote OT-Node, not localhost.

**Purpose**: Ensures Community Notes are queried from the remote DKG network.

**Validation Checks**:
1. Checks if `DKG_OTNODE_URL` is set
2. Verifies it's not localhost or 127.0.0.1
3. Ensures it's a valid remote URL

**Throws**: Error with descriptive message if validation fails

**Location**: [`src/index.ts`](src/index.ts) (lines 13-55)

### extractValue()

Extracts clean values from SPARQL results, handling type annotations and escape sequences.

**Parameters**:
- `value`: SPARQL result value (can be string or object with `.value`)
- `preserveJsonEscapes`: If true, preserves JSON escape sequences (for JSON strings)

**Returns**: Clean string value

**Handles**:
- SPARQL type annotations (`"value"^^type`)
- Quote removal
- Escape sequence handling
- Nested value objects

**Location**: [`src/index.ts`](src/index.ts) (lines 61-90)

### safeJsonParse()

Safely parses JSON strings from SPARQL results, handling various encoding issues.

**Parameters**:
- `jsonStr`: JSON string to parse
- `fallback`: Fallback value if parsing fails (default: `null`)

**Returns**: Parsed JSON object or fallback

**Handles**:
- Double-encoded JSON (JSON string stored as string in JSON-LD)
- Corrupted JSON strings
- Missing or empty strings
- Already-parsed objects

**Location**: [`src/index.ts`](src/index.ts) (lines 96-226)

### isPaywalled()

Checks if a Community Note is paywalled (requires payment).

**Parameters**:
- `note`: Community Note object from SPARQL result

**Returns**: `true` if paywalled, `false` otherwise

**Logic**: Returns `true` if `contributionType === "User contributed"`

**Location**: [`src/index.ts`](src/index.ts) (lines 231-234)

### applyPaymentMiddleware()

Applies x402 payment middleware for paywalled content.

**Parameters**: See [Payment Middleware Function](#payment-middleware-function)

**Returns**: Express middleware function

**Location**: [`src/index.ts`](src/index.ts) (lines 236-266)

---

## Error Handling

The plugin implements comprehensive error handling across all functions and endpoints.

### Validation Errors

**Remote Node Validation**:
- Returns error if `DKG_OTNODE_URL` is not configured
- Returns error if pointing to localhost
- **Location**: [`src/index.ts`](src/index.ts) (lines 13-55, 297-317)

**Request Validation**:
- Returns 400 if required fields are missing
- Returns 400 if user-contributed content lacks wallet/price
- **Location**: [`src/index.ts`](src/index.ts) (lines 1323-1348)

### Query Errors

**SPARQL Query Failures**:
- Catches and handles SPARQL query errors
- Returns appropriate error responses
- Logs warnings for debugging
- **Location**: [`src/index.ts`](src/index.ts) (lines 359-365, 925-936)

### Parsing Errors

**JSON Parsing Failures**:
- Uses `safeJsonParse()` with fallback values
- Logs warnings for corrupted JSON
- Returns `null` or fallback instead of throwing
- **Location**: [`src/index.ts`](src/index.ts) (lines 96-226)

### Asset Creation Errors

**DKG Asset Creation Failures**:
- Validates DKG client availability
- Handles UAL extraction failures
- Returns descriptive error messages
- **Location**: [`src/index.ts`](src/index.ts) (lines 1411-1443)

### Payment Errors

**x402 Payment Errors**:
- Handled by x402-express middleware
- Returns 402 with payment details
- Client must handle payment flow
- **Location**: [`src/index.ts`](src/index.ts) (lines 1034-1054)

### Error Response Format

All errors follow consistent format:

```json
{
  "found": false,
  "error": "Descriptive error message"
}
```

Or for API endpoints:

```json
{
  "success": false,
  "ual": null,
  "error": "Descriptive error message"
}
```

---

