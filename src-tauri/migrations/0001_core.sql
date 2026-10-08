-- Convenções: id ULID (TEXT), datas de calendário 'YYYY-MM-DD' (local),
-- instantes em UTC ISO-8601, soft delete via deleted_at.

CREATE TABLE app_settings (
  key        TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

CREATE TABLE user_profile (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  name       TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE tasks (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description  TEXT NOT NULL DEFAULT '',
  priority     INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 0 AND 3),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  due_date     TEXT,
  due_time     TEXT,
  completed_at TEXT,
  position     REAL NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  deleted_at   TEXT
);
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;

CREATE TABLE task_subtasks (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT NOT NULL CHECK (length(trim(title)) > 0),
  done_at    TEXT,
  position   REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_subtasks_task ON task_subtasks(task_id);

CREATE TABLE habits (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description   TEXT NOT NULL DEFAULT '',
  weekdays_mask INTEGER NOT NULL DEFAULT 127 CHECK (weekdays_mask BETWEEN 1 AND 127),
  start_date    TEXT NOT NULL,
  archived_at   TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

-- Streaks NÃO são armazenados: são calculados a partir desta tabela.
CREATE TABLE habit_completions (
  id         TEXT PRIMARY KEY,
  habit_id   TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (habit_id, date)
);
CREATE INDEX idx_completions_date ON habit_completions(date);
