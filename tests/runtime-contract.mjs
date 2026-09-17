import fs from 'node:fs';

const entry = fs.readFileSync('src/entry.js', 'utf8');
const index = fs.readFileSync('src/index.js', 'utf8');
const scheduler = fs.readFileSync('src/scheduler.js', 'utf8');
const ui = fs.readFileSync('src/ui.js', 'utf8');
const wrangler = fs.readFileSync('wrangler.toml', 'utf8');

function expect(source, pattern, label) {
  if (!pattern.test(source)) {
    console.error(`Missing runtime contract: ${label}`);
    process.exit(1);
  }
}

function reject(source, pattern, label) {
  if (pattern.test(source)) {
    console.error(`Forbidden runtime contract: ${label}`);
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
expect(entry, /schedule_guard_deferred/, 'scheduler soft-cap preservation guard');
expect(entry, /const reserve = 3;/, 'scheduler capacity reserve');
expect(entry, /runDueSchedules\(env\)/, 'cron routes through leased scheduler');
reject(entry, /url\.pathname === ['\"]\/health['\"].*return app\.fetch/s, 'public health bypass');
reject(entry, /app\.scheduled\(/, 'legacy unleased cron execution');

expect(scheduler, /MAX_RUNS_PER_TICK = 3/, 'bounded scheduler batch');
expect(scheduler, /claim_token/, 'atomic scheduler claim token');
expect(scheduler, /lease_until/, 'scheduler lease expiry');
expect(scheduler, /consecutive_failures/, 'scheduler failure circuit breaker');
expect(scheduler, /MAX_CONSECUTIVE_FAILURES = 3/, 'scheduler terminal failure threshold');
expect(scheduler, /schedule_blocked/, 'terminal schedule block event');
expect(scheduler, /founder_attention/, 'terminal failure routes to Founder Inbox');
expect(scheduler, /paidFallbackUsed: false/, 'scheduler paid fallback prohibition');

expect(index, /paid fallback/i, 'no-paid-fallback AI guardrail');
expect(index, /AI_DAILY_REQUEST_SOFT_CAP/, 'AI daily soft cap');
expect(index, /createFounderNotice/, 'Founder attention/approval path');
expect(ui, /founder/i, 'Founder Inbox UI surface');
expect(wrangler, /workers_dev = false/, 'workers.dev disabled');
expect(wrangler, /preview_urls = false/, 'preview URLs disabled');
expect(wrangler, /ops\.getinspiration\.com/, 'ops custom domain');
expect(wrangler, /REPLACE_WITH_COMPANY_OS_D1_ID/, 'production D1 requires explicit activation');

console.log('Company OS runtime contract checks passed.');
