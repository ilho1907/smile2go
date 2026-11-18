-- ---------------------------------------------------------------------------
-- smile2go · fester Test-Code PROBE1907 (18.11.2026)
--
-- Solange die Coach-Codes noch nicht einzeln verschickt werden, gilt ein
-- fester Code, der beliebig oft einloesbar ist. Wer ihn benutzt hat, steht
-- weiterhin in coaches.coach_code.
--
-- Abschalten: im Admin-Dashboard (Tab Coach-Codes) auf "aus" stellen, oder
--   UPDATE coach_codes SET aktiv = false WHERE code = 'PROBE1907';
-- ---------------------------------------------------------------------------

ALTER TABLE coach_codes ADD COLUMN IF NOT EXISTS mehrfach BOOLEAN NOT NULL DEFAULT false;

INSERT INTO coach_codes (code, notiz, mehrfach)
  VALUES ('PROBE1907', 'Fester Test-Code · mehrfach einlösbar', true)
  ON CONFLICT (code) DO UPDATE SET aktiv = true, mehrfach = true;

CREATE OR REPLACE FUNCTION coach_code_pruefen(p_code TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM coach_codes
     WHERE code = upper(trim(p_code))
       AND aktiv AND (mehrfach OR eingeloest_von IS NULL)
       AND (gueltig_bis IS NULL OR gueltig_bis > now())
  );
$$;
GRANT EXECUTE ON FUNCTION coach_code_pruefen(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION coach_code_einloesen(p_code TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  uid UUID := auth.uid();
  c TEXT := upper(trim(coalesce(p_code, '')));
  ist_mehrfach BOOLEAN;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  IF EXISTS (SELECT 1 FROM coaches WHERE id = uid AND ist_coach) THEN RETURN 'schon_coach'; END IF;

  SELECT mehrfach INTO ist_mehrfach FROM coach_codes
   WHERE code = c AND aktiv
     AND (gueltig_bis IS NULL OR gueltig_bis > now());
  IF NOT FOUND THEN RETURN 'ungueltig'; END IF;

  IF NOT ist_mehrfach THEN
    UPDATE coach_codes
       SET eingeloest_von = uid, eingeloest_am = now()
     WHERE code = c AND eingeloest_von IS NULL;
    IF NOT FOUND THEN RETURN 'ungueltig'; END IF;
  END IF;

  PERFORM set_config('s2g.coach_freischaltung', 'ja', true);
  INSERT INTO coaches (id, ist_coach, coach_code) VALUES (uid, true, c)
    ON CONFLICT (id) DO UPDATE SET ist_coach = true, coach_code = c;
  PERFORM set_config('s2g.coach_freischaltung', '', true);
  RETURN 'ok';
END $$;
GRANT EXECUTE ON FUNCTION coach_code_einloesen(TEXT) TO authenticated;
