// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "ai"
// ilho / Coaching-Intelligenz — Claude-Proxy mit Tageslimit.
// Der ANTHROPIC_API_KEY bleibt AUSSCHLIESSLICH serverseitig (nie im Browser).
// Deploy:  supabase functions deploy ai --use-api
// Secrets: ANTHROPIC_API_KEY, optional KI_TAGESLIMIT (Standard 30)
// ─────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TAGESLIMIT = Number(Deno.env.get("KI_TAGESLIMIT") ?? "30");
const MAX_TOKENS_HART = 800;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Nutzer-ID aus dem bereits von Supabase geprueften JWT lesen
function userIdAus(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const teile = token.split(".");
  if (teile.length < 2) return null;
  try {
    const roh = atob(teile[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(roh).sub ?? null;
  } catch {
    return null;
  }
}

async function zaehlen(userId: string): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ki_zaehlen`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ p_user: userId }),
  });
  if (!res.ok) return 0; // im Zweifel durchlassen, nie blockieren wegen Zaehlfehler
  return Number(await res.json()) || 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { messages, system, max_tokens = 800 } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages[] erforderlich" }, 400);
    }

    const userId = userIdAus(req.headers.get("authorization"));
    if (userId && TAGESLIMIT > 0) {
      const stand = await zaehlen(userId);
      if (stand > TAGESLIMIT) {
        return json({
          text:
            "Für heute haben wir genug geschrieben 🤍 Morgen bin ich wieder für dich da — " +
            "und alles, was du im Journal festhältst, bleibt natürlich jederzeit möglich.",
          limit_erreicht: true,
        });
      }
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: Math.min(Number(max_tokens) || 800, MAX_TOKENS_HART),
        system,
        messages,
      }),
    });

    const data = await res.json();
    const text = (data.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    return json({ text: text || "Ich bin hier. Erzähl mir mehr davon. 🤍" });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
