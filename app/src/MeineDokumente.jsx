import { useState, useEffect } from "react";
import { supabase, meineDokumente, dokumentHochladen, dokumentOeffnenLink, dokumentMarkieren, DOKUMENT_KATEGORIEN } from "./supabase";

/* Meine Dokumente — was das smile2go-Team mir schickt (Onboarding, Verträge …)
   und was ich dem Team hochlade (Expertinnen-Bewerbung, Einwilligung, Sonstiges).
   Dateien liegen privat; geöffnet wird nur über kurzlebige Links.
   `warteseite`: kompakte Form direkt nach der Registrierung. */

const F = {
  cream: "#FBF6FA", card: "#FFFDFE", beige: "#F5EBF3", line: "#EFDFEC",
  gold: "#8E4C85", goldPale: "#F9EAF4", espresso: "#2E2430", ink: "#7A6B7A", plum: "#6E3568", sage: "#6FA89C", rot: "#B0492F",
};
const sys = { fontFamily: "system-ui, sans-serif" };
const datum = (iso) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "");
const HOCHLADE_KATEGORIEN = [
  ["bewerbung", "Expertinnen-Bewerbung (Zertifikat, Lebenslauf …)"],
  ["vertrag", "Vertrag / Einwilligung (unterschrieben)"],
  ["sonstiges", "Sonstiges"],
];

