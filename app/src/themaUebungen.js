// themaUebungen.js — smile2go
// Drei Übungen pro Thema für die Themenseiten (Abschnitt „Übungen“).
// Quelle und Begründungen: Doc „smile2go – Übungen pro Thema (evidenzbasiert)“, 20.11.2026.
// Regel: Methoden nur als „angelehnt an …“ — keine Therapie.

export const THEMA_UEBUNGEN = {
  trauer: [
    {
      t: "Pendeln zwischen Trauer und Leben", dauer: "10 Min. + über den Tag",
      ansatz: "Duales Prozessmodell (Stroebe & Schut)",
      schritte: [
        "Teile ein Blatt in zwei Spalten: „Zeit für meine Trauer“ und „Zeit für mein Leben“.",
        "Links: etwas, das deiner Trauer Raum gibt — Fotos ansehen, weinen, ans Grab gehen.",
        "Rechts: etwas, das dein Leben weiterträgt — eine Aufgabe, ein Spaziergang, ein Anruf.",
        "Plane heute bewusst beides ein. Abends: Was war heute dran?",
        "Ablenkung ist kein Verrat — und Traurigsein ist kein Rückschritt.",
      ],
      warum: "Gesunde Trauer pendelt zwischen Verlust und Neuorientierung. Schwierig wird es, wenn man nur auf einer Seite feststeckt.",
    },
    {
      t: "Ein Brief an den Menschen, der fehlt", dauer: "20 Min.",
      ansatz: "Continuing Bonds · Schreiben in der Trauerbegleitung",
      schritte: [
        "Such dir einen ruhigen Moment und beginne mit „Liebe/r …“.",
        "Was ich dir noch sagen wollte … · Was ich von dir mitnehme … · Wo du heute noch in meinem Leben bist …",
        "Behalte den Brief oder gestalte ein kleines Ritual, etwa mit einer Kerze.",
      ],
      warum: "Briefe an Verstorbene helfen, Unausgesprochenes auszudrücken und eine Verbindung zu bewahren.",
      hinweis: "Verfolgen dich belastende Bilder vom Tod selbst, ist zuerst professionelle Begleitung der bessere Schritt.",
    },
    {
      t: "Meine Erinnerungsschatzkiste", dauer: "15 Min.",
      ansatz: "Erinnerungsarbeit in der Trauerbegleitung",
      schritte: [
        "Notiere drei Erinnerungen: eine schöne, eine lustige, eine schwierige.",
        "Schreibe zu jeder: Was habe ich gesehen, gehört, gefühlt?",
        "Leg ein Foto oder einen Gegenstand dazu — im Tagebuch oder in einer echten Kiste.",
      ],
      warum: "Ein ehrliches, ganzes Bild der Beziehung erleichtert es, den Verlust ins eigene Leben einzufügen.",
    },
  ],
  trennung: [
    {
      t: "Die Selbstmitgefühls-Pause", dauer: "3 Min.",
      ansatz: "Mindful Self-Compassion (Neff)",
      schritte: [
        "Leg eine Hand aufs Herz.",
        "Sag dir leise: „Das ist gerade ein Moment des Schmerzes.“",
        "„Ich bin damit nicht allein — viele Menschen erleben das.“",
        "„Möge ich jetzt gut zu mir sein.“",
      ],
      warum: "Bei über 100 Geschiedenen sagte Selbstmitgefühl weniger Belastung voraus — noch neun Monate später (Sbarra u. a., 2012).",
    },
    {
      t: "Vier Tage Schreiben", dauer: "4 Tage à 15–20 Min.",
      ansatz: "Expressives Schreiben (Pennebaker)",
      schritte: [
        "Schreibe an vier Tagen hintereinander 15–20 Minuten ohne Pause über die Trennung.",
        "Schreib deine tiefsten Gedanken und Gefühle auf — Rechtschreibung egal, niemand liest mit.",
        "Ab Tag 3: Was verstehe ich jetzt anders? Was nehme ich mit?",
      ],
      warum: "Studien zeigen kleine, aber messbare Effekte auf Stress und Niedergeschlagenheit — oft verzögert, dafür anhaltend. Der erste Tag darf sich schwer anfühlen.",
    },
    {
      t: "Den Blick neu ausrichten", dauer: "10 Min.",
      ansatz: "Forschung zur Neubewertung bei Liebeskummer (Langeslag)",
      schritte: [
        "Liste 5 Dinge, die in der Beziehung nicht gepasst haben — ohne die Person abzuwerten.",
        "Liste 5 Dinge, die du jetzt gewinnst: Zeit, Freundinnen, Freiheit, eigene Pläne.",
        "Lies beide Listen, wenn die Sehnsucht stark wird.",
      ],
      warum: "Der kritische Blick auf den Ex senkt Verliebtheit, kann aber die Stimmung drücken — darum immer mit dem Blick auf das, was du gewinnst.",
    },
  ],
  beziehung: [
    {
      t: "Hinwenden statt Wegdrehen", dauer: "1 Woche im Alltag",
      ansatz: "Gottman-Forschung („bids for connection“)",
      schritte: [
        "Achte eine Woche lang auf kleine Kontaktangebote: ein Kommentar, ein Blick, „Schau mal …“.",
        "Reagiere bewusst zugewandt — schon ein „Oh, schön!“ zählt.",
        "Notiere abends: Wie oft habe ich mich hingewendet, wie oft etwas verpasst?",
      ],
      warum: "Paare, die nach sechs Jahren noch zusammen waren, hatten sich in 86 % der Fälle zugewandt — getrennte Paare nur in 33 %.",
    },
    {
      t: "Freude richtig teilen", dauer: "im Alltag",
      ansatz: "Capitalization-Forschung (Gable)",
      schritte: [
        "Erzählt dein Partner etwas Gutes: aktiv und begeistert reagieren.",
        "Nachfragen: „Wie war das genau? Wie hast du dich gefühlt?“",
        "Vermeide: abwesend nicken, aufs eigene Thema wechseln oder den Haken suchen.",
      ],
      warum: "Begeisterte Reaktionen auf gute Nachrichten stärken Wohlbefinden und Beziehung — bei beiden.",
    },
    {
      t: "Die Liebeslandkarte", dauer: "15 Min. pro Woche",
      ansatz: "„Love Maps“ (Gottman)",
      schritte: [
        "Stellt euch abwechselnd drei Fragen: Was beschäftigt dich gerade am meisten? Wovon träumst du in diesem Jahr? Was hat dir diese Woche gutgetan?",
        "Nur zuhören — nicht bewerten, keine Lösungen anbieten.",
        "Zum Schluss: eine Sache, die du an deinem Gegenüber schätzt.",
      ],
      warum: "Die innere Welt des anderen zu kennen, ist ein Grundpfeiler stabiler Beziehungen.",
    },
  ],
  selbstwert: [
    {
      t: "Ein Brief von einer liebevollen Freundin", dauer: "15 Min.",
      ansatz: "Selbstmitgefühl (Neff, Gilbert)",
      schritte: [
        "Denk an etwas, wofür du dich kritisierst.",
        "Stell dir eine Freundin vor, die dich bedingungslos annimmt und deine Geschichte kennt.",
        "Schreib aus ihrer Sicht einen Brief an dich — verständnisvoll, ehrlich, ermutigend.",
        "Lies ihn am nächsten Tag noch einmal.",
      ],
      warum: "27 randomisierte Studien zeigen: Selbstmitgefühls-Übungen verbessern viele Bereiche des Wohlbefindens.",
    },
    {
      t: "Was mir wirklich wichtig ist", dauer: "10 Min.",
      ansatz: "Self-Affirmation (Cohen & Sherman)",
      schritte: [
        "Wähle den Wert, der dir am wichtigsten ist: Familie, Freundschaft, Kreativität, Spiritualität, Ehrlichkeit, Freiheit, Fürsorge, Lernen.",
        "Schreib 10 Minuten: Warum ist er dir wichtig? Wann hast du zuletzt danach gelebt?",
      ],
      warum: "Eine große Auswertung mit über 17.000 Menschen zeigt kleine, aber messbare Verbesserungen im Wohlbefinden.",
    },
    {
      t: "Der Gedanken-Check", dauer: "10 Min.",
      ansatz: "Kognitive Verhaltenstherapie (Gedankenprotokoll)",
      schritte: [
        "Situation: Was ist passiert?",
        "Gedanke: Was habe ich über mich gedacht? (z. B. „Ich bin nicht gut genug.“)",
        "Was spricht dafür? Was spricht dagegen?",
        "Finde einen ausgewogenen Satz, der beides berücksichtigt.",
        "Wie stark glaubst du dem alten Gedanken jetzt (0–100)?",
      ],
      warum: "Gedanken prüfen statt sie für Tatsachen zu halten — ein Kernwerkzeug der KVT.",
    },
  ],
  grenzen: [
    {
      t: "DEAR MAN — klar sagen, was ich brauche", dauer: "10 Min. Vorbereitung",
      ansatz: "Dialektisch-Behaviorale Therapie (Linehan)",
      schritte: [
        "Beschreiben: die Situation sachlich, ohne Vorwurf.",
        "Ausdrücken: wie es dir damit geht („Ich fühle mich …“).",
        "Behaupten: klar sagen, was du willst — oder Nein sagen.",
        "Bestärken: was der andere davon hat.",
        "Beim Thema bleiben, selbstsicher auftreten, verhandeln, wenn nötig.",
      ],
      warum: "Ein strukturiertes Selbstbehauptungstraining — fürs Bitten, fürs Neinsagen und für schwierige Gespräche.",
    },
    {
      t: "Die Grenzen-Landkarte", dauer: "1 Woche",
      ansatz: "Selbstbeobachtung in der Verhaltenstherapie",
      schritte: [
        "Notiere jeden Moment, in dem du Groll, Erschöpfung oder ein „Ja“ spürst, das eigentlich ein „Nein“ war.",
        "Wer? Wobei? Was hätte ich gebraucht?",
        "Am Ende der Woche: Welches Muster wiederholt sich? Dort beginnt deine erste Grenze.",
      ],
      warum: "Groll und Erschöpfung sind oft Signale für überschrittene Grenzen.",
    },
    {
      t: "Die freundliche Schallplatte", dauer: "5 Min. üben",
      ansatz: "Selbstsicherheitstraining („broken record“)",
      schritte: [
        "Formuliere einen kurzen Satz: „Das passt für mich nicht.“",
        "Übe ihn laut vor dem Spiegel.",
        "Drängt jemand: denselben Satz ruhig wiederholen, ohne neue Rechtfertigungen.",
      ],
      warum: "Wer sich nicht rechtfertigt, bietet weniger Angriffsfläche und bleibt beim eigenen Ziel.",
    },
  ],
  neuanfang: [
    {
      t: "Mein bestmögliches Selbst", dauer: "15–20 Min.",
      ansatz: "„Best Possible Self“ (Positive Psychologie)",
      schritte: [
        "Stell dir dein Leben in einem Jahr vor — du hast dich angestrengt, und es ist so gut gelaufen wie möglich.",
        "Schreib darüber: Wo lebst du, was tust du, wer ist um dich, wie fühlst du dich?",
        "Unterstreiche einen Satz, der dich besonders berührt.",
      ],
      warum: "29 Studien zeigen mehr Wohlbefinden und Optimismus — stärker als bei anderen Optimismus-Übungen.",
    },
    {
      t: "WOOP — Wunsch, Ergebnis, Hindernis, Plan", dauer: "5–10 Min.",
      ansatz: "Mental Contrasting mit Wenn-Dann-Plänen (Oettingen)",
      schritte: [
        "Wunsch: Was möchte ich in den nächsten Wochen erreichen?",
        "Ergebnis: Wie fühlt es sich an, wenn es geklappt hat?",
        "Hindernis: Was in mir selbst hält mich am ehesten auf?",
        "Plan: „Wenn [Hindernis], dann [konkrete Handlung].“",
      ],
      warum: "Auswertungen mit über 15.000 Menschen zeigen: eine kurze, wirksame Strategie, um Ziele zu erreichen.",
    },
    {
      t: "Werte-Kompass und kleinster Schritt", dauer: "10 Min.",
      ansatz: "Akzeptanz- und Commitment-Therapie (ACT)",
      schritte: [
        "Wähle drei Werte für deinen neuen Lebensabschnitt.",
        "Für jeden Wert: Welcher winzige Schritt geht in den nächsten 24 Stunden?",
        "Tu einen davon.",
      ],
      warum: "Handeln nach den eigenen Werten gibt Richtung, auch wenn noch nicht alles klar ist.",
    },
  ],
  geld: [
    {
      t: "Meine Geldgeschichte", dauer: "20 Min.",
      ansatz: "„Money Scripts“ (Klontz, Finanztherapie)",
      schritte: [
        "Was ist meine früheste Erinnerung an Geld?",
        "Was wurde in meiner Familie über Geld gesagt — und was nicht?",
        "Welcher Satz steuert mich heute noch? (z. B. „Ich verdiene das nicht.“)",
        "Formuliere einen neuen, freundlicheren Satz.",
      ],
      warum: "Unbewusste Geld-Glaubenssätze entstehen oft in der Kindheit und prägen heutige Entscheidungen.",
    },
    {
      t: "Geben, das glücklich macht", dauer: "1 Woche",
      ansatz: "Forschung zu prosozialem Geldausgeben (Dunn, Aknin, Norton)",
      schritte: [
        "Gib diese Woche einen kleinen Betrag bewusst für jemand anderen aus — ein Kaffee, eine Blume, eine Spende.",
        "Am besten für jemanden, mit dem du dich verbunden fühlst, und so, dass du die Wirkung siehst.",
        "Notiere danach, wie du dich fühlst.",
      ],
      warum: "Ausgaben für andere machen nachweislich glücklicher als Ausgaben für sich selbst — der Effekt ist klein, aber stabil.",
    },
    {
      t: "Was schon da ist", dauer: "5 Min. täglich",
      ansatz: "Dankbarkeitsübungen der Positiven Psychologie",
      schritte: [
        "Notiere jeden Abend drei Dinge, die heute schon genug waren.",
        "Schreib zu einem davon einen Satz: Warum ist es geschehen?",
      ],
      warum: "Fülle beginnt mit Aufmerksamkeit für das, was schon da ist — ohne Druck.",
    },
  ],
  loslassen: [
    {
      t: "„Ich habe den Gedanken, dass …“", dauer: "3 Min.",
      ansatz: "Kognitive Defusion (ACT)",
      schritte: [
        "Nimm einen quälenden Gedanken, z. B. „Ich hätte das verhindern müssen.“",
        "Sag stattdessen: „Ich habe den Gedanken, dass ich das hätte verhindern müssen.“",
        "Variante: Ein belastendes Wort 30 Sekunden laut wiederholen, bis es nur noch ein Klang ist.",
      ],
      warum: "Studien zeigen: So verlieren negative Gedanken über sich selbst an Glaubwürdigkeit und Schwere.",
    },
    {
      t: "Blätter auf dem Fluss", dauer: "5–10 Min.",
      ansatz: "ACT-Achtsamkeitsübung",
      schritte: [
        "Stell dir einen Fluss vor, auf dem Blätter treiben.",
        "Jeden Gedanken, der auftaucht, legst du auf ein Blatt und lässt ihn vorbeiziehen.",
        "Bleibst du hängen: freundlich bemerken und zurück zum Fluss.",
      ],
      warum: "Du übst, Gedanken zu beobachten, statt in ihnen zu versinken.",
    },
    {
      t: "Mein Einfluss-Kreis", dauer: "10 Min.",
      ansatz: "Problemlösen und Akzeptanz (Verhaltenstherapie)",
      schritte: [
        "Zeichne zwei Kreise ineinander.",
        "Innen: Was kann ich beeinflussen? Außen: Was nicht?",
        "Innen: ein nächster Schritt. Außen: ein Satz der Akzeptanz — „Das liegt nicht in meiner Hand.“",
      ],
      warum: "Energie dorthin lenken, wo du wirken kannst, und den Rest bewusst abgeben — das verringert Grübeln.",
    },
  ],
  unruhe: [
    {
      t: "Zyklisches Seufzen", dauer: "5 Min.",
      ansatz: "Stanford-Atemstudie (Balban u. a., 2023)",
      schritte: [
        "Atme durch die Nase ein.",
        "Atme noch ein kleines zweites Mal nach, bis die Lunge ganz voll ist.",
        "Atme langsam und lang durch den Mund aus.",
        "Wiederhole das 5 Minuten lang.",
      ],
      warum: "Im Vergleich hob dieses lange Ausatmen die Stimmung stärker und beruhigte den Atem mehr als Achtsamkeitsmeditation.",
    },
    {
      t: "Progressive Muskelentspannung", dauer: "15 Min.",
      ansatz: "Progressive Muskelentspannung (Jacobson)",
      schritte: [
        "Spanne eine Muskelgruppe 5–7 Sekunden an, z. B. die Fäuste.",
        "Lass los und spüre 20–30 Sekunden der Entspannung nach.",
        "Geh so durch den Körper: Hände, Arme, Schultern, Gesicht, Bauch, Beine, Füße.",
      ],
      warum: "Entspannungsverfahren senken Angst deutlich — mit mittlerer bis großer Wirkung.",
    },
    {
      t: "Der Sorgen-Termin", dauer: "15 Min. täglich",
      ansatz: "Sorgenaufschub (Verhaltens- und Metakognitive Therapie)",
      schritte: [
        "Leg eine feste Sorgenzeit fest, z. B. 18:00–18:15 Uhr — nicht kurz vor dem Schlafen.",
        "Taucht tagsüber eine Sorge auf: kurz notieren und auf den Termin verschieben.",
        "In der Sorgenzeit: Kann ich etwas tun? Wenn ja, einen kleinen Schritt planen.",
      ],
      warum: "Aufschieben plus Planen verkürzte das tägliche Grübeln in einer Studie von 2025 spürbar.",
    },
  ],
  betrug: [
    {
      t: "Die Scham entlasten", dauer: "10 Min.",
      ansatz: "Selbstmitgefühl · Forschung zu Betrugsopfern",
      schritte: [
        "Schreib: „Ich bin Opfer einer Straftat geworden. Täter sind Profis darin, Vertrauen zu missbrauchen.“",
        "Schreib, was du einer Freundin sagen würdest, der das Gleiche passiert ist.",
        "Lies diese Worte jetzt dir selbst vor.",
      ],
      warum: "Betroffene erleben oft einen doppelten Schlag: Geld weg und eine Beziehung weg. Scham hält viele davon ab, sich Hilfe zu holen.",
    },
    {
      t: "Rückschau-Check gegen Selbstvorwürfe", dauer: "10 Min.",
      ansatz: "Kognitive Verhaltenstherapie",
      schritte: [
        "Notiere deinen Vorwurf: „Ich hätte es merken müssen.“",
        "Frage: Was wusste ich damals wirklich — nicht heute?",
        "Welche Tricks wurden gezielt gegen mich eingesetzt?",
        "Schreib einen faireren Satz: „Mit dem Wissen von damals habe ich so gehandelt, wie viele andere auch.“",
      ],
      warum: "Im Nachhinein wirkt alles eindeutig. Der Check trennt heutiges Wissen von der damaligen Lage.",
    },
    {
      t: "Zurück in Verbindung", dauer: "1 Woche",
      ansatz: "Empfehlungen zur Erholung nach Online-Liebesbetrug (University of Essex)",
      schritte: [
        "Erzähl einer vertrauten Person davon — oder such dir eine Selbsthilfegruppe.",
        "Plane etwas mit Menschen, zu denen der Kontakt eingeschlafen ist.",
        "Ein kleiner Schritt pro Tag: Anzeige, Bank, Passwörter ändern, Konten absichern.",
      ],
      warum: "Täter isolieren oft gezielt. Wieder verbunden zu sein stärkt die Erholung und schützt vor erneutem Betrug.",
      hinweis: "Bei anhaltenden Albträumen, Panik oder Hoffnungslosigkeit ist professionelle Hilfe der richtige Weg.",
    },
  ],
};

// Zusätzliche Hinweise, die über den Übungen eines Themas stehen.
export const THEMA_UEBUNGEN_HINWEIS = {
  geld: "Diese Übungen sind keine Finanz- oder Schuldnerberatung.",
  betrug: "Bei Betrug zuerst Bank und Polizei (Online-Wache deines Bundeslandes) informieren. Hilfe für Betroffene: WEISSER RING, Opfer-Telefon 116 006 (kostenfrei, täglich 7–22 Uhr).",
};
