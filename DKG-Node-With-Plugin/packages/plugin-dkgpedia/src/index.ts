import { defineDkgPlugin } from "@dkg/plugins";
import { openAPIRoute, z } from "@dkg/plugin-swagger";
import { withSourceKnowledgeAssets } from "@dkg/plugin-dkg-essentials/utils";
import { paymentMiddleware, type Resource, type SolanaAddress } from "x402-express";
import type { Request, Response, NextFunction } from "express";

/**
 * Validates that the DKG is configured to use a remote OT-Node, not localhost.
 * This ensures community notes are queried from the remote DKG network.
 * 
 * @throws Error if localhost is detected or OT-Node URL is not configured
 */
function validateRemoteOtnode(): void {
  const otnodeUrl = process.env.DKG_OTNODE_URL;
  
  if (!otnodeUrl) {
    throw new Error(
      "DKG_OTNODE_URL is not configured. " +
      "Please set DKG_OTNODE_URL to a remote OT-Node (e.g., https://v6-pegasus-node-02.origin-trail.network:8900). " +
      "Community notes must be queried from the remote DKG network, not a local node."
    );
  }
  
  // Check if it's localhost or 127.0.0.1
  const urlLower = otnodeUrl.toLowerCase();
  if (
    urlLower.includes("localhost") ||
    urlLower.includes("127.0.0.1") ||
    urlLower.startsWith("http://localhost") ||
    urlLower.startsWith("http://127.0.0.1")
  ) {
    throw new Error(
      `DKG_OTNODE_URL is configured to use a local node (${otnodeUrl}). ` +
      "Community notes must be queried from a remote OT-Node connected to the DKG network. " +
      "Please set DKG_OTNODE_URL to a remote node, for example: " +
      "https://v6-pegasus-node-02.origin-trail.network:8900"
    );
  }
  
  // Ensure it's a remote URL (starts with https:// or http:// and has a domain)
  try {
    const url = new URL(otnodeUrl);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1") {
      throw new Error(
        `DKG_OTNODE_URL points to a local address (${url.hostname}). ` +
        "Community notes must be queried from a remote OT-Node. " +
        "Please set DKG_OTNODE_URL to a remote node, for example: " +
        "https://v6-pegasus-node-02.origin-trail.network:8900"
      );
    }
  } catch (urlError) {
    // If URL parsing fails, it might be a malformed URL, but we already checked for localhost above
    // So we'll let it pass if it doesn't contain localhost
  }
}

/**
 * Helper function to extract clean value from SPARQL result
 * @param preserveJsonEscapes - If true, preserves escape sequences (for JSON strings)
 */
