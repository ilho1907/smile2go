-- smile2go · Katman 1 · Baustein 7: Client Journey Automation
-- Bewusst REGELBASIERT (kein LLM in der Ablaufsteuerung) — Determinismus ist hier das Qualitätsmerkmal.
-- Journeys sind Daten, nicht Code: neue Reisen entstehen ohne Deployment.
-- Die Ausführung übernimmt n8n (externe Instanz) über die Service-Role; siehe
-- automation/journey-workflow.json.

CREATE TABLE IF NOT EXISTS journey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,  -- NULL = Systemvorlage für alle
  name TEXT NOT NULL,
  beschreibung TEXT,
  ausloeser TEXT NOT NULL,             -- 'verknuepfung' | 'challenge_start' | 'inaktiv_7d' | 'manuell'
  aktiv BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  warte_stunden INTEGER NOT NULL DEFAULT 0,   -- Verzögerung nach dem vorherigen Schritt
  bedingung JSONB,                            -- z. B. {"feld":"letzter_eintrag_aelter_als_tage","wert":3}
  aktion TEXT NOT NULL,                       -- 'nachricht' | 'impuls_ausspielen' | 'erinnerung' | 'coach_signal'
  inhalt TEXT,                                -- Textbaustein (deterministisch, nicht generiert)
  UNIQUE (template_id, position)
);

-- Laufende Reisen je Klientin
CREATE TABLE IF NOT EXISTS journey_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  aktuelle_position INTEGER NOT NULL DEFAULT 0,
  naechster_lauf TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'aktiv',       -- 'aktiv' | 'pausiert' | 'beendet'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_runs_faellig ON journey_runs (naechster_lauf) WHERE status = 'aktiv';

ALTER TABLE journey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_runs ENABLE ROW LEVEL SECURITY;

-- Vorlagen: eigene + Systemvorlagen lesbar, aber nur eigene änderbar.
CREATE POLICY "Vorlagen lesen: eigene und System" ON journey_templates
  FOR SELECT USING (coach_id IS NULL OR auth.uid() = coach_id);
CREATE POLICY "Vorlagen anlegen: nur eigene" ON journey_templates
  FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Vorlagen aendern: nur eigene" ON journey_templates
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Schritte lesen wie die Vorlage" ON journey_steps
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM journey_templates t WHERE t.id = template_id AND (t.coach_id IS NULL OR t.coach_id = auth.uid())
  ));
CREATE POLICY "Schritte aendern nur bei eigener Vorlage" ON journey_steps
  FOR ALL USING (EXISTS (
    SELECT 1 FROM journey_templates t WHERE t.id = template_id AND t.coach_id = auth.uid()
  ));

-- Läufe: Klientin sieht ihre eigenen, Coachin ihre zugeordneten.
CREATE POLICY "Laeufe lesen: eigene oder als zustaendige Coachin" ON journey_runs
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = coach_id);
CREATE POLICY "Laeufe anlegen: fuer sich selbst oder als Coachin" ON journey_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = coach_id);
CREATE POLICY "Laeufe aendern: eigene oder als Coachin" ON journey_runs
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = coach_id);

-- ── Startvorlage: „Willkommen" (Systemvorlage, coach_id NULL) ───────────────
INSERT INTO journey_templates (id, coach_id, name, beschreibung, ausloeser)
VALUES ('00000000-0000-4000-8000-000000000001'::uuid, NULL,
        'Willkommen · erste zwei Wochen',
        'Startet, sobald sich eine Klientin mit einer Coachin verknüpft.',
        'verknuepfung')
ON CONFLICT (id) DO NOTHING;

INSERT INTO journey_steps (template_id, position, warte_stunden, bedingung, aktion, inhalt) VALUES
  ('00000000-0000-4000-8000-000000000001'::uuid, 1, 0,    NULL, 'nachricht',        'Schön, dass du da bist. Deine Coachin hat dir hier einen eigenen Raum eingerichtet — nimm dir heute nur zwei Minuten für deine erste Karte. 🤍'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 2, 48,   NULL, 'nachricht',        'Deine erste Übung wartet: Schreib heute Abend drei Sätze in dein Tagebuch. Nichts muss perfekt sein.'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 3, 48,   '{"feld":"letzter_eintrag_aelter_als_tage","wert":3}'::jsonb, 'erinnerung', 'Kein Druck — dein Platz hier bleibt. Magst du heute eine Karte ziehen?'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 4, 72,   NULL, 'nachricht',        'Kleiner Zwischen-Check: Wie geht es dir mit dem, was du dir vorgenommen hast?'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 5, 168,  NULL, 'nachricht',        'Deine erste Woche ist voll. Schau dir dein Wochenbild an — es entsteht aus deinen eigenen Worten.'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 6, 168,  NULL, 'coach_signal',     'Zwei Wochen verknüpft — guter Moment für eine persönliche Nachricht der Coachin.')
ON CONFLICT (template_id, position) DO NOTHING;
