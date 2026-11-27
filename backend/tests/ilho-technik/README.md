# ilho-technik · Hilfe & Support — Einrichtung und Tests

## Live schalten (einmalig, in dieser Reihenfolge)

1. **Migration** `backend/supabase/migrations/20261124_ilho_technik.sql` im Supabase-SQL-Editor ausführen
   (legt Tabellen, RLS, Funktionen und den privaten Bucket `support-anhaenge` an; mehrfach ausführbar).
2. **Edge Function** deployen:
   ```bash
   supabase functions deploy ilho-technik --use-api
   supabase functions deploy push --use-api      # erweitert: Support-Team darf Ticket-Inhaberinnen benachrichtigen
   ```
   `ANTHROPIC_API_KEY` ist schon für `ai` gesetzt. Optional: `SUPPORT_KI_MODELL`, `SUPPORT_KI_TIMEOUT_MS`, `SUPPORT_KI_AUS=1`.
3. **Support-Team und Regeln**: Admin-Dashboard (`/admin`) › 🛟 Support-Tickets › „Support-Team & Routing-Regeln“.
   Ohne Regel landet jedes Ticket in der Admin-Queue — das ist gewollt und sicher.
4. Frontend wie gewohnt per PR → Vercel.

Fehlt Schritt 2, funktioniert die App trotzdem: Tickets werden direkt per RPC gespeichert und
gehen ohne KI-Einstufung in die manuelle Prüfung.

## Tests

Voraussetzung: ein lokales Postgres 16/17 (`PGHOST`, `PGPORT`, `PGUSER` setzen), Deno 2, für den
Browsertest Python + Playwright.

| Test | Befehl | Prüft |
|---|---|---|
| Datenbank & Rechte | `./run.sh` | 70 Prüfungen: Anlegen, Doppel-Senden, RLS, fremde Tickets, interne Notizen, Anhänge (Typ/Größe/Eigentum), KI nur per Service-Key, Retry-Sicherheit, Protokoll, Filter, Tageslimit |
| KI-Logik | `deno test --no-check ../../supabase/functions/ilho-technik/routing_test.ts` | Werte-Validierung, Zusatzfelder, Prompt-Injection-Gehege, Timeout, 429-Retry, 401 ohne Retry |
| Edge Function | `deno test -A --no-check --import-map=import_map.json edge_integration_test.ts` (nach `run.sh`) | echte Function gegen echte Migration: Erfolg, Timeout, kaputte/manipulierte KI-Antwort, fehlender Schlüssel, Doppel-Senden, 401 |
| Oberfläche | `./ui_reset.sh`, `fake_supabase.ts` starten, Vite mit `VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=anon`, dann `python3 ui_test.py` | 37 Klick-Prüfungen in Mitglieder-App, Coach-Panel und Admin |

`stubs.sql` und `fake_supabase.ts` bilden Supabase nur so weit nach, wie die Tests es brauchen —
**nie gegen die echte Datenbank ausführen.**
