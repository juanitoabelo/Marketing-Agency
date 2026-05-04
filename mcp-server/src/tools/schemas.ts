import { z } from "zod";

// 1. create_client
export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  company: z.string().optional(),
  leadScore: z.number().min(0).max(100).default(0),
  source: z.string().optional(),
});

// 2. update_lead_status
export const updateLeadStatusSchema = z.object({
  clientId: z.string().cuid(),
  status: z.enum(["LEAD", "QUALIFIED", "CLIENT", "CHURNED"]),
});

// 3. log_seo_audit
export const logSEOAuditSchema = z.object({
  clientId: z.string().cuid(),
  pageSpeed: z.object({
    desktop: z.number().min(0).max(100),
    mobile: z.number().min(0).max(100),
  }).optional(),
  coreVitals: z.object({
    LCP: z.number().optional(),
    FID: z.number().optional(),
    CLS: z.number().optional(),
  }).optional(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    completeness: z.number().min(0).max(100).optional(),
  }).optional(),
  issues: z.array(z.object({
    type: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    message: z.string(),
    fix: z.string().optional(),
  })).optional(),
});

// 4. update_project_milestone
export const updateProjectMilestoneSchema = z.object({
  projectId: z.string().cuid(),
  milestone: z.object({
    name: z.string(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
    assignee: z.enum(["CTO", "WEB_DEVELOPER", "DESIGNER"]),
    dueDate: z.string().datetime().optional(),
  }),
});

// 5. log_email
export const logEmailSchema = z.object({
  clientId: z.string().cuid().optional(),
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  type: z.enum(["PROPOSAL", "FOLLOW_UP", "CONTRACT", "OTHER"]),
});

// 6. create_invoice
export const createInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
});

// 7. get_seo_analytics
export const getSEOAnalyticsSchema = z.object({
  clientId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// 8. log_agent_message
export const logAgentMessageSchema = z.object({
  fromAgent: z.enum(["CEO", "CTO", "MARKETING", "SEO_SPECIALIST", "WEB_DEVELOPER", "DESIGNER"]),
  toAgent: z.enum(["CEO", "CTO", "MARKETING", "SEO_SPECIALIST", "WEB_DEVELOPER", "DESIGNER"]).optional(),
  taskId: z.string().cuid().optional(),
  type: z.enum(["HANDOFF", "STATUS_UPDATE", "ASK", "ERROR"]),
  payload: z.record(z.any()),
});

// 9. get_agent_health
export const getAgentHealthSchema = z.object({
  agent: z.enum(["CEO", "CTO", "MARKETING", "SEO_SPECIALIST", "WEB_DEVELOPER", "DESIGNER"]).optional(),
});

// 10. get_pending_tasks
export const getPendingTasksSchema = z.object({
  agent: z.enum(["CEO", "CTO", "MARKETING", "SEO_SPECIALIST", "WEB_DEVELOPER", "DESIGNER"]).optional(),
});

// Trigger tools (called by cron/webhook)
// 11. trigger_lead_generation
export const triggerLeadGenerationSchema = z.object({
  count: z.number().min(1).max(100).default(10),
});

// 12. trigger_proposal_send
export const triggerProposalSendSchema = z.object({
  clientId: z.string().cuid(),
});

// 13. trigger_deal_closure
export const triggerDealClosureSchema = z.object({
  clientId: z.string().cuid(),
  amount: z.number().positive(),
});

// 14. trigger_project_kickoff
export const triggerProjectKickoffSchema = z.object({
  projectId: z.string().cuid(),
});

// 15. trigger_seo_audit
export const triggerSEOAuditSchema = z.object({
  clientId: z.string().cuid().optional(), // if omitted, audit all active clients
});
