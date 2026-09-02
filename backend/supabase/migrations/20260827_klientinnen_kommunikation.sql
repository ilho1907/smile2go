-- smile2go · Klientinnen-Bindung, echte Kommunikation, Termine, Community, Push
--
-- Bis hierher lief alles Klientinnen-seitige nur im lokalen App-Zustand:
-- Coach-Chat mit Standardantworten, Termine ohne Gegenstelle, Community im Speicher.
-- Diese Migration legt die fehlenden Gegenstellen an — mit RLS, damit eine Klientin
-- ausschliesslich ihre eigenen Daten und ihre eigene Coachin sieht.

-- ---------------------------------------------------------------------------
-- 1 · Bindung Coachin <-> Klientin
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS klientinnen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  anzeigename TEXT,
  status TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('anfrage','aktiv','pausiert','beendet')),
  verbunden_am TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, coach_id)
);

CREATE INDEX IF NOT EXISTS idx_klientinnen_user ON klientinnen(user_id);
CREATE INDEX IF NOT EXISTS idx_klientinnen_coach ON klientinnen(coach_id, status);

ALTER TABLE klientinnen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Klientin sieht ihre eigene Bindung" ON klientinnen;
DROP POLICY IF EXISTS "Klientin sieht ihre eigene Bindung" ON klientinnen;
CREATE POLICY "Klientin sieht ihre eigene Bindung" ON klientinnen
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = coach_id);
DROP POLICY IF EXISTS "Klientin aktualisiert ihre eigene Bindung" ON klientinnen;
DROP POLICY IF EXISTS "Klientin aktualisiert ihre eigene Bindung" ON klientinnen;
CREATE POLICY "Klientin aktualisiert ihre eigene Bindung" ON klientinnen
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = coach_id);

-- Die Klientin darf den Namen ihrer Coachin lesen (fuer Chat-Kopf, Termin, Mediathek).
DROP POLICY IF EXISTS "Klientin sieht ihre Coachin" ON coaches;
DROP POLICY IF EXISTS "Klientin sieht ihre Coachin" ON coaches;
CREATE POLICY "Klientin sieht ihre Coachin" ON coaches
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM klientinnen k WHERE k.coach_id = coaches.id AND k.user_id = auth.uid())
  );

