# Security Dashboard - Design Mockup

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔒 Security Dashboard    [Rotate Keys] [Run Audit] [Export Report]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌────────────────────────┐ ┌────────────────────────┐                  │
│ │ Access Control       │ │ Security Events      │                  │
│ ├────────────────────────┤ ├────────────────────────┤                  │
│ │ Agent API Keys:      │ │ Failed Auth: 2       │                  │
│ │ 🟢 CEO (active)     │ │ Rate Limit: 5       │                  │
│ │ 🟢 CTO (active)     │ │ Suspicious: 0        │                  │
│ │ 🟢 Marketing (active)│ │ Blocked IPs: 0      │                  │
│ │ 🟢 SEO (active)      │ │                      │                  │
│ │ 🟢 Web Dev (active)  │ │ [View All Events]   │                  │
│ │ 🟢 Designer (active) │ │                      │                  │
│ │                        │ │                      │                  │
│ │ [Rotate All Keys]     │ │                      │                  │
│ └────────────────────────┘ └────────────────────────┘                  │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Rate Limiting by Agent                                             │    │
│ ├────────────────────────────────────────────────────────────────────┤    │
│ │ CEO:        [||||||||||    ] 45/100 req/min                       │    │
│ │ CTO:        [||||          ] 20/50 req/min                        │    │
│ │ Marketing:   [||||||||||||] 60/200 req/min                       │    │
│ │ SEO:        [||            ] 8/50 req/min                         │    │
│ │ Web Dev:    [|             ] 5/50 req/min                         │    │
│ │ Designer:   [|             ] 3/50 req/min                         │    │
│ └────────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Backup & Disaster Recovery Status                                │    │
│ ├────────────────────────────────────────────────────────────────────┤    │
│ │ Database:   ✅ Last backup: 2h ago, Retention: 30 days        │    │
│ │ File Storage: ✅ Last sync: 1h ago, S3 bucket: active         │    │
│ │ Agent State: ✅ Last save: 5min ago, Recovery: <1min          │    │
│ │                                                                  │    │
│ │ [Trigger Manual Backup] [Test Recovery] [View Backup Logs]       │    │
│ └────────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Audit Trail (Last 50 Events)                                    │    │
│ ├────────────────────────────────────────────────────────────────────┤    │
│ │ 10:35:22 CEO        create_client      ✅                        │    │
│ │ 10:34:15 Marketing  update_lead_status   ✅                     │    │
│ │ 10:32:10 SEO        log_seo_audit       ❌ Rate limit exceeded  │    │
│ │ 10:30:05 CTO        get_agent_health     ✅                        │    │
│ │ ...                                                              │    │
│ │ [Export Full Audit Log]                                           │    │
│ └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Access Control Panel

**Design Specs:**
- Shows all agent API keys with status (active, inactive, expired)
- CEO agent only can rotate keys (RBAC enforcement)
- Masked API keys shown (first 8 chars + "...")

**Agent API Key Card:**
```typescript
// Component: AgentApiKeyCard
interface AgentApiKeyCardProps {
  agent: AgentType;
  apiKeyMasked: string; // e.g., "ceo_1234..."
  status: "active" | "inactive" | "expired";
  lastUsed: Date;
  rateLimit: { max: number; current: number }; // e.g., 100, 45
}

// Visual:
// - Agent name (bold, colored by agent)
// - API key: masked (e.g., "ceo_1234..."), click "Show" to reveal (CEO only)
// - Status dot: green (active), gray (inactive), red (expired)
// - Last used: relative time ("2 min ago")
// - Rate limit: progress bar (green <80%, yellow 80-95%, red >95%)
// - "Rotate Key" button (CEO only, opens confirmation dialog)
// - "Disable Agent" button (emergency kill switch, CEO only)
```

