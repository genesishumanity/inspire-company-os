# INSPIRE — AI Workforce Baseline Audit — 2026-09-17

Owner: AI Workforce Performance / People Ops
Status: first evidence-based baseline
Scope: `genesishumanity/inspire-company-os` + active INSPIRE workstreams on `genesishumanity/inspire-` `feat/mvp-foundation`

## Audit rules

- No composite performance score.
- No hiring/firing recommendation from document volume alone.
- Control functions (Security, Legal, Finance) are judged first on risk reduction and evidence quality, not throughput.
- Environment/tool blockers are separated from agent-quality problems.
- Role prompts, permissions and registry rows are not changed by Workforce.
- Recommendations require Admin review; Founder approval is called out separately where needed.
- Where live operational data does not exist, the audit says `NOT OBSERVABLE` rather than estimating.

## Baseline confidence / observability

### Company OS operational telemetry is not live yet

The Company OS schema is ready for `agents`, `tasks`, `messages`, `activity_events`, `audit_log`, `schedules`, approvals and `ai_usage`, but the current V0 is not externally activated because the dedicated D1 / Access / environment / controlled deploy path is still open.

Consequence: the following requested workforce signals are currently **NOT OBSERVABLE from real operational logs**:

- true task completion vs abandonment rate;
- agent idle / overloaded / blocked duration;
- blocker frequency per agent;
- real handoff latency;
- repeated-task rate from task records;
- real Admin escalation frequency;
- missed escalation rate;
- per-agent inference cost trend;
- per-agent token/neuron efficiency;
- run-level model suitability.

No values are fabricated for these fields.

### Registry coverage is intentionally narrower than the active workstream surface

Current V0 seed registry contains five agents:

- Admin
- Founder Office
- Research
- Marketing
- Finance

The active core workstream documentation also shows Design, Growth / Content, Launch / Product QA, Sales / CRM, Legal / Trust, Performance Marketing / Paid Growth, Web Experience / Frontend, Security / Trust Engineering, SEO and other specialist lanes.

This is currently an **observability / roster reconciliation gap**, not automatically a registry defect: Company OS V0 is explicitly locked to proving the five-agent flow first. Workforce should not add rows until Admin decides which active specialist lanes are durable agents vs temporary workstreams.

---

# TEAM HEALTH

## Admin — `HEALTHY` + `BLOCKED` (environment/release evidence, not role performance)

Evidence:
- maintains explicit source-of-truth reconciliation across parallel teams;
- defines ownership boundaries and conflict priority;
- prevents blind replay/force-push of stale Luna work;
- separates repository coding work from Cloudflare/D1/deployment blockers;
- current runtime blockers are concrete: real D1 binding, secret-presence verification, migration/schema, deploy and real Gemini/D1 smoke evidence.

Interpretation:
Admin behavior is evidence-driven and ownership-aware. Current blocking is primarily environment/release state, not lack of planning.

## Founder Office — `HEALTHY`

Evidence:
- cross-workstream brief identifies strategy saturation, release-truth weakness, documentation drift, runtime evidence gaps and measurement gates;
- explicitly resists calendar-driven launch pressure;
- distinguishes product truth from release truth;
- redirects the company from more planning toward controlled evidence collection.

Interpretation:
High-value coordination work with concrete conflict detection. Current output reduces cross-team waste rather than adding a parallel strategy layer.

## Research / Knowledge — `HEALTHY` current corrective state + `DUPLICATING` historical + `OVERLOADED` historical

Evidence:
- canonical worklog indexes 77 research packs;
- worklog explicitly declares MVP discovery coverage sufficient and pauses broad speculative expansion;
- two separate packs exist for substantially overlapping creative-alignment stopping-gate guidance:
  - `RESEARCH_CREATIVE_ALIGNMENT_STOPPING_GATE_V1.md`
  - `RESEARCH_CREATIVE_ALIGNMENT_STOP_GATE_V1.md`
- Research correctly states that recommendations are not implemented behavior and does not claim runtime ownership.

Interpretation:
The research quality/boundary discipline is strong, but the historical task stream exceeded diminishing returns and produced at least one concrete duplicate. Root-cause hypothesis is **task assignment / stopping-rule enforcement**, not evidence that the role itself is unnecessary.

Action: do not create more broad Research tasks until a concrete runtime/QA/user/provider/product trigger exists.

## Marketing — `HEALTHY` + `BLOCKED` by execution dependencies

Evidence:
- Marketing status says strategy is green but launch execution is amber;
- states the main risk is product/measurement/asset verification, not lack of marketing ideas;
- explicitly says not to add new strategy unless evidence changes a decision;
- owner matrix defines launch responsibilities and hold criteria.

Interpretation:
Current role direction is healthy. Additional generic launch strategy would now be waste; next value is production + real launch evidence.

