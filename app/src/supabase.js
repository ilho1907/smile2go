// smile2go · Supabase-Client (Frontend)
// Aktivierung: `npm install @supabase/supabase-js`, dann .env füllen (siehe .env.example).
// Solange die ENV-Variablen fehlen, ist `supabase` = null und die App läuft
// weiter mit localStorage (kein Bruch).

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env?.VITE_SUPABASE_URL;
const anon = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;

// Zentraler App-Zustand (Journal, Mood, Challenge, Streak, ...) — ein JSONB-Blob pro Nutzerin,
// spiegelt 1:1 die bisherige localStorage-Struktur "s2g_state". Tabelle: app_state (siehe Migration
// backend/supabase/migrations/20260728_app_state.sql). RLS sorgt dafür, dass jede Nutzerin nur
// ihre eigene Zeile lesen/schreiben kann.
export async function ladeAppState() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("app_state").select("state").eq("user_id", user.id).maybeSingle();
  if (error) { console.warn("ladeAppState:", error.message); return null; }
  return data?.state || null;
}

export async function speichereAppState(state) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("app_state").upsert({ user_id: user.id, state }, { onConflict: "user_id" });
  if (error) console.warn("speichereAppState:", error.message);
}

// ── AI Coach Twin (Fable-5-Auftrag 6, Phase A) ──────────────────────────────
// coach_dossier: rohe Interview-Antworten + generiertes Methoden-Dossier, versioniert.
// Nichts geht ohne Freigabe der Coachin an Klientinnen — deshalb getrennte Speicher-/Freigabe-Funktion.

export async function speichereDossierEntwurf({ antworten, dossier, dossier_text }) {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // sicherstellen, dass die Coachin-Zeile existiert (minimaler Coach-Marker)
  await supabase.from("coaches").upsert({ id: user.id }, { onConflict: "id" });
  const { data: bestehend } = await supabase
    .from("coach_dossier")
    .select("version")
    .eq("coach_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const naechsteVersion = (bestehend?.version || 0) + 1;
  const { data, error } = await supabase
    .from("coach_dossier")
    .insert({ coach_id: user.id, version: naechsteVersion, antworten, dossier, dossier_text, freigegeben: false })
    .select()
    .single();
  if (error) { console.warn("speichereDossierEntwurf:", error.message); return null; }
  return data;
}

export async function gibDossierFrei(dossierId) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("coach_dossier")
    .update({ freigegeben: true, freigegeben_am: new Date().toISOString() })
    .eq("id", dossierId);
  if (error) { console.warn("gibDossierFrei:", error.message); return false; }
  return true;
}

export async function ladeEigenesDossier() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("coach_dossier")
    .select("*")
    .eq("coach_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.warn("ladeEigenesDossier:", error.message); return null; }
  return data;
}

// ── Anonymisiertes Event-Logging (Grundlage für spätere Katman-4-Auswertung) ─
// Bewusst kein Freitext, kein Klarbezug — nur Hash + Typ + Themen-Tag.
async function sha256Hex(text) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch { return "anon"; }
}

export async function logEvent(eventType, topicTag = null) {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const roh = user?.id || `anon-${navigator.userAgent}`;
    const userHash = await sha256Hex(roh);
    await supabase.from("app_events").insert({ user_hash: userHash, event_type: eventType, topic_tag: topicTag });
  } catch { /* Event-Logging darf die App nie stören */ }
}
