# Architecture.md

Technical architecture for the Agency Management Application. Defined by CTO Agent.

## Tech Stack (Finalized)

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand (lightweight, TypeScript-first)
- **Real-Time**: WebSocket client (native WebSocket API with reconnection logic)
- **Charts**: Recharts (SEO Analytics Dashboard)
- **Forms**: React Hook Form + Zod validation

### Backend
- **Framework**: NestJS 11 (modular, TypeScript, built-in validation)
- **Database**: PostgreSQL 16 (via Supabase or Neon)
- **ORM**: Prisma 6 (type-safe, migations, Zod schema generation)
- **Auth**: NextAuth.js 5 (JWT sessions, OAuth support)
- **WebSockets**: @nestjs/websockets + socket.io (for real-time dashboard)
- **Validation**: class-validator + Zod (for MCP tools)

### MCP Server
- **Runtime**: Node.js 24+ with TypeScript
- **SDK**: @modelcontextprotocol/sdk (official MCP TypeScript SDK)
- **Transport**: Streamable HTTP (production), stdio (local dev)
- **Validation**: Zod schemas for all tool inputs
- **State**: In-memory task queue + PostgreSQL for persistence

### Orchestration
- **dmux**: tmux pane manager for parallel agent workflows
- **Session Persistence**: PostgreSQL `agent_sessions` table (every 5 min save)

## Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Client & Lead Management
model Client {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  company     String?
  status      ClientStatus @default(LEAD)
  leadScore   Int      @default(0) // 0-100, from Marketing agent
  source      String? // lead source (e.g., "cold_email", "organic")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  projects    Project[]
  invoices    Invoice[]
  auditLogs   AgentAuditLog[]
}

enum ClientStatus {
  LEAD
  QUALIFIED
  CLIENT
  CHURNED
}

// Project Management
model Project {
  id          String   @id @default(cuid())
  clientId    String
  name        String
  description String?
  status      ProjectStatus @default(PLANNING)
  milestones  Json? // [{name, status, assignee, dueDate}]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  client      Client   @relation(fields: [clientId], references: [id])
  tasks       Task[]
}

enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  REVIEW
  COMPLETED
  ON_HOLD
}

model Task {
  id          String   @id @default(cuid())
  projectId   String
  assignedTo  AgentType // which agent is working on it
  name        String
  description String?
  status      TaskStatus @default(PENDING)
  lockedBy    String? // agent API key if locked
  lockedAt    DateTime? // lock timestamp (30 min timeout)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  project     Project  @relation(fields: [projectId], references: [id])
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  BLOCKED
  COMPLETED
  FAILED
}

enum AgentType {
  CEO
  CTO
  MARKETING
  SEO_SPECIALIST
  WEB_DEVELOPER
  DESIGNER
}

// SEO Audits
model SEOAudit {
  id          String   @id @default(cuid())
  clientId    String
  pageSpeed   Json? // {desktop: number, mobile: number}
  coreVitals Json? // {LCP, FID, CLS}
  metadata    Json? // {title, description, keywords, completeness}
  issues      Json? // [{type, severity, message, fix}]
  createdAt   DateTime @default(now())

  // Relations
  client      Client   @relation(fields: [clientId], references: [id])
}

// Billing & Invoices
model Invoice {
  id          String   @id @default(cuid())
  clientId    String
  amount      Float
  currency    String   @default("USD")
  status      InvoiceStatus @default(DRAFT)
  stripeId    String? // Stripe invoice ID after payment
  createdAt   DateTime @default(now())
  paidAt      DateTime?

  // Relations
  client      Client   @relation(fields: [clientId], references: [id])
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  FAILED
  CANCELLED
}

// Agent Communication & Audit
model AgentMessage {
  id          String   @id @default(cuid())
  fromAgent  AgentType
  toAgent    AgentType?
  taskId      String? // related task if handoff
  type        MessageType
  payload     Json // full message content
  createdAt   DateTime @default(now())
}

enum MessageType {
  HANDOFF
  STATUS_UPDATE
  ASK
  ERROR
}

