#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import {
  createClientSchema,
  updateLeadStatusSchema,
  logSEOAuditSchema,
  updateProjectMilestoneSchema,
  logEmailSchema,
  createInvoiceSchema,
  getSEOAnalyticsSchema,
  logAgentMessageSchema,
  getAgentHealthSchema,
  getPendingTasksSchema,
  triggerLeadGenerationSchema,
  triggerProposalSendSchema,
  triggerDealClosureSchema,
  triggerProjectKickoffSchema,
  triggerSEOAuditSchema,
} from "./tools/schemas.js";

const prisma = new PrismaClient();
const AGENT_API_KEYS = JSON.parse(process.env.AGENT_API_KEYS || "{}");
const JWT_SECRET = process.env.JWT_SECRET!;
const PORT = process.env.PORT || 3002;

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

// Helper: Log to audit trail
async function logAudit(agent: string, tool: string, inputs: any, success: boolean, error?: string) {
  try {
    await prisma.agentAuditLog.create({
      data: {
        agent: agent.toUpperCase() as any,
        tool,
        inputs: sanitizeInputs(inputs),
        success,
        error,
      },
    });
  } catch (e) {
    console.error("Failed to log audit:", e);
  }
}

// Sanitize inputs (remove API keys, passwords)
function sanitizeInputs(inputs: any): any {
  const sanitized = { ...inputs };
  if (sanitized.apiKey) sanitized.apiKey = "***";
  if (sanitized.password) sanitized.password = "***";
  if (sanitized.token) sanitized.token = "***";
  return sanitized;
}

// Helper: Get agent from API key
function getAgentFromKey(apiKey: string): string | null {
  const entry = Object.entries(AGENT_API_KEYS).find(([_, key]) => key === apiKey);
  return entry ? entry[0] : null;
}

