-- smile2go · Phase A (Fable-5-Auftrag 6): AI Coach Twin + Event-Schema
-- Minimaler Coach-Marker (voller Rollen-/Mandanten-Umbau ist ein separates, größeres Vorhaben —
-- hier nur so viel, dass coach_dossier eine echte RLS-Grundlage hat).

CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coachin sieht nur sich selbst" ON coaches
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Coachin legt nur sich selbst an" ON coaches
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Coachin aktualisiert nur sich selbst" ON coaches
  FOR UPDATE USING (auth.uid() = id);

-- Methoden-Dossier aus dem ilho-Konfigurationsinterview.
-- Versioniert: jede Freigabe legt eine neue Zeile an, ältere bleiben als Historie erhalten.
CREATE TABLE IF NOT EXISTS coach_dossier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  antworten JSONB NOT NULL DEFAULT '[]'::jsonb,      -- rohe Interview-Antworten
  dossier JSONB,                                      -- strukturiertes, von Claude generiertes Dossier
  dossier_text TEXT,                                  -- lesbare Markdown-Fassung (Export/Über-mich)
  freigegeben BOOLEAN NOT NULL DEFAULT false,
  freigegeben_am TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE coach_dossier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coachin sieht nur ihr eigenes Dossier" ON coach_dossier
  FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coachin legt nur ihr eigenes Dossier an" ON coach_dossier
  FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coachin aktualisiert nur ihr eigenes Dossier" ON coach_dossier
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE OR REPLACE FUNCTION coach_dossier_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coach_dossier_updated_at ON coach_dossier;
CREATE TRIGGER trg_coach_dossier_updated_at
  BEFORE UPDATE ON coach_dossier
  FOR EACH ROW EXECUTE FUNCTION coach_dossier_set_updated_at();

-- Nur die jeweils freigegebene, neueste Dossier-Version — als security_invoker-View,
-- damit spätere Tonalitäts-Injektion (auch für verknüpfte Klientinnen) sauber darauf lesen kann,
-- ohne die RLS der Basistabelle zu umgehen.
CREATE OR REPLACE VIEW coach_dossier_aktiv
WITH (security_invoker = true) AS
SELECT DISTINCT ON (coach_id) *
FROM coach_dossier
WHERE freigegeben = true
ORDER BY coach_id, version DESC;

-- Zentrale, anonymisierbare Event-Tabelle — Grundlage für spätere Aggregation (Katman 4:
-- Opportunity Finder / Intervention Library). Bewusst: kein Freitext, kein Klarbezug.
CREATE TABLE IF NOT EXISTS app_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_hash TEXT NOT NULL,          -- z. B. sha256(user_id + Salt) — nie die Klar-User-ID
  event_type TEXT NOT NULL,         -- z. B. 'journal_eintrag', 'challenge_tag', 'karte_gezogen'
  topic_tag TEXT,                   -- z. B. 'selbstwert', 'grenzen' — kein Freitext
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- app_events bewusst OHNE Klar-User-Bezug und ohne clientseitige SELECT-Policy:
-- Schreiben geschieht ausschließlich über die Anon-Rolle mit INSERT-only-Policy;
-- Auswertung (Katman 4) erfolgt später ausschließlich serverseitig (Service-Role), nicht jetzt.
ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jede Sitzung darf Events schreiben, niemand liest zurück" ON app_events
  FOR INSERT WITH CHECK (true);
