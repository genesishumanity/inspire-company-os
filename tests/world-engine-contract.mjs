import assert from 'node:assert/strict';
import { AGENT_ROSTER, findPath, mapCompanyStatus, normalizeWorldPayload } from '../src/world-engine.js';

const now = Date.parse('2026-09-17T18:00:00Z');
const payload = {
  agents: [
    { id: 'founder-office', name: 'Founder Office', department: 'Founder Office', status: 'waiting' },
    { id: 'admin', name: 'Admin', department: 'Operations', status: 'blocked' },
    { id: 'research', name: 'Research', department: 'Research / Knowledge', status: 'working', status_reason: 'Active task #1' },
    { id: 'marketing', name: 'Marketing', department: 'Marketing', status: 'thinking' },
    { id: 'finance', name: 'Finance', department: 'Finance / Unit Economics', status: 'reviewing' },
    { id: 'fake-hr', name: 'Fake HR', department: 'HR', status: 'working' },
  ],
  events: [
    { id: 7, actor_agent_id: 'research', actor_name: 'Research', event_type: 'agent_output', summary: 'Real backend research output.', ts: '2026-09-17T17:59:30Z' },
  ],
};

assert.equal(mapCompanyStatus('waiting').animation, 'idle');
assert.equal(mapCompanyStatus('working').destination, 'desk');
assert.equal(mapCompanyStatus('working').animation, 'type');
assert.equal(mapCompanyStatus('thinking').animation, 'read');
assert.equal(mapCompanyStatus('reviewing').mode, 'review');
assert.equal(mapCompanyStatus('blocked').mode, 'blocked');
assert.equal(mapCompanyStatus('sleeping').destination, 'offsite');

const world = normalizeWorldPayload(payload, now);
assert.deepEqual(world.agents.map((agent) => agent.id), ['founder-office', 'admin', 'research', 'marketing', 'finance']);
assert.equal(world.agents.find((agent) => agent.id === 'research').speech.text, 'Real backend research output.');
assert.equal(AGENT_ROSTER.research.desk.join(','), '5,8');

const blocked = new Set(['9,10', '10,10']);
const path = findPath([11, 12], AGENT_ROSTER.research.desk, (x, y) => x >= 0 && y >= 0 && x < 25 && y < 17 && !blocked.has(`${x},${y}`));
assert.ok(path.length > 0, 'Research must have a path from idle lounge to assigned desk');

console.log('world-engine contract ok');
