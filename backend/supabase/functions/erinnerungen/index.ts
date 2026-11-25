// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "erinnerungen"
// Termin-Erinnerungen per Web-Push: 24 h und 1 h vor Beginn,
// an Klientin UND Coachin — plus die tägliche Erinnerung zur Wunschzeit
// ("Heute noch offen: Tagebuch …"), der Morgen-Impuls (Tageskarte, Challenge-Tag)
// und montags der Hinweis aufs neue Wochenritual. Aufgerufen von pg_cron alle 15 Min.
// Idempotent: jeder Termin wird vor dem Senden atomar markiert,
// daher ist der Aufruf ohne JWT unkritisch (es wird nur Fälliges gesendet).
// Deploy:  supabase functions deploy erinnerungen --use-api --no-verify-jwt
// Secrets: dieselben VAPID_* wie die Function "push"
// ─────────────────────────────────────────────────────────────

import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:hallo@smile2go.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const STUNDE = 3600_000;
const SPALTEN = "id, beginn, kanal, video_url, coach_id, klientinnen(user_id, anzeigename), coaches(name)";

const uhrzeit = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { timeZone: "Europe/Berlin", weekday: "long", hour: "2-digit", minute: "2-digit" });

async function pushAn(userId: string | null, titel: string, text: string, url: string, tag = "termin") {
  if (!userId) return 0;
  const { data: abos } = await admin.from("push_abos").select("endpoint, p256dh, auth_key").eq("user_id", userId);
  let n = 0;
  const abgelaufen: string[] = [];
  for (const a of abos ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth_key } },
        JSON.stringify({ titel, text, url, tag }),
      );
      n++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) abgelaufen.push(a.endpoint);
    }
  }
  if (abgelaufen.length) await admin.from("push_abos").delete().in("endpoint", abgelaufen);
  return n;
}

// Markiert fällige Termine atomar (nur Zeilen, deren Spalte noch leer ist) und liefert sie zurück.
async function faellige(spalte: "erinnert_24h" | "erinnert_1h", bisStunden: number, abStunden: number) {
  const jetzt = Date.now();
  const { data, error } = await admin
    .from("termine")
    .update({ [spalte]: new Date(jetzt).toISOString() })
    .eq("status", "gebucht")
    .is(spalte, null)
    .gt("beginn", new Date(jetzt + abStunden * STUNDE).toISOString())
    .lte("beginn", new Date(jetzt + bisStunden * STUNDE).toISOString())
    .select(SPALTEN);
  if (error) throw error;
  return data ?? [];
}

// ── Tägliche Erinnerung: nur was heute noch offen ist, sanft formuliert ──
const TAGES_AUFGABEN: { tag: string[]; name: string }[] = [
  { tag: ["journal"], name: "Tagebuch" },
  { tag: ["meditation", "achtsamkeit", "qigong"], name: "ein Moment Stille" },
  { tag: ["dankbarkeit"], name: "Dankbarkeit" },
];
const TITEL = ["Ein Moment für dich 🤍", "Dein Abend-Ritual wartet", "Kurz innehalten?", "smile2go denkt an dich ✨"];

async function tagesErinnerungen() {
  const { data, error } = await admin.rpc("faellige_tageserinnerungen");
  if (error) throw error;
  let n = 0;
  for (const z of (data ?? []) as { user_id: string; erledigt: string[] }[]) {
    const offen = TAGES_AUFGABEN.filter((a) => !a.tag.some((t) => z.erledigt.includes(t))).map((a) => a.name);
    if (!offen.length) continue; // alles gemacht — dann schweigt die App
    const liste = offen.length === 1 ? offen[0] : `${offen.slice(0, -1).join(", ")} und ${offen.at(-1)}`;
    const titel = TITEL[new Date().getDate() % TITEL.length];
    n += await pushAn(z.user_id, titel, `Heute noch offen: ${liste}. Schon fünf Minuten tun dir gut.`, "/", "abend");
  }
  return n;
}

