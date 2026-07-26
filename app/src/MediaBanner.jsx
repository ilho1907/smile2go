// MediaBanner.jsx — smile2go
// Wiederverwendbarer cinematic Video-Banner (Higgsfield) für Tab-Köpfe.
import { PALETTE as P } from "./media";

export default function MediaBanner({ video, poster, title, subtitle, height = 240 }) {
  return (
    <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", margin: "0 0 14px", height, boxShadow: "0 12px 30px rgba(150,110,60,.2)" }}>
      <video src={video} poster={poster} autoPlay muted loop playsInline preload="auto"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(40,26,16,.12) 0%, rgba(40,26,16,0) 45%, rgba(246,239,228,.62) 100%)" }} />
      <div style={{ position: "absolute", left: 18, right: 18, bottom: 16, textAlign: "center" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 26, color: P.ink, margin: 0, textShadow: "0 1px 8px rgba(255,255,255,.5)" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 13, color: "#6b573f", margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}
