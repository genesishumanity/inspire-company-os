PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  role_prompt TEXT NOT NULL,
  knowledge_sources TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'sleeping' CHECK (status IN ('working','thinking','waiting','blocked','reviewing','sleeping')),
  status_reason TEXT,
  last_event_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_agent_id TEXT,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  related_type TEXT,
  related_id TEXT,
  FOREIGN KEY(actor_agent_id) REFERENCES agents(id)
);
CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_activity_agent ON activity_events(actor_agent_id, ts DESC);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_agent_id TEXT NOT NULL,
  recipient_agent_id TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('queued','delivered','read')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT,
  FOREIGN KEY(sender_agent_id) REFERENCES agents(id),
  FOREIGN KEY(recipient_agent_id) REFERENCES agents(id)
);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_agent_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requested_by_agent_id TEXT,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at TEXT,
  decided_by TEXT,
  FOREIGN KEY(requested_by_agent_id) REFERENCES agents(id)
);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status, created_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  owner_agent_id TEXT,
  created_by_agent_id TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','review','done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  due_at TEXT,
  approval_required INTEGER NOT NULL DEFAULT 0,
  approval_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_agent_id) REFERENCES agents(id),
  FOREIGN KEY(created_by_agent_id) REFERENCES agents(id),
  FOREIGN KEY(approval_id) REFERENCES approvals(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, priority, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_agent_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  instruction TEXT NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'once' CHECK (recurrence IN ('once','hourly','daily','weekly')),
  next_run_at TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(agent_id) REFERENCES agents(id)
);
CREATE INDEX IF NOT EXISTS idx_schedules_due ON schedules(enabled, next_run_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts DESC);

CREATE TABLE IF NOT EXISTS ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  agent_id TEXT,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_neurons INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  success INTEGER NOT NULL DEFAULT 1,
  error_code TEXT,
  FOREIGN KEY(agent_id) REFERENCES agents(id)
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_ts ON ai_usage(ts DESC);

INSERT OR IGNORE INTO agents (id, name, department, role_prompt, knowledge_sources, status) VALUES
('admin', 'Admin', 'Operations', 'Coordinate INSPIRE company workstreams, maintain operational clarity, route work to the correct owner, surface blockers and require Founder approval for restricted actions.', '["genesishumanity/inspire-","company-os docs"]', 'sleeping'),
('founder-office', 'Founder Office', 'Founder Office', 'Act as an independent operating partner: synthesize what changed, surface risks, challenge assumptions, protect founder attention, and route irreversible or high-impact decisions to the Founder.', '["genesishumanity/inspire-","company-os docs"]', 'sleeping'),
('research', 'Research', 'Research / Knowledge', 'Maintain sourced product and creative knowledge, distinguish evidence from assumptions, and deliver concise research findings to other agents.', '["genesishumanity/inspire-","company-os docs"]', 'sleeping'),
('marketing', 'Marketing', 'Marketing', 'Own INSPIRE positioning and launch marketing work, preserve AI Idea Creator positioning, and turn validated product truth into clear market communication.', '["genesishumanity/inspire-","company-os docs"]', 'sleeping'),
('finance', 'Finance', 'Finance / Unit Economics', 'Protect cash, model costs and unit economics, separate actuals from assumptions, and escalate spending or pricing risks instead of encouraging unnecessary spend.', '["genesishumanity/inspire-","company-os docs"]', 'sleeping');

INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, details_json)
SELECT 'system', 'migration', 'registry_initialized', 'agent_registry', 'v0', '{"agents":5}'
WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'registry_initialized');
