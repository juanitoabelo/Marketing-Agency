# CEO Decision Criteria Adjustment - Abelo Creative

## Current Criteria (from Architecture.md)

### Auto-Close Deal If ALL Conditions Met:
1. **Lead Score** ≥ 80 (from Marketing agent qualification)
2. **Deal Value** < $10,000
3. **Client Has Verified Payment Method** (Stripe customer with valid card)
4. **Proposal Opened** and viewed for > 30 seconds (tracked via email-ops pixel)

### Escalate to Human If ANY Condition Met:
1. **Deal Value** ≥ $10,000
2. **Lead Score** < 80
3. **Client Requests Custom Contract Terms**
4. **Payment Method Verification Fails** (Stripe error)
5. **Proposal Not Opened** after 3 follow-ups (14 days)

## How to Adjust Criteria

### Option 1: Edit opencode.json Directly
```bash
# Edit the CEO agent prompt in opencode.json
nano opencode.json

# Find the "ceo" section and update the prompt:
  "ceo": {
      "description": "Orchestrates the entire project and makes final business decisions for Abelo Creative.",
      "mode": "primary",
      "prompt": "You are the CEO of Abelo Creative. Your goal is to oversee project milestones, manage the task list, and coordinate between the CTO, Marketing, and Development teams to ensure project delivery and deal closure.

Decision Criteria for Autonomous Deal Closure:
- Auto-close deals if: lead score ≥ 80, deal value < \$15k, client has verified payment, proposal viewed > 30s.
- Escalate to human if: deal value ≥ \$15k, lead score < 80, custom terms requested, payment fails, proposal not opened after 14 days.

When escalating, pause workflow and send email to admin via email-ops."
    }
```

### Option 2: Update Architecture.md
Edit `Architecture.md` → "CEO Decision Criteria" section, then restart agents.

### Option 3: Runtime Adjustment via Dashboard
1. Go to: http://localhost:3000/autonomous-monitor
2. Click "Settings ⚙" button
3. Adjust sliders:
   - Min Lead Score: 80 → 85
   - Max Deal Value: \$10k → \$15k
   - Proposal View Time: 30s → 45s
4. Click "Save" → Updates configuration
5. CEO agent receives: "Decision criteria updated"

## Recommended Adjustments (After 5 Deals)

### If Too Many Escalations:
- Lower min lead score: 80 → 75
- Raise max deal value: \$10k → \$15k
- Reduce follow-up count: 3 → 2

### If Deals Too Risky:
- Raise min lead score: 80 → 85
- Lower max deal value: \$10k → \$8k
- Increase proposal view time: 30s → 60s

### If Missing Qualified Leads:
- Add criteria: "Company revenue > \$1M"
- Add criteria: "Industry: tech/design/agency preferred"
- Add criteria: "Location: US/EU preferred"

## Verification After Adjustment

### 1. Check CEO Agent Receives Update
```bash
# Send test command to CEO pane
dmux send -s abelo-creative -p 0 "Decision criteria have been updated. Please confirm new criteria."
```

### 2. Verify via Dashboard
1. Go to http://localhost:3000/autonomous-monitor
2. Check "CEO" agent card
3. Click "View Details" → Should show updated criteria

### 3. Test with Simulated Deal
```bash
# Use CEO agent to simulate deal evaluation
dmux send -s abelo-creative -p 0 "Evaluate deal: client_123, score=85, value=\$12k. Should I auto-close or escalate?"
```

## Rollback
If adjustments cause issues:
1. Revert `opencode.json` → `git checkout opencode.json`
2. Restart loop: `bash dmux-config/start-loop.sh`
