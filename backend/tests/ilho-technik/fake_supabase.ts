// Lokaler Supabase-Nachbau NUR für Oberflächentests (Port 54321).
// Auth, PostgREST-RPC, Storage und Edge Functions — jede Datenbankabfrage läuft
// mit der Rolle der anfragenden Person (authenticated + Claims / service_role)
// gegen die echte Migration. Claude wird simuliert; Modus über
//   POST /__test/ki  {"modus":"ok"|"haengt"|"kaputt"}
//
// Start: PGHOST=/tmp/pg PGPORT=5433 PGUSER=postgres \
//   deno run -A --import-map=import_map.json fake_supabase.ts
import pg from "npm:pg@8";

const db = new pg.Pool({ database: "ilho_technik_test", max: 4 });
db.on("error", (e: Error) => console.warn("pg:", e.message));   // DB-Reset zwischen Testläufen überstehen
const dateien = new Map<string, { typ: string; bytes: Uint8Array }>();
const signierte = new Map<string, string>();
let kiModus = "ok";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "*",
};
const j = (b: unknown, s = 200, h: Record<string, string> = {}) =>
  new Response(b === null ? null : JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json", ...h } });

const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
export const tokenFuer = (id: string, email: string) =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: id, email, role: "authenticated", aud: "authenticated", aal: "aal1", amr: [{ method: "password", timestamp: 1 }], exp: Math.floor(Date.now() / 1000) + 86400 })}.sig`;
const subAus = (token: string): string | null => {
  if (token === "service") return "service";
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub ?? null; } catch { return null; }
};

async function alsRolle<T>(token: string, f: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const sub = subAus(token);
    if (sub === "service") await c.query("SET LOCAL ROLE service_role");
    else if (sub) {
      await c.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub })]);
      await c.query("SET LOCAL ROLE authenticated");
    } else await c.query("SET LOCAL ROLE anon");
    const r = await f(c);
    await c.query("COMMIT");
    return r;
  } catch (e) { await c.query("ROLLBACK"); throw e; } finally { c.release(); }
}

async function nutzerAus(token: string) {
  const sub = subAus(token);
  if (!sub || sub === "service") return null;
  const r = await db.query("SELECT id, email FROM auth.users WHERE id = $1", [sub]);
  return r.rows[0] ? { id: r.rows[0].id, email: r.rows[0].email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, factors: [], created_at: new Date().toISOString() } : null;
}

async function bedienen(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const p = url.pathname;

  if (p === "/__test/ki") { kiModus = (await req.json()).modus; return j({ kiModus }); }
  if (p === "/__test/token") {
    const r = await db.query("SELECT id, email FROM auth.users WHERE email = $1", [url.searchParams.get("email")]);
    const u = r.rows[0];
    return j({ access_token: tokenFuer(u.id, u.email), refresh_token: "r-" + u.id, token_type: "bearer", expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400, user: { id: u.id, email: u.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} } });
  }

  // ── Auth ──
  if (p === "/auth/v1/health") return j({ ok: true });
  if (p === "/auth/v1/user") { const u = await nutzerAus(token); return u ? j(u) : j({ msg: "invalid JWT" }, 401); }
  if (p === "/auth/v1/logout") return new Response(null, { status: 204, headers: CORS });
  if (p === "/auth/v1/factors" || p.startsWith("/auth/v1/factors")) return j({ all: [], totp: [] });

  // ── Edge Functions ──
  if (p === "/functions/v1/ilho-technik") return await (globalThis as any).__ilhoTechnik(req);
  if (p.startsWith("/functions/v1/")) return j({ gesendet: 0 });

  // ── PostgREST ──
  const rpc = p.match(/^\/rest\/v1\/rpc\/(\w+)$/);
  if (rpc) {
    const args = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    try {
      return await alsRolle(token, async (c) => {
        const fn = await c.query("SELECT proretset FROM pg_proc WHERE proname = $1 LIMIT 1", [rpc[1]]);
        if (!fn.rows[0]) return j({ message: `function ${rpc[1]} not found`, code: "PGRST202" }, 404);
        const namen = Object.keys(args);
        const aufruf = `${rpc[1]}(${namen.map((n, i) => `${n} => $${i + 1}`).join(", ")})`;
        const werte = namen.map((n) => (args[n] !== null && typeof args[n] === "object" ? JSON.stringify(args[n]) : args[n]));
        if (fn.rows[0].proretset) return j((await c.query(`SELECT * FROM ${aufruf}`, werte)).rows);
        return j((await c.query(`SELECT to_jsonb(${aufruf}) AS r`, werte)).rows[0].r);
      });
    } catch (e) { return j({ message: (e as Error).message, code: (e as any).code ?? "P0001" }, 400); }
  }
  const tab = p.match(/^\/rest\/v1\/(\w+)$/);
  if (tab) {
    const vorhanden = await db.query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1", [tab[1]]);
    if (!vorhanden.rows[0]) return req.method === "GET" ? j([]) : j(null, 201);   // andere App-Tabellen: still leer
    if (req.method !== "GET") return j({ message: "nicht nachgebaut" }, 400);
    const wo: string[] = []; const werte: unknown[] = [];
    for (const [k, v] of url.searchParams) {
      if (["select", "order", "limit"].includes(k)) continue;
      const m = v.match(/^(eq|is)\.(.*)$/); if (!m) continue;
      if (m[1] === "is") wo.push(`${k} IS ${m[2] === "null" ? "NULL" : "NOT NULL"}`);
      else { werte.push(m[2]); wo.push(`${k}::text = $${werte.length}`); }
    }
    try {
      const r = await alsRolle(token, (c) => c.query(`SELECT * FROM ${tab[1]}${wo.length ? " WHERE " + wo.join(" AND ") : ""} LIMIT 300`, werte));
      if ((req.headers.get("accept") ?? "").includes("vnd.pgrst.object")) return r.rows[0] ? j(r.rows[0]) : j({ message: "0 rows" }, 406);
      return j(r.rows, 200, { "content-range": `0-${r.rows.length}/${r.rows.length}` });
    } catch (e) { return j({ message: (e as Error).message }, 400); }
  }

  // ── Storage ──
  const hoch = p.match(/^\/storage\/v1\/object\/([\w-]+)\/(.+)$/);
  if (hoch && req.method === "POST" && !p.includes("/sign/")) {
    const [, bucket, pfad] = hoch;
    let typ = req.headers.get("content-type") ?? "";
    let bytes: Uint8Array;
    if (typ.startsWith("multipart/form-data")) {
      // storage-js schickt den Datei-Teil mit leerem Feldnamen — den verwirft
      // Request.formData(); darum hier von Hand zerlegen.
      const grenze = "--" + typ.split("boundary=")[1];
      const roh = new Uint8Array(await req.arrayBuffer());
      const text = new TextDecoder("latin1").decode(roh);
      const teil = text.split(grenze).find((t) => /filename=/.test(t));
      if (!teil) return j({ statusCode: "400", error: "kein Datei-Teil" }, 400);
      const kopfEnde = teil.indexOf("\r\n\r\n");
      typ = (teil.slice(0, kopfEnde).match(/Content-Type:\s*([^\r\n]+)/i) || [])[1]?.trim() ?? "";
      const start = text.indexOf(teil) + kopfEnde + 4;
      bytes = roh.slice(start, text.indexOf(teil) + teil.length - 2);
    } else bytes = new Uint8Array(await req.arrayBuffer());
    const b = (await db.query("SELECT * FROM storage.buckets WHERE id = $1", [bucket])).rows[0];
    if (!b) return j({ statusCode: "404", error: "Bucket not found" }, 404);
    if (b.allowed_mime_types && !b.allowed_mime_types.includes(typ)) return j({ statusCode: "415", error: "invalid_mime_type", message: `mime type ${typ} is not supported` }, 415);
    if (b.file_size_limit && bytes.length > Number(b.file_size_limit)) return j({ statusCode: "413", error: "Payload too large" }, 413);
    try {
      await alsRolle(token, (c) => c.query("INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ($1, $2, $3)",
        [bucket, decodeURIComponent(pfad), JSON.stringify({ mimetype: typ, size: bytes.length })]));
    } catch (e) { return j({ statusCode: "403", error: "Unauthorized", message: (e as Error).message }, 400); }
    dateien.set(`${bucket}/${decodeURIComponent(pfad)}`, { typ, bytes });
    return j({ Key: `${bucket}/${pfad}`, Id: crypto.randomUUID() });
  }
  const sign = p.match(/^\/storage\/v1\/object\/sign\/([\w-]+)\/(.+)$/);
  if (sign && req.method === "POST") {
    const [, bucket, pfadRoh] = sign; const pfad = decodeURIComponent(pfadRoh);
    const sicht = await alsRolle(token, (c) => c.query("SELECT 1 FROM storage.objects WHERE bucket_id = $1 AND name = $2", [bucket, pfad]));
    if (!sicht.rows[0]) return j({ statusCode: "404", error: "not_found", message: "Object not found" }, 400);
    const t = crypto.randomUUID(); signierte.set(t, `${bucket}/${pfad}`);
    return j({ signedURL: `/object/sign/${bucket}/${pfadRoh}?token=${t}` });
  }
  if (sign && req.method === "GET") {
    const key = signierte.get(url.searchParams.get("token") ?? "");
    const d = key && dateien.get(key);
    return d ? new Response(d.bytes, { headers: { ...CORS, "content-type": d.typ } }) : j({ error: "not_found" }, 400);
  }
  return j({ message: "nicht nachgebaut: " + req.method + " " + p }, 404);
}

// ── Edge Function einbinden; Claude simulieren ──
const echtesFetch = globalThis.fetch;
globalThis.fetch = (async (eingabe: RequestInfo | URL, init: RequestInit = {}) => {
  const url = new URL(eingabe instanceof Request ? eingabe.url : String(eingabe));
  if (url.host !== "api.anthropic.com") return echtesFetch(eingabe, init);
  if (kiModus === "haengt") return await new Promise<Response>((_, nein) =>
    init.signal?.addEventListener("abort", () => nein(Object.assign(new Error("abgebrochen"), { name: "AbortError" }))));
  const input = kiModus === "kaputt" ? { kategorie: "alles", prioritaet: "x", begruendung: "x" }
    : { kategorie: "technik", prioritaet: "hoch", begruendung: "App-Start schlägt fehl, Nutzung blockiert." };
  return new Response(JSON.stringify({ content: [{ type: "tool_use", name: "einstufen", input }] }), { status: 200 });
}) as typeof fetch;

Deno.env.set("SUPABASE_URL", "http://localhost:54321");
Deno.env.set("SUPABASE_ANON_KEY", "anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service");
Deno.env.set("ANTHROPIC_API_KEY", "test");
Deno.env.set("SUPPORT_KI_TIMEOUT_MS", "300");
const echtesServe = Deno.serve;
(Deno as any).serve = (h: (r: Request) => Promise<Response>) => { (globalThis as any).__ilhoTechnik = h; return {} as any; };
await import("../../supabase/functions/ilho-technik/index.ts");
(Deno as any).serve = echtesServe;

Deno.serve({ port: 54321, onListen: () => console.log("fake-supabase bereit auf :54321") }, (req) =>
  bedienen(req).catch((e) => { console.error(e); return j({ message: String(e) }, 500); }));
