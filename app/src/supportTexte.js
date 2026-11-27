// ilho-technik · feste Werte und ihre deutschen Bezeichnungen.
// Die Schlüssel entsprechen exakt den CHECK-Listen der Migration 20261124_ilho_technik.sql.

export const SUPPORT_KATEGORIEN = [
  ["technik", "Technisches Problem"],
  ["konto", "Konto & Anmeldung"],
  ["zahlung", "Zahlung & Mitgliedschaft"],
  ["inhalte", "Landingpage & Inhalte"],
  ["sonstiges", "Sonstiges"],
];
export const SUPPORT_PRIORITAETEN = [
  ["niedrig", "Niedrig"],
  ["normal", "Normal"],
  ["hoch", "Hoch"],
  ["dringend", "Dringend"],
];
export const SUPPORT_STATUS = [
  ["eingegangen", "Eingegangen"],
  ["in_bearbeitung", "In Bearbeitung"],
  ["warten", "Warten auf Rückmeldung"],
  ["geloest", "Gelöst"],
];

const nachSchluessel = (liste) => Object.fromEntries(liste);
export const KATEGORIE_LABEL = nachSchluessel(SUPPORT_KATEGORIEN);
export const PRIORITAET_LABEL = nachSchluessel(SUPPORT_PRIORITAETEN);
export const STATUS_LABEL = nachSchluessel(SUPPORT_STATUS);

// Farbton je Status: [Hintergrund, Schrift] — unabhängig vom Farbthema gut lesbar.
export const STATUS_TON = {
  eingegangen: ["#EEF1FB", "#3A4C8C"],
  in_bearbeitung: ["#FFF3DD", "#8A5A12"],
  warten: ["#FBEAF4", "#8E2F6E"],
  geloest: ["#E7F5EC", "#2F7A4B"],
};
export const PRIORITAET_TON = {
  niedrig: ["#F1F1F3", "#5D5D6B"],
  normal: ["#EEF1FB", "#3A4C8C"],
  hoch: ["#FFF0DE", "#9A5A12"],
  dringend: ["#FBE3DE", "#A3321F"],
};

export const zeitpunkt = (iso) =>
  new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
