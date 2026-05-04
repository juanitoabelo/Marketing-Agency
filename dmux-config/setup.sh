#!/bin/bash
# Setup script for dmux orchestration - Abelo Creative
# Run this after installing dmux: npm install -g dmux

set -e

echo "🚀 Setting up dmux for Abelo Creative autonomous agent workflow..."

# Check if dmux is installed
if ! command -v dmux &> /dev/null; then
    echo "❌ dmux not found. Installing..."
    npm install -g dmux
fi

echo "✅ dmux version: $(dmux --version)"

# Create dmux session for Abelo Creative
echo "📁 Creating dmux session: abelo-creative"

dmux new -s ceo \
  -a cto,marketing,seo_specialist,web_developer,designer \
  -p "You are the CEO of Abelo Creative. Autonomously generate leads, send proposals, close deals under \$10k, and manage projects. Check pending tasks every 30 minutes. Use opencode.json for agent definitions."

echo "✅ dmux session created!"

# Display session info
echo ""
echo "📊 Session Info:"
dmux list

echo ""
echo "🎯 Next Steps:"
echo "  1. Start the autonomous loop: dmux start abelo-creative"
echo "  2. Check agent status: dmux status abelo-creative"
echo "  3. Send command to CEO: dmux send -s abelo-creative -p 0 'Check pending tasks'"
echo "  4. View logs: dmux logs -s abelo-creative"
echo ""
echo "🚀 Abelo Creative dmux setup complete!"
