import fs from 'node:fs';

const ui = fs.readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');

function expect(fragment, message) {
  if (!ui.includes(fragment)) throw new Error(message);
}

expect("['agent_output','message_sent'", '2D office must derive speech from real agent output or message events');
expect("ageSeconds(e.ts)<=75", 'speech animation must be bounded to a recent real event');
expect("agent.speaking .mouth", 'speaking agents must have a visible mouth animation state');
expect("a.status==='thinking'", 'thinking visualization must derive from backend agent state');
expect("['working','thinking','reviewing']", 'active office motion must derive from real active statuses');
expect("latest real event", 'idle agents must show truthful recent backend activity rather than fabricated motion');
expect("prefers-reduced-motion:reduce", '2D office animation must respect reduced-motion preferences');

console.log('ui live-office contract ok');
