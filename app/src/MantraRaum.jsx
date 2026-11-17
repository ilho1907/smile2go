import { useEffect, useRef, useState } from "react";
import { MANTRA_MEDIEN } from "./media";

/* Mantra-Raum — Naturvideo im Hintergrund, Mantra-Musik, das Tagesmantra gross.
   Musik startet erst auf Antippen (Browser erlauben keinen Autoplay mit Ton). */

const vorlesen = (text) => {
  try {
    const sp = window.speechSynthesis;
    if (!sp) return;
    sp.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.rate = 0.85;
    const de = sp.getVoices().filter((v) => v.lang?.startsWith("de"));
    const stimme = de.find((v) => /female|anna|petra|helena|katja/i.test(v.name)) || de[0];
    if (stimme) u.voice = stimme;
    sp.speak(u);
  } catch { /* still */ }
};

export default function MantraRaum({ mantras, startIndex = 0, addPunkte }) {
  const [i, setI] = useState(startIndex);
  const [musik, setMusik] = useState(false);
  const [gezaehlt, setGezaehlt] = useState(false);
  const audio = useRef(null);
  const m = mantras[i % mantras.length];

  useEffect(() => () => { audio.current?.pause(); try { window.speechSynthesis?.cancel(); } catch {} }, []);

  const musikUmschalten = () => {
    const a = audio.current;
    if (!a) return;
    if (musik) { a.pause(); setMusik(false); return; }
    a.volume = 0.7;
    a.play().then(() => setMusik(true)).catch(() => setMusik(false));
    if (!gezaehlt && addPunkte) { addPunkte(3, "Mantra-Moment"); setGezaehlt(true); }
  };

  const knopf = {
    height: 48, padding: "0 20px", borderRadius: 24, cursor: "pointer",
    border: "1px solid rgba(255,255,255,.45)", background: "rgba(255,255,255,.14)",
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 14.5, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 8,
  };

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 140px)", overflow: "hidden", background: "#1B1430", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <video
        src={MANTRA_MEDIEN.video} poster={MANTRA_MEDIEN.poster}
        autoPlay muted loop playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(27,20,48,.25) 0%, rgba(27,20,48,.55) 55%, rgba(27,20,48,.85) 100%)" }} />
      <audio ref={audio} src={MANTRA_MEDIEN.musik} loop preload="none" onEnded={() => setMusik(false)} />

      <div style={{ position: "relative", padding: "40px 28px 48px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, letterSpacing: 2.4, textTransform: "uppercase", opacity: .85 }}>Dein Mantra {m.s}</div>
        <p key={i} style={{ fontFamily: "Georgia, serif", fontSize: 27, lineHeight: 1.4, margin: "18px 0 30px", textShadow: "0 2px 18px rgba(0,0,0,.45)", animation: "fadeUp .7s ease" }}>
          {m.t}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          <button onClick={musikUmschalten} style={{ ...knopf, background: musik ? "rgba(255,255,255,.28)" : knopf.background }} aria-pressed={musik}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
              {musik ? <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></> : <path d="M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />}
            </svg>
            {musik ? "Musik pausieren" : "Mantra-Musik"}
          </button>
          <button onClick={() => vorlesen(m.t)} style={knopf}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
            Vorlesen
          </button>
        </div>

        <button onClick={() => setI((x) => x + 1)} style={{ ...knopf, marginTop: 14, background: "transparent", border: "none", fontWeight: 400, textDecoration: "underline", textUnderlineOffset: 4 }}>
          Anderes Mantra
        </button>

        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, opacity: .8, marginTop: 22, lineHeight: 1.6 }}>
          Lies es dreimal leise mit. Atme dabei ruhig ein und aus.
        </p>
      </div>
    </div>
  );
}
