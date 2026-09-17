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
- [x] Agent-to-agent messages.
- [x] Shared tasks.
- [x] Founder approval queue.
- [x] Schedules/events with bounded cron processing.
- [x] Founder Inbox derived from real operational records.
- [x] Agent detail/activity endpoint and modal.
- [x] Audit log.
- [x] AI usage counters plus migration-based Workers AI estimate trigger.
- [x] Workers AI event-driven runner.
- [x] AI soft-cap and quota/capacity graceful sleep/defer behavior.
- [x] No paid OpenAI/Claude runtime dependency.
- [x] No email/payment/customer-data/destructive-GitHub/prod-deploy execution adapters.
- [x] Simple 2D CSS office UI with no fake motion/activity.
- [x] Cloudflare Access documented as mandatory production perimeter.
- [x] Runtime contract test checks required statuses, endpoints, Access wrapper, quota behavior, Founder approval path, schedules, no-paid-fallback guardrail and production-domain configuration.
- [x] SQLite smoke now applies both migrations and verifies the five-agent registry plus AI usage estimate trigger.
- [x] CI workflow now runs on `main` pushes / PRs and remains deploy-free.

## Validation status

Repository validation was strengthened on 2026-09-17, but GitHub Actions is currently not a trustworthy pass/fail signal for this repo.

Observed workflow run after enabling push CI:

- workflow: `company-os-ci`
- event: push to `main`
- result: failure before any workflow step executed
- GitHub job metadata: `runner_id = 0`, `steps = []`

This means the run did **not** reach checkout, npm install, smoke tests, Access tests or Wrangler dry-run. Treat it as an Actions runner/account/infrastructure blocker, not as a Company OS code test failure and not as a successful validation.

Until GitHub Actions can allocate a runner, the intended validation command remains:

```bash
npm install
npm run smoke
node tests/auth-smoke.mjs
npx wrangler deploy --dry-run --config wrangler.ci.toml --outdir /tmp/company-os-worker
```

No production deploy is wired into CI.

## Core repo observation

When checked on 2026-09-17, `genesishumanity/inspire-` default branch contained the INSPIRE MVP `README.md` but did not expose the broader role/workstream docs expected by Company OS. V0 therefore uses Founder-provided role scopes as initial registry prompts and keeps the core repo as a knowledge-source reference. When those docs are committed later, a read-only knowledge ingestion adapter can be added without changing the registry model.

## Production activation — intentionally manual

Production deployment is not automated because V0 explicitly prohibits autonomous production deploys and this build session does not have a Cloudflare control-plane connector.

Required activation steps:

1. In the same Cloudflare account, create a new **separate** D1 database named `inspire-company-os-db`.
2. Copy only that new database ID into `wrangler.toml` at `REPLACE_WITH_COMPANY_OS_D1_ID`.
3. Install dependencies: `npm install`.
4. Apply migration: `npm run db:migrate:remote`.
5. Create a Cloudflare Access application/policy for `ops.getinspiration.com` restricted to the Founder/authorized internal users.
6. Configure the Worker Access verification values (`TEAM_DOMAIN`, `POLICY_AUD`, optional `ACCESS_ALLOWED_EMAILS`) without copying INSPIRE core secrets.
7. Run the validation commands above.
8. Deploy the separate Worker manually: `npm run deploy`.
9. Map `ops.getinspiration.com` to the Company OS Worker only after Access is active.
10. Smoke-test the live system.

Do not bind the INSPIRE core D1 database or copy core production secrets into this Worker.

## Smoke test checklist

After activation:

```bash
curl -fsS https://ops.getinspiration.com/health
```

Expected: `{ "ok": true, "service": "inspire-company-os", ... }`.

Then verify in the authenticated UI:

1. five seeded agents render as `sleeping`;
2. create a message Admin -> Research: Research changes from `sleeping` to `waiting` and feed records the event;
3. create a task assigned to Marketing, set `in_progress`: Marketing becomes `working`;
4. set the task to `review`: Marketing becomes `reviewing`;
5. create an approval-gated task: Founder Inbox shows a pending approval;
6. approve/reject it: audit/activity update, but no external action executes;
7. explicitly run Research: state goes `thinking` then `waiting` if Workers AI succeeds;
8. create a one-time schedule and confirm it executes only after it becomes due;
9. inspect `/api/audit` and `/api/usage`;
10. confirm no paid external AI key is configured.

## Next only after V0 is live

- read-only ingestion of committed workstream docs from the core repo;
- richer agent detail timelines;
- optional real-time transport if polling becomes insufficient;
- more departments through registry rows, not hard-coded UI changes;
- observed-usage-based AI budget tuning.
