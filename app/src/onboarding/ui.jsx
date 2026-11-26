import { useState } from "react";

// Kleine Formular-Bausteine für die Formulare A–E. Farben kommen als Palette C
// (Mitglieder-App) bzw. als Admin-/Coach-Palette herein; fehlt sie, gilt STANDARD.

export const STANDARD = {
  card: "#FFFDFB", line: "#EEDDD6", beige: "#F6EBE5", espresso: "#2B1B2E", ink: "#76636D",
  gold: "#C2185B", goldPale: "#FBEAEF", plum: "#8E1A47", sage: "#5E9E8C", aufGold: "#FFFFFF",
};
export const sys = { fontFamily: "system-ui, sans-serif" };

// Ein einzelnes Eingabefeld (Text, Auswahl, Datum) wird in <label> gelegt — Tippen auf
// die Überschrift fokussiert das Feld. Mehrere Knöpfe (Chips, ja/nein) dagegen stehen
// in einer Gruppe: in einem <label> würde jeder Tipp auf die Überschrift den ersten Knopf auslösen.
let feldZaehler = 0;
const EINZELFELD = new Set(["input", "textarea", "select"]);
export function Feld({ C = STANDARD, label, pflicht, hinweis, fehler, children }) {
  const kind = Array.isArray(children) ? null : children;
  const einzeln = !!kind && (EINZELFELD.has(kind.type) || kind.type === Text || kind.type === Auswahl);
  const [id] = useState(() => `s2g-feld-${++feldZaehler}`);
  const Huelle = einzeln ? "label" : "div";
  return (
    <Huelle style={{ display: "block", marginBottom: 14 }} {...(einzeln ? {} : { role: "group", "aria-labelledby": id })}>
      <span id={id} style={{ ...sys, display: "block", fontSize: 15, fontWeight: 650, color: C.espresso, marginBottom: 6 }}>
        {label}{pflicht && <span style={{ color: C.gold }}> *</span>}
      </span>
      {children}
      {hinweis && <span style={{ ...sys, display: "block", fontSize: 12.5, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>{hinweis}</span>}
      {fehler && <span role="alert" style={{ ...sys, display: "block", fontSize: 13, color: "#B3261E", marginTop: 4 }}>{fehler}</span>}
    </Huelle>
  );
}

export const eingabe = (C = STANDARD) => ({
  ...sys, width: "100%", boxSizing: "border-box", fontSize: 16, padding: "11px 12px", minHeight: 44,
  borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, color: C.espresso, outline: "none",
});

export function Text({ C, wert, setze, max, zeilen, ...rest }) {
  const st = eingabe(C);
  return (
    <>
      {zeilen
        ? <textarea rows={zeilen} value={wert ?? ""} maxLength={max} onChange={(e) => setze(e.target.value)} style={{ ...st, resize: "vertical", lineHeight: 1.5 }} {...rest} />
        : <input value={wert ?? ""} maxLength={max} onChange={(e) => setze(e.target.value)} style={st} {...rest} />}
      {max && zeilen && <span style={{ ...sys, display: "block", textAlign: "right", fontSize: 11.5, color: (C || STANDARD).ink, marginTop: 2 }}>{(wert || "").length}/{max}</span>}
    </>
  );
}

export function Auswahl({ C, wert, setze, optionen, leer = "Bitte wählen" }) {
  return (
    <select value={wert ?? ""} onChange={(e) => setze(e.target.value)} style={{ ...eingabe(C), appearance: "auto" }}>
      <option value="">{leer}</option>
      {optionen.map((o) => typeof o === "string"
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.id} value={o.id}>{o.t}</option>)}
    </select>
  );
}

// Chips: einfach (wert = String) oder mehrfach (wert = Array, max = Obergrenze)
export function Chips({ C = STANDARD, wert, setze, optionen, mehrfach, max }) {
  const an = (o) => (mehrfach ? (wert || []).includes(o) : wert === o);
  const klick = (o) => {
    if (!mehrfach) return setze(o);
    const liste = wert || [];
    if (liste.includes(o)) return setze(liste.filter((x) => x !== o));
    if (max && liste.length >= max) return;
    setze([...liste, o]);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {optionen.map((roh) => typeof roh === "string" ? { id: roh, t: roh } : roh).map(({ id: o, t, icon }) => (
        <button key={o} type="button" onClick={() => klick(o)} aria-pressed={an(o)} style={{
          ...sys, fontSize: 14.5, minHeight: 40, padding: "0 14px", borderRadius: 999, cursor: "pointer",
          border: `1.5px solid ${an(o) ? C.gold : C.line}`, background: an(o) ? C.goldPale : C.card,
          color: an(o) ? C.plum : C.espresso, fontWeight: an(o) ? 650 : 500,
        }}>{icon ? `${icon} ` : ""}{t}</button>
      ))}
    </div>
  );
}

export function Haken({ C = STANDARD, wert, setze, children, pflicht }) {
  return (
    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, cursor: "pointer" }}>
      <input type="checkbox" checked={!!wert} onChange={(e) => setze(e.target.checked)}
        style={{ width: 22, height: 22, marginTop: 1, flexShrink: 0, accentColor: C.gold }} />
      <span style={{ ...sys, fontSize: 14.5, color: C.espresso, lineHeight: 1.5 }}>
        {children}{pflicht && <span style={{ color: C.gold }}> *</span>}
      </span>
    </label>
  );
}

// ja · unsicher · nein — für die Prüfpunkte der Begleiterin
export function JaNein({ C = STANDARD, wert, setze, mitUnsicher = true }) {
  const opt = mitUnsicher ? ["ja", "unsicher", "nein"] : ["ja", "nein"];
  const farbe = { ja: C.sage, unsicher: "#C08A1E", nein: "#B3261E" };
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {opt.map((o) => (
        <button key={o} type="button" onClick={() => setze(o)} aria-pressed={wert === o} style={{
          ...sys, fontSize: 14, minHeight: 38, padding: "0 14px", borderRadius: 10, cursor: "pointer",
          border: `1.5px solid ${wert === o ? farbe[o] : C.line}`,
          background: wert === o ? farbe[o] : C.card, color: wert === o ? "#fff" : C.espresso, fontWeight: 600,
        }}>{o}</button>
      ))}
    </div>
  );
}

export function Knopf({ C = STANDARD, onClick, children, leise, disabled, type = "button" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...sys, fontSize: 16, fontWeight: 700, minHeight: 46, padding: "0 20px", borderRadius: 14,
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1,
      border: leise ? `1.5px solid ${C.line}` : "none",
      background: leise ? C.card : C.gold, color: leise ? C.plum : C.aufGold || "#fff",
    }}>{children}</button>
  );
}

export function Meldung({ C = STANDARD, art = "info", children }) {
  const f = { info: [C.goldPale, C.plum], ok: ["#E8F3EF", "#2F6B5B"], fehler: ["#FBE9E7", "#B3261E"] }[art];
  return <div role={art === "fehler" ? "alert" : "status"} style={{ ...sys, fontSize: 14.5, lineHeight: 1.5, padding: "11px 13px", borderRadius: 12, background: f[0], color: f[1], margin: "10px 0" }}>{children}</div>;
}

export function Abschnitt({ C = STANDARD, titel, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ ...sys, fontSize: 12.5, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, color: C.gold, marginBottom: 10 }}>{titel}</div>
      {children}
    </div>
  );
}
