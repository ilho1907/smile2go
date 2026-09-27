-- ---------------------------------------------------------------------------
-- smile2go · Admin-Dashboard mit echten Daten (27.09.2026)
-- Alles läuft über SECURITY-DEFINER-Funktionen, die zuerst ist_admin() prüfen.
-- Datenschutz: keine Nachrichten-, Journal- oder Anfrage-TEXTE — nur Zähler.
-- Einzige Ausnahme: gemeldete Community-Posts (dafür ist Moderation da).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION admin_kennzahlen()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE r JSONB;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  SELECT jsonb_build_object(
    'mitglieder',        (SELECT count(*) FROM auth.users),
    'neu_30',            (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '30 days'),
    'coaches',           (SELECT count(*) FROM coaches),
    'bindungen_aktiv',   (SELECT count(*) FROM klientinnen WHERE status = 'aktiv'),
    'aktiv_1',           (SELECT count(DISTINCT user_hash) FROM app_events WHERE created_at > now() - interval '1 day'),
    'aktiv_7',           (SELECT count(DISTINCT user_hash) FROM app_events WHERE created_at > now() - interval '7 days'),
    'login_7',           (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '7 days'),
    'nachrichten_offen', (SELECT count(*) FROM nachrichten WHERE absender = 'klientin' AND gelesen_am IS NULL),
    'anfragen_offen',    (SELECT count(*) FROM anfragen WHERE status = 'offen'),
    'sessions_7',        (SELECT count(*) FROM termine WHERE status = 'gebucht' AND beginn BETWEEN now() AND now() + interval '7 days'),
    'sessions_storniert_30', (SELECT count(*) FROM termine WHERE status = 'storniert' AND beginn > now() - interval '30 days'),
    'ki_heute',          (SELECT coalesce(sum(anzahl), 0) FROM ki_nutzung WHERE tag = CURRENT_DATE),
    'ki_30',             (SELECT coalesce(sum(anzahl), 0) FROM ki_nutzung WHERE tag > CURRENT_DATE - 30),
    'punkte_summe',      (SELECT coalesce(sum((state->>'punkte')::numeric), 0) FROM app_state WHERE jsonb_typeof(state->'punkte') = 'number'),
    'punkte_schnitt',    (SELECT coalesce(round(avg((state->>'punkte')::numeric)), 0) FROM app_state WHERE jsonb_typeof(state->'punkte') = 'number'),
    'push_geraete',      (SELECT count(*) FROM push_abos),
    'meldungen_offen',   (SELECT count(*) FROM community_meldungen WHERE NOT erledigt),
    'interessentinnen_30', (SELECT count(*) FROM interessentinnen WHERE created_at > now() - interval '30 days')
  ) INTO r;
  RETURN r;
END $$;

-- Neue Mitglieder pro Monat (letzte 12 Monate).
CREATE OR REPLACE FUNCTION admin_wachstum()
RETURNS TABLE (monat DATE, neu BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT date_trunc('month', u.created_at)::date, count(*)
      FROM auth.users u
     WHERE u.created_at > now() - interval '12 months'
     GROUP BY 1 ORDER BY 1;
END $$;

CREATE OR REPLACE FUNCTION admin_mitglieder(p_suche TEXT DEFAULT '', p_limit INTEGER DEFAULT 50)
RETURNS TABLE (id UUID, email TEXT, seit TIMESTAMPTZ, letzter_login TIMESTAMPTZ, ist_coach BOOLEAN, hat_coach BOOLEAN, punkte NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at,
           EXISTS (SELECT 1 FROM coaches c WHERE c.id = u.id),
           EXISTS (SELECT 1 FROM klientinnen k WHERE k.user_id = u.id AND k.status IN ('aktiv','pausiert')),
           CASE WHEN jsonb_typeof(s.state->'punkte') = 'number' THEN (s.state->>'punkte')::numeric END
      FROM auth.users u
      LEFT JOIN app_state s ON s.user_id = u.id
     WHERE p_suche = '' OR u.email ILIKE '%' || p_suche || '%'
     ORDER BY u.created_at DESC
     LIMIT least(greatest(p_limit, 1), 500);
END $$;

-- Kommende Sessions plattformweit (nur Metadaten).
CREATE OR REPLACE FUNCTION admin_sessions()
RETURNS TABLE (beginn TIMESTAMPTZ, dauer_min INTEGER, kanal TEXT, status TEXT, coach TEXT, klientin TEXT, hat_videolink BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT t.beginn, t.dauer_min, t.kanal, t.status, c.name, k.anzeigename, t.video_url IS NOT NULL
      FROM termine t
      LEFT JOIN coaches c ON c.id = t.coach_id
      LEFT JOIN klientinnen k ON k.id = t.klientin_id
     WHERE t.beginn > now() - interval '1 day'
     ORDER BY t.beginn
     LIMIT 100;
END $$;

-- Community-Moderation: offene Meldungen mit dem gemeldeten Post.
CREATE OR REPLACE FUNCTION admin_meldungen()
RETURNS TABLE (meldung_id UUID, post_id UUID, alias TEXT, text TEXT, sichtbar BOOLEAN, grund TEXT, anzahl BIGINT, gemeldet_am TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT (array_agg(m.id ORDER BY m.created_at))[1], p.id, p.alias, p.text, p.sichtbar,
           string_agg(DISTINCT coalesce(m.grund, '—'), ' · '), count(*), max(m.created_at)
      FROM community_meldungen m
      JOIN community_posts p ON p.id = m.post_id
     WHERE NOT m.erledigt
     GROUP BY p.id, p.alias, p.text, p.sichtbar
     ORDER BY max(m.created_at) DESC;
END $$;

CREATE OR REPLACE FUNCTION admin_meldung_erledigen(p_post UUID, p_ausblenden BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  IF p_ausblenden THEN UPDATE community_posts SET sichtbar = false WHERE id = p_post; END IF;
  UPDATE community_meldungen SET erledigt = true WHERE post_id = p_post;
END $$;

-- Systemzustand: Cron-Läufe, Fehler, Fairness-Test.
CREATE OR REPLACE FUNCTION admin_system()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, cron AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN jsonb_build_object(
    'cron_letzter', (SELECT jsonb_build_object('start', d.start_time, 'status', d.status, 'meldung', left(d.return_message, 200))
                       FROM cron.job_run_details d JOIN cron.job j ON j.jobid = d.jobid
                      WHERE j.jobname = 'termin-erinnerungen' ORDER BY d.start_time DESC LIMIT 1),
    'cron_fehler_24h', (SELECT count(*) FROM cron.job_run_details d
                         WHERE d.status = 'failed' AND d.start_time > now() - interval '24 hours'),
    'cron_laeufe_24h', (SELECT count(*) FROM cron.job_run_details d WHERE d.start_time > now() - interval '24 hours'),
    'fairness_letzter', (SELECT max(lauf_am) FROM fairness_checks),
    'db_groesse_mb', (SELECT round(pg_database_size(current_database()) / 1048576.0))
  );
END $$;

DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY['admin_kennzahlen()', 'admin_wachstum()', 'admin_mitglieder(TEXT, INTEGER)', 'admin_sessions()',
                           'admin_meldungen()', 'admin_meldung_erledigen(UUID, BOOLEAN)', 'admin_system()'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
