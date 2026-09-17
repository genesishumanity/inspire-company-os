#!/usr/bin/env bash
set -euo pipefail

npm run check
node tests/runtime-contract.mjs

DB_FILE="${TMPDIR:-/tmp}/inspire-company-os-smoke.db"
rm -f "$DB_FILE"
for migration in migrations/*.sql; do
  sqlite3 "$DB_FILE" < "$migration"
done

AGENT_COUNT="$(sqlite3 "$DB_FILE" "select count(*) from agents;")"
INIT_AUDIT_COUNT="$(sqlite3 "$DB_FILE" "select count(*) from audit_log where action='registry_initialized';")"
STATUS_COUNT="$(sqlite3 "$DB_FILE" "select count(distinct status) from agents;")"

if [ "$AGENT_COUNT" != "5" ]; then
  echo "Expected 5 seeded agents, got $AGENT_COUNT" >&2
  exit 1
fi

if [ "$INIT_AUDIT_COUNT" != "1" ]; then
  echo "Expected one registry_initialized audit row, got $INIT_AUDIT_COUNT" >&2
  exit 1
fi

if [ "$STATUS_COUNT" != "1" ]; then
  echo "Expected all seeded agents to begin in one real idle state" >&2
  exit 1
fi

sqlite3 "$DB_FILE" "insert into ai_usage(agent_id,model,input_tokens,output_tokens,estimated_neurons,estimated_cost_usd,success) values('research','@cf/zai-org/glm-4.7-flash',1000,100,0,0,1);"
EST_NEURONS="$(sqlite3 "$DB_FILE" "select estimated_neurons from ai_usage order by id desc limit 1;")"
if [ "$EST_NEURONS" -le 0 ]; then
  echo "Expected AI usage estimate trigger to populate neurons" >&2
  exit 1
fi

AI_PLAN="$(sqlite3 "$DB_FILE" "explain query plan select count(*) from ai_usage where date(ts)=date('now');")"
if ! printf '%s' "$AI_PLAN" | grep -q 'idx_ai_usage_day'; then
  echo "Expected daily AI guardrail query to use idx_ai_usage_day" >&2
  exit 1
fi

ACTIVITY_PLAN="$(sqlite3 "$DB_FILE" "explain query plan select id from activity_events where event_type='schedule_guard_deferred' and date(ts)=date('now') order by id desc limit 1;")"
if ! printf '%s' "$ACTIVITY_PLAN" | grep -q 'idx_activity_type_day'; then
  echo "Expected scheduler guard query to use idx_activity_type_day" >&2
  exit 1
fi

grep -q '^workers_dev = false$' wrangler.toml
grep -q '^preview_urls = false$' wrangler.toml
grep -q '^main = "src/entry.js"$' wrangler.toml
grep -q '^AUTH_MODE = "access"$' wrangler.toml
grep -q 'REPLACE_WITH_COMPANY_OS_D1_ID' wrangler.toml
! grep -q "url.pathname === '/health'.*return app.fetch" src/entry.js

echo "Company OS smoke checks passed."
