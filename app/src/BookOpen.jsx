// BookOpen.jsx — smile2go
// Das Tagebuch als echtes 3D-Buch: Deckel, Rücken, sichtbarer Seitenblock,
// Lesezeichen. Es schwebt leicht; beim Tippen schwingt der Deckel auf und gibt
// die Schreibseiten (children) frei. Sanfte Stimme beim Öffnen.
import { useRef, useState } from "react";
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

export default function BookOpen({ children, title = "Mein Tagebuch", subtitle = "Ein Raum nur für dich", badge = "Journal" }) {
  const [phase, setPhase] = useState("closed"); // closed | opening | open
  const aRef = useRef(null);

  const doOpen = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    try { if (aRef.current) { aRef.current.volume = 0.85; aRef.current.play(); } } catch (e) {}
    setTimeout(() => setPhase("open"), 1250);
  };

  if (phase === "open") {
    return (
      <div style={{ animation: "s2gPagesIn .6s ease both" }}>
        {children}
        <style>{`@keyframes s2gPagesIn { from { opacity: 0; transform: translateY(12px) scale(.985); } to { opacity: 1; transform: none; } }`}</style>
      </div>
    );
  }

  const opening = phase === "opening";

  return (
    <div style={S.wrap}>
      <audio ref={aRef} src={AUDIO.tagebuch} preload="auto" />
      <div style={S.badgeRow}><span style={S.badge}>{badge}</span></div>

      <button onClick={doOpen} aria-label="Tagebuch öffnen" style={S.btn}>
        <div style={S.stage}>
          <div style={S.shadow} />
          <div style={{ ...S.float, animation: opening ? "none" : "s2gFloat 5s ease-in-out infinite" }}>
            <div style={{ ...S.book, transform: opening ? "rotateX(6deg) rotateY(-8deg) translateZ(30px)" : S.book.transform }}>

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
              <div style={{ ...S.face, ...S.firstPage, transform: `translateZ(${D / 2 - 3}px)` }}>
                <div style={S.firstPageText}>Gerade ist bei mir …</div>
              </div>

              {/* Vorderdeckel — schwingt auf */}
              <div style={{
                ...S.face, transformStyle: "preserve-3d", transformOrigin: "left center",
                transform: `translateZ(${D / 2}px)`,
                animation: opening ? "s2gSwing 1.2s cubic-bezier(.6,.02,.2,1) forwards" : "none",
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
          </div>
          <Funken />
        </div>
      </button>

      <div style={{ ...S.hint, opacity: opening ? 0 : 1 }}>Tippe aufs Buch, um es zu öffnen</div>

      <style>{`
        @keyframes s2gFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes s2gSwing { from { transform: translateZ(${D / 2}px) rotateY(0deg); } to { transform: translateZ(${D / 2}px) rotateY(-165deg); } }
        @keyframes s2gTwinkle { 0%,100% { opacity: 0; transform: scale(.4) rotate(0deg) } 50% { opacity: 1; transform: scale(1) rotate(45deg) } }
        @keyframes s2gGlow { 0%,100% { opacity: .55 } 50% { opacity: .95 } }
        @media (prefers-reduced-motion: reduce) { .s2g-funke { animation: none !important; opacity: .7 } }
      `}</style>
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
    color: PLUM_D, fontFamily: "system-ui, sans-serif", fontWeight: 800, fontSize: 12,
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
  sub: { fontFamily: "system-ui, sans-serif", fontSize: 12, marginTop: 6, color: "#F3D9EC", letterSpacing: .4 },
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
  hint: { fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: "#7A6B7A", letterSpacing: .3, marginTop: -6, transition: "opacity .3s" },
};
