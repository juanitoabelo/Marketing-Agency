# Agency Management Application Plan

Internal tool to manage all agency operations: clients, leads, projects, communications, SEO tasks, development tickets, billing, and agent activity. Uses the multi-agent system defined in `opencode.json`.

## Core Modules
- **Client & Lead Management**: Track leads (synced from Marketing agent), client onboarding, contracts (synced from CEO agent)
- **Project Management**: Track milestones, task assignments to agents, progress reports (synced from CTO/Web Developer/Designer agents)
- **Communication Hub**: Log emails (synced from `email-ops`), client messages, internal comms
- **SEO & Dev Tracker**: Track SEO audits (synced from SEO Specialist agent), development tickets, deployment status (synced from Web Developer agent)
- **Billing & Invoicing**: Track invoices, payments (synced from `customer-billing-ops`), deal closure status (synced from CEO agent)
- **Agent Dashboard**: View agent activity, task status, performance metrics (via `eval-harness`)
- **SEO Analytics Dashboard**: View SEO audits from SEO Specialist agent, page speed scores, metadata checks, keyword rankings, Core Web Vitals, LLM citation tracking (via `seo-audit`, `seo`, `ai-seo` skills)
- **Inter-Agent Communication Log**: Real-time view of all agent-to-agent handoffs, task assignments, API calls, and decision logs. Filter by agent pair (e.g., CEO → CTO), task type, timestamp. Shows full message history between agents.
- **Autonomous Loop Monitor**: Real-time view of dmux sessions, agent health checks, stuck task detection, escalation queue. Start/stop loops, retry failed tasks, adjust CEO decision criteria from dashboard.

## Suggested Tech Stack (Finalized by CTO Agent)
- Frontend: Next.js + Tailwind CSS (matches `frontend-patterns`, `frontend-design` skills)
- Backend: Node.js + NestJS (matches `backend-patterns`, `nestjs-patterns` skills)
- Database: PostgreSQL (matches `postgres-patterns` skill)
- ORM: Prisma or Drizzle
- Auth: NextAuth.js or Clerk
- **MCP Server**: Node.js + TypeScript SDK (matches `mcp-server-patterns` skill) — exposes app functionality as tools for agents via Streamable HTTP transport (production) or stdio (local dev)
- **Orchestration**: dmux (tmux pane manager) for parallel autonomous agent workflows (matches `dmux-workflows` skill)
- Deployment: Vercel (frontend) + Railway (backend + MCP server) (matches `deployment-patterns` skill)

## MCP Tools (Defined by CTO Agent)
Agents interact with the app via these MCP tools:
- `create_client` — CEO/Marketing agents create new clients
- `update_lead_status` — Marketing agent updates lead status
- `log_seo_audit` — SEO Specialist agent logs audit results (page speed, Core Web Vitals, metadata, keywords)
- `update_project_milestone` — CTO/Web Developer/Designer agents update progress
- `log_email` — Marketing/CEO agents log sent emails
- `create_invoice` — CEO agent creates invoices post-deal
- `get_seo_analytics` — SEO Specialist/CEO agents query SEO dashboard data

## MCP Tools for Autonomous Triggers
These tools trigger agent workflows automatically (implemented in MCP server):
- `trigger_lead_generation` — Webhook/cron triggers Marketing agent to generate leads
- `trigger_proposal_send` — Automatically sends proposal when lead qualifies (CEO agent)
- `trigger_deal_closure` — Processes payment and marks deal closed (CEO + `customer-billing-ops`)
- `trigger_project_kickoff` — Starts CTO → Web Developer/Designer handoff after deal closure
- `trigger_seo_audit` — Scheduled SEO audits for all client websites (SEO Specialist agent)
- `get_pending_tasks` — Returns tasks for autonomous agent dispatch via dmux
- `log_agent_message` — Logs inter-agent communication (CEO → CTO handoff, etc.) to Inter-Agent Communication Log
- `get_agent_health` — Returns agent status, last activity, error count for Autonomous Loop Monitor

## Resilience & Monitoring
### Error Handling
- **API Failure Recovery**:
  - Stripe down: Queue invoices locally, retry every 5 minutes, alert CEO agent after 3 failures
  - Email provider down: Queue emails in DB, retry with exponential backoff, switch to backup provider if configured
  - MCP server unreachable: Agents log to local file, sync when connection restored
