// SchreibBuch.jsx — smile2go
// Schreiben wie in einem echten Buch: Tippt die Nutzerin in ein Tagebuch-Feld,
// öffnet sich bildschirmfüllend ein Buch in 3D. Oben das offene Buch,
// unten das Eingabefeld (die Handy-Tastatur erscheint darunter). Eine Feder
// folgt dem Text und „schreibt“ jeden Buchstaben, der getippt wird.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const F = {
  nacht1: "#2B1733", nacht2: "#4A2145",
  seite: "#FFFDF6", seite2: "#F6ECD9", linie: "rgba(193,145,60,.36)",
  gold: "#C1913C", rose: "#C2526E", tinte: "#3B2340", plum: "#8E4A63",
};
const HAND = '"Snell Roundhand", "Savoye LET", "Bradley Hand", "Segoe Script", cursive';

export default function SchreibBuch({ frage, wert, onChange, onClose, datum }) {
  const [phase, setPhase] = useState("zu"); // zu | auf
  const [hoehe, setHoehe] = useState(() => (typeof window !== "undefined" ? (window.visualViewport?.height || window.innerHeight) : 700));
  const feldRef = useRef(null);
  const seiteRef = useRef(null);

  // Buch aufschlagen
  useEffect(() => {
    const t = setTimeout(() => setPhase("auf"), 60);
    return () => clearTimeout(t);
  }, []);

  // Hintergrund nicht mitscrollen, Esc schließt
  const schliessenRef = useRef(onClose);
  schliessenRef.current = onClose;
  useEffect(() => {
    const alt = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const taste = (e) => e.key === "Escape" && schliessenRef.current();
    window.addEventListener("keydown", taste);
    return () => { document.body.style.overflow = alt; window.removeEventListener("keydown", taste); };
  }, []);

  // Höhe an die sichtbare Fläche anpassen, damit das Buch über der Tastatur bleibt
  useEffect(() => {
    const vv = window.visualViewport;
    const neu = () => setHoehe(vv ? vv.height : window.innerHeight);
    neu();
    (vv || window).addEventListener("resize", neu);
    return () => (vv || window).removeEventListener("resize", neu);
  }, []);

  // Nach dem Aufschlagen ins Feld — dann kommt die Tastatur
  useEffect(() => {
    if (phase !== "auf") return;
    const t = setTimeout(() => feldRef.current?.focus({ preventScroll: true }), 700);
    return () => clearTimeout(t);
  }, [phase]);

  // Seite mitlaufen lassen, damit die Feder sichtbar bleibt
  useLayoutEffect(() => {
    const s = seiteRef.current;
    if (s) s.scrollTop = s.scrollHeight;
  }, [wert]);

  const text = wert || "";
  const vorne = text.slice(0, -1);
  const letzter = text.slice(-1);
  const kompakt = hoehe < 560;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Tagebuch schreiben" style={{
      position: "fixed", left: 0, right: 0, top: 0, height: hoehe, zIndex: 9999,
      display: "flex", flexDirection: "column",
      background: `radial-gradient(120% 80% at 50% 0%, ${F.nacht2} 0%, ${F.nacht1} 70%)`,
      animation: "s2gSbIn .35s ease both",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 0" }}>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", color: "#E9CFA0" }}>Dein Tagebuch</span>
        <button type="button" onClick={onClose} aria-label="Schließen" style={{ background: "none", border: "none", color: "#F3E6C4", fontSize: 24, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
      </div>

      {/* Bühne mit dem Buch */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", perspective: 1600, padding: kompakt ? "4px 10px" : "10px 12px" }}>
        <div style={{
          position: "relative", width: "min(96vw, 620px)", height: "100%", maxHeight: 460,
          transformStyle: "preserve-3d", transform: "rotateX(14deg)",
          transition: "transform .9s ease",
        }}>
          {/* Schatten unter dem Buch */}
          <div style={{ position: "absolute", left: "6%", right: "6%", bottom: -14, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.45)", filter: "blur(12px)" }} />

          {/* Die zwei Seiten */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", borderRadius: 10,
            boxShadow: "0 26px 50px rgba(0,0,0,.5)",
            opacity: phase === "auf" ? 1 : 0, transition: "opacity .5s ease .35s",
          }}>
            {/* linke Seite: Frage */}
            <div style={{
              width: "38%", padding: kompakt ? "12px 12px" : "18px 16px", boxSizing: "border-box",
              background: `linear-gradient(90deg, ${F.seite2} 0%, ${F.seite} 30%, #F3E7D2 100%)`,
              borderRadius: "10px 0 0 10px", overflow: "hidden",
              boxShadow: "inset -18px 0 22px -16px rgba(60,30,50,.35)",
            }}>
              <div style={{ fontFamily: HAND, fontSize: 15, color: F.plum, opacity: .85 }}>{datum}</div>
              <div style={{ width: 34, height: 1, background: F.gold, margin: "8px 0 10px" }} />
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: kompakt ? 14 : 16, color: F.tinte, lineHeight: 1.45 }}>{frage}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: F.gold, marginTop: 14, opacity: .7 }}>✦</div>
            </div>
            {/* Buchrücken */}
            <div style={{ width: 6, background: "linear-gradient(90deg, rgba(60,30,50,.35), rgba(255,255,255,.4), rgba(60,30,50,.3))" }} />
            {/* rechte Seite: hier schreibt die Feder */}
            <div ref={seiteRef} style={{
              flex: 1, padding: kompakt ? "10px 14px" : "16px 18px 18px", boxSizing: "border-box",
              background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, ${F.linie} 31px, ${F.linie} 32px), linear-gradient(90deg, #F3E7D2 0%, ${F.seite} 14%, ${F.seite} 100%)`,
              backgroundAttachment: "local",
              borderRadius: "0 10px 10px 0", overflowY: "auto", overflowX: "hidden",
              boxShadow: "inset 18px 0 22px -16px rgba(60,30,50,.3)",
            }}>
              <div style={{ fontFamily: HAND, fontSize: 20, lineHeight: "32px", color: F.tinte, whiteSpace: "pre-wrap", wordBreak: "break-word", paddingRight: 40, paddingTop: 34 }}>
                {!text && <span style={{ opacity: .35 }}>Schreib es auf …</span>}
                {vorne}
                {letzter && <span key={text.length} style={{ display: "inline-block", animation: "s2gTinte .45s ease both" }}>{letzter === " " ? " " : letzter === "\n" ? "\n" : letzter}</span>}
                <Feder schlag={text.length} />
              </div>
            </div>
          </div>

          {/* Buchdeckel — schwingt auf */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: "38%", right: 0,
            transformOrigin: "left center", transformStyle: "preserve-3d",
            transform: phase === "auf" ? "rotateY(-178deg)" : "rotateY(0deg)",
            transition: "transform 1.1s cubic-bezier(.6,.02,.2,1)",
            pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "4px 12px 12px 4px", backfaceVisibility: "hidden",
              background: `linear-gradient(135deg, ${F.rose}, ${F.gold})`,
              boxShadow: "0 20px 40px rgba(0,0,0,.45)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff",
            }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>✦</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22 }}>Dein Tagebuch</div>
            </div>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "12px 4px 4px 12px", backfaceVisibility: "hidden",
              transform: "rotateY(180deg)", background: `linear-gradient(135deg, #E9C9C0, ${F.seite2})`,
              opacity: phase === "auf" ? 0 : 1, transition: "opacity .3s ease 1s",
            }} />
          </div>
        </div>
      </div>

      {/* Eingabe — darunter erscheint die Tastatur */}
      <div style={{ padding: "10px 12px calc(10px + env(safe-area-inset-bottom))", display: "flex", gap: 8, alignItems: "flex-end", background: "rgba(20,10,24,.55)", borderTop: "1px solid rgba(233,207,160,.25)" }}>
        <textarea
          ref={feldRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder="Tippe hier — die Feder schreibt mit …"
          aria-label={frage}
          style={{
            flex: 1, resize: "none", borderRadius: 14, border: "1.5px solid rgba(233,207,160,.45)",
            background: "rgba(255,253,246,.96)", padding: "10px 12px", outline: "none",
            fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1.45, color: F.tinte,
          }}
        />
        <button type="button" onClick={onClose} style={{
          padding: "12px 16px", borderRadius: 14, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${F.gold}, ${F.rose})`, color: "#fff",
          fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15,
        }}>Fertig</button>
      </div>

      <style>{`
        @keyframes s2gSbIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes s2gTinte { from { opacity: 0; filter: blur(2px); transform: translateY(-2px) scale(1.15); } to { opacity: 1; filter: none; transform: none; } }
        @keyframes s2gFederSchreibt {
          0% { transform: translate(0,0) rotate(0deg); }
          30% { transform: translate(2px,-3px) rotate(-6deg); }
          60% { transform: translate(-1px,1px) rotate(3deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        @keyframes s2gFederRuht { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-3px) rotate(-3deg); } }
        @media (prefers-reduced-motion: reduce) {
          [data-feder] { animation: none !important; }
        }
      `}</style>
    </div>,
    document.body
  );
}

/* Die Feder sitzt am Ende des Textes. Bei jedem Tastendruck wackelt sie,
   als würde sie den Buchstaben schreiben; sonst schwebt sie leicht. */
function Feder({ schlag }) {
  const [schreibt, setSchreibt] = useState(false);
  useEffect(() => {
    if (!schlag) return;
    setSchreibt(true);
    const t = setTimeout(() => setSchreibt(false), 600);
    return () => clearTimeout(t);
  }, [schlag]);
  return (
    <span aria-hidden="true" style={{ display: "inline-block", position: "relative", width: 0, height: "1em" }}>
      <span key={schreibt ? `s${schlag}` : "ruht"} data-feder style={{
        position: "absolute", left: -3, bottom: -6, width: 70, height: 70, transformOrigin: "4px 66px",
        animation: schreibt ? "s2gFederSchreibt .28s ease-in-out 2" : "s2gFederRuht 2.6s ease-in-out infinite",
        pointerEvents: "none", filter: "drop-shadow(1px 3px 3px rgba(40,20,40,.35))",
      }}>
        <svg viewBox="0 0 52 52" width="70" height="70">
          <defs>
            <linearGradient id="s2gFahne" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#F4E7EC" />
              <stop offset=".55" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E8C7D4" />
            </linearGradient>
          </defs>
          {/* Fahne */}
          <path d="M14 36 C 16 22, 28 8, 49 2 C 44 14, 36 28, 18 38 Z" fill="url(#s2gFahne)" stroke="#C9A6B6" strokeWidth=".6" />
          <path d="M18 31 L 24 27 M 22 26 L 29 21 M 27 20 L 34 15 M 32 14 L 40 9" stroke="#D3B3C2" strokeWidth=".6" />
          {/* Kiel */}
          <path d="M5 48 L 46 5" stroke="#B8923F" strokeWidth="1.4" strokeLinecap="round" />
          {/* Spitze mit Tinte */}
          <path d="M3 50 L 7 44 L 9 46 Z" fill="#3B2340" />
        </svg>
      </span>
    </span>
  );
}
