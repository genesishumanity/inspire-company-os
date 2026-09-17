import fs from 'node:fs';

const ui = fs.readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');

function expect(fragment, message) {
  if (!ui.includes(fragment)) throw new Error(message);
}

function reject(fragment, message) {
  if (ui.includes(fragment)) throw new Error(message);
}

expect("['agent_output','message_sent'", 'HQ speech must derive from real agent output or message events');
expect("ageSeconds(e.ts)<=75", 'real speech animation must be bounded to a recent backend event');
expect("agent-world.speaking .sprite-mouth", 'speaking agents must have a visible mouth animation state');
expect("a.status==='thinking'", 'thinking visualization must derive from backend agent state');
expect("['working','thinking','reviewing']", 'active office motion must derive from real active statuses');
expect("latest real event", 'idle agents must preserve truthful backend activity rather than fabricate work');
expect("prefers-reduced-motion:reduce", 'HQ animation must respect reduced-motion preferences');
expect("'founder-office':{display:'Can'", 'Founder presence must be visually mapped to Can');
expect("'admin':{display:'Admin'", 'Admin must have a fixed HQ identity');
expect("'research':{display:'Research'", 'Research must have a fixed HQ identity');
expect("'marketing':{display:'Marketing'", 'Marketing must have a fixed HQ identity');
expect("'finance':{display:'Finance'", 'Finance must have a fixed HQ identity');
expect('KITCHEN &amp; CAFÉ', 'approved café zone must exist');
expect('RECEPTION', 'approved reception zone must exist');
expect('ELEVATORS', 'approved elevator bank must exist');
expect('ROOFTOP TERRACE', 'approved rooftop terrace must exist');
expect('IDEAS LIVE HERE.', 'central atrium hero must exist');
expect('data-view="control"', 'Control Room must remain a separate view');
expect('REAL EVENT', 'real agent speech must be visually distinguished');
expect('OFFICE', 'ambient office chatter must be visually distinguished from real output');
reject('32 Agents', 'UI must not invent a 32-agent roster');

console.log('ui live-office contract ok');
