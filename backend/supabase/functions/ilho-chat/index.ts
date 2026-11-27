// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "ilho-chat"
// Klientin schreibt → Mistral Small antwortet als ilho.
// Danach (im Hintergrund) eine kurze, nicht-diagnostische Zusammenfassung
// in "insights" — ABER NUR, wenn die Klientin mindestens einen Bereich
// freigegeben hat (Tabelle consent). Ohne Freigabe wird nichts gespeichert.
//
// Deploy:  supabase functions deploy ilho-chat --use-api
// Secrets: MISTRAL_API_KEY, optional MISTRAL_CHAT_MODELL (Standard mistral-small-2603),
//          KI_TAGESLIMIT (Standard 30, geteilt mit der Function "ai")
// ─────────────────────────────────────────────────────────────

import { createClient } from "jsr:@supabase/supabase-js@2";

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY")!;
const CHAT_MODELL = Deno.env.get("MISTRAL_CHAT_MODELL") ?? "mistral-small-2603";
const TAGESLIMIT = Number(Deno.env.get("KI_TAGESLIMIT") ?? "30");
const MAX_VERLAUF = 16;          // letzte Nachrichten, die mitgeschickt werden
const MAX_ZEICHEN = 4000;        // pro Nachricht

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Zusammenfassung: bewusst ohne Deutung, Diagnose oder Risikoeinschätzung.
const ZUSAMMENFASSUNG_SYSTEM = `Du fasst die aktuelle Nachricht einer Nutzerin an ihren KI-Begleiter ilho für ihre eigene Rückschau und — nur mit ihrer Freigabe — für ihre Coachin zusammen.
Antworte NUR mit JSON in dieser Form:
{"stimmung": 1-5 oder null, "themen": ["…"], "ziele": ["…"], "zusammenfassung": "…", "krise": true|false, "lernthema": "…"}
Regeln:
- stimmung: wie die Nutzerin ihre Stimmung selbst beschreibt (1 sehr schwer … 5 sehr gut). Wenn sie nichts dazu sagt: null. Nicht raten.
- themen: höchstens 4 neutrale Schlagworte auf Deutsch (z. B. "Grenzen", "Selbstwert", "Beruf"). Keine Namen Dritter, keine Gesundheitsangaben, keine Diagnosen.
- ziele: nur Ziele oder Vorhaben, die sie selbst ausspricht, in ihren Worten, höchstens 3.
- zusammenfassung: 1–2 sachliche Sätze in der dritten Person ("Sie möchte …"). Keine Deutung, keine Bewertung, keine psychologischen Begriffe, keine Zitate intimer Details.
- lernthema: genau eine Kategorie aus Alltag, Beruf, Beziehungen, Grenzen, Selbstwert, Ziele, Sonstiges.
- krise: true, wenn Anzeichen akuter Krise, Selbstverletzung oder Suizidgedanken vorkommen.`;

async function mistral(body: Record<string, unknown>) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Mistral ${res.status}`);
  return String(data.choices?.[0]?.message?.content ?? "").trim();
}

const kurz = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

async function zusammenfassen(userId: string, beginn: string, nachricht: string) {
  const { data: freigaben } = await admin.from("consent").select("bereich").eq("user_id", userId).eq("aktiv", true).lte("erteilt_am", beginn);
  if (!freigaben?.length) return; // Privacy by Default

  const roh = await mistral({
    model: CHAT_MODELL,
    temperature: 0.1,
    max_tokens: 300,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ZUSAMMENFASSUNG_SYSTEM },
      { role: "user", content: nachricht },
    ],
  });

  let j: any;
  try { j = JSON.parse(roh); } catch { return; }

  // In einer Krise wird kein Inhalt gespeichert: das gehört in ein echtes Gespräch,
  // nicht in ein Analyse-Fenster. ilho hat im Chat selbst bereits auf Hilfe verwiesen.
  if (j?.krise !== false) return;

  const stimmung = Number.isInteger(j.stimmung) && j.stimmung >= 1 && j.stimmung <= 5 ? j.stimmung : null;
  const liste = (x: unknown, max: number) =>
    Array.isArray(x) ? x.map((t) => kurz(t, 60)).filter(Boolean).slice(0, max) : [];

  const { error } = await admin.rpc("ilho_erkenntnis_speichern", {
    p_user: userId, p_beginn: beginn, p_modell: CHAT_MODELL, p_stimmung: stimmung,
    p_themen: liste(j.themen, 4), p_ziele: liste(j.ziele, 3),
    p_kurz: kurz(j.zusammenfassung, 400) || null, p_lernthema: kurz(j.lernthema, 40),
  });
  if (error) throw new Error("Speichern der Erkenntnis fehlgeschlagen");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    if (req.method !== "POST") return json({ error: "POST erforderlich" }, 405);
    const beginn = new Date().toISOString();
    const token = req.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return json({ error: "Anmeldung erforderlich" }, 401);
    const { data, error: authFehler } = await admin.auth.getUser(token);
    const userId = data.user?.id;
    if (authFehler || !userId) return json({ error: "Anmeldung erforderlich" }, 401);

    const { messages, system } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) return json({ error: "messages[] erforderlich" }, 400);

    if (TAGESLIMIT > 0) {
      const { data: stand, error: zaehlFehler } = await admin.rpc("ki_zaehlen", { p_user: userId });
      if (zaehlFehler || stand == null) return json({ error: "Limitprüfung nicht verfügbar" }, 503);
      if (Number(stand) > TAGESLIMIT) {
        return json({
          text: "Für heute haben wir genug geschrieben 🤍 Morgen bin ich wieder für dich da — " +
            "und alles, was du im Journal festhältst, bleibt natürlich jederzeit möglich.",
          limit_erreicht: true,
        });
      }
    }

    const verlauf = messages
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && m?.content)
      .slice(-MAX_VERLAUF)
      .map((m: any) => ({ role: m.role, content: kurz(m.content, MAX_ZEICHEN) }));
    if (!verlauf.length || verlauf[verlauf.length - 1].role !== "user") {
      return json({ error: "Die letzte Nachricht muss von der Nutzerin sein" }, 400);
    }

    // Der System-Prompt kommt aus app/src/ilho.js (eine Quelle, s. CLAUDE.md).
    const ausgabe = await mistral({
      model: CHAT_MODELL,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: kurz(system, 20000) +
        '\nAntworte als JSON: {"text":"Deine vollständige Antwort","krise":true oder false}. ' +
        'Prüfe den gesamten sichtbaren Verlauf auf akute Krise, Selbstverletzung oder Suizidgedanken. ' +
        'Setze krise bei Anzeichen oder Unsicherheit auf true. Die Hilfestellung steht in text.' }, ...verlauf],
    });

    const antwort = JSON.parse(ausgabe);
    if (typeof antwort?.text !== "string" || !antwort.text.trim()) throw new Error("Leere Modellantwort");
    const text = antwort.text.trim();

    // Nur die neue Nachricht auswerten. Vor der Einwilligung geschriebene
    // Nachrichten und die Antwort (die alten Kontext zitieren kann) bleiben außen vor.
    if (antwort.krise === false) {
      const hintergrund = zusammenfassen(userId, beginn, verlauf[verlauf.length - 1].content)
        .catch(() => console.error("Erkenntnis konnte nicht gespeichert werden"));
      // @ts-ignore EdgeRuntime existiert in Supabase Edge Functions
      if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(hintergrund);
      else await hintergrund;
    }
    return json({ text });
  } catch (e) {
    console.error("ilho-chat: Anfrage fehlgeschlagen");
    return json({ error: "ilho ist gerade nicht erreichbar" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
