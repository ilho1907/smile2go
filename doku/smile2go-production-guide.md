# smile2go — Production-Architektur (500–1.000 Mitglieder)

> Stand: Juni 2026 · Ziel: stabil, DSGVO-konform, < 400 €/Monat Betriebskosten

---

## 1 · Architektur-Überblick

```
   Nutzerin (PWA, Handy/Browser)
        │ HTTPS (Cloudflare: CDN, WAF, DDoS-Schutz, kostenlos)
        ▼
┌─────────────────────────────┐
│  FRONTEND · Vercel (EU)     │  React PWA · Service Worker (offline)
│  app.smile2go.de            │  Web-Push via OneSignal
└──────────┬──────────────────┘
           │ supabase-js (anon key, RLS!)        ┌──────────────────┐
           ▼                                     │  Stripe (Abos)    │
┌─────────────────────────────┐   Webhooks  ◄───┤  29/49/99 €       │
│  SUPABASE Pro · EU-Frankfurt│─────────────────┴──────────────────┘
│  Auth (Mail+Google OAuth)   │
│  Postgres + RLS (13 Tabellen│   Edge Functions (serverseitig):
│  Storage (Uploads, Voice)   │   - /ai  → Anthropic API (Key NIE im Client!)
│  Edge Functions (Deno)      │   - /stripe-webhook → Paket freischalten
└──────────┬──────────────────┘   - /briefe-cron → fällige Briefe zustellen
           │
           ▼
┌─────────────────────────────┐
│  n8n (Cloud o. Hetzner EU)  │  07:00 Tagescontent (Claude → DB → Push)
│  Automationen               │  So 18:00 Wochenrückblick (ilho-Insight)
└─────────────────────────────┘  Video-Pipeline: vidio.ai→Reap→Eden→Blotato
```

**Wichtigste Sicherheitsregel:** Der Anthropic-Key liegt NUR in der Supabase
Edge Function `/ai`. Die App ruft `/ai` auf (mit User-JWT), nie die Anthropic-API
direkt. So: kein Key-Diebstahl, Rate-Limits pro Nutzerin, Kostenkontrolle.

---

## 2 · Komponenten & warum

| Schicht | Dienst | Warum |
|---|---|---|
| Frontend-Hosting | **Vercel** (Region fra1) | PWA, Auto-Deploy aus GitHub, Preview-URLs |
| Datenbank/Auth/Storage | **Supabase Pro, EU** | RLS = DSGVO, Google OAuth fertig, Backups |
| KI-Proxy | **Supabase Edge Function** | Key-Schutz, Logging, Limits (30 Calls/Tag/Userin) |
| Zahlungen | **Stripe** | Abos, SEPA + Karte, Kundenportal (kündigen self-service) |
| Push | **OneSignal** (Free ≤ 10k) | Web-Push 07:00, Segmente |
| Mail | **Resend** | Double-Opt-in, Briefe-Zustellung, Dokument-Versand |
| Automation | **n8n** (Cloud o. Hetzner CX22 ~5 €) | Tagescontent, Wochenrückblick, Video-Pipeline |
| CDN/Schutz | **Cloudflare** (Free) | WAF, Bot-Schutz, Caching |
| Monitoring | **Sentry** (Free) + Supabase Logs | Fehler in Echtzeit aufs Handy |
| Fehler-/Statusseite | **BetterStack** (Free) | Uptime-Alarm per WhatsApp/Mail |

---

## 3 · Last: reicht das für 1.000 Mitglieder? Ja, locker.

- Annahme: 35 % täglich aktiv (≈ 350 DAU), Spitze 60 gleichzeitige Nutzerinnen
- Supabase Pro: 8 GB DB, 100 GB Storage, 250 GB Egress → Auslastung < 10 %
- KI-Last: ø 5 ilho-Calls/aktive Nutzerin/Tag ≈ 1.750 Calls/Tag → trivial
- Engpass ist nie die Infrastruktur, sondern die **KI-Kosten** → siehe unten

**KI-Kostensteuerung (wichtig!):**
1. Kurze Antworten erzwingen (max_tokens 350 im Chat)
2. Tagescontent/Horoskope **cachen**: 12 Horoskope × 1 Generierung/Tag für ALLE
   (statt pro Nutzerin) → in `daily_content` ablegen
3. Günstiges Modell (Haiku-Klasse) für Horoskop/Glück, stärkeres nur für ilho-Chat
4. Hard-Limit pro Userin/Tag in der Edge Function (z. B. 30 Calls, danach
   liebevoller Hinweis)

---

## 4 · Monatskosten (Schätzung, 500–1.000 Mitglieder)

