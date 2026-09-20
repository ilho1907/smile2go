// Kurse.jsx — Kurse, Kursdetail und Module.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { dateiLink, ladeAngebote, ladeKursFortschritt, ladeKursModule, modulErledigt, modulZurueck, stelleAnfrage } from "../supabase";
import { useEffect, useState } from "react";
import { CoachVerbinden } from "./Profil";
import { Btn, Card, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Kurse & Angebote: alles aus der Datenbank der eigenen Coachin ──────────
   Vorher standen hier erfundene Coachinnen und Preise im Code. Jetzt gilt:
   was die Coachin nicht angelegt hat, wird auch nicht gezeigt. Statt „Kaufen"
   gibt es eine Anfrage — sie landet bei ihr und im gemeinsamen Nachrichten-
   verlauf, damit sie nicht untergeht.                                      */

export const TYP_TITEL = { kurs: "Kurse", paket: "Coaching-Pakete", retreat: "Retreats", shop: "Weitere Angebote" };

export const TYP_ICON = { kurs: "🎬", paket: "🌸", retreat: "🏔️", shop: "✨" };

export const MODUL_ICON = { video: "🎬", audio: "🎧", text: "📖", aufgabe: "✍️" };

export function preisText(a) {
  if (a.preis_cent == null) return null;
  return `${(a.preis_cent / 100).toLocaleString("de-DE", { minimumFractionDigits: 0 })} ${a.waehrung === "EUR" ? "€" : a.waehrung}`;
}

export function KursDetail({ angebot, bindung, zurueck, addPunkte }) {
  const [module, setModule] = useState([]);
  const [fortschritt, setFortschritt] = useState({});
  const [offen, setOffen] = useState(null);
  const [medienUrl, setMedienUrl] = useState(null);
  const [laedt, setLaedt] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, f] = await Promise.all([ladeKursModule(angebot.id), ladeKursFortschritt(bindung?.id)]);
      setModule(m); setFortschritt(f); setLaedt(false);
    })();
  }, [angebot.id, bindung?.id]);

  const oeffnen = async (m) => {
    setOffen(offen?.id === m.id ? null : m);
    setMedienUrl(null);
    if (m.datei_pfad && offen?.id !== m.id) {
      const url = await dateiLink(m.datei_pfad, "coach-material", 900);
      setMedienUrl(url);
    }
  };

  const umschalten = async (m) => {
    if (fortschritt[m.id]) {
      await modulZurueck(bindung.id, m.id);
      setFortschritt((f) => { const n = { ...f }; delete n[m.id]; return n; });
    } else {
      await modulErledigt(bindung.id, m.id);
      setFortschritt((f) => ({ ...f, [m.id]: new Date().toISOString() }));
      addPunkte?.(5, "Modul abgeschlossen");
    }
  };

  const fertig = module.filter((m) => fortschritt[m.id]).length;
  const pct = module.length ? Math.round((fertig / module.length) * 100) : 0;

  return (
    <div style={{ padding: "20px 20px" }}>
      <button onClick={zurueck} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700, cursor: "pointer", padding: "0 0 12px" }}>
        ← Alle Angebote
      </button>

      <Eyebrow>{TYP_TITEL[angebot.typ] || "Angebot"}</Eyebrow>
      <H size={24} style={{ marginBottom: 6 }}>{angebot.titel}</H>
      {angebot.untertitel && (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 10 }}>{angebot.untertitel}</p>
      )}
      {angebot.beschreibung && (
        <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.espresso, lineHeight: 1.65, marginBottom: 16 }}>{angebot.beschreibung}</p>
      )}

      {module.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: C.espresso }}>Dein Fortschritt</span>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, fontWeight: 700 }}>{fertig}/{module.length}</span>
          </div>
          <div style={{ height: 8, borderRadius: 6, background: C.beige, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})`, transition: "width .4s ease" }} />
          </div>
        </Card>
      )}

      {laedt && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink }}>Lade Inhalte …</p>}

      {!laedt && module.length === 0 && (
        <Card>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            Für dieses Angebot sind noch keine Inhalte hinterlegt. Frag gern im Chat nach — deine Coachin schaltet sie dir frei.
          </p>
        </Card>
      )}

      {module.map((m) => {
        const auf = offen?.id === m.id;
        const erledigt = !!fortschritt[m.id];
        return (
          <Card key={m.id} style={{ marginBottom: 10, borderColor: erledigt ? C.sage : C.line }}>
            <div onClick={() => oeffnen(m)} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
                {MODUL_ICON[m.typ] || "📖"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{m.nr}. {m.titel}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: erledigt ? C.sage : C.ink, marginTop: 2, fontWeight: erledigt ? 700 : 400 }}>
                  {erledigt ? "✓ abgeschlossen" : m.dauer_min ? `${m.dauer_min} Min` : "offen"}
                </div>
              </div>
              <span style={{ color: C.gold, fontSize: 18 }}>{auf ? "▾" : "›"}</span>
            </div>

            {auf && (
              <div style={{ marginTop: 12, animation: "fadeUp .3s ease" }}>
                {m.text && (
                  <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{m.text}</p>
                )}
                {m.datei_pfad && !medienUrl && (
                  <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Lade Medien …</p>
                )}
                {medienUrl && m.typ === "video" && (
                  <video controls playsInline src={medienUrl} style={{ width: "100%", borderRadius: 12, background: C.espresso, maxHeight: 320 }} />
                )}
                {medienUrl && m.typ === "audio" && (
                  <audio controls src={medienUrl} style={{ width: "100%" }} />
                )}
                {medienUrl && m.typ !== "video" && m.typ !== "audio" && (
                  <a href={medienUrl} target="_blank" rel="noreferrer" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: C.plum }}>↗ Datei öffnen</a>
                )}
                <div style={{ marginTop: 12 }}>
                  <Btn small ghost={erledigt} onClick={() => umschalten(m)}>
                    {erledigt ? "↺ Doch noch offen" : "✓ Als erledigt markieren"}
                  </Btn>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export function Kurse({ bindung, aufBindung, addPunkte }) {
  const [angebote, setAngebote] = useState([]);
  const [laedt, setLaedt] = useState(true);
  const [detail, setDetail] = useState(null);
  const [anfrageFuer, setAnfrageFuer] = useState(null);
  const [anfrageText, setAnfrageText] = useState("");
  const [hinweis, setHinweis] = useState("");

  useEffect(() => {
    if (!bindung?.coach_id) { setLaedt(false); return; }
    ladeAngebote(bindung.coach_id).then((a) => { setAngebote(a); setLaedt(false); });
  }, [bindung?.coach_id]);

  const anfragen = async (a) => {
    const erg = await stelleAnfrage({
      klientinId: bindung.id, coachId: bindung.coach_id, angebotId: a.id,
      titel: a.titel, nachricht: anfrageText.trim() || null,
    });
    setAnfrageFuer(null); setAnfrageText("");
    setHinweis(erg
      ? `✓ Deine Anfrage zu „${a.titel}" ist bei ${bindung.coach_name || "deiner Coachin"} — sie meldet sich im Chat.`
      : "Anfrage konnte nicht gesendet werden.");
    setTimeout(() => setHinweis(""), 5000);
  };

  if (!bindung?.coach_id)
    return (
      <div style={{ padding: "20px 20px" }}>
        <Eyebrow>Kurse & Angebote</Eyebrow>
        <H size={24} style={{ marginBottom: 10 }}>Hier erscheinen die Angebote deiner Coachin</H>
        <CoachVerbinden onVerbunden={aufBindung} />
      </div>
    );

  if (detail)
    return <KursDetail angebot={detail} bindung={bindung} addPunkte={addPunkte} zurueck={() => setDetail(null)} />;

  const gruppen = ["kurs", "paket", "retreat", "shop"].filter((t) => angebote.some((a) => a.typ === t));

  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Kurse & Angebote</Eyebrow>
      <H size={24} style={{ marginBottom: 4 }}>Was unsere Coachinnen anbieten</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5, marginBottom: 12 }}>
        Zuerst das, was {bindung.coach_name || "deine Coachin"} für dich hinterlegt hat.
      </p>

      {hinweis && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: C.plum, background: C.roseSoft, borderRadius: 12, padding: "11px 14px", marginBottom: 14, lineHeight: 1.5 }}>{hinweis}</div>
      )}

      {laedt && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink }}>Lade Angebote …</p>}

      {!laedt && angebote.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🌱</div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            {bindung.coach_name || "Deine Coachin"} hat hier noch keine Kurse oder Pakete eingestellt.
            Sobald sie etwas anlegt, findest du es hier.
          </p>
        </Card>
      )}

      {gruppen.map((typ) => (
        <div key={typ} style={{ marginBottom: 22 }}>
          <Eyebrow color={C.plum}>{TYP_ICON[typ]} {TYP_TITEL[typ]}</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {angebote.filter((a) => a.typ === typ).map((a) => (
              <Card key={a.id} style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>{TYP_ICON[typ]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{a.titel}</div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 2 }}>
                      {[a.untertitel, a.einheiten, a.thema].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {preisText(a) && (
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.plum, whiteSpace: "nowrap" }}>{preisText(a)}</div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
                  {typ === "kurs" && (
                    <Btn small onClick={() => setDetail(a)}>Inhalte ansehen</Btn>
                  )}
                  <Btn small ghost onClick={() => { setAnfrageFuer(anfrageFuer === a.id ? null : a.id); setAnfrageText(""); }}>
                    {anfrageFuer === a.id ? "Abbrechen" : "Ich hab Interesse"}
                  </Btn>
                </div>

                {anfrageFuer === a.id && (
                  <div style={{ marginTop: 12, animation: "fadeUp .3s ease" }}>
                    <textarea
                      value={anfrageText}
                      onChange={(e) => setAnfrageText(e.target.value)}
                      rows={3}
                      placeholder="Magst du kurz schreiben, was dich daran anspricht? (optional)"
                      style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
                    />
                    <Btn small full onClick={() => anfragen(a)}>Anfrage senden</Btn>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.75, lineHeight: 1.6, marginTop: 6 }}>
        Bezahlung läuft noch nicht über die App: deine Anfrage geht direkt an deine Coachin, ihr klärt alles Weitere im Chat.
      </p>
    </div>
  );
}

