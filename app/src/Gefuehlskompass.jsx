// Gefuehlskompass.jsx — smile2go
// Gefuehl benennen, moegliches Beduerfnis pruefen, eine kleine Uebung waehlen.
//
// Uebernommen aus dem Entwurf "Gefuehlskompass" (How We Feel), in die Farben
// und Bausteine von smile2go gebracht. Die Regeln dahinter bleiben:
//   – Sie bestimmt, was stimmt. Die App macht nur Vorschlaege mit Begruendung,
//     nie "dein eigentliches Gefuehl ist ...".
//   – Keine Diagnose, keine Streaks, kein Druck.
//   – Bei Worten, die nach Lebensgefahr klingen, hoert der normale Weg auf
//     und es erscheinen die Hilfenummern.
//
// Gespeichert wird in prefs.gefuehle — bei ihrem uebrigen App-Zustand.
import { useEffect, useMemo, useRef, useState } from "react";
import { EMOTIONS, QUADRANT_INFO, CONTEXT_TAGS } from "./gefuehle/emotions.js";
import { SDT_LABELS, GOAL_LABELS } from "./gefuehle/needs.js";
import { INTERVENTIONS, APPROACH_LABELS } from "./gefuehle/interventions.js";
import { analyzeNeeds, emotionHypotheses, screenSafety, routeInterventions, clarifyingQuestion, weeklyStats, fmtDate, fmtTime } from "./gefuehle/engine.js";

const MAX_EINTRAEGE = 200;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const sys = "system-ui, -apple-system, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";

// Die vier Bereiche — in smile2go-Toenen, ohne Braun.
const QUAD = {
  red: { dot: "#D4547A", bg: "#FBE6EE" },
  yellow: { dot: "#D9A63E", bg: "#FBF1DA" },
  blue: { dot: "#6F78C2", bg: "#E9EBF8" },
  green: { dot: "#5E9E8C", bg: "#E3F2EE" },
};
const QUAD_VON = Object.fromEntries(EMOTIONS.map((e) => [e.id, e.quadrant]));

export const leereGefuehle = () => ({ checkins: [], assessments: [], sessions: [], safetyEvents: [] });

/* ── kleine Bausteine ─────────────────────────────────────────── */
function Knopf({ C, children, onClick, art = "voll", disabled, style }) {
  const basis = { fontFamily: sys, fontSize: 15, fontWeight: 600, minHeight: 50, borderRadius: 999, padding: "0 18px", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 };
  const arten = {
    voll: { border: "none", background: C.gold, color: "#FFF8FC", boxShadow: "0 10px 22px -12px rgba(110,45,100,.7)" },
    zart: { border: `1.5px solid ${C.line}`, background: C.card, color: C.plum },
    leise: { border: "none", background: "none", color: C.ink },
  };
  return <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...basis, ...arten[art], ...style }}>{children}</button>;
}

function Chip({ C, an, onClick, children, punkt }) {
  return (
    <button onClick={onClick} aria-pressed={an} style={{
      fontFamily: sys, fontSize: 14, padding: "8px 13px", minHeight: 38, borderRadius: 999, cursor: "pointer",
      border: `1.5px solid ${an ? C.gold : C.line}`, background: an ? C.gold : C.card, color: an ? "#FFF8FC" : C.espresso,
      fontWeight: an ? 600 : 500, display: "inline-flex", alignItems: "center", gap: 6,
    }}>
      {punkt && <span style={{ width: 8, height: 8, borderRadius: "50%", background: punkt }} />}
      {children}
    </button>
  );
}

function Kasten({ C, children, style }) {
  return <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, boxShadow: "0 14px 30px -24px rgba(120,60,110,.45)", ...style }}>{children}</div>;
}

function Titel({ C, children, kursiv }) {
  return (
    <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 27, lineHeight: 1.18, letterSpacing: "-.015em", color: C.espresso, margin: "0 0 4px" }}>
      {children}{kursiv && <> <em style={{ color: C.plum }}>{kursiv}</em></>}
    </h2>
  );
}

function Zeile({ C, children, style }) {
  return <p style={{ fontFamily: sys, fontSize: 14.5, color: C.ink, lineHeight: 1.55, margin: "4px 0 0", ...style }}>{children}</p>;
}

function Etikett({ C, children }) {
  return <div style={{ fontFamily: sys, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, color: C.plum, marginBottom: 8 }}>{children}</div>;
}

function Regler({ C, wert, setWert, min, max, links, rechts, label }) {
  return (
    <div>
      {label && <div style={{ fontFamily: sys, fontSize: 15, fontWeight: 600, color: C.espresso, marginBottom: 6 }}>{label}</div>}
      <input type="range" min={min} max={max} value={wert} onChange={(e) => setWert(Number(e.target.value))} aria-label={label || links}
        style={{ width: "100%", accentColor: C.gold, height: 30, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sys, fontSize: 12.5, color: C.ink }}>
        <span>{links}</span><b style={{ color: C.espresso, fontVariantNumeric: "tabular-nums" }}>{wert > 0 && min < 0 ? `+${wert}` : wert}</b><span>{rechts}</span>
      </div>
    </div>
  );
}

function Punkte({ C, gesamt, jetzt }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
      {Array.from({ length: gesamt }).map((_, i) => (
        <span key={i} style={{ height: 6, width: i === jetzt ? 22 : 6, borderRadius: 3, background: i <= jetzt ? C.gold : C.line, transition: "width .2s" }} />
      ))}
    </div>
  );
}

