import fs from 'node:fs';

const entry = fs.readFileSync('src/entry.js', 'utf8');
const index = fs.readFileSync('src/index.js', 'utf8');
const ui = fs.readFileSync('src/ui.js', 'utf8');
const wrangler = fs.readFileSync('wrangler.toml', 'utf8');

function expect(source, pattern, label) {
  if (!pattern.test(source)) {
    console.error(`Missing runtime contract: ${label}`);
    process.exit(1);
  }
}

for (const status of ['working', 'thinking', 'waiting', 'blocked', 'reviewing', 'sleeping']) {
  expect(index, new RegExp(`['\"]${status}['\"]`), `status ${status}`);
}

for (const endpoint of [
  '/api/bootstrap',
  '/api/founder-inbox',
  '/api/usage',
  '/api/audit',
  '/api/messages',
  '/api/tasks',
  '/api/approvals',
  '/api/schedules',
  '/run',
]) {
  expect(index, new RegExp(endpoint.replaceAll('/', '\\/')), `endpoint ${endpoint}`);
}

expect(entry, /authorizeRequest\(/, 'Cloudflare Access authorization wrapper');
expect(entry, /access_not_configured/, 'fail-closed Access configuration');
expect(entry, /storage_deferred/, 'D1 quota graceful defer');
expect(index, /paid fallback/i, 'no-paid-fallback AI guardrail');
expect(index, /AI_DAILY_REQUEST_SOFT_CAP/, 'AI daily soft cap');
expect(index, /createFounderNotice/, 'Founder attention/approval path');
expect(index, /processSchedules/, 'bounded scheduled work processing');
expect(ui, /founder/i, 'Founder Inbox UI surface');
expect(wrangler, /workers_dev = false/, 'workers.dev disabled');
expect(wrangler, /preview_urls = false/, 'preview URLs disabled');
expect(wrangler, /ops\.getinspiration\.com/, 'ops custom domain');
expect(wrangler, /REPLACE_WITH_COMPANY_OS_D1_ID/, 'production D1 requires explicit activation');

console.log('Company OS runtime contract checks passed.');
