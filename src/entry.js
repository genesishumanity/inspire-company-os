import app from './index.js';
import { authorizeRequest } from './auth.js';
import { runDueSchedules } from './scheduler.js';
import { reservedAiRequests } from './ai-budget.js';

const SAFE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...SAFE_HEADERS, ...extraHeaders },
  });
}

function clean(value, max = 4000) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, max);
}

async function bodyJson(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 100_000) throw new Error('request_too_large');
  try {
    return await request.json();
  } catch {
    throw new Error('invalid_json');
  }
}

function envEmails(env, key) {
  return String(env[key] || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isFounderApprover(env, auth) {
  if (env.AUTH_MODE === 'local') return true;
  const allowlist = envEmails(env, 'FOUNDER_APPROVER_EMAILS');
  if (!allowlist.length) return false;
  return allowlist.includes(String(auth.email || '').toLowerCase());
}

function mutationGuard(request) {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) return null;
  const fetchSite = String(request.headers.get('sec-fetch-site') || '').toLowerCase();
  if (fetchSite === 'cross-site') return json({ error: 'cross_site_mutation_blocked' }, 403);
  if (request.method !== 'DELETE' && !String(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
    return json({ error: 'application_json_required' }, 415);
  }
  return null;
}

function retryAfterMidnightUtc() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return String(Math.max(60, Math.ceil((next.getTime() - now.getTime()) / 1000)));
}

function d1QuotaLike(message) {
  const text = String(message || '').toLowerCase();
  return text.includes('d1') && (
    text.includes('free tier') ||
    text.includes('row read limit') ||
    text.includes('row write limit') ||
    text.includes('daily limit')
  );
}

function aiQuotaLike(message) {
  const text = String(message || '').toLowerCase();
  return ['quota', 'neuron', 'capacity', '429', '3040', '5035', 'rate limit'].some((term) => text.includes(term));
}

async function normalizeRuntimeLimitResponse(response, path) {
  if (response.status < 500 || !response.headers.get('content-type')?.includes('application/json')) return response;
  const clone = response.clone();
  let payload;
  try {
    payload = await clone.json();
  } catch {
    return response;
  }
  const message = payload?.error || '';
  if (d1QuotaLike(message)) {
    return json(
      { error: 'storage_deferred', reason: 'd1_free_tier_daily_limit', retry_at: '00:00 UTC' },
      503,
      { 'retry-after': retryAfterMidnightUtc() },
    );
  }
  if (path.includes('/run') && aiQuotaLike(message)) {
    return json({ deferred: true, reason: 'workers_ai_quota_or_capacity', paid_fallback_used: false }, 202);
  }
  return response;
}

async function addAgent(request, env, actor) {
  const payload = await bodyJson(request);
  const id = clean(payload.id, 80).toLowerCase();
  const name = clean(payload.name, 160);
  const department = clean(payload.department, 200);
  const rolePrompt = clean(payload.role_prompt, 6000);
  const sources = Array.isArray(payload.knowledge_sources)
    ? payload.knowledge_sources.map((item) => clean(item, 500)).filter(Boolean).slice(0, 30)
    : [];

  if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(id)) return json({ error: 'invalid_agent_id' }, 400);
  if (!name || !department || !rolePrompt) return json({ error: 'name_department_role_prompt_required' }, 400);

  try {
    await env.COMPANY_OS_DB.prepare(
      `INSERT INTO agents (id,name,department,role_prompt,knowledge_sources,status,status_reason)
       VALUES (?,?,?,?,?,'sleeping','Registered; no backend work event yet')`
    ).bind(id, name, department, rolePrompt, JSON.stringify(sources)).run();
  } catch (error) {
    if (String(error?.message || error).toLowerCase().includes('unique')) return json({ error: 'agent_already_exists' }, 409);
    throw error;
  }

  await env.COMPANY_OS_DB.batch([
    env.COMPANY_OS_DB.prepare(
      `INSERT INTO activity_events (actor_agent_id,event_type,summary,payload_json,related_type,related_id)
       VALUES (?, 'agent_registered', ?, ?, 'agent', ?)`
    ).bind(id, `${name} registered`, JSON.stringify({ department, sources }), id),
    env.COMPANY_OS_DB.prepare(
      `INSERT INTO audit_log (actor_type,actor_id,action,entity_type,entity_id,details_json)
       VALUES ('human', ?, 'agent_registered', 'agent', ?, ?)`
    ).bind(actor, id, JSON.stringify({ name, department, sources })),
  ]);

  return json({ id, name, department, status: 'sleeping' }, 201);
}

async function approvalGateForTask(request, env, path) {
  const match = path.match(/^\/api\/tasks\/(\d+)$/);
  if (request.method !== 'PATCH' || !match) return null;
  const payload = await bodyJson(request.clone());
  if (!['in_progress', 'review', 'done'].includes(payload.status)) return null;

  const task = await env.COMPANY_OS_DB.prepare(
    `SELECT t.approval_required, t.approval_id, a.status AS approval_status
     FROM tasks t LEFT JOIN approvals a ON a.id=t.approval_id
     WHERE t.id=?`
  ).bind(Number(match[1])).first();

  if (!task) return null;
  if (Number(task.approval_required || 0) === 1 && task.approval_status !== 'approved') {
    return json({ error: 'founder_approval_required', approval_id: task.approval_id || null }, 409);
  }
  return null;
}

