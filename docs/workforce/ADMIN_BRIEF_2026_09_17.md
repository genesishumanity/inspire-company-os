# INSPIRE — Workforce Admin Brief — 2026-09-17

Owner: AI Workforce Performance / People Ops
Audience: Admin
Status: refreshed after equal-standard Admin review and latest repo reconciliation

## Executive finding

The company is **execution-constrained, not strategy-constrained**.

No current evidence supports hiring, firing, retirement, permission changes or per-agent model changes.

The dominant workforce risks are:
1. **Admin structural overload risk** — Admin owns too many release/reconciliation surfaces even though current decision quality is generally strong;
2. **observability gap** — Company OS is not live, so real task wait time, abandonment, blocked duration, escalation precision and per-agent accepted-outcome cost remain `NOT OBSERVABLE`;
3. **strategy saturation** — Research, Growth, Marketing and Performance already documented stop conditions for generic strategy expansion;
4. **document/source drift** — stale executable instructions can create duplicate or reopened AI work;
5. **environment/release blockers** — infrastructure/control gates must not be misclassified as agent underperformance.

## Current observed classifications

| Workstream | Workforce state | Why |
|---|---|---|
| Admin | **NEEDS ROLE CLARITY + STRUCTURAL OVERLOAD RISK** | Strong reconciliation/handoff discipline, but owns a wide critical path; source/release drift has already appeared. Measured bottleneck remains unobservable until live telemetry exists. |
| Founder Office | HEALTHY current corrective state | Compresses cross-team state, catches drift, and has explicitly reduced narrative-document sprawl through action queue/index rules. |
| Research | HEALTHY current corrective state + DUPLICATING historical + OVERLOADED historical | Broad discovery is saturated; concrete duplicate alignment-stop-gate pair exists; current trigger-based maintenance posture is correct. |
| Marketing | HEALTHY + BLOCKED | Strategy ready; next value depends on product/measurement/assets and real launch evidence. |
| Growth / Content | HEALTHY + BLOCKED | Pre-evidence system is complete; additional generic strategy is low-value without new evidence. |
| Finance | HEALTHY | Preserves unknowns and spend gates; does not turn scenarios into actuals. |
| Security | HEALTHY + BLOCKED | Evidence-based HOLD behavior is correct for a control function. |
| Web / Infrastructure | BLOCKED, evidence quality strong | Real environment/deploy blockers exist; root causes are not invented without evidence. |
| Sales / CRM | HEALTHY + BLOCKED | Sending remains deliberately gated behind product, deliverability, legal and measurement readiness. |
| Performance | HEALTHY + BLOCKED | Paid remains OFF; no additional paid-strategy layer is justified before evidence. |

`BLOCKED` is not a negative performance label without blocker attribution.

## Latest evidence refresh

### Company OS hardening improved

Main has advanced with additional protections around:
- atomic AI budget reservations;
- scheduler reserve accounting;
- agent-busy retry behavior;
- human-only Access identity;
- run-lease / duplicate-run protection;
- runtime contract coverage.

This strengthens cost/control design but **does not remove the observability blocker**: live D1 + Access + controlled production activation is still required before Workforce can measure real agent performance.

### Core Web source reconciliation improved

The active core branch has new Web documentation commits aligning architecture, implementation manifest, Admin handoff and ship state with current launch/Brand V2 truth.

This is positive corrective evidence against earlier source drift. It does **not** prove all release/source drift is solved; Workforce should continue measuring reopened/stale-source work once telemetry is live.

### Workforce branch freshness

The Workforce PR branch and Company OS `main` have diverged because Company OS continued hardening after the audit branch was created.

Decision: do not merge Workforce docs as if they are runtime validation. Admin should review/refresh against latest `main` before merge. Workforce will keep its recommendations evidence-only and documentation-scoped.

## Immediate Admin actions requested

### A1 — Activate telemetry before structural optimization
Priority: P0 workforce observability.

Complete the existing Company OS activation path with dedicated resources and Access. After activation, verify real records in tasks/activity/audit/usage before changing roles/models.

Workforce will not fabricate performance metrics before this is live.

### A2 — Reduce mandatory Admin touch surface
Current structural risk is reconciliation-by-centralization.

