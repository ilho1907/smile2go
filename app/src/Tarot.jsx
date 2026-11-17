import { TAROT_MEDIEN } from "./media";

/* Tarot — eigener Bereich mit Expertin. Die Expertin bringt ihr Video mit;
   sobald es da ist, in media.js unter TAROT_MEDIEN.expertin.video eintragen.
   Nachtblau und Gold wie die Orakel-Buehne. */

const NACHT = "radial-gradient(120% 70% at 50% 0%, #2E3375 0%, #1A1C45 55%, #0F1029 100%)";
const GOLD = "#D9B56A";
const CREME = "#F6EBCF";

export default function Tarot({ go }) {
  const ex = TAROT_MEDIEN.expertin;
  return (
    <div style={{ background: NACHT, minHeight: "100%", color: CREME, paddingBottom: 32 }}>
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <img src={TAROT_MEDIEN.titelbild} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,16,41,0) 30%, #1A1C45 100%)" }} />
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 18 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: 2.4, textTransform: "uppercase", color: GOLD }}>Tarot</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 32, lineHeight: 1.15, margin: "6px 0 0" }}>Die Karten als Spiegel</h1>
        </div>
      </div>

      <div style={{ padding: "8px 22px 0" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.6, margin: "0 0 8px", opacity: .92 }}>
          Tarot sagt nicht voraus, was passiert. Es stellt dir Fragen, die du dir selbst noch nicht gestellt hast.
        </p>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, lineHeight: 1.5, opacity: .6, margin: "0 0 26px" }}>
          Zur Inspiration und Selbstreflexion — keine Beratung, Diagnose oder Vorhersage.
        </p>

        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>Deine Expertin</div>
        <div style={{ borderRadius: 22, overflow: "hidden", border: `1.5px solid ${GOLD}`, background: "rgba(18,19,49,.75)", boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>
          {ex.video ? (
            <video src={ex.video} poster={ex.foto || TAROT_MEDIEN.titelbild} controls playsInline preload="metadata" style={{ width: "100%", display: "block", aspectRatio: "9 / 16", maxHeight: 560, objectFit: "cover", background: "#0F1029" }} />
          ) : (
            <div style={{ aspectRatio: "16 / 10", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(255,255,255,.04)" }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.3" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4z" fill={GOLD} /></svg>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, opacity: .75 }}>Ivonnes Video folgt in Kürze</span>
            </div>
          )}
          <div style={{ padding: "16px 18px 18px", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: `1.5px solid ${GOLD}`, overflow: "hidden", flexShrink: 0, background: "#23265A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 22 }}>
              {ex.foto ? <img src={ex.foto} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ex.name.slice(0, 1)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 21 }}>{ex.name}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: GOLD, letterSpacing: .4, marginTop: 2 }}>{ex.rolle}</div>
            </div>
          </div>
          {ex.text && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, lineHeight: 1.6, opacity: .85, margin: 0, padding: "0 18px 18px" }}>{ex.text}</p>}
          {ex.link && (
            <div style={{ padding: "0 18px 18px" }}>
              <a href={ex.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 48, borderRadius: 24, background: GOLD, color: "#121331", fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>Mehr von {ex.name}</a>
            </div>
          )}
        </div>

        <button onClick={() => go("orakel")} style={{ marginTop: 22, width: "100%", minHeight: 52, borderRadius: 26, border: `1px solid ${GOLD}`, background: "transparent", color: CREME, fontFamily: "system-ui, sans-serif", fontSize: 15, cursor: "pointer" }}>
          Deine Tageskarte ziehen
        </button>
      </div>
    </div>
  );
}
