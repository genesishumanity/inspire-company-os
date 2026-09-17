-- Prevent duplicate scheduled work and make retries observable/recoverable.
-- Leases are short-lived: if a Worker dies mid-run, another cron tick can recover.

ALTER TABLE schedules ADD COLUMN claim_token TEXT;
ALTER TABLE schedules ADD COLUMN lease_until TEXT;
ALTER TABLE schedules ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schedules ADD COLUMN consecutive_failures INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schedules ADD COLUMN last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_schedules_due_lease
ON schedules(enabled, next_run_at, lease_until);
