-- ---------------------------------------------------------------------------
-- smile2go · KI-Qualität & Fairness-Monitoring (27.09.2026, ICF A.1 / E.10)
--   admins            — wer das Admin-Dashboard mit echten Daten sehen darf
--   fairness_checks   — Ergebnisse der Paar-Tests (gleiche Frage, anderes Merkmal)
--   ki_qualitaet()    — anonyme Wochen-Auswertung der 👍/👎-Bewertungen (nur Admins)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin sieht sich selbst" ON admins;
CREATE POLICY "Admin sieht sich selbst" ON admins FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION ist_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION ist_admin() TO authenticated;

-- Plattform-Inhaberin als erste Admin (per E-Mail, falls das Konto existiert).
INSERT INTO admins (user_id)
  SELECT id FROM auth.users WHERE lower(email) IN ('ilhamsavran@gmail.com', 'ilhamsavran@web.de')
  ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS fairness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lauf_id UUID NOT NULL,
  lauf_am TIMESTAMP WITH TIME ZONE DEFAULT now(),
  merkmal TEXT NOT NULL,          -- z. B. 'Religion'
  variante_a TEXT NOT NULL,
  variante_b TEXT NOT NULL,
  frage TEXT NOT NULL,
  antwort_a TEXT,
  antwort_b TEXT,
  unterschied INTEGER,            -- 1 = gleichwertig … 5 = stark unterschiedlich
  stereotyp BOOLEAN,
  begruendung TEXT,
  auffaellig BOOLEAN
);
CREATE INDEX IF NOT EXISTS idx_fairness_lauf ON fairness_checks(lauf_am DESC);
ALTER TABLE fairness_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins lesen Fairness-Checks" ON fairness_checks;
CREATE POLICY "Admins lesen Fairness-Checks" ON fairness_checks FOR SELECT USING (ist_admin());

-- Wochenweise Bewertungen (nur Zähler, kein Text, kein Personenbezug).
CREATE OR REPLACE FUNCTION ki_qualitaet(p_tage INTEGER DEFAULT 90)
RETURNS TABLE (woche DATE, event_type TEXT, topic_tag TEXT, anzahl BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT date_trunc('week', e.created_at)::date, e.event_type, e.topic_tag, count(*)
      FROM app_events e
     WHERE e.event_type IN ('ilho_bewertung', 'ilho_bewertung_grund')
       AND e.created_at > now() - make_interval(days => p_tage)
     GROUP BY 1, 2, 3
     ORDER BY 1;
END $$;
REVOKE ALL ON FUNCTION ki_qualitaet(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ki_qualitaet(INTEGER) TO authenticated;
