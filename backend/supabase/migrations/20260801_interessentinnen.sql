-- smile2go · Interessentinnen-Journey ab dem kostenlosen Erstgespräch
--
-- RECHTLICHER KERN (§ 7 UWG): Werbliche Kontaktaufnahme ohne vorherige ausdrückliche
-- Einwilligung ist unzulässig — auch per Instagram-DM. Deshalb beginnt jede Begleitung
-- FRÜHESTENS mit dem selbst ausgefüllten Formular, nie mit einem Like oder Follow.
-- Die Einwilligung wird hier einzeln, granular und beweisbar gespeichert:
-- Zeitpunkt, Wortlaut und Herkunft. Ein Abmeldelink gehört in JEDE Nachricht.

CREATE TABLE IF NOT EXISTS interessentinnen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,   -- über welche Coachin sie kam
  vorname TEXT,
  email TEXT NOT NULL,
  telefon TEXT,
  nachricht TEXT,                                            -- ihr Freitext aus dem Formular
  herkunft TEXT,                                             -- 'landingpage' | 'instagram_bio' | 'empfehlung'

  -- Getrennte Einwilligungen — bewusst NICHT gebündelt (Koppelungsverbot).
  agb_akzeptiert BOOLEAN NOT NULL DEFAULT false,
  datenschutz_akzeptiert BOOLEAN NOT NULL DEFAULT false,
  kontakt_einwilligung BOOLEAN NOT NULL DEFAULT false,       -- Begleit-Nachrichten bis zur Entscheidung
  einwilligung_wortlaut TEXT,                                -- exakter Text, dem sie zugestimmt hat
  einwilligung_am TIMESTAMP WITH TIME ZONE,
  abgemeldet_am TIMESTAMP WITH TIME ZONE,                    -- gesetzt = keine Nachricht mehr, nie

  -- Double-Opt-in: erst nach Klick auf den Bestätigungslink ist die Einwilligung belastbar
  bestaetigungs_token UUID DEFAULT gen_random_uuid(),
  bestaetigt_am TIMESTAMP WITH TIME ZONE,

  status TEXT NOT NULL DEFAULT 'neu',
    -- 'neu' | 'termin_gebucht' | 'gespraech_gefuehrt' | 'entschieden_ja' | 'entschieden_nein' | 'kein_kontakt'
  erstgespraech_am TIMESTAMP WITH TIME ZONE,
  notiz_coachin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ohne bestätigte Pflicht-Einwilligungen darf gar kein Datensatz entstehen.
ALTER TABLE interessentinnen
  ADD CONSTRAINT chk_pflicht_einwilligungen
  CHECK (agb_akzeptiert = true AND datenschutz_akzeptiert = true);

CREATE INDEX IF NOT EXISTS idx_interessentinnen_coach ON interessentinnen (coach_id, status);

ALTER TABLE interessentinnen ENABLE ROW LEVEL SECURITY;

-- Nur die zuständige Coachin sieht ihre Interessentinnen. Anlegen geschieht
-- serverseitig über das Formular (Edge Function mit Service-Role) — keine Client-INSERT-Policy,
-- damit niemand fremde Adressen einschleusen kann.
CREATE POLICY "Coachin sieht nur ihre eigenen Interessentinnen" ON interessentinnen
  FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coachin pflegt nur ihre eigenen Interessentinnen" ON interessentinnen
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE OR REPLACE FUNCTION interessentinnen_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interessentinnen_updated_at ON interessentinnen;
CREATE TRIGGER trg_interessentinnen_updated_at
  BEFORE UPDATE ON interessentinnen
  FOR EACH ROW EXECUTE FUNCTION interessentinnen_set_updated_at();

-- Nur kontaktierbare Interessentinnen: bestätigt, eingewilligt, nicht abgemeldet.
-- Der Journey-Workflow liest AUSSCHLIESSLICH aus dieser View — so kann eine Automatisierung
-- gar nicht erst jemanden anschreiben, der das nicht will.
CREATE OR REPLACE VIEW interessentinnen_kontaktierbar
WITH (security_invoker = true) AS
SELECT * FROM interessentinnen
WHERE kontakt_einwilligung = true
  AND bestaetigt_am IS NOT NULL
  AND abgemeldet_am IS NULL
  AND status NOT IN ('entschieden_nein', 'kein_kontakt');

-- ── Journey: Begleitung ab dem Erstgespräch ─────────────────────────────────
-- Nur Terminlogistik und ehrliche Nachfragen. Kein Verkaufsdruck, keine
-- Verknappung, keine Countdown-Rhetorik — genau das, wovor die Verbraucherzentralen warnen.
INSERT INTO journey_templates (id, coach_id, name, beschreibung, ausloeser)
VALUES ('00000000-0000-4000-8000-000000000002'::uuid, NULL,
        'Erstgespräch · Begleitung bis zur Entscheidung',
        'Startet, sobald eine Interessentin ihr kostenloses Erstgespräch gebucht und die Kontaktaufnahme bestätigt hat.',
        'erstgespraech_gebucht')
ON CONFLICT (id) DO NOTHING;

INSERT INTO journey_steps (template_id, position, warte_stunden, bedingung, aktion, inhalt) VALUES
  ('00000000-0000-4000-8000-000000000002'::uuid, 1, 0,   NULL, 'nachricht',
   'Dein Termin steht — ich freue mich auf dich. Du musst nichts vorbereiten, bring einfach mit, was dich gerade beschäftigt.'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 2, 20,  '{"feld":"stunden_bis_termin","wert":24}'::jsonb, 'erinnerung',
   'Morgen sprechen wir. Falls es zeitlich doch nicht passt, sag einfach Bescheid — wir finden einen neuen Termin.'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 3, 24,  '{"feld":"status","wert":"gespraech_gefuehrt"}'::jsonb, 'nachricht',
   'Danke für unser Gespräch. Lass dir Zeit mit deiner Entscheidung — melde dich, wenn du eine Frage hast.'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 4, 72,  '{"feld":"status","wert":"gespraech_gefuehrt"}'::jsonb, 'nachricht',
   'Ich wollte kurz nachfragen, wie du dich fühlst mit dem, was wir besprochen haben. Auch ein Nein ist eine gute Antwort.'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 5, 168, '{"feld":"status","wert":"gespraech_gefuehrt"}'::jsonb, 'coach_signal',
   'Eine Woche nach dem Erstgespräch, noch keine Entscheidung — persönlich melden oder loslassen?'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 6, 168, '{"feld":"status","wert":"gespraech_gefuehrt"}'::jsonb, 'nachricht',
   'Ich melde mich ein letztes Mal — danach lasse ich dich in Ruhe. Wenn du später magst, findest du mich jederzeit. 🤍')
ON CONFLICT (template_id, position) DO NOTHING;

-- Nach Schritt 6 endet der Lauf. Bewusst: sechs Nachrichten, dann Schluss.
-- Wer sich nicht meldet, will nicht — das ist eine Antwort und kein Anlass für Nachfassen.
