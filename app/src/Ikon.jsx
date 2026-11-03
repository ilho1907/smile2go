// Ikon.jsx — smile2go
//
// Warum es diese Datei gibt: in der App standen rund 750 Emoji. Ein Emoji
// ist kein Zeichen, das wir gestalten — es ist ein Bild, das jedes
// Betriebssystem anders zeichnet. Auf einem iPhone glaenzend und bunt, auf
// einem Samsung flacher, auf einem aelteren Android gar nicht. Es nimmt
// unsere Farbe nicht an, haelt unsere Strichstaerke nicht ein und sitzt in
// jeder Zeile ein bisschen anders auf der Grundlinie. Nebeneinander mit
// einer gezeichneten Linie — wie auf der Coaching-Seite, wo ein gezeichnetes
// Figuerchen ueber einem roten Herz-Emoji stand — sieht man sofort, dass
// zwei verschiedene Haende am Werk waren.
//
// Hier ist eine Hand. Alle Zeichen sind auf demselben Raster von 24
// gezeichnet, mit derselben Strichstaerke, runden Enden, ohne Fuellung, und
// sie nehmen die Farbe an, in der sie stehen (currentColor). Dadurch sind
// sie auf Creme dunkel und auf einem dunklen Block hell, ohne dass irgendwo
// eine zweite Fassung gepflegt werden muss.
//
// Zwei Wege hinein:
//   <Ikon n="herz" />      wenn der Name bekannt ist
//   <Sym e={x.icon} />     wenn an der Stelle bisher ein Emoji aus den Daten
//                          kam. Sym schlaegt es in der Tabelle unten nach.
//                          Steht es nicht drin, wird das Emoji gezeigt wie
//                          bisher — nur in fester Groesse und Grundlinie, so
//                          dass die Liste trotzdem ruhig bleibt.

