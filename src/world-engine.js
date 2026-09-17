// Adapted from the original Pixel Agents MIT browser runtime.
// Upstream: https://github.com/pixel-agents-hq/pixel-agents
// Commit audited for this integration: 3537e140c2094761beae748592aeb92ece8edfdd
//
// MIT License
// Copyright (c) 2026 Pablo De Lucca
//
// This file keeps the browser-only ideas we need from Pixel Agents: tile
// pathfinding, a tiny character state machine, canvas rendering, character
// animations and speech bubbles. The upstream hook server, transcript scanner,
// terminal integration, WebSocket transport, filesystem and env access are not
// imported into Company OS.

export const HQ_AGENT_IDS = ['founder-office', 'admin', 'research', 'marketing', 'finance'];

export const AGENT_ROSTER = {
  'founder-office': { label: 'Can', role: 'Founder presence', desk: [4, 3], lounge: [5, 4], color: '#20232c' },
  admin: { label: 'Admin', role: 'Operations', desk: [19, 8], lounge: [15, 12], color: '#26384a' },
  research: { label: 'Research', role: 'Research / Knowledge', desk: [5, 8], lounge: [11, 12], color: '#3c2847' },
  marketing: { label: 'Marketing', role: 'Marketing', desk: [5, 13], lounge: [12, 12], color: '#402248' },
  finance: { label: 'Finance', role: 'Finance / Unit Economics', desk: [19, 13], lounge: [16, 12], color: '#4b3829' },
};

export const EVENT_BEHAVIOR = {
  agent_output: 'talk',
  message_sent: 'talk',
  ai_started: 'work',
  task_assigned: 'work',
  task_status_changed: 'work',
  task_updated: 'work',
};

export function mapCompanyStatus(status) {
  switch (status) {
    case 'working': return { mode: 'work', destination: 'desk', animation: 'type' };
    case 'thinking': return { mode: 'think', destination: 'desk', animation: 'read' };
    case 'reviewing': return { mode: 'review', destination: 'desk', animation: 'read' };
    case 'blocked': return { mode: 'blocked', destination: 'desk', animation: 'idle' };
    case 'sleeping': return { mode: 'hidden', destination: 'offsite', animation: 'hidden' };
    case 'waiting':
    default: return { mode: 'idle', destination: 'lounge', animation: 'idle' };
  }
}

export function normalizeWorldPayload(payload, now = Date.now()) {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const agents = (Array.isArray(payload?.agents) ? payload.agents : [])
    .filter((agent) => HQ_AGENT_IDS.includes(agent.id))
    .map((agent) => {
      const roster = AGENT_ROSTER[agent.id];
      const latest = events.find((event) => event.actor_agent_id === agent.id) || null;
      const speech = realSpeechFor(agent.id, events, now);
      return {
        id: agent.id,
        label: roster.label,
        role: roster.role,
        department: agent.department || roster.role,
        status: agent.status || 'waiting',
        statusReason: agent.status_reason || '',
        behavior: mapCompanyStatus(agent.status || 'waiting'),
        latestEvent: latest ? safeEvent(latest) : null,
        speech,
        color: roster.color,
      };
    });
  return {
    agents,
    events: events.map(safeEvent),
    tasks: Array.isArray(payload?.tasks) ? payload.tasks : [],
    approvals: Array.isArray(payload?.approvals) ? payload.approvals : [],
    messages: Array.isArray(payload?.messages) ? payload.messages : [],
    schedules: Array.isArray(payload?.schedules) ? payload.schedules : [],
    usage: payload?.usage || {},
    founderInbox: payload?.founderInbox || {},
    serverTime: payload?.serverTime || new Date(now).toISOString(),
  };
}

export function findPath(start, goal, isWalkable) {
  const queue = [start];
  const cameFrom = new Map([[key(start), null]]);
  while (queue.length) {
    const current = queue.shift();
    if (current[0] === goal[0] && current[1] === goal[1]) break;
    for (const next of neighbors(current)) {
      const nextKey = key(next);
      if (cameFrom.has(nextKey) || !isWalkable(next[0], next[1])) continue;
      cameFrom.set(nextKey, current);
      queue.push(next);
    }
  }
  if (!cameFrom.has(key(goal))) return [];
  const path = [];
  for (let step = goal; step; step = cameFrom.get(key(step))) path.unshift(step);
  return path.slice(1);
}

function safeEvent(event) {
  return {
    id: event.id,
    actor_agent_id: event.actor_agent_id || null,
    actor_name: event.actor_name || null,
    event_type: event.event_type || '',
    summary: String(event.summary || '').slice(0, 280),
    ts: event.ts || event.created_at || null,
  };
}

function realSpeechFor(agentId, events, now) {
  const event = events.find((item) =>
    item.actor_agent_id === agentId &&
    (item.event_type === 'agent_output' || item.event_type === 'message_sent') &&
    ageSeconds(item.ts, now) <= 180
  );
  return event ? { kind: event.event_type, text: String(event.summary || '').slice(0, 180), ts: event.ts } : null;
}

function ageSeconds(ts, now) {
  if (!ts) return Infinity;
  const text = String(ts);
  const parsed = Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(text) ? text : `${text}Z`);
  return Number.isFinite(parsed) ? Math.max(0, (now - parsed) / 1000) : Infinity;
}

function neighbors([x, y]) {
  return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
}

function key([x, y]) {
  return `${x},${y}`;
}

export function renderWorldEngineModule() {
  return `export const HQ_AGENT_IDS=${JSON.stringify(HQ_AGENT_IDS)};
export const AGENT_ROSTER=${JSON.stringify(AGENT_ROSTER)};
export const EVENT_BEHAVIOR=${JSON.stringify(EVENT_BEHAVIOR)};
export ${mapCompanyStatus.toString()}
export ${normalizeWorldPayload.toString()}
export ${findPath.toString()}
${safeEvent.toString()}
${realSpeechFor.toString()}
${ageSeconds.toString()}
${neighbors.toString()}
${key.toString()}
`;
}
