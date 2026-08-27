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

// ── Session Intelligence (Katman 1 · Baustein 5) ────────────────────────────
// Speichern NUR mit bestätigter Einwilligung (DB-Constraint erzwingt es zusätzlich).
// Freigabe getrennt — nichts erreicht eine Klientin ungeprüft.

export async function speichereSessionNotiz({ titel, transkript, notiz, notiz_text, einwilligung }) {
  if (!supabase) return null;
  if (!einwilligung) { console.warn("speichereSessionNotiz: ohne Einwilligung nicht erlaubt"); return null; }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await supabase.from("coaches").upsert({ id: user.id }, { onConflict: "id" });
  const { data, error } = await supabase
    .from("session_notizen")
    .insert({ coach_id: user.id, titel, transkript, notiz, notiz_text, einwilligung_bestaetigt: true, freigegeben: false })
    .select()
    .single();
  if (error) { console.warn("speichereSessionNotiz:", error.message); return null; }
  return data;
}

export async function gibSessionNotizFrei(notizId) {
  if (!supabase) return false;
  const { error } = await supabase.from("session_notizen").update({ freigegeben: true }).eq("id", notizId);
  if (error) { console.warn("gibSessionNotizFrei:", error.message); return false; }
  return true;
}

export async function ladeSessionNotizen(limit = 10) {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("session_notizen")
    .select("id, titel, notiz_text, freigegeben, created_at")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.warn("ladeSessionNotizen:", error.message); return []; }
  return data || [];
}

// ── Knowledge Brain (Katman 1 · Baustein 6) ─────────────────────────────────
// Ehrliche Einordnung: Echte semantische Suche braucht einen Embedding-Anbieter
// (Claude bietet keine Embeddings). Ohne hinterlegten Schlüssel arbeitet die Suche
// mit deutscher Volltextsuche — ab Tag 1 nutzbar, später ohne Datenmigration semantisch.

const CHUNK_LEN = 900;

function chunke(text) {
  const saetze = String(text).split(/(?<=[.!?])\s+/);
  const teile = []; let akt = "";
  for (const s of saetze) {
    if ((akt + " " + s).length > CHUNK_LEN && akt) { teile.push(akt.trim()); akt = s; }
    else akt += " " + s;
  }
  if (akt.trim()) teile.push(akt.trim());
  return teile;
}

export async function merkeInhalt({ titel, text, quelle = "upload", quelle_id = null }) {
  if (!supabase || !text?.trim()) return 0;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  await supabase.from("coaches").upsert({ id: user.id }, { onConflict: "id" });
  const zeilen = chunke(text).map((chunk, i) => ({
    coach_id: user.id, quelle, quelle_id, titel: titel || "Ohne Titel", chunk, chunk_index: i,
  }));
  const { error } = await supabase.from("content_embeddings").insert(zeilen);
  if (error) { console.warn("merkeInhalt:", error.message); return 0; }
  return zeilen.length;
}

export async function sucheInhalte(anfrage, limit = 5) {
  if (!supabase || !anfrage?.trim()) return [];
  const { data, error } = await supabase.rpc("suche_inhalte_text", { anfrage: anfrage.trim(), treffer_limit: limit });
  if (error) { console.warn("sucheInhalte:", error.message); return []; }
  return data || [];
}

export async function ladeInhaltsUebersicht() {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("content_embeddings")
    .select("titel, quelle, created_at")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) { console.warn("ladeInhaltsUebersicht:", error.message); return []; }
  // nach Titel gruppieren (ein Inhalt = mehrere Chunks)
  const map = new Map();
  (data || []).forEach((d) => { if (!map.has(d.titel)) map.set(d.titel, { ...d, teile: 1 }); else map.get(d.titel).teile++; });
  return [...map.values()];
}

// ── Stimme (AI Coach Twin · Voice-Layer) ────────────────────────────────────
// Der persönliche Wochenimpuls bleibt bewusst die echte Stimme der Coachin.
// Geklont wird nur, was sie nie selbst einsprechen könnte — immer als KI-Stimme gekennzeichnet.

export const STIMME_EINWILLIGUNG_TEXT =
  "Ich stimme zu, dass smile2go aus meinen Sprachaufnahmen ein Stimmodell erstellt und damit " +
  "Kartenbotschaften, Ritual- und Meditationstexte für meine Klientinnen vertont. Diese Audios " +
  "werden immer sichtbar als KI-Stimme gekennzeichnet. Mein persönlicher Wochenimpuls bleibt " +
  "meine echte Aufnahme. Ich kann diese Einwilligung jederzeit widerrufen; das Stimmodell und " +
  "alle damit erzeugten Audios werden dann gelöscht.";

