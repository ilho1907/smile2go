// Integrationstest: Edge Function "ilho-technik" gegen die echte Migration in Postgres.
// Supabase-REST/Auth wird von einem kleinen Nachbau bedient, der jede RPC mit der
// richtigen Rolle (authenticated + JWT-Claims bzw. service_role) in Postgres ausführt.
// Claude wird über einen fetch-Stub simuliert.
//
// Ausführen (nach run.sh, das die Datenbank ilho_technik_test anlegt):
//   PGHOST=/tmp/pg PGPORT=5433 PGUSER=postgres \
//   deno test -A --import-map=import_map.json edge_integration_test.ts

import pg from "npm:pg@8";

const db = new pg.Client({ database: "ilho_technik_test" });
await db.connect();

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const NEU = "ffffffff-0000-4000-8000-000000000009";   // frische Nutzerin, damit das Tageslimit nicht greift
await db.query("INSERT INTO auth.users (id, email) VALUES ($1, 'neu@example.org') ON CONFLICT DO NOTHING", [NEU]);

// ── Nachbau Supabase (Auth + PostgREST-RPC) ─────────────────────────────────
async function alsRolle<T>(token: string, f: () => Promise<T>): Promise<T> {
  await db.query("BEGIN");
  try {
    if (token === "service") await db.query("SET LOCAL ROLE service_role");
    else {
      const uid = token.replace(/^user:/, "");
      await db.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid })]);
      await db.query("SET LOCAL ROLE authenticated");
    }
    const r = await f();
    await db.query("COMMIT");
    return r;
  } catch (e) { await db.query("ROLLBACK"); throw e; }
}

async function supabaseNachbau(url: URL, init: RequestInit): Promise<Response> {
  const auth = new Headers(init.headers).get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
  if (url.pathname === "/auth/v1/user") {
    return auth.startsWith("user:") ? j({ id: auth.slice(5), aud: "authenticated" }) : j({ message: "invalid JWT" }, 401);
  }
  const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
  if (rpc) {
    const args = JSON.parse(String(init.body || "{}"));
    const namen = Object.keys(args);
    const sql = `SELECT to_jsonb(${rpc[1]}(${namen.map((n, i) => `${n} => $${i + 1}`).join(", ")})) AS r`;
    try {
      const r = await alsRolle(auth, () => db.query(sql, namen.map((n) => args[n])));
      return j(r.rows[0].r);
    } catch (e) { return j({ message: (e as Error).message, code: "P0001" }, 400); }
  }
  if (url.pathname === "/rest/v1/support_tickets") {
    const id = url.searchParams.get("id")!.replace(/^eq\./, "");
    const spalten = url.searchParams.get("select")!.split(",").map((s) => s.trim()).join(", ");
    const r = await alsRolle(auth, () => db.query(`SELECT ${spalten} FROM support_tickets WHERE id = $1`, [id]));
    return j(r.rows[0]);
  }
  return j({ message: "nicht nachgebaut: " + url.pathname }, 404);
}

// ── fetch-Stub: Supabase-Nachbau + simuliertes Claude ───────────────────────
type KiModus = "ok" | "haengt" | "kaputt" | "injektion";
let kiModus: KiModus = "ok";
let kiAufrufe = 0;
const echtesFetch = globalThis.fetch;
globalThis.fetch = (async (eingabe: RequestInfo | URL, init: RequestInit = {}) => {
  const url = new URL(eingabe instanceof Request ? eingabe.url : String(eingabe));
  if (eingabe instanceof Request) {
    init = { method: eingabe.method, headers: eingabe.headers, body: eingabe.body ? await eingabe.text() : undefined, signal: eingabe.signal, ...init };
  }
  if (url.host === "api.anthropic.com") {
    kiAufrufe++;
    const body = JSON.parse(String(init.body));
    if (body.tool_choice?.name !== "einstufen") throw new Error("Werkzeug nicht erzwungen");
    if (kiModus === "haengt") {
      return await new Promise<Response>((_, nein) =>
        init.signal?.addEventListener("abort", () => nein(Object.assign(new Error("abgebrochen"), { name: "AbortError" }))));
    }
    const input = kiModus === "kaputt" ? { kategorie: "alles", prioritaet: "hoch", begruendung: "x" }
      : kiModus === "injektion" ? { kategorie: "konto", prioritaet: "dringend", begruendung: "x", zustaendig: "admin" }
      : { kategorie: "zahlung", prioritaet: "hoch", begruendung: "Doppelte Abbuchung." };
    return new Response(JSON.stringify({ content: [{ type: "tool_use", name: "einstufen", input }] }), { status: 200 });
  }
  if (url.host === "supabase.test") return supabaseNachbau(url, init);
  return echtesFetch(eingabe, init);
}) as typeof fetch;

// ── Edge Function laden; Deno.serve fängt nur den Handler ab ────────────────
Deno.env.set("SUPABASE_URL", "http://supabase.test");
Deno.env.set("SUPABASE_ANON_KEY", "anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service");
Deno.env.set("ANTHROPIC_API_KEY", "test-schluessel");
Deno.env.set("SUPPORT_KI_TIMEOUT_MS", "60");
let handler!: (r: Request) => Promise<Response>;
(Deno as any).serve = (h: typeof handler) => { handler = h; return {} as any; };
await import("../../supabase/functions/ilho-technik/index.ts");

const senden = (token: string | null, body: unknown) => handler(new Request("http://fn/ilho-technik", {
  method: "POST",
  headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
}));
const ticket = async (id: string) => (await db.query("SELECT * FROM support_tickets WHERE id = $1", [id])).rows[0];
const ok = (b: unknown, was: string) => { if (!b) throw new Error("FEHLGESCHLAGEN: " + was); };
const formular = (schluessel: string) => ({
  aktion: "erstellen", betreff: "Doppelt abgebucht", kategorie: "sonstiges", schluessel,
  beschreibung: "Meine Mitgliedschaft wurde diesen Monat zweimal abgebucht.",
});

