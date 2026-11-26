-- ─────────────────────────────────────────────────────────────
-- smile2go · Kennenlerngespräch, Verifizierung und Gratis-Produkt
--   Formular A  kennenlern_anfragen     die neue Frau meldet sich zum Gespräch an
--   Formular B  kennenlern_protokolle   Protokoll der Begleiterin/Mentorin (nur Admins)
--   Formular C  coach_verifizierung     Coachin/Expertin reicht ihre Qualifikation ein
--   Formular D  gratis_produkte         Coachin reicht genau EIN Gratis-Produkt ein
--   Formular E  Prüfung in gratis_produkte.pruefung (nur Admins)
--   Einlösen    gratis_einloesungen     jede freigeschaltete Frau wählt EIN Gratis-Produkt
-- Regeln:
--   · Ausweis- oder Zertifikatskopien werden NICHT gespeichert. Geprüft wird im
--     Videogespräch; gespeichert wird nur „geprüft am … von …“.
--   · Die Freischaltung bleibt eine menschliche Entscheidung (admin_mitglied_freischalten).
--   · Schreiben der Admin-Teile nur über SECURITY-DEFINER-Funktionen mit ist_admin().
-- ─────────────────────────────────────────────────────────────

-- ── Formular A ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kennenlern_anfragen (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vorname            TEXT NOT NULL CHECK (length(trim(vorname)) BETWEEN 1 AND 60),
  telefon            TEXT CHECK (telefon IS NULL OR length(telefon) <= 30),
  als_frau           BOOLEAN NOT NULL CHECK (als_frau),
  volljaehrig        BOOLEAN NOT NULL CHECK (volljaehrig),
  thema              TEXT NOT NULL,
  wunsch             TEXT CHECK (wunsch IS NULL OR length(wunsch) <= 300),
  interessen         TEXT[] NOT NULL DEFAULT '{}',
  wunsch_coach       UUID REFERENCES coaches(id) ON DELETE SET NULL,
  sprache            TEXT NOT NULL DEFAULT 'Deutsch' CHECK (sprache IN ('Deutsch','Türkisch','Englisch')),
  wunschtermin       TEXT NOT NULL CHECK (length(trim(wunschtermin)) BETWEEN 1 AND 200),
  quelle             TEXT,
  datenschutz        BOOLEAN NOT NULL CHECK (datenschutz),
  einwilligung_thema BOOLEAN NOT NULL CHECK (einwilligung_thema),
  newsletter         BOOLEAN NOT NULL DEFAULT false,
  erstellt           TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktualisiert       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE kennenlern_anfragen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Anfrage lesen" ON kennenlern_anfragen;
CREATE POLICY "Eigene Anfrage lesen" ON kennenlern_anfragen FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Anfrage anlegen" ON kennenlern_anfragen;
CREATE POLICY "Eigene Anfrage anlegen" ON kennenlern_anfragen FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Anfrage ändern" ON kennenlern_anfragen;
CREATE POLICY "Eigene Anfrage ändern" ON kennenlern_anfragen FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins lesen Anfragen" ON kennenlern_anfragen;
CREATE POLICY "Admins lesen Anfragen" ON kennenlern_anfragen FOR SELECT USING (ist_admin());

-- ── Formular B ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kennenlern_protokolle (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  begleiterin      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gespraech_am     DATE NOT NULL,
  dauer_min        INTEGER CHECK (dauer_min IS NULL OR dauer_min BETWEEN 1 AND 240),
  kamera_an        BOOLEAN NOT NULL,
  echte_person     TEXT NOT NULL CHECK (echte_person IN ('ja','unsicher','nein')),
  als_frau         TEXT NOT NULL CHECK (als_frau IN ('ja','unsicher','nein')),
  volljaehrig      TEXT NOT NULL CHECK (volljaehrig IN ('ja','unsicher','nein')),
  krise            BOOLEAN NOT NULL DEFAULT false,
  regeln_erklaert  BOOLEAN NOT NULL,
  keine_therapie   BOOLEAN NOT NULL,
  thema            TEXT,
  notiz            TEXT CHECK (notiz IS NULL OR length(notiz) <= 500),
  empf_produkt     UUID,
  empf_coach       UUID REFERENCES coaches(id) ON DELETE SET NULL,
  empf_paket       TEXT CHECK (empf_paket IS NULL OR empf_paket IN ('Basis','Plus','Gold','offen')),
  agent_darf_notiz BOOLEAN NOT NULL DEFAULT false,
  empfehlung       TEXT NOT NULL CHECK (empfehlung IN ('freischalten','zweites_gespraech','ablehnen')),
  begruendung      TEXT,
  erstellt         TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktualisiert     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- „ablehnen“ oder ein „unsicher“ braucht eine Begründung
  CHECK (
    (empfehlung <> 'ablehnen' AND 'unsicher' NOT IN (echte_person, als_frau, volljaehrig))
    OR length(trim(COALESCE(begruendung, ''))) > 0
  )
);
ALTER TABLE kennenlern_protokolle ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins lesen Protokolle" ON kennenlern_protokolle;
CREATE POLICY "Admins lesen Protokolle" ON kennenlern_protokolle FOR SELECT USING (ist_admin());
-- Kein Lesezugriff für die Frau selbst: das Protokoll ist eine interne Prüfnotiz.

-- ── Formular C ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_verifizierung (
  coach_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 100),
  berufsbezeichnung TEXT NOT NULL CHECK (length(trim(berufsbezeichnung)) BETWEEN 2 AND 100),
  rolle             TEXT NOT NULL CHECK (rolle IN ('Coachin','Expertin','Mentorin')),
  hauptthema        TEXT NOT NULL,
  weitere_themen    TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(weitere_themen) <= 2),
  sprachen          TEXT[] NOT NULL DEFAULT '{Deutsch}',
  kurzprofil        TEXT NOT NULL CHECK (length(kurzprofil) BETWEEN 20 AND 600),
  website           TEXT,
  ausbildungen      TEXT NOT NULL CHECK (length(trim(ausbildungen)) >= 5),
  erfahrung_jahre   INTEGER NOT NULL CHECK (erfahrung_jahre BETWEEN 0 AND 60),
  heilerlaubnis     BOOLEAN NOT NULL,
  bestaetigungen    JSONB NOT NULL DEFAULT '{}'::jsonb,   -- heilprg, gewerbe, rechte, richtlinien, datenschutz
  status            TEXT NOT NULL DEFAULT 'eingereicht'
                    CHECK (status IN ('eingereicht','verifiziert','nachreichung','abgelehnt')),
  pruefung          JSONB,                                -- C18–C21
  admin_kommentar   TEXT,
  geprueft_von      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  geprueft_am       TIMESTAMPTZ,
  erstellt          TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktualisiert      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE coach_verifizierung ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Verifizierung lesen" ON coach_verifizierung;
