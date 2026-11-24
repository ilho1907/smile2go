-- Rechte- und Ablauftests für 20261124_ilho_technik.sql
-- Ausführen: backend/tests/ilho-technik/run.sh  (lokales Postgres 16/17)
\set ON_ERROR_STOP on
\set QUIET on

-- Personen
\set A   '''aaaaaaaa-0000-4000-8000-000000000001'''
\set B   '''bbbbbbbb-0000-4000-8000-000000000002'''
\set CO  '''cccccccc-0000-4000-8000-000000000003'''
\set ADM '''dddddddd-0000-4000-8000-000000000004'''
\set S   '''eeeeeeee-0000-4000-8000-000000000005'''

INSERT INTO auth.users (id, email) VALUES
  (:A, 'anna@example.org'), (:B, 'berta@example.org'), (:CO, 'coachin@example.org'),
  (:ADM, 'admin@example.org'), (:S, 'support@example.org');
INSERT INTO admins VALUES (:ADM);
INSERT INTO coaches VALUES (:CO, true);

CREATE SCHEMA tst;
GRANT USAGE ON SCHEMA tst TO PUBLIC;
CREATE OR REPLACE FUNCTION tst.ok(bedingung BOOLEAN, was TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF bedingung IS NOT TRUE THEN RAISE EXCEPTION 'FEHLGESCHLAGEN: %', was; END IF;
  RAISE NOTICE 'ok  %', was;
END $$;

-- Erwarteter Fehler: führt SQL aus und verlangt, dass es scheitert.
CREATE OR REPLACE FUNCTION tst.scheitert(sql TEXT, was TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE sql;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ok  % (verweigert: %)', was, SQLERRM;
    RETURN;
  END;
  RAISE EXCEPTION 'FEHLGESCHLAGEN: % — wurde NICHT verweigert', was;
END $$;

\unset QUIET
\echo '── Vorbereitung: Admin legt Support-Team und Regel an'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"dddddddd-0000-4000-8000-000000000004"}', false) AS _ \gset
SET ROLE authenticated;
SELECT support_team_setzen('support@example.org', 'Sara (Technik)') AS s_id \gset
SELECT support_team_setzen('admin@example.org', 'ilho') AS adm_id \gset
SELECT support_regel_setzen(NULL, 'technik', NULL, :'s_id'::uuid, 10) AS regel \gset
SELECT tst.ok((SELECT count(*) FROM support_regeln_liste()) = 1, 'Regel technik → Sara angelegt');

\echo '── 1 · Nutzerin A legt Ticket an, Doppel-Senden erzeugt kein zweites'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}', false) AS _ \gset
SET ROLE authenticated;
SELECT (r->>'id') AS t1, (r->>'nummer') AS nr1, (r->>'neu') AS neu1
  FROM support_ticket_anlegen('App stürzt beim Öffnen ab', 'Seit dem Update schließt sich die App direkt nach dem Start.', 'technik', 'schluessel-0001') r \gset
SELECT (r->>'id') AS t1b, (r->>'neu') AS neu1b
  FROM support_ticket_anlegen('App stürzt beim Öffnen ab', 'Seit dem Update schließt sich die App direkt nach dem Start.', 'technik', 'schluessel-0001') r \gset
SELECT tst.ok(:'neu1' = 'true' AND :'neu1b' = 'false' AND :'t1' = :'t1b', 'gleiche Anfrage zweimal → dasselbe Ticket');
SELECT tst.ok(:'nr1' ~ '^S2G-\d{4}-\d{5}$', 'Ticketnummer ' || :'nr1');
SELECT tst.ok((SELECT count(*) FROM meine_support_tickets()) = 1, 'A hat genau ein Ticket');
SELECT tst.ok((SELECT status FROM meine_support_tickets()) = 'eingegangen', 'Status Eingegangen');
SELECT tst.scheitert($$SELECT support_ticket_anlegen('x', 'zu kurz', 'technik', 'schluessel-0002')$$, 'zu kurzer Betreff/Text');
SELECT tst.scheitert($$SELECT support_ticket_anlegen('Betreff ok', 'Beschreibung lang genug.', 'hack', 'schluessel-0003')$$, 'unbekannte Kategorie');