| Posten | €/Monat |
|---|---|
| Supabase Pro | ~23 € |
| Vercel Pro | ~19 € (Start: Hobby 0 €) |
| n8n Cloud Starter *oder* Hetzner self-host | 24 € / 5 € |
| OneSignal, Cloudflare, Sentry, BetterStack | 0 € |
| Resend (bis 50k Mails) | 0–19 € |
| Anthropic API (mit Caching-Strategie oben) | **~80–250 €** |
| Domain smile2go.de | ~1 € |
| **Summe** | **~150–340 €** |

Gegenrechnung: 600 Mitglieder × ø 41 € = **~24.600 € MRR** → Infrastruktur < 1,5 % vom Umsatz. Stripe-Gebühren (~1,5 % + 0,25 €) kommen umsatzabhängig dazu.

---

## 5 · Sicherheit & DSGVO-Checkliste

- [ ] Alle Dienste EU-Region (Supabase Frankfurt, Vercel fra1)
- [ ] RLS auf JEDER Tabelle (Schema liegt vor ✓)
- [ ] AVV/DPA abschließen: Supabase, Vercel, Anthropic, OneSignal, Resend, Stripe
- [ ] Anthropic: Zero-Data-Retention-Option im DPA aktivieren
- [ ] API-Keys nur server-seitig (Edge Functions / n8n ENV) — Schema `.env` liegt vor ✓
- [ ] TLS überall, HSTS via Cloudflare
- [ ] Rate-Limiting: /ai 30/Tag/Userin, Login 5 Versuche/15 Min
- [ ] Backups: Supabase Point-in-Time-Recovery aktivieren (Pro inkl. 7 Tage)
- [ ] Admin-Login: eigene Rolle + **2FA Pflicht**, Admin-Dashboard hinter eigener Subdomain (admin.smile2go.de) + Cloudflare Access
- [ ] DSGVO-Seiten: Datenschutz, Impressum, AVV-Liste, Double-Opt-in ✓ (in App)
- [ ] Export & Löschung: Buttons in Profil → Edge Function (Cascade ✓ im Schema)
- [ ] **EU AI Act:** Transparenzpflicht erfüllt — ilho ist klar als KI gekennzeichnet ("Dein KI-Assistent") ✓; Disclaimer bei Mystik ("zur Inspiration") ✓; keine verbotenen Praktiken (kein Emotion-Scoring am Arbeitsplatz etc.)
- [ ] Audit-Log: Admin-Aktionen in eigene Tabelle schreiben

---

## 6 · Admin-Zugang (für dich)

- Rolle `admin` in `profiles` (boolean `is_admin`) + RLS-Policies für Admin-Lesezugriff (`using (is_admin(auth.uid()))` Helper-Funktion)
- Dashboard (Prototyp liegt bei: `smile2go-admin-dashboard.jsx`):
  Übersicht/KPIs · Mitglieder · Umsatz · Content-Verwaltung · Coach-Inbox ·
  Buchungen · Punkte-Ökonomie · Systemstatus
- Deploy als eigene Vercel-App: admin.smile2go.de, geschützt mit
  Supabase-Login (nur is_admin) **und** Cloudflare Access (Mail-OTP) = 2 Schichten

---

## 7 · Verbindungen / Tools / MCP (deine Claude-Arbeitsumgebung)

| Verbindung | Status | Genutzt für |
|---|---|---|
| Webflow | ✓ verbunden | Plattform-Site (ID 69f1…) pflegen |
| Canva / Gamma | ✓ verbunden | Marketing-Assets, Pitch-Decks |
| Google Drive / Gmail / Calendar | ✓ verbunden | Dokumente, Termine, Mails |
| Notion | ✓ verbunden | Projekt-Doku, Content-Planung |
| Supabase MCP | ➕ empfohlen | DB direkt aus dem Chat verwalten |
| Stripe MCP | ➕ empfohlen | Umsatz/Abos aus dem Chat abfragen |

---

## 8 · Setup-Reihenfolge (1 Tag Arbeit)

1. Domain kaufen → Cloudflare DNS
2. Supabase-Projekt (EU) → `ilho-supabase-schema.sql` ausführen → Google OAuth
3. Stripe: 3 Produkte + Webhook → Edge Function
4. Edge Function `/ai` deployen (Key rein, Limits an)
5. Vercel: Repo verbinden → ENV aus `ilho.env.example` → Deploy
6. OneSignal + Service Worker → Push-Test
7. n8n: `ilho-n8n-taeglicher-content.json` importieren → Credentials → 07:00-Test
8. Resend: Domain verifizieren (SPF/DKIM) → Double-Opt-in-Mail
9. Sentry + BetterStack einbinden
10. Admin-Dashboard auf admin.smile2go.de + Cloudflare Access
11. AVV/DPA-Runde, DSGVO-Seiten live → **Launch** 🚀
