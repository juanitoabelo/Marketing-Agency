# Cron & Scheduler Scripts - Abelo Creative

## Local Development (Crontab)

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily lead generation at 9 AM
0 9 * * * /path/to/repo/scripts/daily-lead-gen.sh >> /tmp/lead-gen.log 2>&1

# Weekly SEO audits on Mondays at 10 AM
0 10 * * 1 /path/to/repo/scripts/weekly-seo-audit.sh >> /tmp/seo-audit.log 2>&1

# Check pending tasks every 30 minutes
*/30 * * * * /path/to/repo/scripts/pending-tasks.sh >> /tmp/pending-tasks.log 2>&1

# Check stuck tasks every 30 minutes
*/30 * * * * /path/to/repo/scripts/stuck-task-check.sh >> /tmp/stuck-tasks.log 2>&1
```

## Production (Railway)

Railway cron jobs (in railway.json or dashboard):
```json
{
  "crons": [
    {
      "name": "daily-lead-gen",
      "schedule": "0 9 * * *",
      "command": "bash scripts/daily-lead-gen.sh"
    },
    {
      "name": "weekly-seo-audit",
      "schedule": "0 10 * * 1",
      "command": "bash scripts/weekly-seo-audit.sh"
    },
    {
      "name": "pending-tasks",
      "schedule": "*/30 * * * *",
      "command": "bash scripts/pending-tasks.sh"
    }
  ]
}
```

## Environment Variables Needed

- `MARKETING_AGENT_KEY` — from `mcp-server/.env`
- `SEO_SPECIALIST_AGENT_KEY` — from `mcp-server/.env`
- `CEO_AGENT_KEY` — from `mcp-server/.env`
- `CEO_JWT` — JWT token for backend API

## Monitor Logs

```bash
tail -f /tmp/lead-gen.log
tail -f /tmp/seo-audit.log
tail -f /tmp/pending-tasks.log
tail -f /tmp/stuck-tasks.log
```
