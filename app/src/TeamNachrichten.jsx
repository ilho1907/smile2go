import { useState, useEffect, useRef } from "react";
import { supabase, ladeTeamNachrichten, sendeTeamNachricht, teamNachrichtenGelesen } from "./supabase";

/* Nachricht ans smile2go-Team — eigener Kanal neben dem Coach-Chat.
   Was hier steht, lesen nur die Admins von smile2go, nicht die Coachin.
   Antworten des Teams und Rundnachrichten erscheinen im selben Verlauf. */

const F = {
  cream: "#FBF6FA", card: "#FFFDFE", beige: "#F5EBF3", line: "#EFDFEC",
  gold: "#8E4C85", goldPale: "#F9EAF4", espresso: "#2E2430", ink: "#7A6B7A", plum: "#6E3568",
};
const sys = { fontFamily: "system-ui, sans-serif" };
const zeit = (iso) => new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function TeamNachrichten() {
  const [verlauf, setVerlauf] = useState(undefined);   // undefined = lädt, null = nicht erreichbar
  const [text, setText] = useState("");
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState("");
  const ende = useRef(null);

  const laden = () => ladeTeamNachrichten().then((v) => { setVerlauf(v); if (v) teamNachrichtenGelesen(); });
  useEffect(() => { laden(); const t = setInterval(laden, 30000); return () => clearInterval(t); }, []);
  useEffect(() => { ende.current?.scrollIntoView({ block: "end" }); }, [verlauf?.length]);

  const senden = async () => {
    if (!text.trim() || sendet) return;
    setSendet(true); setFehler("");
    const neu = await sendeTeamNachricht(text);
    setSendet(false);
    if (neu) { setText(""); setVerlauf((v) => [...(v || []), neu]); }
    else setFehler("Das hat nicht geklappt — bitte später noch einmal versuchen.");
  };

  if (!supabase || verlauf === null)
    return (
      <div style={{ padding: 22 }}>
        <p style={{ ...sys, fontSize: 15, color: F.ink, lineHeight: 1.6 }}>
          Nachrichten ans Team sind gerade nicht erreichbar. Bitte prüfe, ob du angemeldet und online bist, und versuche es etwas später noch einmal.
        </p>
      </div>
    );

  return (
    <div style={{ padding: "18px 18px 28px" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.55, color: F.espresso, margin: "0 0 6px" }}>
        Schreib uns, wenn du eine Frage hast, etwas nicht klappt oder du eine Idee für smile2go hast.
      </p>
      <p style={{ ...sys, fontSize: 12, color: F.ink, lineHeight: 1.5, margin: "0 0 18px" }}>
        Diese Nachrichten liest nur das smile2go-Team — nicht deine Coachin. In einer Krise ruf bitte die TelefonSeelsorge an (0800 111 0 111) oder im Notfall die 112.
      </p>

      <div style={{ display: "grid", gap: 9, marginBottom: 16 }}>
        {verlauf === undefined && <p style={{ ...sys, fontSize: 14, color: F.ink }}>Lade …</p>}
        {verlauf?.length === 0 && <p style={{ ...sys, fontSize: 14, color: F.ink }}>Noch keine Nachrichten.</p>}
        {(verlauf || []).map((n) => {
          const team = n.absender === "team";
          return (
            <div key={n.id} style={{
              justifySelf: team ? "start" : "end", maxWidth: "86%", padding: "10px 14px", borderRadius: 16,
              background: team ? F.card : F.goldPale, border: `1px solid ${F.line}`,
              ...sys, fontSize: 15, lineHeight: 1.5, color: F.espresso, whiteSpace: "pre-wrap",
            }}>
              {team && <div style={{ fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase", color: F.gold, fontWeight: 700, marginBottom: 3 }}>smile2go-Team</div>}
              {n.text}
              <div style={{ fontSize: 10.5, color: F.ink, marginTop: 4, textAlign: "right" }}>{zeit(n.created_at)}</div>
            </div>
          );
        })}
        <div ref={ende} />
      </div>

      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="Deine Nachricht an uns …"
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 16, ...sys, border: `1.5px solid ${F.line}`, borderRadius: 14, background: F.card, color: F.espresso, outline: "none", resize: "vertical" }} />
      {fehler && <p style={{ ...sys, fontSize: 13, color: "#B0492F", margin: "6px 0 0" }}>{fehler}</p>}
      <button onClick={senden} disabled={sendet || !text.trim()} style={{
        marginTop: 10, width: "100%", padding: "14px 16px", borderRadius: 16, border: "none", cursor: "pointer",
        background: F.gold, color: "#fff", ...sys, fontSize: 15.5, fontWeight: 700, opacity: text.trim() && !sendet ? 1 : 0.5,
      }}>{sendet ? "Wird gesendet …" : "An das Team senden"}</button>
    </div>
  );
}
