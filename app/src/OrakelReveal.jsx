// OrakelReveal.jsx — smile2go
// Drop-in cinematic "Tageskarte" oracle reveal for the light, feminine app palette.
// Hollywood-style reveal: golden light rays + drifting gold particles + card flip.
// No external deps beyond React. Plug your own card image via the `card` prop.
//
// Usage:
//   import OrakelReveal from "./OrakelReveal";
//   <OrakelReveal
//     card={{
//       image: "/karten/saraswati.png",
//       name: "Saraswati",
//       subtitle: "Göttin der Erkenntnis · Klarheit",
//       message: "Weisheit fließt wie Wasser zu dir. Hör auf die leise Stimme deiner Erkenntnis.",
//     }}
//     onMeaning={() => {/* open AI 'Was bedeutet sie für mich?' */}}
//   />

import { useEffect, useRef, useState } from "react";

const PALETTE = {
  bg: "#F6EFE4",       // warm cream page
  card: "#FFFDF9",     // card surface
  gold: "#C9A24B",     // gold accent
  goldSoft: "#E3C77E",
  rose: "#D89AA6",     // dusty rose
  ink: "#4A3B2C",      // warm brown text
  mut: "#A2917B",      // muted brown
};

export default function OrakelReveal({ card, onMeaning }) {
  const cvRef = useRef(null);
  const wrapRef = useRef(null);
  const [drawn, setDrawn] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const anim = useRef({ glow: 0, rays: 0, parts: [], raf: 0, running: false });

  const c = card || {
    image: "/media/img/orakel.png",
    name: "Saraswati",
    subtitle: "Göttin der Erkenntnis · Klarheit",
    message:
      "Weisheit fließt wie Wasser zu dir. Hör auf die leise Stimme deiner Erkenntnis.",
  };

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;

    const size = () => {
      const r = wrapRef.current.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    const A = anim.current;
    A.running = true;

    const loop = () => {
      if (!A.running) return;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.42;

      // Golden light rays (behind card)
      if (A.glow > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(A.rays);
        for (let i = 0; i < 18; i++) {
          ctx.rotate(Math.PI / 9);
          const g = ctx.createLinearGradient(0, 0, 0, -H);
          g.addColorStop(0, `rgba(201,162,75,${0.12 * A.glow})`);
          g.addColorStop(1, "rgba(201,162,75,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(-16, 0); ctx.lineTo(16, 0);
          ctx.lineTo(5, -H); ctx.lineTo(-5, -H);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        A.rays += 0.004;

        const rg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 220);
        rg.addColorStop(0, `rgba(227,199,126,${0.28 * A.glow})`);
        rg.addColorStop(1, "rgba(227,199,126,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
      }

      // Drifting gold + rose particles
      for (let j = A.parts.length - 1; j >= 0; j--) {
        const p = A.parts[j];
        p.x += p.vx; p.y += p.vy; p.vy += 0.015; p.life -= 0.01;
        if (p.life <= 0) { A.parts.splice(j, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life) * 0.9;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      A.raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      A.running = false;
      cancelAnimationFrame(A.raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  const burst = (n) => {
    const A = anim.current;
    const r = wrapRef.current.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height * 0.42;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3;
      A.parts.push({
        x: cx, y: cy + 30,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
        r: 1 + Math.random() * 2.2, life: 1,
        c: Math.random() < 0.5 ? "#C9A24B" : "#D89AA6",
      });
    }
  };

  const rampGlow = (target) => {
    const A = anim.current;
    const step = () => {
      if (A.glow < target) { A.glow = Math.min(target, A.glow + 0.08); requestAnimationFrame(step); }
    };
    step();
  };
  const fadeGlow = () => {
    const A = anim.current;
    const step = () => {
      if (A.glow > 0) { A.glow = Math.max(0, A.glow - 0.02); requestAnimationFrame(step); }
    };
    step();
  };

  const draw = () => {
    setDrawn(true);
    setFlipped(false);
    rampGlow(1);
    burst(70);
    setTimeout(() => burst(50), 250);
    setTimeout(() => { setFlipped(true); burst(60); }, 850);
    setTimeout(fadeGlow, 2600);
  };

  const reset = () => {
    setFlipped(false);
    setTimeout(() => draw(), 300);
  };

  return (
    <div ref={wrapRef} style={S.stage}>
      <canvas ref={cvRef} style={S.canvas} />

      <p style={S.kicker}>Deine Karte für heute</p>
      <p style={S.disclaimer}>
        Zur Inspiration &amp; Unterhaltung — keine Beratung, Diagnose oder Vorhersage.
      </p>

      <div style={S.cardArea}>
        <div style={{ ...S.card, transform: `${drawn ? "translateY(0)" : "translateY(18px)"} ${flipped ? "rotateY(180deg)" : "rotateY(0)"}`, opacity: drawn ? 1 : 0.96 }}>
          {/* Back (face down) */}
          <div style={{ ...S.face, ...S.back }}>
            <div style={S.backGlyph}>✷</div>
            <span style={S.backWord}>smile2go</span>
          </div>
          {/* Front (revealed) */}
          <div style={{ ...S.face, ...S.front }}>
            {c.image
              ? <img src={c.image} alt={c.name} style={S.img} />
              : <div style={{ ...S.img, ...S.imgPlaceholder }}>✦</div>}
            <div style={S.frontName}>{c.name}</div>
            <div style={S.frontSub}>{c.subtitle}</div>
            <div style={S.frontMsg}>{c.message}</div>
          </div>
        </div>
      </div>

      {!drawn ? (
        <button style={S.drawBtn} onClick={draw}>✨ Tageskarte ziehen</button>
      ) : (
        <>
          <button style={S.meaningBtn} onClick={onMeaning}>✨ Was bedeutet sie für mich?</button>
          <button style={S.againBtn} onClick={reset}>Nochmal ziehen</button>
          <p style={S.footNote}>✨ Deine Karte für heute ist gezogen. Morgen wartet eine neue.</p>
        </>
      )}
    </div>
  );
}

const S = {
  stage: {
    position: "relative", background: "#F6EFE4", borderRadius: 24,
    padding: "26px 20px 22px", overflow: "hidden", textAlign: "center",
    fontFamily: "system-ui, -apple-system, sans-serif", color: "#4A3B2C",
    maxWidth: 420, margin: "0 auto",
  },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" },
  kicker: { position: "relative", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 26, fontWeight: 500, margin: "4px 0 8px" },
  disclaimer: { position: "relative", fontSize: 12.5, color: "#A2917B", lineHeight: 1.5, margin: "0 0 18px", padding: "0 14px" },
  cardArea: { position: "relative", perspective: 1200, display: "flex", justifyContent: "center", margin: "0 0 18px" },
  card: {
    position: "relative", width: 240, minHeight: 360, transformStyle: "preserve-3d",
    transition: "transform 1.05s cubic-bezier(.16,.9,.3,1), opacity .5s",
  },
  face: {
    position: "absolute", inset: 0, backfaceVisibility: "hidden",
    background: "#FFFDF9", border: "1.5px solid #C9A24B", borderRadius: 18,
    display: "flex", flexDirection: "column", alignItems: "center",
    boxShadow: "0 10px 30px rgba(150,120,60,.14)", overflow: "hidden",
  },
  back: {
    justifyContent: "center", gap: 14,
    background: "linear-gradient(160deg,#FBF4E6,#F3E7CE)",
  },
  backGlyph: { fontSize: 40, color: "#C9A24B" },
  backWord: { fontSize: 12, letterSpacing: 2, color: "#B79A5E" },
  front: { transform: "rotateY(180deg)", padding: 14 },
  img: { width: "100%", height: 210, objectFit: "cover", borderRadius: 12 },
  imgPlaceholder: { display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, color: "#C9A24B", background: "#F3E7CE" },
  frontName: { fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 500, margin: "14px 0 6px" },
  frontSub: { fontSize: 12, letterSpacing: 1.5, color: "#C9A24B", textTransform: "uppercase", fontWeight: 600, lineHeight: 1.5 },
  frontMsg: { fontSize: 15, color: "#5C4B39", lineHeight: 1.55, margin: "12px 6px 6px" },
  drawBtn: {
    position: "relative", border: "none", cursor: "pointer",
    background: "linear-gradient(90deg,#C9A24B,#D89AA6)", color: "#fff",
    fontSize: 15, fontWeight: 600, padding: "14px 28px", borderRadius: 26,
    boxShadow: "0 8px 20px rgba(201,162,75,.3)",
  },
  meaningBtn: {
    position: "relative", border: "none", cursor: "pointer", width: "88%",
    background: "linear-gradient(90deg,#C9A24B,#D89AA6)", color: "#fff",
    fontSize: 15, fontWeight: 600, padding: "14px 22px", borderRadius: 26,
    boxShadow: "0 8px 20px rgba(201,162,75,.3)",
  },
  againBtn: {
    position: "relative", display: "block", margin: "12px auto 0", cursor: "pointer",
    background: "transparent", border: "1px solid #D9C6A0", color: "#8C7658",
    fontSize: 13, padding: "9px 18px", borderRadius: 22,
  },
  footNote: { position: "relative", fontSize: 12.5, color: "#A2917B", marginTop: 14 },
};
