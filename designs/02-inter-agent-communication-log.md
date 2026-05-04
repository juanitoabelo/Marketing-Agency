# Inter-Agent Communication Log - Design Mockup

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💬 Inter-Agent Communication Log      [Search: ________] [Export ▼]       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filters: [All Agents ▼] [All Types ▼] [Last 24h ▼] [Show Audit: ☑] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ #  Auto-scroll: ON 🟢    [Pause] [Clear] [Settings ⚙]       │    │
│ ├────────────────────────────────────────────────────────────────────┤    │
│ │ 10:32:15 [CEO → CTO]        HANDOFF                                    │    │
│ │ "Deal closed: DesignCo ($5k). Starting project kickoff.           │    │
│ │ Task: proj_123, Milestone: Planning, Assignee: CTO                 │    │
│ │ [Expand JSON] [Retry] [Escalate]                                   │    │
│ │                                                                       │    │
│ │ 10:30:42 [SEO → CEO]        STATUS_UPDATE                             │    │
│ │ "Audit complete: Acme Corp. Page speed: 92, Issues: 3 (1 HIGH)." │    │
│ │ Audit ID: audit_456, Client: client_789                              │    │
│ │ [Expand JSON] [View Audit]                                           │    │
│ │                                                                       │    │
│ │ 10:28:18 [Marketing → CEO]   HANDOFF                                    │    │
│ │ "New qualified lead: TechStart (Score: 85). Proposal sent."          │    │
│ │ Lead ID: lead_101, Email: sent to contact@techstart.com              │    │
│ │ [Expand JSON] [View Client]                                           │    │
│ │                                                                       │    │
│ │ 10:25:03 [CEO → Marketing]    STATUS_UPDATE                             │    │
│ │ "Follow-up sent to Acme Corp (Day 7). Awaiting response."           │    │
│ │ Email ID: email_202, Type: FOLLOW_UP                                │    │
│ │ [Expand JSON]                                                          │    │
│ │                                                                       │    │
│ │ --- Older messages collaped (showing 50 of 1,247) [Load More] ---  │    │
│ └────────────────────────────────━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┘    │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Message Details (Click to Expand)                                │    │
│ ├────────────────────────────────────────────────────────────────────┤    │
│ │ {                                                                    │    │
│ │   "fromAgent": "CEO",                                              │    │
│ │   "toAgent": "CTO",                                                │    │
│ │   "taskId": "proj_123",                                             │    │
│ │   "type": "HANDOFF",                                                │    │
│ │   "payload": {                                                       │    │
│ │     "message": "Deal closed: DesignCo ($5k)",                       │    │
│ │     "projectId": "proj_123",                                         │    │
│ │     "milestone": "Planning",                                          │    │
│ │     "assignee": "CTO"                                                │    │
│ │   },                                                                 │    │
│ │   "timestamp": "2026-05-04T10:32:15Z",                             │    │
│ │   "success": true                                                     │    │
│ │ }                                                                    │    │
│ └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Filter Bar

**Design Specs:**
- Sticky at top, horizontal layout (wrap on mobile)
- 4 filter controls + search + export button

**Agent Filter (Multi-Select Dropdown):**
```typescript
// Component: AgentFilter
// Options: All, CEO, CTO, Marketing, SEO Specialist, Web Developer, Designer
// Multi-select enabled: can filter by multiple agents
// Shows count of messages per agent in parentheses
```

**Message Type Filter:**
```typescript
// Component: MessageTypeFilter
// Options: All Types, HANDOFF, STATUS_UPDATE, ASK, ERROR
// Icons: HANDOFF (→), STATUS_UPDATE (ℹ️), ASK (?), ERROR (🔴)
```

**Date Range Filter:**
```typescript
// Component: DateRangeFilter
// Options: Last 24h, Last 7 Days, Last 30 Days, Custom Range
// Custom range opens date picker (from/to)
```

**Search Bar:**
```typescript
// Component: SearchBar
// Searches across: payload JSON, agent names, task IDs, error messages
// Debounced: 300ms
// Highlight matching text in results
```

**Export Button:**
```typescript
// Component: ExportButton
// Options: Export as CSV, Export as JSON
// Exports filtered results (respects current filters)
// Max 10,000 records per export
```

**Show Audit Trail Toggle:**
```typescript
// Component: AuditToggle
// Checkbox: "Show Audit Trail"
// When checked, includes `AgentAuditLog` data in results
// Shows: agent API key (masked), tool name, inputs, success/failure
```

### 2. Live Message Feed (Main Panel)

**Design Specs:**
- Auto-scroll ON by default (green dot indicator)
- Pause button stops auto-scroll (yellow dot)
- Messages prepend at top (newest first)
- Color-coded by message type (left border: 4px)