model AgentAuditLog {
  id          String   @id @default(cuid())
  agent       AgentType
  tool        String // MCP tool name
  inputs      Json? // tool inputs (sanitized)
  success     Boolean
  error       String? // error message if failed
  createdAt   DateTime @default(now())
}

// Agent Health & Sessions
model AgentSession {
  id          String   @id @default(cuid())
  agent       AgentType
  status      AgentStatus @default(HEALTHY)
  lastHeartbeat DateTime? // updated every 10 min
  currentTask  String? // task ID if busy
  errorCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum AgentStatus {
  HEALTHY
  STUCK
  OFFLINE
  ERROR
}
```

## API Structure

### REST Endpoints (Frontend ↔ Backend)

#### Clients & Leads
- `GET /api/clients` — List all clients/leads
- `POST /api/clients` — Create new client (MCP: `create_client`)
- `GET /api/clients/:id` — Get client details
- `PATCH /api/clients/:id/status` — Update lead status (MCP: `update_lead_status`)

#### Projects
- `GET /api/projects` — List all projects
- `POST /api/projects` — Create new project
- `PATCH /api/projects/:id/milestone` — Update milestone (MCP: `update_project_milestone`)

#### SEO Audits
- `GET /api/seo-audits` — List all audits
- `POST /api/seo-audits` — Log audit (MCP: `log_seo_audit`)
- `GET /api/seo-audits/analytics` — Get analytics (MCP: `get_seo_analytics`)

#### Invoices
- `GET /api/invoices` — List all invoices
- `POST /api/invoices` — Create invoice (MCP: `create_invoice`)

#### Communications
- `GET /api/messages` — Inter-agent messages (MCP: logged via `log_agent_message`)
- `GET /api/messages/stream` — WebSocket endpoint for real-time updates

#### Agent Health
- `GET /api/agents/health` — Agent health status (MCP: `get_agent_health`)
- `POST /api/agents/:agent/restart` — Restart agent (dmux pane restart)

### MCP Tools (Agents ↔ App)

See `Plan-App.md` for full list. Key tools with Zod schemas below.

## MCP Tools with Zod Validation Schemas

```typescript
// mcp-server/tools/schemas.ts
import { z } from "zod";

// 1. create_client
export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  company: z.string().optional(),
  leadScore: z.number().min(0).max(100).default(0),
  source: z.string().optional(),
});

// 2. update_lead_status
export const updateLeadStatusSchema = z.object({
  clientId: z.string().cuid(),
  status: z.enum(["LEAD", "QUALIFIED", "CLIENT", "CHURNED"]),
});

// 3. log_seo_audit
export const logSEOAuditSchema = z.object({
  clientId: z.string().cuid(),
  pageSpeed: z.object({
    desktop: z.number().min(0).max(100),
    mobile: z.number().min(0).max(100),
  }).optional(),
  coreVitals: z.object({
    LCP: z.number().optional(),
    FID: z.number().optional(),
    CLS: z.number().optional(),
  }).optional(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    completeness: z.number().min(0).max(100).optional(),
  }).optional(),
  issues: z.array(z.object({
    type: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    message: z.string(),
    fix: z.string().optional(),
  })).optional(),
});

// 4. update_project_milestone
export const updateProjectMilestoneSchema = z.object({
  projectId: z.string().cuid(),
  milestone: z.object({
    name: z.string(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
    assignee: z.enum(["CTO", "WEB_DEVELOPER", "DESIGNER"]),
    dueDate: z.string().datetime().optional(),
  }),
});

// 5. log_email
export const logEmailSchema = z.object({
  clientId: z.string().cuid().optional(),
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  type: z.enum(["PROPOSAL", "FOLLOW_UP", "CONTRACT", "OTHER"]),
});

// 6. create_invoice
export const createInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
});

