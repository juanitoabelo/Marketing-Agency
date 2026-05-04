#!/bin/bash
# Monitor Autonomous Loop - Abelo Creative
# Continuous monitoring of agent activities

session="abelo-creative"
check_interval=60  # seconds

echo "🔍 Starting monitor for Abelo Creative (every ${check_interval}s)..."
echo "   Press Ctrl+C to stop"
echo ""

while true; do
    # Timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📅 $timestamp"
    
    # Check session
    if dmux list 2>/dev/null | grep -q "$session"; then
        echo "✅ Session '$session' is running"
        
        # Try to get pane count
        pane_count=$(tmux list-panes -t "$session" 2>/dev/null | wc -l)
        echo "   📊 Panes: $pane_count (expecting 6: CEO + 5 subagents)"
    else
        echo "❌ Session '$session' NOT running!"
        echo "   Run: bash dmux-config/start-loop.sh"
    fi
    
    # Check backend
    if curl -s http://localhost:3001/api/agents/health > /dev/null 2>&1; then
        echo "✅ Backend API: OK"
    else
        echo "❌ Backend API: NOT RESPONDING"
    fi
    
    # Check MCP
    if curl -s http://localhost:3002/tools/list > /dev/null 2>&1; then
        echo "✅ MCP Server: OK"
    else
        echo "❌ MCP Server: NOT RESPONDING"
    fi
    
    # Wait
    sleep $check_interval
    echo ""
done