export default function MeineDokumente({ warteseite = false }) {
  const [daten, setDaten] = useState(undefined);   // undefined = lädt, null = nicht erreichbar
  const [kategorie, setKategorie] = useState(warteseite ? "bewerbung" : "sonstiges");
  const [titel, setTitel] = useState("");
  const [datei, setDatei] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState("");
  const [eingabeSchluessel, setEingabeSchluessel] = useState(0);

  const laden = () => meineDokumente().then(setDaten).catch(() => setDaten(null));
  useEffect(() => { laden(); }, []);

  // Fenster sofort öffnen — sonst blockt Safari das Popup nach dem await
  const oeffnen = async (dok, freigabe) => {
    const fenster = window.open("", "_blank");
    const url = await dokumentOeffnenLink(dok);
    if (url && fenster) { fenster.opener = null; fenster.location.href = url; }
    else { fenster?.close(); setMeldung("Das Dokument konnte gerade nicht geöffnet werden."); }
    if (freigabe && !freigabe.geoeffnet) { await dokumentMarkieren(freigabe.id); laden(); }
  };
  const bestaetigen = async (freigabe) => { await dokumentMarkieren(freigabe.id, true); laden(); };

  const hochladen = async () => {
    if (!datei || laeuft) return;
    setLaeuft(true); setMeldung("");
    try {
      await dokumentHochladen(datei, kategorie, titel);
      setDatei(null); setTitel(""); setEingabeSchluessel((n) => n + 1);
      setMeldung("✓ Hochgeladen — das smile2go-Team sieht es jetzt.");
      laden();
    } catch (e) { setMeldung(e.message || "Hochladen hat nicht geklappt."); }
    setLaeuft(false);
  };

  if (!supabase || daten === null)
    return <p style={{ ...sys, fontSize: 15, color: F.ink, lineHeight: 1.6, padding: warteseite ? 0 : 22 }}>Dokumente sind gerade nicht erreichbar. Bitte prüfe, ob du online bist, und versuche es später noch einmal.</p>;

  const feld = { width: "100%", boxSizing: "border-box", padding: "11px 13px", fontSize: 15.5, ...sys, border: `1.5px solid ${F.line}`, borderRadius: 12, background: F.cream, color: F.espresso, outline: "none" };
  const knopf = { ...sys, fontSize: 14, fontWeight: 700, padding: "10px 16px", borderRadius: 14, cursor: "pointer", border: "none", background: F.gold, color: "#fff" };
  const zweit = { ...knopf, background: F.card, color: F.espresso, border: `1.5px solid ${F.line}`, padding: "7px 12px", fontSize: 13 };
  const titelStil = { ...sys, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: F.plum, fontWeight: 700, margin: "0 0 10px" };
  const erhalten = daten?.erhalten || [];
  const eigene = daten?.eigene || [];

  return (
    <div style={{ padding: warteseite ? "18px 0 0" : "18px 18px 28px", display: "grid", gap: 22 }}>
      {!warteseite && (
        <div>
          <p style={titelStil}>Vom smile2go-Team</p>
          {daten === undefined ? <p style={{ ...sys, color: F.ink }}>Lade …</p> : erhalten.length === 0 ? (
            <p style={{ ...sys, fontSize: 15, color: F.ink, lineHeight: 1.5 }}>Noch keine Dokumente. Wenn dir das Team etwas schickt, findest du es hier.</p>
          ) : erhalten.map((f) => {
            const d = f.dokumente;
            return (
              <div key={f.id} style={{ background: F.card, border: `1px solid ${F.line}`, borderRadius: 16, padding: "13px 14px", marginBottom: 9 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>{d.art === "link" ? "🔗" : "📄"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...sys, fontWeight: 700, fontSize: 15.5, color: F.espresso }}>{d.titel}</div>
                    <div style={{ ...sys, fontSize: 12.5, color: F.ink, marginTop: 2 }}>
                      {DOKUMENT_KATEGORIEN[d.kategorie]} · {datum(f.gesendet)}{!f.geoeffnet ? " · neu" : ""}
                    </div>
                  </div>
                  <button onClick={() => oeffnen(d, f)} style={zweit}>Öffnen</button>
                </div>
                {d.beschreibung && <p style={{ ...sys, fontSize: 14, color: F.ink, lineHeight: 1.5, margin: "8px 0 0" }}>{d.beschreibung}</p>}
                {d.bestaetigung_noetig && (
                  f.bestaetigt
                    ? <p style={{ ...sys, fontSize: 13, color: F.sage, margin: "8px 0 0", fontWeight: 700 }}>✓ Gelesen & einverstanden am {datum(f.bestaetigt)}</p>
                    : <button onClick={() => bestaetigen(f)} disabled={!f.geoeffnet} title={f.geoeffnet ? "" : "Bitte zuerst öffnen und lesen"}
                        style={{ ...knopf, marginTop: 10, fontSize: 13.5, opacity: f.geoeffnet ? 1 : 0.5 }}>Gelesen & einverstanden</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div>
        <p style={titelStil}>{warteseite ? "Unterlagen ans Team (optional)" : "Ans Team hochladen"}</p>
        <p style={{ ...sys, fontSize: 14, color: F.ink, lineHeight: 1.5, margin: "0 0 10px" }}>
          {warteseite
            ? "Du möchtest als Expertin bei smile2go mitwirken? Lade hier Zertifikate oder deinen Lebenslauf hoch. Auch eine unterschriebene Einwilligung kannst du hier schicken."
            : "Nur das smile2go-Team sieht diese Dateien — nicht deine Coachin und nicht die Community. PDF, Bild oder Word, bis 20 MB."}
        </p>
        <div style={{ display: "grid", gap: 9 }}>
          <select value={kategorie} onChange={(e) => setKategorie(e.target.value)} style={feld}>
            {HOCHLADE_KATEGORIEN.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
          <input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Bezeichnung (optional), z. B. Coaching-Zertifikat" style={feld} />
          <input key={eingabeSchluessel} type="file" accept=".pdf,.png,.jpg,.jpeg,.heic,.doc,.docx" onChange={(e) => setDatei(e.target.files?.[0] || null)} style={{ ...sys, fontSize: 14 }} />
          <button onClick={hochladen} disabled={!datei || laeuft} style={{ ...knopf, justifySelf: "start", opacity: datei && !laeuft ? 1 : 0.5 }}>{laeuft ? "Lädt hoch …" : "Hochladen"}</button>
          {meldung && <p style={{ ...sys, fontSize: 13.5, color: meldung.startsWith("✓") ? F.sage : F.rot, margin: 0 }}>{meldung}</p>}
        </div>

        {eigene.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {eigene.map((d) => (
              <div key={d.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 2px", borderBottom: `1px solid ${F.line}`, ...sys, fontSize: 14 }}>
                <span>📎</span>
                <span style={{ flex: 1, color: F.espresso, wordBreak: "break-all" }}>{d.titel}</span>
                <span style={{ fontSize: 12, color: d.status === "geprueft" ? F.sage : F.ink }}>{d.status === "geprueft" ? "✓ angesehen" : datum(d.erstellt)}</span>
                <button onClick={() => oeffnen(d)} style={zweit}>Öffnen</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
