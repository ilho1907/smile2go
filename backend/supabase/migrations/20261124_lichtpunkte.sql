-- ---------------------------------------------------------------------------
-- smile2go · Lichtpunkte auf dem Server (24.11.2026) — Schritt 1: Datenschicht
--
-- Bisher lebten die Lichtpunkte nur im App-Zustand (app_state / localStorage)
-- und konnten im Browser beliebig veraendert werden. Ab jetzt:
--
--   punkte_log          — jede Buchung (verdient, eingeloest, uebernahme).
--                         Der Stand ist die Summe. Nutzerinnen LESEN nur,
--                         geschrieben wird ausschliesslich ueber die Funktionen.
--   punkte_regeln       — Punkte pro Aktion + Tageslimit, im Admin aenderbar.
--                         '_tageslimit' = Obergrenze verdienter Punkte pro Tag.
--   punkte_vergeben     — bucht Punkte fuer eine Aktion, achtet auf Regeln
--                         und Tageslimit (Tag = Europe/Berlin).
--   punkte_einloesen    — zieht Punkte fuer eine Belohnung ab (nie ins Minus).
--   punkte_uebernehmen  — einmalig: bisherigen Stand aus dem App-Zustand
--                         uebernehmen (gedeckelt), damit niemand Punkte verliert.
--   punkte_stand        — aktueller Stand.
--
-- Konzept: "smile2go Puan & Challenge Sistemi — Konsept" (Claude Docs).
-- Journal-/Gefuehlsinhalte werden hier nie gespeichert — nur Aktion + Punkte.
-- ---------------------------------------------------------------------------

-- ── punkte_log: an auth.users haengen (profiles ist nicht immer befuellt) ──
ALTER TABLE punkte_log DROP CONSTRAINT IF EXISTS punkte_log_user_id_fkey;
ALTER TABLE punkte_log
  ADD CONSTRAINT punkte_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE punkte_log ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE punkte_log ADD COLUMN IF NOT EXISTS art TEXT NOT NULL DEFAULT 'verdient';
ALTER TABLE punkte_log ADD COLUMN IF NOT EXISTS quelle TEXT NOT NULL DEFAULT 'smile2go'; -- spaeter: Coach-Challenges
ALTER TABLE punkte_log ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE punkte_log DROP CONSTRAINT IF EXISTS punkte_log_art_check;
ALTER TABLE punkte_log ADD CONSTRAINT punkte_log_art_check
  CHECK (art IN ('verdient', 'eingeloest', 'uebernahme', 'korrektur'));
CREATE INDEX IF NOT EXISTS punkte_log_user_zeit ON punkte_log (user_id, created_at DESC);

ALTER TABLE punkte_log ENABLE ROW LEVEL SECURITY;
-- Alte Politik erlaubte ALLES auf eigene Zeilen — also auch sich selbst Punkte
-- zu schreiben. Ersetzt durch: nur lesen.
DROP POLICY IF EXISTS "eigene daten" ON punkte_log;
DROP POLICY IF EXISTS "Eigene Lichtpunkte lesen" ON punkte_log;
CREATE POLICY "Eigene Lichtpunkte lesen" ON punkte_log FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins lesen Lichtpunkte" ON punkte_log;
CREATE POLICY "Admins lesen Lichtpunkte" ON punkte_log FOR SELECT USING (ist_admin());
REVOKE INSERT, UPDATE, DELETE ON punkte_log FROM anon, authenticated;

-- ── Regeln ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS punkte_regeln (
  aktion        TEXT PRIMARY KEY,           -- wie im App-Code beschriftet, z. B. 'Tagebuch-Eintrag'
  punkte        INT  NOT NULL CHECK (punkte >= 0),
  max_pro_tag   INT  CHECK (max_pro_tag IS NULL OR max_pro_tag > 0), -- NULL = ohne eigenes Limit
  aktiv         BOOLEAN NOT NULL DEFAULT true,
  beschreibung  TEXT,
  geaendert_am  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE punkte_regeln ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Regeln lesen" ON punkte_regeln;
CREATE POLICY "Regeln lesen" ON punkte_regeln FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins pflegen Regeln" ON punkte_regeln;
CREATE POLICY "Admins pflegen Regeln" ON punkte_regeln FOR ALL USING (ist_admin()) WITH CHECK (ist_admin());

INSERT INTO punkte_regeln (aktion, punkte, max_pro_tag, beschreibung) VALUES
  ('_tageslimit', 100, NULL, 'Hoechstens so viele verdiente Lichtpunkte pro Tag (alle Aktionen zusammen)'),
  ('_standard_max', 20, NULL, 'Obergrenze fuer Aktionen ohne eigene Regel'),
  ('_uebernahme_max', 1000, NULL, 'Hoechstens so viele Punkte werden aus dem alten App-Zustand uebernommen')
ON CONFLICT (aktion) DO NOTHING;

-- ── Hilfen ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION punkte_regelwert(p_aktion TEXT, p_vorgabe INT)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT punkte FROM punkte_regeln WHERE aktion = p_aktion AND aktiv), p_vorgabe);
$$;

CREATE OR REPLACE FUNCTION punkte_stand()
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(punkte), 0)::INT FROM punkte_log WHERE user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION punkte_stand() TO authenticated;

