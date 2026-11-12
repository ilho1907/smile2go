const SDT_LABELS = {
  autonomie: {
    erfuellung: "Autonomie \xB7 Gestaltungsspielraum",
    frustration: "Autonomie \xB7 Druck/Kontrolle"
  },
  kompetenz: {
    erfuellung: "Kompetenz \xB7 Wirksamkeit",
    frustration: "Kompetenz \xB7 \xDCberforderung/Zweifel"
  },
  verbundenheit: {
    erfuellung: "Verbundenheit \xB7 N\xE4he",
    frustration: "Verbundenheit \xB7 Ausgeschlossensein"
  }
};
const NVC_NEEDS = [
  "Ruhe",
  "Sicherheit",
  "Unterst\xFCtzung",
  "Klarheit",
  "Grenzen",
  "Wertsch\xE4tzung",
  "Verstandenwerden",
  "Privatsph\xE4re",
  "Vorhersehbarkeit",
  "Zugeh\xF6rigkeit",
  "Zusammenarbeit",
  "Respekt",
  "Freiraum",
  "Stabilit\xE4t",
  "N\xE4he",
  "Leichtigkeit"
];
const GOAL_LABELS = {
  verstehen: { label: "Verstehen", hint: "Ich will nur einordnen, was los ist" },
  beruhigen: { label: "Beruhigen", hint: "Ich will zur Ruhe kommen" },
  loesen: { label: "L\xF6sen", hint: "Ich will einen Gedanken/ein Problem kl\xE4ren" },
  ausdruecken: { label: "Ausdr\xFCcken", hint: "Ich will mich jemandem mitteilen" },
  handeln: { label: "Handeln", hint: "Ich will einen kleinen Schritt tun" },
  nur_eintragen: { label: "Nur eintragen", hint: "Heute keine \xDCbung" }
};
export {
  GOAL_LABELS,
  NVC_NEEDS,
  SDT_LABELS
};
