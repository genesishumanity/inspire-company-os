export function renderOffice() {
  return String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>INSPIRE Company OS HQ World</title>
<style>
:root{color-scheme:dark;--bg:#08090d;--panel:#11141b;--line:#2b303a;--text:#f4f6fb;--muted:#9aa3b2;--purple:#b54cff;--good:#50e39a;--warn:#f6c453;--bad:#ff6b78}
*{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--bg);color:var(--text);font:13px/1.4 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button{font:inherit}
.app{display:grid;grid-template-columns:minmax(0,1fr) 340px;height:100vh}.world{position:relative;min-width:0;background:#07090f}.bar{position:absolute;left:16px;top:16px;z-index:3;display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:rgba(10,12,18,.84);backdrop-filter:blur(10px)}.mark{width:28px;height:28px;border-radius:7px;background:linear-gradient(145deg,var(--purple),#6838ff);display:grid;place-items:center;font-weight:900;font-size:20px}.bar b{display:block}.bar span{display:block;color:var(--muted);font-size:10px}.poll{margin-left:8px;padding-left:10px;border-left:1px solid var(--line);font-size:10px;color:var(--muted)}
canvas{width:100%;height:100%;display:block;image-rendering:pixelated}.drawer{border-left:1px solid var(--line);background:var(--panel);overflow:auto}.section{padding:14px;border-bottom:1px solid var(--line)}h1,h2{margin:0}h1{font-size:16px}h2{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#cbd1dd}.muted{color:var(--muted);font-size:11px}.row{padding:10px 0;border-top:1px solid #222833}.row:first-of-type{border-top:0}.agent{display:flex;justify-content:space-between;gap:10px;align-items:start}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:var(--warn)}.working .dot,.thinking .dot,.reviewing .dot{background:var(--good)}.blocked .dot{background:var(--bad)}.sleeping .dot{background:#6f7683}.pill{display:inline-flex;align-items:center;border:1px solid #343b48;border-radius:999px;padding:2px 7px;font-size:10px;color:#ccd3df}.event{color:#d8dce6}.controls{position:absolute;right:16px;top:16px;z-index:3;display:flex;gap:8px}.controls button{width:36px;height:36px;border:1px solid var(--line);border-radius:9px;background:rgba(10,12,18,.84);color:var(--text)}.legend{position:absolute;left:16px;bottom:16px;z-index:3;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:rgba(10,12,18,.84);color:var(--muted);font-size:10px}.error{position:absolute;right:16px;bottom:16px;z-index:4;background:#2b1116;border:1px solid #743540;color:#ffd7dc;border-radius:10px;padding:10px 12px;display:none}.error.show{display:block}@media(max-width:900px){.app{grid-template-columns:1fr}.drawer{height:38vh;border-left:0;border-top:1px solid var(--line)}.world{height:62vh}}
</style>
</head>
<body>
<div class="app">
  <main class="world">
    <div class="bar"><div class="mark">*</div><div><b>INSPIRE HQ World</b><span>Company OS /api/bootstrap driven</span></div><div class="poll" id="pollState">loading</div></div>
    <div class="controls"><button id="zoomOut" aria-label="Zoom out">-</button><button id="reset" aria-label="Reset view">⌂</button><button id="zoomIn" aria-label="Zoom in">+</button></div>
    <canvas id="worldCanvas" data-testid="hq-world-canvas"></canvas>
    <div class="legend">Real backend speech bubbles are purple. Ambient motion is local only.</div>
    <div class="error" id="errorBox"></div>
  </main>
  <aside class="drawer">
    <div class="section"><h1>Control Room</h1><div class="muted">Read-only visualization shell. Existing backend remains source of truth.</div></div>
    <div class="section"><h2>Founder Inbox</h2><div id="inbox"></div></div>
    <div class="section"><h2>Agents</h2><div id="agents"></div></div>
    <div class="section"><h2>Latest Events</h2><div id="events"></div></div>
    <div class="section"><h2>Tasks</h2><div id="tasks"></div></div>
  </aside>
</div>
<script type="module">
import { AGENT_ROSTER, findPath, normalizeWorldPayload } from '/world-engine.js';
import { createPixelAgentsRenderer } from '/pixel-agents-native.js';

const canvas = document.getElementById('worldCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const pixelRenderer = createPixelAgentsRenderer(canvas);

const TILE = 32;
const COLS = 25;
const ROWS = 17;
const WALLS = new Set(['9,6','10,6','11,6','12,6','13,6','14,6','15,6','9,10','10,10','14,10','15,10']);
const state = { world: normalizeWorldPayload({}), characters: new Map(), zoom: 1, panX: 0, panY: 0, idleCycles: 0, lastFingerprint: '' };

function isWalkable(x, y) { return x >= 1 && y >= 1 && x < COLS - 1 && y < ROWS - 1 && !WALLS.has(x + ',' + y); }
function center(tile) { return { x: tile[0] * TILE + TILE / 2, y: tile[1] * TILE + TILE / 2 }; }
function now() { return performance.now() / 1000; }
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fingerprint(data) { return JSON.stringify([(data.agents || []).map(a => [a.id,a.status,a.updated_at]), (data.events || [])[0]?.id, (data.tasks || []).map(t => [t.id,t.status,t.updated_at])]); }

function ensureCharacter(agent) {
  let ch = state.characters.get(agent.id);
  if (ch) return ch;
  const spawn = center(AGENT_ROSTER[agent.id].lounge);
  ch = { id: agent.id, x: spawn.x, y: spawn.y, tile: AGENT_ROSTER[agent.id].lounge, path: [], frame: 0, mode: 'idle', bubbleUntil: 0, bubbleText: '' };
  state.characters.set(agent.id, ch);
  return ch;
}

function destination(agent) {
  if (agent.behavior.destination === 'offsite') return [-4, AGENT_ROSTER[agent.id].desk[1]];
  return AGENT_ROSTER[agent.id][agent.behavior.destination] || AGENT_ROSTER[agent.id].desk;
}

function syncCharacters() {
  const ids = new Set();
  for (const agent of state.world.agents) {
    ids.add(agent.id);
    const ch = ensureCharacter(agent);
    ch.mode = agent.behavior.animation;
    if (agent.speech) {
      ch.bubbleText = agent.speech.text;
      ch.bubbleKind = 'REAL EVENT';
      ch.bubbleUntil = now() + 7;
      ch.mode = 'talk';
    } else if (agent.status === 'waiting') {
      ch.bubbleText = 'idle';
      ch.bubbleKind = 'IDLE';
      ch.bubbleUntil = 0;
    }
    const target = destination(agent);
    if (ch.targetKey !== target.join(',')) {
      ch.targetKey = target.join(',');
      ch.path = findPath(ch.tile, target, isWalkable);
      if (!ch.path.length && isWalkable(target[0], target[1])) ch.path = [target];
    }
  }
  for (const id of state.characters.keys()) if (!ids.has(id)) state.characters.delete(id);
}

function update(dt) {
  for (const ch of state.characters.values()) {
    ch.frame += dt;
    if (!ch.path.length) continue;
    const next = center(ch.path[0]);
    const dx = next.x - ch.x;
    const dy = next.y - ch.y;
    const dist = Math.hypot(dx, dy);
    const step = Math.min(dist, dt * 84);
    if (dist <= 1) {
      ch.tile = ch.path.shift();
      ch.x = next.x;
      ch.y = next.y;
    } else {
      ch.x += dx / dist * step;
      ch.y += dy / dist * step;
      ch.mode = 'walk';
    }
  }
}

function drawRoom(x, y, w, h, label, accent = '#b54cff') {
  ctx.fillStyle = '#151719'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
  ctx.fillStyle = 'rgba(118,86,58,.55)'; ctx.fillRect(x + 12, y + h - 24, w - 24, 12);
  ctx.strokeStyle = '#554a40'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(181,76,255,.45)'; ctx.beginPath(); ctx.moveTo(x + 10, y + 28); ctx.lineTo(x + w - 10, y + 28); ctx.stroke();
  ctx.fillStyle = accent; ctx.fillRect(x + 10, y + 10, 18, 4);
  ctx.fillStyle = '#d8cabc'; ctx.font = '10px ui-monospace, monospace'; ctx.fillText(label, x + 10, y + 23);
}

function drawPlant(x, y, size = 1) {
  ctx.fillStyle = '#5c432f'; ctx.fillRect(x - 5 * size, y + 10 * size, 10 * size, 12 * size);
  ctx.fillStyle = '#2f6b46';
  ctx.beginPath(); ctx.ellipse(x - 8 * size, y + 3 * size, 8 * size, 15 * size, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 7 * size, y + 2 * size, 8 * size, 16 * size, .55, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y - 6 * size, 9 * size, 19 * size, 0, 0, Math.PI * 2); ctx.fill();
}

function drawDesk(x, y, w = 52) {
  ctx.fillStyle = '#8a603d'; ctx.fillRect(x, y, w, 9);
  ctx.fillStyle = '#332922'; ctx.fillRect(x + 4, y + 9, 5, 20); ctx.fillRect(x + w - 9, y + 9, 5, 20);
  ctx.fillStyle = '#d7c7af'; ctx.fillRect(x + 11, y - 7, 20, 7);
}

function render() {
  const dpr = devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
  ctx.setTransform(dpr * state.zoom, 0, 0, dpr * state.zoom, dpr * state.panX, dpr * state.panY);
  ctx.clearRect(-state.panX / state.zoom, -state.panY / state.zoom, canvas.width, canvas.height);
  pixelRenderer.render({ characters: state.characters, roster: AGENT_ROSTER, now });
  return;
/*
  ctx.fillStyle = 'rgba(245,184,105,.12)'; ctx.beginPath(); ctx.ellipse(13 * TILE, 8 * TILE, 190, 110, 0, 0, Math.PI * 2); ctx.fill();
  drawRoom(2 * TILE, 1 * TILE, 6 * TILE, 4 * TILE, 'FOUNDER', '#b54cff');
  drawRoom(2 * TILE, 6 * TILE, 7 * TILE, 4 * TILE, 'RESEARCH', '#9f79ff');
  drawRoom(2 * TILE, 11 * TILE, 7 * TILE, 4 * TILE, 'MARKETING', '#c96cff');
  drawRoom(17 * TILE, 6 * TILE, 6 * TILE, 4 * TILE, 'ADMIN', '#7bb7ff');
  drawRoom(17 * TILE, 11 * TILE, 6 * TILE, 4 * TILE, 'FINANCE', '#d9a35f');
  drawRoom(10 * TILE, 1 * TILE, 6 * TILE, 3 * TILE, 'CAFE', '#d9a35f');
  drawRoom(18 * TILE, 14 * TILE, 5 * TILE, 2 * TILE, 'RECEPTION', '#b54cff');
  ctx.fillStyle = '#2a2421'; ctx.fillRect(21 * TILE, 14 * TILE + 30, 46, 36);
  ctx.fillStyle = '#51483f'; ctx.fillRect(21 * TILE + 7, 14 * TILE + 36, 12, 24); ctx.fillRect(21 * TILE + 27, 14 * TILE + 36, 12, 24);
  ctx.fillStyle = '#d8cabc'; ctx.font = '9px ui-monospace, monospace'; ctx.fillText('ELEVATORS', 21 * TILE - 3, 14 * TILE + 26);
  ctx.fillStyle = '#261f27'; ctx.fillRect(10 * TILE, 6 * TILE, 6 * TILE, 5 * TILE);
  ctx.strokeStyle = 'rgba(181,76,255,.5)'; ctx.strokeRect(10 * TILE, 6 * TILE, 6 * TILE, 5 * TILE);
  ctx.fillStyle = '#6f563d'; ctx.fillRect(11 * TILE, 12 * TILE, 4 * TILE, 28);
  ctx.fillStyle = '#2d6b45'; ctx.beginPath(); ctx.arc(13 * TILE, 8 * TILE, 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#43915e'; ctx.beginPath(); ctx.arc(12 * TILE + 18, 8 * TILE - 12, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6f4a30'; ctx.fillRect(13 * TILE - 5, 8 * TILE + 25, 10, 52);
  ctx.fillStyle = '#d8cabc'; ctx.font = '10px ui-monospace, monospace'; ctx.fillText('ATRIUM', 12 * TILE + 22, 7 * TILE - 24);
  drawDesk(3 * TILE + 18, 3 * TILE + 10); drawDesk(3 * TILE + 22, 8 * TILE + 18); drawDesk(3 * TILE + 20, 13 * TILE + 10);
  drawDesk(18 * TILE + 10, 8 * TILE + 18); drawDesk(18 * TILE + 12, 13 * TILE + 10);
  drawPlant(8 * TILE, 5 * TILE, .9); drawPlant(16 * TILE, 5 * TILE, .9); drawPlant(9 * TILE, 13 * TILE, .8); drawPlant(17 * TILE, 12 * TILE, .8);
  ctx.fillStyle = '#b54cff'; ctx.font = 'bold 12px ui-sans-serif'; ctx.fillText('INSPIRE HQ CANVAS WORLD', 10 * TILE + 12, 6 * TILE + 20);
  const chars = [...state.characters.values()].sort((a, b) => a.y - b.y);
  for (const ch of chars) drawCharacter(ch);
*/
}

function drawCharacter(ch) {
  const roster = AGENT_ROSTER[ch.id];
  if (!roster) return;
  const bob = ch.mode === 'type' || ch.mode === 'read' || ch.mode === 'talk' ? Math.sin(ch.frame * 8) * 2 : 0;
  ctx.save();
  ctx.translate(ch.x, ch.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 17, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = roster.color; ctx.fillRect(-10, -4, 20, 24);
  ctx.fillStyle = '#d4a07c'; ctx.fillRect(-8, -24, 16, 16);
  ctx.fillStyle = '#171319'; ctx.fillRect(-9, -28, 18, 8);
  ctx.fillStyle = '#111'; ctx.fillRect(-4, -18, 2, 2); ctx.fillRect(4, -18, 2, 2);
  ctx.fillStyle = '#733840';
  const mouth = ch.mode === 'talk' ? 2 + Math.abs(Math.sin(ch.frame * 14)) * 4 : 2;
  ctx.fillRect(-3, -12, 6, mouth);
  if (ch.mode === 'type') { ctx.fillStyle = '#d9dee8'; ctx.fillRect(-14, 16, 28, 4); }
  if (ch.mode === 'read') { ctx.strokeStyle = '#d9dee8'; ctx.strokeRect(-13, 10, 26, 13); }
  ctx.restore();
  ctx.fillStyle = '#0d1118'; ctx.strokeStyle = ch.mode === 'talk' ? '#b54cff' : '#343b48';
  ctx.lineWidth = 1; roundRect(ch.x - 42, ch.y - 62, 84, 24, 5, true, true);
  ctx.fillStyle = '#f4f6fb'; ctx.font = 'bold 10px ui-sans-serif'; ctx.fillText(roster.label, ch.x - 34, ch.y - 47);
  if (ch.bubbleUntil > now()) drawBubble(ch, ch.bubbleKind, ch.bubbleText);
}

function drawBubble(ch, kind, text) {
  const x = ch.x + 20, y = ch.y - 88, w = 190, h = 42;
  ctx.fillStyle = '#f8f6fb'; ctx.strokeStyle = kind === 'REAL EVENT' ? '#b54cff' : '#9aa3b2';
  roundRect(x, y, w, h, 8, true, true);
  ctx.fillStyle = '#76528e'; ctx.font = 'bold 8px ui-monospace, monospace'; ctx.fillText(kind, x + 8, y + 13);
  ctx.fillStyle = '#161b24'; ctx.font = '10px ui-sans-serif'; wrapText(text, x + 8, y + 27, w - 16, 12);
}

function roundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  if (fill) ctx.fill(); if (stroke) ctx.stroke();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, y); line = word; y += lineHeight; }
    else line = test;
  }
  ctx.fillText(line, x, y);
}

function renderPanel() {
  const inbox = state.world.founderInbox?.unreadFounderMessages || [];
  document.getElementById('inbox').innerHTML = inbox.length
    ? inbox.map((m) => '<div class="row"><b>' + esc(m.subject || 'Message') + '</b><div class="muted">' + esc(m.sender_name || m.sender_agent_id || 'agent') + '</div><button class="pill" data-read="' + esc(m.id) + '">Mark read</button></div>').join('')
    : '<div class="row muted">Founder Inbox clear.</div>';
  document.getElementById('agents').innerHTML = state.world.agents.map((a) => '<div class="row agent ' + esc(a.status) + '"><div><span class="dot"></span><b>' + esc(a.label) + '</b><div class="muted">' + esc(a.statusReason || a.role) + '</div></div><span class="pill">' + esc(a.status) + '</span></div>').join('');
  document.getElementById('events').innerHTML = state.world.events.slice(0, 8).map((e) => '<div class="row event"><b>' + esc(e.event_type) + '</b><div>' + esc(e.summary) + '</div><div class="muted">' + esc(e.actor_name || e.actor_agent_id || 'system') + '</div></div>').join('') || '<div class="row muted">No events.</div>';
  document.getElementById('tasks').innerHTML = state.world.tasks.slice(0, 8).map((t) => '<div class="row"><b>' + esc(t.title) + '</b><div class="muted">' + esc(t.owner_name || t.owner_agent_id || 'unassigned') + ' · ' + esc(t.status) + '</div></div>').join('') || '<div class="row muted">No tasks.</div>';
}

async function load() {
  try {
    const scenario = new URLSearchParams(location.search).get('scenario');
    const bootstrapPath = scenario ? '/api/bootstrap?scenario=' + encodeURIComponent(scenario) : '/api/bootstrap';
    const response = await fetch(bootstrapPath, { cache: 'no-store' });
    const payload = await response.json();
    const fp = fingerprint(payload);
    state.idleCycles = fp === state.lastFingerprint ? state.idleCycles + 1 : 0;
    state.lastFingerprint = fp;
    state.world = normalizeWorldPayload(payload);
    syncCharacters();
    renderPanel();
  } catch (error) {
    const box = document.getElementById('errorBox');
    box.textContent = 'Preview failed to load';
    box.classList.add('show');
  }
}

function nextDelay() {
  if (document.hidden) return 60000;
  if (state.idleCycles >= 6) return 30000;
  if (state.idleCycles >= 2) return 15000;
  return 8000;
}

async function poll() {
  await load();
  const delay = nextDelay();
  document.getElementById('pollState').textContent = delay / 1000 + 's poll';
  setTimeout(poll, delay);
}

let last = 0;
function frame(t) {
  const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
  last = t;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

document.getElementById('zoomIn').onclick = () => { state.zoom = Math.min(1.8, state.zoom + 0.1); };
document.getElementById('zoomOut').onclick = () => { state.zoom = Math.max(0.75, state.zoom - 0.1); };
document.getElementById('reset').onclick = () => { state.zoom = 1; state.panX = 0; state.panY = 0; };
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-read]');
  if (!button) return;
  await fetch('/api/messages/' + encodeURIComponent(button.getAttribute('data-read')) + '/read', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: '{}' });
  await load();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
poll();
requestAnimationFrame(frame);
</script>
</body></html>`;
}
