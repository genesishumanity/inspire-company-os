import { runAgent } from './index.js';

const MAX_RUNS_PER_TICK = 3;
const CANDIDATE_SCAN = 6;
const LEASE_MINUTES = 10;
const MAX_CONSECUTIVE_FAILURES = 3;

function clean(value, max = 1000) {
  return String(value ?? '').trim().slice(0, max);
}

function isoAfterMinutes(minutes) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function nextUtcReset() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 5, 0)).toISOString();
}

export function nextRecurringTime(recurrence, scheduledAt, nowMs = Date.now()) {
  const periods = {
    hourly: 60 * 60_000,
    daily: 24 * 60 * 60_000,
    weekly: 7 * 24 * 60 * 60_000,
  };
  const periodMs = periods[recurrence];
  const scheduledMs = new Date(scheduledAt).getTime();
  if (!periodMs || Number.isNaN(scheduledMs)) throw new Error('invalid_recurring_schedule');

  // Anchor recurrence to the planned slot, never the retry/execution timestamp.
  // Missed slots are skipped; the first future slot wins so there is no burst replay.
  if (scheduledMs > nowMs) return new Date(scheduledMs).toISOString();
  const elapsedSlots = Math.floor((nowMs - scheduledMs) / periodMs) + 1;
  return new Date(scheduledMs + elapsedSlots * periodMs).toISOString();
}

function quotaLike(value) {
  const text = String(value || '').toLowerCase();
  return ['quota', 'neuron', 'capacity', '429', '3040', '5035', 'rate limit', 'daily_soft_cap'].some((term) => text.includes(term));
}

async function activity(env, agentId, eventType, summary, payload, scheduleId) {
  await env.COMPANY_OS_DB.prepare(
    `INSERT INTO activity_events (actor_agent_id,event_type,summary,payload_json,related_type,related_id)
     VALUES (?,?,?,?, 'schedule', ?)`
  ).bind(agentId || null, eventType, clean(summary, 1000), JSON.stringify(payload || {}), String(scheduleId)).run();
}

async function audit(env, action, scheduleId, details) {
  await env.COMPANY_OS_DB.prepare(
    `INSERT INTO audit_log (actor_type,actor_id,action,entity_type,entity_id,details_json)
     VALUES ('system','scheduler',?,'schedule',?,?)`
  ).bind(action, String(scheduleId), JSON.stringify(details || {})).run();
}

async function claimSchedule(env, id) {
  const token = crypto.randomUUID();
  const leaseUntil = isoAfterMinutes(LEASE_MINUTES);
  const result = await env.COMPANY_OS_DB.prepare(
    `UPDATE schedules
     SET claim_token=?, lease_until=?, attempt_count=attempt_count+1, updated_at=CURRENT_TIMESTAMP
     WHERE id=?
       AND enabled=1
       AND datetime(next_run_at) <= datetime('now')
       AND (lease_until IS NULL OR datetime(lease_until) < datetime('now'))`
  ).bind(token, leaseUntil, id).run();

  if (Number(result?.meta?.changes || 0) !== 1) return null;
  return env.COMPANY_OS_DB.prepare(
    `SELECT * FROM schedules WHERE id=? AND claim_token=?`
  ).bind(id, token).first();
}

async function finishSuccess(env, schedule) {
  let nextRunAt = null;
  const cadenceFrom = schedule.cadence_anchor_at || schedule.next_run_at;

  if (schedule.recurrence === 'once') {
    await env.COMPANY_OS_DB.prepare(
      `UPDATE schedules
       SET enabled=0,last_run_at=CURRENT_TIMESTAMP,claim_token=NULL,lease_until=NULL,
           consecutive_failures=0,last_error=NULL,updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND claim_token=?`
    ).bind(schedule.id, schedule.claim_token).run();
  } else {
    nextRunAt = nextRecurringTime(schedule.recurrence, cadenceFrom);
    await env.COMPANY_OS_DB.prepare(
      `UPDATE schedules
       SET last_run_at=CURRENT_TIMESTAMP,next_run_at=?,cadence_anchor_at=?,claim_token=NULL,lease_until=NULL,
           consecutive_failures=0,last_error=NULL,updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND claim_token=?`
    ).bind(nextRunAt, nextRunAt, schedule.id, schedule.claim_token).run();
  }

  const details = {
    scheduleId: schedule.id,
    recurrence: schedule.recurrence,
    cadenceFrom,
    attemptedAt: schedule.next_run_at,
    nextRunAt,
  };
  await activity(env, schedule.agent_id, 'schedule_completed', `${schedule.title} completed`, details, schedule.id);
  await audit(env, 'schedule_completed', schedule.id, details);
}

