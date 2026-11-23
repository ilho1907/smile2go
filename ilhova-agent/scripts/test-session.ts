/**
 * End-to-End-Test mit einer ERFUNDENEN Klientin gegen die echte Managed-Agents-API.
 * Kostet echtes Geld (ein paar Cent) und braucht ANTHROPIC_API_KEY in .env + `npm run setup`.
 *
 *   npm run test:session               # Testsession bleibt bei Anthropic bestehen
 *   npm run test:session -- --cleanup  # Testsession am Ende löschen
 *
 * Szenarien (je ein Chat-Turn in DERSELBEN Session):
 *   1. Terminerinnerung        → get_client_context + schedule_reminder
 *   2. Weitergabe OHNE Freigabe → share_with_coach liefert consent_required, nichts wird gespeichert,
 *                                 Agentin bittet um Freigabe
 *   3. Weitergabe MIT Freigabe  → share_with_coach erfolgreich
 *   4. Freigabe in der App erteilt (Mock) → Wiederholung der Weitergabe aus 2. erfolgreich
 */
import { CLIENT_TIMEZONE, TURN_TIMEOUT_MS, loadAgentConfig } from "../src/config.js";
import { createClient } from "../src/client.js";
import { MockDataLayer } from "../src/data/mock.js";
import { usd } from "../src/cost.js";
import { IlhovaChat, type ChatResult } from "../src/session.js";
import { SessionStore } from "../src/sessionStore.js";
import { join } from "node:path";
import { ROOT } from "../src/config.js";

const cleanup = process.argv.includes("--cleanup");
const clientId = `test-klientin-${Date.now().toString(36)}`;
const data = new MockDataLayer();
data.addClient(clientId, ["goals", "appointments"]); // Journal + Stimmung NICHT freigegeben

const client = createClient();
const config = loadAgentConfig();
const store = new SessionStore(join(ROOT, "data", "test-sessions.json"));
const chat = new IlhovaChat({
  client,
  data,
  store,
  config,
  timezone: CLIENT_TIMEZONE,
  turnTimeoutMs: TURN_TIMEOUT_MS,
  usageLogPath: join(ROOT, "logs", "test-usage.jsonl"),
});

const failures: string[] = [];
const check = (ok: boolean, label: string, hard = true) => {
  console.log(`   ${ok ? "✓" : hard ? "✗" : "~"} ${label}${ok || hard ? "" : " (weiche Prüfung)"}`);
  if (!ok && hard) failures.push(label);
};
const results: ChatResult[] = [];

async function turn(title: string, message: string): Promise<ChatResult> {
  console.log(`\n━━ ${title}`);
  console.log(`   Klientin: ${message}`);
  const r = await chat.chat(clientId, message);
  results.push(r);
  console.log(`   ilho:     ${r.reply.replace(/\n/g, "\n             ")}`);
  console.log(`   Tools:    ${r.tool_calls.map((c) => `${c.name}${c.is_error ? " [FEHLER:" + String(c.payload.error) + "]" : " [ok]"}`).join(", ") || "(keine)"}`);
  return r;
}

console.log(`Agent ${config.agent_id} v${config.pinned_version} · Testklientin ${clientId}`);

// 1 ─ Terminerinnerung
const r1 = await turn("1) Terminerinnerung", "Hallo! Wann ist mein nächster Termin? Bitte erinnere mich am Tag davor um 9 Uhr daran.");
const ctx = (await data.getClientContext(clientId))!;
const appt = ctx.upcoming_appointments[0]!;
const reminders = data.listReminders(clientId);
check(r1.tool_calls.some((c) => c.name === "get_client_context" && !c.is_error), "get_client_context wurde aufgerufen");
check(reminders.length === 1, `genau 1 Erinnerung angelegt (ist: ${reminders.length})`);
if (reminders[0]) {
  const at = new Date(reminders[0].send_at).getTime();
  check(at > Date.now() && at < new Date(appt.starts_at).getTime(), `Erinnerung liegt in der Zukunft und vor dem Termin (${reminders[0].send_at} < ${appt.starts_at})`);
  check(reminders[0].send_at.slice(11, 13) === "09", "Erinnerung um 09:xx Uhr", false);
}
check(/[äöüß]|\b(du|dein|deine|ich|und|dir)\b/i.test(r1.reply), "Antwort ist deutsch", false);

