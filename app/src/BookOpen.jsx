// BookOpen.jsx — smile2go
// Das Tagebuch als echtes 3D-Buch: Deckel, Rücken, sichtbarer Seitenblock,
// Lesezeichen. Es schwebt leicht auf der Seite.
//
// Öffnen wie beim Orakel: Ein Tipp holt das Buch auf eine dunkle Bühne im
// Vollbild. Es fliegt aus seiner Position in die Mitte und dreht sich dabei,
// legt sich gerade hin, der Deckel schwingt auf, und die erste Seite wächst
// über den ganzen Bildschirm — darauf stehen die Schreibseiten (children).
// Oben rechts schließt ein Kreuz das Buch wieder.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AUDIO } from "./media";

const W = 220;   // Breite
const H = 296;   // Höhe
const D = 46;    // Dicke

const PLUM = "#5B2A57";
const PLUM_D = "#3E1A3B";
const GOLD = "#E7C26A";
const GOLD_D = "#B88A35";
const ROSE = "#E8A8D4";
const PINK = "#D472BE";

const FLUG_MS = 1500;
const DECKEL_MS = 1100;
const SEITE_MS = 750;

const wenigBewegung = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const summe = (d) => { try { navigator.vibrate?.(d); } catch { /* egal */ } };

export default function BookOpen({ children, title = "Mein Tagebuch", subtitle = "Ein Raum nur für dich", badge = "Journal" }) {
  const [offen, setOffen] = useState(false);
  const quelleRef = useRef(null);
  const aRef = useRef(null);

  const oeffnen = () => {
    if (offen) return;
    summe(8);
    try { if (aRef.current) { aRef.current.volume = 0.85; aRef.current.currentTime = 0; aRef.current.play(); } } catch (e) {}
    setOffen(true);
  };

  return (
    <div style={S.wrap}>
      <audio ref={aRef} src={AUDIO.tagebuch} preload="auto" />
      <div style={S.badgeRow}><span style={S.badge}>{badge}</span></div>

      <button onClick={oeffnen} aria-label="Tagebuch öffnen" style={S.btn}>
        <div style={S.stage}>
          <div style={S.shadow} />
          <div ref={quelleRef} style={{ ...S.float, visibility: offen ? "hidden" : "visible", animation: "s2gFloat 5s ease-in-out infinite" }}>
            <Buch title={title} subtitle={subtitle} />
          </div>
          <Funken />
        </div>
      </button>

      <div style={S.hint}>Tippe aufs Buch, um es zu öffnen</div>

      {offen && (
        <BuchVollbild quelle={quelleRef} title={title} subtitle={subtitle} onClose={() => setOffen(false)}>
          {children}
        </BuchVollbild>
      )}

      <style>{`
        @keyframes s2gFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes s2gTwinkle { 0%,100% { opacity: 0; transform: scale(.4) rotate(0deg) } 50% { opacity: 1; transform: scale(1) rotate(45deg) } }
        @keyframes s2gGlow { 0%,100% { opacity: .55 } 50% { opacity: .95 } }
        @keyframes s2gStaub { 0% { opacity: 0; transform: translateY(0) scale(.6) } 30% { opacity: 1 } 100% { opacity: 0; transform: translateY(-70px) scale(1) } }
        @keyframes s2gStrahl { from { transform: translate(-50%,-50%) rotate(0deg) } to { transform: translate(-50%,-50%) rotate(360deg) } }
        @keyframes s2gInhalt { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .s2g-funke { animation: none !important; opacity: .7 } }
      `}</style>
    </div>
  );
}

