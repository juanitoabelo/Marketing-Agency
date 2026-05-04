#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const AGENT_API_KEYS = JSON.parse(process.env.AGENT_API_KEYS || "{}");
const JWT_SECRET = process.env.JWT_SECRET!;

// MCP Server
const server = new Server(
  {
    name: "abelo-creative-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Agent auth middleware
function authAgent(agentType: string, apiKey: string): boolean {
  const expectedKey = AGENT_API_KEYS[agentType.toLowerCase()];
  return expectedKey === apiKey;
}

// Tool: create_client
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_client": {
        const schema = z.object({
          name: z.string().min(2).max(100),
          email: z.string().email(),
          company: z.string().optional(),
          leadScore: z.number().min(0).max(100).default(0),
        });
        const data = schema.parse(args);
        const client = await prisma.client.create({ data });
        return { content: [{ type: "text", text: JSON.stringify(client) }] };
      }

      case "log_seo_audit": {
        const schema = z.object({
          clientId: z.string(),
          pageSpeed: z.object({ desktop: z.number(), mobile: z.number() }).optional(),
          coreVitals: z.object({ LCP: z.number().optional(), FID: z.number().optional(), CLS: z.number().optional() }).optional(),
          metadata: z.object({ title: z.string().optional(), description: z.string().optional(), keywords: z.array(z.string()).optional() }).optional(),
          issues: z.array(z.object({ type: z.string(), severity: z.enum(["LOW", "MEDIUM", "HIGH"]), message: z.string(), fix: z.string().optional() })).optional(),
        });
        const data = schema.parse(args);
        const audit = await prisma.sEOAudit.create({ data: { ...data, clientId: data.clientId } });
        return { content: [{ type: "text", text: JSON.stringify(audit) }] };
      }

      // Add other tools (update_lead_status, log_email, create_invoice, etc.)

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { isError: true, content: [{ type: "text", text: error.message }] };
  }
});

// List tools
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "create_client",
        description: "Create a new client or lead",
        inputSchema: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, company: { type: "string" } } },
      },
      {
        name: "log_seo_audit",
        description: "Log SEO audit results",
        inputSchema: { type: "object", properties: { clientId: { type: "string" }, pageSpeed: { type: "object" } } },
      },
      // Add other tool definitions
    ],
  };
});

// Start server
const transportType = process.env.TRANSPORT || "stdio";
if (transportType === "stdio") {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP Server running on stdio");
} else {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = process.env.PORT || 3002;
  app.listen(port, () => console.log(`MCP Server running on http://localhost:${port}/mcp`));
}
