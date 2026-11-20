// SchreibBuch.jsx — smile2go
// Schreiben wie in einem echten Buch: Tippt die Nutzerin in ein Tagebuch-Feld,
// öffnet sich bildschirmfüllend ein Buch in 3D. Oben das offene Buch,
// unten das Eingabefeld (die Handy-Tastatur erscheint darunter). Eine Feder
// folgt dem Text und „schreibt“ jeden Buchstaben, der getippt wird.
//
// Drei Stile zur Auswahl (Wahl wird gemerkt, localStorage „s2g_buchstil“):
//   klassisch — Doppelseite, Deckel schwingt langsam auf
//   seite     — eine große Seite, maximal Platz zum Schreiben
//   blaettern — Lederbuch, Deckel öffnet sich, dann blättern drei Seiten um
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const F = {
  nacht1: "#2B1733", nacht2: "#4A2145",
  seite: "#FFFDF6", seite2: "#F6ECD9", linie: "rgba(193,145,60,.36)",
  gold: "#C1913C", goldHell: "#E9CFA0", rose: "#C2526E", tinte: "#3B2340", plum: "#8E4A63",
  leder1: "#5A2450", leder2: "#3A1534",
};
const HAND = '"Snell Roundhand", "Savoye LET", "Bradley Hand", "Segoe Script", cursive';

export const BUCH_STILE = [
  { id: "klassisch", t: "Klassisch" },
  { id: "seite", t: "Eine Seite" },
  { id: "blaettern", t: "Blättern" },
];
// Wann die Feder bereit ist (ms) — der Deckel braucht seine Zeit.
const DAUER = { klassisch: 2300, seite: 2000, blaettern: 3300 };

const ladeStil = () => {
  try { const s = localStorage.getItem("s2g_buchstil"); return BUCH_STILE.some((x) => x.id === s) ? s : "klassisch"; } catch { return "klassisch"; }
};