/* Die Bühne im Vollbild: flug → deckel → seite → offen → zu */
function BuchVollbild({ quelle, title, subtitle, onClose, children }) {
  const flugRef = useRef(null);
  const deckelRef = useRef(null);
  const ersteRef = useRef(null);
  const seiteRef = useRef(null);
  const [phase, setPhase] = useState(wenigBewegung() ? "offen" : "flug");

  // 1 · Flug: aus der Position auf der Seite in die Mitte, mit zwei Drehungen
  useLayoutEffect(() => {
    if (phase !== "flug") return;
    const el = flugRef.current;
    const q = quelle?.current?.getBoundingClientRect();
    if (!el?.animate || !q) { setPhase("deckel"); return; }
    const z = el.getBoundingClientRect();
    const dx = (q.left + q.width / 2) - (z.left + z.width / 2);
    const dy = (q.top + q.height / 2) - (z.top + z.height / 2);
    const a = el.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(.82) rotateY(0deg)`, filter: "brightness(1)" },
      { transform: `translate(${dx * .35}px, ${dy * .35 - 30}px) scale(1.05) rotateY(380deg)`, filter: "brightness(1.3)", offset: .55 },
      { transform: "translate(0, 0) scale(1) rotateY(720deg)", filter: "brightness(1)" },
    ], { duration: FLUG_MS, easing: "cubic-bezier(.3,.05,.2,1)", fill: "forwards" });
    a.onfinish = () => { summe([10, 40, 18]); setPhase("deckel"); };
    return () => a.cancel();
  }, []);

  // 2 · Deckel schwingt auf
  useEffect(() => {
    if (phase !== "deckel") return;
    const el = deckelRef.current;
    if (!el?.animate) { setPhase("seite"); return; }
    const a = el.animate([
      { transform: `translateZ(${D / 2}px) rotateY(0deg)` },
      { transform: `translateZ(${D / 2}px) rotateY(-168deg)` },
    ], { duration: DECKEL_MS, easing: "cubic-bezier(.6,.02,.2,1)", fill: "forwards" });
    a.onfinish = () => setPhase("seite");
    return () => a.cancel();
  }, [phase]);

  // 3 · Die erste Seite wächst über den ganzen Bildschirm
  useLayoutEffect(() => {
    if (phase !== "seite") return;
    const el = seiteRef.current;
    const q = ersteRef.current?.getBoundingClientRect();
    if (!el?.animate || !q) { setPhase("offen"); return; }
    const z = el.getBoundingClientRect();
    const a = el.animate([
      { transform: `translate(${q.left - z.left}px, ${q.top - z.top}px) scale(${q.width / z.width}, ${q.height / z.height})`, borderRadius: "10px", opacity: 1 },
      { transform: "translate(0,0) scale(1)", borderRadius: "0px", opacity: 1 },
    ], { duration: SEITE_MS, easing: "cubic-bezier(.2,.9,.12,1)", fill: "both" });
    a.onfinish = () => { a.cancel(); setPhase("offen"); };
    return () => a.cancel();
  }, [phase]);

  // Scroll sperren, Escape schließt
  useEffect(() => {
    const alt = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const taste = (e) => e.key === "Escape" && schliessen();
    window.addEventListener("keydown", taste);
    return () => { document.body.style.overflow = alt; window.removeEventListener("keydown", taste); };
  }, []);

  const schliessen = () => {
    if (phase === "zu") return;
    setPhase("zu");
    setTimeout(onClose, 320);
  };

  const buehneSichtbar = phase === "flug" || phase === "deckel" || phase === "seite";
  const seiteSichtbar = phase === "seite" || phase === "offen" || phase === "zu";
  const datum = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: `radial-gradient(120% 80% at 50% 35%, #4A2346 0%, #2A1428 55%, #160A16 100%)`,
      opacity: phase === "zu" ? 0 : 1, transition: "opacity .32s ease",
    }}>
      {/* Bühne: Lichtstrahlen, Goldstaub, das fliegende Buch */}
      {buehneSichtbar && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", perspective: 1200, overflow: "hidden" }}>
          <div style={{
            position: "absolute", left: "50%", top: "50%", width: 900, height: 900, pointerEvents: "none",
            background: "repeating-conic-gradient(from 0deg, rgba(231,194,106,.10) 0deg 6deg, transparent 6deg 22deg)",
            WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 62%)", maskImage: "radial-gradient(circle, #000 0%, transparent 62%)",
            animation: "s2gStrahl 24s linear infinite",
          }} />
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{
              position: "absolute", left: `${8 + (i * 53) % 84}%`, top: `${30 + (i * 37) % 55}%`,
              width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, borderRadius: "50%", pointerEvents: "none",
              background: i % 2 ? GOLD : "#FFE6F6", boxShadow: `0 0 8px ${i % 2 ? GOLD : PINK}`,
              animation: `s2gStaub ${2.6 + (i % 4) * .5}s ${(i % 6) * .35}s ease-out infinite`, opacity: 0,
            }} />
          ))}
          <div ref={flugRef} style={{ transformStyle: "preserve-3d", transform: "scale(1)", visibility: phase === "seite" ? "hidden" : "visible" }}>
            {/* Beim Aufschlagen rückt das Buch nach rechts und wird kleiner, damit der
                aufgeklappte Deckel links noch auf den Bildschirm passt. */}
            <div style={{
              transform: phase === "flug" ? "scale(1.25)" : `translateX(${W * 0.46}px) scale(.84)`,
              transition: `transform ${DECKEL_MS}ms cubic-bezier(.6,.02,.2,1)`, transformStyle: "preserve-3d",
            }}>
              <Buch title={title} subtitle={subtitle} gerade={phase !== "flug"} deckelRef={deckelRef} ersteRef={ersteRef} />
            </div>
          </div>
        </div>
      )}

      {/* Die Seite im Vollbild */}
      {seiteSichtbar && (
        <div ref={seiteRef} style={{
          position: "absolute", inset: 0, transformOrigin: "0 0", overflowY: "auto", WebkitOverflowScrolling: "touch",
          background: "linear-gradient(105deg, #EFE2CC 0%, #FDF8EC 6%, #FFFDF6 55%, #F8EFDD 100%)",
          boxShadow: "inset 18px 0 24px -18px rgba(58,42,34,.35)",
        }}>
          {phase !== "seite" && (
            <div style={{ animation: "s2gInhalt .5s ease both", maxWidth: 560, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 18px) 18px calc(env(safe-area-inset-bottom, 0px) + 40px)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: PLUM_D }}>{title}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, color: "#7A6B7A", marginTop: 2 }}>{datum}</div>
                </div>
                <button onClick={schliessen} aria-label="Tagebuch schließen" style={{
                  width: 44, height: 44, borderRadius: "50%", border: `1.5px solid ${PLUM}`, background: "rgba(255,255,255,.7)",
                  color: PLUM, fontSize: 22, lineHeight: 1, cursor: "pointer", flexShrink: 0,
                }}>✕</button>
              </div>
              {children}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}

