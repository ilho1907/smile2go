-- smile2go · Das Profil der Coachin, wie ihre Klientinnen es sehen
--
-- Nach der Anmeldung hinterlegt die Coachin einmal, wo man sie findet und wie
-- man einen Termin bekommt. Die Klientin sieht das, sobald sie den Code eingelöst
-- hat — die Policy "Klientin sieht ihre Coachin" gilt für die neuen Spalten mit.
--
-- Buchungslink bewusst als Link auf ihr eigenes Werkzeug (Calendly, eTermin,
-- Cal.com): der Termin entsteht bei ihr, nicht bei uns. Kein zusätzlicher
-- Auftragsverarbeiter, keine Terminkette über unsere Server.

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS kurzprofil        TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS email_oeffentlich TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS buchungslink      TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS telefon           TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS tiktok            TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS facebook          TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS linkedin          TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS schwerpunkte      TEXT[];