**Message Card:**
```typescript
// Component: MessageCard
interface MessageCardProps {
  id: string;
  timestamp: Date;
  fromAgent: AgentType;
  toAgent?: AgentType; // undefined for broadcasts
  taskId?: string;
  type: MessageType;
  payload: Record<string, any>;
  success: boolean;
  error?: string;
  expanded: boolean; // toggled on click
}

// Visual:
// - Left border color: HANDOFF (blue), STATUS_UPDATE (gray), ASK (yellow), ERROR (red)
// - Agent badges: colored by agent (CEO=purple, CTO=blue, etc.)
// - Timestamp: relative time ("2 min ago") on hover shows full timestamp
// - Payload preview: first 100 chars of stringified JSON
// - Expand button: shows full JSON in monospace, collapsible
// - Action buttons: Retry (if ERROR), Escalate (if stuck), View Context (links to client/task)
```

**Auto-Scroll Logic:**
```typescript
// WebSocket connection to backend `/api/messages/stream`
// On new message event:
// 1. Prepend to message list (immer for immutability)
// 2. If auto-scroll ON: scroll to top (smooth)
// 3. Highlight new message (yellow bg for 2 seconds, fade out)
// 4. Play subtle notification sound (optional, user preference)
```

### 3. Message Details Panel (Expandable)

**Design Specs:**
- Shown when user clicks "Expand JSON" on a message
- Slides in from right (shadcn Dialog or drawer)
- Shows full message payload in monospace font
- Syntax highlighting for JSON

**Details Panel Content:**
```typescript
// Component: MessageDetailsPanel
{
  // Header
  title: "Message Details",
  messageId: "msg_123",
  timestamp: "2026-05-04 10:32:15 UTC",

  // Agent Info
  fromAgent: "CEO",
  toAgent: "CTO",
  taskId: "proj_123",

  // Message Type
  type: "HANDOFF",
  status: "SUCCESS", // or "ERROR"

  // Full Payload (JSON with syntax highlighting)
  payload: {
    "message": "Deal closed: DesignCo ($5k)",
    "projectId": "proj_123",
    "milestone": "Planning",
    "assignee": "CTO"
  },

  // Error Details (if applicable)
  error?: {
    code: "TASK_LOCKED",
    message: "Task proj_123 is locked by CTO since 10:20:00",
    retryCount: 2,
    maxRetries: 3
  },

  // Actions
  actions: [
    { label: "Retry", handler: () => retryMessage(msg.id) },
    { label: "Escalate to Human", handler: () => escalateMessage(msg.id) },
    { label: "View Task", handler: () => router.push(`/projects/${msg.taskId}`) }
  ]
}
```

## Real-Time Updates (WebSocket)

### WebSocket Connection
```typescript
// Hook: useMessageStream
// Connects to: `ws://localhost:3001/messages/stream` (dev) or `wss://prod/messages/stream`
// Headers: `Authorization: Bearer ${agentApiKey}` (for auth)

const useMessageStream = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/messages/stream`);

    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages(prev => [newMessage, ...prev]); // prepend new
    };
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    return () => ws.close();
  }, []);

  return { messages, isConnected };
};
```

### Event Types
- `message:logged` — New message logged via `log_agent_message` MCP tool
- `message:retry` — Failed message being retried
- `message:escalate` — Message escalated to human
- `agent:health` — Agent heartbeat update (every 10 min)

## Filters & Search Logic

### Frontend Filtering (Immediate)
- Agent filter: `messages.filter(m => m.fromAgent === selectedAgent)`
- Message type filter: `messages.filter(m => m.type === selectedType)`
- Search: `messages.filter(m => JSON.stringify(m).toLowerCase().includes(searchTerm))`

### Backend Filtering (via MCP Tool)
- When applying date range or "Show Audit Trail":
  - Call `get_agent_health` or query `AgentAuditLog` table
  - Refresh message list from backend
  - Merge with existing real-time messages (deduplicate by ID)

## Color Coding

| Message Type | Border Color | Badge Color | Icon |
|-------------|--------------|-------------|------|
| HANDOFF | Blue (`info`) | Blue badge | → |
| STATUS_UPDATE | Gray (`gray-400`) | Gray badge | ℹ️ |
| ASK | Yellow (`warning`) | Yellow badge | ? |
| ERROR | Red (`danger`) | Red badge, pulsing | 🔴 |

| Agent | Badge Color |
|-------|-------------|
| CEO | Purple (`ceo`) |
| CTO | Blue (`cto`) |
| Marketing | Green (`marketing`) |
| SEO Specialist | Yellow (`seo`) |
| Web Developer | Red (`developer`) |
| Designer | Pink (`designer`) |

## Error Handling in Feed

### Failed Message (ERROR type)
```typescript
// Visual treatment:
// - Red left border (4px)
// - Red badge: "ERROR"
// - Error message displayed prominently
// - "Retry" button (max 3 retries, then "Escalate" button appears)
// - Expand JSON shows error stack trace

{
  type: "ERROR",
  fromAgent: "SEO Specialist",
  toAgent: "CTO",
  error: {
    code: "API_RATE_LIMIT",
    message: "SEMrush API rate limit exceeded. Retry in 5 minutes.",
    retryAfter: 300, // seconds
    retryCount: 1
  }
}
```

### Stuck Message (No acknowledgment > 10 min)
```typescript
// Visual treatment:
// - Yellow background
// - Warning icon: "⚠️ No acknowledgment from CTO in 15 minutes"
// - "Escalate" button sends notification to CEO agent
```