\echo '── 2 · Direkter Tabellenzugriff ist für Nutzerinnen gesperrt'
SELECT tst.ok((SELECT count(*) FROM support_tickets) = 0, 'A sieht über die Tabelle nichts (nur über Funktionen)');
SELECT tst.scheitert($$INSERT INTO support_tickets (nummer, user_id, rolle, anfrage_schluessel, betreff, beschreibung, kategorie_nutzerin, kategorie)
  VALUES ('X', auth.uid(), 'mitglied', 'schluessel-x', 'abc', 'abcdefghijk', 'technik', 'technik')$$, 'INSERT direkt in support_tickets');
SELECT tst.scheitert($$UPDATE support_tickets SET status = 'geloest'$$, 'UPDATE direkt');
SELECT tst.scheitert(format($$SELECT support_ki_ergebnis(%L, 'technik', 'dringend', 'x', 'm')$$, :'t1'), 'Nutzerin setzt KI-Ergebnis selbst');
SELECT tst.scheitert($$SELECT * FROM support_admin_liste()$$, 'Nutzerin öffnet Admin-Liste');
SELECT tst.scheitert($$TRUNCATE support_tickets$$, 'TRUNCATE (würde RLS umgehen)');
SELECT tst.scheitert($$DELETE FROM support_verlauf$$, 'Protokoll löschen');
SELECT tst.scheitert(format($$SELECT support_hinweis(%L, %L, 'Spam')$$, :B, :'t1'), 'interner Helfer support_hinweis');
SELECT tst.scheitert(format($$SELECT support_akteur_name(%L)$$, :B), 'interner Helfer support_akteur_name (E-Mail-Leck)');
SELECT tst.scheitert($$SELECT support_regel_finden('technik', 'hoch')$$, 'interner Helfer support_regel_finden');
SELECT tst.scheitert($$SELECT nextval('support_ticket_nr')$$, 'Ticketnummern-Sequenz');
SELECT tst.scheitert(format($$SELECT support_admin_status(%L, 'geloest')$$, :'t1'), 'Nutzerin setzt Status');

\echo '── 3 · Coachin bekommt Rolle coachin'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-000000000003"}', false) AS _ \gset
SET ROLE authenticated;
SELECT (r->>'id') AS tc FROM support_ticket_anlegen('Landingpage Bild fehlt', 'Mein Profilbild auf der Landingpage wird nicht angezeigt.', 'inhalte', 'schluessel-c001') r \gset

\echo '── 4 · KI-Routing (Service-Key): Validierung, Regel, Idempotenz'
RESET ROLE; SET ROLE service_role;
SELECT tst.scheitert(format($$SELECT support_ki_ergebnis(%L, 'admin', 'dringend', 'x', 'm')$$, :'t1'), 'KI liefert unbekannte Kategorie');
SELECT tst.scheitert(format($$SELECT support_ki_ergebnis(%L, 'technik', 'sofort', 'x', 'm')$$, :'t1'), 'KI liefert unbekannte Priorität');
SELECT (support_ki_ergebnis(:'t1', 'technik', 'hoch', 'Absturz beim Start betrifft Nutzung', 'claude-test'))->>'angewendet' AS ang1 \gset
SELECT (support_ki_ergebnis(:'t1', 'zahlung', 'dringend', 'Wiederholung', 'claude-test'))->>'angewendet' AS ang2 \gset
SELECT tst.ok(:'ang1' = 'true' AND :'ang2' = 'false', 'zweites KI-Ergebnis (Retry) wirkt nicht');
SELECT tst.ok((SELECT zustaendig::text FROM support_tickets WHERE id = :'t1') = :'s_id', 'Regel: technik → Sara');
SELECT tst.ok((SELECT kategorie || '/' || prioritaet FROM support_tickets WHERE id = :'t1') = 'technik/hoch', 'Einstufung übernommen');
SELECT tst.ok((SELECT NOT manuell_pruefen FROM support_tickets WHERE id = :'t1'), 'nicht in Admin-Queue');
SELECT tst.ok((SELECT count(*) FROM support_verlauf WHERE ticket_id = :'t1' AND aktion = 'zuweisung') = 1, 'genau eine Zuweisung trotz Retry');
-- Kategorie ohne Regel → Admin-Queue
SELECT support_ki_ergebnis(:'tc', 'inhalte', 'normal', 'Darstellung Landingpage', 'claude-test') AS _ \gset
SELECT tst.ok((SELECT zustaendig IS NULL AND manuell_pruefen FROM support_tickets WHERE id = :'tc'), 'ohne passende Regel → Admin-Queue');
SELECT tst.ok((SELECT rolle FROM support_tickets WHERE id = :'tc') = 'coachin', 'Rolle coachin serverseitig ermittelt');

