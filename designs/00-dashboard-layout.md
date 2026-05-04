# Main Dashboard Layout

## Overall Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Logo    Agency Management    [Search]    [Notifications]  [Profile]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Sidebar                      │  Main Content Area                        │
│                              │                                          │
│ 📊 Dashboard (active)        │  ┌────────────────────────────────────┐  │
│ 👥 Clients & Leads          │  │ Quick Stats                           │  │
│ 📁 Projects                 │  │ [Leads 12] [Deals 3] [Active 5]│  │
│ 📧 Communications           │  │ [SEO Score 87] [Uptime 99.9%]  │  │
│ 🔍 SEO Analytics            │  └────────────────────────────────────┘  │
│ 💰 Billing & Invoices     │                                          │
│ 🤖 Agent Dashboard         │  ┌──────────────┐ ┌──────────────┐    │
│ 💬 Inter-Agent Log         │  │ Pipeline      │ │ Agent Health  │    │
│ 🔄 Autonomous Monitor     │  │ (visual)     │ │ (status)     │    │
│ 🔒 Security Dashboard     │  └──────────────┘ └──────────────┘    │
│                              │                                          │
│ Settings                    │  ┌────────────────────────────────────┐  │
│                              │  │ Recent Activity                     │  │
│                              │  │ • Lead generated: Acme Corp       │  │
│                              │  │ • Deal closed: $5k - DesignCo   │  │
│                              │  │ • SEO audit complete: Client X    │  │
│                              │  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Sidebar Navigation Items

| Icon | Label | Path | Badge |
|------|-------|------|-------|
| 📊 | Dashboard | `/` | None |
| 👥 | Clients & Leads | `/clients` | Lead count (e.g., "12") |
| 📁 | Projects | `/projects` | Active project count |
| 📧 | Communications | `/communications` | Unread email count |
| 🔍 | SEO Analytics | `/seo-analytics` | Critical issues count |
| 💰 | Billing & Invoices | `/billing` | Pending invoice count |
| 🤖 | Agent Dashboard | `/agent-dashboard` | None |
| 💬 | Inter-Agent Log | `/inter-agent-log` | Failed message count |
| 🔄 | Autonomous Monitor | `/autonomous-monitor` | Stuck task count |
| 🔒 | Security Dashboard | `/security` | Security alert count |
| ⚙️ | Settings | `/settings` | None |

## Color Scheme (Tailwind CSS)

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // primary-500 (buttons, active states)
          600: '#2563eb',
          700: '#1d4ed',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Status colors
        success: '#10b981', // green - healthy, completed
        warning: '#f59e0b', // yellow - attention needed
        danger: '#ef4444', // red - stuck, failed
        info: '#3b82f6', // blue - info, in progress
        // Agent colors (for charts, badges)
        ceo: '#8b5cf6', // purple
        cto: '#3b82f6', // blue
        marketing: '#10b981', // green
        seo: '#f59e0b', // yellow
        developer: '#ef4444', // red
        designer: '#ec4899', // pink
      }
    }
  }
}
```

## Typography

- **Headings**: Inter, sans-serif (font-bold, tracking-tight)
- **Body**: Inter, sans-serif (font-normal, leading-relaxed)
- **Code/Monospace**: JetBrains Mono, monospace (for payloads, IDs)

## Component Library

Using **shadcn/ui** components (built on Radix UI + Tailwind):
- Button, Input, Select, Textarea (forms)
- Card, Table, Badge (data display)
- Dialog, DropdownMenu, Popover (overlays)
- Tabs, Tooltip, Separator (layout)
- Switch, Checkbox, RadioGroup (inputs)
- Toast (notifications)
- DataTable (advanced tables with sorting, filtering, pagination)

## Responsive Breakpoints

- **Mobile**: < 768px (sidebar collapses to hamburger icon)
- **Tablet**: 768px - 1024px (sidebar icon-only mode)
- **Desktop**: > 1024px (full sidebar)
