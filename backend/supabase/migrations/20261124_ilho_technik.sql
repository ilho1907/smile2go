-- ---------------------------------------------------------------------------
-- smile2go · ilho-technik — Hilfe & Support mit Ticket-Routing (24.11.2026)
--
-- Getrennt von allem Öffentlichen: Support-Tickets erscheinen NIE in der
-- Community. Jede Nutzerin sieht nur ihre eigenen Tickets, öffentliche
-- Antworten und den Status-Verlauf. Interne Notizen, die KI-Begründung und
-- Zuweisungen sieht nur das Support-Team.
--
--   support_team            — wer Tickets bearbeiten darf (+ alle Admins)
--   support_regeln          — Routing: Kategorie/Priorität → zuständige Person
--   support_tickets         — ein Ticket, Nummer S2G-JJJJ-NNNNN
--   support_nachrichten     — Antworten; intern = nur fürs Team
--   support_anhaenge        — Screenshots (Bucket support-anhaenge, privat)
--   support_verlauf         — Protokoll: Status, Zuweisung, KI, mit Akteur+Zeit
--   support_benachrichtigungen — In-App-Hinweise (Glocke/Zähler)
--
-- Schreiben läuft ausschließlich über SECURITY-DEFINER-Funktionen, die
-- Anmeldung und Rolle selbst prüfen. Für Nutzerinnen gibt es KEINE
-- Tabellen-Politik — sie lesen nur über Funktionen, die interne Felder
-- weglassen. Die KI (Edge Function „ilho-technik“) darf nur einstufen
-- (Kategorie, Priorität, Begründung); wer zuständig wird, entscheiden die
-- Regeln hier in der Datenbank. Sie kann weder antworten noch schließen.
--
-- Wiederholungen sind unschädlich:
--   • Ticket anlegen mit demselben anfrage_schluessel → dasselbe Ticket
--   • Antwort mit demselben client_schluessel        → dieselbe Antwort
--   • KI-Ergebnis wirkt nur, solange ki_status = 'ausstehend'
-- ---------------------------------------------------------------------------

-- ── Stammdaten ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_team (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  anzeigename  TEXT NOT NULL CHECK (length(btrim(anzeigename)) BETWEEN 1 AND 80),
  aktiv        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Darf Support-Tickets sehen und bearbeiten: Admins und aktives Support-Team.
CREATE OR REPLACE FUNCTION ist_support()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ist_admin() OR EXISTS (SELECT 1 FROM support_team WHERE user_id = auth.uid() AND aktiv);
$$;
REVOKE ALL ON FUNCTION ist_support() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ist_support() TO authenticated;

CREATE TABLE IF NOT EXISTS support_regeln (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategorie    TEXT CHECK (kategorie IN ('technik','konto','zahlung','inhalte','sonstiges')),  -- NULL = jede
  prioritaet   TEXT CHECK (prioritaet IN ('niedrig','normal','hoch','dringend')),             -- NULL = jede
  zustaendig   UUID NOT NULL REFERENCES support_team(user_id) ON DELETE CASCADE,
  rang         INTEGER NOT NULL DEFAULT 100,     -- kleiner = zuerst
  aktiv        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tickets ────────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS support_ticket_nr;

CREATE TABLE IF NOT EXISTS support_tickets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nummer              TEXT NOT NULL UNIQUE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rolle               TEXT NOT NULL CHECK (rolle IN ('mitglied','coachin')),
  anfrage_schluessel  TEXT NOT NULL CHECK (length(anfrage_schluessel) BETWEEN 8 AND 80),
  betreff             TEXT NOT NULL CHECK (length(btrim(betreff)) BETWEEN 3 AND 150),
  beschreibung        TEXT NOT NULL CHECK (length(btrim(beschreibung)) BETWEEN 10 AND 5000),
  kategorie_nutzerin  TEXT NOT NULL CHECK (kategorie_nutzerin IN ('technik','konto','zahlung','inhalte','sonstiges')),
  kategorie           TEXT NOT NULL CHECK (kategorie IN ('technik','konto','zahlung','inhalte','sonstiges')),
  prioritaet          TEXT NOT NULL DEFAULT 'normal' CHECK (prioritaet IN ('niedrig','normal','hoch','dringend')),
  status              TEXT NOT NULL DEFAULT 'eingegangen'
                        CHECK (status IN ('eingegangen','in_bearbeitung','warten','geloest')),
  zustaendig          UUID REFERENCES support_team(user_id) ON DELETE SET NULL,
  -- KI-Einstufung (nur fürs Team sichtbar)
  ki_status           TEXT NOT NULL DEFAULT 'ausstehend'
                        CHECK (ki_status IN ('ausstehend','ok','fehler','ueberschrieben')),
  ki_kategorie        TEXT CHECK (ki_kategorie IN ('technik','konto','zahlung','inhalte','sonstiges')),
  ki_prioritaet       TEXT CHECK (ki_prioritaet IN ('niedrig','normal','hoch','dringend')),
  ki_begruendung      TEXT CHECK (length(ki_begruendung) <= 300),
  ki_modell           TEXT,
  ki_fehler           TEXT,
  manuell_pruefen     BOOLEAN NOT NULL DEFAULT true,   -- Admin-Queue, bis KI/Regel oder Mensch entschieden hat
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktualisiert_am     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, anfrage_schluessel)
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user   ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, aktualisiert_am DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_zust   ON support_tickets(zustaendig) WHERE status <> 'geloest';

CREATE TABLE IF NOT EXISTS support_nachrichten (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  autor_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  von              TEXT NOT NULL CHECK (von IN ('nutzerin','team')),
  intern           BOOLEAN NOT NULL DEFAULT false,
  text             TEXT NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 5000),
  client_schluessel TEXT CHECK (length(client_schluessel) BETWEEN 8 AND 80),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT (intern AND von = 'nutzerin')),
  UNIQUE (ticket_id, client_schluessel)
);
CREATE INDEX IF NOT EXISTS idx_support_nachrichten_ticket ON support_nachrichten(ticket_id, created_at);