function Kopf({ C, titel, onZu }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <button onClick={onZu} aria-label="Schließen" style={{ border: "none", background: "none", cursor: "pointer", color: C.ink, fontSize: 22, padding: "6px 8px 6px 0", lineHeight: 1 }}>✕</button>
      <span style={{ fontFamily: sys, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.ink, fontWeight: 700 }}>{titel}</span>
      <span style={{ width: 30 }} />
    </div>
  );
}

function GefuehlsMarke({ C, e }) {
  const q = QUAD[QUAD_VON[e.id]];
  return <span style={{ fontFamily: sys, fontSize: 12.5, padding: "4px 10px", borderRadius: 999, background: q ? q.bg : C.goldPale, color: C.espresso }}>{e.label}{e.intensity != null ? ` · ${e.intensity}` : ""}</span>;
}

/* ── Karte auf "Heute" ────────────────────────────────────────── */
export function GefuehlsKarte({ C, daten, onCheckin, onOeffnen }) {
  const d = daten || leereGefuehle();
  const heute = new Date().toDateString();
  const heutige = d.checkins.filter((c) => new Date(c.createdAt).toDateString() === heute);
  const letzte = heutige[heutige.length - 1];
  const nachfrage = d.sessions.find((s) => !s.followupDone && s.followupAt && s.followupAt <= Date.now());
  return (
    <div style={{ padding: "0 20px", marginBottom: 18 }}>
      <Kasten C={C} style={{ padding: 18, background: `linear-gradient(150deg, ${C.card}, ${C.goldPale})` }}>
        <Etikett C={C}>Gefühlskompass</Etikett>
        <Titel C={C} kursiv="gerade?">Wie fühlst du dich</Titel>
        {nachfrage ? (
          <Zeile C={C}>Kurze Nachfrage zu deiner Übung wartet auf dich.</Zeile>
        ) : letzte ? (
          <>
            <Zeile C={C}>Zuletzt um {fmtTime(letzte.createdAt)}:</Zeile>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{letzte.emotions.map((e) => <GefuehlsMarke key={e.id} C={C} e={e} />)}</div>
          </>
        ) : (
          <Zeile C={C}>Gefühl benennen, mögliches Bedürfnis prüfen, eine kleine Übung — unter einer Minute.</Zeile>
        )}
        <div style={{ display: "flex", gap: 6, margin: "14px 0 4px" }}>
          {Object.keys(QUAD).map((q) => (
            <span key={q} title={QUADRANT_INFO[q].hint} style={{ flex: 1, height: 6, borderRadius: 3, background: QUAD[q].dot, opacity: 0.85 }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Knopf C={C} onClick={onCheckin} style={{ flex: 1.3 }}>＋ Check-in</Knopf>
          <Knopf C={C} art="zart" onClick={onOeffnen} style={{ flex: 1 }}>{nachfrage ? "Nachfrage" : "Übungen"}</Knopf>
        </div>
      </Kasten>
    </div>
  );
}

/* ── Der ganze Kompass ────────────────────────────────────────── */
export default function Gefuehlskompass({ C, daten, setDaten, energie, start = "start", onZurueck }) {
  const d = daten || leereGefuehle();
  const [ansicht, setAnsicht] = useState(start === "checkin" ? { art: "checkin" } : { art: "start" });
  const [reiter, setReiter] = useState("heute");

  const speichern = (f) => {
    const n = f(d);
    setDaten({
      checkins: n.checkins.slice(-MAX_EINTRAEGE),
      assessments: n.assessments.slice(-MAX_EINTRAEGE),
      sessions: n.sessions.slice(-MAX_EINTRAEGE),
      safetyEvents: n.safetyEvents.slice(-50),
    });
  };

  if (ansicht.art === "checkin") {
    return (
      <CheckIn C={C} sessions={d.sessions} energie={energie}
        onAbbrechen={() => (start === "checkin" && onZurueck ? onZurueck() : setAnsicht({ art: "start" }))}
        onSicherheit={(s) => { speichern((x) => ({ ...x, safetyEvents: [...x.safetyEvents, { id: uid(), at: Date.now(), level: s.level }] })); setAnsicht({ art: "sicherheit" }); }}
        onFertig={(ci, a) => { speichern((x) => ({ ...x, checkins: [...x.checkins, ci], assessments: a ? [...x.assessments, a] : x.assessments })); setAnsicht({ art: "start" }); }}
        onUebung={(u, ciId, vor) => setAnsicht({ art: "uebung", u, ciId, vor })}
      />
    );
  }
  if (ansicht.art === "uebung") {
    return (
      <Uebung C={C} u={ansicht.u} ciId={ansicht.ciId} vor={ansicht.vor}
        onAbbrechen={() => setAnsicht({ art: "start" })}
        onFertig={(s) => { speichern((x) => ({ ...x, sessions: [...x.sessions, s] })); setAnsicht({ art: "start" }); }}
      />
    );
  }
  if (ansicht.art === "sicherheit") return <Sicherheit C={C} onSicher={() => setAnsicht({ art: "start" })} />;

  const REITER = [["heute", "Heute"], ["uebungen", "Übungen"], ["verlauf", "Verlauf"], ["woche", "Woche"]];
  return (
    <div style={{ padding: "22px 20px 30px" }}>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
        {REITER.map(([k, t]) => <Chip key={k} C={C} an={reiter === k} onClick={() => setReiter(k)}>{t}</Chip>)}
      </div>
      {reiter === "heute" && <Start C={C} d={d} onCheckin={() => setAnsicht({ art: "checkin" })} onUebungen={() => setReiter("uebungen")}
        onNachfrage={(id, wert) => speichern((x) => ({ ...x, sessions: x.sessions.map((s) => (s.id === id ? { ...s, followupIntensity: wert, followupDone: true } : s)) }))} />}
      {reiter === "uebungen" && <Bibliothek C={C} onStart={(u) => setAnsicht({ art: "uebung", u, ciId: null, vor: 5 })} />}
      {reiter === "verlauf" && <Verlauf C={C} d={d} />}
      {reiter === "woche" && <Woche C={C} d={d} />}
    </div>
  );
}

function Start({ C, d, onCheckin, onUebungen, onNachfrage }) {
  const heute = new Date().toDateString();
  const heutige = d.checkins.filter((c) => new Date(c.createdAt).toDateString() === heute);
  const nachfrage = d.sessions.find((s) => !s.followupDone && s.followupAt && s.followupAt <= Date.now());
  const [wert, setWert] = useState(5);
  return (
    <>
      <Etikett C={C}>{fmtDate(Date.now())}</Etikett>
      <Titel C={C} kursiv="heute?">Wie geht es dir</Titel>
      {nachfrage && (
        <Kasten C={C} style={{ marginTop: 16, borderColor: C.gold }}>
          <Etikett C={C}>Kurze Nachfrage</Etikett>
          <Zeile C={C} style={{ color: C.espresso }}>Nach deiner Übung (vorher {nachfrage.preIntensity}/10): Wie stark ist das Gefühl jetzt?</Zeile>
          <div style={{ marginTop: 10 }}><Regler C={C} wert={wert} setWert={setWert} min={0} max={10} links="kaum" rechts="sehr stark" /></div>
          <Knopf C={C} onClick={() => onNachfrage(nachfrage.id, wert)} style={{ width: "100%", marginTop: 10 }}>Antworten</Knopf>
        </Kasten>
      )}
      <Kasten C={C} style={{ marginTop: 16 }}>
        {heutige.length === 0 ? (
          <Zeile C={C} style={{ marginTop: 0 }}>Noch kein Eintrag heute. Ein kurzer Check-in dauert weniger als eine Minute.</Zeile>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sys, fontSize: 14, color: C.ink }}>
              <span>{heutige.length} {heutige.length === 1 ? "Eintrag" : "Einträge"} heute</span>
              <span>zuletzt {fmtTime(heutige[heutige.length - 1].createdAt)}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{heutige[heutige.length - 1].emotions.map((e) => <GefuehlsMarke key={e.id} C={C} e={e} />)}</div>
          </>
        )}
      </Kasten>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Knopf C={C} onClick={onCheckin} style={{ flex: 1, minHeight: 60 }}>＋ Check-in</Knopf>
        <Knopf C={C} art="zart" onClick={onUebungen} style={{ flex: 1, minHeight: 60 }}>Übungsbibliothek</Knopf>
      </div>
      <Zeile C={C} style={{ fontSize: 12.5, marginTop: 18 }}>Nur für dich. Keine Diagnose — du bestimmst, was stimmt.</Zeile>
    </>
  );
}

/* ── Check-in in sieben kleinen Schritten ──────────────────────── */
const SCHRITTE = ["Wohlbefinden", "Gefühle", "Stärke", "Kontext", "Einordnung", "Bedürfnisse", "Was jetzt?"];
const SCHNELL_BEDUERFNISSE = ["Ruhe", "Nähe", "Klarheit", "Unterstützung", "Grenzen", "Freiraum", "Wertschätzung", "Sicherheit", "Verstandenwerden", "Zugehörigkeit"];

function CheckIn({ C, sessions, energie, onAbbrechen, onSicherheit, onFertig, onUebung }) {
  const [schritt, setSchritt] = useState(0);
  const [valenz, setValenz] = useState(0);
  // Wer heute schon im Energie-Kompass war, muss ihre Energie nicht zweimal angeben.
  const [energieWert, setEnergieWert] = useState(energie?.v ?? 5);
  const [gewaehlt, setGewaehlt] = useState([]);
  const [eigenes, setEigenes] = useState("");
  const [filter, setFilter] = useState("alle");
  const [kontext, setKontext] = useState([]);
  const [notiz, setNotiz] = useState("");
  const [einschaetzung, setEinschaetzung] = useState(null);
  const [ziel, setZiel] = useState(null);
  const basis = useRef({ id: uid(), createdAt: Date.now(), source: "quick" });

  const sicherheit = useMemo(() => screenSafety(notiz), [notiz]);
  const maxStaerke = gewaehlt.reduce((m, e) => Math.max(m, e.intensity), 0);

  const umschalten = (id, label) =>
    setGewaehlt((p) => (p.some((e) => e.id === id) ? p.filter((e) => e.id !== id) : [...p, { id, label, intensity: 5 }]));
  const eigenesDazu = () => {
    const t = eigenes.trim();
    if (!t) return;
    setGewaehlt((p) => [...p, { id: "custom-" + uid(), label: t, intensity: 5, custom: true }]);
    setEigenes("");
  };
  const baue = () => ({ ...basis.current, valence: valenz, arousal: energieWert, emotions: gewaehlt, contextTags: kontext, note: notiz.trim() });

  const einordnen = () => {
    const s = screenSafety(notiz);
    if (s.level === "red") { onFertig(baue(), null); onSicherheit(s); return; }
    const ci = baue();
    const { sdt, nvc } = analyzeNeeds(ci);
    setEinschaetzung({ id: uid(), checkinId: ci.id, createdAt: Date.now(), sdtCandidates: sdt, nvcCandidates: nvc, confirmedSdt: [], confirmedNvc: [], userResponse: "uebersprungen" });
    setSchritt(4);
  };
  const fertig = () => onFertig(baue(), einschaetzung);
  const vorschlaege = useMemo(() => (!ziel || ziel === "nur_eintragen" ? [] : routeInterventions(maxStaerke, ziel, sicherheit, sessions)), [ziel]); // eslint-disable-line react-hooks/exhaustive-deps
  const vermutungen = useMemo(() => emotionHypotheses(baue()), [notiz, gewaehlt]); // eslint-disable-line react-hooks/exhaustive-deps

  const unten = (kinder) => <div style={{ display: "flex", gap: 10, marginTop: 22 }}>{kinder}</div>;

  return (
    <div style={{ padding: "18px 20px 30px" }}>
      <Kopf C={C} titel={SCHRITTE[schritt]} onZu={onAbbrechen} />

      {schritt === 0 && (
        <>
          <Titel C={C} kursiv="gerade?">Wie geht es dir</Titel>
          <Kasten C={C} style={{ marginTop: 18 }}><Regler C={C} label="Wohlbefinden" wert={valenz} setWert={setValenz} min={-5} max={5} links="unangenehm" rechts="angenehm" /></Kasten>
          <Kasten C={C} style={{ marginTop: 12 }}>
            <Regler C={C} label="Energie" wert={energieWert} setWert={setEnergieWert} min={0} max={10} links="wenig" rechts="viel" />
            {energie?.v != null && <Zeile C={C} style={{ fontSize: 12.5 }}>Aus deinem Energie-Kompass übernommen.</Zeile>}
          </Kasten>
          {unten(<Knopf C={C} onClick={() => setSchritt(1)} style={{ flex: 1 }}>Weiter</Knopf>)}
        </>
      )}

      {schritt === 1 && (
        <>
          <Titel C={C} kursiv="passt?">Welches Gefühl</Titel>
          <Zeile C={C}>Mehrere sind erlaubt — Gefühle mischen sich.</Zeile>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
            <Chip C={C} an={filter === "alle"} onClick={() => setFilter("alle")}>Alle</Chip>
            {Object.keys(QUADRANT_INFO).map((q) => <Chip key={q} C={C} an={filter === q} punkt={QUAD[q].dot} onClick={() => setFilter(q)}>{QUADRANT_INFO[q].name}</Chip>)}
          </div>
          {filter !== "alle" && <Zeile C={C} style={{ fontSize: 12.5 }}>{QUADRANT_INFO[filter].hint}</Zeile>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14, maxHeight: "40dvh", overflowY: "auto", padding: "2px 0" }}>
            {EMOTIONS.filter((e) => filter === "alle" || e.quadrant === filter).map((e) => (
              <Chip key={e.id} C={C} an={gewaehlt.some((s) => s.id === e.id)} onClick={() => umschalten(e.id, e.label)}>{e.label}</Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={eigenes} onChange={(e) => setEigenes(e.target.value)} onKeyDown={(e) => e.key === "Enter" && eigenesDazu()} placeholder="Eigenes Wort …"
              style={{ flex: 1, minWidth: 0, minHeight: 46, padding: "0 14px", borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.card, fontFamily: sys, fontSize: 16, color: C.espresso, outline: "none" }} />
            <Knopf C={C} art="zart" onClick={eigenesDazu} disabled={!eigenes.trim()} style={{ minHeight: 46 }}>＋</Knopf>
          </div>
          {unten(<><Knopf C={C} art="zart" onClick={() => setSchritt(0)} style={{ flex: 1 }}>Zurück</Knopf><Knopf C={C} onClick={() => setSchritt(2)} disabled={!gewaehlt.length} style={{ flex: 1 }}>Weiter</Knopf></>)}
        </>
      )}

      {schritt === 2 && (
        <>
          <Titel C={C}>Wie stark ist es?</Titel>
          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            {gewaehlt.map((e, i) => (
              <Kasten key={e.id} C={C}><Regler C={C} label={e.label} wert={e.intensity} min={0} max={10} links="kaum" rechts="sehr stark"
                setWert={(v) => setGewaehlt((p) => p.map((x, j) => (j === i ? { ...x, intensity: v } : x)))} /></Kasten>
            ))}
          </div>
          {unten(<><Knopf C={C} art="zart" onClick={() => setSchritt(1)} style={{ flex: 1 }}>Zurück</Knopf><Knopf C={C} onClick={() => setSchritt(3)} style={{ flex: 1 }}>Weiter</Knopf></>)}
        </>
      )}

      {schritt === 3 && (
        <>
          <Titel C={C} kursiv="los?">Was ist gerade</Titel>
          <Zeile C={C}>Beides ist freiwillig — hilft aber beim Einordnen.</Zeile>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
            {CONTEXT_TAGS.map((t) => <Chip key={t.id} C={C} an={kontext.includes(t.id)} onClick={() => setKontext((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]))}>{t.label}</Chip>)}
          </div>
          <textarea value={notiz} onChange={(e) => setNotiz(e.target.value)} rows={4} placeholder="Kurz beschreiben, was passiert ist (freiwillig) …"
            style={{ width: "100%", boxSizing: "border-box", marginTop: 14, padding: 14, borderRadius: 16, border: `1.5px solid ${C.line}`, background: C.card, fontFamily: sys, fontSize: 16, lineHeight: 1.5, color: C.espresso, resize: "vertical", outline: "none" }} />
          {sicherheit.level === "amber" && (
            <Kasten C={C} style={{ marginTop: 10, borderColor: QUAD.yellow.dot, background: QUAD.yellow.bg }}>
              <Zeile C={C} style={{ marginTop: 0, color: C.espresso }}>Das klingt belastend. Wir schlagen dir gleich zuerst etwas Stabilisierendes vor.</Zeile>
            </Kasten>
          )}
          {unten(<><Knopf C={C} art="zart" onClick={() => setSchritt(2)} style={{ flex: 1 }}>Zurück</Knopf><Knopf C={C} onClick={einordnen} style={{ flex: 1 }}>Einordnen</Knopf></>)}
        </>
      )}

      {schritt === 4 && einschaetzung && (
        <>
          <Titel C={C} kursiv="einordnen.">Kurz</Titel>
          <Zeile C={C} style={{ fontSize: 15.5 }}>{clarifyingQuestion(einschaetzung.sdtCandidates)}</Zeile>
          {vermutungen.length > 0 && (
            <Kasten C={C} style={{ marginTop: 16 }}>
              <Etikett C={C}>Vielleicht auch?</Etikett>
              <div style={{ display: "grid", gap: 8 }}>
                {vermutungen.map((h) => {
                  const drin = gewaehlt.some((s) => s.label === h.label);
                  return (
                    <button key={h.label} disabled={drin} onClick={() => { const w = EMOTIONS.find((x) => x.label === h.label); if (w) umschalten(w.id, w.label); }}
                      style={{ textAlign: "left", padding: 12, borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, cursor: drin ? "default" : "pointer", opacity: drin ? 0.55 : 1 }}>
                      <span style={{ fontFamily: sys, fontSize: 15, color: C.espresso }}>„{h.label}“</span>
                      <span style={{ display: "block", fontFamily: sys, fontSize: 12.5, color: C.ink, marginTop: 2 }}>wegen: „{h.evidenceQuote}“ — {drin ? "hinzugefügt" : "antippen zum Hinzufügen"}</span>
                    </button>
                  );
                })}
              </div>
            </Kasten>
          )}
          <Zeile C={C} style={{ fontSize: 13, marginTop: 14 }}>Das sind nur Vermutungen anhand deiner Worte — du entscheidest, was stimmt.</Zeile>
          {unten(<Knopf C={C} onClick={() => setSchritt(5)} style={{ flex: 1 }}>Zu den Bedürfnissen</Knopf>)}
        </>
      )}

      {schritt === 5 && einschaetzung && (
        <Beduerfnisse C={C} a={einschaetzung} setA={setEinschaetzung} onZurueck={() => setSchritt(4)} onWeiter={() => setSchritt(6)} />
      )}

      {schritt === 6 && (
        <>
          <Titel C={C} kursiv="dir?">Was hilft jetzt</Titel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
            {Object.keys(GOAL_LABELS).map((g) => (
              <button key={g} onClick={() => setZiel(g)} style={{
                textAlign: "left", padding: 12, minHeight: 70, borderRadius: 16, cursor: "pointer",
                border: `1.5px solid ${ziel === g ? C.gold : C.line}`, background: ziel === g ? C.goldPale : C.card,
              }}>
                <div style={{ fontFamily: sys, fontSize: 15, fontWeight: 600, color: C.espresso }}>{GOAL_LABELS[g].label}</div>
                <div style={{ fontFamily: sys, fontSize: 12.5, color: C.ink, marginTop: 2, lineHeight: 1.35 }}>{GOAL_LABELS[g].hint}</div>
              </button>
            ))}
          </div>
          {ziel && ziel !== "nur_eintragen" && vorschlaege.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
              <Etikett C={C}>Passende Übungen</Etikett>
              {vorschlaege.map((u) => (
                <Kasten key={u.id} C={C} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: sys, fontSize: 15, fontWeight: 600, color: C.espresso }}>{u.title}</div>
                    <div style={{ fontFamily: sys, fontSize: 12.5, color: C.ink }}>{u.subtitle} · {u.durationMin} Min</div>
                  </div>
                  <Knopf C={C} art="zart" onClick={() => { fertig(); onUebung(u, basis.current.id, maxStaerke); }} style={{ minHeight: 42, flexShrink: 0 }}>▶ Start</Knopf>
                </Kasten>
              ))}
            </div>
          )}
          {ziel && ziel !== "nur_eintragen" && vorschlaege.length === 0 && (
            <Zeile C={C} style={{ marginTop: 14 }}>Dafür haben wir gerade keine passende Übung — schau gern in die Übungsbibliothek.</Zeile>
          )}
          {unten(<><Knopf C={C} art="zart" onClick={fertig} style={{ flex: 1 }}>Nur eintragen</Knopf><Knopf C={C} onClick={fertig} disabled={!ziel} style={{ flex: 1 }}>Fertig</Knopf></>)}
        </>
      )}

      <Punkte C={C} gesamt={7} jetzt={schritt} />
    </div>
  );
}

