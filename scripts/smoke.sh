#!/usr/bin/env bash
set -euo pipefail

node --check src/index.js
node --check src/ui.js

DB_FILE="${TMPDIR:-/tmp}/inspire-company-os-smoke.db"
rm -f "$DB_FILE"
sqlite3 "$DB_FILE" < migrations/0001_init.sql

AGENT_COUNT="$(sqlite3 "$DB_FILE" "select count(*) from agents;")"
INIT_AUDIT_COUNT="$(sqlite3 "$DB_FILE" "select count(*) from audit_log where action='registry_initialized';")"

if [ "$AGENT_COUNT" != "5" ]; then
  echo "Expected 5 seeded agents, got $AGENT_COUNT" >&2
  exit 1
fi

if [ "$INIT_AUDIT_COUNT" != "1" ]; then
  echo "Expected one registry_initialized audit row, got $INIT_AUDIT_COUNT" >&2
  exit 1
fi

echo "Company OS smoke checks passed."