export default function SchreibBuch({ frage, wert, onChange, onClose, datum }) {
  const [stil, setStil] = useState(ladeStil);
  const [phase, setPhase] = useState("zu"); // zu | oeffnen | auf
  const [hoehe, setHoehe] = useState(() => (typeof window !== "undefined" ? (window.visualViewport?.height || window.innerHeight) : 700));
  const feldRef = useRef(null);
  const schliessenRef = useRef(onClose);
  schliessenRef.current = onClose;

  // Buch aufschlagen — bei jedem Stilwechsel von vorn
  useEffect(() => {
    setPhase("zu");
    const t1 = setTimeout(() => setPhase("oeffnen"), 350);
    const t2 = setTimeout(() => setPhase("auf"), 350 + DAUER[stil]);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stil]);

  // Hintergrund nicht mitscrollen, Esc schließt
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

  // Erst wenn das Buch offen ist: ins Feld — dann kommt die Tastatur
  useEffect(() => {
    if (phase === "auf") feldRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const waehle = (id) => {
    if (id === stil) return;
    setPhase("zu");      // im selben Render geschlossen, sonst startet der neue Deckel offen
    setStil(id);
    try { localStorage.setItem("s2g_buchstil", id); } catch {}
  };

  const kompakt = hoehe < 560;
  const auf = phase !== "zu";
  const seiteProps = { frage, datum, text: wert || "", kompakt, feder: phase === "auf", sichtbar: phase === "auf" || stil !== "blaettern" ? auf : false };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Tagebuch schreiben" style={{
      position: "fixed", left: 0, right: 0, top: 0, height: hoehe, zIndex: 9999,
      display: "flex", flexDirection: "column",
      background: `radial-gradient(120% 80% at 50% 0%, ${F.nacht2} 0%, ${F.nacht1} 70%)`,
      animation: "s2gSbIn .5s ease both",
    }}>
      {/* Kopf: Stilwahl + Schließen */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "max(10px, env(safe-area-inset-top)) 10px 0 12px" }}>
        <div style={{ display: "flex", gap: 6, flex: 1, overflowX: "auto" }}>
          {BUCH_STILE.map((s) => (
            <button key={s.id} type="button" onClick={() => waehle(s.id)} aria-pressed={stil === s.id} style={{
              padding: "7px 12px", borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap",
              border: `1px solid ${stil === s.id ? F.goldHell : "rgba(233,207,160,.3)"}`,
              background: stil === s.id ? "rgba(233,207,160,.18)" : "transparent",
              color: stil === s.id ? "#FFF3DC" : "rgba(243,230,196,.7)",
              fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600,
            }}>{s.t}</button>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label="Schließen" style={{ background: "none", border: "none", color: "#F3E6C4", fontSize: 26, cursor: "pointer", padding: "2px 6px", lineHeight: 1 }}>×</button>
      </div>

      {/* Bühne */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", perspective: 1800, padding: kompakt ? "6px 6px" : "12px 8px 14px" }}>
        <div key={stil} style={{
          position: "relative", width: "min(98vw, 680px)", height: "100%", maxHeight: 720,
          transformStyle: "preserve-3d",
          transform: auf ? "rotateX(6deg) scale(1)" : "rotateX(16deg) scale(.86)",
          transition: "transform 1.6s cubic-bezier(.3,.1,.2,1)",
        }}>
          <div style={{ position: "absolute", left: "5%", right: "5%", bottom: -12, height: 26, borderRadius: "50%", background: "rgba(0,0,0,.45)", filter: "blur(12px)" }} />
          {stil === "klassisch" && <Klassisch phase={phase} {...seiteProps} />}
          {stil === "seite" && <EineSeite phase={phase} {...seiteProps} />}
          {stil === "blaettern" && <Blaettern phase={phase} {...seiteProps} />}
        </div>
      </div>

      {/* Eingabe — darunter erscheint die Tastatur */}
      <div style={{ padding: "10px 12px calc(10px + env(safe-area-inset-bottom))", display: "flex", gap: 8, alignItems: "flex-end", background: "rgba(20,10,24,.55)", borderTop: "1px solid rgba(233,207,160,.25)" }}>
        <textarea
          ref={feldRef}
          value={wert || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={phase === "auf" ? "Tippe hier — die Feder schreibt mit …" : "Das Buch öffnet sich …"}
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
        @keyframes s2gBlatt { 0% { transform: rotateY(0deg); opacity: 1; } 80% { transform: rotateY(-178deg); opacity: 1; } 100% { transform: rotateY(-178deg); opacity: 0; } }
        @keyframes s2gEinblenden { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          [data-feder], [data-blatt] { animation: none !important; }
        }
      `}</style>
    </div>,
    document.body
  );
}

/* ── Stil 1: Klassisch — Doppelseite, Deckel schwingt langsam auf ── */
function Klassisch({ phase, ...p }) {
  const auf = phase !== "zu";
  return (
    <>
      <div style={{ position: "absolute", inset: 0, display: "flex", borderRadius: 10, boxShadow: "0 26px 50px rgba(0,0,0,.5)" }}>
        <LinkeSeite {...p} breite="36%" />
        <Ruecken />
        <Schreibseite {...p} rund="0 10px 10px 0" />
      </div>
      <Deckel offen={auf} links="36%" dauer={2.2} />
    </>
  );
}

/* ── Stil 2: Eine Seite — der Deckel klappt weg, eine große Seite bleibt ── */
function EineSeite({ phase, ...p }) {
  const auf = phase !== "zu";
  return (
    <>
      <div style={{ position: "absolute", inset: 0, display: "flex", borderRadius: 10, boxShadow: "0 26px 50px rgba(0,0,0,.5)" }}>
        <div style={{ width: 14, borderRadius: "10px 0 0 10px", background: `linear-gradient(90deg, ${F.leder2}, ${F.plum})` }} />
        <Schreibseite {...p} rund="0 10px 10px 0" mitFrage />
      </div>
      <Deckel offen={auf} links="0%" dauer={1.9} nachOben />
    </>
  );
}

/* ── Stil 3: Blättern — Lederbuch, Deckel auf, dann drei Seiten umblättern ── */
function Blaettern({ phase, ...p }) {
  const auf = phase !== "zu";
  return (
    <>
      <div style={{ position: "absolute", inset: -6, borderRadius: 14, background: `linear-gradient(135deg, ${F.leder1}, ${F.leder2})`, boxShadow: "0 26px 50px rgba(0,0,0,.55)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", borderRadius: 8 }}>
        <LinkeSeite {...p} breite="36%" />
        <Ruecken />
        <Schreibseite {...p} rund="0 8px 8px 0" />
      </div>
      {/* Drei Blätter, die nach dem Öffnen nacheinander umschlagen */}
      {auf && [0, 1, 2].map((i) => (
        <div key={i} data-blatt style={{
          position: "absolute", top: 4, bottom: 4, left: "calc(36% + 6px)", right: 4 + i * 2,
          transformOrigin: "left center", transformStyle: "preserve-3d",
          animation: `s2gBlatt .95s cubic-bezier(.45,.05,.35,1) ${1.55 + i * 0.5}s both`,
          pointerEvents: "none",
        }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: "0 8px 8px 0", background: `linear-gradient(90deg, #EADCC2, ${F.seite} 30%)`, boxShadow: "inset 10px 0 14px -10px rgba(60,30,50,.4)" }} />
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: "8px 0 0 8px", background: `linear-gradient(270deg, #EADCC2, ${F.seite2} 40%)` }} />
        </div>
      ))}
      <Deckel offen={auf} links="36%" dauer={1.5} leder />
    </>
  );
}

