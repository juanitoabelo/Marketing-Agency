#!/bin/bash
# Start Autonomous Loop - Abelo Creative
# Run this after dmux is installed

set -e

echo "🚀 Starting Abelo Creative Autonomous Agent Loop..."

# Check if dmux is installed
if ! command -v dmux &> /dev/null; then
    echo "❌ dmux not found. Installing..."
    npm install -g dmux
fi

echo "✅ dmux version: $(dmux --version)"

# Kill existing session if running
echo "🧹 Checking for existing session..."
if dmux list | grep -q "abelo-creative"; then
    echo "⚠️  Found existing session, killing..."
    dmux kill abelo-creative || true
fi

# Start new session
echo "📁 Creating dmux session: abelo-creative"
dmux new -s ceo \
  -a cto,marketing,seo_specialist,web_developer,designer \
  -p "You are the CEO of Abelo Creative. Autonomously generate leads, send proposals, close deals under \$10k, and manage projects. Check pending tasks every 30 minutes. Use opencode.json for agent definitions."

echo "✅ Session created!"

# Wait for session to initialize
sleep 2

# Check status
echo ""
echo "📊 Checking agent status..."
dmux status abelo-creative || echo "⚠️  Status check failed, but session may still be starting..."

echo ""
echo "🎯 Next Steps:"
echo "  1. Attach to session: tmux attach -t abelo-creative"
echo "  2. Check CEO pane (0): dmux send -s abelo-creative -p 0 'Check pending tasks via get_pending_tasks MCP tool'"
echo "  3. Monitor logs: dmux logs -s abelo-creative"
echo "  4. Verify dashboard: http://localhost:3000"
echo ""
echo "🚀 Autonomous Loop Activated for Abelo Creative!"
