# COMPANY OS — Cost Guardrails

Updated: 2026-09-17

Goal: keep V0 at approximately $0 and fail safely instead of silently falling back to paid inference.

## Verified Cloudflare Free capacity

Official Cloudflare documentation checked on 2026-09-17:

- Workers Free: 100,000 requests/day; 10 ms CPU/request; 5 cron triggers/account.
- D1 Free: 5,000,000 rows read/day; 100,000 rows written/day; 5 GB total storage; limits reset daily and queries fail after the daily limit is reached.
- Workers AI: 10,000 Neurons/day free allocation. On Workers Free, usage beyond that allocation is not a paid overage path; further operations fail until reset.
- SQLite Durable Objects are available on Workers Free, but V0 does not need them.

Sources:

- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/pricing/

## Runtime rules

1. **No paid model fallback.** `AI_MODEL` defaults to a Workers AI model available on the Free plan.
2. **No idle inference.** Messages and UI polling never invoke AI.
3. **Explicit/due-event only.** AI runs only through an explicit agent run or due schedule.
4. **Daily request soft cap.** `AI_DAILY_REQUEST_SOFT_CAP` defaults to `50` Company OS AI requests per UTC day. This is deliberately conservative because request count is not the same thing as billed Neurons.
5. **Quota/capacity failure = sleep/defer.** If Workers AI returns quota/rate/capacity style errors, the agent is put into `sleeping`, a Founder Inbox approval/attention item is created, and no paid provider is attempted.
6. **Non-quota runtime failure = blocked.** The agent becomes `blocked` for review rather than retry-looping.
7. **Cron work is bounded.** A cron invocation processes at most three due schedules.
8. **Frontend polling slows when hidden.** Visible: 8 seconds. Hidden: 30 seconds. Polling does not invoke AI.

## Usage counters

`ai_usage` records:

- model
- successful/failed request count
- input/output tokens when the model response exposes them
- optional estimated Neurons
- estimated USD cost

Cloudflare's model binding does not guarantee an exact billed-Neuron value in every model response. Therefore V0 does not invent one. `AI_EST_NEURONS_PER_REQUEST` defaults to `0`; it should only be changed when the operator has a defensible estimate from observed Cloudflare dashboard usage.

Within the Free plan, `estimated_cost_usd` remains `0` because there is no paid fallback path.

## Recommended operating thresholds

These are Company OS guardrails, not claims about Cloudflare billing:

- 25 AI runs/day: review whether recurring schedules are too chatty.
- 40 AI runs/day: avoid adding more recurring AI work that day.
- 50 AI runs/day: soft-defer all further Company OS AI runs until UTC reset.
- Any Cloudflare quota/capacity error: sleep affected agent and surface Founder attention immediately.

## D1 efficiency rules

- index feed lookups by timestamp;
- index task owner/status;
- index pending approvals;
- index schedule due-time;
- cap UI queries to recent rows;
- do not write heartbeat rows;
- do not persist polling reads as events;
- do not store model chain-of-thought; store only operational output needed by the company.

## Future paid upgrade gate

A paid Cloudflare or external AI plan must be an explicit Founder decision. Before any upgrade, record:

- observed daily AI demand;
- observed D1 usage;
- concrete V0 failure caused by a Free limit;
- expected monthly maximum cost;
- stop-loss/rollback path.

No Claude/OpenAI paid API key is required or expected by V0.
