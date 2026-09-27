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
const MAX_TOKENS_HART = 2500; // Werkstatt-Programme brauchen mehr als ein Chat-Satz

// ── Recherche-Modus (Coach-Werkstatt) ────────────────────────
// Websuche mit Quellen. System-Prompt liegt bewusst HIER (serverseitig),
// damit der Modus nicht vom Browser umgebogen werden kann. Nur für angemeldete Nutzerinnen.
const RECHERCHE_MODELL = "claude-opus-5";
const RECHERCHE_SYSTEM = `Du recherchierst für eine Coachin (Persönlichkeitsentwicklung, Frauen 30–50) im Web und antwortest auf Deutsch in der Du-Form.
Regeln:
1. Stütze jede Sachaussage auf eine gefundene Quelle. Bevorzuge Fachliteratur, Studien, Hochschulen, Fachverbände (z. B. ICF, DBVC) und seriöse Fachmedien vor Blogs.
2. Trenne klar zwischen Befund (was Quellen belegen) und Einordnung (deine Deutung). Die Einordnung beginnt mit "Einordnung:".
3. Sage offen, wenn die Beleglage dünn, alt oder widersprüchlich ist oder du nichts Belastbares findest. Erfinde nie Studien, Zahlen oder Autorinnen.
4. Keine Diagnosen und keine Therapieempfehlungen für Klientinnen; bei klinischen Themen darauf hinweisen, dass das in fachtherapeutische Hände gehört.
5. Die Coachin entscheidet — formuliere Anregungen, keine Anweisungen.
6. Schlichter Text ohne Markdown (keine Sternchen, keine #). Aufbau: eine Kurzantwort, dann die Kernpunkte als Zeilen mit "– ", dann "Was offen bleibt:", dann "Einordnung:".`;

const RECHERCHE_TIEFE: Record<string, { effort: string; max_tokens: number; max_uses: number }> = {
  kurz: { effort: "medium", max_tokens: 4000, max_uses: 4 },
  ausfuehrlich: { effort: "high", max_tokens: 10000, max_uses: 10 },
};

async function recherchieren(frage: string, tiefe: string) {
  const t = RECHERCHE_TIEFE[tiefe] ?? RECHERCHE_TIEFE.kurz;
  const messages: any[] = [{ role: "user", content: frage }];
  let data: any = null;
  const inhalt: any[] = [];

  // Server-Tools können mit pause_turn unterbrechen — dann einfach fortsetzen.
  for (let runde = 0; runde < 3; runde++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "server-side-fallback-2026-07-01",
      },
      body: JSON.stringify({
        model: RECHERCHE_MODELL,
        max_tokens: t.max_tokens,
        output_config: { effort: t.effort },
        fallbacks: "default",
        system: RECHERCHE_SYSTEM,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: t.max_uses }],
        messages,
      }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Anthropic ${res.status}`);
    inhalt.push(...(data.content || []));
    if (data.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: data.content });
  }

  if (data?.stop_reason === "refusal") {
    return { text: "Zu dieser Frage kann ich keine Recherche liefern. Formuliere sie gern anders.", quellen: [] };
  }

  // Zitate aus den Textblöcken sammeln und als [n] hinter die belegte Stelle setzen.
  const quellen: { titel: string; url: string }[] = [];
  const nummer = (url: string, titel: string) => {
    let i = quellen.findIndex((q) => q.url === url);
    if (i < 0) { quellen.push({ url, titel: titel || url }); i = quellen.length - 1; }
    return i + 1;
  };
  let text = "";
  for (const b of inhalt) {
    if (b.type !== "text") continue;
    text += b.text;
    const nrn = [...new Set((b.citations || [])
      .filter((c: any) => c.url)
      .map((c: any) => nummer(c.url, c.title)))];
    if (nrn.length) text += " " + nrn.map((n) => `[${n}]`).join("");
  }
  return { text: text.trim(), quellen };
}

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
    const { messages, system, max_tokens = 800, modus, frage, tiefe } = await req.json();

    if (modus === "recherche") {
      const userId = userIdAus(req.headers.get("authorization"));
      if (!userId) return json({ error: "Anmeldung erforderlich" }, 401);
      if (typeof frage !== "string" || !frage.trim()) return json({ error: "frage erforderlich" }, 400);
      if (TAGESLIMIT > 0 && (await zaehlen(userId)) > TAGESLIMIT) {
        return json({ text: "Das Tageslimit ist erreicht — morgen geht es weiter.", quellen: [], limit_erreicht: true });
      }
      return json(await recherchieren(frage.trim().slice(0, 1500), tiefe));
    }

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
