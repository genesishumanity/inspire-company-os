-- Keep scheduler guard lookups cheap without duplicating indexes from 0001.
-- D1 counts index maintenance as writes, so V0 intentionally adds only the
-- composite index that is missing from the base schema.

CREATE INDEX IF NOT EXISTS idx_activity_type_ts
ON activity_events(event_type, ts DESC);
