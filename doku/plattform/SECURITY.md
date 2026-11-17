# Sicherheit

## Geprüft in Phase 0 (17.11.2026)
| Prüfung | Methode | Ergebnis |
|---|---|---|
| Secrets im Repo | `grep` nach `sk_live`, `sk_test`, `sk-ant-`, `whsec_`, JWTs, `postgres://user:pass@`, AWS-Keys | Keine echten Schlüssel gefunden; nur Platzhalter in `*.example` und Doku |
| Supabase-Metadaten | `backend/supabase/.temp/` ist eingecheckt | Enthält Projekt-Referenz und Pooler-URL **ohne Passwort**. Kein Geheimnis, aber unnötig öffentlich (Repo ist public). **Empfehlung:** Ordner in `.gitignore` aufnehmen und aus dem Index nehmen – nicht ohne ilhos OK geändert |
| Repo-Sichtbarkeit | GitHub | `ilho1907/smile2go` ist **öffentlich**. Strategie-/Rechtsdokumente im Repo sind damit für alle lesbar – bewusst entscheiden |
| Abhängigkeiten `web/` | `npm audit --omit=dev` | 0 Schwachstellen in Laufzeit-Abhängigkeiten. Dev-Server: 1 „moderate“ (esbuild ≤ 0.24.2, nur Dev-Server, nicht im Build) |
| Client-Secrets `web/` | Code-Review | Nur `VITE_APP_URL`, `VITE_FORMULAR_ENDPUNKT`, `VITE_SITE_INDEXIERBAR` – keine Geheimnisse |

## Regeln (gelten ab sofort)
- `service_role`, Stripe-Secret, Webhook-Secrets, Zoom-Secrets, KI-Keys **nur** als Supabase-Secrets in Edge Functions.
- Admin-Konten mit MFA; kritische Admin-Aktionen in `audit_logs` (Phase 2).
- Medien und Nachweise nur in privaten Buckets, Auslieferung über signierte, kurzlebige URLs.
- Webhooks: Signatur prüfen, Zeitstempel-Toleranz, Idempotenz über `webhook_events`.
- Rate-Limits auf allen öffentlichen Formular-Endpunkten; Honigtopf ist kein Ersatz.
- Kein `dangerouslySetInnerHTML`/`innerHTML` mit Nutzerdaten (die Website setzt Expertinnen-Daten per `textContent`).

## Pflicht-Negativtests (ab Phase 2, QA-Matrix 04)
IDOR auf fremde Profile · Expertin A liest Kundin von Expertin B (API, RLS, Storage) · gestohlene Medien-URL nach Ablauf · wiederholter Webhook · doppelter Checkout · Refund entzieht Zugang · unfreigegebene Bewerberin veröffentlicht Produkt.

## Empfohlene HTTP-Header für das spätere Hosting von `web/`
`Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self' <Formular-Endpunkt>; frame-ancestors 'none'` · `Referrer-Policy: strict-origin-when-cross-origin` · `X-Content-Type-Options: nosniff` · `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
Hinweis: Einige Seiten nutzen noch `style="…"`-Attribute; vor einer strikten CSP in Klassen überführen.
