# Projektstatus

Stand: 17.11.2026 · Branch: `claude/phase-0-1-public-website` (basiert auf `main` @ `cc3c766`) · **nicht gemergt, nicht deployt**

Status-Begriffe (QA-Plan 02): **umgesetzt** = Code im Branch · **getestet** = automatisierter Test mit echter Ausgabe (siehe `TEST_PLAN.md`) · **teilweise** · **offen** · **blockiert** (Entscheidung/Zugang fehlt) · **unbekannt**.

## Phase-0-Abgabe (Masterplan 14, Format A–F)

**A. Geprüfte Bestandteile**
- Repo `github.com/ilho1907/smile2go`, `main` @ `cc3c766d3e32435f9f44db81e84c8ad7040d0556` (17.11.2026 03:52). `main` ist die kanonische Version (Vercel deployt `main`). Daneben existieren **17 weitere Branches**; 11 davon haben laut GitHub-Vergleich Commits, die nicht per SHA in `main` liegen (z. B. `claude/entdecken-karussell` 8 vor, `claude/agency-agents-setup-ezcxn3` 6 vor). Ein Teil davon ist vermutlich per Squash-Merge bereits übernommen – **nicht einzeln geprüft**. Kein Branch wurde gelöscht oder verändert.
- `app/` (Vite-PWA, live auf `smile2go-app.vercel.app`, Vercel-Projekt `smile2go`, SSO-Schutz für Preview-Deployments aktiv), `backend/supabase/` (24 Migrationen, 6 Edge Functions), `automation/` (2 n8n-Workflows), Strategie-/Rechtsdokumente im Repo-Stamm.
- Webflow-Site `6a35c9e9d92d89baa9218135` (33 Seiten, davon 2 Entwürfe) – nur Seitenliste abgerufen, **Inhalte nicht geprüft**.
- Claude-Projekt-Docs „Frauen Unterstützen Frauen“ (Konzept Verifizierung/Badges/Sitemap) und „PROGRESS-my-office“.
- **Fehlend/nicht zugänglich:** lokaler Projektordner auf dem Mac (kein Ordner für diese Sitzung freigegeben; laut `AUFGABEN-claude.md` liegt eine Kopie unter `~/Downloads/smile2go-projekt`), Supabase-Projekt selbst (kein Zugriff in dieser Sitzung → ob alle Migrationen angewendet sind, ist unbekannt), Stripe/Zoom-Konten (existieren laut Repo nicht).

**B. Gap-Liste** → Tabelle unten und `DATABASE_SCHEMA.md`.
**C. Architekturdiagramm und Rollenmatrix** → `ARCHITECTURE.md`, `UMSETZUNGSPLAN.md`.
**D. Sitemap und Design-System** → `web/` (Sitemap unten); Design-Tokens 1:1 aus der App-Palette `C`, Schriften Fraunces + Inter.
**E. Lauffähige Website + Community-beitreten-Seite** → `web/`, siehe Phase 1.
**F. Befehle, Ergebnisse, Blocker** → `TEST_PLAN.md`, Abschnitte „Offen“ und „Risiken“ unten.

## Anforderungen ↔ Umsetzung

| Anforderung (Quelle) | Status | Nachweis / Bemerkung |
|---|---|---|
| Startseite mit Hero „Gemeinsam statt einsam“ + 2 CTAs (MP 02) | **getestet** | `web/index.html`, Smoke + E2E |
| Mission, „Was dich erwartet“, Expertinnen, Einblicke, FAQ, Footer, mobile Dauer-CTA (MP 02) | **getestet** | Bereiche ohne Produkt sind mit „Bald“ markiert |
| Kurse/Events/Retreats „mit echten Bildern und Preisen“ (MP 02) | **offen** | Keine Preise/Termine vorhanden → bewusst nicht erfunden |
| Nur echte Bewertungen mit Nutzungsrechten (MP 02) | **eingehalten** | Keine Bewertungen gezeigt; „Einblicke“ = eigene Markenbilder |
| Community entdecken als eigene Seite (MP 02, QA G1) | **getestet** | `web/community-entdecken.html` |
| Community beitreten als eigene Landingpage: Mitglied, Expertin, Login, Paketvergleich, FAQ, Consent (MP 02) | **getestet** | Pakete als „Entwurf“ ohne Preis (Tarife offen) |
| Onboarding-Ablauf Mitglied (MP 02) | **teilweise** | Ablauf erklärt + Vormerk-Formular im Demo-Modus; echte Registrierung = Phase 2 |
| Für Expertinnen: Vorteile, Prüfprozess, Bewerbung, Bedingungen (MP 02/05) | **getestet** | Formular im Demo-Modus, Hinweis „keine automatische Freigabe“ |
| Verzeichnis nur freigegebener Expertinnen (MP 02) | **getestet** | `web/src/data/expertinnen.js`, aktuell leer |
| Unsere Community, Kurse & Workshops, Live & Events, Retreats, Videos, Shop, Über uns, Kontakt als eigene Seiten (MP 02) | **offen** | In Phase 1 als Abschnitte/Anker auf „Community entdecken“; eigene Seiten nach ADR-001 |
| Impressum, Datenschutz, AGB, Widerruf (MP 02) | **teilweise** | Platzhalter-Entwürfe, rechtlich **nicht** geprüft |
| Responsive, lokal in Chrome testbar (Auftrag) | **getestet** | Desktop + Pixel 7, kein horizontales Scrollen |
| A11y-Smoke (MP 13 Gate 1) | **getestet** | axe AA: 0 serious/critical |
| SEO-Grundlagen (MP 13 Gate 1) | **teilweise** | Titel, Description, OG, lang, H1 ✓; Canonical/Sitemap.xml fehlen (Domain offen); `noindex` aktiv bis Freigabe |
| Rollen & Zugriff (MP 03) | **offen** | Bestand: `coaches`/`admins`; Ziel in `ARCHITECTURE.md` |
| Mitgliederbereich (MP 04) | **teilweise (Bestand)** | Viele Module in `app/` vorhanden; Kurse/Käufe/Entitlements fehlen |
| Expertin-Aufnahme/Dashboard (MP 05) | **offen** | Coach-Panel existiert; Bewerbungs-/Prüfprozess fehlt |
| Produkte, Checkout, Stripe Connect (MP 06) | **offen** | Nichts angelegt, keine Zahlungsdienste aktiviert |
| Live → Replay → Kurs (MP 07) | **offen** | – |
| AI Matching (MP 08) | **offen** | Filterlogik-Notiz in `PLATTFORM-coach-matching.md` (enthält Beispiel-Coachs mit Bewertungen – **nicht** verwenden, nicht verifiziert) |
| Lichtpunkte-Ledger (MP 09) | **offen / Abweichung** | Punkte liegen heute clientseitig im `app_state`-JSON |
| Pflichtdokumente (MP 14) | **umgesetzt** | `doku/plattform/*`, `web/.env.example`, `README.md` |

