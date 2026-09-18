# ChatGPT ↔ Company OS bridge

Launch contract only. This keeps one canonical 19-agent roster in Company OS while allowing an authenticated ChatGPT plugin/MCP layer to address the same identities.

## Truth boundary

Normal ChatGPT conversations are not treated as always-on backend processes. Company OS + Cloudflare remains the background runtime. ChatGPT is an interactive surface that can read/write the same agent identities when connected.

## Stable identity rule

`chatgpt_identity === company_os_agent_id`

No duplicate shadow roster is allowed.

## Authenticated bridge routes

- `GET /api/chatgpt/identities` — canonical identity/status map.
- `POST /api/chatgpt/agents/:id/events` — record a real ChatGPT-originated note/output/handoff.
  - kinds: `chatgpt_note`, `chatgpt_output`, `chatgpt_handoff`
  - body: `{ kind, summary, detail?, conversation_ref? }`

These routes inherit the existing Company OS authentication and audit path. They do not expose secrets and they do not bypass Founder approval gates.

## Plugin/MCP next boundary

A remote MCP/plugin transport can wrap these routes after deployment. User-specific reads/writes must use authenticated access; OpenAI API inference is not required for this bridge itself. Do not claim existing ordinary ChatGPT threads are automatically linked until the plugin is explicitly connected and authorized.

## Launch acceptance

1. Migration 0010 yields 19 canonical agents.
2. Identity endpoint returns the same 19 IDs.
3. A bridge event for one agent appears in activity/audit.
4. Existing Company OS run/task/message/approval behavior remains unchanged.
5. No production deploy without explicit Founder approval.
