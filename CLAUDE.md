# CLAUDE.md

Project: Website/Application/Design/Development Agency using OpenCode multi-agent system.

## Key Config Files
- `opencode.json`: Defines all agent roles (CEO, CTO, Marketing, SEO Specialist, Web Developer, Designer) with prompts and modes.
- `Plan.md`: Full implementation plan for multi-agent setup, including skill requirements and workflow.
- `AGENTS.md`: Minimal guidance for OpenCode agents working in this repo.

## Agent Overview
Agents are configured in `opencode.json`:
- **CEO** (Primary): Orchestrates projects, closes deals, coordinates teams.
- **CTO** (Subagent): Technical architecture, code quality, scalability.
- **Marketing** (Subagent): Lead generation, email outreach, client communication.
- **SEO Specialist** (Subagent): Technical SEO audits, optimization.
- **Web Developer** (Subagent): Coding, deployment, Git workflows.
- **Designer** (Subagent): UI/UX design, design systems.

## Current State
Repo is empty; populate with project code/config to activate agent workflows.

## Next Steps
1. Install required skills via `configure-ecc` (see `Plan.md` for list).
2. Add project code to give agents concrete work.
3. Test agent handoffs with a trial project.
