# COMPANY OS — Progress

Updated: 2026-09-17

## V0 build status

### DONE in repository

- [x] Verified `genesishumanity/inspire-company-os` already existed; reused it instead of creating a duplicate.
- [x] Kept `genesishumanity/inspire-` read-only and separate.
- [x] Separate Cloudflare Worker configuration.
- [x] Separate D1 binding/database name.
- [x] Separate AI binding and environment variables.
- [x] D1 migration with real agent registry.
- [x] Initial agents: Admin, Founder Office, Research, Marketing, Finance.
- [x] Extensible registry schema for later departments.
- [x] Six real statuses: working / thinking / waiting / blocked / reviewing / sleeping.
- [x] Backend-driven activity events.
- [x] Production manual status changes are blocked; office status must come from real backend work/events.
- [x] Agent-to-agent messages.
- [x] Shared tasks.
- [x] Founder approval queue.
- [x] Approval-gated tasks cannot progress to in-progress/review/done before an approved Founder decision.
- [x] Approval integrity is enforced in both the secure entry layer and D1 triggers.
- [x] Rejected approvals automatically block their linked task.
- [x] Production approval decisions fail closed unless the authenticated identity is in `FOUNDER_APPROVER_EMAILS`.
- [x] Mutation endpoints require JSON and reject browser requests marked cross-site.
- [x] Schedules/events with bounded cron processing.
- [x] Scheduler leases prevent duplicate execution when cron ticks overlap.
- [x] Per-agent AI run leases prevent double-clicks, overlapping schedules, or concurrent operator requests from running the same agent twice at once.
- [x] Agent run leases are token-scoped and self-expiring; a stale request cannot release a newer run.
- [x] Agent-busy work defers cleanly instead of counting as an inference failure.
- [x] Agent lease cleanup is best-effort so a transient D1 release problem does not convert a successful inference into a false AI failure; the lease expires automatically.
- [x] Scheduler failure circuit breaker retries bounded failures and disables/escalates after 3 consecutive failures.
- [x] Recurring cadence is anchored independently from retry timing, so late cron/quota retries do not permanently shift hourly/daily/weekly schedules.
- [x] Missed recurring slots are skipped rather than replayed as an inference burst.
- [x] Founder Inbox derived from real operational records.
- [x] Founder Inbox messages can be marked read so unresolved items do not accumulate forever.
- [x] Repeated identical pending Founder notices are deduplicated at D1 level.
- [x] Agent detail/activity endpoint and modal.
- [x] Audit log.
- [x] AI usage counters plus migration-based Workers AI estimate trigger.
- [x] Workers AI event-driven runner.
- [x] AI soft-cap and quota/capacity graceful sleep/defer behavior.
- [x] Scheduler reserve prevents near-soft-cap scheduled jobs from being advanced as completed when inference is deferred.
- [x] No paid OpenAI/Claude runtime dependency.
- [x] No email/payment/customer-data/destructive-GitHub/prod-deploy execution adapters.
- [x] Simple 2D CSS office UI with no fake motion/activity.
- [x] Adaptive live polling: 8s while active, 15/30s as idle, 60s in hidden tabs.
- [x] Bootstrap reuses already-loaded approvals/tasks when deriving Founder Inbox, eliminating duplicate high-frequency reads while preserving dedicated unread-Founder-message and AI-alert reads.
- [x] Cloudflare Access is mandatory for **all** production routes, including `/health`.
- [x] Runtime contract test covers statuses, endpoints, Access wrapper, no public health bypass, mutation guards, truthful status, Founder-only approvals, adaptive polling, scheduler reserve/lease/circuit-breaker/cadence behavior, per-agent AI run leases, no-paid-fallback guardrail and production-domain configuration.
- [x] SQLite smoke applies every migration and verifies the five-agent registry, AI usage estimate trigger, cost indexes, scheduler lease contract, per-agent lease blocking/reclaim/token-safe release, cadence-anchor persistence, approval gating, approved progression, rejected-task blocking and Founder-notice dedupe.
- [x] Dedicated `tests/scheduler-cadence.mjs` checks late execution and missed-slot behavior for hourly/daily/weekly recurrence.
- [x] `0003_cost_guard_indexes.sql` adds the missing cost-oriented scheduler lookup index without duplicating base indexes.
- [x] `0004_scheduler_leases.sql` adds claim/lease/attempt/failure state for safe cron execution.
- [x] `0005_approval_integrity.sql` adds database-level approval integrity.
- [x] `0006_schedule_cadence_anchor.sql` separates planned recurring cadence from retry/defer timing.
- [x] `0007_founder_notice_dedupe.sql` suppresses duplicate unresolved Founder attention notices.
- [x] `0008_agent_run_leases.sql` adds per-agent run token, lease expiry and run-start metadata.
- [x] Production deploy remains human-gated by `scripts/predeploy.mjs`.
- [x] Undeployed D1 uses UUID-shaped sentinel `00000000-0000-0000-0000-000000000000`, improving local/config tooling while predeploy still blocks production until replaced with the real Company OS D1 UUID.
- [x] CI workflow remains deploy-free.

