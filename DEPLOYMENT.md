# Abelo Creative - Deployment Guide

## Frontend (Vercel)

### 1. Connect Repository
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import `juanitoabelo/Marketing-Agency` repo
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2. Environment Variables
```
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://abelo-creative-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://abelo-creative-mcp-server.railway.app
```

### 3. Deploy
- Click **Deploy**
- Vercel auto-deploys on every push to `main`
- Your app: `https://abelo-creative.vercel.app`

## Backend (Railway)

### 1. Connect Repository
1. Go to [railway.app](https://railway.app) → New Project
2. Deploy from GitHub repo `juanitoabelo/Marketing-Agency`
3. Select `backend/` as root directory

### 2. Add PostgreSQL
- Click **New** → **Database** → **PostgreSQL**
- Railway auto-sets `DATABASE_URL` env var

### 3. Environment Variables
```
DATABASE_URL=postgresql://... (auto-set by Railway)
JWT_SECRET=your-jwt-secret-here
STRIPE_SECRET_KEY=sk_live_...
EMAIL_PROVIDER_KEY=your-email-key
FRONTEND_URL=https://abelo-creative.vercel.app
PORT=3001
```

### 4. Deploy
- Railway auto-deploys on push to `main`
- Your API: `https://abelo-creative-backend.railway.app`

## MCP Server (Railway)

### 1. Create New Service
- In same Railway project → **New Service**
- Select `mcp-server/` as root directory

### 2. Environment Variables
```
AGENT_API_KEYS={"ceo":"ceo_key_here","cto":"cto_key_here","marketing":"marketing_key_here","seo_specialist":"seo_key_here","web_developer":"web_dev_key_here","designer":"designer_key_here"}
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=postgresql://... (same as backend)
PORT=3002
TRANSPORT=http
```

### 3. Deploy
- Your MCP server: `https://abelo-creative-mcp-server.railway.app`

## Database (Prisma Migrations)

### Run Migrations on Railway
```bash
# In Railway backend service → Settings → Custom Start Command
npx prisma migrate deploy && npm start
```

### Or run locally and push:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
git add prisma/migrations
git commit -m "Add Prisma migrations"
git push
```

## WebSockets (Production)

### Backend (NestJS + WebSocket)
- Railway supports WebSocket via HTTP upgrade
- Client connects to: `wss://abelo-creative-backend.railway.app`

### MCP Server (WebSocket)
- Client connects to: `wss://abelo-creative-mcp-server.railway.app`

## Verify Deployment

### Frontend
```bash
curl https://abelo-creative.vercel.app
```

### Backend Health Check
```bash
curl https://abelo-creative-backend.railway.app/api/health
```

### MCP Server
```bash
curl https://abelo-creative-mcp-server.railway.app/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: ceo_key_here" \
  -d '{"method":"tools/list"}'
```

## Quick Deploy (All Services)

### 1. Push to GitHub
```bash
cd "/Volumes/Drive Uone/Abelo Creative/cursor/marketing-agency"
git push origin main
```

### 2. Vercel + Railway auto-deploy
- Frontend → Vercel (auto)
- Backend → Railway (auto)
- MCP Server → Railway (auto)

### 3. Check Deployments
- Vercel: [vercel.com/dashboard](https://vercel.com/dashboard)
- Railway: [railway.app/dashboard](https://railway.app/dashboard)

## Rollback (Railway)

If deployment fails:
1. Go to Railway project → **Deployments**
2. Click **Rollback** on last working deployment
3. Backend + MCP server auto-rollback

## Monitoring

### Vercel
- **Analytics**: Vercel dashboard → Project → Analytics
- **Logs**: Vercel dashboard → Project → Deployments → View Logs

### Railway
- **Metrics**: Railway dashboard → Service → Metrics (CPU, Memory, Network)
- **Logs**: Railway dashboard → Service → Logs

### Uptime Monitoring
- Use [UptimeRobot](https://uptimerobot.com) or [Pingdom](https://pingdom.com)
- Monitor:
  - Frontend: `https://abelo-creative.vercel.app`
  - Backend: `https://abelo-creative-backend.railway.app/api/health`
  - MCP Server: `https://abelo-creative-mcp-server.railway.app/mcp`

## Security Checklist

- ✅ All env vars set (no secrets in repo)
- ✅ CORS configured (FRONTEND_URL)
- ✅ API keys rotated (AGENT_API_KEYS)
- ✅ HTTPS enforced (Vercel + Railway auto-provide SSL)
- ✅ Database not publicly accessible (Railway VPC)
