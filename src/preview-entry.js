import { renderHQ } from './hq-ui.js';
import { renderWorldEngineModule } from './world-engine.js';

const HEADERS = {
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

const BASE_AGENTS = [
  { id: 'founder-office', name: 'Founder Office', department: 'Founder Office', status: 'waiting', status_reason: 'Founder presence online for visual preview.', role_prompt: 'Founder presence — not an autonomous AI employee.', updated_at: '2026-09-17T13:58:00Z' },
  { id: 'admin', name: 'Admin', department: 'Operations', status: 'waiting', status_reason: 'Waiting for the next operational event.', role_prompt: 'Coordinates work, blockers, handoffs and Founder escalation.', updated_at: '2026-09-17T13:58:10Z' },
  { id: 'research', name: 'Research', department: 'Research / Knowledge', status: 'waiting', status_reason: 'Waiting for the next research event.', role_prompt: 'Evidence-first research and knowledge agent.', updated_at: '2026-09-17T13:58:20Z' },
  { id: 'marketing', name: 'Marketing', department: 'Marketing', status: 'working', status_reason: 'Turning an insight into a launch angle.', role_prompt: 'Audience, positioning and creative marketing agent.', updated_at: '2026-09-17T13:58:30Z' },
  { id: 'finance', name: 'Finance', department: 'Finance / Unit Economics', status: 'reviewing', status_reason: 'Reviewing unit economics before approval.', role_prompt: 'Numbers-first finance and unit economics agent.', updated_at: '2026-09-17T13:58:40Z' },
];

const BASE_EVENTS = [
  { id: 3, actor_agent_id: 'admin', actor_name: 'Admin', event_type: 'message_sent', summary: 'Admin -> Research: validate the strongest launch signal.', ts: new Date().toISOString() },
];

const TASKS = [
  { id: 1, title: 'Validate launch signal', owner_agent_id: 'research', owner_name: 'Research', created_by_agent_id: 'admin', priority: 'high', status: 'in_progress', approval_required: 0, updated_at: '2026-09-17T13:58:20Z' },
  { id: 2, title: 'Draft launch angle', owner_agent_id: 'marketing', owner_name: 'Marketing', created_by_agent_id: 'admin', priority: 'normal', status: 'in_progress', approval_required: 0, updated_at: '2026-09-17T13:58:30Z' },
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...HEADERS, 'content-type': 'application/json; charset=utf-8' } });
}

function html(body) {
  return new Response(body, { headers: { ...HEADERS, 'content-type': 'text/html; charset=utf-8' } });
}

function js(body) {
  return new Response(body, { headers: { ...HEADERS, 'content-type': 'application/javascript; charset=utf-8' } });
}

function bootstrap(scenario = 'waiting') {
  const agents = BASE_AGENTS.map((agent) => ({ ...agent }));
  const research = agents.find((agent) => agent.id === 'research');
  const events = [...BASE_EVENTS];
  if (scenario === 'working') {
    research.status = 'working';
    research.status_reason = 'Active task #1: Validate launch signal';
    events.unshift({ id: 4, actor_agent_id: 'research', actor_name: 'Research', event_type: 'ai_started', summary: 'Research started validating the current signal.', ts: new Date().toISOString() });
  } else if (scenario === 'thinking') {
    research.status = 'thinking';
    research.status_reason = 'Reading source notes for launch signal validation.';
  } else if (scenario === 'agent_output') {
    research.status = 'working';
    research.status_reason = 'Active task #1: Validate launch signal';
    events.unshift({ id: 5, actor_agent_id: 'research', actor_name: 'Research', event_type: 'agent_output', summary: 'Real backend research output: strongest signal is founder-led operating proof.', ts: new Date().toISOString() });
  }
  return {
    preview: true,
    scenario,
    agents,
    events,
    tasks: TASKS,
    approvals: [],
    messages: [],
    schedules: [],
    usage: { requests: 3 },
    founderInbox: { approvals: [], blockedTasks: [], unreadFounderMessages: [], aiAlerts: [] },
    serverTime: new Date().toISOString(),
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === 'GET' && path === '/') return html(renderHQ());
    if (method === 'GET' && path === '/world-engine.js') return js(renderWorldEngineModule());
    if (method === 'GET' && path === '/health') return json({ ok: true, service: 'inspire-company-os-preview', preview: true, time: new Date().toISOString() });
    if (method === 'GET' && path === '/api/bootstrap') return json(bootstrap(url.searchParams.get('scenario') || 'waiting'));

    const agentMatch = path.match(/^\/api\/agents\/([a-z0-9-]+)$/);
    if (method === 'GET' && agentMatch) {
      const agent = BASE_AGENTS.find((item) => item.id === agentMatch[1]);
      if (!agent) return json({ error: 'agent_not_found' }, 404);
      return json({
        agent,
        events: BASE_EVENTS.filter((event) => event.actor_agent_id === agent.id),
        tasks: TASKS.filter((task) => task.owner_agent_id === agent.id),
        messages: [],
      });
    }

    if (method !== 'GET') return json({ error: 'preview_read_only' }, 405);
    return json({ error: 'not_found' }, 404);
  },
};
