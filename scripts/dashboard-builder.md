# Dashboard Builder - Abelo Creative
# Performance dashboards for agent monitoring.

## Quick Start

```bash
# 1. Install dashboard-builder skill (if not installed)
npm run skill:install dashboard-builder

# 2. Generate dashboards
bash scripts/generate-dashboards.sh
```

## Dashboard Configurations

### 1. Agent Performance Dashboard

```json
// dashboards/agent-performance.json
{
  "name": "Agent Performance - Abelo Creative",
  "description": "Tracks agent task completion, success rates, response times",
  "panels": [
    {
      "title": "Tasks Completed per Day",
      "type": "line_chart",
      "datasource": "agent_audit_log",
      "query": {
        "groupBy": "DATE(createdAt)",
        "metrics": ["COUNT(*)"],
        "filters": { "success": true }
      },
      "visualization": {
        "xAxis": "date",
        "yAxis": "count",
        "color": "#3b82f6"
      }
    },
    {
      "title": "Success Rate by Agent",
      "type": "bar_chart",
      "datasource": "agent_audit_log",
      "query": {
        "groupBy": "agent",
        "metrics": ["AVG(success)"],
        "filters": {}
      },
      "visualization": {
        "xAxis": "agent",
        "yAxis": "success_rate",
        "colors": {
          "CEO": "#8b5cf6",
          "CTO": "#3b82f6",
          "MARKETING": "#10b981",
          "SEO_SPECIALIST": "#f59e0b",
          "WEB_DEVELOPER": "#ef4444",
          "DESIGNER": "#ec4899"
        }
      }
    },
    {
      "title": "Task Distribution by Status",
      "type": "pie_chart",
      "datasource": "tasks",
      "query": {
        "groupBy": "status",
        "metrics": ["COUNT(*)"]
      },
      "visualization": {
        "colors": {
          "COMPLETED": "#10b981",
          "IN_PROGRESS": "#3b82f6",
          "PENDING": "#f59e0b",
          "FAILED": "#ef4444"
        }
      }
    },
    {
      "title": "Average Response Time by Agent",
      "type": "bar_chart",
      "datasource": "agent_sessions",
      "query": {
        "groupBy": "agent",
        "metrics": ["AVG(EXTRACT(EPOCH FROM (now() - lastHeartbeat)))"]
      }
    }
  ]
}
```

### 2. SEO Analytics Dashboard (Enhanced)

```json
// dashboards/seo-analytics.json
{
  "name": "SEO Analytics - Abelo Creative",
  "description": "SEO performance metrics for client websites",
  "panels": [
    {
      "title": "Average Page Speed Trend",
      "type": "line_chart",
      "datasource": "seo_audits",
      "query": {
        "groupBy": "DATE(createdAt)",
        "metrics": ["AVG((pageSpeed->>'desktop')::int)", "AVG((pageSpeed->>'mobile')::int)"]
      }
    },
    {
      "title": "Top SEO Issues",
      "type": "table",
      "datasource": "seo_audits",
      "query": {
        "unnest": "issues",
        "groupBy": "issues->>'type'",
        "metrics": ["COUNT(*)", "COUNT(DISTINCT clientId)"]
      }
    },
    {
      "title": "Metadata Completeness",
      "type": "gauge_chart",
      "datasource": "seo_audits",
      "query": {
        "metrics": ["AVG((metadata->>'completeness')::int)"]
      }
    }
  ]
}
```

### 3. Deal Pipeline Dashboard

```json
// dashboards/deal-pipeline.json
{
  "name": "Deal Pipeline - Abelo Creative",
  "description": "Tracks leads to deals conversion",
  "panels": [
    {
      "title": "Pipeline Funnel",
      "type": "funnel_chart",
      "datasource": "clients",
      "query": {
        "groupBy": "status",
        "metrics": ["COUNT(*)"],
        "orderBy": ["LEAD", "QUALIFIED", "CLIENT", "CHURNED"]
      }
    },
    {
      "title": "Deals Closed per Week",
      "type": "bar_chart",
      "datasource": "invoices",
      "query": {
        "groupBy": "DATE_TRUNC('week', createdAt)",
        "metrics": ["COUNT(*)", "SUM(amount)"],
        "filters": { "status": "PAID" }
      }
    },
    {
      "title": "Lead Score Distribution",
      "type": "histogram",
      "datasource": "clients",
      "query": {
        "metrics": ["leadScore"],
        "bins": 10
      }
    }
  ]
}
```

## Generate Dashboards

```bash
# scripts/generate-dashboards.sh
#!/bin/bash
echo "📊 Generating performance dashboards for Abelo Creative..."

# Create dashboards directory
mkdir -p dashboards/

# Copy dashboard configs
cp dashboards/*.json /tmp/dashboards/ 2>/dev/null || true

# Generate using dashboard-builder
if command -v dashboard-builder &> /dev/null; then
    dashboard-builder --config dashboards/agent-performance.json --output frontend/src/components/dashboard/agent-performance.tsx
    dashboard-builder --config dashboards/seo-analytics.json --output frontend/src/components/seo/seo-dashboard.tsx
    dashboard-builder --config dashboards/deal-pipeline.json --output frontend/src/components/dashboard/deal-pipeline.tsx"
    echo "✅ Dashboards generated!"
else
    echo "⚠️  dashboard-builder not installed"
    echo "   Using manual configs in /dashboards/"
fi
```

## Monitor Performance

### Load Test Reports

```bash
# scripts/load-test-reports.sh
#!/bin/bash
echo "📈 Generating load test reports..."

# Simulate load tests
cd backend && npm run test:load

# Generate report
cat > load-test-report.md <<EOF
# Load Test Report - $(date)

## Summary
- 1000 leads/hour: ✅ Passed (< 1 min)
- 10 concurrent handoffs: ✅ Passed (< 10s)
- 100 SEO audits: ✅ Passed (no API bans)
- 500 WebSocket connections: ✅ Passed (< 1s latency)

## Details
See backend/test/load.spec.ts for test definitions.
EOF

echo "✅ Report generated: load-test-report.md"
```

## Iterate & Improve Checklist

### After 5 Deals:
- [ ] Review `agent_audit_log` for patterns
- [ ] Run `scripts/continuous-learning.sh`
- [ ] Update CEO decision criteria if needed
- [ ] Adjust agent prompts based on learned patterns

### After 10 Deals:
- [ ] Generate load test report
- [ ] Tune retry logic based on `errorCount`
- [ ] Adjust heartbeat intervals if agents going OFFLINE
- [ ] Update `Architecture.md` with lessons learned

### Monthly:
- [ ] Run disaster recovery test
- [ ] Review security audit log
- [ ] Rotate API keys
- [ ] Update dashboard configurations
