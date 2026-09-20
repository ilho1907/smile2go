// zeit.js — Zeit & Kalender: Tagesindex, Kalenderwoche, Mondphase, Wochenrhythmus.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { useEffect, useState } from "react";

export const dayIndex = () => {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
};

/* Besondere Tage & Feiertage (Deutschland/Bayern 2026) */
export const BESONDERE_TAGE = [
  ["1.1.", "Neujahr 🎆"], ["6.1.", "Heilige Drei Könige (BY)"], ["14.2.", "Valentinstag 💕"],
  ["8.3.", "Internationaler Frauentag 🌷"], ["3.4.", "Karfreitag"], ["5.4.", "Ostersonntag 🐣"],
  ["6.4.", "Ostermontag"], ["1.5.", "Tag der Arbeit"], ["10.5.", "Muttertag 💐"],
  ["14.5.", "Christi Himmelfahrt"], ["24.5.", "Pfingstsonntag"], ["25.5.", "Pfingstmontag"],
  ["4.6.", "Fronleichnam (BY)"], ["21.6.", "Sommeranfang ☀️"], ["15.8.", "Mariä Himmelfahrt (BY)"],
  ["3.10.", "Tag der Deutschen Einheit 🇩🇪"], ["1.11.", "Allerheiligen (BY)"], ["6.12.", "Nikolaus 🎅"],
  ["24.12.", "Heiligabend 🎄"], ["25.12.", "1. Weihnachtstag"], ["26.12.", "2. Weihnachtstag"],
  ["31.12.", "Silvester ✨"],
];

export const besondererTag = () => {
  const jetzt = new Date();
  const jahr = jetzt.getFullYear();
  const liste = BESONDERE_TAGE.map(([d, n]) => {
    const [tag, monat] = d.split(".").map(Number);
    return { date: new Date(jahr, monat - 1, tag), n };
  });
  const heute = liste.find((x) => x.date.toDateString() === jetzt.toDateString());
  const zukunft = liste.filter((x) => x.date > jetzt).sort((a, b) => a.date - b.date)[0];
  const inTagen = zukunft ? Math.ceil((zukunft.date - jetzt) / 864e5) : null;
  return { heute, naechster: zukunft, inTagen };
};

export const kalenderwoche = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - start) / 864e5 + start.getDay() + 1) / 7);
};

/* Mondphase — lokal berechnet (synodischer Monat 29,53 Tage) */
export const mondphase = () => {
  const synodic = 29.53058867;
  const ref = Date.UTC(2000, 0, 6, 18, 14); // Neumond 06.01.2000
  const days = (Date.now() - ref) / 864e5;
  const p = ((days % synodic) + synodic) % synodic;
  const idx = Math.floor((p / synodic) * 8 + 0.5) % 8;
  const phasen = [
    { e: "🌑", n: "Neumond", imp: "Zeit für Neuanfänge — setze heute eine Intention." },
    { e: "🌒", n: "Zunehmende Sichel", imp: "Erste Schritte wagen. Dein Vorhaben nimmt Form an." },
    { e: "🌓", n: "Erstes Viertel", imp: "Dranbleiben — Hindernisse sind Wegweiser, keine Stoppschilder." },
    { e: "🌔", n: "Zunehmender Mond", imp: "Deine Energie wächst. Nutze den Schwung." },
    { e: "🌕", n: "Vollmond", imp: "Zeit der Fülle und Klarheit. Was darfst du loslassen?" },
    { e: "🌖", n: "Abnehmender Mond", imp: "Dankbarkeit & Ernte. Würdige, was du geschafft hast." },
    { e: "🌗", n: "Letztes Viertel", imp: "Loslassen und vergeben — mach Raum für Neues." },
    { e: "🌘", n: "Abnehmende Sichel", imp: "Ruhe & Rückzug. Tanke Kraft für den nächsten Zyklus." },
  ];
  return phasen[idx];
};

export function wochenKey() {
  const d = new Date(); const j = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${Math.ceil(((d - j) / 86400000 + j.getDay() + 1) / 7)}`;
}

export const montagVon = (d) => {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));   // Mo = 0
  return m;
};

export const wochenNummer = (jetzt = Date.now()) =>
  Math.round((montagVon(jetzt) - montagVon(new Date(2026, 0, 5))) / 604800000);

export const naechsterMontag = (jetzt = Date.now()) => {
  const m = montagVon(jetzt);
  m.setDate(m.getDate() + 7);
  return m;
};

export const restZeit = (ziel, jetzt) => {
  let ms = Math.max(0, ziel - jetzt);
  const t = Math.floor(ms / 86400000); ms -= t * 86400000;
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const m = Math.floor(ms / 60000); ms -= m * 60000;
  const sek = Math.floor(ms / 1000);
  const zz = (n) => String(n).padStart(2, "0");
  return (t > 0 ? t + " T · " : "") + zz(h) + ":" + zz(m) + ":" + zz(sek);
};

/* Sekundengenauer Takt — nur dort, wo wirklich ein Countdown läuft. */
export function useSekundenTakt(aktiv = true) {
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    if (!aktiv) return;
    const t = setInterval(() => setJetzt(Date.now()), 1000);
    return () => clearInterval(t);
  }, [aktiv]);
  return jetzt;
}

