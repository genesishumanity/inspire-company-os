#!/usr/bin/env bash
set -euo pipefail

npm run check
node tests/runtime-contract.mjs

DB_FILE="${TMPDIR:-/tmp}/inspire-company-os-smoke.db"
rm -f "$DB_FILE"
sqlite3 "$DB_FILE" < migrations/0001_init.sql
sqlite3 "$DB_FILE" < migrations/0002_ai_usage_estimates.sql

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

grep -q '^workers_dev = false$' wrangler.toml
grep -q '^preview_urls = false$' wrangler.toml
grep -q '^main = "src/entry.js"$' wrangler.toml
grep -q '^AUTH_MODE = "access"$' wrangler.toml
grep -q 'REPLACE_WITH_COMPANY_OS_D1_ID' wrangler.toml

echo "Company OS smoke checks passed."
