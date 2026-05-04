import { Request, Response, NextFunction } from 'express';

const AGENT_API_KEYS = JSON.parse(process.env.AGENT_API_KEYS || "{}");
const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  agent?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-agent-key'] as string;
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Check API Key (for MCP tools)
  if (apiKey) {
    const agentEntry = Object.entries(AGENT_API_KEYS).find(([_, key]) => key === apiKey);
    if (!agentEntry) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    req.agent = agentEntry[0]; // agent name (e.g., "ceo")
    return next();
  }

  // Check JWT (for frontend requests)
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.agent = decoded.agent;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
}

// Rate limiting (in-memory store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const agent = req.agent;
  if (!agent) return next();

  const limits: Record<string, number> = {
    ceo: 100,
    cto: 50,
    marketing: 200,
    seo_specialist: 50,
    web_developer: 50,
    designer: 50,
  };

  const maxRequests = limits[agent] || 50;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  const record = rateLimitStore.get(agent) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count++;
  rateLimitStore.set(agent, record);

  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());

  if (record.count > maxRequests) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  next();
}
