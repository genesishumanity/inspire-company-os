-- Enforce the Company OS AI request soft cap atomically across different agents.
-- A reservation is intentionally not released after a run: it represents one
-- daily AI attempt. If a Worker crashes after reserving, the slot stays consumed
-- for that UTC day, which is the safer failure mode for a free-tier guardrail.

CREATE TABLE IF NOT EXISTS ai_daily_budget (
  day TEXT PRIMARY KEY,
  reserved_requests INTEGER NOT NULL DEFAULT 0 CHECK (reserved_requests >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
