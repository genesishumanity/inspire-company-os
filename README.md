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

Production deployment is fail-closed: `npm run deploy` refuses to run while the Company OS D1 ID is still a placeholder or unless a human intentionally sets `COMPANY_OS_DEPLOY_APPROVED=1` for that deploy command. Cloudflare Access must already protect `ops.getinspiration.com`; the Worker also validates the Access JWT for authenticated routes.

## Validation

```bash
npm install
npm run smoke
node tests/auth-smoke.mjs
npx wrangler deploy --dry-run --config wrangler.ci.toml --outdir /tmp/company-os-worker
```

GitHub CI performs these checks and never deploys production. Current CI infrastructure status is tracked in `docs/COMPANY_OS_PROGRESS.md`.

See `docs/COMPANY_OS_ARCHITECTURE.md`, `docs/COMPANY_OS_COST_GUARDRAILS.md`, `docs/COMPANY_OS_PERMISSIONS.md`, and `docs/COMPANY_OS_PROGRESS.md`.
