-- smile2go · Der Twin erreicht endlich die Klientin
--
-- Bisher konnte NUR die Coachin ihr eigenes Dossier lesen. Die App lud auf
-- Klientinnen-Seite deshalb das (leere) Dossier der Klientin selbst — der
-- ganze Tonalitäts-Layer lief ins Leere. Mit der klientinnen-Bindung lässt
-- sich das jetzt sauber auflösen: die Klientin liest genau ein Dossier —
-- das freigegebene ihrer eigenen Coachin.

DROP POLICY IF EXISTS "Klientin liest das freigegebene Dossier ihrer Coachin" ON coach_dossier;
DROP POLICY IF EXISTS "Klientin liest das freigegebene Dossier ihrer Coachin" ON coach_dossier;
CREATE POLICY "Klientin liest das freigegebene Dossier ihrer Coachin" ON coach_dossier
  FOR SELECT USING (
    freigegeben = true
    AND EXISTS (
      SELECT 1 FROM klientinnen k
      WHERE k.coach_id = coach_dossier.coach_id
        AND k.user_id = auth.uid()
        AND k.status = 'aktiv'
    )
  );

-- Dasselbe für die Stimme: die Klientin muss wissen, DASS es eine gibt
-- (sonst zeigt die App keinen Hörknopf). Der Schlüssel selbst bleibt beim
-- Anbieter, die Erzeugung läuft serverseitig über die Edge Function.
DROP POLICY IF EXISTS "Klientin sieht das Stimmprofil ihrer Coachin" ON stimm_profile;
DROP POLICY IF EXISTS "Klientin sieht das Stimmprofil ihrer Coachin" ON stimm_profile;
CREATE POLICY "Klientin sieht das Stimmprofil ihrer Coachin" ON stimm_profile
  FOR SELECT USING (
    widerrufen_am IS NULL
    AND EXISTS (
      SELECT 1 FROM klientinnen k
      WHERE k.coach_id = stimm_profile.coach_id
        AND k.user_id = auth.uid()
        AND k.status = 'aktiv'
    )
  );