CREATE TABLE IF NOT EXISTS support_anhaenge (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  nachricht_id UUID REFERENCES support_nachrichten(id) ON DELETE SET NULL,
  pfad        TEXT NOT NULL UNIQUE,
  dateiname   TEXT NOT NULL,
  mime        TEXT NOT NULL CHECK (mime IN ('image/png','image/jpeg','image/webp')),
  groesse     INTEGER NOT NULL CHECK (groesse BETWEEN 1 AND 5242880),
  hochgeladen_von UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_anhaenge_ticket ON support_anhaenge(ticket_id);

CREATE TABLE IF NOT EXISTS support_verlauf (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  akteur_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,   -- NULL = System/KI
  akteur      TEXT NOT NULL,                                        -- Anzeige (nur Team): „Nutzerin“, Teamname, „ilho-technik (KI)“, „System (Regel)“
  aktion      TEXT NOT NULL CHECK (aktion IN ('erstellt','status','zuweisung','einstufung','ki_routing','ki_fehler')),
  alt         TEXT,
  neu         TEXT,
  fuer_nutzerin BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_verlauf_ticket ON support_verlauf(ticket_id, created_at);

CREATE TABLE IF NOT EXISTS support_benachrichtigungen (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  gelesen_am  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_benach_user ON support_benachrichtigungen(user_id) WHERE gelesen_am IS NULL;

-- ── RLS: Nutzerinnen haben keinen direkten Tabellenzugriff ─────────────────
ALTER TABLE support_team               ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_regeln             ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_nachrichten        ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_anhaenge           ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_verlauf            ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_benachrichtigungen ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['support_team','support_regeln','support_tickets','support_nachrichten',
                           'support_anhaenge','support_verlauf'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Support-Team liest" ON %I', t);
    EXECUTE format('CREATE POLICY "Support-Team liest" ON %I FOR SELECT TO authenticated USING (ist_support())', t);
    -- Supabase vergibt per Default-Privileges oft ALL (inkl. TRUNCATE, das RLS umgeht) → explizit zurücknehmen.
    EXECUTE format('REVOKE ALL ON %I FROM PUBLIC, anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON %I TO authenticated', t);
  END LOOP;
END $$;
DROP POLICY IF EXISTS "Eigene Hinweise" ON support_benachrichtigungen;
CREATE POLICY "Eigene Hinweise" ON support_benachrichtigungen FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE ALL ON support_benachrichtigungen FROM PUBLIC, anon, authenticated;
GRANT SELECT ON support_benachrichtigungen TO authenticated;
REVOKE ALL ON SEQUENCE support_ticket_nr FROM PUBLIC, anon, authenticated;
GRANT ALL ON support_team, support_regeln, support_tickets, support_nachrichten, support_anhaenge,
             support_verlauf, support_benachrichtigungen TO service_role;
GRANT USAGE ON SEQUENCE support_ticket_nr TO service_role;

-- ── Hilfsfunktionen ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION support_status_label(s TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE s WHEN 'eingegangen' THEN 'Eingegangen' WHEN 'in_bearbeitung' THEN 'In Bearbeitung'
                WHEN 'warten' THEN 'Warten auf Rückmeldung' WHEN 'geloest' THEN 'Gelöst' ELSE s END;
$$;

-- Wie heißt die handelnde Person im Protokoll?
CREATE OR REPLACE FUNCTION support_akteur_name(p_user UUID) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT coalesce((SELECT anzeigename FROM support_team WHERE user_id = p_user),
                  (SELECT split_part(email::text, '@', 1) FROM auth.users WHERE id = p_user),
                  'Team');
$$;
REVOKE ALL ON FUNCTION support_akteur_name(UUID) FROM PUBLIC;

-- Gehört das Ticket (als Text, z. B. aus einem Storage-Pfad) der angemeldeten Person?
CREATE OR REPLACE FUNCTION support_ticket_gehoert_mir(p_ticket TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_ticket IS NULL OR p_ticket !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (SELECT 1 FROM support_tickets WHERE id = p_ticket::uuid AND user_id = auth.uid());
END $$;
REVOKE ALL ON FUNCTION support_ticket_gehoert_mir(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION support_ticket_gehoert_mir(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION support_hinweis(p_user UUID, p_ticket UUID, p_text TEXT) RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO support_benachrichtigungen (user_id, ticket_id, text) SELECT p_user, p_ticket, p_text WHERE p_user IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION support_hinweis(UUID, UUID, TEXT) FROM PUBLIC;

-- Regelwerk: wer übernimmt Kategorie k mit Priorität p?
-- Spezifischste Regel zuerst, dann Rang, dann wer am wenigsten offen hat.
CREATE OR REPLACE FUNCTION support_regel_finden(p_kategorie TEXT, p_prioritaet TEXT) RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.zustaendig
    FROM support_regeln r
    JOIN support_team t ON t.user_id = r.zustaendig AND t.aktiv
   WHERE r.aktiv
     AND (r.kategorie IS NULL OR r.kategorie = p_kategorie)
     AND (r.prioritaet IS NULL OR r.prioritaet = p_prioritaet)
   ORDER BY (r.kategorie IS NOT NULL)::int + (r.prioritaet IS NOT NULL)::int DESC,
            r.rang,
            (SELECT count(*) FROM support_tickets x WHERE x.zustaendig = r.zustaendig AND x.status <> 'geloest'),
            r.created_at
   LIMIT 1;
$$;
REVOKE ALL ON FUNCTION support_regel_finden(TEXT, TEXT) FROM PUBLIC;

-- ── Nutzerin ───────────────────────────────────────────────────────────────

-- Legt ein Ticket an. Wiederholung mit demselben Schlüssel → dasselbe Ticket (neu = false).
CREATE OR REPLACE FUNCTION support_ticket_anlegen(p_betreff TEXT, p_beschreibung TEXT, p_kategorie TEXT, p_schluessel TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  t support_tickets;
  r TEXT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet' USING ERRCODE = '42501'; END IF;
  IF p_kategorie IS NULL OR p_kategorie NOT IN ('technik','konto','zahlung','inhalte','sonstiges') THEN
    RAISE EXCEPTION 'ungültige Kategorie' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO t FROM support_tickets WHERE user_id = uid AND anfrage_schluessel = p_schluessel;
  IF FOUND THEN RETURN jsonb_build_object('id', t.id, 'nummer', t.nummer, 'neu', false); END IF;

  IF (SELECT count(*) FROM support_tickets WHERE user_id = uid AND created_at > now() - interval '24 hours') >= 10 THEN
    RAISE EXCEPTION 'Zu viele Anfragen in 24 Stunden' USING ERRCODE = '54000';
  END IF;

  r := CASE WHEN EXISTS (SELECT 1 FROM coaches WHERE id = uid AND ist_coach) THEN 'coachin' ELSE 'mitglied' END;

  INSERT INTO support_tickets (nummer, user_id, rolle, anfrage_schluessel, betreff, beschreibung, kategorie_nutzerin, kategorie)
  VALUES ('S2G-' || to_char(now() AT TIME ZONE 'Europe/Berlin', 'YYYY') || '-' || lpad(nextval('support_ticket_nr')::text, 5, '0'),
          uid, r, p_schluessel, btrim(p_betreff), btrim(p_beschreibung), p_kategorie, p_kategorie)
  ON CONFLICT (user_id, anfrage_schluessel) DO NOTHING
  RETURNING * INTO t;

  IF t.id IS NULL THEN   -- paralleler Doppel-Klick hat gewonnen
    SELECT * INTO t FROM support_tickets WHERE user_id = uid AND anfrage_schluessel = p_schluessel;
    RETURN jsonb_build_object('id', t.id, 'nummer', t.nummer, 'neu', false);
  END IF;

  INSERT INTO support_verlauf (ticket_id, akteur_id, akteur, aktion, neu, fuer_nutzerin)
    VALUES (t.id, uid, 'Nutzerin', 'erstellt', 'eingegangen', true);
  RETURN jsonb_build_object('id', t.id, 'nummer', t.nummer, 'neu', true);
END $$;

-- Screenshot registrieren, nachdem er in den Bucket geladen wurde.
-- Prüft Pfad, Eigentum, Typ und Größe anhand der Storage-Metadaten (nicht der Angaben des Browsers).
-- Falscher Typ / zu groß → Datei wird gelöscht, Rückgabe NULL.
CREATE OR REPLACE FUNCTION support_anhang_registrieren(p_ticket UUID, p_pfad TEXT, p_dateiname TEXT, p_nachricht UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE
  uid UUID := auth.uid();
  o RECORD;
  m TEXT; g BIGINT;
  neu UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM support_tickets WHERE id = p_ticket AND user_id = uid) THEN
    RAISE EXCEPTION 'kein Zugriff' USING ERRCODE = '42501';
  END IF;
  IF p_pfad IS NULL OR split_part(p_pfad, '/', 1) <> uid::text OR split_part(p_pfad, '/', 2) <> p_ticket::text
     OR p_pfad LIKE '%..%' THEN
    RAISE EXCEPTION 'ungültiger Pfad' USING ERRCODE = '22023';
  END IF;
  IF p_nachricht IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_nachrichten WHERE id = p_nachricht AND ticket_id = p_ticket AND autor_id = uid) THEN
    RAISE EXCEPTION 'ungültige Nachricht' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO neu FROM support_anhaenge WHERE pfad = p_pfad;
  IF FOUND THEN RETURN neu; END IF;

  IF (SELECT count(*) FROM support_anhaenge WHERE ticket_id = p_ticket) >= 10 THEN
    RAISE EXCEPTION 'Zu viele Anhänge' USING ERRCODE = '54000';
  END IF;

  SELECT * INTO o FROM storage.objects WHERE bucket_id = 'support-anhaenge' AND name = p_pfad;
  IF NOT FOUND THEN RAISE EXCEPTION 'Datei nicht gefunden' USING ERRCODE = '22023'; END IF;
  m := lower(coalesce(o.metadata->>'mimetype', ''));
  g := coalesce((o.metadata->>'size')::bigint, 0);
  IF m NOT IN ('image/png','image/jpeg','image/webp') OR g < 1 OR g > 5242880 THEN
    -- Kein RAISE: sonst würde das Löschen mit zurückgerollt. NULL = abgelehnt.
    DELETE FROM storage.objects WHERE id = o.id;
    RETURN NULL;
  END IF;

  INSERT INTO support_anhaenge (ticket_id, nachricht_id, pfad, dateiname, mime, groesse, hochgeladen_von)
    VALUES (p_ticket, p_nachricht, p_pfad, left(coalesce(nullif(btrim(p_dateiname), ''), 'Screenshot'), 120), m, g, uid)
    RETURNING id INTO neu;
  RETURN neu;
END $$;

CREATE OR REPLACE FUNCTION meine_support_tickets()
RETURNS TABLE (id UUID, nummer TEXT, betreff TEXT, kategorie TEXT, status TEXT, created_at TIMESTAMPTZ,
               aktualisiert_am TIMESTAMPTZ, ungelesen BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.nummer, t.betreff, t.kategorie, t.status, t.created_at, t.aktualisiert_am,
         (SELECT count(*) FROM support_benachrichtigungen b WHERE b.ticket_id = t.id AND b.user_id = auth.uid() AND b.gelesen_am IS NULL)
    FROM support_tickets t
   WHERE t.user_id = auth.uid()
   ORDER BY t.aktualisiert_am DESC;
$$;

-- Ein eigenes Ticket — ohne interne Notizen, KI-Begründung und Zuweisung. Markiert Hinweise als gelesen.
CREATE OR REPLACE FUNCTION mein_support_ticket(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t support_tickets; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet' USING ERRCODE = '42501'; END IF;
  SELECT * INTO t FROM support_tickets WHERE id = p_id AND user_id = uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'kein Zugriff' USING ERRCODE = '42501'; END IF;
  UPDATE support_benachrichtigungen SET gelesen_am = now() WHERE ticket_id = p_id AND user_id = uid AND gelesen_am IS NULL;
  RETURN jsonb_build_object(
    'ticket', jsonb_build_object('id', t.id, 'nummer', t.nummer, 'betreff', t.betreff, 'beschreibung', t.beschreibung,
                                 'kategorie', t.kategorie, 'status', t.status, 'created_at', t.created_at, 'aktualisiert_am', t.aktualisiert_am),
    'nachrichten', coalesce((SELECT jsonb_agg(jsonb_build_object('id', n.id, 'von', n.von, 'text', n.text, 'created_at', n.created_at,
                                     'autor', CASE WHEN n.von = 'team' THEN 'smile2go-Support' ELSE 'Du' END) ORDER BY n.created_at)
                               FROM support_nachrichten n WHERE n.ticket_id = p_id AND NOT n.intern), '[]'::jsonb),
    'verlauf', coalesce((SELECT jsonb_agg(jsonb_build_object('aktion', v.aktion, 'neu', v.neu, 'created_at', v.created_at) ORDER BY v.created_at)
                           FROM support_verlauf v WHERE v.ticket_id = p_id AND v.fuer_nutzerin), '[]'::jsonb),
    'anhaenge', coalesce((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'pfad', a.pfad, 'dateiname', a.dateiname, 'created_at', a.created_at) ORDER BY a.created_at)
                            FROM support_anhaenge a WHERE a.ticket_id = p_id), '[]'::jsonb)
  );
END $$;

-- Antwort der Nutzerin. Ein gelöstes oder wartendes Ticket geht dadurch wieder „In Bearbeitung“.
CREATE OR REPLACE FUNCTION support_antworten(p_ticket UUID, p_text TEXT, p_schluessel TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); t support_tickets; neu UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'nicht angemeldet' USING ERRCODE = '42501'; END IF;
  SELECT * INTO t FROM support_tickets WHERE id = p_ticket AND user_id = uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'kein Zugriff' USING ERRCODE = '42501'; END IF;

  SELECT id INTO neu FROM support_nachrichten WHERE ticket_id = p_ticket AND client_schluessel = p_schluessel;
  IF FOUND THEN RETURN neu; END IF;

  INSERT INTO support_nachrichten (ticket_id, autor_id, von, text, client_schluessel)
    VALUES (p_ticket, uid, 'nutzerin', btrim(p_text), p_schluessel) RETURNING id INTO neu;

  IF t.status IN ('warten', 'geloest') THEN
    UPDATE support_tickets SET status = 'in_bearbeitung', aktualisiert_am = now() WHERE id = p_ticket;
    INSERT INTO support_verlauf (ticket_id, akteur_id, akteur, aktion, alt, neu, fuer_nutzerin)
      VALUES (p_ticket, uid, 'Nutzerin', 'status', t.status, 'in_bearbeitung', true);
  ELSE
    UPDATE support_tickets SET aktualisiert_am = now() WHERE id = p_ticket;
  END IF;
  PERFORM support_hinweis(t.zustaendig, p_ticket, 'Neue Antwort zu ' || t.nummer);
  RETURN neu;
END $$;

CREATE OR REPLACE FUNCTION support_ungelesen() RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*) FROM support_benachrichtigungen b
    JOIN support_tickets t ON t.id = b.ticket_id
   WHERE b.user_id = auth.uid() AND b.gelesen_am IS NULL AND t.user_id = auth.uid();
$$;

-- ── KI-Routing (nur Edge Function mit Service-Key) ─────────────────────────

-- Wirkt genau einmal: nur solange ki_status = 'ausstehend'. Weitere Aufrufe → false.
CREATE OR REPLACE FUNCTION support_ki_ergebnis(p_ticket UUID, p_kategorie TEXT, p_prioritaet TEXT, p_begruendung TEXT, p_modell TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t support_tickets; z UUID;
BEGIN
  IF p_kategorie NOT IN ('technik','konto','zahlung','inhalte','sonstiges')
     OR p_prioritaet NOT IN ('niedrig','normal','hoch','dringend') THEN
    RAISE EXCEPTION 'ungültige KI-Werte' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO t FROM support_tickets WHERE id = p_ticket FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket fehlt' USING ERRCODE = '22023'; END IF;
  IF t.ki_status <> 'ausstehend' THEN
    RETURN jsonb_build_object('angewendet', false, 'zustaendig', t.zustaendig);
  END IF;

  z := support_regel_finden(p_kategorie, p_prioritaet);

  UPDATE support_tickets SET
      ki_status = 'ok', ki_kategorie = p_kategorie, ki_prioritaet = p_prioritaet,
      ki_begruendung = left(btrim(coalesce(p_begruendung, '')), 300), ki_modell = left(p_modell, 80), ki_fehler = NULL,
      kategorie = p_kategorie, prioritaet = p_prioritaet,
      zustaendig = coalesce(t.zustaendig, z),
      manuell_pruefen = (coalesce(t.zustaendig, z) IS NULL),
      aktualisiert_am = now()
    WHERE id = p_ticket;

  INSERT INTO support_verlauf (ticket_id, akteur, aktion, alt, neu)
    VALUES (p_ticket, 'ilho-technik (KI)', 'ki_routing', t.kategorie_nutzerin || ' / normal', p_kategorie || ' / ' || p_prioritaet);
  IF t.zustaendig IS NULL AND z IS NOT NULL THEN
    INSERT INTO support_verlauf (ticket_id, akteur, aktion, neu)
      VALUES (p_ticket, 'System (Regel)', 'zuweisung', support_akteur_name(z));
    PERFORM support_hinweis(z, p_ticket, 'Neues Ticket ' || t.nummer || ' für dich');
  END IF;
  RETURN jsonb_build_object('angewendet', true, 'zustaendig', coalesce(t.zustaendig, z));
END $$;

CREATE OR REPLACE FUNCTION support_ki_fehlschlag(p_ticket UUID, p_grund TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE support_tickets SET ki_status = 'fehler', ki_fehler = left(p_grund, 300), manuell_pruefen = true, aktualisiert_am = now()
   WHERE id = p_ticket AND ki_status = 'ausstehend';
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO support_verlauf (ticket_id, akteur, aktion, neu)
    VALUES (p_ticket, 'ilho-technik (KI)', 'ki_fehler', left(p_grund, 300));
  RETURN true;
END $$;

-- ── Support-Team ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION support_admin_liste(
  p_status TEXT DEFAULT NULL, p_kategorie TEXT DEFAULT NULL, p_prioritaet TEXT DEFAULT NULL,
  p_zustaendig TEXT DEFAULT NULL,        -- NULL = alle · 'ich' · 'niemand' · UUID
  p_von DATE DEFAULT NULL, p_bis DATE DEFAULT NULL, p_suche TEXT DEFAULT NULL,
  p_nur_manuell BOOLEAN DEFAULT false, p_limit INTEGER DEFAULT 200)
RETURNS TABLE (id UUID, nummer TEXT, betreff TEXT, email TEXT, rolle TEXT, kategorie TEXT, prioritaet TEXT, status TEXT,
               zustaendig UUID, zustaendig_name TEXT, ki_status TEXT, manuell_pruefen BOOLEAN,
               created_at TIMESTAMPTZ, aktualisiert_am TIMESTAMPTZ, antworten BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT t.id, t.nummer, t.betreff, u.email::text, t.rolle, t.kategorie, t.prioritaet, t.status,
           t.zustaendig, st.anzeigename, t.ki_status, t.manuell_pruefen, t.created_at, t.aktualisiert_am,
           (SELECT count(*) FROM support_nachrichten n WHERE n.ticket_id = t.id AND NOT n.intern)
      FROM support_tickets t
      JOIN auth.users u ON u.id = t.user_id
      LEFT JOIN support_team st ON st.user_id = t.zustaendig
     WHERE (p_status IS NULL OR t.status = p_status)
       AND (p_kategorie IS NULL OR t.kategorie = p_kategorie)
       AND (p_prioritaet IS NULL OR t.prioritaet = p_prioritaet)
       AND (p_zustaendig IS NULL
            OR (p_zustaendig = 'ich' AND t.zustaendig = auth.uid())
            OR (p_zustaendig = 'niemand' AND t.zustaendig IS NULL)
            OR (p_zustaendig ~* '^[0-9a-f-]{36}$' AND t.zustaendig::text = lower(p_zustaendig)))
       AND (p_von IS NULL OR t.created_at >= p_von)
       AND (p_bis IS NULL OR t.created_at < p_bis + 1)
       AND (NOT p_nur_manuell OR (t.manuell_pruefen AND t.status <> 'geloest'))
       AND (coalesce(btrim(p_suche), '') = ''
            OR t.nummer ILIKE '%' || btrim(p_suche) || '%' OR t.betreff ILIKE '%' || btrim(p_suche) || '%'
            OR t.beschreibung ILIKE '%' || btrim(p_suche) || '%' OR u.email ILIKE '%' || btrim(p_suche) || '%')
     ORDER BY CASE t.status WHEN 'geloest' THEN 1 ELSE 0 END,
              CASE t.prioritaet WHEN 'dringend' THEN 0 WHEN 'hoch' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
              t.aktualisiert_am DESC
     LIMIT least(greatest(p_limit, 1), 500);
END $$;

CREATE OR REPLACE FUNCTION support_admin_ticket(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE t support_tickets;
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  SELECT * INTO t FROM support_tickets WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket fehlt' USING ERRCODE = '22023'; END IF;
  UPDATE support_benachrichtigungen SET gelesen_am = now() WHERE ticket_id = p_id AND user_id = auth.uid() AND gelesen_am IS NULL;
  RETURN jsonb_build_object(
    'ticket', to_jsonb(t) - 'anfrage_schluessel' || jsonb_build_object(
                'email', (SELECT email FROM auth.users WHERE id = t.user_id),
                'zustaendig_name', (SELECT anzeigename FROM support_team WHERE user_id = t.zustaendig)),
    'nachrichten', coalesce((SELECT jsonb_agg(jsonb_build_object('id', n.id, 'von', n.von, 'intern', n.intern, 'text', n.text,
                                    'created_at', n.created_at,
                                    'autor', CASE WHEN n.von = 'nutzerin' THEN 'Nutzerin' ELSE support_akteur_name(n.autor_id) END) ORDER BY n.created_at)
                               FROM support_nachrichten n WHERE n.ticket_id = p_id), '[]'::jsonb),
    'verlauf', coalesce((SELECT jsonb_agg(jsonb_build_object('aktion', v.aktion, 'alt', v.alt, 'neu', v.neu, 'akteur', v.akteur, 'created_at', v.created_at) ORDER BY v.created_at)
                           FROM support_verlauf v WHERE v.ticket_id = p_id), '[]'::jsonb),
    'anhaenge', coalesce((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'pfad', a.pfad, 'dateiname', a.dateiname, 'groesse', a.groesse, 'created_at', a.created_at) ORDER BY a.created_at)
                            FROM support_anhaenge a WHERE a.ticket_id = p_id), '[]'::jsonb)
  );
END $$;

-- Antwort oder interne Notiz. Optional gleich den Status setzen (z. B. „warten“).
CREATE OR REPLACE FUNCTION support_admin_antworten(p_ticket UUID, p_text TEXT, p_intern BOOLEAN, p_schluessel TEXT, p_status TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); t support_tickets; neu UUID;
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  SELECT * INTO t FROM support_tickets WHERE id = p_ticket FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket fehlt' USING ERRCODE = '22023'; END IF;

  SELECT id INTO neu FROM support_nachrichten WHERE ticket_id = p_ticket AND client_schluessel = p_schluessel;
  IF FOUND THEN RETURN neu; END IF;

  INSERT INTO support_nachrichten (ticket_id, autor_id, von, intern, text, client_schluessel)
    VALUES (p_ticket, uid, 'team', coalesce(p_intern, false), btrim(p_text), p_schluessel) RETURNING id INTO neu;

  IF NOT coalesce(p_intern, false) THEN
    PERFORM support_hinweis(t.user_id, p_ticket, 'Neue Antwort vom Support zu ' || t.nummer);
    IF p_status IS NULL AND t.status = 'eingegangen' THEN p_status := 'in_bearbeitung'; END IF;
  END IF;
  UPDATE support_tickets SET aktualisiert_am = now() WHERE id = p_ticket;
  IF p_status IS NOT NULL AND p_status <> t.status THEN PERFORM support_admin_status(p_ticket, p_status); END IF;
  RETURN neu;
END $$;

CREATE OR REPLACE FUNCTION support_admin_status(p_ticket UUID, p_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); t support_tickets;
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  IF p_status NOT IN ('eingegangen','in_bearbeitung','warten','geloest') THEN RAISE EXCEPTION 'ungültiger Status' USING ERRCODE = '22023'; END IF;
  SELECT * INTO t FROM support_tickets WHERE id = p_ticket FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket fehlt' USING ERRCODE = '22023'; END IF;
  IF t.status = p_status THEN RETURN; END IF;
  UPDATE support_tickets SET status = p_status, aktualisiert_am = now(),
         manuell_pruefen = CASE WHEN p_status = 'geloest' THEN false ELSE manuell_pruefen END
   WHERE id = p_ticket;
  INSERT INTO support_verlauf (ticket_id, akteur_id, akteur, aktion, alt, neu, fuer_nutzerin)
    VALUES (p_ticket, uid, support_akteur_name(uid), 'status', t.status, p_status, true);
  PERFORM support_hinweis(t.user_id, p_ticket, t.nummer || ': ' || support_status_label(p_status));
END $$;

CREATE OR REPLACE FUNCTION support_admin_zuweisen(p_ticket UUID, p_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); t support_tickets;
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  IF p_user IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_team WHERE user_id = p_user AND aktiv) THEN
    RAISE EXCEPTION 'nicht im Support-Team' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO t FROM support_tickets WHERE id = p_ticket FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket fehlt' USING ERRCODE = '22023'; END IF;
  IF t.zustaendig IS NOT DISTINCT FROM p_user THEN RETURN; END IF;
  UPDATE support_tickets SET zustaendig = p_user, manuell_pruefen = (p_user IS NULL AND status <> 'geloest'), aktualisiert_am = now()
   WHERE id = p_ticket;
  INSERT INTO support_verlauf (ticket_id, akteur_id, akteur, aktion, alt, neu)
    VALUES (p_ticket, uid, support_akteur_name(uid), 'zuweisung',
            CASE WHEN t.zustaendig IS NULL THEN 'Admin-Queue' ELSE support_akteur_name(t.zustaendig) END,
            CASE WHEN p_user IS NULL THEN 'Admin-Queue' ELSE support_akteur_name(p_user) END);
  IF p_user IS NOT NULL AND p_user <> uid THEN
    PERFORM support_hinweis(p_user, p_ticket, t.nummer || ' wurde dir zugewiesen');
  END IF;
END $$;

-- KI-Entscheidung überschreiben (Kategorie und/oder Priorität).
CREATE OR REPLACE FUNCTION support_admin_einstufen(p_ticket UUID, p_kategorie TEXT, p_prioritaet TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); t support_tickets;
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  IF p_kategorie NOT IN ('technik','konto','zahlung','inhalte','sonstiges')
     OR p_prioritaet NOT IN ('niedrig','normal','hoch','dringend') THEN
    RAISE EXCEPTION 'ungültige Werte' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO t FROM support_tickets WHERE id = p_ticket FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket fehlt' USING ERRCODE = '22023'; END IF;
  IF t.kategorie = p_kategorie AND t.prioritaet = p_prioritaet THEN RETURN; END IF;
  UPDATE support_tickets SET kategorie = p_kategorie, prioritaet = p_prioritaet,
         ki_status = CASE WHEN ki_status = 'ausstehend' OR ki_status = 'ok' THEN 'ueberschrieben' ELSE ki_status END,
         aktualisiert_am = now()
   WHERE id = p_ticket;
  INSERT INTO support_verlauf (ticket_id, akteur_id, akteur, aktion, alt, neu)
    VALUES (p_ticket, uid, support_akteur_name(uid), 'einstufung', t.kategorie || ' / ' || t.prioritaet, p_kategorie || ' / ' || p_prioritaet);
END $$;

CREATE OR REPLACE FUNCTION support_admin_zaehler() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'offen',    (SELECT count(*) FROM support_tickets WHERE status <> 'geloest'),
    'neu',      (SELECT count(*) FROM support_tickets WHERE status = 'eingegangen'),
    'manuell',  (SELECT count(*) FROM support_tickets WHERE manuell_pruefen AND status <> 'geloest'),
    'meine',    (SELECT count(*) FROM support_tickets WHERE zustaendig = auth.uid() AND status <> 'geloest'),
    'hinweise', (SELECT count(*) FROM support_benachrichtigungen WHERE user_id = auth.uid() AND gelesen_am IS NULL)
  );
END $$;

CREATE OR REPLACE FUNCTION support_team_liste()
RETURNS TABLE (user_id UUID, anzeigename TEXT, email TEXT, aktiv BOOLEAN, offen BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT s.user_id, s.anzeigename, u.email::text, s.aktiv,
           (SELECT count(*) FROM support_tickets t WHERE t.zustaendig = s.user_id AND t.status <> 'geloest')
      FROM support_team s JOIN auth.users u ON u.id = s.user_id
     ORDER BY s.aktiv DESC, s.anzeigename;
END $$;

-- ── Nur Admins: Team und Regeln pflegen ────────────────────────────────────

CREATE OR REPLACE FUNCTION support_team_setzen(p_email TEXT, p_name TEXT, p_aktiv BOOLEAN DEFAULT true)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE u UUID;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins' USING ERRCODE = '42501'; END IF;
  SELECT id INTO u FROM auth.users WHERE lower(email) = lower(btrim(p_email));
  IF u IS NULL THEN RAISE EXCEPTION 'Kein Konto mit dieser E-Mail' USING ERRCODE = '22023'; END IF;
  INSERT INTO support_team (user_id, anzeigename, aktiv) VALUES (u, btrim(p_name), coalesce(p_aktiv, true))
    ON CONFLICT (user_id) DO UPDATE SET anzeigename = excluded.anzeigename, aktiv = excluded.aktiv;
  RETURN u;
END $$;

CREATE OR REPLACE FUNCTION support_regeln_liste()
RETURNS TABLE (id UUID, kategorie TEXT, prioritaet TEXT, zustaendig UUID, zustaendig_name TEXT, rang INTEGER, aktiv BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_support() THEN RAISE EXCEPTION 'nur für das Support-Team' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT r.id, r.kategorie, r.prioritaet, r.zustaendig, s.anzeigename, r.rang, r.aktiv
                 FROM support_regeln r JOIN support_team s ON s.user_id = r.zustaendig
                ORDER BY r.rang, r.created_at;
END $$;

CREATE OR REPLACE FUNCTION support_regel_setzen(p_id UUID, p_kategorie TEXT, p_prioritaet TEXT, p_zustaendig UUID, p_rang INTEGER DEFAULT 100, p_aktiv BOOLEAN DEFAULT true)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r UUID;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins' USING ERRCODE = '42501'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO support_regeln (kategorie, prioritaet, zustaendig, rang, aktiv)
      VALUES (nullif(p_kategorie, ''), nullif(p_prioritaet, ''), p_zustaendig, coalesce(p_rang, 100), coalesce(p_aktiv, true))
      RETURNING id INTO r;
  ELSE
    UPDATE support_regeln SET kategorie = nullif(p_kategorie, ''), prioritaet = nullif(p_prioritaet, ''),
           zustaendig = p_zustaendig, rang = coalesce(p_rang, 100), aktiv = coalesce(p_aktiv, true)
     WHERE id = p_id RETURNING id INTO r;
  END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION support_regel_loeschen(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins' USING ERRCODE = '42501'; END IF;
  DELETE FROM support_regeln WHERE id = p_id;
END $$;

-- ── Rechte an den Funktionen ───────────────────────────────────────────────
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'support_ticket_anlegen(TEXT, TEXT, TEXT, TEXT)', 'support_anhang_registrieren(UUID, TEXT, TEXT, UUID)',
    'meine_support_tickets()', 'mein_support_ticket(UUID)', 'support_antworten(UUID, TEXT, TEXT)', 'support_ungelesen()',
    'support_admin_liste(TEXT, TEXT, TEXT, TEXT, DATE, DATE, TEXT, BOOLEAN, INTEGER)', 'support_admin_ticket(UUID)',
    'support_admin_antworten(UUID, TEXT, BOOLEAN, TEXT, TEXT)', 'support_admin_status(UUID, TEXT)',
    'support_admin_zuweisen(UUID, UUID)', 'support_admin_einstufen(UUID, TEXT, TEXT)', 'support_admin_zaehler()',
    'support_team_liste()', 'support_team_setzen(TEXT, TEXT, BOOLEAN)', 'support_regeln_liste()',
    'support_regel_setzen(UUID, TEXT, TEXT, UUID, INTEGER, BOOLEAN)', 'support_regel_loeschen(UUID)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
  -- Interne Helfer (SECURITY DEFINER) — von außen nicht aufrufbar.
  FOREACH f IN ARRAY ARRAY['support_akteur_name(UUID)', 'support_hinweis(UUID, UUID, TEXT)', 'support_regel_finden(TEXT, TEXT)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
  EXECUTE 'REVOKE ALL ON FUNCTION ist_support() FROM anon';
  EXECUTE 'REVOKE ALL ON FUNCTION support_ticket_gehoert_mir(TEXT) FROM anon';
  -- KI-Ergebnis darf nur der Server (Service-Key) schreiben.
  FOREACH f IN ARRAY ARRAY['support_ki_ergebnis(UUID, TEXT, TEXT, TEXT, TEXT)', 'support_ki_fehlschlag(UUID, TEXT)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- ── Storage: privater Bucket für Screenshots ───────────────────────────────
-- Pfad: <user_id>/<ticket_id>/<zufall>.<endung> · nur PNG/JPG/WebP · max. 5 MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('support-anhaenge', 'support-anhaenge', false, 5242880, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp'];

DROP POLICY IF EXISTS "Support-Anhang hochladen" ON storage.objects;
CREATE POLICY "Support-Anhang hochladen" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'support-anhaenge'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND support_ticket_gehoert_mir((storage.foldername(name))[2])
  );
DROP POLICY IF EXISTS "Support-Anhang lesen" ON storage.objects;
CREATE POLICY "Support-Anhang lesen" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'support-anhaenge' AND (
      ((storage.foldername(name))[1] = auth.uid()::text AND support_ticket_gehoert_mir((storage.foldername(name))[2]))
      OR ist_support()
    )
  );
-- Kein UPDATE/DELETE für Nutzerinnen: ein Anhang bleibt, wie er eingereicht wurde.
