export async function reserveAiRequest(env, softCap) {
  const cap = Math.max(1, Number(softCap || 1));
  const result = await env.COMPANY_OS_DB.prepare(
    `INSERT INTO ai_daily_budget (day,reserved_requests,updated_at)
     VALUES (date('now'),1,CURRENT_TIMESTAMP)
     ON CONFLICT(day) DO UPDATE SET
       reserved_requests=ai_daily_budget.reserved_requests+1,
       updated_at=CURRENT_TIMESTAMP
     WHERE ai_daily_budget.reserved_requests < ?`
  ).bind(cap).run();
  return Number(result?.meta?.changes || 0) === 1;
}

export async function reservedAiRequests(env) {
  const row = await env.COMPANY_OS_DB.prepare(
    `SELECT reserved_requests FROM ai_daily_budget WHERE day=date('now')`
  ).first();
  return Number(row?.reserved_requests || 0);
}