\echo '── 5 · KI-Fehler: Ticket bleibt, landet in manueller Prüfung'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}', false) AS _ \gset
SET ROLE authenticated;
SELECT (r->>'id') AS t2 FROM support_ticket_anlegen('Abbuchung doppelt', 'Mir wurde die Mitgliedschaft zweimal abgebucht, bitte prüfen.', 'zahlung', 'schluessel-0004') r \gset
RESET ROLE; SET ROLE service_role;
SELECT support_ki_fehlschlag(:'t2', 'Zeitüberschreitung nach 12000 ms') AS f1 \gset
SELECT support_ki_fehlschlag(:'t2', 'nochmal') AS f2 \gset
SELECT tst.ok(:'f1' = 't' AND :'f2' = 'f', 'Fehler wird einmal protokolliert');
SELECT tst.ok((SELECT ki_status = 'fehler' AND manuell_pruefen AND zustaendig IS NULL FROM support_tickets WHERE id = :'t2'), 'Ticket gespeichert, manuelle Prüfung');
SELECT tst.ok((SELECT support_ki_ergebnis(:'t2', 'zahlung', 'hoch', 'spät', 'm')->>'angewendet') = 'false', 'verspätetes KI-Ergebnis überschreibt Fehlerstatus nicht');

\echo '── 6 · Support-Team: Liste, Filter, Antwort, interne Notiz, Status'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-4000-8000-000000000005"}', false) AS _ \gset
SET ROLE authenticated;
SELECT tst.ok((SELECT count(*) FROM support_admin_liste()) = 3, 'Sara (Support, kein Admin) sieht alle 3 Tickets');
SELECT tst.ok((SELECT count(*) FROM support_admin_liste(p_nur_manuell => true)) = 2, 'manuelle Queue: 2');
SELECT tst.ok((SELECT count(*) FROM support_admin_liste(p_zustaendig => 'ich')) = 1, 'Filter „mir zugewiesen“');
SELECT tst.ok((SELECT count(*) FROM support_admin_liste(p_kategorie => 'zahlung')) = 1, 'Filter Kategorie');
SELECT tst.ok((SELECT count(*) FROM support_admin_liste(p_prioritaet => 'hoch')) = 1, 'Filter Priorität');
SELECT tst.ok((SELECT count(*) FROM support_admin_liste(p_suche => 'abgebucht')) = 1, 'Volltextsuche');
SELECT tst.ok((SELECT count(*) FROM support_admin_liste(p_von => current_date, p_bis => current_date)) = 3, 'Datumsfilter');
SELECT tst.ok((SELECT count(*) FROM support_admin_liste(p_status => 'geloest')) = 0, 'Statusfilter');
SELECT support_admin_antworten(:'t1', 'INTERN: Crash-Log zeigt iOS 18 WebKit-Fehler', true, 'n-intern-01') AS _ \gset
SELECT support_admin_antworten(:'t1', 'Danke! Welche iOS-Version nutzt du?', false, 'n-oeff-01', 'warten') AS m1 \gset
SELECT support_admin_antworten(:'t1', 'Danke! Welche iOS-Version nutzt du?', false, 'n-oeff-01', 'warten') AS m1b \gset
SELECT tst.ok(:'m1' = :'m1b', 'Admin-Antwort doppelt gesendet → eine Nachricht');
SELECT tst.scheitert($$SELECT support_team_setzen('berta@example.org', 'Berta')$$, 'Support (kein Admin) ernennt Teammitglied');
SELECT tst.scheitert(format($$SELECT support_regel_setzen(NULL, 'zahlung', NULL, %L, 1)$$, :'s_id'), 'Support (kein Admin) ändert Regeln');

