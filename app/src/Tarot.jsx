import { useState } from "react";
import { TAROT_MEDIEN } from "./media";

/* Tarot — eigener Bereich mit Expertin. Die Expertin bringt ihr Video mit;
   sobald es da ist, in media.js unter TAROT_MEDIEN.expertin.video eintragen.
   Nachtblau und Gold wie die Orakel-Buehne. */

const NACHT = "radial-gradient(120% 70% at 50% 0%, #2E3375 0%, #1A1C45 55%, #0F1029 100%)";
const GOLD = "#D9B56A";
const CREME = "#F6EBCF";

/* Die 22 Großen Arkana — Stichwort und eine Frage zur Selbstreflexion. */
const GROSSE_ARKANA = [
  ["0", "Der Narr", "Neubeginn, Vertrauen", "Wohin würde ich gehen, wenn ich keine Angst hätte?"],
  ["I", "Der Magier", "Tatkraft, Können", "Welche meiner Fähigkeiten nutze ich zu wenig?"],
  ["II", "Die Hohepriesterin", "Intuition, Stille", "Was weiß ich schon, ohne es aussprechen zu können?"],
  ["III", "Die Herrscherin", "Fülle, Fürsorge", "Wie kann ich mich heute selbst nähren?"],
  ["IV", "Der Herrscher", "Struktur, Halt", "Welche Ordnung würde mir gerade guttun?"],
  ["V", "Der Hierophant", "Werte, Tradition", "Welche Regel lebe ich, die gar nicht meine ist?"],
  ["VI", "Die Liebenden", "Wahl, Verbindung", "Welche Entscheidung kommt wirklich aus meinem Herzen?"],
  ["VII", "Der Wagen", "Wille, Richtung", "Wohin will ich mit voller Kraft?"],
  ["VIII", "Die Kraft", "Sanfte Stärke, Mut", "Wo darf ich weich und trotzdem stark sein?"],
  ["IX", "Der Eremit", "Rückzug, innere Suche", "Wann habe ich zuletzt nur mir selbst zugehört?"],
  ["X", "Das Rad des Schicksals", "Wandel, Zyklen", "Welcher Kreislauf in meinem Leben wiederholt sich?"],
  ["XI", "Die Gerechtigkeit", "Klarheit, Ausgleich", "Wo bin ich mir selbst gegenüber nicht fair?"],
  ["XII", "Der Gehängte", "Perspektivwechsel, Hingabe", "Was sehe ich, wenn ich die Sache einmal umdrehe?"],
  ["XIII", "Der Tod", "Ende und Übergang", "Was darf zu Ende gehen, damit Neues Platz hat?"],
  ["XIV", "Die Mäßigkeit", "Balance, Geduld", "Wo brauche ich gerade mehr Maß und weniger Eile?"],
  ["XV", "Der Teufel", "Bindung, Muster", "Was hält mich fest, obwohl ich gehen könnte?"],
  ["XVI", "Der Turm", "Umbruch, Erkenntnis", "Welche Gewissheit darf einstürzen?"],
  ["XVII", "Der Stern", "Hoffnung, Zuversicht", "Woran glaube ich, auch wenn es still ist?"],
  ["XVIII", "Der Mond", "Unbewusstes, Ahnungen", "Welche Angst ist vielleicht nur ein Schatten?"],
  ["XIX", "Die Sonne", "Freude, Lebenskraft", "Was bringt mich heute zum Strahlen?"],
  ["XX", "Das Gericht", "Erwachen, Ruf", "Welcher innere Ruf wird gerade lauter?"],
  ["XXI", "Die Welt", "Vollendung, Ganzheit", "Was habe ich geschafft, das ich feiern darf?"],
];
const LEGESYSTEME = [
  { t: "Eine Karte", s: "Für den Tag", text: "Zieh am Morgen eine Karte und frag: Worauf darf ich heute achten? Am Abend schaust du, wo sie dir begegnet ist." },
  { t: "Drei Karten", s: "Vergangenheit · Gegenwart · Zukunft", text: "Drei Karten nebeneinander zeigen, woher ein Thema kommt, wo es steht und wohin es sich bewegen will. Die Zukunft ist eine Möglichkeit, kein Urteil." },
  { t: "Das Keltische Kreuz", s: "Zehn Karten für große Fragen", text: "Das bekannteste Legesystem für tiefe Themen. Es braucht Zeit und Erfahrung. Am besten legst du es zum ersten Mal mit Ivonne zusammen." },
];

/* Kleines Schild für alles, was Ivonne noch liefert. */
function Platzhalter({ children }) {
  return (
    <div style={{ border: `1.5px dashed ${GOLD}`, borderRadius: 16, padding: "14px 16px", background: "rgba(217,181,106,.08)" }}>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, letterSpacing: 1.8, textTransform: "uppercase", color: GOLD, fontWeight: 700, marginBottom: 6 }}>Platzhalter · folgt von Ivonne</div>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, lineHeight: 1.55, opacity: .8 }}>{children}</div>
    </div>
  );
}

const ueber = { fontFamily: "system-ui, sans-serif", fontSize: 12.5, letterSpacing: 2.2, textTransform: "uppercase", color: GOLD, margin: "30px 0 12px" };

