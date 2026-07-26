// lib/energy.js — Lichtpunkte (Energie) + Journal mit Supabase + localStorage-Fallback
// Wenn Supabase konfiguriert ist, aber niemand eingeloggt ist, wird automatisch
// eine anonyme Sitzung gestartet (Supabase → Auth → "Anonymous sign-ins" aktivieren).
import { supabase } from "../supabase";

const LS_KEY = "s2g_lichtpunkte";

async function ensureUser() {
  if (!supabase) return null;
  let { data: { user } } = await supabase.auth.getUser();
  if (!user && supabase.auth.signInAnonymously) {
    try { await supabase.auth.signInAnonymously(); } catch (e) {}
    ({ data: { user } } = await supabase.auth.getUser());
  }
  return user || null;
}

// Punkte gutschreiben (z. B. addEnergy(5, 'meditation'))
export async function addEnergy(points, reason = "aktion") {
  const user = await ensureUser();
  if (user) {
    await supabase.from("energy_ledger").insert({ user_id: user.id, points, reason });
    return getEnergy();
  }
  const cur = parseInt(localStorage.getItem(LS_KEY) || "0", 10);
  const next = cur + points;
  localStorage.setItem(LS_KEY, String(next));
  return next;
}

// Aktuellen Stand lesen
export async function getEnergy() {
  const user = await ensureUser();
  if (user) {
    const { data } = await supabase
      .from("energy_balance").select("lichtpunkte").eq("user_id", user.id).single();
    return data?.lichtpunkte ?? 0;
  }
  return parseInt(localStorage.getItem(LS_KEY) || "0", 10);
}

// Journal / Dankbarkeit / Brief speichern (+Lichtpunkte)
export async function saveJournal({ kind = "tagebuch", mood = null, body = "", deliver_at = null }) {
  const user = await ensureUser();
  if (user) {
    await supabase.from("journal_entries").insert({ user_id: user.id, kind, mood, body, deliver_at });
  }
  await addEnergy(2, kind);
}
