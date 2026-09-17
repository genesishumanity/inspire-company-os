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

AI_PLAN="$(sqlite3 "$DB_FILE" "explain query plan select count(*) from ai_usage where ts >= date('now') and ts < datetime(date('now'), '+1 day');")"
if ! printf '%s' "$AI_PLAN" | grep -q 'idx_ai_usage_ts'; then
  echo "Expected daily AI guardrail query to use existing idx_ai_usage_ts" >&2
  exit 1
fi

ACTIVITY_PLAN="$(sqlite3 "$DB_FILE" "explain query plan select id from activity_events where event_type='schedule_guard_deferred' and ts >= date('now') and ts < datetime(date('now'), '+1 day') order by id desc limit 1;")"
if ! printf '%s' "$ACTIVITY_PLAN" | grep -q 'idx_activity_type_ts'; then
  echo "Expected scheduler guard query to use idx_activity_type_ts" >&2
  exit 1
fi

# Lease contract: a due schedule can be claimed once and cannot be overwritten
# while its lease is still active.
sqlite3 "$DB_FILE" "insert into schedules(agent_id,title,instruction,recurrence,next_run_at) values('research','lease smoke','test','once',datetime('now','-1 minute'));"
SCHEDULE_ID="$(sqlite3 "$DB_FILE" "select max(id) from schedules;")"
sqlite3 "$DB_FILE" "update schedules set claim_token='claim-a',lease_until=datetime('now','+10 minutes'),attempt_count=attempt_count+1 where id=$SCHEDULE_ID and enabled=1 and datetime(next_run_at)<=datetime('now') and (lease_until is null or datetime(lease_until)<datetime('now'));"
sqlite3 "$DB_FILE" "update schedules set claim_token='claim-b' where id=$SCHEDULE_ID and enabled=1 and datetime(next_run_at)<=datetime('now') and (lease_until is null or datetime(lease_until)<datetime('now'));"
CLAIM_TOKEN="$(sqlite3 "$DB_FILE" "select claim_token from schedules where id=$SCHEDULE_ID;")"
ATTEMPTS="$(sqlite3 "$DB_FILE" "select attempt_count from schedules where id=$SCHEDULE_ID;")"
if [ "$CLAIM_TOKEN" != "claim-a" ] || [ "$ATTEMPTS" != "1" ]; then
  echo "Scheduler lease did not prevent a duplicate claim" >&2
  exit 1
fi

LEASE_INDEX="$(sqlite3 "$DB_FILE" "select count(*) from sqlite_master where type='index' and name='idx_schedules_due_lease';")"
if [ "$LEASE_INDEX" != "1" ]; then
  echo "Expected scheduler lease index" >&2
  exit 1
fi

# Approval integrity: gated work cannot progress before approval, and rejection
# automatically blocks the linked task.
sqlite3 "$DB_FILE" "insert into approvals(requested_by_agent_id,action_type,title,status) values('admin','restricted_action','approval smoke','pending');"
APPROVAL_ID="$(sqlite3 "$DB_FILE" "select max(id) from approvals;")"
sqlite3 "$DB_FILE" "insert into tasks(title,owner_agent_id,created_by_agent_id,approval_required,approval_id) values('approval gated smoke','marketing','admin',1,$APPROVAL_ID);"
TASK_ID="$(sqlite3 "$DB_FILE" "select max(id) from tasks;")"
if sqlite3 "$DB_FILE" "update tasks set status='in_progress' where id=$TASK_ID;" >/dev/null 2>&1; then
  echo "Approval-gated task progressed before approval" >&2
  exit 1
fi
sqlite3 "$DB_FILE" "update approvals set status='approved' where id=$APPROVAL_ID;"
sqlite3 "$DB_FILE" "update tasks set status='in_progress' where id=$TASK_ID;"
TASK_STATUS="$(sqlite3 "$DB_FILE" "select status from tasks where id=$TASK_ID;")"
if [ "$TASK_STATUS" != "in_progress" ]; then
  echo "Approved task could not progress" >&2
  exit 1
fi

sqlite3 "$DB_FILE" "insert into approvals(requested_by_agent_id,action_type,title,status) values('admin','restricted_action','rejection smoke','pending');"
REJECT_APPROVAL_ID="$(sqlite3 "$DB_FILE" "select max(id) from approvals;")"
sqlite3 "$DB_FILE" "insert into tasks(title,owner_agent_id,created_by_agent_id,approval_required,approval_id) values('rejected smoke','finance','admin',1,$REJECT_APPROVAL_ID);"
REJECT_TASK_ID="$(sqlite3 "$DB_FILE" "select max(id) from tasks;")"
sqlite3 "$DB_FILE" "update approvals set status='rejected' where id=$REJECT_APPROVAL_ID;"
REJECT_STATUS="$(sqlite3 "$DB_FILE" "select status from tasks where id=$REJECT_TASK_ID;")"
if [ "$REJECT_STATUS" != "blocked" ]; then
  echo "Rejected approval did not block linked task" >&2
  exit 1
fi

grep -q '^workers_dev = false$' wrangler.toml
grep -q '^preview_urls = false$' wrangler.toml
grep -q '^main = "src/entry.js"$' wrangler.toml
grep -q '^AUTH_MODE = "access"$' wrangler.toml
grep -q '00000000-0000-0000-0000-000000000000' wrangler.toml
! grep -q "url.pathname === '/health'.*return app.fetch" src/entry.js

echo "Company OS smoke checks passed."
