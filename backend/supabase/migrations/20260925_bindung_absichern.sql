-- ---------------------------------------------------------------------------
-- smile2go · Bindung Klientin ↔ Coachin absichern (25.09.2026)
--
-- Vorher: Die UPDATE-Policy erlaubte der Klientin, JEDE Spalte ihrer Zeile zu
-- ändern — auch coach_id (sich selbst einer fremden Coachin zuordnen) oder
-- status zurück auf 'aktiv', nachdem die Coachin beendet hat.
-- Jetzt:
--   1) Nur die Coachin aktualisiert Zeilen direkt (Status, Anzeigename).
--   2) user_id und coach_id sind nach dem Anlegen unveränderlich (Trigger).
--   3) Die Klientin beendet ihre Bindung selbst über die RPC bindung_beenden().
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Klientin aktualisiert ihre eigene Bindung" ON klientinnen;
DROP POLICY IF EXISTS "Coachin aktualisiert Bindung" ON klientinnen;
CREATE POLICY "Coachin aktualisiert Bindung" ON klientinnen
  FOR UPDATE USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE OR REPLACE FUNCTION klientinnen_schluessel_fest()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR (NEW.coach_id IS DISTINCT FROM OLD.coach_id AND NEW.coach_id IS NOT NULL) THEN
    RAISE EXCEPTION 'user_id und coach_id einer Bindung sind unveränderlich';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_klientinnen_schluessel_fest ON klientinnen;
CREATE TRIGGER trg_klientinnen_schluessel_fest
  BEFORE UPDATE ON klientinnen
  FOR EACH ROW EXECUTE FUNCTION klientinnen_schluessel_fest();

-- Klientin beendet ihre aktive/pausierte Bindung. Nachrichten und Termine bleiben
-- erhalten (Dokumentationspflicht), die Coachin sieht sie nur noch als "beendet".
CREATE OR REPLACE FUNCTION bindung_beenden()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  UPDATE klientinnen SET status = 'beendet'
   WHERE user_id = auth.uid() AND status IN ('aktiv', 'pausiert', 'anfrage');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION bindung_beenden() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bindung_beenden() TO authenticated;
