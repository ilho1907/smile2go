/**
 * Offline-Test der Tool-Handler + Mock-Datenschicht + Kostenrechnung. Braucht KEINEN API-Key.
 *   npm run test:unit
 */
import assert from "node:assert/strict";
import { estimateCost } from "../src/cost.js";
import { MOCK_CLIENT_ID, MockDataLayer } from "../src/data/mock.js";
import { runTool } from "../src/tools/handlers.js";

const tz = "Europe/Berlin";
const fixedNow = new Date("2026-11-23T12:00:00Z");
const data = new MockDataLayer(tz, () => fixedNow);
const ctx = { clientId: MOCK_CLIENT_ID, data, timezone: tz, now: () => fixedNow };
let passed = 0;
const test = async (name: string, fn: () => Promise<void>) => {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
};

await test("get_client_context liefert now + Termine", async () => {
  const r = await runTool("get_client_context", { client_id: MOCK_CLIENT_ID }, ctx);
  assert.equal(r.is_error, false);
  const c = r.payload.context as { now: string; upcoming_appointments: unknown[] };
  assert.match(c.now, /^2026-11-23T13:00:00\+01:00$/);
  assert.equal(c.upcoming_appointments.length, 2);
});

await test("fremde client_id wird abgelehnt", async () => {
  const r = await runTool("get_client_context", { client_id: "andere-klientin" }, ctx);
  assert.equal(r.is_error, true);
  assert.equal(r.payload.error, "client_id_mismatch");
});

await test("share_with_coach OHNE Einwilligung → consent_required, nichts gespeichert", async () => {
  const r = await runTool("share_with_coach", { client_id: MOCK_CLIENT_ID, data_type: "mood_trend", summary: "Stimmung eher niedrig." }, ctx);
  assert.equal(r.is_error, true);
  assert.equal(r.payload.error, "consent_required");
  assert.equal(data.listShares().length, 0);
});

await test("share_with_coach MIT Einwilligung → ok, gespeichert", async () => {
  const r = await runTool("share_with_coach", { client_id: MOCK_CLIENT_ID, data_type: "goals", summary: "Ziel: morgens 10 Min. Stille." }, ctx);
  assert.equal(r.is_error, false);
  assert.equal(data.listShares().length, 1);
});

await test("nach Freigabe in der App funktioniert auch mood_trend", async () => {
  data.grantConsent(MOCK_CLIENT_ID, "mood_trend");
  const r = await runTool("share_with_coach", { client_id: MOCK_CLIENT_ID, data_type: "mood_trend", summary: "Stimmung eher niedrig." }, ctx);
  assert.equal(r.is_error, false);
  assert.equal(data.listShares().length, 2);
  data.revokeConsent(MOCK_CLIENT_ID, "mood_trend");
  const r2 = await runTool("share_with_coach", { client_id: MOCK_CLIENT_ID, data_type: "mood_trend", summary: "x" }, ctx);
  assert.equal(r2.payload.error, "consent_required");
});

await test("ungültiger data_type wird abgelehnt", async () => {
  const r = await runTool("share_with_coach", { client_id: MOCK_CLIENT_ID, data_type: "passwords", summary: "x" }, ctx);
  assert.equal(r.payload.error, "invalid_data_type");
});

await test("schedule_reminder: Validierung + Erfolg", async () => {
  const bad1 = await runTool("schedule_reminder", { client_id: MOCK_CLIENT_ID, datetime: "2026-11-24 09:00", text: "Termin" }, ctx);
  assert.equal(bad1.payload.error, "invalid_datetime"); // kein ISO/Offset
  const bad2 = await runTool("schedule_reminder", { client_id: MOCK_CLIENT_ID, datetime: "2026-11-22T09:00:00+01:00", text: "Termin" }, ctx);
  assert.equal(bad2.payload.error, "datetime_in_past");
  const bad3 = await runTool("schedule_reminder", { client_id: MOCK_CLIENT_ID, datetime: "2026-11-24T09:00:00+01:00", text: "" }, ctx);
  assert.equal(bad3.payload.error, "invalid_text");
  const good = await runTool("schedule_reminder", { client_id: MOCK_CLIENT_ID, datetime: "2026-11-24T09:00:00+01:00", text: "Morgen ist dein Coaching-Termin 🌿" }, ctx);
  assert.equal(good.is_error, false);
  assert.equal(good.payload.send_at, "2026-11-24T09:00:00+01:00");
  assert.equal(data.listReminders().length, 1);
});

await test("unbekanntes Tool", async () => {
  const r = await runTool("delete_everything", { client_id: MOCK_CLIENT_ID }, ctx);
  assert.equal(r.payload.error, "unknown_tool");
});

await test("Kostenrechnung (Opus 5.5: 1M in + 1M out = $24; 1 h Laufzeit = $0.08)", async () => {
  const e = estimateCost("claude-opus-5-5", { input_tokens: 1_000_000, output_tokens: 1_000_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }, 3600);
  assert.equal(e.tokens_usd, 24);
  assert.ok(Math.abs(e.runtime_usd - 0.08) < 1e-9);
});

console.log(`\n${passed} Tests bestanden.`);
