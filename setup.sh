#!/bin/bash
# Quick Setup - Abelo Creative
# Install all dependencies at once.

set -e

echo "🚀 Setting up Abelo Creative..."

# 1. Frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd "$(dirname "$0")/frontend"
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps 2>&1 | tail -20
else
    echo "   ✅ Frontend node_modules already exists"
fi

# 2. Backend
echo ""
echo "📦 Installing backend dependencies..."
cd "$(dirname "$0")/backend"
if [ ! -d "node_modules" ]; then
    npm install 2>&1 | tail -20
else
    echo "   ✅ Backend node_modules already exists"
fi

# 3. MCP Server
echo ""
echo "📦 Installing MCP server dependencies..."
cd "$(dirname "$0")/mcp-server"
if [ ! -d "node_modules" ]; then
    npm install 2>&1 | tail -20
else
    echo "   ✅ MCP server node_modules already exists"
fi

# 4. dmux
echo ""
echo "📦 Checking dmux..."
if command -v dmux &> /dev/null; then
    echo "   ✅ dmux is installed ($(dmux --version))"
else
    echo "   ❌ dmux not found, installing..."
    npm install -g dmux
fi

# 5. tmux
echo ""
echo "📦 Checking tmux..."
if command -v tmux &> /dev/null; then
    echo "   ✅ tmux is installed ($(tmux -V))"
else
    echo "   ❌ tmux not found"
    if command -v brew &> /dev/null; then
        brew install tmux
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y tmux
    else
        echo "   Please install tmux manually: https://github.com/tmux/tmux"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next Steps:"
echo "   1. Start frontend: cd frontend && npm run dev"
echo "   2. Start backend: cd backend && npm run start:dev"
echo "   3. Start MCP server: cd mcp-server && npm run dev"
echo "   4. Start autonomous loop: bash dmux-config/start-loop.sh"
