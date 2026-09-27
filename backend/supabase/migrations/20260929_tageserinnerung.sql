-- ---------------------------------------------------------------------------
-- smile2go · Tägliche Erinnerung (27.09.2026)
-- "Heute noch offen: Tagebuch · Meditation" — einmal pro Tag zur Wunschzeit,
-- nur wenn wirklich etwas offen ist. Läuft im bestehenden Cron-Job
-- "termin-erinnerungen" (Edge Function "erinnerungen") mit.
-- Was erledigt ist, erkennt die DB an den anonymen app_events
-- (user_hash = sha256(user_id)) — es werden keine Inhalte gelesen.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS tageserinnerung (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  uhrzeit TIME NOT NULL DEFAULT '19:00',
  zeitzone TEXT NOT NULL DEFAULT 'Europe/Berlin',
  letzte_gesendet DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE tageserinnerung ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Nutzerin verwaltet ihre Erinnerung" ON tageserinnerung;
CREATE POLICY "Nutzerin verwaltet ihre Erinnerung" ON tageserinnerung
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Markiert alle fälligen Erinnerungen atomar (höchstens eine pro Tag) und liefert,
-- was die Nutzerin heute schon erledigt hat. Fenster: Wunschzeit bis +3 h,
-- damit nach einem Ausfall nicht mitten in der Nacht nachgeliefert wird.
CREATE OR REPLACE FUNCTION faellige_tageserinnerungen()
RETURNS TABLE (user_id UUID, erledigt TEXT[])
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  RETURN QUERY
  WITH faellig AS (
    UPDATE tageserinnerung t
       SET letzte_gesendet = (now() AT TIME ZONE t.zeitzone)::date
     WHERE t.aktiv
       AND (t.letzte_gesendet IS NULL OR t.letzte_gesendet < (now() AT TIME ZONE t.zeitzone)::date)
       -- Differenz statt "uhrzeit + 3 h", damit späte Uhrzeiten (z. B. 22:30) nicht über Mitternacht kippen.
       AND ((now() AT TIME ZONE t.zeitzone)::time - t.uhrzeit) >= interval '0'
       AND ((now() AT TIME ZONE t.zeitzone)::time - t.uhrzeit) <  interval '3 hours'
       AND EXISTS (SELECT 1 FROM push_abos p WHERE p.user_id = t.user_id)
    RETURNING t.user_id, t.zeitzone
  )
  SELECT f.user_id,
         coalesce(array_agg(DISTINCT e.topic_tag) FILTER (WHERE e.topic_tag IS NOT NULL), '{}')
    FROM faellig f
    LEFT JOIN app_events e
      ON e.user_hash = encode(extensions.digest(f.user_id::text, 'sha256'), 'hex')
     AND e.event_type = 'tages_aktivitaet'
     AND e.created_at >= (date_trunc('day', now() AT TIME ZONE f.zeitzone) AT TIME ZONE f.zeitzone)
   GROUP BY f.user_id;
END $$;

REVOKE ALL ON FUNCTION faellige_tageserinnerungen() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION faellige_tageserinnerungen() TO service_role;