// 7. get_seo_analytics
export const getSEOAnalyticsSchema = z.object({
  clientId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// 8. log_agent_message
export const logAgentMessageSchema = z.object({
  fromAgent: z.enum(["CEO", "CTO", "MARKETING", "SEO_SPECIALIST", "WEB_DEVELOPER", "DESIGNER"]),
  toAgent: z.enum(["CEO", "CTO", "MARKETING", "SEO_SPECIALIST", "WEB_DEVELOPER", "DESIGNER"]).optional(),
  taskId: z.string().cuid().optional(),
  type: z.enum(["HANDOFF", "STATUS_UPDATE", "ASK", "ERROR"]),
  payload: z.record(z.any()), // flexible JSON
});

// 9. get_agent_health
export const getAgentHealthSchema = z.object({
  agent: z.enum(["CEO", "CTO", "MARKETING", "SEO_SPECIALIST", "WEB_DEVELOPER", "DESIGNER"]).optional(),
});

// 10. get_pending_tasks
export const getPendingTasksSchema = z.object({
  agent: z.enum(["CEO", "CTO", "MARKETING", "SEO_SPECIALIST", "WEB_DEVELOPER", "DESIGNER"]).optional(),
});

// Trigger tools (called by cron/webhook)
// 11. trigger_lead_generation
export const triggerLeadGenerationSchema = z.object({
  count: z.number().min(1).max(100).default(10),
});

// 12. trigger_proposal_send
export const triggerProposalSendSchema = z.object({
  clientId: z.string().cuid(),
});

// 13. trigger_deal_closure
export const triggerDealClosureSchema = z.object({
  clientId: z.string().cuid(),
  amount: z.number().positive(),
});

// 14. trigger_project_kickoff
export const triggerProjectKickoffSchema = z.object({
  projectId: z.string().cuid(),
});

// 15. trigger_seo_audit
export const triggerSEOAuditSchema = z.object({
  clientId: z.string().cuid().optional(), // if omitted, audit all active clients
});
```

## Autonomous Workflow Triggers (Cron/Webhook → MCP Server)

### Cron Jobs (Railway or System Crontab)

```bash
# Daily lead generation at 9 AM
0 9 * * * curl -X POST https://mcp-server.railway.app/tools/trigger_lead_generation \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: $MARKETING_AGENT_KEY" \
  -d '{"count": 10}'

# Weekly SEO audits on Mondays at 10 AM
0 10 * * 1 curl -X POST https://mcp-server.railway.app/tools/trigger_seo_audit \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: $SEO_SPECIALIST_AGENT_KEY"

# Check pending tasks every 30 minutes
*/30 * * * * curl -X POST https://mcp-server.railway.app/tools/get_pending_tasks \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: $CEO_AGENT_KEY"
```

### Webhook Endpoints (for external triggers)

- `POST /webhooks/lead` — New lead from landing page → `trigger_lead_generation`
- `POST /webhooks/payment` — Stripe webhook → `trigger_deal_closure` (after payment confirmation)

## CEO Decision Criteria (Autonomous Deal Closure)

### Auto-Close Deal If ALL Conditions Met:
1. **Lead Score** ≥ 80 (from Marketing agent qualification)
2. **Deal Value** < $10,000
3. **Client Has Verified Payment Method** (Stripe customer with valid card)
4. **Proposal Opened** and viewed for > 30 seconds (tracked via email-ops pixel)

### Escalate to Human If ANY Condition Met:
1. **Deal Value** ≥ $10,000
2. **Lead Score** < 80
3. **Client Requests Custom Contract Terms**
4. **Payment Method Verification Fails** (Stripe error)
5. **Proposal Not Opened** after 3 follow-ups (14 days)

### CEO Agent Prompt (in opencode.json — already set):
```
You are the CEO. Your goal is to oversee project milestones, manage the task list, and coordinate between the CTO, Marketing, and Development teams to ensure project delivery and deal closure.

Decision Criteria for Autonomous Deal Closure:
- Auto-close deals if: lead score ≥ 80, deal value < $10k, client has verified payment, proposal viewed > 30s.
- Escalate to human if: deal value ≥ $10k, lead score < 80, custom terms requested, payment fails, proposal not opened after 14 days.

When escalating, pause workflow and send email to admin via email-ops.
```

## Error Handling Approach

### API Failure Recovery (from Plan-App.md)
- **Stripe Down**: Queue invoices locally (in `Invoice` table with status DRAFT), retry every 5 min, alert CEO agent after 3 failures.
- **Email Provider Down**: Queue emails in DB (`AgentMessage` with type ERROR), retry with exponential backoff (1 min, 5 min, 15 min), switch to backup provider if configured.
- **MCP Server Unreachable**: Agents log to local file (`/tmp/agent-offline.log`), sync when connection restored.

### Agent Task Failures
- Retry failed tasks 3 times with increasing delay (1 min, 5 min, 15 min).
- After 3 failures: Escalate to CEO agent → human if still failing.
- Log all failures to `AgentAuditLog` with error details.

### Monitoring (from Plan-App.md)
- **dmux Heartbeat**: Each agent reports status every 10 minutes via `get_agent_health` MCP tool.
- **Stuck Task Detection**: Tasks in "IN_PROGRESS" > 2 hours trigger alert to CEO agent.
- **Loop Failure**: If dmux session dies, auto-restart with last known state from `AgentSession` table.

## Conflict Resolution Approach

### Task Locking
- When agent A updates a task, lock it in DB (`Task.lockedBy` = agent API key, `Task.lockedAt` = now).
- Lock timeout: 30 minutes. After timeout, any agent can claim the task.
- Lock check: Before update, verify `lockedBy` matches caller or `lockedAt` > 30 min ago.

### Concurrent Updates
- **Last-Write-Wins** with version check (Prisma `updatedAt` field).
- Conflicting updates trigger CEO agent review (both versions logged to `AgentMessage`).

### Handoff Validation
- Receiving agent must acknowledge task receipt within 10 minutes (update `Task.status` to IN_PROGRESS).
- If no acknowledgment: Task re-queues, CEO agent notified.

## Monitoring Approach

### Real-Time Dashboard (from Plan-App.md)
- **Inter-Agent Communication Log**: WebSocket feed of all agent messages. Filters: agent pair, task type, date range.
- **Autonomous Loop Monitor**: Agent health panel, stuck task alerts, restart buttons.
- **SEO Analytics Dashboard**: Charts for page speed, Core Web Vitals, metadata completeness.
- **Progress Tracking**: Pipeline view (Lead → Proposal → Deal → Project → Completion).

### Alerts (from Plan-App.md)
- **Email Alerts**: deal escalation, payment failures, agent offline > 30 min.
- **In-App Notifications**: task stuck, conflict detected, CEO decision needed.
- **Daily Summary Email**: leads generated, deals closed, projects completed, agent health status.

### Audit Trail (7-Year Retention)
- All MCP tool calls logged to `AgentAuditLog` table.
- All agent handoffs logged to `AgentMessage` table.
- Exportable as CSV/JSON for compliance reviews.

## Deployment Architecture

### Local Development
- **Frontend**: `npm run dev` on `localhost:3000`
- **Backend**: `npm run start:dev` on `localhost:3001`
- **MCP Server**: `npm run mcp:stdio` (stdio transport)
- **Database**: Supabase local or Neon branch
- **dmux**: `dmux new -s ceo -a cto,marketing,seo_specialist,web_developer,designer -p "..."`

### Production (Railway + Vercel)
- **Frontend**: Deployed to Vercel (auto from GitHub main branch)
- **Backend**: Deployed to Railway (Docker container)
- **MCP Server**: Deployed to Railway (separate service, Streamable HTTP transport)
- **Database**: Supabase (production) or Neon (serverless Postgres)
- **WebSockets**: WSS (SSL) for real-time dashboard updates

### Environment Variables
```bash
# Frontend (.env.local)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3002

# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
EMAIL_PROVIDER_KEY=...

# MCP Server (.env)
AGENT_API_KEYS={"ceo":"...","cto":"...","marketing":"...","seo_specialist":"...","web_developer":"...","designer":"..."}
JWT_SECRET=... # same as backend

# dmux
OPENCEDE_JSON_PATH=./opencode.json
```

## Next Step
Proceed to **Step 2: UI/UX Design** (Designer Agent) — create mockups for all core modules including SEO Analytics Dashboard, Inter-Agent Communication Log, Autonomous Loop Monitor, and Security Dashboard.
