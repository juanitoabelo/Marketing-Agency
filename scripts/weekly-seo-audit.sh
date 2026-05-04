#!/bin/bash
# Weekly SEO audits (Mondays 10 AM) - Abelo Creative
curl -X POST http://localhost:3002/trigger/trigger_seo_audit \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: ${SEO_SPECIALIST_AGENT_KEY}"