Proposed routing rule:
- specialist completes work and writes canonical handoff;
- Admin involvement is required only when the handoff changes release/runtime/source-of-truth, creates a cross-owner conflict, or requires implementation/release action;
- ordinary specialist updates do not wait for Admin acknowledgement.

This is a task-routing proposal, not a role-prompt/permission change.

### A3 — Canonical workforce roster mapping
Do **not** expand registry yet. First map:

`workstream | durable agent? | owner | decision rights | source-of-truth | activation state | control-function? | model policy`

Goal: distinguish permanent agents from temporary workstreams and prevent phantom staffing/duplicate ownership.

### A4 — Stop-trigger task assignment
Research/Growth/Marketing/Performance should not receive broad “think more / create more strategy” work unless the task names at least one trigger:
- runtime/QA finding;
- real user evidence;
- provider/platform change;
- approved product-scope change;
- launch result;
- legal/finance constraint;
- explicit unresolved decision.

### A5 — Source freshness must be mechanical
Every release-relevant changed decision should carry:

`owner | canonical source | supersedes | implementation impact | Admin action required?`

Old executable instructions should be marked superseded/redirect-only rather than left looking current.

### A6 — Research duplication cleanup
Ask Research to choose the canonical source between:
- `RESEARCH_CREATIVE_ALIGNMENT_STOPPING_GATE_V1.md`
- `RESEARCH_CREATIVE_ALIGNMENT_STOP_GATE_V1.md`

Workforce should not choose the domain winner.

## Three additional operating optimizations

### O1 — Admin Touch Budget
Default assumption for a task should be **Admin not required**.

Admin touch becomes mandatory only for:
1. release/runtime change;
2. source-of-truth conflict;
3. security/legal/finance control conflict;
4. implementation/deployment ownership.

Measure after Company OS activation:
- % of tasks requiring Admin touch;
- median wait before Admin touch;
- rework prevented vs delay introduced.

Goal: preserve Admin authority while removing unnecessary queueing.

### O2 — Evidence Expiry / Supersession header
Release-relevant docs should expose a small machine-readable freshness header such as:

`status: CURRENT | SUPERSEDED | HISTORICAL`
`owner:`
`supersedes:`
`last_verified_against:`

This can later power a simple stale-source warning without creating a new agent.

Goal: stop AI workers from executing historical instructions literally.

### O3 — Founder Decision Packet
Founder should receive only decision-worthy packets, not raw status streams.

Recommended packet fields:
- `decision required`;
- `why now`;
- `options / tradeoff`;
- `recommended operational default`;
- `deadline or consequence of no decision`;
- `evidence link`.

If no Founder decision is required, route the item to Admin/owner and keep it out of Founder attention.

Goal: protect Founder attention as a scarce company resource.

## First live Workforce telemetry

Once Company OS is activated, Workforce needs read-only reporting from existing records:
- tasks created / done / blocked / stale by agent;
- blocked duration + reason;
- duplicate/reopened task fingerprint rate;
- handoff count before acceptance;
- Admin queue/wait time;
- Admin escalation count + disposition;
- Founder approval aging;
- AI runs + estimated cost per accepted task;
- reruns/failures;
- plan-only vs accepted artifact/action/evidence;
- source-of-truth conflict incidents.

No single fake performance score.

## Model/cost guidance

Current V0 posture remains appropriate:
- Workers AI only;
- no paid fallback;
- event/due inference only;
- run leases;
- atomic budget guard;
- scheduler reserve;
- bounded retry/defer behavior.

No role-specific upgrade/downgrade is justified yet.

After live data exists, evaluate models using:
`accepted outcome / AI runs / rework / failure / latency / estimated cost`.

## Authority / escalation

### Admin can review/adopt operationally
- roster mapping format;
- read-only workforce reporting;
- source freshness workflow;
- Research canonicalization request;
- stop-trigger routing;
- Admin Touch Budget experiment;
- Founder Decision Packet format.

### Founder approval required if later proposed
- permanent role merge/retirement;
- material registry expansion;
- paid/high-cost model tier;
- material permission/autonomy change.

## Desired next state

Not “more agents working.”

Desired state:
- one accountable owner per task;
- fewer mandatory passes through Admin;
- strategy stops when evidence value is exhausted;
- blockers are attributed correctly;
- stale sources self-identify;
- Founder sees decisions, not company chatter;
- model cost is tied to accepted outcomes.
