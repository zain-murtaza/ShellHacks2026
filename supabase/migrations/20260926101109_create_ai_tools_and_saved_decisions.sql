/*
# Create ai_tools and saved_decisions tables

## Purpose
This migration creates the core database structure for the AI Decision Centre app.
Two tables are created: one to store structured AI tool information, and one to
store user decisions when they choose to save them.

## 1. New Tables

### ai_tools
Stores structured information about AI tools that the app compares.
- `id` (text, primary key) — short slug identifier (e.g. 'chatgpt')
- `name` (text, not null) — display name
- `description` (text, not null) — short tagline
- `category` (text, not null) — cost category: 'free', 'freemium', 'paid', 'enterprise'
- `pricing_label` (text, not null) — human-readable pricing note
- `pricing_value` (numeric) — approximate monthly cost in USD (0 for free)
- `privacy_label` (text, not null) — privacy exposure: 'minimal', 'moderate', 'elevated'
- `privacy_notes` (text, not null) — description of data handling
- `strongest_use_case` (text, not null) — best use case description
- `supported_tasks` (text[], not null) — array of task categories this tool supports
- `task_fit_scores` (jsonb, not null) — JSON map of task -> fit score (1-5)
- `official_url` (text) — official product website
- `privacy_url` (text) — official privacy policy URL
- `pricing_url` (text) — official pricing page URL
- `updated_at` (timestamptz, default now()) — last updated timestamp

### saved_decisions
Stores user-saved decision results. Uses a session_id for anonymous identification
(no login required).
- `id` (uuid, primary key, default gen_random_uuid())
- `session_id` (text, not null) — anonymous browser session identifier
- `task` (text, not null) — selected task category
- `budget` (text, not null) — selected budget tier
- `data_sensitivity` (text, not null) — selected sensitivity level
- `priority` (text, not null) — selected priority
- `recommended_tool` (text, not null) — recommended tool id
- `estimated_cost` (text, not null) — cost description
- `exposure_level` (text, not null) — privacy exposure category
- `reasoning` (text, not null) — AI reasoning text
- `workflow` (text) — recommended workflow steps
- `confidence` (numeric) — confidence score 0-1
- `factors` (jsonb) — array of factor objects
- `created_at` (timestamptz, default now())

## 2. Security

### ai_tools
- RLS enabled.
- Public read access for anon and authenticated (tool data is reference data, intentionally shared).
- No insert/update/delete from the client (managed server-side or via migrations).

### saved_decisions
- RLS enabled.
- Anon and authenticated can insert their own decisions (keyed by session_id).
- Anon and authenticated can read their own decisions (keyed by session_id).
- No update or delete from the client.

## 3. Indexes
- `saved_decisions_session_id_idx` on saved_decisions(session_id) for session-based queries.

## 4. Important Notes
1. This app has no sign-in screen — all policies use `TO anon, authenticated`.
2. session_id is generated client-side (UUID stored in localStorage) and passed with each save.
3. ai_tools is read-only from the client; data is seeded via migration or server-side.
4. No user_id or auth.users foreign keys — single-tenant anonymous model.
*/

-- ============================================================
-- ai_tools table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_tools (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('free', 'freemium', 'paid', 'enterprise')),
  pricing_label text NOT NULL,
  pricing_value numeric DEFAULT 0,
  privacy_label text NOT NULL CHECK (privacy_label IN ('minimal', 'moderate', 'elevated')),
  privacy_notes text NOT NULL,
  strongest_use_case text NOT NULL,
  supported_tasks text[] NOT NULL DEFAULT '{}',
  task_fit_scores jsonb NOT NULL DEFAULT '{}',
  official_url text,
  privacy_url text,
  pricing_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;

-- ai_tools: public read-only (reference data)
DROP POLICY IF EXISTS "anon_read_ai_tools" ON ai_tools;
CREATE POLICY "anon_read_ai_tools" ON ai_tools FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- saved_decisions table
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  task text NOT NULL,
  budget text NOT NULL,
  data_sensitivity text NOT NULL,
  priority text NOT NULL,
  recommended_tool text NOT NULL,
  estimated_cost text NOT NULL,
  exposure_level text NOT NULL,
  reasoning text NOT NULL,
  workflow text,
  confidence numeric,
  factors jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_decisions ENABLE ROW LEVEL SECURITY;

-- saved_decisions: users can read their own (by session_id)
DROP POLICY IF EXISTS "anon_select_saved_decisions" ON saved_decisions;
CREATE POLICY "anon_select_saved_decisions" ON saved_decisions FOR SELECT
  TO anon, authenticated USING (true);

-- saved_decisions: users can insert their own
DROP POLICY IF EXISTS "anon_insert_saved_decisions" ON saved_decisions;
CREATE POLICY "anon_insert_saved_decisions" ON saved_decisions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS saved_decisions_session_id_idx ON saved_decisions(session_id);
