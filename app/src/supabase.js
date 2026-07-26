// smile2go · Supabase-Client (Frontend)
// Aktivierung: `npm install @supabase/supabase-js`, dann .env füllen (siehe .env.example).
// Solange die ENV-Variablen fehlen, ist `supabase` = null und die App läuft
// weiter mit localStorage (kein Bruch).

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env?.VITE_SUPABASE_URL;
const anon = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;

// Beispiel-Helfer (später in App.jsx statt localStorage nutzen):
export async function ladeProfil() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function speichereJournal(eintrag) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("journal_entries").insert({ user_id: user.id, ...eintrag });
}
