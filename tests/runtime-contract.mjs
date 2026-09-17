import fs from 'node:fs';

const entry = fs.readFileSync('src/entry.js', 'utf8');
const index = fs.readFileSync('src/index.js', 'utf8');
const auth = fs.readFileSync('src/auth.js', 'utf8');
const scheduler = fs.readFileSync('src/scheduler.js', 'utf8');
const approvalIntegrity = fs.readFileSync('migrations/0005_approval_integrity.sql', 'utf8');
const cadenceIntegrity = fs.readFileSync('migrations/0006_schedule_cadence_anchor.sql', 'utf8');
const founderNoticeDedupe = fs.readFileSync('migrations/0007_founder_notice_dedupe.sql', 'utf8');
const agentRunLeases = fs.readFileSync('migrations/0008_agent_run_leases.sql', 'utf8');
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
expect(entry, /manual_status_disabled/, 'production manual status disabled');
expect(entry, /FOUNDER_APPROVER_EMAILS/, 'Founder-only approval allowlist');
expect(entry, /founder_approval_required/, 'task approval gate');
expect(entry, /cross_site_mutation_blocked/, 'cross-site mutation guard');
expect(entry, /application_json_required/, 'JSON mutation contract');
reject(entry, /url\.pathname === ['\"]\/health['\"].*return app\.fetch/s, 'public health bypass');
reject(entry, /app\.scheduled\(/, 'legacy unleased cron execution');

expect(auth, /jwtVerify\(/, 'Access JWT signature verification');
expect(auth, /issuer: teamDomain/, 'Access issuer verification');
expect(auth, /audience/, 'Access audience verification');
expect(auth, /access_human_identity_required/, 'service-token/non-human Access identity rejected');
expect(auth, /payload\.email/, 'human Access identity derived from signed email claim');

expect(scheduler, /MAX_RUNS_PER_TICK = 3/, 'bounded scheduler batch');
expect(scheduler, /claim_token/, 'atomic scheduler claim token');
expect(scheduler, /lease_until/, 'scheduler lease expiry');
expect(scheduler, /consecutive_failures/, 'scheduler failure circuit breaker');
expect(scheduler, /MAX_CONSECUTIVE_FAILURES = 3/, 'scheduler terminal failure threshold');
expect(scheduler, /schedule_blocked/, 'terminal schedule block event');
expect(scheduler, /founder_attention/, 'terminal schedule failure routes to Founder Inbox');
expect(scheduler, /paidFallbackUsed: false/, 'scheduler paid fallback prohibition');
expect(scheduler, /cadence_anchor_at/, 'retry-safe recurrence cadence');
expect(scheduler, /nextRecurringTime\(schedule\.recurrence, cadenceFrom\)/, 'cadence advances from planned slot');

expect(approvalIntegrity, /approval_not_granted/, 'database approval gate');
expect(approvalIntegrity, /trg_rejected_approval_blocks_task/, 'rejection blocks linked task');
expect(approvalIntegrity, /approval_link_required/, 'approval link integrity');
expect(cadenceIntegrity, /cadence_anchor_at/, 'database cadence anchor');
expect(cadenceIntegrity, /trg_schedule_cadence_anchor_after_insert/, 'new schedules receive cadence anchor');
expect(founderNoticeDedupe, /trg_dedupe_pending_founder_attention/, 'pending Founder alert dedupe');
expect(founderNoticeDedupe, /RAISE\(IGNORE\)/, 'duplicate Founder alert fails quietly without breaking work');
expect(agentRunLeases, /run_token/, 'database agent run token');
expect(agentRunLeases, /run_lease_until/, 'database agent run lease expiry');
expect(agentRunLeases, /last_run_started_at/, 'database agent run start timestamp');
expect(index, /AGENT_RUN_LEASE_MINUTES = 10/, 'bounded agent run lease');
expect(index, /claimAgentRun/, 'atomic agent run claim');
expect(index, /run_lease_until/, 'agent run lease expiry runtime');
expect(index, /run_token=\?/, 'token-scoped agent run lease release');
expect(index, /reason:'agent_busy'/, 'concurrent agent work defers instead of double-running');
expect(index, /try \{ await releaseAgentRun\(env, agentId, leaseToken\); \} catch \{\}/, 'lease release cannot mask completed inference');
expect(index, /derivedFounderInbox/, 'bootstrap reuses loaded Founder Inbox rows');

expect(index, /paid fallback/i, 'no-paid-fallback AI guardrail');
expect(index, /AI_DAILY_REQUEST_SOFT_CAP/, 'AI daily soft cap');
expect(index, /createFounderNotice/, 'Founder attention/approval path');
expect(ui, /founder/i, 'Founder Inbox UI surface');
expect(ui, /nextDelay\(\)/, 'adaptive live polling');
expect(ui, /data-read/, 'Founder Inbox read hygiene');
expect(wrangler, /workers_dev = false/, 'workers.dev disabled');
expect(wrangler, /preview_urls = false/, 'preview URLs disabled');
expect(wrangler, /ops\.getinspiration\.com/, 'ops custom domain');
expect(wrangler, /00000000-0000-0000-0000-000000000000/, 'production D1 requires explicit activation');

console.log('Company OS runtime contract checks passed.');
