# Architekturentscheidungen (ADR)

Status-Werte: **Vorschlag** (wartet auf ilho) · **Entschieden** · **Offen** (Informationen fehlen).
Nummern ADR-001 bis 009 folgen dem QA-Kontrollplan, Abschnitt 05.

| ADR | Thema | Status | Vorschlag / Entscheidung |
|---|---|---|---|
| 001 | Öffentliche Website: Webflow vs. App-Frontend | **Vorschlag** | Siehe unten |
| 002 | Auth-Provider & Sessions | Vorschlag | Supabase Auth (bereits produktiv) beibehalten; E-Mail + Passwort mit Bestätigung, Magic Link als Fallback; Admin-MFA Pflicht (`ZweiFaktor.jsx` existiert bereits – Abdeckung prüfen) |
| 003 | Schema, Isolation, RLS, Service-Role | Vorschlag | Ein Postgres (Supabase EU), RLS auf jeder Tabelle, `service_role` nur in Edge Functions; Seller-Isolation über `owner_id`/`expert_id` + Policies, mit Negativtests nachgewiesen |
| 004 | Merchant of Record, Steuer, Stripe-Connect-Flow | **Offen** | Braucht Steuer-/Rechtsberatung (FernUSG, DAC7/PStTG). Bis dahin nur Stripe-Testmodus |
| 005 | Zoom/Live, Consent, Storage, EU-Transfer | Offen | Zoom-Lizenz und Cloud-Recording-Bedingungen ungeklärt; Storage-Anbieter nach EU-Prüfung |
| 006 | KI-Provider, DPA, Prompt-Versionen | Vorschlag | Bestehende Edge Function `ai` als einziges Gateway; Provider-Abstraktion; Prompt-Quelle bleibt `app/src/ilho.js`; Tageslimit vorhanden |
| 007 | Ledger für Punkte, Zahlungen, Provision | Vorschlag | Append-only-Tabellen mit Idempotenzschlüsseln; Korrektur nur per Gegenbuchung |
| 008 | E-Mail/Push, Opt-in | Offen | Web-Push existiert (`push`-Function); E-Mail-Anbieter + AVV fehlen |
| 009 | Observability, Backup, RPO/RTO | Offen | Supabase-Backups prüfen; Restore-Test vor Launch |
| 010 | **Keine zweite Hauptversion: bestehende Vite-App erweitern statt Next.js-Neubau** | **Vorschlag** | Siehe unten |

---

## ADR-001 · Öffentliche Website
**Kontext.** Masterplan 10 sieht Webflow für Marketing/SEO vor. Es existiert eine Webflow-Site mit 33 Seiten (u. a. Community, Coachinnen, Preise, Anmelden). Der Auftrag vom 17.11.2026 verlangt zugleich „echten, ausführbaren Code, lokal auf dem Mac testbar“.

**Vorschlag.** `web/` ist die **im Repo versionierte, getestete Referenz** für die Phase-1-Seiten (Start, Community entdecken, Community beitreten, Für Expertinnen). Zwei Wege danach – Entscheidung ilho:
- **A) `web/` wird die öffentliche Website** (eigenes Vercel-Projekt, Domain). Webflow bleibt für Blog/Magazin oder wird abgelöst. Vorteil: Formulare, Tests, Versionierung, ein Repo.
- **B) Webflow bleibt öffentlich**, `web/` dient als Vorlage; Inhalte und Struktur werden nach Webflow übertragen. Vorteil: bestehender Editor. Nachteil: Formulare/Tests außerhalb des Repos, Doppelpflege.

Bis zur Entscheidung: `web/` setzt überall `noindex` und wird nicht deployt.

## ADR-010 · Eine Hauptversion
**Kontext.** Masterplan 10 schlägt Next.js + TypeScript + Tailwind für die App vor. Bestehend: React 18 + Vite (JavaScript), ~17 700 Zeilen, live.
**Entscheidungsvorschlag.** Kein Parallel-Neubau. Neue Server-Logik (Masterplan-Endpunkte `/api/...`) entsteht als **Supabase Edge Functions in TypeScript**; neue App-Module in eigenen Dateien (`app/src/coach/`, später `app/src/marketplace/`). TypeScript schrittweise für neue Module. Next.js wird nur neu bewertet, wenn serverseitiges Rendering für öffentliche Marketplace-Seiten nötig wird.
**Folgen.** Masterplan-Stackvorschlag wird bewusst abweichend umgesetzt – im QA-Review als *dokumentierte Abweichung* zu prüfen.

## Weitere Festlegungen in Phase 1
- Schriften (Fraunces, Inter) **lokal** gebündelt statt Google Fonts (DSGVO).
- Formulare ohne Endpunkt laufen im **Demo-Modus** und sagen das offen; keine Speicherung in localStorage/Cookies.
- Expertinnen-Verzeichnis zeigt nur Einträge mit `freigegeben: true`; aktuell leer, weil keine Freigabe dokumentiert ist.
- Farbpalette 1:1 aus `app/src/App.jsx` (Palette `C`, Stand Nov. 2026: Flieder/Pflaume). Hinweis: Ältere Notizen nennen Creme/Gold/Altrosa – die App ist die aktuelle Quelle.
