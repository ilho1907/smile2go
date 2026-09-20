// inhalte.js — Redaktionelle Inhalte: Motivation, Sprüche, Affirmationen, Kurse, Tracks.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { dayIndex } from "../lib/zeit";

export const MOTIVATION = [
  // Selbstliebe
  { t: "Ich muss nicht erst heilen, leisten oder anders werden, um meiner eigenen Liebe würdig zu sein.", s: "· Selbstliebe" },
  { t: "Ich spreche heute mit mir so, wie ich mit einem Menschen sprechen würde, den ich von Herzen liebe.", s: "· Selbstliebe" },
  { t: "Auch die Seiten in mir, die ich lange abgelehnt habe, dürfen nach Hause kommen.", s: "· Selbstliebe" },
  { t: "Ich verlasse mich nicht länger selbst, nur um von anderen gewählt zu werden.", s: "· Selbstliebe" },
  { t: "Je tiefer ich mich selbst annehme, desto weniger muss ich mich im Außen beweisen.", s: "· Selbstliebe" },
  // Wachstum
  { t: "Wachstum bedeutet nicht, dass mit meinem heutigen Ich etwas falsch ist. Es bedeutet, dass noch mehr von mir sichtbar werden darf.", s: "· Wachstum" },
  { t: "Ich darf mich verändern, auch wenn andere meine alte Version lieber mochten.", s: "· Wachstum" },
  { t: "Nicht jeder Umweg war ein Fehler. Manche Wege haben mich zu einer Wahrheit geführt, die ich anders nie erkannt hätte.", s: "· Wachstum" },
  { t: "Ich muss nicht den ganzen Weg kennen. Mein nächster wahrer Schritt genügt.", s: "· Wachstum" },
  { t: "Jede bewusste Entscheidung verändert die Richtung meines Lebens.", s: "· Wachstum" },
  // MoneyMind
  { t: "Geld darf sich in meinem Leben sicher, leicht und willkommen anfühlen.", s: "· MoneyMind" },
  { t: "Ich treffe finanzielle Entscheidungen nicht länger aus Angst, sondern aus innerer Klarheit und Selbstführung.", s: "· MoneyMind" },
  { t: "Mein Kontostand beschreibt einen momentanen Zustand – niemals meinen Wert und niemals meine Möglichkeiten.", s: "· MoneyMind" },
  { t: "Ich erlaube mir, Geld zu empfangen, zu halten, zu vermehren und mit Freude weiterzugeben.", s: "· MoneyMind" },
  { t: "Je mehr ich meine eigene Fülle verkörpere, desto weniger jage ich ihr hinterher.", s: "· MoneyMind" },
  // Beziehung
  { t: "Ich muss mich nicht kleiner machen, damit eine Beziehung bestehen bleibt.", s: "· Beziehung" },
  { t: "Wahre Nähe entsteht dort, wo ich mich zeigen darf, ohne mich selbst zu verlieren.", s: "· Beziehung" },
  { t: "Ich bin bereit für Beziehungen, in denen Liebe, Wahrheit, Respekt und Freiheit gemeinsam existieren.", s: "· Beziehung" },
  { t: "Ich höre auf, um Liebe zu kämpfen, und beginne, Liebe bewusst zu wählen.", s: "· Beziehung" },
  { t: "Ich darf Grenzen setzen und trotzdem ein liebevoller Mensch bleiben.", s: "· Beziehung" },
  // Körper und Gesundheit
  { t: "Mein Körper ist nicht gegen mich. Er spricht mit mir, schützt mich und trägt meine Geschichte.", s: "· Körper & Gesundheit" },
  { t: "Ich begegne meinem Körper heute mit Aufmerksamkeit statt mit Bewertung.", s: "· Körper & Gesundheit" },
  { t: "Heilung darf sanft sein. Ich muss nicht durch Schmerz gehen, um Veränderung zu verdienen.", s: "· Körper & Gesundheit" },
  { t: "Mit jedem bewussten Atemzug kehre ich tiefer in meinen Körper und zu mir selbst zurück.", s: "· Körper & Gesundheit" },
  // Mutter Erde und Frieden
  { t: "Die Erde trägt mich jeden Tag – und ich entscheide mich, ihr mit Dankbarkeit zu begegnen.", s: "· Mutter Erde & Frieden" },
  { t: "Frieden beginnt dort, wo ich aufhöre, gegen mich selbst zu kämpfen.", s: "· Mutter Erde & Frieden" },
  { t: "Ich ehre das Leben in allen seinen Formen und erinnere mich daran, dass wir miteinander verbunden sind.", s: "· Mutter Erde & Frieden" },
  { t: "Jeder liebevolle Gedanke, jedes bewusste Wort und jede friedvolle Handlung verändert das Feld dieser Welt.", s: "· Mutter Erde & Frieden" },
  // Fülle
  { t: "Fülle beginnt nicht mit dem, was ich bekomme, sondern mit dem, was ich bereits erkennen und empfangen kann.", s: "· Fülle" },
  { t: "Ich richte meinen Blick nicht länger auf das Fehlende. Ich öffne mich für das, was bereits zu mir unterwegs ist.", s: "· Fülle" },
  { t: "Das Leben darf mich überraschen und mir mehr schenken, als mein Verstand bisher für möglich hielt.", s: "· Fülle" },
  { t: "Ich bin bereit, Liebe, Möglichkeiten, Unterstützung, Freude und Wohlstand vollständig zu empfangen.", s: "· Fülle" },
  { t: "Ich warte nicht länger auf Fülle. Ich entscheide mich, sie heute zu fühlen, zu sehen und zu verkörpern.", s: "· Fülle" },
];

