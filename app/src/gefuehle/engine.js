import { EMOTIONS } from "./emotions.js";
import { INTERVENTIONS } from "./interventions.js";
const RULES = [
  { kw: ["allein", "einsam", "niemand", "ignoriert", "ausgeschlossen", "verlassen"], dimension: "verbundenheit", direction: "frustration", nvc: "N\xE4he", emotions: ["einsam", "traurig"] },
  { kw: ["kontrolle", "gedr\xE4ngt", "muss ich", "zwingt", "chef", "vorgeschrieben", "bevormundet"], dimension: "autonomie", direction: "frustration", nvc: "Freiraum", emotions: ["druck", "wuetend"] },
  { kw: ["versagt", "nicht geschafft", "fehler", "incompetent", "dumm", "blamiert", "\xFCberfordert", "zu viel"], dimension: "kompetenz", direction: "frustration", nvc: "Unterst\xFCtzung", emotions: ["ueberfordert", "niedergeschlagen"] },
  { kw: ["dankbar", "gelungen", "geschafft", "stolz", "gut gelaufen"], dimension: "kompetenz", direction: "erfuellung", emotions: ["stolz", "zufrieden"] },
  { kw: ["unterbrochen", "nicht geh\xF6rt", "\xFCbersehen", "ungerecht"], dimension: "verbundenheit", direction: "frustration", nvc: "Respekt", emotions: ["veraergert", "verletzt"] },
  { kw: ["sorge", "angst", "panik", "herzrasen", "atemnot"], nvc: "Sicherheit", emotions: ["aengstlich", "besorgt"] },
  { kw: ["m\xFCde", "ersch\xF6pft", "keine energie", "ausgebrannt", "schlaf"], nvc: "Ruhe", emotions: ["muede", "erschoepft"] },
  { kw: ["konflikt", "streit", "diskussion", "auseinandersetzung"], nvc: "Klarheit", emotions: ["angespannt"] },
  { kw: ["unsicher", "wei\xDF nicht", "unentschlossen", "hin und her"], nvc: "Klarheit", emotions: ["nervoes"] },
  { kw: ["verbunden", "zusammen", "gemeinsam", "umarmung", "gespr\xE4ch gut"], dimension: "verbundenheit", direction: "erfuellung", emotions: ["verbunden", "geborgen"] },
  { kw: ["entscheiden d\xFCrfen", "selbst bestimmt", "frei gew\xE4hlt"], dimension: "autonomie", direction: "erfuellung", emotions: ["zufrieden"] },
  { kw: ["wertgesch\xE4tzt", "anerkannt", "gelobt"], nvc: "Wertsch\xE4tzung", emotions: ["dankbar"] }
];
const EMOTION_NEEDS = {
  // — Rot (hohe Energie, unangenehm) —
  wuetend: { sdt: ["autonomie", "frustration"], hint: "etwas lief gegen deinen Willen", nvc: ["Grenzen", "Respekt", "Fairness"] },
  gereizt: { sdt: ["autonomie", "frustration"], hint: "zu viel von au\xDFen, zu wenig eigener Raum", nvc: ["Freiraum", "Ruhe", "Entlastung"] },
  veraergert: { sdt: ["autonomie", "frustration"], hint: "eine deiner Grenzen wurde \xFCbertreten", nvc: ["Grenzen", "Fairness", "Respekt"] },
  empoert: { sdt: ["autonomie", "frustration"], hint: "ein Wert von dir wurde verletzt", nvc: ["Gerechtigkeit", "Respekt", "Integrit\xE4t"] },
  druck: { sdt: ["autonomie", "frustration"], hint: "von au\xDFen bestimmt statt selbst gew\xE4hlt", nvc: ["Freiraum", "Selbstbestimmung", "Entlastung"] },
  aengstlich: { nvc: ["Sicherheit", "Vorhersehbarkeit", "Schutz"] },
  besorgt: { nvc: ["Sicherheit", "Vorhersehbarkeit", "Verl\xE4sslichkeit"] },
  panisch: { nvc: ["Sicherheit", "Schutz", "Halt"] },
  nervoes: { nvc: ["Klarheit", "Sicherheit", "Verl\xE4sslichkeit"] },
  gestresst: { nvc: ["Entlastung", "Ruhe", "Klarheit"] },
  ueberfordert: { sdt: ["kompetenz", "frustration"], hint: "mehr, als du gerade tragen kannst", nvc: ["Entlastung", "Unterst\xFCtzung", "Struktur"] },
  frustriert: { sdt: ["kompetenz", "frustration"], hint: "du kommst nicht voran", nvc: ["Wirksamkeit", "Unterst\xFCtzung", "Geduld"] },
  ungeduldig: { nvc: ["Klarheit", "Fortschritt", "Freiraum"] },
  eifersuechtig: { sdt: ["verbundenheit", "frustration"], hint: "Angst, deinen Platz zu verlieren", nvc: ["N\xE4he", "Vertrauen", "Sicherheit"] },
  angespannt: { nvc: ["Entspannung", "Ruhe", "Entlastung"] },
  rastlos: { nvc: ["Ruhe", "Halt", "Orientierung"] },
  erregt_neg: { nvc: ["Ruhe", "Klarheit", "Stabilit\xE4t"] },
  krank: { nvc: ["Ruhe", "F\xFCrsorge", "Erholung"] },
  // — Gelb (hohe Energie, angenehm) —
  begeistert: { sdt: ["kompetenz", "erfuellung"], hint: "etwas tr\xE4gt dich gerade", nvc: ["Leichtigkeit", "Kreativit\xE4t", "Sinn"] },
  energiegeladen: { sdt: ["kompetenz", "erfuellung"], hint: "voller Energie", nvc: ["Bewegung", "Herausforderung", "Wirksamkeit"] },
  motiviert: { sdt: ["kompetenz", "erfuellung"], hint: "du willst etwas bewegen", nvc: ["Wachstum", "Wirksamkeit", "Sinn"] },
  stolz: { sdt: ["kompetenz", "erfuellung"], hint: "du hast etwas geschafft", nvc: ["Wertsch\xE4tzung", "Anerkennung", "Sichtbarkeit"] },
  aufgeregt: { nvc: ["Leichtigkeit", "Spiel", "Klarheit"] },
  inspiriert: { sdt: ["kompetenz", "erfuellung"], hint: "neue Ideen flie\xDFen", nvc: ["Kreativit\xE4t", "Sinn", "Wachstum"] },
  optimistisch: { nvc: ["Hoffnung", "Vertrauen", "Sicherheit"] },
  lebhaft: { nvc: ["Bewegung", "Spiel", "Leichtigkeit"] },
  euphorisch: { nvc: ["Freude", "Gemeinschaft", "Leichtigkeit"] },
  mutig: { sdt: ["autonomie", "erfuellung"], hint: "du gehst trotzdem", nvc: ["Selbstbestimmung", "Vertrauen", "Wachstum"] },
  verspielt: { nvc: ["Spiel", "Leichtigkeit", "Humor"] },
  neugierig: { sdt: ["kompetenz", "erfuellung"], hint: "du willst entdecken", nvc: ["Lernen", "Entdeckung", "Wachstum"] },
  freudig: { nvc: ["Freude", "Leichtigkeit", "N\xE4he"] },
  tatendurstig: { sdt: ["kompetenz", "erfuellung"], hint: "voller Tatendrang", nvc: ["Wirksamkeit", "Herausforderung", "Bewegung"] },
  hoffnungsvoll: { nvc: ["Hoffnung", "Vertrauen", "Klarheit"] },
  uebergluecklich: { nvc: ["Freude", "Gemeinschaft", "Leichtigkeit"] },
  // — Blau (niedrige Energie, unangenehm) —
  traurig: { sdt: ["verbundenheit", "frustration"], hint: "ein Verlust oder Abschied", nvc: ["Trost", "Verstandenwerden", "N\xE4he"] },
  muede: { nvc: ["Ruhe", "Erholung", "Schlaf"] },
  einsam: { sdt: ["verbundenheit", "frustration"], hint: "niemand, der dich wirklich sieht", nvc: ["N\xE4he", "Zugeh\xF6rigkeit", "Gemeinschaft"] },
  enttaeuscht: { sdt: ["verbundenheit", "frustration"], hint: "eine Erwartung ist geplatzt", nvc: ["Klarheit", "Verl\xE4sslichkeit", "Ehrlichkeit"] },
  niedergeschlagen: { sdt: ["kompetenz", "frustration"], hint: "es gelingt gerade nicht", nvc: ["Unterst\xFCtzung", "Trost", "Ermutigung"] },
  leer: { nvc: ["Sinn", "N\xE4he", "Leichtigkeit"] },
  erschoepft: { nvc: ["Erholung", "Ruhe", "Stabilit\xE4t"] },
  hoffnungslos: { nvc: ["Hoffnung", "Unterst\xFCtzung", "Halt"] },
  gelangweilt: { nvc: ["Anregung", "Sinn", "Herausforderung"] },
  verletzt: { sdt: ["verbundenheit", "frustration"], hint: "jemand hat dich getroffen", nvc: ["Trost", "Respekt", "Verstandenwerden"] },
  schuldig: { nvc: ["Vergebung", "Verstandenwerden", "Wiedergutmachung"] },
  beschaemt: { sdt: ["kompetenz", "frustration"], hint: "du f\xFChlst dich blo\xDFgestellt", nvc: ["Wertsch\xE4tzung", "Akzeptanz", "Verstandenwerden"] },
  kraftlos: { nvc: ["Ruhe", "Unterst\xFCtzung", "Erholung"] },
  melancholisch: { nvc: ["Trost", "N\xE4he", "Leichtigkeit"] },
  kraenklich: { nvc: ["F\xFCrsorge", "Ruhe", "Erholung"] },
  mutlos: { sdt: ["kompetenz", "frustration"], hint: "du traust es dir nicht zu", nvc: ["Ermutigung", "Unterst\xFCtzung", "Vertrauen"] },
  verloren: { sdt: ["autonomie", "frustration"], hint: "keine Richtung, keine Wahl sichtbar", nvc: ["Orientierung", "Klarheit", "Halt"] },
  ausgeschlossen: { sdt: ["verbundenheit", "frustration"], hint: "nicht dazugeh\xF6ren d\xFCrfen", nvc: ["Zugeh\xF6rigkeit", "Gemeinschaft", "Gleichw\xFCrdigkeit"] },
  // — Grün (niedrige Energie, angenehm) —
  ruhig: { nvc: ["Ruhe", "Stabilit\xE4t"] },
  entspannt: { nvc: ["Ruhe", "Leichtigkeit"] },
  zufrieden: { sdt: ["autonomie", "erfuellung"], hint: "es darf so sein", nvc: ["Stabilit\xE4t", "Harmonie"] },
  geborgen: { sdt: ["verbundenheit", "erfuellung"], hint: "gehalten und sicher", nvc: ["Sicherheit", "N\xE4he"] },
  geborgenheit: { sdt: ["verbundenheit", "erfuellung"], hint: "gehalten und sicher", nvc: ["Sicherheit", "N\xE4he", "W\xE4rme"] },
  dankbar: { sdt: ["verbundenheit", "erfuellung"], hint: "verbunden mit dem, was tr\xE4gt", nvc: ["N\xE4he", "Wertsch\xE4tzung"] },
  ausgeglichen: { nvc: ["Harmonie", "Stabilit\xE4t", "Ruhe"] },
  gelassen: { nvc: ["Ruhe", "Vertrauen"] },
  friedlich: { nvc: ["Harmonie", "Ruhe"] },
  getroestet: { sdt: ["verbundenheit", "erfuellung"], hint: "jemand war f\xFCr dich da", nvc: ["N\xE4he", "Trost"] },
  sorgenfrei: { nvc: ["Sicherheit", "Leichtigkeit"] },
  erholt: { nvc: ["Erholung", "Ruhe"] },
  verbunden: { sdt: ["verbundenheit", "erfuellung"], hint: "nah an anderen", nvc: ["N\xE4he", "Zugeh\xF6rigkeit"] },
  gesegnet: { nvc: ["Sinn", "Harmonie"] },
  gemuetlich: { nvc: ["W\xE4rme", "Ruhe"] },
  still_gluecklich: { nvc: ["Freude", "Harmonie", "Ruhe"] }
};
const RED_SIGNALS = [
  "suizid",
  "umbringen",
  "nicht mehr leben",
  "selbstverletz",
  "sterben wollen",
  "mein leben beenden",
  "keinen ausweg",
  "besser tot",
  "mich t\xF6ten",
  "jemanden t\xF6ten",
  "ritzen",
  "endg\xFCltig weg"
];
const AMBER_SIGNALS = [
  "hoffnungslos",
  "ausweglos",
  "panikattacke",
  "nicht mehr aushalten",
  "alles sinnlos",
  "nichts mehr sp\xFCren",
  "aufgeben",
  "am ende"
];
function findQuote(note, keywords) {
  const lower = note.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx >= 0) {
      const start = Math.max(0, note.lastIndexOf(" ", Math.max(0, idx - 20)));
      const end = Math.min(note.length, idx + kw.length + 30);
      return note.slice(start, end).trim();
    }
  }
  return "";
}
function screenSafety(note) {
  const lower = note.toLowerCase();
  const red = RED_SIGNALS.filter((s) => lower.includes(s));
  if (red.length > 0) return { level: "red", signals: red };
  const amber = AMBER_SIGNALS.filter((s) => lower.includes(s));
  if (amber.length > 0) return { level: "amber", signals: amber };
  return { level: "green", signals: [] };
}
function analyzeNeeds(checkin) {
  const note = checkin.note || "";
  const sdt = [];
  const nvc = [];
  const lower = note.toLowerCase();
  for (const rule of RULES) {
    const hits = rule.kw.filter((k) => lower.includes(k));
    if (hits.length === 0) continue;
    const quote = findQuote(note, rule.kw);
    if (!quote) continue;
    const confidence = hits.length >= 2 ? "hoch" : "mittel";
    if (rule.dimension && rule.direction) {
      const existing = sdt.find((c) => c.dimension === rule.dimension && c.direction === rule.direction);
      if (existing) {
        if (confidence === "hoch") existing.confidence = "hoch";
      } else {
        sdt.push({ framework: "sdt", dimension: rule.dimension, direction: rule.direction, confidence, evidenceQuote: quote });
      }
    }
    if (rule.nvc && !nvc.some((c) => c.need === rule.nvc)) {
      nvc.push({ framework: "nvc", need: rule.nvc, confidence: hits.length >= 2 ? "hoch" : "niedrig", evidenceQuote: quote });
    }
  }
  const sdtFromEmotions = sdt.length === 0;
  for (const emo of checkin.emotions) {
    const map = EMOTION_NEEDS[emo.id];
    if (!map) continue;
    const quote = `Gef\xFChl: ${emo.label}`;
    for (const need of map.nvc || []) {
      if (!nvc.some((c) => c.need === need)) {
        nvc.push({ framework: "nvc", need, confidence: "niedrig", evidenceQuote: quote });
      }
    }
    if (sdtFromEmotions && map.sdt) {
      const [dim, dir] = map.sdt;
      if (!sdt.some((c) => c.dimension === dim && c.direction === dir)) {
        sdt.push({ framework: "sdt", dimension: dim, direction: dir, confidence: "niedrig", evidenceQuote: quote, hint: map.hint });
      }
    }
  }
  if (sdt.length === 0 && checkin.contextTags.length > 0) {
    if (checkin.contextTags.includes("arbeit")) {
      sdt.push({ framework: "sdt", dimension: "autonomie", direction: "frustration", confidence: "niedrig", evidenceQuote: "Kontext: Arbeit" });
      nvc.push({ framework: "nvc", need: "Freiraum", confidence: "niedrig", evidenceQuote: "Kontext: Arbeit" });
    } else if (checkin.contextTags.includes("einsamkeit") || checkin.contextTags.includes("beziehung")) {
      sdt.push({ framework: "sdt", dimension: "verbundenheit", direction: "frustration", confidence: "niedrig", evidenceQuote: "Kontext: Beziehung/Einsamkeit" });
      nvc.push({ framework: "nvc", need: "N\xE4he", confidence: "niedrig", evidenceQuote: "Kontext: Beziehung/Einsamkeit" });
    }
  }
  return { sdt: sdt.slice(0, 3), nvc: nvc.slice(0, 3) };
}
function emotionHypotheses(checkin) {
  const note = (checkin.note || "").toLowerCase();
  const hyps = [];
  const already = new Set(checkin.emotions.map((e) => e.id));
  for (const rule of RULES) {
    if (!rule.emotions) continue;
    const hits = rule.kw.filter((k) => note.includes(k));
    if (hits.length === 0) continue;
    const quote = findQuote(checkin.note || "", rule.kw);
    for (const emoId of rule.emotions) {
      if (already.has(emoId) || hyps.some((h) => h.label === emoId)) continue;
      const word = EMOTIONS.find((e) => e.id === emoId);
      if (word) hyps.push({ label: word.label, confidence: hits.length >= 2 ? "hoch" : "mittel", evidenceQuote: quote });
    }
  }
  return hyps.slice(0, 3);
}
function routeInterventions(maxIntensity, goal, safety, sessions) {
  if (safety.level === "red") return [];
  const badIds = new Set(
    sessions.filter((s) => s.helpfulness === "nein").map((s) => s.interventionId)
  );
  const inRange = (i) => maxIntensity >= i.intensityRange[0] && maxIntensity <= i.intensityRange[1];
  if (safety.level === "amber" || maxIntensity >= 7) {
    const stab = INTERVENTIONS.filter(
      (i) => i.approach === "dbt" && inRange(i)
    );
    return [...stab.filter((i) => !badIds.has(i.id)), ...stab.filter((i) => badIds.has(i.id))].slice(0, 3);
  }
  const candidates = INTERVENTIONS.filter((i) => i.goals.includes(goal) && inRange(i));
  const fresh = candidates.filter((i) => !badIds.has(i.id));
  const ranked = [...fresh, ...candidates.filter((i) => badIds.has(i.id))];
  return ranked.slice(0, 3);
}
function maxIntensityOf(checkin) {
  return checkin.emotions.reduce((m, e) => Math.max(m, e.intensity), 0);
}
function clarifyingQuestion(sdt) {
  if (sdt.length === 0) return "Was w\xFCrde dir in diesem Moment am meisten helfen?";
  const top = sdt[0];
  if (top.dimension === "autonomie" && top.direction === "frustration") {
    return "Geht es eher darum, wieder selbst bestimmen zu k\xF6nnen \u2014 oder darum, nicht allein damit zu sein?";
  }
  if (top.dimension === "verbundenheit" && top.direction === "frustration") {
    return "Brauchst du gerade eher N\xE4he und Verstandenwerden \u2014 oder Klarheit in der Sache?";
  }
  if (top.dimension === "kompetenz" && top.direction === "frustration") {
    return "W\xFCrdest du lieber etwas in den Griff bekommen \u2014 oder erst einmal zur Ruhe kommen?";
  }
  return "Was davon trifft gerade am ehesten zu?";
}
function weeklyStats(checkins, sessions, days = 7) {
  const cutoff = Date.now() - days * 864e5;
  const recent = checkins.filter((c) => c.createdAt >= cutoff);
  const emotionCount = /* @__PURE__ */ new Map();
  const contextCount = /* @__PURE__ */ new Map();
  for (const c of recent) {
    for (const e of c.emotions) emotionCount.set(e.label, (emotionCount.get(e.label) || 0) + 1);
    for (const t of c.contextTags) contextCount.set(t, (contextCount.get(t) || 0) + 1);
  }
  const helpful = sessions.filter(
    (s) => s.startedAt >= cutoff && s.helpfulness === "ja"
  );
  const topEmotions = [...emotionCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topContexts = [...contextCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { recent, topEmotions, topContexts, helpfulCount: helpful.length, helpful };
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
export {
  analyzeNeeds,
  clarifyingQuestion,
  emotionHypotheses,
  fmtDate,
  fmtTime,
  maxIntensityOf,
  routeInterventions,
  screenSafety,
  weeklyStats
};
