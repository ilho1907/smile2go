// Supabase pg_cron ruft diesen Endpunkt montags mit einem umgebungsspezifischen Token auf.
// Auswertung ausschließlich auf Basis gruppierter Zahlen, nie aus einzelnen Gesprächstexten.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { timingSafeEqual } from "node:crypto";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const LERN_MODELL = Deno.env.get("MISTRAL_LERN_MODELL") ?? "mistral-large-4";
const ERSATZ_MODELL = "mistral-large-latest";
const SYSTEM = `Du hilfst der Redaktion von smile2go. Du erhältst ausschließlich aggregierte Zahlen
der letzten Woche. Beschreibe nur belegbare Gruppenmuster, keine Einzelfälle oder Diagnosen.
Kennzeichne Vorschläge als Ideen. Leite keine Ursachen, Wirksamkeit oder Bedürfnisse ab, die die
Zahlen nicht zeigen. Ändere keine Regeln zu Krisenhilfe und KI-Transparenz.
Antworte mit JSON und höchstens fünf Einträgen je Liste:
{"haeufige_themen":[],"stimmung_durchschnitt":null,"muster":[],"was_hilft":[],"luecken":[],
"prompt_vorschlaege":[],"inhalts_ideen":[]}.`;

function wochenstart() {
  const jetzt = new Date();
  const tag = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), jetzt.getUTCDate()));
  tag.setUTCDate(tag.getUTCDate() - (tag.getUTCDay() + 6) % 7 - 7);
  return tag.toISOString().slice(0, 10);
}

function erlaubt(req: Request) {
  const token = Deno.env.get("ILHO_CRON_TOKEN");
  if (!token || token.length < 32) return false;
  const encoder = new TextEncoder();
  const a = encoder.encode(token);
  const b = encoder.encode(req.headers.get("X-Ilho-Cron") ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function modellAntwort(modell: string, zahlen: unknown) {
  return await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + Deno.env.get("MISTRAL_API_KEY") },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({ model: modell, temperature: 0.3, max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify(zahlen) }] }),
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "POST erforderlich" }, { status: 405 });
  if (!erlaubt(req)) return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  const woche = wochenstart();
  let reserviert = false;
  try {
    const { data: zahlen, error: leseFehler } = await admin.rpc("ilho_wochenzahlen", { p_von: woche });
    if (leseFehler || !zahlen) throw new Error("Wochenzahlen fehlen");
    const { error: sperre } = await admin.from("ilho_lernen").insert({ woche, status: "offen" });
    if (sperre?.code === "23505") return Response.json({ ok: true, hinweis: "Woche bereits bearbeitet" });
    if (sperre) throw new Error("Wochenlauf nicht reserviert");
    reserviert = true;

    let modell: string | null = null;
    let ergebnis: Record<string, unknown> = { hinweis: "Zu wenige freigegebene Gespräche oder Personen" };
    if (zahlen.auswertbar === true) {
      modell = LERN_MODELL;
      let res = await modellAntwort(modell, zahlen);
      if (res.status === 404 && modell !== ERSATZ_MODELL) {
        modell = ERSATZ_MODELL;
        res = await modellAntwort(modell, zahlen);
      }
      if (!res.ok) throw new Error("Modellanfrage fehlgeschlagen: " + res.status);
      const data = await res.json();
      ergebnis = JSON.parse(data.choices?.[0]?.message?.content ?? "");
      if (!ergebnis || typeof ergebnis !== "object" || Array.isArray(ergebnis)) throw new Error("Ungültiges Ergebnis");
    }
    const { error } = await admin.from("ilho_lernen")
      .update({ anzahl_gespraeche: zahlen.gespraeche, ergebnis, modell }).eq("woche", woche);
    if (error) throw new Error("Speichern fehlgeschlagen");
    return Response.json({ ok: true, woche, anzahl: zahlen.gespraeche, modell });
  } catch {
    if (reserviert) await admin.from("ilho_lernen").delete().eq("woche", woche).is("ergebnis", null);
    return Response.json({ error: "Wochenlauf fehlgeschlagen" }, { status: 500 });
  }
});