- **Agent Task Failures**:
  - Retry failed tasks 3 times with increasing delay (1 min, 5 min, 15 min)
  - After 3 failures: Escalate to CEO agent → human if still failing
  - Log all failures to `Inter-Agent Communication Log` with error details

### Agent Conflict Resolution
- **Task Locking**: When agent A is updating a task, lock it in DB (timeout 30 min)
- **Concurrent Updates**: Last-write-wins with version check; conflicting updates trigger CEO agent review
- **Handoff Validation**: Receiving agent must acknowledge task receipt within 10 minutes or task re-queues

### Monitoring & Alerting
- **Autonomous Loop Health**:
  - dmux heartbeat: Each agent reports status every 10 minutes via `get_agent_health` MCP tool
  - Stuck task detection: Tasks in "in_progress" > 2 hours trigger alert to CEO agent
  - Loop failure: If dmux session dies, auto-restart with last known state from DB
- **Alert Channels** (configured in dashboard):
  - Email alerts for: deal escalation, payment failures, agent offline > 30 min
  - In-app notifications for: task stuck, conflict detected, CEO decision needed
  - Daily summary email: leads generated, deals closed, projects completed, agent health status

### Rollback Strategy
- **Failed Deal Rollback**:
  - If payment fails after contract sent: Auto-cancel contract, notify client via `email-ops`, return lead to "qualified" status
  - If project kickoff fails: Rollback invoice, notify CEO agent, escalate to human
- **Failed Deployment Rollback**:
  - Keep last 3 working deployments on Railway
  - Auto-rollback if health checks fail > 3 times
  - Notify CTO agent with error logs via `log_agent_message`

### Dashboard Monitoring Features
- **Real-Time Agent Communication Viewer**:
  - WebSocket connection to backend for live updates
  - Shows: agent name, message type (handoff/status/task), target agent, timestamp, payload
  - Filters: by agent pair, task type, date range, success/failure
  - Click to expand: full message JSON, error details, retry history
- **Progress Tracking**:
  - Pipeline view: Lead → Proposal → Deal → Project → Completion
  - Each stage shows: assigned agent, time in stage, next action, bottlenecks
  - Color-coded: green (on track), yellow (attention needed), red (stuck > 2 hours)
- **Agent Health Panel**:
  - Heartbeat status, last task completed, error count, uptime percentage
  - "Restart Agent" button (calls dmux to restart specific pane)
  - Historical performance: tasks completed, success rate, avg response time

## Autonomous Workflow
Agents work autonomously using `dmux-workflows` (matches `dmux-workflows` skill) and `autonomous-loops` (matches `autonomous-loops` skill).

### CEO Decision Criteria for Autonomous Deal Closure
Defined in CEO agent's prompt in `opencode.json`:
- **Auto-close deals** if:
  - Lead score ≥ 80 (from Marketing agent qualification)
  - Deal value < $10,000
  - Client has verified payment method
  - Proposal was opened and viewed for > 30 seconds
- **Escalate to human** if:
  - Deal value ≥ $10,000
  - Lead score < 80
  - Client requests custom contract terms
  - Payment method verification fails

### Autonomous Process Flow
1. **Scheduled Lead Generation** (Marketing Agent via cron):
   - Cron job triggers `trigger_lead_generation` MCP tool daily at 9 AM
   - Marketing agent runs `lead-intelligence` skill to find and qualify leads
   - Qualified leads (score ≥ 80) → auto-sent proposal via `email-ops`
   - Leads logged to app via `create_client` + `log_email` MCP tools
   - Inter-agent message logged via `log_agent_message` (Marketing → CEO: "New qualified lead: [details]")

2. **Autonomous Proposal & Follow-up** (CEO + Marketing Agents):
   - CEO agent monitors `get_pending_tasks` for new qualified leads
   - Sends proposal via `email-ops` using `sales-enablement` skill
   - Marketing agent sends follow-ups on days 3, 7, 14 if no response
   - All emails logged via `log_email` MCP tool
   - Inter-agent messages logged: CEO → Marketing ("Follow-up sent to [client]")

3. **Deal Closure** (CEO Agent):
   - CEO agent checks decision criteria above
   - If auto-close: sends contract → processes payment via `customer-billing-ops` → logs via `create_invoice` MCP tool
   - If escalate: pauses workflow, notifies human via email/Slack webhook
   - Inter-agent message logged: CEO → CTO ("Deal closed: [client], starting project kickoff")

