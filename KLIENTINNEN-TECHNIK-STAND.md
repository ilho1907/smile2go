# Klientinnen-Seite · technischer Stand (27.08.2026)

Alles unten ist **im Code fertig**. Bezahlung/Abo bleibt bewusst aussen vor.

## Was jetzt echt ist

| Bereich | Vorher | Jetzt |
|---|---|---|
| Coach-Chat | 3 Standardantworten per Timeout | Tabelle `nachrichten` + Realtime, Sprachnachricht via Mikrofon in privaten Bucket |
| Termin | feste Uhrzeiten im Code | `coach_slots` der Coachin, Buchung/Storno per Datenbankfunktion |
| Coachin ↔ Klientin | gar nicht vorhanden | `klientinnen` + Einladungscode (`mit_coach_verbinden`) |
| Passwort vergessen | nicht vorhanden | Reset-Mail + eigener Bildschirm unter `#passwort-neu` |
| Daten exportieren | toter Knopf | `meine_daten_export()` → JSON-Download (Art. 15/20) |
| Konto löschen | toter Knopf | Edge Function `konto-loeschen` inkl. Dateien (Art. 17) |
| Push | keine Technik vorhanden | Service Worker + VAPID-Abo + Edge Function `push` |
| Offline | keine | App-Hülle im Cache, startet ohne Netz |
| Community | Array im Speicher | `community_posts` + Herzen + Meldefunktion (ab 3 Meldungen automatisch ausgeblendet) |
| Mediathek | Uploads nur im Browser | privater EU-Bucket, signierte Links, echtes Löschen |

## Noch zu tun (einmalig, von dir)

1. **Migration einspielen** — legt alle Tabellen, Regeln und Buckets an:
   ```bash
   cd ~/Desktop/smile2go-projekt/backend
   supabase login          # nur falls nötig
   supabase db push --linked
   ```
   (Ein erster Versuch lief in einen Verbindungs-Timeout — bitte einmal selbst starten.)

2. **Edge Functions ausrollen**
   ```bash
   supabase functions deploy konto-loeschen
   supabase functions deploy push
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:hallo@smile2go.app
   ```
   Die Werte stehen in `backend/.secrets.local` (nicht im Git).

3. **Ersten Einladungscode anlegen** (in Supabase → SQL Editor, `<coach-uuid>` = deine Nutzer-ID):
   ```sql
   insert into coaches (id, name) values ('<coach-uuid>', 'Dein Coachname')
     on conflict (id) do update set name = excluded.name;
   insert into coach_einladungen (code, coach_id) values ('S2G-2026', '<coach-uuid>');
   ```
   Danach im Profil der Klientin den Code eingeben — ab dann greifen Chat, Termine und Material.

4. **Freie Zeitfenster eintragen** (bis das Coach-Panel das kann):
   ```sql
   insert into coach_slots (coach_id, beginn) values
     ('<coach-uuid>', '2026-09-01 09:00+02'),
     ('<coach-uuid>', '2026-09-01 11:00+02');
   ```

5. **Passwort-Reset-URL freigeben**: Supabase → Authentication → URL Configuration →
   Redirect URLs um die App-Adresse ergänzen (lokal `http://localhost:5173`).

## Bewusst offen

- Bezahlung/Abo (Stripe) — später
- Coach-Panel schreibt noch nicht in die neuen Tabellen (Klientinnen-Seite liest schon)
- `journey_templates/runs/steps` haben weiterhin keine Oberfläche
