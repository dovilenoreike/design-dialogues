-- Material graph schema for Phase 1
-- Adds 5 tables for the graph-based material matching system.
-- Current TypeScript material files are untouched; this runs in parallel.

CREATE TYPE material_texture AS ENUM ('wood', 'stone', 'plain', 'metal');
CREATE TYPE rule_severity    AS ENUM ('warn', 'block');

CREATE TABLE materials (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_code text UNIQUE NOT NULL,   -- TS id used during migration period, e.g. "solido-bolsena"
  name           jsonb NOT NULL,          -- { en, lt }
  role           text[] NOT NULL,         -- e.g. ['floor'], ['front']
  texture        material_texture NOT NULL,
  lightness      integer NOT NULL CHECK (lightness BETWEEN 0 AND 100),
  warmth         float   NOT NULL CHECK (warmth BETWEEN -1 AND 1),
  pattern        integer NOT NULL CHECK (pattern BETWEEN 0 AND 100),
  texture_prompt text,
  image_url      text,
  showroom_ids   text[] DEFAULT '{}',
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE pair_compatibility (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_a   uuid NOT NULL REFERENCES materials(id),
  material_b   uuid NOT NULL REFERENCES materials(id),
  approved_by  text,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (material_a, material_b),
  CHECK (material_a < material_b)   -- canonical ordering; no duplicate reversed pairs
);

CREATE TABLE set_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description   text NOT NULL,
  applies_to    text,                 -- role string or null for 'any'
  condition     jsonb NOT NULL,
  severity      rule_severity NOT NULL DEFAULT 'warn',
  example       text
);

CREATE TABLE set_exceptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_ids    uuid[] NOT NULL,
  reason          text NOT NULL,
  severity        rule_severity NOT NULL DEFAULT 'warn',
  discovered_date date DEFAULT current_date
);

CREATE TABLE collections_v3 (
  id          text PRIMARY KEY,
  name        jsonb NOT NULL,
  designer    text,
  vibe        text,
  floor_id    uuid REFERENCES materials(id),
  worktop_id  uuid REFERENCES materials(id),
  front_ids   uuid[],
  tile_ids    uuid[]
);

-- All 5 tables are read-only reference data; enable RLS and allow public SELECT
-- so the frontend can query them directly with the anon key.

ALTER TABLE materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_rules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_exceptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections_v3     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read materials"          ON materials          FOR SELECT USING (true);
CREATE POLICY "Public read pair_compatibility" ON pair_compatibility FOR SELECT USING (true);
CREATE POLICY "Public read set_rules"          ON set_rules          FOR SELECT USING (true);
CREATE POLICY "Public read set_exceptions"     ON set_exceptions     FOR SELECT USING (true);
CREATE POLICY "Public read collections_v3"     ON collections_v3     FOR SELECT USING (true);
