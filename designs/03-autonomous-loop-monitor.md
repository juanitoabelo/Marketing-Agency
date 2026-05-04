# Autonomous Loop Monitor - Design Mockup

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔄 Autonomous Loop Monitor    [Start Loop] [Stop Loop] [Settings ⚙]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌────────────────────────┐ ┌────────────────────────┐                  │
│ │ Agent Health Panel    │ │ Pipeline Progress     │                  │
│ ├────────────────────────┤ ├────────────────────────┤                  │
│ │ 🟢 CEO         100%  │ │ Lead → Proposal → │                  │
│ │ 🟢 CTO         98%   │ │ [=========>---] 65%│                  │
│ │ 🟢 Marketing    95%   │ │                                │                  │
│ │ 🟡 SEO         88% ⚠️│ │ Projects: 5 total │                  │
│ │ 🟢 Web Dev     100%  │ │ - 2 Planning      │                  │
│ │ 🟢 Designer    100%  │ │ - 2 In Progress   │                  │
│ │                        │ │ - 1 Review        │                  │
│ │ Stuck: 0              │ │ - 0 Completed     │                  │
│ │ Offline: 0             │ │ - 0 On Hold       │                  │
│ └────────────────────────┘ └────────────────────────┘                  │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Stuck Tasks (Alerts)                                           │    │
│ ├────────────────────────────────────────────────────────────────────┤    │
│ │ 🔴 Task: proj_123 - Milestone "Planning"                     │    │
│ │ Agent: CTO, In Progress since: 3h 15m ago                   │    │
│ │ [View Task] [Restart Agent] [Escalate to Human]               │    │
│ │                                                                │    │
│ │ 🟡 Task: lead_456 - Follow-up Email                           │    │
│ │ Agent: Marketing, Pending since: 45m ago                      │    │
│ │ [View Task] [Reassign to CEO]                                 │    │
│ └────────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Historical Performance (Last 30 Days)                          │    │
│ ├────────────────────────────────────────────────────────────────────┤    │
│ │ [Line Chart: Tasks Completed per Day]                          │    │
│ │ [Bar Chart: Success Rate by Agent]                           │    │
│ │ [Pie Chart: Task Distribution by Status]                     │    │
│ └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Agent Health Panel

**Design Specs:**
- Grid of agent cards (2 cols on desktop, 1 col mobile)
- Each card shows: agent name, status dot, uptime %, last heartbeat
- Color-coded: green (healthy), yellow (warning), red (error/offline)

**Agent Card:**
```typescript
// Component: AgentHealthCard
interface AgentHealthCardProps {
  agent: AgentType;
  status: AgentStatus; // HEALTHY, STUCK, OFFLINE, ERROR
  uptimePercent: number; // 0-100
  lastHeartbeat: Date; // from `get_agent_health` MCP tool
  currentTask?: string; // task ID if busy
  errorCount: number; // from `AgentSession` table
  isStuck: boolean; // task in progress > 2 hours
}

// Visual:
// - Status dot: green (HEALTHY), yellow (STUCK), gray (OFFLINE), red (ERROR)
// - Agent name: bold, with agent-specific color (CEO=purple, etc.)
// - Uptime: progress bar (green >90%, yellow 70-90%, red <70%)
// - Last heartbeat: relative time ("2 min ago"), red if >15 min
// - Current task: clickable link to task details
// - Error count: badge (show if >0), red if >5
// - "Restart Agent" button (calls dmux to restart pane)
```

**Agent Status Logic:**
```typescript
// Status determination (runs every 10 min via heartbeat)
const getAgentStatus = (agent: AgentSession): AgentStatus => {
  if (!agent.lastHeartbeat) return "OFFLINE";

  const minutesSinceHeartbeat = (now - agent.lastHeartbeat) / 60000;

  if (minutesSinceHeartbeat > 15) return "OFFLINE";
  if (agent.errorCount > 5) return "ERROR";

  const task = getCurrentTask(agent);
  if (task && task.status === "IN_PROGRESS") {
    const hoursInProgress = (now - task.startedAt) / 3600000;
    if (hoursInProgress > 2) return "STUCK";
  }

  return "HEALTHY";
};
```