function extractValue(value: any, preserveJsonEscapes: boolean = false): string {
  if (!value) return "";
  if (typeof value === 'string') {
    // Remove quotes and type annotations (e.g., "value"^^type -> value)
    let clean = value.replace(/^"|"$/g, '');
    
    // Remove type annotation if present
    const typeMatch = clean.match(/^(.+?)\^\^.+$/);
    if (typeMatch && typeMatch[1]) {
      clean = typeMatch[1].replace(/^"|"$/g, '');
    }
    
    // For JSON strings, we need to be more careful with unescaping
    if (preserveJsonEscapes) {
      // Only unescape the outer layer of quotes that SPARQL added
      // Don't touch escape sequences inside the JSON
      clean = clean.replace(/\\"/g, '"');
    } else {
      // For regular strings, unescape everything
      clean = clean.replace(/\\"/g, '"');
      // Handle escaped newlines and other escape sequences
      clean = clean.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
    }
    return clean;
  }
  if (value.value) {
    return extractValue(value.value, preserveJsonEscapes);
  }
  return String(value);
}

/**
 * Helper function to safely parse JSON strings from SPARQL results
 * Handles various encoding issues that can occur when storing/retrieving JSON from DKG
 */
function safeJsonParse(jsonStr: string | null | undefined, fallback: any = null): any {
  if (!jsonStr || typeof jsonStr !== 'string' || jsonStr.trim() === '') {
    return fallback;
  }

  // If jsonStr is already an object, return it
  if (typeof jsonStr === 'object') {
    return jsonStr;
  }

  let cleaned = jsonStr.trim();
  
  // First, try to detect if this is a double-encoded JSON string
  // (JSON string stored as a string in JSON-LD, then retrieved from SPARQL)
  // It might look like: "{\"key\":\"value\"}" or '{"key":"value"}'
  try {
    // Check if it's wrapped in quotes (SPARQL returns strings quoted)
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      // Try parsing the outer quotes to get the inner JSON string
      const outerParsed = JSON.parse(cleaned);
      if (typeof outerParsed === 'string') {
        // It was double-encoded, now parse the inner JSON
        return JSON.parse(outerParsed);
      }
      // It wasn't double-encoded, return what we got
      return outerParsed;
    }
  } catch {
    // Not double-encoded as a quoted string, continue with normal parsing
  }

  try {
    // First, try direct parsing
    return JSON.parse(cleaned);
  } catch (e) {
    // If that fails, try cleaning up the string
    
    try {
      // Remove any leading/trailing quotes that might have been added
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
          (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }
      
      // Handle double-encoded JSON (when JSON string is stored as a string in JSON-LD)
      // Try to detect if it's double-encoded by attempting to parse it
      try {
        const firstParse = JSON.parse(cleaned);
        if (typeof firstParse === 'string') {
          // It was double-encoded, now parse the inner JSON
          return JSON.parse(firstParse);
        }
        // It wasn't double-encoded, return what we got
        return firstParse;
      } catch {
        // Not valid JSON, continue with extraction attempt
      }
      
      // If we get here, the JSON might be corrupted or have extra characters
      // Try to extract valid JSON from the string
      return JSON.parse(cleaned);
    } catch (e2) {
      // Last resort: try to extract valid JSON from a corrupted string
      // Look for the first { or [ and try to parse from there
      try {
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        const startIndex = firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket) 
          ? firstBrace 
          : firstBracket >= 0 ? firstBracket : -1;
        
        if (startIndex >= 0) {
          // Try to find matching closing brace/bracket
          let depth = 0;
          let inString = false;
          let escapeNext = false;
          let endIndex = -1;
          
          for (let i = startIndex; i < cleaned.length; i++) {
            const char = cleaned[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{' || char === '[') {
                depth++;
              } else if (char === '}' || char === ']') {
                depth--;
                if (depth === 0) {
                  endIndex = i + 1;
                  break;
                }
              }
            }
          }
          
          if (endIndex > startIndex) {
            const extracted = cleaned.substring(startIndex, endIndex);
            return JSON.parse(extracted);
          }
        }
      } catch (e3) {
        // All parsing attempts failed
      }
      
      // Log warning but don't throw - return fallback instead
      // Only log if it's not an empty string or obviously invalid
      if (jsonStr.length > 10) {
        console.warn("Failed to parse JSON after all attempts. Returning fallback.");
        console.warn("String length:", jsonStr.length);
        console.warn("First 200 chars:", jsonStr.substring(0, 200));
      }
      
      return fallback;
    }
  }
}

/**
 * Helper function to check if content is paywalled and requires payment
 */
function isPaywalled(note: any): boolean {
  const contributionType = extractValue(note.contributionType || note.contribution_type);
  return contributionType === "User contributed" || contributionType === "user contributed";
}

/**
 * Apply x402 payment middleware for paywalled content
 * This middleware is applied dynamically based on the content's payment requirements
 */
function applyPaymentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
  walletAddress: string,
  priceUsd: string,
  facilitatorUrl: Resource,
  network: string = "base-sepolia"
) {
  const topicId = req.params.topicId;
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

/**
 * DKGPedia Plugin
 * 
 * Provides MCP tools and API routes for:
 * - Querying Community Notes from DKG
 * - Getting analysis for topics
 * - Publishing Community Notes to DKG
 */
export default defineDkgPlugin((ctx, mcp, api) => {
  /**
   * MCP Tool: Get Community Note for a topic
   * Allows AI agents to query Community Notes from the DKG
   */
  mcp.registerTool(
    "dkgpedia-get-community-note",
    {
      title: "Get Community Note",
      description:
        "Retrieve a Community Note for a specific topic. " +
        "Returns summary and key information found.",
      inputSchema: {
        topicId: z
          .string()
          .describe("Topic identifier (e.g., 'Climate_change', 'Artificial_intelligence')"),
      },
    },
    async ({ topicId }) => {
      try {
        // Validate that we're using a remote OT-Node, not localhost
        try {
          validateRemoteOtnode();
        } catch (validationError) {
          const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    topicId,
                    found: false,
                    error: errorMessage,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
        
        // Query DKG for Community Notes with this topic_id
          // Using dkgpedia namespace to avoid conflicts with other data
          const query = `
          PREFIX schema: <https://schema.org/>
          PREFIX dkgpedia: <https://dkgpedia.org/schema/>
          
          SELECT * WHERE {
            ?asset a dkgpedia:CommunityNote .
            ?asset dkgpedia:topicId "${topicId}" .
            OPTIONAL { ?asset dkgpedia:summary ?summary . }
            OPTIONAL { ?asset dkgpedia:name ?title . }
            OPTIONAL { ?asset dkgpedia:dateCreated ?createdAt . }
            OPTIONAL { ?asset dkgpedia:identifier ?ual . }
            OPTIONAL { ?asset dkgpedia:contributionType ?contributionType . }
            OPTIONAL { ?asset dkgpedia:walletAddress ?walletAddress . }
            OPTIONAL { ?asset dkgpedia:priceUsd ?priceUsd . }
            OPTIONAL { ?asset dkgpedia:categoryMetrics ?categoryMetrics . }
            OPTIONAL { ?asset dkgpedia:notableInstances ?notableInstances . }
            OPTIONAL { ?asset dkgpedia:primarySource ?primarySource . }
            OPTIONAL { ?asset dkgpedia:secondarySource ?secondarySource . }
            OPTIONAL { ?asset dkgpedia:provenance ?provenance . }
            OPTIONAL { ?asset dkgpedia:analysisResult ?analysisResult . }
            OPTIONAL { ?asset dkgpedia:fetchResults ?fetchResults . }
            OPTIONAL { ?asset dkgpedia:tripleResults ?tripleResults . }
            OPTIONAL { ?asset dkgpedia:semanticDriftResults ?semanticDriftResults . }
            OPTIONAL { ?asset dkgpedia:factCheckResults ?factCheckResults . }
            OPTIONAL { ?asset dkgpedia:sentimentResults ?sentimentResults . }
            OPTIONAL { ?asset dkgpedia:multimodalResults ?multimodalResults . }
            OPTIONAL { ?asset dkgpedia:judgingResults ?judgingResults . }
            OPTIONAL { ?asset dkgpedia:analysisId ?analysisId . }
            OPTIONAL { ?asset dkgpedia:analysisStatus ?analysisStatus . }
            OPTIONAL { ?asset dkgpedia:stepsCompleted ?stepsCompleted . }
            OPTIONAL { ?asset dkgpedia:executionTimeSeconds ?executionTimeSeconds . }
            OPTIONAL { ?asset dkgpedia:analysisTimestamp ?analysisTimestamp . }
            OPTIONAL { ?asset dkgpedia:imageUrls ?imageUrls . }
          }
          ORDER BY DESC(?createdAt)
          LIMIT 1
        `;

        let queryResult;
        try {
          queryResult = await ctx.dkg.graph.query(query, "SELECT");
        } catch (queryError) {
          console.warn("SPARQL query failed:", queryError);
          queryResult = null;
        }

        if (
          !queryResult ||
          !queryResult.data ||
          queryResult.data.length === 0
        ) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    topicId,
                    found: false,
                    message:
                      "No Community Note found for this topic. You may want to create one first.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const note = queryResult.data?.[0];
        if (!note) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    topicId,
                    found: false,
                    message: "No Community Note found for this topic.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const ual = note.ual?.value || note.ual || note.asset?.value || note.asset;
        
        // Get full asset details if UAL is available
        let assetDetails = null;
        
        if (ual) {
          try {
            assetDetails = await ctx.dkg.asset.get(ual, {
              includeMetadata: true,
            });
          } catch (err) {
            console.warn("Could not fetch full asset details:", err);
          }
        }

        const contributionType = extractValue(note.contributionType || note.contribution_type);
        const walletAddress = extractValue(note.walletAddress || note.wallet_address);
        const priceUsd = extractValue(note.priceUsd || note.price_usd);
        const isUserContributed = isPaywalled(note);

        // Parse JSON fields if they exist
        let categoryMetrics = null;
        let notableInstances = null;
        let provenance = null;
        let analysisResult = null;
        let fetchResults = null;
        let tripleResults = null;
        let semanticDriftResults = null;
        let factCheckResults = null;
        let sentimentResults = null;
        let multimodalResults = null;
        let judgingResults = null;
        
        // Parse JSON fields using safe parsing
        // Use preserveJsonEscapes=true to avoid corrupting JSON escape sequences
        const categoryMetricsStr = extractValue(note.categoryMetrics, true);
        categoryMetrics = safeJsonParse(categoryMetricsStr, null);
        
        const notableInstancesStr = extractValue(note.notableInstances, true);
        notableInstances = safeJsonParse(notableInstancesStr, null);
        
        const provenanceStr = extractValue(note.provenance, true);
        provenance = safeJsonParse(provenanceStr, null);

        // Parse full analysis result if available
        const analysisResultStr = extractValue(note.analysisResult, true);
        analysisResult = safeJsonParse(analysisResultStr, null);

        // Parse image URLs if available
        const imageUrlsStr = extractValue(note.imageUrls, true);
        const imageUrls = safeJsonParse(imageUrlsStr, null);

        // Parse individual result sections if full analysisResult is not available
        if (!analysisResult) {
          const fetchStr = extractValue(note.fetchResults, true);
          fetchResults = safeJsonParse(fetchStr, null);
          
          const tripleStr = extractValue(note.tripleResults, true);
          tripleResults = safeJsonParse(tripleStr, null);
          
          const semanticDriftStr = extractValue(note.semanticDriftResults, true);
          semanticDriftResults = safeJsonParse(semanticDriftStr, null);
          
          const factCheckStr = extractValue(note.factCheckResults, true);
          factCheckResults = safeJsonParse(factCheckStr, null);
          
          const sentimentStr = extractValue(note.sentimentResults, true);
          sentimentResults = safeJsonParse(sentimentStr, null);
          
          const multimodalStr = extractValue(note.multimodalResults, true);
          multimodalResults = safeJsonParse(multimodalStr, null);
          
          const judgingStr = extractValue(note.judgingResults, true);
          judgingResults = safeJsonParse(judgingStr, null);
        }

        const response = {
          topicId: extractValue(note.topicId) || topicId,
          found: true,
          summary: extractValue(note.summary),
          title: extractValue(note.title),
          createdAt: extractValue(note.createdAt),
          ual: ual || null, // Ensure UAL is always included
          contributionType: contributionType || "regular",
          walletAddress: walletAddress || null,
          priceUsd: priceUsd ? parseFloat(priceUsd) : null,
          isPaywalled: isUserContributed,
          categoryMetrics: categoryMetrics || (assetDetails?.public?.assertion?.categoryMetrics),
          notableInstances: notableInstances || (assetDetails?.public?.assertion?.notableInstances),
          primarySource: extractValue(note.primarySource) || assetDetails?.public?.assertion?.primarySource,
          secondarySource: extractValue(note.secondarySource) || assetDetails?.public?.assertion?.secondarySource,
          provenance: provenance || assetDetails?.public?.assertion?.provenance,
          // Full analysis results
          analysisResult: (() => {
            // Always try to parse individual results as fallback, even if analysisResult exists
            // This ensures we have data even if analysisResult is incomplete
            if (!fetchResults) {
              const fetchStr = extractValue(note.fetchResults, true);
              fetchResults = safeJsonParse(fetchStr, null);
            }
            if (!tripleResults) {
              const tripleStr = extractValue(note.tripleResults, true);
              tripleResults = safeJsonParse(tripleStr, null);
            }
            if (!semanticDriftResults) {
              const semanticDriftStr = extractValue(note.semanticDriftResults, true);
              semanticDriftResults = safeJsonParse(semanticDriftStr, null);
            }
            if (!factCheckResults) {
              const factCheckStr = extractValue(note.factCheckResults, true);
              factCheckResults = safeJsonParse(factCheckStr, null);
            }
            if (!sentimentResults) {
              const sentimentStr = extractValue(note.sentimentResults, true);
              sentimentResults = safeJsonParse(sentimentStr, null);
            }
            if (!multimodalResults) {
              const multimodalStr = extractValue(note.multimodalResults, true);
              multimodalResults = safeJsonParse(multimodalStr, null);
            }
            if (!judgingResults) {
              const judgingStr = extractValue(note.judgingResults, true);
              judgingResults = safeJsonParse(judgingStr, null);
            }
            
            // Merge parsed analysisResult with individual results
            // Priority: analysisResult.results.X > individualResults > assetDetails
            const mergedResult = analysisResult || {};
            const mergedResults = {
              fetch: mergedResult.results?.fetch || fetchResults || assetDetails?.public?.assertion?.fetchResults || {},
              triple: mergedResult.results?.triple || tripleResults || assetDetails?.public?.assertion?.tripleResults || {},
              semanticdrift: mergedResult.results?.semanticdrift || semanticDriftResults || assetDetails?.public?.assertion?.semanticDriftResults || {},
              factcheck: mergedResult.results?.factcheck || factCheckResults || assetDetails?.public?.assertion?.factCheckResults || {},
              sentiment: mergedResult.results?.sentiment || sentimentResults || assetDetails?.public?.assertion?.sentimentResults || {},
              multimodal: mergedResult.results?.multimodal || multimodalResults || assetDetails?.public?.assertion?.multimodalResults || {},
              judging: mergedResult.results?.judging || judgingResults || assetDetails?.public?.assertion?.judgingResults || {},
            };
            
            // If analysisResult exists and has results, use it as base but merge in any missing individual results
            if (analysisResult && analysisResult.results) {
              return {
                ...analysisResult,
                results: mergedResults,
                image_urls: analysisResult.image_urls || imageUrls || undefined,
              };
            }
            
            // Otherwise, construct from individual results
            return {
              status: mergedResult.status || extractValue(note.analysisStatus) || "success",
              analysis_id: mergedResult.analysis_id || extractValue(note.analysisId) || "",
              topic: mergedResult.topic || extractValue(note.title) || topicId,
              steps_completed: mergedResult.steps_completed || (() => {
                const stepsStr = extractValue(note.stepsCompleted);
                return safeJsonParse(stepsStr, []);
              })(),
              image_urls: imageUrls || undefined,
              results: mergedResults,
              execution_time_seconds: mergedResult.execution_time_seconds || parseFloat(extractValue(note.executionTimeSeconds)) || 0,
              timestamp: mergedResult.timestamp || extractValue(note.analysisTimestamp) || extractValue(note.createdAt) || new Date().toISOString(),
            };
          })(),
          assetDetails: assetDetails || null,
        };

        return withSourceKnowledgeAssets(
          {
            content: [
              {
                type: "text",
                text: JSON.stringify(response, null, 2),
              },
            ],
          },
          ual
            ? [
                {
                  title: `Community Note: ${topicId}`,
                  issuer: "DKGPedia",
                  ual: ual,
                },
              ]
            : [],
        );
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  topicId,
                  found: false,
                  error: `Failed to query Community Note: ${error}`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }
    },
  );

  /**
   * MCP Tool: Search Community Notes
   * Allows AI agents to search for Community Notes by keywords
   */
  mcp.registerTool(
    "dkgpedia-search-community-notes",
    {
      title: "Search Community Notes",
      description:
        "Search for Community Notes by topic keywords. " +
        "Returns a list of matching Community Notes.",
      inputSchema: {
        keyword: z
          .string()
          .optional()
          .describe("Search keyword to match against topic IDs or titles"),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Maximum number of results to return"),
      },
    },
    async ({ keyword, limit = 10 }) => {
      try {
        // Validate that we're using a remote OT-Node, not localhost
        try {
          validateRemoteOtnode();
        } catch (validationError) {
          const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    found: false,
                    count: 0,
                    notes: [],
                    error: errorMessage,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
        
        // Using dkgpedia namespace to avoid conflicts with other data
        let query = `
          PREFIX schema: <https://schema.org/>
          PREFIX dkgpedia: <https://dkgpedia.org/schema/>
          
          SELECT * WHERE {
            ?asset a dkgpedia:CommunityNote .
            ?asset dkgpedia:topicId ?topicId .
            OPTIONAL { ?asset dkgpedia:summary ?summary . }
            OPTIONAL { ?asset dkgpedia:name ?title . }
            OPTIONAL { ?asset dkgpedia:dateCreated ?createdAt . }
            OPTIONAL { ?asset dkgpedia:identifier ?ual . }
            OPTIONAL { ?asset dkgpedia:contributionType ?contributionType . }
            OPTIONAL { ?asset dkgpedia:walletAddress ?walletAddress . }
            OPTIONAL { ?asset dkgpedia:priceUsd ?priceUsd . }
            OPTIONAL { ?asset dkgpedia:categoryMetrics ?categoryMetrics . }
            OPTIONAL { ?asset dkgpedia:notableInstances ?notableInstances . }
            OPTIONAL { ?asset dkgpedia:primarySource ?primarySource . }
            OPTIONAL { ?asset dkgpedia:secondarySource ?secondarySource . }
            OPTIONAL { ?asset dkgpedia:analysisResult ?analysisResult . }
        `;

        if (keyword) {
          query += `
            FILTER (
              CONTAINS(LCASE(?topicId), LCASE("${keyword}")) ||
              CONTAINS(LCASE(?title), LCASE("${keyword}"))
            )
          `;
        }


        query += `
          }
          ORDER BY DESC(?createdAt)
          LIMIT ${limit}
        `;

        let queryResult;
        try {
          queryResult = await ctx.dkg.graph.query(query, "SELECT");
        } catch (queryError) {
          console.error("SPARQL query error:", queryError);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    found: false,
                    count: 0,
                    notes: [],
                    message: "No Community Notes found matching the criteria.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        if (
          !queryResult ||
          !queryResult.data ||
          queryResult.data.length === 0
        ) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    found: false,
                    count: 0,
                    notes: [],
                    message: "No Community Notes found matching the criteria.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        // Extract clean values from SPARQL results
        const notes = queryResult.data.map((note: any) => {
          const assetUri = note.asset?.value || note.asset;
          const ual = note.ual?.value || note.ual || assetUri;
          const contributionType = extractValue(note.contributionType || note.contribution_type);
          const walletAddress = extractValue(note.walletAddress || note.wallet_address);
          const priceUsd = extractValue(note.priceUsd || note.price_usd);
          
          // Parse JSON fields using safe parsing
          // Use preserveJsonEscapes=true to avoid corrupting JSON escape sequences
          const categoryMetricsStr = extractValue(note.categoryMetrics, true);
          const categoryMetrics = safeJsonParse(categoryMetricsStr, null);
          
          const notableInstancesStr = extractValue(note.notableInstances, true);
          const notableInstances = safeJsonParse(notableInstancesStr, null);
          
          // Parse analysis result if available
          const analysisResultStr = extractValue(note.analysisResult, true);
          const analysisResult = safeJsonParse(analysisResultStr, null);
          
          return {
            topicId: extractValue(note.topicId),
            summary: extractValue(note.summary),
            title: extractValue(note.title),
            createdAt: extractValue(note.createdAt),
            ual: ual || null, // Ensure UAL is always included
            contributionType: contributionType || "regular",
            walletAddress: walletAddress || null,
            priceUsd: priceUsd ? parseFloat(priceUsd) : null,
            isPaywalled: isPaywalled(note),
            categoryMetrics: categoryMetrics,
            notableInstances: notableInstances,
            primarySource: extractValue(note.primarySource),
            secondarySource: extractValue(note.secondarySource),
            analysisResult: analysisResult,
          };
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  found: true,
                  count: notes.length,
                  notes,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  found: false,
                  count: 0,
                  notes: [],
                  error: `Failed to search Community Notes: ${error}`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }
    },
  );

  /**
   * API Route: Get Community Note
   * REST endpoint for fetching Community Notes
   * Payment middleware will be applied dynamically if content is paywalled
   */
  api.get(
    "/dkgpedia/community-notes/:topicId",
    openAPIRoute(
      {
        tag: "DKGPedia",
        summary: "Get Community Note for a topic",
        description: "Retrieve a Community Note for a specific topic",
        params: z.object({
          topicId: z.string().openapi({
            description: "Topic identifier",
            example: "Climate_change",
          }),
        }),
        response: {
          description: "Community Note data with full analysis results",
          schema: z.object({
            topicId: z.string(),
            found: z.boolean(),
            summary: z.string().optional(),
            title: z.string().optional(),
            createdAt: z.string().optional(),
            ual: z.string().nullable(), // UAL is always included
            contributionType: z.string().optional(),
            walletAddress: z.string().nullable().optional(),
            priceUsd: z.number().nullable().optional(),
            isPaywalled: z.boolean().optional(),
            paymentRequired: z.boolean().optional(),
            categoryMetrics: z.any().optional(),
            notableInstances: z.any().optional(),
            primarySource: z.string().optional(),
            secondarySource: z.string().optional(),
            provenance: z.any().optional(),
            analysisResult: z.any().optional(), // Full analysis result structure
            error: z.string().optional(),
          }),
        },
      },
      async (req, res) => {
        const { topicId } = req.params;

        try {
          try {
            validateRemoteOtnode();
          } catch (validationError) {
            const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
            return res.status(400).json({
              topicId,
              found: false,
              error: errorMessage,
            });
          }
          
          // Using dkgpedia namespace exclusively to avoid conflicts
          const query = `
            PREFIX schema: <https://schema.org/>
            PREFIX dkgpedia: <https://dkgpedia.org/schema/>
            
            SELECT * WHERE {
              ?asset a dkgpedia:CommunityNote .
              ?asset dkgpedia:topicId "${topicId}" .
              OPTIONAL { ?asset dkgpedia:summary ?summary . }
              OPTIONAL { ?asset dkgpedia:name ?title . }
              OPTIONAL { ?asset dkgpedia:dateCreated ?createdAt . }
              OPTIONAL { ?asset dkgpedia:identifier ?ual . }
              OPTIONAL { ?asset dkgpedia:contributionType ?contributionType . }
              OPTIONAL { ?asset dkgpedia:walletAddress ?walletAddress . }
              OPTIONAL { ?asset dkgpedia:priceUsd ?priceUsd . }
              OPTIONAL { ?asset dkgpedia:categoryMetrics ?categoryMetrics . }
              OPTIONAL { ?asset dkgpedia:notableInstances ?notableInstances . }
              OPTIONAL { ?asset dkgpedia:primarySource ?primarySource . }
              OPTIONAL { ?asset dkgpedia:secondarySource ?secondarySource . }
              OPTIONAL { ?asset dkgpedia:provenance ?provenance . }
              OPTIONAL { ?asset dkgpedia:analysisResult ?analysisResult . }
              OPTIONAL { ?asset dkgpedia:fetchResults ?fetchResults . }
              OPTIONAL { ?asset dkgpedia:tripleResults ?tripleResults . }
              OPTIONAL { ?asset dkgpedia:semanticDriftResults ?semanticDriftResults . }
              OPTIONAL { ?asset dkgpedia:factCheckResults ?factCheckResults . }
              OPTIONAL { ?asset dkgpedia:sentimentResults ?sentimentResults . }
              OPTIONAL { ?asset dkgpedia:multimodalResults ?multimodalResults . }
              OPTIONAL { ?asset dkgpedia:judgingResults ?judgingResults . }
              OPTIONAL { ?asset dkgpedia:analysisId ?analysisId . }
              OPTIONAL { ?asset dkgpedia:analysisStatus ?analysisStatus . }
              OPTIONAL { ?asset dkgpedia:stepsCompleted ?stepsCompleted . }
              OPTIONAL { ?asset dkgpedia:executionTimeSeconds ?executionTimeSeconds . }
              OPTIONAL { ?asset dkgpedia:analysisTimestamp ?analysisTimestamp . }
              OPTIONAL { ?asset dkgpedia:imageUrls ?imageUrls . }
            }
            ORDER BY DESC(?createdAt)
            LIMIT 1
          `;

          let queryResult;
          try {
            queryResult = await ctx.dkg.graph.query(query, "SELECT");
          } catch (queryError) {
            const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
            return res.status(404).json({
              topicId,
              found: false,
              error: errorMessage.includes("500") 
                ? ""
                : "SPARQL query failed. The data may not be indexed yet.",
            });
          }

          if (!queryResult || !queryResult.data || queryResult.data.length === 0) {
            return res.status(404).json({
              topicId,
              found: false,
              ual: null,
            });
          }

          const note = queryResult.data?.[0];
          const assetUri = note.asset?.value || note.asset;
          const ual = note.ual?.value || note.ual || assetUri;
          const contributionType = extractValue(note.contributionType || note.contribution_type);
          const walletAddress = extractValue(note.walletAddress || note.wallet_address);
          const priceUsd = extractValue(note.priceUsd || note.price_usd);
          const isUserContributed = isPaywalled(note);

          // Parse JSON fields using safe parsing
          // Use preserveJsonEscapes=true to avoid corrupting JSON escape sequences
          const categoryMetricsStr = extractValue(note.categoryMetrics, true);
          const categoryMetrics = safeJsonParse(categoryMetricsStr, null);
          
          const notableInstancesStr = extractValue(note.notableInstances, true);
          const notableInstances = safeJsonParse(notableInstancesStr, null);
          
          const provenanceStr = extractValue(note.provenance, true);
          const provenance = safeJsonParse(provenanceStr, null);

          // Parse full analysis result if available
          const analysisResultStr = extractValue(note.analysisResult, true);
          let analysisResult = safeJsonParse(analysisResultStr, null);

          // Parse image URLs if available
          const imageUrlsStr = extractValue(note.imageUrls, true);
          const imageUrls = safeJsonParse(imageUrlsStr, null);

          // Parse individual result sections if full analysisResult is not available
          let fetchResults = null;
          let tripleResults = null;
          let semanticDriftResults = null;
          let factCheckResults = null;
          let sentimentResults = null;
          let multimodalResults = null;
          let judgingResults = null;
          
          if (!analysisResult) {
            const fetchStr = extractValue(note.fetchResults, true);
            fetchResults = safeJsonParse(fetchStr, null);
            
            const tripleStr = extractValue(note.tripleResults, true);
            tripleResults = safeJsonParse(tripleStr, null);
            
            const semanticDriftStr = extractValue(note.semanticDriftResults, true);
            semanticDriftResults = safeJsonParse(semanticDriftStr, null);
            
            const factCheckStr = extractValue(note.factCheckResults, true);
            factCheckResults = safeJsonParse(factCheckStr, null);
            
            const sentimentStr = extractValue(note.sentimentResults, true);
            sentimentResults = safeJsonParse(sentimentStr, null);
            
            const multimodalStr = extractValue(note.multimodalResults, true);
            multimodalResults = safeJsonParse(multimodalStr, null);
            
            const judgingStr = extractValue(note.judgingResults, true);
            judgingResults = safeJsonParse(judgingStr, null);
          }

          // Build complete response object
          const responseData = {
            topicId: extractValue(note.topicId) || topicId,
            found: true,
            summary: extractValue(note.summary),
            title: extractValue(note.title),
            createdAt: extractValue(note.createdAt),
            ual: ual || null, // Ensure UAL is always included
            contributionType: contributionType || "regular",
            walletAddress: walletAddress || null,
            priceUsd: priceUsd ? parseFloat(priceUsd) : null,
            isPaywalled: isUserContributed,
            categoryMetrics: categoryMetrics,
            notableInstances: notableInstances,
            primarySource: extractValue(note.primarySource),
            secondarySource: extractValue(note.secondarySource),
            provenance: provenance,
            // Full analysis results
            analysisResult: analysisResult || {
              status: extractValue(note.analysisStatus) || "success",
              analysis_id: extractValue(note.analysisId) || "",
              topic: extractValue(note.title) || topicId,
              steps_completed: (() => {
                const stepsStr = extractValue(note.stepsCompleted);
                return safeJsonParse(stepsStr, []);
              })(),
              image_urls: imageUrls || undefined,
              results: {
                fetch: fetchResults || {},
                triple: tripleResults || {},
                semanticdrift: semanticDriftResults || {},
                factcheck: factCheckResults || {},
                sentiment: sentimentResults || {},
                multimodal: multimodalResults || {},
                judging: judgingResults || {},
              },
              execution_time_seconds: parseFloat(extractValue(note.executionTimeSeconds)) || 0,
              timestamp: extractValue(note.analysisTimestamp) || extractValue(note.createdAt) || new Date().toISOString(),
            },
          };

          // Check if payment is required
          if (isUserContributed && walletAddress && priceUsd) {
            // Use hardcoded x402 facilitator URL
            const facilitatorUrl = "https://x402.org/facilitator" as Resource;

            // Apply x402 payment middleware
            // The middleware will verify payment and return 402 if payment is not verified
            // If payment is verified, it will call next() to continue
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
          
          // Not paywalled, return full data
          res.json(responseData);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          res.status(500).json({
            topicId,
            found: false,
            error: `Failed to query Community Note: ${error}`,
          });
        }
      },
    ),
  );

  /**
   * API Route: Search Community Notes
   * REST endpoint for searching Community Notes
   */
  api.get(
    "/dkgpedia/community-notes",
    openAPIRoute(
      {
        tag: "DKGPedia",
        summary: "Search Community Notes",
        description: "Search for Community Notes by keyword",
        query: z.object({
          keyword: z.string().optional(),
          limit: z
            .number({ coerce: true })
            .optional()
            .default(10)
            .openapi({ description: "Maximum results" }),
        }),
        response: {
          description: "List of Community Notes",
          schema: z.object({
            found: z.boolean(),
            count: z.number(),
            notes: z.array(
              z.object({
                topicId: z.string(),
                summary: z.string(),
                title: z.string(),
                createdAt: z.string(),
                ual: z.string().nullable(),
              }),
            ),
          }),
        },
      },
      async (req, res) => {
        const { keyword, limit = 10 } = req.query;

        try {
          try {
            validateRemoteOtnode();
          } catch (validationError) {
            const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
            return res.status(400).json({
              found: false,
              count: 0,
              notes: [],
              error: errorMessage,
            });
          }
          
          // Using dkgpedia namespace exclusively to avoid conflicts
          let query = `
            PREFIX schema: <https://schema.org/>
            PREFIX dkgpedia: <https://dkgpedia.org/schema/>
            
            SELECT * WHERE {
              ?asset a dkgpedia:CommunityNote .
              ?asset dkgpedia:topicId ?topicId .
              OPTIONAL { ?asset dkgpedia:summary ?summary . }
              OPTIONAL { ?asset dkgpedia:name ?title . }
              OPTIONAL { ?asset dkgpedia:dateCreated ?createdAt . }
              OPTIONAL { ?asset dkgpedia:identifier ?ual . }
              OPTIONAL { ?asset dkgpedia:contributionType ?contributionType . }
              OPTIONAL { ?asset dkgpedia:walletAddress ?walletAddress . }
              OPTIONAL { ?asset dkgpedia:priceUsd ?priceUsd . }
              OPTIONAL { ?asset dkgpedia:categoryMetrics ?categoryMetrics . }
              OPTIONAL { ?asset dkgpedia:notableInstances ?notableInstances . }
              OPTIONAL { ?asset dkgpedia:primarySource ?primarySource . }
              OPTIONAL { ?asset dkgpedia:secondarySource ?secondarySource . }
              OPTIONAL { ?asset dkgpedia:analysisResult ?analysisResult . }
          `;

          if (keyword) {
            query += `
              FILTER (
                CONTAINS(LCASE(?topicId), LCASE("${keyword}")) ||
                CONTAINS(LCASE(?title), LCASE("${keyword}"))
              )
            `;
          }


          query += `
            }
            ORDER BY DESC(?createdAt)
            LIMIT ${limit}
          `;

          let queryResult;
          try {
            queryResult = await ctx.dkg.graph.query(query, "SELECT");
          } catch (queryError) {
            return res.json({
              found: false,
              count: 0,
              notes: [],
              error: "SPARQL query failed. The data may not be indexed yet.",
            });
          }

          if (!queryResult || !queryResult.data || queryResult.data.length === 0) {
            return res.json({
              found: false,
              count: 0,
              notes: [],
            });
          }

          const notes = queryResult.data.map((note: any) => {
            const assetUri = note.asset?.value || note.asset;
            const ual = note.ual?.value || note.ual || assetUri;
            const contributionType = extractValue(note.contributionType || note.contribution_type);
            const walletAddress = extractValue(note.walletAddress || note.wallet_address);
            const priceUsd = extractValue(note.priceUsd || note.price_usd);
            
          // Parse JSON fields using safe parsing
          // Use preserveJsonEscapes=true to avoid corrupting JSON escape sequences
          const categoryMetricsStr = extractValue(note.categoryMetrics, true);
          const categoryMetrics = safeJsonParse(categoryMetricsStr, null);
          
          const notableInstancesStr = extractValue(note.notableInstances, true);
          const notableInstances = safeJsonParse(notableInstancesStr, null);
          
          // Parse analysis result if available
          const analysisResultStr = extractValue(note.analysisResult, true);
          const analysisResult = safeJsonParse(analysisResultStr, null);
            
            return {
              topicId: extractValue(note.topicId),
              summary: extractValue(note.summary),
              title: extractValue(note.title),
              createdAt: extractValue(note.createdAt),
              ual: ual || null, // Ensure UAL is always included
              contributionType: contributionType || "regular",
              walletAddress: walletAddress || null,
              priceUsd: priceUsd ? parseFloat(priceUsd) : null,
              isPaywalled: isPaywalled(note),
              categoryMetrics: categoryMetrics,
              notableInstances: notableInstances,
              primarySource: extractValue(note.primarySource),
              secondarySource: extractValue(note.secondarySource),
              analysisResult: analysisResult,
            };
          });

          res.json({
            found: true,
            count: notes.length,
            notes,
          });
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          res.status(500).json({
            found: false,
            count: 0,
            notes: [],
            error: `Failed to search Community Notes: ${error}`,
          });
        }
      },
    ),
  );

  /**
   * API Route: Publish Community Note
   * REST endpoint for publishing Community Notes to DKG
   */
  api.post(
    "/dkgpedia/community-notes",
    openAPIRoute(
      {
        tag: "DKGPedia",
        summary: "Publish a Community Note to DKG",
        description: "Publish a Community Note as a Knowledge Asset with full analysis results",
        body: z.object({
          topicId: z.string().openapi({ description: "Topic identifier" }),
          title: z.string().optional().openapi({ description: "Title of the note" }),
          contributionType: z
            .enum(["regular", "User contributed"])
            .optional()
            .default("regular")
            .openapi({ description: "Type of contribution" }),
          walletAddress: z
            .string()
            .optional()
            .openapi({ description: "Wallet address for user-contributed content (required if contributionType is 'User contributed')" }),
          priceUsd: z
            .number()
            .min(0)
            .optional()
            .openapi({ description: "Price in USD for user-contributed content (required if contributionType is 'User contributed')" }),
          // Full analysis result structure
          analysisResult: z
            .object({
              status: z.string(),
              analysis_id: z.string(),
              topic: z.string(),
              steps_completed: z.array(z.string()),
              image_urls: z.object({
                "similarity_heatmap.png": z.string().optional(),
                "embedding_space.png": z.string().optional(),
                "bias_compass.png": z.string().optional(),
              }).optional(),
              results: z.object({
                fetch: z.any(),
                triple: z.any(),
                semanticdrift: z.any(),
                factcheck: z.any(),
                sentiment: z.any(),
                multimodal: z.any(),
                judging: z.any(),
              }),
              errors: z.array(z.string()).optional(),
              timestamp: z.string().optional(),
              execution_time_seconds: z.number(),
            })
            .openapi({ description: "Complete analysis result from the analysis endpoint" }),
        }),
        response: {
          description: "Published Community Note with UAL",
          schema: z.object({
            success: z.boolean(),
            ual: z.string().nullable(),
            error: z.string().nullable(),
            verification_url: z.string().optional(),
          }),
        },
      },
      async (req, res) => {
        const {
          topicId,
          title,
          contributionType = "regular",
          walletAddress,
          priceUsd,
          analysisResult,
        } = req.body;

        // Validate user-contributed content requirements
        if (contributionType === "User contributed") {
          if (!walletAddress) {
            return res.status(400).json({
              success: false,
              ual: null,
              error: "walletAddress is required when contributionType is 'User contributed'",
            });
          }
          if (priceUsd === undefined || priceUsd <= 0) {
            return res.status(400).json({
              success: false,
              ual: null,
              error: "priceUsd must be greater than 0 when contributionType is 'User contributed'",
            });
          }
        }

        // Validate analysis result
        if (!analysisResult || !analysisResult.results) {
          return res.status(400).json({
            success: false,
            ual: null,
            error: "analysisResult is required and must contain results",
          });
        }

        try {
          // Extract key metrics from analysis result for quick access
          const summary = analysisResult.results.judging?.report_preview || 
                         analysisResult.results.judging?.full_report?.substring(0, 500) || 
                         "Analysis completed";
          
          // Extract categoryMetrics and notableInstances from triple analysis if available
          const categoryMetrics = analysisResult.results.triple?.entity_coherence || {};
          const notableInstances = analysisResult.results.triple?.contradictions?.contradictions || [];
          
          // Extract sources from fetch results
          const primarySource = analysisResult.results.fetch?.grokipedia?.files?.grokipedia || 
                               analysisResult.results.fetch?.files?.grokipedia || "";
          const secondarySource = analysisResult.results.fetch?.wikipedia?.files?.wikipedia || 
                                 analysisResult.results.fetch?.files?.wikipedia || "";

          // Create JSON-LD structure using dkgpedia namespace exclusively
          // Store the complete analysis result as JSON strings for complex nested structures
          const jsonld: any = {
            "@context": {
              dkgpedia: "https://dkgpedia.org/schema/",
            },
            "@type": "dkgpedia:CommunityNote",
            "dkgpedia:topicId": topicId,
            "dkgpedia:name": title || analysisResult.topic || topicId,
            "dkgpedia:dateCreated": new Date().toISOString(),
            "dkgpedia:contributionType": contributionType,
            
            // Core metrics (for quick SPARQL queries)
            "dkgpedia:summary": summary,
            "dkgpedia:categoryMetrics": JSON.stringify(categoryMetrics),
            "dkgpedia:notableInstances": JSON.stringify(notableInstances),
            "dkgpedia:primarySource": primarySource,
            "dkgpedia:secondarySource": secondarySource,
            
            // Store complete analysis results as JSON strings
            "dkgpedia:analysisResult": JSON.stringify(analysisResult),
            "dkgpedia:fetchResults": JSON.stringify(analysisResult.results.fetch),
            "dkgpedia:tripleResults": JSON.stringify(analysisResult.results.triple),
            "dkgpedia:semanticDriftResults": JSON.stringify(analysisResult.results.semanticdrift),
            "dkgpedia:factCheckResults": JSON.stringify(analysisResult.results.factcheck),
            "dkgpedia:sentimentResults": JSON.stringify(analysisResult.results.sentiment),
            "dkgpedia:multimodalResults": JSON.stringify(analysisResult.results.multimodal),
            "dkgpedia:judgingResults": JSON.stringify(analysisResult.results.judging),
            
            // Analysis metadata
            "dkgpedia:analysisId": analysisResult.analysis_id,
            "dkgpedia:analysisStatus": analysisResult.status,
            "dkgpedia:stepsCompleted": JSON.stringify(analysisResult.steps_completed),
            "dkgpedia:executionTimeSeconds": analysisResult.execution_time_seconds,
            "dkgpedia:analysisTimestamp": analysisResult.timestamp || new Date().toISOString(),
            
            // Image URLs for visualizations
            "dkgpedia:imageUrls": analysisResult.image_urls ? JSON.stringify(analysisResult.image_urls) : "{}",
          };

          // Add wallet address and price for user-contributed content
          if (contributionType === "User contributed") {
            jsonld["dkgpedia:walletAddress"] = walletAddress;
            jsonld["dkgpedia:priceUsd"] = priceUsd;
          }

          if (!ctx.dkg || !ctx.dkg.asset || typeof ctx.dkg.asset.create !== "function") {
            return res.status(500).json({
              success: false,
              ual: null,
              error: "DKG asset client not available. Check DKG configuration.",
            });
          }

          // Publish to DKG
          const wrapped = { public: jsonld };
          console.log("Publishing Community Note to DKG...");
          
          const createAsset = await ctx.dkg.asset.create(wrapped, {
            epochsNum: 2,
            minimumNumberOfFinalizationConfirmations: 3,
            minimumNumberOfNodeReplications: 1,
          });

          // Extract UAL from response
          const ual = createAsset?.UAL || 
                      createAsset?.ual || 
                      createAsset?.asset_id || 
                      createAsset?.dataSetId || 
                      null;

          if (!ual) {
            return res.status(500).json({
              success: false,
              ual: null,
              error: "Failed to create Knowledge Asset - no UAL returned.",
            });
          }

          console.log(`✅ Published Community Note with UAL: ${ual}`);
          
          res.json({
            success: true,
            ual: ual,
            error: null,
            verification_url: `/api/dkg/assets?ual=${ual}`,
          });
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          console.error("Error publishing Community Note:", error);
          res.status(500).json({
            success: false,
            ual: null,
            error: `Failed to publish Community Note: ${error}`,
          });
        }
      },
    ),
  );
});

