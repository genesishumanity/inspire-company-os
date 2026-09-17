# COMPANY OS — Founder Communications Parking Lot

Updated: 2026-09-17
Status: PARKED — evaluate after Company OS V0 is live and stable
Owner: Admin / Founder Office

## Idea

Allow the INSPIRE Company OS Admin/Manager agent to proactively reach the Founder outside the dashboard when a genuinely important event requires attention.

Desired channels, in order:
1. WhatsApp message from the Company OS/Admin agent.
2. If the Founder cannot be reached or a high-severity event requires synchronous discussion, initiate a voice call.
3. Support real-time two-way spoken conversation with the Admin agent, with company context available during the call.

## Product intent

This is not a generic notification bot. It should behave like the company's manager/escalation channel:
- routine agent chatter stays in Company OS;
- only founder-level decisions, P0 incidents, launch gates, material money/security risks, or explicitly configured events may trigger external contact;
- every outbound contact is recorded in the Company OS audit/activity log;
- quiet hours, severity rules, retry limits, consent and cost limits are mandatory;
- no agent may independently widen its own notification permissions.

## Cheapest implementation path

### Phase A — browser voice inside `ops.getinspiration.com`
Use Cloudflare's real-time voice/agent stack if stable enough for production use. This gives push-to-talk / live voice with the Admin agent without buying a phone number. Treat beta dependencies carefully.

### Phase B — WhatsApp messaging
Use an approved WhatsApp Business sender/provider only after Founder opt-in, legal/privacy review and cost review. The Admin agent can send structured alerts and receive replies that enter the Company OS event bus.

### Phase C — WhatsApp voice / normal phone fallback
Evaluate WhatsApp Business Calling or a telephony provider. Business-initiated calls require platform permission/consent and are not assumed free. PSTN fallback also has per-number/per-minute cost.

## Technical shape

Company OS event -> escalation policy -> Founder Communications service -> selected channel -> Founder reply/call transcript -> Company OS event bus -> Admin agent.

The Founder Communications service must be separate from INSPIRE product runtime and must not receive customer data by default.

## Required guardrails

- explicit Founder opt-in and verified destination;
- severity/approval policy before outbound contact;
- no marketing/customer outreach use;
- no secrets in WhatsApp/SMS/call transcripts;
- bounded transcript retention;
- provider webhook signature verification;
- spend cap and rate limit;
- fail closed if identity/provider verification is uncertain;
- phone/WhatsApp provider credentials isolated from core product secrets;
- emergency/P0 call escalation cannot be enabled until end-to-end tests pass.

## Launch decision

Do not let this feature delay INSPIRE launch or Company OS V0. Re-open only when:
1. Company OS V0 is deployed and stable;
2. Access/auth is verified;
3. event/task/message/audit flows work end-to-end;
4. Finance approves a maximum monthly communications budget;
5. Security approves the external messaging/voice integration.

If those are green and implementation is small, a browser-voice prototype may be attempted before launch; WhatsApp/telephone calling should remain a separate integration gate.
