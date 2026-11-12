-- ---------------------------------------------------------------------------
-- smile2go · Coach-Codes (12.11.2026)
--
-- Coachin wird man nur noch mit einem Code, den smile2go selbst ausgibt.
-- Bisher konnte jede Nutzerin sich per Klick (Registrierung oder Profil)
-- als Coachin markieren — damit war der Coach-Bereich fuer alle offen.
--
--   coach_codes            — Codes aus dem Admin-Dashboard, einmal einloesbar.
--                            Wer, wann, mit welchem Code: alles nachvollziehbar.
--   coach_code_pruefen     — fuer das Registrierformular (noch ohne Sitzung):
--                            ist der Code gueltig? Verraet sonst nichts.
--   coach_code_einloesen   — loest den Code ein und schaltet die Rolle frei.
--   Trigger auf coaches    — ist_coach kann nicht mehr selbst auf true gesetzt
--                            werden, nur ueber coach_code_einloesen (oder Admin).
--                            Abschalten bleibt jederzeit moeglich.
--
-- Bestehende Coachinnen (ist_coach = true) behalten ihre Rolle.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS coach_codes (
  code            TEXT PRIMARY KEY,
  notiz           TEXT,                                   -- fuer wen gedacht, z. B. "Cindy · Trauer"
  erstellt_am     TIMESTAMPTZ NOT NULL DEFAULT now(),
  erstellt_von    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gueltig_bis     TIMESTAMPTZ,                            -- NULL = unbegrenzt
  aktiv           BOOLEAN NOT NULL DEFAULT true,
  eingeloest_von  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  eingeloest_am   TIMESTAMPTZ
);

ALTER TABLE coach_codes ENABLE ROW LEVEL SECURITY;
-- Keine Politik fuer normale Nutzerinnen: Codes sind nur ueber die
-- Funktionen unten erreichbar. Admins duerfen lesen.
DROP POLICY IF EXISTS "Admins lesen Coach-Codes" ON coach_codes;
CREATE POLICY "Admins lesen Coach-Codes" ON coach_codes FOR SELECT USING (ist_admin());

-- Zusaetzlich auf coaches: der Code, mit dem die Rolle freigeschaltet wurde.
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS coach_code TEXT;

-- ── Schutz: ist_coach nur per Code ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION coaches_rolle_schuetzen()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ist_coach
     AND (TG_OP = 'INSERT' OR NOT COALESCE(OLD.ist_coach, false))
     AND COALESCE(current_setting('s2g.coach_freischaltung', true), '') <> 'ja'
     AND NOT ist_admin()
     AND auth.uid() IS NOT NULL            -- Service-Role / SQL-Editor bleibt frei
  THEN
    RAISE EXCEPTION 'Coach-Bereich nur mit gültigem Coach-Code';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS coaches_rolle_schuetzen ON coaches;
CREATE TRIGGER coaches_rolle_schuetzen
  BEFORE INSERT OR UPDATE OF ist_coach ON coaches
  FOR EACH ROW EXECUTE FUNCTION coaches_rolle_schuetzen();

-- ── Fuer die Registrierung: Code gueltig? ───────────────────────────────────
CREATE OR REPLACE FUNCTION coach_code_pruefen(p_code TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM coach_codes
     WHERE code = upper(trim(p_code))
       AND aktiv AND eingeloest_von IS NULL
       AND (gueltig_bis IS NULL OR gueltig_bis > now())
  );
$$;
GRANT EXECUTE ON FUNCTION coach_code_pruefen(TEXT) TO anon, authenticated;

-- ── Einloesen: Rolle freischalten ───────────────────────────────────────────
-- Gibt 'ok', 'schon_coach' oder 'ungueltig' zurueck.
CREATE OR REPLACE FUNCTION coach_code_einloesen(p_code TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  uid UUID := auth.uid();
  c TEXT := upper(trim(coalesce(p_code, '')));
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  IF EXISTS (SELECT 1 FROM coaches WHERE id = uid AND ist_coach) THEN RETURN 'schon_coach'; END IF;

  UPDATE coach_codes
     SET eingeloest_von = uid, eingeloest_am = now()
   WHERE code = c
     AND aktiv AND eingeloest_von IS NULL
     AND (gueltig_bis IS NULL OR gueltig_bis > now());
  IF NOT FOUND THEN RETURN 'ungueltig'; END IF;

  PERFORM set_config('s2g.coach_freischaltung', 'ja', true);
  INSERT INTO coaches (id, ist_coach, coach_code) VALUES (uid, true, c)
    ON CONFLICT (id) DO UPDATE SET ist_coach = true, coach_code = c;
  PERFORM set_config('s2g.coach_freischaltung', '', true);
  RETURN 'ok';
END $$;
GRANT EXECUTE ON FUNCTION coach_code_einloesen(TEXT) TO authenticated;

-- ── Admin: Codes erzeugen, auflisten, an/aus ────────────────────────────────
-- Format COACH-XXXX-XXXX, ohne verwechselbare Zeichen (0/O, 1/I/L).
CREATE OR REPLACE FUNCTION admin_coach_code_erzeugen(p_notiz TEXT DEFAULT NULL, p_tage INTEGER DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  zeichen CONSTANT TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  neu TEXT;
  i INT;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  LOOP
    neu := 'COACH-';
    FOR i IN 1..8 LOOP
      IF i = 5 THEN neu := neu || '-'; END IF;
      neu := neu || substr(zeichen, 1 + floor(random() * length(zeichen))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM coach_codes WHERE code = neu);
  END LOOP;
  INSERT INTO coach_codes (code, notiz, erstellt_von, gueltig_bis)
    VALUES (neu, nullif(trim(p_notiz), ''), auth.uid(),
            CASE WHEN p_tage IS NULL THEN NULL ELSE now() + make_interval(days => p_tage) END);
  RETURN neu;
END $$;

CREATE OR REPLACE FUNCTION admin_coach_codes()
RETURNS TABLE (code TEXT, notiz TEXT, erstellt_am TIMESTAMPTZ, gueltig_bis TIMESTAMPTZ, aktiv BOOLEAN,
               eingeloest_am TIMESTAMPTZ, eingeloest_email TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT k.code, k.notiz, k.erstellt_am, k.gueltig_bis, k.aktiv, k.eingeloest_am, u.email::text
      FROM coach_codes k
      LEFT JOIN auth.users u ON u.id = k.eingeloest_von
     ORDER BY k.erstellt_am DESC;
END $$;

CREATE OR REPLACE FUNCTION admin_coach_code_umschalten(p_code TEXT, p_aktiv BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  UPDATE coach_codes SET aktiv = p_aktiv WHERE code = p_code;
END $$;

GRANT EXECUTE ON FUNCTION admin_coach_code_erzeugen(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_coach_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_coach_code_umschalten(TEXT, BOOLEAN) TO authenticated;
