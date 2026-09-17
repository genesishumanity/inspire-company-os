# COMPANY OS — V0 Architecture

Updated: 2026-09-17

## Boundary

`genesishumanity/inspire-company-os` is a separate internal system from `genesishumanity/inspire-`.

The Company OS owns its own:

- Cloudflare Worker: `inspire-company-os`
- D1 database: `inspire-company-os-db`
- Workers AI binding
- environment variables and secrets
- migrations, audit log and operational data

The core INSPIRE Worker, D1 database and secrets must never be reused by this repository. Sharing the same Cloudflare account is acceptable; sharing bindings/data/secrets is not.

At architecture verification time, the default branch of `genesishumanity/inspire-` exposed only its MVP `README.md`; role/workstream docs were not present in that branch. V0 therefore seeds concise role definitions from the Founder-provided workstream scopes and stores the core repo as a knowledge-source reference rather than copying product code.

## Minimum end-to-end path

```text
Founder / Cloudflare Access user
        |
        v
ops.getinspiration.com
        |
        v
Company OS Worker
  |       |        |
  |       |        +--> Workers AI (event-triggered only)
  |       |
  |       +-----------> Cron (15 min due-event check; no inference when nothing is due)
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

D1 is the simplest fit for a small internal company operating system:

- relational entities fit tasks/messages/approvals/audit well;
- it scales to zero;
- the Free plan is sufficient for V0;
- SQL indexes make the Founder Inbox and activity feed cheap;
- no always-on process is required.

SQLite Durable Objects remain a possible later addition for highly concurrent per-agent real-time state or WebSocket rooms. They are intentionally not a V0 dependency.

## Event-driven agent behavior

Agents do not infer while idle.

An AI run can happen only from:

1. an explicit Founder/API `POST /api/agents/:id/run`, or
2. a due schedule processed by the Cloudflare cron handler.

A delivered agent-to-agent message creates a real backend event and can wake a sleeping recipient to `waiting`, but it does **not** automatically invoke the model. This prevents accidental agent loops and silent quota burn.

## Real status state machine

Allowed agent states:

- `working`
- `thinking`
- `waiting`
- `blocked`
- `reviewing`
- `sleeping`

Examples of real transitions:

- explicit AI run: `thinking` -> `waiting`
- task `in_progress`: `working`
- task `blocked`: `blocked`
- task `review`: `reviewing`
- task `done`: `waiting`
- message delivered to a sleeping agent: `waiting`
- AI quota/capacity guard: `sleeping`
- non-quota AI failure: `blocked`

Every status transition writes an `activity_events` row. Mutating human/API actions also write `audit_log` rows.

## UI

The 2D office is deliberately simple CSS. Desk/card positions are static. There is no fake character walking, typing, pulsing or synthetic activity animation.

The UI polls `/api/bootstrap` while visible (8 seconds) and slows while hidden (30 seconds). What changes on screen comes from backend state/events.

Views included in V0:

- office / agent registry
- live activity feed
- Founder Inbox
- shared tasks
- agent-to-agent messages
- approval queue
- schedules/events
- per-agent detail/activity view
- AI usage counters

## Founder Inbox

Founder Inbox is a computed operational view made from:

- pending approvals
- blocked tasks
- unread messages addressed to `founder-office`
- AI quota/defer/failure events

This avoids duplicating the same fact into a separate inbox table.

## Schedules

A single cron trigger runs every 15 minutes. It queries only enabled schedules whose `next_run_at` is due and processes at most three per invocation. If nothing is due, no AI inference runs.

V0 recurrence types: `once`, `hourly`, `daily`, `weekly`.

## Security exposure

`ops.getinspiration.com` must be protected by Cloudflare Access **before** production DNS/route exposure. The Worker itself does not contain a public login system in V0; Cloudflare Access is the authentication perimeter.

The UI uses only same-origin API calls and ships restrictive security headers/CSP. No third-party frontend scripts are required.

## API surface

Core endpoints:

- `GET /health`
- `GET /api/bootstrap`
- `GET /api/agents`
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

There are intentionally no email, payment, customer-data automation, destructive GitHub, or production-deploy execution endpoints in V0.