export async function ladeStimmProfil() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("stimm_profil_aktiv").select("*").eq("coach_id", user.id).maybeSingle();
  if (error) { console.warn("ladeStimmProfil:", error.message); return null; }
  return data;
}

export async function speichereStimmProfil({ anbieter, voice_id }) {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await supabase.from("coaches").upsert({ id: user.id }, { onConflict: "id" });
  const { data, error } = await supabase.from("stimm_profile").upsert({
    coach_id: user.id, anbieter, voice_id,
    einwilligung_am: new Date().toISOString(),
    einwilligung_text: STIMME_EINWILLIGUNG_TEXT,
    widerrufen_am: null,
  }, { onConflict: "coach_id" }).select().single();
  if (error) { console.warn("speichereStimmProfil:", error.message); return null; }
  return data;
}

export async function widerrufeStimme() {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("stimm_profile")
    .update({ widerrufen_am: new Date().toISOString() }).eq("coach_id", user.id);
  if (error) { console.warn("widerrufeStimme:", error.message); return false; }
  return true;
}

// Liefert eine abspielbare URL — oder null, wenn kein Anbieter konfiguriert ist.
// Die App zeigt den Hörknopf dann einfach nicht an (kein Fehler, kein toter Button).
export async function holeAudio({ text, kategorie = "karte", coach_id = null, voice_id = null }) {
  const basis = import.meta.env?.VITE_AI_FUNCTION_URL;
  if (!basis || !text) return null;
  const url = basis.replace(/\/ai\/?$/, "/tts");
  try {
    const anon = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon },
      body: JSON.stringify({ text, kategorie, coach_id, voice_id }),
    });
    const d = await res.json();
    return d?.url || null;
  } catch { return null; }
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

// ═══════════════════════════════════════════════════════════════════════════
// Klientinnen-Seite: Bindung, Nachrichten, Termine, Community, Dateien, DSGVO
// Migration: backend/supabase/migrations/20260827_klientinnen_kommunikation.sql
// Alle Funktionen geben bei fehlender Konfiguration still null/[] zurück,
// damit die App auch ohne Cloud weiterläuft.
// ═══════════════════════════════════════════════════════════════════════════

async function nutzerin() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user || null;
}

// ── Bindung Coachin ↔ Klientin ─────────────────────────────────────────────

// Liefert { id, coach_id, status, coach_name } oder null, wenn noch keine Coachin verbunden ist.
export async function ladeMeineBindung() {
  const user = await nutzerin();
  if (!user) return null;
  const { data, error } = await supabase
    .from("klientinnen")
    .select("id, coach_id, status, anzeigename, verbunden_am, coaches(name)")
    .eq("user_id", user.id)
    .in("status", ["aktiv", "pausiert"])
    .order("verbunden_am", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.warn("ladeMeineBindung:", error.message); return null; }
  if (!data) return null;
  return { ...data, coach_name: data.coaches?.name || null };
}

// Einladungscode der Coachin einlösen. Wirft mit klarer Meldung, wenn der Code nicht gilt.
export async function mitCoachVerbinden(code, anzeigename = null) {
  if (!supabase) throw new Error("Keine Verbindung");
  const { data, error } = await supabase.rpc("mit_coach_verbinden", {
    p_code: code, p_anzeigename: anzeigename,
  });
  if (error) throw new Error(error.message);
  return data;
}

// ── Nachrichten ────────────────────────────────────────────────────────────

export async function ladeNachrichten(klientinId, limit = 200) {
  if (!supabase || !klientinId) return [];
  const { data, error } = await supabase
    .from("nachrichten")
    .select("id, absender, text, audio_pfad, audio_sek, gelesen_am, created_at")
    .eq("klientin_id", klientinId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) { console.warn("ladeNachrichten:", error.message); return []; }
  return data || [];
}

export async function sendeNachricht({ klientinId, text = null, audioPfad = null, audioSek = null }) {
  const user = await nutzerin();
  if (!user || !klientinId) return null;
  const { data, error } = await supabase
    .from("nachrichten")
    .insert({ klientin_id: klientinId, absender: "klientin", absender_id: user.id,
              text, audio_pfad: audioPfad, audio_sek: audioSek })
    .select()
    .single();
  if (error) { console.warn("sendeNachricht:", error.message); return null; }
  return data;
}

