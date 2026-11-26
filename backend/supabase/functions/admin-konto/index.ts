// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "admin-konto"
// Kontoaktionen aus s2g.admin, die den Service-Key brauchen — nur für Admins.
//   aktion "sperren"            Supabase-Bann + mitglied_status.gesperrt (+ Grund)
//   aktion "entsperren"         Bann aufheben
//   aktion "zwei_faktor_reset"  alle 2FA-Faktoren löschen (Handy verloren)
//   aktion "datei_link"         5-Minuten-Link zu einer Datei der Nutzerin (protokolliert)
//   aktion "loeschen"           Konto + alle Daten löschen (Art. 17 DSGVO);
//                               nur mit bestaetigung = E-Mail der Nutzerin
// Jede Aktion landet in admin_protokoll. Admin-Konten sind ausgenommen.
// Deploy: supabase functions deploy admin-konto
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
const AKTIONEN = ["sperren", "entsperren", "zwei_faktor_reset", "datei_link", "loeschen"];
const BUCKETS = ["klientin-dateien", "gemeinschaft"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Nicht angemeldet" }, 401);

  // 1 · Wer fragt? Mit dem JWT der Admin prüfen, nicht mit dem Service-Key.
  const alsAdmin = createClient(URL_, ANON, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: userErr } = await alsAdmin.auth.getUser();
  if (userErr || !user) return json({ error: "Nicht angemeldet" }, 401);
  const { data: istAdmin } = await alsAdmin.rpc("ist_admin");
  if (istAdmin !== true) return json({ error: "Nur für Admins" }, 403);

  let body: { user_id?: string; aktion?: string; grund?: string; bestaetigung?: string; bucket?: string; pfad?: string } = {};
  try { body = await req.json(); } catch { /* leer */ }
  const ziel = body.user_id;
  const aktion = body.aktion || "";
  if (!ziel || !AKTIONEN.includes(aktion)) return json({ error: "user_id oder aktion fehlt" }, 400);
  if (ziel === user.id) return json({ error: "Das eigene Konto geht hier nicht" }, 400);

  const admin = createClient(URL_, SERVICE);
  const { data: zielAdmin } = await admin.from("admins").select("user_id").eq("user_id", ziel).maybeSingle();
  if (zielAdmin) return json({ error: "Admin-Konten sind ausgenommen — erst aus der Admin-Liste nehmen" }, 400);

  const { data: zu, error: zuErr } = await admin.auth.admin.getUserById(ziel);
  if (zuErr || !zu?.user) return json({ error: "Konto nicht gefunden" }, 404);
  const email = zu.user.email || "";
  const grund = (body.grund || "").trim().slice(0, 500) || null;
  const jetzt = new Date().toISOString();
  const protokoll = (a: string, details: Record<string, unknown> | null) =>
    admin.from("admin_protokoll").insert({ admin_id: user.id, user_id: ziel, aktion: a, details });

  if (aktion === "sperren" || aktion === "entsperren") {
    const sperren = aktion === "sperren";
    const { error } = await admin.auth.admin.updateUserById(ziel, { ban_duration: sperren ? ZEHN_JAHRE : "none" });
    if (error) return json({ error: error.message }, 500);
    const { error: stErr } = await admin.from("mitglied_status").upsert({
      user_id: ziel, gesperrt: sperren, gesperrt_am: sperren ? jetzt : null,
      gesperrt_grund: sperren ? grund : null, aktualisiert: jetzt,
    }, { onConflict: "user_id" });
    if (stErr) return json({ error: stErr.message }, 500);
    await protokoll(aktion === "sperren" ? "gesperrt" : "entsperrt", grund ? { grund } : null);
    return json({ ok: true });
  }

  if (aktion === "datei_link") {
    const bucket = body.bucket || "";
    const pfad = body.pfad || "";
    if (!BUCKETS.includes(bucket) || !pfad || pfad.includes("..")) return json({ error: "Datei ungültig" }, 400);
    // Nur Dateien im Ordner dieser Nutzerin (Pfad beginnt mit ihrer ID)
    if (!pfad.startsWith(`${ziel}/`)) return json({ error: "Datei gehört nicht zu diesem Konto" }, 403);
    const { data: link, error } = await admin.storage.from(bucket).createSignedUrl(pfad, 300);
    if (error || !link) return json({ error: error?.message || "Kein Link" }, 500);
    await protokoll("datei_angesehen", { bucket, pfad });
    return json({ ok: true, url: link.signedUrl });
  }

  if (aktion === "zwei_faktor_reset") {
    const { data: f, error } = await admin.auth.admin.mfa.listFactors({ userId: ziel });
    if (error) return json({ error: error.message }, 500);
    for (const faktor of f?.factors || []) {
      const { error: delErr } = await admin.auth.admin.mfa.deleteFactor({ userId: ziel, id: faktor.id });
      if (delErr) return json({ error: delErr.message }, 500);
    }
    await protokoll("zwei_faktor_reset", { anzahl: (f?.factors || []).length });
    return json({ ok: true, entfernt: (f?.factors || []).length });
  }

  // aktion === "loeschen"
  if ((body.bestaetigung || "").trim().toLowerCase() !== email.toLowerCase()) {
    return json({ error: "Zur Bestätigung bitte die E-Mail-Adresse der Nutzerin eintippen" }, 400);
  }
  // Protokoll zuerst: user_id wird beim Löschen auf NULL gesetzt, die E-Mail bleibt als Nachweis.
  await protokoll("geloescht", { email, grund });
  const { data: dateien } = await admin.storage.from("klientin-dateien").list(ziel, { limit: 1000 });
  if (dateien?.length) await admin.storage.from("klientin-dateien").remove(dateien.map((d) => `${ziel}/${d.name}`));
  const { error: delErr } = await admin.auth.admin.deleteUser(ziel);
  if (delErr) return json({ error: delErr.message }, 500);
  return json({ ok: true, geloescht_am: jetzt });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });
}