### 2. Pipeline Progress View

**Design Specs:**
- Visual pipeline: Lead → Proposal → Deal → Project → Completion
- Progress bar under each stage showing count and percentage
- Color-coded: green (on track), yellow (attention), red (stuck)

**Pipeline Stage:**
```typescript
// Component: PipelineStage
interface PipelineStageProps {
  name: string; // "Lead", "Proposal", "Deal", "Project", "Completion"
  count: number;
  total: number; // total leads in pipeline
  percentage: number; // count / total * 100
  status: "green" | "yellow" | "red";
  avgTimeInStage: string; // e.g., "2.3 days"
}

// Visual:
// - Stage name (bold)
// - Progress bar: width = percentage, color = status
// - Count: "12 / 45" (12 in this stage, 45 total in pipeline)
// - Avg time: "Avg: 2.3 days in this stage"
```

**Pipeline Data (from database queries):**
```typescript
// Query: Count clients by status
const pipelineData = [
  { stage: "Lead", count: 12, total: 45, avgTime: "3.2 days" },
  { stage: "Proposal Sent", count: 8, total: 45, avgTime: "2.1 days" },
  { stage: "Deal Closed", count: 5, total: 45, avgTime: "1.5 days" },
  { stage: "Project Active", count: 5, total: 45, avgTime: "14.0 days" },
  { stage: "Completed", count: 15, total: 45, avgTime: "N/A" },
];
```

### 3. Stuck Tasks Alerts

**Design Specs:**
- Red card (HIGH severity) or Yellow card (MEDIUM severity)
- Shows: task name, assigned agent, time stuck, action buttons
- Auto-appears when task in "IN_PROGRESS" > 2 hours

**Stuck Task Card:**
```typescript
// Component: StuckTaskCard
interface StuckTaskCardProps {
  taskId: string;
  taskName: string;
  assignedAgent: AgentType;
  milestone: string;
  timeStuck: string; // e.g., "3h 15m"
  severity: "HIGH" | "MEDIUM"; // HIGH if >2h, MEDIUM if 1-2h
  projectId: string;
}

// Visual:
// - Severity border-left: red (HIGH), yellow (MEDIUM)
// - Task name (bold, clickable → task details)
// - Assigned agent badge (colored)
// - Milestone: "Planning", "In Progress", etc.
// - Time stuck: red if >2h, yellow if 1-2h
// - Action buttons:
//   - "View Task" → router.push(`/projects/${projectId}/tasks/${taskId}`)
//   - "Restart Agent" → calls dmux to restart assigned agent's pane
//   - "Escalate to Human" → notifies CEO agent, pauses task
//   - "Reassign" → dropdown to select new agent
```

**Alert Trigger Logic:**
```typescript
// Runs every 30 minutes (cron job)
const checkStuckTasks = async () => {
  const inProgressTasks = await prisma.task.findMany({
    where: { status: "IN_PROGRESS" },
    include: { project: true }
  });

  for (const task of inProgressTasks) {
    const hoursInProgress = (now - task.updatedAt) / 3600000;

    if (hoursInProgress > 2) {
      // Alert CEO agent via `log_agent_message` MCP tool
      await logAgentMessage({
        fromAgent: "SYSTEM",
        toAgent: "CEO",
        type: "ERROR",
        payload: {
          message: `Task ${task.id} stuck for ${hoursInProgress.toFixed(1)} hours`,
          taskId: task.id,
          assignedTo: task.assignedTo
        }
      });

      // Show in dashboard
      stuckTasks.push({
        taskId: task.id,
        severity: hoursInProgress > 4 ? "HIGH" : "MEDIUM"
      });
    }
  }
};
```

### 4. Historical Performance Charts

