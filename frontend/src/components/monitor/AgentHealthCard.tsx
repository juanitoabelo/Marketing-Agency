interface AgentHealthCardProps {
  agent: string;
  status: 'HEALTHY' | 'STUCK' | 'OFFLINE' | 'ERROR';
  uptimePercent: number;
  lastHeartbeat: string;
  currentTask?: string;
  errorCount: number;
  isStuck: boolean;
  onRestart: () => void;
}

const agentColors: Record<string, string> = {
  CEO: 'bg-purple-100 text-purple-800',
  CTO: 'bg-blue-100 text-blue-800',
  Marketing: 'bg-green-100 text-green-800',
  SEO: 'bg-yellow-100 text-yellow-800',
  'Web Dev': 'bg-red-100 text-red-800',
  Designer: 'bg-pink-100 text-pink-800',
};

export default function AgentHealthCard({
  agent,
  status,
  uptimePercent,
  lastHeartbeat,
  currentTask,
  errorCount,
  isStuck,
  onRestart,
}: AgentHealthCardProps) {
  const statusColors = {
    HEALTHY: 'bg-green-500',
    STUCK: 'bg-yellow-500',
    OFFLINE: 'bg-gray-400',
    ERROR: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 ${isStuck ? 'border-yellow-500' : 'border-transparent'}">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
          <span className={`px-2 py-1 text-xs font-medium rounded ${agentColors[agent] || 'bg-gray-100'}`}>
            {agent}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {status === 'HEALTHY' ? '🟢' : status === 'STUCK' ? '🟡' : status === 'OFFLINE' ? '⚪' : '🔴'}
          {' '}{status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Uptime</span>
          <span className={`font-medium ${uptimePercent >= 90 ? 'text-green-600' : uptimePercent >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {uptimePercent}%
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Last Heartbeat</span>
          <span className="text-gray-700">{lastHeartbeat}</span>
        </div>

        {currentTask && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Current Task</span>
            <span className="text-blue-600 font-medium">{currentTask}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Errors</span>
          <span className={`font-medium ${errorCount > 5 ? 'text-red-600' : errorCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {errorCount}
          </span>
        </div>

        {isStuck && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ⚠️ Task stuck for &gt;2 hours
          </div>
        )}

        <button
          onClick={onRestart}
          className="mt-3 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          Restart Agent
        </button>
      </div>
    </div>
  );
}