## Validation status

Repository validation was strengthened again on 2026-09-17, but GitHub Actions is still not a trustworthy pass/fail signal for this repo.

Latest observed push workflow after the run-lease smoke additions:

- workflow: `company-os-ci`
- run: `#66`
- conclusion: failure before any workflow step executes
- job: `smoke`
- job payload: `steps = null` / no executable steps reached

This continues the earlier `runner_id = 0`, `steps = []` pattern. Treat these runs as an Actions runner/account/infrastructure blocker, not as a Company OS code test failure and not as successful validation.

Intended local/runner validation remains:

```bash
npm install
npm run smoke
node tests/auth-smoke.mjs
npx wrangler deploy --dry-run --config wrangler.ci.toml --outdir /tmp/company-os-worker
```

No production deploy is wired into CI.

## Core repo observation

Re-checked on 2026-09-17: `genesishumanity/inspire-` default branch still exposes only the MVP `README.md`, not the broader role/workstream docs expected by Company OS. V0 therefore uses Founder-provided role scopes as initial registry prompts and keeps the core repo as a read-only knowledge-source reference. When those docs are committed later, a read-only knowledge ingestion adapter can be added without changing the registry model.

## Current external activation blocker

The repository side is prepared. A live end-to-end deployment now requires Cloudflare control-plane access that is not available in this build session.

Required activation steps:

1. In the same Cloudflare account, create a new **separate** D1 database named `inspire-company-os-db`.
2. Replace only the zero UUID sentinel in `wrangler.toml` with that new D1 UUID.
3. Apply all migrations: `npm run db:migrate:remote`.
4. Create a Cloudflare Access application/policy for `ops.getinspiration.com` restricted to Founder/authorized internal users.
5. Configure Worker Access verification values: `TEAM_DOMAIN`, `POLICY_AUD`, and optionally `ACCESS_ALLOWED_EMAILS`. Do not copy INSPIRE core secrets.
6. Configure `FOUNDER_APPROVER_EMAILS` with the Founder identity or identities allowed to approve/reject gated work. Approval decisions fail closed if this is missing.
7. Run repository validation commands above.
8. Intentionally approve deployment for that command only: `COMPANY_OS_DEPLOY_APPROVED=1 npm run deploy`.
9. Map `ops.getinspiration.com` to the Company OS Worker only after Access is active.
10. Smoke-test the authenticated live system.

Do not bind the INSPIRE core D1 database or copy core production secrets into this Worker.

## Smoke test checklist

After activation, authenticate through Cloudflare Access and verify:

1. `/health` returns `{ "ok": true, "service": "inspire-company-os", ... }` only for an authorized identity;
2. five seeded agents render as `sleeping`;
3. Admin -> Research message changes Research from `sleeping` to `waiting` and records an event;
4. Marketing task `in_progress` makes Marketing `working`;
5. task `review` makes Marketing `reviewing`;
6. approval-gated task appears in Founder Inbox and cannot progress before approval;
7. a non-Founder Access identity cannot approve/reject gated work;
8. rejection blocks the linked task; approval allows it to progress, but executes no external action;
9. production manual status mutation returns `manual_status_disabled`;
10. explicit Research run shows `thinking` then its real task-derived state if Workers AI succeeds;
11. a second Research run while the first agent lease is active returns a deferred/busy result and does not invoke Workers AI again;
12. an expired agent lease can be reclaimed and a mismatched stale token cannot release the current run;
13. one-time schedule executes only after due;
14. overlapping cron attempts cannot execute one schedule twice during an active schedule lease;
15. scheduled work targeting an already-running agent defers rather than incrementing the schedule failure circuit breaker;
16. repeated schedule failures stop after the bounded threshold and surface Founder attention;
17. quota/retry timing does not change the planned recurring cadence;
18. near soft-cap scheduled work remains queued/deferred rather than disappearing;
19. `/api/audit` and `/api/usage` reflect real records;
20. no paid external AI key is configured.

## Next only after V0 is live

- read-only ingestion of committed workstream docs from the core repo;
- richer agent detail timelines;
- observed-usage-based AI budget tuning;
- evaluate whether adaptive polling is sufficient before adding any more complex real-time transport;
- add more departments through registry rows, not hard-coded UI changes.
