// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "tts"
// Sprachausgabe für Kartenbotschaften und Rituale — mit der geklonten Stimme
// der Coachin oder der neutralen smile2go-Stimme.
//
// ANBIETER-ADAPTER: Die Anbieterwahl steckt ausschließlich in `erzeugeAudio()`.
// Ist kein Schlüssel gesetzt, antwortet die Function sauber mit
// { nicht_konfiguriert: true } — die App zeigt dann einfach keinen Hörknopf.
// So läuft alles andere heute schon, und der Anbieter wird später eingehängt.
//
// Deploy:  supabase functions deploy tts
// Secrets: supabase secrets set ELEVENLABS_API_KEY=...   (oder HIGGSFIELD_API_KEY=...)
//          supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
// ─────────────────────────────────────────────────────────────

const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";
const HIGGSFIELD_KEY = Deno.env.get("HIGGSFIELD_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "audio";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { text, kategorie = "karte", coach_id = null, voice_id = null } = await req.json();
    if (!text || String(text).trim().length < 5) return json({ error: "text erforderlich" }, 400);

    const anbieter = ELEVENLABS_KEY ? "elevenlabs" : HIGGSFIELD_KEY ? "higgsfield" : null;
    if (!anbieter) return json({ nicht_konfiguriert: true });

    const stimme = voice_id || "neutral";
    const hash = await sha256(`${text}::${stimme}::${anbieter}`);

    // 1) Cache — derselbe Text wird nie zweimal erzeugt.
    const treffer = await rest(`audio_cache?text_hash=eq.${hash}&select=storage_pfad`);
    if (treffer?.[0]?.storage_pfad) {
      return json({ url: oeffentlicheUrl(treffer[0].storage_pfad), aus_cache: true, ki_generiert: true });
    }

    // 2) Erzeugen
    const audio = await erzeugeAudio(anbieter, String(text), stimme);
    if (!audio) return json({ error: "Sprachausgabe fehlgeschlagen" }, 502);

    // 3) Ablegen + Cache-Eintrag
    const pfad = `${kategorie}/${hash}.mp3`;
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${pfad}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "audio/mpeg", "x-upsert": "true" },
      body: audio,
    });
    if (!up.ok) return json({ error: "Upload fehlgeschlagen" }, 502);

    await fetch(`${SUPABASE_URL}/rest/v1/audio_cache`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({ coach_id, text_hash: hash, kategorie, storage_pfad: pfad, ki_generiert: true }),
    });

    return json({ url: oeffentlicheUrl(pfad), aus_cache: false, ki_generiert: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

// ── Der einzige anbieterspezifische Teil ────────────────────────────────────
async function erzeugeAudio(anbieter: string, text: string, voiceId: string): Promise<ArrayBuffer | null> {
  if (anbieter === "elevenlabs") {
    const stimme = voiceId !== "neutral" ? voiceId : "21m00Tcm4TlvDq8ikWAM"; // neutrale Fallback-Stimme
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${stimme}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
      }),
    });
    return res.ok ? await res.arrayBuffer() : null;
  }

  if (anbieter === "higgsfield") {
    // TODO: Endpunkt/Body an die Higgsfield-Sprachschnittstelle anpassen, sobald
    // die deutsche Stimmqualität geprüft ist. Struktur bleibt identisch —
    // Rückgabe muss ein MP3-ArrayBuffer sein.
    const res = await fetch("https://api.higgsfield.ai/v1/tts", {
      method: "POST",
      headers: { Authorization: `Bearer ${HIGGSFIELD_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId, language: "de" }),
    });
    return res.ok ? await res.arrayBuffer() : null;
  }

  return null;
}

// ── Helfer ──────────────────────────────────────────────────────────────────
function oeffentlicheUrl(pfad: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${pfad}`;
}

async function rest(pfad: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pfad}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  return res.ok ? await res.json() : null;
}

async function sha256(t: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