async function securedFetch(request, env, ctx) {
  const url = new URL(request.url);
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status || 403);

  const mutationBlocked = mutationGuard(request);
  if (mutationBlocked) return mutationBlocked;

  // Status is operational truth, not a cosmetic control. In production it may only
  // change through real task/message/AI/scheduler events.
  if (request.method === 'PATCH' && /^\/api\/agents\/[a-z0-9-]+\/status$/.test(url.pathname) && env.AUTH_MODE !== 'local') {
    return json({ error: 'manual_status_disabled' }, 405);
  }

  // Approval decisions are Founder-only. Missing production configuration fails closed.
  if (request.method === 'PATCH' && /^\/api\/approvals\/\d+$/.test(url.pathname)) {
    const approvers = envEmails(env, 'FOUNDER_APPROVER_EMAILS');
    if (env.AUTH_MODE !== 'local' && !approvers.length) return json({ error: 'founder_approvers_not_configured' }, 503);
    if (!isFounderApprover(env, auth)) return json({ error: 'founder_approval_forbidden' }, 403);
  }

  const taskApprovalBlocked = await approvalGateForTask(request, env, url.pathname);
  if (taskApprovalBlocked) return taskApprovalBlocked;

  const headers = new Headers(request.headers);
  headers.set('Cf-Access-Authenticated-User-Email', auth.email || auth.subject || 'access-user');
  const authenticatedRequest = new Request(request, { headers });

  try {
    if (request.method === 'POST' && url.pathname === '/api/agents') {
      return await addAgent(authenticatedRequest, env, auth.email || auth.subject || 'access-user');
    }
    const response = await app.fetch(authenticatedRequest, env, ctx);
    return await normalizeRuntimeLimitResponse(response, url.pathname);
  } catch (error) {
    const message = String(error?.message || error || 'internal_error');
    if (d1QuotaLike(message)) {
      return json(
        { error: 'storage_deferred', reason: 'd1_free_tier_daily_limit', retry_at: '00:00 UTC' },
        503,
        { 'retry-after': retryAfterMidnightUtc() },
      );
    }
    return json({ error: 'internal_error' }, 500);
  }
}

async function scheduledFetch(_controller, env, ctx) {
  // Keep enough headroom for a full cron batch. Count atomic reservations as
  // well as completed usage so in-flight manual runs cannot make the guard optimistic.
  const reserve = 3;
  const softCap = Math.max(1, Number(env.AI_DAILY_REQUEST_SOFT_CAP || 100));

  try {
    const [usage, reserved] = await Promise.all([
      env.COMPANY_OS_DB.prepare(
        `SELECT COUNT(*) AS requests
         FROM ai_usage
         WHERE ts >= date('now')
           AND ts < datetime(date('now'), '+1 day')`
      ).first(),
      reservedAiRequests(env),
    ]);
    const loggedRequests = Number(usage?.requests || 0);
    const reservedRequests = Number(reserved || 0);
    const requests = Math.max(loggedRequests, reservedRequests);

    if (requests + reserve > softCap) {
      const alreadyLogged = await env.COMPANY_OS_DB.prepare(
        `SELECT id FROM activity_events
         WHERE event_type='schedule_guard_deferred'
           AND ts >= date('now')
           AND ts < datetime(date('now'), '+1 day')
         ORDER BY id DESC LIMIT 1`
      ).first();

      if (!alreadyLogged) {
        await env.COMPANY_OS_DB.batch([
          env.COMPANY_OS_DB.prepare(
            `INSERT INTO activity_events (event_type,summary,payload_json,related_type)
             VALUES ('schedule_guard_deferred', ?, ?, 'scheduler')`
          ).bind(
            `Scheduled AI work deferred to protect the daily soft cap (${softCap})`,
            JSON.stringify({ requests, loggedRequests, reservedRequests, reserve, softCap, paidFallbackUsed: false }),
          ),
          env.COMPANY_OS_DB.prepare(
            `INSERT INTO audit_log (actor_type,actor_id,action,entity_type,details_json)
             VALUES ('system','scheduler','schedule_guard_deferred','scheduler',?)`
          ).bind(JSON.stringify({ requests, loggedRequests, reservedRequests, reserve, softCap, paidFallbackUsed: false })),
        ]);
      }
      return;
    }
  } catch {
    // Fail closed for scheduled inference. If D1 is unavailable or quota-limited,
    // preserving due schedules is safer than attempting work without guardrails.
    return;
  }

  ctx.waitUntil(runDueSchedules(env));
}

export default {
  fetch: securedFetch,
  scheduled: scheduledFetch,
};