// Realtime: neue Nachrichten der Coachin landen sofort im Verlauf.
// Rückgabe: Funktion zum Abmelden (im useEffect-Cleanup aufrufen).
export function abonniereNachrichten(klientinId, beiNeuerNachricht) {
  if (!supabase || !klientinId) return () => {};
  const kanal = supabase
    .channel(`nachrichten:${klientinId}`)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "nachrichten", filter: `klientin_id=eq.${klientinId}` },
      (nutzlast) => beiNeuerNachricht(nutzlast.new))
    .subscribe();
  return () => { supabase.removeChannel(kanal); };
}

export async function markiereGelesen(klientinId) {
  if (!supabase || !klientinId) return;
  await supabase.from("nachrichten")
    .update({ gelesen_am: new Date().toISOString() })
    .eq("klientin_id", klientinId)
    .eq("absender", "coach")
    .is("gelesen_am", null);
}

// ── Termine ────────────────────────────────────────────────────────────────

export async function ladeFreieSlots(coachId, tage = 21) {
  if (!supabase || !coachId) return [];
  const bis = new Date(Date.now() + tage * 864e5).toISOString();
  const { data, error } = await supabase
    .from("coach_slots")
    .select("id, beginn, dauer_min, kanal")
    .eq("coach_id", coachId)
    .eq("aktiv", true)
    .gte("beginn", new Date().toISOString())
    .lte("beginn", bis)
    .order("beginn", { ascending: true });
  if (error) { console.warn("ladeFreieSlots:", error.message); return []; }
  return data || [];
}

export async function ladeMeineTermine() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("termine")
    .select("id, beginn, dauer_min, kanal, titel, video_url, status")
    .eq("status", "gebucht")
    .gte("beginn", new Date(Date.now() - 3 * 3600e3).toISOString())
    .order("beginn", { ascending: true });
  if (error) { console.warn("ladeMeineTermine:", error.message); return []; }
  return data || [];
}

export async function terminBuchen(slotId) {
  if (!supabase) throw new Error("Keine Verbindung");
  const { data, error } = await supabase.rpc("termin_buchen", { p_slot: slotId });
  if (error) throw new Error(error.message);
  return data;
}

export async function terminStornieren(terminId) {
  if (!supabase) throw new Error("Keine Verbindung");
  const { error } = await supabase.rpc("termin_stornieren", { p_termin: terminId });
  if (error) throw new Error(error.message);
}

// ── Community ──────────────────────────────────────────────────────────────

export async function ladeFeed(limit = 50) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("community_feed")
    .select("id, alias, text, herzen, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.warn("ladeFeed:", error.message); return []; }
  return data || [];
}

export async function schreibeBeitrag(text, alias = "Anonym") {
  const user = await nutzerin();
  if (!user) return null;
  const { data, error } = await supabase
    .from("community_posts")
    .insert({ user_id: user.id, alias, text })
    .select("id, alias, text, created_at, user_id")
    .single();
  if (error) { console.warn("schreibeBeitrag:", error.message); return null; }
  return { ...data, herzen: 0 };
}

export async function herzSetzen(postId) {
  const user = await nutzerin();
  if (!user) return false;
  const { error } = await supabase.from("community_herzen").insert({ post_id: postId, user_id: user.id });
  return !error;
}

export async function meldeBeitrag(postId, grund = null) {
  const user = await nutzerin();
  if (!user) return false;
  const { error } = await supabase
    .from("community_meldungen")
    .insert({ post_id: postId, melderin_id: user.id, grund });
  return !error;
}

export async function loescheBeitrag(postId) {
  if (!supabase) return false;
  const { error } = await supabase.from("community_posts").delete().eq("id", postId);
  return !error;
}

// ── Dateien (privater Bucket pro Nutzerin + Material der Coachin) ───────────

export async function ladeMeineDateien() {
  const user = await nutzerin();
  if (!user) return [];
  const { data, error } = await supabase.storage.from("klientin-dateien").list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  if (error) { console.warn("ladeMeineDateien:", error.message); return []; }
  return (data || []).map((d) => ({ name: d.name, groesse: d.metadata?.size ?? 0, pfad: `${user.id}/${d.name}` }));
}

export async function ladeDateiHoch(datei) {
  const user = await nutzerin();
  if (!user || !datei) return null;
  const sauber = datei.name.replace(/[^\w.\-]+/g, "_");
  const pfad = `${user.id}/${Date.now()}-${sauber}`;
  const { error } = await supabase.storage.from("klientin-dateien").upload(pfad, datei, { upsert: false });
  if (error) { console.warn("ladeDateiHoch:", error.message); return null; }
  return { name: sauber, groesse: datei.size, pfad };
}

