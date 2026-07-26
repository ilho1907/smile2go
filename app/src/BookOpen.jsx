// BookOpen.jsx — smile2go
// Tagebuch öffnet sich wie ein Buch: das Cover schwingt in 3D auf und gibt die
// Schreibseiten (children) frei. Sanfte Stimme beim Öffnen.
import { useRef, useState } from "react";
import { AUDIO, PALETTE as P } from "./media";

export default function BookOpen({ children, title = "Dein Tagebuch", subtitle = "Ein Raum nur für dich" }) {
  const [phase, setPhase] = useState("closed"); // closed | opening | open
  const aRef = useRef(null);

  const doOpen = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    try { if (aRef.current) { aRef.current.volume = 0.85; aRef.current.play(); } } catch (e) {}
    setTimeout(() => setPhase("open"), 1150);
  };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <audio ref={aRef} src={AUDIO.tagebuch} preload="auto" />
      {phase !== "open" ? (
        <div style={S.stage}>
          <div style={S.scene}>
            <button onClick={doOpen} aria-label="Tagebuch öffnen" style={S.coverBtn}>
              <div style={{ ...S.cover, animation: phase === "opening" ? "s2gSwing 1.15s cubic-bezier(.6,.02,.2,1) forwards" : "none" }}>
                <div style={S.spine} />
                <div style={S.emboss}>✦</div>
                <div style={S.title}>{title}</div>
                <div style={S.sub}>{subtitle}</div>
                {phase === "closed" && <div style={S.hint}>Tippe zum Öffnen</div>}
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div style={S.opened}>
          <div style={S.pageEdge} />
          <div style={S.pages}>{children}</div>
        </div>
      )}
      <style>{`
        @keyframes s2gSwing { from { transform: rotateY(0deg); } to { transform: rotateY(-152deg); opacity: .15; } }
        @keyframes s2gPagesIn { from { opacity: 0; transform: translateY(10px) scale(.99); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

const S = {
  stage: { perspective: 1500, padding: "18px 0 24px", display: "flex", justifyContent: "center" },
  scene: { transformStyle: "preserve-3d" },
  coverBtn: { border: "none", background: "transparent", cursor: "pointer", padding: 0 },
  cover: {
    width: 250, height: 340, borderRadius: "6px 14px 14px 6px",
    background: `linear-gradient(135deg, ${P.rose}, ${P.gold})`,
    transformOrigin: "left center",
    boxShadow: "0 18px 44px rgba(150,110,60,.32)", position: "relative",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    color: "#fff", overflow: "hidden",
  },
  spine: { position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: "rgba(90,60,30,.35)" },
  emboss: { fontSize: 34, color: "rgba(255,255,255,.9)", marginBottom: 10 },
  title: { fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 500 },
  sub: { fontSize: 13, opacity: 0.9, marginTop: 6, padding: "0 24px", textAlign: "center" },
  hint: { position: "absolute", bottom: 16, fontSize: 12, letterSpacing: 1, opacity: 0.85 },
  opened: { position: "relative", animation: "s2gPagesIn .6s ease both", background: P.bg, borderRadius: 16, padding: "6px 2px" },
  pageEdge: { position: "absolute", left: 0, top: 8, bottom: 8, width: 6, borderRadius: 6, background: `linear-gradient(90deg, ${P.gold}, transparent)` },
  pages: { position: "relative" },
};
