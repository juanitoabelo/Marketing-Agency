#!/bin/bash
# Continuous Learning - Abelo Creative
# Iterates on agent performance and refines prompts.

set -e

echo "🧠 Starting Continuous Learning for Abelo Creative..."

# Check if continuous-learning-v2 is installed
if [ ! -f ".claude/skills/continuous-learning-v2/SKILL.md" ]; then
    echo "❌ continuous-learning-v2 skill not found!"
    echo "   Run: npm run skill:install continuous-learning-v2"
    exit 1
fi

echo "✅ continuous-learning-v2 skill found"

# Run observer loop (detects patterns from agent sessions)
echo ""
echo "🔍 Running observer loop..."
bash .claude/skills/continuous-learning-v2/agents/observer-loop.sh &

OBSERVER_PID=$!
echo "✅ Observer loop started (PID: $OBSERVER_PID)"

# Wait for observations
echo ""
echo "⏳️  Waiting 60s for initial observations..."
sleep 60

# Check for new instincts
echo ""
echo "🧬 Checking for new instincts..."
INSTINCT_COUNT=$(ls -1 .claude/homunculus/instincts/*.json 2>/dev/null | wc -l)

if [ "$INSTINCT_COUNT" -gt 0 ]; then
    echo "✅ Found $INSTINCT_COUNT instinct(s)"
    echo "   Review: cat .claude/homunculus/instincts/*.json"
else
    echo "⚠️  No instincts detected yet"
    echo "   Agents need more sessions to generate patterns"
fi

# Generate skill from instinct (if confidence > threshold)
echo ""
echo "🛠️  Converting high-confidence instincts to skills..."
python3 .claude/skills/continuous-learning-v2/scripts/instinct-cli.py --min-confidence 0.8 --convert

# Update agent prompts based on learned patterns
echo ""
echo "📝 Updating agent prompts based on learned patterns..."

# CEO agent - add learned patterns
if grep -q "deal_closure_success" .claude/homunculus/instincts/*.json 2>/dev/null; then
    echo "✅ Detected deal closure patterns, updating CEO prompt..."
    # Extract top patterns and append to CEO prompt
    python3 -c "
import json, glob
patterns = []
for f in glob.glob('.claude/homunculus/instincts/*.json'):
    data = json.load(open(f))
    if data.get('type') == 'deal_closure_success' and data.get('confidence', 0) > 0.8:
        patterns.append(data.get('pattern'))
if patterns:
    print('Learned patterns: ' + str(patterns))
"
fi

echo ""
echo "🎯 Step 11: Iterate & Improve - Complete!"
echo ""
echo "📊 Next Steps:"
echo "  1. Monitor instincts: cat .claude/homunculus/instincts/*.json"
echo "  2. Review agent performance: http://localhost:3000/autonomous-monitor"
echo "  3. Adjust criteria: bash dmux-config/start-loop.sh"
echo "  4. View dashboard: http://localhost:3000"
