import fs from 'node:fs';

const source = fs.readFileSync('src/index.js', 'utf8');

for (const required of [
  "/api/chatgpt/identities",
  "/api/chatgpt/agents/",
  "chatgpt_note",
  "chatgpt_output",
  "chatgpt_handoff",
  "chatgpt_bridge_event",
]) {
  if (!source.includes(required)) {
    console.error(`Missing ChatGPT bridge contract: ${required}`);
    process.exit(1);
  }
}

if (!source.includes("await audit(env, 'human', actorFrom(request), 'chatgpt_bridge_event'")) {
  console.error('ChatGPT bridge writes must remain audited');
  process.exit(1);
}

console.log('ChatGPT bridge contract passed.');
