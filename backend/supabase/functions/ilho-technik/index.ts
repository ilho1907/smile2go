// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "ilho-technik"
// Hilfe & Support: Ticket anlegen + KI-Einstufung (Claude) + Routing.
//
// Ablauf „erstellen“:
//   1. Anmeldung prüfen (JWT über auth.getUser — nicht nur dekodieren)
//   2. Ticket MIT DEM JWT DER NUTZERIN anlegen (RPC support_ticket_anlegen):
//      Datenbank prüft Rechte, Länge, Kategorie, Limit; gleicher Schlüssel = gleiches Ticket
//   3. Erst danach Claude fragen. Fehlt der Schlüssel, Fehler, Zeitüberschreitung
//      → support_ki_fehlschlag: Ticket bleibt, landet in der manuellen Prüfung
//   4. Ergebnis über support_ki_ergebnis (nur Service-Key) — wirkt genau einmal,
//      Zuständigkeit kommt aus support_regeln, nicht von der KI
//
// Die KI schreibt der Nutzerin nie und schließt nie ein Ticket.
//
// Deploy:  supabase functions deploy ilho-technik --use-api
// Secrets: ANTHROPIC_API_KEY (schon für "ai" gesetzt)
//          optional SUPPORT_KI_MODELL (Standard claude-haiku-4-5-20251001)
//          optional SUPPORT_KI_TIMEOUT_MS (Standard 12000)
//          optional SUPPORT_KI_AUS=1 → KI komplett aus, alles manuell
// ─────────────────────────────────────────────────────────────

import { createClient } from "jsr:@supabase/supabase-js@2";
import { einstufen } from "./routing.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODELL = Deno.env.get("SUPPORT_KI_MODELL") ?? "claude-haiku-4-5-20251001";
const TIMEOUT = Number(Deno.env.get("SUPPORT_KI_TIMEOUT_MS") ?? "12000");
const KI_AUS = Deno.env.get("SUPPORT_KI_AUS") === "1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "nur POST" }, 405);

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth?.user) return json({ error: "Anmeldung erforderlich" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "ungültige Anfrage" }, 400); }
  if (body?.aktion !== "erstellen") return json({ error: "unbekannte Aktion" }, 400);

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const betreff = str(body.betreff, 150);
  const beschreibung = str(body.beschreibung, 5000);
  const kategorie = str(body.kategorie, 20);
  const schluessel = str(body.schluessel, 80);

  // Als Nutzerin anlegen: auth.uid() in der Datenbank ist SIE, nicht der Server.
  const alsSie = createClient(URL_, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: angelegt, error } = await alsSie.rpc("support_ticket_anlegen", {
    p_betreff: betreff, p_beschreibung: beschreibung, p_kategorie: kategorie, p_schluessel: schluessel,
  });
  if (error) {
    const zuViele = /Zu viele/.test(error.message);
    return json({ error: zuViele ? "Du hast heute schon viele Anfragen gestellt. Bitte versuche es morgen wieder." : "Ticket konnte nicht gespeichert werden.", detail: error.message }, zuViele ? 429 : 400);
  }

  // Ab hier ist das Ticket sicher gespeichert. Alles Weitere darf scheitern.
  const id = angelegt.id as string;
  const { data: t } = await admin.from("support_tickets")
    .select("betreff, beschreibung, kategorie_nutzerin, ki_status").eq("id", id).single();

  let routing = "unveraendert";
  if (t?.ki_status === "ausstehend") {          // auch bei Wiederholung nach Absturz
    if (KI_AUS || !API_KEY) {
      await admin.rpc("support_ki_fehlschlag", { p_ticket: id, p_grund: KI_AUS ? "KI-Einstufung abgeschaltet" : "ANTHROPIC_API_KEY fehlt" });
      routing = "manuell";
    } else {
      try {
        const e = await einstufen(t, { apiKey: API_KEY, modell: MODELL, timeoutMs: TIMEOUT });
        const { error: fe } = await admin.rpc("support_ki_ergebnis", {
          p_ticket: id, p_kategorie: e.kategorie, p_prioritaet: e.prioritaet, p_begruendung: e.begruendung, p_modell: MODELL,
        });
        if (fe) throw new Error(fe.message);
        routing = "ok";
      } catch (e) {
        console.warn("ilho-technik:", String(e));
        await admin.rpc("support_ki_fehlschlag", { p_ticket: id, p_grund: String((e as Error)?.message ?? e).slice(0, 300) });
        routing = "manuell";
      }
    }
  }

  // Nutzerin bekommt nur Nummer und Bestätigung — keine KI-Details.
  return json({ id, nummer: angelegt.nummer, neu: angelegt.neu, routing });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });
}
