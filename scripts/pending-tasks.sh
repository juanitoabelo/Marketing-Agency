#!/bin/bash
# Check pending tasks (every 30 min) - Abelo Creative
curl -X POST http://localhost:3002/trigger/get_pending_tasks \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: ${CEO_AGENT_KEY}"
