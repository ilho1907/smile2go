# Changelog Plattform

## [unveröffentlicht] – Branch `claude/phase-0-1-public-website` · 17.11.2026

### Phase 0 – Bestandsaufnahme
- Inventar von Repo, Branches, Vercel-Projekt, Webflow-Seitenliste, Migrationen, Edge Functions, Secrets-Scan.
- Plattform-Dokumentation angelegt: Umsetzungsplan A–Z, Status, Architektur + Rollenmatrix, Datenbank-Abgleich, API-Verträge, Sicherheit, DSGVO-Checkliste, Testplan, ADRs.
- Neues `README.md` im Repo-Stamm (vorher keins).

### Phase 1 – Öffentliche Website `web/`
- Neu: Startseite, Community entdecken, Community beitreten, Für Expertinnen mit Bewerbungsformular, Impressum/Datenschutz/AGB als gekennzeichnete Entwürfe, 404.
- Formulare mit verständlicher Prüfung, getrennten Pflicht-/freiwilligen Einwilligungen, Honigtopf und Demo-Modus ohne Datenübertragung.
- Expertinnen-Verzeichnis zeigt nur freigegebene Profile (derzeit keine).
- Mobile Navigation, dauerhaft erreichbare „Community beitreten“-Leiste auf dem Handy.
- Tests: Smoke (318 Prüfungen) und Playwright (40 Fälle, Desktop + Mobil, inkl. axe WCAG 2.1 AA).

### Nicht geändert
- `app/`, `backend/`, `automation/`, alle bestehenden Dokumente. Keine Migration ausgeführt, kein Deploy, keine Webflow-Änderung, keine kostenpflichtigen Dienste.
