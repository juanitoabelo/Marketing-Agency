# Multi-Agent Agency Implementation Plan

Autonomous agent system for **Abelo Creative** (Website/Application/Design/Development Agency) using OpenCode, with agents that operate independently, send emails, and close deals.

## Prerequisites: Required Skills
Install via `configure-ecc` skill:
- `email-ops` — send emails, track outreach, manage client communication
- `sales-enablement` — proposals, deal closure, sales collateral
- `customer-billing-ops` — Stripe payment processing post-deal
- `seo-audit` / `seo` — technical SEO audits and optimization
- `frontend-patterns` / `backend-patterns` — development workflows
- `frontend-design` — UI/UX design tasks
- `project-flow-ops` — task tracking and project management
- `eval-harness` — measure agent performance over time

## Agent Roles & Descriptions
All agents are configured in `opencode.json` (already created in repo root).

| Agent | Mode | Core Responsibility |
|-------|------|---------------------|
| **CEO** | Primary | Oversees all operations, sets strategy, approves budgets, signs client contracts, coordinates teams, closes deals autonomously |
| **CTO** | Subagent | Defines technical roadmap, selects client tech stacks, enforces code quality/security, conducts architecture reviews |
| **Marketing** | Subagent | Generates leads via cold email/social outreach, nurtures leads with sequences, qualifies prospects, hands off sales-ready leads to CEO |
| **SEO Specialist** | Subagent | Conducts technical SEO audits (metadata, page speed, Core Web Vitals), implements keyword/schema/LLM optimization, tracks ranking ROI |
| **Web Developer** | Subagent | Builds/deploys client sites/apps with TDD practices, manages Git workflows, integrates APIs, handles CI/CD and maintenance |
| **Designer** | Subagent | Creates UI/UX designs/prototypes/design systems, ensures accessible user flows, maintains brand consistency, collaborates with developers |

## Agent Configuration
Full config is stored in `opencode.json` (matches user-provided specification):
- Each agent has `mode` (primary/subagent), `description`, and `prompt` defining behavior
- CEO is the primary orchestrator; all other agents are subagents that report to CEO

## Implementation Steps
### Step 1: Install Prerequisite Skills
Run `configure-ecc` to install all required skills listed above.

### Step 2: Verify Setup
Confirm `opencode.json` and updated `AGENTS.md` are in the repo root.

### Step 3: Enable Email & Deal Closure
- Grant Marketing/CEO agents access to `email-ops` for automated proposal sending
- Integrate `customer-billing-ops` (Stripe) for auto-payment processing post-deal
- Use `verification-loop` to validate deal terms before auto-closing

### Step 4: Test Full Workflow
1. Marketing generates/qualifies leads → passes to CEO
2. CEO reviews leads → sends proposals via `email-ops`
3. CEO closes deal → triggers project kickoff
4. CTO defines tech stack → delegates to Web Developer + Designer
5. Web Developer + Designer execute build (TDD, design systems)
6. SEO Specialist audits pre-launch → feeds fixes to Web Developer
7. CTO reviews deliverable → CEO delivers to client

### Step 5: Iterate & Improve
- Use `eval-harness` to measure agent performance (email response rates, SEO gains, code quality)
- Use `continuous-learning-v2` to refine agent prompts over time
- Use `ralphinho-rfc-pipeline` for complex multi-agent project execution

## Autonomous Operations
- **Email Sending**: Marketing/CEO agents use `email-ops` to send proposals, follow-ups, and project updates without manual intervention
- **Deal Closure**: CEO agent validates qualified leads, sends contracts, processes payments via integrated billing tools, and marks deals as closed
- **Task Handoffs**: Agents pass work autonomously following the defined workflow, with CTO providing technical oversight

## Next Steps
1. Populate repo with initial project code/config to give agents concrete work
2. Install all required skills via `configure-ecc`
3. Run a trial project to validate agent handoffs and autonomy
4. Set up `dashboard-builder` to monitor agent performance metrics over time
