import { useEffect, useState } from "react";
import { ladeExpertinnen } from "./supabase";
import { TAROT_MEDIEN, FUF_LOGO_ZEICHNUNG } from "./media";
import { Karussell } from "./Entdecken";

/* Coachinnen & Expertinnen — feste Partnerinnen (hier eingetragen) plus alle
   Coachinnen aus der Datenbank, die schon in der Community sichtbar sind.
   Neue Mitglieder erscheinen also von selbst. */

const FEST = [
  { id: "ivonne", name: "Ivonne", schwerpunkt: "Tarot", bild: TAROT_MEDIEN.titelbild, tab: "tarot" },
];

export function useExpertinnen() {
  const [liste, setListe] = useState(FEST);
  useEffect(() => {
    let aktiv = true;
    ladeExpertinnen().then((db) => {
      if (!aktiv || !db.length) return;
      const aus = db.map((c) => ({
        id: c.id, name: c.name.trim(),
        schwerpunkt: (c.schwerpunkte || []).slice(0, 2).join(" · ") || "Coachin",
        text: c.kurzprofil || "", schwerpunkte: c.schwerpunkte || [],
        website: c.website, instagram: c.instagram, buchungslink: c.buchungslink,
        bild: FUF_LOGO_ZEICHNUNG,
      }));
      setListe([...FEST, ...aus]);
    });
    return () => { aktiv = false; };
  }, []);
  return liste;
}

export function ExpertinnenKarussell({ titel = "Coachinnen & Expertinnen", unter = "Frauen, die dich begleiten", onOeffnen, stil }) {
  const liste = useExpertinnen();
  if (!liste.length) return null;
  return (
    <Karussell
      titel={titel} unter={unter} stil={stil}
      karten={liste.map((e) => ({ key: e.id, titel: e.name, unter: e.schwerpunkt, art: "Expertin", bild: e.bild, _e: e }))}
      onOeffnen={(k) => onOeffnen?.(k._e)}
    />
  );
}

const instaUrl = (h) => !h ? "" : h.startsWith("http") ? h : `https://instagram.com/${h.replace(/^@/, "")}`;
const webUrl = (w) => !w ? "" : w.startsWith("http") ? w : `https://${w}`;

export function ExpertinProfil({ e, go }) {
  if (!e) return <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>Profil nicht gefunden.</div>;
  const knopf = { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 50, borderRadius: 25, fontFamily: "system-ui, sans-serif", fontSize: 16.5, fontWeight: 600, textDecoration: "none", cursor: "pointer" };
  return (
    <div style={{ paddingBottom: 28 }}>
      <div style={{ position: "relative", height: 300, overflow: "hidden", background: "#2A1730" }}>
        <img src={e.bild} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(42,23,48,0) 40%, rgba(42,23,48,.85) 100%)" }} />
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 18, color: "#fff" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, letterSpacing: 2.2, textTransform: "uppercase", opacity: .85 }}>Expertin</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 34, margin: "4px 0 2px" }}>{e.name}</h1>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 15.5, opacity: .9 }}>{e.schwerpunkt}</div>
        </div>
      </div>
      <div style={{ padding: "20px 22px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {e.text && <p style={{ fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1.6, color: "#2E2430", margin: 0 }}>{e.text}</p>}
        {e.schwerpunkte?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {e.schwerpunkte.map((s) => <span key={s} style={{ padding: "6px 12px", borderRadius: 14, background: "#F9EAF4", color: "#6E3568", fontFamily: "system-ui, sans-serif", fontSize: 14.5 }}>{s}</span>)}
          </div>
        )}
        {e.buchungslink
          ? <a href={webUrl(e.buchungslink)} target="_blank" rel="noopener noreferrer" style={{ ...knopf, background: "linear-gradient(90deg,#8E4C85,#C2418F)", color: "#fff" }}>Kennenlernen buchen</a>
          : <button onClick={() => go("buchen")} style={{ ...knopf, border: "none", background: "linear-gradient(90deg,#8E4C85,#C2418F)", color: "#fff" }}>Kennenlernen buchen</button>}
        <button onClick={() => go("community")} style={{ ...knopf, border: "1.5px solid #EFDFEC", color: "#6E3568", background: "#F9EAF4" }}>In der Community</button>
        {e.website && <a href={webUrl(e.website)} target="_blank" rel="noopener noreferrer" style={{ ...knopf, border: "1.5px solid #EFDFEC", color: "#2E2430", background: "#FFFDFE" }}>Website</a>}
        {e.instagram && <a href={instaUrl(e.instagram)} target="_blank" rel="noopener noreferrer" style={{ ...knopf, border: "1.5px solid #EFDFEC", color: "#2E2430", background: "#FFFDFE" }}>Instagram</a>}
      </div>
    </div>
  );
}