## Growth / Content — `HEALTHY` + `BLOCKED` by evidence dependencies

Evidence:
- Growth index maps its existing source files to prevent duplicate work;
- explicitly states its pre-evidence operating system is complete;
- explicitly says to stop expanding generic strategy and wait for real beta sessions, assets, publishing and product/audience observations.

Interpretation:
Role currently understands its stopping condition. Keep it execution/evidence-triggered.

## Finance / Unit Economics — `HEALTHY`

Evidence:
- marks runway as `UNKNOWN` when required cash/obligation inputs are absent;
- keeps paid media / creator sponsorship / new SaaS at $0 until gates justify spend;
- distinguishes scenario/controller figures from actual results;
- rejects stale Stripe-specific engineering and uncapped paid usage where current source-of-truth/economics do not support them.

Interpretation:
Correct control-function behavior. Do not optimize this role for document throughput.

## Security / Trust Engineering — `HEALTHY` + `BLOCKED` by required release evidence

Evidence:
- issues HOLD for broad public beta with concrete P0 reasons;
- distinguishes code-review passes from unverified production controls;
- requires evidence for D1 binding, abuse controls, logs, recovery and exact release commit;
- does not convert documentation into a false GO.

Interpretation:
Correct control-function behavior. HOLD is not a performance defect.

## Web Experience / Frontend — `BLOCKED` (environment/tool) with strong evidence discipline

Evidence:
- records real Cloudflare deployment failure evidence;
- refuses to infer the exact failure cause without logs;
- separates GitHub Actions infrastructure failure from Cloudflare deployment failure;
- identifies the D1 placeholder as a real config blocker without claiming it was the observed build failure.

Interpretation:
Blocker diagnosis quality is high; execution depends on Cloudflare/runtime access and Admin/Infra closure.

## Sales / CRM — `HEALTHY` + `BLOCKED` by deliberate activation gates

Evidence:
- sending remains disabled;
- launch readiness requires product truth, positioning, sender identity/deliverability, suppression/unsubscribe, eligibility/legal review, research quality, CRM safety and measurement;
- staged enablement starts with research, then tiny manually reviewed batches, not autonomous volume.

Interpretation:
This is appropriate prelaunch restraint, not underperformance.

## Performance Marketing / Paid Growth — `HEALTHY` + `BLOCKED` by product/measurement/monetization gates

Evidence:
- paid acquisition is OFF;
- documents reconcile current $0 state with Finance and Founder constraints;
- uses a creative reuse map instead of demanding duplicate assets;
- explicitly says no additional paid strategy layer is needed before launch;
- current priorities are deploy, measurement, organic learning and authentic proof.

Interpretation:
Role boundaries are becoming healthy. Continue only when measurement or paid-stage triggers create real work.

---

# TOP PERFORMERS — evidence, not rank score

These are not an overall ranking. They are the clearest current examples of desired workforce behavior.

### Founder Office
Why: converts broad cross-team material into a smaller set of decisions, catches source-of-truth drift, and actively stops unnecessary strategy production.

### Finance
Why: strongest observed `unknown != zero` discipline; refuses fake runway/real-unit-economics claims and imposes reversible maximum-loss thinking.

### Security
Why: keeps GO/HOLD tied to production evidence and does not trade control quality for launch speed.

### Web
Why: distinguishes verified deployment facts from hypotheses and does not overclaim root cause.

---

# BLOCKED / WASTED WORK

## Blocked

1. **Company OS observability** — no live dedicated D1/Access/deploy means no real workforce telemetry yet.
2. **Core app release evidence** — real D1 binding, secrets presence, deployment and Gemini/D1 smoke remain gating evidence.
3. **Marketing / Growth / Performance / Sales execution** — increasingly waiting on working product, measurement, authentic sessions/assets, monetization or sender/compliance gates rather than more strategy.

## Wasted / diminishing-return work found

1. **Research duplicate pack:** two substantially overlapping creative-alignment stop-gate documents.
2. **Broad strategy after explicit stop conditions:** Research, Growth, Marketing and Performance all now state that additional generic strategy is low-value. New generic strategy tasks in these lanes should be treated as suspected waste unless a fresh trigger is named.
3. **Stale documentation can create rework:** cross-workstream briefs identify outdated payment/build/release instructions that another AI could execute literally.

Root-cause priority:
`task assignment / source freshness / stop-rule enforcement` before `agent quality`.

---

# DUPLICATION

## Confirmed

### Research stopping-gate duplicate
Two separate source files cover nearly the same decision boundary. Recommend Admin + Research choose one canonical pack and mark the other superseded/redirect-only. Workforce does not choose the domain winner.

## High-risk overlap requiring ownership clarity, not immediate consolidation