/* ── Bausteine ── */
function Deckel({ offen, links, dauer, leder, nachOben }) {
  return (
    <div style={{
      position: "absolute", top: 0, bottom: 0, left: links, right: 0,
      transformOrigin: nachOben ? "center top" : "left center", transformStyle: "preserve-3d",
      transform: offen ? (nachOben ? "rotateX(178deg)" : "rotateY(-178deg)") : "none",
      transition: `transform ${dauer}s cubic-bezier(.55,.05,.25,1)`,
      pointerEvents: "none",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "4px 12px 12px 4px", backfaceVisibility: "hidden",
        background: leder ? `linear-gradient(135deg, ${F.leder1}, ${F.leder2})` : `linear-gradient(135deg, ${F.rose}, ${F.gold})`,
        border: leder ? `1.5px solid ${F.gold}` : "none",
        boxShadow: "0 20px 40px rgba(0,0,0,.45)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: leder ? F.goldHell : "#fff",
      }}>
        {leder && <div style={{ position: "absolute", inset: 12, borderRadius: 8, border: `1px solid rgba(233,207,160,.55)` }} />}
        <div style={{ fontSize: 34, marginBottom: 10 }}>✦</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26 }}>Dein Tagebuch</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginTop: 8, opacity: .85 }}>Ein Raum nur für dich</div>
      </div>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "12px 4px 4px 12px", backfaceVisibility: "hidden",
        transform: nachOben ? "rotateX(180deg)" : "rotateY(180deg)", background: leder ? F.leder2 : `linear-gradient(135deg, #E9C9C0, ${F.seite2})`,
        opacity: offen ? 0 : 1, transition: `opacity .4s ease ${dauer - 0.3}s`,
      }} />
    </div>
  );
}

function Ruecken() {
  return <div style={{ width: 6, background: "linear-gradient(90deg, rgba(60,30,50,.35), rgba(255,255,255,.4), rgba(60,30,50,.3))" }} />;
}

