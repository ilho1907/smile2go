// HeuteHero.jsx — smile2go
// Cinematic Hero für den Heute-Screen: Higgsfield-Video als Hintergrund,
// warmes Gold-Overlay, atmender Orb, Begrüßung + Lichtpunkte. Wie im Konzept.
import { useState } from "react";
import { VIDEO, IMG, PALETTE as P } from "./media";

export default function HeuteHero({ name = "", punkte = 0 }) {
  const [breathing, setBreathing] = useState(false);
  const hour = new Date().getHours();
  const gruss = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

  const breathe = () => setBreathing((b) => !b);

  return (
    <div style={S.wrap}>
      <video src={VIDEO.heute} poster={IMG.heute} autoPlay muted loop playsInline preload="auto" style={S.video} />
      <div style={S.overlay} />
      <div style={S.top}>
        <span style={S.brand}>smile2go</span>
        <span style={S.lp}>🔥 {punkte} Lichtpunkte</span>
      </div>
      <div style={S.center}>
        <button onClick={breathe} aria-label="Atme mit" style={{ ...S.orb, animation: breathing ? "s2gBreathe 7s ease-in-out infinite" : "s2gFloat 5s ease-in-out infinite" }}>
          {breathing ? "atme…" : "atme mit"}
        </button>
      </div>
      <div style={S.bottom}>
        <p style={S.gruss}>{gruss}{name ? `, ${name}` : ""}</p>
        <p style={S.sub}>Dein Ritual des Tages wartet auf dich.</p>
      </div>
      <style>{`
        @keyframes s2gBreathe { 0%,100%{ transform:scale(.82); } 50%{ transform:scale(1.1); } }
        @keyframes s2gFloat { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-6px);} }
      `}</style>
    </div>
  );
}

const S = {
  wrap: { position: "relative", borderRadius: 22, overflow: "hidden", height: 300, margin: "0 0 14px", boxShadow: "0 12px 34px rgba(150,110,60,.22)" },
  video: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  overlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(40,26,16,.12) 0%, rgba(40,26,16,0) 45%, rgba(246,239,228,.62) 100%)" },
  top: { position: "absolute", top: 14, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" },
  brand: { color: "#fff", fontFamily: "Georgia, serif", fontSize: 16, letterSpacing: 1, textShadow: "0 1px 6px rgba(0,0,0,.3)" },
  lp: { background: "rgba(255,255,255,.9)", color: P.gold, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20 },
  center: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 120 },
  orb: { width: 88, height: 88, borderRadius: "50%", border: "none", cursor: "pointer",
    background: "radial-gradient(circle at 40% 35%, #f4d68a, #d9a94e)", color: "#4a3410", fontSize: 13, fontWeight: 600,
    boxShadow: "0 0 40px rgba(217,169,78,.7)" },
  bottom: { position: "absolute", bottom: 16, left: 18, right: 18, textAlign: "center" },
  gruss: { fontFamily: "Georgia, serif", fontSize: 26, color: P.ink, margin: 0, textShadow: "0 1px 8px rgba(255,255,255,.5)" },
  sub: { fontSize: 13, color: "#6b573f", margin: "2px 0 0" },
};