/* Das Buch selbst. `gerade`: auf der Bühne liegt es frontal statt schräg. */
function Buch({ title, subtitle, gerade = false, deckelRef, ersteRef }) {
  return (
    <div style={{ ...S.book, transform: gerade ? "rotateX(4deg) rotateY(-6deg)" : S.book.transform }}>
      {/* Rückdeckel */}
      <div style={{ ...S.face, ...S.cover, transform: `translateZ(${-D / 2}px) rotateY(180deg)` }} />

      {/* Seitenblock: rechts, oben, unten */}
      <div style={{ ...S.face, ...S.pagesV, width: D - 6, left: (W - (D - 6)) / 2, transform: `rotateY(90deg) translateZ(${W / 2 - 5}px)` }} />
      <div style={{ ...S.face, ...S.pagesH, height: D - 6, top: (H - (D - 6)) / 2, transform: `rotateX(90deg) translateZ(${H / 2 - 4}px)` }} />
      <div style={{ ...S.face, ...S.pagesH, height: D - 6, top: (H - (D - 6)) / 2, transform: `rotateX(-90deg) translateZ(${H / 2 - 4}px)` }} />

      {/* Rücken */}
      <div style={{ ...S.face, ...S.spine, width: D, left: (W - D) / 2, transform: `rotateY(-90deg) translateZ(${W / 2}px)` }}>
        <div style={S.spineBand} /><div style={{ ...S.spineBand, top: "auto", bottom: 34 }} />
      </div>

      {/* Lesezeichen */}
      <div style={{ ...S.ribbon, transform: `translateZ(${D / 2 - 8}px)` }} />

      {/* Erste Seite (unter dem Deckel) */}
      <div ref={ersteRef} style={{ ...S.face, ...S.firstPage, transform: `translateZ(${D / 2 - 3}px)` }}>
        <div style={S.firstPageText}>Gerade ist bei mir …</div>
      </div>

      {/* Vorderdeckel */}
      <div ref={deckelRef} style={{
        ...S.face, transformStyle: "preserve-3d", transformOrigin: "left center",
        transform: `translateZ(${D / 2}px)`,
      }}>
        <div style={{ ...S.face, ...S.cover, backfaceVisibility: "hidden" }}>
          <div style={S.frame} />
          <div style={S.corner} /><div style={{ ...S.corner, left: "auto", right: 8, transform: "scaleX(-1)" }} />
          <div style={{ ...S.corner, top: "auto", bottom: 8, transform: "scaleY(-1)" }} />
          <div style={{ ...S.corner, top: "auto", bottom: 8, left: "auto", right: 8, transform: "scale(-1)" }} />
          <div style={S.emblem}>
            <div style={S.emblemGlow} />
            <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="#FFE9F7" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", filter: `drop-shadow(0 0 6px ${PINK}) drop-shadow(0 0 12px ${PINK})` }}>
              <path d="M12 20.4C7.2 17 3.6 14 3.6 10.3A4.3 4.3 0 0 1 12 8.1a4.3 4.3 0 0 1 8.4 2.2c0 3.7-3.6 6.7-8.4 10.1z" />
              <path d="M12 3.2v2.2M7.6 4.6l1 1.6M16.4 4.6l-1 1.6" stroke={GOLD} />
            </svg>
          </div>
          <div style={S.title}>{title}</div>
          <div style={S.sub}>{subtitle}</div>
          <div style={S.sheen} />
        </div>
        <div style={{ ...S.face, ...S.coverInside, transform: "rotateY(180deg)", backfaceVisibility: "hidden" }} />
      </div>
    </div>
  );
}

