# API-Verträge

**Stand 17.11.2026: Keiner der unten genannten Endpunkte ist implementiert.** Bestehende Edge Functions: `ai`, `tts`, `push`, `erinnerungen`, `fairness`, `konto-loeschen` (nicht Teil dieses Dokuments).

Umsetzung als Supabase Edge Functions (ADR-010). Jeder Endpunkt bekommt vor der Implementierung: OpenAPI-Schema, Rollen, Eingabevalidierung (zod), Fehlerformat, Rate-Limit, Integrationstest.

## Gemeinsame Regeln
- Auth: `Authorization: Bearer <Supabase-JWT>`; Rolle wird serverseitig aus `user_roles` gelesen.
- Fehlerformat: `{ "fehler": { "code": "nicht_berechtigt", "text": "…" } }` mit HTTP 400/401/403/404/409/422/429/500.
- Idempotenz bei schreibenden Zahlungs-/Punkte-Aufrufen: Header `Idempotency-Key`.
- Webhooks: Signaturprüfung vor jeder Verarbeitung, Speicherung in `webhook_events`, Verarbeitung asynchron.
- Demo-Modus: fehlen Provider-Schlüssel, antwortet der Adapter mit `"demo": true` und schreibt nichts an Dritte.

| Endpunkt | Rolle | Phase | Zweck | Status |
|---|---|---|---|---|
| `POST /api/public/vormerken` | Gast | 2 | Website-Formular „Platz vormerken“ (Double-Opt-in) | ❌ (Website im Demo-Modus) |
| `POST /api/auth/onboarding` | Mitglied | 2 | Profil, freiwillige Interessen, Einwilligungen | ❌ |
| `GET /api/me` · `PATCH /api/me/preferences` | Mitglied | 2 | Eigene Daten, Präferenzen | ❌ |
| `POST /api/expert-applications` | Gast/Mitglied | 3 | Bewerbung (Felder wie `web/fuer-expertinnen.html`) | ❌ (Website im Demo-Modus) |
| `POST /api/admin/expert-applications/{id}/decision` | Admin (MFA) | 3 | Statusübergang + Audit | ❌ |
| `GET /api/products` · `POST /api/expert/products` | Gast · Expertin `seller_ready` | 4 | Katalog, eigene Produkte | ❌ |
| `POST /api/checkout/sessions` | Mitglied | 4 | Stripe Checkout (Testmodus) | ❌ |
| `POST /api/webhooks/stripe` | Stripe (signiert) | 4 | Zahlung → Entitlement | ❌ |
| `POST /api/events` · `POST /api/events/{id}/register` | Expertin · Mitglied | 6 | Live-Events | ❌ |
| `POST /api/webhooks/zoom` | Zoom (signiert) | 6 | Recording-Ereignisse | ❌ |
| `POST /api/replays/{id}/approve` | Expertin (Eigentümerin) | 6 | Replay-Freigabe | ❌ |
| `POST /api/matching/recommend` | Mitglied | 7 | 2–5 erklärte Vorschläge | ❌ |
| `POST /api/challenges` · `POST /api/tasks/{id}/complete` | Expertin · Mitglied | 7 | Challenges, Aufgaben | ❌ |
| `GET /api/points/ledger` | Mitglied (eigene) | 7 | Punktehistorie | ❌ |
| `GET /api/admin/audit-events` | Admin | 2 | Audit-Einsicht | ❌ |

## Vertrag, den die Website heute schon einhält
Die Formulare in `web/` senden – sobald `VITE_FORMULAR_ENDPUNKT` gesetzt ist – per `POST` JSON:
```json
{ "formular": "mitglied-vormerken | expertin-bewerbung", "daten": { "feldname": "wert", "mehrfach": ["a", "b"] } }
```
Erwartet wird HTTP 2xx bei Erfolg. Der Honigtopf `website_feld` wird nie mitgesendet.
