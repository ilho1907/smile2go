-- ─────────────────────────────────────────────────────────────
-- smile2go · s2g.admin — Aktivität, Punkte-Verluste, Dateien, Auffälligkeiten
--   punkte_verlauf               protokolliert jedes SINKEN der Lichtpunkte
--                                (Reset, Gerätewechsel, Fehler) — Steigen nicht,
--                                das wäre bei jeder Übung eine Zeile
--   admin_mitglied_aktivitaet()  Zähler je Bereich, Challenge, Punkte, Dateien,
--                                Community-Beiträge, Auffälligkeiten
-- Bewusst KEINE Inhalte aus Journal, Briefen, Gesprächen mit ilho/Coachin —
-- nur Anzahl und Datum. Kein DROP: läuft ohne Rückfrage durch.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS punkte_verlauf (
  id       BIGSERIAL PRIMARY KEY,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alt      NUMERIC,
  neu      NUMERIC,
  zeit     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE punkte_verlauf ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'punkte_verlauf' AND policyname = 'Admins lesen Punkteverlauf') THEN
    CREATE POLICY "Admins lesen Punkteverlauf" ON punkte_verlauf FOR SELECT USING (ist_admin());
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS punkte_verlauf_user ON punkte_verlauf (user_id, zeit DESC);

