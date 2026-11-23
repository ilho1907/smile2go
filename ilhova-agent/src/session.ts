import Anthropic from "@anthropic-ai/sdk";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { AgentConfig } from "./config.js";
import { USAGE_LOG_PATH } from "./config.js";
import { type CostEstimate, type TokenUsage, emptyUsage, estimateCost, usd } from "./cost.js";
import type { DataLayer } from "./data/types.js";
import { SessionStore } from "./sessionStore.js";
import { runTool } from "./tools/handlers.js";

export interface ToolCallRecord {
  name: string;
  input: unknown;
  is_error: boolean;
  payload: Record<string, unknown>;
}

export interface TurnReport {
  tokens: TokenUsage;
  model_requests: number;
  active_seconds: number;
  estimate: CostEstimate;
  /** Von der API gemeldete kumulative Listenkosten der Session in USD (auf Cent gerundet), falls verfügbar. */
  session_list_cost_usd: number | null;
  /** Differenz der gemeldeten Listenkosten gegenüber vor dem Turn (grob, da auf Cent gerundet). */
  turn_list_cost_usd: number | null;
}

export interface ChatResult {
  reply: string;
  client_id: string;
  session_id: string;
  new_session: boolean;
  agent_version: number;
  tool_calls: ToolCallRecord[];
  report: TurnReport;
}

export class TurnTimeoutError extends Error {}

export interface ChatDeps {
  client: Anthropic;
  data: DataLayer;
  store: SessionStore;
  config: AgentConfig;
  timezone: string;
  turnTimeoutMs: number;
  usageLogPath?: string;
  /** Test-Hook für die Uhr (Standard: echte Zeit). */
  now?: () => Date;
}

const centsToUsd = (amount: string | undefined | null) => (amount == null ? null : Number(amount) / 100);

/**
 * Ein Chat-Turn pro Aufruf: Klientin → Session (öffnen oder fortsetzen) → Event-Stream
 * → Custom-Tool-Aufrufe lokal ausführen → Antwort + Kosten.
 */
export class IlhovaChat {
  private tails = new Map<string, Promise<void>>();

  constructor(private deps: ChatDeps) {}

  /** Pro Klientin höchstens ein Turn gleichzeitig (sonst vermischen sich Events einer Session). */
  chat(clientId: string, message: string): Promise<ChatResult> {
    const prev = this.tails.get(clientId) ?? Promise.resolve();
    const run = prev.then(() => this.runTurn(clientId, message));
    const tail = run.then(
      () => undefined,
      () => undefined,
    );
    this.tails.set(clientId, tail);
    void tail.then(() => {
      if (this.tails.get(clientId) === tail) this.tails.delete(clientId);
    });
    return run;
  }

  private async ensureSession(clientId: string) {
    const { client, store, config } = this.deps;
    const stored = store.get(clientId);

    // Sessions bleiben an die Agent-Version gepinnt, mit der sie erstellt wurden.
    // Hat sich die gepinnte Version geändert (Update/Rollback), starten wir eine neue Session.
    if (stored && stored.agent_version === config.pinned_version) {
      try {
        const existing = await client.beta.sessions.retrieve(stored.session_id);
        if (existing.status !== "terminated" && !existing.archived_at) {
          return { session: existing, created: false };
        }
      } catch (e) {
        if (!(e instanceof Anthropic.NotFoundError)) throw e;
      }
    }

    const session = await client.beta.sessions.create({
      // BETA: `agent` mit fester Version → reproduzierbar, Rollback über pinned_version.
      agent: { type: "agent", id: config.agent_id, version: config.pinned_version },
      environment_id: config.environment_id,
      title: `ilhova ${clientId}`,
      metadata: { client_ref: clientId },
    });
    const now = new Date().toISOString();
    store.set(clientId, {
      session_id: session.id,
      agent_version: config.pinned_version,
      created_at: now,
      last_used_at: now,
      turns: 0,
    });
    return { session, created: true };
  }