const P = {
  /* Natur und Licht */
  blatt:      <><path d="M20 4C11 4 4 9.5 4 17c0 1.3.2 2.2.5 3" /><path d="M4.5 20C9 11 14 7.5 20 4c.6 7-1.2 16-9.5 16-2.3 0-4.4-.7-6-2z" /></>,
  bluete:     <><circle cx="12" cy="12" r="2.6" /><path d="M12 9.4c0-3 .8-5.4 0-5.4s0 2.4 0 5.4zM14.6 12c3 0 5.4.8 5.4 0s-2.4 0-5.4 0zM12 14.6c0 3-.8 5.4 0 5.4s0-2.4 0-5.4zM9.4 12c-3 0-5.4-.8-5.4 0s2.4 0 5.4 0z" /><path d="M13.8 10.2 17 7M13.8 13.8 17 17M10.2 13.8 7 17M10.2 10.2 7 7" /></>,
  klee:       <><path d="M12 13c-1.6-2-4.5-2.6-5.8-1.3-1.2 1.2-.6 3.5 1.2 4.3M12 13c1.6-2 4.5-2.6 5.8-1.3 1.2 1.2.6 3.5-1.2 4.3M12 13c-2-1.6-2.6-4.5-1.3-5.8C11.9 6 14.2 6.6 15 8.4" /><path d="M12 13v7" /></>,
  sonne:      <><circle cx="12" cy="12" r="4.2" /><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" /></>,
  mond:       <path d="M20 14.4A8.6 8.6 0 0 1 9.6 4 8.6 8.6 0 1 0 20 14.4z" />,
  wolke:      <path d="M7.4 19h9.4a3.9 3.9 0 0 0 .5-7.8 5.6 5.6 0 0 0-10.8-1A3.9 3.9 0 0 0 7.4 19z" />,
  welle:      <><path d="M3 9.5c1.8 0 1.8 1.8 3.6 1.8S8.4 9.5 10.2 9.5 12 11.3 13.8 11.3s1.8-1.8 3.6-1.8S19.2 11.3 21 11.3" /><path d="M3 15c1.8 0 1.8 1.8 3.6 1.8S8.4 15 10.2 15s1.8 1.8 3.6 1.8S15.6 15 17.4 15s1.8 1.8 3.6 1.8" /></>,
  tropfen:    <path d="M12 3.2c3.3 4 5.4 6.8 5.4 9.6a5.4 5.4 0 1 1-10.8 0c0-2.8 2.1-5.6 5.4-9.6z" />,
  berg:       <><path d="M2.6 19 9 7.6l4 6.6 2.2-3.4L21.4 19z" /><path d="M11.4 13.4 13 10.8" /></>,
  flamme:     <><path d="M12 3c3.4 3.6 5.6 6.2 5.6 9.4A5.6 5.6 0 0 1 6.4 12.4C6.4 10.5 7.4 8.9 9 7.4c.3 1.6 1 2.6 2 3 .4-2.6.7-5 1-7.4z" /><path d="M12 19.6a2.6 2.6 0 0 1-2.6-2.6c0-1.3.9-2.2 2.6-4 1.7 1.8 2.6 2.7 2.6 4a2.6 2.6 0 0 1-2.6 2.6z" /></>,
  kerze:      <><rect x="9" y="9.6" width="6" height="11" rx="1.6" /><path d="M12 9.6V7.8" /><path d="M12 3.2c1.6 1.6 2.4 2.6 2.4 3.6a2.4 2.4 0 0 1-4.8 0c0-1 .8-2 2.4-3.6z" /></>,

  /* Gefuehl und Mensch */
  herz:       <path d="M12 20.4C7.2 17 3.6 14 3.6 10.3A4.3 4.3 0 0 1 12 8.1a4.3 4.3 0 0 1 8.4 2.2c0 3.7-3.6 6.7-8.4 10.1z" />,
  person:     <><circle cx="12" cy="8.2" r="3.6" /><path d="M5.2 20c.6-3.6 3.4-5.6 6.8-5.6s6.2 2 6.8 5.6" /></>,
  frau:       <><circle cx="12" cy="8" r="4.4" /><path d="M12 12.4V21M9 18h6" /></>,
  zweiHaende: <><path d="M3 12.6 7.6 9l4.4 2.6L16.4 9 21 12.6" /><path d="M7.6 9v6.4M16.4 9v6.4" /><path d="M12 11.6V18" /></>,
  hand:       <><path d="M9 11V5.4a1.4 1.4 0 1 1 2.8 0V11" /><path d="M11.8 10.6V4.6a1.4 1.4 0 0 1 2.8 0v6" /><path d="M14.6 11V6.6a1.4 1.4 0 1 1 2.8 0V14c0 3.4-2.2 6-5.6 6s-5.6-2.2-5.6-5V9.6a1.4 1.4 0 1 1 2.8 0" /></>,
  krone:      <><path d="M3.4 8.4 6.6 15h10.8l3.2-6.6-4.6 3-4-5.4-4 5.4z" /><path d="M6.6 18.4h10.8" /></>,
  pokal:      <><path d="M7.6 4h8.8v4.6a4.4 4.4 0 0 1-8.8 0z" /><path d="M7.6 5.6H5a2.4 2.4 0 0 0 2.6 4M16.4 5.6H19a2.4 2.4 0 0 1-2.6 4" /><path d="M12 13v4M8.6 20h6.8" /></>,
  spiegel:    <><ellipse cx="12" cy="9.6" rx="5.4" ry="6.4" /><path d="M12 16v4.4M9 20.4h6" /></>,

  /* Zeit und Weg */
  kalender:   <><rect x="3.6" y="5.4" width="16.8" height="15" rx="2.6" /><path d="M3.6 10h16.8M8.4 3.4v4M15.6 3.4v4" /></>,
  uhr:        <><circle cx="12" cy="12" r="8.4" /><path d="M12 7.2V12l3.2 2" /></>,
  weg:        <><path d="M8.4 3.6v4M8.4 10.4v3.2M8.4 16.4v4" /><path d="M15.6 3.6v4M15.6 10.4v3.2M15.6 16.4v4" /></>,
  kompass:    <><circle cx="12" cy="12" r="8.4" /><path d="m15.2 8.8-1.8 4.6-4.6 1.8 1.8-4.6z" /></>,
  ziel:       <><circle cx="12" cy="12" r="8.4" /><circle cx="12" cy="12" r="4.6" /><circle cx="12" cy="12" r="1" /></>,
  funke:      <><path d="M12 3.4 13.6 9 19.2 10.6 13.6 12.2 12 17.8 10.4 12.2 4.8 10.6 10.4 9z" /><path d="M18.4 16.4 19 18.4l2 .6-2 .6-.6 2-.6-2-2-.6 2-.6z" /></>,

  /* Wort und Werk */
  buch:       <><path d="M4 5.2A2 2 0 0 1 6 3.2h4.6a2.4 2.4 0 0 1 2.4 2.4v14a2 2 0 0 0-2-2H4z" /><path d="M20 5.2a2 2 0 0 0-2-2h-4.6A2.4 2.4 0 0 0 11 5.6v14a2 2 0 0 1 2-2h7z" /></>,
  blattPapier:<><path d="M6 3.4h7.4L19 9v11.6H6z" /><path d="M13.4 3.4V9H19" /><path d="M9 13h7M9 16.4h5" /></>,
  stift:      <><path d="M4.6 19.4 4 20l.6-3.4L16.2 5a2.2 2.2 0 1 1 3.1 3.1L7.7 19.7z" /><path d="m14.6 6.6 2.8 2.8" /></>,
  sprechblase:<path d="M20.4 12.4c0 3.9-3.8 7-8.4 7-1 0-2-.2-2.9-.5L4 20.4l1.6-4.2a6.4 6.4 0 0 1-2-4.6c0-3.9 3.8-7 8.4-7s8.4 3.1 8.4 7z" />,
  brief:      <><rect x="3" y="5.6" width="18" height="13" rx="2.4" /><path d="m3.6 7.4 8.4 6 8.4-6" /></>,
  ordner:     <path d="M3.4 7.4a2 2 0 0 1 2-2h3.4l2 2.4h7.8a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2z" />,
  bild:       <><rect x="3.4" y="5" width="17.2" height="14" rx="2.4" /><circle cx="8.6" cy="10" r="1.6" /><path d="m4.4 17 5-5 4.6 4.4 2.6-2.4 3 3" /></>,
  film:       <><rect x="3" y="5.4" width="18" height="13.2" rx="2.4" /><path d="M3 9.6h18M3 14.4h18M8.4 5.4v13.2M15.6 5.4v13.2" /></>,
  mikro:      <><rect x="9" y="2.6" width="6" height="11" rx="3" /><path d="M5.6 11a6.4 6.4 0 0 0 12.8 0" /><path d="M12 17.4V21" /></>,
  kopfhoerer: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="2.8" y="13.4" width="4.4" height="6.4" rx="2.2" /><rect x="16.8" y="13.4" width="4.4" height="6.4" rx="2.2" /></>,
  laut:       <><path d="M4 9.6h3.4L12 5.6v12.8L7.4 14.4H4z" /><path d="M15.6 9.4a3.6 3.6 0 0 1 0 5.2M18.2 7a7.2 7.2 0 0 1 0 10" /></>,
  stumm:      <><path d="M4 9.6h3.4L12 5.6v12.8L7.4 14.4H4z" /><path d="m16 9.6 4.4 4.8M20.4 9.6 16 14.4" /></>,
  saeulen:    <><path d="M4 20V13M10 20V5M16 20v-9M21 20H3" /></>,
  glocke:     <><path d="M18 16.4H6c1.2-1 1.8-2.2 1.8-3.6V10a4.2 4.2 0 0 1 8.4 0v2.8c0 1.4.6 2.6 1.8 3.6z" /><path d="M10.2 19.4a2 2 0 0 0 3.6 0" /></>,
  schloss:    <><rect x="4.6" y="10.4" width="14.8" height="10" rx="2.4" /><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" /></>,
  schild:     <path d="M12 3.4 19.4 6v6c0 4-3 7-7.4 8.6C7.6 19 4.6 16 4.6 12V6z" />,
  lupe:       <><circle cx="11" cy="11" r="6.4" /><path d="m15.8 15.8 4.2 4.2" /></>,
  geschenk:   <><rect x="3.6" y="9.4" width="16.8" height="11" rx="2" /><path d="M3.6 13.4h16.8M12 9.4v11" /><path d="M12 9.4C10 6.6 8.6 5 7.2 5a2.2 2.2 0 0 0 0 4.4M12 9.4c2-2.8 3.4-4.4 4.8-4.4a2.2 2.2 0 0 1 0 4.4" /></>,
  muenze:     <><circle cx="12" cy="12" r="8.4" /><path d="M12 7.4v9.2M14.6 9.6c-.6-.8-1.6-1.2-2.8-1.2-1.6 0-2.6.8-2.6 2 0 2.6 5.4 1.4 5.4 4 0 1.3-1.1 2.2-2.8 2.2-1.3 0-2.3-.5-2.9-1.3" /></>,
  diamant:    <><path d="M3.4 9.6 12 20.4l8.6-10.8L17 3.6H7z" /><path d="M3.4 9.6h17.2M7 3.6l1.6 6M17 3.6l-1.6 6M8.6 9.6 12 20.4l3.4-10.8" /></>,
  tasche:     <><path d="M4.6 7.6h14.8l1 12.8H3.6z" /><path d="M8.6 10V6.6a3.4 3.4 0 0 1 6.8 0V10" /></>,
  karte:      <><rect x="5" y="2.8" width="14" height="18.4" rx="2.6" /><path d="M12 8.4c1.6 1.8 2.8 2.8 2.8 4.2A2.8 2.8 0 0 1 12 15.4a2.8 2.8 0 0 1-2.8-2.8c0-1.4 1.2-2.4 2.8-4.2z" /></>,
  kugel:      <><circle cx="12" cy="10.6" r="6.6" /><path d="M6.6 19.4h10.8" /><path d="M9.6 8.6a3.4 3.4 0 0 1 2.4-1.4" /></>,
  hut:        <><path d="m2.6 9.4 9.4-4.2 9.4 4.2-9.4 4.2z" /><path d="M6.6 11.2v4.4c0 1.6 2.4 3 5.4 3s5.4-1.4 5.4-3v-4.4" /><path d="M21.4 9.4v5" /></>,
  palette:    <><path d="M12 3.6c-4.6 0-8.4 3.5-8.4 8s3.8 8 8.4 8c1.2 0 1.8-.8 1.8-1.6 0-1.4-1.2-1.6-1.2-2.6 0-.9.7-1.4 1.8-1.4h1.8c2.6 0 4.2-1.6 4.2-4 0-3.6-3.6-6.4-8.4-6.4z" /><circle cx="8" cy="10.4" r="1.1" /><circle cx="12" cy="8" r="1.1" /><circle cx="16" cy="10.4" r="1.1" /></>,
  frucht:     <><circle cx="12" cy="13.6" r="6.4" /><path d="M12 7.2V4.6M12 4.6c1.8 0 3-1 3-1s-.6 2.4-3 2.4" /></>,

  /* Zustand */
  haken:      <path d="m4.8 12.4 4.8 4.8L19.2 7.6" />,
  kreuz:      <path d="M6 6l12 12M18 6 6 18" />,
  warnung:    <><path d="M12 3.8 21.4 20H2.6z" /><path d="M12 10v4.4M12 17.2v.1" /></>,
  daumenHoch: <><path d="M7.4 20V10.4l4.2-6.6c1.3 0 2.2 1 2 2.4l-.6 3.2h4.6c1.4 0 2.4 1.2 2 2.6l-1.6 6c-.3 1.2-1.2 2-2.4 2z" /><path d="M7.4 10.4H4.6V20h2.8" /></>,
  daumenRunter: <><path d="M7.4 4v9.6l4.2 6.6c1.3 0 2.2-1 2-2.4l-.6-3.2h4.6c1.4 0 2.4-1.2 2-2.6l-1.6-6c-.3-1.2-1.2-2-2.4-2z" /><path d="M7.4 13.6H4.6V4h2.8" /></>,
  pfeilLinks: <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
  pfeilRechts:<path d="M5 12h14m0 0-6-6m6 6-6 6" />,
};

