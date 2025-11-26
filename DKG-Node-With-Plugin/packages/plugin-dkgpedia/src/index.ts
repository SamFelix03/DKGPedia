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
 */
function extractValue(value: any): string {
  if (!value) return "";
  if (typeof value === 'string') {
    // Remove quotes and type annotations (e.g., "value"^^type -> value)
    let clean = value.replace(/^"|"$/g, '').replace(/\\"/g, '"');
    // Remove type annotation if present
    const typeMatch = clean.match(/^(.+?)\^\^.+$/);
    if (typeMatch && typeMatch[1]) {
      clean = typeMatch[1].replace(/^"|"$/g, '');
    }
    return clean;
  }
  if (value.value) {
    return extractValue(value.value);
  }
  return String(value);
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
 * - Getting trust scores and analysis for topics
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
        "Returns trust score, summary, and key information found.",
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
            ?asset dkgpedia:trustScore ?trustScore .
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
        
        try {
          const categoryMetricsStr = extractValue(note.categoryMetrics);
          if (categoryMetricsStr) {
            categoryMetrics = JSON.parse(categoryMetricsStr);
          }
        } catch (e) {
          console.warn("Failed to parse categoryMetrics:", e);
        }
        
        try {
          const notableInstancesStr = extractValue(note.notableInstances);
          if (notableInstancesStr) {
            notableInstances = JSON.parse(notableInstancesStr);
          }
        } catch (e) {
          console.warn("Failed to parse notableInstances:", e);
        }
        
        try {
          const provenanceStr = extractValue(note.provenance);
          if (provenanceStr) {
            provenance = JSON.parse(provenanceStr);
          }
        } catch (e) {
          console.warn("Failed to parse provenance:", e);
        }

        const response = {
          topicId: extractValue(note.topicId) || topicId,
          found: true,
          trustScore: parseFloat(extractValue(note.trustScore)) || 0,
          summary: extractValue(note.summary),
          title: extractValue(note.title),
          createdAt: extractValue(note.createdAt),
          ual: ual || null,
          contributionType: contributionType || "regular",
          walletAddress: walletAddress || null,
          priceUsd: priceUsd ? parseFloat(priceUsd) : null,
          isPaywalled: isUserContributed,
          categoryMetrics: categoryMetrics || (assetDetails?.public?.assertion?.categoryMetrics),
          notableInstances: notableInstances || (assetDetails?.public?.assertion?.notableInstances),
          primarySource: extractValue(note.primarySource) || assetDetails?.public?.assertion?.primarySource,
          secondarySource: extractValue(note.secondarySource) || assetDetails?.public?.assertion?.secondarySource,
          provenance: provenance || assetDetails?.public?.assertion?.provenance,
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
   * Allows AI agents to search for Community Notes by keywords or trust score range
   */
  mcp.registerTool(
    "dkgpedia-search-community-notes",
    {
      title: "Search Community Notes",
      description:
        "Search for Community Notes by topic keywords or filter by trust score range. " +
        "Returns a list of matching Community Notes.",
      inputSchema: {
        keyword: z
          .string()
          .optional()
          .describe("Search keyword to match against topic IDs or titles"),
        minTrustScore: z
          .number()
          .optional()
          .describe("Minimum trust score (0-100)"),
        maxTrustScore: z
          .number()
          .optional()
          .describe("Maximum trust score (0-100)"),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Maximum number of results to return"),
      },
    },
    async ({ keyword, minTrustScore, maxTrustScore, limit = 10 }) => {
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
            ?asset dkgpedia:trustScore ?trustScore .
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
        `;

        if (keyword) {
          query += `
            FILTER (
              CONTAINS(LCASE(?topicId), LCASE("${keyword}")) ||
              CONTAINS(LCASE(?title), LCASE("${keyword}"))
            )
          `;
        }

        if (minTrustScore !== undefined) {
          query += `FILTER (?trustScore >= ${minTrustScore})`;
        }

        if (maxTrustScore !== undefined) {
          query += `FILTER (?trustScore <= ${maxTrustScore})`;
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
          
          // Parse JSON fields if they exist
          let categoryMetrics = null;
          let notableInstances = null;
          
          try {
            const categoryMetricsStr = extractValue(note.categoryMetrics);
            if (categoryMetricsStr) {
              categoryMetrics = JSON.parse(categoryMetricsStr);
            }
          } catch (e) {
            // Ignore parse errors
          }
          
          try {
            const notableInstancesStr = extractValue(note.notableInstances);
            if (notableInstancesStr) {
              notableInstances = JSON.parse(notableInstancesStr);
            }
          } catch (e) {
            // Ignore parse errors
          }
          
          return {
            topicId: extractValue(note.topicId),
            trustScore: parseFloat(extractValue(note.trustScore)) || 0,
            summary: extractValue(note.summary),
            title: extractValue(note.title),
            createdAt: extractValue(note.createdAt),
            ual: ual || null,
            contributionType: contributionType || "regular",
            walletAddress: walletAddress || null,
            priceUsd: priceUsd ? parseFloat(priceUsd) : null,
            isPaywalled: isPaywalled(note),
            categoryMetrics: categoryMetrics,
            notableInstances: notableInstances,
            primarySource: extractValue(note.primarySource),
            secondarySource: extractValue(note.secondarySource),
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
          description: "Community Note data",
          schema: z.object({
            topicId: z.string(),
            found: z.boolean(),
            trustScore: z.number().optional(),
            summary: z.string().optional(),
            title: z.string().optional(),
            createdAt: z.string().optional(),
            ual: z.string().nullable().optional(),
            contributionType: z.string().optional(),
            walletAddress: z.string().nullable().optional(),
            priceUsd: z.number().nullable().optional(),
            isPaywalled: z.boolean().optional(),
            paymentRequired: z.boolean().optional(),
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
              ?asset dkgpedia:trustScore ?trustScore .
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
            });
          }

          const note = queryResult.data?.[0];
          const assetUri = note.asset?.value || note.asset;
          const ual = note.ual?.value || note.ual || assetUri;
          const contributionType = extractValue(note.contributionType || note.contribution_type);
          const walletAddress = extractValue(note.walletAddress || note.wallet_address);
          const priceUsd = extractValue(note.priceUsd || note.price_usd);
          const isUserContributed = isPaywalled(note);

          // Parse JSON fields
          let categoryMetrics = null;
          let notableInstances = null;
          let provenance = null;
          
          try {
            const categoryMetricsStr = extractValue(note.categoryMetrics);
            if (categoryMetricsStr) {
              categoryMetrics = JSON.parse(categoryMetricsStr);
            }
          } catch (e) {
            console.warn("Failed to parse categoryMetrics:", e);
          }
          
          try {
            const notableInstancesStr = extractValue(note.notableInstances);
            if (notableInstancesStr) {
              notableInstances = JSON.parse(notableInstancesStr);
            }
          } catch (e) {
            console.warn("Failed to parse notableInstances:", e);
          }
          
          try {
            const provenanceStr = extractValue(note.provenance);
            if (provenanceStr) {
              provenance = JSON.parse(provenanceStr);
            }
          } catch (e) {
            console.warn("Failed to parse provenance:", e);
          }

          // Build complete response object
          const responseData = {
            topicId: extractValue(note.topicId) || topicId,
            found: true,
            trustScore: parseFloat(extractValue(note.trustScore)) || 0,
            summary: extractValue(note.summary),
            title: extractValue(note.title),
            createdAt: extractValue(note.createdAt),
            ual: ual || null,
            contributionType: contributionType || "regular",
            walletAddress: walletAddress || null,
            priceUsd: priceUsd ? parseFloat(priceUsd) : null,
            isPaywalled: isUserContributed,
            categoryMetrics: categoryMetrics,
            notableInstances: notableInstances,
            primarySource: extractValue(note.primarySource),
            secondarySource: extractValue(note.secondarySource),
            provenance: provenance,
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
        description: "Search for Community Notes by keyword or trust score",
        query: z.object({
          keyword: z.string().optional(),
          minTrustScore: z
            .number({ coerce: true })
            .optional()
            .openapi({ description: "Minimum trust score (0-100)" }),
          maxTrustScore: z
            .number({ coerce: true })
            .optional()
            .openapi({ description: "Maximum trust score (0-100)" }),
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
                trustScore: z.number(),
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
        const { keyword, minTrustScore, maxTrustScore, limit = 10 } = req.query;

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
              ?asset dkgpedia:trustScore ?trustScore .
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
          `;

          if (keyword) {
            query += `
              FILTER (
                CONTAINS(LCASE(?topicId), LCASE("${keyword}")) ||
                CONTAINS(LCASE(?title), LCASE("${keyword}"))
              )
            `;
          }

          if (minTrustScore !== undefined) {
            query += `FILTER (?trustScore >= ${minTrustScore})`;
          }

          if (maxTrustScore !== undefined) {
            query += `FILTER (?trustScore <= ${maxTrustScore})`;
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
            
            // Parse JSON fields
            let categoryMetrics = null;
            let notableInstances = null;
            
            try {
              const categoryMetricsStr = extractValue(note.categoryMetrics);
              if (categoryMetricsStr) {
                categoryMetrics = JSON.parse(categoryMetricsStr);
              }
            } catch (e) {
              // Ignore parse errors
            }
            
            try {
              const notableInstancesStr = extractValue(note.notableInstances);
              if (notableInstancesStr) {
                notableInstances = JSON.parse(notableInstancesStr);
              }
            } catch (e) {
              // Ignore parse errors
            }
            
            return {
              topicId: extractValue(note.topicId),
              trustScore: parseFloat(extractValue(note.trustScore)) || 0,
              summary: extractValue(note.summary),
              title: extractValue(note.title),
              createdAt: extractValue(note.createdAt),
              ual: ual || null,
              contributionType: contributionType || "regular",
              walletAddress: walletAddress || null,
              priceUsd: priceUsd ? parseFloat(priceUsd) : null,
              isPaywalled: isPaywalled(note),
              categoryMetrics: categoryMetrics,
              notableInstances: notableInstances,
              primarySource: extractValue(note.primarySource),
              secondarySource: extractValue(note.secondarySource),
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
        description: "Publish a Community Note as a Knowledge Asset",
        body: z.object({
          topicId: z.string().openapi({ description: "Topic identifier" }),
          trustScore: z
            .number()
            .min(0)
            .max(100)
            .openapi({ description: "Trust score (0-100)" }),
          summary: z.string().openapi({ description: "Summary of findings" }),
          categoryMetrics: z
            .record(z.string(), z.number())
            .openapi({ description: "Count of each category type" }),
          notableInstances: z
            .array(
              z.object({
                content: z.string(),
                category: z.string(),
              }),
            )
            .optional()
            .openapi({ description: "Notable instances or examples" }),
          primarySource: z.string().openapi({ description: "Primary source title" }),
          secondarySource: z.string().openapi({ description: "Secondary source title" }),
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
          provenance: z
            .object({
              inputHash: z.string().optional(),
              createdBy: z.string().optional(),
              version: z.string().optional(),
              references: z
                .object({
                  primaryUrl: z.string().optional(),
                  secondaryUrl: z.string().optional(),
                  primaryUal: z.string().optional(),
                  secondaryUal: z.string().optional(),
                })
                .optional(),
            })
            .optional()
            .openapi({ description: "Provenance metadata" }),
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
          trustScore,
          summary,
          categoryMetrics,
          notableInstances = [],
          primarySource,
          secondarySource,
          title,
          contributionType = "regular",
          walletAddress,
          priceUsd,
          provenance = {},
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

        try {
          // Create JSON-LD structure using dkgpedia namespace exclusively
          const jsonld: any = {
            "@context": {
              dkgpedia: "https://dkgpedia.org/schema/",
            },
            "@type": "dkgpedia:CommunityNote",
            "dkgpedia:topicId": topicId,
            "dkgpedia:trustScore": trustScore,
            "dkgpedia:summary": summary,
            "dkgpedia:categoryMetrics": JSON.stringify(categoryMetrics),
            "dkgpedia:notableInstances": JSON.stringify(notableInstances),
            "dkgpedia:primarySource": primarySource,
            "dkgpedia:secondarySource": secondarySource,
            "dkgpedia:name": title || topicId,
            "dkgpedia:dateCreated": new Date().toISOString(),
            "dkgpedia:contributionType": contributionType,
            "dkgpedia:provenance": JSON.stringify({
              createdBy: "DKGPedia",
              ...provenance,
            }),
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

