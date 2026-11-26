# Smile2Go – Frauen unterstützen Frauen

Eine Hauptversion, ein Repository.

| Teil | Ordner | Start |
|---|---|---|
| Mitglieder-App (PWA, live) + Coach-Panel `#coach` + Admin `#admin` | `app/` | `cd app && npm install && npm run dev` → http://localhost:5173 |
| Öffentliche Website (Phase 1) | `web/` | `cd web && npm install && npm run dev` → http://localhost:5180 · Details: [`web/README.md`](web/README.md) |
| Datenbank & Server-Funktionen (Supabase EU) | `backend/supabase/` | siehe `backend/SETUP.md` |

## Plattform-Dokumentation
[`doku/plattform/`](doku/plattform/):
[UMSETZUNGSPLAN](doku/plattform/UMSETZUNGSPLAN.md) ·
[PROJECT_STATUS](doku/plattform/PROJECT_STATUS.md) ·
[ARCHITECTURE](doku/plattform/ARCHITECTURE.md) ·
[DATABASE_SCHEMA](doku/plattform/DATABASE_SCHEMA.md) ·
[API_CONTRACTS](doku/plattform/API_CONTRACTS.md) ·
[SECURITY](doku/plattform/SECURITY.md) ·
[GDPR_CHECKLIST](doku/plattform/GDPR_CHECKLIST.md) ·
[TEST_PLAN](doku/plattform/TEST_PLAN.md) ·
[DECISIONS](doku/plattform/DECISIONS.md) ·
[CHANGELOG](doku/plattform/CHANGELOG.md)

Umgebungsvariablen: `web/.env.example`, `app/.env.example`, `konfiguration/ilho.env.example` – nur Platzhalter, nie echte Schlüssel einchecken.

Arbeitsregeln für Claude-Sitzungen: [`CLAUDE.md`](CLAUDE.md), offene Aufgaben: [`AUFGABEN-claude.md`](AUFGABEN-claude.md).
