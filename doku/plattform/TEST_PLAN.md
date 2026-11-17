# Testplan und Testergebnisse

## Phase 1 – tatsächlich ausgeführt (17.11.2026, Cloud-Arbeitsumgebung, Linux, Node 22.23.4, Google Chrome, Playwright 1.65.1)

> Diese Tests liefen **nicht** auf ilhos Mac. Auf dem Mac sind sie mit denselben Befehlen wiederholbar (siehe `web/README.md`).

| Befehl | Was geprüft wird | Ergebnis |
|---|---|---|
| `cd web && npm run build` | Vite-Build aller 8 Seiten | ✓ erfolgreich |
| `npm run test:smoke` | 318 statische Prüfungen auf `dist/`: lang, viewport, Titel-/Description-Länge, genau eine H1, `noindex`, Skip-Link, alt-Texte, keine externen Ressourcen/Tracker, tote Links und Anker, Labels für jedes Formularfeld, Pflicht-Datenschutzhinweis, freiwillige Einwilligung nicht vorausgewählt, getrennte Seiten Entdecken/Beitreten, beide Hero-CTAs, mobile Dauer-CTA, Entwurfs-Kennzeichnung der Rechtsseiten | **318 bestanden, 0 fehlgeschlagen** |
| `npm run test:e2e` | 40 Playwright-Tests, je Desktop (1366×860) und Mobil (Pixel 7) | **39 bestanden, 1 übersprungen** (mobilspezifischer Test im Desktop-Projekt), 0 fehlgeschlagen |
| `cd app && npm ci && npm run build` | Bestehende App baut unverändert | ✓ erfolgreich (nur bekannte Chunk-Größen-Warnung) |

### E2E-Fälle im Detail
1. Jede der 7 Seiten: lädt ohne JS-/Konsolenfehler, **keine Anfrage an fremde Hosts**, kein horizontales Scrollen, genau eine H1, ganzseitiger Screenshot.
2. Jede der 7 Seiten: axe-core mit WCAG 2.0/2.1 A+AA – **keine „serious“/„critical“-Verstöße**. („moderate“/„minor“ werden nicht als Fehler gewertet.)
3. Navigation: mobiles Menü öffnet, `aria-expanded` korrekt, Escape schließt; Links führen zu Entdecken/Beitreten; `aria-current` markiert die aktive Seite.
4. Mobil: Beitreten-Leiste erscheint nach dem Scrollen; auf der Beitreten-Seite ausgeblendet.
5. „Platz vormerken“: leeres Absenden → verständliche Fehlermeldungen, Fokus auf erstem Fehler; ungültige E-Mail erkannt; gültige Eingaben → Demo-Hinweis „NICHT gesendet“; **kein POST-Request**; E-Mail-Adresse weder in localStorage noch in Cookies.
6. Expertin-Bewerbung: Pflicht-Checkbox-Gruppen geprüft, ungültige URL erkannt, vollständige Bewerbung → Demo-Hinweis, kein POST-Request.
7. Expertinnen-Verzeichnis zeigt ohne Freigabe kein Profil, nur den Hinweis.
8. Login-Links zeigen auf `https://smile2go-app.vercel.app`.

### Bekannte Abdeckungsgrenzen
- Kein Test in Safari/iOS und Firefox (nur Chrome-Engine).
- Keine Core-Web-Vitals-Messung unter Netzwerkdrosselung (Build-Größen: HTML 4–15 kB, CSS 19 kB, JS 5 kB, Bilder je 50–150 kB WebP, Schriften lokal).
- Screenshot-Prüfung: Desktop- und Mobilaufnahmen der Startseite, Beitreten- und Expertinnen-Seite visuell angesehen; keine pixelgenaue Regression.
- Formular-Versand an echten Endpunkt ungetestet, weil keiner existiert (Demo-Modus ist Absicht).

## Ab Phase 2 – geplant (QA-Matrix 04)
| Szenario | Erwartung | Phase |
|---|---|---|
| Gast öffnet kostenpflichtige Kurs-URL | 403/Redirect, keine Mediendatei | 5 |
| Bewerberin ohne Freigabe legt Produkt an | Server verweigert | 3/4 |
| Stripe sendet `paid` zweimal | genau eine Zahlung, ein Entitlement, eine Provision | 4 |
| Abbruch/Nichtzahlung | kein Zugang, keine Bestätigung über Redirect | 4 |
| Refund | Rücknahme + auditierbares Event | 4 |
| Expertin A liest Teilnehmerin von B | verboten auf API, RLS, Storage | 3–5 |
| Zoom-Webhook wiederholt | ein Processing-Job pro Recording-Version | 6 |
| Replay nicht freigegeben | keine Veröffentlichung, kein öffentlicher Link | 6 |
| Challenge-Task doppelt | ein Ledger-Credit | 7 |
| Präferenzen gelöscht | Matching nutzt keine alten Daten | 7 |
| Worker-Ausfall zwischen Zahlung und Aktivierung | sicherer Retry ohne Duplikate | 4 |
| Admin-Konto kompromittiert | MFA, Audit, Incident-Ablauf | 2/8 |

Werkzeuge: SQL-Testskripte/pgTAP gegen lokale Postgres für RLS, Deno-Tests für Edge Functions, Playwright für E2E, Stripe CLI im Testmodus für Webhooks.