  /**
   * Falls ein früherer Turn mitten im Tool-Aufruf abgebrochen ist (Prozess-Neustart, Netzwerk),
   * wartet die Session auf ein Tool-Ergebnis und lehnt neue Nachrichten ab. Wir beantworten die
   * offenen Aufrufe mit einem Fehler, damit sie weiterlaufen kann.
   */
  private async recoverPendingToolCalls(sessionId: string): Promise<void> {
    const { client } = this.deps;
    const s = await client.beta.sessions.retrieve(sessionId);
    if (s.status !== "idle") return;
    const page = await client.beta.sessions.events.list(sessionId, {
      order: "desc",
      limit: 5,
      types: ["session.status_idle"],
    });
    const last = page.data[0];
    if (last?.type !== "session.status_idle" || last.stop_reason.type !== "requires_action") return;
    for (const eventId of last.stop_reason.event_ids) {
      await client.beta.sessions.events.send(sessionId, {
        events: [
          {
            type: "user.custom_tool_result",
            custom_tool_use_id: eventId,
            is_error: true,
            content: [{ type: "text", text: JSON.stringify({ ok: false, error: "interrupted", message: "Die Verbindung war unterbrochen. Bitte erneut versuchen." }) }],
          },
        ],
      });
    }
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      if ((await client.beta.sessions.retrieve(sessionId)).status === "idle") return;
    }
  }

  private async runTurn(clientId: string, message: string): Promise<ChatResult> {
    const { client, data, store, config, timezone, turnTimeoutMs } = this.deps;
    const { session, created } = await this.ensureSession(clientId);
    if (!created) {
      try {
        await this.recoverPendingToolCalls(session.id);
      } catch (e) {
        // Best effort – ein Fehler hier darf den normalen Chat nicht verhindern.
        console.warn(`[session ${session.id}] Recovery offener Tool-Aufrufe fehlgeschlagen:`, e);
      }
    }

    const baselineCost = centsToUsd(session.usage?.list_cost?.amount) ?? 0;
    const baselineActive = session.usage?.active_seconds ?? 0;

    const tokens = emptyUsage();
    let modelRequests = 0;
    const messages: string[] = [];
    const toolCalls: ToolCallRecord[] = [];
    const toolCtx = { clientId, data, timezone, now: this.deps.now };

    // Stream ZUERST öffnen, dann senden (der Stream liefert nur Events ab dem Öffnen).
    const stream = await client.beta.sessions.events.stream(session.id);
    let timedOut = false;
    let hardTimer: NodeJS.Timeout | undefined;
    const timer = setTimeout(async () => {
      timedOut = true;
      try {
        await client.beta.sessions.events.send(session.id, { events: [{ type: "user.interrupt" }] });
      } catch {
        /* egal – harter Abbruch folgt */
      }
      hardTimer = setTimeout(() => stream.controller.abort(), 15_000);
    }, turnTimeoutMs);

    let finished = false;
    try {
      await client.beta.sessions.events.send(session.id, {
        events: [{ type: "user.message", content: [{ type: "text", text: message }] }],
      });

      for await (const ev of stream) {
        switch (ev.type) {
          case "agent.message":
            for (const block of ev.content) {
              if (block.type === "text" && block.text.trim()) messages.push(block.text.trim());
            }
            break;

          case "agent.custom_tool_use": {
            const outcome = await runTool(ev.name, ev.input, toolCtx);
            toolCalls.push({ name: ev.name, input: ev.input, is_error: outcome.is_error, payload: outcome.payload });
            await client.beta.sessions.events.send(session.id, {
              events: [
                {
                  type: "user.custom_tool_result",
                  custom_tool_use_id: ev.id,
                  is_error: outcome.is_error,
                  content: [{ type: "text", text: JSON.stringify(outcome.payload) }],
                },
              ],
            });
            break;
          }

          case "span.model_request_end":
            modelRequests++;
            tokens.input_tokens += ev.model_usage.input_tokens;
            tokens.output_tokens += ev.model_usage.output_tokens;
            tokens.cache_read_input_tokens += ev.model_usage.cache_read_input_tokens;
            tokens.cache_creation_input_tokens += ev.model_usage.cache_creation_input_tokens;
            break;

          case "session.error":
            console.warn(`[session ${session.id}] session.error:`, JSON.stringify(ev.error));
            break;

          case "session.status_idle":
            // requires_action = wartet auf uns (Tool-Ergebnis) → weiter streamen.
            if (ev.stop_reason.type === "requires_action") break;
            if (ev.stop_reason.type === "end_turn") {
              finished = true;
              break;
            }
            // retries_exhausted / budget_reached
            throw new Error(`Session beendet ohne Antwort (stop_reason=${ev.stop_reason.type}).`);

          case "session.status_terminated":
            store.remove(clientId); // nächste Nachricht startet eine neue Session
            throw new Error("Session wurde beendet (terminated).");

          default:
            break;
        }
        if (finished) break;
      }
    } catch (e) {
      if (timedOut) throw new TurnTimeoutError(`Turn nach ${turnTimeoutMs / 1000}s abgebrochen.`);
      throw e;
    } finally {
      clearTimeout(timer);
      if (hardTimer) clearTimeout(hardTimer);
      stream.controller.abort();
    }
    if (timedOut) throw new TurnTimeoutError(`Turn nach ${turnTimeoutMs / 1000}s abgebrochen.`);
    if (!finished) throw new Error("Event-Stream endete, bevor die Session idle wurde.");

    // Kosten: kumulative Werte der Session nach dem Turn abrufen.
    const after = await client.beta.sessions.retrieve(session.id);
    const sessionCost = centsToUsd(after.usage?.list_cost?.amount);
    const activeSeconds = Math.max(0, (after.usage?.active_seconds ?? 0) - baselineActive);
    const report: TurnReport = {
      tokens,
      model_requests: modelRequests,
      active_seconds: activeSeconds,
      estimate: estimateCost(config.model, tokens, activeSeconds),
      session_list_cost_usd: sessionCost,
      turn_list_cost_usd: sessionCost == null ? null : Math.max(0, sessionCost - baselineCost),
    };

    const prev = store.get(clientId);
    store.set(clientId, {
      session_id: session.id,
      agent_version: config.pinned_version,
      created_at: prev?.created_at ?? new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      turns: (prev?.turns ?? 0) + 1,
    });

    const result: ChatResult = {
      reply: messages.join("\n\n"),
      client_id: clientId,
      session_id: session.id,
      new_session: created,
      agent_version: config.pinned_version,
      tool_calls: toolCalls,
      report,
    };
    this.logUsage(result, after.usage);
    return result;
  }

  private logUsage(r: ChatResult, cumulative: Anthropic.Beta.Sessions.BetaManagedAgentsSessionUsage | undefined) {
    const t = r.report.tokens;
    console.log(
      `[usage] session=${r.session_id} client=${r.client_id} v${r.agent_version} ` +
        `in=${t.input_tokens} out=${t.output_tokens} cache_read=${t.cache_read_input_tokens} cache_write=${t.cache_creation_input_tokens} ` +
        `requests=${r.report.model_requests} active=${r.report.active_seconds.toFixed(1)}s ` +
        `est=${usd(r.report.estimate.total_usd)} (tokens ${usd(r.report.estimate.tokens_usd)} + runtime ${usd(r.report.estimate.runtime_usd)}) ` +
        `api_list_cost(session, cumulative)=${r.report.session_list_cost_usd == null ? "n/a" : usd(r.report.session_list_cost_usd)}`,
    );
    const path = this.deps.usageLogPath ?? USAGE_LOG_PATH;
    mkdirSync(dirname(path), { recursive: true });
    // Bewusst KEIN Nachrichtentext im Log – nur Kennzahlen.
    appendFileSync(
      path,
      JSON.stringify({
        ts: new Date().toISOString(),
        client_id: r.client_id,
        session_id: r.session_id,
        agent_version: r.agent_version,
        new_session: r.new_session,
        tokens: r.report.tokens,
        model_requests: r.report.model_requests,
        active_seconds: r.report.active_seconds,
        estimate_usd: r.report.estimate,
        turn_list_cost_usd: r.report.turn_list_cost_usd,
        session_list_cost_usd: r.report.session_list_cost_usd,
        session_cumulative: cumulative ?? null,
        tool_calls: r.tool_calls.map((c) => ({ name: c.name, is_error: c.is_error })),
      }) + "\n",
    );
  }
}