export const SPRUECHE = [
  "Du musst nicht perfekt sein, um wertvoll zu sein.",
  "Jeder kleine Schritt zählt — auch der von heute.",
  "Ruhe ist keine Pause vom Leben. Sie ist Teil davon.",
  "Was du heute säst, trägt morgen deine Handschrift.",
  "Vertraue dem Weg, auch wenn du ihn noch nicht siehst.",
  "Dein Atem ist der Anker. Komm zurück zu dir.",
  "Wachstum beginnt dort, wo du dir selbst zuhörst.",
];

/* Tägliche Glaubenssätze · Affirmationen & Afformationen
   Themen: Fülle · Geld · Gesundheit · Beziehung · Selbstliebe
   (Afformationen = Fragen statt Behauptungen — sie öffnen statt zu überzeugen.) */
export const AFFIRMATIONEN = [
  { t: "Fülle", icon: "🌾", s: "Ich bin offen für die Fülle, die heute zu mir kommen will." },
  { t: "Geld", icon: "💰", s: "Warum fällt es mir immer leichter, Geld zu empfangen?" },
  { t: "Gesundheit", icon: "🌿", s: "Mein Körper weiß, wie Heilung geht — ich gebe ihm den Raum dafür." },
  { t: "Beziehung", icon: "💞", s: "Ich darf gesehen werden, so wie ich wirklich bin." },
  { t: "Selbstliebe", icon: "🤍", s: "Ich rede mit mir, wie ich mit meiner besten Freundin reden würde." },
  { t: "Fülle", icon: "🌾", s: "Warum ist mein Leben so reich an kleinen Geschenken?" },
  { t: "Geld", icon: "💰", s: "Geld ist Energie — und sie darf frei zu mir fließen." },
  { t: "Gesundheit", icon: "🌿", s: "Jeder Atemzug bringt neue Kraft in meine Zellen." },
  { t: "Beziehung", icon: "💞", s: "Warum begegnen mir immer mehr Menschen, die mir guttun?" },
  { t: "Selbstliebe", icon: "🤍", s: "Ich muss mich nicht beweisen, um wertvoll zu sein." },
  { t: "Fülle", icon: "🌾", s: "Es ist genug da — für mich und für alle anderen." },
  { t: "Geld", icon: "💰", s: "Warum darf ich Wohlstand haben, ohne mich dafür zu schämen?" },
  { t: "Gesundheit", icon: "🌿", s: "Ich höre auf die leisen Signale meines Körpers." },
  { t: "Beziehung", icon: "💞", s: "Ich darf Nähe zulassen und trotzdem ganz bei mir bleiben." },
  { t: "Selbstliebe", icon: "🤍", s: "Warum fällt es mir jeden Tag leichter, mich anzunehmen?" },
  { t: "Fülle", icon: "🌾", s: "Ich erkenne den Reichtum in dem, was ich bereits habe." },
  { t: "Geld", icon: "💰", s: "Ich verdiene gutes Geld mit dem, was mir Freude macht." },
  { t: "Gesundheit", icon: "🌿", s: "Warum tut mir Ruhe so gut — und warum gönne ich sie mir?" },
  { t: "Beziehung", icon: "💞", s: "Meine Grenzen schützen die Liebe, sie verhindern sie nicht." },
  { t: "Selbstliebe", icon: "🤍", s: "Ich bin genug — heute, morgen und ohne Bedingungen." },
  { t: "Fülle", icon: "🌾", s: "Warum öffnen sich immer wieder Türen, die ich nicht erwartet habe?" },
  { t: "Geld", icon: "💰", s: "Ich gehe achtsam mit meinem Geld um und es kommt gern zurück." },
  { t: "Gesundheit", icon: "🌿", s: "Bewegung ist mein Geschenk an meinen Körper, keine Pflicht." },
  { t: "Beziehung", icon: "💞", s: "Ich ziehe Menschen an, die es ehrlich mit mir meinen." },
  { t: "Selbstliebe", icon: "🤍", s: "Warum darf ich stolz auf mich sein — auch an leisen Tagen?" },
  { t: "Fülle", icon: "🌾", s: "Meine Dankbarkeit macht sichtbar, wie viel schon da ist." },
  { t: "Geld", icon: "💰", s: "Warum wird mein Umgang mit Geld immer klarer und ruhiger?" },
  { t: "Gesundheit", icon: "🌿", s: "Ich nähre mich mit dem, was mir wirklich guttut." },
  { t: "Beziehung", icon: "💞", s: "Warum fühle ich mich in echten Begegnungen so lebendig?" },
  { t: "Selbstliebe", icon: "🤍", s: "Meine Bedürfnisse sind wichtig — auch wenn andere warten müssen." },
  { t: "Fülle", icon: "🌾", s: "Ich vertraue: Was für mich bestimmt ist, findet zu mir." },
  { t: "Geld", icon: "💰", s: "Wohlstand beginnt in meinem Denken — und ich denke großzügig." },
  { t: "Gesundheit", icon: "🌿", s: "Warum schlafe ich immer tiefer und wache erholter auf?" },
  { t: "Beziehung", icon: "💞", s: "Ich bin ein sicherer Ort — zuerst für mich selbst." },
  { t: "Selbstliebe", icon: "🤍", s: "Ich darf mich verändern, ohne mich zu verlieren." },
  { t: "Fülle", icon: "🌾", s: "Warum darf das Leben leicht sein?" },
  { t: "Geld", icon: "💰", s: "Ich empfange gern — und ich gebe genauso gern." },
  { t: "Gesundheit", icon: "🌿", s: "Mein Körper trägt mich seit Jahren. Heute danke ich ihm dafür." },
  { t: "Beziehung", icon: "💞", s: "Ehrlichkeit macht meine Beziehungen tiefer, nicht schwerer." },
  { t: "Selbstliebe", icon: "🤍", s: "Warum werde ich immer mutiger darin, ich selbst zu sein?" },
];

