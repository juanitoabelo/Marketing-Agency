#!/bin/bash
# Verify Autonomous Loop - Abelo Creative
# Checks if all agents are running and healthy

echo "🔍 Verifying Abelo Creative Autonomous Loop..."

# Check dmux session
if ! dmux list | grep -q "abelo-creative"; then
    echo "❌ dmux session 'abelo-creative' not found!"
    echo "   Run: bash dmux-config/start-loop.sh"
    exit 1
fi

echo "✅ dmux session 'abelo-creative' is running"

# Check panes
echo ""
echo "📊 Agent Pane Status:"
dmux status abelo-creative 2>/dev/null || echo "⚠️  Could not get status"

# Check backend API
echo ""
echo "🔌 Checking Backend API (port 3001)..."
if curl -s http://localhost:3001/api/agents/health > /dev/null 2>&1; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API not responding on port 3001"
    echo "   Run: cd backend && npm run start:dev"
fi

# Check MCP server
echo ""
echo "🔌 Checking MCP Server (port 3002)..."
if curl -s http://localhost:3002/tools/list > /dev/null 2>&1; then
    echo "✅ MCP Server is responding"
else
    echo "❌ MCP Server not responding on port 3002"
    echo "   Run: cd mcp-server && npm run start"
fi

# Check frontend
echo ""
echo "🔌 Checking Frontend (port 3000)..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend not responding on port 3000"
    echo "   Run: cd frontend && npm run dev"
fi

# Check WebSocket
echo ""
echo "🔌 Checking WebSocket..."
if curl -s -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3001 2>&1 | grep -q "101"; then
    echo "✅ WebSocket upgrade supported"
else
    echo "⚠️  WebSocket may not be ready"
fi

echo ""
echo "📊 Verification Complete!"
echo "   Dashboard: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   MCP Server: http://localhost:3002"