CREATE POLICY "Eigene Verifizierung lesen" ON coach_verifizierung FOR SELECT USING (auth.uid() = coach_id OR ist_admin());
-- Anlegen/Ändern über coach_verifizierung_einreichen() — dort wird der Status sauber zurückgesetzt.

CREATE OR REPLACE FUNCTION coach_verifizierung_einreichen(p JSONB)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  alt TEXT;
  b JSONB := COALESCE(p->'bestaetigungen', '{}'::jsonb);
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  IF NOT EXISTS (SELECT 1 FROM coaches WHERE id = uid AND ist_coach) THEN
    RAISE EXCEPTION 'nur für Coachinnen mit Coach-Code';
  END IF;
  IF NOT (COALESCE((b->>'heilprg')::boolean, false) AND COALESCE((b->>'gewerbe')::boolean, false)
      AND COALESCE((b->>'rechte')::boolean, false) AND COALESCE((b->>'richtlinien')::boolean, false)
      AND COALESCE((b->>'datenschutz')::boolean, false)) THEN
    RAISE EXCEPTION 'Bitte alle Bestätigungen ankreuzen';
  END IF;
  SELECT status INTO alt FROM coach_verifizierung WHERE coach_id = uid;
  IF alt = 'verifiziert' THEN RAISE EXCEPTION 'Du bist schon verifiziert — Änderungen bitte über das Team'; END IF;

  INSERT INTO coach_verifizierung (coach_id, name, berufsbezeichnung, rolle, hauptthema, weitere_themen, sprachen,
                                   kurzprofil, website, ausbildungen, erfahrung_jahre, heilerlaubnis, bestaetigungen,
                                   status, aktualisiert)
  VALUES (uid, p->>'name', p->>'berufsbezeichnung', p->>'rolle', p->>'hauptthema',
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'weitere_themen')), '{}'),
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'sprachen')), '{Deutsch}'),
          p->>'kurzprofil', NULLIF(trim(p->>'website'), ''), p->>'ausbildungen',
          (p->>'erfahrung_jahre')::int, COALESCE((p->>'heilerlaubnis')::boolean, false), b,
          'eingereicht', now())
  ON CONFLICT (coach_id) DO UPDATE SET
    name = EXCLUDED.name, berufsbezeichnung = EXCLUDED.berufsbezeichnung, rolle = EXCLUDED.rolle,
    hauptthema = EXCLUDED.hauptthema, weitere_themen = EXCLUDED.weitere_themen, sprachen = EXCLUDED.sprachen,
    kurzprofil = EXCLUDED.kurzprofil, website = EXCLUDED.website, ausbildungen = EXCLUDED.ausbildungen,
    erfahrung_jahre = EXCLUDED.erfahrung_jahre, heilerlaubnis = EXCLUDED.heilerlaubnis,
    bestaetigungen = EXCLUDED.bestaetigungen, status = 'eingereicht', aktualisiert = now();
  RETURN 'eingereicht';