### Marketing vs Growth / Content
Observed overlap includes launch hooks/copy, social profile/copy, creator seeding, landing language, measurement and launch content.

Existing docs already partially mitigate this through owner matrices and shared launch ownership, but Admin reconciliation describes Marketing and Growth as separate parallel owners while some launch docs combine `Marketing / Growth`.

Recommendation: after launch/beta, evaluate whether these are:
- two durable agents with explicit different decision rights; or
- one strategy owner + one execution/content-production specialist.

Do not merge now without real task/activity evidence.

### Marketing vs Performance
Overlap exists around creative hypotheses and measurement, but Performance has explicit Marketing sync + creative reuse rules and currently refuses unnecessary paid work. No consolidation recommendation now.

### Admin vs Founder Office
Both coordinate across teams, but current observed outputs are complementary:
- Admin = implementation/reconciliation/release ownership;
- Founder Office = red-team/decision compression/escalation.

No consolidation recommendation now.

---

# COST / MODEL OPTIMIZATION

## Current Company OS model posture

- V0 intentionally uses Workers AI with no paid fallback.
- AI runs only on explicit/due work; no idle inference.
- one inference per agent at a time;
- daily soft-cap / scheduler reserve / quota-defer behavior exists;
- usage estimates are recorded when live.

This is a good cost baseline.

## Current limitation

Model allocation is not yet evidence-based per role. Before live runtime data, Workforce cannot truthfully say Research, Finance, Marketing, etc. need an upgrade/downgrade.

## Recommendation

Do not add paid/high-end models yet. After Company OS activation, add a workforce view that groups existing `ai_usage` by:
- agent;
- task class;
- success/failure;
- input/output tokens;
- estimated neurons/cost;
- re-run within same task;
- human/Admin rework required.

Then identify model-change candidates from **cost per accepted outcome**, not raw token count.

---

# ROLE GAPS

## 1. Registry-to-real-workforce reconciliation — highest priority

Company OS seed registry has five agents; source-of-truth workstreams are broader. Before adding agents, Admin should produce a canonical roster table:

`workstream → durable agent? → owner → decision rights → source-of-truth → activation state → model policy`

This prevents both phantom agents and duplicate specialists.

## 2. Workforce observability is missing from live operations

The schema has the raw building blocks, but no live workforce performance layer can exist before activation. After live V0, derive—not manually score—signals for:
- completion / abandonment;
- blocked duration and recurrence;
- duplicate task fingerprints;
- handoff loops/rework;
- escalation precision;
- source-of-truth conflicts;
- model usage/cost per accepted result.

No new autonomous HR agent infrastructure is justified until this data path is live.

---

# NEEDS ADMIN

1. **Activate Company OS safely** so operational telemetry exists; do not create duplicate D1/resources.
2. **Keep current five-agent V0 scope for activation**, but create a canonical broader workforce roster mapping from the active core workstreams.
3. **Research duplicate cleanup:** ask Research to nominate canonical alignment-stop-gate pack and mark the other superseded/redirect-only.
4. **Enforce stop-trigger assignment:** no broad Research/Growth/Marketing/Performance strategy tasks unless request includes a new evidence trigger or decision gap.
5. **Source freshness rule:** when a source-of-truth decision changes, stale executable instructions should be marked stale/redirected quickly to reduce literal AI rework.
6. **After activation, expose read-only workforce telemetry** from existing task/activity/audit/usage records before discussing per-agent model changes.

---

# NEEDS FOUNDER

No hiring/firing/retirement decision is justified from the first baseline.

Founder decision is only needed later if Admin proposes one of these structural changes:
- expanding Company OS registry beyond the five-agent V0;
- merging durable Marketing/Growth roles;
- retiring a repeated redundant specialist;
- enabling a paid/high-cost model tier.

Current recommendation: **no workforce expansion for its own sake. First make the existing work observable and execution-triggered.**

---

# NEXT WORKFORCE ACTION

1. Get Company OS V0 live behind Access with its own D1 and safe cost rails.
2. Reconcile the canonical agent/workstream roster without changing role prompts yet.
3. Start daily workforce reports from real task/activity/audit/AI-usage records.
4. First 72h live baseline should measure:
   - completed / blocked / abandoned tasks by agent;
   - blocked time + blocker reason;
   - duplicate/reopened tasks;
   - handoff count before completion;
   - escalation count and whether action was actually required;
   - AI runs/tokens/estimated neurons per accepted task;
   - tasks that produced only plans vs tasks that produced an accepted artifact/action.
5. After that evidence, propose role/model/workload changes to Admin.

## First-audit conclusion

The company does **not** currently need more AI employees.

The highest-leverage workforce improvement is:

**stop generic strategy after saturation → make ownership observable → collect real execution evidence → optimize roles/models from accepted outcomes.**