function Beduerfnisse({ C, a, setA, onZurueck, onWeiter }) {
  const [anderes, setAnderes] = useState("");
  const umNvc = (c) => setA({ ...a, confirmedNvc: a.confirmedNvc.includes(c) ? a.confirmedNvc.filter((x) => x !== c) : [...a.confirmedNvc, c] });
  const umSdt = (c) => setA({ ...a, confirmedSdt: a.confirmedSdt.includes(c) ? a.confirmedSdt.filter((x) => x !== c) : [...a.confirmedSdt, c] });
  const selbst = (need) => setA({ ...a, confirmedNvc: [...a.confirmedNvc, { framework: "nvc", need, confidence: "hoch", evidenceQuote: "selbst gewählt" }], userResponse: a.userResponse === "uebersprungen" ? "bearbeitet" : a.userResponse });
  const abschluss = (r) => { setA({ ...a, userResponse: r }); onWeiter(); };
  const irgendwas = a.confirmedSdt.length + a.confirmedNvc.length > 0;

  const Wahl = ({ an, onClick, titel, hinweis, beleg }) => (
    <button onClick={onClick} aria-pressed={an} style={{ width: "100%", textAlign: "left", padding: 13, minHeight: 56, borderRadius: 16, cursor: "pointer", border: `1.5px solid ${an ? C.gold : C.line}`, background: an ? C.goldPale : C.card }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: sys, fontSize: 15, fontWeight: 600, color: C.espresso }}>{titel}{an && <span style={{ color: C.gold }}>✓</span>}</span>
      {hinweis && <span style={{ display: "block", fontFamily: sys, fontSize: 13, color: C.ink, marginTop: 2 }}>{hinweis}</span>}
      <span style={{ display: "block", fontFamily: sys, fontSize: 12, color: C.ink, marginTop: 4, opacity: 0.85 }}>wegen: {beleg}</span>
    </button>
  );

  return (
    <>
      <Titel C={C} kursiv="dahinter?">Was steckt</Titel>
      <Zeile C={C}>Mögliche Bedürfnisse — bitte prüfe, ob das für dich stimmt:</Zeile>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {a.nvcCandidates.map((c, i) => <Wahl key={"n" + i} an={a.confirmedNvc.includes(c)} onClick={() => umNvc(c)} titel={`Bedürfnis: ${c.need}`} beleg={`„${c.evidenceQuote}“`} />)}
        {a.sdtCandidates.map((c, i) => <Wahl key={"s" + i} an={a.confirmedSdt.includes(c)} onClick={() => umSdt(c)} titel={SDT_LABELS[c.dimension][c.direction]} hinweis={c.hint} beleg={`„${c.evidenceQuote}“`} />)}
      </div>
      <Zeile C={C} style={{ fontSize: 12.5, marginTop: 16 }}>Nichts Passendes dabei? Direkt wählen:</Zeile>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {SCHNELL_BEDUERFNISSE.filter((n) => !a.nvcCandidates.some((c) => c.need === n) && !a.confirmedNvc.some((c) => c.need === n)).map((n) => (
          <Chip key={n} C={C} an={false} onClick={() => selbst(n)}>{n}</Chip>
        ))}
        {a.confirmedNvc.filter((c) => c.evidenceQuote === "selbst gewählt").map((c) => <Chip key={"g" + c.need} C={C} an onClick={() => umNvc(c)}>{c.need} ✓</Chip>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={anderes} onChange={(e) => setAnderes(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && anderes.trim()) { selbst(anderes.trim()); setAnderes(""); } }} placeholder="Anderes Bedürfnis …"
          style={{ flex: 1, minWidth: 0, minHeight: 46, padding: "0 14px", borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.card, fontFamily: sys, fontSize: 16, color: C.espresso, outline: "none" }} />
        <Knopf C={C} art="zart" disabled={!anderes.trim()} onClick={() => { selbst(anderes.trim()); setAnderes(""); }} style={{ minHeight: 46 }}>＋</Knopf>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 20 }}>
        <Knopf C={C} art={irgendwas ? "voll" : "zart"} disabled={!irgendwas} onClick={() => abschluss("bestaetigt")} style={{ padding: "0 6px" }}>Stimmt</Knopf>
        <Knopf C={C} art="zart" onClick={() => abschluss("unsicher")} style={{ padding: "0 6px" }}>Unsicher</Knopf>
        <Knopf C={C} art="leise" onClick={() => abschluss("abgelehnt")} style={{ padding: "0 6px" }}>Passt nicht</Knopf>
      </div>
      <Knopf C={C} art="zart" onClick={onZurueck} style={{ width: "100%", marginTop: 10 }}>Zurück</Knopf>
    </>
  );
}