-- Einladungscode: die Coachin gibt ihn weiter, die Klientin loest ihn einmal ein.
CREATE TABLE IF NOT EXISTS coach_einladungen (
  code TEXT PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  max_nutzungen INTEGER,
  nutzungen INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE coach_einladungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coachin verwaltet ihre Einladungen" ON coach_einladungen;
DROP POLICY IF EXISTS "Coachin verwaltet ihre Einladungen" ON coach_einladungen;
CREATE POLICY "Coachin verwaltet ihre Einladungen" ON coach_einladungen
  FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- Einloesen laeuft ueber SECURITY DEFINER, damit die Klientin die Codetabelle
-- nicht durchsuchen kann (kein Erraten fremder Coachinnen).
CREATE OR REPLACE FUNCTION mit_coach_verbinden(p_code TEXT, p_anzeigename TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach UUID;
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht angemeldet';
  END IF;

  SELECT coach_id INTO v_coach
  FROM coach_einladungen
  WHERE code = upper(trim(p_code))
    AND aktiv
    AND (max_nutzungen IS NULL OR nutzungen < max_nutzungen);

  IF v_coach IS NULL THEN
    RAISE EXCEPTION 'Code ungueltig oder nicht mehr gueltig';
  END IF;

  INSERT INTO klientinnen (user_id, coach_id, anzeigename)
  VALUES (auth.uid(), v_coach, p_anzeigename)
  ON CONFLICT (user_id, coach_id)
  DO UPDATE SET status = 'aktiv', anzeigename = COALESCE(EXCLUDED.anzeigename, klientinnen.anzeigename)
  RETURNING id INTO v_id;

  UPDATE coach_einladungen SET nutzungen = nutzungen + 1 WHERE code = upper(trim(p_code));

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION mit_coach_verbinden(TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2 · Nachrichten zwischen Klientin und Coachin
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS nachrichten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klientin_id UUID NOT NULL REFERENCES klientinnen(id) ON DELETE CASCADE,
  absender TEXT NOT NULL CHECK (absender IN ('klientin','coach')),
  absender_id UUID NOT NULL,
  text TEXT,
  audio_pfad TEXT,
  audio_sek INTEGER,
  gelesen_am TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (text IS NOT NULL OR audio_pfad IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_nachrichten_verlauf ON nachrichten(klientin_id, created_at);

ALTER TABLE nachrichten ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Beide Seiten sehen ihren Verlauf" ON nachrichten;
DROP POLICY IF EXISTS "Beide Seiten sehen ihren Verlauf" ON nachrichten;
CREATE POLICY "Beide Seiten sehen ihren Verlauf" ON nachrichten
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = nachrichten.klientin_id
            AND (k.user_id = auth.uid() OR k.coach_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Beide Seiten schreiben in ihren Verlauf" ON nachrichten;
DROP POLICY IF EXISTS "Beide Seiten schreiben in ihren Verlauf" ON nachrichten;
CREATE POLICY "Beide Seiten schreiben in ihren Verlauf" ON nachrichten
  FOR INSERT WITH CHECK (
    absender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = nachrichten.klientin_id
                AND ((k.user_id = auth.uid() AND absender = 'klientin')
                  OR (k.coach_id = auth.uid() AND absender = 'coach')))
  );

DROP POLICY IF EXISTS "Empfaengerin darf als gelesen markieren" ON nachrichten;
DROP POLICY IF EXISTS "Empfaengerin darf als gelesen markieren" ON nachrichten;
CREATE POLICY "Empfaengerin darf als gelesen markieren" ON nachrichten
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = nachrichten.klientin_id
            AND (k.user_id = auth.uid() OR k.coach_id = auth.uid()))
  );

ALTER PUBLICATION supabase_realtime ADD TABLE nachrichten;

-- ---------------------------------------------------------------------------
-- 3 · Termine: freie Zeitfenster der Coachin + gebuchte Sessions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS coach_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  beginn TIMESTAMP WITH TIME ZONE NOT NULL,
  dauer_min INTEGER NOT NULL DEFAULT 50,
  kanal TEXT NOT NULL DEFAULT 'video' CHECK (kanal IN ('video','telefon','vor_ort')),
  aktiv BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (coach_id, beginn)
);

CREATE INDEX IF NOT EXISTS idx_slots_coach_zeit ON coach_slots(coach_id, beginn) WHERE aktiv;

ALTER TABLE coach_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coachin verwaltet ihre Zeitfenster" ON coach_slots;
DROP POLICY IF EXISTS "Coachin verwaltet ihre Zeitfenster" ON coach_slots;
CREATE POLICY "Coachin verwaltet ihre Zeitfenster" ON coach_slots
  FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Klientin sieht die Zeitfenster ihrer Coachin" ON coach_slots;
DROP POLICY IF EXISTS "Klientin sieht die Zeitfenster ihrer Coachin" ON coach_slots;
CREATE POLICY "Klientin sieht die Zeitfenster ihrer Coachin" ON coach_slots
  FOR SELECT USING (
    aktiv AND EXISTS (SELECT 1 FROM klientinnen k WHERE k.coach_id = coach_slots.coach_id
                      AND k.user_id = auth.uid() AND k.status = 'aktiv')
  );

CREATE TABLE IF NOT EXISTS termine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID UNIQUE REFERENCES coach_slots(id) ON DELETE SET NULL,
  klientin_id UUID NOT NULL REFERENCES klientinnen(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  beginn TIMESTAMP WITH TIME ZONE NOT NULL,
  dauer_min INTEGER NOT NULL DEFAULT 50,
  kanal TEXT NOT NULL DEFAULT 'video',
  titel TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'gebucht' CHECK (status IN ('gebucht','storniert','erledigt')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_termine_klientin ON termine(klientin_id, beginn);
CREATE INDEX IF NOT EXISTS idx_termine_coach ON termine(coach_id, beginn);

ALTER TABLE termine ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Beide Seiten sehen ihre Termine" ON termine;
DROP POLICY IF EXISTS "Beide Seiten sehen ihre Termine" ON termine;
CREATE POLICY "Beide Seiten sehen ihre Termine" ON termine
  FOR SELECT USING (
    auth.uid() = coach_id
    OR EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = termine.klientin_id AND k.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Beide Seiten aendern ihre Termine" ON termine;
DROP POLICY IF EXISTS "Beide Seiten aendern ihre Termine" ON termine;
CREATE POLICY "Beide Seiten aendern ihre Termine" ON termine
  FOR UPDATE USING (
    auth.uid() = coach_id
    OR EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = termine.klientin_id AND k.user_id = auth.uid())
  );

-- Buchen laeuft ueber eine Funktion: sie prueft die Bindung, verhindert
-- Doppelbuchungen (UNIQUE auf slot_id) und setzt das Zeitfenster inaktiv.
CREATE OR REPLACE FUNCTION termin_buchen(p_slot UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot coach_slots%ROWTYPE;
  v_klientin klientinnen%ROWTYPE;
  v_id UUID;
BEGIN
  SELECT * INTO v_slot FROM coach_slots WHERE id = p_slot FOR UPDATE;
  IF v_slot.id IS NULL OR NOT v_slot.aktiv THEN
    RAISE EXCEPTION 'Zeitfenster nicht mehr verfuegbar';
  END IF;

  SELECT * INTO v_klientin FROM klientinnen
  WHERE user_id = auth.uid() AND coach_id = v_slot.coach_id AND status = 'aktiv';
  IF v_klientin.id IS NULL THEN
    RAISE EXCEPTION 'Keine aktive Bindung zu dieser Coachin';
  END IF;

  INSERT INTO termine (slot_id, klientin_id, coach_id, beginn, dauer_min, kanal, titel)
  VALUES (v_slot.id, v_klientin.id, v_slot.coach_id, v_slot.beginn, v_slot.dauer_min, v_slot.kanal,
          '1:1 Coaching-Session')
  RETURNING id INTO v_id;

  UPDATE coach_slots SET aktiv = false WHERE id = v_slot.id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION termin_buchen(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION termin_stornieren(p_termin UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot UUID;
BEGIN
  UPDATE termine t SET status = 'storniert'
  WHERE t.id = p_termin
    AND t.status = 'gebucht'
    AND (t.coach_id = auth.uid()
         OR EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = t.klientin_id AND k.user_id = auth.uid()))
  RETURNING t.slot_id INTO v_slot;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF v_slot IS NOT NULL THEN
    UPDATE coach_slots SET aktiv = true WHERE id = v_slot;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION termin_stornieren(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4 · Community: echte Beitraege, Herzen, Meldefunktion
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL DEFAULT 'Anonym',
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 2000),
  sichtbar BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_zeit ON community_posts(created_at DESC) WHERE sichtbar;

CREATE TABLE IF NOT EXISTS community_herzen (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_meldungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  melderin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grund TEXT,
  erledigt BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (post_id, melderin_id)
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_herzen ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_meldungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alle Angemeldeten lesen sichtbare Beitraege" ON community_posts;
DROP POLICY IF EXISTS "Alle Angemeldeten lesen sichtbare Beitraege" ON community_posts;
CREATE POLICY "Alle Angemeldeten lesen sichtbare Beitraege" ON community_posts
  FOR SELECT TO authenticated USING (sichtbar OR user_id = auth.uid());
DROP POLICY IF EXISTS "Jede schreibt unter eigenem Konto" ON community_posts;
DROP POLICY IF EXISTS "Jede schreibt unter eigenem Konto" ON community_posts;
CREATE POLICY "Jede schreibt unter eigenem Konto" ON community_posts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Jede loescht ihren eigenen Beitrag" ON community_posts;
DROP POLICY IF EXISTS "Jede loescht ihren eigenen Beitrag" ON community_posts;
CREATE POLICY "Jede loescht ihren eigenen Beitrag" ON community_posts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Herzen lesen" ON community_herzen;
DROP POLICY IF EXISTS "Herzen lesen" ON community_herzen;
CREATE POLICY "Herzen lesen" ON community_herzen
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Eigenes Herz setzen" ON community_herzen;
DROP POLICY IF EXISTS "Eigenes Herz setzen" ON community_herzen;
CREATE POLICY "Eigenes Herz setzen" ON community_herzen
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Eigenes Herz zuruecknehmen" ON community_herzen;
DROP POLICY IF EXISTS "Eigenes Herz zuruecknehmen" ON community_herzen;
CREATE POLICY "Eigenes Herz zuruecknehmen" ON community_herzen
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Eigene Meldung anlegen" ON community_meldungen;
DROP POLICY IF EXISTS "Eigene Meldung anlegen" ON community_meldungen;
CREATE POLICY "Eigene Meldung anlegen" ON community_meldungen
  FOR INSERT TO authenticated WITH CHECK (melderin_id = auth.uid());
DROP POLICY IF EXISTS "Eigene Meldung sehen" ON community_meldungen;
DROP POLICY IF EXISTS "Eigene Meldung sehen" ON community_meldungen;
CREATE POLICY "Eigene Meldung sehen" ON community_meldungen
  FOR SELECT TO authenticated USING (melderin_id = auth.uid());

-- Ab 3 unabhaengigen Meldungen verschwindet der Beitrag automatisch aus dem Feed,
-- bis er geprueft ist (§ 7 DSA / Sorgfaltspflicht bei nutzergenerierten Inhalten).
CREATE OR REPLACE FUNCTION community_auto_ausblenden()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM community_meldungen WHERE post_id = NEW.post_id AND NOT erledigt) >= 3 THEN
    UPDATE community_posts SET sichtbar = false WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_meldung ON community_meldungen;
DROP TRIGGER IF EXISTS trg_community_meldung ON community_meldungen;
CREATE TRIGGER trg_community_meldung
  AFTER INSERT ON community_meldungen
  FOR EACH ROW EXECUTE FUNCTION community_auto_ausblenden();

-- Feed mit Herz-Zahl, ohne die Herzen-Tabelle offenzulegen
CREATE OR REPLACE VIEW community_feed
WITH (security_invoker = true) AS
SELECT p.id, p.alias, p.text, p.created_at, p.user_id,
       (SELECT count(*) FROM community_herzen h WHERE h.post_id = p.id) AS herzen
FROM community_posts p
WHERE p.sichtbar;

GRANT SELECT ON community_feed TO authenticated;

-- ---------------------------------------------------------------------------
-- 5 · Push-Abos (Web Push / VAPID)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS push_abos (
  endpoint TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  geraet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_abos(user_id);

ALTER TABLE push_abos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutzerin verwaltet ihre Push-Abos" ON push_abos;
DROP POLICY IF EXISTS "Nutzerin verwaltet ihre Push-Abos" ON push_abos;
CREATE POLICY "Nutzerin verwaltet ihre Push-Abos" ON push_abos
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6 · Dateien: privater Bucket pro Nutzerin, Material-Bucket der Coachin
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('klientin-dateien', 'klientin-dateien', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-material', 'coach-material', false)
ON CONFLICT (id) DO NOTHING;

-- Pfadschema: <user_id>/<dateiname> bzw. <coach_id>/<dateiname>
DROP POLICY IF EXISTS "Eigene Dateien lesen" ON storage.objects;
DROP POLICY IF EXISTS "Eigene Dateien lesen" ON storage.objects;
CREATE POLICY "Eigene Dateien lesen" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'klientin-dateien' AND (storage.foldername(name))[1] = auth.uid()::text
  );
DROP POLICY IF EXISTS "Eigene Dateien hochladen" ON storage.objects;
DROP POLICY IF EXISTS "Eigene Dateien hochladen" ON storage.objects;
CREATE POLICY "Eigene Dateien hochladen" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'klientin-dateien' AND (storage.foldername(name))[1] = auth.uid()::text
  );
DROP POLICY IF EXISTS "Eigene Dateien loeschen" ON storage.objects;
DROP POLICY IF EXISTS "Eigene Dateien loeschen" ON storage.objects;
CREATE POLICY "Eigene Dateien loeschen" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'klientin-dateien' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Material der eigenen Coachin lesen" ON storage.objects;
DROP POLICY IF EXISTS "Material der eigenen Coachin lesen" ON storage.objects;
CREATE POLICY "Material der eigenen Coachin lesen" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'coach-material' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM klientinnen k
                 WHERE k.user_id = auth.uid() AND k.coach_id::text = (storage.foldername(name))[1])
    )
  );
DROP POLICY IF EXISTS "Coachin laedt Material hoch" ON storage.objects;
DROP POLICY IF EXISTS "Coachin laedt Material hoch" ON storage.objects;
CREATE POLICY "Coachin laedt Material hoch" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'coach-material' AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 7 · DSGVO: vollstaendiger Datenexport der angemeldeten Nutzerin (Art. 15/20)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION meine_daten_export()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_out JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Nicht angemeldet';
  END IF;

  SELECT jsonb_build_object(
    'exportiert_am', now(),
    'konto', (SELECT jsonb_build_object('id', u.id, 'email', u.email, 'angelegt_am', u.created_at)
              FROM auth.users u WHERE u.id = v_uid),
    'app_zustand', (SELECT state FROM app_state WHERE user_id = v_uid),
    'bindungen', (SELECT COALESCE(jsonb_agg(to_jsonb(k)), '[]'::jsonb) FROM klientinnen k WHERE k.user_id = v_uid),
    'nachrichten', (SELECT COALESCE(jsonb_agg(to_jsonb(n) ORDER BY n.created_at), '[]'::jsonb)
                    FROM nachrichten n JOIN klientinnen k ON k.id = n.klientin_id WHERE k.user_id = v_uid),
    'termine', (SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.beginn), '[]'::jsonb)
                FROM termine t JOIN klientinnen k ON k.id = t.klientin_id WHERE k.user_id = v_uid),
    'community', (SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.created_at), '[]'::jsonb)
                  FROM community_posts p WHERE p.user_id = v_uid)
  ) INTO v_out;

  RETURN v_out;
END;
$$;

GRANT EXECUTE ON FUNCTION meine_daten_export() TO authenticated;