**Rotate All Keys Button:**
```typescript
// Action: Rotate API keys for all agents
// Confirmation: "This will invalidate all current API keys. Agents will need to reconnect."
// Calls: Backend endpoint to generate new keys, update `AGENT_API_KEYS` env var
// Feedback: "Keys rotated successfully. New keys:"
// - CEO: ceo_5678...
// - CTO: cto_9012...
// - etc.
// Agents will auto-reconnect using new keys (stored in dmux session config)
```

### 2. Security Events Log

**Design Specs:**
- Real-time event feed (similar to Inter-Agent Communication Log but for security)
- Event types: Failed Auth, Rate Limit Violation, Suspicious Input, Blocked IP
- Color-coded by severity

**Security Event:**
```typescript
// Component: SecurityEventRow
interface SecurityEventRowProps {
  timestamp: Date;
  type: "FAILED_AUTH" | "RATE_LIMIT" | "SUSPICIOUS_INPUT" | "BLOCKED_IP";
  agent?: AgentType;
  ip?: string;
  details: string; // e.g., "API key invalid", "200 req/min exceeded"
  severity: "LOW" | "MEDIUM" | "HIGH";
}

// Visual:
// - Timestamp (relative time on hover)
// - Event type badge: red (FAILED_AUTH, BLOCKED_IP), yellow (RATE_LIMIT), blue (SUSPICIOUS_INPUT)
// - Agent badge (if applicable, colored by agent)
// - Details: truncated to 80 chars, expandable
// - Severity icon: 🔴 (HIGH), ⚠️ (MEDIUM), ℹ️ (LOW)
```

**Alert Threshold:**
```typescript
// If >10 failed auth attempts in 5 minutes:
// 1. Alert CEO agent via `log_agent_message` MCP tool
// 2. Show red banner at top of dashboard: "🚨 Security Alert: 12 failed auth attempts in 5 min"
// 3. Auto-block IP (if not whitelisted)
// 4. Send email to admin via `email-ops`
```

### 3. Rate Limiting Display

**Design Specs:**
- Horizontal progress bars for each agent
- Shows current usage vs max limit
- Color-coded: green (<80%), yellow (80-95%), red (>95%)

**Rate Limit Bar:**
```typescript
// Component: RateLimitBar
interface RateLimitBarProps {
  agent: AgentType;
  maxRequests: number; // from Architecture.md (CEO: 100, Marketing: 200, etc.)
  currentRequests: number; // from in-memory counter or Redis
  windowSeconds: number; // 60 seconds (per minute)
}

// Visual:
// - Agent name (colored)
// - Progress bar: width = (current / max) * 100%
// - Label: "45/100 req/min"
// - Color: green if <80%, yellow if 80-95%, red if >95%
// - If >95%: warning icon, "Approaching limit"
// - If exceeded: red banner, "Rate limit exceeded. Agent blocked for 60s."
```

### 4. Backup & Disaster Recovery Status

**Design Specs:**
- 3 status cards (Database, File Storage, Agent State)
- Shows last backup/sync time, retention policy
- CEO can trigger manual backup or test recovery

**Backup Status Card:**
```typescript
// Component: BackupStatusCard
interface BackupStatusCardProps {
  type: "Database" | "FileStorage" | "AgentState";
  status: "success" | "warning" | "error";
  lastBackup: Date; // "2h ago"
  retention: string; // "30 days"
  location: string; // "Supabase", "S3 bucket", "PostgreSQL"
  nextBackup?: Date; // optional, for scheduled backups
}

// Visual:
// - Type icon: 💾 (Database), 📁 (File Storage), 🤖 (Agent State)
// - Status dot: green (success), yellow (warning if >24h), red (error if >48h)
// - Last backup: relative time, red if >24h
// - Retention: text
// - Location: text
// - Action buttons:
//   - "Trigger Manual Backup" (calls `backup_database` MCP tool or runs script)
//   - "Test Recovery" (simulates failure, verifies restore from backup)
//   - "View Logs" (opens backup log modal)
```

