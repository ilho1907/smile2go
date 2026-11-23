// Farbthemen der Mitglieder-App. Die Nutzerin waehlt ihr Thema im Profil
// (Profil › Design), wie hell/dunkel. Jedes Thema belegt dieselben Schluessel
// wie die Palette C in App.jsx; wendeThemaAn() schreibt sie dort hinein,
// bevor die App neu gezeichnet wird. Neue Komponenten lesen ihre Farben aus C,
// dann folgen sie dem Thema automatisch.

export const STANDARD_THEMA = "champagner";
const SPEICHER = "s2g_thema";

export const THEMEN = [
  {
    id: "champagner", panel: "linear-gradient(160deg, #9E1F52 0%, #5E1233 100%)", panelZeichen: "#F7D9A0", punkt: "rgba(194,24,91,.10)", nav: "rgba(255,253,251,.88)", name: "Champagner Rosé", art: "hell",
    vorschau: ["#FBF4EF", "#E8C383", "#F3B4C4", "#C2185B"],
    grund: "radial-gradient(90% 40% at 8% 0%, #F8D9E1 0%, transparent 60%), radial-gradient(80% 40% at 100% 100%, #F4E2BD 0%, transparent 60%), #FBF4EF",
    farben: {
      cream: "#FBF4EF", card: "#FFFDFB", beige: "#F6EBE5", line: "#EEDDD6",
      gold: "#C2185B", goldSoft: "#E0607E", goldPale: "#FBEAEF",
      espresso: "#2B1B2E", ink: "#76636D", sage: "#5E9E8C",
      rose: "#E99AB0", roseSoft: "#FCF2F4", plum: "#8E1A47", aufGold: "#FFFFFF",
    },
  },
  {
    id: "neonrose", panel: "linear-gradient(150deg, #FF3D9A 0%, #FF8A4C 100%)", panelZeichen: "#FFF3B0", punkt: "rgba(222,35,125,.10)", nav: "rgba(255,255,255,.88)", name: "Neon Rosé", art: "hell",
    vorschau: ["#FDF5FA", "#FF3D9A", "#3EE6FF", "#FF8A4C"],
    grund: "radial-gradient(90% 40% at 8% 0%, #FFC4E2 0%, transparent 60%), radial-gradient(80% 40% at 100% 100%, #B8F3FF 0%, transparent 60%), #FDF5FA",
    farben: {
      cream: "#FDF5FA", card: "#FFFFFF", beige: "#F8ECF5", line: "#F2DDEB",
      gold: "#DE237D", goldSoft: "#FF3D9A", goldPale: "#FFE6F3",
      espresso: "#2A1640", ink: "#74648A", sage: "#18A9C1",
      rose: "#FF8CC6", roseSoft: "#FFF1F8", plum: "#A0145E", aufGold: "#FFFFFF",
    },
  },
  {
    id: "lagoon", panel: "linear-gradient(160deg, #1F4E8C 0%, #10213F 100%)", panelZeichen: "#4FE3D0", punkt: "rgba(31,78,140,.10)", nav: "rgba(255,255,255,.88)", name: "Lagoon Glow", art: "hell",
    vorschau: ["#F3FCFA", "#4FE3D0", "#2F7BFF", "#FF5C8A"],
    grund: "radial-gradient(90% 40% at 8% 0%, #B5F6EA 0%, transparent 60%), radial-gradient(80% 40% at 100% 100%, #C3D3FF 0%, transparent 60%), #F3FCFA",
    farben: {
      cream: "#F3FCFA", card: "#FFFFFF", beige: "#E7F5F2", line: "#D5EAE6",
      gold: "#E23F69", goldSoft: "#FF5C8A", goldPale: "#FFE8EE",
      espresso: "#10213F", ink: "#5A6B83", sage: "#1FA996",
      rose: "#4FE3D0", roseSoft: "#EDFAF7", plum: "#1F4E8C", aufGold: "#FFFFFF",
    },
  },
  {
    id: "smaragd", panel: "linear-gradient(160deg, #1A5A52 0%, #0E3A35 100%)", panelZeichen: "#F2CF86", punkt: "rgba(232,185,106,.10)", nav: "rgba(11,46,42,.86)", name: "Smaragd & Gold", art: "dunkel",
    vorschau: ["#0B2E2A", "#E8B96A", "#F4A6B8", "#4FBF98"],
    grund: "radial-gradient(90% 40% at 8% 0%, rgba(47,143,111,.55) 0%, transparent 60%), radial-gradient(80% 40% at 100% 100%, rgba(232,185,106,.22) 0%, transparent 60%), #0B2E2A",
    farben: {
      cream: "#0B2E2A", card: "#123F39", beige: "#0F3833", line: "#245048",
      gold: "#E8B96A", goldSoft: "#F2CF86", goldPale: "#1A4A42",
      espresso: "#FBF3E6", ink: "#B5CCC3", sage: "#5FD1A8",
      rose: "#F4A6B8", roseSoft: "#143F39", plum: "#F4C9D4", aufGold: "#1B2A22",
    },
  },
  {
    id: "nordlicht", panel: "linear-gradient(160deg, #12506B 0%, #0A3044 100%)", panelZeichen: "#3EF2B0", punkt: "rgba(62,242,176,.12)", nav: "rgba(8,40,58,.86)", name: "Nordlicht", art: "dunkel",
    vorschau: ["#08283A", "#3EF2B0", "#22C3FF", "#FF7AB6"],
    grund: "radial-gradient(80% 30% at 25% 0%, rgba(62,242,176,.4) 0%, transparent 65%), radial-gradient(60% 25% at 85% 8%, rgba(34,195,255,.3) 0%, transparent 65%), linear-gradient(180deg, #06283A, #0B3B4F)",
    farben: {
      cream: "#08283A", card: "#0F3A50", beige: "#0C3247", line: "#1D4C62",
      gold: "#FF7AB6", goldSoft: "#FF9FCB", goldPale: "#123F55",
      espresso: "#F2FBFF", ink: "#A7C4D1", sage: "#3EF2B0",
      rose: "#22C3FF", roseSoft: "#0F3448", plum: "#9FF0D6", aufGold: "#2A0F22",
    },
  },
];