// Signierte URL — der Bucket ist privat, öffentliche Links gibt es bewusst nicht.
export async function dateiLink(pfad, bucket = "klientin-dateien", sekunden = 300) {
  if (!supabase || !pfad) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pfad, sekunden);
  if (error) { console.warn("dateiLink:", error.message); return null; }
  return data?.signedUrl || null;
}

export async function loescheDatei(pfad) {
  if (!supabase || !pfad) return false;
  const { error } = await supabase.storage.from("klientin-dateien").remove([pfad]);
  return !error;
}

export async function ladeCoachMaterial(coachId) {
  if (!supabase || !coachId) return [];
  const { data, error } = await supabase.storage.from("coach-material").list(coachId, { limit: 100 });
  if (error) { console.warn("ladeCoachMaterial:", error.message); return []; }
  return (data || []).map((d) => ({ name: d.name, groesse: d.metadata?.size ?? 0, pfad: `${coachId}/${d.name}` }));
}

// ── DSGVO: Auskunft (Art. 15/20) und Löschung (Art. 17) ────────────────────

export async function exportiereMeineDaten() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("meine_daten_export");
  if (error) { console.warn("exportiereMeineDaten:", error.message); return null; }
  return data;
}

// Löscht Konto + alle Daten serverseitig. bestaetigung muss "LÖSCHEN" sein.
export async function loescheKonto(bestaetigung) {
  const basis = import.meta.env?.VITE_AI_FUNCTION_URL;
  if (!supabase || !basis) throw new Error("Keine Verbindung");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Nicht angemeldet");
  const url = basis.replace(/\/ai\/?$/, "/konto-loeschen");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env?.VITE_SUPABASE_ANON_KEY || "",
    },
    body: JSON.stringify({ bestaetigung }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error || "Löschen fehlgeschlagen");
  await supabase.auth.signOut();
  return true;
}

// ── Passwort ───────────────────────────────────────────────────────────────

export async function passwortZuruecksetzen(email) {
  if (!supabase) throw new Error("Keine Verbindung");
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${window.location.pathname}#passwort-neu`,
  });
  if (error) throw new Error(error.message);
}

export async function neuesPasswortSetzen(passwort) {
  if (!supabase) throw new Error("Keine Verbindung");
  const { error } = await supabase.auth.updateUser({ password: passwort });
  if (error) throw new Error(error.message);
}

// ── Push-Benachrichtigungen (Web Push / VAPID) ─────────────────────────────

function base64ZuUint8(base64) {
  const rest = "=".repeat((4 - (base64.length % 4)) % 4);
  const roh = atob((base64 + rest).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...roh].map((c) => c.charCodeAt(0)));
}

export function pushMoeglich() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
    && !!import.meta.env?.VITE_VAPID_PUBLIC_KEY;
}

export async function pushStatus() {
  if (!pushMoeglich()) return "nicht_moeglich";
  if (Notification.permission === "denied") return "blockiert";
  const reg = await navigator.serviceWorker.getRegistration();
  const abo = await reg?.pushManager.getSubscription();
  return abo ? "aktiv" : "aus";
}

export async function pushAktivieren() {
  if (!pushMoeglich()) throw new Error("Push wird auf diesem Gerät nicht unterstützt");
  const erlaubnis = await Notification.requestPermission();
  if (erlaubnis !== "granted") throw new Error("Keine Erlaubnis für Benachrichtigungen");

  const reg = await navigator.serviceWorker.ready;
  const abo = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ZuUint8(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  });

  const user = await nutzerin();
  if (!user) throw new Error("Nicht angemeldet");
  const roh = abo.toJSON();
  const { error } = await supabase.from("push_abos").upsert({
    endpoint: roh.endpoint,
    user_id: user.id,
    p256dh: roh.keys.p256dh,
    auth_key: roh.keys.auth,
    geraet: navigator.userAgent.slice(0, 120),
  }, { onConflict: "endpoint" });
  if (error) throw new Error(error.message);
  return true;
}

export async function pushDeaktivieren() {
  const reg = await navigator.serviceWorker.getRegistration();
  const abo = await reg?.pushManager.getSubscription();
  if (!abo) return true;
  const endpoint = abo.endpoint;
  await abo.unsubscribe();
  if (supabase) await supabase.from("push_abos").delete().eq("endpoint", endpoint);
  return true;
}
