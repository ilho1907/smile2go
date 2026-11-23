// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "admin-sperren"
// Sperrt ein Konto oder hebt die Sperre auf — nur für Admins (Tabelle admins).
//   1. Supabase-Bann (ban_duration): keine neue Anmeldung mehr möglich
//   2. mitglied_status.gesperrt: wer gerade angemeldet ist, fällt beim nächsten
//      Statuscheck der App (spätestens nach 5 Min.) heraus — ein Bann allein
//      beendet laufende Sitzungen nicht.
//   3. Eintrag in admin_protokoll
// Deploy: supabase functions deploy admin-sperren
// ─────────────────────────────────────────────────────────────

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZEHN_JAHRE = "87600h";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Nicht angemeldet" }, 401);

  // 1 · Wer fragt? Prüfung mit dem JWT der Admin, nicht mit dem Service-Key.
  const alsAdmin = createClient(URL_, ANON, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: userErr } = await alsAdmin.auth.getUser();
  if (userErr || !user) return json({ error: "Nicht angemeldet" }, 401);
  const { data: istAdmin } = await alsAdmin.rpc("ist_admin");
  if (istAdmin !== true) return json({ error: "Nur für Admins" }, 403);

  let body: { user_id?: string; sperren?: boolean; grund?: string } = {};
  try { body = await req.json(); } catch { /* leer */ }
  const ziel = body.user_id;
  const sperren = body.sperren === true;
  if (!ziel || typeof body.sperren !== "boolean") return json({ error: "user_id und sperren fehlen" }, 400);
  if (ziel === user.id) return json({ error: "Das eigene Konto kann nicht gesperrt werden" }, 400);

  const admin = createClient(URL_, SERVICE);

  // Andere Admins sperrt man nicht aus Versehen
  const { data: zielAdmin } = await admin.from("admins").select("user_id").eq("user_id", ziel).maybeSingle();
  if (zielAdmin && sperren) return json({ error: "Admin-Konten werden nicht gesperrt — erst aus der Admin-Liste nehmen" }, 400);

  // 2 · Anmeldung sperren / freigeben
  const { error: banErr } = await admin.auth.admin.updateUserById(ziel, { ban_duration: sperren ? ZEHN_JAHRE : "none" });
  if (banErr) return json({ error: banErr.message }, 500);

  // 3 · Status in der App
  const jetzt = new Date().toISOString();
  const grund = (body.grund || "").trim().slice(0, 500) || null;
  const { error: stErr } = await admin.from("mitglied_status").upsert({
    user_id: ziel,
    gesperrt: sperren,
    gesperrt_am: sperren ? jetzt : null,
    gesperrt_grund: sperren ? grund : null,
    aktualisiert: jetzt,
  }, { onConflict: "user_id" });
  if (stErr) return json({ error: stErr.message }, 500);

  // 4 · Protokoll
  await admin.from("admin_protokoll").insert({
    admin_id: user.id, user_id: ziel, aktion: sperren ? "gesperrt" : "entsperrt", details: grund ? { grund } : null,
  });

  return json({ ok: true, gesperrt: sperren });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });
}
