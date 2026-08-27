-- smile2go · Einmalige Einrichtung nach der Migration
-- Legt an: Coach-Profil, Einladungscode für Klientinnen, freie Zeitfenster.
-- E-Mail unten auf das Konto ändern, das die COACHIN benutzt.

DO $$
DECLARE
  v_email TEXT := 'ilhamsavran@gmail.com';   -- ← Konto der Coachin
  v_name  TEXT := 'smile2go Coaching';       -- ← Anzeigename in der App
  v_code  TEXT := 'S2G-2026';                -- ← Einladungscode für Klientinnen
  v_coach UUID;
BEGIN
  SELECT id INTO v_coach FROM auth.users WHERE email = v_email LIMIT 1;
  IF v_coach IS NULL THEN
    RAISE EXCEPTION 'Kein Konto mit der E-Mail % — bitte zuerst in der App registrieren.', v_email;
  END IF;

  INSERT INTO coaches (id, name) VALUES (v_coach, v_name)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO coach_einladungen (code, coach_id) VALUES (v_code, v_coach)
    ON CONFLICT (code) DO UPDATE SET coach_id = EXCLUDED.coach_id, aktiv = true;

  -- Naechste 14 Tage, Montag bis Freitag, vier Zeitfenster taeglich
  INSERT INTO coach_slots (coach_id, beginn)
  SELECT v_coach, tag + zeit
  FROM generate_series(CURRENT_DATE + 1, CURRENT_DATE + 14, INTERVAL '1 day') AS tag
  CROSS JOIN (VALUES (INTERVAL '9 hours'), (INTERVAL '11 hours'),
                     (INTERVAL '14 hours'), (INTERVAL '16 hours 30 minutes')) AS z(zeit)
  WHERE EXTRACT(ISODOW FROM tag) < 6
  ON CONFLICT (coach_id, beginn) DO NOTHING;

  RAISE NOTICE 'Fertig. Einladungscode: %', v_code;
END $$;
