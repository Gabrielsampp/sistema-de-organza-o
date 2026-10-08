-- Tarefas: categoria, recorrência
ALTER TABLE tasks ADD COLUMN category TEXT;
ALTER TABLE tasks ADD COLUMN recurrence TEXT CHECK (recurrence IN ('daily','weekdays','weekly','monthly'));
ALTER TABLE tasks ADD COLUMN series_id TEXT;
-- Idempotência da recorrência: uma ocorrência por série/data.
CREATE UNIQUE INDEX idx_tasks_series ON tasks(series_id, due_date) WHERE series_id IS NOT NULL AND deleted_at IS NULL;

-- Hábitos / rotina: categoria e horário
ALTER TABLE habits ADD COLUMN category TEXT;
ALTER TABLE habits ADD COLUMN time_of_day TEXT;

-- FINANÇAS (dinheiro sempre em centavos inteiros)
CREATE TABLE finance_accounts (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL CHECK (length(trim(name)) > 0),
  type                  TEXT NOT NULL DEFAULT 'checking' CHECK (type IN ('checking','wallet','savings','card','investment')),
  initial_balance_cents INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  deleted_at            TEXT
);

CREATE TABLE finance_categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK (length(trim(name)) > 0),
  kind       TEXT NOT NULL CHECK (kind IN ('income','expense')),
  color      TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE finance_transactions (
  id            TEXT PRIMARY KEY,
  account_id    TEXT NOT NULL REFERENCES finance_accounts(id),
  to_account_id TEXT REFERENCES finance_accounts(id),
  category_id   TEXT REFERENCES finance_categories(id),
  kind          TEXT NOT NULL CHECK (kind IN ('income','expense','transfer')),
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  occurred_on   TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  recurring_id  TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT,
  CHECK ((kind = 'transfer') = (to_account_id IS NOT NULL)),
  CHECK (to_account_id IS NULL OR to_account_id <> account_id)
);
CREATE INDEX idx_tx_date ON finance_transactions(occurred_on) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_tx_recurring ON finance_transactions(recurring_id, occurred_on) WHERE recurring_id IS NOT NULL;

CREATE TABLE finance_budgets (
  category_id TEXT PRIMARY KEY REFERENCES finance_categories(id),
  limit_cents INTEGER NOT NULL CHECK (limit_cents > 0),
  updated_at  TEXT NOT NULL
);

CREATE TABLE finance_recurring (
  id           TEXT PRIMARY KEY,
  account_id   TEXT NOT NULL REFERENCES finance_accounts(id),
  category_id  TEXT REFERENCES finance_categories(id),
  kind         TEXT NOT NULL CHECK (kind IN ('income','expense')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  description  TEXT NOT NULL DEFAULT '',
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  start_date   TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  deleted_at   TEXT
);

-- Seeds (IDs fixos legíveis)
INSERT INTO finance_accounts (id,name,type,initial_balance_cents,created_at,updated_at)
VALUES ('acc_main','Conta principal','checking',0,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT INTO finance_categories (id,name,kind,color,position,created_at,updated_at) VALUES
 ('cat_food','Alimentação','expense','#f97316',1,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_home','Moradia','expense','#3b82f6',2,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_transport','Transporte','expense','#eab308',3,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_health','Saúde','expense','#14b8a6',4,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_leisure','Lazer','expense','#ec4899',5,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_subs','Assinaturas','expense','#8b5cf6',6,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_edu','Educação','expense','#06b6d4',7,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_other_exp','Outros','expense','#6b7280',8,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_salary','Salário','income','#22c55e',1,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_freelance','Freelance','income','#84cc16',2,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_invest','Investimentos','income','#10b981',3,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('cat_other_inc','Outros','income','#6b7280',4,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
