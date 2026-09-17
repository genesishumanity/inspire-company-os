-- Prevent duplicate scheduled work and keep daily usage queries cheap as history grows.
-- Leases are intentionally short-lived: if a Worker dies mid-run, the schedule can recover.

ALTER TABLE schedules ADD COLUMN claim_token TEXT;
ALTER TABLE schedules ADD COLUMN lease_until TEXT;
ALTER TABLE schedules ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schedules ADD COLUMN consecutive_failures INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schedules ADD COLUMN last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_schedules_due_lease
  ON schedules(enabled, next_run_at, lease_until);

-- todayUsage() filters on date(ts). This expression index avoids a full ai_usage scan
-- after the audit/history tables have grown for weeks or months.
CREATE INDEX IF NOT EXISTS idx_ai_usage_day
  ON ai_usage(date(ts));
