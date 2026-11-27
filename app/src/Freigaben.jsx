/* Freigaben — was die Klientin aus ihren ilho-Gesprächen teilt.
   Privacy by Default: alles ist aus, bis sie es selbst einschaltet.
   Jeder Schalter ist eine eigene, jederzeit widerrufbare Einwilligung (Art. 7, Art. 9 DSGVO). */
import { useEffect, useState } from "react";
import { FREIGABE_BEREICHE, ladeFreigaben, freigabeSetzen, ILHO_MISTRAL_AN } from "./supabase";

export default function Freigaben({ C, coachName, hatCoachin }) {
  const [stand, setStand] = useState({});
  const [busy, setBusy] = useState("");
  const [fehler, setFehler] = useState("");

  useEffect(() => { ladeFreigaben().then(setStand); }, []);

  if (!ILHO_MISTRAL_AN) return null;

  const umschalten = async (id) => {
    setFehler("");
    setBusy(id);
    const neu = !stand[id];
    const ok = await freigabeSetzen(id, neu);
    if (ok) setStand((bisher) => ({ ...bisher, [id]: neu }));
    else setFehler("Das hat gerade nicht geklappt — versuch es gleich noch einmal.");
    setBusy("");
  };

  const text = { fontFamily: "system-ui, sans-serif", color: C.ink };
  const sichtbar = FREIGABE_BEREICHE.filter((b) => b.fuer === "ilho" || hatCoachin);

  return (
    <div style={{ background: C.card, borderRadius: 18, padding: 18, marginTop: 8, marginBottom: 16, border: `1px solid ${C.line}` }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso, marginBottom: 4 }}>Was ilho teilen darf</div>
      <p style={{ ...text, fontSize: 14.5, lineHeight: 1.55, margin: "0 0 12px" }}>
        {hatCoachin
          ? `Ohne dein Ja sieht ${coachName || "deine Coachin"} nichts aus deinen ilho-Gesprächen — nie die Gespräche selbst, höchstens das, was du hier einschaltest. Geteilt wird erst ab dem Moment, in dem du zustimmst.`
          : "Ohne dein Ja speichert ilho keine Zusammenfassung deiner Gespräche."}
      </p>
      {sichtbar.map((b) => (
        <label key={b.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${C.line}`, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!stand[b.id]}
            disabled={Boolean(busy)}
            onChange={() => umschalten(b.id)}
            style={{ width: 20, height: 20, marginTop: 2, accentColor: C.plum, flexShrink: 0 }}
          />
          <span>
            <span style={{ ...text, display: "block", fontWeight: 700, fontSize: 15, color: C.espresso }}>{b.titel}</span>
            <span style={{ ...text, display: "block", fontSize: 13.5, lineHeight: 1.5 }}>{b.text}</span>
          </span>
        </label>
      ))}
      <p style={{ ...text, fontSize: 12.5, lineHeight: 1.5, margin: "10px 0 0", opacity: 0.85 }}>
        Du kannst jede Freigabe hier jederzeit wieder ausschalten. Erkennt ilho eine mögliche akute Krise, überspringt es die Auswertung.
        Für Chatantworten erhält Mistral AI den aktuellen Gesprächsverlauf. Die Modelltraining-Freigabe ist deaktiviert.
        Bei einem technischen Ausfall kann der Chat auf Anthropic wechseln. Die freiwillige Wochenauswertung erhält
        ausschließlich Gruppenstatistiken aus freigegebenen Nachrichten.
      </p>
      {fehler && <div style={{ ...text, fontSize: 13.5, color: C.rot || "#b3261e", marginTop: 8 }}>{fehler}</div>}
    </div>
  );
}