**Design Specs:**
- 3 charts in a responsive grid (1 col mobile, 3 cols desktop)
- Data from `AgentAuditLog` and `Task` tables (last 30 days)

**Line Chart: Tasks Completed per Day**
```typescript
// Component: TasksCompletedChart (Recharts - LineChart)
// Data:
[
  { date: "2026-05-01", tasksCompleted: 5 },
  { date: "2026-05-02", tasksCompleted: 3 },
  // ... last 30 days
]
// X-axis: Date
// Y-axis: Tasks completed
// Line color: primary-500
// Dot on hover: show exact count
```

**Bar Chart: Success Rate by Agent**
```typescript
// Component: SuccessRateChart (Recharts - BarChart)
// Data:
[
  { agent: "CEO", successRate: 98, totalTasks: 50 },
  { agent: "CTO", successRate: 95, totalTasks: 40 },
  { agent: "Marketing", successRate: 92, totalTasks: 30 },
  // ...
]
// X-axis: Agent
// Y-axis: Success rate (%)
// Bar color: green if >90%, yellow if 80-90%, red if <80%
```

**Pie Chart: Task Distribution by Status**
```typescript
// Component: TaskDistributionChart (Recharts - PieChart)
// Data:
[
  { status: "Completed", count: 100, fill: "#10b981" }, // green
  { status: "In Progress", count: 15, fill: "#3b82f6" }, // blue
  { status: "Pending", count: 20, fill: "#f59e0b" }, // yellow
  { status: "Failed", count: 5, fill: "#ef4444" }, // red
]
// Legend: status + count + percentage
// On slice hover: show count and percentage
```

## Controls

### Start/Stop Loop Buttons

**Start Loop Button:**
```typescript
// Action: Start dmux autonomous loop
// Calls: `dmux new -s ceo -a cto,marketing,seo_specialist,web_developer,designer -p "..."`
// Disabled if: loop already running (check dmux process)
// Shows: "Starting..." while initializing, then "Running" with green dot
```

**Stop Loop Button:**
```typescript
// Action: Stop dmux autonomous loop
// Calls: `dmux kill` (kills all panes, stops agents)
// Confirmation dialog: "Are you sure? This will stop all autonomous agents."
// Shows: "Stopping..." while shutting down, then "Stopped" with gray dot
```

### Restart Agent Button (in Agent Health Panel)

```typescript
// Action: Restart specific agent's dmux pane
// Calls: `dmux kill-pane -t ceo` (if restarting CEO), etc.
// Then: `dmux split-window -t ceo "opencode --agent ceo --task ..."`
// Confirmation: "Restart CEO agent? Current task will be re-queued."
// Feedback: "Restarting CEO..." → "CEO restarted successfully"
```

## Real-Time Updates (WebSocket)

- Subscribe to `agent:health` events (every 10 min heartbeat)
- When agent reports status:
  - Update Agent Health Panel (uptime %, last heartbeat)
  - Check for stuck tasks (if task in progress > 2 hours)
  - Update Pipeline Progress (if task status changed)
- Visual: Highlight updated agent card (yellow bg, fade out)

## CEO Decision Criteria Adjustment

**Settings Panel (click Settings ⚙ button):**
```typescript
// Component: DecisionCriteriaSettings
// Allows CEO agent (or human admin) to adjust:
{
  autoCloseDeal: {
    minLeadScore: 80, // slider: 0-100
    maxDealValue: 10000, // input: dollar amount
    requireVerifiedPayment: true, // toggle
    minProposalViewTime: 30, // input: seconds
  },
  escalateToHuman: {
    minDealValue: 10000, // input: dollar amount
    maxLeadScore: 79, // slider: 0-100
    customTermsRequested: true, // toggle
    paymentVerificationFails: true, // toggle
  },
  stuckTaskThreshold: 2, // hours (slider: 1-6)
  heartbeatInterval: 10, // minutes (slider: 5-30)
}
// Save: updates `Architecture.md` or database config table
// Notify CEO agent: "Decision criteria updated"
```
