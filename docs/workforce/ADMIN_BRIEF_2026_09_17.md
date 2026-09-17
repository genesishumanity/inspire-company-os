# INSPIRE — Workforce Admin Brief — 2026-09-17

Owner: AI Workforce Performance / People Ops
Audience: Admin

## Executive finding

The first baseline does not support hiring, firing, retirement or per-agent model changes yet.

The dominant workforce risks are:
1. **observability gap** — Company OS is not live, so real task/activity/audit/AI-usage performance signals do not exist yet;
2. **registry/workstream mismatch** — V0 registry intentionally seeds five agents while active core workstreams are much broader;
3. **strategy saturation** — Research, Growth, Marketing and Performance all independently state that more generic strategy is now low-value;
4. **document/source drift** — stale instructions can cause AI agents to execute superseded work literally;
5. **environment blockers** — runtime/release evidence is missing and must not be misclassified as poor agent performance.

## Current observed classifications

| Workstream | Workforce state | Why |
|---|---|---|
| Admin | HEALTHY + BLOCKED | Good reconciliation/ownership discipline; real runtime evidence still open. |
| Founder Office | HEALTHY | Compresses cross-team state into decisions, catches drift, stops strategy churn. |
| Research | HEALTHY current corrective state + DUPLICATING historical + OVERLOADED historical | 77-pack worklog; concrete duplicate alignment-stop-gate pair; now correctly in trigger-based maintenance mode. |
| Marketing | HEALTHY + BLOCKED | Strategy ready; next value depends on product/measurement/assets. |
| Growth / Content | HEALTHY + BLOCKED | Pre-evidence system complete; explicitly stops generic expansion pending real sessions/assets/publishing. |
| Finance | HEALTHY | Preserves unknowns, keeps spend gated, does not turn scenarios into actuals. |
| Security | HEALTHY + BLOCKED | Evidence-based HOLD; control function behaving correctly. |
| Web | BLOCKED, evidence quality strong | Real deploy failure observed; root cause not invented without logs. |
| Sales / CRM | HEALTHY + BLOCKED | Sending intentionally disabled behind product/deliverability/legal/measurement gates. |
| Performance | HEALTHY + BLOCKED | Paid = OFF; reuses creative; says no more paid-strategy layer before evidence. |

Do not treat `BLOCKED` above as a negative performance label without blocker attribution.

## Immediate Admin actions requested

### A1 — Activate telemetry before optimization
Priority: P0 workforce observability.

Complete the existing Company OS activation path using the dedicated existing resource topology:
- resolve existing `inspire-company-os-db` rather than create duplicate resources;
- configure D1 binding;
- apply migrations;
- verify Cloudflare Access + Worker authorization;
- smoke-test agents/messages/tasks/approvals/schedules/audit/Workers AI;
- keep paid AI fallback disabled.

Workforce will not fabricate completion/blocker/cost metrics before this is live.

### A2 — Canonical workforce roster mapping
Do **not** add registry rows yet. First create/review this mapping:

`workstream | durable agent? | owner | decision rights | source-of-truth | activation state | control-function? | current model policy`

Reason: current V0 registry has five seeded agents, while the active source tree contains many durable specialist lanes. Some may be temporary workstreams rather than agents. Registry expansion before this distinction is clear will create phantom staffing and duplicate ownership.

### A3 — Research duplication cleanup
Ask Research owner to choose the canonical source between:
- `RESEARCH_CREATIVE_ALIGNMENT_STOPPING_GATE_V1.md`
- `RESEARCH_CREATIVE_ALIGNMENT_STOP_GATE_V1.md`

Workforce should not select the domain winner. Recommended cleanup pattern:
- one canonical file;
- second file explicitly superseded/redirect-only;
- worklog updated once.

### A4 — Stop-trigger rule for task assignment
Until real evidence creates a decision gap, reject broad tasks such as:
- “do more research”;
- “make another launch strategy”;
- “expand growth plan”;
- “create more paid strategy.”

A new task in Research/Growth/Marketing/Performance should name at least one trigger:
- runtime/QA finding;
- real user evidence;
- provider/platform change;
- approved product-scope change;
- new launch result;
- new legal/finance constraint;
- explicit unresolved decision.

This is a task-routing rule proposal, not a role-prompt change.

### A5 — Source freshness / executable-document hygiene
When a decision changes:
- mark stale executable instructions as superseded;
- point to the new canonical source;
- avoid leaving conflicting payment/release/build instructions in an apparently current state.

AI-heavy operations multiply the cost of stale docs because agents can execute them literally.

### A6 — First 72h workforce telemetry once live
Workforce needs a read-only report derived from current tables, not a new scoring system:
- tasks created / done / blocked / abandoned-or-stale by agent;
- blocked duration and blocker reason;
- task reopen/duplicate fingerprint rate;
- handoff count before completion;
- Admin escalation count and disposition;
- AI runs and token/neuron estimate per completed accepted task;
- failed/re-run AI attempts;
- output type: plan-only vs accepted artifact/action/evidence;
- source-of-truth conflict incidents.

## Duplication watchlist

### Confirmed
Research alignment stopping gate duplicate.

### Watch, do not merge yet
- Marketing ↔ Growth / Content
- Marketing ↔ Performance
- Admin ↔ Founder Office

Current evidence shows meaningful overlap, but also explicit boundary/reuse mechanisms. Real task/activity data is required before consolidation.

## Model/cost guidance

Current Company OS cost posture is appropriate for V0:
- Workers AI only;
- no paid fallback;
- explicit/due inference only;
- per-agent run lease;
- daily soft cap / scheduler reserve;
- quota failure sleeps/defers instead of spending.

Do not introduce role-specific expensive models yet.

After live usage exists, evaluate model changes using:
`cost per accepted outcome + rework + failure rate + latency`, not raw token volume.

## Escalation policy for this audit

### Admin can decide
- roster mapping format;
- read-only workforce reporting implementation;
- source freshness workflow;
- Research duplicate canonicalization request;
- stop-trigger task-routing rule.

### Founder approval required only if proposed later
- registry expansion beyond agreed V0 scope;
- role merger/retirement;
- paid/high-cost model tier;
- material permission/autonomy change.

## Desired next state

Not “more agents working.”

Desired state:
- each task has one accountable owner;
- strategy tasks stop when evidence value is exhausted;
- blockers are attributed to environment vs role quality;
- handoffs are measurable;
- duplicate work is visible before it becomes another pack;
- model cost is tied to accepted results;
- Founder only receives decisions that actually require Founder authority.