async function deferSchedule(env, schedule, reason, retryAt) {
  const cadenceAnchorAt = schedule.cadence_anchor_at || schedule.next_run_at;
  await env.COMPANY_OS_DB.prepare(
    `UPDATE schedules
     SET next_run_at=?,claim_token=NULL,lease_until=NULL,last_error=?,updated_at=CURRENT_TIMESTAMP
     WHERE id=? AND claim_token=?`
  ).bind(retryAt, clean(reason, 1000), schedule.id, schedule.claim_token).run();
  await activity(env, schedule.agent_id, 'schedule_deferred', `${schedule.title} deferred`, {
    scheduleId: schedule.id,
    reason: clean(reason, 500),
    retryAt,
    cadenceAnchorAt,
    paidFallbackUsed: false,
  }, schedule.id);
  await audit(env, 'schedule_deferred', schedule.id, { reason: clean(reason, 500), retryAt, cadenceAnchorAt, paidFallbackUsed: false });
}

async function failSchedule(env, schedule, reason) {
  const nextFailures = Number(schedule.consecutive_failures || 0) + 1;
  const terminal = nextFailures >= MAX_CONSECUTIVE_FAILURES;
  const retryAt = isoAfterMinutes(Math.min(120, 30 * nextFailures));
  const cadenceAnchorAt = schedule.cadence_anchor_at || schedule.next_run_at;

  await env.COMPANY_OS_DB.prepare(
    `UPDATE schedules
     SET consecutive_failures=?,last_error=?,next_run_at=?,enabled=?,claim_token=NULL,lease_until=NULL,updated_at=CURRENT_TIMESTAMP
     WHERE id=? AND claim_token=?`
  ).bind(nextFailures, clean(reason, 1000), retryAt, terminal ? 0 : 1, schedule.id, schedule.claim_token).run();

  await activity(env, schedule.agent_id, terminal ? 'schedule_blocked' : 'schedule_retry', terminal ? `${schedule.title} blocked after repeated failures` : `${schedule.title} will retry`, {
    scheduleId: schedule.id,
    consecutiveFailures: nextFailures,
    reason: clean(reason, 500),
    retryAt: terminal ? null : retryAt,
    cadenceAnchorAt,
  }, schedule.id);
  await audit(env, terminal ? 'schedule_blocked' : 'schedule_retry', schedule.id, {
    consecutiveFailures: nextFailures,
    reason: clean(reason, 500),
    retryAt: terminal ? null : retryAt,
    cadenceAnchorAt,
  });

  if (terminal) {
    await env.COMPANY_OS_DB.prepare(
      `INSERT INTO approvals (requested_by_agent_id,action_type,title,rationale,payload_json)
       VALUES (?, 'founder_attention', ?, ?, ?)`
    ).bind(
      schedule.agent_id,
      `Schedule blocked: ${clean(schedule.title, 350)}`,
      `This schedule failed ${MAX_CONSECUTIVE_FAILURES} consecutive times and was disabled to prevent waste.`,
      JSON.stringify({ scheduleId: schedule.id, reason: clean(reason, 700) }),
    ).run();
  }
}

export async function runDueSchedules(env) {
  const due = await env.COMPANY_OS_DB.prepare(
    `SELECT id FROM schedules
     WHERE enabled=1
       AND datetime(next_run_at) <= datetime('now')
       AND (lease_until IS NULL OR datetime(lease_until) < datetime('now'))
     ORDER BY next_run_at ASC
     LIMIT ?`
  ).bind(CANDIDATE_SCAN).all();

  let executed = 0;
  for (const candidate of due.results || []) {
    if (executed >= MAX_RUNS_PER_TICK) break;
    const schedule = await claimSchedule(env, candidate.id);
    if (!schedule) continue;
    executed += 1;

    try {
      await activity(env, schedule.agent_id, 'schedule_claimed', `${schedule.title} claimed for execution`, {
        scheduleId: schedule.id,
        leaseUntil: schedule.lease_until,
        attemptCount: schedule.attempt_count,
        cadenceAnchorAt: schedule.cadence_anchor_at || schedule.next_run_at,
      }, schedule.id);

      const result = await runAgent(
        env,
        schedule.agent_id,
        schedule.instruction,
        `Scheduled event: ${schedule.title}`,
        'schedule',
      );

      if (result?.deferred) {
        const reason = result.reason || 'ai_deferred';
        const retryAt = reason === 'daily_soft_cap' ? nextUtcReset() : isoAfterMinutes(15);
        await deferSchedule(env, schedule, reason, retryAt);
        continue;
      }

      await finishSuccess(env, schedule);
    } catch (error) {
      const reason = clean(error?.message || error || 'schedule_execution_failed', 1000);
      try {
        if (quotaLike(reason)) await deferSchedule(env, schedule, reason, isoAfterMinutes(15));
        else await failSchedule(env, schedule, reason);
      } catch {
        // If D1 is unavailable, leave the lease to expire naturally. This prevents
        // immediate duplicate execution and allows recovery on a later cron tick.
      }
    }
  }

  return { executed, maxPerTick: MAX_RUNS_PER_TICK };
}
