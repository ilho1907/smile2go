// MediaScreens.jsx — smile2go
// Meditation, Podcast, WelcomeIntro, LichtpunkteReward.
// Cinematic Higgsfield-Videos; Ton kommt aus dem Video (kein TTS).
import { useRef, useState, useEffect } from "react";
import { VIDEO, IMG, PALETTE as P } from "./media";
import { addEnergy } from "./lib/energy";

function CinemaScreen({ video, poster, kicker, title, subtitle, cta, onDone }) {
  const vRef = useRef(null);
  const [on, setOn] = useState(false);
  const started = useRef(false);
  const toggle = () => {
    const v = vRef.current; if (!v) return;
    if (v.muted || v.paused) { v.muted = false; v.play(); setOn(true); if (!started.current) { started.current = true; onDone && onDone(); } }
    else { v.muted = true; setOn(false); }
  };
  return (
    <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", maxWidth: 440, margin: "0 auto", background: P.bg, boxShadow: "0 12px 34px rgba(150,110,60,.2)" }}>
      <video ref={vRef} src={video} poster={poster} autoPlay muted loop playsInline
        style={{ width: "100%", height: 480, objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(40,26,16,.15),rgba(40,26,16,.55))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 24, textAlign: "center" }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: "#f0dca8", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>{kicker}</p>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 27, color: "#fff", margin: "6px 0 4px", textShadow: "0 1px 10px rgba(0,0,0,.35)" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 14, color: "rgba(255,255,255,.85)", margin: "0 0 16px" }}>{subtitle}</p>}
        <button onClick={toggle}
          style={{ border: "none", cursor: "pointer", background: `linear-gradient(90deg,${P.gold},${P.rose})`,
                   color: "#fff", fontSize: 15, fontWeight: 600, padding: "13px 28px", borderRadius: 26,
                   boxShadow: "0 8px 20px rgba(201,162,75,.35)" }}>
          {on ? "❚❚ Ton aus" : (cta || "▶ Mit Ton abspielen")}
        </button>
      </div>
    </div>
  );
}

export function Meditation({ addPunkte }) {
  return <CinemaScreen video={VIDEO.meditation} poster={IMG.meditation}
    kicker="Meditation" title="Ankommen bei dir" subtitle="Atme. Sei ganz hier."
    cta="▶ Mit Ton beginnen" onDone={() => (addPunkte ? addPunkte(5) : addEnergy(5, "meditation"))} />;
}
export function Podcast({ addPunkte }) {
  return <CinemaScreen video={VIDEO.podcast} poster={IMG.podcast}
    kicker="Podcast" title="Willkommen zurück" subtitle="smile2go · Folge des Tages"
    cta="▶ Mit Ton anhören" onDone={() => (addPunkte ? addPunkte(3) : addEnergy(3, "podcast"))} />;
}

export function WelcomeIntro({ onContinue }) {
  return (
    <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", maxWidth: 440, margin: "0 auto" }}>
      <video src={VIDEO.welcome} poster={IMG.welcome} autoPlay muted loop playsInline style={{ width: "100%", height: 520, objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(40,26,16,.1),rgba(246,239,228,.75))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 28, textAlign: "center" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 28, color: P.ink, margin: "0 0 6px" }}>Schön, dass du da bist.</p>
        <p style={{ fontSize: 15, color: "#6b573f", margin: "0 0 18px" }}>Dein Rückzugsort.</p>
        <button onClick={onContinue}
          style={{ border: "none", cursor: "pointer", background: `linear-gradient(90deg,${P.gold},${P.rose})`,
                   color: "#fff", fontSize: 15, fontWeight: 600, padding: "14px 30px", borderRadius: 26 }}>
          Beginnen
        </button>
      </div>
    </div>
  );
}

export function LichtpunkteReward({ points = 5, onClose }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let n = 0; const id = setInterval(() => { n += 1; setShown(n); if (n >= points) clearInterval(id); }, 150);
    addEnergy(points, "reward");
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ minHeight: 420, background: "rgba(246,239,228,.65)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 22 }}>
      <div style={{ position: "relative", width: 300, borderRadius: 20, overflow: "hidden", background: P.card, boxShadow: "0 14px 40px rgba(150,120,60,.22)" }}>
        <video src={VIDEO.lichtpunkte} poster={IMG.lichtpunkte} autoPlay muted loop playsInline style={{ width: "100%", height: 260, objectFit: "cover" }} />
        <div style={{ padding: 18, textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 22, color: P.ink, margin: "0 0 2px" }}>+{shown} Lichtpunkte</p>
          <p style={{ fontSize: 13, color: P.mut, margin: "0 0 14px" }}>Dein Licht wächst mit jedem Schritt.</p>
          <button onClick={onClose}
            style={{ border: "none", cursor: "pointer", background: P.gold, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 22px", borderRadius: 22 }}>
            Danke
          </button>
        </div>
      </div>
    </div>
  );
}
