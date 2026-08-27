// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "konto-loeschen"
// Art. 17 DSGVO — Recht auf Löschung. Löscht das Konto der ANGEMELDETEN
// Nutzerin samt aller Daten (app_state, Bindungen, Nachrichten, Termine,
// Community-Beiträge, Dateien) über die Fremdschlüssel-Kaskade auf auth.users.
// Deploy: supabase functions deploy konto-loeschen
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Nicht angemeldet" }, 401);

  // 1 · Wer ist das? Prüfung mit dem Nutzer-JWT, nicht mit dem Service-Key.
  const alsNutzerin = createClient(URL_, ANON, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: userErr } = await alsNutzerin.auth.getUser();
  if (userErr || !user) return json({ error: "Nicht angemeldet" }, 401);

  // 2 · Sicherheitsabfrage: die Nutzerin muss das Wort bestätigen.
  let bestaetigung = "";
  try { bestaetigung = (await req.json())?.bestaetigung ?? ""; } catch { /* leer */ }
  if (bestaetigung.trim().toUpperCase() !== "LÖSCHEN") {
    return json({ error: 'Bitte "LÖSCHEN" zur Bestätigung senden' }, 400);
  }

  const admin = createClient(URL_, SERVICE);

  // 3 · Dateien der Nutzerin entfernen (Storage kaskadiert nicht mit auth.users).
  const { data: dateien } = await admin.storage.from("klientin-dateien").list(user.id, { limit: 1000 });
  if (dateien?.length) {
    await admin.storage.from("klientin-dateien").remove(dateien.map((d) => `${user.id}/${d.name}`));
  }

  // 4 · Konto löschen — alle Tabellen hängen per ON DELETE CASCADE an auth.users.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, geloescht_am: new Date().toISOString() });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
