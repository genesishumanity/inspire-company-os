# COMPANY OS — V0 Architecture

Updated: 2026-09-17

## Boundary

`genesishumanity/inspire-company-os` is a separate internal system from `genesishumanity/inspire-`.

Company OS owns its own Cloudflare Worker (`inspire-company-os`), D1 database (`inspire-company-os-db`), Workers AI binding, variables/secrets, migrations, audit log and operational data. The core INSPIRE Worker/D1/secrets must never be reused here. Sharing the same Cloudflare account is acceptable; sharing bindings/data/secrets is not.

At architecture verification time, the default branch of `genesishumanity/inspire-` exposed only its MVP `README.md`; the broader role/workstream docs were not present there. V0 therefore seeds concise Founder-provided role scopes and keeps the core repo as a read-only knowledge-source reference.

## Minimum end-to-end path

```text
Founder / authorized internal user
        |
        v
Cloudflare Access
        |
        v
ops.getinspiration.com
        |
        v
src/entry.js
  - validates Cf-Access-Jwt-Assertion
  - checks Access audience/issuer
  - optional email allowlist
  - graceful D1/AI quota response
        |
        v
src/index.js
  |       |        |
  |       |        +--> Workers AI (event-triggered only)
  |       |
  |       +-----------> Cron (15 min due-event check)
  |
  +-------------------> COMPANY_OS_DB (D1)
                           agents
                           activity_events
                           messages
                           tasks
                           approvals
                           schedules
                           audit_log
                           ai_usage
```

## Why D1 for V0

D1 is the simplest fit for a small internal operating system: relational entities fit the domain, it scales to zero, indexed SQL keeps inbox/feed reads inexpensive, and no always-on process is required. SQLite Durable Objects remain a later option for high-concurrency realtime/WebSocket rooms; they are intentionally not a V0 dependency.

## Event-driven behavior

Agents do not infer while idle. An AI run can happen only from:

1. explicit `POST /api/agents/:id/run`, or
2. a due schedule processed by cron.

Agent-to-agent messages create real backend events and can wake a sleeping recipient to `waiting`, but they do **not** auto-run the recipient. This blocks accidental model loops and silent quota burn.

## Real status state machine

Allowed states: `working`, `thinking`, `waiting`, `blocked`, `reviewing`, `sleeping`.

Representative transitions:

- explicit AI run: `thinking` -> `waiting`
- task `in_progress`: `working`
- task `blocked`: `blocked`
- task `review`: `reviewing`
- task `done`: `waiting`
- message delivered to sleeping agent: `waiting`
- AI quota/capacity guard: `sleeping`
- non-quota AI failure: `blocked`

Status changes write `activity_events`; mutating human/API actions write `audit_log`.

## Extensible registry

The five seed agents are Admin, Founder Office, Research, Marketing and Finance. Additional departments are not hard-coded into the UI. An authenticated Founder/internal user can add a registry row through `POST /api/agents`; the office/bootstrap views discover it from D1 automatically. New agents start `sleeping` until a real event occurs.

Runtime role/permission mutation is intentionally not exposed in V0. Changing an existing agent's role contract remains a reviewed code/config change.

## UI

The office is deliberately simple CSS. Desk/card positions are static; there is no fake walking, typing, pulsing or synthetic activity. The visible UI polls `/api/bootstrap` every 8 seconds and slows to 30 seconds while hidden. Polling does not invoke AI.

V0 views include office/registry, live activity, Founder Inbox, shared tasks, agent messages, approvals, schedules, per-agent activity, audit-backed state and AI usage counters.

## Founder Inbox

Founder Inbox is computed from pending approvals, blocked tasks, unread messages addressed to `founder-office`, and AI quota/defer/failure events. It does not duplicate facts into another table.

## Schedules

A single cron trigger runs every 15 minutes, fetches only due enabled schedules and processes at most three. If nothing is due, no inference runs. Recurrence types: `once`, `hourly`, `daily`, `weekly`.

## Security exposure

`workers_dev=false` and `preview_urls=false`. The intended route is only `ops.getinspiration.com`.

The secure entry layer validates Cloudflare Access' `Cf-Access-Jwt-Assertion` JWT using the configured `TEAM_DOMAIN` issuer and `POLICY_AUD` audience. If Access variables are absent, protected routes fail closed. Local auth bypass works only with `AUTH_MODE=local` **and** a localhost/loopback hostname.

`GET /health` is intentionally unauthenticated and returns only service liveness; it does not read D1 or expose company data. All UI and `/api/*` paths require valid Access authentication.

The UI uses same-origin requests and restrictive CSP/security headers. No third-party frontend scripts are required.

## API surface

- `GET /health`
- `GET /api/bootstrap`
- `GET /api/agents`
- `POST /api/agents` — add registry agent
- `GET /api/agents/:id`
- `POST /api/agents/:id/run`
- `PATCH /api/agents/:id/status`
- `POST /api/messages`
- `PATCH /api/messages/:id/read`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/approvals`
- `PATCH /api/approvals/:id`
- `POST /api/schedules`
- `PATCH /api/schedules/:id`
- `GET /api/founder-inbox`
- `GET /api/audit`
- `GET /api/usage`

There are intentionally no email, payment, customer-data automation, destructive GitHub or production-deploy execution endpoints in V0.
