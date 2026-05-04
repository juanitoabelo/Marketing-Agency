#!/bin/bash
# Start Autonomous Loop - Abelo Creative
# Run this after dmux is installed.

set -e

echo "🚀 Starting Abelo Creative Autonomous Agent Loop..."

# Check if tmux is installed (required by dmux)
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install tmux
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y tmux
    elif command -v yum &> /dev/null; then
        sudo yum install -y tmux
    else
        echo "❌ Cannot install tmux automatically. Please install manually:"
        echo "   macOS: brew install tmux"
        echo "   Ubuntu/Debian: sudo apt-get install tmux"
        echo "   CentOS/RHEL: sudo yum install tmux"
        exit 1
    fi
fi

echo "✅ tmux version: $(tmux -V)"

# Check if dmux is installed
if ! command -v dmux &> /dev/null; then
    echo "❌ dmux not found. Installing..."
    npm install -g dmux
fi

echo "✅ dmux version: $(dmux --version)"

# Kill existing session if running
echo "🧹 Checking for existing session..."
if dmux list 2>/dev/null | grep -q "abelo-creative"; then
    echo "⚠️  Found existing session, killing..."
    dmux kill abelo-creative || true
fi

# Start new session
echo "📁 Creating dmux session: abelo-creative"
dmux new -s ceo \
  -a cto,marketing,seo_specialist,web_developer,designer \
  -p "You are the CEO of Abelo Creative. Autonomously generate leads, send proposals, close deals under \$10k, and manage projects. Check pending tasks every 30 minutes. Use opencode.json for agent definitions."

echo "✅ Session created! To attach: tmux attach -t abelo-creative"

# Wait for session to initialize
sleep 2

# Check status
echo ""
echo "📊 Checking agent status..."
dmux status abelo-creative 2>/dev/null || echo "⚠️  Status check failed, but session may still be starting..."

echo ""
echo "🎯 Next Steps:"
echo "  1. Attach to session: tmux attach -t abelo-creative"
echo "  2. Check CEO pane (0): dmux send -s abelo-creative -p 0 'Check pending tasks'"
echo "  3. Monitor logs: dmux logs -s abelo-creative"
echo ""
echo "🚀 Autonomous Loop Activated for Abelo Creative!"