**Disaster Recovery Test Button:**
```typescript
// Action: Run monthly disaster recovery test
// Calls: Backend script to:
// 1. Simulate DB failure (restore from backup to temp DB)
// 2. Simulate MCP server crash (restart, verify state recovery)
// 3. Simulate frontend/backend down (verify auto-rollback)
// Results logged to `agent_audit_log`:
// - "DR Test: DB restore successful (1.2s)"
// - "DR Test: MCP server restart successful (3.5s)"
// - "DR Test: Frontend rollback successful (0.8s)"
// - Overall: "PASS" or "FAIL" (with details)
```

### 5. Audit Trail Table

**Design Specs:**
- Table of last 50 MCP tool calls (from `AgentAuditLog` table)
- Columns: Timestamp, Agent, Tool Name, Success/Failed, Details
- Export full audit log (7-year retention, compliance requirement)

**Audit Trail Row:**
```typescript
// Component: AuditTrailRow
interface AuditTrailRowProps {
  timestamp: Date;
  agent: AgentType;
  tool: string; // MCP tool name
  inputs: Record<string, any>; // sanitized (no API keys, passwords)
  success: boolean;
  error?: string; // only if failed
}

// Visual:
// - Timestamp (relative time on hover shows full timestamp)
// - Agent badge (colored)
// - Tool name: monospace font, clickable (shows full inputs in modal)
// - Status: ✅ (success, green), ❌ (failed, red)
// - Details: truncated inputs (first 50 chars), expandable to full JSON
// - If failed: error message shown in red, "Retry" button (CEO only)
```

**Export Full Audit Log:**
```typescript
// Action: Export all audit logs (not just last 50)
// Formats: CSV, JSON
// Date range selector: "Last 7 days", "Last 30 days", "Custom Range"
// Filters: Agent (multi-select), Tool (multi-select), Success only/Failed only
// Max export: 100,000 records (for performance)
// Compliance note: "Logs retained for 7 years as per business record requirements"
```

## Emergency Controls

### Disable Agent Button (Emergency Kill Switch)

**Design Specs:**
- Red button, only visible to CEO agent (RBAC)
- Disables agent immediately (stops dmux pane, revokes API key)
- Requires confirmation

```typescript
// Action: Disable specific agent
// Confirmation: "Disable Marketing agent? All pending tasks will be reassigned to CEO."
// Calls:
// 1. `dmux kill-pane -t marketing` (stop agent)
// 2. Revoke API key (update `AGENT_API_KEYS` env var)
// 3. Reassign pending tasks to CEO agent
// 4. Log to `agent_audit_log`: "Agent Marketing disabled by CEO"
// Feedback: "Marketing agent disabled. 3 pending tasks reassigned to CEO."
```

### Enable/Disable Rate Limiting Toggle

```typescript
// Toggle: Enable/Disable rate limiting
// If disabled: agents can make unlimited requests (not recommended, for debugging only)
// Warning banner: "⚠️ Rate limiting disabled. System vulnerable to abuse."
// CEO only (RBAC)
```

## Real-Time Updates (WebSocket)

- Subscribe to `security:event` events
- When security event occurs:
  - Update Security Events Log (prepend new event)
  - Update Rate Limiting Display (if rate limit exceeded)
  - Show alert banner if >10 failed attempts in 5 min
  - Update Audit Trail table (if tool call failed due to security)

## Color Coding

| Severity | Color | Badge | Icon |
|----------|-------|-------|------|
| HIGH | Red (`danger`) | Red badge | 🔴 |
| MEDIUM | Yellow (`warning`) | Yellow badge | ⚠️ |
| LOW | Blue (`info`) | Blue badge | ℹ️ |

| Status | Color | Dot |
|--------|-------|-----|
| Active/Healthy | Green (`success`) | 🟢 |
| Inactive/Warning | Yellow (`warning`) | 🟡 |
| Expired/Error | Red (`danger`) | 🔴 |
| Offline | Gray (`gray-400`) | ⚪ |
