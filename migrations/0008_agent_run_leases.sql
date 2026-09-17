-- Prevent double-clicks, overlapping schedules, or concurrent operator requests
-- from running the same agent twice at once. A crashed Worker cannot lock an
-- agent forever because the lease expires automatically.

ALTER TABLE agents ADD COLUMN run_token TEXT;
ALTER TABLE agents ADD COLUMN run_lease_until TEXT;
ALTER TABLE agents ADD COLUMN last_run_started_at TEXT;
