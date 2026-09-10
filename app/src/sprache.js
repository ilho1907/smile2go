/* ── sprache.js — Vorlesen statt Klicken ──
   Nutzt die Sprachausgabe des Browsers (Web Speech API). Kein Download, keine
   Kosten, offline verfügbar. Gedacht für Momente, in denen niemand Lust hat,
   sich durch Schritte zu tippen: Panik, Stress, Augen zu.
   Ohne Sprachausgabe im Browser laufen alle Funktionen still weiter — die App
   verhält sich dann genau wie vorher. */

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

export const spracheMoeglich = () => !!synth;

let stimme = null;
function deutscheStimme() {
  if (!synth) return null;
  if (stimme) return stimme;
  const alle = synth.getVoices() || [];
  // Bevorzugt eine weibliche deutsche Stimme, sonst irgendeine deutsche.
  stimme =
    alle.find((v) => /de[-_]DE/i.test(v.lang) && /anna|petra|katja|helena|female|weiblich/i.test(v.name)) ||
    alle.find((v) => /^de/i.test(v.lang)) ||
    null;
  return stimme;
}
if (synth) synth.addEventListener?.("voiceschanged", () => { stimme = null; deutscheStimme(); });

export function stoppSprache() {
  try { synth?.cancel(); } catch {}
}

/* Spricht einen Text und löst auf, wenn er zu Ende ist (oder sofort, wenn keine
   Sprachausgabe da ist). Fehler werden verschluckt — Ton ist ein Extra, nie
   eine Bedingung dafür, dass die Übung weitergeht. */
export function sprich(text, { rate = 0.88, pitch = 1, pauseDanach = 0 } = {}) {
  return new Promise((fertig) => {
    if (!synth || !text) { setTimeout(fertig, pauseDanach); return; }
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      const v = deutscheStimme();
      if (v) u.voice = v;
      u.lang = v?.lang || "de-DE";
      u.rate = rate;
      u.pitch = pitch;
      let erledigt = false;
      const schluss = () => { if (erledigt) return; erledigt = true; setTimeout(fertig, pauseDanach); };
      u.onend = schluss;
      u.onerror = schluss;
      // Sicherheitsnetz: manche Browser feuern onend nicht zuverlässig.
      const grob = Math.max(2500, String(text).length * 90 / rate) + pauseDanach;
      setTimeout(schluss, grob);
      synth.speak(u);
    } catch {
      setTimeout(fertig, pauseDanach);
    }
  });
}

/* Merkt sich, ob die Klientin Sprachbegleitung möchte. Standard: an. */
const SCHLUESSEL = "s2g_stimme_an";
export const stimmeAn = () => {
  try { return localStorage.getItem(SCHLUESSEL) !== "aus"; } catch { return true; }
};
export const stimmeSetzen = (an) => {
  try { localStorage.setItem(SCHLUESSEL, an ? "an" : "aus"); } catch {}
  if (!an) stoppSprache();
};