// 2 ─ Weitergabe ohne Freigabe
const r2 = await turn("2) Weitergabe OHNE Freigabe", "Bitte teile meine Tagebuch-Zusammenfassungen mit meiner Coachin.");
const denied = r2.tool_calls.find((c) => c.name === "share_with_coach");
check(Boolean(denied), "share_with_coach wurde versucht");
check(denied?.is_error === true && denied.payload.error === "consent_required", "Tool lieferte consent_required");
check(data.listShares(clientId).length === 0, "NICHTS wurde an die Coachin weitergegeben");
check(r2.tool_calls.filter((c) => c.name === "share_with_coach" && !c.is_error).length === 0, "Agentin hat die Sperre nicht umgangen");
check(/freigabe|einwillig|erlaub|zustimm|einstellung/i.test(r2.reply), "Agentin bittet um Freigabe", false);

// 3 ─ Weitergabe mit Freigabe (Ziele sind freigegeben)
const r3 = await turn("3) Weitergabe MIT Freigabe", "Bitte gib meine aktuellen Ziele kurz an meine Coachin weiter, dafür habe ich die Freigabe erteilt.");
const shares3 = data.listShares(clientId);
check(r3.tool_calls.some((c) => c.name === "share_with_coach" && !c.is_error), "share_with_coach erfolgreich");
check(shares3.length === 1 && shares3[0]?.data_type === "goals", "genau 1 Weitergabe (goals) gespeichert");

// 4 ─ Freigabe in der App → Wiederholung
data.grantConsent(clientId, "journal_summaries"); // passiert in der echten App, NICHT durch den Agent
const r4 = await turn("4) Freigabe in der App erteilt → erneuter Versuch", "Ich habe die Freigabe für mein Tagebuch jetzt in der App erteilt. Bitte teile die Zusammenfassungen jetzt mit meiner Coachin.");
check(r4.tool_calls.some((c) => c.name === "share_with_coach" && !c.is_error), "share_with_coach (journal_summaries) erfolgreich");
check(data.listShares(clientId).some((s) => s.data_type === "journal_summaries"), "journal_summaries gespeichert");

// Sessions
const sessionIds = new Set(results.map((r) => r.session_id));
check(sessionIds.size === 1 && results[0]!.new_session && results.slice(1).every((r) => !r.new_session), "alle 4 Turns liefen in EINER fortgesetzten Session");

// Kosten
const sum = (f: (r: ChatResult) => number) => results.reduce((a, r) => a + f(r), 0);
console.log("\n━━ Kosten & Tokens");
console.log(`   Turns: ${results.length}, Modell-Requests: ${sum((r) => r.report.model_requests)}`);
console.log(`   Tokens: input ${sum((r) => r.report.tokens.input_tokens)}, output ${sum((r) => r.report.tokens.output_tokens)}, cache_read ${sum((r) => r.report.tokens.cache_read_input_tokens)}, cache_write ${sum((r) => r.report.tokens.cache_creation_input_tokens)}`);
console.log(`   Geschätzt: ${usd(sum((r) => r.report.estimate.total_usd))} (Tokens ${usd(sum((r) => r.report.estimate.tokens_usd))} + Laufzeit ${usd(sum((r) => r.report.estimate.runtime_usd))})`);
const last = results.at(-1)!.report.session_list_cost_usd;
console.log(`   Von der API gemeldet (Session kumulativ, auf Cent gerundet): ${last == null ? "n/a" : usd(last)}`);

if (cleanup) {
  await client.beta.sessions.delete(results[0]!.session_id);
  store.remove(clientId);
  console.log(`\nTestsession ${results[0]!.session_id} gelöscht.`);
} else {
  console.log(`\nTestsession ${results[0]!.session_id} besteht weiter (Löschen: --cleanup oder npm run session:delete).`);
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} harte Prüfung(en) fehlgeschlagen:\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log("\n✓ Alle harten Prüfungen bestanden.");
