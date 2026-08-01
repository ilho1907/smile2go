-- smile2go · AI Coach Twin: Stimme (Voice-Layer)
-- Grundsatz aus dem Produkt-Loop: Der persönliche Wochenimpuls bleibt IHRE ECHTE STIMME.
-- Geklont wird nur, was sie niemals selbst einsprechen könnte (44 Kartenbotschaften,
-- Ritualanleitungen) — und das ist immer klar als KI-Stimme gekennzeichnet (AI Act Art. 50).

-- ── Stimmprofil je Coachin ──────────────────────────────────────────────────
-- Eine Stimme ist ein höchstpersönliches Merkmal: ohne dokumentierte, jederzeit
-- widerrufbare Einwilligung darf kein Klon existieren. Das erzwingt die DB, nicht nur die UI.
CREATE TABLE IF NOT EXISTS stimm_profile (
  coach_id UUID PRIMARY KEY REFERENCES coaches(id) ON DELETE CASCADE,
  anbieter TEXT NOT NULL,                        -- 'elevenlabs' | 'higgsfield' | ...
  voice_id TEXT NOT NULL,                        -- Kennung beim Anbieter
  einwilligung_am TIMESTAMP WITH TIME ZONE NOT NULL,
  einwilligung_text TEXT NOT NULL,               -- Wortlaut, dem sie zugestimmt hat (Nachweis)
  widerrufen_am TIMESTAMP WITH TIME ZONE,        -- gesetzt = Klon sofort inaktiv
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE stimm_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coachin sieht nur ihr eigenes Stimmprofil" ON stimm_profile
  FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coachin legt nur ihr eigenes Stimmprofil an" ON stimm_profile
  FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coachin aendert nur ihr eigenes Stimmprofil" ON stimm_profile
  FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coachin loescht ihr Stimmprofil jederzeit" ON stimm_profile
  FOR DELETE USING (auth.uid() = coach_id);

-- Nur aktive, nicht widerrufene Profile — security_invoker, damit RLS greift.
CREATE OR REPLACE VIEW stimm_profil_aktiv
WITH (security_invoker = true) AS
SELECT * FROM stimm_profile WHERE widerrufen_am IS NULL;

-- ── Audio-Cache ─────────────────────────────────────────────────────────────
-- Derselbe Kartentext wird einmal erzeugt und danach ausgeliefert. Das ist der
-- Unterschied zwischen kalkulierbaren Cent-Beträgen und einer offenen Kostenwunde:
-- 44 Karten × 1 Erzeugung statt 44 Karten × jede Nutzerin × jeden Tag.
CREATE TABLE IF NOT EXISTS audio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,  -- NULL = neutrale smile2go-Stimme
  text_hash TEXT NOT NULL,                       -- sha256(text + voice_id)
  kategorie TEXT NOT NULL,                       -- 'karte' | 'ritual' | 'meditation'
  storage_pfad TEXT NOT NULL,                    -- Pfad in Supabase Storage
  dauer_sek INTEGER,
  ki_generiert BOOLEAN NOT NULL DEFAULT true,    -- Art. 50: immer mitgeführt
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (text_hash)
);

CREATE INDEX IF NOT EXISTS idx_audio_cache_coach ON audio_cache (coach_id, kategorie);

ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

-- Lesen darf jede eingeloggte Nutzerin (sie hört die Audios ihrer Coachin bzw. die neutralen).
CREATE POLICY "Audio lesen fuer Eingeloggte" ON audio_cache
  FOR SELECT USING (auth.role() = 'authenticated');
-- Schreiben nur serverseitig (Edge Function mit Service-Role) — keine Client-Policy.