END $$;
GRANT EXECUTE ON FUNCTION coach_verifizierung_einreichen(JSONB) TO authenticated;

-- ── Formular D + E ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gratis_produkte (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  art               TEXT NOT NULL CHECK (art IN ('videokurs','workbook','workshop')),
  titel             TEXT NOT NULL CHECK (length(trim(titel)) BETWEEN 3 AND 60),
  thema             TEXT NOT NULL,
  beschreibung      TEXT NOT NULL CHECK (length(beschreibung) BETWEEN 20 AND 400),
  umfang            TEXT NOT NULL,                       -- „5 Lektionen · 45 Min“ / „16 Seiten“ / „60 Min, 3 Termine“
  inhalte           TEXT NOT NULL,                       -- Links (Video nicht gelistet, PDF, Zoom-Termine) — nie eingebettet
  methode           TEXT NOT NULL,
  vorschaubild_url  TEXT,
  naechster_schritt TEXT,
  verfuegbar_bis    DATE,                                -- NULL = unbefristet
  bestaetigungen    JSONB NOT NULL DEFAULT '{}'::jsonb,   -- keine_therapie, krisenhinweis, erlaubnis, rechte
  status            TEXT NOT NULL DEFAULT 'eingereicht'
                    CHECK (status IN ('eingereicht','freigegeben','ueberarbeiten','abgelehnt')),
  pruefung          JSONB,                                -- Formular E: Häkchen der Checkliste
  admin_kommentar   TEXT,
  geprueft_von      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  geprueft_am       TIMESTAMPTZ,
  erstellt          TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktualisiert      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Genau EIN aktives Gratis-Produkt pro Coachin
CREATE UNIQUE INDEX IF NOT EXISTS gratis_produkte_eins_pro_coach
  ON gratis_produkte (coach_id) WHERE status <> 'abgelehnt';
ALTER TABLE gratis_produkte ENABLE ROW LEVEL SECURITY;
-- Direkt lesen nur die eigene Coachin und Admins. Mitglieder sehen die Liste über
-- gratis_angebote() (ohne Links) und die Inhalte erst nach dem Einlösen (mein_gratis_produkt()).
DROP POLICY IF EXISTS "Freigegebene Produkte sehen" ON gratis_produkte;
DROP POLICY IF EXISTS "Eigenes Produkt sehen" ON gratis_produkte;
CREATE POLICY "Eigenes Produkt sehen" ON gratis_produkte FOR SELECT
  USING (auth.uid() = coach_id OR ist_admin());

CREATE OR REPLACE FUNCTION gratis_produkt_einreichen(p JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  b JSONB := COALESCE(p->'bestaetigungen', '{}'::jsonb);
  vorhanden gratis_produkte;
  neu UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  IF NOT EXISTS (SELECT 1 FROM coach_verifizierung WHERE coach_id = uid AND status = 'verifiziert') THEN
    RAISE EXCEPTION 'Erst nach der Verifizierung (Formular C) möglich';
  END IF;
  IF NOT (COALESCE((b->>'keine_therapie')::boolean, false) AND COALESCE((b->>'krisenhinweis')::boolean, false)
      AND COALESCE((b->>'erlaubnis')::boolean, false) AND COALESCE((b->>'rechte')::boolean, false)) THEN
    RAISE EXCEPTION 'Bitte alle Bestätigungen ankreuzen';
  END IF;
  SELECT * INTO vorhanden FROM gratis_produkte WHERE coach_id = uid AND status <> 'abgelehnt';
  IF FOUND AND vorhanden.status = 'freigegeben' THEN
    RAISE EXCEPTION 'Dein Gratis-Produkt ist schon freigegeben — Änderungen bitte über das Team';
  END IF;

  IF FOUND THEN
    UPDATE gratis_produkte SET
      art = p->>'art', titel = p->>'titel', thema = p->>'thema', beschreibung = p->>'beschreibung',
      umfang = p->>'umfang', inhalte = p->>'inhalte', methode = p->>'methode',
      vorschaubild_url = NULLIF(trim(p->>'vorschaubild_url'), ''), naechster_schritt = NULLIF(trim(p->>'naechster_schritt'), ''),
      verfuegbar_bis = NULLIF(p->>'verfuegbar_bis', '')::date, bestaetigungen = b,
      status = 'eingereicht', aktualisiert = now()
     WHERE id = vorhanden.id;
    RETURN vorhanden.id;
  END IF;

  INSERT INTO gratis_produkte (coach_id, art, titel, thema, beschreibung, umfang, inhalte, methode,
                               vorschaubild_url, naechster_schritt, verfuegbar_bis, bestaetigungen)
  VALUES (uid, p->>'art', p->>'titel', p->>'thema', p->>'beschreibung', p->>'umfang', p->>'inhalte', p->>'methode',
          NULLIF(trim(p->>'vorschaubild_url'), ''), NULLIF(trim(p->>'naechster_schritt'), ''),
          NULLIF(p->>'verfuegbar_bis', '')::date, b)
  RETURNING id INTO neu;
  RETURN neu;
END $$;
GRANT EXECUTE ON FUNCTION gratis_produkt_einreichen(JSONB) TO authenticated;

-- ── Einlösen: jede freigeschaltete Frau genau EIN Gratis-Produkt ────────────
CREATE TABLE IF NOT EXISTS gratis_einloesungen (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  produkt_id    UUID NOT NULL REFERENCES gratis_produkte(id) ON DELETE RESTRICT,
  eingeloest_am TIMESTAMPTZ NOT NULL DEFAULT now(),
  feedback      JSONB                                    -- Formular A2 nach 14 Tagen
);
ALTER TABLE gratis_einloesungen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Einlösung lesen" ON gratis_einloesungen;
CREATE POLICY "Eigene Einlösung lesen" ON gratis_einloesungen FOR SELECT
  USING (auth.uid() = user_id OR ist_admin()
         OR EXISTS (SELECT 1 FROM gratis_produkte g WHERE g.id = produkt_id AND g.coach_id = auth.uid()));

CREATE OR REPLACE FUNCTION gratis_produkt_einloesen(p_produkt UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  g gratis_produkte;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet'; END IF;
  IF NOT COALESCE((mein_konto_status()->>'freigeschaltet')::boolean, false) THEN
    RAISE EXCEPTION 'Erst nach dem Kennenlerngespräch möglich';
  END IF;
  IF EXISTS (SELECT 1 FROM gratis_einloesungen WHERE user_id = uid) THEN
    RAISE EXCEPTION 'Du hast dein Gratis-Angebot schon gewählt';
  END IF;
  SELECT * INTO g FROM gratis_produkte
   WHERE id = p_produkt AND status = 'freigegeben' AND (verfuegbar_bis IS NULL OR verfuegbar_bis >= current_date);
  IF NOT FOUND THEN RAISE EXCEPTION 'Dieses Angebot ist nicht verfügbar'; END IF;
  INSERT INTO gratis_einloesungen (user_id, produkt_id) VALUES (uid, g.id);
  RETURN jsonb_build_object('id', g.id, 'titel', g.titel, 'art', g.art, 'inhalte', g.inhalte, 'umfang', g.umfang);
END $$;
GRANT EXECUTE ON FUNCTION gratis_produkt_einloesen(UUID) TO authenticated;

-- Meine Einlösung inkl. Inhalte (die Links sieht nur, wer eingelöst hat)
CREATE OR REPLACE FUNCTION mein_gratis_produkt()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r JSONB;
BEGIN
  SELECT jsonb_build_object('id', g.id, 'titel', g.titel, 'art', g.art, 'thema', g.thema, 'umfang', g.umfang,
                            'beschreibung', g.beschreibung, 'inhalte', g.inhalte, 'naechster_schritt', g.naechster_schritt,
                            'eingeloest_am', e.eingeloest_am, 'feedback', e.feedback,
                            'coach', (SELECT v.name FROM coach_verifizierung v WHERE v.coach_id = g.coach_id))
    INTO r
    FROM gratis_einloesungen e JOIN gratis_produkte g ON g.id = e.produkt_id
   WHERE e.user_id = auth.uid();
  RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION mein_gratis_produkt() TO authenticated;

-- Liste für die Auswahl: ohne Inhalts-Links (die gibt es erst nach dem Einlösen)
CREATE OR REPLACE FUNCTION gratis_angebote()
RETURNS TABLE (id UUID, art TEXT, titel TEXT, thema TEXT, beschreibung TEXT, umfang TEXT, methode TEXT,
               vorschaubild_url TEXT, coach TEXT, coach_beruf TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.art, g.titel, g.thema, g.beschreibung, g.umfang, g.methode, g.vorschaubild_url,
         v.name, v.berufsbezeichnung
    FROM gratis_produkte g
    LEFT JOIN coach_verifizierung v ON v.coach_id = g.coach_id
   WHERE auth.uid() IS NOT NULL AND g.status = 'freigegeben'
     AND (g.verfuegbar_bis IS NULL OR g.verfuegbar_bis >= current_date)
   ORDER BY g.thema, g.titel;
$$;
GRANT EXECUTE ON FUNCTION gratis_angebote() TO authenticated;

CREATE OR REPLACE FUNCTION gratis_feedback(p JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE gratis_einloesungen SET feedback = p || jsonb_build_object('am', now()) WHERE user_id = auth.uid();
END $$;
GRANT EXECUTE ON FUNCTION gratis_feedback(JSONB) TO authenticated;

-- ── Admin: Formular A + B einer Nutzerin ────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_kennenlernen(p_user UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN jsonb_build_object(
    'anfrage',   (SELECT to_jsonb(a) - 'user_id' FROM kennenlern_anfragen a WHERE a.user_id = p_user),
    'protokoll', (SELECT to_jsonb(k) - 'user_id' || jsonb_build_object('begleiterin_email', bu.email)
                    FROM kennenlern_protokolle k LEFT JOIN auth.users bu ON bu.id = k.begleiterin
                   WHERE k.user_id = p_user),
    'gratis',    (SELECT jsonb_build_object('titel', g.titel, 'eingeloest_am', e.eingeloest_am, 'feedback', e.feedback)
                    FROM gratis_einloesungen e JOIN gratis_produkte g ON g.id = e.produkt_id WHERE e.user_id = p_user)
  );
END $$;
GRANT EXECUTE ON FUNCTION admin_kennenlernen(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION admin_kennenlern_protokoll(p_user UUID, p JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  INSERT INTO kennenlern_protokolle (user_id, begleiterin, gespraech_am, dauer_min, kamera_an, echte_person, als_frau,
                                     volljaehrig, krise, regeln_erklaert, keine_therapie, thema, notiz, empf_produkt,
                                     empf_paket, agent_darf_notiz, empfehlung, begruendung, aktualisiert)
  VALUES (p_user, auth.uid(), COALESCE(NULLIF(p->>'gespraech_am', '')::date, current_date), NULLIF(p->>'dauer_min', '')::int,
          COALESCE((p->>'kamera_an')::boolean, false), p->>'echte_person', p->>'als_frau', p->>'volljaehrig',
          COALESCE((p->>'krise')::boolean, false), COALESCE((p->>'regeln_erklaert')::boolean, false),
          COALESCE((p->>'keine_therapie')::boolean, false), NULLIF(p->>'thema', ''), NULLIF(trim(p->>'notiz'), ''),
          NULLIF(p->>'empf_produkt', '')::uuid, NULLIF(p->>'empf_paket', ''),
          COALESCE((p->>'agent_darf_notiz')::boolean, false), p->>'empfehlung', NULLIF(trim(p->>'begruendung'), ''), now())
  ON CONFLICT (user_id) DO UPDATE SET
    begleiterin = auth.uid(), gespraech_am = EXCLUDED.gespraech_am, dauer_min = EXCLUDED.dauer_min,
    kamera_an = EXCLUDED.kamera_an, echte_person = EXCLUDED.echte_person, als_frau = EXCLUDED.als_frau,
    volljaehrig = EXCLUDED.volljaehrig, krise = EXCLUDED.krise, regeln_erklaert = EXCLUDED.regeln_erklaert,
    keine_therapie = EXCLUDED.keine_therapie, thema = EXCLUDED.thema, notiz = EXCLUDED.notiz,
    empf_produkt = EXCLUDED.empf_produkt, empf_paket = EXCLUDED.empf_paket,
    agent_darf_notiz = EXCLUDED.agent_darf_notiz, empfehlung = EXCLUDED.empfehlung,
    begruendung = EXCLUDED.begruendung, aktualisiert = now();
  INSERT INTO admin_protokoll (admin_id, user_id, aktion, details)
    VALUES (auth.uid(), p_user, 'kennenlern_protokoll', jsonb_build_object('empfehlung', p->>'empfehlung'));
END $$;
GRANT EXECUTE ON FUNCTION admin_kennenlern_protokoll(UUID, JSONB) TO authenticated;

-- ── Admin: Coach-Verifizierungen (Formular C, Teil 3) ───────────────────────
CREATE OR REPLACE FUNCTION admin_coach_verifizierungen()
RETURNS SETOF JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT to_jsonb(v) || jsonb_build_object('email', u.email, 'geprueft_von_email', gu.email)
      FROM coach_verifizierung v
      JOIN auth.users u ON u.id = v.coach_id
      LEFT JOIN auth.users gu ON gu.id = v.geprueft_von
     ORDER BY (v.status = 'eingereicht') DESC, v.aktualisiert DESC;
END $$;
GRANT EXECUTE ON FUNCTION admin_coach_verifizierungen() TO authenticated;

CREATE OR REPLACE FUNCTION admin_coach_verifizieren(p_coach UUID, p_status TEXT, p_pruefung JSONB, p_kommentar TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  IF p_status NOT IN ('verifiziert','nachreichung','abgelehnt') THEN RAISE EXCEPTION 'ungültiger Status'; END IF;
  IF p_status <> 'verifiziert' AND length(trim(COALESCE(p_kommentar, ''))) = 0 THEN
    RAISE EXCEPTION 'Bitte kurz begründen, was fehlt';
  END IF;
  UPDATE coach_verifizierung
     SET status = p_status, pruefung = p_pruefung, admin_kommentar = NULLIF(trim(p_kommentar), ''),
         geprueft_von = auth.uid(), geprueft_am = now(), aktualisiert = now()
   WHERE coach_id = p_coach;
  IF NOT FOUND THEN RAISE EXCEPTION 'keine Einreichung gefunden'; END IF;
  INSERT INTO admin_protokoll (admin_id, user_id, aktion, details)
    VALUES (auth.uid(), p_coach, 'coach_verifizierung', jsonb_build_object('status', p_status));
  INSERT INTO team_nachrichten (user_id, absender, text)
    VALUES (p_coach, 'team', CASE p_status
      WHEN 'verifiziert' THEN 'Du bist jetzt als geprüfte Expertin verifiziert 🤍 Du kannst dein Gratis-Angebot einreichen.'
      WHEN 'nachreichung' THEN 'Zu deiner Verifizierung fehlt noch etwas: ' || p_kommentar
      ELSE 'Deine Verifizierung konnten wir leider nicht bestätigen: ' || p_kommentar END);
END $$;
GRANT EXECUTE ON FUNCTION admin_coach_verifizieren(UUID, TEXT, JSONB, TEXT) TO authenticated;

-- ── Admin: Gratis-Produkte prüfen (Formular E) ──────────────────────────────
CREATE OR REPLACE FUNCTION admin_gratis_produkte()
RETURNS SETOF JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT to_jsonb(g) || jsonb_build_object(
             'email', u.email,
             'coach', v.name,
             'coach_status', COALESCE(v.status, 'fehlt'),
             'coach_hauptthema', v.hauptthema,
             'einloesungen', (SELECT count(*) FROM gratis_einloesungen e WHERE e.produkt_id = g.id))
      FROM gratis_produkte g
      JOIN auth.users u ON u.id = g.coach_id
      LEFT JOIN coach_verifizierung v ON v.coach_id = g.coach_id
     ORDER BY (g.status = 'eingereicht') DESC, g.aktualisiert DESC;
END $$;
GRANT EXECUTE ON FUNCTION admin_gratis_produkte() TO authenticated;

CREATE OR REPLACE FUNCTION admin_gratis_pruefen(p_id UUID, p_status TEXT, p_pruefung JSONB, p_kommentar TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g gratis_produkte;
  alle_haken BOOLEAN;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  IF p_status NOT IN ('freigegeben','ueberarbeiten','abgelehnt') THEN RAISE EXCEPTION 'ungültiger Status'; END IF;
  SELECT * INTO g FROM gratis_produkte WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produkt nicht gefunden'; END IF;
  -- Freigabe nur, wenn jeder Punkt der Checkliste abgehakt ist
  SELECT COALESCE(bool_and(value::text = 'true'), false) AND count(*) >= 10
    INTO alle_haken FROM jsonb_each(COALESCE(p_pruefung, '{}'::jsonb));
  IF p_status = 'freigegeben' AND NOT alle_haken THEN
    RAISE EXCEPTION 'Freigabe nur, wenn alle 10 Punkte erfüllt sind';
  END IF;
  IF p_status <> 'freigegeben' AND length(trim(COALESCE(p_kommentar, ''))) = 0 THEN
    RAISE EXCEPTION 'Bitte schreib der Coachin, was sie ändern soll';
  END IF;
  UPDATE gratis_produkte
     SET status = p_status, pruefung = p_pruefung, admin_kommentar = NULLIF(trim(p_kommentar), ''),
         geprueft_von = auth.uid(), geprueft_am = now(), aktualisiert = now()
   WHERE id = p_id;
  INSERT INTO admin_protokoll (admin_id, user_id, aktion, details)
    VALUES (auth.uid(), g.coach_id, 'gratis_pruefung', jsonb_build_object('produkt', g.titel, 'status', p_status));
  INSERT INTO team_nachrichten (user_id, absender, text)
    VALUES (g.coach_id, 'team', CASE p_status
      WHEN 'freigegeben' THEN 'Dein Gratis-Angebot „' || g.titel || '“ ist freigegeben und für neue Frauen sichtbar 🤍'
      WHEN 'ueberarbeiten' THEN 'Zu deinem Gratis-Angebot „' || g.titel || '“: ' || p_kommentar
      ELSE 'Dein Gratis-Angebot „' || g.titel || '“ wurde leider abgelehnt: ' || p_kommentar END);
END $$;
GRANT EXECUTE ON FUNCTION admin_gratis_pruefen(UUID, TEXT, JSONB, TEXT) TO authenticated;