Deno.test({ name: "ohne Anmeldung → 401, nichts gespeichert", sanitizeOps: false, sanitizeResources: false, fn: async () => {
  const vorher = (await db.query("SELECT count(*)::int n FROM support_tickets")).rows[0].n;
  const r = await senden(null, formular("int-anon-0001"));
  ok(r.status === 401, "Status 401");
  ok((await db.query("SELECT count(*)::int n FROM support_tickets")).rows[0].n === vorher, "kein Ticket");
} });

Deno.test({ name: "Erfolg: Ticket + KI-Einstufung + Regel, Antwort ohne KI-Details", sanitizeOps: false, sanitizeResources: false, fn: async () => {
  kiModus = "ok"; kiAufrufe = 0;
  const r = await senden("user:" + NEU, formular("int-ok-00001"));
  const b = await r.json();
  ok(r.status === 200 && /^S2G-\d{4}-\d{5}$/.test(b.nummer) && b.routing === "ok", "Nummer + routing ok: " + JSON.stringify(b));
  ok(!("kategorie" in b) && !("begruendung" in b), "keine KI-Details an die Nutzerin");
  const t = await ticket(b.id);
  ok(t.kategorie === "zahlung" && t.prioritaet === "hoch" && t.ki_status === "ok", "KI-Einstufung gespeichert");
  ok(t.kategorie_nutzerin === "sonstiges", "Wahl der Nutzerin bleibt erhalten");
  ok(t.user_id === NEU, "Ticket gehört der aufrufenden Nutzerin");
  ok(t.zustaendig === null && t.manuell_pruefen, "keine Regel für zahlung → Admin-Queue");
  ok(kiAufrufe === 1, "ein KI-Aufruf");
  ok((await db.query("SELECT count(*)::int n FROM support_nachrichten WHERE ticket_id = $1", [b.id])).rows[0].n === 0, "KI hat NICHT geantwortet");
  ok(t.status === "eingegangen", "KI hat Status nicht verändert");

  // Doppelt senden (Netz wackelt, Knopf zweimal) → dasselbe Ticket, keine zweite KI-Runde
  const r2 = await (await senden("user:" + NEU, formular("int-ok-00001"))).json();
  ok(r2.id === b.id && r2.neu === false && r2.routing === "unveraendert", "Wiederholung → gleiches Ticket");
  ok(kiAufrufe === 1, "kein zweiter KI-Aufruf");
  ok((await db.query("SELECT count(*)::int n FROM support_tickets WHERE anfrage_schluessel = 'int-ok-00001'")).rows[0].n === 1, "genau ein Datensatz");
} });

Deno.test({ name: "Claude hängt → Zeitüberschreitung, Ticket trotzdem gespeichert, manuelle Prüfung", sanitizeOps: false, sanitizeResources: false, fn: async () => {
  kiModus = "haengt"; kiAufrufe = 0;
  const b = await (await senden("user:" + NEU, formular("int-timeout-01"))).json();
  ok(b.routing === "manuell" && b.nummer, "Bestätigung trotz KI-Ausfall");
  const t = await ticket(b.id);
  ok(t.ki_status === "fehler" && t.manuell_pruefen && /Zeitüberschreitung/.test(t.ki_fehler), "Fehler protokolliert: " + t.ki_fehler);
  ok(kiAufrufe === 2, "genau ein Wiederholungsversuch");
} });

Deno.test({ name: "ungültige / manipulierte KI-Antwort → verworfen, manuelle Prüfung", sanitizeOps: false, sanitizeResources: false, fn: async () => {
  for (const [modus, schl] of [["kaputt", "int-kaputt-01"], ["injektion", "int-inject-01"]] as const) {
    kiModus = modus;
    const b = await (await senden("user:" + NEU, formular(schl))).json();
    const t = await ticket(b.id);
    ok(t.ki_status === "fehler" && t.manuell_pruefen && t.kategorie === "sonstiges" && t.prioritaet === "normal", `${modus}: nichts übernommen`);
  }
} });

Deno.test({ name: "ANTHROPIC_API_KEY fehlt → Ticket gespeichert, manuelle Prüfung, kein KI-Aufruf", sanitizeOps: false, sanitizeResources: false, fn: async () => {
  // Modul neu laden mit leerem Schlüssel
  Deno.env.set("ANTHROPIC_API_KEY", "");
  kiAufrufe = 0;
  await import("../../supabase/functions/ilho-technik/index.ts?ohne-schluessel");
  const b = await (await senden("user:" + NEU, formular("int-ohne-key-1"))).json();
  const t = await ticket(b.id);
  ok(b.routing === "manuell" && t.ki_status === "fehler" && /API_KEY fehlt/.test(t.ki_fehler), "manuell wegen fehlendem Schlüssel");
  ok(kiAufrufe === 0, "Claude nicht aufgerufen");
} });

Deno.test({ name: "ungültige Eingaben werden von der Datenbank abgewiesen", sanitizeOps: false, sanitizeResources: false, fn: async () => {
  const r = await senden("user:" + A, { ...formular("int-bad-000001"), kategorie: "hack" });
  ok(r.status === 400, "Kategorie hack → 400");
  ok((await db.query("SELECT count(*)::int n FROM support_tickets WHERE anfrage_schluessel = 'int-bad-000001'")).rows[0].n === 0, "nichts gespeichert");
  await db.end();
} });
