-- ---------------------------------------------------------------------------
-- smile2go · Morgen-Impuls & Challenge-Push (25.11.2026)
-- Ergänzt die tägliche Abend-Erinnerung (20260929_tageserinnerung.sql) um:
--  1) Morgen-Impuls zur Wunschzeit (Standard 08:00): Tageskarte, Mantra,
--     und — wenn sie läuft — der heutige Tag der Dankbarkeits-Challenge.
--  2) Challenge-Push: montags ist das neue Wochenritual freigeschaltet.
-- Persönlich: Vorname/Alias und Challenge-Tag kommen aus dem eigenen
-- app_state der Nutzerin (nur diese Felder, nichts aus Tagebuch o. ä.).
-- Läuft im bestehenden Cron-Job "termin-erinnerungen" (Edge Function
-- "erinnerungen", alle 15 Min.) mit.
-- ---------------------------------------------------------------------------

ALTER TABLE tageserinnerung
  ADD COLUMN IF NOT EXISTS morgen_aktiv BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS morgen_uhrzeit TIME NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS morgen_gesendet DATE,
  ADD COLUMN IF NOT EXISTS challenge_aktiv BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS woche_gesendet DATE;

-- Markiert alle fälligen Morgen-Pushes atomar (höchstens einer pro Tag) und liefert
-- die Bausteine für einen persönlichen Text. Fenster: Wunschzeit bis +2 h.
-- montag = true, wenn heute Montag ist und die Nutzerin Challenge-Hinweise will.
CREATE OR REPLACE FUNCTION faellige_morgenerinnerungen()
RETURNS TABLE (user_id UUID, vorname TEXT, challenge_tag INT, challenge_heute BOOLEAN,
               karte_gezogen BOOLEAN, morgen BOOLEAN, montag BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  RETURN QUERY
  WITH faellig AS (
    UPDATE tageserinnerung t
       SET morgen_gesendet = (now() AT TIME ZONE t.zeitzone)::date,
           woche_gesendet = CASE
             WHEN t.challenge_aktiv AND extract(isodow FROM (now() AT TIME ZONE t.zeitzone)) = 1
             THEN (now() AT TIME ZONE t.zeitzone)::date ELSE t.woche_gesendet END
     WHERE (t.morgen_aktiv
            OR (t.challenge_aktiv AND extract(isodow FROM (now() AT TIME ZONE t.zeitzone)) = 1))
       AND (t.morgen_gesendet IS NULL OR t.morgen_gesendet < (now() AT TIME ZONE t.zeitzone)::date)
       AND ((now() AT TIME ZONE t.zeitzone)::time - t.morgen_uhrzeit) >= interval '0'
       AND ((now() AT TIME ZONE t.zeitzone)::time - t.morgen_uhrzeit) <  interval '2 hours'
       AND EXISTS (SELECT 1 FROM push_abos p WHERE p.user_id = t.user_id)
    RETURNING t.user_id, t.zeitzone, t.morgen_aktiv, t.challenge_aktiv,
              (t.challenge_aktiv AND extract(isodow FROM (now() AT TIME ZONE t.zeitzone)) = 1) AS ist_montag
  )
  SELECT f.user_id,
         CASE WHEN coalesce((s.state->>'anon')::boolean, false) THEN NULL
              -- wie anzeigeName in der App: Alias, sonst der vordere Teil der E-Mail
              ELSE nullif(left(split_part(trim(coalesce(
                     nullif(trim(s.state->>'alias'), ''),
                     CASE WHEN split_part(s.state->>'user', '@', 1) ILIKE '%google%' THEN ''
                          ELSE initcap(trim(regexp_replace(split_part(s.state->>'user', '@', 1), '[._0-9]+', ' ', 'g'))) END,
                     '')), ' ', 1), 30), '') END,
         CASE WHEN coalesce((s.state->'ch369'->>'fertig')::boolean, false) THEN NULL
              ELSE nullif(s.state->'ch369'->>'tag', '')::int END,
         -- letzterTag ist ein JS-toDateString() ("Tue Nov 25 2026")
         coalesce(s.state->'ch369'->>'letzterTag' = to_char((now() AT TIME ZONE f.zeitzone)::date, 'Dy Mon DD YYYY'), false),
         coalesce(s.state->'drawn'->>'tag' = to_char((now() AT TIME ZONE f.zeitzone)::date, 'Dy Mon DD YYYY'), false),
         f.morgen_aktiv,
         f.ist_montag
    FROM faellig f
    LEFT JOIN app_state s ON s.user_id = f.user_id;
END $$;

REVOKE ALL ON FUNCTION faellige_morgenerinnerungen() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION faellige_morgenerinnerungen() TO service_role;
