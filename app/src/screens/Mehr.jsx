// Mehr.jsx — Bereich „Mehr", Themenseiten und Wochen-Challenge.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { useState } from "react";
import { naechsterMontag, restZeit, useSekundenTakt, wochenNummer } from "../lib/zeit";
import { Btn, Card, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Wochen-Rhythmus ──
   In "Seele & Rituale" und "Wachsen & Spielen" öffnet sich pro Woche genau eine
   Tür. Alles andere bleibt sichtbar, aber blass — Vorfreude statt Buffet.
   Montag 00:00 wechselt die offene Tür, die Reihenfolge rotiert durch. Wer die
   Woche nutzt, bekommt einmalig 20 Lichtpunkte. */
/* ── Themen ───────────────────────────────────────────────────────────────
   Nicht nach Funktion sortiert, sondern nach dem, was gerade los ist.
   Ein Thema bündelt, was in der App schon da ist — und später das, was
   die eigene Coachin dazu hinterlegt hat. */
export const THEMEN = [
  {
    id: "trauer", icon: "🕯️", t: "Trauer", farbe: "#8E4A63", krise: true,
    was: "Wenn jemand fehlt",
    text: "Trauer hat kein Tempo und keine Reihenfolge. Sie kommt in Wellen, oft an Tagen, an denen du sie nicht bestellt hast. Hier ist Platz dafür — ohne dass du sie erklären musst.",
    tabs: [
      { t: "Meditation", s: "Ankommen, wenn der Kopf laut ist", tab: "meditation" },
      { t: "Ungesendeter Brief", s: "Schreib, was du nicht mehr sagen konntest", tab: "tagebuch" },
      { t: "Schattenspiegel", s: "Aufschreiben und loslassen — nichts wird gespeichert", tab: "schatten" },
      { t: "Freundinnen-Kreis", s: "Du musst da nicht allein durch", tab: "kreis" },
    ],
  },
  {
    id: "trennung", icon: "🍂", t: "Trennung & Liebeskummer", farbe: "#B0503C", krise: true,
    was: "Wenn ein Kapitel endet",
    text: "Eine Trennung ist selten ein Tag — sie ist ein langer Weg aus einem gemeinsamen Leben zurück ins eigene. Sortieren hilft mehr als vergessen.",
    tabs: [
      { t: "Loslassen", s: "Was darf gehen?", tab: "loslassen" },
      { t: "Schattenspiegel", s: "Was du niemandem sagen willst", tab: "schatten" },
      { t: "Transformations-Reisen", s: "21 Tage zu einem Thema", tab: "reisen" },
      { t: "Achtsamkeit", s: "Zurück in den Körper", tab: "achtsamkeit" },
    ],
  },
  {
    id: "beziehung", icon: "🤍", t: "Beziehung", farbe: "#D96E8B",
    was: "Nähe, Abstand, Wiederholungen",
    text: "In Beziehungen wiederholt sich oft dasselbe Muster mit verschiedenen Menschen. Das Muster zu sehen ist der erste Schritt, es nicht mehr mitzuspielen.",
    tabs: [
      { t: "Tagebuch", s: "Was war heute zwischen euch?", tab: "tagebuch" },
      { t: "Freundinnen-Kreis", s: "Dein privater Kreis", tab: "kreis" },
      { t: "Community", s: "Frauen unterstützen Frauen", tab: "community" },
    ],
  },
  {
    id: "selbstwert", icon: "💗", t: "Selbstwert", farbe: "#C9963C",
    was: "Ich bin genug",
    text: "Selbstwert ist keine Stimmung, die man sich holt, sondern etwas, das man täglich in kleinen Sätzen zu sich selbst aufbaut oder abträgt.",
    tabs: [
      { t: "Reise „Ich bin genug“", s: "21 Tage für dein Selbstwertgefühl", tab: "reisen" },
      { t: "Dankbarkeit", s: "Drei Dinge am Tag", tab: "dankbarkeit" },
      { t: "Archetypen-Test", s: "Welche innere Kraft leitet dich?", tab: "archetyp" },
    ],
  },
  {
    id: "grenzen", icon: "🛡️", t: "Grenzen", farbe: "#6E8B6A",
    was: "Dein klares Nein",
    text: "Ein Nein zu jemand anderem ist ein Ja zu dir. Es klingt hart, bis man merkt, wie viele Jas man aus Angst gesagt hat.",
    tabs: [
      { t: "Reise „Grenzen setzen“", s: "40 Tage für dein klares Nein", tab: "reisen" },
      { t: "Me-Time", s: "Ein Termin mit dir selbst", tab: "metime" },
      { t: "Tagebuch", s: "Wo hast du heute Ja gesagt statt Nein?", tab: "tagebuch" },
    ],
  },
  {
    id: "neuanfang", icon: "🌱", t: "Neuanfang", farbe: "#5C7A99",
    was: "Was jetzt kommt",
    text: "Ein Neuanfang beginnt selten mit einem großen Plan. Meistens beginnt er mit einer Frage, die man nicht mehr wegschieben kann.",
    tabs: [
      { t: "Zukunfts-Ich", s: "Sprich mit dir in 10 Jahren", tab: "zukunftsich" },
      { t: "Ziele", s: "Deine Richtung, dein Nordstern", tab: "ziele" },
      { t: "Mondrituale", s: "Im zunehmenden Mond beginnen", tab: "mondrituale" },
    ],
  },
  {
    id: "geld", icon: "🪙", t: "Geld & Fülle", farbe: "#C9963C",
    was: "Dein Verhältnis zu Geld",
    text: "Wie du über Geld denkst, hast du meistens früh gelernt und nie überprüft. Hier geht es nicht ums Rechnen, sondern um die Sätze dahinter.",
    tabs: [
      { t: "Fülle im Tagebuch", s: "Du darfst empfangen", tab: "tagebuch" },
      { t: "Ziele", s: "Was willst du dir ermöglichen?", tab: "ziele" },
      { t: "Intuitions-Training", s: "Entscheiden lernen", tab: "intuition" },
    ],
  },
  {
    id: "loslassen", icon: "🍃", t: "Loslassen", farbe: "#6E8B6A",
    was: "Was nicht mehr dir gehört",
    text: "Manches trägst du mit, weil du es nie irgendwo abgelegt hast. Loslassen ist kein Gefühl, das kommt — es ist eine Handlung, die man macht.",
    tabs: [
      { t: "Loslassen", s: "Ablegen & freigeben", tab: "loslassen" },
      { t: "Mondrituale", s: "Im abnehmenden Mond abgeben", tab: "mondrituale" },
      { t: "Reise „Loslassen lernen“", s: "21 Tage sanftes Loslassen", tab: "reisen" },
    ],
  },
  {
    id: "unruhe", icon: "🌊", t: "Unruhe & Anspannung", farbe: "#5C7A99", krise: true,
    was: "Wenn es innen zu laut ist",
    text: "Unruhe sitzt im Körper, bevor sie im Kopf ankommt. Deshalb helfen hier Atem und Bewegung schneller als Nachdenken.",
    tabs: [
      { t: "Meditation", s: "Atemübung & geführte Meditationen", tab: "meditation" },
      { t: "Achtsamkeit", s: "Atem, Sinne & Körperreise", tab: "achtsamkeit" },
      { t: "Qigong", s: "Die Acht Brokate · zehn ruhige Minuten", tab: "qigong" },
      { t: "Podcast", s: "Impulse zum Hören", tab: "podcast" },
    ],
  },
  {
    id: "betrug", icon: "🔒", t: "Nach dem Betrug", farbe: "#3A2A22", krise: true,
    was: "Scham, Vertrauen, weitermachen",
    text: "Wer online betrogen wurde — beim Geld oder beim Gefühl — schämt sich oft mehr, als er wütend ist. Die Scham gehört nicht dir. Sie gehört dem, der sie verursacht hat.",
    tabs: [
      { t: "Schattenspiegel", s: "Aufschreiben, was du niemandem erzählst", tab: "schatten" },
      { t: "Freundinnen-Kreis", s: "Es einmal aussprechen", tab: "kreis" },
    ],
    hilfen: [
      { t: "Verbraucherzentrale", s: "Beratung zu Online-Betrug", url: "https://www.verbraucherzentrale.de" },
      { t: "Polizei-Onlinewache", s: "Anzeige online erstatten", url: "https://www.polizei.de" },
      { t: "WEISSER RING", s: "Hilfe für Betroffene · 116 006", url: "https://weisser-ring.de" },
    ],
    rechtshinweis: "Das ist keine Rechtsberatung. Für rechtliche Schritte wende dich an die Stellen oben oder an eine Anwältin.",
  },
];

export function ThemaScreen({ id, go, bindung }) {
  const th = THEMEN.find((x) => x.id === id) || THEMEN[0];
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Thema</Eyebrow>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 34 }}>{th.icon}</div>
        <div>
          <H size={24} style={{ color: th.farbe }}>{th.t}</H>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>{th.was}</div>
        </div>
      </div>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.espresso, lineHeight: 1.65, margin: "0 0 20px" }}>
        {th.text}
      </p>

      <Eyebrow color={C.plum}>Das ist jetzt da für dich</Eyebrow>
      <div style={{ marginTop: 8, marginBottom: 20 }}>
        {th.tabs.map((x) => (
          <Card key={x.t} onClick={() => go(x.tab)} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", padding: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{x.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{x.s}</div>
            </div>
            <div style={{ color: th.farbe, fontSize: 18 }}>›</div>
          </Card>
        ))}
      </div>

      {th.hilfen && (
        <>
          <Eyebrow color={C.plum}>Wo es Hilfe gibt</Eyebrow>
          <Card style={{ marginTop: 8, marginBottom: 8, background: C.beige }}>
            {th.hilfen.map((h) => (
              <a key={h.t} href={h.url} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                borderBottom: `1px solid ${C.line}`, textDecoration: "none",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700, color: C.espresso }}>{h.t}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>{h.s}</div>
                </div>
                <span style={{ color: C.gold, fontSize: 16 }}>↗</span>
              </a>
            ))}
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, lineHeight: 1.5, marginTop: 10, marginBottom: 0 }}>
              {th.rechtshinweis}
            </p>
          </Card>
        </>
      )}

      {/* Was die eigene Coachin zu diesem Thema anbietet — kommt aus ihrem Profil. */}
      <Eyebrow color={C.plum}>Von deiner Coachin</Eyebrow>
      <Card style={{ marginTop: 8, marginBottom: 16, background: C.goldPale, border: `1px solid ${C.goldSoft}` }}>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: 0 }}>
          {bindung?.coach_name
            ? `${bindung.coach_name} hat zu „${th.t}“ noch nichts hinterlegt. Sobald sie etwas einstellt, findest du es hier.`
            : "Sobald du mit einer Coachin verbunden bist, findest du hier ihre Impulse und Angebote zu diesem Thema."}
        </p>
        {!bindung?.coach_name && (
          <div style={{ marginTop: 10 }}>
            <Btn small onClick={() => go("coaching")}>Coachin finden</Btn>
          </div>
        )}
      </Card>

      {th.krise && (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, lineHeight: 1.6, opacity: 0.85 }}>
          Wenn es dir gerade sehr schlecht geht: Die TelefonSeelsorge ist rund um die Uhr erreichbar,
          kostenfrei unter <b>0800 111 0 111</b> und <b>0800 111 0 222</b>. Diese App ersetzt keine
          Therapie und keine ärztliche Behandlung.
        </p>
      )}
    </div>
  );
}

