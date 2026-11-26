import { useEffect, useState } from "react";
import { ladeGratisAngebote, gratisEinloesen, meinGratisProdukt, gratisRueckmeldung } from "../supabase";
import { LEBENSTHEMEN, PRODUKT_ARTEN, artName, KRISE_HINWEIS } from "./felder";
import { Chips, Knopf, Meldung, Feld, Text, sys, STANDARD } from "./ui";

/* Dein Gratis-Angebot — jede freigeschaltete Frau wählt genau EIN Angebot
   (Videokurs, Workbook oder Workshop) einer geprüften Coachin.
   Die Links sieht sie erst nach dem Einlösen. Nach 14 Tagen: kurze Rückmeldung (Formular A2). */

const TAG = 24 * 3600 * 1000;
const links = (text) => (text || "").split(/\s+/).filter((x) => /^https?:\/\//.test(x));

export default function GratisAngebot({ C = STANDARD, wunschThema = "" }) {
  const [mein, setMein] = useState(undefined);     // undefined = lädt
  const [liste, setListe] = useState([]);
  const [filter, setFilter] = useState(wunschThema && LEBENSTHEMEN.includes(wunschThema) ? wunschThema : "Alle");
  const [gewaehlt, setGewaehlt] = useState(null);  // Angebot in der Bestätigung
  const [meldung, setMeldung] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    meinGratisProdukt().then((m) => {
      setMein(m || null);
      if (!m) ladeGratisAngebote().then(setListe);
    });
  }, []);

  const einloesen = async () => {
    setBusy(true); setMeldung("");
    try {
      await gratisEinloesen(gewaehlt.id);
      setMein(await meinGratisProdukt());
      setGewaehlt(null);
    } catch (e) { setMeldung(e.message); }
    setBusy(false);
  };

  if (mein === undefined) return <p style={{ ...sys, color: C.ink, padding: 20 }}>Lädt …</p>;
  if (mein) return <MeinAngebot C={C} p={mein} setP={setMein} />;

  const themen = ["Alle", ...LEBENSTHEMEN.filter((t) => liste.some((p) => p.thema === t))];
  const sichtbar = liste.filter((p) => filter === "Alle" || p.thema === filter);

  return (
    <div style={{ padding: "8px 18px 30px" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.ink, lineHeight: 1.6, margin: "6px 0 14px" }}>
        Als Willkommensgeschenk darfst du dir <b>ein</b> Angebot einer geprüften Coachin aussuchen — kostenlos. Wähle in Ruhe; die Wahl gilt einmal.
      </p>

      {liste.length === 0 ? (
        <Meldung C={C}>Gerade sind noch keine Gratis-Angebote freigegeben. Schau bald wieder vorbei — wir sagen dir Bescheid.</Meldung>
      ) : (
        <>
          {themen.length > 2 && <div style={{ marginBottom: 14 }}><Chips C={C} wert={filter} setze={setFilter} optionen={themen} /></div>}
          <div style={{ display: "grid", gap: 12 }}>
            {sichtbar.map((p) => (
              <div key={p.id} style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 18, overflow: "hidden" }}>
                {p.vorschaubild_url && <img src={p.vorschaubild_url} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "1200 / 630", objectFit: "cover", display: "block" }} />}
                <div style={{ padding: 16 }}>
                  <div style={{ ...sys, fontSize: 12.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold }}>
                    {PRODUKT_ARTEN.find((a) => a.id === p.art)?.icon} {artName(p.art)} · {p.thema}
                  </div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, margin: "6px 0 4px" }}>{p.titel}</div>
                  <div style={{ ...sys, fontSize: 14, color: C.ink, marginBottom: 8 }}>von {p.coach || "einer geprüften Coachin"}{p.coach_beruf ? ` · ${p.coach_beruf}` : ""} · {p.umfang}</div>
                  <p style={{ ...sys, fontSize: 15, color: C.espresso, lineHeight: 1.55, margin: "0 0 12px" }}>{p.beschreibung}</p>
                  <Knopf C={C} onClick={() => setGewaehlt(p)}>Dieses Angebot wählen</Knopf>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {gewaehlt && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(20,10,20,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: C.card, width: "100%", maxWidth: 520, borderRadius: "22px 22px 0 0", padding: "22px 20px 28px" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, marginBottom: 8 }}>„{gewaehlt.titel}“ wählen?</div>
            <p style={{ ...sys, fontSize: 15, color: C.ink, lineHeight: 1.55, margin: "0 0 14px" }}>
              Du kannst dein Gratis-Angebot nur einmal wählen. Danach findest du es hier jederzeit wieder.
            </p>
            {meldung && <Meldung C={C} art="fehler">{meldung}</Meldung>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Knopf C={C} onClick={einloesen} disabled={busy}>{busy ? "…" : "Ja, das möchte ich"}</Knopf>
              <Knopf C={C} leise onClick={() => { setGewaehlt(null); setMeldung(""); }}>Noch einmal schauen</Knopf>
            </div>
          </div>
        </div>
      )}
      <p style={{ ...sys, fontSize: 12.5, color: C.ink, lineHeight: 1.5, marginTop: 18 }}>{KRISE_HINWEIS}</p>
    </div>
  );
}

