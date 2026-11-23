import Anthropic from "@anthropic-ai/sdk";
import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";
import { CLIENT_TIMEZONE, TURN_TIMEOUT_MS, loadAgentConfig, requireEnv } from "./config.js";
import { createClient } from "./client.js";
import { createDataLayer } from "./data/index.js";
import { IlhovaChat, TurnTimeoutError } from "./session.js";
import { SessionStore } from "./sessionStore.js";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_CHARS = 4000;
const CLIENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(json) });
  res.end(json);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Body zu groß"), { status: 413 });
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Ungültiges JSON"), { status: 400 });
  }
}

export function startServer() {
  const serviceKey = requireEnv("ILHOVA_SERVICE_KEY");
  const chat = new IlhovaChat({
    client: createClient(),
    data: createDataLayer(),
    store: new SessionStore(),
    config: loadAgentConfig(),
    timezone: CLIENT_TIMEZONE,
    turnTimeoutMs: TURN_TIMEOUT_MS,
  });

  const server = createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true });

      if (req.method === "POST" && req.url === "/chat") {
        // API-Key-Prüfung (Header x-api-key oder Authorization: Bearer …)
        const provided =
          (req.headers["x-api-key"] as string | undefined) ??
          (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "");
        if (!provided || !safeEqual(provided, serviceKey)) return send(res, 401, { error: "unauthorized" });

        const body = (await readJson(req)) as { client_id?: unknown; message?: unknown };
        if (typeof body.client_id !== "string" || !CLIENT_ID_RE.test(body.client_id)) {
          return send(res, 400, { error: "client_id fehlt oder ist ungültig (A–Z, a–z, 0–9, _ und -, max. 64 Zeichen)" });
        }
        if (typeof body.message !== "string" || !body.message.trim() || body.message.length > MAX_MESSAGE_CHARS) {
          return send(res, 400, { error: `message fehlt oder ist länger als ${MAX_MESSAGE_CHARS} Zeichen` });
        }

        const result = await chat.chat(body.client_id, body.message.trim());
        return send(res, 200, {
          reply: result.reply,
          session_id: result.session_id,
          usage: {
            input_tokens: result.report.tokens.input_tokens,
            output_tokens: result.report.tokens.output_tokens,
            estimated_cost_usd: Number(result.report.estimate.total_usd.toFixed(5)),
          },
        });
      }

      return send(res, 404, { error: "not_found" });
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 400 || status === 413) return send(res, status, { error: (e as Error).message });
      if (e instanceof TurnTimeoutError) return send(res, 504, { error: "timeout" });
      if (e instanceof Anthropic.RateLimitError) return send(res, 429, { error: "rate_limited" });
      console.error("[server] Fehler:", e);
      return send(res, 500, { error: "internal_error" });
    }
  });

  const port = Number(process.env.PORT) || 8787;
  const host = process.env.HOST || "127.0.0.1";
  server.listen(port, host, () => console.log(`ilhova agent läuft auf http://${host}:${port}  (POST /chat, GET /health)`));
  return server;
}

// Direkt gestartet (npm run serve)?
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
