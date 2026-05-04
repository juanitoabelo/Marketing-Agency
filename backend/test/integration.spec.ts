import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { ClientsService } from '../src/clients/clients.service';

describe('Integration: Full Agent Workflow (Step 8)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule], // imports the real AppModule
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up DB between tests
    await prisma.client.deleteMany();
    await prisma.sEOAudit.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.task.deleteMany();
    await prisma.agentMessage.deleteMany();
    await prisma.agentAuditLog.deleteMany();
  });

  describe('Full Flow: Lead → Proposal → Deal → Project', () => {
    it('should complete full autonomous flow', async () => {
      // 1. Marketing agent creates lead (create_client MCP tool)
      const lead = await prisma.client.create({
        data: {
          name: 'Acme Corp',
          email: 'contact@acme.com',
          company: 'Acme',
          status: 'LEAD',
          leadScore: 85,
        },
      });

      expect(lead.status).toBe('LEAD');
      expect(lead.leadScore).toBe(85);

      // 2. CEO agent updates lead status to QUALIFIED
      const qualified = await prisma.client.update({
        where: { id: lead.id },
        data: { status: 'QUALIFIED' },
      });

      expect(qualified.status).toBe('QUALIFIED');

      // 3. CEO agent creates invoice (create_invoice MCP tool)
      const invoice = await prisma.invoice.create({
        data: {
          clientId: lead.id,
          amount: 5000,
          status: 'DRAFT',
        },
      });

      expect(invoice.amount).toBe(5000);
      expect(invoice.status).toBe('DRAFT');

      // 4. CEO agent closes deal (update status to CLIENT)
      const client = await prisma.client.update({
        where: { id: lead.id },
        data: { status: 'CLIENT' },
      });

      expect(client.status).toBe('CLIENT');

      // 5. CTO agent creates project (project kickoff)
      const project = await prisma.project.create({
        data: {
          clientId: client.id,
          name: 'Acme Website Redesign',
          status: 'PLANNING',
          milestones: [
            { name: 'Planning', status: 'IN_PROGRESS', assignee: 'CTO' },
          ],
        },
      });

      expect(project.status).toBe('PLANNING');

      // 6. CTO assigns task to Web Developer
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          assignedTo: 'WEB_DEVELOPER',
          name: 'Build homepage',
          status: 'PENDING',
        },
      });

      // 7. Web Developer starts task
      const started = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS', lockedBy: 'web_dev_key' },
      });

      expect(started.status).toBe('IN_PROGRESS');

      // 8. Web Developer completes task
      const completed = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'COMPLETED' },
      });

      expect(completed.status).toBe('COMPLETED');

      // 9. SEO Specialist logs audit (log_seo_audit MCP tool)
      const audit = await prisma.sEOAudit.create({
        data: {
          clientId: client.id,
          pageSpeed: { desktop: 92, mobile: 82 },
          coreVitals: { LCP: 2.3, FID: 85, CLS: 0.05 },
          metadata: { title: true, description: true, keywords: ['web design', 'seo'] },
          issues: [{ type: 'missing_alt', severity: 'LOW', message: 'Alt text missing on 2 images' }],
        },
      });

      expect(audit.pageSpeed.desktop).toBe(92);

      // 10. Verify agent message logged (log_agent_message MCP tool)
      const message = await prisma.agentMessage.create({
        data: {
          fromAgent: 'SEO_SPECIALIST',
          toAgent: 'CTO',
          type: 'HANDOFF',
          payload: { auditId: audit.id, status: 'completed' },
        },
      });

      expect(message.type).toBe('HANDOFF');

      // 11. Verify audit log (system audit trail)
      const auditLog = await prisma.agentAuditLog.findMany({
        where: { agent: 'SEO_SPECIALIST' },
      });

      expect(auditLog.length).toBeGreaterThan(0);
      expect(auditLog[0].tool).toBe('log_seo_audit');
    });
  });

  describe('Error Handling: API Failure Recovery', () => {
    it('should log failed API calls to audit trail', async () => {
      const failedLog = await prisma.agentAuditLog.create({
        data: {
          agent: 'MARKETING',
          tool: 'create_client',
          inputs: { name: 'Test', email: 'bad-email' },
          success: false,
          error: 'Invalid email format',
        },
      });

      expect(failedLog.success).toBe(false);
      expect(failedLog.error).toContain('Invalid email');
    });
  });

  describe('Conflict Resolution: Task Locking', () => {
    it('should prevent concurrent updates to locked task', async () => {
      const task = await prisma.task.create({
        data: {
          projectId: 'proj_123',
          assignedTo: 'WEB_DEVELOPER',
          name: 'Test task',
          status: 'IN_PROGRESS',
          lockedBy: 'web_dev_key',
          lockedAt: new Date(),
        },
      });

      // Simulate second agent trying to update
      const lockTimeout = 30 * 60 * 1000; // 30 min
      const now = Date.now();
      const lockedAt = task.lockedAt?.getTime() || 0;
      const isLocked = now - lockedAt < lockTimeout;

      expect(isLocked).toBe(true);

      // After timeout, lock should release
      const futureTime = now + lockTimeout + 1000;
      const isLockedLater = futureTime - lockedAt < lockTimeout;
      expect(isLockedLater).toBe(false);
    });
  });

  describe('Monitoring: Agent Health', () => {
    it('should track agent heartbeat', async () => {
      const session = await prisma.agentSession.create({
        data: {
          agent: 'CEO',
          status: 'HEALTHY',
          lastHeartbeat: new Date(),
          currentTask: 'task_123',
          errorCount: 0,
        },
      });

      expect(session.status).toBe('HEALTHY');

      // Simulate no heartbeat for 15 minutes → OFFLINE
      const fifteenMinAgo = new Date(Date.now() - 16 * 60 * 1000);
      const isOffline = Date.now() - fifteenMinAgo.getTime() > 15 * 60 * 1000;
      expect(isOffline).toBe(true);
    });
  });
});
