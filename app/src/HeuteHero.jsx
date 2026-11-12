// HeuteHero.jsx — smile2go
// Der erste Blick am Tag.
//
// Zu den Massen: hier sind bewusst die Verhaeltnisse der grossen
// Coaching-Apps uebernommen, nicht die eines Kopfbildes auf einer Webseite.
// Der Unterschied liegt in vier Zahlen.
//
//   Bild      etwa 45 Prozent der Schirmhoehe (max. 400px), randlos bis in die Ecken,
//             ohne abgerundete Kanten — eine Webseite rahmt ihr Bild ein,
//             eine App laesst es den Schirm sein.
//   Titel     rund ein Zehntel der Bildhoehe, linksbuendig in der unteren
//             Ecke, zweizeilig, enger Zeilenabstand.
//   Verlauf   unten wirklich dunkel, nicht nur angedeutet — sonst traegt
//             weisse Serifenschrift nicht.
//   Handlung  genau eine. Ein breiter Knopf unter dem Titel, sonst nichts.
//
// Der Orb bleibt, aber er rueckt an den rechten Rand: in der Mitte verdeckt
// er das Gesicht im Bild und streitet mit dem Knopf um die Aufmerksamkeit.
import { useRef, useState } from "react";
import { VIDEO, IMG, PALETTE as P } from "./media";
import { Ikon } from "./Ikon";

export default function HeuteHero({ name = "", punkte = 0, onProfil }) {
  const [atmet, setAtmet] = useState(false);
  const rahmen = useRef(null);
  const stunde = new Date().getHours();
  const gruss = stunde < 11 ? "Guten Morgen" : stunde < 18 ? "Guten Tag" : "Guten Abend";

  // Der eine Knopf tut das, was er verspricht: er bringt sie in den Tag —
  // also an den Energie-Kompass direkt unter dem Bild.
  const beginnen = () => {
    const h = rahmen.current?.getBoundingClientRect().height || 420;
    window.scrollTo({ top: Math.max(0, h - 72), behavior: "smooth" });
  };

  return (
    <div ref={rahmen} style={S.wrap}>
      <video src={VIDEO.heute} poster={IMG.heute} autoPlay muted loop playsInline preload="auto" style={S.video} />
      <div style={S.schleier} />

      <div style={S.oben}>
        <span style={S.marke}>smile2go</span>
        <div style={S.rechts}>
          <span style={S.lp}>🔥 {punkte} Lichtpunkte</span>
          {onProfil && (
            <button onClick={onProfil} aria-label="Mein Bereich" style={S.profil}>
              <Ikon n="person" size={19} />
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => setAtmet((a) => !a)}
        aria-label="Atme mit"
        aria-pressed={atmet}
        className="s2g-orb"
        style={{ ...S.orb, animation: atmet ? "s2gBreathe 7s ease-in-out infinite" : "s2gFloat 5s ease-in-out infinite" }}
      >
        {atmet ? "atme…" : "atme mit"}
      </button>

      <div style={S.unten}>
        <h1 style={S.titel}>
          {gruss}{name ? `, ${name.trim().split(/\s+/)[0]}` : ""}.
          <br />
          <span style={S.titelZwei}>Dein Ritual wartet.</span>
        </h1>
        <button onClick={beginnen} style={S.knopf}>Dein Ritual beginnen</button>
      </div>

      <style>{`
        @keyframes s2gBreathe { 0%,100%{ transform:scale(.82); } 50%{ transform:scale(1.1); } }
        @keyframes s2gFloat { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-6px);} }
        @media (prefers-reduced-motion: reduce) { .s2g-orb { animation: none !important; } }
      `}</style>
    </div>
  );
}

const S = {
  // Randlos und hoch. dvh statt vh, damit die Adressleiste des Browsers die
  // Hoehe beim Scrollen nicht springen laesst.
  wrap: {
    position: "relative", overflow: "hidden",
    height: "min(46dvh, 400px)", minHeight: 330,
    margin: "0 0 18px", borderRadius: 0,
  },
  video: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  schleier: {
    position: "absolute", inset: 0,
    background: "linear-gradient(180deg, rgba(30,19,10,.36) 0%, rgba(30,19,10,.05) 30%, rgba(30,19,10,.42) 62%, rgba(24,15,7,.86) 100%)",
  },

  oben: {
    position: "absolute", left: 20, right: 20, display: "flex",
    justifyContent: "space-between", alignItems: "center",
    top: "calc(16px + env(safe-area-inset-top, 0px))",
  },
  marke: { color: "#fff", fontFamily: "Georgia, serif", fontSize: 17, letterSpacing: .8, textShadow: "0 1px 8px rgba(0,0,0,.45)" },
  lp: {
    background: "rgba(255,253,249,.92)", color: P.gold, fontFamily: "system-ui, sans-serif",
    fontSize: 12, fontWeight: 600, padding: "6px 13px", borderRadius: 20,
    boxShadow: "0 4px 14px -4px rgba(0,0,0,.35)",
  },
  // "Mein Bereich" ganz oben rechts — dort, wo man das eigene Profil sucht.
  rechts: { display: "flex", alignItems: "center", gap: 10 },
  profil: {
    width: 40, height: 40, flexShrink: 0, borderRadius: "50%", cursor: "pointer",
    border: "1.5px solid rgba(255,253,249,.95)", background: "rgba(255,253,249,.92)",
    color: P.gold, display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 14px -4px rgba(0,0,0,.35)", padding: 0,
  },

  orb: {
    position: "absolute", right: 20, top: "24%", width: 62, height: 62,
    borderRadius: "50%", border: "none", cursor: "pointer",
    background: "radial-gradient(circle at 38% 32%, #f7dd96, #d2a349)",
    color: "#4a3410", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600,
    boxShadow: "0 0 32px rgba(217,169,78,.72), 0 10px 26px -10px rgba(0,0,0,.5)",
  },

  unten: { position: "absolute", bottom: 20, left: 20, right: 20 },
  titel: {
    fontFamily: "Georgia, serif", fontWeight: 400,
    fontSize: "clamp(26px, 7.2vw, 34px)", lineHeight: 1.08, letterSpacing: "-0.025em",
    color: "#FFFBF4", margin: 0, textShadow: "0 2px 20px rgba(0,0,0,.55)",
  },
  titelZwei: { color: "rgba(255,251,244,.82)" },
  knopf: {
    marginTop: 14, width: "100%", minHeight: 50, border: "none", borderRadius: 25,
    cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: 15.5, fontWeight: 600,
    color: "#3A2A18", background: "linear-gradient(135deg, #F3D28B, #D2A349)",
    boxShadow: "0 14px 30px -12px rgba(0,0,0,.65)",
  },
};
