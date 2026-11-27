-- ---------------------------------------------------------------------------
-- smile2go · Freigaben (consent) + ilho-Erkenntnisse (insights) + ilho lernt (27.11.2026)
--
-- Grundsatz: Privacy by Default. Ohne aktive Freigabe speichert ilho-chat KEINE
-- Zusammenfassung, und die Coachin sieht nichts. Jede Freigabe gilt für genau
-- einen Bereich und ist jederzeit widerrufbar (Art. 7 Abs. 3, Art. 9 DSGVO).
--
-- Bereiche:
--   stimmung     – Stimmungsverlauf (Zahl 1–5)          → Coachin
--   themen       – Themen-Schlagworte                   → Coachin
--   ziele        – genannte Ziele / Vorhaben            → Coachin
--   fortschritt  – kurze Zusammenfassung des Gesprächs  → Coachin
--   ilho_lernen  – anonymisiert in ilhos Wochenlernen   → nur ilho, nie Coachin
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bereich TEXT NOT NULL CHECK (bereich IN ('stimmung','themen','ziele','fortschritt','ilho_lernen')),
  aktiv BOOLEAN NOT NULL DEFAULT false,
  text_version TEXT NOT NULL DEFAULT '2026-11-27',   -- welcher Einwilligungstext gezeigt wurde
  erteilt_am TIMESTAMP WITH TIME ZONE,
  widerrufen_am TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, bereich)
);

ALTER TABLE consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutzerin sieht ihre Freigaben" ON consent;
CREATE POLICY "Nutzerin sieht ihre Freigaben" ON consent
  FOR SELECT USING (auth.uid() = user_id);

-- Die Coachin sieht, WELCHE Bereiche ihre (aktive/pausierte) Klientin freigegeben hat —
-- damit das Analyse-Fenster erklären kann, warum etwas fehlt. ilho_lernen bleibt verborgen.
DROP POLICY IF EXISTS "Coachin sieht Freigaben ihrer Klientin" ON consent;
CREATE POLICY "Coachin sieht Freigaben ihrer Klientin" ON consent
  FOR SELECT USING (
    bereich <> 'ilho_lernen' AND EXISTS (
      SELECT 1 FROM klientinnen k
       WHERE k.user_id = consent.user_id AND k.coach_id = auth.uid()
         AND k.status IN ('aktiv','pausiert')
    )
  );

