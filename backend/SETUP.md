# smile2go — Backend-Setup (Schritt für Schritt)

Ziel: aus dem Prototyp eine echte App machen. Reihenfolge einhalten.
Alles hier ist ohne Vorwissen machbar; wo ein Schlüssel gebraucht wird, steht die Quelle.

---

## 0. Werkzeuge (einmalig)
- Node.js installiert (hast du, die App läuft).
- Supabase CLI:  `npm install -g supabase`  (für Edge Functions).

## 1. Supabase-Projekt (Backend)
1. supabase.com → **New Project** → Region **Central EU (Frankfurt)** wählen. Passwort merken.
2. Links **SQL Editor** → New query → Inhalt von `03_Datenbank/ilho-supabase-schema.sql` einfügen → **Run**.
3. Nochmal New query → Inhalt von `backend/coaching-intelligenz-schema.sql` einfügen → **Run**.
4. **Project Settings → API**: kopiere **Project URL** und **anon public key**. (Den `service_role`-Key NIE ins Frontend.)

## 2. ilho absichern (Edge Function)
Damit der Anthropic-Key nicht mehr im Browser liegt:
```bash
cd smile2go-projekt
supabase login
supabase link --project-ref <DEIN-PROJECT-REF>     # steht in der Projekt-URL
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # von console.anthropic.com
supabase functions deploy ai
```
Danach ist ilho erreichbar unter: `https://<PROJECT-REF>.functions.supabase.co/ai`

## 3. Login (Auth)
- Supabase → **Authentication → Providers**:
  - **Email** aktivieren (Double-Opt-in an).
  - **Google** aktivieren → dafür bei console.cloud.google.com einen **OAuth-Client** anlegen (Client ID + Secret), in Supabase eintragen. Redirect-URL nimmt Supabase dir ab.

## 4. Frontend anbinden
1. `app/` → `.env` anlegen (aus `05_Konfiguration/ilho.env.example`), mind.:
   ```
   VITE_SUPABASE_URL=https://<PROJECT-REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_AI_FUNCTION_URL=https://<PROJECT-REF>.functions.supabase.co/ai
   ```
2. `npm install @supabase/supabase-js`
3. **ilho umstellen** — in `src/App.jsx` die Funktion `askLuma` ersetzen durch einen Aufruf der Edge Function:
   ```js
   async function askLuma(messages, system) {
     const res = await fetch(import.meta.env.VITE_AI_FUNCTION_URL, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ messages, system }),
     });
     const data = await res.json();
     return data.text || "";
   }
   ```
   (Kein API-Key mehr im Browser ✅)
4. State schrittweise von `localStorage` auf Supabase umstellen (Lesen/Schreiben je Tabelle).

## 5. Danach (nach Bedarf)
- **Zahlungen:** Stripe (dashboard.stripe.com) → 3 Produkte/Preise + Webhook → Edge Function `stripe-webhook`.
- **Push:** OneSignal (App ID + Key).
- **E-Mail:** Resend (Domain verifizieren).
- **Video:** Bunny Stream / Cloudflare Stream (Library + Key) → nur `video_id` in Supabase speichern.
- **Deploy:** Vercel (GitHub verbinden → EU-Region).

---

## Sicherheits-Checkliste (Digitalbonus/IT-Sicherheit)
- [ ] `service_role`, `ANTHROPIC_API_KEY`, `STRIPE secret` NUR serverseitig.
- [ ] RLS auf allen Tabellen aktiv (Coach nur mit Einwilligung).
- [ ] Einwilligung + Datenexport + Löschung funktionsfähig.
- [ ] EU-Hosting (Supabase Frankfurt, Vercel fra1).
- [ ] AVV mit Supabase, Anthropic, Stripe, OneSignal, Resend abschließen.