function Funken() {
  const pts = [[8, 18, 0], [92, 12, 1.2], [96, 62, 2.1], [4, 70, 3], [70, 4, .6], [30, 90, 1.7]];
  return pts.map(([x, y, d], i) => (
    <span key={i} className="s2g-funke" style={{
      position: "absolute", left: `${x}%`, top: `${y}%`, width: 12, height: 12, pointerEvents: "none",
      background: "radial-gradient(circle, #fff 0 18%, transparent 20%), linear-gradient(#fff,#fff) center/2px 100% no-repeat, linear-gradient(#fff,#fff) center/100% 2px no-repeat",
      filter: `drop-shadow(0 0 4px ${ROSE})`, animation: `s2gTwinkle 3.2s ${d}s ease-in-out infinite`, opacity: 0,
    }} />
  ));
}

const S = {
  wrap: { overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0 18px", marginBottom: 14 },
  badgeRow: { position: "relative", zIndex: 3, marginBottom: -14 },
  badge: {
    display: "inline-block", padding: "5px 16px", borderRadius: 20,
    background: `linear-gradient(180deg, #F6DC93, ${GOLD} 55%, ${GOLD_D})`,
    color: PLUM_D, fontFamily: "system-ui, sans-serif", fontWeight: 800, fontSize: 13.5,
    letterSpacing: 2, textTransform: "uppercase", boxShadow: "0 3px 10px rgba(91,42,87,.35), inset 0 1px 0 rgba(255,255,255,.6)",
  },
  btn: { border: "none", background: "transparent", padding: 0, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  stage: { position: "relative", width: W + 110, height: H + 90, perspective: 1100, display: "flex", alignItems: "center", justifyContent: "center" },
  shadow: { position: "absolute", bottom: 22, left: "50%", width: W + 20, height: 34, transform: "translateX(-45%)", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(62,26,59,.42), transparent 70%)", filter: "blur(4px)" },
  float: { transformStyle: "preserve-3d" },
  book: {
    position: "relative", width: W, height: H, transformStyle: "preserve-3d",
    transform: "rotateX(20deg) rotateY(24deg) rotateZ(-3deg)", transition: "transform 1s cubic-bezier(.4,0,.2,1)",
  },
  face: { position: "absolute", left: 0, top: 0, width: W, height: H },
  cover: {
    borderRadius: "5px 16px 16px 5px", overflow: "hidden",
    background: `radial-gradient(120% 80% at 30% 20%, #8A4383 0%, ${PLUM} 45%, ${PLUM_D} 100%)`,
    boxShadow: `inset 0 0 0 2px rgba(231,194,106,.55), inset 10px 0 18px -8px rgba(0,0,0,.45), inset 0 0 40px rgba(0,0,0,.25)`,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff",
  },
  coverInside: { borderRadius: "5px 16px 16px 5px", background: `linear-gradient(90deg, #EBD9C2, #F8EFDF)`, boxShadow: `inset 0 0 0 6px ${PLUM}` },
  frame: { position: "absolute", inset: 14, borderRadius: 10, border: `1.5px solid rgba(231,194,106,.65)`, boxShadow: `0 0 10px rgba(212,114,190,.35), inset 0 0 10px rgba(212,114,190,.25)` },
  corner: { position: "absolute", top: 8, left: 8, width: 26, height: 26, borderTop: `3px solid ${GOLD}`, borderLeft: `3px solid ${GOLD}`, borderRadius: "8px 0 0 0", filter: "drop-shadow(0 1px 1px rgba(0,0,0,.4))" },
  emblem: { position: "relative", width: 118, height: 118, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emblemGlow: {
    position: "absolute", inset: 0, borderRadius: "50%",
    background: `radial-gradient(circle, rgba(212,114,190,.75) 0%, rgba(212,114,190,.25) 45%, transparent 70%)`,
    border: `2px solid ${GOLD}`, boxShadow: `0 0 18px ${PINK}, inset 0 0 18px rgba(255,255,255,.25)`,
    animation: "s2gGlow 3.5s ease-in-out infinite",
  },
  title: { fontFamily: "Georgia, serif", fontSize: 25, fontWeight: 600, color: "#FFF6E2", textShadow: `0 2px 0 ${PLUM_D}, 0 0 12px rgba(231,194,106,.55)` },
  sub: { fontFamily: "system-ui, sans-serif", fontSize: 14.5, marginTop: 6, color: "#F3D9EC", letterSpacing: .4 },
  sheen: { position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.16) 42%, transparent 52%)", pointerEvents: "none" },
  pagesV: {
    top: 4, height: H - 8,
    background: "repeating-linear-gradient(90deg, #FFF9EE 0 2px, #E9DCC6 2px 3px), linear-gradient(#fff,#E8D9C0)",
    backgroundBlendMode: "multiply", boxShadow: "inset 0 0 8px rgba(120,80,40,.25)",
  },
  pagesH: {
    left: 4, width: W - 12,
    background: "repeating-linear-gradient(180deg, #FFF9EE 0 2px, #E9DCC6 2px 3px)",
    boxShadow: "inset 0 0 8px rgba(120,80,40,.25)",
  },
  spine: {
    height: H, borderRadius: 6,
    background: `linear-gradient(90deg, ${PLUM_D}, #7A3A73 45%, ${PLUM_D})`,
    boxShadow: `inset 0 0 0 2px rgba(231,194,106,.4)`,
  },
  spineBand: { position: "absolute", top: 34, left: 0, right: 0, height: 8, background: `linear-gradient(180deg, #F6DC93, ${GOLD_D})` },
  ribbon: {
    position: "absolute", left: W * 0.62, top: H - 16, width: 18, height: 52,
    background: `linear-gradient(90deg, #B8389F, ${PINK} 50%, #B8389F)`,
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
    boxShadow: "0 4px 6px rgba(0,0,0,.3)",
  },
  firstPage: { borderRadius: "3px 12px 12px 3px", background: "linear-gradient(105deg, #F3E9D8, #FFFDF6 30%, #F8EFDD)", display: "flex", alignItems: "center", justifyContent: "center", top: 3, height: H - 6, width: W - 4 },
  firstPageText: { fontFamily: '"Snell Roundhand", "Savoye LET", "Segoe Script", cursive', fontSize: 20, color: "#4A3320", opacity: .8 },
  hint: { fontFamily: "system-ui, sans-serif", fontSize: 16, color: "#5E4F5E", letterSpacing: .3, marginTop: -6, transition: "opacity .3s" },
};
