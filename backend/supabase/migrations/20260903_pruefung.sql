-- Nur Kontrolle: schreibt Zaehlerstaende ins Log, aendert nichts.
DO $$
DECLARE c INT; e INT; s INT; f INT; u INT;
BEGIN
  SELECT count(*) INTO c FROM coaches;
  SELECT count(*) INTO e FROM coach_einladungen WHERE aktiv;
  SELECT count(*) INTO s FROM coach_slots;
  SELECT count(*) INTO f FROM coach_slots WHERE beginn > now();
  SELECT count(*) INTO u FROM auth.users;
  RAISE NOTICE 'PRUEFUNG: coaches=% einladungen=% slots=% davon_zukunft=% konten=%', c, e, s, f, u;
END $$;
