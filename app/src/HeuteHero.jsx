// HeuteHero.jsx — smile2go
// Der erste Blick am Tag.
//
// Zu den Massen: hier sind bewusst die Verhaeltnisse der grossen
// Coaching-Apps uebernommen, nicht die eines Kopfbildes auf einer Webseite.
//
//   Bild      etwa 45 Prozent der Schirmhoehe (max. 400px), randlos bis in die
//             Ecken, ohne abgerundete Kanten.
//   Titel     linksbuendig in der unteren Ecke, zweizeilig, enger Zeilenabstand.
//   Verlauf   unten wirklich dunkel — sonst traegt weisse Serifenschrift nicht.
//   Handlung  genau eine. Ein breiter Knopf unter dem Titel, sonst nichts.
//
// Die Begruessung steht NUR hier. Frueher kam sie eine Bildschirmhoehe tiefer
// ein zweites Mal; jetzt traegt das Bild sie allein, und das Portraet (der Weg
// ins Profil) sitzt oben rechts neben den Lichtpunkten.
//
// Der Atem-Orb ist entfernt: er stritt mit dem Knopf um die Aufmerksamkeit,
// und das Atemritual hat weiter unten seinen eigenen Platz.
import { useRef } from "react";
import { VIDEO, IMG, PALETTE as P } from "./media";
import { FARBEN } from "./themen";
import { Ikon } from "./Ikon";

export default function HeuteHero({ name = "", punkte = 0, avatar = null, onProfil = null }) {
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
        <span style={S.rechts}>
          <span style={{ ...S.lp, color: FARBEN.gold || P.gold }}><Ikon n="flamme" size={13} />{punkte} Lichtpunkte</span>
          {onProfil && (
            <button onClick={onProfil} aria-label="Mein Bereich" style={{ ...S.profil, color: FARBEN.gold || P.gold }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Ikon n="person" size={19} />}
            </button>
          )}
        </span>
      </div>

      <div style={S.unten}>
        <h1 style={S.titel}>
          {gruss}{name ? `, ${name.trim().split(/\s+/)[0]}` : ""}.
          <br />
          <span style={S.titelZwei}>Dein Ritual wartet.</span>
        </h1>
        <button onClick={beginnen} style={{ ...S.knopf, background: FARBEN.gold || P.gold, color: FARBEN.aufGold || "#FFF8FC" }}>Dein Ritual beginnen</button>
      </div>
    </div>
  );
}

const S = {
  // Randlos und hoch. dvh statt vh, damit die Adressleiste des Browsers die
  // Hoehe beim Scrollen nicht springen laesst.
  wrap: {
    position: "relative", overflow: "hidden",
    height: "min(46dvh, 400px)", minHeight: 330,
    margin: 0, borderRadius: 0,
  },
  video: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  schleier: {
    position: "absolute", inset: 0,
    background: "linear-gradient(180deg, rgba(32,14,28,.30) 0%, rgba(32,14,28,.02) 32%, rgba(32,14,28,.42) 64%, rgba(28,10,24,.86) 100%)",
  },

  oben: {
    position: "absolute", left: 20, right: 18, display: "flex",
    justifyContent: "space-between", alignItems: "center",
    top: "calc(14px + env(safe-area-inset-top, 0px))",
  },
  marke: { color: "#fff", fontFamily: "Georgia, serif", fontSize: 18, letterSpacing: .3, textShadow: "0 1px 9px rgba(0,0,0,.5)" },
  rechts: { display: "inline-flex", alignItems: "center", gap: 9 },
  lp: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "rgba(255,253,254,.93)", color: P.gold, fontFamily: "system-ui, sans-serif",
    fontSize: 13.5, fontWeight: 600, padding: "7px 13px", borderRadius: 20,
    boxShadow: "0 4px 14px -5px rgba(60,16,50,.45)",
  },
  // 44px: die kleinste Flaeche, die ein Daumen sicher trifft.
  profil: {
    width: 44, height: 44, padding: 0, borderRadius: "50%", overflow: "hidden", cursor: "pointer",
    border: "2px solid rgba(255,253,254,.92)", background: "rgba(255,253,254,.93)", color: P.gold,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 14px -5px rgba(60,16,50,.45)",
  },

  unten: { position: "absolute", bottom: 20, left: 20, right: 20 },
  titel: {
    fontFamily: "Georgia, serif", fontWeight: 300,
    fontSize: "clamp(31px, 8.6vw, 40px)", lineHeight: 1.06, letterSpacing: "-0.028em",
    color: "#FFFBFD", margin: 0, textShadow: "0 2px 18px rgba(0,0,0,.55)",
  },
  titelZwei: { color: "rgba(255,251,253,.78)" },
  knopf: {
    marginTop: 17, width: "100%", minHeight: 52, border: "none", borderRadius: 26,
    cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 600,
    color: "#FFF8FC", background: P.gold,
    boxShadow: "0 12px 26px -13px rgba(50,12,42,.9)",
  },
};
