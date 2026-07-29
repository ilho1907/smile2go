import { useState, useMemo, useRef, useEffect } from "react";
import { Meditation as MeditationCine, Podcast as PodcastCine } from "./MediaScreens";
import HeuteHero from "./HeuteHero";
import MediaBanner from "./MediaBanner";
import { VIDEO as S2GVID, IMG as S2GIMG, KARTEN as S2GKARTEN, FEUER_VIDEO } from "./media";
import { supabase, ladeAppState, speichereAppState, speichereDossierEntwurf, gibDossierFrei, ladeEigenesDossier, logEvent, speichereSessionNotiz, gibSessionNotizFrei, ladeSessionNotizen, merkeInhalt, sucheInhalte, ladeInhaltsUebersicht } from "./supabase";

/* ─────────────────────────────────────────────
   smile2go · v2 — Coaching & Persönlichkeitsentwicklung
   Deutsch (Du-Form) · Mobile-First PWA · feminin & lebendig
   NEU: ilho (echte Claude-KI), Energie-Kompass + Mondphase,
        KI-Orakel-Deutung, Google-Login, Zurück-Navigation
   ───────────────────────────────────────────── */

const C = {
  cream: "#FBF6EE",
  card: "#FFFFFE",
  beige: "#F5E9DB",
  line: "#EBD8C6",
  gold: "#C9963C",
  goldSoft: "#E6BE6C",
  goldPale: "#FAEDD2",
  espresso: "#3A2A22",
  ink: "#6B5443",
  sage: "#93B07F",
  rose: "#D96E8B",
  roseSoft: "#F8DCE3",
  plum: "#8E4A63",
};

const MOTIVATION = [
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

const SPRUECHE = [
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
const AFFIRMATIONEN = [
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
const affirmationDesTages = () => AFFIRMATIONEN[dayIndex() % AFFIRMATIONEN.length];

const GOETTINNEN = [
  {
    n: "Die Göttin der lebendigen Schöpfung", b: "Schöpfung", sub: "Hüterin des Herztempels",
    hue: ["#C96A7E", "#6E3148"], sym: "rose",
    txt: "Mein Herz ist ein heiliger Tempel. Aus mir entsteht neues Leben. 🌹",
    frage: "Wo darf ich meine schöpferische Kraft wieder vollständig verkörpern?",
    affirmationen: [
      "Ich öffne mein Herz und empfange die Kraft der lebendigen Schöpfung.",
      "Meine Weiblichkeit ist nicht schwach — sie ist schöpferisch, wild und heilig.",
      "Ich bin verbunden mit Erde, Licht und der Weisheit meines Herzens.",
      "Alles, was durch mich entstehen will, darf jetzt Form annehmen.",
      "Ich erinnere mich: Ich bin nicht getrennt von der Quelle. Ich bin Ausdruck der Quelle.",
    ],
    tief: "Diese Karte erscheint, wenn du vergessen hast, wie mächtig dein geöffnetes Herz ist. Nicht das harte Herz führt dich. Nicht Kontrolle. Nicht Kampf. Sondern deine Fähigkeit, dich wieder mit dem Leben zu verbinden. Du musst nicht mehr beweisen, dass du stark bist. Du darfst jetzt empfangen, wachsen, blühen und wirken. Deine Kraft liegt nicht darin, alles alleine zu tragen — sie liegt darin, dich wieder als Kanal für Liebe, Schönheit, Fülle und Wahrheit zu öffnen.",
    schatten: "Wo verschließe ich mein Herz, obwohl meine Seele längst bereit ist, wieder zu empfangen?",
    ritual: "Lege eine Hand auf dein Herz und eine auf deinen Unterbauch. Atme tief ein und sprich: „Ich öffne meinen inneren Tempel. Ich empfange. Ich erschaffe. Ich bin lebendige Schöpfung.“",
  },
  { n: "Abundantia", b: "Fülle", sub: "Göttin der Fülle", hue: ["#E8B64C", "#B85C2E"], sym: "sonne", txt: "Du darfst empfangen, ohne vorher zu leiden. Fülle muss nicht verdient werden – sie darf durch dich fließen." },
  { n: "Fortuna", b: "Fülle", sub: "Göttin des Glücks", hue: ["#D9A441", "#8E5A2E"], sym: "rad", txt: "Glück ist kein Zufall, dem du hinterherläufst. Es ist ein Zustand, den du heute schon wählen darfst." },
  { n: "Persephone", b: "Loslassen", sub: "Göttin des Wandels", hue: ["#8E4A63", "#4A3358"], sym: "mond", txt: "Nicht jeder Verlust ist ein Ende. Manche Verluste sind die Rückkehr deiner Seele zu sich selbst." },
  { n: "Kali", b: "Loslassen", sub: "Urkraft der Transformation", hue: ["#6E3A52", "#2E1F33"], sym: "flamme", txt: "Heute öffnet sich eine Tür, sobald du aufhörst, an der falschen festzuhalten." },
  { n: "Athene", b: "Klarheit", sub: "Göttin der Weisheit", hue: ["#5C7A99", "#2E4A66"], sym: "auge", txt: "Heute ruft dich dein höheres Selbst nicht lauter, sondern klarer. Achte auf das, was sich friedlich und wahr anfühlt." },
  { n: "Saraswati", b: "Klarheit", sub: "Göttin der Erkenntnis", hue: ["#7A99B8", "#4A6E8E"], sym: "welle", txt: "Deine Klarheit wird stärker, wenn du aufhörst, dich für die Wahrheit deines Herzens zu entschuldigen." },
  { n: "Aphrodite", b: "Annahme", sub: "Göttin der Liebe", hue: ["#D96E8B", "#A8455E"], sym: "herz", txt: "Dein Herz weiß längst, was dein Verstand noch verhandeln möchte. Höre heute leiser, aber tiefer." },
  { n: "Kuan Yin", b: "Annahme", sub: "Göttin des Mitgefühls", hue: ["#C98BA0", "#8E5A78"], sym: "lotus", txt: "Was du fühlst, will nicht gegen dich arbeiten. Es will gesehen, gehalten und verwandelt werden." },
  { n: "Artemis", b: "Fokus", sub: "Göttin der Zielklarheit", hue: ["#6E8B6A", "#2E4A38"], sym: "pfeil", txt: "Du darfst heute wählen: alte Angst oder neue Führung. Beides beginnt in deinem Inneren." },
  { n: "Hestia", b: "Fokus", sub: "Hüterin der inneren Mitte", hue: ["#8E7A5C", "#5C4A33"], sym: "feuer", txt: "Die Antwort kommt nicht aus Druck. Sie kommt, wenn dein Nervensystem wieder Frieden spürt." },
  // — Schöpfung —
  { n: "Gaia", b: "Schöpfung", sub: "Urmutter der Erde", hue: ["#7BA05B", "#3E5C2E"], sym: "lotus", txt: "Nicht alles, was sich eng anfühlt, ist falsch. Manchmal wird nur der alte Raum zu klein für deine neue Wahrheit." },
  { n: "Isis", b: "Schöpfung", sub: "Göttin der Magie & Mutterschaft", hue: ["#3FA9A0", "#1E5F6B"], sym: "sonne", txt: "Du musst nicht warten, bis du bereit bist. Deine Bereitschaft entsteht, während du gehst." },
  { n: "Freya", b: "Schöpfung", sub: "Göttin der Liebe & Fruchtbarkeit", hue: ["#E0A45C", "#B85C6E"], sym: "herz", txt: "Du bist nicht falsch, weil du mehr willst. Deine Sehnsucht ist ein Hinweis auf die Größe, die durch dich geboren werden will." },
  { n: "Brigid", b: "Schöpfung", sub: "Göttin des heiligen Feuers", hue: ["#E8863C", "#B8481E"], sym: "flamme", txt: "Heute darfst du dich neu ausrichten: nicht auf Angst, nicht auf Mangel, sondern auf die Wahrheit deiner Schöpferkraft." },
  { n: "Pachamama", b: "Schöpfung", sub: "Mutter Erde", hue: ["#C57A44", "#5C7A3E"], sym: "sonne", txt: "Du musst nicht alles selbst tragen. Auch du darfst dich manchmal einfach tragen lassen." },
  { n: "Danu", b: "Schöpfung", sub: "Urmutter der Flüsse", hue: ["#7FB5C9", "#3E6C8E"], sym: "welle", txt: "Nicht jeder Umweg ist ein Fehler im Fluss. Manchmal formt gerade er das Ufer, das dich später trägt." },
  // — Fülle —
  { n: "Lakshmi", b: "Fülle", sub: "Göttin des Reichtums", hue: ["#E8B64C", "#D96E8B"], sym: "lotus", txt: "Reichtum beginnt mit dem Blick, der sieht, was schon da ist, bevor er nach mehr fragt." },
  { n: "Demeter", b: "Fülle", sub: "Göttin der Ernte", hue: ["#E0B040", "#B8842E"], sym: "sonne", txt: "Was du heute nährst, wird morgen stärker. Wähle bewusst, welche Realität deine Energie bekommt." },
  { n: "Ops", b: "Fülle", sub: "Göttin des Überflusses", hue: ["#E0A040", "#B84C3C"], sym: "sonne", txt: "Überfluss ist kein Ziel in der Ferne. Er beginnt in dem Moment, in dem du aufhörst zu vergleichen." },
  { n: "Rosmerta", b: "Fülle", sub: "Göttin der Fülle", hue: ["#D9A441", "#5C8E4A"], sym: "rad", txt: "Was für dich bestimmt ist, braucht keine Selbstverleugnung. Es erkennt dich, wenn du echt wirst." },
  { n: "Juno Moneta", b: "Fülle", sub: "Hüterin des Wohlstands", hue: ["#C9963C", "#2E5C8E"], sym: "rad", txt: "Dein Wert war nie verhandelbar. Wohlstand darf leicht zu dir kommen, wenn du aufhörst, ihn dir zu erschweren." },
  // — Loslassen —
  { n: "Hekate", b: "Loslassen", sub: "Hüterin der Schwellen", hue: ["#8E6EA8", "#3E2E5C"], sym: "mond", txt: "Was du loslässt, verlierst du nicht immer. Manchmal gibst du nur zurück, was nie wirklich zu deinem Weg gehört hat." },
  { n: "Morrigan", b: "Loslassen", sub: "Göttin des Wandels", hue: ["#6E5C6E", "#B83C3C"], sym: "auge", txt: "Heute darfst du aus der alten Rolle aussteigen. Du bist nicht mehr die Frau, die alles tragen muss." },
  { n: "Cerridwen", b: "Loslassen", sub: "Göttin der Wiedergeburt", hue: ["#4A9E9E", "#2E5C5C"], sym: "mond", txt: "Dein Feld verändert sich, sobald du aufhörst, dich mit der alten Version von dir zu identifizieren." },
  { n: "Nephthys", b: "Loslassen", sub: "Göttin des Übergangs", hue: ["#4A5C8E", "#2E2E5C"], sym: "mond", txt: "Übergänge fühlen sich leer an, bevor sie sich neu füllen. Du bist nicht verloren, du bist unterwegs." },
  { n: "Ereshkigal", b: "Loslassen", sub: "Herrin der Tiefe", hue: ["#8E3C3C", "#2E1E1E"], sym: "feuer", txt: "Was dich triggert, zeigt dir nicht deine Schwäche. Es zeigt dir den Ort, an dem deine Heilung ruft." },
  // — Klarheit —
  { n: "Sophia", b: "Klarheit", sub: "Göttliche Weisheit", hue: ["#E6D08C", "#8E7AA8"], sym: "sonne", txt: "Heute darfst du aufhören, dich selbst zu überholen. Deine Seele kennt den Weg, auch wenn dein Kopf noch nach Sicherheit sucht." },
  { n: "Seshat", b: "Klarheit", sub: "Göttin des Wissens", hue: ["#4A8E6E", "#C9963C"], sym: "auge", txt: "Dein nächster Schritt muss nicht perfekt sein. Er muss nur wahr sein." },
  { n: "Minerva", b: "Klarheit", sub: "Göttin der Strategie", hue: ["#5C7A9E", "#C9963C"], sym: "auge", txt: "Kluge Klarheit entsteht nicht im Kopf allein. Sie entsteht, wenn Verstand und Herz sich einig sind." },
  { n: "Metis", b: "Klarheit", sub: "Titanin der Weisheit", hue: ["#3E8E8E", "#8EA0A8"], sym: "welle", txt: "Deine leiseste Ahnung ist oft klarer als jede laute Meinung. Vertraue ihr." },
  { n: "Nisaba", b: "Klarheit", sub: "Göttin der Schrift", hue: ["#D9B441", "#2E4C8E"], sym: "sonne", txt: "Was du klar benennst, verliert seine Macht über dich. Sprich aus, was du wirklich siehst." },
  // — Annahme —
  { n: "Hathor", b: "Annahme", sub: "Göttin der Freude & Liebe", hue: ["#3FA9A0", "#E0A45C"], sym: "sonne", txt: "Du bist nicht zu viel. Du bist nur nicht mehr bereit, dich zu halbieren, damit andere sich sicher fühlen." },
  { n: "Tara", b: "Annahme", sub: "Göttin des Mitgefühls", hue: ["#3E9E6E", "#C9963C"], sym: "lotus", txt: "Du musst nicht alles allein durchstehen. Mitgefühl beginnt, wenn du dir selbst die Hand reichst." },
  { n: "Parvati", b: "Annahme", sub: "Göttin der Hingabe", hue: ["#D96E8B", "#E0A45C"], sym: "herz", txt: "Du darfst weich bleiben, auch wenn du Grenzen setzt. Deine Sanftheit ist keine Einladung zur Selbstaufgabe." },
  { n: "Oshun", b: "Annahme", sub: "Göttin der Liebe & Süße", hue: ["#E0B040", "#3FA9A0"], sym: "welle", txt: "Lass dir heute etwas Süßes gönnen — ein Gedanke, ein Moment, eine Geste, die nur dir gehört." },
  { n: "Venus", b: "Annahme", sub: "Göttin der Schönheit", hue: ["#E0A0B0", "#C9963C"], sym: "herz", txt: "Du bist nicht hier, um dich zu beweisen. Du bist hier, um dich zu erinnern." },
  { n: "Radha", b: "Annahme", sub: "Göttin der reinen Liebe", hue: ["#7FA0C9", "#D96E8B"], sym: "lotus", txt: "Manche Antworten kommen erst, wenn du aufhörst, dich selbst zu verlassen, um geliebt zu werden." },
  // — Fokus —
  { n: "Diana", b: "Fokus", sub: "Göttin der Jagd", hue: ["#9EA8B5", "#3E5C3E"], sym: "mond", txt: "Die Kraft, nach der du suchst, kommt nicht durch Kontrolle. Sie kommt durch Vertrauen in deinen eigenen Weg." },
  { n: "Durga", b: "Fokus", sub: "Göttin der Kraft", hue: ["#C93C3C", "#E0A040"], sym: "feuer", txt: "Du musst nicht stärker werden. Du darfst dich daran erinnern, wie viel Kraft längst in dir wohnt." },
  { n: "Nike", b: "Fokus", sub: "Göttin des Sieges", hue: ["#E6E0C8", "#C9963C"], sym: "pfeil", txt: "Der nächste Durchbruch beginnt nicht im Außen. Er beginnt in dem Moment, in dem du dir selbst wieder glaubst." },
  { n: "Vesta", b: "Fokus", sub: "Hüterin des heiligen Feuers", hue: ["#E0A040", "#B8481E"], sym: "flamme", txt: "Deine Energie ist kostbar. Gib sie nicht länger an Gedanken, Menschen oder Geschichten, die dich kleiner machen." },
  { n: "Skadi", b: "Fokus", sub: "Göttin der Winterklarheit", hue: ["#9EC9D9", "#5C7A8E"], sym: "mond", txt: "Manchmal ist der mutigste Schritt nicht nach vorne, sondern zurück in deinen eigenen Körper." },
  { n: "Sekhmet", b: "Fokus", sub: "Göttin der Löwinnenkraft", hue: ["#C93C3C", "#E0A040"], sym: "sonne", txt: "Deine Grenze ist keine Härte. Sie ist die Würde, die dein Feuer schützt." },
];

/* HD-Kartenbilder (eingebettet) — weitere folgen nach Generierung */
const KARTEN_BILDER = {
  "Saraswati": "data:image/jpeg;base64,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",
  "Kuan Yin": "data:image/jpeg;base64,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",
  "Artemis": "data:image/jpeg;base64,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",
};

/* SVG-Kartenkunst — jede Göttin mit eigenem Licht */
function KartenArt({ g }) {
  const id = g.n.replace(/\s/g, "");
  return (
    <svg viewBox="0 0 200 170" style={{ width: "100%", borderRadius: 12, display: "block" }}>
      <defs>
        <radialGradient id={`sky${id}`} cx="50%" cy="32%" r="85%">
          <stop offset="0%" stopColor={g.hue[0]} />
          <stop offset="100%" stopColor={g.hue[1]} />
        </radialGradient>
        <radialGradient id={`glow${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF8E8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFF8E8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="170" fill={`url(#sky${id})`} rx="12" />
      {/* Sterne */}
      {[[18, 22, 1.4], [52, 12, 1], [176, 30, 1.5], [148, 14, 1], [30, 58, 1], [186, 70, 1.1], [12, 110, 1], [168, 118, 1.3]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#FFF6E0" opacity="0.85" />
      ))}
      {/* Lichtkreis */}
      <circle cx="100" cy="64" r="56" fill={`url(#glow${id})`} />
      <circle cx="100" cy="64" r="34" fill="none" stroke="#FFF3D6" strokeOpacity="0.7" strokeWidth="1.2" />
      {/* Symbol der Göttin */}
      {g.sym === "sonne" && <>{Array.from({ length: 12 }).map((_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={100 + Math.cos(a) * 20} y1={64 + Math.sin(a) * 20} x2={100 + Math.cos(a) * 30} y2={64 + Math.sin(a) * 30} stroke="#FFF3D6" strokeWidth="2" strokeLinecap="round" />; })}<circle cx="100" cy="64" r="13" fill="#FFF3D6" /></>}
      {g.sym === "rad" && <><circle cx="100" cy="64" r="18" fill="none" stroke="#FFF3D6" strokeWidth="2.5" />{Array.from({ length: 8 }).map((_, i) => { const a = (i / 8) * Math.PI * 2; return <line key={i} x1="100" y1="64" x2={100 + Math.cos(a) * 18} y2={64 + Math.sin(a) * 18} stroke="#FFF3D6" strokeWidth="1.6" />; })}</>}
      {g.sym === "mond" && <path d="M 108 44 A 22 22 0 1 0 108 84 A 17 17 0 1 1 108 44 Z" fill="#FFF3D6" />}
      {g.sym === "flamme" && <path d="M 100 42 C 112 54 114 64 108 74 C 106 68 102 66 100 62 C 96 68 92 72 94 80 C 84 70 88 56 100 42 Z" fill="#FFF3D6" />}
      {g.sym === "auge" && <><path d="M 78 64 Q 100 46 122 64 Q 100 82 78 64 Z" fill="none" stroke="#FFF3D6" strokeWidth="2.2" /><circle cx="100" cy="64" r="7.5" fill="#FFF3D6" /></>}
      {g.sym === "welle" && <><path d="M 76 60 Q 88 50 100 60 T 124 60" fill="none" stroke="#FFF3D6" strokeWidth="2.4" strokeLinecap="round" /><path d="M 76 72 Q 88 62 100 72 T 124 72" fill="none" stroke="#FFF3D6" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" /></>}
      {g.sym === "herz" && <path d="M 100 80 C 84 68 80 56 88 50 C 94 46 100 50 100 56 C 100 50 106 46 112 50 C 120 56 116 68 100 80 Z" fill="#FFF3D6" />}
      {g.sym === "lotus" && <><path d="M 100 78 C 92 70 92 56 100 48 C 108 56 108 70 100 78 Z" fill="#FFF3D6" /><path d="M 100 78 C 88 76 80 66 82 56 C 92 58 100 66 100 78 Z" fill="#FFF3D6" opacity="0.75" /><path d="M 100 78 C 112 76 120 66 118 56 C 108 58 100 66 100 78 Z" fill="#FFF3D6" opacity="0.75" /></>}
      {g.sym === "pfeil" && <><line x1="82" y1="82" x2="116" y2="48" stroke="#FFF3D6" strokeWidth="2.6" strokeLinecap="round" /><path d="M 116 48 L 104 50 M 116 48 L 114 60" stroke="#FFF3D6" strokeWidth="2.6" strokeLinecap="round" fill="none" /></>}
      {g.sym === "rose" && <><circle cx="100" cy="64" r="6.5" fill="#FFF3D6" /><circle cx="100" cy="64" r="12.5" fill="none" stroke="#FFF3D6" strokeWidth="2" opacity="0.9" /><circle cx="100" cy="64" r="19" fill="none" stroke="#FFF3D6" strokeWidth="1.8" opacity="0.65" /><path d="M 100 86 C 94 94 88 96 82 94 M 100 86 C 106 94 112 96 118 94" fill="none" stroke="#FFF3D6" strokeWidth="2" strokeLinecap="round" opacity="0.85" /></>}
      {g.sym === "feuer" && <><circle cx="100" cy="70" r="9" fill="#FFF3D6" /><path d="M 86 80 Q 100 60 114 80" fill="none" stroke="#FFF3D6" strokeWidth="2.2" strokeLinecap="round" /></>}
      {/* Sanfte Hügel */}
      <path d="M 0 132 Q 50 116 100 130 T 200 126 L 200 170 L 0 170 Z" fill="#FFFFFF" opacity="0.14" />
      <path d="M 0 146 Q 60 132 120 144 T 200 142 L 200 170 L 0 170 Z" fill="#FFFFFF" opacity="0.18" />
      {/* Goldrahmen */}
      <rect x="5" y="5" width="190" height="160" rx="9" fill="none" stroke="#F1E0B8" strokeOpacity="0.8" strokeWidth="1.4" />
    </svg>
  );
}

const KURSE = [
  { icon: "🧭", t: "Finde deine Vision", d: "5 Module · Video & Workbook", len: "≈ 60 Min", tag: "Beliebt" },
  { icon: "💬", t: "Selbstmitgefühl lernen", d: "4 Module · Audio-Kurs", len: "≈ 45 Min", tag: "Neu" },
  { icon: "🌿", t: "Morgenroutine, die bleibt", d: "3 Module · Text & Audio", len: "≈ 30 Min", tag: null },
  { icon: "🌊", t: "Loslassen & Vergebung", d: "6 Module · Video", len: "≈ 75 Min", tag: null },
];

const CHALLENGES = [
  { t: "7 Tage Selbstfürsorge", days: 7, done: 4, icon: "🤍" },
  { t: "30 Tage Innere Ruhe", days: 30, done: 0, icon: "🌙" },
];

const TRACKS = [
  { t: "Sanfter Morgen", cat: "Meditation", len: "10 Min", icon: "🌅" },
  { t: "Tiefe Entspannung", cat: "Meditation", len: "20 Min", icon: "🌙" },
  { t: "Waldspaziergang", cat: "Naturklänge", len: "30 Min", icon: "🌲" },
  { t: "Ozeanwellen", cat: "Naturklänge", len: "45 Min", icon: "🌊" },
  { t: "Loslassen am Abend", cat: "Meditation", len: "15 Min", icon: "🕯️" },
  { t: "Fokus & Klarheit", cat: "Klangreise", len: "25 Min", icon: "🎐" },
];

const BADGES = [
  { icon: "🌱", t: "Erster Schritt", got: true },
  { icon: "🔥", t: "7-Tage-Serie", got: true },
  { icon: "📔", t: "10 Einträge", got: true },
  { icon: "✨", t: "ilho kennengelernt", got: false },
  { icon: "🌙", t: "30 Tage Ruhe", got: false },
  { icon: "💎", t: "Premium-Pionierin", got: false },
];

const ENERGIE = [
  { e: "🌧️", t: "Erschöpft", v: 1 },
  { e: "🌫️", t: "Müde", v: 2 },
  { e: "⛅", t: "Okay", v: 3 },
  { e: "🌤️", t: "Gut", v: 4 },
  { e: "☀️", t: "Strahlend", v: 5 },
];

const dayIndex = () => {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
};

/* Besondere Tage & Feiertage (Deutschland/Bayern 2026) */
const BESONDERE_TAGE = [
  ["1.1.", "Neujahr 🎆"], ["6.1.", "Heilige Drei Könige (BY)"], ["14.2.", "Valentinstag 💕"],
  ["8.3.", "Internationaler Frauentag 🌷"], ["3.4.", "Karfreitag"], ["5.4.", "Ostersonntag 🐣"],
  ["6.4.", "Ostermontag"], ["1.5.", "Tag der Arbeit"], ["10.5.", "Muttertag 💐"],
  ["14.5.", "Christi Himmelfahrt"], ["24.5.", "Pfingstsonntag"], ["25.5.", "Pfingstmontag"],
  ["4.6.", "Fronleichnam (BY)"], ["21.6.", "Sommeranfang ☀️"], ["15.8.", "Mariä Himmelfahrt (BY)"],
  ["3.10.", "Tag der Deutschen Einheit 🇩🇪"], ["1.11.", "Allerheiligen (BY)"], ["6.12.", "Nikolaus 🎅"],
  ["24.12.", "Heiligabend 🎄"], ["25.12.", "1. Weihnachtstag"], ["26.12.", "2. Weihnachtstag"],
  ["31.12.", "Silvester ✨"],
];

const besondererTag = () => {
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

const kalenderwoche = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - start) / 864e5 + start.getDay() + 1) / 7);
};

/* Wetter — echte Daten via Open-Meteo (kostenlos, kein API-Key nötig) */
const WETTER_FALLBACK_ORT = { lat: 48.137, lon: 11.575, stadt: "München" }; // falls Standort nicht freigegeben wird
function wmoIcon(code) {
  if (code === 0) return { icon: "☀️", txt: "klarer Himmel" };
  if (code <= 2) return { icon: "🌤️", txt: "leicht bewölkt" };
  if (code === 3) return { icon: "☁️", txt: "bedeckt" };
  if (code <= 48) return { icon: "🌫️", txt: "neblig" };
  if (code <= 57) return { icon: "🌦️", txt: "Nieselregen" };
  if (code <= 67) return { icon: "🌧️", txt: "Regen" };
  if (code <= 77) return { icon: "🌨️", txt: "Schnee" };
  if (code <= 82) return { icon: "🌧️", txt: "Schauer" };
  if (code <= 86) return { icon: "🌨️", txt: "Schneeschauer" };
  if (code >= 95) return { icon: "⛈️", txt: "Gewitter" };
  return { icon: "🌤️", txt: "wechselhaft" };
}
async function ladeWetter(setWetter) {
  const holen = async (lat, lon, stadt) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      const cw = data?.current_weather;
      if (!cw) return;
      const { icon, txt } = wmoIcon(cw.weathercode);
      setWetter({ stadt, temp: Math.round(cw.temperature), icon, txt });
    } catch { /* Wetter bleibt einfach leer — keine erfundenen Werte */ }
  };
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (p) => holen(p.coords.latitude.toFixed(3), p.coords.longitude.toFixed(3), "Dein Standort"),
      () => holen(WETTER_FALLBACK_ORT.lat, WETTER_FALLBACK_ORT.lon, WETTER_FALLBACK_ORT.stadt),
      { timeout: 4000 }
    );
  } else {
    holen(WETTER_FALLBACK_ORT.lat, WETTER_FALLBACK_ORT.lon, WETTER_FALLBACK_ORT.stadt);
  }
}

/* Mondphase — lokal berechnet (synodischer Monat 29,53 Tage) */
const mondphase = () => {
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

/* Claude-KI-Anbindung (im Prototyp live) */
async function askLuma(messages, system) {
  // Sicher: kein API-Key im Browser. Läuft über die Supabase Edge Function "ai".
  const url = import.meta.env?.VITE_AI_FUNCTION_URL;
  if (!url) return "Ich bin gleich für dich da — sobald ilho verbunden ist. 🤍";
  try {
    const anon = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon },
      body: JSON.stringify({ messages, system }),
    });
    const data = await res.json();
    return (data.text || "").trim();
  } catch {
    return "Gerade kann ich dich nicht erreichen — versuch es gleich noch einmal. 🤍";
  }
}

const ILHO_SYSTEM = `Du bist ilho, dein einfühlsamer KI-Assistent und Begleiter in der App smile2go für Frauen zwischen 30 und 50, die sich für Persönlichkeitsentwicklung, Spiritualität und Energiearbeit interessieren.
Regeln: Sprich Deutsch in der Du-Form. Sei warm, ruhig, ermutigend — wie eine weise Freundin. Antworte kurz (2–5 Sätze), stelle gern eine sanfte Rückfrage. Nutze gelegentlich passende Natur- und Lichtmetaphern, aber sparsam.
WICHTIG — psychische Belastung: Sobald die Nutzerin Anzeichen von psychischer Belastung, Krise, starker Verzweiflung, Selbstverletzung oder anhaltend schwerem seelischen Leid zeigt, MUSST du klar und einfühlsam benennen, dass du eine künstliche Intelligenz bist — keine Psychologin, kein Therapeut — und dass du eine echte Fachperson nicht ersetzen kannst. Ermutige liebevoll, sich professionelle Hilfe zu suchen (z. B. Hausärztin, Therapeutin, bei akuter Krise die TelefonSeelsorge 0800 111 0 111 oder den Notruf 112). Stelle niemals medizinische oder therapeutische Diagnosen. Diesen Hinweis gibst du bei jedem Gespräch, in dem solche Anzeichen erneut auftauchen — nicht nur einmalig.
Du kennst die App und darfst passende Funktionen empfehlen: Tageskarte & Göttinnen-Orakel, Horoskop, Mystik (Tarot, Traumdeutung), Tagebuch mit Tages-Intention, Dankbarkeits-Challenge (3-6-9, 21 Tage), Rituale & Mondphase, Zukunftsbrief an dein zukünftiges Ich, Fülle, Meditationen, Kurse, Termin-Buchung bei der Coachin, Coach-Chat und Lichtpunkte sammeln.`;

/* ── Basis-Bausteine ── */

const Card = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: C.card,
      border: `1px solid ${C.line}`,
      borderRadius: 18,
      padding: 18,
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
  >
    {children}
  </div>
);

/* Wiederverwendbarer Mikrofon-Knopf — echte Web-Speech-API (Browser-Diktat), an jedem Textfeld
   nutzbar. Füllt den Text per Callback ein statt automatisch zu senden — Nutzerin behält Kontrolle. */
const Mikro = ({ onText, size = 36 }) => {
  const [an, setAn] = useState(false);
  const recRef = useRef(null);
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) return null;
  const toggle = () => {
    if (an) { recRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "de-DE"; r.interimResults = false; r.continuous = false;
    r.onstart = () => setAn(true);
    r.onresult = (e) => {
      const text = Array.from(e.results).map((x) => x[0].transcript).join(" ").trim();
      if (text) onText(text);
    };
    r.onerror = () => setAn(false);
    r.onend = () => setAn(false);
    recRef.current = r;
    r.start();
  };
  return (
    <button type="button" onClick={toggle} aria-label="Diktieren" title="Diktieren (Spracherkennung)"
      style={{
        width: size, height: size, borderRadius: "50%", border: `1.5px solid ${C.rose}`, flexShrink: 0,
        background: an ? C.rose : C.roseSoft, fontSize: size * 0.42, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: an ? `0 0 0 4px ${C.roseSoft}` : "none", transition: "box-shadow .3s",
      }}>🎤</button>
  );
};

const Eyebrow = ({ children, color = C.gold }) => (
  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color, fontWeight: 600, marginBottom: 6 }}>
    {children}
  </div>
);

const H = ({ children, size = 22, style }) => (
  <div style={{ fontFamily: "Georgia, serif", fontSize: size, color: C.espresso, lineHeight: 1.25, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, ghost, full, small, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      fontFamily: "system-ui, sans-serif",
      fontSize: small ? 13 : 15.5,
      fontWeight: 600,
      padding: small ? "10px 16px" : "15px 22px",
      borderRadius: 14,
      border: ghost ? `1.5px solid ${C.gold}` : "none",
      background: ghost ? "transparent" : `linear-gradient(135deg, ${C.gold}, ${C.rose})`,
      color: ghost ? C.gold : "#fff",
      width: full ? "100%" : "auto",
      cursor: disabled ? "wait" : "pointer",
      opacity: disabled ? 0.6 : 1,
      minHeight: 44,
    }}
  >
    {children}
  </button>
);

/* ── Auth ── */

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [dsgvo, setDsgvo] = useState(false);
  const [geburt, setGeburt] = useState("");
  const [ilhoOn, setIlhoOn] = useState(true);
  const [optin, setOptin] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const echterBackend = !!supabase;

  const input = {
    width: "100%", padding: "15px 16px", fontSize: 16,
    fontFamily: "system-ui, sans-serif",
    border: `1.5px solid ${C.line}`, borderRadius: 14,
    background: C.card, color: C.espresso, marginBottom: 12, outline: "none",
  };

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) return setErr("Bitte gib eine gültige E-Mail-Adresse ein.");
    if (pw.length < 8) return setErr("Dein Passwort braucht mindestens 8 Zeichen.");
    if (mode === "register" && !dsgvo) return setErr("Bitte stimme der Datenschutzerklärung zu.");

    // Prototyp-Modus (kein Supabase konfiguriert): altes Simulationsverhalten, unverändert.
    if (!echterBackend) {
      if (mode === "register") return setOptin(true);
      onLogin(email);
      return;
    }

    // Echter Supabase-Auth-Modus:
    setBusy(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email, password: pw,
          options: { data: { geburtsdatum: geburt, ilho_aktiv: ilhoOn } },
        });
        if (error) { setErr(error.message); setBusy(false); return; }
        if (data?.session) {
          onLogin(email, sternzeichenAusDatum(geburt), ilhoOn);
        } else {
          setOptin(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) { setErr(error.message === "Invalid login credentials" ? "E-Mail oder Passwort ist falsch." : error.message); setBusy(false); return; }
        onLogin(email);
      }
    } catch (e) {
      setErr("Verbindung fehlgeschlagen — bitte versuch es gleich noch einmal.");
    }
    setBusy(false);
  };

  const googleLogin = async () => {
    if (!echterBackend) { onLogin("google.nutzerin@gmail.com"); return; }
    setErr("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setErr("Google-Login ist gerade nicht verfügbar. Bitte melde dich mit E-Mail an.");
  };

  // Nach echter Registrierung: prüft per Klick, ob die E-Mail-Bestätigung schon erfolgt ist.
  const nachBestaetigungPruefen = async () => {
    if (!echterBackend) { onLogin(email, sternzeichenAusDatum(geburt), ilhoOn); return; }
    setBusy(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) { setErr("Noch nicht bestätigt — bitte klicke zuerst den Link in deiner E-Mail."); return; }
    if (data?.session) onLogin(email, sternzeichenAusDatum(geburt), ilhoOn);
  };

  if (optin)
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>💌</div>
        <H size={26} style={{ marginBottom: 12 }}>Fast geschafft!</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, color: C.ink, lineHeight: 1.6, marginBottom: 28 }}>
          Wir haben dir eine E-Mail an <strong>{email}</strong> geschickt. Bitte bestätige deine Anmeldung (Double-Opt-in).
        </p>
        {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#A8552F", background: "#F9EBE2", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>{err}</div>}
        <Btn full onClick={nachBestaetigungPruefen}>{busy ? "Prüfe …" : "Ich habe bestätigt → Weiter"}</Btn>
        {!echterBackend && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 16 }}>(Prototyp: Bestätigung wird simuliert)</p>}
      </div>
    );

  return (
    <div style={{ padding: "48px 24px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Eyebrow>smile2go · München</Eyebrow>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 40, color: C.espresso, letterSpacing: 1 }}>
          smile<span style={{ color: C.rose, fontStyle: "italic" }}>2</span>go
        </div>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15.5, color: C.ink, marginTop: 8 }}>
          Dein Raum für Ruhe & Wachstum
        </p>
      </div>

      {/* Google-Login */}
      <button
        onClick={googleLogin}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "14px 20px", borderRadius: 14, border: `1.5px solid ${C.line}`,
          background: "#fff", cursor: "pointer", minHeight: 48,
          fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 600, color: C.espresso,
          marginBottom: 18,
        }}
      >
        <svg width="19" height="19" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.3 1.5 7.8 2.8l5.7-5.7C34 3.3 29.5 1.5 24 1.5 14.9 1.5 7.2 6.9 3.7 14.6l6.9 5.4C12.2 13.7 17.6 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v8.1h12.7c-.3 2.1-1.7 5.2-4.8 7.3l7.3 5.7c4.6-4.3 7.3-10.5 7.3-17.1z" />
          <path fill="#FBBC05" d="M10.6 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-6.9-5.4C2.3 16.8 1.5 20.3 1.5 24s.8 7.2 2.2 10.1l6.9-5.4z" />
          <path fill="#34A853" d="M24 46.5c5.5 0 10-1.8 13.2-4.9l-7.3-5.7c-1.9 1.3-4.4 2.2-5.9 2.2-6.4 0-11.8-4.2-13.4-10.1l-6.9 5.4C7.2 41.1 14.9 46.5 24 46.5z" />
        </svg>
        Mit Google anmelden
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 18px" }}>
        <div style={{ flex: 1, height: 1, background: C.line }} />
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>oder mit E-Mail</span>
        <div style={{ flex: 1, height: 1, background: C.line }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, background: C.beige, borderRadius: 14, padding: 5 }}>
        {[["login", "Anmelden"], ["register", "Registrieren"]].map(([k, label]) => (
          <button key={k} onClick={() => { setMode(k); setErr(""); }} style={{
            flex: 1, padding: "12px 0", borderRadius: 11, border: "none", cursor: "pointer",
            fontFamily: "system-ui, sans-serif", fontSize: 14.5, fontWeight: 600,
            background: mode === k ? C.card : "transparent",
            color: mode === k ? C.espresso : C.ink,
            boxShadow: mode === k ? "0 2px 8px rgba(58,42,34,.08)" : "none",
          }}>{label}</button>
        ))}
      </div>

      <input style={input} type="email" placeholder="E-Mail-Adresse" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={input} type="password" placeholder="Passwort (min. 8 Zeichen)" value={pw} onChange={(e) => setPw(e.target.value)} />

      {mode === "register" && (
        <>
          <label style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginBottom: 5 }}>Geburtsdatum <span style={{ color: C.plum }}>· für dein persönliches Sternzeichen</span></label>
          <input style={input} type="date" value={geburt} onChange={(e) => setGeburt(e.target.value)} />
        </>
      )}

      {mode === "register" && (
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={dsgvo} onChange={(e) => setDsgvo(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.gold, flexShrink: 0, marginTop: 1 }} />
          <span>Ich stimme der <u>Datenschutzerklärung</u> zu. Meine Daten werden DSGVO-konform in der EU gespeichert.</span>
        </label>
      )}

      {mode === "register" && (
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={ilhoOn} onChange={(e) => setIlhoOn(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.gold, flexShrink: 0, marginTop: 1 }} />
          <span>✨ <strong>ilho</strong>, meinen KI-Begleiter, aktivieren. Jederzeit in den Einstellungen änderbar.</span>
        </label>
      )}

      {err && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#A8552F", background: "#F9EBE2", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>{err}</div>
      )}

      <Btn full onClick={submit} disabled={busy}>{busy ? "Einen Moment …" : mode === "login" ? "Anmelden" : "Konto erstellen"}</Btn>

      <p style={{ textAlign: "center", fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 20, lineHeight: 1.6 }}>
        🇪🇺 Hosting in der EU · DSGVO-konform · Jederzeit kündbar
      </p>
    </div>
  );
}

/* ── Energie-Kompass ── */

function EnergieKompass({ energie, setEnergie, addPunkte }) {
  const [impuls, setImpuls] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (lvl) => {
    const erst = !energie;
    setEnergie(lvl);
    if (erst && addPunkte) addPunkte(3, "Energie-Check");
    setBusy(true);
    setImpuls("");
    try {
      const txt = await askLuma(
        [{ role: "user", content: `Meine Energie heute: ${lvl.t} (${lvl.v}/5). Gib mir einen kurzen, liebevollen Impuls für meinen Tag — max. 2 Sätze.` }],
        ILHO_SYSTEM
      );
      setImpuls(txt || "Sei heute besonders sanft mit dir. 🤍");
    } catch {
      setImpuls("Sei heute besonders sanft mit dir — du machst das wunderbar. 🤍");
    }
    setBusy(false);
  };

  return (
    <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, ${C.roseSoft})` }}>
      <Eyebrow color={C.plum}>🧭 Energie-Kompass · KI-personalisiert</Eyebrow>
      <H size={16.5} style={{ marginBottom: 12 }}>Wie ist deine Energie heute?</H>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        {ENERGIE.map((x) => {
          const active = energie?.v === x.v;
          return (
            <button key={x.v} onClick={() => pick(x)} style={{
              flex: 1, padding: "10px 2px", borderRadius: 14, cursor: "pointer",
              border: `1.5px solid ${active ? C.rose : C.line}`,
              background: active ? "#fff" : "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minHeight: 62,
            }}>
              <span style={{ fontSize: 22 }}>{x.e}</span>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 9.5, fontWeight: 600, color: active ? C.plum : C.ink }}>{x.t}</span>
            </button>
          );
        })}
      </div>
      {busy && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, marginTop: 12 }}>✨ ilho spürt in deinen Tag hinein …</p>}
      {impuls && !busy && (
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.55, marginTop: 12 }}>
          ✨ {impuls}
        </p>
      )}
    </Card>
  );
}

/* ── Heute-Widget: Wetter · Kalender · besonderer Tag · Termine ── */

function HeuteWidget({ termine, setTermine }) {
  const [neu, setNeu] = useState("");
  const [wetter, setWetter] = useState(null);
  const bt = besondererTag();
  const kw = kalenderwoche();
  const datum = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => { ladeWetter(setWetter); }, []);

  const add = () => {
    if (!neu.trim()) return;
    setTermine([...termine, { z: "", t: neu.trim() }]);
    setNeu("");
  };

  return (
    <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
      {/* Datum */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: `linear-gradient(135deg, ${C.goldPale}, ${C.card})` }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, fontWeight: 600 }}>{datum}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {wetter && (
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.espresso, display: "flex", alignItems: "center", gap: 4 }} title={`${wetter.stadt} · ${wetter.txt}`}>
              <span>{wetter.icon}</span><span>{wetter.temp}°C</span>
            </div>
          )}
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold }}>KW {kw}</div>
        </div>
      </div>
    </Card>
  );
}

/* ── Heute (Dashboard · anpassbar) ── */

const TILE_KATALOG = {
  orakel: { icon: "🔮", t: "Orakel", s: "Karte ziehen", tab: "orakel" },
  luma: { icon: "✨", t: "ilho", s: "Mit deinem Begleiter reden", tab: "luma" },
  tagebuch: { icon: "📔", t: "Journaling", s: "Heute festhalten", tab: "tagebuch" },
  musik: { icon: "🎵", t: "Meditation", s: "10 Min Ruhe", tab: "media" },
  horoskop: { icon: "⭐", t: "Horoskop", s: "Dein Tag in den Sternen", tab: "orakel" },
  challenge: { icon: "🏆", t: "Challenge", s: "Weitermachen", tab: "tagebuch" },
  kurse: { icon: "🎓", t: "Kurse", s: "Weiterlernen, wo du warst", tab: "kurse" },
  mail: { icon: "📧", t: "Nachrichten", s: "Dein Postfach öffnen", mail: true },
};

function Heute({ name, go, streak, punkte, addPunkte, termine, setTermine, prefs, setPrefs, ch369, meinZeichen, openPunkte, drawn, horo, entries, setJournalSec }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [ilhoMsgs, setIlhoMsgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ilho_chat_history")) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("ilho_chat_history", JSON.stringify(ilhoMsgs));
  }, [ilhoMsgs]);

  /* Morning notification: 7-8am ilho prep alert */
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const lastNotif = localStorage.getItem("ilho_notif_date");
    const today = now.toDateString();

    if (hour >= 7 && hour < 9 && lastNotif !== today && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("☀️ Dein Tag ist vorbereitet", {
        body: "ilho hat deine Tageskarte, Mantra & Atemritual bereit. Komm in smile2go! 🤍",
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23FFD700'/></svg>",
      });
      localStorage.setItem("ilho_notif_date", today);
    }
  }, []);
  const di = dayIndex();
  const mot = MOTIVATION[di % MOTIVATION.length];
  const hour = new Date().getHours();
  const gruss = hour < 11 ? "Guten Morgen" : hour < 18 ? "Schön, dass du da bist" : "Guten Abend";
  const heuteStr = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });

  /* ilho-Logik: bestimme den heutigen Fokus */
  const determineUniqueFocus = () => {
    const items = [
      { k: "journal", icon: "📔", t: "Journaling", done: entries?.some((e) => e.date === heuteStr), nav: "tagebuch", sec: "heute", p: "+10", priority: 100 },
      { k: "challenge", icon: "🏆", t: "Challenge", done: ch369?.letzterTag === new Date().toDateString(), nav: "tagebuch", sec: "challenge", p: "+20", priority: 90 },
      { k: "horoskop", icon: "⭐", t: "Horoskop", done: !!horo?.text, nav: "orakel", p: "+3", priority: 50 },
    ];
    const pending = items.filter((x) => !x.done);
    return pending.length > 0 ? pending[0] : null;
  };

  const uniqueFocus = determineUniqueFocus();

  return (
    <div style={{ padding: "26px 20px 20px" }}>
      {/* ilho-Kopfzeile */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: C.sage, marginBottom: 2 }}>✨ ilho hat dein Tag vorbereitet</div>
          <H size={26} style={{ marginBottom: 4 }}>{gruss}{name ? `, ${name}` : ""} 🤍</H>
        </div>
        <button onClick={() => go("profil")} aria-label="Mein Bereich" style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid ${C.gold}`, background: C.card, cursor: "pointer", fontSize: 22, color: C.gold, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(58,42,34,.1)" }}>👤</button>
      </div>

      {/* Für dich erledigt: ilho's Vorbereitung */}
      <Card style={{ marginBottom: 18, background: C.roseSoft, border: `1px dashed ${C.rose}` }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.plum, marginBottom: 10 }}>📋 Für dich vorbereitet</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>🎴</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>Tageskarte gezogen — <span style={{ fontWeight: 600 }}>{drawn?.n || "wartet…"}</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>☀️</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>Mantra bereit — <span style={{ fontStyle: "italic", fontWeight: 500 }}>„{mot.t}"</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🕯️</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>2-Min-Atemritual bereit</span>
        </div>
      </Card>

      {/* Dein heutiger Sonnenstrahl */}
      <Card style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <div style={{ fontSize: 20, flexShrink: 0 }}>☀️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.plum }}>Dein heutiger Sonnenstrahl</div>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.55, marginTop: 4, marginBottom: 0 }}><strong>{mot.t}</strong> {mot.s}</p>
        </div>
      </Card>

      {/* Dein einziger Schritt heute */}
      {uniqueFocus ? (
        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, ${C.roseSoft})`, padding: "16px 18px" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.plum, marginBottom: 12 }}>💫 Dein einziger Schritt heute</div>
          <button onClick={() => {
            if (uniqueFocus.sec && setJournalSec) setJournalSec(uniqueFocus.sec);
            go(uniqueFocus.nav);
          }} style={{
            width: "100%", padding: "16px 14px", borderRadius: 14, cursor: "pointer",
            border: `2px solid ${C.plum}`, background: "#fff8f0", textAlign: "left",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>{uniqueFocus.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 700, color: C.espresso }}>{uniqueFocus.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>{uniqueFocus.p} · klick mich 👈</div>
            </div>
          </button>
        </Card>
      ) : (
        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, #E8F5E0)` }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.sage, marginBottom: 8 }}>🎉 Alles erledigt!</div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.5, marginBottom: 0 }}>Du hast heute alles geschafft. <strong>Ruhe dich aus — du verdienst es.</strong></p>
        </Card>
      )}

      {/* Status: Punkte & Streak */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, fontWeight: 600 }}>🔥 {streak} Tage Serie</span>
        <button onClick={openPunkte} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum, background: C.roseSoft, border: `1.5px solid ${C.rose}`, borderRadius: 20, padding: "5px 12px", cursor: "pointer" }}>✨ {punkte} Sonnenstrahlen ›</button>
      </div>

      {/* ilho Chat Drawer */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
        <button onClick={() => setChatOpen(!chatOpen)} style={{
          width: "100%", padding: "14px 16px", borderRadius: 14, cursor: "pointer",
          border: `1.5px solid ${C.plum}`, background: chatOpen ? C.roseSoft : C.card,
          fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: C.plum,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <span>ilho fragen — alles was dich bewegt</span>
          <span style={{ marginLeft: "auto", fontSize: 12 }}>{chatOpen ? "▼" : "▶"}</span>
        </button>
      </div>

      {chatOpen && (
        <div style={{
          marginTop: 12, padding: "12px", background: C.cream, borderRadius: 14,
          border: `1px solid ${C.line}`, maxHeight: "360px", display: "flex", flexDirection: "column",
        }}>
          {ilhoMsgs.length > 0 && (
            <button onClick={() => setIlhoMsgs([])} style={{
              alignSelf: "flex-end", fontSize: 11, fontFamily: "system-ui", color: C.ink,
              background: "none", border: "none", cursor: "pointer", marginBottom: 6, opacity: 0.6,
            }}>clear</button>
          )}
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 10, paddingRight: 4 }}>
            {ilhoMsgs.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 10px", color: C.ink }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 15, marginBottom: 8 }}>Hallo {name || "du"} 🤍</div>
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, lineHeight: 1.5, marginBottom: 0 }}>
                  Was dich bewegt, hat hier Raum. Ich bin ilho, dein KI-Assistent.
                </p>
              </div>
            )}
            {ilhoMsgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                <div style={{
                  maxWidth: "76%", padding: "10px 12px", borderRadius: 14,
                  background: m.role === "user" ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.card,
                  border: m.role === "user" ? "none" : `1px solid ${C.line}`,
                  color: m.role === "user" ? "#fff" : C.espresso,
                  fontFamily: "system-ui, sans-serif", fontSize: 13, lineHeight: 1.5,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              id="ilho-input"
              placeholder="Schreib ilho …"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  const msg = e.currentTarget.value.trim();
                  const newMsgs = [...ilhoMsgs, { role: "user", content: msg }];
                  setIlhoMsgs(newMsgs);
                  e.currentTarget.value = "";

                  const callAI = async () => {
                    try {
                      const recentMsgs = newMsgs.slice(-6);
                      const recentEntries = entries?.slice(-3)?.map((e) => e.text?.slice(0, 100)).join(" | ") || "keine neulich";
                      const ctx = `${ILHO_SYSTEM}\n(Kontext: Nutzerin ${name}, Streak ${streak}d. Journal (letzte 3): ${recentEntries})`;
                      const reply = await askLuma(recentMsgs, ctx);
                      setIlhoMsgs((prev) => [...prev, { role: "assistant", content: reply }]);
                    } catch (err) {
                      setIlhoMsgs((prev) => [...prev, { role: "assistant", content: "Gerade kann ich dich nicht erreichen. Versuch es gleich noch einmal. 🤍" }]);
                    }
                  };
                  callAI();
                }
              }}
              style={{
                flex: 1, padding: "10px 12px", fontSize: 13, fontFamily: "system-ui, sans-serif",
                border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none",
              }}
            />
            <Mikro size={40} onText={(t) => {
              const inp = document.getElementById("ilho-input");
              if (inp) { inp.value = (inp.value ? inp.value + " " : "") + t; inp.focus(); }
            }} />
            <button onClick={() => {
              const inp = document.getElementById("ilho-input");
              if (inp && inp.value.trim()) inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter" }));
            }} style={{
              width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 16, flexShrink: 0,
            }}>↑</button>
          </div>
        </div>
      )}

      {/* Mehr: Alle Features */}
      <Card style={{ marginTop: 16, background: C.cream, textAlign: "center", padding: "12px" }}>
        <button onClick={() => go("tagebuch")} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: C.plum, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Alle Funktionen (25+)</button>
      </Card>
    </div>
  );
}

/* ── ilho — KI-Assistent (echte Claude-API) ── */

function Luma({ name, energie, msgs, setMsgs }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const ctx = energie ? `\n(Kontext: Die Nutzerin heißt ${name}, ihre heutige Energie: ${energie.t} ${energie.v}/5.)` : `\n(Kontext: Die Nutzerin heißt ${name}.)`;
      const reply = await askLuma(next, ILHO_SYSTEM + ctx);
      setMsgs([...next, { role: "assistant", content: reply || "Ich bin hier. Erzähl mir mehr davon. 🤍" }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Gerade kann ich dich nicht erreichen — versuch es gleich noch einmal. 🤍" }]);
    }
    setBusy(false);
  };

  const starters = ["Ich fühle mich heute unruhig", "Hilf mir, eine Intention zu setzen", "Wie lasse ich Grübeln los?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 86px)", maxHeight: "calc(100vh - 86px)" }}>
      <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${C.line}`, background: C.cream }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✨</div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso }}>ilho</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.sage, fontWeight: 600 }}>● Dein KI-Assistent · immer für dich da</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
            <H size={19} style={{ marginBottom: 8 }}>Hallo{name ? ` ${name}` : ""} 🤍</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, marginBottom: 20 }}>
              Ich bin ilho. Was dich bewegt, hat hier Raum — ohne Bewertung, in deinem Tempo.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {starters.map((s) => (
                <button key={s} onClick={() => setInput(s)} style={{
                  fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.plum,
                  background: C.roseSoft, border: "none", borderRadius: 20, padding: "12px 16px", cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "82%", padding: "12px 15px", borderRadius: 18,
              borderBottomRightRadius: m.role === "user" ? 6 : 18,
              borderBottomLeftRadius: m.role === "user" ? 18 : 6,
              background: m.role === "user" ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.card,
              border: m.role === "user" ? "none" : `1px solid ${C.line}`,
              color: m.role === "user" ? "#fff" : C.espresso,
              fontFamily: "system-ui, sans-serif", fontSize: 14.5, lineHeight: 1.55,
              whiteSpace: "pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {busy && (
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, padding: "4px 2px" }}>✨ ilho schreibt …</div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "10px 14px 12px", borderTop: `1px solid ${C.line}`, background: C.cream, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Schreib ilho …"
          style={{ flex: 1, padding: "13px 16px", fontSize: 15, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 22, background: C.card, color: C.espresso, outline: "none" }}
        />
        <button onClick={send} disabled={busy} style={{
          width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 18, flexShrink: 0,
          opacity: busy ? 0.6 : 1,
        }}>↑</button>
      </div>
    </div>
  );
}

const STERNZEICHEN = [
  { n: "Widder", e: "♈", d: "21.3.–19.4." }, { n: "Stier", e: "♉", d: "20.4.–20.5." },
  { n: "Zwillinge", e: "♊", d: "21.5.–20.6." }, { n: "Krebs", e: "♋", d: "21.6.–22.7." },
  { n: "Löwe", e: "♌", d: "23.7.–22.8." }, { n: "Jungfrau", e: "♍", d: "23.8.–22.9." },
  { n: "Waage", e: "♎", d: "23.9.–22.10." }, { n: "Skorpion", e: "♏", d: "23.10.–21.11." },
  { n: "Schütze", e: "♐", d: "22.11.–21.12." }, { n: "Steinbock", e: "♑", d: "22.12.–19.1." },
  { n: "Wassermann", e: "♒", d: "20.1.–18.2." }, { n: "Fische", e: "♓", d: "19.2.–20.3." },
];

function sternzeichenAusDatum(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1, t = d.getDate();
  const z = [
    ["Steinbock", "Wassermann", 20], ["Wassermann", "Fische", 19], ["Fische", "Widder", 21],
    ["Widder", "Stier", 20], ["Stier", "Zwillinge", 21], ["Zwillinge", "Krebs", 21],
    ["Krebs", "Löwe", 23], ["Löwe", "Jungfrau", 23], ["Jungfrau", "Waage", 23],
    ["Waage", "Skorpion", 23], ["Skorpion", "Schütze", 22], ["Schütze", "Steinbock", 22],
  ];
  const [a, b, cut] = z[m - 1];
  const name = t < cut ? a : b;
  return STERNZEICHEN.find((s) => s.n === name) || null;
}

const TAROT_KARTEN = [
  { n: "Der Magier", e: "🪄" }, { n: "Die Hohepriesterin", e: "🌙" }, { n: "Die Herrscherin", e: "👑" },
  { n: "Die Liebenden", e: "💞" }, { n: "Die Kraft", e: "🦁" }, { n: "Das Rad des Schicksals", e: "☸️" },
  { n: "Die Gerechtigkeit", e: "⚖️" }, { n: "Der Stern", e: "⭐" }, { n: "Der Mond", e: "🌕" },
  { n: "Die Sonne", e: "☀️" }, { n: "Die Welt", e: "🌍" }, { n: "Das Urteil", e: "📯" },
];

const KATINA_KARTEN = [
  "Herz-As ❤️", "Herz-Dame 💃", "Herz-König 🤴", "Herz-Zehn 💗", "Karo-As ✨",
  "Karo-Zehn 💎", "Karo-Bube 📜", "Pik-Dame 🌑", "Kreuz-Bube 🍀", "Kreuz-Zehn 🌿",
];

const AUFGABEN_KARTEN = [
  { icon: "💌", t: "Schreibe einer Freundin eine liebevolle Nachricht — einfach so." },
  { icon: "🚶‍♀️", t: "Geh 20 Minuten ohne Handy spazieren und nimm 3 schöne Dinge wahr." },
  { icon: "🪞", t: "Sag dir heute 3× laut vor dem Spiegel: „Ich bin genug.“" },
  { icon: "🕯️", t: "Zünde eine Kerze an und sitze 5 Minuten nur mit deinem Atem." },
  { icon: "📵", t: "Eine Stunde vor dem Schlafen: kein Bildschirm. Nur du und Ruhe." },
  { icon: "💧", t: "Trinke heute bewusst — jedes Glas Wasser als kleines Ritual." },
  { icon: "🌸", t: "Kauf oder pflück dir selbst eine Blume. Du verdienst Schönheit." },
  { icon: "🙅‍♀️", t: "Sag heute einmal liebevoll Nein — zu etwas, das dich Kraft kostet." },
  { icon: "📖", t: "Lies 10 Seiten, die deine Seele nähren — kein Scrollen." },
  { icon: "🤗", t: "Umarme heute jemanden bewusst und lange — oder dich selbst." },
];

function Horoskop({ horo, setHoro, energie, addPunkte, setMeinZeichen, meinZeichen, briefkopf, openMystik }) {
  const [mail, setMail] = useState("");
  const [hinweis, setHinweis] = useState("");
  const senden = () => {
    if (!mail.includes("@")) { setHinweis("Bitte gültige E-Mail eingeben."); setTimeout(() => setHinweis(""), 2400); return; }
    setHinweis(`💌 Horoskop „${horo.sign.n}" an ${mail} gesendet${briefkopf ? ` — mit deinem Briefkopf „${briefkopf.firma}"` : ""} ✓`);
    setMail("");
    setTimeout(() => setHinweis(""), 3400);
  };
  const [busy, setBusy] = useState(false);
  const heute = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });

  const lesen = async (z) => {
    setBusy(true);
    setHoro({ sign: z, text: "" });
    if (setMeinZeichen) setMeinZeichen(z);
    if (addPunkte) addPunkte(3, "Horoskop gelesen");
    try {
      const e = energie ? ` Ihre heutige Energie: ${energie.t} (${energie.v}/5).` : "";
      const txt = await askLuma(
        [{ role: "user", content: `Schreibe ein liebevolles, ermutigendes Tageshoroskop für das Sternzeichen ${z.n} für heute (${heute}).${e} 4–5 Sätze, Du-Form, Themen: Energie, Herz/Beziehungen, Fokus des Tages. Warm und stärkend, keine düsteren Prophezeiungen. Schließe mit einem kurzen Tagesimpuls.` }],
        ILHO_SYSTEM
      );
      setHoro({ sign: z, text: txt || "Die Sterne stehen heute sanft zu dir — vertrau deinem Gefühl." });
    } catch {
      setHoro({ sign: z, text: "Die Sterne sind gerade verschleiert — versuch es gleich noch einmal. 🤍" });
    }
    setBusy(false);
  };

  return (
    <div>
      {!horo?.sign && (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink, marginBottom: 16, lineHeight: 1.55 }}>
            {meinZeichen
              ? `Dein Sternzeichen: ${meinZeichen.n} ${meinZeichen.e} — tippe, und ilho liest die Energie des Tages für dich.`
              : "Dein Sternzeichen wird aus deinem Geburtsdatum bei der Registrierung berechnet. Tippe zum Lesen."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: meinZeichen ? "1fr" : "1fr 1fr 1fr", gap: 9 }}>
            {(meinZeichen ? [meinZeichen] : STERNZEICHEN).map((z) => (
              <Card key={z.n} onClick={() => lesen(z)} style={{ padding: "13px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 24, color: C.plum }}>{z.e}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: C.espresso, marginTop: 3 }}>{z.n}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 9.5, color: C.ink, marginTop: 1 }}>{z.d}</div>
              </Card>
            ))}
          </div>
        </>
      )}

      {horo?.sign && (
        <div style={{ animation: "fadeUp .5s ease" }}>
          <Card style={{ textAlign: "center", marginBottom: 14, background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 150%)`, border: "none" }}>
            <div style={{ fontSize: 40, color: C.goldPale }}>{horo.sign.e}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#FFF8F0" }}>{horo.sign.n}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.goldPale, marginTop: 4 }}>Tageshoroskop · {heute}</div>
          </Card>
          {busy ? (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.plum, textAlign: "center" }}>✨ ilho liest die Sterne für dich …</p>
          ) : (
            <Card style={{ background: C.roseSoft, border: "none" }}>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.espresso, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{horo.text}</p>
            </Card>
          )}
          {!busy && horo.text && (() => {
            const di2 = dayIndex();
            const idx = STERNZEICHEN.findIndex((z) => z.n === horo.sign.n);
            const zahl = ((di2 * 7 + idx * 3) % 21) + 1;
            const farben = [["Gold", "#C9963C"], ["Rosé", "#D96E8B"], ["Salbeigrün", "#93B07F"], ["Himmelblau", "#7A99B8"], ["Lavendel", "#9B8AC4"], ["Pflaume", "#8E4A63"], ["Creme", "#EFE0C8"]];
            const gf = farben[(di2 + idx) % farben.length];
            return (
              <Card style={{ marginTop: 12, background: C.goldPale, border: `1px solid ${C.goldSoft}` }}>
                <Eyebrow>🍀 Dein Glück heute · {horo.sign.n}</Eyebrow>
                <div style={{ display: "flex", gap: 22, alignItems: "center", marginBottom: 4 }}>
                  <div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.ink, fontWeight: 700 }}>Glückszahl</div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.plum }}>{zahl}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.ink, fontWeight: 700 }}>Glücksfarbe</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: gf[1], border: "1.5px solid rgba(0,0,0,.12)" }} />
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso }}>{gf[0]}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => openMystik && openMystik("tarot")} style={{ flex: 1, padding: "11px 0", borderRadius: 13, cursor: "pointer", border: `1.5px solid ${C.line}`, background: C.card, fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: C.espresso }}>🎴 Tarot</button>
                </div>
              </Card>
            );
          })()}

          {!busy && horo.text && (
            <Card style={{ marginTop: 12 }}>
              <Eyebrow color={C.plum}>💌 Dieses Horoskop verschenken</Eyebrow>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, lineHeight: 1.5, marginBottom: 10 }}>
                Hast du für eine Freundin nachgeschaut? Schick es ihr per Mail{briefkopf ? " — mit deinem Briefkopf" : " (Briefkopf in „Mein Office“ einrichten für deine Marke)"}.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={mail} onChange={(e) => setMail(e.target.value)} placeholder="E-Mail der Empfängerin …"
                  style={{ flex: 1, padding: "11px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none" }} />
                <Btn small onClick={senden}>Senden</Btn>
              </div>
              {hinweis && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum, marginTop: 9, animation: "fadeUp .3s ease" }}>{hinweis}</p>}
            </Card>
          )}
          {!busy && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Btn small ghost onClick={() => setHoro(null)}>{meinZeichen ? "Neu lesen" : "Anderes Sternzeichen wählen"}</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mystik: Tarot · Katina · Traumdeutung ── */

function Mystik({ energie, addPunkte, art, setArt }) {
  const [eingabe, setEingabe] = useState("");
  const [karten, setKarten] = useState(null);
  const [lesung, setLesung] = useState("");
  const [busy, setBusy] = useState(false);

  const ARTEN = [
    ["tarot", "🎴 Tarot"], ["katina", "🃏 Katina"], ["traum", "🌙 Traumdeutung"],
  ];

  const wechsel = (k) => { setArt(k); setKarten(null); setLesung(""); setEingabe(""); };

  const start = async () => {
    setBusy(true);
    setLesung("");
    const e = energie ? ` (Energie der Nutzerin heute: ${energie.t})` : "";
    let prompt = "";
    let gezogen = null;
    if (art === "tarot") {
      gezogen = [...TAROT_KARTEN].sort(() => Math.random() - 0.5).slice(0, 3);
      setKarten(gezogen);
      prompt = `Tarot-Legung „Vergangenheit – Gegenwart – Zukunft": 1. ${gezogen[0].n}, 2. ${gezogen[1].n}, 3. ${gezogen[2].n}.${e} Frage der Nutzerin: ${eingabe || "allgemeine Lebensführung"}. Deute die drei Karten warm und stärkend, 5–7 Sätze, Du-Form. Schließe mit einem Tagesimpuls.`;
    } else if (art === "katina") {
      gezogen = [...KATINA_KARTEN].sort(() => Math.random() - 0.5).slice(0, 3).map((n) => ({ n, e: "" }));
      setKarten(gezogen);
      prompt = `Katina-Kartenlegung (Liebes- und Herzensorakel) mit den Karten: ${gezogen.map((k) => k.n).join(", ")}.${e} Frage: ${eingabe || "Liebe & Herzensweg"}. Gib eine warme, hoffnungsvolle Deutung im Stil einer liebevollen Kartenlegerin, 5–6 Sätze, Du-Form.`;
    } else if (art === "kaffee") {
      if (!eingabe.trim()) { setBusy(false); return; }
      prompt = `Kaffeesatz-Lesung: Die Nutzerin sieht in ihrer Tasse folgende Formen/Symbole: „${eingabe}".${e} Deute die Symbole poetisch und ermutigend im Stil des traditionellen Kaffeesatzlesens, 5–6 Sätze, Du-Form.`;
    } else {
      if (!eingabe.trim()) { setBusy(false); return; }
      prompt = `Traumdeutung: Die Nutzerin hat geträumt: „${eingabe}".${e} Deute den Traum einfühlsam mit Symbolsprache (kein Psycho-Diagnostizieren), was er für ihren Alltag bedeuten könnte, 5–7 Sätze, Du-Form. Schließe mit einer sanften Reflexionsfrage.`;
    }
    try {
      const txt = await askLuma([{ role: "user", content: prompt }], ILHO_SYSTEM);
      setLesung(txt || "Die Zeichen sind heute still — versuch es gleich noch einmal. 🤍");
      if (addPunkte) addPunkte(4, ARTEN.find((a) => a[0] === art)[1]);
    } catch {
      setLesung("Die Verbindung zu den Zeichen ist gerade verschleiert — versuch es gleich noch einmal. 🤍");
    }
    setBusy(false);
  };

  const brauchtText = art === "kaffee" || art === "traum";
  const platzhalter = {
    tarot: "Deine Frage an die Karten (optional) …",
    katina: "Deine Herzensfrage (optional) …",
    kaffee: "Welche Formen siehst du? z. B. Vogel, Berg, Herz, Weg …",
    traum: "Erzähl deinen Traum …",
  }[art];

  return (
    <div>
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {ARTEN.map(([k, label]) => (
          <button key={k} onClick={() => wechsel(k)} style={{
            fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600,
            padding: "9px 13px", borderRadius: 20, cursor: "pointer", minHeight: 38,
            border: `1.5px solid ${art === k ? C.rose : C.line}`,
            background: art === k ? C.roseSoft : "transparent",
            color: art === k ? C.plum : C.ink,
          }}>{label}</button>
        ))}
      </div>

      {brauchtText ? (
        <textarea value={eingabe} onChange={(ev) => setEingabe(ev.target.value)} placeholder={platzhalter} rows={4}
          style={{ width: "100%", padding: "14px 15px", fontSize: 15, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, marginBottom: 12, outline: "none", resize: "vertical", lineHeight: 1.6 }} />
      ) : (
        <input value={eingabe} onChange={(ev) => setEingabe(ev.target.value)} placeholder={platzhalter}
          style={{ width: "100%", padding: "14px 15px", fontSize: 15, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, marginBottom: 12, outline: "none" }} />
      )}

      <Btn full onClick={start} disabled={busy}>
        {busy ? "✨ ilho liest für dich …" : art === "tarot" ? "3 Karten ziehen 🎴" : art === "katina" ? "Karten legen 🃏" : art === "kaffee" ? "Tasse lesen ☕" : "Traum deuten 🌙"}
      </Btn>

      {karten && (
        <div style={{ display: "flex", gap: 9, margin: "16px 0 0", justifyContent: "center" }}>
          {karten.map((k, i) => (
            <div key={i} style={{ flex: 1, maxWidth: 110, background: C.card, border: `1.5px solid ${C.goldSoft}`, borderRadius: 13, padding: "13px 6px", textAlign: "center", animation: `fadeUp .4s ease ${i * 0.12}s both` }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 5 }}>
                {art === "tarot" ? ["Vergangenheit", "Gegenwart", "Zukunft"][i] : `Karte ${i + 1}`}
              </div>
              {k.e && <div style={{ fontSize: 24 }}>{k.e}</div>}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12.5, color: C.espresso, marginTop: 4, lineHeight: 1.25 }}>{k.n}</div>
            </div>
          ))}
        </div>
      )}

      {lesung && (
        <Card style={{ marginTop: 16, background: C.roseSoft, border: "none", animation: "fadeUp .5s ease" }}>
          <Eyebrow color={C.plum}>✨ Deine Lesung</Eyebrow>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{lesung}</p>
        </Card>
      )}

      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.75, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
        Zur Inspiration & liebevollen Selbstreflexion ✨ — keine Vorhersage, kein Ersatz für professionellen Rat.
      </p>
    </div>
  );
}

/* ── Orakel · Göttinnen & weibliche Urkräfte ── */

function Orakel({ drawn, setDrawn, energie, horo, setHoro, addPunkte, setMeinZeichen, meinZeichen, briefkopf, entries, setEntries, archetyp }) {
  const [mode, setMode] = useState("karte");
  const [mystikArt, setMystikArt] = useState("tarot");
  const [flip, setFlip] = useState(!!drawn);
  const [deutung, setDeutung] = useState("");
  const [busy, setBusy] = useState(false);
  const [reflexion, setReflexion] = useState("");
  const [gespeichert, setGespeichert] = useState(false);
  const heute = new Date().toDateString();
  // Tageskarte gilt nur für den heutigen Tag — morgens wartet automatisch eine neue.
  useEffect(() => {
    if (drawn && drawn.tag && drawn.tag !== heute) { setDrawn(null); setFlip(false); setDeutung(""); }
  }, []);
  const card = drawn && (!drawn.tag || drawn.tag === heute) ? drawn : null;

  const draw = (neu) => {
    const rest = neu && card ? GOETTINNEN.filter((g) => g.n !== card.n) : GOETTINNEN;
    const auswahl = rest.length ? rest : GOETTINNEN;
    const c = auswahl[Math.floor(Math.random() * auswahl.length)];
    setDeutung("");
    setDrawn({ ...c, tag: heute });
    setFlip(true);
    if (addPunkte && !neu) addPunkte(5, "Tageskarte gezogen");
    logEvent("karte_gezogen", c.b);
  };

  // Ehrliche Ersatz-Deutung, falls die KI nicht erreichbar ist — nie derselbe Text wie auf der Karte.
  const ersatzDeutung = (c) => {
    const teile = [
      `${c.n} begleitet dich heute als ${c.sub.toLowerCase()}.`,
      c.tief ? c.tief.split(/(?<=\.)\s/).slice(0, 2).join(" ") : `Ihr Thema ist ${c.b.toLowerCase()} — schau heute bewusst dorthin.`,
      c.frage ? `Nimm diese Frage mit in den Tag: ${c.frage}` : "",
      c.ritual ? `Kleiner Impuls: ${c.ritual.split(/(?<=\.)\s/)[0]}` : "",
    ].filter(Boolean);
    return teile.join(" ");
  };

  const deuten = async () => {
    setBusy(true);
    try {
      const e = energie ? ` Ihre heutige Energie: ${energie.t} (${energie.v}/5).` : "";
      const a = archetyp ? ` Ihr Archetyp: ${archetyp.name}.` : "";
      const j = (entries || []).slice(0, 3).map((x) => [x.intention, ...(x.items || [])].filter(Boolean).join(" · ")).filter(Boolean).join(" | ");
      const jr = j ? ` Ihre letzten Journal-Themen: ${j.slice(0, 300)}.` : "";
      const txt = await askLuma(
        [{ role: "user", content: `Die Nutzerin hat die Göttinnen-Karte „${card.n}" (${card.sub}, Bereich ${card.b}) gezogen. Botschaft der Karte: ${card.txt}${e}${a}${jr}\n\nGib ihr eine persönliche, warme Deutung für ihren heutigen Tag — 3 bis 4 Sätze, Du-Form. WICHTIG: Wiederhole NICHT den Kartentext, sondern übersetze ihn in ihren Alltag und schließe mit einer konkreten kleinen Einladung für heute.` }],
        ILHO_SYSTEM
      );
      const sauber = (txt || "").trim();
      // Falls die KI nur die Karte wiederholt: eigene Deutung nutzen.
      setDeutung(!sauber || sauber.replace(/\s+/g, "") === card.txt.replace(/\s+/g, "") ? ersatzDeutung(card) : sauber);
    } catch {
      setDeutung(ersatzDeutung(card));
    }
    setBusy(false);
  };

  const reflexionSpeichern = () => {
    if (!reflexion.trim() || !setEntries) return;
    setEntries([{
      date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }),
      intention: `🔮 ${card.n}`,
      items: [reflexion.trim()],
    }, ...(entries || [])]);
    setReflexion("");
    setGespeichert(true);
    if (addPunkte) addPunkte(10, "Orakel-Reflexion");
    setTimeout(() => setGespeichert(false), 2600);
  };

  return (
    <div style={{ padding: "26px 20px", textAlign: "center" }}>
      <Eyebrow>Orakel</Eyebrow>
      <H size={25} style={{ marginBottom: 8 }}>Deine Karte für heute</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.7, lineHeight: 1.5, marginBottom: 14 }}>
        Zur Inspiration &amp; Unterhaltung — keine Beratung, Diagnose oder Vorhersage.
      </p>

      {true && (
        <>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink, marginBottom: 16, lineHeight: 1.55 }}>
        Atme tief ein — und zieh deine Tageskarte.
      </p>

      <div style={{ perspective: 1100, margin: "0 auto 22px", width: 240, height: 372 }}>
        <div
          onClick={() => !card && draw()}
          style={{
            width: "100%", height: "100%", position: "relative",
            transformStyle: "preserve-3d",
            transform: flip ? "rotateY(180deg)" : "none",
            transition: "transform .8s cubic-bezier(.4,.1,.2,1)",
            cursor: card ? "default" : "pointer",
          }}
        >
          {/* Rückseite */}
          <div style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            borderRadius: 20, background: `linear-gradient(160deg, ${C.plum}, ${C.rose})`,
            border: `1.5px solid ${C.goldSoft}`, boxShadow: "0 14px 34px rgba(142,74,99,.3)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
          }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", border: `1.5px solid ${C.goldPale}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, animation: "floaty 3s ease-in-out infinite" }}>🌕</div>
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: C.goldPale, fontSize: 15 }}>
              Tippe zum Ziehen
            </div>
          </div>
          {/* Vorderseite */}
          <div style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)",
            borderRadius: 20, background: C.card, border: `1.5px solid ${C.gold}`,
            boxShadow: "0 14px 34px rgba(58,42,34,.18)",
            display: "flex", flexDirection: "column", padding: 12, gap: 8, overflow: "hidden",
          }} key={card?.n}>
            {card && ((S2GKARTEN[card.n] || KARTEN_BILDER[card.n])
              ? <img src={S2GKARTEN[card.n] || KARTEN_BILDER[card.n]} alt={card.n} loading="lazy" style={{ width: "100%", height: 196, objectFit: "cover", borderRadius: 12, display: "block", animation: "fadeUp .5s ease" }} />
              : <KartenArt g={card} />)}
            <div style={{ fontFamily: "Georgia, serif", fontSize: card && card.n.length > 18 ? 16.5 : 23, color: C.espresso, marginTop: 2, lineHeight: 1.2 }}>{card?.n}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>{card?.sub} · {card?.b}</div>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.55, padding: "0 6px" }}>{card?.txt}</p>
          </div>
        </div>
      </div>

      {!card && <Btn onClick={() => draw(false)}>Karte ziehen ✨</Btn>}

      {card && !deutung && (
        <Btn onClick={deuten} disabled={busy}>{busy ? "✨ ilho deutet deine Karte …" : "✨ Was bedeutet sie für mich?"}</Btn>
      )}

      {deutung && (
        <Card style={{ textAlign: "left", marginTop: 18, background: C.roseSoft, border: "none", animation: "fadeUp .5s ease" }}>
          <Eyebrow color={C.plum}>✨ Deine persönliche Deutung</Eyebrow>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.espresso, lineHeight: 1.65 }}>{deutung}</p>
        </Card>
      )}

      {card && (
        <Card style={{ textAlign: "left", marginTop: 18, animation: "fadeUp .5s ease" }}>
          <Eyebrow color={C.plum}>📝 Deine Reflexion</Eyebrow>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15.5, color: C.espresso, lineHeight: 1.6, marginBottom: 12 }}>
            Welche Gedanken und Gefühle kommen in dir hoch?
          </p>
          <textarea
            value={reflexion}
            onChange={(e) => setReflexion(e.target.value)}
            rows={4}
            placeholder="Schreib auf, was diese Karte in dir berührt …"
            style={{
              width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12,
              border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15,
              lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso,
            }}
          />
          <div style={{ marginTop: 10 }}>
            <Btn full onClick={reflexionSpeichern} disabled={!reflexion.trim()}>
              {gespeichert ? "🤍 Im Tagebuch gespeichert" : "Ins Tagebuch legen (+10 ✨)"}
            </Btn>
          </div>
          {gespeichert && (
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 8, textAlign: "center" }}>
              Du findest deine Reflexion jetzt im Tagebuch. 🤍
            </div>
          )}
        </Card>
      )}

      {card && (
        <div style={{ marginTop: 16 }}>
          <Btn ghost small onClick={() => draw(true)}>🔄 Neue Karte ziehen</Btn>
        </div>
      )}

      {card?.tief && (
        <Card style={{ textAlign: "left", marginTop: 18, animation: "fadeUp .5s ease" }}>
          <Eyebrow color={C.plum}>🌹 Orakelfrage</Eyebrow>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.espresso, lineHeight: 1.6, marginBottom: 16 }}>{card.frage}</p>

          <Eyebrow>✨ Affirmationen</Eyebrow>
          <div style={{ marginBottom: 16 }}>
            {card.affirmationen.map((a, i) => (
              <p key={i} style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>· {a}</p>
            ))}
          </div>

          <Eyebrow color={C.plum}>🌊 Tiefere Botschaft</Eyebrow>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.65, marginBottom: 16 }}>{card.tief}</p>

          <Eyebrow color={C.ink}>🌑 Schattenfrage</Eyebrow>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.6, marginBottom: 16 }}>{card.schatten}</p>

          <div style={{ background: C.roseSoft, borderRadius: 14, padding: 14 }}>
            <Eyebrow color={C.plum}>🕯️ Ritualimpuls</Eyebrow>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.65 }}>{card.ritual}</p>
          </div>
        </Card>
      )}

      {card && (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 16 }}>
          ✨ Deine Karte für heute ist gezogen. Morgen wartet eine neue.
        </p>
      )}
        </>
      )}
    </div>
  );
}

/* ── Kurse: Paket-Wahl · QR-Videos · Shop & Retreats ── */

/* Pseudo-QR (Prototyp) — Produktion: echter QR mit Video-Link der Coachin */
function QRCode({ seed }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = () => { h = (h * 1103515245 + 12345) >>> 0; return h / 4294967296; };
  const n = 17, cells = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const eck = (x < 5 && y < 5) || (x > n - 6 && y < 5) || (x < 5 && y > n - 6);
    if (eck) {
      const ix = x > n - 6 ? x - (n - 5) : x, iy = y > n - 6 ? y - (n - 5) : y;
      const ring = ix === 0 || iy === 0 || ix === 4 || iy === 4 || (ix > 1 && ix < 3 && iy > 1 && iy < 3) || (ix === 2 && iy === 2);
      if (ring) cells.push([x, y]);
    } else if (rnd() > 0.52) cells.push([x, y]);
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} style={{ width: 64, height: 64, background: "#fff", borderRadius: 8, padding: 4, border: `1px solid ${C.line}`, flexShrink: 0 }}>
      {cells.map(([x, y], i) => <rect key={i} x={x} y={y} width="1" height="1" fill={C.espresso} />)}
    </svg>
  );
}

const PLATTFORM_KURSE = [
  { coach: "Marie L.", t: "Human Design Basics", thema: "Selbsterkenntnis", p: "59 €" },
  { coach: "Sophia K.", t: "Räuchern & Rituale im Jahreskreis", thema: "Rituale", p: "39 €" },
  { coach: "Dr. Lena B.", t: "Nervensystem beruhigen", thema: "Stress & Körper", p: "89 €" },
  { coach: "Aylin T.", t: "Geld & weibliche Fülle", thema: "Money Mindset", p: "69 €" },
  { coach: "Carla M.", t: "Lenormand für Einsteigerinnen", thema: "Kartenlegen", p: "49 €" },
  { coach: "Nina W.", t: "Sichtbar auf Instagram als Coachin", thema: "Business", p: "79 €" },
];

const PRAEVENTION = [
  { icon: "🧘‍♀️", t: "Stress lösen & innere Ruhe", feld: "Stressbewältigung", einh: "8 Einheiten", p: "120 €" },
  { icon: "🌬️", t: "Achtsamkeit & Meditation", feld: "Stressbewältigung", einh: "8 Einheiten", p: "120 €" },
  { icon: "🕉️", t: "Sanftes Yoga für Frauen", feld: "Bewegung", einh: "8 Einheiten", p: "140 €" },
  { icon: "🌙", t: "Besser schlafen", feld: "Stressbewältigung", einh: "8 Einheiten", p: "110 €" },
];

const SHOP = [
  { icon: "🌹", t: "Kurs: Weibliche Urkraft", s: "8 Module · Video", p: "79 €" },
  { icon: "🌕", t: "Online-Retreat: Vollmond-Nacht", s: "Live · 3 Std mit Anja", p: "49 €" },
  { icon: "🏔️", t: "Retreat: Wochenende der Stille", s: "Allgäu · 2 Nächte · all-in", p: "299 €" },
  { icon: "💫", t: "Masterclass: Sichtbar als Coachin", s: "4 Wochen · Live + Replay", p: "149 €" },
];

function Kurse({ kursWahl, setKursWahl, addPunkte }) {
  const [auswahl, setAuswahl] = useState([]);
  const [suche, setSuche] = useState("");
  const treffer = suche.trim()
    ? PLATTFORM_KURSE.filter((k) => (k.t + k.thema + k.coach).toLowerCase().includes(suche.toLowerCase()))
    : [];
  const gewaehlt = kursWahl.length > 0;

  const toggle = (t) => {
    if (auswahl.includes(t)) setAuswahl(auswahl.filter((x) => x !== t));
    else if (auswahl.length < 3) setAuswahl([...auswahl, t]);
  };

  const bestaetigen = () => {
    if (!auswahl.length) return;
    setKursWahl(auswahl);
    if (addPunkte) addPunkte(10, "Kurse gewählt");
  };

  if (!gewaehlt)
    return (
      <div style={{ padding: "20px 20px" }}>
        <Eyebrow>Willkommen in deinen Kursen</Eyebrow>
        <H size={24} style={{ marginBottom: 8 }}>Wähle deine 3 Kurse</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 16 }}>
          In deinem <strong>Pro-Paket</strong> sind 3 Video-Kurse deiner Coachin enthalten — wähle, womit du beginnen möchtest. Wechseln kannst du später jederzeit.
        </p>
        {KURSE.map((k) => {
          const aktiv = auswahl.includes(k.t);
          return (
            <Card key={k.t} onClick={() => toggle(k.t)} style={{ marginBottom: 12, display: "flex", gap: 14, alignItems: "center", borderColor: aktiv ? C.rose : C.line, background: aktiv ? C.roseSoft : C.card }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: aktiv ? "#fff" : C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25, flexShrink: 0 }}>{k.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: C.espresso }}>{k.t}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 3 }}>{k.d} · {k.len}</div>
              </div>
              <div style={{ fontSize: 20, color: aktiv ? C.rose : C.line }}>{aktiv ? "✓" : "○"}</div>
            </Card>
          );
        })}
        <div style={{ margin: "16px 0 8px" }}>
          <Btn full onClick={bestaetigen} disabled={!auswahl.length}>
            {auswahl.length}/3 gewählt — Los geht's ✨
          </Btn>
        </div>
      </div>
    );

  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Meine Kurse</Eyebrow>
      <H size={24} style={{ marginBottom: 6 }}>Weiter, wo du warst</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginBottom: 16 }}>
        Setze fort, wo du warst — deine Kurs-Videos deiner Coachin.
      </p>

      {kursWahl.map((t, i) => {
        const k = KURSE.find((x) => x.t === t);
        const fortschritt = [40, 15, 0][i] ?? 0;
        return (
          <Card key={t} style={{ marginBottom: 12, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{k?.icon} {t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, margin: "3px 0 7px" }}>{k?.d}</div>
              <div style={{ height: 7, borderRadius: 6, background: C.beige, overflow: "hidden", marginBottom: 7 }}>
                <div style={{ width: `${fortschritt}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})` }} />
              </div>
              <Btn small>{fortschritt > 0 ? `▶ Weiter bei ${fortschritt} %` : "▶ Jetzt starten"}</Btn>
            </div>
          </Card>
        );
      })}
      <button onClick={() => { setKursWahl([]); }} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "4px 0 18px", textDecoration: "underline" }}>
        Kurse wechseln
      </button>

      <Eyebrow>Challenges</Eyebrow>
      <H size={20} style={{ margin: "6px 0 14px" }}>Deine Programme</H>
      {CHALLENGES.map((c) => {
        const pct = Math.round((c.done / c.days) * 100);
        return (
          <Card key={c.t} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{c.icon} {c.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.rose, fontWeight: 600 }}>
                {c.done > 0 ? `Tag ${c.done}/${c.days}` : "Starten"}
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: C.beige, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})` }} />
            </div>
          </Card>
        );
      })}

      <Eyebrow>🔍 Plattform — Kurse anderer Coaches</Eyebrow>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5, margin: "6px 0 10px" }}>
        Entdecke Kurse von Coaches auf der smile2go-Plattform — such nach Thema, Titel oder Name.
      </p>
      <input
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
        placeholder="z. B. Human Design, Rituale, Money …"
        style={{ width: "100%", padding: "13px 15px", fontSize: 14.5, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, outline: "none", marginBottom: 12 }}
      />
      {suche.trim() && (
        <div style={{ marginBottom: 18 }}>
          {treffer.length === 0 && (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, textAlign: "center", padding: "8px 0" }}>Keine Treffer — probier ein anderes Stichwort.</p>
          )}
          {treffer.map((k) => (
            <Card key={k.t} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", padding: 13, animation: "fadeUp .3s ease" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${C.goldSoft}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontFamily: "system-ui, sans-serif", fontWeight: 700, flexShrink: 0 }}>{k.coach[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{k.t}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 2 }}>{k.coach} · {k.thema}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.plum, marginBottom: 4 }}>{k.p}</div>
                <Btn small ghost>Ansehen</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Eyebrow color={C.sage}>🌿 Kurse für dein Wohlbefinden</Eyebrow>
      <H size={20} style={{ margin: "6px 0 14px" }}>Stress lösen, Kraft tanken</H>
      {PRAEVENTION.map((k) => (
        <Card key={k.t} style={{ marginBottom: 11, display: "flex", gap: 13, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>{k.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{k.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 2 }}>{k.feld} · {k.einh}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.plum, marginBottom: 5 }}>{k.p}</div>
            <Btn small ghost>Details</Btn>
          </div>
        </Card>
      ))}

      <Eyebrow>🛒 Neu für dich</Eyebrow>
      <H size={20} style={{ margin: "6px 0 14px" }}>Kurse</H>
      {SHOP.map((s) => (
        <Card key={s.t} style={{ marginBottom: 11, display: "flex", gap: 13, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>{s.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{s.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 2 }}>{s.s}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.plum, marginBottom: 5 }}>{s.p}</div>
            <Btn small ghost>Kaufen</Btn>
          </div>
        </Card>
      ))}
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.8, textAlign: "center", marginTop: 4 }}>
        Mit Lichtpunkten sparst du — z. B. 30 % Rabatt ab 300 ✨
      </p>
    </div>
  );
}

/* ── Journal-Hub: Tagebuch · Aufgaben · 3-6-9 · Money Mind ── */

function Journal({ entries, setEntries, ritual, setRitual, ch369, setCh369, mm, setMm, briefe, setBriefe, akarte, setAkarte, addPunkte, streak, punkte, initialSec }) {
  const [sec, setSec] = useState(initialSec || "heute");

  const chips = [
    { k: "heute", t: "📔 Journaling" },
    { k: "challenge", t: "🏆 Challenge" },
    { k: "rituale", t: "🔮 Rituale" },
    { k: "brief", t: "💌 Zukunftsbrief" },
    { k: "money", t: "💰 Fülle" },
  ];

  // Higgsfield-Kinovideos pro Bereich (Erklärtexte bleiben Text)
  const SEC_MEDIA = {
    heute:     { v: S2GVID.journal,   p: S2GIMG.journal,   t: "Journaling",    s: "Dein Raum. Kein richtig, kein falsch." },
    challenge: { v: S2GVID.challenge, p: S2GIMG.challenge, t: "Challenge",     s: "Ein Schritt. Jeden Tag." },
    rituale:   { v: S2GVID.rituale,   p: S2GIMG.rituale,   t: "Rituale",       s: "Kleine Rituale, große Wirkung." },
    brief:     { v: S2GVID.brief,     p: S2GIMG.brief,     t: "Zukunftsbrief", s: "Ein Brief an dich selbst." },
    money:     { v: S2GVID.fuelle,    p: S2GIMG.fuelle,    t: "Fülle",         s: "Du darfst empfangen." },
  };
  const sm = SEC_MEDIA[sec];

  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Journal & Aufgaben</Eyebrow>
      <H size={25} style={{ marginBottom: 14 }}>Dein täglicher Raum</H>

      <div style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
        {chips.map((c) => (
          <button key={c.k} onClick={() => setSec(c.k)} style={{
            fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600,
            padding: "9px 13px", borderRadius: 20, cursor: "pointer", minHeight: 38,
            border: `1.5px solid ${sec === c.k ? C.rose : C.line}`,
            background: sec === c.k ? C.roseSoft : "transparent",
            color: sec === c.k ? C.plum : C.ink,
          }}>{c.t}</button>
        ))}
      </div>

      {sm && <MediaBanner video={sm.v} poster={sm.p} title={sm.t} subtitle={sm.s} height={190} />}

      {sec === "heute" && <JournalHeute entries={entries} setEntries={setEntries} addPunkte={addPunkte} />}
      {sec === "challenge" && (
        <>
          <Challenge369 ch={ch369} setCh={setCh369} akarte={akarte} setAkarte={setAkarte} addPunkte={addPunkte} />
          <div style={{ marginTop: 22, borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>
            <Fortschritt streak={streak} entries={entries} punkte={punkte} />
          </div>
        </>
      )}
      {sec === "rituale" && <Rituale ritual={ritual} setRitual={setRitual} addPunkte={addPunkte} />}
      {sec === "brief" && <Brief briefe={briefe} setBriefe={setBriefe} addPunkte={addPunkte} />}
      {sec === "money" && <MoneyMind mm={mm} setMm={setMm} addPunkte={addPunkte} />}
    </div>
  );
}

/* — Heute: Intention · Dankbarkeit · Wachstum — */
const FRAGEN = [
  { icon: "🌤️", q: "Was wünsche ich mir heute am meisten?" },
  { icon: "🏆", q: "Worauf bin ich heute besonders stolz?" },
  { icon: "🌱", q: "Was kann ich morgen besser machen als heute?" },
  { icon: "🔍", q: "Was in meinem Leben verdient mehr Aufmerksamkeit von mir?" },
  { icon: "🍃", q: "Gibt es etwas, was ich loslassen darf?" },
  { icon: "💗", q: "Hör auf dein Herz: Welcher Satz kommt heute direkt aus deinem Herzen?" },
];

function JournalHeute({ entries, setEntries, addPunkte }) {
  const [intention, setIntention] = useState("");
  const [dank, setDank] = useState(["", "", "", "", "", ""]);
  const [stimmung, setStimmung] = useState(null);
  const [saved, setSaved] = useState(false);

  const input = {
    width: "100%", padding: "14px 15px", fontSize: 15.5,
    fontFamily: "Georgia, serif", fontStyle: "italic",
    border: `1.5px solid ${C.line}`, borderRadius: 14,
    background: C.card, color: C.espresso, marginBottom: 12, outline: "none",
  };

  const save = () => {
    const items = dank.map((x, i) => x.trim() && `${FRAGEN[i].icon} ${x.trim()}`).filter(Boolean);
    if (stimmung) items.unshift(`📊 Heute geht es mir: ${stimmung}/10`);
    if (!intention.trim() && !items.length) return;
    setEntries([{
      date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }),
      intention: intention.trim(), items, stimmung,
    }, ...entries]);
    setIntention(""); setDank(["", "", "", "", "", ""]); setStimmung(null);
    if (addPunkte) addPunkte(10, "Tagebuch-Eintrag");
    logEvent("journal_eintrag");
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      {(() => {
        const a = affirmationDesTages();
        return (
          <Card style={{ marginBottom: 14, background: C.goldPale, border: `1px solid ${C.goldSoft}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>🌅 Deine Tages-Inspiration</Eyebrow>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.plum, fontWeight: 700 }}>{a.icon} {a.t}</span>
            </div>
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 17.5, color: C.espresso, lineHeight: 1.55, margin: "4px 0 10px" }}>
              „{a.s}“
            </p>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.85 }}>
              Sprich diesen Satz heute ein paar Mal langsam aus — morgen wartet ein neuer.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <input
                style={{ ...input, margin: 0, background: "#fff", flex: 1 }}
                placeholder="Deine eigene Intention für heute (optional) …"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
              />
              <Mikro size={38} onText={(t) => setIntention((prev) => (prev ? prev + " " : "") + t)} />
            </div>
          </Card>
        );
      })()}

      {/* Buchseite — schreiben wie in einem echten Tagebuch */}
      <div style={{
        marginBottom: 14, borderRadius: "6px 16px 16px 6px", padding: "18px 18px 22px",
        background: "linear-gradient(105deg, #F3E9D8 0%, #FDF9EF 7%, #FFFDF6 60%, #F8EFDD 100%)",
        border: `1px solid ${C.line}`, borderLeft: `6px solid ${C.gold}`,
        boxShadow: "inset 14px 0 18px -14px rgba(58,42,34,.22), 0 6px 18px rgba(58,42,34,.08)",
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <Eyebrow color={C.plum}>📖 Deine Ausrichtung für heute</Eyebrow>
          <span style={{ fontFamily: '"Snell Roundhand", "Savoye LET", "Segoe Script", cursive', fontSize: 15, color: C.ink, opacity: 0.8 }}>
            {new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginBottom: 12 }}>✍️ 7 Fragen · dein täglicher Check-in</div>

        {/* Frage 1 — Stimmungsskala 1–10 */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.espresso, marginBottom: 8 }}>📊 Wie geht es mir heute?</div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const n = i + 1;
              const aktiv = stimmung === n;
              return (
                <button key={n} onClick={() => setStimmung(aktiv ? null : n)} style={{
                  flex: 1, minWidth: 0, padding: "9px 0", borderRadius: 9, cursor: "pointer",
                  border: aktiv ? `2px solid ${C.gold}` : `1px solid ${C.line}`,
                  background: aktiv ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : "rgba(255,255,255,.6)",
                  color: aktiv ? "#fff" : C.ink,
                  fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: aktiv ? 700 : 500,
                }}>{n}</button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.75 }}>schwer</span>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.75 }}>wunderbar</span>
          </div>
        </div>

        {FRAGEN.map((f, i) => (
          <div key={i} style={{ marginBottom: i < FRAGEN.length - 1 ? 14 : 0 }}>
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.espresso, margin: "4px 0 2px" }}>{f.icon} {f.q}</div>
            <textarea
              rows={2}
              placeholder="Schreib es auf …"
              value={dank[i]}
              onChange={(e) => setDank(dank.map((x, j) => (j === i ? e.target.value : x)))}
              style={{
                width: "100%", border: "none", outline: "none", resize: "none",
                background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(201,150,60,.38) 31px, rgba(201,150,60,.38) 32px)",
                fontFamily: '"Snell Roundhand", "Savoye LET", "Bradley Hand", "Segoe Script", cursive',
                fontSize: 19, lineHeight: "32px", color: "#4A3320",
                padding: "0 2px", caretColor: C.plum,
              }}
            />
          </div>
        ))}
        {/* Seitenecke */}
        <div style={{ position: "absolute", right: 0, bottom: 0, width: 26, height: 26, borderRadius: "16px 0 14px 0", background: "linear-gradient(315deg, #E9DAC0 0%, #F8EFDD 55%, transparent 56%)", boxShadow: "-2px -2px 5px rgba(58,42,34,.10)" }} />
      </div>

      <Btn full onClick={save}>Eintrag speichern</Btn>
      {saved && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.sage, textAlign: "center", marginTop: 12, fontWeight: 600 }}>
          ✓ Gespeichert — schön, dass du dir den Moment genommen hast.
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Eyebrow color={C.ink}>Deine Einträge</Eyebrow>
          {entries.map((e, i) => (
            <Card key={i} style={{ marginBottom: 10, padding: 16 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.rose, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{e.date}</div>
              {e.intention && <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.6 }}>🌅 {e.intention}</div>}
              {e.items?.map((it, j) => (
                <div key={j} style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.6 }}>{it}</div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* — Rituelles Energie-Update — */
function Rituale({ ritual, setRitual, addPunkte }) {
  const RITUALE = [
    { k: "raeu", t: "🕯️ Kerze / Räuchern" },
    { k: "natur", t: "🌳 Zeit in der Natur" },
    { k: "mond", t: "🌙 Mondritual" },
    { k: "körper", t: "💧 Körper & Wasser" },
  ];
  const toggleR = (k) => {
    if (!ritual[k] && addPunkte) addPunkte(2, "Ritual genährt");
    setRitual({ ...ritual, [k]: !ritual[k] });
  };
  const doneCount = RITUALE.filter((r) => ritual[r.k]).length;
  const mond = mondphase();

  return (
    <div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 14, alignItems: "center", background: C.goldPale, border: `1px solid ${C.goldSoft}` }}>
        <div style={{ fontSize: 36, animation: "floaty 3s ease-in-out infinite" }}>{mond.e}</div>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{mond.n}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginTop: 2 }}>{mond.imp}</div>
        </div>
      </Card>

      <Card style={{ background: `linear-gradient(135deg, ${C.card}, ${C.roseSoft})` }}>
        <Eyebrow color={C.plum}>🔮 Rituelles Energie-Update · wöchentlich</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginBottom: 12 }}>
          Welche Rituale haben dich diese Woche genährt? ({doneCount}/{RITUALE.length})
        </p>
        {RITUALE.map((r) => (
          <button key={r.k} onClick={() => toggleR(r.k)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "11px 12px", marginBottom: 7, borderRadius: 12, cursor: "pointer",
            border: `1.5px solid ${ritual[r.k] ? C.rose : C.line}`,
            background: ritual[r.k] ? "#fff" : "transparent", textAlign: "left",
            transition: "border-color .2s, background .2s",
          }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, flex: 1 }}>{r.t}</span>
            <span style={{ color: ritual[r.k] ? C.rose : C.line, fontSize: 16 }}>{ritual[r.k] ? "✓" : "○"}</span>
          </button>
        ))}
        {doneCount === RITUALE.length && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, fontWeight: 700, textAlign: "center", marginTop: 8 }}>
            ✨ Alle Rituale genährt — deine Energie strahlt!
          </p>
        )}
      </Card>
    </div>
  );
}

/* — 3-6-9 Methode · 21-Tage-Challenge — */
function Challenge369({ ch, setCh, akarte, setAkarte, addPunkte }) {
  const ziehen = () => {
    setAkarte(AUFGABEN_KARTEN[Math.floor(Math.random() * AUFGABEN_KARTEN.length)]);
    if (addPunkte) addPunkte(5, "Aufgaben-Karte");
  };
  return (
    <div>
      {/* Aufgaben-Karte des Tages */}
      <Card style={{ marginBottom: 14, textAlign: "center", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <Eyebrow>🃏 Aufgaben-Karte des Tages</Eyebrow>
        {!akarte ? (
          <>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 12 }}>
              Zieh deine kleine Tagesaufgabe — ein liebevoller Mini-Impuls für heute.
            </p>
            <Btn small onClick={ziehen}>Karte ziehen ✨</Btn>
          </>
        ) : (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={{ fontSize: 34, margin: "4px 0 8px" }}>{akarte.icon}</div>
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15.5, color: C.espresso, lineHeight: 1.6 }}>{akarte.t}</p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 10 }}>Deine Aufgabe für heute — morgen wartet eine neue.</p>
          </div>
        )}
      </Card>

      <DankbarkeitsChallenge ch={ch} setCh={setCh} addPunkte={addPunkte} />
    </div>
  );
}

/* — Dankbarkeits-Challenge · 21 Tage, jeden Tag eine Dankbarkeit mehr — */
function DankbarkeitsChallenge({ ch, setCh, addPunkte }) {
  const heute = new Date().toDateString();
  const tag = Math.min(Math.max(ch?.tag || 1, 1), 21);
  const archiv = ch?.archiv || {};        // { 1: ["…"], 2: [...] }
  const heuteFertig = ch?.letzterTag === heute;
  const [felder, setFelder] = useState(() => Array.from({ length: tag }, (_, i) => (archiv[tag]?.[i] || "")));
  const [gefeiert, setGefeiert] = useState(false);

  useEffect(() => {
    setFelder(Array.from({ length: tag }, (_, i) => (archiv[tag]?.[i] || "")));
  }, [tag, heuteFertig]);

  const gefuellt = felder.filter((x) => x.trim()).length;
  const alleGefuellt = gefuellt >= tag;

  const tagAbschliessen = () => {
    if (!alleGefuellt || heuteFertig) return;
    const neu = {
      ...(ch || {}),
      archiv: { ...archiv, [tag]: felder.map((x) => x.trim()) },
      letzterTag: heute,
      tag,
      fertig: tag >= 21,
    };
    setCh(neu);
    setGefeiert(true);
    if (addPunkte) addPunkte(10 + tag, `Tag ${tag}: ${tag} Dankbarkeiten`);
    logEvent("challenge_tag", "dankbarkeit");
    setTimeout(() => setGefeiert(false), 4000);
  };

  const naechsterTag = () => {
    setGefeiert(false);
    setCh({ ...(ch || {}), tag: Math.min(tag + 1, 21), letzterTag: null });
  };

  const gesamt = Object.values(archiv).reduce((s, arr) => s + arr.length, 0);

  return (
    <>
      <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 140%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>🏆 Dankbarkeits-Challenge · 21 Tage</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#FFF3F0", lineHeight: 1.65 }}>
          <strong>So funktioniert's:</strong> Du schreibst 21 Tage lang deine Dankbarkeiten auf — und <strong>mit jedem Tag eine mehr</strong>.
          An Tag 1 eine, an Tag 4 vier, an Tag 21 einundzwanzig. So lernt dein Blick, immer mehr Schönes zu sehen.
        </p>
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,.14)", borderRadius: 12 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.goldPale, fontWeight: 700, marginBottom: 5 }}>Beispiel · Tag 4</div>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13.5, color: "#FFF3F0", lineHeight: 1.7 }}>
            Ich bin dankbar für die schöne Rückmeldung meiner Kollegin.<br />
            Ich bin dankbar für das Telefonat mit meiner Freundin.<br />
            Ich bin dankbar für den schönen Sonnenaufgang.<br />
            Ich bin dankbar für den Guten-Morgen-Gruß von meinem Schatz.
          </div>
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 9, borderRadius: 8, background: "rgba(255,255,255,.25)", overflow: "hidden" }}>
            <div style={{ width: `${((heuteFertig ? tag : tag - 1) / 21) * 100}%`, height: "100%", background: C.goldPale, borderRadius: 8, transition: "width .5s" }} />
          </div>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>Tag {tag}/21</span>
        </div>
      </Card>

      {ch?.fertig && tag >= 21 && heuteFertig ? (
        <Card style={{ textAlign: "center", background: C.goldPale }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌟</div>
          <H size={19} style={{ marginBottom: 8 }}>21 Tage — du hast es geschafft!</H>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>
            Insgesamt <strong>{gesamt} Dankbarkeiten</strong> hast du aufgeschrieben. Dein Blick hat sich verändert — und das bleibt.
          </p>
        </Card>
      ) : heuteFertig ? (
        <Card style={{ textAlign: "center", background: C.roseSoft, border: "none", animation: gefeiert ? "fadeUp .5s ease" : "none" }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>🎉</div>
          <H size={17} style={{ marginBottom: 6 }}>Tag {tag} geschafft — {tag} {tag === 1 ? "Dankbarkeit" : "Dankbarkeiten"}!</H>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.6 }}>
            Morgen wartet Tag {tag + 1} — dann sind es {tag + 1}. Du schaffst das.
          </p>
          <Btn small onClick={naechsterTag}>Tag {tag + 1} starten →</Btn>
        </Card>
      ) : (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <Eyebrow color={C.plum}>Tag {tag} · {tag} {tag === 1 ? "Dankbarkeit" : "Dankbarkeiten"}</Eyebrow>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: alleGefuellt ? C.sage : C.ink }}>{gefuellt}/{tag}</span>
          </div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.6, marginBottom: 14 }}>
            Wofür bist du heute dankbar? Ganz konkrete kleine Dinge wirken am stärksten.
          </p>
          <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
            {felder.map((f, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 5, background: f.trim() ? `linear-gradient(90deg, ${C.gold}, ${C.rose})` : C.beige }} />
            ))}
          </div>
          {felder.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: f.trim() ? C.gold : C.line, width: 18, textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
              <input
                value={f}
                onChange={(e) => setFelder(felder.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="Ich bin dankbar für …"
                style={{
                  flex: 1, minWidth: 0, padding: "11px 13px", fontSize: 14.5,
                  fontFamily: "Georgia, serif", fontStyle: "italic",
                  border: `1.5px solid ${f.trim() ? C.goldSoft : C.line}`, borderRadius: 12,
                  background: f.trim() ? C.goldPale : C.cream, color: C.espresso, outline: "none",
                }}
              />
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <Btn full onClick={tagAbschliessen} disabled={!alleGefuellt}>
              {alleGefuellt ? `Tag ${tag} abschließen (+${10 + tag} ✨)` : `Noch ${tag - gefuellt} ${tag - gefuellt === 1 ? "Dankbarkeit" : "Dankbarkeiten"}`}
            </Btn>
          </div>
        </Card>
      )}

      {gesamt > 0 && (
        <Card style={{ marginTop: 14 }}>
          <Eyebrow color={C.ink}>Deine gesammelten Dankbarkeiten ({gesamt})</Eyebrow>
          {Object.keys(archiv).sort((a, b) => b - a).map((d) => (
            <div key={d} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 6 }}>Tag {d}</div>
              {archiv[d].map((x, i) => (
                <div key={i} style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.espresso, lineHeight: 1.7 }}>🤍 {x}</div>
              ))}
            </div>
          ))}
        </Card>
      )}

      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "center", marginTop: 14, lineHeight: 1.6, opacity: 0.85 }}>
        Tipp: Wiederhole dich ruhig nicht — such jeden Tag neue Momente. Genau darin liegt die Kraft dieser Übung.
      </p>
    </>
  );
}

/* — Zukunftsbrief (Brief an dein zukünftiges Ich · Methode: zeitliche Distanzierung) — */
function Brief({ briefe, setBriefe, addPunkte }) {
  const [text, setText] = useState("");
  const [offen, setOffen] = useState(null);

  const senden = () => {
    if (!text.trim()) return;
    setBriefe([{
      txt: text.trim(),
      geschrieben: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }),
    }, ...briefe]);
    setText("");
    if (addPunkte) addPunkte(10, "Zukunftsbrief geschrieben");
  };

  return (
    <div>
      <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 150%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>💌 Zukunftsbrief</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#FFF3F0", lineHeight: 1.6 }}>
          Ein Brief an dein zukünftiges Ich — schreib dir selbst deine Wünsche und Worte von heute.
        </p>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Liebe Ich,\n\nwenn du das liest, dann …"}
          rows={7}
          style={{ width: "100%", padding: "15px 16px", fontSize: 15.5, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, marginBottom: 12, outline: "none", resize: "vertical", lineHeight: 1.6 }}
        />
        <Btn full onClick={senden}>Brief speichern 💌</Btn>
      </Card>

      {briefe.length > 0 && (
        <>
          <Eyebrow color={C.ink}>Deine Zukunftsbriefe</Eyebrow>
          {briefe.map((b, i) => (
            <Card key={i} onClick={() => setOffen(offen === i ? null : i)} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 26 }}>{offen === i ? "📖" : "✉️"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700, color: C.espresso }}>Geschrieben am {b.geschrieben}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.gold, marginTop: 2 }}>{offen === i ? "Tippen zum Schließen" : "Tippen zum Lesen"}</div>
                </div>
                <div style={{ fontSize: 15, color: C.gold }}>{offen === i ? "▾" : "›"}</div>
              </div>
              {offen === i && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{b.txt}</p>
                  <div style={{ marginTop: 12, background: C.goldPale, borderRadius: 12, padding: "10px 13px" }}>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, fontWeight: 700, color: C.plum }}>🪞 Reflexion</div>
                    <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginTop: 3 }}>Was hat sich seitdem verändert? Was möchtest du deinem heutigen Ich sagen?</p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

/* — Money Mind — */
function MoneyMind({ mm, setMm, addPunkte }) {
  const [note, setNote] = useState("");
  const di = dayIndex();
  const AFFS = [
    "Geld ist Energie — und sie fließt gern zu mir.",
    "Ich darf gut verdienen mit dem, was ich liebe.",
    "Fülle ist mein natürlicher Zustand.",
    "Ich treffe klare, ruhige Entscheidungen über mein Geld.",
    "Mein Wert wächst — und mein Einkommen wächst mit.",
  ];
  const PROMPTS = [
    "Welcher Glaubenssatz über Geld begleitet dich aus deiner Kindheit?",
    "Wofür hast du heute Geld ausgegeben, das dich wirklich genährt hat?",
    "Was würdest du tun, wenn Geld keine Rolle spielen würde?",
    "Welche Einnahme-Idee trägst du schon lange in dir?",
    "Wie fühlt sich finanzielle Freiheit in deinem Körper an?",
  ];

  const save = () => {
    if (!note.trim()) return;
    setMm([{ date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }), txt: note.trim() }, ...mm]);
    setNote("");
    if (addPunkte) addPunkte(5, "Fülle");
  };

  return (
    <div>
      <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, #3E5C46, ${C.sage} 160%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>💰 Fülle-Affirmation des Tages</Eyebrow>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 18, color: "#F5FAF2", lineHeight: 1.5 }}>
          „{AFFS[di % AFFS.length]}"
        </p>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <Eyebrow color={C.plum}>✍️ Fülle-Impuls</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, lineHeight: 1.55, marginBottom: 12, fontWeight: 600 }}>
          {PROMPTS[di % PROMPTS.length]}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Schreib frei — ohne Bewertung …"
          rows={4}
          style={{ width: "100%", padding: "14px 15px", fontSize: 15, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, marginBottom: 12, outline: "none", resize: "vertical" }}
        />
        <Btn full onClick={save}>Notiz speichern</Btn>
      </Card>

      {mm.length > 0 && (
        <>
          <Eyebrow color={C.ink}>Deine Fülle-Notizen</Eyebrow>
          {mm.map((e, i) => (
            <Card key={i} style={{ marginBottom: 10, padding: 16 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.sage, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{e.date}</div>
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.6 }}>{e.txt}</div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

/* ── Musik & Meditation ── */

function Musik() {
  const [playing, setPlaying] = useState(null);
  const cats = [...new Set(TRACKS.map((t) => t.cat))];
  const [cat, setCat] = useState("Alle");
  const list = cat === "Alle" ? TRACKS : TRACKS.filter((t) => t.cat === cat);

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <Eyebrow>Musik & Meditation</Eyebrow>
      <H size={25} style={{ marginBottom: 16 }}>Klänge für deine Ruhe</H>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {["Alle", ...cats].map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{
            fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600,
            padding: "9px 16px", borderRadius: 20, cursor: "pointer", minHeight: 38,
            border: `1.5px solid ${cat === c ? C.rose : C.line}`,
            background: cat === c ? C.roseSoft : "transparent",
            color: cat === c ? C.plum : C.ink,
          }}>{c}</button>
        ))}
      </div>

      {list.map((t) => {
        const active = playing?.t === t.t;
        return (
          <Card key={t.t} onClick={() => setPlaying(active ? null : t)} style={{ marginBottom: 10, display: "flex", gap: 14, alignItems: "center", borderColor: active ? C.rose : C.line }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: active ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: active ? 18 : 22, color: "#fff", flexShrink: 0 }}>
              {active ? "❚❚" : t.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{t.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{t.cat} · {t.len}</div>
            </div>
            {!active && <div style={{ color: C.rose, fontSize: 16 }}>▶</div>}
          </Card>
        );
      })}

      {playing && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 76, margin: "0 auto", maxWidth: 430,
          background: C.plum, color: C.cream, borderRadius: "16px 16px 0 0",
          padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, zIndex: 5,
        }}>
          <div style={{ fontSize: 20 }}>{playing.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700 }}>{playing.t}</div>
            <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,.22)", marginTop: 7 }}>
              <div style={{ width: "34%", height: "100%", borderRadius: 3, background: C.goldSoft }} />
            </div>
          </div>
          <button onClick={() => setPlaying(null)} style={{ background: "none", border: "none", color: C.goldPale, fontSize: 20, cursor: "pointer", minWidth: 44, minHeight: 44 }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ── Fortschritt ── */

/* ── Coaching-Intelligenz: echte, transparente Analyse-Engine (regelbasiert, erklärbar · EU-AI-Act-freundlich) ── */
function coachingIntelligenz({ energie, entries, aufgaben, streak, ch369 }) {
  const tasks = aufgaben || [];
  const energieScore = energie ? (energie.v / 5) * 100 : 60;
  const taskDone = tasks.length ? (tasks.filter((a) => a.erledigt).length / tasks.length) * 100 : 50;
  const journalScore = Math.min(100, (entries?.length || 0) * 20 + 20);
  const streakScore = Math.min(100, (streak || 0) * 12);
  // Dankbarkeits-Challenge zählt bewusst stärker als die anderen Faktoren:
  // sie ist die einzige Übung, die täglich UND kumulativ (Tag 1→21) wächst,
  // und ist damit der verlässlichste Indikator für echtes Dranbleiben.
  const dankbarkeitHeute = ch369?.letzterTag === new Date().toDateString();
  const challengeScore = ch369?.tag ? Math.min(100, (ch369.tag / 21) * 100) : 0;
  const index = Math.round(0.25 * energieScore + 0.15 * streakScore + 0.20 * taskDone + 0.15 * journalScore + 0.25 * challengeScore);
  const offen = tasks.filter((a) => !a.erledigt).length;
  const erledigt = tasks.filter((a) => a.erledigt).length;
  const warnungen = [];
  if (energie && energie.v <= 2) warnungen.push(`Energie heute niedrig (${energie.v}/5)`);
  if (offen >= 3) warnungen.push(`${offen} offene Aufgaben stauen sich`);
  if ((streak || 0) === 0) warnungen.push("Streak unterbrochen — Reaktivierung sinnvoll");
  if (ch369?.tag && !dankbarkeitHeute) warnungen.push(`Dankbarkeits-Challenge heute noch nicht gemacht (Tag ${ch369.tag}/21)`);
  const briefing = `Wohlbefindens-Index ${index}/100. ` +
    (energie ? `Energie heute ${energie.v}/5. ` : "") +
    `Streak ${streak || 0} Tage · Aufgaben ${erledigt}/${tasks.length}` +
    (ch369?.tag ? ` · Dankbarkeits-Challenge Tag ${ch369.tag}/21 (heute ${dankbarkeitHeute ? "erledigt" : "offen"})` : "") + ". " +
    (warnungen.length ? "⚠ " + warnungen.join("; ") + "." : "Keine Auffälligkeiten.");
  const comps = [
    ["Energie", energieScore, "eine Atemübung oder Meditation"],
    ["Aktivität", streakScore, "eine kleine tägliche Routine"],
    ["Aufgaben", taskDone, "eine offene Aufgabe abschließen"],
    ["Journal", journalScore, "einen kurzen Tagebuch-Eintrag"],
  ].sort((a, b) => a[1] - b[1]);
  return { index, warnungen, briefing, empfehlung: comps[0][2], schwaechster: comps[0][0], offen, dankbarkeitHeute };
}

/* ── AI Coach Twin — Konfigurationsinterview + Methoden-Dossier (Fable-5-Auftrag 6, Phase A) ──
   18 Fragen in 4 Blöcken, danach synthetisiert Claude AUSSCHLIESSLICH aus den echten Antworten
   ein strukturiertes Dossier (kein Freitext-Erfinden). Nichts geht ohne Freigabe der Coachin an
   Klientinnen — deshalb: Entwurf speichern → prüfen/editieren → explizit freigeben. */
const COACH_TWIN_BLOCKS = ["Methode & Ansatz", "Sprache & Ausdruck", "Grenzen & Tabus", "Typische Situationen"];
const COACH_TWIN_FRAGEN = [
  { f: "Wie würdest du deinen Coaching-Ansatz in 2–3 Sätzen beschreiben?", k: "ansatz" },
  { f: "Mit welcher Methode oder welchem Werkzeug arbeitest du am liebsten?", k: "methode" },
  { f: "Was unterscheidet deine Arbeit von anderen Coachinnen in deinem Bereich?", k: "unterschied" },
  { f: "Woran erkennst du, dass eine Klientin einen Durchbruch hatte?", k: "durchbruch" },
  { f: "Was ist der wichtigste Glaubenssatz, den du deinen Klientinnen vermitteln willst?", k: "kernbotschaft" },
  { f: "Welche 3–5 Wörter oder Formulierungen verwendest du besonders oft?", k: "lieblingsbegriffe" },
  { f: "Duzt oder siezt du deine Klientinnen normalerweise?", k: "anrede" },
  { f: "Bist du eher direkt und klar, oder sanft und zurückhaltend in deiner Ansprache?", k: "ton" },
  { f: "Gibt es Sätze oder Floskeln, die du NIE benutzen würdest?", k: "verbotene_saetze" },
  { f: "Wie würdest du deinen Humor/Ton beschreiben — ernst, verspielt, poetisch, nüchtern?", k: "stil" },
  { f: "Bei welchem Thema verweist du sofort an eine andere Fachperson (z. B. Therapie)?", k: "verweisgrenze" },
  { f: "Gibt es Heilsversprechen oder Formulierungen, die du bewusst vermeidest?", k: "vermiedene_versprechen" },
  { f: "Wie reagierst du, wenn eine Klientin über etwas spricht, das dich fachlich überfordert?", k: "ueberforderung" },
  { f: "Was würdest du niemals versprechen, egal wie sehr eine Klientin es sich wünscht?", k: "nie_versprechen" },
  { f: "Beschreibe eine typische Klientin, mit der du gerade arbeitest (anonymisiert).", k: "typische_klientin" },
  { f: "Was ist ein Satz, den du oft zu Beginn einer Session sagst?", k: "eroeffnungssatz" },
  { f: "Was ist ein Satz, den du oft am Ende einer Session sagst?", k: "abschlusssatz" },
  { f: "Wenn eine Klientin sich zurückzieht/still wird, wie sprichst du sie an?", k: "rueckzug_ansprache" },
];

/* ── Knowledge Brain (Katman 1 · Baustein 6) ──
   Suche über die EIGENEN Inhalte der Coachin. Harte Regel im Prompt:
   Ohne Treffer wird NICHTS erfunden — die Antwort lautet dann "nichts gefunden". */
const WISSEN_SYSTEM = `Du beantwortest die Frage einer Coachin AUSSCHLIESSLICH auf Basis der mitgelieferten Auszüge aus ihren eigenen Inhalten.
STRIKTE REGELN:
1. Nutze NUR die gelieferten Auszüge. Kein Allgemeinwissen, keine Ergänzung, keine Vermutung.
2. Nenne bei jeder Aussage den Titel des Auszugs, aus dem sie stammt — in der Form (Quelle: Titel).
3. Wenn die Auszüge die Frage nicht beantworten, sage genau das: dass du dazu nichts in ihren Inhalten findest. Erfinde NIEMALS etwas.
4. Deutsch, Du-Form, kurz (2–5 Sätze).`;

function WissensSuche({ addPunkte }) {
  const [frage, setFrage] = useState("");
  const [treffer, setTreffer] = useState(null);
  const [antwort, setAntwort] = useState("");
  const [busy, setBusy] = useState(false);
  const [uebersicht, setUebersicht] = useState([]);
  const [neuTitel, setNeuTitel] = useState("");
  const [neuText, setNeuText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => { ladeInhaltsUebersicht().then(setUebersicht); }, []);

  const suchen = async () => {
    if (busy || !frage.trim()) return;
    setBusy(true); setAntwort(""); setTreffer(null);
    const gefunden = await sucheInhalte(frage.trim(), 5);
    setTreffer(gefunden);
    if (gefunden.length) {
      const kontext = gefunden.map((t, i) => `[${i + 1}] Titel: ${t.titel} (${t.quelle})\n${t.chunk}`).join("\n\n");
      const txt = await askLuma([{ role: "user", content: `Frage: ${frage.trim()}\n\nAuszüge aus meinen Inhalten:\n${kontext}` }], WISSEN_SYSTEM);
      setAntwort(txt);
      logEvent("wissenssuche");
    }
    setBusy(false);
  };

  const hinzufuegen = async () => {
    if (!neuText.trim()) return;
    setStatus("…");
    const n = await merkeInhalt({ titel: neuTitel.trim() || "Ohne Titel", text: neuText.trim(), quelle: "upload" });
    setStatus(n ? `✓ ${n} Abschnitt(e) gemerkt` : "Konnte nicht gespeichert werden");
    if (n) { setNeuTitel(""); setNeuText(""); ladeInhaltsUebersicht().then(setUebersicht); if (addPunkte) addPunkte(10, "Inhalt archiviert"); }
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>Coach-Werkstatt</Eyebrow>
      <H size={24} style={{ marginBottom: 6 }}>Dein Wissensarchiv</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, marginBottom: 16 }}>
        Alles, was du hier ablegst, findest du später mit einer normalen Frage wieder — z. B. „Was habe ich über Selbstwert gesagt?".
        Gefunden wird nur, was wirklich da ist; erfunden wird nichts.
      </p>

      <Card style={{ marginBottom: 14 }}>
        <Eyebrow color={C.plum}>Frage an dein Archiv</Eyebrow>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={frage} onChange={(e) => setFrage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && suchen()}
            placeholder="z. B. Was habe ich über Grenzen setzen gesagt?"
            style={{ flex: 1, padding: "12px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none" }} />
          <button onClick={suchen} disabled={busy} style={{ width: 46, borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 17, opacity: busy ? 0.6 : 1 }}>🔍</button>
        </div>
      </Card>

      {busy && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, marginBottom: 12 }}>✨ ilho durchsucht dein Archiv …</p>}

      {treffer !== null && !busy && (
        treffer.length === 0 ? (
          <Card style={{ marginBottom: 14 }}>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.55 }}>
              Dazu finde ich nichts in deinen Inhalten. {uebersicht.length === 0 ? "Dein Archiv ist noch leer — leg unten den ersten Inhalt ab." : "Vielleicht mit anderen Worten suchen?"}
            </p>
          </Card>
        ) : (
          <>
            {antwort && (
              <Card style={{ marginBottom: 12, background: `linear-gradient(150deg, ${C.card}, ${C.goldPale})` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Eyebrow color={C.gold}>Antwort aus deinem Archiv</Eyebrow>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>ilho · KI</span>
                </div>
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, lineHeight: 1.6, marginTop: 8, whiteSpace: "pre-wrap" }}>{antwort}</p>
              </Card>
            )}
            <Eyebrow color={C.plum}>Fundstellen</Eyebrow>
            {treffer.map((t) => (
              <Card key={t.id} style={{ marginTop: 8, marginBottom: 8 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: C.plum }}>{t.titel} <span style={{ fontWeight: 400, opacity: 0.7 }}>· {t.quelle}</span></div>
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, lineHeight: 1.55, marginTop: 5 }}>{t.chunk.slice(0, 260)}{t.chunk.length > 260 ? " …" : ""}</p>
              </Card>
            ))}
          </>
        )
      )}

      <Card style={{ marginTop: 16, marginBottom: 14 }}>
        <Eyebrow color={C.plum}>Inhalt ablegen</Eyebrow>
        <input value={neuTitel} onChange={(e) => setNeuTitel(e.target.value)} placeholder="Titel — z. B. Reel Selbstwert, Mai 2024"
          style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", boxSizing: "border-box", margin: "8px 0" }} />
        <textarea rows={5} value={neuText} onChange={(e) => setNeuText(e.target.value)} placeholder="Text, Transkript oder Notiz einfügen …"
          style={{ width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10, lineHeight: 1.5 }} />
        <Btn small ghost={!neuText.trim()} onClick={hinzufuegen}>Ins Archiv legen</Btn>
        {status && <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.sage, marginLeft: 10 }}>{status}</span>}
      </Card>

      {uebersicht.length > 0 && (
        <Card>
          <Eyebrow color={C.plum}>Im Archiv · {uebersicht.length} Inhalt(e)</Eyebrow>
          {uebersicht.slice(0, 12).map((u, i) => (
            <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, padding: "7px 0", borderBottom: i < Math.min(11, uebersicht.length - 1) ? `1px solid ${C.line}` : "none" }}>
              {u.titel} <span style={{ opacity: 0.6 }}>· {u.quelle} · {u.teile} Abschnitt(e)</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ── Session Intelligence (Katman 1 · Baustein 5) ──
   Transkript → strukturierter Notiz-ENTWURF für die Coachin.
   Zwei harte Regeln aus der Leitplanken-Liste:
   1) Einwilligungs-Gate VOR der Analyse (Art.-9-Nähe) — ohne Häkchen kein Knopf.
   2) Freigabe-Prinzip: Der Entwurf erreicht niemanden ohne Freigabe der Coachin.
   Bewusst NICHT enthalten: Emotions-/Persönlichkeitsanalyse, Risikobewertung der Person,
   Muster-/Blind-Spot-Deutung (das ist Katman 3). Nur explizit Gesagtes. */
const SESSION_SYSTEM = `Du strukturierst das Transkript einer Coaching-Session für die Coachin. Antworte AUSSCHLIESSLICH mit gültigem JSON in exakt dieser Form:
{"kernthemen":["..."],"vereinbarungen":["..."],"aufgaben":["..."],"offene_punkte":["..."]}
STRIKTE REGELN:
1. Nimm NUR auf, was im Transkript wörtlich gesagt wurde. Keine Interpretation, keine Vermutung, keine Ergänzung aus Allgemeinwissen.
2. KEINE Diagnosen, keine psychologische Deutung, keine Bewertung der Klientin, keine Einschätzung ihres Zustands oder Risikos, keine Muster-/Verhaltensanalyse.
3. "aufgaben" nur, wenn im Gespräch tatsächlich eine Aufgabe/Übung vereinbart wurde.
4. Sprache: Deutsch, knapp, sachlich. Jeder Punkt max. ein Satz.
5. Wenn ein Feld leer bleiben muss, gib ein leeres Array zurück. Erfinde nichts.
6. Kein Text außerhalb des JSON.`;

function SessionIntelligenz({ addPunkte }) {
  const [titel, setTitel] = useState("");
  const [transkript, setTranskript] = useState("");
  const [einwilligung, setEinwilligung] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entwurf, setEntwurf] = useState(null); // { id?, notiz, notiz_text, freigegeben }
  const [fehler, setFehler] = useState("");
  const [hoeren, setHoeren] = useState(false);
  const recRef = useRef(null);

  const diktieren = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setFehler("Spracherkennung wird von diesem Browser nicht unterstützt."); return; }
    if (hoeren) { recRef.current?.stop(); setHoeren(false); return; }
    const r = new SR();
    r.lang = "de-DE"; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => {
      let neu = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) neu += e.results[i][0].transcript + " ";
      if (neu) setTranskript((t) => (t + " " + neu).trim());
    };
    r.onerror = () => setHoeren(false);
    r.onend = () => setHoeren(false);
    recRef.current = r; r.start(); setHoeren(true);
  };

  const analysieren = async () => {
    if (busy || !einwilligung || transkript.trim().length < 40) return;
    setBusy(true); setFehler("");
    const roh = await askLuma([{ role: "user", content: transkript.trim().slice(0, 12000) }], SESSION_SYSTEM);
    let notiz = null;
    try { notiz = JSON.parse((roh.match(/\{[\s\S]*\}/) || [roh])[0]); } catch { /* unten abgefangen */ }
    if (!notiz) { setFehler("Der Entwurf konnte nicht strukturiert werden — bitte noch einmal versuchen."); setBusy(false); return; }
    const abschnitt = (t, arr) => (arr?.length ? `**${t}**\n${arr.map((x) => `- ${x}`).join("\n")}\n\n` : "");
    const text =
      abschnitt("Kernthemen", notiz.kernthemen) +
      abschnitt("Vereinbarungen", notiz.vereinbarungen) +
      abschnitt("Aufgaben bis zur nächsten Session", notiz.aufgaben) +
      abschnitt("Offene Punkte", notiz.offene_punkte);
    const gespeichert = await speichereSessionNotiz({
      titel: titel.trim() || `Session ${new Date().toLocaleDateString("de-DE")}`,
      transkript: transkript.trim(), notiz, notiz_text: text.trim(), einwilligung: true,
    });
    setEntwurf({ id: gespeichert?.id, notiz, notiz_text: text.trim(), freigegeben: false });
    if (addPunkte) addPunkte(15, "Session-Notiz erstellt");
    logEvent("session_notiz_entwurf");
    setBusy(false);
  };

  const freigeben = async () => {
    if (!entwurf) return;
    if (entwurf.id) await gibSessionNotizFrei(entwurf.id);
    // Erst nach Freigabe wandert die Notiz ins Wissensarchiv (Knowledge Brain) —
    // nie der Rohtranskript, nur der geprüfte Entwurf.
    if (entwurf.notiz_text) {
      await merkeInhalt({
        titel: titel.trim() || `Session ${new Date().toLocaleDateString("de-DE")}`,
        text: entwurf.notiz_text, quelle: "session_notiz", quelle_id: entwurf.id || null,
      });
    }
    setEntwurf({ ...entwurf, freigegeben: true });
  };

  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>Coach-Werkstatt</Eyebrow>
      <H size={24} style={{ marginBottom: 6 }}>Session-Notiz</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, marginBottom: 16 }}>
        Sprich oder füge dein Transkript ein — ilho strukturiert daraus einen <strong>Entwurf</strong>: Kernthemen, Vereinbarungen, Aufgaben, offene Punkte.
        Nur, was tatsächlich gesagt wurde. Keine Deutung, keine Bewertung.
      </p>

      {!entwurf && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <Eyebrow color={C.plum}>Bezeichnung (ohne Klarnamen)</Eyebrow>
            <input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="z. B. Session 12.08. · A."
              style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", boxSizing: "border-box", marginTop: 8 }} />
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Eyebrow color={C.plum}>Transkript</Eyebrow>
              <button onClick={diktieren} style={{ border: "none", background: hoeren ? C.rose : C.roseSoft, color: hoeren ? "#fff" : C.plum, borderRadius: 18, padding: "7px 14px", fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                {hoeren ? "⏹ Aufnahme stoppen" : "🎙️ Diktieren"}
              </button>
            </div>
            <textarea rows={9} value={transkript} onChange={(e) => setTranskript(e.target.value)} placeholder="Transkript einfügen oder diktieren …"
              style={{ width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} />
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 6 }}>{transkript.trim().length} Zeichen{transkript.trim().length < 40 ? " · mindestens 40 nötig" : ""}</div>
          </Card>

          {/* Einwilligungs-Gate — Pflicht vor der Analyse */}
          <Card style={{ marginBottom: 14, border: `1.5px solid ${einwilligung ? C.sage : "#E7B7A8"}`, background: einwilligung ? "#F2F8F0" : "#FBF6F2" }}>
            <div onClick={() => setEinwilligung(!einwilligung)} style={{ display: "flex", gap: 11, alignItems: "flex-start", cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, border: `1.5px solid ${einwilligung ? C.sage : C.line}`, background: einwilligung ? C.sage : C.card, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{einwilligung ? "✓" : ""}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, lineHeight: 1.5 }}>
                Meine Klientin hat der Verarbeitung dieser Session durch eine KI <strong>ausdrücklich zugestimmt</strong> (Art. 9 DSGVO). Ohne diese Zustimmung darf die Analyse nicht erfolgen.
              </div>
            </div>
          </Card>

          {fehler && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#B0492F", marginBottom: 10 }}>{fehler}</p>}
          <Btn full ghost={!einwilligung || transkript.trim().length < 40} onClick={analysieren} disabled={busy}>
            {busy ? "✨ ilho strukturiert …" : "Notiz-Entwurf erstellen"}
          </Btn>
          {!einwilligung && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "center", marginTop: 8 }}>Ohne bestätigte Einwilligung ist die Analyse gesperrt.</p>}
        </>
      )}

      {entwurf && (
        <>
          <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, ${C.card}, ${C.goldPale})` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Eyebrow color={C.gold}>{entwurf.freigegeben ? "✅ Freigegeben" : "📝 Entwurf — noch nicht freigegeben"}</Eyebrow>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>von ilho · KI-generiert</span>
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, lineHeight: 1.65, marginTop: 10, whiteSpace: "pre-wrap" }}>
              {entwurf.notiz_text || "— keine strukturierten Inhalte gefunden —"}
            </div>
          </Card>
          {!entwurf.freigegeben ? (
            <>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5, marginBottom: 10 }}>
                Prüfe den Entwurf. Erst nach deiner Freigabe darf er weiterverwendet oder mit deiner Klientin geteilt werden.
              </p>
              <Btn full onClick={freigeben}>Entwurf freigeben</Btn>
            </>
          ) : (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, marginBottom: 10 }}>✓ Freigegeben — die Notiz ist jetzt für die weitere Verwendung markiert.</p>
          )}
          <div style={{ marginTop: 10 }}>
            <Btn small ghost onClick={() => { setEntwurf(null); setTranskript(""); setTitel(""); setEinwilligung(false); }}>Neue Session</Btn>
          </div>
        </>
      )}
    </div>
  );
}

function CoachTwinInterview({ addPunkte }) {
  const [schritt, setSchritt] = useState(0); // -1 = fertig/Übersicht
  const [antworten, setAntworten] = useState({});
  const [eingabe, setEingabe] = useState("");
  const [erzeuge, setErzeuge] = useState(false);
  const [dossier, setDossier] = useState(null); // { id, dossier, dossier_text, freigegeben, version }
  const [fehler, setFehler] = useState("");
  const [probeMsgs, setProbeMsgs] = useState([]);
  const [probeText, setProbeText] = useState("");

  useEffect(() => {
    (async () => {
      const bestehend = await ladeEigenesDossier();
      if (bestehend) { setDossier(bestehend); setSchritt(-1); }
    })();
  }, []);

  const weiter = () => {
    const frage = COACH_TWIN_FRAGEN[schritt];
    setAntworten((prev) => ({ ...prev, [frage.k]: eingabe.trim() }));
    setEingabe("");
    if (schritt + 1 < COACH_TWIN_FRAGEN.length) setSchritt(schritt + 1);
    else erzeugeDossier({ ...antworten, [frage.k]: eingabe.trim() });
  };

  const erzeugeDossier = async (alleAntworten) => {
    setErzeuge(true);
    setFehler("");
    const rohListe = COACH_TWIN_FRAGEN.map((q) => `${q.f}\nAntwort: ${alleAntworten[q.k] || "—"}`).join("\n\n");
    const sysPrompt = `Du erstellst ein Methoden-Dossier für eine Coachin — AUSSCHLIESSLICH aus den unten gegebenen echten Interview-Antworten. Erfinde NICHTS hinzu, was nicht in den Antworten steht oder sich direkt daraus ableiten lässt. Antworte NUR mit einem JSON-Objekt (kein Fließtext davor/danach) mit genau diesen Feldern: {"ton": "kurze Beschreibung ihres Tonfalls", "anrede": "du oder Sie", "kernbegriffe": ["...", "..."], "tabus": ["...", "..."], "methodeKurz": "1 Satz", "eroeffnungssatz": "...", "abschlusssatz": "...", "grenzenText": "wie sie bei Überforderung/Verweisung reagiert", "rueckzugAnsprache": "..."}`;
    try {
      const antwortJson = await askLuma([{ role: "user", content: rohListe }], sysPrompt);
      let geparst = null;
      try { geparst = JSON.parse(antwortJson.replace(/```json|```/g, "").trim()); } catch { geparst = null; }
      const dossierText = geparst
        ? `# Methoden-Dossier\n\n**Ton:** ${geparst.ton}\n**Anrede:** ${geparst.anrede}\n**Methode:** ${geparst.methodeKurz}\n**Lieblingsbegriffe:** ${(geparst.kernbegriffe || []).join(", ")}\n**Tabus:** ${(geparst.tabus || []).join(", ")}\n**Eröffnungssatz:** „${geparst.eroeffnungssatz}"\n**Abschlusssatz:** „${geparst.abschlusssatz}"\n**Grenzen:** ${geparst.grenzenText}\n**Bei Rückzug:** ${geparst.rueckzugAnsprache}`
        : antwortJson;
      const gespeichert = await speichereDossierEntwurf({ antworten: alleAntworten, dossier: geparst, dossier_text: dossierText });
      if (gespeichert) { setDossier(gespeichert); setSchritt(-1); addPunkte?.(20, "Methoden-Dossier erstellt"); }
      else setFehler("Konnte das Dossier nicht speichern — bitte gleich noch einmal versuchen.");
    } catch {
      setFehler("Gerade nicht erreichbar — versuch es in einem Moment erneut.");
    } finally {
      setErzeuge(false);
    }
  };

  const freigeben = async () => {
    if (!dossier?.id) return;
    const ok = await gibDossierFrei(dossier.id);
    if (ok) setDossier({ ...dossier, freigegeben: true, freigegeben_am: new Date().toISOString() });
  };

  const exportieren = () => {
    const blob = new Blob([dossier?.dossier_text || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "methoden-dossier.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const probeSprechen = async () => {
    if (!probeText.trim()) return;
    const next = [...probeMsgs, { role: "user", content: probeText }];
    setProbeMsgs(next); setProbeText("");
    const ton = dossier?.dossier
      ? `\n(Sprich im Ton dieser Coachin: ${dossier.dossier.ton}. Anrede: ${dossier.dossier.anrede}. Nutze wenn passend diese Begriffe: ${(dossier.dossier.kernbegriffe || []).join(", ")}. Vermeide: ${(dossier.dossier.tabus || []).join(", ")}.)`
      : "";
    const reply = await askLuma(next, ILHO_SYSTEM + ton);
    setProbeMsgs([...next, { role: "assistant", content: reply }]);
  };

  // Fertig-Ansicht: Dossier prüfen, freigeben, Probesprechen
  if (schritt === -1 && dossier) {
    return (
      <div style={{ padding: "12px 0" }}>
        <Eyebrow>KI Coach Twin</Eyebrow>
        <H size={22} style={{ marginBottom: 4 }}>Dein Methoden-Dossier</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginBottom: 14 }}>
          Version {dossier.version} · {dossier.freigegeben ? "✅ freigegeben — ilho spricht jetzt in deinem Ton" : "Entwurf — noch nicht freigegeben"}
        </p>
        <Card style={{ marginBottom: 14, whiteSpace: "pre-wrap", fontFamily: "system-ui, sans-serif", fontSize: 13, lineHeight: 1.6, color: C.espresso }}>
          {dossier.dossier_text}
        </Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {!dossier.freigegeben && (
            <button onClick={freigeben} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              ✓ Dossier freigeben
            </button>
          )}
          <button onClick={exportieren} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.espresso, fontWeight: 600, cursor: "pointer" }}>
            📄 Als Text exportieren
          </button>
          <button onClick={() => { setDossier(null); setSchritt(0); setAntworten({}); }} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: "transparent", color: C.ink, cursor: "pointer" }}>
            ↻ Neu
          </button>
        </div>

        <Eyebrow>Probesprechen mit „deiner" ilho</Eyebrow>
        <Card style={{ marginBottom: 10, minHeight: 100 }}>
          {probeMsgs.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Schreib etwas, wie es eine Klientin tun würde — ilho antwortet in deinem konfigurierten Ton.</p>}
          {probeMsgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
              <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: 16, fontFamily: "system-ui, sans-serif", fontSize: 13.5, background: m.role === "user" ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.beige, color: m.role === "user" ? "#fff" : C.espresso }}>{m.content}</div>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={probeText} onChange={(e) => setProbeText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && probeSprechen()} placeholder="Nachricht wie eine Klientin…"
            style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14 }} />
          <button onClick={probeSprechen} style={{ padding: "11px 16px", borderRadius: 12, border: "none", background: C.espresso, color: "#fff", cursor: "pointer" }}>→</button>
        </div>
      </div>
    );
  }

  if (erzeuge) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>✨</div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink }}>ilho erstellt dein Methoden-Dossier aus deinen Antworten …</p>
      </div>
    );
  }

  const frage = COACH_TWIN_FRAGEN[schritt];
  const blockIndex = Math.floor(schritt / (COACH_TWIN_FRAGEN.length / COACH_TWIN_BLOCKS.length));
  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>KI Coach Twin · Konfigurationsinterview</Eyebrow>
      <H size={22} style={{ marginBottom: 4 }}>Frage {schritt + 1}/{COACH_TWIN_FRAGEN.length}</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.plum, marginBottom: 16 }}>Block: {COACH_TWIN_BLOCKS[Math.min(blockIndex, 3)]}</p>
      <div style={{ height: 4, background: C.line, borderRadius: 2, marginBottom: 20 }}>
        <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})`, width: `${((schritt + 1) / COACH_TWIN_FRAGEN.length) * 100}%`, transition: "width .3s" }} />
      </div>
      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, lineHeight: 1.5 }}>{frage.f}</p>
      </Card>
      {fehler && <p style={{ color: C.rose, fontSize: 12.5, marginBottom: 10 }}>{fehler}</p>}
      <textarea value={eingabe} onChange={(e) => setEingabe(e.target.value)} rows={4} placeholder="Deine Antwort…"
        style={{ width: "100%", padding: 14, borderRadius: 14, border: `1px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14.5, marginBottom: 14, resize: "vertical" }} />
      <button onClick={weiter} disabled={!eingabe.trim()} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: eingabe.trim() ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.line, color: "#fff", fontWeight: 700, fontSize: 15, cursor: eingabe.trim() ? "pointer" : "default" }}>
        {schritt + 1 < COACH_TWIN_FRAGEN.length ? "Weiter →" : "✨ Dossier erstellen"}
      </button>
    </div>
  );
}

/* ── Coach-Dashboard: tägliche Aufgaben-Erledigung je Klientin (Demo · Einzelnutzer-Prototyp) ── */
/* ── Business Manager Light: „Heute"-Aktionsliste (Katman 1 · Baustein 4) ──
   REGELBASIERT — kein LLM wählt aus, was wichtig ist. Max. 7 Einträge, jede Zeile eine Handlung.
   Im Mehrklientinnen-Betrieb speist sich das aus allen verknüpften Klientinnen; im Prototyp aus der Einzelnutzerin. */
function coachHeuteAktionen({ ci, checkins, entries, streak, ch369 }) {
  const a = [];
  const heuteStr = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  // 1. Kritische Signale zuerst (bestehende Signal-Logik)
  ci.warnungen.forEach((w) => a.push({ icon: "🔴", t: w, art: "Signal prüfen" }));
  // 2. Stille Klientin: kein Journal seit >3 Einträgen zurückliegendem Datum bzw. Streak-Riss
  if (streak === 0 && entries?.length) a.push({ icon: "🕯️", t: "Klientin war zuletzt nicht aktiv — sanft nachfragen?", art: "Kontakt" });
  // 3. Unbeantwortete Check-in-Notiz (Notiz an Coachin vorhanden)
  const notiz = (checkins || []).find((c) => c.notiz);
  if (notiz) a.push({ icon: "💬", t: `Check-in-Notiz vom ${notiz.datum}: „${notiz.notiz}"`, art: "Antworten" });
  // 4. Challenge-Meilenstein
  if (ch369?.tag === 21) a.push({ icon: "🏆", t: "Challenge abgeschlossen (Tag 21) — gratulieren!", art: "Feiern" });
  else if (ch369?.tag >= 1 && !ci.dankbarkeitHeute) a.push({ icon: "🔔", t: `Challenge Tag ${ch369.tag}/21 heute noch offen`, art: "Im Blick behalten" });
  // 5. Kein Journaleintrag heute
  if (!entries?.some((e) => e.date === heuteStr)) a.push({ icon: "📔", t: "Heute noch kein Journaleintrag", art: "Beobachten" });
  // 6. Wochenimpuls fällig (Montag)
  if (new Date().getDay() === 1) a.push({ icon: "🎙️", t: "Montag: Zeit für deinen Wochenimpuls", art: "Aufnehmen" });
  return a.slice(0, 7);
}

/* ── Coach Reflection (Katman 1 · Baustein 3): EINE Frage nach dem Blick aufs Dashboard.
   Antwort bleibt privat bei der Coachin (Prototyp: localStorage, nie an Klientin/Server). */
const REFLEXION_SYSTEM = `Du unterstützt eine Coachin bei ihrer eigenen Reflexion. Aus dem folgenden anonymisierten Wochen-Lagebild ihrer Klientin formulierst du GENAU EINE offene, kluge Reflexionsfrage an die Coachin selbst (Deutsch, Du-Form, max. 2 Sätze). Die Frage richtet sich auf IHR coacherisches Handeln oder ihre Wahrnehmung — nie auf eine Diagnose der Klientin. Keine Einleitung, nur die Frage.`;

function CoachReflexion({ ci, checkins, streak }) {
  const [frage, setFrage] = useState(() => localStorage.getItem("s2g_reflex_frage") || "");
  const [antwort, setAntwort] = useState(() => localStorage.getItem("s2g_reflex_antwort") || "");
  const [busy, setBusy] = useState(false);
  const holen = async () => {
    if (busy) return;
    setBusy(true);
    const lage = `Wohlbefindens-Index: ${ci.index}/100 · Serie: ${streak} Tage · Warnungen: ${ci.warnungen.join("; ") || "keine"} · Schwächster Bereich: ${ci.schwaechster} · Letzter Check-in: ${checkins?.[0] ? `${checkins[0].wert}/5${checkins[0].notiz ? ` — „${checkins[0].notiz}"` : ""}` : "keiner"}`;
    const f = await askLuma([{ role: "user", content: lage }], REFLEXION_SYSTEM);
    if (f) { setFrage(f); localStorage.setItem("s2g_reflex_frage", f); logEvent("coach_reflexion"); }
    setBusy(false);
  };
  return (
    <Card style={{ marginTop: 14, background: `linear-gradient(150deg, ${C.card}, ${C.goldPale})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow color={C.gold}>🪞 Deine Reflexion</Eyebrow>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>KI-Frage · Antwort bleibt privat</span>
      </div>
      {frage ? (
        <>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.espresso, lineHeight: 1.6, margin: "8px 0 10px" }}>{frage}</p>
          <textarea rows={3} value={antwort} placeholder="Dein Gedanke dazu — nur für dich …"
            onChange={(e) => { setAntwort(e.target.value); localStorage.setItem("s2g_reflex_antwort", e.target.value); }}
            style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
          <Btn small ghost onClick={holen} disabled={busy}>{busy ? "…" : "Neue Frage"}</Btn>
        </>
      ) : (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "6px 0 10px" }}>Nach dem Blick aufs Lagebild: eine Frage an dich selbst. Auch du wächst.</p>
          <Btn small onClick={holen} disabled={busy}>{busy ? "…" : "Reflexionsfrage erhalten"}</Btn>
        </>
      )}
    </Card>
  );
}

function CoachDashboard({ name, streak, entries, ch369, drawn, horo, energie, aufgaben, checkins }) {
  const ci = coachingIntelligenz({ energie, entries, aufgaben, streak, ch369 });
  const heuteStr = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  const tasks = [
    { icon: "📔", t: "Journaling", done: entries?.some((e) => e.date === heuteStr) },
    { icon: "🏆", t: `Challenge (Tag ${ch369?.tag || 0}/21)`, done: ch369?.letzterTag === new Date().toDateString() },
    { icon: "🎴", t: "Tageskarte gezogen", done: !!drawn },
    { icon: "⭐", t: "Horoskop gelesen", done: !!horo?.text },
  ];
  const erledigt = tasks.filter((t) => t.done).length;

  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>Coach-Ansicht · Demo</Eyebrow>
      <H size={23} style={{ marginBottom: 4 }}>Klientin: {name || "—"}</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginBottom: 16 }}>
        Prototyp — zeigt aktuell nur diese Einzelnutzerin. Für echte Klientinnen-Konten braucht es Login je Nutzerin + Coach-Zuweisung in der Datenbank.
      </p>

      {/* „Heute"-Aktionsliste — regelbasiert, max. 7, jede Zeile eine Handlung (Business Manager Light) */}
      {(() => {
        const aktionen = coachHeuteAktionen({ ci, checkins, entries, streak, ch369 });
        return (
          <Card style={{ marginBottom: 14, border: `1.5px solid ${C.gold}` }}>
            <Eyebrow color={C.gold}>☀️ Heute wichtig</Eyebrow>
            {aktionen.length ? aktionen.map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < aktionen.length - 1 ? `1px solid ${C.line}` : "none" }}>
                <span style={{ fontSize: 16 }}>{x.icon}</span>
                <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, lineHeight: 1.4 }}>{x.t}</span>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.plum, flexShrink: 0 }}>{x.art}</span>
              </div>
            )) : (
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 6 }}>✓ Nichts offen — alles im grünen Bereich.</p>
            )}
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7, marginTop: 8 }}>Regelbasiert aus den Signalen — keine KI-Auswahl.</div>
          </Card>
        );
      })()}

      <Card style={{ marginBottom: 14, textAlign: "center", background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 140%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>Wohlbefindens-Index</Eyebrow>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 44, color: "#FFF8F0" }}>{ci.index}<span style={{ fontSize: 18 }}>/100</span></div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#FFF3F0" }}>🔥 {streak} Tage Serie</div>
      </Card>

      {/* Dankbarkeits-Challenge: eigene, hervorgehobene Karte — zählt stärker als andere Aufgaben
          und ihr Status muss dem Coach auf einen Blick auffallen, nicht in der Liste untergehen. */}
      <Card style={{
        marginBottom: 14, display: "flex", alignItems: "center", gap: 12,
        background: ci.dankbarkeitHeute ? "#F2F8F0" : "#FBF2E4",
        border: `1.5px solid ${ci.dankbarkeitHeute ? C.sage : C.gold || "#E0B24C"}`,
      }}>
        <span style={{ fontSize: 26 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.plum }}>Dankbarkeits-Challenge</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 600, color: C.espresso, marginTop: 2 }}>
            {ch369?.tag ? `Tag ${ch369.tag}/21 · heute ${ci.dankbarkeitHeute ? "erledigt ✓" : "noch offen"}` : "Noch nicht gestartet"}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Eyebrow color={C.plum}>Heutige Aufgaben · {heuteStr}</Eyebrow>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: erledigt === tasks.length ? C.sage : C.plum }}>{erledigt}/{tasks.length}</span>
        </div>
        {tasks.map((t, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", marginBottom: 6,
            borderRadius: 12, border: `1.5px solid ${t.done ? C.sage : C.line}`, background: t.done ? "#F2F8F0" : C.card,
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 600, color: C.espresso, opacity: t.done ? 0.75 : 1 }}>{t.t}</span>
            <div style={{ width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${t.done ? C.sage : C.line}`, background: t.done ? C.sage : C.card, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{t.done ? "✓" : ""}</div>
          </div>
        ))}
      </Card>

      {ci.warnungen.length > 0 && (
        <Card style={{ marginBottom: 14, background: "#F9E8E2", border: `1px solid #E7B7A8` }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#B0492F" }}>⚠ Frühwarnung</div>
          {ci.warnungen.map((w, i) => (
            <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, marginTop: 4 }}>• {w}</div>
          ))}
        </Card>
      )}

      <Card>
        <Eyebrow color={C.plum}>Letzte Check-ins</Eyebrow>
        {checkins?.length ? checkins.slice(0, 5).map((c, i) => (
          <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.line}` : "none" }}>
            {c.datum} · Wert {c.wert}/5{c.notiz ? ` · „${c.notiz}"` : ""}
          </div>
        )) : (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Noch keine Check-ins.</p>
        )}
      </Card>

      <CoachReflexion ci={ci} checkins={checkins} streak={streak} />
    </div>
  );
}

function WochenCheckin({ checkins, setCheckins, addPunkte, prefs, setPrefs }) {
  const [wert, setWert] = useState(0);
  const [notiz, setNotiz] = useState("");
  if (!setCheckins) return null;
  const heute = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  const letzte = checkins && checkins[0];
  const schonHeute = letzte && letzte.datum === heute;
  const SMILEYS = [["😔", 1], ["😕", 2], ["😐", 3], ["🙂", 4], ["😊", 5]];
  const erinnerung = prefs?.checkinReminder ?? true;
  const speichern = () => {
    if (!wert) return;
    setCheckins([{ datum: heute, wert, notiz: notiz.trim() }, ...(checkins || [])].slice(0, 12));
    setNotiz(""); setWert(0);
    if (addPunkte) addPunkte(10, "Wöchentlicher Check-in");
  };
  return (
    <Card style={{ marginBottom: 14 }}>
      <Eyebrow color={C.plum}>Wöchentlicher Check-in</Eyebrow>
      {schonHeute ? (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, marginTop: 6 }}>✓ Heute schon eingecheckt — schön, dass du dranbleibst. 🤍</p>
      ) : (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, margin: "6px 0 10px", lineHeight: 1.5 }}>Wie fühlst du dich mit deinen Zielen diese Woche?</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {SMILEYS.map(([e, v]) => (
              <button key={v} onClick={() => setWert(v)} style={{ flex: 1, padding: "10px 0", borderRadius: 13, cursor: "pointer", border: `1.5px solid ${wert === v ? C.rose : C.line}`, background: wert === v ? C.roseSoft : C.card, fontSize: 22 }}>{e}</button>
            ))}
          </div>
          <textarea rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="Kurze Notiz für deine Coachin (optional)" style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
          <Btn small ghost={!wert} onClick={speichern}>Check-in speichern</Btn>
        </>
      )}
      <div onClick={() => setPrefs && setPrefs({ ...(prefs || {}), checkinReminder: !erinnerung })} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, cursor: "pointer" }}>
        <span style={{ fontSize: 17 }}>🔔</span>
        <div style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Erinnerung: Sonntagabend</div>
        <div style={{ width: 42, height: 24, borderRadius: 14, background: erinnerung ? C.gold : C.line, position: "relative", transition: "background .2s" }}>
          <div style={{ position: "absolute", top: 2, left: erinnerung ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
        </div>
      </div>
      {letzte && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 10 }}>Letzter Check-in: {letzte.datum} · {(SMILEYS.find((s) => s[1] === letzte.wert) || ["–"])[0]}</div>
      )}
    </Card>
  );
}

/* ── Progress Narrative: „Dein Wochenbild" (Katman 1 · Baustein 2) ──
   Erzählender Wochenrückblick NUR aus dem, was die Nutzerin selbst geschrieben hat.
   Harte Sprachregeln (HeilprG-Grenze): paraphrasieren statt bewerten, keine Diagnose-/Messsprache. */
const WOCHENBILD_SYSTEM = `Du bist ilho, der klar als KI gekennzeichnete Begleiter der App smile2go. Du schreibst „Dein Wochenbild": einen kurzen, warmen Rückblick (4–7 Sätze, Deutsch, Du-Form) für die Nutzerin — ausschließlich aus ihren eigenen Journal-Einträgen, Intentionen und Check-ins der letzten 7 Tage.
STRIKTE REGELN:
1. Paraphrasiere NUR, was die Nutzerin selbst geschrieben hat. Beispiel richtig: „Du hast diese Woche dreimal über Druck im Job geschrieben." Beispiel FALSCH: „Dein Stresslevel ist gestiegen."
2. Keine Diagnosen, keine Bewertungen ihrer Person, keine Mess- oder Punktzahl-Sprache, keine Therapie-Begriffe.
3. Benenne höchstens EIN wiederkehrendes Thema und EINE beobachtbare Veränderung — mit Bezug auf ihre eigenen Worte.
4. Schließe mit einer einzigen sanften, offenen Frage für die kommende Woche.
5. Wenn die Einträge Hinweise auf Krise, Selbstverletzung oder schweres seelisches Leid enthalten: KEIN Wochenbild schreiben, sondern einfühlsam sagen, dass du eine KI bist, und professionelle Hilfe empfehlen (TelefonSeelsorge 0800 111 0 111, Notruf 112).
6. Wenige oder keine Einträge: ehrlich und liebevoll sagen, dass das Bild diese Woche dünn ist — ohne Vorwurf.`;

function wochenKey() {
  const d = new Date(); const j = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${Math.ceil(((d - j) / 86400000 + j.getDay() + 1) / 7)}`;
}

function Wochenbild({ entries, checkins, streak, prefs, setPrefs, addPunkte }) {
  const [busy, setBusy] = useState(false);
  const key = wochenKey();
  const gespeichert = prefs?.wochenbild;
  const aktuell = gespeichert && gespeichert.woche === key ? gespeichert : null;

  const erstellen = async () => {
    if (busy) return;
    setBusy(true);
    const letzte = (entries || []).slice(0, 10).map((e) =>
      `${e.date}: Intention: ${e.intention || "—"}${e.stimmung ? ` · Selbstauskunft: ${e.stimmung}/10` : ""}${e.items?.length ? ` · ${e.items.join(" | ")}` : ""}`
    ).join("\n");
    const ci = (checkins || []).slice(0, 2).map((c) => `${c.datum}: ${c.wert}/5${c.notiz ? ` — „${c.notiz}"` : ""}`).join("\n");
    const user = `Journal der letzten Tage:\n${letzte || "(keine Einträge)"}\n\nWochen-Check-ins:\n${ci || "(keine)"}\n\nAktive Tage in Folge: ${streak}`;
    const text = await askLuma([{ role: "user", content: user }], WOCHENBILD_SYSTEM);
    if (text && setPrefs) {
      setPrefs({ ...(prefs || {}), wochenbild: { woche: key, datum: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }), text } });
      if (!aktuell && addPunkte) addPunkte(15, "Wochenbild angesehen");
      logEvent("wochenbild_erstellt");
    }
    setBusy(false);
  };

  return (
    <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, ${C.card}, ${C.roseSoft})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow color={C.plum}>🌙 Dein Wochenbild</Eyebrow>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>von ilho · KI</span>
      </div>
      {aktuell ? (
        <>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.65, margin: "8px 0 10px", whiteSpace: "pre-wrap" }}>{aktuell.text}</p>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink }}>Erstellt am {aktuell.datum} · aus deinen eigenen Worten dieser Woche</div>
          <div style={{ marginTop: 10 }}><Btn small ghost onClick={erstellen} disabled={busy}>{busy ? "✨ entsteht …" : "Neu erstellen"}</Btn></div>
        </>
      ) : (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "6px 0 10px" }}>
            ilho fasst deine Woche in Worte — nur aus dem, was du selbst geschrieben hast. Nichts wird bewertet, nichts gemessen.
          </p>
          <Btn small onClick={erstellen} disabled={busy}>{busy ? "✨ ilho liest deine Woche …" : "Wochenbild erstellen"}</Btn>
        </>
      )}
    </Card>
  );
}

function Fortschritt({ streak, entries, punkte, energie, aufgaben, ch369, checkins, setCheckins, addPunkte, prefs, setPrefs }) {
  const ci = coachingIntelligenz({ energie, entries, aufgaben, streak, ch369 });
  const week = [3, 2, 4, 1, 3, 2, 4];
  const max = Math.max(...week);
  const index = ci.index;
  const trendUp = week[6] >= week[5];
  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>Coaching-Intelligenz</Eyebrow>
      <H size={25} style={{ marginBottom: 16 }}>Dein Wohlbefinden im Blick</H>

      {/* Wohlbefindens-Index */}
      <Card style={{ marginBottom: 14, textAlign: "center", background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 140%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>Wohlbefindens-Index</Eyebrow>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 52, color: "#FFF8F0", lineHeight: 1.1 }}>{index}<span style={{ fontSize: 22 }}>/100</span></div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#FFF3F0", fontWeight: 600 }}>{trendUp ? "↑ steigend diese Woche" : "→ stabil diese Woche"}</div>
        <div style={{ height: 8, borderRadius: 6, background: "rgba(255,255,255,.25)", overflow: "hidden", margin: "12px 6px 8px" }}>
          <div style={{ width: `${index}%`, height: "100%", borderRadius: 6, background: "#FFF8F0" }} />
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#FFF3F0", opacity: 0.9, lineHeight: 1.5 }}>
          Aus deinen täglichen Signalen (Energie, Journal, Aufgaben, Streak) berechnet. Mit deiner Einwilligung sieht deine Coachin diesen Verlauf.
        </p>
      </Card>

      <WochenCheckin checkins={checkins} setCheckins={setCheckins} addPunkte={addPunkte} prefs={prefs} setPrefs={setPrefs} />

      <Wochenbild entries={entries} checkins={checkins} streak={streak} prefs={prefs} setPrefs={setPrefs} addPunkte={addPunkte} />

      {/* Frühwarnung (aus der Analyse-Engine) */}
      {ci.warnungen.length > 0 && (
        <Card style={{ marginBottom: 14, background: "#F9E8E2", border: `1px solid #E7B7A8` }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#B0492F" }}>⚠ Frühwarnung</div>
          {ci.warnungen.map((w, i) => (
            <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, marginTop: 4 }}>• {w}</div>
          ))}
        </Card>
      )}

      {/* Empfehlung (ilho, aus der Analyse) */}
      <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "flex-start", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>🌿</div>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold }}>ilho empfiehlt</div>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.espresso, lineHeight: 1.55, marginTop: 3 }}>
            Dein schwächster Bereich ist gerade <strong>{ci.schwaechster}</strong>. Fokus diese Woche: {ci.empfehlung}. 🤍
          </p>
        </div>
      </Card>

      {/* Coach-Briefing wird im Hintergrund erzeugt (ci.briefing) und nur mit Einwilligung
          an die Coachin übermittelt — in der Klientinnen-Ansicht bewusst nicht sichtbar. */}

      <Card style={{ textAlign: "center", marginBottom: 14, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`, border: "none" }}>
        <div style={{ fontSize: 38 }}>🔥</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 42, color: C.plum }}>{streak}</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, fontWeight: 600 }}>Tage in Folge aktiv</div>
      </Card>

      {(() => {
        const STUFEN = ["Erwachen", "Aufblühen", "Strahlen", "Fülle", "Göttin"];
        const lvl = Math.min(5, Math.floor((punkte || 0) / 150) + 1);
        const next = lvl < 5 ? lvl * 150 : null;
        const pct = next ? Math.min(100, Math.round(((punkte || 0) / next) * 100)) : 100;
        return (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <Eyebrow color={C.plum}>✨ Lichtpunkte</Eyebrow>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.espresso }}>{punkte}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Stufe {lvl}</div>
                <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 17, color: C.plum }}>{STUFEN[lvl - 1]}</div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: C.beige, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})` }} />
            </div>
            {next && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 7 }}>Noch {next - punkte} Punkte bis „{STUFEN[lvl]}" — sammle täglich: Karte ziehen, Journal, Challenge & Rituale ✨</div>}
          </Card>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.espresso }}>{12 + entries.length}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>Tagebuch-Einträge</div>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.espresso }}>4 h 20</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>Meditation gesamt</div>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Eyebrow color={C.plum}>Energie-Trend · 7 Tage</Eyebrow>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90, marginTop: 8 }}>
          {week.map((v, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: `${(v / max) * 70}px`, borderRadius: 6, background: i === 6 ? `linear-gradient(180deg, ${C.gold}, ${C.rose})` : C.beige }} />
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, marginTop: 6 }}>{["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][i]}</div>
            </div>
          ))}
        </div>
      </Card>

      <Eyebrow>Deine Abzeichen</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
        {BADGES.map((b) => (
          <Card key={b.t} style={{ textAlign: "center", padding: 14, opacity: b.got ? 1 : 0.42 }}>
            <div style={{ fontSize: 26 }}>{b.icon}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.espresso, fontWeight: 600, marginTop: 5 }}>{b.t}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Profil ── */

function Profil({ email, onLogout, go, alias, setAlias, anon, setAnon }) {
  const [time, setTime] = useState("07:00");
  const [push, setPush] = useState(true);
  const [plan, setPlan] = useState("Starter");

  const Row = ({ children }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderBottom: `1px solid ${C.line}` }}>{children}</div>
  );
  const Label = ({ children }) => <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14.5, color: C.espresso, fontWeight: 600 }}>{children}</div>;

  const plans = [
    { n: "Starter", p: "29 €", f: "Spruch, Orakel, Tagebuch, Mondkalender" },
    { n: "Pro", p: "49 €", f: "+ ilho-Chat, Kurse, Challenges, Musik" },
    { n: "Business", p: "99 €", f: "+ Coach-Tools & Personalisierung" },
  ];

  const nameShown = anon ? "Anonym" : (alias.trim() || (email ? email.split("@")[0].replace(/[._\d]/g, " ").trim() : "Mein Profil"));
  const connect = [
    { icon: "📸", t: "Anja auf Instagram" },
    { icon: "📌", t: "Anja auf Pinterest" },
    { icon: "▶️", t: "Anja auf YouTube" },
    { icon: "💗", t: "Gruppe · Frauen unterstützen Frauen" },
    { icon: "🌸", t: "Community-Treffen" },
    { icon: "📅", t: "Events & Retreats" },
  ];

  return (
    <div>
      {/* Avatar-Banner */}
      <div style={{ position: "relative", height: 178, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft} 65%, ${C.beige})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 116, height: 116, borderRadius: "50%", background: C.card, border: `3px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, color: C.gold, boxShadow: "0 6px 20px rgba(58,42,34,.15)" }}>👤</div>
          <button aria-label="Foto ändern" style={{ position: "absolute", bottom: 2, right: 2, width: 34, height: 34, borderRadius: "50%", border: "none", background: C.card, boxShadow: "0 2px 8px rgba(58,42,34,.25)", cursor: "pointer", fontSize: 15 }}>✏️</button>
        </div>
      </div>

      <div style={{ padding: "14px 20px 4px", textAlign: "center" }}>
        <H size={22}>{nameShown}</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 2 }}>{email}</p>
      </div>

      <div style={{ padding: "16px 20px 26px" }}>
        {/* Account */}
        <Eyebrow color={C.plum}>Account</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          <Row><Label>Name</Label><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink }}>{nameShown}</div></Row>
          <Row><Label>E-Mail</Label><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink }}>{email}</div></Row>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0" }}>
            <Label>Passwort ändern</Label>
            <span style={{ color: C.gold, fontSize: 18 }}>›</span>
          </div>
        </Card>

        {/* Benachrichtigungen */}
        <Eyebrow color={C.plum}>Benachrichtigungen</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          <Row>
            <Label>Push aktiv</Label>
            <button onClick={() => setPush(!push)} style={{ width: 52, height: 30, borderRadius: 20, border: "none", cursor: "pointer", position: "relative", background: push ? C.rose : C.line, transition: "background .2s" }}>
              <span style={{ position: "absolute", top: 3, left: push ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
            </button>
          </Row>
          <Row>
            <Label>Erinnerung um</Label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, padding: "8px 12px", border: `1.5px solid ${C.line}`, borderRadius: 10, background: C.card, color: C.espresso }} />
          </Row>
        </Card>

        {/* Persönlich */}
        <Eyebrow color={C.plum}>Persönlich</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          <div onClick={() => go && go("fragebogen")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", cursor: "pointer" }}>
            <Label>📝 Willkommens-Fragebogen</Label>
            <span style={{ color: C.gold, fontSize: 18 }}>›</span>
          </div>
        </Card>

        {/* Community & Connect */}
        <Eyebrow color={C.plum}>Community & Connect</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          {connect.map((c, i) => (
            <div key={c.t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i < connect.length - 1 ? `1px solid ${C.line}` : "none", cursor: "pointer" }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso }}>{c.t}</span>
              <span style={{ color: C.gold, fontSize: 18 }}>›</span>
            </div>
          ))}
        </Card>

        {/* Abo & Käufe */}
        <Eyebrow color={C.plum}>Abo & Käufe</Eyebrow>
        <div style={{ display: "grid", gap: 10, marginTop: 8, marginBottom: 16 }}>
          {plans.map((p) => {
            const active = plan === p.n;
            return (
              <Card key={p.n} onClick={() => setPlan(p.n)} style={{ borderColor: active ? C.rose : C.line, background: active ? C.roseSoft : C.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: C.espresso }}>{p.n} {active && "✓"}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{p.f}</div>
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.plum, whiteSpace: "nowrap" }}>{p.p}<span style={{ fontSize: 11, fontFamily: "system-ui, sans-serif", color: C.ink }}>/Monat</span></div>
              </Card>
            );
          })}
        </div>

        {/* Hilfe & Info */}
        <Eyebrow color={C.plum}>Hilfe & Info</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          {[
            { t: "📖 App-Guide", fn: () => go("appguide") },
            { t: "🧑‍⚕️ Coach-Ansicht (Demo)", fn: () => go("coachdash") },
            { t: "🤝 KI Coach Twin (Beta)", fn: () => go("coachtwin") },
            { t: "📝 Session-Notiz (Coach-Werkstatt)", fn: () => go("sessionnotiz") },
            { t: "🧠 Wissensarchiv (Coach-Werkstatt)", fn: () => go("wissen") },
            { t: "💬 Support kontaktieren", fn: null },
            { t: "🆘 In Krisen: TelefonSeelsorge 0800 111 0 111 · Notruf 112", fn: null },
            { t: "📄 Datenschutzerklärung", fn: () => go("datenschutz") },
            { t: "📄 Impressum", fn: () => go("impressum") },
            { t: "📥 Meine Daten exportieren", fn: null },
            { t: "🗑️ Konto & alle Daten löschen", fn: null },
          ].map((x, i, arr) => (
            <div key={x.t} onClick={x.fn || undefined} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : "none", cursor: x.fn ? "pointer" : "default", opacity: x.fn ? 1 : 0.55 }}>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso }}>{x.t}</span>
              <span style={{ color: C.gold, fontSize: 18 }}>{x.fn ? "›" : ""}</span>
            </div>
          ))}
        </Card>

        <Btn full ghost onClick={onLogout}>Abmelden</Btn>
      </div>
    </div>
  );
}

/* ── Termin-Buchung (Calendly-Stil): buchen & verschieben in Sekunden ── */

function Buchen({ buchung, setBuchung, termine, setTermine }) {
  const TAGE = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(Date.now() + (i + 1) * 864e5);
    return d;
  }).filter((d) => d.getDay() !== 0 && d.getDay() !== 6).slice(0, 4);
  const ZEITEN = ["09:00", "11:00", "14:00", "16:30"];
  const [tag, setTag] = useState(null);
  const [videoInfo, setVideoInfo] = useState(false);

  const buchen = (z) => {
    const label = `${tag.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })} · ${z}`;
    setBuchung({ label, z });
    setTermine([{ z, t: `Coaching-Session mit Anja (${tag.toLocaleDateString("de-DE", { day: "numeric", month: "short" })})` }, ...termine]);
  };

  const stornieren = () => {
    setTermine(termine.filter((t) => !t.t.startsWith("Coaching-Session")));
    setBuchung(null);
    setTag(null);
  };

  if (buchung)
    return (
      <div style={{ padding: "20px 20px" }}>
        <Eyebrow>Termin buchen</Eyebrow>
        <H size={24} style={{ marginBottom: 16 }}>Deine Session steht 🤍</H>
        <Card style={{ textAlign: "center", background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`, border: "none", marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>📅</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 21, color: C.espresso }}>{buchung.label}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 4 }}>1:1 Coaching-Session mit Anja · 50 Min · Zoom</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.sage, fontWeight: 700, marginTop: 8 }}>✓ Bestätigung per Mail & Erinnerung 24 h vorher</div>
        </Card>
        <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>🎥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Video-Session</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>{videoInfo ? "Dein Video-Raum öffnet 15 Min vor Beginn — du bekommst hier & per Mail den Link." : "Direkt aus der App beitreten — kein Extra-Tool nötig."}</div>
          </div>
          <Btn small ghost onClick={() => setVideoInfo(true)}>Session beitreten</Btn>
        </Card>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Btn full ghost onClick={() => { setBuchung(null); }}>↻ Verschieben</Btn></div>
          <div style={{ flex: 1 }}><Btn full ghost onClick={stornieren}>Stornieren</Btn></div>
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "center", marginTop: 14 }}>
          Verschieben & Stornieren — in Sekunden, ohne E-Mail-Pingpong.
        </p>
      </div>
    );

  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Termin buchen</Eyebrow>
      <H size={24} style={{ marginBottom: 8 }}>Buche in Sekunden</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 16 }}>
        1:1 Session mit deiner Coachin — Termin wählen, fertig. Dein Termin erscheint automatisch auf deiner Startseite.
      </p>

      <Eyebrow color={C.plum}>1 · Tag wählen</Eyebrow>
      <div style={{ display: "flex", gap: 8, margin: "8px 0 16px", flexWrap: "wrap" }}>
        {TAGE.map((d) => {
          const aktiv = tag?.toDateString() === d.toDateString();
          return (
            <button key={d.toISOString()} onClick={() => setTag(d)} style={{
              flex: 1, minWidth: 70, padding: "11px 6px", borderRadius: 14, cursor: "pointer",
              border: `1.5px solid ${aktiv ? C.rose : C.line}`,
              background: aktiv ? C.roseSoft : C.card, textAlign: "center",
            }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: aktiv ? C.plum : C.ink }}>{d.toLocaleDateString("de-DE", { weekday: "short" })}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso, marginTop: 2 }}>{d.getDate()}.</div>
            </button>
          );
        })}
      </div>

      {tag && (
        <div style={{ animation: "fadeUp .35s ease" }}>
          <Eyebrow color={C.plum}>2 · Uhrzeit wählen</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 8 }}>
            {ZEITEN.map((z) => (
              <button key={z} onClick={() => buchen(z)} style={{
                padding: "15px 0", borderRadius: 14, cursor: "pointer",
                border: `1.5px solid ${C.gold}`, background: C.card,
                fontFamily: "system-ui, sans-serif", fontSize: 15.5, fontWeight: 700, color: C.espresso, minHeight: 50,
              }}>{z} Uhr</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Coach-Chat: Text & Sprachnachrichten zwischen den Sessions ── */

const COACH_ANTWORTEN = [
  "Danke, dass du das teilst 🤍 Ich lese alles in Ruhe und melde mich heute noch mit ein paar Gedanken.",
  "Wie schön, von dir zu hören! Nimm dir heute bewusst einen Moment für dich — wir vertiefen das in der nächsten Session.",
  "Das klingt nach einem wichtigen Schritt. Sei stolz auf dich! ✨ Magst du dazu kurz ins Tagebuch schreiben?",
];

function CoachChat({ msgs, setMsgs }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const antwort = () => {
    setTimeout(() => {
      setMsgs((m) => [...m, { von: "coach", txt: COACH_ANTWORTEN[m.length % COACH_ANTWORTEN.length] }]);
    }, 1400);
  };

  const send = () => {
    if (!input.trim()) return;
    setMsgs((m) => [...m, { von: "ich", txt: input.trim() }]);
    setInput("");
    antwort();
  };

  const sprach = () => {
    const sek = 8 + Math.floor(Math.random() * 40);
    setMsgs((m) => [...m, { von: "ich", voice: `0:${String(sek).padStart(2, "0")}` }]);
    antwort();
  };

  return (
    <div style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", minHeight: "60vh" }}>
      <Card style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, padding: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.rose}, ${C.plum})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👩‍🦰</div>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>Anja · deine Coachin</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.sage, fontWeight: 600 }}>● antwortet meist innerhalb weniger Stunden</div>
        </div>
      </Card>

      <div style={{ flex: 1 }}>
        {msgs.length === 0 && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, textAlign: "center", lineHeight: 1.6, padding: "20px 10px" }}>
            Zwischen euren Sessions ist Anja für dich da — schreib ihr oder schick eine Sprachnachricht 🎤
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.von === "ich" ? "flex-end" : "flex-start", marginBottom: 9 }}>
            <div style={{
              maxWidth: "80%", padding: "11px 14px", borderRadius: 17,
              borderBottomRightRadius: m.von === "ich" ? 5 : 17,
              borderBottomLeftRadius: m.von === "ich" ? 17 : 5,
              background: m.von === "ich" ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.card,
              border: m.von === "ich" ? "none" : `1px solid ${C.line}`,
              color: m.von === "ich" ? "#fff" : C.espresso,
              fontFamily: "system-ui, sans-serif", fontSize: 14, lineHeight: 1.5,
            }}>
              {m.voice ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>▶</span>
                  <span style={{ letterSpacing: 1.5 }}>▁▃▅▂▆▃▁▄▂▅▁</span>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>{m.voice}</span>
                </span>
              ) : m.txt}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={sprach} style={{
          width: 48, height: 48, borderRadius: "50%", border: `1.5px solid ${C.rose}`, background: C.roseSoft,
          fontSize: 19, cursor: "pointer", flexShrink: 0,
        }}>🎤</button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nachricht an Anja …"
          style={{ flex: 1, padding: "13px 16px", fontSize: 15, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 22, background: C.card, color: C.espresso, outline: "none" }}
        />
        <button onClick={send} style={{
          width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 18, flexShrink: 0,
        }}>↑</button>
      </div>
    </div>
  );
}

/* ── Mein Office: Käufe · Briefkopf · Angebote & Rechnungen (Business) ── */

const STILE = ["Elegant", "Modern", "Verspielt"];

const VORLAGEN = [
  { icon: "💎", t: "1:1 Coaching-Paket", typ: "Angebot", pos: [{ t: "1:1 Coaching-Paket (4 Sessions à 60 Min)", p: "480" }, { t: "Workbook & WhatsApp-Begleitung", p: "0" }], wunsch: "Warm und wertschätzend; den Nutzen für innere Klarheit betonen." },
  { icon: "🌕", t: "Workshop / Retreat", typ: "Angebot", pos: [{ t: "Tages-Workshop „Vollmond-Ritual“ (6 Std)", p: "129" }], wunsch: "Gruppenerlebnis und Gemeinschaft betonen." },
  { icon: "🧾", t: "Einzelsession", typ: "Rechnung", pos: [{ t: "1:1 Coaching-Session (60 Min)", p: "120" }], wunsch: "Kurz, herzlich, mit Dank." },
  { icon: "✨", t: "Paket-Abschluss", typ: "Rechnung", pos: [{ t: "Coaching-Paket „Innere Klarheit“ (4 Sessions)", p: "480" }], wunsch: "" },
];
const FARBEN = ["#C9963C", "#D96E8B", "#8E4A63", "#6E8B6A", "#5C7A99", "#3A2A22"];

function docHtml(bk, doc, logoImg) {
  const pos = doc.positionen.map((p) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${p.t}</td><td style="text-align:right;padding:8px 0;border-bottom:1px solid #eee">${p.p} €</td></tr>`).join("");
  const summe = doc.positionen.reduce((s, p) => s + (parseFloat(String(p.p).replace(",", ".")) || 0), 0).toFixed(2).replace(".", ",");
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${doc.typ} ${doc.nr}</title></head>
<body style="font-family:Georgia,serif;color:#3A2A22;max-width:700px;margin:40px auto;padding:0 24px">
<div style="border-bottom:3px solid ${bk.farbe};padding-bottom:18px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center">
  <div><div style="font-size:26px;color:${bk.farbe}">${logoImg ? `<img src="${logoImg}" style="height:44px;border-radius:9px;vertical-align:middle;margin-right:10px">` : bk.logo + " "}${bk.firma}</div>
  <div style="font-size:12px;color:#6B5443;margin-top:4px">${bk.nische}${bk.unterthemen ? " · " + bk.unterthemen : ""}</div></div>
  <div style="font-size:11px;color:#6B5443;text-align:right">${bk.adresse.replace(/\n/g, "<br>")}</div>
</div>
<div style="font-size:12px;color:#6B5443">${doc.empfaenger}</div>
<h2 style="margin:26px 0 4px;font-weight:normal">${doc.typ} <span style="color:${bk.farbe}">${doc.nr}</span></h2>
<div style="font-size:12px;color:#6B5443;margin-bottom:22px">Datum: ${doc.datum}${doc.typ === "Angebot" ? " · Gültig 30 Tage" : " · Zahlbar innerhalb 14 Tagen"}</div>
<div style="font-size:14px;line-height:1.7;white-space:pre-wrap">${doc.text}</div>
<table style="width:100%;margin:24px 0;font-size:14px;border-collapse:collapse">${pos}
<tr><td style="padding:12px 0;font-weight:bold">Gesamt</td><td style="text-align:right;padding:12px 0;font-weight:bold;color:${bk.farbe}">${summe} €</td></tr></table>
<div style="font-size:11px;color:#6B5443">Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.${bk.ustid ? " · USt-IdNr.: " + bk.ustid : ""}</div>
<div style="margin-top:34px;font-size:13px">Herzliche Grüße<br><span style="color:${bk.farbe};font-size:17px">${bk.firma}</span></div>
</body></html>`;
}

function Office({ office, setOffice, addPunkte }) {
  const bk = office.briefkopf;
  const [setup, setSetup] = useState({ firma: "", nische: "", unterthemen: "", stil: "Elegant", farbe: FARBEN[0], logo: "🌹", adresse: "", ustid: "" });
  const [typ, setTyp] = useState("Angebot");
  const [empfaenger, setEmpfaenger] = useState("");
  const [positionen, setPositionen] = useState([{ t: "", p: "" }]);
  const [wunsch, setWunsch] = useState("");
  const [doc, setDoc] = useState(null);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [mail, setMail] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [hoerend, setHoerend] = useState(false);
  const recognitionRef = useRef(null);

  const speichernBk = () => {
    if (!setup.firma.trim()) return;
    setOffice({ ...office, briefkopf: setup });
    if (addPunkte) addPunkte(10, "Briefkopf erstellt");
  };

  const sprachEingabe = () => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setInfo("🎤 Sprach-Erkennung wird von diesem Browser nicht unterstützt — bitte Chrome/Safari nutzen oder direkt tippen.");
      setTimeout(() => setInfo(""), 3400);
      return;
    }
    if (hoerend) { recognitionRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = "de-DE";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onstart = () => { setHoerend(true); setInfo("🎤 Ich höre zu …"); };
    rec.onresult = (e) => {
      const gesagt = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
      setWunsch((prev) => (prev.trim() ? `${prev.trim()} ${gesagt}` : gesagt));
      setInfo("✓ Übernommen");
      setTimeout(() => setInfo(""), 2000);
    };
    rec.onerror = () => {
      setInfo("Konnte dich gerade nicht verstehen — versuch es noch einmal oder tippe direkt.");
      setTimeout(() => setInfo(""), 3000);
    };
    rec.onend = () => setHoerend(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const erstellen = async () => {
    if (!empfaenger.trim() || !positionen[0].t.trim()) { setInfo("Bitte Empfänger und mindestens eine Position ausfüllen."); setTimeout(() => setInfo(""), 2600); return; }
    setBusy(true);
    const nr = `${typ === "Angebot" ? "AG" : "RE"}-2026-${String(office.docs.length + 1).padStart(3, "0")}`;
    const datum = new Date().toLocaleDateString("de-DE");
    let text = "";
    try {
      text = await askLuma(
        [{ role: "user", content: `Schreibe den Fließtext für ein professionelles deutsches ${typ} (Sie-Form, warm aber geschäftlich) einer Coachin (${bk.nische}, Stil: ${bk.stil}). Empfänger: ${empfaenger}. Leistungen: ${positionen.map((p) => p.t).join("; ")}. ${wunsch ? "Zusätzliche Wünsche: " + wunsch : ""} Struktur: Anrede, 1 Absatz Einleitung, 1 Absatz Leistungsbeschreibung/Nutzen, 1 kurzer Absatz Abschluss mit ${typ === "Angebot" ? "Einladung zur Rückmeldung" : "Dank und Zahlungshinweis"}. KEINE Überschrift, KEINE Grußformel am Ende, keine Preise nennen.` }],
        ILHO_SYSTEM
      );
    } catch {
      text = `Sehr geehrte/r ${empfaenger},\n\nvielen Dank für Ihr Vertrauen. Gerne ${typ === "Angebot" ? "unterbreite ich Ihnen folgendes Angebot" : "stelle ich Ihnen folgende Leistungen in Rechnung"}.\n\nIch freue mich auf die gemeinsame Arbeit.`;
    }
    setDoc({ typ, nr, datum, empfaenger, positionen: positionen.filter((p) => p.t.trim()), text });
    setBusy(false);
    if (addPunkte) addPunkte(8, `${typ} erstellt`);
  };

  const herunterladen = () => {
    const html = docHtml(bk, doc, office.logoImg);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.typ}-${doc.nr}.html`;
    a.click();
    setInfo("⬇️ Heruntergeladen — im Browser öffnen → Drucken → „Als PDF speichern“");
    setTimeout(() => setInfo(""), 3500);
  };

  const speichernDoc = () => {
    setOffice({ ...office, docs: [{ ...doc }, ...office.docs] });
    setInfo("💾 Gespeichert in „Meine Dokumente“");
    setTimeout(() => setInfo(""), 2400);
  };

  const senden = () => {
    if (!mail.includes("@")) { setInfo("Bitte gültige E-Mail eingeben."); setTimeout(() => setInfo(""), 2400); return; }
    setOffice({ ...office, docs: [{ ...doc, gesendetAn: mail }, ...office.docs.filter((d) => d.nr !== doc.nr)] });
    setInfo(`📧 ${doc.typ} ${doc.nr} an ${mail} gesendet ✓ (Produktion: echter Mail-Versand)`);
    setMail("");
    setTimeout(() => setInfo(""), 3200);
  };

  const input = { width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, marginBottom: 10, outline: "none" };

  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Mein Office</Eyebrow>
      <H size={24} style={{ marginBottom: 16 }}>Business an einem Ort</H>

      {info && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum, background: C.roseSoft, borderRadius: 12, padding: "10px 14px", marginBottom: 12, animation: "fadeUp .3s ease" }}>{info}</div>}

      {/* Käufe */}
      <Eyebrow color={C.plum}>🛍️ Meine Käufe</Eyebrow>
      <div style={{ marginTop: 8, marginBottom: 20 }}>
        {office.kaeufe.map((k, i) => (
          <Card key={i} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", padding: 14 }}>
            <span style={{ fontSize: 20 }}>🌕</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{k.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>{k.d} · {k.p}</div>
            </div>
            <Btn small ghost>Beleg</Btn>
          </Card>
        ))}
      </div>

      {/* Dokumente (Business) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Eyebrow color={C.plum}>📄 Dokumente · Angebote & Rechnungen</Eyebrow>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold, border: `1px solid ${C.goldSoft}`, borderRadius: 20, padding: "2px 8px" }}>Business</span>
      </div>

      {!bk ? (
        <Card style={{ marginBottom: 16 }}>
          <Eyebrow>1 · Dein Briefkopf (einmalig)</Eyebrow>
          <input style={input} placeholder="Firmen-/Coachname *" value={setup.firma} onChange={(e) => setSetup({ ...setup, firma: e.target.value })} />
          <input style={input} placeholder="Deine Nische (z. B. Spirituelles Coaching)" value={setup.nische} onChange={(e) => setSetup({ ...setup, nische: e.target.value })} />
          <input style={input} placeholder="Unterthemen (z. B. Energiearbeit, Frauen-Circles)" value={setup.unterthemen} onChange={(e) => setSetup({ ...setup, unterthemen: e.target.value })} />
          <textarea style={{ ...input, resize: "vertical" }} rows={2} placeholder={"Adresse (Straße\nPLZ Ort)"} value={setup.adresse} onChange={(e) => setSetup({ ...setup, adresse: e.target.value })} />
          <input style={input} placeholder="USt-IdNr. (optional)" value={setup.ustid} onChange={(e) => setSetup({ ...setup, ustid: e.target.value })} />

          <Eyebrow color={C.plum}>Stil</Eyebrow>
          <div style={{ display: "flex", gap: 7, margin: "6px 0 12px" }}>
            {STILE.map((s) => (
              <button key={s} onClick={() => setSetup({ ...setup, stil: s })} style={{ flex: 1, padding: "10px 0", borderRadius: 14, cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, border: `1.5px solid ${setup.stil === s ? C.rose : C.line}`, background: setup.stil === s ? C.roseSoft : "transparent", color: setup.stil === s ? C.plum : C.ink }}>{s}</button>
            ))}
          </div>
          <Eyebrow color={C.plum}>Farbe & Logo</Eyebrow>
          <div style={{ display: "flex", gap: 9, alignItems: "center", margin: "8px 0 14px", flexWrap: "wrap" }}>
            {FARBEN.map((f) => (
              <button key={f} onClick={() => setSetup({ ...setup, farbe: f })} style={{ width: 34, height: 34, borderRadius: "50%", background: f, border: setup.farbe === f ? `3px solid ${C.espresso}` : "2px solid #fff", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,.15)" }} />
            ))}
            <input value={setup.logo} onChange={(e) => setSetup({ ...setup, logo: e.target.value })} maxLength={2} style={{ ...input, width: 64, marginBottom: 0, textAlign: "center", fontSize: 20 }} />
          </div>
          <Btn full onClick={speichernBk}>Briefkopf speichern ✓</Btn>
        </Card>
      ) : !doc ? (
        <Card style={{ marginBottom: 16 }}>
          {/* Briefkopf-Vorschau */}
          <div style={{ borderBottom: `3px solid ${bk.farbe}`, paddingBottom: 10, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: bk.farbe, display: "flex", alignItems: "center", gap: 8 }}>
                {office.logoImg ? <img src={office.logoImg} alt="" style={{ height: 30, borderRadius: 7 }} /> : bk.logo} {bk.firma}
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink }}>{bk.nische}</div>
            </div>
            <button onClick={() => { setSetup(bk); setOffice({ ...office, briefkopf: null }); }} style={{ background: "none", border: "none", color: C.plum, fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline", fontFamily: "system-ui, sans-serif" }}>Bearbeiten</button>
          </div>

          <Eyebrow>2 · Schnellstart — Vorlagen für deine Nische</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0 16px" }}>
            {VORLAGEN.map((v) => (
              <button key={v.t} onClick={() => { setTyp(v.typ); setPositionen(v.pos.map((p) => ({ ...p }))); setWunsch(v.wunsch); setInfo(`✓ Vorlage „${v.t}" geladen — Variablen anpassen & los`); setTimeout(() => setInfo(""), 2600); }} style={{
                textAlign: "left", padding: "11px 12px", borderRadius: 13, cursor: "pointer",
                border: `1.5px solid ${C.goldSoft}`, background: C.goldPale,
              }}>
                <div style={{ fontSize: 19 }}>{v.icon}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: C.espresso, marginTop: 3 }}>{v.t}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, color: C.ink, marginTop: 1 }}>{v.typ}</div>
              </button>
            ))}
          </div>

          <Eyebrow>3 · Variablen anpassen</Eyebrow>
          <div style={{ display: "flex", gap: 8, margin: "8px 0 12px", background: C.beige, borderRadius: 13, padding: 4 }}>
            {["Angebot", "Rechnung"].map((t) => (
              <button key={t} onClick={() => setTyp(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700, background: typ === t ? C.card : "transparent", color: typ === t ? C.plum : C.ink }}>{t === "Angebot" ? "📋 Angebot" : "🧾 Rechnung"}</button>
            ))}
          </div>

          <input style={input} placeholder="Empfängerin / Kundin (Name, ggf. Firma) *" value={empfaenger} onChange={(e) => setEmpfaenger(e.target.value)} />

          <Eyebrow color={C.plum}>Positionen</Eyebrow>
          {positionen.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input style={{ ...input, flex: 1 }} placeholder={`Leistung ${i + 1} *`} value={p.t} onChange={(e) => setPositionen(positionen.map((x, j) => j === i ? { ...x, t: e.target.value } : x))} />
              <input style={{ ...input, width: 90 }} placeholder="€" value={p.p} onChange={(e) => setPositionen(positionen.map((x, j) => j === i ? { ...x, p: e.target.value } : x))} />
            </div>
          ))}
          {positionen.length < 4 && (
            <button onClick={() => setPositionen([...positionen, { t: "", p: "" }])} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "0 0 12px", textDecoration: "underline" }}>+ Position hinzufügen</button>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <textarea style={{ ...input, flex: 1, resize: "vertical" }} rows={2} placeholder="Sag ilho, was wichtig ist (Ton, Details) — oder nutze 🎤" value={wunsch} onChange={(e) => setWunsch(e.target.value)} />
            <button onClick={sprachEingabe} style={{ width: 46, height: 46, borderRadius: "50%", border: `1.5px solid ${C.rose}`, background: hoerend ? C.rose : C.roseSoft, fontSize: 18, cursor: "pointer", flexShrink: 0, boxShadow: hoerend ? `0 0 0 4px ${C.roseSoft}` : "none", transition: "box-shadow .3s" }}>🎤</button>
          </div>

          <Btn full onClick={erstellen} disabled={busy}>{busy ? "✨ ilho schreibt dein Dokument …" : `✨ ilho, erstelle mein ${typ}`}</Btn>
        </Card>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          {/* Dokument-Vorschau */}
          <div style={{ borderBottom: `3px solid ${bk.farbe}`, paddingBottom: 10, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: bk.farbe, display: "flex", alignItems: "center", gap: 8 }}>
              {office.logoImg ? <img src={office.logoImg} alt="" style={{ height: 28, borderRadius: 7 }} /> : bk.logo} {bk.firma}
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, textAlign: "right" }}>{doc.datum}</div>
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginBottom: 8 }}>{doc.empfaenger}</div>
          <H size={18} style={{ marginBottom: 10 }}>{doc.typ} <span style={{ color: bk.farbe }}>{doc.nr}</span></H>

          {bearbeiten ? (
            <textarea value={doc.text} onChange={(e) => setDoc({ ...doc, text: e.target.value })} rows={9}
              style={{ width: "100%", padding: "13px 14px", fontSize: 13.5, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.rose}`, borderRadius: 13, background: C.card, color: C.espresso, marginBottom: 10, outline: "none", resize: "vertical", lineHeight: 1.6 }} />
          ) : (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.65, whiteSpace: "pre-wrap", marginBottom: 12 }}>{doc.text}</p>
          )}

          {doc.positionen.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
              <span style={{ color: C.espresso }}>{p.t}</span><span style={{ color: C.ink }}>{p.p} €</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 14px", fontFamily: "system-ui, sans-serif", fontSize: 14.5, fontWeight: 700 }}>
            <span>Gesamt</span>
            <span style={{ color: bk.farbe }}>{doc.positionen.reduce((s, p) => s + (parseFloat(String(p.p).replace(",", ".")) || 0), 0).toFixed(2).replace(".", ",")} €</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><Btn full ghost small onClick={() => setBearbeiten(!bearbeiten)}>{bearbeiten ? "✓ Fertig" : "✏️ Bearbeiten"}</Btn></div>
            <div style={{ flex: 1 }}><Btn full ghost small onClick={speichernDoc}>💾 Speichern</Btn></div>
            <div style={{ flex: 1 }}><Btn full small onClick={herunterladen}>⬇️ PDF</Btn></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input style={{ ...input, flex: 1, marginBottom: 0 }} placeholder="E-Mail der Empfängerin …" value={mail} onChange={(e) => setMail(e.target.value)} />
            <Btn small onClick={senden}>📧 Senden</Btn>
          </div>
          <button onClick={() => { setDoc(null); setBearbeiten(false); }} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: "6px 0" }}>← Neues Dokument</button>
        </Card>
      )}

      {/* Gespeicherte Dokumente */}
      {office.docs.length > 0 && (
        <>
          <Eyebrow color={C.plum}>📁 Meine Dokumente</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {office.docs.map((d, i) => (
              <Card key={i} style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center", padding: 13 }}>
                <span style={{ fontSize: 19 }}>{d.typ === "Angebot" ? "📋" : "🧾"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: C.espresso }}>{d.typ} {d.nr} · {d.empfaenger}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: d.gesendetAn ? C.sage : C.ink, fontWeight: d.gesendetAn ? 700 : 400 }}>{d.gesendetAn ? `✓ Gesendet an ${d.gesendetAn}` : d.datum}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Mediathek · Downloads, Uploads, Hilfe ── */

const DOWNLOADS = [
  { icon: "📕", t: "Workbook „Innere Mitte“", s: "PDF · 24 Seiten" },
  { icon: "🎧", t: "Meditation „Herzöffnung“", s: "Audio · 12 Min" },
  { icon: "🌙", t: "Mondkalender des Monats", s: "PDF · 2 Seiten" },
  { icon: "🌹", t: "Göttinnen-Karten zum Drucken", s: "PDF · 11 Karten" },
];

const COACH_DOKUMENTE = [
  { icon: "📕", t: "Workbook „Innere Klarheit“ · Woche 1", s: "PDF · 8 Seiten", neu: true },
  { icon: "📝", t: "Aufgabe: Werte-Reflexion", s: "Arbeitsblatt · PDF", neu: true },
  { icon: "🎧", t: "Meditation für deinen Abend", s: "Audio · 10 Min", neu: false },
  { icon: "📄", t: "Zusammenfassung letzte Session", s: "PDF · 2 Seiten", neu: false },
];

const RESSOURCEN = [
  { icon: "📕", t: "E-Book: Innere Führung", kat: "E-Books", s: "PDF · 48 Seiten" },
  { icon: "📕", t: "E-Book: Vom Herzen führen", kat: "E-Books", s: "PDF · 36 Seiten" },
  { icon: "📰", t: "Artikel: EU AI Act für Coaches", kat: "Artikel", s: "5 Min Lesezeit" },
  { icon: "📰", t: "Artikel: Grenzen setzen als Coachin", kat: "Artikel", s: "4 Min Lesezeit" },
  { icon: "🎬", t: "Video: Atemtechniken für Sessions", kat: "Videos", s: "12 Min" },
  { icon: "🎬", t: "Video: Dein erstes Coaching-Paket", kat: "Videos", s: "18 Min" },
  { icon: "🎧", t: "Audio: Selbstvertrauen stärken", kat: "Audio", s: "15 Min" },
  { icon: "📊", t: "Case Study: Vom Hobby zum Business", kat: "Artikel", s: "8 Min Lesezeit" },
];

const TOOLS_KATALOG = [
  { k: "gcal", icon: "🗓️", t: "Google Kalender", s: "Termine automatisch im Heute-Widget" },
  { k: "health", icon: "💗", t: "Apple Health / Fitness", s: "Bewegung & Achtsamkeit verbinden" },
  { k: "notion", icon: "📝", t: "Notion", s: "Journal-Einträge exportieren" },
  { k: "spotify", icon: "🎧", t: "Spotify", s: "Eigene Playlists in der Meditation" },
  { k: "zoom", icon: "🎥", t: "Zoom", s: "Coaching-Sessions direkt starten" },
  { k: "whatsapp", icon: "💬", t: "WhatsApp", s: "Support & Erinnerungen" },
];

function Mediathek({ uploads, setUploads, tools, setTools, office, setOffice }) {
  const [kat, setKat] = useState("Alle");
  const [hinweis, setHinweis] = useState("");
  const kats = ["Alle", "Artikel", "E-Books", "Videos", "Audio"];
  const liste = kat === "Alle" ? RESSOURCEN : RESSOURCEN.filter((r) => r.kat === kat);
  const typIcon = (name) => {
    const n = name.toLowerCase();
    if (n.match(/\.(jpg|jpeg|png|gif|webp|heic)$/)) return "🖼️";
    if (n.match(/\.(mp4|mov|webm|avi)$/)) return "🎬";
    if (n.endsWith(".pdf")) return "📕";
    if (n.match(/\.(mp3|wav|m4a)$/)) return "🎧";
    return "📄";
  };

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    Promise.all(files.map((f) => new Promise((res) => {
      const basis = { name: f.name, size: Math.round(f.size / 1024) };
      if (f.type.startsWith("image/") && f.size < 1500000) {
        const r = new FileReader();
        r.onload = () => res({ ...basis, dataUrl: r.result });
        r.onerror = () => res(basis);
        r.readAsDataURL(f);
      } else res(basis);
    }))).then((neu) => { if (neu.length) setUploads([...neu, ...uploads]); });
    e.target.value = "";
  };

  const alsLogo = (u) => {
    setOffice({ ...office, logoImg: u.dataUrl });
    setHinweis(`✓ „${u.name}" ist jetzt dein Briefkopf-Logo — sichtbar in Mein Office`);
    setTimeout(() => setHinweis(""), 3200);
  };

  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Mediathek</Eyebrow>
      <H size={25} style={{ marginBottom: 18 }}>Deine Medien & Materialien</H>

      <Eyebrow color={C.plum}>🌿 Von deiner Coachin</Eyebrow>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5, margin: "6px 0 10px" }}>
        Materialien, PDFs und Aufgaben, die Anja dir geschickt hat — sicher an einem Ort (DSGVO, EU).
      </p>
      <div style={{ marginBottom: 22 }}>
        {COACH_DOKUMENTE.map((d) => (
          <Card key={d.t} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", padding: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.goldPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>{d.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{d.t}</span>
                {d.neu && <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 9.5, fontWeight: 700, color: "#fff", background: C.rose, borderRadius: 10, padding: "2px 7px" }}>NEU</span>}
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 2 }}>{d.s}</div>
            </div>
            <Btn small ghost>↓</Btn>
          </Card>
        ))}
      </div>

      <div style={{ margin: "0 -20px 8px" }}><Musik /></div>

      <Eyebrow color={C.plum}>📚 Ressourcen-Bibliothek</Eyebrow>
      <div style={{ display: "flex", gap: 7, margin: "8px 0 12px", flexWrap: "wrap" }}>
        {kats.map((c) => (
          <button key={c} onClick={() => setKat(c)} style={{
            fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
            padding: "8px 13px", borderRadius: 18, cursor: "pointer", minHeight: 36,
            border: `1.5px solid ${kat === c ? C.rose : C.line}`,
            background: kat === c ? C.roseSoft : "transparent",
            color: kat === c ? C.plum : C.ink,
          }}>{c}</button>
        ))}
      </div>
      <div style={{ marginBottom: 20 }}>
        {liste.map((r) => (
          <Card key={r.t} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", padding: 14 }}>
            <span style={{ fontSize: 21 }}>{r.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{r.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 2 }}>{r.kat} · {r.s}</div>
            </div>
            <div style={{ color: C.gold, fontSize: 18 }}>›</div>
          </Card>
        ))}
      </div>


      <Eyebrow color={C.plum}>📥 Downloads</Eyebrow>
      <div style={{ marginTop: 8, marginBottom: 20 }}>
        {DOWNLOADS.map((d) => (
          <Card key={d.t} style={{ marginBottom: 10, display: "flex", gap: 13, alignItems: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{d.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{d.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{d.s}</div>
            </div>
            <Btn small ghost>↓</Btn>
          </Card>
        ))}
      </div>

      {hinweis && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum, background: C.roseSoft, borderRadius: 12, padding: "10px 14px", marginBottom: 12, animation: "fadeUp .3s ease" }}>{hinweis}</div>}

      <Eyebrow color={C.plum}>📤 Eigene Medien hochladen</Eyebrow>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, lineHeight: 1.5, margin: "6px 0 8px" }}>
        Was passiert mit deinen Uploads? Fotos kannst du als <strong>Briefkopf-Logo</strong> für Angebote & Rechnungen nutzen. In der fertigen App: sicher in der EU gespeichert (Supabase Storage), mit deiner Coachin teilbar und an Dokumente anhängbar.
      </p>
      <Card style={{ marginTop: 8, marginBottom: 12, textAlign: "center", border: `2px dashed ${C.goldSoft}`, background: C.goldPale }}>
        <label style={{ cursor: "pointer", display: "block", padding: "10px 0" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>☁️</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: C.espresso }}>Foto, Video oder PDF auswählen</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 4 }}>Tippe hier — deine Dateien bleiben privat (DSGVO)</div>
          <input type="file" multiple accept="image/*,video/*,.pdf,audio/*" onChange={onFiles} style={{ display: "none" }} />
        </label>
      </Card>

      {uploads.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {uploads.map((u, i) => (
            <Card key={i} style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center", padding: 13 }}>
              {u.dataUrl ? <img src={u.dataUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} /> : <span style={{ fontSize: 20 }}>{typIcon(u.name)}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 600, color: C.espresso, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.sage, fontWeight: 600 }}>✓ Hochgeladen · {u.size} KB</div>
                {u.dataUrl && (
                  <button onClick={() => alsLogo(u)} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: "3px 0 0", textDecoration: "underline" }}>
                    🏷️ Als Briefkopf-Logo verwenden
                  </button>
                )}
              </div>
              <button onClick={() => setUploads(uploads.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.ink, opacity: 0.5, cursor: "pointer", fontSize: 16, minWidth: 36, minHeight: 36 }}>✕</button>
            </Card>
          ))}
        </div>
      )}

      <Eyebrow color={C.plum}>🤝 Plattform & Hilfe</Eyebrow>
      <Card style={{ marginTop: 8, marginBottom: 10, display: "flex", gap: 13, alignItems: "center" }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🌐</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Zur smile2go-Plattform</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Website, Blog & Community</div>
        </div>
        <div style={{ color: C.gold, fontSize: 20 }}>›</div>
      </Card>
      <Card style={{ display: "flex", gap: 13, alignItems: "center", background: "#EAF6EC", border: "1px solid #BBDFC2" }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💬</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Hilfe & Support</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Per WhatsApp oder E-Mail — wir antworten persönlich 🤍</div>
        </div>
        <div style={{ color: "#3E7A4A", fontSize: 20 }}>›</div>
      </Card>
    </div>
  );
}

/* ── Mehr-Menü ── */

/* ── Ziele & Meilensteine (Coaching-Kern, von der Coachin gesetzt) ── */
function Ziele({ ziele, setZiele, addPunkte }) {
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
function Aufgaben({ aufgaben, setAufgaben, addPunkte, go }) {
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

      <Card onClick={() => go && go("tagebuch")} style={{ marginBottom: 22, display: "flex", gap: 13, alignItems: "center", background: `linear-gradient(135deg, ${C.card}, ${C.roseSoft})` }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: C.goldPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏆</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>3-6-9 Challenge</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>21-Tage-Dankbarkeit · +20 ✨ pro Tag</div>
        </div>
        <span style={{ color: C.gold, fontSize: 20 }}>›</span>
      </Card>

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

/* ── Rechtliches: Impressum & Datenschutzerklärung ── */
const Absatz = ({ h, children }) => (
  <div style={{ marginBottom: 15 }}>
    {h && <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso, marginBottom: 4 }}>{h}</div>}
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>{children}</div>
  </div>
);
function RechtSeite({ title, children }) {
  return (
    <div style={{ padding: "26px 20px 34px" }}>
      <H size={24} style={{ marginBottom: 16 }}>{title}</H>
      {children}
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.6, marginTop: 20, lineHeight: 1.6 }}>
        Platzhalter-Text · vor dem Livegang von einer Datenschutzbeauftragten bzw. Anwält:in prüfen und mit euren echten Daten füllen.
      </p>
    </div>
  );
}
function Impressum() {
  return (
    <RechtSeite title="Impressum">
      <Absatz h="Angaben gemäß § 5 DDG">Ilham Savran<br />Justinus-Kerner-Str. 22<br />80686 München · Deutschland</Absatz>
      <Absatz h="Kontakt">Telefon: [Telefonnummer]<br />E-Mail: [E-Mail-Adresse]</Absatz>
      <Absatz h="Umsatzsteuer-ID">[USt-IdNr. gemäß § 27 a UStG, falls vorhanden]</Absatz>
      <Absatz h="Verantwortlich i. S. d. § 18 Abs. 2 MStV">Ilham Savran, Anschrift wie oben</Absatz>
      <Absatz h="Hinweis">Die Inhalte von smile2go dienen der Persönlichkeitsentwicklung und ersetzen keine medizinische, psychotherapeutische oder rechtliche Beratung.</Absatz>
    </RechtSeite>
  );
}
function Datenschutz() {
  return (
    <RechtSeite title="Datenschutzerklärung">
      <Absatz h="1 · Verantwortliche Stelle">Ilham Savran, Justinus-Kerner-Str. 22, 80686 München. Kontakt Datenschutz: [E-Mail].</Absatz>
      <Absatz h="2 · Welche Daten wir verarbeiten">Kontodaten (E-Mail, Anzeigename), deine Eingaben (Tagebuch, Energie-Check, Ziele, Aufgaben, Nachrichten) und Nutzungsdaten. Angaben zu Stimmung und Energie können Gesundheitsdaten i. S. d. Art. 9 DSGVO sein und werden nur mit deiner ausdrücklichen Einwilligung verarbeitet.</Absatz>
      <Absatz h="3 · Zwecke & Rechtsgrundlage">Bereitstellung der App und Coaching-Begleitung (Art. 6 Abs. 1 b DSGVO), gesetzliche Pflichten (Art. 6 Abs. 1 c) sowie deine Einwilligung für sensible Daten und KI-Funktionen (Art. 6 Abs. 1 a · Art. 9 Abs. 2 a).</Absatz>
      <Absatz h="4 · Hosting & Auftragsverarbeiter">Speicherung in der EU (Supabase, Region Frankfurt). Weitere Dienstleister mit AVV nach Art. 28 DSGVO: KI-Anbieter (Textanalyse), Zahlungsdienstleister, E-Mail- und Push-Dienst.</Absatz>
      <Absatz h="5 · Deine Rechte">Auskunft (15), Berichtigung (16), Löschung (17), Einschränkung (18), Datenübertragbarkeit (20), Widerspruch (21). Einwilligungen jederzeit mit Wirkung für die Zukunft widerrufbar. Beschwerderecht bei einer Aufsichtsbehörde.</Absatz>
      <Absatz h="6 · Speicherdauer">Wir speichern deine Daten, solange dein Konto besteht. Bei Kontolöschung werden alle zugeordneten Daten entfernt (Recht auf Vergessen), soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</Absatz>
    </RechtSeite>
  );
}

/* ── Meditation & Achtsamkeit (Atemübung · geführte Meditationen · Report) ── */
function Meditation({ addPunkte }) {
  const [atmung, setAtmung] = useState(false);
  const [phase, setPhase] = useState("Bereit?");
  const [sessions, setSessions] = useState(0);
  const [minuten, setMinuten] = useState(0);

  useEffect(() => {
    if (!atmung) { setPhase("Bereit?"); return; }
    const phasen = ["Einatmen …", "Halten …", "Ausatmen …", "Halten …"];
    let i = 0; setPhase(phasen[0]);
    const id = setInterval(() => { i = (i + 1) % phasen.length; setPhase(phasen[i]); }, 4000);
    return () => clearInterval(id);
  }, [atmung]);

  const abschliessen = (min) => {
    setSessions((s) => s + 1);
    setMinuten((m) => m + min);
    if (addPunkte) addPunkte(5, "Meditation abgeschlossen");
  };

  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Meditation & Achtsamkeit</Eyebrow>
      <H size={25} style={{ marginBottom: 14 }}>Komm zur Ruhe 🤍</H>

      <Card style={{ marginBottom: 18, textAlign: "center", background: `linear-gradient(160deg, ${C.card}, ${C.roseSoft})` }}>
        <Eyebrow color={C.plum}>🌬️ Atemübung · 4-4-4-4</Eyebrow>
        <div style={{ height: 176, display: "flex", alignItems: "center", justifyContent: "center", margin: "6px 0" }}>
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Georgia, serif", fontSize: 16, animation: atmung ? "breathe 8s ease-in-out infinite" : "none", boxShadow: "0 8px 30px rgba(217,110,139,.35)" }}>
            {phase}
          </div>
        </div>
        <Btn onClick={() => { if (atmung) { setAtmung(false); abschliessen(2); } else setAtmung(true); }}>{atmung ? "Beenden & +5 ✨" : "Atemübung starten"}</Btn>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 10, lineHeight: 1.5 }}>
          Folge dem Kreis: 4 Sek. ein · 4 halten · 4 aus · 4 halten. Schon 1 Minute beruhigt dein Nervensystem.
        </p>
      </Card>

      <Card style={{ marginBottom: 18, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div><div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.plum }}>{sessions}</div><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>Sessions</div></div>
        <div><div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.plum }}>{minuten}</div><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>Minuten</div></div>
      </Card>

      <div style={{ margin: "0 -20px" }}><Musik /></div>
    </div>
  );
}

/* ── Community-Feed · Frauen unterstützen Frauen (sozialer Anker gegen Abbruch) ── */
const COMMUNITY = [
  { name: "Anja (Coach)", zeit: "vor 1 Std", text: "Impuls der Woche: Schenk dir heute 5 Minuten nur für dich. Was tut dir gut? 🤍", herzen: 41, coach: true },
  { name: "Sabine", zeit: "vor 2 Std", text: "Tag 12 der 3-6-9 Challenge — heute zum ersten Mal ohne Handy gefrühstückt.", herzen: 14 },
  { name: "Claudia", zeit: "vor 5 Std", text: "Habe endlich „Nein“ gesagt und es fühlt sich richtig an. Danke, dass ihr da seid.", herzen: 23 },
  { name: "Petra", zeit: "gestern", text: "Meditation vor dem Schlafen verändert wirklich meinen Schlaf. Wer macht mit?", herzen: 9 },
];
function Community({ addPunkte }) {
  const [posts, setPosts] = useState(COMMUNITY);
  const [neu, setNeu] = useState("");
  const [geherzt, setGeherzt] = useState({});
  const herz = (i) => { if (geherzt[i]) return; setGeherzt({ ...geherzt, [i]: true }); setPosts((ps) => ps.map((p, j) => (j === i ? { ...p, herzen: p.herzen + 1 } : p))); };
  const teilen = () => { if (!neu.trim()) return; setPosts([{ name: "Du", zeit: "gerade eben", text: neu.trim(), herzen: 0 }, ...posts]); setNeu(""); if (addPunkte) addPunkte(5, "Community-Beitrag"); };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Community</Eyebrow>
      <H size={25} style={{ marginBottom: 6 }}>Frauen unterstützen Frauen</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
        Teile einen Gedanken oder feiere jemanden. Ein liebes ♥ tut mehr, als du denkst.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={neu} onChange={(e) => setNeu(e.target.value)} onKeyDown={(e) => e.key === "Enter" && teilen()} placeholder="Etwas Schönes teilen…" style={{ flex: 1, padding: "13px 14px", fontSize: 15, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 13, background: C.card, color: C.espresso, outline: "none" }} />
        <Btn small onClick={teilen}>Teilen</Btn>
      </div>
      {posts.map((p, i) => (
        <Card key={i} style={{ marginBottom: 12, background: p.coach ? `linear-gradient(135deg, ${C.card}, ${C.goldPale})` : C.card }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: C.plum, fontWeight: 700, flexShrink: 0 }}>{p.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{p.name}</span>
              {p.coach && <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 700, color: C.plum, background: C.roseSoft, borderRadius: 10, padding: "2px 7px", marginLeft: 6 }}>Coachin</span>}
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 1 }}>{p.zeit}</div>
            </div>
          </div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.6, margin: "0 0 10px" }}>{p.text}</p>
          <button onClick={() => herz(i)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: geherzt[i] ? "default" : "pointer", color: geherzt[i] ? C.rose : C.ink, fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, padding: 0 }}>
            <span style={{ fontSize: 16 }}>{geherzt[i] ? "❤️" : "🤍"}</span> {p.herzen}
          </button>
        </Card>
      ))}
    </div>
  );
}

/* ── App-Guide (mit Begrüßungsvideo von Anja) ── */
function AppGuide() {
  const [ab, setAb] = useState(false);
  const schritte = [
    { icon: "☀️", t: "Heute", s: "Dein Tagesüberblick & tägliche Impulse." },
    { icon: "🔮", t: "Orakel", s: "Tageskarte, Horoskop & Mystik." },
    { icon: "✨", t: "ilho", s: "Dein KI-Begleiter — jederzeit für dich da." },
    { icon: "📔", t: "Journal", s: "Tagebuch, Zukunftsbrief, Fülle & Rituale." },
    { icon: "✦", t: "Mehr", s: "Coaching, Ziele, Challenges & Community." },
  ];
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>App-Guide</Eyebrow>
      <H size={25} style={{ marginBottom: 12 }}>Willkommen bei smile2go 🤍</H>
      <Card style={{ marginBottom: 20, padding: 10, background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        {!ab ? (
          <button onClick={() => setAb(true)} style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <span style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(217,110,139,.35)" }}>▶</span>
            <span style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 16.5, color: C.espresso }}>Begrüßungsvideo ansehen</span>
              <span style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Anja begrüßt dich persönlich · 1 Video</span>
            </span>
          </button>
        ) : (
          <video controls autoPlay playsInline src="/begruessung.mp4" style={{ width: "100%", borderRadius: 12, background: C.espresso, maxHeight: 380 }}>
            Dein Browser kann das Video nicht abspielen.
          </video>
        )}
      </Card>
      <Eyebrow color={C.plum}>So findest du dich zurecht</Eyebrow>
      <div style={{ marginTop: 8 }}>
        {schritte.map((s) => (
          <Card key={s.t} style={{ marginBottom: 10, display: "flex", gap: 13, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{s.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>{s.s}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Intake-Fragebogen: Onboarding vor der ersten Session (die Coachin sieht die Antworten) ── */

const FB_FOKUS = [
  { e: "🥰", t: "Selbstliebe" }, { e: "😌", t: "Stress & Ruhe" }, { e: "✨", t: "Positives Denken" },
  { e: "💪", t: "Gesundheit" }, { e: "💗", t: "Beziehungen" }, { e: "🌱", t: "Fülle & Finanzen" },
];
const FB_RHYTHMUS = ["Gerade nicht", "1–2× pro Woche", "3–4× pro Woche", "Jeden Tag"];
const FB_THEMEN = ["Selbstfürsorge", "Stress & Ruhe", "Selbstvertrauen", "Beziehungen", "Beruf & Sinn", "Grenzen setzen", "Fülle & Finanzen", "Spiritualität"];
const FB_TOTAL = 6;

function Fragebogen({ intake, setIntake, addPunkte }) {
  const [f, setF] = useState(intake || { fokus: "", rhythmus: "", themen: [], energie: 5, ziel: "" });
  const [step, setStep] = useState(intake ? 99 : 0);
  const [gesendet, setGesendet] = useState(!!intake);

  const toggleThema = (t) => setF((p) => ({ ...p, themen: p.themen.includes(t) ? p.themen.filter((x) => x !== t) : [...p.themen, t] }));
  const senden = () => { setIntake(f); setGesendet(true); setStep(99); if (addPunkte) addPunkte(15, "Fragebogen ausgefüllt"); };

  const cardSel = (aktiv) => ({ width: "100%", textAlign: "left", cursor: "pointer", padding: "16px 18px", borderRadius: 16, marginBottom: 11, border: `1.5px solid ${aktiv ? C.rose : C.line}`, background: aktiv ? C.roseSoft : C.card, fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 600, color: aktiv ? C.plum : C.espresso, display: "flex", alignItems: "center", gap: 12 });
  const heroGrad = `linear-gradient(160deg, ${C.goldPale}, ${C.roseSoft} 120%)`;

  // — Abschluss / Zusammenfassung —
  if (gesendet)
    return (
      <div style={{ padding: "20px 20px" }}>
        <Card style={{ textAlign: "center", background: heroGrad, border: "none", marginBottom: 16, padding: "26px 20px" }}>
          <div style={{ fontSize: 42, marginBottom: 6 }}>🤍</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.espresso }}>Danke — alles angekommen.</div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 8, lineHeight: 1.5 }}>Deine Coachin liest deine Antworten vor eurer ersten Session. So startet ihr direkt beim Wesentlichen.</p>
        </Card>
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          {[["Fokus", f.fokus], ["Rhythmus", f.rhythmus], ["Themen", (f.themen || []).join(", ") || "—"], ["Energie", `${f.energie}/10`], ["Ziel", f.ziel]].map(([k, v]) => (
            <Card key={k} style={{ display: "flex", gap: 12 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold, minWidth: 84 }}>{k}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>{v || "—"}</div>
            </Card>
          ))}
        </div>
        <Btn full ghost onClick={() => { setGesendet(false); setStep(1); }}>Antworten bearbeiten</Btn>
      </div>
    );

  // — Willkommen (Schritt 0) —
  if (step === 0)
    return (
      <div style={{ padding: "32px 22px", textAlign: "center" }}>
        <div style={{ margin: "20px auto 24px", width: 132, height: 132, borderRadius: 34, background: heroGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🌸</div>
        <Eyebrow>Willkommen bei smile2go</Eyebrow>
        <H size={27} style={{ margin: "6px 0 10px" }}>Schön, dass du da bist</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14.5, color: C.ink, lineHeight: 1.6, marginBottom: 8, maxWidth: 320, marginInline: "auto" }}>
          Ein paar kurze Fragen — damit deine Coachin dich schon kennt, bevor ihr das erste Mal sprecht.
        </p>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, opacity: 0.8, marginBottom: 28 }}>Dauert unter 1 Minute · 🇪🇺 DSGVO-konform</p>
        <Btn full onClick={() => setStep(1)}>Los geht’s</Btn>
      </div>
    );

  // — Fragenschritte —
  const kannWeiter = (step === 1 && f.fokus) || (step === 2 && f.rhythmus) || step === 3 || step === 4 || step === 5 || step === 6;
  const weiter = () => (step === 6 ? senden() : setStep(step + 1));

  return (
    <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", minHeight: "70vh" }}>
      {/* Kopf: Zurück + Fortschritt */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={() => setStep(step - 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${C.line}`, background: C.card, cursor: "pointer", fontSize: 16, color: C.ink, flexShrink: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, borderRadius: 4, background: C.beige, overflow: "hidden" }}>
            <div style={{ width: `${(step / FB_TOTAL) * 100}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})`, transition: "width .3s ease" }} />
          </div>
        </div>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, fontWeight: 700, color: C.ink, flexShrink: 0 }}>{step}/{FB_TOTAL}</span>
      </div>

      <div style={{ flex: 1, animation: "fadeUp .35s ease" }}>
        {step === 1 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Was möchtest du gerade stärken?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>Wähle deinen wichtigsten Fokus.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {FB_FOKUS.map((x) => {
                const on = f.fokus === x.t;
                return (
                  <button key={x.t} onClick={() => setF({ ...f, fokus: x.t })} style={{ cursor: "pointer", padding: "18px 10px", borderRadius: 16, border: `1.5px solid ${on ? C.rose : C.line}`, background: on ? C.roseSoft : C.card, textAlign: "center" }}>
                    <div style={{ fontSize: 30 }}>{x.e}</div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: on ? C.plum : C.espresso, marginTop: 6 }}>{x.t}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Wie oft möchtest du an dir arbeiten?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>Wähle, was sich realistisch anfühlt.</p>
            {FB_RHYTHMUS.map((r) => (
              <button key={r} onClick={() => setF({ ...f, rhythmus: r })} style={cardSel(f.rhythmus === r)}>{r}</button>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Deine Themen</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>Wähle eins oder mehrere.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {FB_THEMEN.map((t) => {
                const on = f.themen.includes(t);
                return (
                  <button key={t} onClick={() => toggleThema(t)} style={{ padding: "11px 16px", borderRadius: 22, cursor: "pointer", border: `1.5px solid ${on ? C.rose : C.line}`, background: on ? C.roseSoft : C.card, fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 600, color: on ? C.plum : C.ink }}>{t}</button>
                );
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Wie ist deine Energie heute?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 26 }}>Ganz ehrlich — es gibt kein Richtig.</p>
            <div style={{ textAlign: "center", fontFamily: "Georgia, serif", fontSize: 52, color: C.plum, marginBottom: 8 }}>{f.energie}<span style={{ fontSize: 22, color: C.ink }}>/10</span></div>
            <input type="range" min={1} max={10} value={f.energie} onChange={(e) => setF({ ...f, energie: +e.target.value })} style={{ width: "100%", accentColor: C.gold }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 6 }}><span>erschöpft</span><span>voller Kraft</span></div>
          </>
        )}

        {step === 5 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Was möchtest du erreichen?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>In deinen Worten — optional.</p>
            <textarea rows={4} value={f.ziel} onChange={(e) => setF({ ...f, ziel: e.target.value })} placeholder="z. B. „Ich möchte abends besser abschalten können.“"
              style={{ width: "100%", padding: "14px 15px", fontSize: 15, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </>
        )}

        {step === 6 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Passt das so?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>Deine Coachin bekommt diese Übersicht.</p>
            <div style={{ display: "grid", gap: 10 }}>
              {[["Fokus", f.fokus], ["Rhythmus", f.rhythmus], ["Themen", (f.themen || []).join(", ") || "—"], ["Energie", `${f.energie}/10`], ["Ziel", f.ziel || "—"]].map(([k, v]) => (
                <Card key={k} style={{ display: "flex", gap: 12 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold, minWidth: 84 }}>{k}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>{v || "—"}</div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <Btn full ghost={!kannWeiter} onClick={() => kannWeiter && weiter()}>{step === 6 ? "An meine Coachin senden" : "Weiter"}</Btn>
        {step === 6 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "center", marginTop: 12 }}>🇪🇺 DSGVO-konform · nur für dich & deine Coachin sichtbar</p>}
      </div>
    </div>
  );
}

/* ── Coaching-Pakete & Buchung (Anfrage-Flow · keine Zahlung in der App) ── */

const PAKETE = [
  { icon: "🌱", t: "Kennenlern-Gespräch", dauer: "20 Min · kostenlos", preis: "0 €", desc: "Unverbindliches Erstgespräch, um zu spüren, ob es zwischen euch passt.", cta: "Kostenlos anfragen" },
  { icon: "🤍", t: "Einzelsession", dauer: "60 Min · Zoom", preis: "120 €", desc: "Eine fokussierte 1:1 Session für ein konkretes Thema.", cta: "Anfragen" },
  { icon: "💎", t: "Paket „Innere Klarheit“", dauer: "4 Sessions à 60 Min", preis: "480 €", desc: "Begleitung über 8 Wochen inkl. Workbook & Nachrichten-Support.", cta: "Anfragen", best: true },
  { icon: "🌷", t: "Retreat-Tag", dauer: "1 Tag · in Präsenz", preis: "auf Anfrage", desc: "Ein ganzer Tag Ruhe & Wachstum in kleiner Gruppe.", cta: "Interesse melden" },
];

function Pakete({ addPunkte, go }) {
  const [angefragt, setAngefragt] = useState(null);
  const anfragen = (p) => { setAngefragt(p.t); if (addPunkte) addPunkte(5, "Paket angefragt"); };
  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Coaching-Pakete</Eyebrow>
      <H size={24} style={{ marginBottom: 8 }}>Wähle deine Begleitung</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 18 }}>
        Sende eine unverbindliche Anfrage — deine Coachin meldet sich mit den nächsten Schritten. Die Bezahlung läuft sicher außerhalb der App.
      </p>
      {PAKETE.map((p) => (
        <Card key={p.t} style={{ marginBottom: 12, border: p.best ? `1.5px solid ${C.gold}` : `1px solid ${C.line}`, background: p.best ? `linear-gradient(135deg, ${C.card}, ${C.goldPale})` : C.card }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15.5, color: C.espresso }}>{p.t}{p.best && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.plum, background: C.roseSoft, borderRadius: 8, padding: "2px 7px", marginLeft: 8 }}>beliebt</span>}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.plum, whiteSpace: "nowrap" }}>{p.preis}</div>
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{p.dauer}</div>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, margin: "8px 0 12px" }}>{p.desc}</p>
              {angefragt === p.t
                ? <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: C.sage }}>✓ Anfrage gesendet — deine Coachin meldet sich 🤍</div>
                : <Btn small onClick={() => anfragen(p)}>{p.cta}</Btn>}
            </div>
          </div>
        </Card>
      ))}
      <Card style={{ marginTop: 6, display: "flex", gap: 12, alignItems: "center", background: C.beige }}>
        <span style={{ fontSize: 22 }}>📅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Schon Kundin?</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Buche direkt einen freien Termin.</div>
        </div>
        <Btn small ghost onClick={() => go("buchen")}>Termin buchen</Btn>
      </Card>
    </div>
  );
}

const PODCAST = [
  { t: "Sanft in den Tag starten", serie: "Morgenimpuls", dauer: "6 Min", neu: true },
  { t: "Wenn der Kopf nicht abschalten will", serie: "Tiefe Gespräche", dauer: "22 Min" },
  { t: "Grenzen setzen ohne schlechtes Gewissen", serie: "Tiefe Gespräche", dauer: "18 Min" },
  { t: "3-Minuten-Atempause für zwischendurch", serie: "Meditation", dauer: "3 Min" },
  { t: "Deine Fülle-Routine am Abend", serie: "Business", dauer: "14 Min" },
  { t: "Selbstmitgefühl an schweren Tagen", serie: "Tiefe Gespräche", dauer: "16 Min" },
];

function Podcast({ addPunkte }) {
  const [serie, setSerie] = useState("Alle");
  const [playing, setPlaying] = useState(null);
  const SERIEN = ["Alle", "Morgenimpuls", "Tiefe Gespräche", "Meditation", "Business"];
  const liste = serie === "Alle" ? PODCAST : PODCAST.filter((p) => p.serie === serie);
  const neueste = PODCAST.find((p) => p.neu) || PODCAST[0];
  const toggle = (t) => { const on = playing === t; setPlaying(on ? null : t); if (!on && addPunkte) addPunkte(4, "Podcast gehört"); };
  const PlayBtn = ({ t, big }) => (
    <button onClick={() => toggle(t)} style={{ width: big ? 54 : 42, height: big ? 54 : 42, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0, background: playing === t ? C.plum : `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: big ? 22 : 17, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(217,110,139,.35)" }}>{playing === t ? "❚❚" : "▶"}</button>
  );
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Podcast</Eyebrow>
      <H size={25} style={{ marginBottom: 6 }}>Hör deiner Coachin zu</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 18 }}>
        Kurze Impulse & tiefe Gespräche — mit der Stimme von Anja. Neue Folgen jede Woche.
      </p>

      {/* Neueste Folge */}
      <Card style={{ marginBottom: 18, background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 140%)`, border: "none" }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.goldPale, fontWeight: 700 }}>🎧 Neueste Folge</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
          <PlayBtn t={neueste.t} big />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#FFF8F0", lineHeight: 1.3 }}>{neueste.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#FFF3F0", opacity: 0.9, marginTop: 3 }}>{neueste.serie} · {neueste.dauer}</div>
          </div>
        </div>
      </Card>

      {/* Serien-Filter */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {SERIEN.map((s) => (
          <button key={s} onClick={() => setSerie(s)} style={{ padding: "8px 13px", borderRadius: 20, cursor: "pointer", border: `1.5px solid ${serie === s ? C.rose : C.line}`, background: serie === s ? C.roseSoft : "transparent", fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, color: serie === s ? C.plum : C.ink }}>{s}</button>
        ))}
      </div>

      {liste.map((p) => (
        <Card key={p.t} style={{ marginBottom: 10, display: "flex", gap: 13, alignItems: "center" }}>
          <PlayBtn t={p.t} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{p.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{p.serie} · {p.dauer}{p.neu ? " · 🆕" : ""}</div>
          </div>
          {playing === p.t && <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, color: C.plum }}>läuft…</span>}
        </Card>
      ))}

      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.8, textAlign: "center", marginTop: 12 }}>
        Neue Folgen werden von deiner Coachin hochgeladen 🎙️
      </p>
    </div>
  );
}

function CoachingHub({ go }) {
  const items = [
    { icon: "📅", t: "Termin buchen", s: "1:1 Session mit deiner Coachin", tab: "buchen" },
    { icon: "💎", t: "Coaching-Pakete", s: "Pakete ansehen & anfragen", tab: "pakete" },
    { icon: "🏆", t: "Challenges & Ziele", s: "Challenge, Aufgaben & Meilensteine", tab: "aufgaben" },
    { icon: "📊", t: "Mein Fortschritt", s: "Wohlbefindens-Index & Trend", tab: "fortschritt" },
  ];
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Coaching</Eyebrow>
      <H size={25} style={{ marginBottom: 6 }}>Deine Begleitung</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 18 }}>
        Alles rund um deine Coachin — Termine, Pakete, Ziele und dein Fortschritt an einem Ort.
      </p>
      {items.map((x) => (
        <Card key={x.t} onClick={() => go(x.tab)} style={{ marginBottom: 11, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>{x.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: C.espresso }}>{x.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>{x.s}</div>
          </div>
          <div style={{ color: C.gold, fontSize: 20 }}>›</div>
        </Card>
      ))}
    </div>
  );
}

function Mehr({ go }) {
  const gruppen = [
    { g: "Coaching", items: [
      { icon: "🌸", t: "Coaching", s: "Termine, Pakete & Fortschritt", tab: "coaching" },
      { icon: "🏆", t: "Challenges & Ziele", s: "Challenge, Aufgaben & Meilensteine", tab: "aufgaben" },
      { icon: "📊", t: "Mein Fortschritt", s: "Wohlbefindens-Index & Trend", tab: "fortschritt" },
      { icon: "🎓", t: "Kurse", s: "Deine Kurse · Shop", tab: "kurse" },
    ] },
    { g: "Seele & Rituale", items: [
      { icon: "🦋", t: "Archetypen-Test", s: "Welche innere Kraft leitet dich?", tab: "archetyp" },
      { icon: "🕰️", t: "Zukunfts-Ich", s: "Sprich mit dir in 10 Jahren", tab: "zukunftsich" },
      { icon: "🖤", t: "Schattenspiegel", s: "Schreiben & verbrennen — nichts wird gespeichert", tab: "schatten" },
      { icon: "🌙", t: "Traumbibliothek", s: "Deine Traumsymbole & Muster", tab: "traum" },
      { icon: "🌗", t: "Körper & Zyklus", s: "20-Sekunden-Check · dein Zyklus-Spiegel", tab: "zyklus" },
      { icon: "🕯️", t: "Gemeinsame Flamme", s: "Das Licht, das uns allen gehört", tab: "flamme" },
      { icon: "🌕", t: "Mondrituale", s: "Loslassen & manifestieren im Mondrhythmus", tab: "mondrituale" },
      { icon: "🎡", t: "Jahreskreis", s: "Die acht Feste des Jahres", tab: "jahreskreis" },
      { icon: "🃏", t: "Wochen-Orakel", s: "Die Karte deiner Coachin · jede Woche neu", tab: "wochenorakel" },
      { icon: "🕊️", t: "Ritual der Leere", s: "24 Stunden ohne App — bewusst", tab: "leere" },
    ] },
    { g: "Wachsen & Spielen", items: [
      { icon: "🛤️", t: "Transformations-Reisen", s: "21 & 40 Tage zu einem Thema", tab: "reisen" },
      { icon: "🌳", t: "Dein Garten", s: "Was du pflegst, wächst sichtbar", tab: "garten" },
      { icon: "🔮", t: "Intuitions-Training", s: "Trainiere dein Gefühl · Trefferquote", tab: "intuition" },
      { icon: "📖", t: "Jahres-Rückblick", s: "Dein Jahr in Karten & Worten", tab: "rueckblick" },
    ] },
    { g: "Community", items: [
      { icon: "💗", t: "Frauen unterstützen Frauen", s: "Community-Feed · teilen & stärken", tab: "community" },
      { icon: "👯‍♀️", t: "Freundinnen-Kreis", s: "Dein privater Kreis · gemeinsam 21 Tage", tab: "kreis" },
    ] },
    { g: "Inhalte", items: [
      { icon: "🧘‍♀️", t: "Meditation", s: "Atemübung · geführte Meditationen · Report", tab: "meditation" },
      { icon: "🎧", t: "Podcast", s: "Impulse & Gespräche · neue Folgen wöchentlich", tab: "podcast" },
      { icon: "📁", t: "Mediathek", s: "Coach-Materialien · Musikbibliothek · Downloads", tab: "media" },
    ] },
    { g: "Konto", items: [
      { icon: "👤", t: "Profil & Einstellungen", s: "Benachrichtigung, Abo, DSGVO", tab: "profil" },
    ] },
  ];
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Mehr</Eyebrow>
      <H size={25} style={{ marginBottom: 18 }}>Alles an einem Ort</H>
      {gruppen.map((gr) => (
        <div key={gr.g} style={{ marginBottom: 14 }}>
          <Eyebrow color={C.plum}>{gr.g}</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {gr.items.map((x) => (
              <Card key={x.t} onClick={() => go(x.tab)} style={{ marginBottom: 10, display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>{x.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: C.espresso }}>{x.t}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>{x.s}</div>
                </div>
                <div style={{ color: C.gold, fontSize: 20 }}>›</div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Lichtpunkte-Modal: Meilensteine & Belohnungen ── */

const MEILENSTEINE = [120, 300, 500, 1000, 5000];
const BELOHNUNGEN = [
  { p: 300, icon: "🎓", t: "30 % Rabatt auf einen Kurs", s: "Einlösbar auf der Plattform" },
  { p: 500, icon: "🛍️", t: "10 € Shop-Gutschein", s: "Für den smile2go-Shop" },
  { p: 1000, icon: "🌕", t: "Exklusive Vollmond-Meditation", s: "Nur für Sammlerinnen" },
];

function PunkteModal({ punkte, onClose, onEinloesen }) {
  const naechster = MEILENSTEINE.find((m) => m > punkte) || MEILENSTEINE[MEILENSTEINE.length - 1];
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 40, background: "rgba(58,42,34,.45)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(3px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 430, maxHeight: "82vh", overflowY: "auto",
        background: C.cream, borderRadius: "24px 24px 0 0", padding: "22px 20px 30px",
        animation: "fadeUp .35s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <H size={21}>✨ Deine Lichtpunkte</H>
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: "50%", width: 38, height: 38, fontSize: 16, cursor: "pointer", color: C.ink }}>✕</button>
        </div>

        <Card style={{ textAlign: "center", marginBottom: 16, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`, border: "none" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 44, color: C.plum }}>{punkte}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, fontWeight: 600 }}>
            Noch {Math.max(0, naechster - punkte)} bis zum nächsten Meilenstein ({naechster})
          </div>
        </Card>

        <Eyebrow color={C.plum}>Meilensteine</Eyebrow>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, marginTop: 6 }}>
          {MEILENSTEINE.map((m) => {
            const erreicht = punkte >= m;
            return (
              <div key={m} style={{ flex: 1, textAlign: "center", padding: "10px 2px", borderRadius: 12, background: erreicht ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.card, border: erreicht ? "none" : `1.5px solid ${C.line}` }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: erreicht ? "#fff" : C.ink }}>{m >= 1000 ? `${m / 1000}k` : m}</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>{erreicht ? "✓" : "○"}</div>
              </div>
            );
          })}
        </div>

        <Eyebrow color={C.plum}>🎁 Punkte einlösen</Eyebrow>
        <div style={{ marginTop: 6, marginBottom: 16 }}>
          {BELOHNUNGEN.map((b) => {
            const kann = punkte >= b.p;
            return (
              <Card key={b.t} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", opacity: kann ? 1 : 0.55 }}>
                <span style={{ fontSize: 24 }}>{b.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{b.t}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>{b.s} · {b.p} Punkte</div>
                </div>
                <Btn small ghost={!kann} onClick={() => kann && onEinloesen(b.p, b.t)}>{kann ? "Einlösen" : `${b.p} P`}</Btn>
              </Card>
            );
          })}
        </div>

        <Eyebrow color={C.ink}>So sammelst du täglich</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.8, marginTop: 6 }}>
          🔮 Tageskarte +5 · 📔 Tagebuch +10 · 🏆 Challenge-Tag +20<br />
          🧭 Energie-Check +3 · ⭐ Horoskop +3 · 🃏 Aufgaben-Karte +5<br />
          🔮 Ritual +2 · 💌 Zukunftsbrief +10 · 💰 Fülle +5 · 🎴 Mystik +4
        </p>
      </div>
    </div>
  );
}

/* ═══════════════ NEUE SEELEN-FEATURES ═══════════════ */

/* ── Schattenspiegel — das Tagebuch, das sich selbst vernichtet ── */
function Schattenspiegel({ addPunkte }) {
  const [text, setText] = useState("");
  const [burning, setBurning] = useState(false);
  const [done, setDone] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const videoRef = useRef(null);
  const BURN_MS = 4800; // an die Länge des Feuer-Videos angepasst
  const verbrennen = () => {
    if (!text.trim() || burning) return;
    setBurning(true);
    setTimeout(() => {
      setText("");
      setBurning(false);
      setDone(true);
      addPunkte(2, "Losgelassen");
      setTimeout(() => setDone(false), 3400);
    }, BURN_MS);
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (videoRef.current) videoRef.current.muted = !next;
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <style>{`
        @keyframes burnAway { 0% { opacity: 1; filter: none; } 35% { opacity: .85; filter: blur(1px) sepia(.6); } 100% { opacity: 0; filter: blur(6px) sepia(1); transform: translateY(-26px) scale(.96); } }
        @keyframes ashRise { 0% { opacity: 0; transform: translateY(12px); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateY(-80px) rotate(24deg); } }
      `}</style>
      <Eyebrow color={C.plum}>Schattenspiegel</Eyebrow>
      <H size={25}>Schreib es. Lass es gehen.</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Hier darfst du alles aussprechen, was du nie jemandem zeigen würdest — Wut, Angst, dunkle Gedanken.
        Danach wird dein Text zeremoniell verbrannt.
      </p>
      <Card style={{ background: "#2E2320", border: "1px solid #4A3A30", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#C9A98C", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
            🖤 Nichts wird gespeichert · keine KI liest mit · kein Backup
          </div>
          <button
            onClick={toggleSound}
            title={soundOn ? "Ton aus" : "Ton an"}
            style={{
              flexShrink: 0, marginLeft: 10, width: 30, height: 30, borderRadius: 9, border: "1px solid #4A3A30",
              background: "rgba(255,255,255,.06)", color: "#F0E4D6", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
        </div>
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
          {burning && (
            <video
              ref={videoRef}
              src={FEUER_VIDEO}
              muted={!soundOn}
              playsInline
              autoPlay
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", mixBlendMode: "screen", pointerEvents: "none",
              }}
            />
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Was ist gerade am schwersten in dir? Schreib es hierher …"
            rows={8}
            disabled={burning}
            style={{
              width: "100%", boxSizing: "border-box", background: "transparent", border: "none", outline: "none",
              color: "#F0E4D6", fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1.7, resize: "vertical",
              animation: burning ? "burnAway 2.4s ease forwards" : "none", position: "relative",
            }}
          />
          {burning && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
              {["✨", "🌫️", "✨"].map((e, i) => (
                <span key={i} style={{ fontSize: 20, animation: `ashRise ${1.4 + i * 0.25}s ease-out ${i * 0.15}s forwards`, opacity: 0 }}>{e}</span>
              ))}
            </div>
          )}
        </div>
      </Card>
      <div style={{ marginTop: 14 }}>
        <Btn full onClick={verbrennen} disabled={burning || !text.trim()}>
          {burning ? "Es verbrennt …" : "🔥 Verbrennen & loslassen"}
        </Btn>
      </div>
      {done && (
        <Card style={{ marginTop: 14, textAlign: "center", background: C.goldPale }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso }}>Es ist gegangen. 🕊️</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 4 }}>Atme einmal tief. Dieser Raum gehört wieder dir.</div>
        </Card>
      )}
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.7, marginTop: 16, lineHeight: 1.6 }}>
        Technisches Versprechen: Dein Text existiert nur in diesem Moment auf deinem Gerät. Er wird nicht gespeichert,
        nicht gesendet und nicht analysiert.
      </p>
    </div>
  );
}

/* ── Zukunfts-Ich — Dialog mit dir in 10 Jahren (echte KI via askLuma) ── */
function ZukunftsIch({ name, entries, ziele, archetyp, msgs, setMsgs }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  const senden = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next); setInput(""); setBusy(true);
    const journal = (entries || []).slice(0, 5).map((e) => `- ${[e.intention, ...(e.items || [])].filter(Boolean).join(" · ")}`.slice(0, 200)).join("\n");
    const zieleTxt = (ziele || []).map((z) => z.titel).join(", ");
    const system = `Du bist das Zukunfts-Ich von ${name || "der Nutzerin"} — sie selbst, 10 Jahre weiter, warm, weise, angekommen. Du sprichst Deutsch in der Du-Form ("wir", "du damals"), liebevoll und konkret, 2-6 Sätze. Du erinnerst dich an ihr heutiges Leben:
${journal ? `Ihre letzten Journal-Gedanken:\n${journal}` : "Sie hat noch nichts ins Journal geschrieben."}
${zieleTxt ? `Ihre Ziele heute: ${zieleTxt}.` : ""}
${archetyp ? `Ihr Archetyp: ${archetyp.name}.` : ""}
Regeln: Erfinde keine konkreten Fakten über ihr Leben, die oben nicht stehen. Sprich über Gefühle, Haltung und Möglichkeiten statt über erfundene Ereignisse. Keine Diagnosen; bei ernsten Krisen empfiehl liebevoll professionelle Hilfe.`;
    try {
      const reply = await askLuma(next, system);
      setMsgs([...next, { role: "assistant", content: reply || "Ich bin hier — bei dir, aus der Zukunft. 🤍" }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Gerade reißt die Verbindung durch die Zeit ab — versuch es gleich noch einmal. 🤍" }]);
    }
    setBusy(false);
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Zukunfts-Ich</Eyebrow>
      <H size={25}>Sprich mit dir in 10 Jahren</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Dein Zukunfts-Ich kennt deine Journal-Gedanken und Ziele — und antwortet dir mit der Ruhe von jemandem, der weiß, wie es weitergeht.
      </p>
      {msgs.length === 0 && (
        <Card style={{ marginBottom: 12, background: C.goldPale }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15.5, color: C.espresso, lineHeight: 1.6 }}>
            „Hallo du. Ich bin du — nur ein Stück weiter auf dem Weg. Frag mich, was du wissen willst.“
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 8 }}>
            Zum Beispiel: „Hat sich der Mut gelohnt?“ · „Was soll ich heute nicht mehr mit mir herumtragen?“
          </div>
        </Card>
      )}
      {msgs.map((m, i) => (
        <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
          <div style={{
            maxWidth: "82%", padding: "12px 15px", borderRadius: 18,
            borderBottomRightRadius: m.role === "user" ? 6 : 18,
            borderBottomLeftRadius: m.role === "user" ? 18 : 6,
            background: m.role === "user" ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.card,
            border: m.role === "user" ? "none" : `1px solid ${C.line}`,
            color: m.role === "user" ? "#fff" : C.espresso,
            fontFamily: "system-ui, sans-serif", fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap",
          }}>{m.role === "assistant" ? "🕰️ " : ""}{m.content}</div>
        </div>
      ))}
      {busy && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 10 }}>🕰️ Dein Zukunfts-Ich denkt zurück …</div>}
      <div ref={endRef} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && senden()}
          placeholder="Frag dein Zukunfts-Ich …"
          style={{ flex: 1, padding: "13px 15px", borderRadius: 14, border: `1.5px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14.5, outline: "none", background: C.card, color: C.espresso }}
        />
        <Mikro size={44} onText={(t) => setInput((prev) => (prev ? prev + " " : "") + t)} />
        <Btn onClick={senden} disabled={busy || !input.trim()}>➤</Btn>
      </div>
    </div>
  );
}

/* ── S.O.S. — Ich brauche jetzt Halt (Overlay) ── */
const SOS_WEGE = [
  { k: "panik", icon: "🫀", t: "Panik & Herzrasen", s: "Mein Körper dreht durch" },
  { k: "traurig", icon: "🌧️", t: "Tiefe Traurigkeit", s: "Ich komme nicht raus" },
  { k: "wut", icon: "⚡", t: "Wut & Druck", s: "Es platzt gleich aus mir" },
  { k: "einsam", icon: "🕯️", t: "Einsamkeit", s: "Niemand ist da" },
  { k: "ueberfordert", icon: "🌀", t: "Überforderung", s: "Alles zu viel auf einmal" },
  { k: "dunkel", icon: "🖤", t: "Ganz dunkle Gedanken", s: "Ich brauche echte Hilfe" },
];
const SOS_ERDUNG = {
  panik: { name: "5-4-3-2-1 Erdung", schritte: ["Nenne 5 Dinge, die du siehst.", "Nenne 4 Dinge, die du hören kannst.", "Berühre 3 Dinge — spür ihre Oberfläche.", "Nenne 2 Dinge, die du riechst.", "Nenne 1 Ding, das du schmeckst."], hinweis: "Panik ist eine Welle. Sie steigt, sie bricht, sie geht wieder. Immer." },
  traurig: { name: "Sanfte Wärme", schritte: ["Leg eine Hand auf dein Herz, eine auf deinen Bauch.", "Spür die Wärme deiner eigenen Hände.", "Sag leise: „Das ist gerade schwer. Und ich bin da.“", "Atme dreimal langsam in die Hand auf dem Bauch.", "Trink einen Schluck Wasser — ganz bewusst."], hinweis: "Traurigkeit will nicht weggemacht werden. Sie will begleitet werden." },
  wut: { name: "Druck ablassen", schritte: ["Balle beide Fäuste fest — 5 Sekunden.", "Und loslassen. Spür das Prickeln.", "Noch einmal: fest anspannen … loslassen.", "Atme durch den Mund kräftig aus, wie ein Seufzer.", "Sag innerlich: „Meine Wut hat einen guten Grund.“"], hinweis: "Wut zeigt dir, wo eine Grenze überschritten wurde. Sie ist eine Botschaft, kein Fehler." },
  einsam: { name: "Verbindung spüren", schritte: ["Umarme dich selbst — Arme über Kreuz, Hände an die Schultern.", "Wiege dich ganz leicht hin und her.", "Denk an einen Menschen, der dich einmal gesehen hat.", "Atme, als würdest du ihm gegenübersitzen.", "Erinnere dich: Gerade jetzt sitzt irgendwo eine andere Frau genauso da wie du."], hinweis: "Einsamkeit lügt. Sie sagt „für immer“ — dabei meint sie „gerade jetzt“." },
  ueberfordert: { name: "Eins nach dem anderen", schritte: ["Schließ kurz die Augen. Alles darf warten.", "Atme 4 Sekunden ein, 6 Sekunden aus.", "Frag dich: Was ist in den nächsten 10 Minuten wirklich nötig?", "Nur das. Alles andere existiert gerade nicht.", "Sag: „Ich muss nicht alles. Ich muss nur das Nächste.“"], hinweis: "Du bist nicht überfordert, weil du zu schwach bist — sondern weil es zu viel ist." },
  dunkel: { name: "Jetzt nicht allein", schritte: ["Bleib genau da, wo du bist. Du musst nichts entscheiden.", "Atme mit mir — ein … und langsam aus.", "Ruf jemanden an, der jetzt für dich da sein kann.", "Wenn niemand da ist: Die TelefonSeelsorge ist immer erreichbar.", "Diese Nacht musst du nicht allein durchstehen."], hinweis: "Du bist wichtig. Was du gerade fühlst, ist echt — und es ist nicht das Ende der Geschichte." },
};
function SOSOverlay({ onClose, entries, setEntries, addPunkte, archetyp }) {
  const [phase, setPhase] = useState("wahl");
  const [weg, setWeg] = useState(null);
  const [atemZyklus, setAtemZyklus] = useState(0);
  const [atemPhase, setAtemPhase] = useState("ein");
  const [schritt, setSchritt] = useState(0);
  const [text, setText] = useState("");
  // 4-7-8 Atmung: 6 Zyklen
  useEffect(() => {
    if (phase !== "atmen") return;
    const seq = [["ein", 4000], ["halten", 7000], ["aus", 8000]];
    let i = 0, z = 0, timer;
    const lauf = () => {
      const [p, ms] = seq[i];
      setAtemPhase(p);
      timer = setTimeout(() => {
        i++;
        if (i >= seq.length) { i = 0; z++; setAtemZyklus(z); if (z >= 6) { setPhase("erdung"); return; } }
        lauf();
      }, ms);
    };
    lauf();
    return () => clearTimeout(timer);
  }, [phase]);
  const speichern = () => {
    if (text.trim() && setEntries) {
      setEntries([{ date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }), intention: `🤍 S.O.S. · ${SOS_WEGE.find((w) => w.k === weg)?.t || "Halt gesucht"}`, items: [text.trim()] }, ...(entries || [])]);
      if (addPunkte) addPunkte(8, "Du hast dich gehalten");
    }
    onClose();
  };
  const erdung = weg ? SOS_ERDUNG[weg] : null;
  const dunkel = weg === "dunkel";
  const Hilfe = ({ voll }) => (
    <div style={{ marginTop: 14, padding: "12px 14px", background: voll ? C.roseSoft : C.beige, borderRadius: 12, fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.espresso, lineHeight: 1.7 }}>
      <b>Wenn es zu viel wird — kostenlos & rund um die Uhr:</b><br />
      📞 TelefonSeelsorge <b>0800 111 0 111</b> oder <b>0800 111 0 222</b><br />
      {voll && <>💬 Chat & Mail: telefonseelsorge.de<br />🚑 Bei akuter Gefahr: <b>112</b></>}
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(46,35,32,.9)", backdropFilter: "blur(6px)" }} onClick={phase === "atmen" ? undefined : onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 430, maxHeight: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "26px 20px", boxSizing: "border-box" }}>

        {phase === "wahl" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#F5E9DB" }}>Ich bin bei dir.</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#D8C4AE", marginTop: 6, lineHeight: 1.6 }}>
                Was ist gerade los? Ich such den passenden Weg für dich.
              </div>
            </div>
            {SOS_WEGE.map((w) => (
              <button key={w.k} onClick={() => { setWeg(w.k); setPhase(w.k === "dunkel" ? "erdung" : "atmen"); }} style={{
                display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", marginBottom: 9,
                padding: "14px 16px", borderRadius: 16, cursor: "pointer",
                border: w.k === "dunkel" ? `2px solid ${C.rose}` : "1.5px solid #5A473C",
                background: w.k === "dunkel" ? "rgba(217,110,139,.16)" : "rgba(251,246,238,.07)",
              }}>
                <span style={{ fontSize: 25 }}>{w.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: "#F5E9DB" }}>{w.t}</span>
                  <span style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: "#C0AC98", marginTop: 2 }}>{w.s}</span>
                </span>
                <span style={{ color: "#C0AC98", fontSize: 19 }}>›</span>
              </button>
            ))}
            <button onClick={onClose} style={{ display: "block", width: "100%", marginTop: 12, background: "none", border: "1.5px solid #5A473C", borderRadius: 14, color: "#C0AC98", padding: "12px 0", fontFamily: "system-ui, sans-serif", fontSize: 13.5, cursor: "pointer" }}>
              Doch nicht — schließen
            </button>
          </div>
        )}

        {phase === "atmen" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 21, color: "#F5E9DB", marginBottom: 6 }}>Atme mit mir</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#C0AC98", marginBottom: 26 }}>4 Sekunden ein · 7 halten · 8 aus</div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, marginBottom: 22 }}>
              <div style={{
                width: 190, height: 190, borderRadius: "50%",
                background: `radial-gradient(circle, ${C.rose} 0%, ${C.gold} 100%)`, opacity: 0.9,
                transform: atemPhase === "ein" ? "scale(1)" : atemPhase === "halten" ? "scale(1)" : "scale(0.5)",
                transition: atemPhase === "ein" ? "transform 4s ease-in-out" : atemPhase === "aus" ? "transform 8s ease-in-out" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>
                  {atemPhase === "ein" ? "einatmen" : atemPhase === "halten" ? "halten" : "ausatmen"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < atemZyklus ? C.gold : "#5A473C" }} />
              ))}
            </div>
            <button onClick={() => setPhase("erdung")} style={{ background: "none", border: "1.5px solid #D8C4AE", borderRadius: 14, color: "#D8C4AE", padding: "11px 22px", fontFamily: "system-ui, sans-serif", fontSize: 13.5, cursor: "pointer" }}>
              Weiter →
            </button>
          </div>
        )}

        {phase === "erdung" && erdung && (
          <Card style={{ background: C.cream }}>
            <Eyebrow color={C.plum}>{erdung.name}</Eyebrow>
            <div style={{ display: "flex", gap: 5, margin: "10px 0 16px" }}>
              {erdung.schritte.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 3, background: i <= schritt ? C.gold : C.line }} />
              ))}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, lineHeight: 1.55, minHeight: 84 }}>
              {erdung.schritte[schritt]}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {schritt > 0 && <Btn ghost small onClick={() => setSchritt(schritt - 1)}>←</Btn>}
              {schritt < erdung.schritte.length - 1 ? (
                <Btn full onClick={() => setSchritt(schritt + 1)}>Weiter</Btn>
              ) : (
                <Btn full onClick={() => setPhase("halt")}>Ich bin durch</Btn>
              )}
            </div>
            {dunkel && <Hilfe voll />}
          </Card>
        )}

        {phase === "halt" && (
          <Card style={{ background: C.cream }}>
            <Eyebrow color={C.plum}>Deine Coachin</Eyebrow>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18.5, color: C.espresso, lineHeight: 1.6, marginBottom: 12 }}>
              „{erdung?.hinweis || "Was du gerade fühlst, darf da sein. Du musst es nicht sofort lösen — du musst es nur nicht allein tragen."}“
            </div>
            {archetyp && (
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.7, marginBottom: 14, padding: "10px 12px", background: C.goldPale, borderRadius: 12 }}>
                {ARCHETYPEN[archetyp.key]?.icon} Auch {ARCHETYPEN[archetyp.key]?.name} darf schwach sein. Deine Kraft verschwindet nicht, nur weil du sie gerade nicht spürst.
              </div>
            )}
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, marginBottom: 16 }}>
              Magst du aufschreiben, was gerade am lautesten in dir ist? Du entscheidest, ob es bleibt oder geht.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn full onClick={() => setPhase("schreiben")}>Aufschreiben</Btn>
              <Btn full ghost onClick={onClose}>Mir geht's besser</Btn>
            </div>
            <Hilfe voll={dunkel} />
          </Card>
        )}

        {phase === "schreiben" && (
          <Card style={{ background: C.cream }}>
            <Eyebrow color={C.plum}>Was ist gerade am lautesten in dir?</Eyebrow>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Es darf unsortiert sein …"
              style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.card, color: C.espresso }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn full onClick={speichern} disabled={!text.trim()}>Ins Journal legen</Btn>
              <Btn full ghost onClick={onClose}>Verwerfen</Btn>
            </div>
            <Hilfe voll={dunkel} />
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── Der 36-Fragen-Archetypen-Test — 12 Archetypen, je 3 Aussagen, Likert-Skala 1–5 ── */
const ARCHETYPEN = {
  herrscherin: { name: "Die Herrscherin", icon: "👑", farbe: "#8A6D3B", satz: "Ich übernehme Verantwortung und schaffe Ordnung.", text: "Du fühlst dich wohl, wenn du die Fäden in der Hand hältst. Deine Kraft ist Struktur und Führung. Dein Wachstum: Kontrolle auch mal loslassen können, ohne dass alles zusammenbricht." },
  schoepferin: { name: "Die Schöpferin", icon: "🎨", farbe: "#C9963C", satz: "Ich bringe Neues in die Welt.", text: "Ideen fliegen dir zu, und du machst daraus etwas Echtes. Deine Kraft ist Ausdruck. Dein Wachstum: fertig machen statt nur anfangen — und dein Werk zeigen." },
  fuersorgliche: { name: "Die Fürsorgliche", icon: "🌿", farbe: "#6E8B6A", satz: "Ich halte Raum — auch für mich.", text: "Bei dir finden andere Halt und Wärme. Deine Kraft ist Fürsorge. Dein Wachstum: dich selbst genauso liebevoll zu halten wie alle anderen." },
  bodenstaendige: { name: "Die Bodenständige", icon: "🏡", farbe: "#9C8465", satz: "Ich gehöre dazu, ohne mich zu verstellen.", text: "Du bist echt, fair und nahbar — das gibt anderen Halt. Deine Kraft ist Verlässlichkeit. Dein Wachstum: dir erlauben, auch mal aufzufallen." },
  liebende: { name: "Die Liebende", icon: "🌹", farbe: "#D96E8B", satz: "Ich öffne mein Herz — zuerst für mich.", text: "Du fühlst tief und verbindest Menschen. Deine Kraft ist Empathie. Dein Wachstum: Grenzen setzen, ohne dich schuldig zu fühlen." },
  frohnatur: { name: "Die Frohnatur", icon: "🎭", farbe: "#E0A23C", satz: "Ich nehme das Leben leicht.", text: "Du bringst Humor in ernste Momente und lebst im Hier und Jetzt. Deine Kraft ist Leichtigkeit. Dein Wachstum: auch schwere Gefühle dalassen, statt sie wegzulachen." },
  heldin: { name: "Die Heldin", icon: "🔥", farbe: "#B0503C", satz: "Ich kämpfe für das, was mir wichtig ist.", text: "Du gehst voran, auch wenn es unbequem wird. Deine Kraft ist Mut. Dein Wachstum: nicht jeden Kampf allein austragen zu müssen." },
  rebellin: { name: "Die Rebellin", icon: "⚡", farbe: "#A6483C", satz: "Ich stelle infrage, was längst überholt ist.", text: "Regeln sind für dich Diskussionsgrundlage, nicht Gesetz. Deine Kraft ist Veränderung. Dein Wachstum: Provokation gezielt einsetzen statt aus Reflex." },
  magierin: { name: "Die Magierin", icon: "✨", farbe: "#6A5399", satz: "Ich verwandle, was ist, in das, was sein könnte.", text: "Du spürst die unsichtbaren Zusammenhänge hinter den Dingen. Deine Kraft ist Transformation. Dein Wachstum: Bodenhaftung behalten bei aller Vision." },
  unschuldige: { name: "Die Unschuldige", icon: "🕊️", farbe: "#D9C79E", satz: "Ich glaube an das Gute — das ist meine Kraft, kein Makel.", text: "Dein Optimismus trägt dich und andere durch schwierige Zeiten. Deine Kraft ist Vertrauen. Dein Wachstum: Enttäuschungen aushalten, ohne den Glauben zu verlieren." },
  entdeckerin: { name: "Die Entdeckerin", icon: "🧭", farbe: "#8E4A63", satz: "Ich folge meiner Neugier, wohin sie auch führt.", text: "Enge macht dich unruhig, Weite macht dich lebendig. Deine Kraft ist Unabhängigkeit. Dein Wachstum: Bindung als Abenteuer begreifen, nicht als Käfig." },
  weise: { name: "Die Weise", icon: "🦉", farbe: "#5C7A99", satz: "Ich vertraue dem, was ich erkenne.", text: "Du suchst Tiefe statt Lärm und siehst Zusammenhänge, wo andere nur Chaos sehen. Deine Kraft ist Klarheit. Dein Wachstum: dem Herzen so viel Stimme geben wie dem Kopf." },
};
const ARCHETYP_BLOCKS = ["Sicherheit & Stabilität", "Zugehörigkeit & Verbindung", "Veränderung & Risiko", "Unabhängigkeit & Erkenntnis"];
const ARCHETYP_FRAGEN = [
  // Block 1: Sicherheit & Stabilität
  { f: "Ich übernehme in Gruppen gerne die Verantwortung und organisiere das Geschehen.", key: "herrscherin" },
  { f: "Es ist mir wichtig, Ordnung, Struktur und klare Regeln um mich herum zu schaffen.", key: "herrscherin" },
  { f: "Ich fühle mich am wohlsten, wenn ich die Kontrolle über meine Lebensumstände habe.", key: "herrscherin" },
  { f: "Ich habe ein starkes Bedürfnis, Dinge, Projekte oder Kunstwerke von bleibendem Wert zu erschaffen.", key: "schoepferin" },
  { f: "Ich verliere mich oft in meiner Fantasie und stelle mir neue, kreative Welten vor.", key: "schoepferin" },
  { f: "Für mich ist Innovation und das Erschaffen von Neuem wichtiger als das Bewahren von Altem.", key: "schoepferin" },
  { f: "Es erfüllt mich zutiefst, anderen Menschen zu helfen und sie zu unterstützen.", key: "fuersorgliche" },
  { f: "Ich stelle die Bedürfnisse von Freunden oder der Familie oft über meine eigenen Bedürfnisse.", key: "fuersorgliche" },
  { f: "Ich möchte für andere ein sicherer Hafen sein und sie vor Gefahren beschützen.", key: "fuersorgliche" },
  // Block 2: Zugehörigkeit & Verbindung
  { f: "Ich bin bodenständig und passe mich gerne an die Gemeinschaft an, ohne aufzufallen.", key: "bodenstaendige" },
  { f: "Mir ist es wichtig, dass alle Menschen gleich und fair auf Augenhöhe behandelt werden.", key: "bodenstaendige" },
  { f: "Ich mag keine künstliche Statussymbole; ich schätze das einfache, ehrliche Leben.", key: "bodenstaendige" },
  { f: "Tiefe emotionale Bindungen und Leidenschaft sind das Wichtigste in meinem Leben.", key: "liebende" },
  { f: "Ich umgebe mich gerne mit schönen Dingen, Harmonie und einer liebevollen Atmosphäre.", key: "liebende" },
  { f: "Ich habe große Angst davor, von den Menschen, die ich liebe, abgelehnt zu werden.", key: "liebende" },
  { f: "Ich versuche immer, Humor und Leichtigkeit in ernste Situationen zu bringen.", key: "frohnatur" },
  { f: "Das Leben ist für mich ein Spiel, das man im Hier und Jetzt genießen sollte.", key: "frohnatur" },
  { f: "Ich breche gerne das Eis mit Witzen und nehme das Leben selten zu ernst.", key: "frohnatur" },
  // Block 3: Veränderung & Risiko
  { f: "Wenn ich mir ein Ziel gesetzt habe, kämpfe ich mit maximalem Einsatz dafür.", key: "heldin" },
  { f: "Ich stelle mich Herausforderungen und Konkurrenzkämpfen, um meine Stärke zu beweisen.", key: "heldin" },
  { f: "Ich kann Ungerechtigkeit nicht ertragen und verteidige Schwächere mit Mut.", key: "heldin" },
  { f: "Regeln sind für mich da, um hinterfragt, verändert oder gebrochen zu werden.", key: "rebellin" },
  { f: "Ich fühle mich oft als Außenseiterin, die gegen den Strom der Masse schwimmt.", key: "rebellin" },
  { f: "Ich liebe die Provokation, um verkrustete Strukturen in der Gesellschaft aufzubrechen.", key: "rebellin" },
  { f: "Ich glaube fest daran, dass Gedanken die Realität verändern und Wunder möglich sind.", key: "magierin" },
  { f: "Ich suche nach den tieferen, unsichtbaren Gesetzen des Universums und der Natur.", key: "magierin" },
  { f: "Menschen sagen über mich, dass ich eine transformierende oder magische Ausstrahlung habe.", key: "magierin" },
  // Block 4: Unabhängigkeit & Erkenntnis
  { f: "Ich glaube fest an das Gute im Menschen und behalte immer meinen Optimismus.", key: "unschuldige" },
  { f: "Ich sehne mich nach einem einfachen, reinen und perfekt harmonischen Leben.", key: "unschuldige" },
  { f: "Ich versuche stets, alles richtig zu machen und moralisch fehlerfrei zu handeln.", key: "unschuldige" },
  { f: "Freiheit und Unabhängigkeit sind mir wichtiger als finanzielle oder soziale Sicherheit.", key: "entdeckerin" },
  { f: "Ich liebe es, neue Orte, Kulturen und Ideen ganz auf eigene Faust zu entdecken.", key: "entdeckerin" },
  { f: "Ich langweile mich schnell, wenn mein Leben in eine alltägliche Routine verfällt.", key: "entdeckerin" },
  { f: "Ich suche ununterbrochen nach Wissen, Wahrheit und den logischen Zusammenhängen der Welt.", key: "weise" },
  { f: "Bevor ich eine Entscheidung treffe, analysiere ich alle Fakten sehr gründlich.", key: "weise" },
  { f: "Es treibt mich an, die Welt durch den Verstand und durch Weisheit zu begreifen.", key: "weise" },
];
const LIKERT = [["1", "trifft nicht zu"], ["2", ""], ["3", "teils/teils"], ["4", ""], ["5", "trifft völlig zu"]];
function ArchetypTest({ archetyp, setArchetyp, addPunkte }) {
  const [schritt, setSchritt] = useState(archetyp ? -1 : 0);
  const [punkteMap, setPunkteMap] = useState({});
  const antworte = (wert) => {
    const key = ARCHETYP_FRAGEN[schritt].key;
    const neu = { ...punkteMap, [key]: (punkteMap[key] || 0) + wert };
    setPunkteMap(neu);
    if (schritt + 1 < ARCHETYP_FRAGEN.length) { setSchritt(schritt + 1); return; }
    const best = Object.entries(neu).sort((a, b) => b[1] - a[1])[0][0];
    setArchetyp({ key: best, name: ARCHETYPEN[best].name, datum: new Date().toLocaleDateString("de-DE") });
    setSchritt(-1);
    addPunkte(15, "Archetyp entdeckt");
  };
  const neustart = () => { setPunkteMap({}); setSchritt(0); };
  if (schritt === -1 && archetyp) {
    const a = ARCHETYPEN[archetyp.key] || ARCHETYPEN.weise;
    return (
      <div style={{ padding: "26px 20px" }}>
        <Eyebrow color={C.plum}>Dein Archetyp</Eyebrow>
        <Card style={{ textAlign: "center", border: `2px solid ${a.farbe}`, background: C.card }}>
          <div style={{ fontSize: 54, marginBottom: 6 }}>{a.icon}</div>
          <H size={26} style={{ color: a.farbe }}>{a.name}</H>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 16, color: C.espresso, margin: "12px 0" }}>„{a.satz}“</div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.7 }}>{a.text}</p>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.7, marginTop: 10 }}>Entdeckt am {archetyp.datum}</div>
        </Card>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.7, margin: "14px 0" }}>
          Dein Archetyp begleitet dich ab jetzt: Dein Zukunfts-Ich kennt ihn, und deine Reflexionen dürfen in seiner Sprache zu dir sprechen.
        </p>
        <Btn full ghost onClick={neustart}>Test neu machen</Btn>
      </div>
    );
  }
  const frage = ARCHETYP_FRAGEN[schritt];
  const blockIdx = Math.floor(schritt / 9);
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Der 36-Fragen-Archetypen-Test</Eyebrow>
      <H size={25}>Welche innere Kraft leitet dich?</H>
      <div style={{ height: 5, borderRadius: 3, background: C.line, margin: "14px 0 6px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((schritt + 1) / ARCHETYP_FRAGEN.length) * 100}%`, background: C.gold, borderRadius: 3, transition: "width .2s" }} />
      </div>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.75, marginBottom: 18 }}>
        Frage {schritt + 1}/{ARCHETYP_FRAGEN.length} · Block {blockIdx + 1}: {ARCHETYP_BLOCKS[blockIdx]}
      </div>
      <Card>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, marginBottom: 18, lineHeight: 1.5 }}>
          {frage.f}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          {LIKERT.map(([num]) => (
            <button key={num} onClick={() => antworte(Number(num))} style={{
              flex: 1, padding: "12px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.cream, cursor: "pointer",
              fontFamily: "system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: C.espresso,
            }}>{num}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>trifft nicht zu</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>trifft völlig zu</span>
        </div>
      </Card>
    </div>
  );
}

/* ── Gemeinsame Flamme — kollektives Streak-Ritual (Community-Vorschau) ── */
function Flamme({ flamme, setFlamme, addPunkte }) {
  const heute = new Date().toDateString();
  const beigetragen = flamme?.letzterTag === heute;
  const tage = flamme?.tage || 0;
  // Ehrliche Demo: Die Community-Zahl ist eine Vorschau, solange der Server-Teil nicht live ist.
  const demoAndere = 11 + (new Date().getDate() % 7);
  const beitragen = () => {
    if (beigetragen) return;
    setFlamme({ letzterTag: heute, tage: tage + 1 });
    addPunkte(3, "Dein Licht brennt mit");
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <style>{`@keyframes flicker { 0%,100% { transform: scale(1) rotate(-1deg); opacity: 1; } 30% { transform: scale(1.08) rotate(1.5deg); opacity: .92; } 60% { transform: scale(.96) rotate(-.5deg); opacity: .97; } }`}</style>
      <Eyebrow color={C.plum}>Gemeinsame Flamme</Eyebrow>
      <H size={25}>Ein Licht, das uns allen gehört</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 18px" }}>
        Die Flamme brennt, solange jeden Tag genug von uns ihr Ritual vollenden. Dein Beitrag zählt — für alle.
      </p>
      <Card style={{ textAlign: "center", background: "#2E2320", border: "1px solid #4A3A30" }}>
        <div style={{ fontSize: 74, animation: "flicker 2.2s ease-in-out infinite", display: "inline-block", filter: "drop-shadow(0 0 18px rgba(230,190,108,.65))" }}>🕯️</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#F0E4D6", marginTop: 10 }}>Die Flamme brennt</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#C9A98C", marginTop: 6 }}>
          Heute haben {demoAndere + (beigetragen ? 1 : 0)} Frauen ihr Licht dazugegeben{beigetragen ? " — du bist dabei. 🤍" : "."}
        </div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#9C8470", marginTop: 8 }}>Community-Vorschau — die Live-Zählung startet mit dem Server-Update.</div>
      </Card>
      <div style={{ marginTop: 14 }}>
        <Btn full onClick={beitragen} disabled={beigetragen}>
          {beigetragen ? "Dein Licht brennt heute schon 🤍" : "🕯️ Mein Licht dazugeben"}
        </Btn>
      </div>
      <Card style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Deine Beiträge zur Flamme</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.espresso }}>{tage} Tage</div>
        </div>
        <div style={{ fontSize: 30 }}>{tage >= 21 ? "🌟" : tage >= 7 ? "✨" : "🕯️"}</div>
      </Card>
    </div>
  );
}

/* ── Traumbibliothek — deine Traumsymbole & Muster ── */
const TRAUM_SYMBOLE = [
  { key: "wasser", w: ["wasser", "meer", "ozean", "fluss", "see", "regen", "welle"], icon: "🌊", deut: "Gefühle & das Unbewusste — wie bewegt ist dein Innenleben gerade?" },
  { key: "fliegen", w: ["flieg", "schweb", "flug"], icon: "🕊️", deut: "Freiheit & Perspektive — der Wunsch, über den Dingen zu stehen." },
  { key: "fallen", w: ["fall", "stürz", "abgrund"], icon: "🌀", deut: "Kontrollverlust oder Loslassen — wo darfst du dich fangen lassen?" },
  { key: "zaehne", w: ["zahn", "zähne"], icon: "🦷", deut: "Sorge um Ausstrahlung & Kraft — klassisches Symbol für Verunsicherung." },
  { key: "haus", w: ["haus", "wohnung", "zimmer", "tür", "keller", "dachboden"], icon: "🏠", deut: "Dein Selbst — jedes Zimmer ein Anteil von dir." },
  { key: "verfolgung", w: ["verfolg", "gejagt", "flucht", "weglauf", "rennen"], icon: "🏃‍♀️", deut: "Etwas will angeschaut werden, dem du ausweichst." },
  { key: "tiere", w: ["katze", "hund", "vogel", "pferd", "wolf", "tier"], icon: "🦊", deut: "Instinkte & Urkräfte — welche Seite von dir zeigt sich?" },
  { key: "schlange", w: ["schlange"], icon: "🐍", deut: "Wandlung & Heilung — Häutung steht bevor." },
  { key: "tod", w: ["tod", "sterb", "beerdigung", "grab"], icon: "🥀", deut: "Selten wörtlich: ein Kapitel endet, damit ein neues beginnt." },
  { key: "baby", w: ["baby", "kind", "geburt", "schwanger"], icon: "👶", deut: "Etwas Neues wird in dir geboren — eine Idee, ein Lebensabschnitt." },
  { key: "pruefung", w: ["prüfung", "test", "schule", "zu spät", "verpass"], icon: "📝", deut: "Angst, nicht zu genügen — wer prüft dich da wirklich?" },
  { key: "feuer", w: ["feuer", "brenn", "flamme"], icon: "🔥", deut: "Leidenschaft oder Zorn — Energie, die einen Ausdruck sucht." },
  { key: "licht", w: ["licht", "sonne", "stern", "mond"], icon: "✨", deut: "Hoffnung, Führung, Bewusstwerdung." },
  { key: "auto", w: ["auto", "fahren", "zug", "bus", "reise", "weg"], icon: "🛤️", deut: "Deine Lebensrichtung — wer sitzt am Steuer?" },
];
function findeSymbole(text) {
  const t = text.toLowerCase();
  return TRAUM_SYMBOLE.filter((s) => s.w.some((w) => t.includes(w)));
}
function Traumbibliothek({ traeume, setTraeume, addPunkte }) {
  const [text, setText] = useState("");
  const speichern = () => {
    if (!text.trim()) return;
    const symbole = findeSymbole(text).map((s) => s.key);
    setTraeume([{ datum: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }), text: text.trim(), symbole }, ...(traeume || [])]);
    setText("");
    addPunkte(5, "Traum festgehalten");
  };
  const alle = traeume || [];
  const counts = {};
  alle.forEach((tr) => (tr.symbole || []).forEach((k) => { counts[k] = (counts[k] || 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Traumbibliothek</Eyebrow>
      <H size={25}>Was hat dir die Nacht erzählt?</H>
      <Card style={{ margin: "16px 0 14px" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Stichworte reichen: „Wasser, altes Haus, ich konnte fliegen …“"
          style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso }}
        />
        <div style={{ marginTop: 10 }}>
          <Btn full onClick={speichern} disabled={!text.trim()}>🌙 Traum festhalten</Btn>
        </div>
      </Card>
      {top.length > 0 && (
        <Card style={{ marginBottom: 14, background: C.goldPale }}>
          <Eyebrow color={C.espresso}>Deine wiederkehrenden Symbole</Eyebrow>
          {top.map(([k, n]) => {
            const s = TRAUM_SYMBOLE.find((x) => x.key === k);
            return (
              <div key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{k.charAt(0).toUpperCase() + k.slice(1)} · {n}×</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>{s.deut}</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
      {alle.length === 0 && (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.7 }}>
          Halte deine Träume gleich morgens fest — schon Stichworte genügen. Mit der Zeit erkennt deine Bibliothek, welche Symbole immer wiederkehren.
        </p>
      )}
      {alle.map((tr, i) => (
        <Card key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginBottom: 6 }}>{tr.datum}</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.6 }}>{tr.text}</div>
          {(tr.symbole || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {tr.symbole.map((k) => {
                const s = TRAUM_SYMBOLE.find((x) => x.key === k);
                return <span key={k} style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, background: C.beige, borderRadius: 10, padding: "4px 10px", color: C.espresso }}>{s?.icon} {k}</span>;
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ── Körper-Check & Zyklus-Spiegel ── */
const ZYKLUS_PHASEN = [
  { n: "Menstruation", k: "winter", von: 1, bis: 6, icon: "🌑", jz: "Innerer Winter", tipp: "Rückzug & Ruhe sind produktiv. Weniger Termine, mehr Decke.", kraft: "Klarheit über das, was wirklich zählt", brauch: "Wärme, Schlaf, Alleinsein" },
  { n: "Follikelphase", k: "fruehling", von: 7, bis: 13, icon: "🌱", jz: "Innerer Frühling", tipp: "Aufbruchsenergie — gute Zeit für Neues und Mut.", kraft: "Neugier, Ideen, Tatendrang", brauch: "Bewegung, Pläne, frische Luft" },
  { n: "Eisprung-Zeit", k: "sommer", von: 14, bis: 17, icon: "🌕", jz: "Innerer Sommer", tipp: "Strahlkraft — Gespräche & Sichtbarkeit fallen leicht.", kraft: "Ausdruck, Verbindung, Charme", brauch: "Menschen, Bühne, Austausch" },
  { n: "Lutealphase", k: "herbst", von: 18, bis: 35, icon: "🌗", jz: "Innerer Herbst", tipp: "Fokus nach innen — sortieren, abschließen, für dich sorgen.", kraft: "Ehrlichkeit, Struktur, Grenzen", brauch: "Ruhe, klare Absagen, gutes Essen" },
];
const KOERPER_SIGNALE = [
  { k: "kopf", icon: "🤕", n: "Kopf" }, { k: "bauch", icon: "🌀", n: "Bauch" },
  { k: "ruecken", icon: "🪢", n: "Rücken" }, { k: "schlaf", icon: "😴", n: "Schlaf" },
  { k: "haut", icon: "✨", n: "Haut" }, { k: "verspannt", icon: "🧊", n: "Verspannt" },
  { k: "leicht", icon: "🕊️", n: "Leicht" }, { k: "hunger", icon: "🍫", n: "Heißhunger" },
];
const STIMMUNGEN = [
  { k: "ruhig", icon: "🌊", n: "Ruhig" }, { k: "kraftvoll", icon: "🔥", n: "Kraftvoll" },
  { k: "traurig", icon: "🌧️", n: "Traurig" }, { k: "gereizt", icon: "⚡", n: "Gereizt" },
  { k: "verletzlich", icon: "🕯️", n: "Verletzlich" }, { k: "klar", icon: "💎", n: "Klar" },
  { k: "erschoepft", icon: "🥀", n: "Erschöpft" }, { k: "freudig", icon: "🌻", n: "Freudig" },
];
function ZyklusSpiegel({ zyklus, setZyklus, addPunkte, drawn, entries }) {
  const heute = new Date().toDateString();
  const alle = zyklus || [];
  const heutiger = alle.find((c) => c.tag === heute);
  const [koerper, setKoerper] = useState(3);
  const [energie, setEnergie] = useState(3);
  const [schlaf, setSchlaf] = useState(3);
  const [zTag, setZTag] = useState("");
  const [signale, setSignale] = useState([]);
  const [stimmung, setStimmung] = useState([]);
  const [notiz, setNotiz] = useState("");
  const [ansicht, setAnsicht] = useState("check");
  const [zyklusStart, setZyklusStart] = useState(null);

  const phaseVon = (zt) => ZYKLUS_PHASEN.find((p) => zt >= p.von && zt <= p.bis);
  // Automatische Zyklustag-Schätzung aus dem letzten "Tag 1"-Eintrag
  const letzterStart = alle.filter((c) => c.zyklustag === 1).sort((a, b) => new Date(b.tag) - new Date(a.tag))[0];
  const autoTag = letzterStart ? Math.round((new Date(heute) - new Date(letzterStart.tag)) / 864e5) + 1 : null;
  const effektiverTag = zTag ? parseInt(zTag, 10) : (autoTag && autoTag <= 40 ? autoTag : null);
  const phase = effektiverTag ? phaseVon(effektiverTag) : null;

  const toggle = (arr, setArr, k) => setArr(arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);
  const speichern = () => {
    if (heutiger) return;
    setZyklus([{
      tag: heute, ts: Date.now(), datum: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }),
      koerper, energie, schlaf, signale, stimmung, notiz: notiz.trim(),
      zyklustag: effektiverTag || null, wochentag: new Date().getDay(),
      karte: drawn?.name || drawn?.titel || null, mond: mondphase().n,
    }, ...alle]);
    addPunkte(5, "Körper-Check");
    setSignale([]); setStimmung([]); setNotiz(""); setZTag("");
  };
  const periodeStarten = () => {
    if (heutiger) return;
    setZTag("1");
  };

  // ── Auswertung ──
  const avg = (arr, f) => arr.length ? arr.reduce((s, x) => s + f(x), 0) / arr.length : 0;
  const wtNamen = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const genug = alle.length >= 5;
  const viel = alle.length >= 12;
  let A = null;
  if (genug) {
    const byWt = {}; alle.forEach((c) => { (byWt[c.wochentag] = byWt[c.wochentag] || []).push(c); });
    const wtAvg = Object.entries(byWt).filter(([, v]) => v.length >= 2)
      .map(([wt, v]) => ({ n: wtNamen[wt], e: avg(v, (x) => x.energie), k: avg(v, (x) => x.koerper), n2: v.length })).sort((a, b) => b.e - a.e);
    const mitZ = alle.filter((c) => c.zyklustag);
    const byPhase = {};
    mitZ.forEach((c) => { const p = phaseVon(c.zyklustag); if (p) (byPhase[p.k] = byPhase[p.k] || []).push(c); });
    const phasen = ZYKLUS_PHASEN.map((p) => ({ ...p, daten: byPhase[p.k] || [] })).filter((p) => p.daten.length >= 2)
      .map((p) => ({ ...p, e: avg(p.daten, (x) => x.energie), koe: avg(p.daten, (x) => x.koerper), s: avg(p.daten, (x) => x.schlaf || 3) }));
    // Signal- und Stimmungshäufigkeit je Phase
    const sigCount = {}; const stimCount = {};
    alle.forEach((c) => {
      (c.signale || []).forEach((s) => { sigCount[s] = (sigCount[s] || 0) + 1; });
      (c.stimmung || []).forEach((s) => { stimCount[s] = (stimCount[s] || 0) + 1; });
    });
    const topSig = Object.entries(sigCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const topStim = Object.entries(stimCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
    // Korrelation Schlaf ↔ Energie (Pearson, nur bei genug Daten)
    let korrSchlaf = null;
    const mitS = alle.filter((c) => c.schlaf);
    if (mitS.length >= 8) {
      const mx = avg(mitS, (x) => x.schlaf), my = avg(mitS, (x) => x.energie);
      const num = mitS.reduce((s, x) => s + (x.schlaf - mx) * (x.energie - my), 0);
      const den = Math.sqrt(mitS.reduce((s, x) => s + (x.schlaf - mx) ** 2, 0) * mitS.reduce((s, x) => s + (x.energie - my) ** 2, 0));
      if (den > 0) korrSchlaf = num / den;
    }
    // Zykluslänge aus den Tag-1-Einträgen
    const starts = alle.filter((c) => c.zyklustag === 1).map((c) => new Date(c.tag)).sort((a, b) => a - b);
    const laengen = starts.slice(1).map((d, i) => Math.round((d - starts[i]) / 864e5)).filter((l) => l > 15 && l < 60);
    A = { wtAvg, phasen, topSig, topStim, korrSchlaf, laengen, gesamtE: avg(alle, (x) => x.energie), gesamtK: avg(alle, (x) => x.koerper), gesamtS: avg(alle.filter((x) => x.schlaf), (x) => x.schlaf) };
  }

  const skala = ["😞", "😕", "😐", "🙂", "🌟"];
  const schlafSkala = ["😵", "😪", "😐", "😌", "💤"];
  const Waehler = ({ wert, setWert, label, icons }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 7 }}>
        {icons.map((e, i) => (
          <button key={i} onClick={() => setWert(i + 1)} style={{
            flex: 1, fontSize: 21, padding: "10px 0", borderRadius: 12, cursor: "pointer",
            border: wert === i + 1 ? `2px solid ${C.gold}` : `1.5px solid ${C.line}`,
            background: wert === i + 1 ? C.goldPale : C.card,
          }}>{e}</button>
        ))}
      </div>
    </div>
  );
  const Chips = ({ liste, aktiv, setAktiv, label }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {liste.map((s) => (
          <button key={s.k} onClick={() => toggle(aktiv, setAktiv, s.k)} style={{
            padding: "8px 12px", borderRadius: 20, cursor: "pointer",
            border: aktiv.includes(s.k) ? `2px solid ${C.gold}` : `1.5px solid ${C.line}`,
            background: aktiv.includes(s.k) ? C.goldPale : C.card,
            fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso,
          }}>{s.icon} {s.n}</button>
        ))}
      </div>
    </div>
  );
  const Balken = ({ wert, max = 5, farbe = C.gold }) => (
    <div style={{ height: 7, borderRadius: 4, background: C.beige, overflow: "hidden", minWidth: 70, flex: 1 }}>
      <div style={{ width: `${(wert / max) * 100}%`, height: "100%", background: farbe }} />
    </div>
  );

  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Körper & Zyklus</Eyebrow>
      <H size={25}>Dein Körper spricht mit dir</H>

      {/* Phasen-Kompass */}
      {phase && (
        <Card style={{ margin: "16px 0 14px", background: C.goldPale }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 34 }}>{phase.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso }}>{phase.jz}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>{phase.n} · Tag {effektiverTag}{!zTag && autoTag ? " (geschätzt)" : ""}</div>
            </div>
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.7, marginTop: 10 }}>{phase.tipp}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, background: C.card, borderRadius: 10, padding: "5px 10px", color: C.espresso }}>💪 Deine Kraft: {phase.kraft}</span>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, background: C.card, borderRadius: 10, padding: "5px 10px", color: C.espresso }}>🤍 Du brauchst: {phase.brauch}</span>
          </div>
        </Card>
      )}

      {/* Umschalter */}
      <div style={{ display: "flex", gap: 6, margin: "0 0 14px" }}>
        {[["check", "Check-in"], ["muster", "Muster"], ["verlauf", "Verlauf"]].map(([k, t]) => (
          <button key={k} onClick={() => setAnsicht(k)} style={{
            flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer",
            border: ansicht === k ? "none" : `1.5px solid ${C.line}`,
            background: ansicht === k ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.card,
            color: ansicht === k ? "#fff" : C.ink, fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700,
          }}>{t}</button>
        ))}
      </div>

      {ansicht === "check" && (!heutiger ? (
        <Card>
          <Waehler wert={koerper} setWert={setKoerper} label="Wie fühlt sich dein Körper heute an?" icons={skala} />
          <Waehler wert={energie} setWert={setEnergie} label="Wie viel Energie hast du?" icons={skala} />
          <Waehler wert={schlaf} setWert={setSchlaf} label="Wie hast du geschlafen?" icons={schlafSkala} />
          <Chips liste={KOERPER_SIGNALE} aktiv={signale} setAktiv={setSignale} label="Körper-Signale (mehrere möglich)" />
          <Chips liste={STIMMUNGEN} aktiv={stimmung} setAktiv={setStimmung} label="Wie ist deine Stimmung?" />
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 8 }}>Zyklustag</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input value={zTag} onChange={(e) => setZTag(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder={autoTag ? String(autoTag) : "z. B. 14"} inputMode="numeric"
                style={{ width: 90, padding: "11px 13px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14.5, outline: "none", background: C.cream, color: C.espresso }} />
              <button onClick={periodeStarten} style={{ padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.rose}`, background: C.roseSoft, cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, fontWeight: 700 }}>
                🌑 Periode beginnt heute
              </button>
            </div>
            {autoTag && !zTag && (
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 8 }}>
                Geschätzt aus deinem letzten Zyklusstart: Tag {autoTag}. Du kannst korrigieren.
              </div>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 8 }}>Ein Satz für heute (optional)</div>
            <textarea value={notiz} onChange={(e) => setNotiz(e.target.value)} rows={2} placeholder="Was möchtest du dir merken?"
              style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso }} />
          </div>
          <Btn full onClick={speichern}>Check speichern (+5 ✨)</Btn>
        </Card>
      ) : (
        <Card style={{ textAlign: "center", background: C.goldPale }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso }}>Heute schon eingecheckt 🤍</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, marginTop: 6, lineHeight: 1.8 }}>
            Körper {skala[heutiger.koerper - 1]} · Energie {skala[heutiger.energie - 1]}{heutiger.schlaf ? ` · Schlaf ${schlafSkala[heutiger.schlaf - 1]}` : ""}<br />
            {heutiger.zyklustag ? `Zyklustag ${heutiger.zyklustag}` : ""}
          </div>
          {(heutiger.signale || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 10 }}>
              {heutiger.signale.map((k) => { const s = KOERPER_SIGNALE.find((x) => x.k === k); return <span key={k} style={{ fontSize: 12, background: C.card, borderRadius: 10, padding: "4px 9px", fontFamily: "system-ui, sans-serif", color: C.espresso }}>{s?.icon} {s?.n}</span>; })}
            </div>
          )}
          {heutiger.notiz && <div style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, marginTop: 10, lineHeight: 1.6 }}>„{heutiger.notiz}“</div>}
        </Card>
      ))}

      {ansicht === "muster" && (
        !genug ? (
          <Card>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>
              Noch <b>{5 - alle.length} Check-ins</b>, dann zeigen sich hier deine ersten echten Muster.
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < alle.length ? C.gold : C.beige }} />
              ))}
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, opacity: 0.75, marginTop: 12, lineHeight: 1.6 }}>
              Alles hier wird ausschließlich aus deinen eigenen Eingaben berechnet — nichts wird geschätzt oder erfunden.
            </div>
          </Card>
        ) : (
          <>
            <Card style={{ marginBottom: 12 }}>
              <Eyebrow color={C.espresso}>Deine Durchschnitte ({alle.length} Check-ins)</Eyebrow>
              {[["Energie", A.gesamtE, C.gold], ["Körpergefühl", A.gesamtK, C.rose], ...(A.gesamtS ? [["Schlaf", A.gesamtS, C.sage]] : [])].map(([n, v, f]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, width: 95 }}>{n}</div>
                  <Balken wert={v} farbe={f} />
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.espresso, width: 34, textAlign: "right" }}>{v.toFixed(1)}</div>
                </div>
              ))}
            </Card>

            {A.phasen.length > 0 && (
              <Card style={{ marginBottom: 12 }}>
                <Eyebrow color={C.espresso}>Dein Zyklus-Spiegel</Eyebrow>
                {A.phasen.map((p) => (
                  <div key={p.k} style={{ padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso, marginBottom: 6 }}>{p.icon} {p.jz} <span style={{ fontWeight: 400, color: C.ink }}>({p.daten.length} Tage)</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, width: 60 }}>Energie</span>
                      <Balken wert={p.e} /><span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.espresso, width: 26 }}>{p.e.toFixed(1)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, width: 60 }}>Körper</span>
                      <Balken wert={p.koe} farbe={C.rose} /><span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.espresso, width: 26 }}>{p.koe.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
                {A.phasen.length >= 2 && (
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, marginTop: 10, lineHeight: 1.6 }}>
                    💡 Deine stärkste Phase ist bisher <b>{[...A.phasen].sort((a, b) => b.e - a.e)[0].jz}</b>, deine sanfteste <b>{[...A.phasen].sort((a, b) => a.e - b.e)[0].jz}</b>. Plane Wichtiges eher in deine starke Phase.
                  </div>
                )}
              </Card>
            )}

            {A.wtAvg.length > 0 && (
              <Card style={{ marginBottom: 12 }}>
                <Eyebrow color={C.espresso}>Deine Wochentage</Eyebrow>
                {A.wtAvg.map((w) => (
                  <div key={w.n} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, width: 80 }}>{w.n}</span>
                    <Balken wert={w.e} />
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.espresso, width: 26 }}>{w.e.toFixed(1)}</span>
                  </div>
                ))}
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, marginTop: 10, lineHeight: 1.6 }}>
                  💪 Am meisten Energie hast du <b>{A.wtAvg[0].n}s</b>{A.wtAvg.length > 1 ? <>, am wenigsten <b>{A.wtAvg[A.wtAvg.length - 1].n}s</b></> : null}.
                </div>
              </Card>
            )}

            {(A.topSig.length > 0 || A.topStim.length > 0) && (
              <Card style={{ marginBottom: 12 }}>
                <Eyebrow color={C.espresso}>Was sich bei dir wiederholt</Eyebrow>
                {A.topSig.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginBottom: 6 }}>Körper-Signale</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {A.topSig.map(([k, n]) => { const s = KOERPER_SIGNALE.find((x) => x.k === k); return <span key={k} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, background: C.beige, borderRadius: 12, padding: "5px 11px", color: C.espresso }}>{s?.icon} {s?.n} · {n}×</span>; })}
                    </div>
                  </div>
                )}
                {A.topStim.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginBottom: 6 }}>Stimmungen</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {A.topStim.map(([k, n]) => { const s = STIMMUNGEN.find((x) => x.k === k); return <span key={k} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, background: C.roseSoft, borderRadius: 12, padding: "5px 11px", color: C.espresso }}>{s?.icon} {s?.n} · {n}×</span>; })}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {(A.korrSchlaf !== null || A.laengen.length > 0) && (
              <Card style={{ marginBottom: 12 }}>
                <Eyebrow color={C.espresso}>Zusammenhänge in deinen Daten</Eyebrow>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.8 }}>
                  {A.korrSchlaf !== null && (
                    <div>😴 Schlaf ↔ Energie: {A.korrSchlaf > 0.4 ? <b>deutlicher Zusammenhang</b> : A.korrSchlaf > 0.15 ? "leichter Zusammenhang" : "kaum Zusammenhang"} (r = {A.korrSchlaf.toFixed(2)}){A.korrSchlaf > 0.4 ? " — dein Schlaf ist ein echter Hebel." : ""}</div>
                  )}
                  {A.laengen.length > 0 && (
                    <div>🔄 Deine Zykluslänge: Ø {Math.round(A.laengen.reduce((s, x) => s + x, 0) / A.laengen.length)} Tage ({A.laengen.length === 1 ? "1 gemessener Zyklus" : `${A.laengen.length} gemessene Zyklen`})</div>
                  )}
                </div>
                {!viel && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.75, marginTop: 8 }}>Je mehr Check-ins, desto verlässlicher werden diese Zusammenhänge.</div>}
              </Card>
            )}

            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.75, lineHeight: 1.6 }}>
              Alle Auswertungen entstehen ausschließlich aus deinen Eingaben auf diesem Gerät. Sie sind Selbstbeobachtung — keine medizinische Diagnose.
            </div>
          </>
        )
      )}

      {ansicht === "verlauf" && (
        alle.length === 0 ? (
          <Card><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink }}>Noch keine Check-ins. Fang heute an 🤍</div></Card>
        ) : (
          <>
            <Card style={{ marginBottom: 12 }}>
              <Eyebrow color={C.espresso}>Energie der letzten {Math.min(21, alle.length)} Tage</Eyebrow>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90, marginTop: 10 }}>
                {[...alle].slice(0, 21).reverse().map((c, i) => (
                  <div key={i} title={`${c.datum} · Energie ${c.energie}`} style={{
                    flex: 1, height: `${(c.energie / 5) * 100}%`, borderRadius: "4px 4px 0 0",
                    background: c.zyklustag && phaseVon(c.zyklustag)?.k === "winter" ? C.plum : `linear-gradient(180deg, ${C.gold}, ${C.rose})`,
                  }} />
                ))}
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 8 }}>Dunkle Balken = Menstruationstage</div>
            </Card>
            {alle.slice(0, 30).map((c, i) => (
              <Card key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>{c.datum}{c.zyklustag ? ` · Tag ${c.zyklustag} ${phaseVon(c.zyklustag)?.icon || ""}` : ""}</div>
                  <div style={{ fontSize: 15 }}>{skala[c.koerper - 1]} {skala[c.energie - 1]}{c.schlaf ? ` ${schlafSkala[c.schlaf - 1]}` : ""}</div>
                </div>
                {((c.signale || []).length > 0 || (c.stimmung || []).length > 0) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                    {(c.signale || []).map((k) => { const s = KOERPER_SIGNALE.find((x) => x.k === k); return <span key={"s" + k} style={{ fontSize: 11.5, background: C.beige, borderRadius: 10, padding: "3px 8px", fontFamily: "system-ui, sans-serif", color: C.espresso }}>{s?.icon} {s?.n}</span>; })}
                    {(c.stimmung || []).map((k) => { const s = STIMMUNGEN.find((x) => x.k === k); return <span key={"m" + k} style={{ fontSize: 11.5, background: C.roseSoft, borderRadius: 10, padding: "3px 8px", fontFamily: "system-ui, sans-serif", color: C.espresso }}>{s?.icon} {s?.n}</span>; })}
                  </div>
                )}
                {c.notiz && <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.espresso, marginTop: 8, lineHeight: 1.6 }}>„{c.notiz}“</div>}
              </Card>
            ))}
          </>
        )
      )}
    </div>
  );
}

/* ── Freundinnen-Kreis — geteilte Rituale (lokaler Kreis, Server folgt) ── */
function FreundinnenKreis({ kreis, setKreis, streak, addPunkte }) {
  const [name, setName] = useState("");
  const [thema, setThema] = useState(kreis?.thema || "");
  const mitglieder = kreis?.mitglieder || [];
  const heute = new Date().toDateString();
  const einladen = () => {
    const n = name.trim();
    if (!n || mitglieder.length >= 5) return;
    setKreis({ ...(kreis || {}), mitglieder: [...mitglieder, { name: n, eingeladen: new Date().toLocaleDateString("de-DE"), status: "eingeladen" }] });
    setName("");
    addPunkte(5, "Freundin eingeladen");
  };
  const entfernen = (i) => setKreis({ ...(kreis || {}), mitglieder: mitglieder.filter((_, x) => x !== i) });
  const themaSetzen = () => {
    if (!thema.trim()) return;
    setKreis({ ...(kreis || {}), thema: thema.trim(), themaStart: heute, themaTag: 1 });
    addPunkte(5, "Gemeinsames Thema gesetzt");
  };
  const tagZaehlen = () => {
    if (kreis?.letzterTag === heute) return;
    setKreis({ ...(kreis || {}), letzterTag: heute, themaTag: (kreis?.themaTag || 0) + 1 });
    addPunkte(8, "Kreis-Tag geschafft");
  };
  const heuteGemacht = kreis?.letzterTag === heute;
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Freundinnen-Kreis</Eyebrow>
      <H size={25}>Gemeinsam wächst es sich leichter</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Lade bis zu 5 Freundinnen in deinen privaten Kreis. Ihr journalt 21 Tage zum selben Thema — jede für sich, und doch zusammen.
      </p>
      <Card style={{ marginBottom: 14 }}>
        <Eyebrow color={C.espresso}>Dein Kreis ({mitglieder.length + 1}/6)</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17 }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Du</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>🔥 {streak} Tage Serie</div>
          </div>
        </div>
        {mitglieder.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.plum, fontWeight: 700 }}>{m.name.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{m.name}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>Einladung offen · {m.eingeladen}</div>
            </div>
            <button onClick={() => entfernen(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink, fontSize: 16 }}>✕</button>
          </div>
        ))}
        {mitglieder.length < 5 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && einladen()} placeholder="Name deiner Freundin"
              style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14, outline: "none", background: C.cream, color: C.espresso }} />
            <Btn small onClick={einladen} disabled={!name.trim()}>Einladen</Btn>
          </div>
        )}
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.7, marginTop: 10 }}>
          Vorschau: Der Einladungs-Versand startet mit dem Server-Update — bis dahin planst du deinen Kreis hier.
        </div>
      </Card>
      <Card>
        <Eyebrow color={C.espresso}>Euer gemeinsames Thema</Eyebrow>
        {!kreis?.thema ? (
          <>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={thema} onChange={(e) => setThema(e.target.value)} placeholder="z. B. Grenzen setzen"
                style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14, outline: "none", background: C.cream, color: C.espresso }} />
              <Btn small onClick={themaSetzen} disabled={!thema.trim()}>Start</Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso, margin: "6px 0 10px" }}>{kreis.thema}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
              {Array.from({ length: 21 }).map((_, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: 7, background: i < (kreis.themaTag || 0) ? C.gold : C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{i < (kreis.themaTag || 0) ? "✓" : ""}</div>
              ))}
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 12 }}>Tag {Math.min(kreis.themaTag || 0, 21)} von 21</div>
            <Btn full onClick={tagZaehlen} disabled={heuteGemacht}>{heuteGemacht ? "Heute schon dabei 🤍" : "Heutigen Tag abschließen"}</Btn>
          </>
        )}
      </Card>
    </div>
  );
}

/* ── Mondkalender — Rituale zu Voll- und Neumond ── */
function Mondrituale({ mondrit, setMondrit, addPunkte }) {
  const m = mondphase();
  const istVoll = m.n === "Vollmond";
  const istNeu = m.n === "Neumond";
  const [text, setText] = useState("");
  const [burning, setBurning] = useState(false);
  const intentionen = mondrit?.intentionen || [];
  const losRitual = () => {
    if (!text.trim()) return;
    setBurning(true);
    setTimeout(() => { setText(""); setBurning(false); addPunkte(10, "Vollmond-Loslassen"); }, 2000);
  };
  const intentionSetzen = () => {
    if (!text.trim()) return;
    const faellig = new Date(Date.now() + 14 * 864e5);
    setMondrit({ ...(mondrit || {}), intentionen: [{ text: text.trim(), gesetzt: new Date().toLocaleDateString("de-DE"), erinnerung: faellig.toLocaleDateString("de-DE"), erinnerungTs: faellig.getTime() }, ...intentionen] });
    setText("");
    addPunkte(10, "Neumond-Intention");
  };
  const faellige = intentionen.filter((i) => i.erinnerungTs && i.erinnerungTs <= Date.now());
  return (
    <div style={{ padding: "26px 20px" }}>
      <style>{`@keyframes moonBurn { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-20px); filter: blur(5px); } }`}</style>
      <Eyebrow color={C.plum}>Mondrituale</Eyebrow>
      <H size={25}>Im Rhythmus des Mondes</H>
      <Card style={{ margin: "16px 0 14px", textAlign: "center", background: C.goldPale }}>
        <div style={{ fontSize: 54 }}>{m.e}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, marginTop: 6 }}>{m.n}</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginTop: 8 }}>{m.imp}</div>
      </Card>
      {faellige.length > 0 && (
        <Card style={{ marginBottom: 14, border: `2px solid ${C.gold}` }}>
          <Eyebrow color={C.espresso}>Erinnerst du dich?</Eyebrow>
          {faellige.map((i, x) => (
            <div key={x} style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.espresso, lineHeight: 1.6, marginBottom: 6 }}>
              „{i.text}“ <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>— gesetzt am {i.gesetzt}</span>
            </div>
          ))}
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 6 }}>Was ist seitdem daraus geworden?</div>
        </Card>
      )}
      <Card>
        <Eyebrow color={C.espresso}>{istVoll ? "🌕 Loslass-Ritual" : istNeu ? "🌑 Manifestations-Ritual" : "Dein Mond-Impuls"}</Eyebrow>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "6px 0 12px" }}>
          {istVoll ? "Schreib auf, was du zurücklassen willst — und lass es verbrennen." : istNeu ? "Setze eine Intention. In 14 Tagen hole ich sie für dich hervor." : "Auch zwischen den Phasen darfst du säen oder loslassen — wähle unten."}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
          placeholder={istVoll ? "Ich lasse los …" : "Ich setze die Intention …"}
          style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso, animation: burning ? "moonBurn 2s ease forwards" : "none" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Btn full onClick={losRitual} disabled={!text.trim() || burning}>🔥 Loslassen</Btn>
          <Btn full ghost onClick={intentionSetzen} disabled={!text.trim() || burning}>🌱 Intention setzen</Btn>
        </div>
      </Card>
      {intentionen.length > 0 && (
        <Card style={{ marginTop: 14 }}>
          <Eyebrow color={C.espresso}>Deine Intentionen</Eyebrow>
          {intentionen.map((i, x) => (
            <div key={x} style={{ padding: "8px 0", borderBottom: x < intentionen.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso }}>{i.text}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>gesetzt {i.gesetzt} · Rückblick {i.erinnerung}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ── Intuitions-Training ── */
const INTU_KARTEN = [
  { s: "🌙", n: "Mond" }, { s: "☀️", n: "Sonne" }, { s: "⭐", n: "Stern" },
  { s: "🌊", n: "Welle" }, { s: "🔥", n: "Feuer" }, { s: "🌿", n: "Blatt" },
];
function Intuition({ intu, setIntu, addPunkte }) {
  const [ziel, setZiel] = useState(null);
  const [wahl, setWahl] = useState(null);
  const [runde, setRunde] = useState(0);
  const stats = intu || { versuche: 0, treffer: 0, verlauf: [] };
  const start = () => { setZiel(Math.floor(Math.random() * INTU_KARTEN.length)); setWahl(null); setRunde(runde + 1); };
  useEffect(() => { if (ziel === null) start(); }, []);
  const raten = (i) => {
    if (wahl !== null || ziel === null) return;
    setWahl(i);
    const richtig = i === ziel;
    const neu = { versuche: stats.versuche + 1, treffer: stats.treffer + (richtig ? 1 : 0), verlauf: [...(stats.verlauf || []), richtig ? 1 : 0].slice(-50) };
    setIntu(neu);
    if (richtig) addPunkte(3, "Intuitions-Treffer");
  };
  const quote = stats.versuche ? Math.round((stats.treffer / stats.versuche) * 100) : 0;
  const zufall = Math.round(100 / INTU_KARTEN.length);
  const letzte10 = (stats.verlauf || []).slice(-10);
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Intuitions-Training</Eyebrow>
      <H size={25}>Welche Karte liegt verdeckt?</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Atme einmal durch, spür kurz nach — und wähle. Über viele Runden siehst du, ob dein Gefühl den Zufall schlägt.
      </p>
      <Card style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>{wahl === null ? "🂠" : INTU_KARTEN[ziel].s}</div>
        {wahl !== null && (
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: wahl === ziel ? C.sage : C.ink, marginBottom: 12 }}>
            {wahl === ziel ? "Treffer! Dein Gefühl lag richtig. ✨" : `Diesmal war es ${INTU_KARTEN[ziel].n}.`}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {INTU_KARTEN.map((k, i) => (
            <button key={i} onClick={() => raten(i)} disabled={wahl !== null} style={{
              width: 62, height: 62, fontSize: 26, borderRadius: 14, cursor: wahl === null ? "pointer" : "default",
              border: wahl === i ? `2.5px solid ${C.gold}` : `1.5px solid ${C.line}`,
              background: wahl !== null && i === ziel ? C.goldPale : C.cream, opacity: wahl !== null && i !== ziel && i !== wahl ? 0.45 : 1,
            }}>{k.s}</button>
          ))}
        </div>
        {wahl !== null && <div style={{ marginTop: 14 }}><Btn full onClick={start}>Nächste Karte</Btn></div>}
      </Card>
      <Card>
        <Eyebrow color={C.espresso}>Deine Trefferquote</Eyebrow>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 34, color: quote > zufall ? C.sage : C.espresso }}>{quote}%</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>bei {stats.versuche} Runden · Zufall wäre {zufall}%</div>
        </div>
        {letzte10.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
            {letzte10.map((v, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: 6, background: v ? C.sage : C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{v ? "✓" : ""}</div>
            ))}
          </div>
        )}
        {stats.versuche >= 20 && (
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 10, lineHeight: 1.6 }}>
            {quote > zufall + 8 ? "Du liegst deutlich über dem Zufall — schön, wie du dir vertraust." : quote < zufall - 8 ? "Gerade liegst du unter dem Zufall. Auch das ist eine Information: Vielleicht denkst du zu viel und fühlst zu wenig." : "Du bewegst dich im Bereich des Zufalls — genau darum geht es: üben, nicht beweisen."}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Transformations-Reisen (21/40 Tage) ── */
const REISEN = [
  { id: "selbstwert", t: "Ich bin genug", tage: 21, icon: "💗", farbe: "#D96E8B", was: "21 Tage für dein Selbstwertgefühl", impulse: ["Was hast du heute gut gemacht — auch wenn es klein war?", "Wessen Stimme hörst du, wenn du dich kritisierst?", "Schreib drei Sätze, die mit „Ich darf“ beginnen.", "Was würdest du einer Freundin sagen, die so über sich spricht wie du?", "Welche Eigenschaft an dir magst du insgeheim sehr?", "Wo hast du dich heute kleiner gemacht als du bist?", "Wofür bist du dir heute dankbar?"] },
  { id: "loslassen", t: "Loslassen lernen", tage: 21, icon: "🍃", farbe: "#6E8B6A", was: "21 Tage sanftes Loslassen", impulse: ["Was trägst du mit dir, das dir längst nicht mehr gehört?", "Welche Erwartung darf heute gehen?", "Was würde leichter, wenn du aufhörst zu kämpfen?", "Wem darfst du innerlich vergeben — vielleicht dir selbst?", "Was hältst du fest aus Angst, nicht aus Liebe?", "Was möchtest du am Ende dieser Reise nicht mehr tragen?", "Wie fühlt sich Leichtigkeit in deinem Körper an?"] },
  { id: "grenzen", t: "Grenzen setzen", tage: 40, icon: "🛡️", farbe: "#B0503C", was: "40 Tage für dein klares Nein", impulse: ["Wo hast du heute Ja gesagt, obwohl du Nein meintest?", "Was macht dir Angst an einem klaren Nein?", "Wie klingt ein liebevolles Nein in deinen Worten?", "Wer respektiert deine Grenzen — und wer nicht?", "Welche Grenze darfst du heute laut aussprechen?", "Was gewinnst du, wenn du dich schützt?", "Wo brauchst du Abstand statt Erklärung?"] },
];
function Reisen({ reisen, setReisen, addPunkte }) {
  const aktiv = (reisen || []).find((r) => !r.fertig);
  const heute = new Date().toDateString();
  const starten = (r) => {
    setReisen([{ id: r.id, tag: 0, start: new Date().toLocaleDateString("de-DE"), letzterTag: null, fertig: false }, ...(reisen || [])]);
    addPunkte(10, `Reise „${r.t}“ gestartet`);
  };
  const tagMachen = () => {
    if (!aktiv || aktiv.letzterTag === heute) return;
    const def = REISEN.find((x) => x.id === aktiv.id);
    const neuTag = aktiv.tag + 1;
    const fertig = neuTag >= def.tage;
    setReisen((reisen || []).map((r) => r === aktiv ? { ...r, tag: neuTag, letzterTag: heute, fertig } : r));
    addPunkte(fertig ? 50 : 10, fertig ? "Reise abgeschlossen!" : `Tag ${neuTag} geschafft`);
  };
  if (aktiv) {
    const def = REISEN.find((x) => x.id === aktiv.id);
    const impuls = def.impulse[aktiv.tag % def.impulse.length];
    const heuteGemacht = aktiv.letzterTag === heute;
    return (
      <div style={{ padding: "26px 20px" }}>
        <Eyebrow color={C.plum}>Deine Reise</Eyebrow>
        <Card style={{ border: `2px solid ${def.farbe}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 34 }}>{def.icon}</div>
            <div>
              <H size={21} style={{ color: def.farbe }}>{def.t}</H>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Tag {aktiv.tag} von {def.tage} · seit {aktiv.start}</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 5, background: C.beige, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ width: `${(aktiv.tag / def.tage) * 100}%`, height: "100%", background: def.farbe, transition: "width .5s" }} />
          </div>
          <div style={{ background: C.goldPale, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <Eyebrow color={C.espresso}>Impuls für heute</Eyebrow>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, lineHeight: 1.6 }}>{impuls}</div>
          </div>
          <Btn full onClick={tagMachen} disabled={heuteGemacht}>{heuteGemacht ? "Heute geschafft 🤍" : "Tag abschließen"}</Btn>
        </Card>
      </div>
    );
  }
  const fertige = (reisen || []).filter((r) => r.fertig);
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Transformations-Reisen</Eyebrow>
      <H size={25}>Wähle deinen Weg</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Eine Reise nach der anderen — jeden Tag ein Impuls, bis das Thema in dir wirklich angekommen ist.
      </p>
      {REISEN.map((r) => (
        <Card key={r.id} style={{ marginBottom: 12, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{r.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15.5, color: C.espresso }}>{r.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>{r.was}</div>
          </div>
          <Btn small onClick={() => starten(r)}>Start</Btn>
        </Card>
      ))}
      {fertige.length > 0 && (
        <Card style={{ marginTop: 14, background: C.goldPale }}>
          <Eyebrow color={C.espresso}>Abgeschlossen</Eyebrow>
          {fertige.map((f, i) => {
            const d = REISEN.find((x) => x.id === f.id);
            return <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, padding: "4px 0" }}>{d?.icon} {d?.t} · seit {f.start} 🏆</div>;
          })}
        </Card>
      )}
    </div>
  );
}

/* ── Jahreskreis-Feste ── */
const JAHRESFESTE = [
  { n: "Imbolc", d: "1. Februar", md: [1, 1], icon: "🕯️", was: "Licht kehrt zurück", ritual: "Zünde eine Kerze an und benenne, was in dir erwachen will." },
  { n: "Frühlings-Tagundnachtgleiche", d: "20. März", md: [2, 20], icon: "🌷", was: "Gleichgewicht & Aufbruch", ritual: "Säe etwas — im Topf und in deinem Leben." },
  { n: "Beltane", d: "1. Mai", md: [4, 1], icon: "🔥", was: "Lebensfreude & Sinnlichkeit", ritual: "Tu heute etwas nur, weil es sich gut anfühlt." },
  { n: "Sommersonnenwende", d: "21. Juni", md: [5, 21], icon: "☀️", was: "Höchste Kraft", ritual: "Feiere, was gewachsen ist — schreib deine drei größten Erfolge auf." },
  { n: "Lughnasadh", d: "1. August", md: [7, 1], icon: "🌾", was: "Erste Ernte", ritual: "Wofür darfst du dir heute danken?" },
  { n: "Herbst-Tagundnachtgleiche", d: "22. September", md: [8, 22], icon: "🍂", was: "Ernte & Dankbarkeit", ritual: "Was war reif dieses Jahr? Was darf jetzt ruhen?" },
  { n: "Samhain", d: "31. Oktober", md: [9, 31], icon: "🌑", was: "Schleier & Ahninnen", ritual: "Schreib einen Brief an eine Frau vor dir, die dich geprägt hat." },
  { n: "Wintersonnenwende", d: "21. Dezember", md: [11, 21], icon: "❄️", was: "Stille & Neubeginn", ritual: "In der längsten Nacht: Was willst du im neuen Jahr nicht mehr mitnehmen?" },
];
function Jahreskreis({ feste, setFeste, addPunkte }) {
  const jetzt = new Date();
  const jahr = jetzt.getFullYear();
  const mitDatum = JAHRESFESTE.map((f) => {
    let d = new Date(jahr, f.md[0], f.md[1]);
    if (d < new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate())) d = new Date(jahr + 1, f.md[0], f.md[1]);
    return { ...f, dt: d, tage: Math.round((d - jetzt) / 864e5) };
  }).sort((a, b) => a.dt - b.dt);
  const naechstes = mitDatum[0];
  const gefeiert = feste || [];
  const feiern = (n) => {
    if (gefeiert.includes(n)) return;
    setFeste([...gefeiert, n]);
    addPunkte(15, `${n} gefeiert`);
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Jahreskreis</Eyebrow>
      <H size={25}>Die acht Feste des Jahres</H>
      <Card style={{ margin: "16px 0 14px", background: C.goldPale, textAlign: "center" }}>
        <div style={{ fontSize: 46 }}>{naechstes.icon}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, marginTop: 6 }}>{naechstes.n}</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 4 }}>
          {naechstes.tage === 0 ? "Heute ist es soweit! 🤍" : `in ${naechstes.tage} Tagen · ${naechstes.d}`}
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 15.5, color: C.espresso, lineHeight: 1.6, marginTop: 12 }}>{naechstes.ritual}</div>
        {naechstes.tage <= 2 && (
          <div style={{ marginTop: 14 }}>
            <Btn full onClick={() => feiern(naechstes.n)} disabled={gefeiert.includes(naechstes.n)}>
              {gefeiert.includes(naechstes.n) ? "Gefeiert 🤍" : "Ritual vollziehen"}
            </Btn>
          </div>
        )}
      </Card>
      {mitDatum.slice(1).map((f) => (
        <Card key={f.n} style={{ marginBottom: 10, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{f.n} {gefeiert.includes(f.n) ? "🤍" : ""}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>{f.d} · {f.was}</div>
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.gold, fontWeight: 700 }}>{f.tage} T</div>
        </Card>
      ))}
    </div>
  );
}

/* ── Ritual der Leere — die App, die sich selbst sperrt ── */
function RitualDerLeere({ leere, setLeere, addPunkte }) {
  const [reflexion, setReflexion] = useState("");
  const jetzt = Date.now();
  const aktiv = leere?.bis && leere.bis > jetzt;
  const offen = leere?.bis && leere.bis <= jetzt && !leere.abgeschlossen;
  const stunden = aktiv ? Math.ceil((leere.bis - jetzt) / 36e5) : 0;
  const starten = () => setLeere({ start: jetzt, bis: jetzt + 24 * 36e5, abgeschlossen: false, runde: (leere?.runde || 0) + 1 });
  const abschliessen = () => {
    setLeere({ ...leere, abgeschlossen: true, reflexion: reflexion.trim(), meilensteine: (leere?.meilensteine || 0) + 1 });
    addPunkte(30, "Stille-Meilenstein");
    setReflexion("");
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Ritual der Leere</Eyebrow>
      <H size={25}>24 Stunden ohne mich</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Diese App will nicht deine Bildschirmzeit — sie will dein Wachstum. Nimm dir einen Tag ganz ohne sie.
      </p>
      {aktiv && (
        <Card style={{ textAlign: "center", background: "#2E2320", border: "1px solid #4A3A30" }}>
          <div style={{ fontSize: 44 }}>🤍</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "#F0E4D6", marginTop: 8 }}>Deine Stille läuft</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#C9A98C", marginTop: 6, lineHeight: 1.6 }}>
            Noch etwa {stunden} Stunden. Leg das Handy weg — ich bin danach noch da.
          </div>
        </Card>
      )}
      {offen && (
        <Card>
          <Eyebrow color={C.espresso}>Willkommen zurück 🤍</Eyebrow>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, lineHeight: 1.6, marginBottom: 12 }}>
            Du hast es durchgehalten. Was hat die Stille mit dir gemacht?
          </div>
          <textarea value={reflexion} onChange={(e) => setReflexion(e.target.value)} rows={4} placeholder="Was war anders an diesem Tag?"
            style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso }} />
          <div style={{ marginTop: 10 }}><Btn full onClick={abschliessen}>Stille-Meilenstein einlösen</Btn></div>
        </Card>
      )}
      {!aktiv && !offen && (
        <>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🕊️</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, lineHeight: 1.6, marginBottom: 14 }}>
              24 Stunden ohne smile2go. Kein Streak geht verloren — im Gegenteil.
            </div>
            <Btn full onClick={starten}>Stille beginnen</Btn>
          </Card>
          {(leere?.meilensteine || 0) > 0 && (
            <Card style={{ marginTop: 14, background: C.goldPale }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>
                🏆 {leere.meilensteine}× Stille-Meilenstein erreicht
              </div>
              {leere.reflexion && <div style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.ink, marginTop: 8, lineHeight: 1.6 }}>„{leere.reflexion}“</div>}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ── Wochen-Orakel der Coachin ── */
const WOCHEN_ORAKEL = [
  { karte: "Die Quelle", icon: "💧", text: "Diese Woche geht es ums Auffüllen, nicht ums Geben. Frag dich jeden Morgen: Was brauche ich?", coach: "Ich sehe gerade so viele von euch, die für alle da sind — außer für sich. Diese Woche drehen wir das um." },
  { karte: "Der Schwellenstein", icon: "🚪", text: "Etwas endet, damit Neues beginnen kann. Steh ruhig auf der Schwelle, ohne zu drängen.", coach: "Übergänge fühlen sich selten schön an. Sie fühlen sich unfertig an. Das ist normal — bleib da." },
  { karte: "Die klare Stimme", icon: "🗣️", text: "Sprich diese Woche einmal aus, was du sonst schluckst. Ruhig, klar, ohne Rechtfertigung.", coach: "Ein Satz reicht. Du musst niemanden überzeugen, nur dich selbst hören." },
  { karte: "Der stille Garten", icon: "🌿", text: "Nicht alles muss wachsen. Manches darf einfach ruhen und Wurzeln schlagen.", coach: "Wenn du dich gerade unproduktiv fühlst: Wurzeln sieht man nicht. Sie zählen trotzdem." },
  { karte: "Das offene Fenster", icon: "🪟", text: "Eine Möglichkeit steht offen — kleiner, als du erwartet hast. Schau genau hin.", coach: "Die großen Türen sind selten. Die kleinen Fenster übersehen wir dauernd." },
];
function WochenOrakel({ wo, setWo, addPunkte }) {
  const kw = kalenderwoche();
  const karte = WOCHEN_ORAKEL[kw % WOCHEN_ORAKEL.length];
  const gesehen = wo?.kw === kw;
  const [notiz, setNotiz] = useState(wo?.kw === kw ? (wo.notiz || "") : "");
  const merken = () => {
    setWo({ kw, notiz: notiz.trim(), datum: new Date().toLocaleDateString("de-DE") });
    if (!gesehen) addPunkte(5, "Wochen-Orakel");
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Wochen-Orakel</Eyebrow>
      <H size={25}>Die Karte deiner Coachin</H>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 6 }}>Kalenderwoche {kw}</div>
      <Card style={{ margin: "16px 0 14px", textAlign: "center", background: C.goldPale }}>
        <div style={{ fontSize: 50 }}>{karte.icon}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.espresso, marginTop: 8 }}>{karte.karte}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.espresso, lineHeight: 1.7, marginTop: 12 }}>{karte.text}</div>
      </Card>
      <Card style={{ marginBottom: 14, display: "flex", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🌸</div>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Deine Coachin</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.espresso, lineHeight: 1.6, marginTop: 4 }}>„{karte.coach}“</div>
        </div>
      </Card>
      <Card>
        <Eyebrow color={C.espresso}>Was nimmst du mit?</Eyebrow>
        <textarea value={notiz} onChange={(e) => setNotiz(e.target.value)} rows={3} placeholder="Diese Woche achte ich auf …"
          style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso }} />
        <div style={{ marginTop: 10 }}><Btn full onClick={merken} disabled={!notiz.trim()}>Für diese Woche merken</Btn></div>
      </Card>
    </div>
  );
}

/* ── Wachstums-Garten ── */
function Garten({ entries, punkte, streak, traeume, zyklus, reisen, ch369 }) {
  const monat = new Date().getMonth();
  const jahreszeit = monat <= 1 || monat === 11 ? { n: "Winter", himmel: "linear-gradient(180deg,#DCE6EE,#F3F0EA)", boden: "#E8E2D8", icon: "❄️" }
    : monat <= 4 ? { n: "Frühling", himmel: "linear-gradient(180deg,#E4F0E0,#FBF6EE)", boden: "#DCE8D2", icon: "🌷" }
    : monat <= 7 ? { n: "Sommer", himmel: "linear-gradient(180deg,#FDF0D8,#FBF6EE)", boden: "#D7E4C8", icon: "☀️" }
    : { n: "Herbst", himmel: "linear-gradient(180deg,#F7E4D0,#FBF6EE)", boden: "#E2D6C0", icon: "🍂" };
  const taten = (entries?.length || 0) + (traeume?.length || 0) + (zyklus?.length || 0) + (Object.values(ch369?.archiv || {}).length || 0) + (reisen || []).reduce((s, r) => s + (r.tag || 0), 0);
  const stufen = [
    { ab: 0, e: "🌱", n: "Keimling" }, { ab: 3, e: "🌿", n: "Sprössling" }, { ab: 8, e: "☘️", n: "Junge Pflanze" },
    { ab: 15, e: "🌾", n: "Kräftig gewachsen" }, { ab: 25, e: "🌻", n: "In Blüte" }, { ab: 40, e: "🌳", n: "Fest verwurzelt" },
  ];
  const stufe = [...stufen].reverse().find((s) => taten >= s.ab);
  const naechste = stufen.find((s) => s.ab > taten);
  const pflanzen = Array.from({ length: Math.min(12, Math.max(1, Math.ceil(taten / 3))) });
  return (
    <div style={{ padding: "26px 20px" }}>
      <style>{`@keyframes sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }`}</style>
      <Eyebrow color={C.plum}>Dein Garten</Eyebrow>
      <H size={25}>Was du pflegst, wächst</H>
      <Card style={{ margin: "16px 0 14px", padding: 0, overflow: "hidden" }}>
        <div style={{ background: jahreszeit.himmel, padding: "22px 16px 0", textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 16, fontSize: 24 }}>{jahreszeit.icon}</div>
          <div style={{ fontSize: 62, marginBottom: 6 }}>{stufe.e}</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso }}>{stufe.n}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 4, marginBottom: 14 }}>{jahreszeit.n} in deinem Garten</div>
          <div style={{ background: jahreszeit.boden, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", padding: "14px 12px" }}>
            {pflanzen.map((_, i) => (
              <span key={i} style={{ fontSize: 22, animation: `sway ${2.6 + (i % 4) * 0.4}s ease-in-out ${i * 0.12}s infinite`, display: "inline-block" }}>
                {["🌱", "🌿", "☘️", "🌸", "🌼"][i % 5]}
              </span>
            ))}
          </div>
        </div>
      </Card>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.9 }}>
          🌱 {taten} Handlungen haben deinen Garten wachsen lassen<br />
          🔥 {streak} Tage Serie · ✨ {punkte} Lichtpunkte
        </div>
        {naechste && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 8, borderRadius: 5, background: C.beige, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, ((taten - stufe.ab) / (naechste.ab - stufe.ab)) * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${C.sage}, ${C.gold})` }} />
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 6 }}>
              Noch {naechste.ab - taten} Handlungen bis „{naechste.n}“ {naechste.e}
            </div>
          </div>
        )}
      </Card>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, opacity: 0.8, lineHeight: 1.6 }}>
        Jeder Journal-Eintrag, Traum, Körper-Check und Reise-Tag lässt hier etwas wachsen. Dein Garten ist echt — er zählt nur, was du wirklich getan hast.
      </div>
    </div>
  );
}

/* ── Jahres-Rückblick ── */
function Jahresrueckblick({ entries, traeume, zyklus, punkte, streak, drawn, reisen, feste }) {
  const jahr = new Date().getFullYear();
  const worte = {};
  (entries || []).forEach((e) => {
    [e.intention, ...(e.items || [])].filter(Boolean).join(" ").toLowerCase().replace(/[^a-zäöüß\s]/g, " ").split(/\s+/)
      .filter((w) => w.length > 4).forEach((w) => { worte[w] = (worte[w] || 0) + 1; });
  });
  const topWorte = Object.entries(worte).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const traumSym = {};
  (traeume || []).forEach((t) => (t.symbole || []).forEach((s) => { traumSym[s] = (traumSym[s] || 0) + 1; }));
  const topSym = Object.entries(traumSym).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const avgE = (zyklus || []).length ? ((zyklus.reduce((s, c) => s + c.energie, 0) / zyklus.length)).toFixed(1) : null;
  const fertigeReisen = (reisen || []).filter((r) => r.fertig).length;
  const leer = !(entries || []).length && !(traeume || []).length && !(zyklus || []).length;
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Rückblick</Eyebrow>
      <H size={25}>Dein Jahr in Karten & Worten</H>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 6, marginBottom: 16 }}>{jahr} · aus deinen echten Einträgen</div>
      {leer ? (
        <Card>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>
            Dein Rückblick entsteht aus dem, was du schreibst. Schreib deinen ersten Journal-Eintrag oder halte einen Traum fest — dann füllt sich diese Seite ganz von selbst.
          </div>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`, textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 44, color: C.espresso }}>{(entries || []).length}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Journal-Einträge</div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16 }}>
              {[["🌙", (traeume || []).length, "Träume"], ["🌗", (zyklus || []).length, "Checks"], ["🏆", fertigeReisen, "Reisen"], ["🔥", streak, "Tage"]].map(([i, n, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 20 }}>{i}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso }}>{n}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
          {topWorte.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <Eyebrow color={C.espresso}>Deine Worte dieses Jahres</Eyebrow>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline", marginTop: 6 }}>
                {topWorte.map(([w, n], i) => (
                  <span key={w} style={{ fontFamily: "Georgia, serif", fontSize: 26 - i * 2, color: i < 3 ? C.plum : C.ink }}>{w}</span>
                ))}
              </div>
            </Card>
          )}
          {topSym.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <Eyebrow color={C.espresso}>Deine Traumsymbole</Eyebrow>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, lineHeight: 1.9 }}>
                {topSym.map(([k, n]) => {
                  const s = TRAUM_SYMBOLE.find((x) => x.key === k);
                  return <div key={k}>{s?.icon} {k} · {n}×</div>;
                })}
              </div>
            </Card>
          )}
          <Card style={{ marginBottom: 12 }}>
            <Eyebrow color={C.espresso}>Zahlen & Zeichen</Eyebrow>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.9 }}>
              ✨ {punkte} Lichtpunkte gesammelt<br />
              {avgE && <>🌗 Ø Energie {avgE}/5 über {zyklus.length} Check-ins<br /></>}
              {drawn && <>🔮 Zuletzt gezogen: {drawn.name || drawn.titel || "deine Tageskarte"}<br /></>}
              {(feste || []).length > 0 && <>🕯️ {feste.length} Jahreskreis-Feste gefeiert</>}
            </div>
          </Card>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, opacity: 0.75, lineHeight: 1.6 }}>
            Alle Zahlen stammen ausschließlich aus deinen eigenen Einträgen — nichts ist geschätzt.
          </div>
        </>
      )}
    </div>
  );
}

/* ── App-Rahmen ── */

const ROOTS = ["heute", "orakel", "coaching", "tagebuch", "mehr"];
const TITLES = { ziele: "Ziele & Meilensteine", aufgaben: "Challenges & Ziele", kurse: "Kurse", buchen: "Termin buchen", coach: "Coach-Nachrichten", media: "Mediathek", meditation: "Meditation", podcast: "Podcast", community: "Community", fortschritt: "Fortschritt", fragebogen: "Willkommens-Fragebogen", pakete: "Coaching-Pakete", coaching: "Coaching", profil: "Mein Bereich", appguide: "App-Guide", impressum: "Impressum", datenschutz: "Datenschutz", schatten: "Schattenspiegel", zukunftsich: "Zukunfts-Ich", archetyp: "Archetypen-Test", flamme: "Gemeinsame Flamme", traum: "Traumbibliothek", zyklus: "Körper & Zyklus", kreis: "Freundinnen-Kreis", mondrituale: "Mondrituale", geocaching: "Orakel-Geocaching", intuition: "Intuitions-Training", reisen: "Transformations-Reisen", jahreskreis: "Jahreskreis", leere: "Ritual der Leere", wochenorakel: "Wochen-Orakel", garten: "Dein Garten", rueckblick: "Jahres-Rückblick" };

export default function IlhoApp() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("heute");
  const [stack, setStack] = useState([]);
  const [entries, setEntries] = useState([]);
  const [drawn, setDrawn] = useState(null);
  const [energie, setEnergie] = useState(null);
  const [lumaMsgs, setLumaMsgs] = useState([]);
  const [ritual, setRitual] = useState({});
  const [ch369, setCh369] = useState({ tag: 1, archiv: {}, letzterTag: null, fertig: false });
  const [mm, setMm] = useState([]);
  const [horo, setHoro] = useState(null);
  const [briefe, setBriefe] = useState([]);
  const [akarte, setAkarte] = useState(null);
  const [punkte, setPunkte] = useState(120);
  const [uploads, setUploads] = useState([]);
  const [prefs, setPrefs] = useState({ tiles: ["orakel", "luma", "tagebuch", "musik"] });
  const [meinZeichen, setMeinZeichen] = useState(null);
  const [pkModal, setPkModal] = useState(false);
  const [tools, setTools] = useState({ gcal: true, health: false, notion: false, spotify: false, zoom: false, whatsapp: true });
  const [kursWahl, setKursWahl] = useState([]);
  const [buchung, setBuchung] = useState(null);
  const [ziele, setZiele] = useState([
    { id: 1, titel: "Mehr Ruhe im Alltag", bereich: "Selbstfürsorge", faellig: "31.08.", warum: "Ich will abends abschalten können — ohne schlechtes Gewissen.", fortschritt: 40, meilen: [
      { t: "7 Tage Morgenritual gehalten", done: true },
      { t: "Handy-freie Stunde am Abend", done: true },
      { t: "1 Retreat-Tag gebucht", done: false },
      { t: "Wöchentlicher Journal-Rückblick", done: false },
      { t: "Grenzen bei der Arbeit gesetzt", done: false },
    ] },
    { id: 2, titel: "Selbstvertrauen stärken", bereich: "Persönlichkeit", faellig: "30.09.", warum: "Ich möchte in Meetings ruhig für meine Ideen einstehen.", fortschritt: 20, meilen: [
      { t: "Stärken-Liste erstellt", done: true },
      { t: "3 Erfolge pro Woche notiert", done: false },
      { t: "Einmal bewusst „Nein“ gesagt", done: false },
      { t: "Positive Affirmation etabliert", done: false },
      { t: "Feedback-Gespräch geführt", done: false },
    ] },
  ]);
  const [aufgaben, setAufgaben] = useState([
    { id: 1, titel: "Energie-Check heute ausfüllen", von: "coach", erledigt: false, faellig: "heute" },
    { id: 2, titel: "3-6-9 Dankbarkeit — heutige Runde abschließen", von: "coach", erledigt: false, faellig: "heute" },
    { id: 3, titel: "Brief an dein zukünftiges Ich schreiben", von: "coach", erledigt: false, faellig: "So" },
    { id: 4, titel: "Morgenmeditation gehört", von: "ich", erledigt: true, faellig: "" },
  ]);
  const [coachMsgs, setCoachMsgs] = useState([]);
  const [office, setOffice] = useState({ briefkopf: null, docs: [], kaeufe: [{ t: "Online-Retreat: Vollmond-Nacht", p: "49 €", d: "Mai 2026" }] });
  const [termine, setTermine] = useState([{ z: "09:00", t: "Morgenmeditation" }]);
  const [toast, setToast] = useState(null);
  const [alias, setAlias] = useState("");
  const [anon, setAnon] = useState(false);
  const [journalSec, setJournalSec] = useState("heute");
  const [intake, setIntake] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [ilhoOpen, setIlhoOpen] = useState(false);
  const [ilhoAktiv, setIlhoAktiv] = useState(true);
  const [archetyp, setArchetyp] = useState(null);
  const [traeume, setTraeume] = useState([]);
  const [zyklus, setZyklus] = useState([]);
  const [flamme, setFlamme] = useState(null);
  const [zkMsgs, setZkMsgs] = useState([]);
  const [sosOpen, setSosOpen] = useState(false);
  const [kreis, setKreis] = useState(null);
  const [mondrit, setMondrit] = useState(null);
  const [caches, setCaches] = useState([]);
  const [intu, setIntu] = useState(null);
  const [reisen, setReisen] = useState([]);
  const [feste, setFeste] = useState([]);
  const [leere, setLeere] = useState(null);
  const [wo, setWo] = useState(null);
  const streak = 7;

  const addPunkte = (n, label) => {
    const bonus = Math.random() < 0.18 ? [3, 5, 8][Math.floor(Math.random() * 3)] : 0;
    const neu = punkte + n + bonus;
    const ms = [120, 300, 500, 1000, 5000].find((m) => punkte < m && neu >= m);
    setPunkte(neu);
    setToast(ms ? `🎉 ${ms} Lichtpunkte — Meilenstein erreicht!` : bonus ? `+${n} ✨ ${label} · 🎁 +${bonus} Überraschung!` : `+${n} ✨ ${label}`);
    setTimeout(() => setToast(null), ms ? 3400 : bonus ? 2800 : 2200);
  };

  const name = useMemo(() => {
    if (!user) return "";
    const raw = user.split("@")[0];
    if (raw.toLowerCase().includes("google")) return "";
    const n = raw.replace(/[._\d]/g, " ").trim();
    return n ? n.charAt(0).toUpperCase() + n.slice(1).split(" ")[0] : "";
  }, [user]);

  const anzeigeName = anon ? "" : (alias.trim() || name);

  // Ein Zustand, viele Setter: von localStorage UND von Supabase genutzt, damit beide
  // Wege (offline lokal / echt in der Cloud) exakt dieselbe Struktur wiederherstellen.
  const anwendenState = (s) => {
    if (!s) return;
    if (s.user !== undefined) setUser(s.user);
    if (s.entries) setEntries(s.entries);
    if (s.ziele) setZiele(s.ziele);
    if (s.aufgaben) setAufgaben(s.aufgaben);
    if (s.energie !== undefined) setEnergie(s.energie);
    if (s.ch369) setCh369(s.ch369);
    if (s.briefe) setBriefe(s.briefe);
    if (s.mm) setMm(s.mm);
    if (typeof s.punkte === "number") setPunkte(s.punkte);
    if (s.ritual) setRitual(s.ritual);
    if (typeof s.alias === "string") setAlias(s.alias);
    if (typeof s.anon === "boolean") setAnon(s.anon);
    if (s.kursWahl) setKursWahl(s.kursWahl);
    if (s.prefs) setPrefs(s.prefs);
    if (s.meinZeichen) setMeinZeichen(s.meinZeichen);
    if (s.drawn) setDrawn(s.drawn);
    if (s.horo) setHoro(s.horo);
    if (s.akarte) setAkarte(s.akarte);
    if (s.coachMsgs) setCoachMsgs(s.coachMsgs);
    if (s.termine) setTermine(s.termine);
    if (s.lumaMsgs) setLumaMsgs(s.lumaMsgs);
    if (s.intake) setIntake(s.intake);
    if (s.checkins) setCheckins(s.checkins);
    if (typeof s.ilhoAktiv === "boolean") setIlhoAktiv(s.ilhoAktiv);
    if (s.archetyp) setArchetyp(s.archetyp);
    if (s.traeume) setTraeume(s.traeume);
    if (s.zyklus) setZyklus(s.zyklus);
    if (s.flamme) setFlamme(s.flamme);
    if (s.zkMsgs) setZkMsgs(s.zkMsgs);
    if (s.kreis) setKreis(s.kreis);
    if (s.mondrit) setMondrit(s.mondrit);
    if (s.caches) setCaches(s.caches);
    if (s.intu) setIntu(s.intu);
    if (s.reisen) setReisen(s.reisen);
    if (s.feste) setFeste(s.feste);
    if (s.leere) setLeere(s.leere);
    if (s.wo) setWo(s.wo);
  };

  // Persistenz (localStorage) — Daten überleben den Reload, auch ohne Login/Supabase.
  useEffect(() => {
    try { anwendenState(JSON.parse(localStorage.getItem("s2g_state") || "null")); } catch (e) {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("s2g_state", JSON.stringify({ user, entries, ziele, aufgaben, energie, ch369, briefe, mm, punkte, ritual, alias, anon, kursWahl, prefs, meinZeichen, drawn, horo, akarte, coachMsgs, termine, lumaMsgs, intake, checkins, ilhoAktiv, archetyp, traeume, zyklus, flamme, zkMsgs, kreis, mondrit, caches, intu, reisen, feste, leere, wo }));
    } catch (e) {}
  }, [user, entries, ziele, aufgaben, energie, ch369, briefe, mm, punkte, ritual, alias, anon, kursWahl, prefs, meinZeichen, drawn, horo, akarte, coachMsgs, termine, lumaMsgs, intake, checkins, ilhoAktiv, archetyp, traeume, zyklus, flamme, zkMsgs, kreis, mondrit, caches, intu, reisen, feste, leere, wo]);

  // Echte Supabase-Session: stellt Login nach Reload/Google-Redirect wieder her.
  // Ohne konfiguriertes Supabase (kein .env) bleibt supabase === null und hier passiert nichts —
  // die App läuft dann unverändert im Prototyp-Modus (localStorage-Login von oben).
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const sUser = data?.session?.user;
      if (sUser?.email) setUser(sUser.email);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) setUser(session.user.email);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  // Echte Cloud-Persistenz: sobald eine echte Supabase-Nutzerin eingeloggt ist, wird ihr
  // gesamter App-Zustand (Journal, Mood, Challenge, Streak, ...) geräteübergreifend geladen
  // und gespeichert — nicht mehr nur im Browser-localStorage. Fällt Supabase aus (kein .env,
  // kein Login), läuft die App unverändert im lokalen Modus weiter.
  const [cloudBereit, setCloudBereit] = useState(false);
  useEffect(() => {
    if (!supabase || !user) return;
    let aktiv = true;
    ladeAppState().then((s) => {
      if (aktiv && s) anwendenState(s);
      if (aktiv) setCloudBereit(true);
    });
    return () => { aktiv = false; };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user || !cloudBereit) return; // nichts speichern, bevor der Cloud-Stand geladen (oder als leer bestätigt) wurde
    const state = { user, entries, ziele, aufgaben, energie, ch369, briefe, mm, punkte, ritual, alias, anon, kursWahl, prefs, meinZeichen, drawn, horo, akarte, coachMsgs, termine, lumaMsgs, intake, checkins, ilhoAktiv, archetyp, traeume, zyklus, flamme, zkMsgs, kreis, mondrit, caches, intu, reisen, feste, leere, wo };
    const timer = setTimeout(() => { speichereAppState(state); }, 1200); // debounced, kein Schreiben bei jeder Mikro-Änderung
    return () => clearTimeout(timer);
  }, [user, cloudBereit, entries, ziele, aufgaben, energie, ch369, briefe, mm, punkte, ritual, alias, anon, kursWahl, prefs, meinZeichen, drawn, horo, akarte, coachMsgs, termine, lumaMsgs, intake, checkins, ilhoAktiv, archetyp, traeume, zyklus, flamme, zkMsgs, kreis, mondrit, caches, intu, reisen, feste, leere, wo]);

  const go = (next) => {
    setStack([...stack, tab]);
    setTab(next);
  };
  const goRoot = (next) => {
    setStack([]);
    if (next === "tagebuch") setJournalSec("heute");
    setTab(next);
  };
  const back = () => {
    const s = [...stack];
    const prev = s.pop() ?? "heute";
    setStack(s);
    setTab(prev);
  };

  const isSub = !ROOTS.includes(tab);

  const NAV = [
    { k: "heute", icon: "☀️", t: "Heute" },
    { k: "orakel", icon: "🔮", t: "Orakel" },
    { k: "coaching", icon: "🌸", t: "Coaching", center: true },
    { k: "tagebuch", icon: "📔", t: "Journal" },
    { k: "mehr", icon: "✦", t: "Mehr" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.beige, display: "flex", justifyContent: "center", fontSize: 16 }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 6px 18px rgba(217,110,139,.38); } 50% { box-shadow: 0 6px 30px rgba(217,110,139,.7); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes breathe { 0%,100% { transform: scale(0.58); } 50% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
      <div style={{ width: "100%", maxWidth: 430, background: C.cream, minHeight: "100vh", position: "relative", boxShadow: "0 0 40px rgba(58,42,34,.10)" }}>
        {!user ? (
          <div style={{ animation: "fadeUp .5s ease" }}><Auth onLogin={(mail, zeichen, ilho) => { setUser(mail); if (zeichen) setMeinZeichen(zeichen); if (typeof ilho === "boolean") setIlhoAktiv(ilho); }} /></div>
        ) : (
          <>
            {/* Zurück-Leiste für Unterseiten */}
            {isSub && (
              <div style={{
                position: "sticky", top: 0, zIndex: 15,
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 12px", background: "rgba(251,246,238,.95)",
                backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}`,
              }}>
                <button onClick={back} style={{
                  display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1.5px solid ${C.line}`,
                  borderRadius: 20, cursor: "pointer", color: C.plum, fontFamily: "system-ui, sans-serif",
                  fontSize: 14.5, fontWeight: 700, padding: "9px 16px", minHeight: 44,
                }}>
                  ← Zurück
                </button>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, fontWeight: 600 }}>{TITLES[tab]}</span>
              </div>
            )}

            {pkModal && (
              <PunkteModal
                punkte={punkte}
                onClose={() => setPkModal(false)}
                onEinloesen={(p, t) => { setPunkte((x) => x - p); setToast(`🎁 ${t} — eingelöst!`); setTimeout(() => setToast(null), 2600); setPkModal(false); }}
              />
            )}

            {toast && (
              <div style={{
                position: "fixed", top: 14, left: 0, right: 0, margin: "0 auto", width: "fit-content",
                zIndex: 30, background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff",
                fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700,
                padding: "11px 20px", borderRadius: 24, boxShadow: "0 8px 24px rgba(217,110,139,.45)",
                animation: "fadeUp .35s ease",
              }}>{toast}</div>
            )}

            <div key={tab} style={{ paddingBottom: tab === "luma" ? 0 : ilhoAktiv ? 172 : 86, animation: "fadeUp .45s ease" }}>
              {tab === "heute" && <><HeuteHero name={anzeigeName} punkte={punkte} /><Heute name={anzeigeName} go={go} streak={streak} punkte={punkte} addPunkte={addPunkte} termine={termine} setTermine={setTermine} prefs={prefs} setPrefs={setPrefs} ch369={ch369} meinZeichen={meinZeichen} openPunkte={() => setPkModal(true)} drawn={drawn} horo={horo} entries={entries} setJournalSec={setJournalSec} /></>}
              {tab === "orakel" && <><MediaBanner video={S2GVID.orakel} poster={S2GIMG.orakel} title="Orakel" subtitle="Zieh deine Tageskarte" /><Orakel drawn={drawn} setDrawn={setDrawn} energie={energie} horo={horo} setHoro={setHoro} addPunkte={addPunkte} setMeinZeichen={setMeinZeichen} meinZeichen={meinZeichen} briefkopf={office.briefkopf} entries={entries} setEntries={setEntries} archetyp={archetyp} /></>}
              {tab === "coaching" && <><MediaBanner video={S2GVID.coaching} poster={S2GIMG.coaching} title="Deine Begleitung" subtitle="Achtsam begleitet" /><CoachingHub go={go} /></>}
              {tab === "impressum" && <Impressum />}
              {tab === "datenschutz" && <Datenschutz />}
              {tab === "tagebuch" && <Journal entries={entries} setEntries={setEntries} ritual={ritual} setRitual={setRitual} ch369={ch369} setCh369={setCh369} mm={mm} setMm={setMm} briefe={briefe} setBriefe={setBriefe} akarte={akarte} setAkarte={setAkarte} addPunkte={addPunkte} streak={streak} punkte={punkte} initialSec={journalSec} />}
              {tab === "mehr" && <><MediaBanner video={S2GVID.mehr} poster={S2GIMG.mehr} title="Mehr" subtitle="Entdecke alle Bereiche" height={190} /><Mehr go={go} /></>}
              {tab === "ziele" && <><MediaBanner video={S2GVID.ziele} poster={S2GIMG.ziele} title="Ziele" subtitle="Deine Richtung, dein Nordstern" height={190} /><Ziele ziele={ziele} setZiele={setZiele} addPunkte={addPunkte} /></>}
              {tab === "aufgaben" && <><MediaBanner video={S2GVID.aufgaben} poster={S2GIMG.aufgaben} title="Aufgaben" subtitle="Schritt für Schritt" height={190} /><Aufgaben aufgaben={aufgaben} setAufgaben={setAufgaben} addPunkte={addPunkte} go={go} /></>}
              {tab === "appguide" && <><MediaBanner video={S2GVID.appguide} poster={S2GIMG.appguide} title="App-Guide" subtitle="Dein Wegweiser" height={190} /><AppGuide /></>}
              {tab === "kurse" && <><MediaBanner video={S2GVID.kurse} poster={S2GIMG.kurse} title="Deine Kurse" subtitle="Weiterlernen, wo du warst" height={200} /><Kurse kursWahl={kursWahl} setKursWahl={setKursWahl} addPunkte={addPunkte} /></>}
              {tab === "buchen" && <><MediaBanner video={S2GVID.buchen} poster={S2GIMG.buchen} title="Termin buchen" subtitle="Zeit für dich" height={190} /><Buchen buchung={buchung} setBuchung={setBuchung} termine={termine} setTermine={setTermine} /></>}
              {tab === "coach" && <><MediaBanner video={S2GVID.coach} poster={S2GIMG.coach} title="Coach-Chat" subtitle="Du wirst gehört" height={190} /><CoachChat msgs={coachMsgs} setMsgs={setCoachMsgs} /></>}
              {tab === "media" && <><MediaBanner video={S2GVID.mediathek} poster={S2GIMG.mediathek} title="Mediathek" subtitle="Deine Inhalte, dein Raum" height={200} /><Mediathek uploads={uploads} setUploads={setUploads} tools={tools} setTools={setTools} office={office} setOffice={setOffice} /></>}
              {tab === "meditation" && <MeditationCine addPunkte={addPunkte} />}
              {tab === "podcast" && <PodcastCine addPunkte={addPunkte} />}
              {tab === "community" && <><MediaBanner video={S2GVID.community} poster={S2GIMG.community} title="Community" subtitle="Gemeinsam leuchten" height={190} /><Community addPunkte={addPunkte} /></>}
              {tab === "fortschritt" && <><MediaBanner video={S2GVID.fortschritt} poster={S2GIMG.fortschritt} title="Mein Fortschritt" subtitle="Du wächst" height={190} /><Fortschritt streak={streak} entries={entries} punkte={punkte} energie={energie} aufgaben={aufgaben} ch369={ch369} checkins={checkins} setCheckins={setCheckins} addPunkte={addPunkte} prefs={prefs} setPrefs={setPrefs} /></>}
              {tab === "fragebogen" && <><MediaBanner video={S2GVID.fragebogen} poster={S2GIMG.fragebogen} title="Fragebogen" subtitle="Lerne dich kennen" height={190} /><Fragebogen intake={intake} setIntake={setIntake} addPunkte={addPunkte} /></>}
              {tab === "pakete" && <><MediaBanner video={S2GVID.pakete} poster={S2GIMG.pakete} title="Pakete" subtitle="Wähle dein Geschenk an dich" height={190} /><Pakete addPunkte={addPunkte} go={go} /></>}
              {tab === "profil" && <><MediaBanner video={S2GVID.profil} poster={S2GIMG.profil} title="Profil" subtitle="Dein Spiegel" height={190} /><Profil email={user} go={go} alias={alias} setAlias={setAlias} anon={anon} setAnon={setAnon} onLogout={() => { if (supabase) supabase.auth.signOut(); setUser(null); setStack([]); setTab("heute"); }} /></>}
              {tab === "coachdash" && <CoachDashboard name={anzeigeName} streak={streak} entries={entries} ch369={ch369} drawn={drawn} horo={horo} energie={energie} aufgaben={aufgaben} checkins={checkins} />}
              {tab === "coachtwin" && <CoachTwinInterview addPunkte={addPunkte} />}
              {tab === "sessionnotiz" && <SessionIntelligenz addPunkte={addPunkte} />}
              {tab === "wissen" && <WissensSuche addPunkte={addPunkte} />}
              {tab === "schatten" && <Schattenspiegel addPunkte={addPunkte} />}
              {tab === "zukunftsich" && <ZukunftsIch name={anzeigeName} entries={entries} ziele={ziele} archetyp={archetyp} msgs={zkMsgs} setMsgs={setZkMsgs} />}
              {tab === "archetyp" && <ArchetypTest archetyp={archetyp} setArchetyp={setArchetyp} addPunkte={addPunkte} />}
              {tab === "flamme" && <Flamme flamme={flamme} setFlamme={setFlamme} addPunkte={addPunkte} />}
              {tab === "traum" && <Traumbibliothek traeume={traeume} setTraeume={setTraeume} addPunkte={addPunkte} />}
              {tab === "zyklus" && <ZyklusSpiegel zyklus={zyklus} setZyklus={setZyklus} addPunkte={addPunkte} drawn={drawn} entries={entries} />}
              {tab === "kreis" && <FreundinnenKreis kreis={kreis} setKreis={setKreis} streak={streak} addPunkte={addPunkte} />}
              {tab === "mondrituale" && <Mondrituale mondrit={mondrit} setMondrit={setMondrit} addPunkte={addPunkte} />}
              {tab === "intuition" && <Intuition intu={intu} setIntu={setIntu} addPunkte={addPunkte} />}
              {tab === "reisen" && <Reisen reisen={reisen} setReisen={setReisen} addPunkte={addPunkte} />}
              {tab === "jahreskreis" && <Jahreskreis feste={feste} setFeste={setFeste} addPunkte={addPunkte} />}
              {tab === "leere" && <RitualDerLeere leere={leere} setLeere={setLeere} addPunkte={addPunkte} />}
              {tab === "wochenorakel" && <WochenOrakel wo={wo} setWo={setWo} addPunkte={addPunkte} />}
              {tab === "garten" && <Garten entries={entries} punkte={punkte} streak={streak} traeume={traeume} zyklus={zyklus} reisen={reisen} ch369={ch369} />}
              {tab === "rueckblick" && <Jahresrueckblick entries={entries} traeume={traeume} zyklus={zyklus} punkte={punkte} streak={streak} drawn={drawn} reisen={reisen} feste={feste} />}
            </div>

            <nav style={{
              position: "fixed", bottom: 0, left: 0, right: 0, margin: "0 auto", maxWidth: 430,
              background: C.card, borderTop: `1px solid ${C.line}`,
              display: "flex", justifyContent: "space-around", alignItems: "flex-end",
              padding: "8px 4px 14px", zIndex: 10,
            }}>
              {NAV.map((n) => {
                const active = tab === n.k || (n.k === "mehr" && isSub);
                if (n.center)
                  return (
                    <button key={n.k} onClick={() => goRoot(n.k)} style={{
                      background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`,
                      border: "3px solid " + C.card, cursor: "pointer",
                      width: 58, height: 58, borderRadius: "50%", marginTop: -26,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      color: "#fff", animation: "glowPulse 2.6s ease-in-out infinite",
                    }}>
                      <span style={{ fontSize: 22 }}>{n.icon}</span>
                      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, marginTop: 1 }}>{n.t}</span>
                    </button>
                  );
                return (
                  <button key={n.k} onClick={() => goRoot(n.k)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    minWidth: 56, minHeight: 50, padding: "6px 4px",
                    color: active ? C.plum : C.ink, opacity: active ? 1 : 0.7,
                  }}>
                    <span style={{ fontSize: 21 }}>{n.icon}</span>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, fontWeight: active ? 700 : 500, letterSpacing: 0.3 }}>{n.t}</span>
                    {active && <span style={{ width: 16, height: 2.5, borderRadius: 2, background: C.rose }} />}
                  </button>
                );
              })}
            </nav>

            {/* S.O.S. — immer sichtbarer Halt-Button (unten links) */}
            {!sosOpen && (
              <div style={{ position: "fixed", left: 0, right: 0, top: 0, bottom: 0, margin: "0 auto", maxWidth: 430, pointerEvents: "none", zIndex: 21 }}>
                <button onClick={() => setSosOpen(true)} style={{
                  position: "absolute", left: 16, bottom: 96, pointerEvents: "auto",
                  borderRadius: 22, cursor: "pointer", padding: "10px 14px",
                  background: C.card, border: `2px solid ${C.rose}`, color: C.plum,
                  fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700,
                  boxShadow: "0 6px 18px rgba(58,42,34,.18)",
                }}>🤍 Halt</button>
              </div>
            )}
            {sosOpen && <SOSOverlay onClose={() => setSosOpen(false)} entries={entries} setEntries={setEntries} addPunkte={addPunkte} archetyp={archetyp} />}

            {/* ilho — schwebender Chat-Begleiter (unten rechts) */}
            {ilhoAktiv && (
              <div style={{ position: "fixed", left: 0, right: 0, top: 0, bottom: 0, margin: "0 auto", maxWidth: 430, pointerEvents: "none", zIndex: ilhoOpen ? 26 : 22 }}>
                {!ilhoOpen && (
                  <button onClick={() => setIlhoOpen(true)} style={{
                    position: "absolute", right: 16, bottom: 96, pointerEvents: "auto",
                    width: 58, height: 58, borderRadius: "50%", cursor: "pointer",
                    background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, border: "3px solid " + C.card, color: "#fff",
                    boxShadow: "0 8px 24px rgba(217,110,139,.45)", animation: "glowPulse 2.6s ease-in-out infinite",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 21 }}>✨</span>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 8.5, fontWeight: 700 }}>ilho</span>
                  </button>
                )}
                {ilhoOpen && (
                  <>
                    <div onClick={() => setIlhoOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(58,42,34,.35)", backdropFilter: "blur(2px)", pointerEvents: "auto" }} />
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, pointerEvents: "auto", background: C.cream, borderRadius: "22px 22px 0 0", maxHeight: "82vh", overflowY: "auto", boxShadow: "0 -8px 30px rgba(58,42,34,.22)", animation: "fadeUp .3s ease" }}>
                      <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: C.cream, borderBottom: `1px solid ${C.line}` }}>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso }}>✨ ilho · dein Begleiter</div>
                        <button onClick={() => setIlhoOpen(false)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: "50%", width: 34, height: 34, fontSize: 15, cursor: "pointer", color: C.ink }}>✕</button>
                      </div>
                      <Luma name={anzeigeName} energie={energie} msgs={lumaMsgs} setMsgs={setLumaMsgs} />
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