export const affirmationDesTages = () => AFFIRMATIONEN[dayIndex() % AFFIRMATIONEN.length];

export const KURSE = [
  { icon: "🧭", t: "Finde deine Vision", d: "5 Module · Video & Workbook", len: "≈ 60 Min", tag: "Beliebt" },
  { icon: "💬", t: "Selbstmitgefühl lernen", d: "4 Module · Audio-Kurs", len: "≈ 45 Min", tag: "Neu" },
  { icon: "🌿", t: "Morgenroutine, die bleibt", d: "3 Module · Text & Audio", len: "≈ 30 Min", tag: null },
  { icon: "🌊", t: "Loslassen & Vergebung", d: "6 Module · Video", len: "≈ 75 Min", tag: null },
];

export const CHALLENGES = [
  { t: "7 Tage Selbstfürsorge", days: 7, done: 4, icon: "🤍" },
  { t: "30 Tage Innere Ruhe", days: 30, done: 0, icon: "🌙" },
];

export const TRACKS = [
  { t: "Sanfter Morgen", cat: "Meditation", len: "10 Min", icon: "🌅" },
  { t: "Tiefe Entspannung", cat: "Meditation", len: "20 Min", icon: "🌙" },
  { t: "Waldspaziergang", cat: "Naturklänge", len: "30 Min", icon: "🌲" },
  { t: "Ozeanwellen", cat: "Naturklänge", len: "45 Min", icon: "🌊" },
  { t: "Loslassen am Abend", cat: "Meditation", len: "15 Min", icon: "🕯️" },
  { t: "Fokus & Klarheit", cat: "Klangreise", len: "25 Min", icon: "🎐" },
];

export const BADGES = [
  { icon: "🌱", t: "Erster Schritt", got: true },
  { icon: "🔥", t: "7-Tage-Serie", got: true },
  { icon: "📔", t: "10 Einträge", got: true },
  { icon: "✨", t: "ilho kennengelernt", got: false },
  { icon: "🌙", t: "30 Tage Ruhe", got: false },
  { icon: "💎", t: "Premium-Pionierin", got: false },
];

export const ENERGIE = [
  { e: "🌧️", t: "Erschöpft", v: 1 },
  { e: "🌫️", t: "Müde", v: 2 },
  { e: "⛅", t: "Okay", v: 3 },
  { e: "🌤️", t: "Gut", v: 4 },
  { e: "☀️", t: "Strahlend", v: 5 },
];

