-- Approval integrity lives in the database too, so an API mistake cannot silently
-- bypass Founder gating.

CREATE TRIGGER IF NOT EXISTS trg_tasks_require_approval_link
BEFORE INSERT ON tasks
WHEN NEW.approval_required = 1 AND NEW.approval_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'approval_link_required');
END;

CREATE TRIGGER IF NOT EXISTS trg_tasks_require_approval_before_progress
BEFORE UPDATE OF status ON tasks
WHEN NEW.approval_required = 1
  AND NEW.status IN ('in_progress','review','done')
  AND NOT EXISTS (
    SELECT 1 FROM approvals
    WHERE id = NEW.approval_id AND status = 'approved'
  )
BEGIN
  SELECT RAISE(ABORT, 'approval_not_granted');
END;

CREATE TRIGGER IF NOT EXISTS trg_rejected_approval_blocks_task
AFTER UPDATE OF status ON approvals
WHEN OLD.status = 'pending' AND NEW.status = 'rejected'
BEGIN
  UPDATE tasks
  SET status = 'blocked', updated_at = CURRENT_TIMESTAMP
  WHERE approval_id = NEW.id AND status != 'done';
END;
