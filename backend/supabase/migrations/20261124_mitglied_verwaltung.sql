-- ─────────────────────────────────────────────────────────────
-- smile2go · Mitglied-Verwaltung für s2g.admin
--   mitglied_status   Freischaltung (nach dem Kennenlerngespräch), Sperre, Admin-Notiz
--   admin_protokoll   wer hat wann was an welchem Konto geändert (DSGVO-Nachweis)
-- Regeln:
--   · Konten, die es vor dieser Migration gab, gelten als freigeschaltet.
--   · Neue Konten warten, bis eine Admin sie freischaltet. Coachinnen
--     (Coach-Code) und Admins sind immer freigeschaltet.
--   · Sperren läuft über die Edge Function „admin-sperren“ (Supabase-Bann
--     braucht den Service-Key); die Spalte gesperrt sorgt dafür, dass eine
--     schon angemeldete Nutzerin sofort aus der App fällt.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mitglied_status (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  freigeschaltet     BOOLEAN NOT NULL DEFAULT false,
  freigeschaltet_am  TIMESTAMPTZ,
  freigeschaltet_von UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gesperrt           BOOLEAN NOT NULL DEFAULT false,
  gesperrt_am        TIMESTAMPTZ,
  gesperrt_grund     TEXT,
  admin_notiz        TEXT,
  aktualisiert       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE mitglied_status ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mitglied_status' AND policyname = 'Eigenen Status lesen') THEN
    CREATE POLICY "Eigenen Status lesen" ON mitglied_status FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
-- Schreiben nur über die SECURITY-DEFINER-Funktionen unten bzw. den Service-Key.

-- Bestand: alle heutigen Konten sind freigeschaltet
INSERT INTO mitglied_status (user_id, freigeschaltet, freigeschaltet_am)
  SELECT id, true, now() FROM auth.users
  ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_protokoll (
  id        BIGSERIAL PRIMARY KEY,
  zeit      TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aktion    TEXT NOT NULL,
  details   JSONB
);
ALTER TABLE admin_protokoll ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_protokoll' AND policyname = 'Admins lesen Protokoll') THEN
    CREATE POLICY "Admins lesen Protokoll" ON admin_protokoll FOR SELECT USING (ist_admin());
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS admin_protokoll_user ON admin_protokoll (user_id, zeit DESC);

-- ── Für die App: darf ich rein? ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mein_konto_status()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  s mitglied_status;
  coach BOOLEAN;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO s FROM mitglied_status WHERE user_id = uid;
  coach := EXISTS (SELECT 1 FROM coaches WHERE id = uid AND ist_coach);
  RETURN jsonb_build_object(
    'gesperrt',       COALESCE(s.gesperrt, false),
    'freigeschaltet', COALESCE(s.freigeschaltet, false) OR coach OR ist_admin()
  );
END $$;
GRANT EXECUTE ON FUNCTION mein_konto_status() TO authenticated;

-- ── Mitgliederliste: Status und Name dazu ───────────────────────────────────
-- Neuer Name statt DROP der alten Funktion: die alte bleibt für ältere App-Stände.
CREATE OR REPLACE FUNCTION admin_mitglieder_v2(p_suche TEXT DEFAULT '', p_limit INTEGER DEFAULT 50)
RETURNS TABLE (id UUID, email TEXT, seit TIMESTAMPTZ, letzter_login TIMESTAMPTZ, ist_coach BOOLEAN, hat_coach BOOLEAN,
               punkte NUMERIC, name TEXT, freigeschaltet BOOLEAN, gesperrt BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at,
           EXISTS (SELECT 1 FROM coaches c WHERE c.id = u.id AND c.ist_coach),
           EXISTS (SELECT 1 FROM klientinnen k WHERE k.user_id = u.id AND k.status IN ('aktiv','pausiert')),
           CASE WHEN jsonb_typeof(s.state->'punkte') = 'number' THEN (s.state->>'punkte')::numeric END,
           NULLIF(COALESCE(NULLIF(trim(s.state->>'alias'), ''), u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), '')::text,
           COALESCE(m.freigeschaltet, false) OR EXISTS (SELECT 1 FROM coaches c WHERE c.id = u.id AND c.ist_coach)
             OR EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id),
           COALESCE(m.gesperrt, false)
      FROM auth.users u
      LEFT JOIN app_state s ON s.user_id = u.id
      LEFT JOIN mitglied_status m ON m.user_id = u.id
     WHERE p_suche = '' OR u.email ILIKE '%' || p_suche || '%'
        OR s.state->>'alias' ILIKE '%' || p_suche || '%'
        OR u.raw_user_meta_data->>'full_name' ILIKE '%' || p_suche || '%'
     ORDER BY u.created_at DESC
     LIMIT least(greatest(p_limit, 1), 500);
END $$;
GRANT EXECUTE ON FUNCTION admin_mitglieder_v2(TEXT, INTEGER) TO authenticated;

-- ── Profil einer Nutzerin ───────────────────────────────────────────────────
-- Bewusst keine Inhalte (Journal, Chats mit ilho oder der Coachin) — nur
-- Konto, Rollen, Zähler und was sie selbst ans Team geschrieben hat.
CREATE OR REPLACE FUNCTION admin_mitglied_detail(p_user UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  u auth.users;
  st JSONB;
  m mitglied_status;
  coach_email TEXT;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  SELECT * INTO u FROM auth.users WHERE id = p_user;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT state INTO st FROM app_state WHERE user_id = p_user;
  SELECT * INTO m FROM mitglied_status WHERE user_id = p_user;
  SELECT cu.email INTO coach_email
    FROM klientinnen k JOIN auth.users cu ON cu.id = k.coach_id
   WHERE k.user_id = p_user AND k.status IN ('aktiv','pausiert') LIMIT 1;

  RETURN jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'name', NULLIF(COALESCE(NULLIF(trim(st->>'alias'), ''), u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), ''),
    'anmeldung_mit', COALESCE(u.raw_app_meta_data->>'provider', 'email'),
    'email_bestaetigt', u.email_confirmed_at IS NOT NULL,
    'seit', u.created_at,
    'letzter_login', u.last_sign_in_at,
    'gebannt_bis', u.banned_until,
    'zwei_faktor', EXISTS (SELECT 1 FROM auth.mfa_factors f WHERE f.user_id = u.id AND f.status = 'verified'),
    'ist_admin', EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id),
    'ist_coach', EXISTS (SELECT 1 FROM coaches c WHERE c.id = u.id AND c.ist_coach),
    'coach_code', (SELECT c.coach_code FROM coaches c WHERE c.id = u.id),
    'klientinnen', (SELECT count(*) FROM klientinnen k WHERE k.coach_id = u.id AND k.status IN ('aktiv','pausiert')),
    'begleitet_von', coach_email,
    'punkte', CASE WHEN jsonb_typeof(st->'punkte') = 'number' THEN (st->>'punkte')::numeric END,
    'freigeschaltet', COALESCE(m.freigeschaltet, false),
    'freigeschaltet_am', m.freigeschaltet_am,
    'gesperrt', COALESCE(m.gesperrt, false),
    'gesperrt_am', m.gesperrt_am,
    'gesperrt_grund', m.gesperrt_grund,
    'admin_notiz', m.admin_notiz,
    'termine_kommend', (SELECT count(*) FROM termine t LEFT JOIN klientinnen k ON k.id = t.klientin_id
                         WHERE (k.user_id = u.id OR t.coach_id = u.id) AND t.beginn > now() AND t.status = 'gebucht'),
    'team_nachrichten', (SELECT count(*) FROM team_nachrichten n WHERE n.user_id = u.id),
    'community_beitraege', (SELECT count(*) FROM community_posts cp WHERE cp.user_id = u.id),
    'meldungen_gegen', (SELECT count(*) FROM community_meldungen cm JOIN community_posts cp ON cp.id = cm.post_id WHERE cp.user_id = u.id),
    'protokoll', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('zeit', p.zeit, 'aktion', p.aktion, 'details', p.details, 'admin', au.email) ORDER BY p.zeit DESC)
        FROM (SELECT * FROM admin_protokoll WHERE user_id = u.id ORDER BY zeit DESC LIMIT 30) p
        LEFT JOIN auth.users au ON au.id = p.admin_id), '[]'::jsonb)
  );
