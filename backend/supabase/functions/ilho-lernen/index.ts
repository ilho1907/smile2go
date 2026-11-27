// ─────────────────────────────────────────────────────────────
// smile2go · Supabase Edge Function "ilho-lernen"
// Wöchentlicher Lernlauf (pg_cron, montags): Mistral Large liest die
// anonymisierten Erkenntnisse der Vorwoche — nur von Nutzerinnen mit
// Freigabe "ilho_lernen" — und schreibt Muster + Verbesserungsvorschläge
// für ilho in die Tabelle ilho_lernen.
//
// Sicherheitsgrenzen:
//   – keine User-IDs, Namen oder Zeitstempel gehen an das Modell
//   – unter MIN_GESPRAECHE kein Lauf (sonst wären Einzelne erkennbar)
//   – ein Lauf pro Woche (Primärschlüssel woche) → Aufruf ohne JWT ist kostenseitig begrenzt
//   – Vorschläge werden NIE automatisch übernommen; ein Mensch prüft sie
//
// Deploy:  supabase functions deploy ilho-lernen --use-api --no-verify-jwt
// Secrets: MISTRAL_API_KEY, optional MISTRAL_LERN_MODELL (Standard mistral-large-4)
// ─────────────────────────────────────────────────────────────

import { createClient } from "jsr:@supabase/supabase-js@2";

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY")!;
const LERN_MODELL = Deno.env.get("MISTRAL_LERN_MODELL") ?? "mistral-large-4";
const ERSATZ_MODELL = "mistral-large-latest"; // falls Large 4 (Preview) nicht verfügbar ist
const MIN_GESPRAECHE = 10;

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const LERN_SYSTEM = `Du bist das Lern-Modul von ilho, dem KI-Begleiter der App smile2go (Frauen 30–50, Persönlichkeitsentwicklung, Spiritualität).
Du bekommst anonymisierte Kurz-Zusammenfassungen von Gesprächen einer Woche (Stimmung 1–5, Themen, Ziele, ein Satz). Leite daraus ab, wie ilho besser begleiten kann.
Antworte NUR mit JSON:
{
 "haeufige_themen": [{"thema": "…", "anteil_prozent": 0}],
 "stimmung_durchschnitt": 0.0 oder null,
 "muster": ["…"],
 "was_hilft": ["…"],
 "luecken": ["Themen oder Fragen, bei denen die App noch kein passendes Angebot hat"],
 "prompt_vorschlaege": [{"vorschlag": "…", "begruendung": "…"}],
 "inhalts_ideen": ["Ideen für Rituale, Meditationen oder Kurse"]
}
Regeln: Beschreibe nur Gruppenmuster, nie Einzelfälle. Keine Diagnosen, keine klinischen Begriffe. prompt_vorschlaege dürfen die Regeln zu psychischer Belastung, KI-Transparenz und Notrufnummern niemals abschwächen oder entfernen. Höchstens 5 Einträge pro Liste. Deutsch.`;

function wochenstart(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const tag = (x.getUTCDay() + 6) % 7; // Montag = 0
  x.setUTCDate(x.getUTCDate() - tag - 7); // Montag der VORWOCHE
  return x.toISOString().slice(0, 10);
}

async function mistral(modell: string, inhalt: string) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({
      model: modell,
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: LERN_SYSTEM }, { role: "user", content: inhalt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Mistral ${res.status}`);
  return String(data.choices?.[0]?.message?.content ?? "");
}

Deno.serve(async () => {
  try {
    const woche = wochenstart();
    const bis = new Date(new Date(woche).getTime() + 7 * 86400_000).toISOString();

    // Idempotenz: Woche zuerst belegen; existiert sie schon, sofort aufhören.
    const { error: belegt } = await admin.from("ilho_lernen").insert({ woche, status: "offen" });
    if (belegt) return json({ ok: true, hinweis: `Woche ${woche} wurde bereits ausgewertet` });

    const { data: erlaubt } = await admin.from("consent").select("user_id").eq("bereich", "ilho_lernen").eq("aktiv", true);
    const ids = (erlaubt ?? []).map((c) => c.user_id);

    const { data: zeilen } = ids.length
      ? await admin.from("insights")
          .select("stimmung, themen, ziele, zusammenfassung")
          .in("user_id", ids)
          .gte("created_at", woche)
          .lt("created_at", bis)
          .limit(2000)
      : { data: [] as any[] };

    const anzahl = zeilen?.length ?? 0;
    if (anzahl < MIN_GESPRAECHE) {
      await admin.from("ilho_lernen").update({ anzahl_gespraeche: anzahl, ergebnis: { hinweis: "zu wenige Gespräche — kein Lauf" } }).eq("woche", woche);
      return json({ ok: true, woche, anzahl, hinweis: "zu wenige Gespräche" });
    }

    // Zufällig mischen, damit die Reihenfolge nichts über Personen verrät.
    const zufall = [...zeilen!].sort(() => Math.random() - 0.5);
    const inhalt = zufall
      .map((z, i) => `${i + 1}. Stimmung ${z.stimmung ?? "–"} | Themen: ${(z.themen || []).join(", ")} | Ziele: ${(z.ziele || []).join("; ")} | ${z.zusammenfassung ?? ""}`)
      .join("\n");

    let modell = LERN_MODELL;
    let roh: string;
    try {
      roh = await mistral(modell, inhalt);
    } catch (e) {
      console.warn("ilho-lernen: Ersatzmodell, weil", String(e));
      modell = ERSATZ_MODELL;
      try {
        roh = await mistral(modell, inhalt);
      } catch (e2) {
        // Woche wieder freigeben, damit der nächste Cron-Lauf es erneut versucht.
        await admin.from("ilho_lernen").delete().eq("woche", woche);
        throw e2;
      }
    }

    let ergebnis: unknown;
    try { ergebnis = JSON.parse(roh); } catch { ergebnis = { roh: roh.slice(0, 8000) }; }

    await admin.from("ilho_lernen").update({ anzahl_gespraeche: anzahl, ergebnis, modell }).eq("woche", woche);
    return json({ ok: true, woche, anzahl, modell });
  } catch (e) {
    console.error("ilho-lernen:", e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