4. **Project Kickoff** (CTO + Web Developer + Designer Agents):
   - After deal closure, `trigger_project_kickoff` fires
   - CTO agent defines tech stack (using `nestjs-patterns`, `frontend-patterns`)
   - Delegates to Web Developer + Designer agents via task assignments
   - All progress synced via `update_project_milestone` MCP tool
   - Inter-agent messages logged: CTO → Web Developer ("Task assigned: Build homepage"), Web Developer → Designer ("UI components ready for styling")

5. **SEO Audit Loop** (SEO Specialist Agent):
   - Scheduled weekly via cron: `trigger_seo_audit` MCP tool
   - SEO Specialist runs `seo-audit` + `seo` skills on client websites
   - Results logged via `log_seo_audit` MCP tool → appears in SEO Analytics Dashboard
   - Critical issues auto-flagged to CTO agent via `log_agent_message`

### dmux Orchestration Setup
Parallel autonomous agent execution using `dmux-workflows` skill:
```bash
# Install dmux
npm install -g dmux

# Start autonomous agent loop (CEO as primary, others as subagents)
dmux new -s ceo -a cto,marketing,seo_specialist,web_developer,designer -p "Autonomously generate leads, send proposals, close deals under $10k, and manage projects. Check pending tasks every 30 minutes."
```

### Cron Setup for Scheduled Tasks
Using system crontab or Railway cron jobs:
```bash
# Daily lead generation at 9 AM
0 9 * * * cd /path/to/repo && opencode --agent marketing --task "Generate and qualify leads using lead-intelligence skill. Log results via MCP tools."

# Weekly SEO audits on Mondays at 10 AM
0 10 * * 1 cd /path/to/repo && opencode --agent seo_specialist --task "Run SEO audits for all active client websites. Log results via log_seo_audit MCP tool."

# Check pending tasks every 30 minutes
*/30 * * * * cd /path/to/repo && opencode --agent ceo --task "Check get_pending_tasks MCP tool. Process any new qualified leads or pending deal closures."
```

## Implementation Steps (Agent-Driven)

### Step 1: Architecture & Tech Stack (CTO Agent)
- CTO agent defines final tech stack, database schema, API structure
- Define MCP server tools with Zod validation (matches `mcp-server-patterns` skill)
- Define autonomous workflow triggers and CEO decision criteria
- Define error handling, conflict resolution, and monitoring approach
- Output: `Architecture.md` in repo root

### Step 2: UI/UX Design (Designer Agent)
- Designer agent creates mockups for all core modules including SEO Analytics Dashboard
- Design **Inter-Agent Communication Log** view with filters, real-time updates, message expansion
- Design **Autonomous Loop Monitor** with agent health, stuck task alerts, restart buttons
- Design autonomous workflow monitoring views (agent status, pending tasks, deal pipeline, progress tracking)
- Output: Prototypes in `/designs` directory

### Step 3: Project Scaffolding (Web Developer Agent)
- Initialize Next.js frontend, NestJS backend, PostgreSQL DB
- Scaffold MCP server using Node.js + TypeScript SDK (stdio or Streamable HTTP transport)
- Set up dmux configuration for autonomous agent loops
- Set up WebSocket server for real-time dashboard updates (Inter-Agent Communication Log, Agent Health)
- **Security Scaffolding**:
  - Set up RBAC (role-based access control) in backend (agent roles, permissions)
  - Create `agent_audit_log` table in PostgreSQL for audit trails
  - Configure rate limiting middleware (per-agent + per-IP)
  - Set up env var management for API keys (`AGENT_API_KEYS`, `JWT_SECRET`)
- Set up TDD workflow (`tdd-workflow` skill), linting, formatting
- Output: Boilerplate code in `/frontend`, `/backend`, `/mcp-server`, and `/dmux-config` directories

### Step 4: Core Module Development (Web Developer + Designer Agents)
- Build modules per CTO's architecture, TDD for all features
- **SEO Analytics Dashboard** (Designer + Web Developer):
  - Display SEO audit results from `log_seo_audit` MCP tool
  - Charts for page speed, Core Web Vitals, metadata completeness
  - Keyword ranking trends and LLM citation tracking (via `seo`, `ai-seo` skills)
  - Filter audits by client, project, date range
- **Inter-Agent Communication Log** (Designer + Web Developer):
  - Real-time WebSocket feed of all agent messages (via `log_agent_message` MCP tool)
  - Filters: by agent pair (CEO → CTO), task type, date range, success/failure
  - Click to expand full message JSON, error details, retry history
  - Search across message payloads