-- ── Vergeben ────────────────────────────────────────────────────────────────
-- Rueckgabe: {"vergeben": n, "gesamt": n, "heute": n, "limit": true|false}
CREATE OR REPLACE FUNCTION punkte_vergeben(p_aktion TEXT, p_punkte INT DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid      UUID := auth.uid();
  v_aktion TEXT := left(trim(coalesce(p_aktion, '')), 80);
  regel    punkte_regeln%ROWTYPE;
  hat_regel BOOLEAN;
  wunsch   INT;
  heute_d  DATE := (now() AT TIME ZONE 'Europe/Berlin')::DATE;
  heute    INT;
  anzahl   INT;
  limit_t  INT := punkte_regelwert('_tageslimit', 100);
  n        INT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  IF v_aktion = '' OR left(v_aktion, 1) = '_' THEN RAISE EXCEPTION 'unbekannte Aktion'; END IF;

  -- Eine Buchung pro Nutzerin gleichzeitig (Doppelklicks, mehrere Tabs).
  PERFORM pg_advisory_xact_lock(hashtext('punkte:' || uid::TEXT));

  SELECT * INTO regel FROM punkte_regeln r WHERE r.aktion = v_aktion;
  hat_regel := FOUND;
  IF hat_regel AND NOT regel.aktiv THEN
    wunsch := 0;
  ELSIF hat_regel THEN
    wunsch := regel.punkte;
  ELSE
    wunsch := LEAST(GREATEST(coalesce(p_punkte, 0), 0), punkte_regelwert('_standard_max', 20));
  END IF;

  SELECT COALESCE(SUM(punkte), 0)::INT INTO heute FROM punkte_log
   WHERE user_id = uid AND art = 'verdient'
     AND (created_at AT TIME ZONE 'Europe/Berlin')::DATE = heute_d;

  IF hat_regel AND regel.max_pro_tag IS NOT NULL THEN
    SELECT count(*) INTO anzahl FROM punkte_log l
     WHERE l.user_id = uid AND l.art = 'verdient' AND l.aktion = v_aktion
       AND (created_at AT TIME ZONE 'Europe/Berlin')::DATE = heute_d;
    IF anzahl >= regel.max_pro_tag THEN wunsch := 0; END IF;
  END IF;

  n := GREATEST(0, LEAST(wunsch, limit_t - heute));
  IF n > 0 THEN
    INSERT INTO punkte_log (user_id, aktion, punkte, art) VALUES (uid, v_aktion, n, 'verdient');
  END IF;

  RETURN jsonb_build_object(
    'vergeben', n,
    'gesamt',   (SELECT COALESCE(SUM(punkte), 0) FROM punkte_log WHERE user_id = uid),
    'heute',    heute + n,
    'limit',    (heute + n) >= limit_t
  );
END $$;
GRANT EXECUTE ON FUNCTION punkte_vergeben(TEXT, INT) TO authenticated;

-- ── Einloesen ───────────────────────────────────────────────────────────────
-- Rueckgabe: {"ok": true|false, "gesamt": n}
CREATE OR REPLACE FUNCTION punkte_einloesen(p_punkte INT, p_titel TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid   UUID := auth.uid();
  stand INT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  IF coalesce(p_punkte, 0) <= 0 THEN RAISE EXCEPTION 'ungueltiger Betrag'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('punkte:' || uid::TEXT));
  SELECT COALESCE(SUM(punkte), 0)::INT INTO stand FROM punkte_log WHERE user_id = uid;
  IF stand < p_punkte THEN
    RETURN jsonb_build_object('ok', false, 'gesamt', stand);
  END IF;
  INSERT INTO punkte_log (user_id, aktion, punkte, art)
  VALUES (uid, left(coalesce(nullif(trim(p_titel), ''), 'Einloesung'), 80), -p_punkte, 'eingeloest');
  RETURN jsonb_build_object('ok', true, 'gesamt', stand - p_punkte);
END $$;
GRANT EXECUTE ON FUNCTION punkte_einloesen(INT, TEXT) TO authenticated;

-- ── Einmalige Uebernahme des alten Stands ───────────────────────────────────
-- Nur wenn es fuer die Nutzerin noch keine einzige Buchung gibt.
CREATE OR REPLACE FUNCTION punkte_uebernehmen(p_stand INT)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  n   INT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('punkte:' || uid::TEXT));
  IF NOT EXISTS (SELECT 1 FROM punkte_log WHERE user_id = uid) THEN
    n := LEAST(GREATEST(coalesce(p_stand, 0), 0), punkte_regelwert('_uebernahme_max', 1000));
    IF n > 0 THEN
      INSERT INTO punkte_log (user_id, aktion, punkte, art) VALUES (uid, 'Uebernahme bisheriger Stand', n, 'uebernahme');
    END IF;
  END IF;
  RETURN (SELECT COALESCE(SUM(punkte), 0)::INT FROM punkte_log WHERE user_id = uid);
END $$;
GRANT EXECUTE ON FUNCTION punkte_uebernehmen(INT) TO authenticated;

REVOKE EXECUTE ON FUNCTION punkte_regelwert(TEXT, INT) FROM PUBLIC, anon;
