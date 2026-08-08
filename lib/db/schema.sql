-- Iteration Engine schema (Turso / SQLite).
-- Structured fields (signal/preference breakdowns, direction lists, suggested changes,
-- pattern references) are stored as JSON TEXT columns and parsed at the query layer —
-- SQLite has no native array/object type, and these are always read as a whole.

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  -- Links this round to the round it iterates on, enabling version history across rounds.
  previous_round_id TEXT REFERENCES rounds(id),
  screenshot_ref TEXT NOT NULL,
  -- Natural pixel size of the screenshot, captured at upload. Nullable for legacy rounds
  -- created before dimension capture existed; load-bearing for the before/after visual diff.
  screenshot_width INTEGER,
  screenshot_height INTEGER,
  design_goal TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  reviewer_context TEXT,
  constraints TEXT,
  selected_direction_id TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS critiques (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES rounds(id),
  summary TEXT NOT NULL,
  signal_json TEXT NOT NULL,
  preference_json TEXT NOT NULL,
  flagged_ambiguities_json TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS directions (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES rounds(id),
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  tradeoffs TEXT NOT NULL,
  suggested_changes_json TEXT NOT NULL,
  pattern_reference_json TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generated_code (
  id TEXT PRIMARY KEY,
  direction_id TEXT NOT NULL REFERENCES directions(id),
  round_id TEXT NOT NULL REFERENCES rounds(id),
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'complete'
    CHECK (status IN ('streaming', 'complete', 'error')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rounds_project_id ON rounds(project_id);
CREATE INDEX IF NOT EXISTS idx_rounds_previous_round_id ON rounds(previous_round_id);
CREATE INDEX IF NOT EXISTS idx_critiques_round_id ON critiques(round_id);
CREATE INDEX IF NOT EXISTS idx_directions_round_id ON directions(round_id);
CREATE INDEX IF NOT EXISTS idx_generated_code_round_id ON generated_code(round_id);
CREATE INDEX IF NOT EXISTS idx_generated_code_direction_id ON generated_code(direction_id);
