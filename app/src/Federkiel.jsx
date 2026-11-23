// Federkiel.jsx — smile2go
// Eine Schreibfeder, die beim Tippen mitschreibt. Sie legt sich um die
// Schreibseiten (children) und folgt der Schreibmarke im gerade aktiven
// Eingabefeld: Bei jedem Tastendruck wandert die Spitze an die Stelle, an der
// der Buchstabe entsteht, und wackelt wie beim Schreiben. Nach einer kurzen
// Pause hebt sie sich und verblasst.
//
// Die Position der Schreibmarke wird geschätzt (Textbreite der aktuellen
// Zeile, gemessen mit derselben Schrift wie das Feld). Für eine Feder reicht
// das — sie soll schreiben, nicht pixelgenau zeigen.
import { useRef, useState } from "react";

const GOLD = "#C9A04A";

let messKontext = null;
const textBreite = (text, font) => {
  if (!messKontext) messKontext = document.createElement("canvas").getContext("2d");
  messKontext.font = font;
  return messKontext.measureText(text).width;
};

function schreibmarke(feld, rahmen) {
  const st = getComputedStyle(feld);
  const font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
  const pl = parseFloat(st.paddingLeft) || 0;
  const pr = parseFloat(st.paddingRight) || 0;
  const pt = parseFloat(st.paddingTop) || 0;
  const lh = parseFloat(st.lineHeight) || parseFloat(st.fontSize) * 1.3;
  const innen = Math.max(40, feld.clientWidth - pl - pr);
  const bis = (feld.value || "").slice(0, feld.selectionStart ?? feld.value.length);

  let x, y;
  if (feld.tagName === "TEXTAREA") {
    // Umbrüche grob nachbilden: jede harte Zeile kann mehrere Bildschirmzeilen füllen.
    const zeilen = bis.split("\n");
    let zeile = 0;
    zeilen.slice(0, -1).forEach((z) => { zeile += Math.max(1, Math.ceil(textBreite(z, font) / innen)); });
    const letzte = textBreite(zeilen[zeilen.length - 1], font);
    zeile += Math.floor(letzte / innen);
    x = pl + (letzte % innen);
    y = pt + zeile * lh + lh * 0.8 - feld.scrollTop;
  } else {
    x = pl + Math.min(innen, textBreite(bis, font) - feld.scrollLeft);
    y = feld.clientHeight / 2 + parseFloat(st.fontSize) * 0.35;
  }

  const f = feld.getBoundingClientRect();
  const r = rahmen.getBoundingClientRect();
  return {
    x: Math.min(f.left - r.left + x, f.right - r.left - 6),
    y: Math.min(f.top - r.top + y, f.bottom - r.top - 4),
  };
}

export default function Federkiel({ children }) {
  const rahmen = useRef(null);
  const pause = useRef(null);
  const [pos, setPos] = useState(null);
  const [schreibt, setSchreibt] = useState(false);
  const [tick, setTick] = useState(0);

  const folgen = (e) => {
    const feld = e.target;
    if (!rahmen.current || !/^(TEXTAREA|INPUT)$/.test(feld.tagName)) return;
    if (feld.tagName === "INPUT" && !/^(text|search|)$/.test(feld.type || "")) return;
    setPos(schreibmarke(feld, rahmen.current));
    setSchreibt(true);
    setTick((t) => t + 1);
    clearTimeout(pause.current);
    pause.current = setTimeout(() => setSchreibt(false), 1100);
  };

  return (
    <div ref={rahmen} onInput={folgen} style={{ position: "relative" }}>
      {children}
      {pos && (
        <div aria-hidden="true" style={{
          position: "absolute", left: pos.x, top: pos.y, width: 0, height: 0,
          pointerEvents: "none", zIndex: 20,
          transition: "left .12s ease-out, top .18s ease-out",
        }}>
          {/* Tintenfunke an der Spitze */}
          <span key={tick} style={{
            position: "absolute", left: -2, top: -2, width: 4, height: 4, borderRadius: "50%",
            background: "#3E1A3B", animation: "s2gTinte .7s ease-out forwards",
          }} />
          <div style={{
            position: "absolute", left: 0, bottom: 0, transformOrigin: "0% 100%",
            opacity: schreibt ? 1 : 0,
            transform: schreibt ? "translate(-3px, 3px)" : "translate(6px, -14px) rotate(8deg)",
            transition: "opacity .45s ease, transform .45s ease",
          }}>
            <div key={tick} style={{ transformOrigin: "0% 100%", animation: schreibt ? "s2gKritzeln .24s ease-in-out" : "none" }}>
              <Feder />
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes s2gKritzeln {
          0% { transform: rotate(0deg) translate(0,0) }
          35% { transform: rotate(-5deg) translate(2px,-2px) }
          70% { transform: rotate(3deg) translate(-1px,1px) }
          100% { transform: rotate(0deg) translate(0,0) }
        }
        @keyframes s2gTinte { from { opacity: .85; transform: scale(1) } to { opacity: 0; transform: scale(2.2) } }
        @media (prefers-reduced-motion: reduce) { [style*="s2gKritzeln"] { animation: none !important } }
      `}</style>
    </div>
  );
}

// Die Feder: Spitze unten links (0,100%), Fahne schräg nach oben rechts.
function Feder() {
  return (
    <svg width="80" height="80" viewBox="0 0 64 64" style={{ display: "block", filter: "drop-shadow(0 4px 6px rgba(62,26,59,.28))" }}>
      <defs>
        <linearGradient id="s2gFahne" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F4E3F0" />
          <stop offset=".55" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E8C9E2" />
        </linearGradient>
      </defs>
      {/* Fahne */}
      <path d="M14 50 C 18 30, 34 12, 60 3 C 56 18, 46 34, 22 50 Z" fill="url(#s2gFahne)" stroke="#C8A6C2" strokeWidth=".8" />
      {/* Bärte */}
      <path d="M24 42 L33 36 M28 36 L38 29 M33 29 L43 22 M39 22 L48 15 M45 15 L53 9" stroke="#D6B6CF" strokeWidth=".8" strokeLinecap="round" />
      {/* Kiel */}
      <path d="M8 58 L58 4" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
      {/* Goldene Spitze */}
      <path d="M2 63 L8 55 L11 58 Z" fill={GOLD} stroke="#8E6A24" strokeWidth=".6" strokeLinejoin="round" />
    </svg>
  );
}
