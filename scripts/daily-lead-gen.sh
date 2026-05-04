#!/bin/bash
# Daily lead generation (9 AM) - Abelo Creative
curl -X POST http://localhost:3002/trigger/trigger_lead_generation \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: ${MARKETING_AGENT_KEY}" \
  -d '{"count": 10}'