## Phase-0-Review-Checkliste (QA 10)
- [x] Canonical Repo und Commit-ID benannt
- [~] Webflow-Assets inventarisiert (nur Seitenliste, keine Inhalte/Assets)
- [x] Keine bestehenden Features entfernt (`git status`: nur neue Dateien; `app/` baut unverändert)
- [x] Sitemap enthält „Community entdecken“ und „Community beitreten“ separat
- [x] Rollen und Approval-Grenzen definiert (`ARCHITECTURE.md`)
- [x] Produkt-/Entitlement-/Payment-Zustände formalisiert (`UMSETZUNGSPLAN.md` Phase 4)
- [~] DSGVO-Datenfluss + Providerliste (Website ja; Plattform als Checkliste)
- [x] E2E-Vorgehen mit Testumgebung vorhanden (Playwright)
- [x] Phase 1 als kleines lauffähiges Inkrement
- [x] Offene Entscheidungen dokumentiert

## Sitemap `web/` (Phase 1)
`/` · `/community-entdecken.html` (Anker: `#community #lernen #live #lichtpunkte #medien #shop #retreats #regeln`) · `/community-beitreten.html` (`#mitglied`) · `/fuer-expertinnen.html` (`#pruefung #bewerbung`) · `/impressum.html` · `/datenschutz.html` · `/agb-widerruf.html` · `/404.html`

## Offene Punkte / Blocker
1. **ADR-001** Webflow oder `web/` als öffentliche Website – Entscheidung ilho.
2. **ADR-010** Kein Next.js-Neubau – Bestätigung ilho.
3. Impressum/Datenschutz-Daten der Betreiberin fehlen.
4. Tarife, Preise, Provision, Merchant of Record (Masterplan 15).
5. Supabase-Zugang für Phase 2 (Migration `coach_codes` ausstehend laut `AUFGABEN-claude.md`).
6. Kein Zugriff auf den Mac in dieser Sitzung → lokale Ausführung auf dem Mac **nicht** durch mich verifiziert.

## Risiken
- 17 Nebenbranches, teils mit nicht übernommenen Commits: Gefahr paralleler Stände. Empfehlung: einmal gemeinsam sichten, Übernommenes schließen.
- Öffentliches Repo enthält interne Strategie-/Rechtsnotizen und Supabase-Metadaten (`backend/supabase/.temp`).
- Zwei Websites (Webflow + `web/`) können auseinanderlaufen, solange ADR-001 offen ist.
- Pull Request erzeugt automatisch ein Vercel-**Preview** der App (nicht der Website); Preview ist durch Vercel-SSO geschützt. Ein Merge in `main` würde die App neu deployen (inhaltlich unverändert).
- Dev-Abhängigkeit esbuild ≤ 0.24.2 (moderate, nur Dev-Server). Dev-Server nicht im offenen Netz betreiben.

## Rollback
Branch nicht mergen bzw. PR schließen. Alle Änderungen sind neue Dateien (`web/`, `doku/plattform/`, `README.md`); bestehende Dateien wurden nicht verändert.

## Nächste Schritte
1. ilho prüft die Website lokal und entscheidet ADR-001/010.
2. Phase 2: Migration Rollen/Einwilligungen/Audit + RLS-Negativtests gegen lokale Postgres; danach Edge Function für „Platz vormerken“ mit Double-Opt-in.
3. Phase 3: Bewerbungsportal und Admin-Prüfliste.