-- Trigger darf das Speichern der App NIE verhindern → jeder Fehler wird verschluckt.
CREATE OR REPLACE FUNCTION punkte_verlust_merken()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a NUMERIC; n NUMERIC;
BEGIN
  BEGIN
    IF jsonb_typeof(OLD.state->'punkte') = 'number' THEN a := (OLD.state->>'punkte')::numeric; END IF;
    IF jsonb_typeof(NEW.state->'punkte') = 'number' THEN n := (NEW.state->>'punkte')::numeric; ELSE n := 0; END IF;
    IF a IS NOT NULL AND a > 0 AND n < a THEN
      INSERT INTO punkte_verlauf (user_id, alt, neu) VALUES (NEW.user_id, a, n);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'app_state_punkte_verlust' AND tgrelid = 'public.app_state'::regclass) THEN
    CREATE TRIGGER app_state_punkte_verlust
      AFTER UPDATE OF state ON app_state
      FOR EACH ROW EXECUTE FUNCTION punkte_verlust_merken();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION admin_mitglied_aktivitaet(p_user UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth, storage AS $$
DECLARE
  u auth.users;
  st JSONB;
  st_zeit TIMESTAMPTZ;
  st_kb NUMERIC;
  m mitglied_status;
  zaehler JSONB;
  hinweise JSONB := '[]'::jsonb;
  verluste JSONB;
  laenge INT;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  SELECT * INTO u FROM auth.users WHERE id = p_user;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT state, updated_at, round(pg_column_size(state) / 1024.0, 1) INTO st, st_zeit, st_kb FROM app_state WHERE user_id = p_user;
  SELECT * INTO m FROM mitglied_status WHERE user_id = p_user;

  -- Zähler je Bereich (nur Anzahl, nie Inhalt)
  SELECT COALESCE(jsonb_object_agg(b.label, jsonb_array_length(st->b.feld)), '{}'::jsonb) INTO zaehler
    FROM (VALUES
      ('entries','Journal-Einträge'), ('checkins','Check-ins'), ('achtsam','Achtsamkeit'), ('dank','Dankbarkeit'),
      ('qigong','Qigong'), ('reisen','Reisen'), ('ziele','Ziele'), ('aufgaben','Aufgaben'), ('metime','Me-Time'),
      ('losgelassen','Loslassen'), ('briefe','Briefe'), ('kursWahl','Kurse gewählt'), ('mm','Money-Mind'),
      ('lumaMsgs','Nachrichten an ilho'), ('coachMsgs','Nachrichten an Coachin'), ('termine','Termine (App)')
    ) AS b(feld, label)
   WHERE st IS NOT NULL AND jsonb_typeof(st->b.feld) = 'array';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('alt', alt, 'neu', neu, 'zeit', zeit) ORDER BY zeit DESC), '[]'::jsonb) INTO verluste
    FROM (SELECT * FROM punkte_verlauf WHERE user_id = p_user ORDER BY zeit DESC LIMIT 10) v;

  -- Auffälligkeiten
  IF u.email_confirmed_at IS NULL THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','warn','text','E-Mail noch nicht bestätigt — sie kann sich evtl. nicht anmelden.','aktion','bestaetigung'));
  END IF;
  IF u.last_sign_in_at IS NULL THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','warn','text','Hat sich seit der Registrierung nie angemeldet.','aktion','passwort_link'));
  ELSIF u.last_sign_in_at < now() - interval '30 days' THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','info','text','Seit über 30 Tagen nicht angemeldet.','aktion','nachricht'));
  END IF;
  IF st IS NULL AND u.last_sign_in_at IS NOT NULL THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','warn','text','Angemeldet, aber keine gespeicherten App-Daten in der Cloud — Synchronisierung prüfen.','aktion','nachricht'));
  END IF;
  IF st_zeit IS NOT NULL AND u.last_sign_in_at IS NOT NULL AND st_zeit < u.last_sign_in_at - interval '2 days' THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','info','text','App-Daten seit der letzten Anmeldung nicht mehr gespeichert — evtl. Sync-Problem auf ihrem Gerät.','aktion','nachricht'));
  END IF;
  IF jsonb_array_length(verluste) > 0 THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','warn','text',
      format('Lichtpunkte sind %s-mal gesunken (zuletzt %s → %s).', jsonb_array_length(verluste), verluste->0->>'alt', verluste->0->>'neu'), 'aktion','nachricht'));
  END IF;
  IF st_kb IS NOT NULL AND st_kb > 2048 THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','info','text', format('Sehr große App-Daten (%s KB) — Speichern kann langsam werden.', st_kb)));
  END IF;
  IF (SELECT count(*) FROM community_meldungen cm JOIN community_posts cp ON cp.id = cm.post_id WHERE cp.user_id = p_user AND NOT cm.erledigt) > 0 THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','warn','text','Offene Community-Meldungen gegen ihre Beiträge.','aktion','moderation'));
  END IF;
  IF EXISTS (SELECT 1 FROM auth.mfa_factors f WHERE f.user_id = p_user AND f.status = 'unverified') THEN
    hinweise := hinweise || jsonb_build_array(jsonb_build_object('stufe','info','text','Zwei-Faktor angefangen, aber nicht abgeschlossen.','aktion','zwei_faktor_reset'));
  END IF;

  RETURN jsonb_build_object(
    'bereiche', zaehler,
    'challenge369', CASE WHEN jsonb_typeof(st->'ch369') = 'object' THEN jsonb_build_object(
        'tag', st->'ch369'->'tag', 'fertig', st->'ch369'->'fertig', 'letzter_tag', st->'ch369'->'letzterTag') END,
    'punkte', CASE WHEN jsonb_typeof(st->'punkte') = 'number' THEN (st->>'punkte')::numeric END,
    'punkte_verluste', verluste,
    'daten_gespeichert', st_zeit,
    'daten_kb', st_kb,
    'ilho_aktiv', COALESCE((st->>'ilhoAktiv')::boolean, false),
    'dateien', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('bucket', o.bucket_id, 'pfad', o.name, 'groesse', (o.metadata->>'size')::bigint,
                                          'typ', o.metadata->>'mimetype', 'zeit', o.created_at) ORDER BY o.created_at DESC)
        FROM storage.objects o
       WHERE (o.bucket_id IN ('klientin-dateien', 'gemeinschaft') AND (o.name LIKE p_user::text || '/%' OR o.owner = p_user))
    ), '[]'::jsonb),
    'community', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', cp.id, 'text', left(cp.text, 160), 'sichtbar', cp.sichtbar, 'zeit', cp.created_at) ORDER BY cp.created_at DESC)
        FROM (SELECT * FROM community_posts WHERE user_id = p_user ORDER BY created_at DESC LIMIT 5) cp
    ), '[]'::jsonb),
    'hinweise', hinweise
  );
END $$;
GRANT EXECUTE ON FUNCTION admin_mitglied_aktivitaet(UUID) TO authenticated;
