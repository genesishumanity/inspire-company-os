-- Keep daily guardrail lookups cheap as operational history grows.
-- D1 charges by rows read/written; these indexes prevent full-history scans
-- for the queries used by AI soft-cap and scheduler guardrails.

CREATE INDEX IF NOT EXISTS idx_ai_usage_day
ON ai_usage(date(ts));

CREATE INDEX IF NOT EXISTS idx_activity_type_day
ON activity_events(event_type, date(ts));

CREATE INDEX IF NOT EXISTS idx_approvals_pending_created
ON approvals(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedules_due_enabled
ON schedules(enabled, next_run_at);