function MeinAngebot({ C, p, setP }) {
  const tage = p.eingeloest_am ? Math.floor((Date.now() - new Date(p.eingeloest_am).getTime()) / TAG) : 0;
  const zeigeRueckmeldung = !p.feedback && tage >= 14;
  return (
    <div style={{ padding: "8px 18px 30px" }}>
      <div style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 18, padding: 18 }}>
        <div style={{ ...sys, fontSize: 12.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold }}>Dein Geschenk · {artName(p.art)}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 21, color: C.espresso, margin: "6px 0 4px" }}>{p.titel}</div>
        <div style={{ ...sys, fontSize: 14, color: C.ink, marginBottom: 10 }}>{p.coach ? `von ${p.coach} · ` : ""}{p.umfang}</div>
        {p.beschreibung && <p style={{ ...sys, fontSize: 15, color: C.espresso, lineHeight: 1.55, margin: "0 0 12px" }}>{p.beschreibung}</p>}
        <div style={{ display: "grid", gap: 8 }}>
          {links(p.inhalte).length > 0
            ? links(p.inhalte).map((l, i) => (
                <a key={l} href={l} target="_blank" rel="noopener noreferrer" style={{ ...sys, display: "flex", alignItems: "center", minHeight: 46, padding: "0 14px", borderRadius: 12, background: C.goldPale, color: C.plum, fontWeight: 650, textDecoration: "none" }}>
                  {p.art === "videokurs" ? `▶ Lektion ${i + 1}` : p.art === "workbook" ? "📘 Workbook öffnen" : "🎥 Zum Workshop"}
                </a>))
            : <p style={{ ...sys, fontSize: 15, color: C.espresso, lineHeight: 1.55, whiteSpace: "pre-wrap", margin: 0 }}>{p.inhalte}</p>}
        </div>
        {p.naechster_schritt && <p style={{ ...sys, fontSize: 14, color: C.ink, lineHeight: 1.5, marginTop: 14 }}>Wenn du weitergehen möchtest: {p.naechster_schritt}</p>}
      </div>
      {zeigeRueckmeldung && <Rueckmeldung C={C} onFertig={(f) => setP({ ...p, feedback: f })} />}
      {p.feedback && <Meldung C={C} art="ok">Danke für deine Rückmeldung 🤍</Meldung>}
      <p style={{ ...sys, fontSize: 12.5, color: C.ink, lineHeight: 1.5, marginTop: 18 }}>{KRISE_HINWEIS}</p>
    </div>
  );
}

// Formular A2 — Rückmeldung nach 14 Tagen
function Rueckmeldung({ C, onFertig }) {
  const [f, setF] = useState({ sterne: 0, abgeschlossen: "", weiter: "", fehlte: "" });
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  const setze = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const senden = async () => {
    if (!f.sterne || !f.abgeschlossen || !f.weiter) { setFehler("Bitte beantworte die ersten drei Fragen."); return; }
    setBusy(true);
    try { await gratisRueckmeldung(f); onFertig(f); } catch (e) { setFehler(e.message); }
    setBusy(false);
  };
  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 14 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, marginBottom: 10 }}>Wie war dein Geschenk?</div>
      <Feld C={C} label="Wie hilfreich war es?" pflicht>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} Sterne`} onClick={() => setze("sterne")(n)}
              style={{ fontSize: 28, width: 44, height: 44, border: "none", background: "none", cursor: "pointer", color: n <= f.sterne ? C.gold : C.line }}>★</button>
          ))}
        </div>
      </Feld>
      <Feld C={C} label="Hast du es abgeschlossen?" pflicht><Chips C={C} wert={f.abgeschlossen} setze={setze("abgeschlossen")} optionen={["ja", "teilweise", "nein"]} /></Feld>
      <Feld C={C} label="Möchtest du mit dieser Coachin weiterarbeiten?" pflicht><Chips C={C} wert={f.weiter} setze={setze("weiter")} optionen={["ja", "vielleicht", "nein"]} /></Feld>
      <Feld C={C} label="Was hat dir gefehlt?"><Text C={C} wert={f.fehlte} setze={setze("fehlte")} max={300} zeilen={2} /></Feld>
      {fehler && <Meldung C={C} art="fehler">{fehler}</Meldung>}
      <Knopf C={C} onClick={senden} disabled={busy}>{busy ? "…" : "Rückmeldung senden"}</Knopf>
    </div>
  );
}
