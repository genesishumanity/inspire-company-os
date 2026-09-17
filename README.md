# INSPIRE Company OS

Internal, event-driven AI company platform for INSPIRE.

This repository is intentionally separate from `genesishumanity/inspire-` and owns its own Cloudflare Worker, D1 database, bindings and secrets.

## V0

- 2D office at `ops.getinspiration.com`
- Agent registry and live statuses
- Backend-event activity feed
- Agent-to-agent messages
- Shared tasks
- Founder approval queue / Founder Inbox
- Schedules and events
- Agent detail/activity views
- Audit log
- AI usage and cost counters
- Event-driven Workers AI execution with quota guardrails

Initial agents: Admin, Founder Office, Research, Marketing, Finance.

## Safety boundary

V0 does **not** send email, charge payments, automate customer data, run destructive GitHub actions, or autonomously deploy production. Restricted actions must enter the Founder approval queue.

See `docs/COMPANY_OS_ARCHITECTURE.md`, `docs/COMPANY_OS_COST_GUARDRAILS.md`, `docs/COMPANY_OS_PERMISSIONS.md`, and `docs/COMPANY_OS_PROGRESS.md`.
