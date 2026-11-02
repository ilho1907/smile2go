// IlhoHero.jsx — smile2go
// Oberster Bereich auf "Heute", angelehnt an die Tony-Robbins-AI-App: ilho steht im Mittelpunkt.
// Dunkler Abendhimmel, leuchtender Atem-Orb, eine Frage-Zeile und Themen, die direkt ein
// Gespräch mit ilho starten. Die Begrüßung bleibt in "Heute" darunter, damit sie nicht doppelt steht.
import { useEffect, useState } from "react";

const THEMEN = [
  { t: "Entscheidung", f: "Ich muss eine Entscheidung treffen und drehe mich im Kreis." },
  { t: "Beziehung", f: "Mich beschäftigt gerade etwas in meiner Beziehung." },
  { t: "Selbstwert", f: "Ich zweifle gerade an mir selbst." },
  { t: "Unruhe", f: "Ich bin innerlich unruhig und möchte zur Ruhe kommen." },
  { t: "Geld & Fülle", f: "Ich mache mir Gedanken über Geld und möchte klarer sehen." },
  { t: "Motivation", f: "Mir fehlt gerade die Motivation. Hilf mir, wieder in Bewegung zu kommen." },
];

export default function IlhoHero({ name = "", onFrage }) {
  const [frage, setFrage] = useState("");
  const [atmet, setAtmet] = useState(false);
  const [phase, setPhase] = useState("einatmen");

  // Atem-Orb wie auf der Startseite: 8 Sekunden pro Atemzug, 4 ein, 4 aus.
  useEffect(() => {
    if (!atmet) return;
    setPhase("einatmen");
    const id = setInterval(() => setPhase((p) => (p === "einatmen" ? "ausatmen" : "einatmen")), 4000);
    return () => clearInterval(id);
  }, [atmet]);

  // Leere Frage öffnet einfach das Gespräch.
  const fragen = (e) => {
    e.preventDefault();
    onFrage(frage.trim());
    setFrage("");
  };

  return (
    <section className="ih" aria-label="Frag ilho">
      <style>{CSS}</style>
      <div className="ih-orb-zone">
        <button
          type="button"
          className={"ih-orb" + (atmet ? " atmet" : "")}
          onClick={() => setAtmet((a) => !a)}
          aria-pressed={atmet}
          aria-label={atmet ? "Atemübung beenden" : "Mit ilho atmen"}
        >
          <span className="ih-orb-name">ilho</span>
          <span className="ih-orb-hinweis" aria-live="polite">{atmet ? phase : "atme mit"}</span>
        </button>
      </div>
      <h2 className="ih-titel">Was bewegt dich gerade{name ? `, ${name}` : ""}?</h2>
      <p className="ih-unter">ilho hört zu und hilft dir, den nächsten Schritt zu sehen. Rund um die Uhr.</p>
      <form className="ih-zeile" onSubmit={fragen}>
        <input
          className="ih-eingabe"
          value={frage}
          onChange={(e) => setFrage(e.target.value)}
          placeholder="Frag ilho, was dich bewegt …"
          aria-label="Deine Frage an ilho"
          enterKeyHint="send"
        />
        <button type="submit" className="ih-senden" aria-label="Frage an ilho senden">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      <div className="ih-themen">
        {THEMEN.map((x) => (
          <button type="button" key={x.t} className="ih-thema" onClick={() => onFrage(x.f)}>{x.t}</button>
        ))}
      </div>
    </section>
  );
}

const CSS = `
.ih {
  position: relative; overflow: hidden; margin: 0 0 14px; padding: 22px 18px 22px; text-align: center; color: #F7EEE5;
  border-radius: 0 0 28px 28px;
  background: radial-gradient(130% 75% at 50% 0%, #5A2B40 0%, #35201A 52%, #22150F 100%);
  box-shadow: 0 14px 36px rgba(58,42,34,.28);
}
.ih-orb-zone { position: relative; width: 148px; height: 148px; margin: 2px auto 12px; display: grid; place-items: center; }
.ih-orb-zone::before, .ih-orb-zone::after { content: ""; position: absolute; border-radius: 50%; border: 1px solid rgba(230,190,108,.26); }
.ih-orb-zone::before { inset: 0; }
.ih-orb-zone::after { inset: 20px; border-color: rgba(230,190,108,.15); }
.ih-orb {
  position: relative; z-index: 1; width: 92px; height: 92px; border-radius: 50%; border: 0; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; color: #4A3410;
  background: radial-gradient(circle at 38% 32%, #F8E0A0 0%, #E2B45C 50%, #B98030 100%);
  box-shadow: 0 0 44px rgba(230,190,108,.55), 0 0 100px rgba(217,110,139,.35);
  animation: ihSchweben 6s ease-in-out infinite;
}
.ih-orb.atmet { animation: ihAtmen 8s ease-in-out infinite; }
.ih-orb-name { font-family: Georgia, serif; font-size: 1.15rem; line-height: 1; }
.ih-orb-hinweis { font-family: system-ui, sans-serif; font-size: .7rem; font-weight: 600; opacity: .85; }
@keyframes ihSchweben { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes ihAtmen { 0%, 100% { transform: scale(.86); } 50% { transform: scale(1.14); } }
.ih-titel { font-family: Georgia, serif; font-weight: 400; font-size: 1.6rem; line-height: 1.2; margin: 0; text-wrap: balance; }
.ih-unter { font-family: system-ui, sans-serif; font-size: .95rem; line-height: 1.5; color: #D2BFB1; margin: 8px auto 18px; max-width: 30ch; text-wrap: balance; }
.ih-zeile {
  display: flex; gap: 8px; align-items: center; padding: 5px 5px 5px 16px; border-radius: 999px;
  background: rgba(255,255,255,.07); border: 1px solid rgba(230,190,108,.3);
}
.ih-zeile:focus-within { border-color: #E6BE6C; }
.ih-eingabe {
  flex: 1; min-width: 0; padding: 9px 0; background: transparent; border: 0; outline: none; color: #F7EEE5;
  font: 400 16px/1.4 system-ui, sans-serif;
}
.ih-eingabe::placeholder { color: #A8907F; }
.ih-senden {
  width: 42px; height: 42px; flex-shrink: 0; border-radius: 50%; border: 0; cursor: pointer; color: #fff;
  display: grid; place-items: center; background: linear-gradient(135deg, #C9963C, #D96E8B);
}
.ih-themen { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 14px; }
.ih-thema {
  min-height: 38px; padding: 10px 14px; border-radius: 999px; cursor: pointer;
  font: 600 13px/1 system-ui, sans-serif; color: #F7EEE5; background: transparent; border: 1px solid rgba(230,190,108,.35);
}
.ih-thema:hover { background: rgba(230,190,108,.12); }
.ih button:focus-visible { outline: 3px solid #E6BE6C; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .ih-orb, .ih-orb.atmet { animation: none; } }
`;
