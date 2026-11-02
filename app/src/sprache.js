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

/* ── Zuhören statt Tippen ───────────────────────────────────────────────────
   Die Gegenrichtung zum Vorlesen: die Nutzerin spricht, die App schreibt mit.
   Gedacht für die Abende, an denen niemand tippen mag — und für Frauen, die
   mit der Tastatur nicht schnell sind.

   Die Spracherkennung läuft, wo der Browser sie mitbringt (Chrome, Safari ab
   iOS 14.5, Edge). Wo nicht, bleibt alles wie vorher: der Knopf erscheint
   gar nicht erst, Tippen funktioniert unverändert. Erkannt wird auf dem
   Gerät beziehungsweise beim Browser-Hersteller — wir senden nichts an
   unsere eigenen Dienste und speichern keine Aufnahme. */

const Erkenner =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const zuhoerenMoeglich = () => !!Erkenner;

/* Startet das Zuhören. Gibt eine Funktion zurück, die es wieder beendet.
   beiText  — bekommt den Text, sobald ein Satz fertig erkannt ist
   beiZwischen — bekommt den vorläufigen Text, damit man beim Sprechen sieht,
                 dass die App zuhört
   beiEnde  — wird immer aufgerufen, auch bei Abbruch oder Fehler */
export function hoereZu({ beiText, beiZwischen, beiEnde, sprache = "de-DE" } = {}) {
  if (!Erkenner) { beiEnde?.(); return () => {}; }

  let e;
  try { e = new Erkenner(); } catch { beiEnde?.(); return () => {}; }

  e.lang = sprache;
  e.continuous = false;        // ein Gedanke, dann Ruhe — kein Dauermikrofon
  e.interimResults = true;
  e.maxAlternatives = 1;

  let fertig = false;
  const schliessen = () => { if (!fertig) { fertig = true; beiEnde?.(); } };

  e.onresult = (ev) => {
    let endgueltig = "", vorlaeufig = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const t = ev.results[i][0].transcript;
      if (ev.results[i].isFinal) endgueltig += t; else vorlaeufig += t;
    }
    if (vorlaeufig) beiZwischen?.(vorlaeufig.trim());
    if (endgueltig) beiText?.(endgueltig.trim());
  };
  e.onerror = schliessen;
  e.onend = schliessen;

  try { e.start(); } catch { schliessen(); }

  return () => { try { e.stop(); } catch { schliessen(); } };
}

/* ── Sperrbildschirm ────────────────────────────────────────────────────────
   Ohne das hört eine Meditation auf, sobald das Telefon in die Tasche geht,
   und auf dem Sperrbildschirm steht nichts. Mit der Media Session kennt das
   Betriebssystem Titel, Coachin und Bild und zeigt Abspielen, Pause und die
   Sprünge dort an, wo eine Nutzerin sie erwartet. */
export function sperrbildschirm({ titel, coach, bild, audio, sprung = 15 }) {
  const ms = typeof navigator !== "undefined" ? navigator.mediaSession : null;
  if (!ms || !audio) return () => {};

  try {
    ms.metadata = new window.MediaMetadata({
      title: titel || "smile2go",
      artist: coach || "smile2go",
      album: "smile2go",
      artwork: bild ? [{ src: bild, sizes: "512x512", type: "image/png" }] : [],
    });
  } catch {}

  const setzen = (name, fn) => { try { ms.setActionHandler(name, fn); } catch {} };
  setzen("play", () => audio.play().catch(() => {}));
  setzen("pause", () => audio.pause());
  setzen("seekbackward", () => { audio.currentTime = Math.max(0, audio.currentTime - sprung); });
  setzen("seekforward", () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + sprung); });
  setzen("seekto", (d) => { if (d.seekTime != null) audio.currentTime = d.seekTime; });

  return () => {
    ["play", "pause", "seekbackward", "seekforward", "seekto"].forEach((n) => setzen(n, null));
    try { ms.metadata = null; } catch {}
  };
}