export default function Tarot({ go }) {
  const ex = TAROT_MEDIEN.expertin;
  const [offen, setOffen] = useState(null);
  return (
    <div style={{ background: NACHT, minHeight: "100%", color: CREME, paddingBottom: 32 }}>
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <img src={TAROT_MEDIEN.titelbild} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,16,41,0) 30%, #1A1C45 100%)" }} />
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 18 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, letterSpacing: 2.4, textTransform: "uppercase", color: GOLD }}>Tarot</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 32, lineHeight: 1.15, margin: "6px 0 0" }}>Die Karten als Spiegel</h1>
        </div>
      </div>

      <div style={{ padding: "8px 22px 0" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1.6, margin: "0 0 8px", opacity: .92 }}>
          Tarot sagt nicht voraus, was passiert. Es stellt dir Fragen, die du dir selbst noch nicht gestellt hast.
        </p>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, lineHeight: 1.5, opacity: .6, margin: "0 0 26px" }}>
          Zur Inspiration und Selbstreflexion — keine Beratung, Diagnose oder Vorhersage.
        </p>

        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, letterSpacing: 2.2, textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>Deine Expertin</div>
        <div style={{ borderRadius: 22, overflow: "hidden", border: `1.5px solid ${GOLD}`, background: "rgba(18,19,49,.75)", boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>
          {ex.video ? (
            <video src={ex.video} poster={ex.foto || TAROT_MEDIEN.titelbild} controls playsInline preload="metadata" style={{ width: "100%", display: "block", aspectRatio: "9 / 16", maxHeight: 560, objectFit: "cover", background: "#0F1029" }} />
          ) : (
            <div style={{ aspectRatio: "16 / 10", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(255,255,255,.04)" }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.3" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4z" fill={GOLD} /></svg>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, opacity: .75 }}>Ivonnes Video folgt in Kürze</span>
            </div>
          )}
          <div style={{ padding: "16px 18px 18px", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: `1.5px solid ${GOLD}`, overflow: "hidden", flexShrink: 0, background: "#23265A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 22 }}>
              {ex.foto ? <img src={ex.foto} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ex.name.slice(0, 1)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 21 }}>{ex.name}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: GOLD, letterSpacing: .4, marginTop: 2 }}>{ex.rolle}</div>
            </div>
          </div>
          {ex.text && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15.5, lineHeight: 1.6, opacity: .85, margin: 0, padding: "0 18px 18px" }}>{ex.text}</p>}
          {!ex.text && (
            <div style={{ padding: "0 18px 18px" }}>
              <Platzhalter>Hier stellt sich Ivonne mit ein paar persönlichen Sätzen vor: wie sie zum Tarot kam und wie sie mit den Karten arbeitet.</Platzhalter>
            </div>
          )}
          {ex.link && (
            <div style={{ padding: "0 18px 18px" }}>
              <a href={ex.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 48, borderRadius: 24, background: GOLD, color: "#121331", fontFamily: "system-ui, sans-serif", fontSize: 16.5, fontWeight: 600, textDecoration: "none" }}>Mehr von {ex.name}</a>
            </div>
          )}
        </div>

        <div style={ueber}>Was dich bei Ivonne erwartet</div>
        {ex.angebot ? (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15.5, lineHeight: 1.6, opacity: .9, margin: 0 }}>{ex.angebot}</p>
        ) : (
          <Platzhalter>Ivonnes Angebot: Einzel-Legungen, Dauer, Ablauf und Preis. Sobald sie ihren Text schickt, steht er hier.</Platzhalter>
        )}
        {ex.termin ? (
          <a href={ex.termin} target="_blank" rel="noopener noreferrer" style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", height: 50, borderRadius: 25, background: GOLD, color: "#121331", fontFamily: "system-ui, sans-serif", fontSize: 16.5, fontWeight: 600, textDecoration: "none" }}>Legung bei Ivonne anfragen</a>
        ) : (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", height: 50, borderRadius: 25, border: `1px dashed ${GOLD}`, color: GOLD, fontFamily: "system-ui, sans-serif", fontSize: 15.5, opacity: .8 }}>Terminbuchung folgt</div>
        )}

        <div style={ueber}>So liest du die Karten</div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15.5, lineHeight: 1.6, opacity: .88, margin: "0 0 14px" }}>
          Stell eine offene Frage, keine Ja-oder-Nein-Frage. Statt „Wird es klappen?“ lieber „Was hilft mir dabei?“. Schau zuerst auf das Bild: Was fällt dir auf, welches Gefühl kommt? Erst dann liest du die Bedeutung.
        </p>
        {LEGESYSTEME.map((l) => (
          <div key={l.t} style={{ borderRadius: 16, border: "1px solid rgba(217,181,106,.35)", background: "rgba(18,19,49,.55)", padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19 }}>{l.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: GOLD, margin: "2px 0 6px" }}>{l.s}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, lineHeight: 1.55, opacity: .85 }}>{l.text}</div>
          </div>
        ))}

        <div style={ueber}>Die 22 Großen Arkana</div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14.5, lineHeight: 1.55, opacity: .7, margin: "0 0 10px" }}>Tipp auf eine Karte für ihre Frage an dich.</p>
        {GROSSE_ARKANA.map(([nr, name, kern, frage]) => (
          <div key={nr} onClick={() => setOffen(offen === nr ? null : nr)} style={{ cursor: "pointer", padding: "12px 4px", borderBottom: "1px solid rgba(217,181,106,.2)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: GOLD, minWidth: 34 }}>{nr}</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 18, flex: 1 }}>{name}</span>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, opacity: .65, textAlign: "right" }}>{kern}</span>
            </div>
            {offen === nr && (
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 16.5, lineHeight: 1.55, color: GOLD, margin: "8px 0 2px 46px" }}>„{frage}“</div>
            )}
          </div>
        ))}

        <button onClick={() => go("orakel")} style={{ marginTop: 22, width: "100%", minHeight: 52, borderRadius: 26, border: `1px solid ${GOLD}`, background: "transparent", color: CREME, fontFamily: "system-ui, sans-serif", fontSize: 16.5, cursor: "pointer" }}>
          Deine Tageskarte ziehen
        </button>
      </div>
    </div>
  );
}