// Tool implementations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const apiKey = (request as any).headers?.['x-agent-key'] as string;
  const agent = getAgentFromKey(apiKey);

  if (!agent) {
    await logAudit('unknown', name, args, false, 'Invalid API key');
    return { isError: true, content: [{ type: "text", text: "Unauthorized" }] };
  }

  try {
    let result;

    switch (name) {
      case "create_client": {
        const data = createClientSchema.parse(args);
        const client = await prisma.client.create({ data });
        await logAudit(agent, name, args, true);
        return { content: [{ type: "text", text: JSON.stringify(client) }] };
      }

      case "update_lead_status": {
        const data = updateLeadStatusSchema.parse(args);
        const client = await prisma.client.update({
          where: { id: data.clientId },
          data: { status: data.status as any },
        });
        await logAudit(agent, name, args, true);
        return { content: [{ type: "text", text: JSON.stringify(client) }] };
      }

      case "log_seo_audit": {
        const data = logSEOAuditSchema.parse(args);
        const { clientId, ...auditData } = data;
        const audit = await prisma.sEOAudit.create({
          data: { clientId, ...auditData },
        });
        await logAudit(agent, name, args, true);
        broadcastToWS({ type: 'seo_audit_logged', audit });
        return { content: [{ type: "text", text: JSON.stringify(audit) }] };
      }

      case "update_project_milestone": {
        const data = updateProjectMilestoneSchema.parse(args);
        const { projectId, milestone } = data;
        const project = await prisma.project.update({
          where: { id: projectId },
          data: { milestones: [milestone] },
        });
        await logAudit(agent, name, args, true);
        return { content: [{ type: "text", text: JSON.stringify(project) }] };
      }

      case "log_email": {
        const data = logEmailSchema.parse(args);
        await logAudit(agent, name, args, true);
        broadcastToWS({ type: 'email_logged', data });
        return { content: [{ type: "text", text: "Email logged" }] };
      }

      case "create_invoice": {
        const data = createInvoiceSchema.parse(args);
        const invoice = await prisma.invoice.create({ data });
        await logAudit(agent, name, args, true);
        return { content: [{ type: "text", text: JSON.stringify(invoice) }] };
      }

      case "get_seo_analytics": {
        const data = getSEOAnalyticsSchema.parse(args);
        const where: any = {};
        if (data.clientId) where.clientId = data.clientId;
        if (data.startDate) where.createdAt = { gte: new Date(data.startDate) };
        if (data.endDate) where.createdAt = { ...where.createdAt, lte: new Date(data.endDate) };
        const audits = await prisma.sEOAudit.findMany({ where });
        await logAudit(agent, name, args, true);
        return { content: [{ type: "text", text: JSON.stringify(audits) }] };
      }

      case "log_agent_message": {
        const data = logAgentMessageSchema.parse(args);
        const message = await prisma.agentMessage.create({
          data: {
            fromAgent: data.fromAgent.toUpperCase() as any,
            toAgent: data.toAgent?.toUpperCase() as any,
            taskId: data.taskId,
            type: data.type as any,
            payload: data.payload,
          },
        });
        await logAudit(agent, name, args, true);
        broadcastToWS({ type: 'message_logged', message });
        return { content: [{ type: "text", text: JSON.stringify(message) }] };
      }

      case "get_agent_health": {
        const data = getAgentHealthSchema.parse(args);
        const where: any = {};
        if (data.agent) where.agent = data.agent.toUpperCase() as any;
        const sessions = await prisma.agentSession.findMany({ where });
        await logAudit(agent, name, args, true);
        return { content: [{ type: "text", text: JSON.stringify(sessions) }] };
      }

      case "get_pending_tasks": {
        const data = getPendingTasksSchema.parse(args);
        const where: any = { status: "PENDING" };
        if (data.agent) where.assignedTo = data.agent.toUpperCase() as any;
        const tasks = await prisma.task.findMany({ where, include: { project: true } });
        await logAudit(agent, name, args, true);
        return { content: [{ type: "text", text: JSON.stringify(tasks) }] };
      }

      // Trigger tools (simplified responses)
      case "trigger_lead_generation":
      case "trigger_proposal_send":
      case "trigger_deal_closure":
      case "trigger_project_kickoff":
      case "trigger_seo_audit": {
        await logAudit(agent, name, args, true);
        return { content: [{ type: "text", text: `Trigger ${name} executed` }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    await logAudit(agent, name, args, false, error.message);
    return { isError: true, content: [{ type: "text", text: error.message }] };
  }
});

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_client",
        description: "Create a new client or lead for Abelo Creative",
        inputSchema: createClientSchema,
      },
      {
        name: "update_lead_status",
        description: "Update lead status",
        inputSchema: updateLeadStatusSchema,
      },
      {
        name: "log_seo_audit",
        description: "Log SEO audit results for Abelo Creative clients",
        inputSchema: logSEOAuditSchema,
      },
      {
        name: "update_project_milestone",
        description: "Update project milestone",
        inputSchema: updateProjectMilestoneSchema,
      },
      {
        name: "log_email",
        description: "Log email sent to client",
        inputSchema: logEmailSchema,
      },
      {
        name: "create_invoice",
        description: "Create invoice for client",
        inputSchema: createInvoiceSchema,
      },
      {
        name: "get_seo_analytics",
        description: "Get SEO analytics data",
        inputSchema: getSEOAnalyticsSchema,
      },
      {
        name: "log_agent_message",
        description: "Log inter-agent communication",
        inputSchema: logAgentMessageSchema,
      },
      {
        name: "get_agent_health",
        description: "Get agent health status",
        inputSchema: getAgentHealthSchema,
      },
      {
        name: "get_pending_tasks",
        description: "Get pending tasks for agents",
        inputSchema: getPendingTasksSchema,
      },
      {
        name: "trigger_lead_generation",
        description: "Trigger autonomous lead generation",
        inputSchema: triggerLeadGenerationSchema,
      },
      {
        name: "trigger_proposal_send",
        description: "Trigger proposal send to qualified lead",
        inputSchema: triggerProposalSendSchema,
      },
      {
        name: "trigger_deal_closure",
        description: "Trigger deal closure after payment",
        inputSchema: triggerDealClosureSchema,
      },
      {
        name: "trigger_project_kickoff",
        description: "Trigger project kickoff after deal closure",
        inputSchema: triggerProjectKickoffSchema,
      },
      {
        name: "trigger_seo_audit",
        description: "Trigger SEO audit for client(s)",
        inputSchema: triggerSEOAuditSchema,
      },
    ],
  };
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ noServer: true });
const wsClients = new Set<WebSocket>();

function broadcastToWS(data: any) {
  const message = JSON.stringify(data);
  wsClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
});

// Start server
const transportType = process.env.TRANSPORT || "stdio";

if (transportType === "stdio") {
  const transport = new StdioServerTransport();
  server.connect(transport);
  console.log("Abelo Creative MCP Server running on stdio");
} else {
  const app = express();
  app.use(express.json());

  // REST endpoints for cron/webhook triggers
  app.post("/trigger/:tool", async (req: Request, res: Response) => {
    const { tool } = req.params;
    const apiKey = req.headers['x-agent-key'] as string;
    const agent = getAgentFromKey(apiKey);

    if (!agent) return res.status(401).json({ error: "Unauthorized" });

    try {
      // Manually call the tool handler
      const result = await server.setRequestHandler(CallToolRequestSchema, async () => {
        // This is a simplified approach - in production, use proper MCP client
        return { content: [{ type: "text", text: `Tool ${tool} triggered` }] };
      });
      res.json({ success: true, tool });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = app.listen(PORT, () => {
    console.log(`Abelo Creative MCP Server running on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}`);
  });

  // WebSocket endpoint
  httpServer.on('upgrade', (req: any, socket: any, head: any) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });
}
