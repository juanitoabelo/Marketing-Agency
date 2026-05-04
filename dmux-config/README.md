# dmux Orchestration for Abelo Creative

Parallel autonomous agent workflows using dmux (tmux pane manager).

## Quick Start

```bash
# 1. Install dmux
npm install -g dmux

# 2. Run setup script
bash dmux-config/setup.sh

# 3. Start autonomous loop
dmux start abelo-creative

# 4. Check status
dmux status abelo-creative
```

## Session Structure

```
Session: abelo-creative
├── Pane 0: CEO (Primary Agent)
│   └── Role: Orchestrator, deal closure, human escalation
│
├── Pane 1: CTO (Subagent)
│   └── Role: Tech stack, architecture, code review
│
├── Pane 2: Marketing (Subagent)
│   └── Role: Lead gen, email outreach, follow-ups
│
├── Pane 3: SEO Specialist (Subagent)
│   └── Role: SEO audits, keyword tracking, LLM citations
│
├── Pane 4: Web Developer (Subagent)
│   └── Role: Coding, deployment, Git workflows
│
└── Pane 5: Designer (Subagent)
    └── Role: UI/UX design, design systems
```

## Commands

### Session Management
```bash
# List all sessions
dmux list

# Start session
dmux start abelo-creative

# Stop session
dmux stop abelo-creative

# Kill session (terminate all agents)
dmux kill abelo-creative
```

### Agent Control
```bash
# Send command to specific pane (agent)
dmux send -s abelo-creative -p 0 "Check pending tasks via get_pending_tasks MCP tool"

# Restart specific agent
dmux kill-pane -s abelo-creative -p 2  # stop Marketing
dmux split-window -s abelo-creative -p 2 "opencode --agent marketing --task '...'"  # restart

# View logs for specific pane
dmux logs -s abelo-creative -p 1  # CTO logs
```

### Monitoring
```bash
# View all panes (tmux attach)
tmux attach -t abelo-creative

# Inside tmux:
# - Ctrl+b " → split pane horizontally
# - Ctrl+b % → split pane vertically
# - Ctrl+b arrow keys → switch between panes
# - Ctrl+b d → detach from session
```

## Agent Heartbeat (Every 10 Minutes)

Each agent reports status via `get_agent_health` MCP tool:

```typescript
// CEO agent runs this every 10 min:
await fetch('http://localhost:3002/tools/get_agent_health', {
  method: 'POST',
  headers: { 'X-Agent-Key': CEO_API_KEY },
  body: JSON.stringify({ agent: 'CEO' }),
});
```

If agent doesn't report within 15 min → status = OFFLINE.
If task in progress > 2 hours → status = STUCK.

## Stuck Task Detection (Cron - Every 30 Min)

```bash
# In crontab:
*/30 * * * * cd /path/to/repo && dmux send -s abelo-creative -p 0 "Check get_pending_tasks MCP tool. Escalate stuck tasks > 2h to human."
```

## Auto-Restart on Failure

```bash
# Monitor dmux session, restart if dead:
dmux status abelo-creative || dmux new -s ceo -a cto,marketing,seo_specialist,web_developer,designer -p "..."
```

## Integration with App Dashboard

The dashboard's **Autonomous Loop Monitor** connects to:
- `GET /api/agents/health` → agent status (from `get_agent_health` MCP tool)
- `GET /api/tasks?status=IN_PROGRESS` → stuck task detection
- WebSocket `ws://localhost:3001/messages/stream` → real-time agent messages

"Restart Agent" button in dashboard calls:
```bash
dmux kill-pane -s abelo-creative -p <pane>
dmux split-window -s abelo-creative -p <pane> "opencode --agent <agent> --task '...'"
```

## Troubleshooting

### Agent Not Responding
```bash
# Check pane logs
dmux logs -s abelo-creative -p <pane>

# Restart agent
dmux kill-pane -s abelo-creative -p <pane>
dmux setup.sh  # re-run setup to recreate panes
```

### Session Crashed
```bash
# Kill and recreate
dmux kill abelo-creative
bash dmux-config/setup.sh
```

### MCP Server Unreachable
```bash
# Check MCP server
curl http://localhost:3002/tools/list -H "X-Agent-Key: <key>"

# Restart MCP server
cd mcp-server && npm run start:prod
```

## Security Notes

- API keys stored in `mcp-server/.env` (never commit!)
- dmux session encrypted with tmux (set `tmux -2` flag)
- Agent state persisted to DB every 5 min (`AgentSession` table)
- Session restore on restart: reads last state from DB
