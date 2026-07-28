-- smile2go · Zentraler App-Zustand pro Nutzerin (Journal, Mood, Challenge, Streak, ...)
-- Spiegelt die bisherige localStorage-Struktur "s2g_state" 1:1 als JSONB,
-- damit alles, was heute lokal gespeichert wird, jetzt zusätzlich echt in der Cloud liegt
-- (geräteübergreifend, überlebt Cache-Löschung, Coach kann später wirklich mitlesen).

CREATE TABLE IF NOT EXISTS app_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutzerin sieht nur ihren eigenen Zustand" ON app_state
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutzerin legt nur ihren eigenen Zustand an" ON app_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutzerin aktualisiert nur ihren eigenen Zustand" ON app_state
  FOR UPDATE USING (auth.uid() = user_id);

-- updated_at automatisch pflegen
CREATE OR REPLACE FUNCTION app_state_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_state_updated_at ON app_state;
CREATE TRIGGER trg_app_state_updated_at
  BEFORE UPDATE ON app_state
  FOR EACH ROW EXECUTE FUNCTION app_state_set_updated_at();