// ── Morgen-Impuls + Wochenritual: persönlich, höchstens ein Push pro Morgen ──
type Morgen = {
  user_id: string; vorname: string | null; challenge_tag: number | null; challenge_heute: boolean;
  karte_gezogen: boolean; morgen: boolean; montag: boolean;
};
const MORGEN_SAETZE = [
  "Deine Tageskarte wartet auf dich",
  "Eine neue Karte liegt für dich bereit",
  "Dein Tag beginnt mit einer Karte für dich",
];

export function morgenText(z: Morgen, wochentag = new Date().getDay()) {
  const hallo = z.vorname ? `Guten Morgen, ${z.vorname}` : "Guten Morgen";
  const challenge = z.challenge_tag && z.challenge_tag >= 1 && z.challenge_tag <= 21 && !z.challenge_heute
    ? `Tag ${z.challenge_tag} von 21 deiner Dankbarkeits-Challenge` : "";
  if (z.montag) {
    const rest = challenge ? ` Heute ist außerdem ${challenge}.` : "";
    return { titel: `${hallo} 🌙`, text: `Neue Woche, neues Ritual: dein Wochenritual ist freigeschaltet.${rest}`, url: "/" };
  }
  const karte = z.karte_gezogen ? "" : MORGEN_SAETZE[wochentag % MORGEN_SAETZE.length];
  const saetze = [karte, challenge ? `Heute ist ${challenge}` : ""].filter(Boolean);
  if (!saetze.length) return null; // Karte schon gezogen, keine Challenge offen — dann still bleiben
  return { titel: `${hallo} ✨`, text: `${saetze.join(". ")}. Ein paar Minuten nur für dich.`, url: "/" };
}

async function morgenErinnerungen() {
  const { data, error } = await admin.rpc("faellige_morgenerinnerungen");
  if (error) throw error;
  let n = 0;
  for (const z of (data ?? []) as Morgen[]) {
    if (!z.morgen && !z.montag) continue;
    const m = morgenText(z.morgen ? z : { ...z, karte_gezogen: true, challenge_tag: null });
    if (m) n += await pushAn(z.user_id, m.titel, m.text, m.url, z.montag ? "woche" : "morgen");
  }
  return n;
}

Deno.serve(async () => {
  try {
    let gesendet = 0;
    // 24-h-Erinnerung für alles in den nächsten 24 h, das nicht schon in der 1-h-Spanne liegt.
    for (const t of await faellige("erinnert_24h", 24, 1) as any[]) {
      const wann = uhrzeit(t.beginn);
      gesendet += await pushAn(t.klientinnen?.user_id, "Deine Session steht an 🤍",
        `${wann} mit ${t.coaches?.name ?? "deiner Coachin"}. Magst du dir vorher kurz notieren, was dich gerade bewegt?`, "/");
      gesendet += await pushAn(t.coach_id, "Session steht an",
        `${wann} mit ${t.klientinnen?.anzeigename ?? "deiner Klientin"} (${t.kanal}).`, "/#coach");
    }
    for (const t of await faellige("erinnert_1h", 1, 0) as any[]) {
      const link = t.video_url ? " Der Videolink steht in der App." : "";
      gesendet += await pushAn(t.klientinnen?.user_id, "In einer Stunde geht's los",
        `Deine Session mit ${t.coaches?.name ?? "deiner Coachin"} beginnt bald.${link}`, "/");
      gesendet += await pushAn(t.coach_id, "Session in einer Stunde",
        `${t.klientinnen?.anzeigename ?? "Klientin"} · ${t.kanal}${t.video_url ? "" : " · noch kein Videolink hinterlegt"}`, "/#coach");
    }
    gesendet += await tagesErinnerungen();
    gesendet += await morgenErinnerungen();
    return new Response(JSON.stringify({ gesendet }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
});
