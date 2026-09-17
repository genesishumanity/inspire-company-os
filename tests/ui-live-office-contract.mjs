import fs from 'node:fs';

const ui = fs.readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const preview = fs.readFileSync(new URL('../src/preview-entry.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');

function expect(fragment, message) {
  if (!ui.includes(fragment) && !preview.includes(fragment) && !index.includes(fragment)) throw new Error(message);
}

function reject(fragment, message) {
  if (ui.includes(fragment) || preview.includes(fragment) || index.includes(fragment)) throw new Error(message);
}

expect("'/api/bootstrap'", 'world must poll Company OS bootstrap');
expect('scenario=', 'preview smoke must support read-only state-transition scenarios');
expect('data-testid="hq-world-canvas"', 'HQ world must expose a canvas smoke target');
expect("import { AGENT_ROSTER, findPath, normalizeWorldPayload } from '/world-engine.js'", 'browser world must use the adapter/pathfinding module');
expect("if (method === 'GET' && path === '/world-engine.js')", 'worker must serve only the needed browser module');
expect('REAL EVENT', 'real backend speech bubbles must be labeled');
expect('renderWorldEngineModule', 'preview and main worker must expose the safe browser module');
expect('Control Room', 'Company OS backend visibility must remain available');
reject('hq-master.webp', 'final cinematic HQ artwork must not be used in the vanilla milestone');
reject('WebSocket', 'renderer must not use the upstream WebSocket data source');
reject('transcript', 'renderer must not scan terminal transcripts');
reject('32 Agents', 'UI must not invent a fake large workforce');

console.log('ui live-office contract ok');
