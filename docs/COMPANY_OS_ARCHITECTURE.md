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
  - Founder approval allowlist
  - request-integrity guards
  - graceful D1/AI quota response
  - cron AI headroom guard
        |
        +------------------------------+
        v                              v
src/index.js                    src/scheduler.js
  - UI/API                      - due schedule scan
  - registry/status             - atomic claim + lease
  - tasks/messages              - bounded retries
  - approvals                   - circuit breaker
  - per-agent AI run lease      - cadence preservation
  - explicit AI runs            - Founder escalation
        |                       
        +--------------+---------------+
                       v
                COMPANY_OS_DB (D1)
                  agents
                  activity_events
                  messages
                  tasks
                  approvals
                  schedules
                  audit_log
                  ai_usage
                       |
                       v
               Workers AI binding
             (event-triggered only)
```

## Why D1 for V0

D1 is the simplest fit for a small internal operating system: relational entities fit the domain, it scales to zero, indexed SQL keeps inbox/feed reads inexpensive, and no always-on process is required. SQLite Durable Objects remain a later option for high-concurrency realtime/WebSocket rooms; they are intentionally not a V0 dependency.

## Event-driven behavior

Agents do not infer while idle. An AI run can happen only from:

1. explicit `POST /api/agents/:id/run`, or
2. a due schedule claimed by the cron scheduler.

Agent-to-agent messages create real backend events and can wake a sleeping recipient to `waiting`, but they do **not** auto-run the recipient. This blocks accidental model loops and silent quota burn.

Before inference begins, the agent row itself is atomically leased with a unique `run_token` and a 10-minute `run_lease_until`. A second manual click, overlapping schedule, or concurrent operator request for the same agent receives a deferred `agent_busy` result instead of starting another inference. Lease release is token-scoped, so a stale request cannot clear a newer run. If the Worker or D1 release path fails, the lease self-expires rather than locking the agent forever; release failure does not convert a successfully completed inference into a false AI failure.

## Real status state machine

Allowed states: `working`, `thinking`, `waiting`, `blocked`, `reviewing`, `sleeping`.

Representative transitions:

- explicit/scheduled AI run: real lease acquired -> `thinking` -> task-derived state
- task `in_progress`: `working`
- task `blocked`: `blocked`
- task `review`: `reviewing`
- task `done`: task-derived state / `waiting` when nothing remains
- message delivered to sleeping agent: `waiting`
- AI quota/capacity guard: `sleeping`
- non-quota AI failure: `blocked`

Status after AI completion is derived from all remaining active tasks rather than blindly returning to `waiting`. Status changes write `activity_events`; mutating human/API actions write `audit_log`. Production manual status mutation is blocked so the office cannot be cosmetically faked.

## Extensible registry

The five seed agents are Admin, Founder Office, Research, Marketing and Finance. Additional departments are not hard-coded into the UI. An authenticated Founder/internal user can add a registry row through `POST /api/agents`; the office/bootstrap views discover it from D1 automatically. New agents start `sleeping` until a real event occurs.

Runtime role/permission mutation is intentionally not exposed in V0. Changing an existing agent's role contract remains a reviewed code/config change.

## UI and polling cost

The office is deliberately simple CSS. Desk/card positions are static; there is no fake walking, typing or synthetic activity. `/api/bootstrap` polling is adaptive: 8 seconds while changes are active, then 15/30 seconds as the office becomes idle, and 60 seconds while the tab is hidden. Polling does not invoke AI or create heartbeat writes.

The bootstrap read model reuses the approvals and task rows it already loaded when deriving the Founder Inbox, instead of issuing duplicate approval/task reads on every active poll. Founder unread messages and operational AI alerts remain dedicated indexed reads so Inbox correctness is not traded for a cheaper poll.

V0 views include office/registry, live activity, Founder Inbox, shared tasks, agent messages, approvals, schedules, per-agent activity and AI usage counters. Founder Inbox messages can be marked read to keep the decision surface clean.

## Founder Inbox

Founder Inbox is computed from pending approvals, blocked tasks, unread messages addressed to `founder-office`, and AI quota/defer/failure events. It does not duplicate those facts into a second inbox table. Repeated identical pending `founder_attention` notices are deduplicated at the database layer until the existing notice is resolved.

## Approvals

Approval-gated tasks cannot move into `in_progress`, `review`, or `done` until their linked approval is `approved`. This is checked in the secure entry layer and enforced again by D1 triggers. Rejection automatically blocks the linked task. Production approval decisions require an authenticated Access identity listed in `FOUNDER_APPROVER_EMAILS`; missing allowlist configuration fails closed.

## Schedules

A single cron trigger runs every 15 minutes. The secure entry layer first reserves enough daily AI headroom for the bounded cron batch. `src/scheduler.js` then scans a small due candidate set and executes at most three schedules per tick.

Each due schedule is claimed atomically with a claim token and a 10-minute lease. Overlapping cron invocations cannot claim the same active schedule lease. The subsequent AI inference must also obtain the separate per-agent run lease; if that agent is already running, the schedule is deferred rather than treated as an inference failure. Quota/capacity deferrals preserve the schedule for a later retry; ordinary failures use bounded backoff. After three consecutive non-quota failures, the schedule is disabled and Founder attention is inserted instead of burning resources forever.

Recurring cadence is stored separately from retry timing. `next_run_at` means “when should the scheduler try again”; `cadence_anchor_at` means “which planned recurring slot does this work belong to.” A late cron or 15-minute quota retry therefore cannot permanently shift a daily 09:00 schedule to 09:15. Missed recurring slots are skipped rather than replayed in a burst. This behavior is introduced by `0006_schedule_cadence_anchor.sql` and covered by scheduler cadence tests.

Recurrence types remain `once`, `hourly`, `daily`, `weekly`.

## Security exposure

`workers_dev=false` and `preview_urls=false`. The intended route is only `ops.getinspiration.com`.

The secure entry layer validates Cloudflare Access' `Cf-Access-Jwt-Assertion` JWT using the configured `TEAM_DOMAIN` issuer and `POLICY_AUD` audience. If Access variables are absent or invalid, **every production route fails closed, including `/health`**. Production approval decisions additionally require `FOUNDER_APPROVER_EMAILS`. Mutations require JSON and reject browser requests explicitly marked cross-site. Local auth bypass works only with `AUTH_MODE=local` and a localhost/loopback hostname.

The UI uses same-origin requests and restrictive CSP/security headers. No third-party frontend scripts are required.

## API surface

- `GET /health` — authenticated liveness
- `GET /api/bootstrap`
- `GET /api/agents`
- `POST /api/agents` — add registry agent
- `GET /api/agents/:id`
- `POST /api/agents/:id/run`
- `PATCH /api/agents/:id/status` — local testing only; blocked in production
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
