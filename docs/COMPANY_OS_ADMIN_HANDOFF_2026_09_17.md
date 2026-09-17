# COMPANY OS — Admin Handoff — 2026-09-17

Owner: Admin

## Source-of-truth correction

The INSPIRE core workstream documentation is currently active on `genesishumanity/inspire-` branch `feat/mvp-foundation`, not the default `main` branch.

Do not conclude that workstream docs are absent by inspecting only core `main`. Any future read-only knowledge-ingestion adapter must use an explicit configured ref and should currently target `feat/mvp-foundation` until Admin freezes a release/source branch.

Latest Admin-observed core feature ref during this review: `f9d130e04e75313a8a6bca15d620639d99fab006`. Treat this only as an observation, not a permanent pin; the branch is still moving.

## Cloudflare activation blocker

`wrangler.toml` still contains `REPLACE_WITH_COMPANY_OS_D1_ID`.

Cloudflare Git/domain connection alone does not close D1 activation. Before live V0:

1. resolve the existing `inspire-company-os-db` D1 resource;
2. place only its real database ID into Company OS `wrangler.toml`;
3. apply Company OS migrations to that database;
4. verify Cloudflare Access for `ops.getinspiration.com`;
5. verify Worker-side Access JWT validation using `TEAM_DOMAIN` + `POLICY_AUD` without recording secret/token values;
6. smoke-test registry, messages, tasks, approvals, schedules, audit and Workers AI;
7. keep paid AI providers disabled.

Do not bind the INSPIRE product D1 or copy product secrets into Company OS.

## V0 scope stays locked

The current architecture is sufficient for V0. Do not add 3D, external email, payments, customer-data automation, destructive GitHub actions or autonomous production deploy before the real five-agent flow is live.

Priority is real end-to-end behavior: Admin / Founder Office / Research / Marketing / Finance -> message -> task -> status -> approval -> audit -> activity feed.
