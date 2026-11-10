# smile2go × ilhova agent — Anbindung

Stand: November 2026 · Status: geplant, noch kein Code

## Worum es geht

**ilhova agent** ist ein eigenständiges Produkt mit eigenem Repository
(`ilhova-agent`), eigener Datenbank und eigener Weiterentwicklung. smile2go
nutzt es **wie einen externen Dienstleister**: über eine API, mit eigenem
Tenant-Schlüssel. ilhova agent wird später auch an andere Coaching-Apps
verkauft.

Abgrenzung zu **ilho** (`ilho-Konzept.md`, `app/src/ilho.js`):

| | ilho | ilhova agent |
|---|---|---|
| Was | Gesprächs-Begleiter in der App | KI-Engine im Hintergrund |
| Wo | smile2go (dieses Repo) | eigenes Repo, eigener Dienst |
| Aufgabe | spricht mit der Nutzerin | Gedächtnis, Freigabe an die Coachin, Entwicklungsanalyse, Erinnerungen, Lernschleife |
| Daten | smile2go-Supabase | eigenes Supabase-Projekt (EU), getrennt pro Tenant |

ilho kann künftig ilhova agent aufrufen, um sich an die Nutzerin zu erinnern
und keine Inhalte zu wiederholen.

## Regeln für smile2go

- Der ilhova-Tenant-Schlüssel liegt nur in einer Edge Function, nie im
  Browser (gleiches Prinzip wie `ANTHROPIC_API_KEY`).
- smile2go sendet nur Daten, für die die Nutzerin eingewilligt hat;
  Einwilligung pro Kategorie, standardmäßig aus.
- Die Coachin sieht in `Coach.jsx` nur freigegebene Kategorien.
- Löschung in smile2go (`konto-loeschen`) muss auch die Löschung bei
  ilhova agent auslösen.
- Vertrag: AVV zwischen smile2go und ilhova agent vor dem ersten Live-Einsatz.

## Skills in diesem Repo

`.claude/skills/` enthält dieselben 6 Skills wie ilhova agent
(memory-systems, self-improvement-loops, harness-engineering, evaluation,
multi-agent-patterns, hosted-agents; MIT, Quelle
github.com/muratcankoylan/Agent-Skills-for-Context-Engineering), damit die
Anbindung auf beiden Seiten nach denselben Prinzipien gebaut wird.

## Nächste Schritte

1. Schnittstelle v0 gemeinsam festlegen (Ereignis-Schema je Kategorie).
2. Einwilligungs-Tabelle + RLS in smile2go (Migration).
3. Edge Function `ilhova` als Brücke.