\echo '── 7 · Nutzerin sieht Antwort + Status, aber keine internen Daten'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}', false) AS _ \gset
SET ROLE authenticated;
SELECT tst.ok(support_ungelesen() >= 1, 'In-App-Hinweis für A vorhanden');
SELECT mein_support_ticket(:'t1')::text AS sicht \gset
SELECT tst.ok(position('INTERN' in :'sicht') = 0, 'interne Notiz unsichtbar');
SELECT tst.ok(position('Absturz beim Start' in :'sicht') = 0, 'KI-Begründung unsichtbar');
SELECT tst.ok(position('Sara' in :'sicht') = 0 AND position('zustaendig' in :'sicht') = 0, 'Zuweisung unsichtbar');
SELECT tst.ok(position('Welche iOS-Version' in :'sicht') > 0, 'öffentliche Antwort sichtbar');
SELECT tst.ok((mein_support_ticket(:'t1')->'ticket'->>'status') = 'warten', 'Status Warten auf Rückmeldung');
SELECT tst.ok(support_ungelesen() = 0, 'Hinweise nach Öffnen gelesen');
SELECT support_antworten(:'t1', 'iOS 18.1 auf iPhone 13', 'u-antw-01') AS u1 \gset
SELECT support_antworten(:'t1', 'iOS 18.1 auf iPhone 13', 'u-antw-01') AS u1b \gset
SELECT tst.ok(:'u1' = :'u1b', 'Antwort doppelt gesendet → eine Nachricht');
SELECT tst.ok((mein_support_ticket(:'t1')->'ticket'->>'status') = 'in_bearbeitung', 'Antwort setzt wieder In Bearbeitung');
SELECT tst.ok(jsonb_array_length(mein_support_ticket(:'t1')->'verlauf') = 3, 'Status-Verlauf: erstellt, warten, in Bearbeitung');

\echo '── 8 · Fremde Tickets sind tabu'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}', false) AS _ \gset
SET ROLE authenticated;
SELECT tst.scheitert(format($$SELECT mein_support_ticket(%L)$$, :'t1'), 'B liest Ticket von A');
SELECT tst.scheitert(format($$SELECT support_antworten(%L, 'hallo', 'b-antw-001')$$, :'t1'), 'B antwortet in Ticket von A');
SELECT tst.ok((SELECT count(*) FROM meine_support_tickets()) = 0, 'B sieht keine fremden Tickets in ihrer Liste');
SELECT tst.ok((SELECT count(*) FROM support_benachrichtigungen) = 0, 'B sieht keine fremden Hinweise');

\echo '── 9 · Anhänge: Hochladen, Lesen, Typprüfung'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}', false) AS _ \gset
SET ROLE authenticated;
INSERT INTO storage.objects (bucket_id, name, metadata)
  VALUES ('support-anhaenge', :A || '/' || :'t1' || '/bild1.png', '{"mimetype":"image/png","size":20480}');
SELECT support_anhang_registrieren(:'t1', :A || '/' || :'t1' || '/bild1.png', 'screenshot.png') AS anh1 \gset
SELECT support_anhang_registrieren(:'t1', :A || '/' || :'t1' || '/bild1.png', 'screenshot.png') AS anh1b \gset
SELECT tst.ok(:'anh1' = :'anh1b', 'Anhang doppelt registriert → ein Eintrag');
INSERT INTO storage.objects (bucket_id, name, metadata)
  VALUES ('support-anhaenge', :A || '/' || :'t1' || '/virus.pdf', '{"mimetype":"application/pdf","size":2048}');
SELECT tst.ok(support_anhang_registrieren(:'t1', :A || '/' || :'t1' || '/virus.pdf', 'x.pdf') IS NULL, 'PDF statt Bild abgelehnt');
INSERT INTO storage.objects (bucket_id, name, metadata)
  VALUES ('support-anhaenge', :A || '/' || :'t1' || '/riesig.png', '{"mimetype":"image/png","size":9000000}');
SELECT tst.ok(support_anhang_registrieren(:'t1', :A || '/' || :'t1' || '/riesig.png', 'r.png') IS NULL, 'Bild größer als 5 MB abgelehnt');
SELECT tst.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'support-anhaenge') = 1, 'abgelehnte Dateien wurden entfernt; A sieht nur ihr Bild');
SELECT tst.ok(jsonb_array_length(mein_support_ticket(:'t1')->'anhaenge') = 1, 'Anhang im eigenen Ticket sichtbar');

RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}', false) AS _ \gset
SET ROLE authenticated;
SELECT tst.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'support-anhaenge') = 0, 'B kann As Screenshot nicht lesen/herunterladen');
SELECT tst.scheitert(format($$INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ('support-anhaenge', %L, '{"mimetype":"image/png","size":1}')$$,
                                :A || '/' || :'t1' || '/fremd.png'), 'B lädt in As Ordner hoch');
SELECT tst.scheitert(format($$INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ('support-anhaenge', %L, '{"mimetype":"image/png","size":1}')$$,
                                :B || '/' || :'t1' || '/fremd.png'), 'B lädt zu As Ticket in eigenen Ordner hoch');
SELECT tst.scheitert(format($$SELECT support_anhang_registrieren(%L, %L, 'x.png')$$, :'t1', :A || '/' || :'t1' || '/bild1.png'), 'B registriert As Anhang');

RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-4000-8000-000000000005"}', false) AS _ \gset
SET ROLE authenticated;
SELECT tst.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'support-anhaenge') = 1, 'Support-Team darf Screenshot öffnen');

\echo '── 10 · Admin überschreibt KI, weist zu, Protokoll mit Akteur'
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"dddddddd-0000-4000-8000-000000000004"}', false) AS _ \gset
SET ROLE authenticated;
SELECT support_admin_einstufen(:'t1', 'konto', 'dringend') AS _ \gset
SELECT support_admin_zuweisen(:'t2', :'adm_id'::uuid) AS _ \gset
SELECT support_admin_zuweisen(:'t2', :'adm_id'::uuid) AS _ \gset
SELECT tst.ok((support_admin_ticket(:'t1')->'ticket'->>'ki_status') = 'ueberschrieben', 'KI-Entscheidung überschrieben');
SELECT tst.ok((SELECT count(*) FROM jsonb_array_elements(support_admin_ticket(:'t2')->'verlauf') v WHERE v->>'aktion' = 'zuweisung') = 1, 'doppelte Zuweisung → ein Eintrag');
SELECT tst.ok((SELECT bool_and(v->>'akteur' = 'ilho' AND v->>'created_at' IS NOT NULL)
                     FROM jsonb_array_elements(support_admin_ticket(:'t2')->'verlauf') v WHERE v->>'aktion' = 'zuweisung'), 'Zuweisung mit Akteur und Zeit');
SELECT tst.ok((SELECT NOT manuell_pruefen FROM support_tickets WHERE id = :'t2'), 'zugewiesen → raus aus Admin-Queue');
SELECT tst.ok((SELECT count(*) FROM jsonb_array_elements(support_admin_ticket(:'t1')->'nachrichten') n WHERE (n->>'intern')::boolean) = 1, 'Team sieht interne Notiz');
SELECT support_admin_status(:'t1', 'geloest') AS _ \gset
SELECT tst.scheitert(format($$SELECT support_admin_status(%L, 'geschlossen')$$, :'t1'), 'unbekannter Status');
SELECT tst.scheitert(format($$SELECT support_admin_zuweisen(%L, %L)$$, :'t1', :B), 'Zuweisung an Nicht-Team');

\echo '── 11 · Anonym geht nichts; Limit 10 Tickets/24 h'
RESET ROLE; SELECT set_config('request.jwt.claims', '{}', false) AS _ \gset
SET ROLE anon;
SELECT tst.scheitert($$SELECT support_ticket_anlegen('Betreff ok', 'Beschreibung lang genug.', 'technik', 'anon-000001')$$, 'anonymes Ticket');
SELECT tst.scheitert($$SELECT count(*) FROM support_tickets$$, 'anonymer Tabellenzugriff');
RESET ROLE; SELECT set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}', false) AS _ \gset
SET ROLE authenticated;
SELECT count(*) AS _ FROM generate_series(1, 10) i, LATERAL support_ticket_anlegen('Testfrage ' || i, 'Eine ausreichend lange Beschreibung.', 'sonstiges', 'limit-schl-' || i) \gset
SELECT tst.scheitert($$SELECT support_ticket_anlegen('Elfte Frage', 'Eine ausreichend lange Beschreibung.', 'sonstiges', 'limit-schl-11')$$, '11. Ticket in 24 h');

RESET ROLE;
\echo '── Alle Tests bestanden'
