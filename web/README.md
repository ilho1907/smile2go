# Smile2Go · Öffentliche Website (Phase 1)

Statische, responsive Website: Startseite, **Community entdecken**, **Community beitreten**, **Für Expertinnen** (mit Bewerbung), Rechtsseiten (Entwurf).
Kein Framework, kein Tracking, Schriften lokal. Kopf/Fuß stehen einmal in `src/partials/` und werden beim Bauen eingesetzt.

## Lokal starten (Mac, Terminal)

Voraussetzung: Node.js 18 oder neuer (`node -v`). Falls nicht vorhanden: `brew install node`.

```bash
cd ~/Projects                      # oder ein anderer Ordner deiner Wahl
git clone https://github.com/ilho1907/smile2go.git smile2go-web-test
cd smile2go-web-test
git checkout claude/phase-0-1-public-website
cd web
npm install
npm run dev                        # öffnet http://localhost:5180 im Standardbrowser
```

Direkt in Chrome öffnen (zweites Terminalfenster): `open -a "Google Chrome" http://localhost:5180`
Beenden: im Terminal `Ctrl + C`.

Gebaute Fassung ansehen: `npm run build && npm run preview` → http://localhost:5181

## Tests

```bash
npm run build && npm run test:smoke   # 318 statische Prüfungen, kein Browser nötig
npm run test:e2e                      # Playwright mit deinem installierten Google Chrome
```
Screenshots landen in `web/screenshots/` (Desktop + Mobil).

## Konfiguration
`.env.example` nach `.env.local` kopieren. Ohne `VITE_FORMULAR_ENDPUNKT` laufen Formulare im **Demo-Modus**: Eingaben werden geprüft, aber nicht gesendet und nicht gespeichert. `VITE_SITE_INDEXIERBAR` bleibt `nein`, bis ilho die Veröffentlichung freigibt.

## Dateien
| Pfad | Zweck |
|---|---|
| `index.html`, `community-*.html`, `fuer-expertinnen.html`, `impressum.html`, `datenschutz.html`, `agb-widerruf.html`, `404.html` | Seiten |
| `src/partials/kopf.html`, `fuss.html` | gemeinsamer Kopf/Fuß |
| `src/styles.css` | Design-Tokens (aus der App) und Layout |
| `src/main.js` | Menü, mobile Beitreten-Leiste, Verzeichnis |
| `src/formular.js` | Formularprüfung + Versand-Adapter (Demo-Modus) |
| `src/data/expertinnen.js` | Verzeichnis – nur `freigegeben: true` wird angezeigt |
| `tests/smoke.mjs`, `tests/website.spec.js` | Tests |
| `public/img/` | Markenbilder (Kopien aus `app/public/media/img/fuf/`) |