export const WOCHEN_GRUPPEN = ["Seele & Rituale", "Wachsen & Spielen"];

export const WOCHEN_BONUS = 20;

/* Die Wochentür: eine Übung pro Woche, für alle gleich. Sie wird an drei
   Stellen gebraucht — oben auf "Heute", im Menü und in der Gruppe selbst. */
export function wochenTuer() {
  const pool = MEHR_GRUPPEN.filter((g) => WOCHEN_GRUPPEN.includes(g.g)).flatMap((g) => g.items);
  if (!pool.length) return { pool: [], item: null, index: 0 };
  const w = wochenNummer();
  const i = ((w % pool.length) + pool.length) % pool.length;
  return { pool, item: pool[i], index: i };
}

export function WochenChallenge({ go }) {
  const jetzt = useSekundenTakt(true);
  const { item } = wochenTuer();
  if (!item) return null;
  const countdown = restZeit(naechsterMontag(jetzt).getTime(), jetzt);
  return (
    <button
      onClick={() => go(item.tab)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 44,
        padding: "8px 10px", marginBottom: 8, cursor: "pointer", textAlign: "left",
        background: C.card, border: `1px solid ${C.goldSoft}`, borderRadius: 12,
      }}
    >
      <span style={{ fontSize: 16 }}>{item.icon}</span>
      <span style={{ flex: 1, minWidth: 0, fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>
        Dein Ritual diese Woche — <b style={{ fontWeight: 700 }}>{item.t}</b>
      </span>
      <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5, color: C.gold, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {countdown}
      </span>
      <span style={{ color: C.gold, fontSize: 16 }}>›</span>
    </button>
  );
}

export const MEHR_GRUPPEN = [
    { g: "Deine Coachin", items: [
      { icon: "🌸", t: "Coaching", s: "Deine Begleitung, Pakete & Fortschritt", tab: "coaching" },
      { icon: "💬", t: "Coach-Chat", s: "Schreib ihr, wenn dich etwas bewegt", tab: "coach" },
      { icon: "📅", t: "Termin buchen", s: "Zeit für dich", tab: "buchen" },
      { icon: "📁", t: "Mediathek", s: "Materialien deiner Coachin & deine Dateien", tab: "media" },
    ] },
    { g: "Deine Vorlagen", items: [
      { icon: "🎓", t: "Deine Kurse", s: "Kurse, die du gewählt hast", tab: "kurse" },
      { icon: "📓", t: "Tagebuch & Vorlagen", s: "Deine Schreib-Vorlagen an einem Ort", tab: "tagebuch" },
    ] },
    { g: "Fortschritt & Challenge", items: [
      { icon: "🏆", t: "Challenges & Ziele", s: "Aufgaben, Meilensteine & deine Ziele", tab: "aufgaben" },
      { icon: "✨", t: "Abzeichen & Statistiken", s: "Lichtpunkte, Abzeichen und deine Zahlen", tab: "__punkte" },
      { icon: "📊", t: "Mein Fortschritt", s: "Wohlbefindens-Index & Trend", tab: "fortschritt" },
    ] },
    { g: "Üben & Ankommen", items: [
      { icon: "🌿", t: "Qigong", s: "Die Acht Brokate · zehn ruhige Minuten", tab: "qigong" },
      { icon: "🖐️", t: "Achtsamkeit", s: "Atem, Sinne & Körperreise für zwischendurch", tab: "achtsamkeit" },
      { icon: "🤍", t: "Dankbarkeit", s: "Drei Dinge am Tag · dein Rückblick", tab: "dankbarkeit" },
      { icon: "🕊️", t: "Loslassen", s: "Was darf gehen? · ablegen & freigeben", tab: "loslassen" },
    ] },
    { g: "Seele & Rituale", items: [
      { icon: "🦋", t: "Archetypen-Test", s: "Welche innere Kraft leitet dich?", tab: "archetyp" },
      { icon: "🕰️", t: "Zukunfts-Ich", s: "Sprich mit dir in 10 Jahren", tab: "zukunftsich" },
      { icon: "🖤", t: "Schattenspiegel", s: "Schreiben & verbrennen — nichts wird gespeichert", tab: "schatten" },
      { icon: "🕯️", t: "Gemeinsame Flamme", s: "Das Licht, das uns allen gehört", tab: "flamme" },
      { icon: "🌕", t: "Mondrituale", s: "Loslassen & manifestieren im Mondrhythmus", tab: "mondrituale" },
      { icon: "🎡", t: "Jahreskreis", s: "Die acht Feste des Jahres", tab: "jahreskreis" },
      { icon: "🃏", t: "Wochen-Orakel", s: "Die Karte deiner Coachin · jede Woche neu", tab: "wochenorakel" },
      { icon: "🕊️", t: "Ritual der Leere", s: "24 Stunden ohne App — bewusst", tab: "leere" },
    ] },
    { g: "Wachsen & Spielen", items: [
      { icon: "🛤️", t: "Transformations-Reisen", s: "21 & 40 Tage zu einem Thema", tab: "reisen" },
      { icon: "🔮", t: "Intuitions-Training", s: "Trainiere dein Gefühl · Trefferquote", tab: "intuition" },
      { icon: "📖", t: "Jahres-Rückblick", s: "Dein Jahr in Karten & Worten", tab: "rueckblick" },
    ] },
    { g: "Community", items: [
      { icon: "💗", t: "Frauen unterstützen Frauen", s: "Community-Feed · teilen & stärken", tab: "community" },
      { icon: "👯‍♀️", t: "Freundinnen-Kreis", s: "Dein privater Kreis · gemeinsam 21 Tage", tab: "kreis" },
    ] },
    { g: "Konto", items: [
      { icon: "👤", t: "Profil & Einstellungen", s: "Mein Bereich, Benachrichtigung, Abo, DSGVO", tab: "profil" },
      { icon: "💼", t: "Mein Office", s: "Deine Marke, Angebote & Rechnungen", tab: "office" },
    ] },
];

export function Mehr({ go, addPunkte, openThema, bindung, openPunkte }) {
  const [auf, setAuf] = useState("Deine Coachin");
  const gruppen = MEHR_GRUPPEN;
  // Alle Übungen der Wochen-Gruppen in einer Reihe — daraus rotiert die offene Tür.
  const wochenPool = gruppen.filter((gr) => WOCHEN_GRUPPEN.includes(gr.g)).flatMap((gr) => gr.items);
  const woche = wochenNummer();
  const offenIdx = wochenPool.length ? ((woche % wochenPool.length) + wochenPool.length) % wochenPool.length : 0;
  const offenTab = wochenPool[offenIdx]?.tab;
  const jetzt = useSekundenTakt(true);
  const countdown = restZeit(naechsterMontag(jetzt).getTime(), jetzt);

  const [belohnt, setBelohnt] = useState(() => {
    try { return localStorage.getItem("s2g_woche_bonus"); } catch { return null; }
  });
  const schonBelohnt = belohnt === String(woche);
  const [hinweis, setHinweis] = useState(null);

  // Wann öffnet sich diese Tür? 1 = nächste Woche, 2 = übernächste …
  const wartetWochen = (tab) => {
    const i = wochenPool.findIndex((p) => p.tab === tab);
    if (i < 0) return 0;
    return (i - offenIdx + wochenPool.length) % wochenPool.length;
  };
  const oeffnetAm = (wochen) => {
    const d = naechsterMontag(jetzt);
    d.setDate(d.getDate() + (wochen - 1) * 7);
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  };

  const antippen = (x, gesperrt, offen) => {
    if (gesperrt) {
      const w = wartetWochen(x.tab);
      setHinweis({
        tab: x.tab,
        text: w === 1
          ? `„${x.t}" öffnet sich am Montag, ${oeffnetAm(1)}.`
          : `„${x.t}" ist in ${w} Wochen dran — ab ${oeffnetAm(w)}.`,
      });
      return;
    }
    if (offen && !schonBelohnt) {
      try { localStorage.setItem("s2g_woche_bonus", String(woche)); } catch {}
      setBelohnt(String(woche));
      addPunkte?.(WOCHEN_BONUS, "Deine Woche geöffnet");
    }
    if (x.tab === "__punkte") { openPunkte?.(); return; }
    go(x.tab);
  };

  return (
    <div style={{ padding: "26px 20px" }}>
      <style>{`@keyframes wocheGlanz { 0%,100% { box-shadow: 0 4px 16px rgba(201,150,60,.22); } 50% { box-shadow: 0 6px 26px rgba(201,150,60,.5); } }`}</style>
      <Eyebrow>Mehr</Eyebrow>

      {/* Was die Coachinnen anbieten steht vor dem eigenen Werkzeugkasten —
          das ist der Grund, warum es die Plattform gibt. */}
      <H size={25} style={{ marginBottom: 10 }}>Was unsere Coachinnen anbieten</H>
      <Card onClick={() => go("kurse")} style={{ marginBottom: 24, display: "flex", gap: 13, alignItems: "center", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})`, border: `1px solid ${C.goldSoft}` }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎓</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>
            {bindung?.coach_name || "Kurse, Pakete & Retreats"}
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>
            {bindung?.coach_name
              ? "Kurse, Pakete und Retreats deiner Coachin"
              : "Verbinde dich mit einer Coachin, dann steht hier ihr Angebot"}
          </div>
        </div>
        <span style={{ color: C.gold, fontSize: 20 }}>›</span>
      </Card>

      <H size={25} style={{ marginBottom: 6 }}>Themen & Bereiche</H>

      {/* Themen: nach dem sortiert, was gerade los ist — nicht nach Funktion. */}
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5, margin: "0 0 12px" }}>
        Was beschäftigt dich gerade?
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {THEMEN.map((th) => (
          <button key={th.id} onClick={() => openThema?.(th.id)} style={{
            display: "flex", alignItems: "center", gap: 7, minHeight: 40,
            padding: "9px 13px", borderRadius: 20, cursor: "pointer",
            border: `1.5px solid ${C.line}`, background: C.card,
            fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, color: C.espresso,
          }}>
            <span style={{ fontSize: 15 }}>{th.icon}</span>{th.t}
          </button>
        ))}
      </div>
      {gruppen.map((gr) => {
        const rhythmus = WOCHEN_GRUPPEN.includes(gr.g);
        const ersterBlock = rhythmus && gr.g === gruppen.find((g) => WOCHEN_GRUPPEN.includes(g.g))?.g;
        return (
        <div key={gr.g} style={{ marginBottom: 8, borderTop: `1px solid ${C.line}` }}>
          <button
            onClick={() => setAuf(auf === gr.g ? null : gr.g)}
            aria-expanded={auf === gr.g}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 48,
              padding: "13px 2px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 14.5, fontWeight: 700, color: C.espresso }}>{gr.g}</span>
            {rhythmus && auf !== gr.g && wochenPool[offenIdx] && (
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.gold, textAlign: "right", lineHeight: 1.3 }}>
                {wochenPool[offenIdx].t}
                <br />
                <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontVariantNumeric: "tabular-nums" }}>{countdown}</span>
              </span>
            )}
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.mut }}>{gr.items.length}</span>
            <span style={{ color: C.mut, fontSize: 12, transform: auf === gr.g ? "rotate(180deg)" : "none", transition: "transform .2s" }}>⌄</span>
          </button>
          {auf === gr.g && (<>
          {rhythmus && !ersterBlock && (
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.75, margin: "8px 0 2px" }}>
              Gehört zum selben Wochen-Rhythmus.
            </div>
          )}
          {ersterBlock && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              margin: "8px 0 10px", padding: "9px 12px", borderRadius: 12,
              background: C.goldPale, border: `1px solid ${C.line}`,
            }}>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, lineHeight: 1.5 }}>
                Jede Woche öffnet sich <b>eine</b> Tür. Diese Woche: <b style={{ color: C.plum }}>{wochenPool[offenIdx]?.t}</b>
              </span>
              <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, color: C.gold, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {countdown}
              </span>
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            {gr.items.map((x) => {
              const offen = rhythmus && x.tab === offenTab;
              const gesperrt = rhythmus && !offen;
              return (
              <div key={x.t}>
                <Card
                  onClick={() => antippen(x, gesperrt, offen)}
                  style={{
                    marginBottom: hinweis?.tab === x.tab ? 4 : 10, display: "flex", gap: 14, alignItems: "center",
                    opacity: gesperrt ? 0.42 : 1,
                    border: offen ? `2px solid ${C.gold}` : `1px solid ${C.line}`,
                    background: offen ? `linear-gradient(135deg, ${C.goldPale}, ${C.card})` : C.card,
                    animation: offen ? "wocheGlanz 3.2s ease-in-out infinite" : "none",
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, background: offen ? C.card : C.beige,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0,
                    filter: gesperrt ? "grayscale(.75)" : "none",
                  }}>{x.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: C.espresso }}>{x.t}</div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>{x.s}</div>
                    {offen && (
                      <div style={{
                        display: "inline-block", marginTop: 7, padding: "3px 9px", borderRadius: 20,
                        background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff",
                        fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700,
                      }}>
                        {schonBelohnt ? `✓ +${WOCHEN_BONUS} geholt` : `Jetzt offen · +${WOCHEN_BONUS} ✨`}
                      </div>
                    )}
                  </div>
                  {offen ? (
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, color: C.ink, opacity: 0.75 }}>noch offen</div>
                      <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, color: C.gold, fontVariantNumeric: "tabular-nums" }}>{countdown}</div>
                    </div>
                  ) : gesperrt ? (
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15 }}>🔒</div>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, whiteSpace: "nowrap" }}>
                        {wartetWochen(x.tab) === 1 ? "nächste Woche" : `in ${wartetWochen(x.tab)} Wochen`}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: C.gold, fontSize: 20 }}>›</div>
                  )}
                </Card>
                {hinweis?.tab === x.tab && (
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.plum, margin: "0 0 10px 6px", animation: "fadeUp .3s ease" }}>
                    {hinweis.text}
                  </div>
                )}
              </div>
            );})}
          </div>
          </>)}
        </div>
      );})}
    </div>
  );
}

