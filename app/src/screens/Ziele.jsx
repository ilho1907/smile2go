// Ziele.jsx — Ziele, Meilensteine und Aufgaben.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { useState } from "react";
import { Challenge369 } from "./Journal";
import { Btn, Card, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Mehr-Menü ── */

/* ── Ziele & Meilensteine (Coaching-Kern, von der Coachin gesetzt) ── */
export function Ziele({ ziele, setZiele, addPunkte }) {
  const toggleMeile = (zid, mi) =>
    setZiele((zs) => zs.map((z) => {
      if (z.id !== zid) return z;
      const meilen = z.meilen.map((m, i) => (i === mi ? { ...m, done: !m.done } : m));
      if (!z.meilen[mi].done) addPunkte(20, "Meilenstein erreicht");
      const done = meilen.filter((m) => m.done).length;
      return { ...z, meilen, fortschritt: Math.round((done / meilen.length) * 100) };
    }));
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Deine Ziele</Eyebrow>
      <H size={25} style={{ marginBottom: 6 }}>Wohin du wächst</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 18 }}>
        Gemeinsam mit Anja gesetzt. Jeder Haken bringt dich näher — und deine Coachin sieht deinen Fortschritt.
      </p>
      {ziele.map((z) => (
        <Card key={z.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 16, color: C.espresso }}>{z.titel}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }}>{z.bereich} · bis {z.faellig}</div>
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.plum }}>{z.fortschritt}%</div>
          </div>
          <div style={{ height: 8, borderRadius: 6, background: C.beige, margin: "12px 0 14px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${z.fortschritt}%`, borderRadius: 6, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})`, transition: "width .4s ease" }} />
          </div>
          {z.warum && <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 12 }}>„{z.warum}“</p>}
          {z.meilen.map((m, i) => (
            <div key={i} onClick={() => toggleMeile(z.id, i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, border: `1.5px solid ${m.done ? C.sage : C.line}`, background: m.done ? C.sage : C.card, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{m.done ? "✓" : ""}</div>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: m.done ? C.ink : C.espresso, textDecoration: m.done ? "line-through" : "none" }}>{m.t}</span>
            </div>
          ))}
        </Card>
      ))}
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "center", marginTop: 8, lineHeight: 1.6 }}>
        Neue Ziele vereinbarst du in deiner nächsten Session mit Anja.
      </p>
    </div>
  );
}

/* ── Aufgaben / Hausaufgaben zwischen den Sessions ── */
export function Aufgaben({ aufgaben, setAufgaben, addPunkte, go, ch369, setCh369, akarte, setAkarte }) {
  const [neu, setNeu] = useState("");
  const toggle = (id) =>
    setAufgaben((as) => as.map((a) => {
      if (a.id !== id) return a;
      if (!a.erledigt) addPunkte(10, "Aufgabe erledigt");
      return { ...a, erledigt: !a.erledigt };
    }));
  const add = () => {
    if (!neu.trim()) return;
    setAufgaben((as) => [...as, { id: Date.now(), titel: neu.trim(), von: "ich", erledigt: false, faellig: "" }]);
    setNeu("");
  };
  const offen = aufgaben.filter((a) => !a.erledigt);
  const erledigt = aufgaben.filter((a) => a.erledigt);
  const Item = ({ a }) => (
    <Card style={{ marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
      <div onClick={() => toggle(a.id)} style={{ width: 26, height: 26, borderRadius: 9, border: `1.5px solid ${a.erledigt ? C.sage : C.line}`, background: a.erledigt ? C.sage : C.card, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, cursor: "pointer" }}>{a.erledigt ? "✓" : ""}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14.5, color: a.erledigt ? C.ink : C.espresso, textDecoration: a.erledigt ? "line-through" : "none" }}>{a.titel}</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.gold, marginTop: 2 }}>{a.von === "coach" ? "🌿 von Anja" : "✍️ selbst gesetzt"}{a.faellig ? ` · bis ${a.faellig}` : ""}</div>
      </div>
    </Card>
  );
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Challenges</Eyebrow>
      <H size={25} style={{ marginBottom: 6 }}>Dranbleiben & Punkte sammeln</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 18 }}>
        {offen.length} offen · {erledigt.length} erledigt. Jede erledigte Aufgabe bringt +10 ✨.
      </p>

      <div style={{ marginBottom: 26 }}>
        <Challenge369 ch={ch369} setCh={setCh369} akarte={akarte} setAkarte={setAkarte} addPunkte={addPunkte} />
      </div>

      <Card onClick={() => go && go("ziele")} style={{ marginBottom: 22, display: "flex", gap: 13, alignItems: "center", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: C.roseSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎯</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>Ziele & Meilensteine</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Deine Coaching-Ziele · Schritt für Schritt</div>
        </div>
        <span style={{ color: C.gold, fontSize: 20 }}>›</span>
      </Card>

      <Eyebrow color={C.plum}>Aufgaben von deiner Coachin</Eyebrow>
      <div style={{ display: "flex", gap: 8, margin: "10px 0 16px" }}>
        <input value={neu} onChange={(e) => setNeu(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Eigene Aufgabe hinzufügen…" style={{ flex: 1, padding: "13px 14px", fontSize: 15, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 13, background: C.card, color: C.espresso, outline: "none" }} />
        <Btn small onClick={add}>+ Hinzufügen</Btn>
      </div>
      {offen.map((a) => <Item key={a.id} a={a} />)}
      {erledigt.length > 0 && (
        <>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 700, margin: "18px 0 8px", letterSpacing: 1, textTransform: "uppercase" }}>Erledigt</div>
          {erledigt.map((a) => <Item key={a.id} a={a} />)}
        </>
      )}
    </div>
  );
}

