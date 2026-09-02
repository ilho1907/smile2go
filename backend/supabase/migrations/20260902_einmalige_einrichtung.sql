-- Einmalige Einrichtung: Coach-Profil, Einladungscode, freie Zeitfenster.
-- Laeuft nur, wenn das Coach-Konto bereits existiert; sonst wird es uebersprungen.
DO $$
DECLARE
  v_email TEXT := 'ilhamsavran@gmail.com';
  v_name  TEXT := 'smile2go Coaching';
  v_code  TEXT := 'S2G-2026';
  v_coach UUID;
BEGIN
  SELECT id INTO v_coach FROM auth.users WHERE email = v_email LIMIT 1;
  IF v_coach IS NULL THEN
    RAISE NOTICE 'Kein Konto mit % - Einrichtung uebersprungen.', v_email;
    RETURN;
  END IF;

  INSERT INTO coaches (id, name) VALUES (v_coach, v_name)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO coach_einladungen (code, coach_id) VALUES (v_code, v_coach)
    ON CONFLICT (code) DO UPDATE SET coach_id = EXCLUDED.coach_id, aktiv = true;

  INSERT INTO coach_slots (coach_id, beginn)
  SELECT v_coach, tag + zeit
  FROM generate_series(CURRENT_DATE + 1, CURRENT_DATE + 14, INTERVAL '1 day') AS tag
  CROSS JOIN (VALUES (INTERVAL '9 hours'), (INTERVAL '11 hours'),
                     (INTERVAL '14 hours'), (INTERVAL '16 hours 30 minutes')) AS z(zeit)
  WHERE EXTRACT(ISODOW FROM tag) < 6
  ON CONFLICT (coach_id, beginn) DO NOTHING;

  RAISE NOTICE 'Fertig. Einladungscode: %', v_code;
END $$;
