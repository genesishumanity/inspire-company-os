-- Keep recurring cadence independent from retry/defer timing.
-- next_run_at answers "when should the scheduler try next?"
-- cadence_anchor_at answers "which recurring slot does this work belong to?"

ALTER TABLE schedules ADD COLUMN cadence_anchor_at TEXT;

UPDATE schedules
SET cadence_anchor_at = next_run_at
WHERE cadence_anchor_at IS NULL;

CREATE TRIGGER IF NOT EXISTS trg_schedule_cadence_anchor_after_insert
AFTER INSERT ON schedules
WHEN NEW.cadence_anchor_at IS NULL
BEGIN
  UPDATE schedules
  SET cadence_anchor_at = NEW.next_run_at
  WHERE id = NEW.id;
END;