- **Autonomous Loop Monitor** (Designer + Web Developer):
  - Agent health panel (heartbeat, last task, error count, uptime)
  - Stuck task detection with visual alerts (red = stuck > 2 hours)
  - "Restart Agent" button (calls dmux to restart pane)
  - Progress tracking: Pipeline view (Lead → Proposal → Deal → Project → Completion)
  - Historical performance charts (tasks completed, success rate, avg response time)
- **Resilience Features**:
  - Error handling UI: Show retrying tasks, escalation queue, failed task details
  - Rollback controls: "Revert Deal" button for CEO agent, deployment rollback triggers
- Output: Functional modules with unit/integration tests

### Step 5: MCP Server Implementation (Web Developer Agent)
- Implement all MCP tools defined in Step1 + autonomous trigger tools:
  - Tools with Zod schemas for input validation
  - Connect tools to backend API/database
  - Implement `trigger_*` tools that dispatch agent tasks
  - Implement `log_agent_message` for inter-agent communication logging
  - Implement `get_agent_health` for agent health monitoring
- **Security Implementation**:
  - Agent API key validation middleware (check `AGENT_API_KEYS` env var)
  - RBAC enforcement: each agent can only call allowed MCP tools
  - Rate limiting per agent (CEO: 100/min, Marketing: 200/min, Others: 50/min)
  - Log all tool calls to `agent_audit_log` table (agent, tool, inputs, timestamp, success/failure)
  - Input sanitization for all string inputs (prevent XSS, SQL injection)
- Set up WebSocket endpoint for real-time dashboard updates (with SSL for production)
- Test MCP server with Claude Desktop or OpenCode
- Output: Working MCP server that agents can connect to, with security enforced

### Step 6: dmux Orchestration Setup (Web Developer + CTO Agents)
- Configure dmux for parallel autonomous agent workflows (matches `dmux-workflows` skill)
- Set up tmux pane layout: CEO (primary) + subagents in separate panes
- Configure agent handoff protocols and task queue
- Implement heartbeat mechanism: agents report status via `get_agent_health` every 10 minutes
- Output: Working dmux setup with agent session persistence

### Step 7: Cron & Scheduler Setup (Web Developer Agent)
- Set up cron jobs for scheduled lead generation (daily 9 AM)
- Set up cron jobs for SEO audits (weekly Mondays 10 AM)
- Set up cron jobs for pending task checks (every 30 minutes)
- Configure Railway cron jobs for production deployment
- Implement stuck task detection: alert if task in progress > 2 hours
- Output: Automated scheduling system that triggers agent workflows

### Step 8: Integration & Testing (All Agents)
- Connect all agents to app via MCP server tools (not REST API)
- SEO Specialist agent logs audits via `log_seo_audit` tool → appears in SEO Analytics Dashboard
- Marketing agent logs emails via `log_email` tool → appears in Communication Hub
- All inter-agent messages logged via `log_agent_message` → appears in Inter-Agent Communication Log
- Test full autonomous flow: Lead Generation → Proposal → Deal Closure → Project Kickoff
- Test error handling: simulate API failures, verify retry + escalation
- Test conflict resolution: simulate concurrent updates, verify lock mechanism
- Run `verification-loop` for all modules
- Run `eval-harness` to test agent-app MCP integration
- Output: Fully integrated system with passing tests

### Step 9: Deployment (Web Developer + CTO Agents)
- Deploy frontend to Vercel, backend to Railway, MCP server to Railway
- Set up CI/CD pipeline (`github-ops`, `deployment-patterns` skills)
- Configure production cron jobs on Railway
- Configure agents to connect to production MCP server URL
- Set up WebSocket SSL for real-time dashboard in production
- **Security & Backup Setup**:
  - Enable CORS restrictions on MCP server (production URL only)
  - Configure Supabase/Neon daily backups + 30-day retention
  - Set up S3/GCS bucket for file storage backup (daily sync)
  - Enable Railway auto-restart for MCP server (max 3 restarts/ hour)
  - Configure dmux session state persistence to DB (every 5 min)
- Output: Live production app with MCP server for agent communication, backups enabled

