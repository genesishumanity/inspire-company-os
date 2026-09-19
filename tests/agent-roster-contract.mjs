import fs from 'node:fs';

const seed = fs.readFileSync('migrations/0001_init.sql', 'utf8');
const launch = fs.readFileSync('migrations/0010_launch_agent_roster.sql', 'utf8');
const combined = seed + '\n' + launch;

const expected = [
  'admin','founder-office','research','marketing','finance',
  'design','growth','seo','performance','sales','legal','security','launch-qa',
  'customer-intelligence','web','company-os-engineer','release-infrastructure',
  'social-media','workforce-performance'
];

for (const id of expected) {
  if (!combined.includes(`('${id}',`)) {
    console.error(`Missing approved launch agent: ${id}`);
    process.exit(1);
  }
}

if (!launch.includes('"expected_total":19')) {
  console.error('Launch roster audit count must remain 19');
  process.exit(1);
}

console.log('Launch agent roster contract passed: 19 approved agents.');
