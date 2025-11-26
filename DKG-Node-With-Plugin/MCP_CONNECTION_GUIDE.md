# Connecting to DKG Node as an MCP Server

Your DKG node is now set up as an MCP (Model Context Protocol) server with the DKGPedia plugin enabled. This guide explains how to connect to it and use the available tools.

## MCP Server Endpoint

The MCP server is available at:
- **URL**: `http://localhost:9200/mcp`
- **Protocol**: HTTP-based MCP (using StreamableHTTPServerTransport)

## Authentication

The MCP endpoint requires authentication. You need to:
1. Have a user account with the `mcp` scope
2. Authenticate using OAuth2 or Bearer token

### Default Admin User

After setup, an admin user is created:
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Scopes**: `mcp`, `llm`, `blob`, `scope123`

## Available MCP Tools

The DKGPedia plugin provides the following MCP tools:

### 1. `dkgpedia-get-community-note`

Retrieve a Community Note for a specific topic.

**Input:**
```json
{
  "topicId": "Climate_change"
}
```

**Output:**
```json
{
  "topicId": "Climate_change",
  "found": true,
  "trustScore": 75.5,
  "summary": "Summary of findings...",
  "title": "Climate Change",
  "createdAt": "2025-01-01T00:00:00Z",
  "ual": "did:dkg:0x1234...",
  "assetDetails": { ... }
}
```

### 2. `dkgpedia-search-community-notes`

Search Community Notes by keyword or trust score range.

**Input:**
```json
{
  "keyword": "climate",
  "minTrustScore": 50,
  "maxTrustScore": 100,
  "limit": 10
}
```

**Output:**
```json
{
  "found": true,
  "count": 5,
  "notes": [
    {
      "topicId": "Climate_change",
      "trustScore": 75.5,
      "summary": "...",
      "title": "Climate Change",
      "createdAt": "2025-01-01T00:00:00Z",
      "ual": "did:dkg:0x1234..."
    }
  ]
}
```

## Connecting from Different Clients

### Using MCP SDK (JavaScript/TypeScript)

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const transport = new StreamableHTTPClientTransport({
  url: "http://localhost:9200/mcp",
  headers: {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
  }
});

const client = new Client({
  name: "my-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log(tools);

// Call a tool
const result = await client.callTool({
  name: "dkgpedia-get-community-note",
  arguments: {
    topicId: "Climate_change"
  }
});
```

### Using Claude Desktop (MCP Configuration)

Add to your Claude Desktop MCP configuration file:

```json
{
  "mcpServers": {
    "dkg-node": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-everything"
      ],
      "env": {
        "MCP_SERVER_URL": "http://localhost:9200/mcp",
        "MCP_AUTH_TOKEN": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

### Using Python

```python
import requests
import json

# First, authenticate to get a token
auth_response = requests.post(
    "http://localhost:9200/oauth/token",
    data={
        "grant_type": "password",
        "username": "admin@example.com",
        "password": "admin123",
        "scope": "mcp"
    },
    auth=("client_id", "client_secret")  # Use OAuth client credentials
)

token = auth_response.json()["access_token"]

# Connect to MCP server
mcp_url = "http://localhost:9200/mcp"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Initialize MCP session
init_response = requests.post(
    mcp_url,
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "python-client",
                "version": "1.0.0"
            }
        }
    },
    headers=headers
)

session_id = init_response.headers.get("mcp-session-id")

# Call a tool
tool_response = requests.post(
    mcp_url,
    json={
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "dkgpedia-get-community-note",
            "arguments": {
                "topicId": "Climate_change"
            }
        }
    },
    headers={
        **headers,
        "mcp-session-id": session_id
    }
)

print(tool_response.json())
```

## REST API Endpoints

The DKGPedia plugin also exposes REST API endpoints:

### Get Community Note
```
GET /dkgpedia/community-notes/:topicId
```

### Search Community Notes
```
GET /dkgpedia/community-notes?keyword=climate&minTrustScore=50&limit=10
```

### Publish Community Note
```
POST /dkgpedia/community-notes
Content-Type: application/json

{
  "topicId": "Climate_change",
  "trustScore": 75.5,
  "summary": "Summary of findings...",
  "title": "Climate Change",
  "provenance": {
    "createdBy": "DKGPedia",
    "version": "1.0.0"
  }
}
```

## Getting an Access Token

### Using OAuth2 Password Grant

```bash
curl -X POST http://localhost:9200/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "client_id:client_secret" \
  -d "grant_type=password&username=admin@example.com&password=admin123&scope=mcp"
```

### Creating an OAuth Client

You can create an OAuth client using the DKG node's OAuth management endpoints or by using the database directly.

## Testing the MCP Server

1. **Start the DKG node**:
   ```bash
   cd apps/agent
   npm run dev:server
   ```

2. **Verify the server is running**:
   ```bash
   curl http://localhost:9200/health
   ```

3. **Check available tools** (requires authentication):
   ```bash
   curl -X POST http://localhost:9200/mcp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/list"
     }'
   ```

## Configuration

Make sure your `.env` file has:
- `DKG_OTNODE_URL`: Set to testnet URL (already configured)
- `DKG_BLOCKCHAIN`: Set to `otp:20430` for NeuroWeb testnet (already configured)
- `DKG_PUBLISH_WALLET`: Your wallet private key (already configured)
- `EXPO_PUBLIC_MCP_URL`: `http://localhost:9200` (already configured)

## Troubleshooting

1. **Connection Refused**: Make sure the server is running on port 9200
2. **Authentication Failed**: Verify your user has the `mcp` scope
3. **Tool Not Found**: Ensure the DKGPedia plugin is registered in `apps/agent/src/server/index.ts`
4. **SPARQL Query Errors**: Remote testnet nodes may not support SPARQL queries immediately. Use UAL-based retrieval as a fallback.

## Next Steps

- Explore the Swagger API documentation at `http://localhost:9200/api-docs`
- Test the MCP tools using the available client libraries
- Publish Community Notes to the DKG using the REST API or MCP tools
- Query published notes using SPARQL or UAL-based retrieval

