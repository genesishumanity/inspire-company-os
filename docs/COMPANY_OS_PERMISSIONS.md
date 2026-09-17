# COMPANY OS — Permissions / Approval Model

Updated: 2026-09-17

V0 follows least privilege. Agents can propose work and update internal Company OS records, but high-impact external actions have no execution adapters.

## Baseline permissions

| Capability | Agent | Founder / authorized human | V0 behavior |
|---|---:|---:|---|
| Read Company OS registry/activity/tasks | yes | yes | allowed behind Access |
| Create internal message | yes | yes | allowed |
| Create/update internal task | yes | yes | allowed; approval-gated work cannot progress before approval |
| Request Founder approval | yes | yes | allowed |
| Decide Founder approval | no | Founder allowlist only | `FOUNDER_APPROVER_EMAILS` required in production |
| Create schedule for internal AI work | trusted internal flow | yes | allowed |
| Run Workers AI for role work | event-triggered | yes | allowed within guardrails |
| Add a new registry agent | no autonomous self-expansion | yes | `POST /api/agents` |
| Manually set cosmetic agent status | no | no in production | blocked; status must come from real backend events |
| Change an existing agent's role prompt/permissions | no | reviewed human code/config change | no runtime endpoint |
| Send external email | no | no runtime adapter | approval queue only / future |
| Charge/refund/payment action | no | no runtime adapter | approval queue only / future |
| Customer-data automation | no | no runtime adapter | approval queue only / future |
| Destructive GitHub action | no | no runtime adapter | prohibited in V0 |
| Autonomous production deploy | no | no runtime adapter | prohibited in V0 |
| Add paid AI provider/key | no | explicit Founder decision | not a V0 dependency |

## Initial agents

- **Admin:** coordinates workstreams, routes internal tasks/messages and surfaces blockers.
- **Founder Office:** synthesizes company state and escalates decisions; it is not the Founder and cannot self-approve restricted actions.
- **Research:** produces sourced internal research/knowledge; no external publishing or spend commitments.
- **Marketing:** produces internal positioning/launch work; no campaign send, media buying or customer contact in V0.
- **Finance:** produces cost/unit-economics analysis; no payments, refunds, subscriptions or accounting mutations.

## Approval semantics

An approval is a decision record, not an execution engine. `approved` means the Founder authorized the concept; V0 intentionally has no adapter that turns the click into an email send, money movement, customer-data operation, destructive GitHub change or production deployment.

Approval integrity is enforced twice:

1. `src/entry.js` returns `409 founder_approval_required` when a gated task tries to move to `in_progress`, `review`, or `done` without an approved decision.
2. D1 migration `0005_approval_integrity.sql` enforces the same rule at database level so a future API bug cannot silently bypass the gate.

A rejected approval automatically moves its linked task to `blocked`. Production approval decisions require a validated Cloudflare Access identity whose email is listed in `FOUNDER_APPROVER_EMAILS`. If that allowlist is missing, approval decisions fail closed.

## Status truth

The office UI is an operational view, not animation. Production requests cannot manually set an agent to `working`, `thinking`, `reviewing`, etc. Status changes come from real backend events such as task assignment/state, message delivery, AI execution, scheduler execution, quota sleep, or a real failure/blocker. Local development may use the manual endpoint for testing only.

## Request integrity

Mutation endpoints require JSON and reject browser requests explicitly marked `Sec-Fetch-Site: cross-site`. This is an additional internal-app CSRF/misuse guard on top of Cloudflare Access.

## Audit rules

Audit records cover registry additions, messages, task mutations, approval requests/decisions, schedules, AI run success/failure/defer decisions, and scheduler guardrail outcomes.

Never write secrets, credentials, Access JWTs, API keys or model chain-of-thought to audit/activity/messages/tasks.

## Authentication perimeter

Production is fail-closed:

1. Cloudflare Access must protect `ops.getinspiration.com`.
2. `src/entry.js` independently validates `Cf-Access-Jwt-Assertion` against `TEAM_DOMAIN` and `POLICY_AUD` using Cloudflare's published JWKS.
3. `ACCESS_ALLOWED_EMAILS` may additionally restrict identities after JWT validation.
4. `FOUNDER_APPROVER_EMAILS` separately controls who may approve/reject Founder-gated actions.
5. If Access configuration is missing or invalid, every UI/API route is rejected, including `/health`.
6. `workers.dev` and Worker preview URLs are disabled.
7. No intentionally unauthenticated production route exists in V0.

The `Cf-Access-Authenticated-User-Email` value used in audit metadata is overwritten at the secure entry layer with the identity derived from the validated JWT rather than trusted directly from an incoming public header.

Local development bypass is allowed only when `AUTH_MODE=local` and the request hostname is localhost/loopback. Production config uses `AUTH_MODE=access`.
