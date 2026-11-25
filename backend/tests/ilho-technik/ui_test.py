"""Oberflächentest Hilfe & Support (ilho-technik) — echte App im Browser gegen
fake_supabase.ts (echte Migration in Postgres, echte Edge Function, simuliertes Claude).

Voraussetzungen (siehe README.md im selben Ordner):
  - Datenbank ilho_technik_test mit stubs.sql + Migration + ui_seed.sql
  - fake_supabase.ts läuft auf :54321
  - Vite läuft auf :5173 mit VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=anon
Ausführen: python3 ui_test.py [Ausgabeordner für Screenshots]
"""
import json, os, subprocess, sys, struct, zlib, urllib.request
from playwright.sync_api import sync_playwright, expect

AUS = sys.argv[1] if len(sys.argv) > 1 else "/tmp/ui"
os.makedirs(AUS, exist_ok=True)
APP = "http://localhost:5173"
FAKE = "http://localhost:54321"
ergebnisse = []

def ok(bed, was):
    ergebnisse.append((bool(bed), was))
    print(("ok   " if bed else "FEHL ") + was)

def sql(q):
    env = {**os.environ, "PGHOST": "/tmp/pg", "PGPORT": "5433", "PGUSER": "postgres"}
    return subprocess.run(["psql", "-At", "-d", "ilho_technik_test", "-c", q], capture_output=True, text=True, env=env).stdout.strip()

def token(email):
    return json.load(urllib.request.urlopen(f"{FAKE}/__test/token?email={email}"))

def ki(modus):
    urllib.request.urlopen(urllib.request.Request(f"{FAKE}/__test/ki", data=json.dumps({"modus": modus}).encode(), method="POST"))

def png(pfad):
    # kleines echtes PNG (64×40, rosa) als „Screenshot“
    w, h = 64, 40
    roh = b"".join(b"\x00" + bytes([233, 154, 176]) * w for _ in range(h))
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    with open(pfad, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(roh)) + chunk(b"IEND", b""))
    return pfad

def kontext(b, email, mobil=True):
    ctx = b.new_context(viewport={"width": 390, "height": 844} if mobil else {"width": 1280, "height": 900})
    ctx.add_init_script(f"localStorage.setItem('sb-localhost-auth-token', JSON.stringify({json.dumps(token(email))}));")
    return ctx

def zu_support(pg):
    pg.goto(APP + "/"); pg.wait_for_timeout(2500)
    pg.get_by_text("Mehr", exact=True).last.click(); pg.wait_for_timeout(800)
    pg.get_by_text("Konto", exact=True).first.click(); pg.wait_for_timeout(400)
    pg.get_by_text("Hilfe & Support", exact=True).first.click(); pg.wait_for_timeout(1200)