### Step 10: Activate Autonomous Loop (CEO Agent)
- Start dmux autonomous loop with CEO as primary orchestrator
- **Security Verification**:
  - Verify all agents use their unique API keys (check `agent_audit_log`)
  - Verify rate limiting works (simulate 200 req/min from Marketing agent)
  - Verify RBAC: CTO agent cannot call `create_invoice`, Marketing cannot access billing
  - Verify audit log captures all MCP tool calls with agent identity
- Monitor first 5 deals closely to calibrate CEO decision criteria
- Verify Inter-Agent Communication Log shows all handoffs in real-time
- Verify Autonomous Loop Monitor shows agent health, progress tracking
- Verify Security Dashboard: API keys, rate limits, backup status
- Use `continuous-learning-v2` to refine agent prompts based on deal outcomes
- Use `dashboard-builder` to create performance dashboards
- Output: Fully autonomous agency operation with full monitoring + security

### Step 11: Iterate & Improve (All Agents)
- Use `continuous-learning-v2` to refine agent-MCP interactions
- Use `eval-harness` to measure: lead quality, email response rates, SEO gains, code quality
- Use `dashboard-builder` to create performance dashboards
- Add more MCP tools as new features are requested
- Adjust CEO decision criteria based on closed deal success rate
- Tune retry logic, heartbeat intervals, stuck task thresholds based on observed performance

### Step 12: Load Testing (Web Developer + CTO Agents)
- Use `autonomous-loops` skill patterns to simulate load:
  - Marketing agent generating 1000 leads/hour: Verify DB writes, no dropped leads
  - 10 concurrent agent handoffs (CEO → CTO → Web Developer): Verify task locking, no conflicts
  - SEO Specialist auditing 100 client websites simultaneously: Verify rate limiting, no API bans
  - 500 concurrent dashboard WebSocket connections: Verify real-time updates, no disconnections
- **Success Criteria**:
  - API response time < 200ms (p95) under load
  - No dropped tasks/messages under load
  - Agent handoff latency < 5 seconds under load
  - Dashboard updates within 1 second under load
- Generate load test reports via `dashboard-builder`, store in `/load-test-reports/`
- Output: Verified system handles peak load without degradation

## Security & Disaster Recovery

### Agent Authentication & Authorization
- **Agent Identity**: Each agent (CEO, CTO, Marketing, etc.) has unique API keys for MCP server access (stored in `AGENT_API_KEYS` env var)
- **Role-Based Access Control (RBAC)**:
  - CEO agent: Full access (clients, billing, projects, agent management)
  - CTO agent: Read/write projects/tasks, read-only billing, no deal closure
  - Marketing agent: Read/write leads/clients, read-only projects, send emails
  - SEO Specialist: Read/write SEO audits, read-only clients/projects
  - Web Developer: Read/write projects/tasks, read-only clients
  - Designer: Read/write projects/tasks (design-specific), read-only clients
- **MCP Tool Permissions**: Each agent can only call allowed MCP tools (enforced in MCP server middleware)
- **Session Management**: dmux sessions expire after 8 hours, require re-authentication via `refresh_agent_token` MCP tool

### API Security
- **Rate Limiting** (implemented in MCP server + backend):
  - Per-agent rate limits: CEO (100 req/min), Marketing (200 req/min for lead gen), Others (50 req/min)
  - IP-based rate limiting for production MCP server URL (Railway)
  - Rate limit headers in responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- **Input Validation**: All MCP tool inputs validated via Zod schemas (matches `mcp-server-patterns` skill)
- **SQL Injection Protection**: Use Prisma/Drizzle ORM parameterized queries (matches `postgres-patterns` skill)
- **XSS Protection**: Sanitize all user-generated content (client names, email bodies) before display
- **CORS**: Restrict MCP server to known origins (production URL, localhost for dev)
- **HTTPS Only**: Force SSL for all production endpoints (Railway auto-provides)

### Audit Trails
- **Agent Action Log** (stored in PostgreSQL `agent_audit_log` table):
  - Every MCP tool call: agent name, tool name, inputs, timestamp, success/failure
  - Every agent handoff: from agent, to agent, task ID, timestamp, message hash
  - Every deal closure: CEO agent, client, amount, payment status, timestamp
  - Retention: 7 years (business record requirement)
- **Dashboard Access**: View audit log in **Inter-Agent Communication Log** with "Show Audit Trail" toggle
- **Export**: Export audit logs as CSV/JSON for compliance reviews