function LinkeSeite({ frage, datum, kompakt, breite }) { // eslint-disable-line
  return (
    <div style={{
      width: breite, padding: kompakt ? "12px 12px" : "22px 18px", boxSizing: "border-box",
      background: `linear-gradient(90deg, ${F.seite2} 0%, ${F.seite} 30%, #F3E7D2 100%)`,
      borderRadius: "10px 0 0 10px", overflow: "hidden",
      boxShadow: "inset -18px 0 22px -16px rgba(60,30,50,.35)",
    }}>
      <div style={{ fontFamily: HAND, fontSize: 17, color: F.plum, opacity: .85 }}>{datum}</div>
      <div style={{ width: 34, height: 1, background: F.gold, margin: "10px 0 12px" }} />
      <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: kompakt ? 15 : 18, color: F.tinte, lineHeight: 1.45 }}>{frage}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: F.gold, marginTop: 16, opacity: .7 }}>✦</div>
    </div>
  );
}

function Schreibseite({ frage, datum, text, kompakt, rund, mitFrage, sichtbar, feder }) {
  const seiteRef = useRef(null);
  useLayoutEffect(() => {
    const s = seiteRef.current;
    if (s) s.scrollTop = s.scrollHeight;
  }, [text]);
  const vorne = text.slice(0, -1);
  const letzter = text.slice(-1);
  const zeile = kompakt ? 34 : 40;
  return (
    <div ref={seiteRef} style={{
      flex: 1, padding: kompakt ? "10px 16px" : "18px 22px 20px", boxSizing: "border-box",
      background: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${zeile - 1}px, ${F.linie} ${zeile - 1}px, ${F.linie} ${zeile}px), linear-gradient(90deg, #F3E7D2 0%, ${F.seite} 12%, ${F.seite} 100%)`,
      backgroundAttachment: "local",
      borderRadius: rund, overflowY: "auto", overflowX: "hidden",
      boxShadow: "inset 18px 0 22px -16px rgba(60,30,50,.3)",
    }}>
      {mitFrage && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: HAND, fontSize: 16, color: F.plum, opacity: .85 }}>{datum}</div>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: kompakt ? 16 : 19, color: F.tinte, lineHeight: 1.35, marginTop: 4 }}>{frage}</div>
        </div>
      )}
      <div style={{
        fontFamily: HAND, fontSize: kompakt ? 22 : 26, lineHeight: `${zeile}px`, color: F.tinte,
        whiteSpace: "pre-wrap", wordBreak: "break-word", paddingRight: 44, paddingTop: mitFrage ? 4 : 40,
        opacity: sichtbar ? 1 : 0, transition: "opacity .6s ease",
      }}>
        {!text && <span style={{ opacity: .35 }}>Schreib es auf …</span>}
        {vorne}
        {letzter && <span key={text.length} style={{ display: "inline-block", animation: "s2gTinte .45s ease both" }}>{letzter === " " ? " " : letzter}</span>}
        {feder && <Feder schlag={text.length} />}
      </div>
    </div>
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
        position: "absolute", left: -3, bottom: -6, width: 78, height: 78, transformOrigin: "4px 74px",
        animation: schreibt ? "s2gFederSchreibt .28s ease-in-out 2" : "s2gFederRuht 2.6s ease-in-out infinite, s2gEinblenden .6s ease",
        pointerEvents: "none", filter: "drop-shadow(1px 3px 3px rgba(40,20,40,.35))",
      }}>
        <svg viewBox="0 0 52 52" width="78" height="78">
          <defs>
            <linearGradient id="s2gFahne" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#F4E7EC" />
              <stop offset=".55" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E8C7D4" />
            </linearGradient>
          </defs>
          <path d="M14 36 C 16 22, 28 8, 49 2 C 44 14, 36 28, 18 38 Z" fill="url(#s2gFahne)" stroke="#C9A6B6" strokeWidth=".6" />
          <path d="M18 31 L 24 27 M 22 26 L 29 21 M 27 20 L 34 15 M 32 14 L 40 9" stroke="#D3B3C2" strokeWidth=".6" />
          <path d="M5 48 L 46 5" stroke="#B8923F" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M3 50 L 7 44 L 9 46 Z" fill="#3B2340" />
        </svg>
      </span>
    </span>
  );
}