END $$;
GRANT EXECUTE ON FUNCTION admin_mitglied_detail(UUID) TO authenticated;

-- ── Freischalten / zurücknehmen ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_mitglied_freischalten(p_user UUID, p_an BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  INSERT INTO mitglied_status (user_id, freigeschaltet, freigeschaltet_am, freigeschaltet_von, aktualisiert)
    VALUES (p_user, p_an, CASE WHEN p_an THEN now() END, auth.uid(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET freigeschaltet = p_an,
          freigeschaltet_am = CASE WHEN p_an THEN now() ELSE mitglied_status.freigeschaltet_am END,
          freigeschaltet_von = auth.uid(), aktualisiert = now();
  INSERT INTO admin_protokoll (admin_id, user_id, aktion)
    VALUES (auth.uid(), p_user, CASE WHEN p_an THEN 'freigeschaltet' ELSE 'freischaltung_zurueck' END);
  -- Begrüßung im Team-Kanal, damit sie es in der App sieht
  IF p_an THEN
    INSERT INTO team_nachrichten (user_id, absender, text)
      VALUES (p_user, 'team', 'Willkommen bei smile2go 🤍 Dein Zugang ist jetzt freigeschaltet — schön, dass du da bist.');
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION admin_mitglied_freischalten(UUID, BOOLEAN) TO authenticated;

-- ── Admin-Notiz ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_mitglied_notiz(p_user UUID, p_text TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  INSERT INTO mitglied_status (user_id, admin_notiz, aktualisiert) VALUES (p_user, NULLIF(trim(p_text), ''), now())
    ON CONFLICT (user_id) DO UPDATE SET admin_notiz = NULLIF(trim(p_text), ''), aktualisiert = now();
  INSERT INTO admin_protokoll (admin_id, user_id, aktion) VALUES (auth.uid(), p_user, 'notiz');
END $$;
GRANT EXECUTE ON FUNCTION admin_mitglied_notiz(UUID, TEXT) TO authenticated;

-- ── Coach-Rolle ohne Code vergeben / entziehen ──────────────────────────────
-- Entziehen setzt nur ist_coach = false: Klientinnen-Bindungen und Inhalte bleiben erhalten.
CREATE OR REPLACE FUNCTION admin_coach_rolle(p_user UUID, p_an BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  PERFORM set_config('s2g.coach_freischaltung', 'ja', true);
  IF p_an THEN
    INSERT INTO coaches (id, ist_coach, coach_code) VALUES (p_user, true, 'ADMIN')
      ON CONFLICT (id) DO UPDATE SET ist_coach = true;
  ELSE
    UPDATE coaches SET ist_coach = false WHERE id = p_user;
  END IF;
  PERFORM set_config('s2g.coach_freischaltung', '', true);
  INSERT INTO admin_protokoll (admin_id, user_id, aktion)
    VALUES (auth.uid(), p_user, CASE WHEN p_an THEN 'coach_rolle_an' ELSE 'coach_rolle_aus' END);
END $$;
GRANT EXECUTE ON FUNCTION admin_coach_rolle(UUID, BOOLEAN) TO authenticated;

-- ── Offene Freischaltungen für die Übersicht ────────────────────────────────
CREATE OR REPLACE FUNCTION admin_wartende_anzahl()
RETURNS INTEGER LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN (SELECT count(*) FROM auth.users u
            LEFT JOIN mitglied_status m ON m.user_id = u.id
           WHERE NOT COALESCE(m.freigeschaltet, false)
             AND NOT COALESCE(m.gesperrt, false)
             AND NOT EXISTS (SELECT 1 FROM coaches c WHERE c.id = u.id AND c.ist_coach)
             AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.user_id = u.id));
END $$;
GRANT EXECUTE ON FUNCTION admin_wartende_anzahl() TO authenticated;