/* ── Uebung Schritt fuer Schritt ──────────────────────────────── */
function Uebung({ C, u, ciId, vor, onAbbrechen, onFertig }) {
  const [i, setI] = useState(0);
  const [rest, setRest] = useState(u.steps[0]?.seconds ?? 0);
  const [laeuft, setLaeuft] = useState(true);
  const [phase, setPhase] = useState("schritte");
  const [nach, setNach] = useState(5);
  const [hilfe, setHilfe] = useState(null);
  const beginn = useRef(Date.now());
  const s = u.steps[i];
  const letzter = i === u.steps.length - 1;

  useEffect(() => { setRest(s?.seconds ?? 0); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== "schritte" || !laeuft || !s?.seconds) return;
    const t = setInterval(() => setRest((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [i, laeuft, phase, s?.seconds]);

  const weiter = () => (letzter ? setPhase("bewerten") : setI((x) => x + 1));
  const anteil = s?.seconds ? (s.seconds - rest) / s.seconds : 1;
  const U = 2 * Math.PI * 44;

  return (
    <div style={{ padding: "18px 20px 30px" }}>
      <Kopf C={C} titel={APPROACH_LABELS[u.approach]} onZu={onAbbrechen} />
      {phase === "schritte" && (
        <>
          <Etikett C={C}>Schritt {i + 1} von {u.steps.length}</Etikett>
          <Titel C={C}>{s.title}</Titel>
          {s.seconds ? (
            <div style={{ display: "flex", justifyContent: "center", margin: "26px 0" }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="44" fill="none" stroke={C.line} strokeWidth="6" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke={C.gold} strokeWidth="6" strokeLinecap="round" strokeDasharray={U} strokeDashoffset={U * (1 - anteil)} style={{ transition: "stroke-dashoffset 1s linear" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 34, color: C.espresso }}>{rest}</div>
              </div>
            </div>
          ) : null}
          <Kasten C={C} style={{ padding: 18 }}><p style={{ fontFamily: sys, fontSize: 16.5, lineHeight: 1.6, color: C.espresso, margin: 0 }}>{s.text}</p></Kasten>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            {s.seconds ? <Knopf C={C} art="zart" onClick={() => setLaeuft((x) => !x)} style={{ flex: 1 }}>{laeuft ? "Pause" : "Weiter"}</Knopf> : null}
            <Knopf C={C} onClick={weiter} style={{ flex: 1 }}>{letzter ? "Abschließen" : "Nächster Schritt"}</Knopf>
          </div>
          <Knopf C={C} art="leise" onClick={weiter} style={{ width: "100%", fontSize: 13.5, minHeight: 40, marginTop: 4 }}>Schritt überspringen</Knopf>
        </>
      )}
      {phase === "bewerten" && (
        <>
          <Titel C={C} kursiv="jetzt?">Wie fühlst du dich</Titel>
          <Zeile C={C}>Vorher: {vor}/10 — nur ein kurzer Vergleich, keine Bewertung.</Zeile>
          <Kasten C={C} style={{ marginTop: 16 }}><Regler C={C} label="Stärke jetzt" wert={nach} setWert={setNach} min={0} max={10} links="kaum" rechts="sehr stark" /></Kasten>
          <Zeile C={C} style={{ marginTop: 16 }}>Hat dir die Übung geholfen?</Zeile>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
            {[["nein", "Nein"], ["etwas", "Ein bisschen"], ["ja", "Ja"]].map(([v, t]) => (
              <Knopf key={v} C={C} art={hilfe === v ? "voll" : "zart"} onClick={() => setHilfe(v)} style={{ padding: "0 6px", fontSize: 14 }}>{t}</Knopf>
            ))}
          </div>
          <Knopf C={C} disabled={!hilfe} style={{ width: "100%", marginTop: 22 }} onClick={() => onFertig({
            id: uid(), checkinId: ciId, interventionId: u.id, startedAt: beginn.current, completedAt: Date.now(), preIntensity: vor, postIntensity: nach,
            helpfulness: hilfe, followupAt: Date.now() + 20 * 60 * 1000, followupIntensity: null, followupDone: false,
          })}>Eintrag speichern</Knopf>
          <Zeile C={C} style={{ fontSize: 12.5, textAlign: "center", marginTop: 10 }}>In etwa 20 Minuten fragen wir hier kurz nach, wie es dir geht.</Zeile>
        </>
      )}
    </div>
  );
}

/* ── Bibliothek, Verlauf, Woche ───────────────────────────────── */
function Bibliothek({ C, onStart }) {
  const [art, setArt] = useState("alle");
  const arten = [...new Set(INTERVENTIONS.map((u) => u.approach))];
  return (
    <>
      <Etikett C={C}>Bibliothek</Etikett>
      <Titel C={C}>Übungen</Titel>
      <Zeile C={C}>Kurze, alltagstaugliche Übungen — von 1 bis 6 Minuten.</Zeile>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "14px 0" }}>
        <Chip C={C} an={art === "alle"} onClick={() => setArt("alle")}>Alle</Chip>
        {arten.map((a) => <Chip key={a} C={C} an={art === a} onClick={() => setArt(a)}>{APPROACH_LABELS[a]}</Chip>)}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {INTERVENTIONS.filter((u) => art === "alle" || u.approach === art).map((u) => (
          <button key={u.id} onClick={() => onStart(u)} style={{ textAlign: "left", padding: 14, borderRadius: 16, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: sys, fontSize: 15, fontWeight: 600, color: C.espresso }}>{u.title}</span>
              <span style={{ display: "block", fontFamily: sys, fontSize: 12.5, color: C.ink, marginTop: 2 }}>{u.subtitle} · {u.durationMin} Min · {APPROACH_LABELS[u.approach]}</span>
            </span>
            <span style={{ color: C.gold, fontSize: 18, flexShrink: 0 }}>▶</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Verlauf({ C, d }) {
  const liste = [...d.checkins].reverse();
  const KTX = Object.fromEntries(CONTEXT_TAGS.map((t) => [t.id, t.label]));
  return (
    <>
      <Etikett C={C}>Verlauf</Etikett>
      <Titel C={C}>Deine Einträge</Titel>
      {liste.length === 0 ? (
        <Zeile C={C} style={{ marginTop: 12 }}>Noch keine Einträge. Dein erster Check-in erscheint hier.</Zeile>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {liste.map((c) => (
            <Kasten key={c.id} C={C} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sys, fontSize: 12.5, color: C.ink }}>
                <span>{fmtDate(c.createdAt)}</span><span>{fmtTime(c.createdAt)}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{c.emotions.map((e) => <GefuehlsMarke key={e.id} C={C} e={e} />)}</div>
              {c.contextTags?.length > 0 && <Zeile C={C} style={{ fontSize: 12.5 }}>{c.contextTags.map((t) => KTX[t] || t).join(" · ")}</Zeile>}
              {c.note && <Zeile C={C} style={{ fontSize: 13.5, color: C.espresso }}>{c.note}</Zeile>}
            </Kasten>
          ))}
        </div>
      )}
    </>
  );
}

function Woche({ C, d }) {
  const w = weeklyStats(d.checkins, d.sessions);
  const KTX = Object.fromEntries(CONTEXT_TAGS.map((t) => [t.id, t.label]));
  const balken = (liste, farbe) => {
    const max = Math.max(1, ...liste.map(([, n]) => n));
    return liste.map(([t, n]) => (
      <div key={t} style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sys, fontSize: 13.5, color: C.espresso }}><span>{t}</span><span style={{ color: C.ink }}>{n}×</span></div>
        <div style={{ height: 7, borderRadius: 4, background: C.line, marginTop: 4 }}><div style={{ height: "100%", width: `${(n / max) * 100}%`, borderRadius: 4, background: farbe }} /></div>
      </div>
    ));
  };
  return (
    <>
      <Etikett C={C}>Wochenrückblick</Etikett>
      <Titel C={C}>Deine letzten 7 Tage</Titel>
      {w.recent.length < 2 ? (
        <Zeile C={C} style={{ marginTop: 12 }}>Sobald du ein paar Check-ins gemacht hast, siehst du hier deine Muster — ganz ohne Wertung.</Zeile>
      ) : (
        <>
          <Zeile C={C}>{w.recent.length} Check-ins · {w.helpfulCount} hilfreiche Übungen</Zeile>
          <Kasten C={C} style={{ marginTop: 14 }}><Etikett C={C}>Häufigste Gefühle</Etikett>{balken(w.topEmotions, C.gold)}</Kasten>
          {w.topContexts.length > 0 && <Kasten C={C} style={{ marginTop: 10 }}><Etikett C={C}>Was dabei oft los war</Etikett>{balken(w.topContexts.map(([t, n]) => [KTX[t] || t, n]), C.rose)}</Kasten>}
          <Zeile C={C} style={{ fontSize: 12.5, marginTop: 12 }}>Das zeigt nur, was zusammen vorkam — nicht, was was verursacht.</Zeile>
        </>
      )}
    </>
  );
}

/* ── Sicherheit ───────────────────────────────────────────────── */
function Sicherheit({ C, onSicher }) {
  const rot = "#B3261E";
  const Nummer = ({ href, titel, text, stark }) => (
    <a href={href} style={{ display: "block", padding: 15, borderRadius: 16, textDecoration: "none", background: stark ? rot : C.card, border: stark ? "none" : `1px solid ${C.line}`, color: stark ? "#fff" : C.espresso }}>
      <span style={{ display: "block", fontFamily: sys, fontSize: 16, fontWeight: 700 }}>📞 {titel}</span>
      <span style={{ display: "block", fontFamily: sys, fontSize: 13, opacity: 0.85, marginTop: 2 }}>{text}</span>
    </a>
  );
  return (
    <div style={{ padding: "26px 20px 30px" }}>
      <div style={{ fontFamily: sys, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, color: rot, marginBottom: 8 }}>Sicherheits-Hinweis</div>
      <Titel C={C}>Das klingt nach sehr viel Schmerz.</Titel>
      <Zeile C={C}>Du musst da nicht allein durch. Ich bin eine App, keine Person — bitte wende dich jetzt an Menschen, die dir direkt helfen können. Kostenlos und vertraulich.</Zeile>
      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
        <Nummer href="tel:08001110111" stark titel="TelefonSeelsorge: 0800 111 0 111" text="Kostenlos, rund um die Uhr (Deutschland)" />
        <Nummer href="tel:08001110222" titel="0800 111 0 222" text="Zweite Nummer der TelefonSeelsorge" />
        <Nummer href="tel:112" titel="Notruf: 112" text="Bei akuter Gefahr" />
      </div>
      <Kasten C={C} style={{ marginTop: 16 }}>
        <Zeile C={C} style={{ marginTop: 0, color: C.espresso }}>Oder schreib jetzt einer Person, der du vertraust: <em>„Mir geht es gerade sehr schlecht. Kannst du kurz da sein?“</em></Zeile>
      </Kasten>
      <Knopf C={C} art="zart" onClick={onSicher} style={{ width: "100%", marginTop: 18 }}>Ich bin in Sicherheit — weiter</Knopf>
    </div>
  );
}
