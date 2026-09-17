-- Repeated quota/runtime events must not flood Founder Inbox or waste D1 writes.
-- Identical pending Founder-attention notices are ignored until the existing
-- notice is decided; a future notice can be created after resolution.

CREATE TRIGGER IF NOT EXISTS trg_dedupe_pending_founder_attention
BEFORE INSERT ON approvals
WHEN NEW.action_type = 'founder_attention'
  AND EXISTS (
    SELECT 1
    FROM approvals
    WHERE action_type = 'founder_attention'
      AND status = 'pending'
      AND requested_by_agent_id IS NEW.requested_by_agent_id
      AND title = NEW.title
  )
BEGIN
  SELECT RAISE(IGNORE);
END;
