# COMPANY OS — Permissions / Approval Model

Updated: 2026-09-17

V0 follows least privilege. Agent roles can propose work and update internal Company OS records, but high-impact external actions do not have execution adapters.

## Baseline permissions

| Capability | Agent | Founder / human | V0 behavior |
|---|---:|---:|---|
| Read Company OS registry/activity/tasks | yes | yes | allowed |
| Create internal message | yes | yes | allowed |
| Create/update internal task | yes | yes | allowed |
| Request Founder approval | yes | yes | allowed |
| Create schedule for internal AI work | yes, when exposed through trusted internal tooling | yes | allowed |
| Run Workers AI for own role work | event-triggered | yes | allowed within guardrails |
| Change another agent's role prompt/permissions | no | yes, via code/config review | not exposed as runtime endpoint |
| Send external email | no | no runtime adapter | approval queue only / future |
| Charge/refund/payment action | no | no runtime adapter | approval queue only / future |
| Customer-data automation | no | no runtime adapter | approval queue only / future |
| Destructive GitHub action | no | no runtime adapter | prohibited in V0 |
| Autonomous production deploy | no | no runtime adapter | prohibited in V0 |
| Add paid AI provider/key | no | explicit Founder decision | not a V0 dependency |

## Initial agents

### Admin

Can coordinate workstreams, create/route internal tasks and messages, and surface blockers. Admin cannot silently cross the external-action boundary.

### Founder Office

Synthesizes company state and escalates risks/decisions. Founder Office is not the Founder and cannot self-approve restricted actions.

### Research

Produces sourced internal research/knowledge. It can propose findings and tasks; it cannot publish externally or make spend commitments.

### Marketing

Produces internal positioning/launch/marketing work. It cannot send campaigns, buy media, publish, or contact customers in V0.

### Finance

Produces internal cost/unit-economics analysis and spending warnings. It cannot execute payments, refunds, subscriptions, or accounting changes.

## Approval queue semantics

An approval is a decision record, not an execution engine.

`approved` means the Founder/human has authorized the proposed action conceptually. V0 intentionally does not contain adapters that execute external high-impact actions after approval.

This prevents an approval click from unexpectedly sending email, moving money, touching customer data, changing GitHub destructively, or deploying production.

## Audit rules

Audit events are written for:

- human/manual agent status changes;
- created messages;
- created/updated tasks;
- approval requests and decisions;
- schedules created/updated;
- AI run success/failure/defer decisions.

Secrets, full credentials, access tokens and model chain-of-thought must never be written to `audit_log`, `activity_events`, messages or task descriptions.

## Authentication perimeter

Production `ops.getinspiration.com` must sit behind Cloudflare Access before DNS/route exposure. The application does not treat the `Cf-Access-Authenticated-User-Email` header as a standalone authentication mechanism; it is used only as audit metadata after the Cloudflare Access perimeter has authenticated the request.

If Cloudflare Access is not configured, do not expose the production custom domain.
