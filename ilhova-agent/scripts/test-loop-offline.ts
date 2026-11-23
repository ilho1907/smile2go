/**
 * SIMULIERTER Mechanik-Test der Event-Schleife (src/session.ts) gegen einen lokalen Fake-Server.
 * Braucht keinen API-Key und kein Netzwerk. Er prüft NUR unseren Code (Stream öffnen, Custom-Tool-
 * Aufrufe beantworten, Session fortsetzen, Token-Zählung) – NICHT das Verhalten des echten Modells
 * oder der echten API. Dafür gibt es `npm run test:session`.
 *
 *   npm run test:loop
 */
import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentConfig } from "../src/config.js";
import { MockDataLayer } from "../src/data/mock.js";
import { IlhovaChat } from "../src/session.js";
import { SessionStore } from "../src/sessionStore.js";

const CLIENT = "sim-klientin-1";
const SESSION_ID = "sesn_fake1";

// ---------- Fake Managed-Agents-API ----------
let created = 0;
let stream: ServerResponse | undefined;
let n = 0;
const received: Array<Record<string, any>> = [];
const waiters = new Map<string, () => void>();
const emit = (ev: Record<string, unknown>) =>
  stream!.write(`event: ${ev.type}\ndata: ${JSON.stringify({ id: `sevt_${++n}`, processed_at: new Date().toISOString(), ...ev })}\n\n`); // der SDK-Parser verlangt eine event:-Zeile
const waitFor = (id: string) => new Promise<void>((res) => waiters.set(id, res));
const usage = { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
let turns = 0;

async function script() {
  turns++;
  emit({ type: "span.model_request_end", is_error: false, model_request_start_id: "x", model_usage: usage });
  emit({ type: "agent.custom_tool_use", id: `sevt_tool_a${turns}`, name: "get_client_context", input: { client_id: CLIENT } });
  emit({ type: "session.status_idle", stop_reason: { type: "requires_action", event_ids: [`sevt_tool_a${turns}`] } });
  await waitFor(`sevt_tool_a${turns}`);
  emit({ type: "span.model_request_end", is_error: false, model_request_start_id: "x", model_usage: usage });
  emit({ type: "agent.custom_tool_use", id: `sevt_tool_b${turns}`, name: "share_with_coach", input: { client_id: CLIENT, data_type: "mood_trend", summary: "x" } });
  emit({ type: "session.status_idle", stop_reason: { type: "requires_action", event_ids: [`sevt_tool_b${turns}`] } });
  await waitFor(`sevt_tool_b${turns}`);
  emit({ type: "agent.message", content: [{ type: "text", text: "Dafür fehlt mir deine Freigabe." }] });
  emit({ type: "span.model_request_end", is_error: false, model_request_start_id: "x", model_usage: usage });
  emit({ type: "session.status_idle", stop_reason: { type: "end_turn" } });
}

const sessionJson = () => ({
  id: SESSION_ID, type: "session", status: "idle", archived_at: null,
  usage: { active_seconds: turns * 3, list_cost: { amount: String(turns * 2), currency: "USD" } },
});

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const json = (b: unknown) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(b)); };
  if (req.method === "POST" && url.startsWith("/v1/sessions") && !url.includes("/events")) { created++; return json(sessionJson()); }
  if (req.method === "GET" && /^\/v1\/sessions\/[^/]+(\?.*)?$/.test(url)) return json(sessionJson());
  if (req.method === "GET" && /\/events(\?.*)?$/.test(url)) return json({ data: [{ id: "sevt_x", type: "session.status_idle", stop_reason: { type: "end_turn" } }], has_more: false });
  if (req.method === "GET" && url.includes("/events/stream")) {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
    stream = res;
    res.write(": open\n\n");
    return;
  }
  if (req.method === "POST" && url.includes("/events")) {
    let body = "";
    for await (const c of req) body += c;
    for (const ev of JSON.parse(body).events as Array<Record<string, any>>) {
      received.push(ev);
      if (ev.type === "user.message") void script();
      if (ev.type === "user.custom_tool_result") waiters.get(ev.custom_tool_use_id)?.();
    }
    return json({ data: [] });
  }
  res.writeHead(404).end();
});
await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
const port = (server.address() as { port: number }).port;

// ---------- Test ----------
const client = new Anthropic({ apiKey: "sim-key", baseURL: `http://127.0.0.1:${port}`, maxRetries: 0 });
const data = new MockDataLayer();
data.addClient(CLIENT, ["goals"]);
const dir = mkdtempSync(join(tmpdir(), "ilhova-sim-"));
const config: AgentConfig = {
  environment_id: "env_fake", agent_id: "agent_fake", agent_version: 3, pinned_version: 3,
  model: "claude-opus-5-5", prompt_sha256: "x", created_at: "", updated_at: "",
};
const chat = new IlhovaChat({ client, data, store: new SessionStore(join(dir, "s.json")), config, timezone: "Europe/Berlin", turnTimeoutMs: 10_000, usageLogPath: join(dir, "u.jsonl") });

const r1 = await chat.chat(CLIENT, "Bitte teile meine Stimmung mit der Coachin.");
assert.equal(r1.reply, "Dafür fehlt mir deine Freigabe.");
assert.equal(r1.new_session, true);
assert.deepEqual(r1.tool_calls.map((c) => c.name), ["get_client_context", "share_with_coach"]);
assert.equal(r1.tool_calls[1]!.is_error, true);
assert.equal(r1.tool_calls[1]!.payload.error, "consent_required");
assert.equal(data.listShares(CLIENT).length, 0);
assert.equal(r1.report.tokens.input_tokens, 300);
assert.equal(r1.report.tokens.output_tokens, 60);
assert.equal(r1.report.model_requests, 3);
const results = received.filter((e) => e.type === "user.custom_tool_result");
assert.equal(results.length, 2);
assert.equal(results[1]!.is_error, true);
assert.match(JSON.parse(results[1]!.content[0].text).error, /consent_required/);
console.log("  ✓ Turn 1: Stream, Tool-Ergebnisse (inkl. is_error), Token-Zählung");

const r2 = await chat.chat(CLIENT, "Und jetzt nochmal.");
assert.equal(r2.new_session, false);
assert.equal(created, 1);
assert.equal(r2.report.turn_list_cost_usd !== null, true);
console.log("  ✓ Turn 2: bestehende Session fortgesetzt (keine neue erstellt)");

config.pinned_version = 4; // simuliert Agent-Update/Rollback
const r3 = await chat.chat(CLIENT, "Neue Version.");
assert.equal(r3.new_session, true);
assert.equal(created, 2);
console.log("  ✓ Turn 3: geänderte gepinnte Version → neue Session");

server.close();
server.closeAllConnections();
console.log("\nMechanik-Test (SIMULIERT) bestanden. Das ersetzt NICHT den Live-Test (npm run test:session).");
