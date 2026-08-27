// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "push"
// Web-Push (VAPID) an alle Geräte einer Nutzerin.
// Aufrufer: die Coachin (Nutzer-JWT) oder n8n/Automation (Service-Key).
// Deploy:  supabase functions deploy push
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:...
// ─────────────────────────────────────────────────────────────

import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:hallo@smile2go.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { user_id, titel, text, url = "/", tag = "smile2go" } = await req.json();
    if (!user_id || !text) return json({ error: "user_id und text erforderlich" }, 400);

    const admin = createClient(URL_, SERVICE);
    const { data: abos, error } = await admin
      .from("push_abos")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", user_id);
    if (error) return json({ error: error.message }, 500);
    if (!abos?.length) return json({ gesendet: 0, hinweis: "keine Push-Abos" });

    const nutzlast = JSON.stringify({ titel: titel ?? "smile2go", text, url, tag });
    let gesendet = 0;
    const abgelaufen: string[] = [];

    for (const a of abos) {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth_key } },
          nutzlast,
        );
        gesendet++;
      } catch (e) {
        // 404/410 = Abo gilt nicht mehr (App deinstalliert, Berechtigung entzogen)
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) abgelaufen.push(a.endpoint);
      }
    }

    if (abgelaufen.length) {
      await admin.from("push_abos").delete().in("endpoint", abgelaufen);
    }

    return json({ gesendet, aufgeraeumt: abgelaufen.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
