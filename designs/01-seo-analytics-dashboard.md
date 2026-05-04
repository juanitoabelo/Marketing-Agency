# SEO Analytics Dashboard - Design Mockup

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 SEO Analytics Dashboard          [Filter: All Clients ▼] [Date: Last 30d ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│ │ Page Speed      │ │ Core Web Vitals │ │ Metadata        │       │
│ │ [Score: 87/100]│ │ LCP: 2.3s ✅   │ │ Title: 95% ✅   │       │
│ │ Desktop: 92    │ │ FID: 85ms ✅   │ │ Desc: 88% ⚠️  │       │
│ │ Mobile: 82 ⚠️ │ │ CLS: 0.05 ✅   │ │ Keywords: 72% ⚠️│       │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘       │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ SEO Audit Results (Last 10 Audits)                           │    │
│ ├────────────────────────────────────────────────────────────────┤    │
│ │ Client        │ Date       │ Speed │ Vitals │ Meta │ Issues │ Action │    │
│ │ Acme Corp    │ 2026-05-04 │ 92    │ ✅     │ ⚠️   │ 3      │ View   │    │
│ │ DesignCo     │ 2026-05-03 │ 78 ⚠️  │ ⚠️     │ ✅    │ 7      │ View   │    │
│ │ TechStart    │ 2026-05-01 │ 88    │ ✅     │ ✅    │ 1      │ View   │    │
│ │ ...          │            │       │        │       │        │        │    │
│ └────────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│ ┌──────────────────┐ ┌──────────────────┐                        │
│ │ Keyword Ranking │ │ LLM Citations  │                        │
│ │ 1. "marketing  │ │ Detected in:   │                        │
│ │    agency" - #5 │ │ • ChatGPT (3x) │                        │
│ │ 2. "web design"│ │ • Perplexity(2x)│                        │
│ │    - #12       │ │ • Claude (1x) │                        │
│ │ [View Trends ▼] │ │ [View Details] │                        │
│ └──────────────────┘ └──────────────────┘                        │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Critical Issues (Needs Immediate Attention)                     │    │
│ ├────────────────────────────────────────────────────────────────┤    │
│ │ 🔴 DesignCo - Missing meta description on 5 pages             │    │
│ │ 🔴 TechStart - Page speed mobile: 62 (below threshold)       │    │
│ │ 🟡 Acme Corp - Keyword density low for target term             │    │
│ └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Overview Cards (Top Row)

**Design Specs:**
- 3 cards in a responsive grid (1 col mobile, 3 cols desktop)
- Card height: 140px
- Background: white with subtle border (`border-gray-200`)
- Each card has: icon, main metric (large), sub-metrics (smaller)

**Page Speed Card:**
```typescript
// Component: PageSpeedCard
// Data from: `get_seo_analytics` MCP tool
{
  title: "Page Speed",
  score: 87, // 0-100, color-coded: green >80, yellow 60-80, red <60
  desktop: 92,
  mobile: 82, // Warning icon if <85
  trend: "+3% vs last period" // green if positive, red if negative
}
```

**Core Web Vitals Card:**
```typescript
// Component: CoreWebVitalsCard
{
  title: "Core Web Vitals",
  lcp: { value: "2.3s", status: "good" }, // <2.5s = good, 2.5-4s = needs improvement, >4s = poor
  fid: { value: "85ms", status: "good" }, // <100ms = good
  cls: { value: "0.05", status: "good" }, // <0.1 = good
}
```

**Metadata Completeness Card:**
```typescript
// Component: MetadataCard
{
  title: "Metadata",
  titleCompleteness: 95, // percentage
  descCompleteness: 88, // warning if <90
  keywordsCoverage: 72, // warning if <80
  missingPages: 3 // click to see which pages
}
```

### 2. SEO Audit Results Table

**Design Specs:**
- Full-width table with horizontal scroll on mobile
- Columns: Client, Date, Speed Score, Core Vitals (icons), Metadata (icons), Issues Count, Action
- Row height: 60px
- Status icons: ✅ (good), ⚠️ (warning), 🔴 (critical)
- "View" button opens slide-over panel (shadcn Dialog) with audit details

**Table Data (from `log_seo_audit` MCP tool):**
```typescript
// Component: AuditResultsTable
interface AuditRow {
  clientId: string;
  clientName: string;
  date: Date;
  pageSpeed: { desktop: number; mobile: number };
  coreVitals: { lcp: number; fid: number; cls: number };
  metadata: { title: boolean; description: boolean; keywords: boolean };
  issues: Array<{ type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; message: string }>;
}
```

### 3. Keyword Rankings & LLM Citations

**Keyword Ranking Component:**
```typescript
// Component: KeywordRankingChart (Recharts - LineChart)
// Data: historical keyword positions over time
{
  keywords: [
    { term: "marketing agency", positions: [8, 7, 6, 5] }, // last 4 weeks
    { term: "web design", positions: [15, 13, 12, 12] },
    { term: "SEO services", positions: [22, 20, 18, 17] },
  ],
  timeframe: "Last 30 Days" // filter dropdown
}
```

**LLM Citations Component:**
```typescript
// Component: LLMCitationTracker
{
  totalCitations: 6,
  bySource: [
    { source: "ChatGPT", count: 3, trend: "+1" },
    { source: "Perplexity", count: 2, trend: "0" },
    { source: "Claude", count: 1, trend: "+1" },
  ],
  context: [ // where were we cited
    { url: "...", snippet: "...marketing agency services..." },
    { url: "...", snippet: "...best web design firm..." },
  ]
}
```

### 4. Critical Issues Section

**Design Specs:**
- Red border-left (4px) for HIGH severity
- Yellow border-left for MEDIUM severity
- Click to expand: full issue details, affected pages, recommended fix

**Issue Card:**
```typescript
// Component: CriticalIssueCard
{
  severity: "HIGH", // determines border color
  client: "DesignCo",
  issue: "Missing meta description on 5 pages",
  impact: "Reduced CTR in search results",
  fix: "Add unique meta descriptions to: /services, /about, /contact, /portfolio, /blog",
  autoFixAvailable: true, // shows "Auto-Fix" button if CEO agent approves
}
```

## Filters & Controls

### Client Filter (Dropdown)
- Options: "All Clients", "Acme Corp", "DesignCo", "TechStart"...
- Default: "All Clients"
- Changes data across all components via `get_seo_analytics` MCP tool with `clientId` param

### Date Range Filter
- Options: "Last 7 Days", "Last 30 Days", "Last 90 Days", "Custom Range"
- Default: "Last 30 Days"
- Changes data via `get_seo_analytics` MCP tool with `startDate` and `endDate` params

## Real-Time Updates (WebSocket)

- Subscribe to `seo-audit-logged` events via WebSocket
- When SEO Specialist logs new audit via `log_seo_audit` MCP tool:
  - Table appends new row (highlight briefly with yellow bg, fade out)
  - Overview cards recalculate (if client filter allows)
  - Critical issues section updates (if new HIGH severity issues)
  - Toast notification: "New SEO audit logged for Acme Corp"

## Color Coding Logic

| Metric | Green (Good) | Yellow (Warning) | Red (Critical) |
|--------|--------------|------------------|-----------------|
| Page Speed (Desktop) | ≥ 90 | 70-89 | < 70 |
| Page Speed (Mobile) | ≥ 85 | 65-84 | < 65 |
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| Metadata Completeness | ≥ 90% | 70-89% | < 70% |
| Keyword Coverage | ≥ 80% | 60-79% | < 60% |
