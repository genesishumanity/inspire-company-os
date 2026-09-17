import { renderOffice } from './ui.js';

const STATUS_VALUES = new Set(['working', 'thinking', 'waiting', 'blocked', 'reviewing', 'sleeping']);
const TASK_STATUS = new Set(['todo', 'in_progress', 'blocked', 'review', 'done']);
const PRIORITIES = new Set(['low', 'normal', 'high', 'critical']);
const RECURRENCES = new Set(['once', 'hourly', 'daily', 'weekly']);
const AGENT_RUN_LEASE_MINUTES = 10;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...SECURITY_HEADERS },
  });
}

function html(body) {
  return new Response(body, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...SECURITY_HEADERS },
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

function actorFrom(request) {
  return clean(request.headers.get('Cf-Access-Authenticated-User-Email') || 'founder', 200);
}

async function audit(env, actorType, actorId, action, entityType = null, entityId = null, details = {}) {
  await env.COMPANY_OS_DB.prepare(
    `INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, details_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(actorType, actorId, action, entityType, entityId === null ? null : String(entityId), JSON.stringify(details)).run();
}

async function activity(env, actorAgentId, eventType, summary, payload = {}, relatedType = null, relatedId = null) {
  await env.COMPANY_OS_DB.prepare(
    `INSERT INTO activity_events (actor_agent_id, event_type, summary, payload_json, related_type, related_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(actorAgentId || null, eventType, clean(summary, 1000), JSON.stringify(payload), relatedType, relatedId === null ? null : String(relatedId)).run();
}

async function getAgent(env, id) {
  return env.COMPANY_OS_DB.prepare('SELECT * FROM agents WHERE id = ?').bind(id).first();
}

async function setStatus(env, id, status, reason, eventType = 'status_changed') {
  if (!STATUS_VALUES.has(status)) throw new Error('invalid_status');
  const existing = await getAgent(env, id);
  if (!existing) throw new Error('agent_not_found');
  if (existing.status === status && (existing.status_reason || '') === (reason || '')) return existing;

  await env.COMPANY_OS_DB.prepare(
    `UPDATE agents SET status=?, status_reason=?, last_event_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(status, clean(reason, 500) || null, id).run();
  await activity(env, id, eventType, `${existing.name} → ${status}`, { from: existing.status, to: status, reason: reason || null }, 'agent', id);
  return getAgent(env, id);
}

function isQuotaSleeping(agent) {
  return agent?.status === 'sleeping' && /soft cap|quota|capacity/i.test(String(agent.status_reason || ''));
}

async function taskDrivenState(env, agentId, fallbackReason = 'Waiting for the next event') {
  const task = await env.COMPANY_OS_DB.prepare(
    `SELECT id,title,status FROM tasks
     WHERE owner_agent_id=? AND status!='done'
     ORDER BY CASE status
       WHEN 'blocked' THEN 1
       WHEN 'in_progress' THEN 2
       WHEN 'review' THEN 3
       WHEN 'todo' THEN 4
       ELSE 5 END,
       updated_at DESC,id DESC
     LIMIT 1`
  ).bind(agentId).first();

  if (!task) return { status: 'waiting', reason: fallbackReason };
  if (task.status === 'blocked') return { status: 'blocked', reason: `Blocked task #${task.id}: ${task.title}` };
  if (task.status === 'in_progress') return { status: 'working', reason: `Active task #${task.id}: ${task.title}` };
  if (task.status === 'review') return { status: 'reviewing', reason: `Review task #${task.id}: ${task.title}` };
  return { status: 'waiting', reason: `Queued task #${task.id}: ${task.title}` };
}

async function syncTaskDrivenStatus(env, agentId, eventType = 'task_status_changed', fallbackReason = 'Waiting for the next event') {
  const current = await getAgent(env, agentId);
  if (!current) throw new Error('agent_not_found');
  if (current.status === 'thinking' || isQuotaSleeping(current)) return current;
  const desired = await taskDrivenState(env, agentId, fallbackReason);
  return setStatus(env, agentId, desired.status, desired.reason, eventType);
}

function quotaLike(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  return ['quota', 'neuron', 'capacity', '429', '3040', '5035', 'exceeded', 'rate limit'].some((x) => msg.includes(x));
}

function extractAIText(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (typeof result.response === 'string') return result.response;
  if (typeof result.result?.response === 'string') return result.result.response;
  if (Array.isArray(result.choices) && result.choices[0]?.message?.content) return result.choices[0].message.content;
  return JSON.stringify(result).slice(0, 12000);
}

async function todayUsage(env) {
  const row = await env.COMPANY_OS_DB.prepare(
    `SELECT COUNT(*) AS requests,
            COALESCE(SUM(input_tokens),0) AS input_tokens,
            COALESCE(SUM(output_tokens),0) AS output_tokens,
            COALESCE(SUM(estimated_neurons),0) AS estimated_neurons,
            COALESCE(SUM(estimated_cost_usd),0) AS estimated_cost_usd
     FROM ai_usage
     WHERE ts>=date('now') AND ts<datetime(date('now'),'+1 day')`
  ).first();
  return row || { requests: 0, input_tokens: 0, output_tokens: 0, estimated_neurons: 0, estimated_cost_usd: 0 };
}

async function createFounderNotice(env, requestedBy, title, rationale, payload = {}) {
  const result = await env.COMPANY_OS_DB.prepare(
    `INSERT INTO approvals (requested_by_agent_id,action_type,title,rationale,payload_json)
     VALUES (?,'founder_attention',?,?,?)`
  ).bind(requestedBy || null, clean(title, 500), clean(rationale, 3000), JSON.stringify(payload)).run();
  return result?.meta?.last_row_id || null;
}

async function claimAgentRun(env, agentId) {
  const token = crypto.randomUUID();
  const leaseUntil = new Date(Date.now() + AGENT_RUN_LEASE_MINUTES * 60_000).toISOString();
  const result = await env.COMPANY_OS_DB.prepare(
    `UPDATE agents
     SET run_token=?, run_lease_until=?, last_run_started_at=CURRENT_TIMESTAMP
     WHERE id=? AND (run_lease_until IS NULL OR datetime(run_lease_until)<=datetime('now'))`
  ).bind(token, leaseUntil, agentId).run();
  return Number(result?.meta?.changes || 0) === 1 ? token : null;
}

async function releaseAgentRun(env, agentId, token) {
  if (!token) return;
  await env.COMPANY_OS_DB.prepare(
    `UPDATE agents SET run_token=NULL,run_lease_until=NULL WHERE id=? AND run_token=?`
  ).bind(agentId, token).run();
}

export async function runAgent(env, agentId, instruction, context = '', source = 'api') {
  const agent = await getAgent(env, agentId);
  if (!agent) throw new Error('agent_not_found');
  const task = clean(instruction, 6000);
  if (!task) throw new Error('instruction_required');

  const usage = await todayUsage(env);
  const softCap = Math.max(1, Number(env.AI_DAILY_REQUEST_SOFT_CAP || 100));
  if (Number(usage.requests || 0) >= softCap) {
    await setStatus(env, agentId, 'sleeping', `AI daily soft cap (${softCap}) reached`, 'ai_deferred');
    await createFounderNotice(env, agentId, `${agent.name} deferred by AI guardrail`, `Daily Company OS AI request soft cap of ${softCap} was reached. No paid fallback was attempted.`, { source });
    await audit(env, 'system', 'quota-guard', 'ai_deferred', 'agent', agentId, { softCap, source });
    return { deferred: true, reason: 'daily_soft_cap', softCap };
  }

  const leaseToken = await claimAgentRun(env, agentId);
  if (!leaseToken) {
    await audit(env, 'system', 'agent-run-lease', 'ai_run_deferred_busy', 'agent', agentId, { source });
    return { deferred: true, reason:'agent_busy' };
  }

  const model = clean(env.AI_MODEL || '@cf/zai-org/glm-4.7-flash', 200);
  try {
    await setStatus(env, agentId, 'thinking', clean(task, 220), 'ai_started');
    const systemPrompt = [
      `You are ${agent.name}, ${agent.department}, inside INSPIRE Company OS.`,
      agent.role_prompt,
      `Knowledge/source-of-truth references: ${agent.knowledge_sources}.`,
      'Operate only inside your role. Do not send email, charge payments, automate customer data, perform destructive GitHub actions, or deploy production.',
      'If an action needs Founder approval, do not execute it. State clearly what approval is needed.',
      'Be concise, evidence-aware, and separate facts from assumptions.',
    ].join('\n');

    const result = await env.AI.run(model, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${task}${context ? `\n\nContext:\n${clean(context, 8000)}` : ''}` },
      ],
      max_completion_tokens: 700,
      temperature: 0.2,
    });
    const output = extractAIText(result);
    const aiUsage = result?.usage || result?.result?.usage || {};
    const inputTokens = Number(aiUsage.prompt_tokens || aiUsage.input_tokens || 0);
    const outputTokens = Number(aiUsage.completion_tokens || aiUsage.output_tokens || 0);
    const estPerRequest = Math.max(0, Number(env.AI_EST_NEURONS_PER_REQUEST || 0));

    await env.COMPANY_OS_DB.prepare(
      `INSERT INTO ai_usage (agent_id,model,input_tokens,output_tokens,estimated_neurons,estimated_cost_usd,success)
       VALUES (?,?,?,?,?,0,1)`
    ).bind(agentId, model, inputTokens, outputTokens, estPerRequest).run();
    await activity(env, agentId, 'agent_output', clean(output, 600), { output: clean(output, 12000), source, model }, 'agent', agentId);
    const desired = await taskDrivenState(env, agentId, 'Last AI event completed; waiting for the next event');
    await setStatus(env, agentId, desired.status, desired.reason, 'ai_completed');
    await audit(env, 'agent', agentId, 'ai_run_completed', 'agent', agentId, { source, model, inputTokens, outputTokens });
    return { deferred: false, output, model, usage: { inputTokens, outputTokens, estimatedNeurons: estPerRequest } };
  } catch (error) {
    const isQuota = quotaLike(error);
    await env.COMPANY_OS_DB.prepare(
      `INSERT INTO ai_usage (agent_id,model,success,error_code) VALUES (?,?,0,?)`
    ).bind(agentId, model, clean(error?.message || error, 300)).run();
    if (isQuota) {
      await setStatus(env, agentId, 'sleeping', 'Cloudflare AI quota/capacity reached; deferred with no paid fallback', 'ai_quota_sleep');
      await createFounderNotice(env, agentId, `${agent.name} sleeping: AI quota/capacity`, 'Workers AI rejected the request due to quota, capacity, or rate limiting. Company OS did not fall back to a paid model.', { error: clean(error?.message || error, 500) });
    } else {
      await setStatus(env, agentId, 'blocked', 'AI execution failed; Founder/Admin review required', 'ai_failed');
    }
    await audit(env, 'system', 'ai-runtime', 'ai_run_failed', 'agent', agentId, { source, model, quotaLike: isQuota, error: clean(error?.message || error, 500) });
    throw error;
  } finally {
    // Release is token-scoped. If D1 is temporarily unavailable, do not turn an
    // otherwise successful inference into a false failure; the lease self-expires.
    try { await releaseAgentRun(env, agentId, leaseToken); } catch {}
  }
}

async function founderAlerts(env) {
  const result = await env.COMPANY_OS_DB.prepare(
    `SELECT * FROM activity_events
     WHERE event_type IN ('ai_quota_sleep','ai_deferred','ai_failed','schedule_guard_deferred','schedule_deferred','schedule_blocked')
     ORDER BY ts DESC LIMIT 20`
  ).all();
  return result.results || [];
}

function derivedFounderInbox(approvals, tasks, unreadFounderMessages, aiAlerts) {
  return {
    approvals: (approvals || []).filter((item) => item.status === 'pending').slice(0, 30),
    blockedTasks: (tasks || []).filter((item) => item.status === 'blocked').slice(0, 20),
    unreadFounderMessages: unreadFounderMessages || [],
    aiAlerts: aiAlerts || [],
  };
}

async function founderInbox(env) {
  const [approvals, blocked, messages, alerts] = await Promise.all([
    env.COMPANY_OS_DB.prepare(`SELECT a.*,ag.name AS agent_name FROM approvals a LEFT JOIN agents ag ON ag.id=a.requested_by_agent_id WHERE a.status='pending' ORDER BY a.created_at DESC LIMIT 30`).all(),
    env.COMPANY_OS_DB.prepare(`SELECT t.*,ag.name AS owner_name FROM tasks t LEFT JOIN agents ag ON ag.id=t.owner_agent_id WHERE t.status='blocked' ORDER BY t.updated_at DESC LIMIT 20`).all(),
    env.COMPANY_OS_DB.prepare(`SELECT m.*,s.name AS sender_name FROM messages m LEFT JOIN agents s ON s.id=m.sender_agent_id WHERE m.recipient_agent_id='founder-office' AND m.status!='read' ORDER BY m.created_at DESC LIMIT 20`).all(),
    founderAlerts(env),
  ]);
  return {
    approvals: approvals.results || [],
    blockedTasks: blocked.results || [],
    unreadFounderMessages: messages.results || [],
    aiAlerts: alerts,
  };
}

async function bootstrap(env) {
  // The main poll already loads approvals and tasks. Reuse those rows for the
  // Founder Inbox instead of re-running the same queries on every 8s active poll.
  const [agents, events, tasks, approvals, messages, schedules, usage, founderMessages, alerts] = await Promise.all([
    env.COMPANY_OS_DB.prepare(`SELECT id,name,department,status,status_reason,last_event_at,updated_at FROM agents ORDER BY CASE id WHEN 'admin' THEN 1 WHEN 'founder-office' THEN 2 WHEN 'research' THEN 3 WHEN 'marketing' THEN 4 WHEN 'finance' THEN 5 ELSE 99 END,name`).all(),
    env.COMPANY_OS_DB.prepare(`SELECT e.*,a.name AS actor_name FROM activity_events e LEFT JOIN agents a ON a.id=e.actor_agent_id ORDER BY e.ts DESC,e.id DESC LIMIT 60`).all(),
    env.COMPANY_OS_DB.prepare(`SELECT t.*,a.name AS owner_name FROM tasks t LEFT JOIN agents a ON a.id=t.owner_agent_id ORDER BY CASE t.status WHEN 'blocked' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'review' THEN 3 WHEN 'todo' THEN 4 ELSE 5 END,t.updated_at DESC LIMIT 50`).all(),
    env.COMPANY_OS_DB.prepare(`SELECT ap.*,a.name AS agent_name FROM approvals ap LEFT JOIN agents a ON a.id=ap.requested_by_agent_id ORDER BY CASE ap.status WHEN 'pending' THEN 1 ELSE 2 END,ap.created_at DESC LIMIT 50`).all(),
    env.COMPANY_OS_DB.prepare(`SELECT m.*,s.name AS sender_name,r.name AS recipient_name FROM messages m JOIN agents s ON s.id=m.sender_agent_id JOIN agents r ON r.id=m.recipient_agent_id ORDER BY m.created_at DESC,m.id DESC LIMIT 50`).all(),
    env.COMPANY_OS_DB.prepare(`SELECT s.*,a.name AS agent_name FROM schedules s JOIN agents a ON a.id=s.agent_id ORDER BY s.enabled DESC,s.next_run_at ASC LIMIT 50`).all(),
    todayUsage(env),
    env.COMPANY_OS_DB.prepare(`SELECT m.*,s.name AS sender_name FROM messages m LEFT JOIN agents s ON s.id=m.sender_agent_id WHERE m.recipient_agent_id='founder-office' AND m.status!='read' ORDER BY m.created_at DESC LIMIT 20`).all(),
    founderAlerts(env),
  ]);

  const taskRows = tasks.results || [];
  const approvalRows = approvals.results || [];
  return {
    agents: agents.results || [],
    events: events.results || [],
    tasks: taskRows,
    approvals: approvalRows,
    messages: messages.results || [],
    schedules: schedules.results || [],
    usage,
    founderInbox: derivedFounderInbox(approvalRows, taskRows, founderMessages.results || [], alerts),
    serverTime: new Date().toISOString(),
  };
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (method === 'GET' && path === '/') return html(renderOffice());
  if (method === 'GET' && path === '/health') return json({ ok: true, service: 'inspire-company-os', time: new Date().toISOString() });
  if (method === 'GET' && path === '/api/bootstrap') return json(await bootstrap(env));
  if (method === 'GET' && path === '/api/founder-inbox') return json(await founderInbox(env));
  if (method === 'GET' && path === '/api/usage') return json(await todayUsage(env));

  if (method === 'GET' && path === '/api/audit') {
    const result = await env.COMPANY_OS_DB.prepare(`SELECT * FROM audit_log ORDER BY ts DESC,id DESC LIMIT 100`).all();
    return json(result.results || []);
  }

  if (method === 'GET' && path === '/api/agents') {
    const result = await env.COMPANY_OS_DB.prepare(`SELECT * FROM agents ORDER BY name`).all();
    return json(result.results || []);
  }

  let match = path.match(/^\/api\/agents\/([a-z0-9-]+)$/);
  if (method === 'GET' && match) {
    const id = match[1];
    const agent = await getAgent(env, id);
    if (!agent) return json({ error: 'agent_not_found' }, 404);
    const [events, tasks, messages] = await Promise.all([
      env.COMPANY_OS_DB.prepare(`SELECT * FROM activity_events WHERE actor_agent_id=? ORDER BY ts DESC,id DESC LIMIT 50`).bind(id).all(),
      env.COMPANY_OS_DB.prepare(`SELECT * FROM tasks WHERE owner_agent_id=? ORDER BY updated_at DESC LIMIT 50`).bind(id).all(),
      env.COMPANY_OS_DB.prepare(`SELECT m.*,s.name AS sender_name,r.name AS recipient_name FROM messages m JOIN agents s ON s.id=m.sender_agent_id JOIN agents r ON r.id=m.recipient_agent_id WHERE m.sender_agent_id=? OR m.recipient_agent_id=? ORDER BY m.created_at DESC LIMIT 50`).bind(id, id).all(),
    ]);
    return json({ agent, events: events.results || [], tasks: tasks.results || [], messages: messages.results || [] });
  }

  match = path.match(/^\/api\/agents\/([a-z0-9-]+)\/run$/);
  if (method === 'POST' && match) {
    const payload = await bodyJson(request);
    const result = await runAgent(env, match[1], payload.instruction, payload.context || '', 'founder_run');
    return json(result, result.deferred ? 202 : 200);
  }

  match = path.match(/^\/api\/agents\/([a-z0-9-]+)\/status$/);
  if (method === 'PATCH' && match) {
    const payload = await bodyJson(request);
    if (!STATUS_VALUES.has(payload.status)) return json({ error: 'invalid_status' }, 400);
    const agent = await setStatus(env, match[1], payload.status, clean(payload.reason, 500), 'status_manual_event');
    await audit(env, 'human', actorFrom(request), 'agent_status_changed', 'agent', match[1], { status: payload.status, reason: clean(payload.reason, 500) });
    return json(agent);
  }

  if (method === 'POST' && path === '/api/messages') {
    const payload = await bodyJson(request);
    const sender = clean(payload.sender_agent_id, 100);
    const recipient = clean(payload.recipient_agent_id, 100);
    const body = clean(payload.body, 8000);
    if (!sender || !recipient || !body) return json({ error: 'sender_recipient_body_required' }, 400);
    const [senderAgent, recipientAgent] = await Promise.all([getAgent(env, sender), getAgent(env, recipient)]);
    if (!senderAgent || !recipientAgent) return json({ error: 'agent_not_found' }, 404);
    const inserted = await env.COMPANY_OS_DB.prepare(`INSERT INTO messages (sender_agent_id,recipient_agent_id,subject,body) VALUES (?,?,?,?)`).bind(sender, recipient, clean(payload.subject, 300) || null, body).run();
    const id = inserted.meta.last_row_id;
    await activity(env, sender, 'message_sent', `${senderAgent.name} → ${recipientAgent.name}: ${clean(payload.subject || body, 180)}`, { messageId: id }, 'message', id);
    if (recipientAgent.status === 'sleeping' && !isQuotaSleeping(recipientAgent)) await syncTaskDrivenStatus(env, recipient, 'message_received', `Message received from ${senderAgent.name}`);
    await audit(env, 'human', actorFrom(request), 'message_created', 'message', id, { sender, recipient });
    return json({ id }, 201);
  }

  match = path.match(/^\/api\/messages\/(\d+)\/read$/);
  if (method === 'PATCH' && match) {
    await env.COMPANY_OS_DB.prepare(`UPDATE messages SET status='read',read_at=CURRENT_TIMESTAMP WHERE id=?`).bind(Number(match[1])).run();
    await audit(env, 'human', actorFrom(request), 'message_read', 'message', match[1]);
    return json({ ok: true });
  }

  if (method === 'POST' && path === '/api/tasks') {
    const payload = await bodyJson(request);
    const title = clean(payload.title, 500);
    if (!title) return json({ error: 'title_required' }, 400);
    const owner = clean(payload.owner_agent_id, 100) || null;
    if (owner && !(await getAgent(env, owner))) return json({ error: 'owner_not_found' }, 404);
    const creator = clean(payload.created_by_agent_id, 100) || 'admin';
    if (creator && !(await getAgent(env, creator))) return json({ error: 'creator_not_found' }, 404);
    const priority = PRIORITIES.has(payload.priority) ? payload.priority : 'normal';
    const needsApproval = payload.approval_required ? 1 : 0;
    let approvalId = null;
    if (needsApproval) {
      const approval = await env.COMPANY_OS_DB.prepare(`INSERT INTO approvals (requested_by_agent_id,action_type,title,rationale,payload_json) VALUES (?,?,?,?,?)`).bind(creator, clean(payload.action_type || 'restricted_action', 100), `Approval: ${title}`, clean(payload.description, 3000), JSON.stringify({ taskTitle: title })).run();
      approvalId = approval.meta.last_row_id;
    }
    const inserted = await env.COMPANY_OS_DB.prepare(`INSERT INTO tasks (title,description,owner_agent_id,created_by_agent_id,priority,due_at,approval_required,approval_id) VALUES (?,?,?,?,?,?,?,?)`).bind(title, clean(payload.description, 5000) || null, owner, creator, priority, clean(payload.due_at, 100) || null, needsApproval, approvalId).run();
    const id = inserted.meta.last_row_id;
    await activity(env, creator, 'task_created', title, { taskId: id, owner, priority, approvalId }, 'task', id);
    if (owner) await syncTaskDrivenStatus(env, owner, 'task_assigned', `Task assigned: ${title}`);
    await audit(env, 'human', actorFrom(request), 'task_created', 'task', id, { owner, priority, approvalId });
    return json({ id, approvalId }, 201);
  }

  match = path.match(/^\/api\/tasks\/(\d+)$/);
  if (method === 'PATCH' && match) {
    const payload = await bodyJson(request);
    const task = await env.COMPANY_OS_DB.prepare(`SELECT * FROM tasks WHERE id=?`).bind(Number(match[1])).first();
    if (!task) return json({ error: 'task_not_found' }, 404);
    const status = TASK_STATUS.has(payload.status) ? payload.status : task.status;
    const priority = PRIORITIES.has(payload.priority) ? payload.priority : task.priority;
    await env.COMPANY_OS_DB.prepare(`UPDATE tasks SET status=?,priority=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status, priority, task.id).run();
    if (task.owner_agent_id) await syncTaskDrivenStatus(env, task.owner_agent_id, 'task_status_changed', `Task #${task.id}: ${task.title}`);
    await activity(env, task.owner_agent_id || task.created_by_agent_id, 'task_updated', `${task.title} → ${status}`, { taskId: task.id, status, priority }, 'task', task.id);
    await audit(env, 'human', actorFrom(request), 'task_updated', 'task', task.id, { status, priority });
    return json({ ok: true });
  }

  if (method === 'POST' && path === '/api/approvals') {
    const payload = await bodyJson(request);
    const title = clean(payload.title, 500);
    if (!title) return json({ error: 'title_required' }, 400);
    const requester = clean(payload.requested_by_agent_id, 100) || null;
    if (requester && !(await getAgent(env, requester))) return json({ error: 'requester_not_found' }, 404);
    const inserted = await env.COMPANY_OS_DB.prepare(`INSERT INTO approvals (requested_by_agent_id,action_type,title,rationale,payload_json) VALUES (?,?,?,?,?)`).bind(requester, clean(payload.action_type || 'restricted_action', 100), title, clean(payload.rationale, 4000), JSON.stringify(payload.payload || {})).run();
    const id = inserted?.meta?.last_row_id || null;
    if (Number(inserted?.meta?.changes || 0) === 0) return json({ id: null, deduped: true }, 200);
    await activity(env, requester, 'approval_requested', title, { approvalId: id }, 'approval', id);
    await audit(env, 'human', actorFrom(request), 'approval_requested', 'approval', id, { requester });
    return json({ id }, 201);
  }

  match = path.match(/^\/api\/approvals\/(\d+)$/);
  if (method === 'PATCH' && match) {
    const payload = await bodyJson(request);
    if (!['approved', 'rejected'].includes(payload.status)) return json({ error: 'decision_required' }, 400);
    const approval = await env.COMPANY_OS_DB.prepare(`SELECT * FROM approvals WHERE id=?`).bind(Number(match[1])).first();
    if (!approval) return json({ error: 'approval_not_found' }, 404);
    if (approval.status !== 'pending') return json({ error: 'approval_already_decided' }, 409);
    await env.COMPANY_OS_DB.prepare(`UPDATE approvals SET status=?,decided_at=CURRENT_TIMESTAMP,decided_by=? WHERE id=?`).bind(payload.status, actorFrom(request), approval.id).run();
    if (payload.status === 'rejected') {
      const linked = await env.COMPANY_OS_DB.prepare(`SELECT id,title,owner_agent_id FROM tasks WHERE approval_id=? AND status='blocked'`).bind(approval.id).all();
      for (const task of linked.results || []) {
        if (task.owner_agent_id) await syncTaskDrivenStatus(env, task.owner_agent_id, 'approval_rejected', `Task #${task.id} rejected by Founder: ${task.title}`);
      }
    }
    await activity(env, approval.requested_by_agent_id, 'approval_decided', `${approval.title} → ${payload.status}`, { approvalId: approval.id, decision: payload.status }, 'approval', approval.id);
    await audit(env, 'human', actorFrom(request), 'approval_decided', 'approval', approval.id, { decision: payload.status });
    return json({ ok: true });
  }

  if (method === 'POST' && path === '/api/schedules') {
    const payload = await bodyJson(request);
    const agentId = clean(payload.agent_id, 100);
    const title = clean(payload.title, 500);
    const instruction = clean(payload.instruction, 6000);
    const recurrence = RECURRENCES.has(payload.recurrence) ? payload.recurrence : 'once';
    const nextRun = new Date(payload.next_run_at);
    if (!agentId || !title || !instruction || Number.isNaN(nextRun.getTime())) return json({ error: 'agent_title_instruction_next_run_required' }, 400);
    if (!(await getAgent(env, agentId))) return json({ error: 'agent_not_found' }, 404);
    const nextRunIso = nextRun.toISOString();
    const inserted = await env.COMPANY_OS_DB.prepare(`INSERT INTO schedules (agent_id,title,instruction,recurrence,next_run_at,cadence_anchor_at) VALUES (?,?,?,?,?,?)`).bind(agentId, title, instruction, recurrence, nextRunIso, nextRunIso).run();
    const id = inserted.meta.last_row_id;
    await activity(env, agentId, 'schedule_created', title, { scheduleId: id, recurrence, nextRunAt: nextRunIso }, 'schedule', id);
    await audit(env, 'human', actorFrom(request), 'schedule_created', 'schedule', id, { agentId, recurrence });
    return json({ id }, 201);
  }

  match = path.match(/^\/api\/schedules\/(\d+)$/);
  if (method === 'PATCH' && match) {
    const payload = await bodyJson(request);
    const schedule = await env.COMPANY_OS_DB.prepare(`SELECT * FROM schedules WHERE id=?`).bind(Number(match[1])).first();
    if (!schedule) return json({ error: 'schedule_not_found' }, 404);
    const enabled = payload.enabled === undefined ? schedule.enabled : (payload.enabled ? 1 : 0);
    await env.COMPANY_OS_DB.prepare(`UPDATE schedules SET enabled=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(enabled, schedule.id).run();
    await audit(env, 'human', actorFrom(request), 'schedule_updated', 'schedule', schedule.id, { enabled });
    return json({ ok: true });
  }

  return json({ error: 'not_found' }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      const code = error?.message || 'internal_error';
      const status = code === 'invalid_json' || code === 'request_too_large' || code.endsWith('_required') || code === 'invalid_status' ? 400
        : code === 'agent_not_found' ? 404
        : code === 'approval_not_granted' ? 409
        : code === 'approval_link_required' ? 400
        : 500;
      return json({ error: code, detail: status === 500 ? 'See audit/activity logs for operational detail.' : undefined }, status);
    }
  },
};
