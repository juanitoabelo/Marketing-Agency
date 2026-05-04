import { create } from 'zustand';

interface Agent {
  id: string;
  name: string;
  status: 'HEALTHY' | 'STUCK' | 'OFFLINE' | 'ERROR';
  uptimePercent: number;
  lastHeartbeat: string;
  currentTask?: string;
  errorCount: number;
}

interface AgentStore {
  agents: Agent[];
  tasks: any[];
  isConnected: boolean;
  fetchAgents: () => Promise<void>;
  fetchTasks: () => Promise<void>;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  tasks: [],
  isConnected: false,

  fetchAgents: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/health`);
      const agents = await res.json();
      set({ agents, isConnected: true });
    } catch (error) {
      set({ isConnected: false });
    }
  },

  fetchTasks: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks?status=IN_PROGRESS`);
      const tasks = await res.json();
      set({ tasks });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  },
}));
