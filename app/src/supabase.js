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