### Backup & Retention Policies
- **Database Backups** (Supabase/Neon):
  - Automated daily backups (Supabase) or Point-in-Time Recovery (Neon)
  - Retention: 30 days daily backups, 1 year monthly backups
  - Manual backup before major deployments (CEO agent triggers via `backup_database` MCP tool)
- **File Storage** (client assets, designs, contracts):
  - Store in Railway volumes or Supabase Storage
  - Daily sync to S3/GCS bucket for disaster recovery
  - Retention: Indefinite for client contracts, 90 days for intermediate design files
- **Agent State Persistence**: dmux session state saved to DB every 5 minutes (auto-restart recovers from last state)
- **MCP Server Config**: Version-controlled in repo (`/mcp-server/config/`), backed up with DB

### Disaster Recovery
- **Recovery Time Objective (RTO)**: 1 hour (system restored and agents running)
- **Recovery Point Objective (RPO)**: 5 minutes (max data loss)
- **Failover Plan**:
  1. DB failure: Restore from last hourly backup (Neon/Supabase)
  2. MCP server down: Railway auto-restarts container, if fails → fallback to secondary Railway instance
  3. Frontend/backend down: Vercel/Railway auto-rollback to last healthy deployment
  4. Agent loop dead: dmux auto-restart, restores state from DB, CEO agent re-queues pending tasks
- **Disaster Recovery Test**: Monthly automated test (cron job):
  - Simulate DB failure → verify restore from backup
  - Simulate MCP server crash → verify auto-restart + state recovery
  - Results logged to `agent_audit_log`, alert CEO agent if failures

### Load Testing for High-Volume Lead Generation
- **Tools**: Use `autonomous-loops` skill patterns to simulate load
- **Scenarios** (run before production launch):
  - Marketing agent generating 1000 leads/hour: Verify DB writes, no dropped leads
  - 10 concurrent agent handoffs (CEO → CTO → Web Developer): Verify task locking, no conflicts
  - SEO Specialist auditing 100 client websites simultaneously: Verify rate limiting, no API bans
  - 500 concurrent dashboard WebSocket connections: Verify real-time updates, no disconnections
- **Success Criteria**:
  - API response time < 200ms (p95) under load
  - No dropped tasks/messages under load
  - Agent handoff latency < 5 seconds under load
  - Dashboard updates within 1 second under load
- **Load Test Reports**: Generated via `dashboard-builder` skill, stored in `/load-test-reports/`

### Security Dashboard Features
- **Access Control Panel** (CEO agent only):
  - View/rotate agent API keys
  - Adjust rate limits per agent
  - Enable/disable agents (emergency kill switch)
- **Security Events Log**:
  - Failed auth attempts, rate limit violations, suspicious inputs
  - Alert CEO agent on > 10 failed attempts in 5 minutes
- **Backup Status Panel**:
  - Last backup time, backup size, restore test status
  - Alert CEO agent if backup > 24 hours old

## Environment & Prerequisites
- **Accounts**: Vercel, Railway, Supabase/Neon (for DB hosting)
- **API Keys**: Stripe (for `customer-billing-ops`), email provider (for `email-ops`)
- **Env Vars**: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `NEXTAUTH_SECRET`, `MCP_SERVER_URL`
- **dmux**: Install globally via `npm install -g dmux` (for `dmux-workflows` skill)
- **Cron**: System crontab (local) or Railway cron jobs (production)
- **WebSocket**: Configure SSL for real-time dashboard updates in production

## Next Steps
1. CTO agent begins architecture definition including MCP tools, autonomous triggers, security, and disaster recovery
2. Populate repo with initial app boilerplate code (frontend, backend, MCP server, dmux config)
3. Set up dmux orchestration for parallel autonomous agent workflows
4. Configure cron jobs for scheduled lead generation and SEO audits
5. Build Inter-Agent Communication Log, Autonomous Loop Monitor, and Security Dashboard
6. Test SEO Specialist agent logging audits via `log_seo_audit` MCP tool
7. Test full autonomous flow with a trial lead (Lead → Proposal → Deal → Project)
8. Verify error handling: simulate API failures, verify retry + escalation
9. Verify security: agent API keys, rate limiting, RBAC, audit log capture
10. Run load tests: 1000 leads/hour, 10 concurrent handoffs, 500 WebSocket connections
11. Test disaster recovery: simulate DB failure, MCP server crash, verify auto-restart + state recovery
12. Update `AGENTS.md` with app-specific dev commands once code exists