export const thema = (id) => THEMEN.find((t) => t.id === id) || THEMEN.find((t) => t.id === STANDARD_THEMA);

export function gespeichertesThema() {
  try { return localStorage.getItem(SPEICHER) || STANDARD_THEMA; } catch { return STANDARD_THEMA; }
}

let aktiv = null;
// Aktuelle Themenfarben fuer Dateien ausserhalb von App.jsx (z. B. HeuteHero).
export const FARBEN = {};
export const aktivesThema = () => thema(aktiv || gespeichertesThema());
// Schreibt die Themenfarben in die Palette C und faerbt Seite und Statusleiste.
export function wendeThemaAn(C, id) {
  const t = thema(id);
  if (aktiv === t.id && C.cream === t.farben.cream) return t;
  Object.assign(C, t.farben);
  Object.assign(FARBEN, t.farben);
  aktiv = t.id;
  try { localStorage.setItem(SPEICHER, t.id); } catch {}
  if (typeof document !== "undefined") {
    document.documentElement.style.background = t.farben.cream;
    document.body.style.background = t.grund;
    document.body.style.backgroundAttachment = "fixed";
    document.documentElement.dataset.thema = t.art;
    const st = document.documentElement.style;
    st.setProperty("--s2g-grund", t.grund);
    st.setProperty("--s2g-buehne", t.farben.beige);
    st.setProperty("--s2g-nav", t.nav);
    st.setProperty("--s2g-punkt", t.punkt);
    st.setProperty("--s2g-gold", t.farben.gold);
    st.setProperty("--s2g-rose", t.farben.rose);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t.farben.cream);
  }
  return t;
}
