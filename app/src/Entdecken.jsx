import { useEffect, useRef, useState } from "react";
import { ENTDECKEN_BILDER } from "./media";

/* Entdecken — drei Karten nebeneinander, die mittlere gross, links und rechts
   schauen die Nachbarn hervor. Wischen wechselt, Antippen oeffnet den Bereich.
   Vorbild: Dribbble „Track your Meditation" — Aufbau uebernommen, Farben und
   Sprache sind smile2go. */

const KARTEN = [
  { key: "meditation", art: "Meditation", titel: "Komm zur Ruhe", unter: "Atem & geführte Meditation", dauer: "10 Min", bild: "meditation" },
  { key: "achtsamkeit", art: "Meditation", titel: "Achtsamkeits-Reise", unter: "Fünf Sinne, sechs Stationen", dauer: "12 Min", bild: "achtsamkeit" },
  { key: "r-kerze", art: "Rituale", titel: "Kerze & Räuchern", unter: "Ein Zeichen an dich selbst", dauer: "5 Min", bild: "kerze", journal: true },
  { key: "r-natur", art: "Rituale", titel: "Zeit in der Natur", unter: "Zwanzig Minuten ohne Ziel", dauer: "20 Min", bild: "natur", journal: true },
  { key: "r-wasser", art: "Rituale", titel: "Körper & Wasser", unter: "Deinem Körper antworten", dauer: "5 Min", bild: "wasser", journal: true },
  { key: "mondrituale", art: "Rituale", titel: "Mondritual", unter: "Für Neumond und Vollmond", dauer: "15 Min", bild: "mond" },
  { key: "qigong", art: "Bewegung", titel: "Qigong am Morgen", unter: "Sanft in den Körper kommen", dauer: "8 Min", bild: "qigong" },
  { key: "media", art: "Klang", titel: "Klangräume", unter: "Musik zum Loslassen", dauer: "20 Min", bild: "klang" },
  { key: "loslassen", art: "Rituale", titel: "Loslassen", unter: "Was darf heute gehen?", dauer: "7 Min", bild: "loslassen" },
];

const FILTER = ["Alle", "Meditation", "Rituale", "Bewegung", "Klang"];

const MAGENTA = "#C2418F";
const PFLAUME = "#2A1730";

export default function Entdecken({ go, setJournalSec }) {
  // Die Wochen-Rituale wohnen im Tagebuch unter „Rituale".
  const oeffnen = (k) => {
    if (k.journal) { go("tagebuch"); setJournalSec?.("rituale"); return; }
    go(k.key);
  };
  return <Karussell titel="Entdecken" karten={KARTEN.map((k) => ({ ...k, bild: ENTDECKEN_BILDER[k.bild] }))} filter={FILTER} onOeffnen={oeffnen} />;
}

/* Wiederverwendbar: auch die Themen unter „Mehr" laufen darueber.
   karten: [{ key, titel, unter, art?, dauer?, bild }] · filter: optional */
export function Karussell({ titel, unter, karten, filter: FILTER, onOeffnen, stil }) {
  const KARTEN = karten;
  const [filter, setFilter] = useState("Alle");
  const [aktiv, setAktiv] = useState(0);
  const leiste = useRef(null);

  const liste = !FILTER || filter === "Alle" ? KARTEN : KARTEN.filter((k) => k.art === filter);

  // Beim Filterwechsel zurueck an den Anfang.
  useEffect(() => {
    setAktiv(0);
    if (leiste.current) leiste.current.scrollTo({ left: 0 });
  }, [filter]);

  const beimWischen = () => {
    const el = leiste.current;
    if (!el) return;
    const mitte = el.scrollLeft + el.clientWidth / 2;
    let beste = 0, abstand = Infinity;
    Array.from(el.children).forEach((kind, i) => {
      const d = Math.abs(kind.offsetLeft + kind.offsetWidth / 2 - mitte);
      if (d < abstand) { abstand = d; beste = i; }
    });
    if (beste !== aktiv) setAktiv(beste);
  };

  return (
    <div style={{ margin: "0 -20px 32px", ...stil }}>
      {titel && <div style={{ padding: "0 20px", marginBottom: unter ? 4 : 12, fontFamily: "Georgia, serif", fontSize: 23, letterSpacing: "-0.018em", color: "#2E2430" }}>{titel}</div>}
      {unter && <div style={{ padding: "0 20px", marginBottom: 12, fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#7A6B7A" }}>{unter}</div>}

      {FILTER && <div className="s2g-entdecken-chips" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 20px 14px", scrollbarWidth: "none" }}>
        {FILTER.map((f) => {
          const an = f === filter;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              flexShrink: 0, height: 38, padding: "0 18px", borderRadius: 19, cursor: "pointer",
              border: an ? "none" : "1px solid #EFDFEC",
              background: an ? MAGENTA : "#FFFDFE",
              color: an ? "#fff" : "#2E2430",
              fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: an ? 600 : 400,
              boxShadow: an ? "0 6px 16px rgba(194,65,143,.32)" : "none",
            }}>{f}</button>
          );
        })}
      </div>}

      <div
        ref={leiste}
        onScroll={beimWischen}
        className="s2g-entdecken-leiste"
        style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", padding: "10px calc(50% - 118px) 18px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {liste.map((k, i) => {
          const istAktiv = i === aktiv;
          return (
            <button
              key={k.key}
              onClick={() => (istAktiv ? onOeffnen(k) : leiste.current?.children[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }))}
              aria-label={`${k.titel} öffnen`}
              style={{
                flex: "0 0 236px", height: 316, scrollSnapAlign: "center", position: "relative",
                border: 0, padding: 0, borderRadius: 28, overflow: "hidden", cursor: "pointer",
                background: PFLAUME, textAlign: "left",
                transform: istAktiv ? "scale(1)" : "scale(.88)",
                opacity: istAktiv ? 1 : .78,
                transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s",
                boxShadow: istAktiv ? "0 18px 40px rgba(42,23,48,.38)" : "0 8px 20px rgba(42,23,48,.18)",
              }}
            >
              <img src={k.bild} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(42,23,48,0) 45%, rgba(42,23,48,.82) 100%)" }} />
              {k.art && <span style={{ position: "absolute", top: 14, left: 14, padding: "5px 11px", borderRadius: 12, background: "rgba(255,255,255,.18)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 11.5, letterSpacing: ".04em" }}>{k.art}</span>}
              <div style={{ position: "absolute", left: 16, right: 60, bottom: 16, color: "#fff" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, lineHeight: 1.15 }}>{k.titel}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, opacity: .9, marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.unter}</div>
                {k.dauer && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, opacity: .75, marginTop: 2 }}>{k.dauer}</div>}
              </div>
              <span aria-hidden="true" style={{ position: "absolute", right: 14, bottom: 16, width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.2)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8" /></svg>
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {liste.map((k, i) => (
          <span key={k.key} style={{ width: i === aktiv ? 18 : 6, height: 6, borderRadius: 3, background: i === aktiv ? MAGENTA : "#E8D2E3", transition: "width .3s" }} />
        ))}
      </div>
    </div>
  );
}
