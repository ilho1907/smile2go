const INTERVENTIONS = [
  {
    id: "atmung-46",
    approach: "dbt",
    title: "4-6-Atmung",
    subtitle: "Nervensystem beruhigen",
    durationMin: 2,
    intensityRange: [4, 10],
    goals: ["beruhigen"],
    indication: ["hohe Anspannung", "Stress", "\xC4rger"],
    contraindication: ["Atemnot \u2014 dann Grounding w\xE4hlen"],
    steps: [
      { title: "Ankommen", text: "Setze oder lehne dich bequem hin. Ein Fu\xDF fest am Boden.", seconds: 10 },
      { title: "Einatmen", text: "Atme durch die Nase ein und z\xE4hle langsam bis 4.", seconds: 20 },
      { title: "Ausatmen", text: "Atme durch den Mund aus und z\xE4hle bis 6. Das lange Ausatmen beruhigt.", seconds: 30 },
      { title: "Wiederholen", text: "Weiter im eigenen Rhythmus: 4 ein, 6 aus. Gedanken d\xFCrfen kommen und gehen.", seconds: 50 },
      { title: "Nachsp\xFCren", text: "Einmal tief durchatmen. Wie f\xFChlt sich dein K\xF6rper jetzt an?", seconds: 10 }
    ]
  },
  {
    id: "grounding-54321",
    approach: "dbt",
    title: "5-4-3-2-1 Grounding",
    subtitle: "Zur\xFCck ins Hier und Jetzt",
    durationMin: 3,
    intensityRange: [6, 10],
    goals: ["beruhigen", "verstehen"],
    indication: ["\xDCberw\xE4ltigung", "Panik-Gef\xFChl", "Gedankenkreisen"],
    contraindication: [],
    steps: [
      { title: "5 Dinge sehen", text: "Nenne still 5 Dinge, die du gerade sehen kannst.", seconds: 30 },
      { title: "4 Dinge h\xF6ren", text: "Nenne 4 Ger\xE4usche, die du wahrnimmst.", seconds: 25 },
      { title: "3 Dinge sp\xFCren", text: "Sp\xFCre 3 Ber\xFChrungen: Boden, Stoff, Luft auf der Haut.", seconds: 25 },
      { title: "2 Dinge riechen", text: "Nimm 2 Ger\xFCche wahr \u2014 oder erinnere dich an 2, die du magst.", seconds: 20 },
      { title: "1 Ding schmecken", text: "Nimm 1 Geschmack wahr. Dann einmal tief ausatmen.", seconds: 20 }
    ]
  },
  {
    id: "sicherer-ort",
    approach: "dbt",
    title: "Sicherer Ort",
    subtitle: "Imagination zur Stabilisierung",
    durationMin: 4,
    intensityRange: [5, 10],
    goals: ["beruhigen"],
    indication: ["innere Unruhe", "Belastung"],
    contraindication: [],
    steps: [
      { title: "Ort w\xE4hlen", text: "Denke an einen Ort, an dem du dich sicher f\xFChlst \u2014 echt oder erdacht.", seconds: 20 },
      { title: "Details sehen", text: "Was siehst du dort? Farben, Licht, Formen.", seconds: 30 },
      { title: "H\xF6ren & Riechen", text: "Welche Ger\xE4usche und Ger\xFCche geh\xF6ren zu diesem Ort?", seconds: 30 },
      { title: "Sp\xFCren", text: "Wie f\xFChlt sich dein K\xF6rper an diesem Ort an? Bleibe noch ein paar Atemz\xFCge.", seconds: 40 },
      { title: "Anker", text: "Sag innerlich: \u201EIch kann hierher zur\xFCckkehren, wann ich will.\u201C", seconds: 15 }
    ]
  },
  {
    id: "koerperscan",
    approach: "mindfulness",
    title: "Kurzer K\xF6rperscan",
    subtitle: "Gef\xFChl im K\xF6rper orten",
    durationMin: 3,
    intensityRange: [0, 10],
    goals: ["verstehen"],
    indication: ["Unklarheit \xFCber das Gef\xFChl", "Dumpfheit"],
    contraindication: [],
    steps: [
      { title: "Haltung", text: "Sitz oder Stand, Blick ruhig nach unten oder geschlossen.", seconds: 10 },
      { title: "Kopf & Gesicht", text: "Scanne Kiefer, Stirn, Augen. Anspannung? Weichheit?", seconds: 30 },
      { title: "Brust & Bauch", text: "Wie f\xFChlt sich der Atem an? Eng, weit, flach?", seconds: 30 },
      { title: "H\xE4nde & Beine", text: "W\xE4rme, Kribbeln, Schwere \u2014 nur wahrnehmen, nicht bewerten.", seconds: 30 },
      { title: "Benennen", text: "Wo sitzt das Gef\xFChl am st\xE4rksten? Welches Wort passt dazu?", seconds: 20 }
    ]
  },
  {
    id: "blaetter-bach",
    approach: "act",
    title: "Bl\xE4tter im Bach",
    subtitle: "Gedanken ziehen lassen",
    durationMin: 4,
    intensityRange: [3, 10],
    goals: ["verstehen", "beruhigen"],
    indication: ["Gr\xFCbeln", "Gedankenkreisen"],
    contraindication: [],
    steps: [
      { title: "Bild aufbauen", text: "Stell dir einen ruhigen Bach vor. Bl\xE4tter treiben auf dem Wasser.", seconds: 20 },
      { title: "Gedanken legen", text: "Jeder Gedanke, der kommt, wird auf ein Blatt gelegt.", seconds: 40 },
      { title: "Ziehen lassen", text: "Beobachte, wie das Blatt mit dem Gedanken davontreibt. Nichts festhalten.", seconds: 60 },
      { title: "Zur\xFCckkommen", text: "Wenn du dich verlierst: freundlich zur\xFCck zum Bach. Das ist die \xDCbung.", seconds: 40 },
      { title: "Abschluss", text: "Ein tiefer Atemzug. Welcher Gedanke durfte gerade weiterziehen?", seconds: 20 }
    ]
  },
  {
    id: "wertekompass",
    approach: "act",
    title: "Wertekompass",
    subtitle: "Was ist mir wichtig?",
    durationMin: 5,
    intensityRange: [0, 8],
    goals: ["handeln", "verstehen"],
    indication: ["Orientierungslosigkeit", "Entscheidung"],
    contraindication: [],
    steps: [
      { title: "Bereich w\xE4hlen", text: "W\xE4hle einen Lebensbereich: Beziehung, Arbeit, Gesundheit oder Freizeit.", seconds: 15 },
      { title: "Wert finden", text: "Was ist dir dort wirklich wichtig? Ein Wort: z. B. Ehrlichkeit, Wachstum, F\xFCrsorge.", seconds: 40 },
      { title: "Richtung pr\xFCfen", text: "Lebst du diesen Wert gerade \u2014 eher ja oder eher nein?", seconds: 30 },
      { title: "Kleiner Schritt", text: "Was w\xE4re der kleinste Schritt heute in diese Richtung?", seconds: 40 },
      { title: "Festhalten", text: "Notiere den Schritt innerlich oder in deiner Notiz.", seconds: 15 }
    ]
  },
  {
    id: "gedankenprotokoll",
    approach: "cbt",
    title: "Gedankenprotokoll",
    subtitle: "Situation \u2013 Gedanke \u2013 Gef\xFChl",
    durationMin: 6,
    intensityRange: [0, 6],
    goals: ["loesen", "verstehen"],
    indication: ["belastender Gedanke", "Katastrophisieren"],
    contraindication: ["sehr hohe Erregung \u2014 erst stabilisieren"],
    steps: [
      { title: "Situation", text: "Was ist passiert? Nur die Fakten, wie eine Kamera sie filmen w\xFCrde.", seconds: 30 },
      { title: "Gedanke", text: "Welcher Satz ging dir durch den Kopf?", seconds: 30 },
      { title: "Gef\xFChl", text: "Welches Gef\xFChl l\xF6st dieser Gedanke aus? Wie stark (0\u201310)?", seconds: 30 },
      { title: "Beweise daf\xFCr", text: "Was spricht f\xFCr den Gedanken?", seconds: 40 },
      { title: "Beweise dagegen", text: "Was spricht dagegen? Was w\xFCrdest du einem Freund sagen?", seconds: 40 },
      { title: "Alternative", text: "Formuliere einen ausgewogeneren Gedanken. Gef\xFChl neu bewerten.", seconds: 30 }
    ]
  },
  {
    id: "drei-perspektiven",
    approach: "cbt",
    title: "Drei Erkl\xE4rungen",
    subtitle: "Deutungsspielraum \xF6ffnen",
    durationMin: 4,
    intensityRange: [0, 7],
    goals: ["loesen"],
    indication: ["einseitige Interpretation"],
    contraindication: [],
    steps: [
      { title: "Deutung notieren", text: "Wie erkl\xE4rst du dir die Situation gerade?", seconds: 25 },
      { title: "Alternative 1", text: "Finde eine zweite, neutrale Erkl\xE4rung.", seconds: 30 },
      { title: "Alternative 2", text: "Finde eine dritte, wohlwollendere Erkl\xE4rung.", seconds: 30 },
      { title: "Vergleichen", text: "Welche Erkl\xE4rung hat die besten Belege? Welche hilft dir weiter?", seconds: 30 }
    ]
  },
  {
    id: "kleiner-schritt",
    approach: "ba",
    title: "Ein kleiner Schritt",
    subtitle: "Aktivierung bei Antriebslosigkeit",
    durationMin: 3,
    intensityRange: [0, 8],
    goals: ["handeln"],
    indication: ["R\xFCckzug", "niedrige Energie", "Antriebslosigkeit"],
    contraindication: [],
    steps: [
      { title: "Liste \xF6ffnen", text: "Denke an 3 Dinge, die dir fr\xFCher guttaten: kurzer Spaziergang, Musik, Dusche, Nachricht an jemanden.", seconds: 30 },
      { title: "Kleinster Schritt", text: "W\xE4hle den kleinsten machbaren Schritt \u2014 so klein, dass er fast l\xE4cherlich ist.", seconds: 30 },
      { title: "Zeitpunkt", text: "Wann genau heute? \u201ENach dem Kaffee\u201C, \u201Eum 18 Uhr\u201C.", seconds: 25 },
      { title: "H\xFCrde senken", text: "Was k\xF6nnte dich stoppen? Mach den Schritt noch einfacher.", seconds: 25 },
      { title: "Verabredung", text: "Sag innerlich: \u201EIch probiere es aus \u2014 Bewertung kommt danach.\u201C", seconds: 10 }
    ]
  },
  {
    id: "waage",
    approach: "mi",
    title: "Waage der Ver\xE4nderung",
    subtitle: "Ambivalenz sortieren",
    durationMin: 3,
    intensityRange: [0, 8],
    goals: ["loesen", "handeln"],
    indication: ["Unentschlossenheit", "Hin- und Hergerissensein"],
    contraindication: [],
    steps: [
      { title: "Entscheidung", text: "Welche Entscheidung besch\xE4ftigt dich?", seconds: 20 },
      { title: "Daf\xFCr", text: "Was spricht f\xFCr eine Ver\xE4nderung? 2\u20133 Punkte.", seconds: 40 },
      { title: "Dagegen", text: "Was spricht dagegen? Auch das darf sein.", seconds: 40 },
      { title: "Dein Wille", text: "Wenn niemand etwas erwarten w\xFCrde: Was willst DU?", seconds: 40 },
      { title: "N\xE4chster Mini-Schritt", text: "Gib der Richtung eine Zahl 0\u201310 und w\xE4hle einen Mini-Schritt.", seconds: 20 }
    ]
  },
  {
    id: "gwb-nachricht",
    approach: "nvc",
    title: "Nachricht vorbereiten",
    subtitle: "Gewaltfreie Kommunikation",
    durationMin: 6,
    intensityRange: [3, 9],
    goals: ["ausdruecken"],
    indication: ["Konflikt", "schwieriges Gespr\xE4ch"],
    contraindication: [],
    steps: [
      { title: "Beobachtung", text: "Was ist passiert \u2014 ohne Bewertung? \u201EAls ich in der Runde unterbrochen wurde \u2026\u201C", seconds: 40 },
      { title: "Gef\xFChl", text: "Welches Gef\xFChl l\xF6st das aus? Nutze deine Check-in-Worte.", seconds: 30 },
      { title: "Bed\xFCrfnis", text: "Welches Bed\xFCrfnis steckt dahinter? Z. B. Respekt, Klarheit, Unterst\xFCtzung.", seconds: 40 },
      { title: "Bitte", text: "Formuliere eine konkrete, machbare Bitte: \u201EK\xF6nntest du mich ausreden lassen?\u201C", seconds: 40 },
      { title: "Probe", text: "Lies die Nachricht einmal still durch. Klingt sie wie du?", seconds: 30 }
    ]
  },
  {
    id: "freundliche-stimme",
    approach: "act",
    title: "Freundliche Stimme",
    subtitle: "Selbstmitgef\xFChl",
    durationMin: 3,
    intensityRange: [2, 10],
    goals: ["beruhigen", "verstehen"],
    indication: ["Selbstkritik", "Scham", "Schuld"],
    contraindication: [],
    steps: [
      { title: "Innere Kritik", text: "Was sagt dein innerer Kritiker gerade?", seconds: 25 },
      { title: "Freund-Perspektive", text: "Was w\xFCrde ein guter Freund/eine gute Freundin dazu sagen?", seconds: 40 },
      { title: "Umschreiben", text: "Formuliere den Satz so, wie du ihn zu jemandem sagen w\xFCrdest, den du magst.", seconds: 40 },
      { title: "Hand aufs Herz", text: "Lege eine Hand auf die Brust und sprich den Satz langsam innerlich aus.", seconds: 30 }
    ]
  },
  {
    id: "drei-gute-dinge",
    approach: "dankbarkeit",
    title: "Drei gute Dinge",
    subtitle: "Tagesabschluss",
    durationMin: 2,
    intensityRange: [0, 10],
    goals: ["verstehen", "beruhigen"],
    indication: ["Tagesr\xFCckblick", "positiver Fokus"],
    contraindication: [],
    steps: [
      { title: "Ding 1", text: "Nenne eine Sache, die heute gut war \u2014 auch winzig kleine z\xE4hlen.", seconds: 25 },
      { title: "Ding 2", text: "Nenne eine zweite. Warum war sie gut?", seconds: 25 },
      { title: "Ding 3", text: "Nenne eine dritte. Was hast du dazu beigetragen?", seconds: 25 },
      { title: "Nachwirken", text: "Sp\xFCre kurz nach. Dankbarkeit darf leise sein.", seconds: 15 }
    ]
  },
  {
    id: "stop-skill",
    approach: "dbt",
    title: "STOP-Skill",
    subtitle: "Notbremse vor Impulsen",
    durationMin: 2,
    intensityRange: [7, 10],
    goals: ["beruhigen"],
    indication: ["Impuls", "Eskalation im Gespr\xE4ch"],
    contraindication: [],
    steps: [
      { title: "S \u2014 Stopp", text: "Bleib stehen. Sag nichts, tu nichts. H\xE4nde still.", seconds: 15 },
      { title: "T \u2014 Tritt zur\xFCck", text: "Atme einmal tief aus. Mach k\xF6rperlich einen Schritt zur\xFCck.", seconds: 20 },
      { title: "O \u2014 Observe", text: "Was nehme ich wahr? Was f\xFChle ich? Was will ich gleich tun?", seconds: 30 },
      { title: "P \u2014 Plane", text: "Was hilft JETZT: Pause sagen, rausgehen, Wasser trinken?", seconds: 30 }
    ]
  },
  {
    id: "schwere-ablaufen",
    approach: "mindfulness",
    title: "Ankommen im Moment",
    subtitle: "Mini-Pause zwischen Terminen",
    durationMin: 1,
    intensityRange: [0, 10],
    goals: ["beruhigen"],
    indication: ["\xDCbergang", "kurze Pause"],
    contraindication: [],
    steps: [
      { title: "F\xFC\xDFe sp\xFCren", text: "Sp\xFCre den Kontakt deiner F\xFC\xDFe mit dem Boden.", seconds: 20 },
      { title: "Ein Atemzug", text: "Einmal bewusst ein- und ausatmen.", seconds: 15 },
      { title: "Blick heben", text: "Schaue bewusst auf einen Punkt im Raum. Fertig.", seconds: 15 }
    ]
  }
];
const APPROACH_LABELS = {
  dbt: "Stabilisierung",
  cbt: "Gedankenarbeit",
  ba: "Aktivierung",
  act: "Akzeptanz & Werte",
  mi: "Entscheidung",
  nvc: "Kommunikation",
  mindfulness: "Achtsamkeit",
  dankbarkeit: "Dankbarkeit"
};
export {
  APPROACH_LABELS,
  INTERVENTIONS
};