with sync_playwright() as p:
    b = p.chromium.launch()

    # ── 1 · Anna legt über die Oberfläche ein Ticket an (Doppelklick, Screenshot) ──
    anna = kontext(b, "anna@example.org").new_page()
    zu_support(anna)
    anna.screenshot(path=f"{AUS}/10_anna_support_leer.png")
    ok(anna.get_by_text("Du hast noch keine Anfrage gestellt.").is_visible(), "Hilfe & Support im Menü der Mitglieder-App erreichbar")
    anna.get_by_text("+ Neue Anfrage").click()
    anna.get_by_role("radio", name="Technisches Problem").click()
    anna.fill("#sup-betreff", "App schließt sich nach dem Login")
    anna.fill("#sup-text", "Seit heute schließt sich die App direkt nach dem Anmelden. iPhone, aktuelle Version.")
    anna.set_input_files("input[type=file]", png(f"{AUS}/screenshot.png"))
    anna.screenshot(path=f"{AUS}/11_anna_formular.png", full_page=True)
    knopf = anna.get_by_role("button", name="Anfrage senden")
    knopf.dblclick()                         # absichtlich doppelt
    anna.get_by_text("Danke! Deine Anfrage ist eingegangen.").wait_for(timeout=8000)
    nummer = anna.locator("b").first.inner_text()
    anna.screenshot(path=f"{AUS}/12_anna_bestaetigung.png", full_page=True)
    ok(nummer.startswith("S2G-"), f"Bestätigung mit Ticketnummer {nummer}")
    ok(sql("SELECT count(*) FROM support_tickets WHERE betreff = 'App schließt sich nach dem Login'") == "1", "Doppelklick → genau ein Ticket in der Datenbank")
    tid = sql(f"SELECT id FROM support_tickets WHERE nummer = '{nummer}'")
    ok(sql(f"SELECT ki_status || '/' || kategorie || '/' || prioritaet || '/' || (zustaendig IS NOT NULL) FROM support_tickets WHERE id = '{tid}'") == "ok/technik/hoch/true",
       "KI-Einstufung technik/hoch, per Regel an Sara zugewiesen")
    ok(sql(f"SELECT count(*) FROM support_anhaenge WHERE ticket_id = '{tid}'") == "1", "Screenshot gespeichert und registriert")
    ok(anna.get_by_text("Eingegangen").first.is_visible(), "Status „Eingegangen“ sichtbar")
    ok(anna.locator("img[alt='screenshot.png']").count() == 1, "eigener Screenshot wird angezeigt")

    # ── 2 · Seite neu laden: alles noch da ──
    zu_support(anna)
    ok(anna.get_by_text("App schließt sich nach dem Login").is_visible(), "nach Neuladen: Ticket in der Liste")
    anna.screenshot(path=f"{AUS}/13_anna_liste_nach_reload.png")

    # ── 3 · Admin: Liste, Filter, interne Notiz, Antwort mit Status ──
    adm = kontext(b, "admin@example.org", mobil=False).new_page()
    adm.goto(APP + "/admin"); adm.wait_for_timeout(2500)
    adm.get_by_role("button", name="Support-Tickets").first.click(); adm.wait_for_timeout(1500)
    ok(adm.get_by_text(nummer).first.is_visible(), "Ticket erscheint im Admin-Panel")
    adm.get_by_label("Kategorie", exact=True).select_option("zahlung"); adm.wait_for_timeout(800)
    ok(adm.get_by_text("Keine Tickets für diesen Filter.").is_visible(), "Filter Kategorie=Zahlung blendet das Ticket aus")
    adm.get_by_label("Kategorie", exact=True).select_option(""); adm.wait_for_timeout(800)
    adm.get_by_placeholder("Suche: Nummer, Betreff, Text, E-Mail").fill("iPhone"); adm.wait_for_timeout(1200)
    ok(adm.get_by_text(nummer).first.is_visible(), "Volltextsuche findet das Ticket")
    adm.get_by_text("App schließt sich nach dem Login").first.click(); adm.wait_for_timeout(1200)
    ok(adm.get_by_text("App-Start schlägt fehl, Nutzung blockiert.", exact=False).is_visible(), "KI-Begründung fürs Team sichtbar")
    adm.get_by_label("Interne Notiz").check()
    adm.get_by_placeholder("Interne Notiz — nur für das Support-Team sichtbar").fill("INTERN: vermutlich WebKit-Fehler, an Entwicklung")
    adm.get_by_role("button", name="Notiz speichern").click(); adm.wait_for_timeout(1000)
    adm.get_by_label("Interne Notiz").uncheck()
    adm.get_by_placeholder("Antwort an die Nutzerin …").fill("Danke für deine Meldung! Welche iOS-Version nutzt du?")
    adm.get_by_label("Status nach dem Senden").select_option("warten")
    adm.get_by_role("button", name="Antwort senden").click(); adm.wait_for_timeout(1200)
    adm.get_by_label("Zuständig ändern").select_option(label="ilho"); adm.wait_for_timeout(1000)
    adm.get_by_text("Protokoll").click(); adm.wait_for_timeout(300)
    adm.screenshot(path=f"{AUS}/20_admin_ticket.png", full_page=True)
    ok(sql(f"SELECT status FROM support_tickets WHERE id = '{tid}'") == "warten", "Admin-Antwort setzt Status „Warten auf Rückmeldung“")
    ok(sql(f"SELECT count(*) FROM support_verlauf WHERE ticket_id = '{tid}' AND aktion = 'zuweisung' AND akteur = 'ilho' AND akteur_id IS NOT NULL") == "1",
       "Zuweisung mit handelnder Person + Zeit protokolliert")
    ok(adm.get_by_text("Sara (Technik) → ilho").is_visible(), "Protokoll im Panel: Sara → ilho")

    # ── 4 · Anna: sieht Antwort + Status, nicht die interne Notiz; antwortet ──
    zu_support(anna)
    anna.get_by_text("App schließt sich nach dem Login").click(); anna.wait_for_timeout(1500)
    ok(anna.get_by_text("Welche iOS-Version nutzt du?").is_visible(), "Nutzerin sieht Admin-Antwort")
    ok(anna.get_by_text("INTERN").count() == 0 and "WebKit" not in anna.content(), "interne Notiz für Nutzerin unsichtbar")
    ok("App-Start schlägt fehl" not in anna.content() and "Sara" not in anna.content(), "KI-Begründung und Zuständige unsichtbar")
    ok(anna.get_by_text("Warten auf Rückmeldung").first.is_visible(), "Status „Warten auf Rückmeldung“ für Nutzerin")
    anna.fill("#sup-antwort", "iOS 18.1 auf einem iPhone 13.")
    anna.get_by_role("button", name="Senden", exact=True).dblclick(); anna.wait_for_timeout(1500)
    ok(sql(f"SELECT count(*) FROM support_nachrichten WHERE ticket_id = '{tid}' AND von = 'nutzerin'") == "1", "Antwort doppelt getippt → eine Nachricht")
    anna.reload(); anna.wait_for_timeout(2000); zu_support(anna)
    anna.get_by_text("App schließt sich nach dem Login").click(); anna.wait_for_timeout(1500)
    ok(anna.get_by_text("iOS 18.1 auf einem iPhone 13.").is_visible(), "nach Neuladen: eigene Antwort noch da")
    ok(anna.get_by_text("In Bearbeitung").first.is_visible(), "Antwort setzt Status zurück auf „In Bearbeitung“")
    anna.screenshot(path=f"{AUS}/14_anna_ticket_verlauf.png", full_page=True)

    adm.reload(); adm.wait_for_timeout(2000)
    adm.get_by_role("button", name="Support-Tickets").first.click(); adm.wait_for_timeout(1200)
    adm.get_by_text("App schließt sich nach dem Login").first.click(); adm.wait_for_timeout(1200)
    ok(adm.get_by_text("iOS 18.1 auf einem iPhone 13.").is_visible(), "Admin sieht Antwort der Nutzerin nach Neuladen")

    # ── 5 · Berta: kein Zugriff auf Annas Ticket und Screenshot ──
    berta_ctx = kontext(b, "berta@example.org")
    berta = berta_ctx.new_page()
    berta.goto(f"{APP}/?support={tid}"); berta.wait_for_timeout(3000)
    ok(berta.get_by_text("Diese Anfrage ist nicht verfügbar.").is_visible(), "Berta öffnet Annas Ticket-Link → nicht verfügbar")
    ok("App schließt sich" not in berta.content(), "kein Inhalt von Annas Ticket bei Berta")
    pfad = sql(f"SELECT pfad FROM support_anhaenge WHERE ticket_id = '{tid}'")
    status = berta.evaluate("""async ([pfad, tok]) => {
      const r = await fetch('http://localhost:54321/storage/v1/object/sign/support-anhaenge/' + pfad, {
        method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }) });
      return r.status; }""", [pfad, token("berta@example.org")["access_token"]])
    ok(status >= 400, f"Berta bekommt keinen Download-Link für Annas Screenshot (HTTP {status})")
    berta.screenshot(path=f"{AUS}/30_berta_kein_zugriff.png")

    # ── 6 · KI hängt → Ticket trotzdem gespeichert, manuelle Prüfung ──
    ki("haengt")
    zu_support(anna)
    anna.get_by_text("+ Neue Anfrage").click()
    anna.get_by_role("radio", name="Zahlung & Mitgliedschaft").click()
    anna.fill("#sup-betreff", "Mitgliedschaft doppelt abgebucht")
    anna.fill("#sup-text", "Im November wurde mein Beitrag zweimal von meinem Konto abgebucht.")
    anna.get_by_role("button", name="Anfrage senden").click()
    anna.get_by_text("Danke! Deine Anfrage ist eingegangen.").wait_for(timeout=10000)
    ok(True, "KI-Zeitüberschreitung: Nutzerin bekommt trotzdem Bestätigung")
    ok(sql("SELECT ki_status || '/' || manuell_pruefen || '/' || (zustaendig IS NULL) FROM support_tickets WHERE betreff = 'Mitgliedschaft doppelt abgebucht'") == "fehler/true/true",
       "Ticket gespeichert, KI-Fehler, Admin-Queue")
    ki("ok")
    adm.reload(); adm.wait_for_timeout(2000)
    adm.get_by_role("button", name="Support-Tickets").first.click(); adm.wait_for_timeout(1200)
    adm.get_by_label("Nur manuelle Prüfung").check(); adm.wait_for_timeout(1000)
    ok(adm.get_by_text("Mitgliedschaft doppelt abgebucht").first.is_visible() and adm.get_by_text("KI-Fehler").first.is_visible(), "Admin sieht KI-Fehler-Ticket in der manuellen Queue")
    adm.get_by_text("Mitgliedschaft doppelt abgebucht").first.click(); adm.wait_for_timeout(1000)
    adm.get_by_label("Priorität ändern").select_option("dringend")
    adm.get_by_role("button", name="Einstufung übernehmen").click(); adm.wait_for_timeout(1000)
    ok(sql("SELECT prioritaet || '/' || ki_status FROM support_tickets WHERE betreff = 'Mitgliedschaft doppelt abgebucht'") == "dringend/fehler", "Admin stuft manuell auf Dringend")
    adm.screenshot(path=f"{AUS}/21_admin_manuell.png", full_page=True)

    # ── 7 · Menü-Hinweis bei neuer Antwort ──
    adm.get_by_placeholder("Antwort an die Nutzerin …").fill("Wir prüfen die Abbuchung.")
    adm.get_by_role("button", name="Antwort senden").click(); adm.wait_for_timeout(1000)
    anna.goto(APP + "/"); anna.wait_for_timeout(2500)
    anna.get_by_text("Mehr", exact=True).last.click(); anna.wait_for_timeout(800)
    anna.get_by_text("Konto", exact=True).first.click(); anna.wait_for_timeout(1200)
    ok(anna.get_by_text("Neuigkeiten vom Support", exact=False).is_visible() or anna.get_by_text("Neuigkeit vom Support", exact=False).is_visible(), "In-App-Hinweis im Menü: Neuigkeiten vom Support")
    anna.screenshot(path=f"{AUS}/15_anna_menue_hinweis.png", full_page=False)

    # ── 8 · Community zeigt nichts davon ──
    ok(sql("SELECT count(*) FROM information_schema.views WHERE view_definition ILIKE '%support_%'") == "0", "keine Sicht, die Tickets veröffentlicht")

    # ── 9 · Coachin: Hilfe & Support im Coach-Panel ──
    co = kontext(b, "coachin@example.org").new_page()
    co.goto(APP + "/#coach"); co.wait_for_timeout(3000)
    tab = co.get_by_role("button", name="Hilfe & Support")
    ok(tab.count() == 1, "Coach-Panel hat Tab „Hilfe & Support“")
    if tab.count():
        tab.click(); co.wait_for_timeout(1200)
        co.get_by_text("+ Neue Anfrage").click()
        co.get_by_role("radio", name="Landingpage & Inhalte").click()
        co.fill("#sup-betreff", "Landingpage-Bild fehlt")
        co.fill("#sup-text", "Mein Profilbild auf der Landingpage wird seit gestern nicht angezeigt.")
        co.get_by_role("button", name="Anfrage senden").click()
        co.get_by_text("Danke! Deine Anfrage ist eingegangen.").wait_for(timeout=8000)
        ok(sql("SELECT rolle FROM support_tickets WHERE betreff = 'Landingpage-Bild fehlt'") == "coachin", "Ticket der Coachin mit Rolle coachin")
        co.screenshot(path=f"{AUS}/40_coach_support.png", full_page=True)

    # ── 11 · Wissensbasis: Team legt Eintrag an, gibt frei → Selbsthilfe im Formular ──
    adm.goto(APP + "/admin"); adm.wait_for_timeout(2000)
    adm.get_by_role("button", name="Support-Tickets").first.click(); adm.wait_for_timeout(1200)
    adm.get_by_text("📚 Wissensbasis", exact=False).click(); adm.wait_for_timeout(800)
    adm.get_by_placeholder("Titel (z. B. „Push kommt auf dem iPhone nicht an“)").fill("Push kommt auf dem iPhone nicht an")
    adm.get_by_placeholder("Lösung in einfachen Worten").fill("Öffne smile2go in Safari, tippe auf Teilen › Zum Home-Bildschirm und erlaube danach Mitteilungen.")
    adm.get_by_role("button", name="Als Entwurf speichern").click(); adm.wait_for_timeout(1200)
    adm.get_by_role("button", name="prüfen / bearbeiten").first.click(); adm.wait_for_timeout(500)
    adm.get_by_label("freigegeben").check(); adm.get_by_label("für Nutzerinnen (Selbsthilfe)").check()
    adm.get_by_role("button", name="Speichern", exact=True).click(); adm.wait_for_timeout(1200)
    ok(sql("SELECT freigegeben AND fuer_nutzerinnen FROM support_wissen WHERE titel = 'Push kommt auf dem iPhone nicht an'") == "t", "Eintrag über die Oberfläche angelegt und freigegeben")
    zu_support(anna)
    anna.get_by_text("+ Neue Anfrage").click()
    anna.fill("#sup-betreff", "Ich bekomme keine Push-Nachrichten")
    anna.fill("#sup-text", "Auf meinem iPhone kommen keine Benachrichtigungen an.")
    anna.wait_for_timeout(1800)
    ok(anna.get_by_text("Vielleicht hilft dir das schon:").is_visible(), "Selbsthilfe-Vorschlag erscheint beim Schreiben")
    anna.get_by_text("Push kommt auf dem iPhone nicht an").click(); anna.wait_for_timeout(300)
    ok(anna.get_by_text("Zum Home-Bildschirm", exact=False).is_visible(), "Lösung lässt sich aufklappen")
    anna.screenshot(path=f"{AUS}/16_anna_selbsthilfe.png", full_page=True)

    # ── 10 · Support-Mitarbeiterin ohne Admin-Rechte: nur der Support-Tab ──
    sara = kontext(b, "support@example.org", mobil=False).new_page()
    sara.goto(APP + "/admin"); sara.wait_for_timeout(2500)
    ok(sara.get_by_role("button", name="Support-Tickets").count() == 1 and sara.get_by_role("button", name="Mitglieder").count() == 0,
       "Support-Team (kein Admin) sieht nur „Support-Tickets“")
    ok(sara.get_by_text("Support-Team & Routing-Regeln").count() == 0, "Support-Team kann Regeln/Team nicht verwalten")
    sara.screenshot(path=f"{AUS}/22_support_mitarbeiterin.png")
    berta.goto(APP + "/admin"); berta.wait_for_timeout(2500)
    ok(berta.get_by_text("weder als Admin noch im Support-Team").is_visible(), "normales Mitglied kommt nicht ins Admin-Panel")

    b.close()

fehler = [w for g, w in ergebnisse if not g and w]
print(f"\n{sum(1 for g, w in ergebnisse if g and w)} bestanden, {len(fehler)} fehlgeschlagen")
sys.exit(1 if fehler else 0)