/* Die Uebersetzung. Links, was in den Daten steht; rechts, was gezeichnet
   wird. Was hier fehlt, bleibt ein Emoji — die Tabelle darf wachsen, ohne
   dass irgendwo sonst etwas angefasst werden muss. */
export const EMOJI_IKON = {
  "🤍": "herz", "💗": "herz", "💞": "herz", "🖤": "herz", "❤": "herz", "❤️": "herz", "💖": "herz", "🫀": "herz", "💜": "herz", "💛": "herz",
  "✨": "funke", "✦": "funke", "⭐": "funke", "💫": "funke", "🌟": "funke",
  "✓": "haken", "✅": "haken", "☑": "haken",
  "✕": "kreuz", "✖": "kreuz", "❌": "kreuz",
  "🌿": "blatt", "🍃": "blatt", "🌱": "blatt", "🍂": "blatt", "🌳": "blatt", "🌾": "blatt",
  "🌸": "bluete", "🌹": "bluete", "🌷": "bluete", "🌺": "bluete", "🌼": "bluete", "💐": "bluete",
  "🍀": "klee",
  "☀": "sonne", "☀️": "sonne", "🌤": "sonne", "🌞": "sonne",
  "🌙": "mond", "🌑": "mond", "🌕": "mond", "🌘": "mond", "🌒": "mond", "🌗": "mond", "🌓": "mond",
  "☁": "wolke", "🌫": "wolke", "🌧": "wolke", "⛅": "wolke",
  "🌊": "welle", "💧": "tropfen", "🌬": "welle",
  "🏔": "berg", "⛰": "berg", "🌅": "berg",
  "🔥": "flamme", "🕯": "kerze",
  "👤": "person", "🙋": "person", "👩": "frau", "♀": "frau",
  "🤝": "zweiHaende", "🖐": "hand", "✋": "hand", "🙌": "hand",
  "👑": "krone", "🏆": "pokal", "🪞": "spiegel",
  "📅": "kalender", "🗓": "kalender", "📆": "kalender",
  "🕰": "uhr", "⏰": "uhr", "⏳": "uhr", "🕐": "uhr",
  "🛤": "weg", "🧭": "kompass", "🎯": "ziel",
  "📔": "buch", "📖": "buch", "📕": "buch", "📓": "buch", "📗": "buch", "📚": "buch",
  "📄": "blattPapier", "📋": "blattPapier", "🧾": "blattPapier", "📃": "blattPapier",
  "✍": "stift", "📝": "stift", "✏": "stift",
  "💬": "sprechblase", "🗨": "sprechblase", "💭": "sprechblase",
  "💌": "brief", "✉": "brief", "📧": "brief", "📮": "brief", "📨": "brief",
  "📁": "ordner", "🗂": "ordner",
  "🖼": "bild", "📷": "bild", "🖻": "bild",
  "🎬": "film", "📹": "film", "🎥": "film",
  "🎙": "mikro", "🎤": "mikro",
  "🎧": "kopfhoerer", "🔊": "laut", "🔇": "stumm",
  "📊": "saeulen", "📈": "saeulen", "📉": "saeulen",
  "🔔": "glocke", "🔒": "schloss", "🔐": "schloss", "🛡": "schild", "🔍": "lupe", "🔎": "lupe",
  "🎁": "geschenk", "🎉": "geschenk",
  "💰": "muenze", "💵": "muenze", "🪙": "muenze", "💎": "diamant",
  "🛍": "tasche", "🎴": "karte", "🔮": "kugel", "🎓": "hut", "🎨": "palette",
  "🍊": "frucht", "🍋": "frucht",
  "⚠": "warnung", "⚠️": "warnung",
  "👍": "daumenHoch", "👎": "daumenRunter",
  "←": "pfeilLinks", "→": "pfeilRechts",
  "🕊": "funke", "💾": "ordner", "🗝": "schloss",
};

export function Ikon({ n, size = 20, strich = 1.6, style, titel }) {
  const d = P[n];
  if (!d) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strich} strokeLinecap="round" strokeLinejoin="round"
      role={titel ? "img" : undefined} aria-hidden={titel ? undefined : "true"}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {titel && <title>{titel}</title>}
      {d}
    </svg>
  );
}

/* Fuer die Stellen, an denen bisher ein Emoji aus den Daten kam. Ein
   bekanntes wird gezeichnet, ein unbekanntes bleibt stehen — aber in fester
   Groesse und auf fester Grundlinie, damit eine Liste nicht springt. */
export function Sym({ e, size = 20, strich = 1.6, style, titel }) {
  if (!e) return null;
  const n = EMOJI_IKON[e] || EMOJI_IKON[String(e).replace(/️/g, "")];
  if (n) return <Ikon n={n} size={size} strich={strich} style={style} titel={titel} />;
  return (
    <span aria-hidden="true" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, fontSize: size * 0.86, lineHeight: 1, flexShrink: 0, ...style,
    }}>{e}</span>
  );
}

export default Ikon;