-- Schreiben nur über die RPC (Zeitstempel und Historie bleiben konsistent).
CREATE OR REPLACE FUNCTION freigabe_setzen(p_bereich TEXT, p_an BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  INSERT INTO consent (user_id, bereich, aktiv, erteilt_am, widerrufen_am, updated_at)
  VALUES (auth.uid(), p_bereich, p_an,
          CASE WHEN p_an THEN now() END,
          CASE WHEN p_an THEN NULL ELSE now() END, now())
  ON CONFLICT (user_id, bereich) DO UPDATE SET
    aktiv = EXCLUDED.aktiv,
    erteilt_am = CASE WHEN EXCLUDED.aktiv THEN now() ELSE consent.erteilt_am END,
    widerrufen_am = CASE WHEN EXCLUDED.aktiv THEN NULL ELSE now() END,
    updated_at = now();
END $$;

REVOKE ALL ON FUNCTION freigabe_setzen(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION freigabe_setzen(TEXT, BOOLEAN) TO authenticated;

-- Hilfsfunktion: hat diese Nutzerin den Bereich gerade aktiv freigegeben?
CREATE OR REPLACE FUNCTION hat_freigabe(p_user UUID, p_bereich TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM consent WHERE user_id = p_user AND bereich = p_bereich AND aktiv);
$$;

-- ---------------------------------------------------------------------------
-- insights: eine Zeile pro ilho-Gespräch (nur wenn mindestens eine Freigabe aktiv ist).
-- Geschrieben ausschließlich von der Edge Function ilho-chat (Service-Role).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quelle TEXT NOT NULL DEFAULT 'ilho-chat',
  stimmung SMALLINT CHECK (stimmung BETWEEN 1 AND 5),
  themen TEXT[] NOT NULL DEFAULT '{}',
  ziele TEXT[] NOT NULL DEFAULT '{}',
  zusammenfassung TEXT,
  modell TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id, created_at DESC);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutzerin sieht ihre Erkenntnisse" ON insights;
CREATE POLICY "Nutzerin sieht ihre Erkenntnisse" ON insights
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Nutzerin löscht ihre Erkenntnisse" ON insights;
CREATE POLICY "Nutzerin löscht ihre Erkenntnisse" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- Die Coachin liest NICHT direkt aus insights, sondern nur über coach_klientin_analyse():
-- dort wird jede Spalte einzeln gegen die passende Freigabe gefiltert.
CREATE OR REPLACE FUNCTION coach_klientin_analyse(p_klientin UUID, p_tage INT DEFAULT 90)
RETURNS TABLE (
  created_at TIMESTAMP WITH TIME ZONE,
  stimmung SMALLINT,
  themen TEXT[],
  ziele TEXT[],
  zusammenfassung TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID;
BEGIN
  SELECT k.user_id INTO v_user FROM klientinnen k
   WHERE k.id = p_klientin AND k.coach_id = auth.uid() AND k.status IN ('aktiv','pausiert');
  IF v_user IS NULL THEN RAISE EXCEPTION 'keine Klientin von dir'; END IF;

  RETURN QUERY
  SELECT i.created_at,
         CASE WHEN hat_freigabe(v_user, 'stimmung')    THEN i.stimmung END,
         CASE WHEN hat_freigabe(v_user, 'themen')      THEN i.themen ELSE '{}'::TEXT[] END,
         CASE WHEN hat_freigabe(v_user, 'ziele')       THEN i.ziele  ELSE '{}'::TEXT[] END,
         CASE WHEN hat_freigabe(v_user, 'fortschritt') THEN i.zusammenfassung END
    FROM insights i
   WHERE i.user_id = v_user
     AND i.created_at > now() - make_interval(days => LEAST(GREATEST(p_tage, 1), 365))
     -- Nur Gespräche ab dem Zeitpunkt der ersten aktiven Freigabe: rückwirkend wird nichts geteilt.
     AND i.created_at >= (SELECT min(c.erteilt_am) FROM consent c
                           WHERE c.user_id = v_user AND c.aktiv AND c.bereich <> 'ilho_lernen')
   ORDER BY i.created_at DESC
   LIMIT 200;
END $$;

REVOKE ALL ON FUNCTION coach_klientin_analyse(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION coach_klientin_analyse(UUID, INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- ilho_lernen: Ergebnis des wöchentlichen Lernlaufs (Mistral Large).
-- Nur Aggregate ohne Personenbezug. Kein Client-Zugriff; Admin liest per Service-Role.
-- Die Vorschläge werden NICHT automatisch in den System-Prompt übernommen —
-- ein Mensch prüft sie (app/src/ilho.js bleibt die einzige Quelle).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ilho_lernen (
  woche DATE PRIMARY KEY,            -- Montag der ausgewerteten Woche → ein Lauf pro Woche
  anzahl_gespraeche INT NOT NULL DEFAULT 0,
  ergebnis JSONB,
  modell TEXT,
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','geprueft','uebernommen','verworfen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE ilho_lernen ENABLE ROW LEVEL SECURITY;
-- bewusst keine Policy: nur Service-Role

-- Montags 04:17 (UTC) den Lernlauf anstoßen. Die Function ist pro Woche idempotent.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'ilho-lernen';

SELECT cron.schedule(
  'ilho-lernen',
  '17 4 * * 1',
  $$ SELECT net.http_post(
       url := 'https://bquqghnxlvszvxrygiyc.supabase.co/functions/v1/ilho-lernen',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
