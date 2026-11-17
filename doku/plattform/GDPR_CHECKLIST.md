# DSGVO-Checkliste

Keine dieser Zeilen ist eine Rechtsberatung oder Konformitätszusage. ✅ heißt „technisch umgesetzt und getestet“, nicht „rechtlich abgenommen“.

## Öffentliche Website `web/` (Phase 1)
| Punkt | Stand | Nachweis |
|---|---|---|
| Keine nicht erforderlichen Cookies/Tracker (TDDDG) | ✅ | E2E-Test: keine Requests an fremde Hosts; Smoke-Test: keine Tracking-Skripte |
| Schriften lokal statt Google Fonts | ✅ | `@fontsource-variable/*`, keine Anfrage an `fonts.googleapis.com` |
| Pflichthinweis und freiwillige Einwilligung getrennt | ✅ | Formulare: „Pflichtangabe“ vs. „Freiwillige Einwilligung“ |
| Freiwillige Einwilligung nicht vorausgewählt | ✅ | Smoke- und E2E-Test |
| Datenminimierung im Formular | ✅ | Vormerken: Vorname + E-Mail; Interessen freiwillig; keine Uploads |
| Keine Formulardaten in localStorage/Cookies | ✅ | E2E-Test prüft localStorage + Cookies nach Absenden |
| Impressum, Datenschutz, AGB/Widerruf | ❌ Entwurf mit Platzhaltern | Seiten als ENTWURF markiert – vor Veröffentlichung ausfüllen und prüfen lassen |
| Rechtsgrundlage, Speicherdauer, Empfänger je Formular | ❌ | Erst mit echtem Endpunkt (Phase 2/3) |
| Hosting-Anbieter, AVV, Server-Logs | ❓ | Hosting nicht entschieden (ADR-001) |
| Barrierefreiheit (BFSG/WCAG) | 🟡 | axe WCAG 2.1 AA: 0 ernste/kritische Verstöße auf 7 Seiten × 2 Geräten; Anwendbarkeit BFSG fachlich klären |

## Plattform (ab Phase 2)
- [ ] Verzeichnis der Verarbeitungstätigkeiten
- [ ] Rechtsgrundlage pro Verarbeitung (nicht ein Sammelhäkchen)
- [ ] AVV/DPA: Supabase, Vercel, Stripe, Zoom, KI-Anbieter, E-Mail-Anbieter, ggf. n8n-Hosting
- [ ] Unterauftragsverarbeiter-Liste, Drittlandtransfer (SCC/TIA) prüfen
- [ ] `consents`-Tabelle mit Version und Widerruf
- [ ] Export und Löschung getestet (bestehende Function `konto-loeschen` in Test aufnehmen)
- [ ] Privates Journal, DMs, Gesundheitsangaben: nie Eingabe für Matching oder Expertinnen-Übersichten
- [ ] Aufnahmen: Information, Rechtsgrundlage, Freigabe, Entfernung
- [ ] DSFA prüfen (Gesundheitsnähe, KI, Community mit sensiblen Themen)
- [ ] DSA-Meldeweg und Moderationsverfahren
- [ ] Marketplace: Verkäuferidentifizierung, DAC7/PStTG, Widerruf digitaler Inhalte, Kündigungsbutton
