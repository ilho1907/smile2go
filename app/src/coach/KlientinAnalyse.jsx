/* Klientinnen-Analyse im Coach-Panel.
   Liest ausschließlich, was die Klientin freigegeben hat (Tabelle consent,
   RPC coach_klientin_analyse). Keine Gespräche, keine Deutung, keine Diagnose —
   nur ihr eigener Verlauf als Grundlage für die nächste Session. */
import { useEffect, useMemo, useState } from "react";
import { ladeKlientinAnalyse, FREIGABE_BEREICHE } from "../supabase";

const STIMMUNG_WORT = { 1: "sehr schwer", 2: "schwer", 3: "gemischt", 4: "gut", 5: "sehr gut" };

export default function KlientinAnalyse({ klientin, C, onSchliessen }) {
  const [tage, setTage] = useState(30);
  const [daten, setDaten] = useState(null);

  useEffect(() => {
    setDaten(null);
    ladeKlientinAnalyse(klientin.id, klientin.user_id, tage).then(setDaten);
  }, [klientin.id, tage]);

  const auswertung = useMemo(() => {
    const e = daten?.eintraege || [];
    const st = e.filter((x) => x.stimmung).map((x) => x.stimmung);
    const themen = {};
    e.forEach((x) => (x.themen || []).forEach((t) => { themen[t] = (themen[t] || 0) + 1; }));
    const ziele = [...new Set(e.flatMap((x) => x.ziele || []))].slice(0, 8);
    return {
      anzahl: e.length,
      schnitt: st.length ? st.reduce((a, b) => a + b, 0) / st.length : null,
      verlauf: [...e].reverse().filter((x) => x.stimmung),
      themen: Object.entries(themen).sort((a, b) => b[1] - a[1]).slice(0, 8),
      ziele,
      kurz: e.filter((x) => x.zusammenfassung).slice(0, 8),
    };
  }, [daten]);

  const t = { fontFamily: "system-ui, sans-serif", color: C.ink };
  const kopf = { fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso, margin: "16px 0 6px" };
  const freigaben = daten?.freigaben || {};
  const coachBereiche = FREIGABE_BEREICHE.filter((b) => b.fuer === "coachin");
  const nichtsFrei = daten && !coachBereiche.some((b) => freigaben[b.id]);

  return (
    <div style={{ background: C.beige, borderRadius: 16, padding: 16, margin: "-4px 0 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, flex: 1 }}>
          Entwicklung · {klientin.anzeigename || "Klientin"}
        </div>
        {[30, 90, 365].map((n) => (
          <button key={n} onClick={() => setTage(n)} style={{ ...t, fontSize: 13, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 12, padding: "4px 10px", cursor: "pointer", background: tage === n ? C.plum : C.card, color: tage === n ? "#fff" : C.ink }}>
            {n === 365 ? "1 Jahr" : `${n} Tage`}
          </button>
        ))}
        <button onClick={onSchliessen} style={{ ...t, background: "none", border: "none", fontSize: 18, cursor: "pointer" }} aria-label="Schließen">✕</button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {coachBereiche.map((b) => (
          <span key={b.id} style={{ ...t, fontSize: 12, borderRadius: 10, padding: "3px 9px", background: freigaben[b.id] ? C.roseSoft : C.card, color: freigaben[b.id] ? C.plum : C.ink, border: `1px solid ${C.line}` }}>
            {freigaben[b.id] ? "✓" : "–"} {b.titel}
          </span>
        ))}
      </div>

      {!daten && <p style={{ ...t, fontSize: 14 }}>Lade …</p>}

      {nichtsFrei && (
        <p style={{ ...t, fontSize: 14.5, lineHeight: 1.6 }}>
          {klientin.anzeigename || "Deine Klientin"} hat noch nichts freigegeben. Das entscheidet sie selbst in ihrem Profil unter
          „Was ilho teilen darf“. Sprich es gern in der nächsten Session an — ohne Druck.
        </p>
      )}

      {daten && !nichtsFrei && auswertung.anzahl === 0 && (
        <p style={{ ...t, fontSize: 14.5 }}>In diesem Zeitraum gibt es noch keine freigegebenen ilho-Gespräche.</p>
      )}

      {daten && auswertung.anzahl > 0 && (
        <>
          <div style={{ ...t, fontSize: 13.5, marginTop: 10 }}>{auswertung.anzahl} Gespräch(e) mit ilho im Zeitraum</div>

          {freigaben.stimmung && auswertung.verlauf.length > 0 && (
            <>
              <div style={kopf}>
                Stimmung · Ø {auswertung.schnitt.toFixed(1)} ({STIMMUNG_WORT[Math.round(auswertung.schnitt)]})
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 64, background: C.card, borderRadius: 10, padding: "8px 10px" }}>
                {auswertung.verlauf.slice(-40).map((x, i) => (
                  <div key={i} title={`${new Date(x.created_at).toLocaleDateString("de-DE")} · ${STIMMUNG_WORT[x.stimmung]}`}
                    style={{ flex: 1, maxWidth: 14, height: `${x.stimmung * 20}%`, borderRadius: 3, background: `linear-gradient(180deg, ${C.rose}, ${C.plum})` }} />
                ))}
              </div>
              <div style={{ ...t, fontSize: 11.5, marginTop: 4 }}>Selbstauskunft der Klientin, keine Bewertung.</div>
            </>
          )}

          {freigaben.themen && auswertung.themen.length > 0 && (
            <>
              <div style={kopf}>Häufige Themen</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {auswertung.themen.map(([thema, n]) => (
                  <span key={thema} style={{ ...t, fontSize: 13, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "4px 10px" }}>
                    {thema} · {n}×
                  </span>
                ))}
              </div>
            </>
          )}

          {freigaben.ziele && auswertung.ziele.length > 0 && (
            <>
              <div style={kopf}>Ihre Ziele (in ihren Worten)</div>
              {auswertung.ziele.map((z) => <div key={z} style={{ ...t, fontSize: 14, lineHeight: 1.6 }}>– {z}</div>)}
            </>
          )}

          {freigaben.fortschritt && auswertung.kurz.length > 0 && (
            <>
              <div style={kopf}>Letzte Gespräche</div>
              {auswertung.kurz.map((x, i) => (
                <div key={i} style={{ ...t, fontSize: 14, lineHeight: 1.55, padding: "6px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                  <span style={{ fontWeight: 700, color: C.espresso }}>{new Date(x.created_at).toLocaleDateString("de-DE")}</span> · {x.zusammenfassung}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
