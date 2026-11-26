import { useEffect, useState } from "react";
import {
  adminKennenlernen, adminKennenlernProtokoll, adminCoachVerifizierungen, adminCoachVerifizieren,
  adminGratisProdukte, adminGratisPruefen,
} from "../supabase";
import { LEBENSTHEMEN, FREIGABE_CHECK, VERIFIZIERUNG_CHECK, artName } from "./felder";
import { Feld, Text, Auswahl, Haken, JaNein, Knopf, Meldung, Abschnitt, sys } from "./ui";

/* s2g.admin — Formular B (Gesprächsprotokoll der Begleiterin) im Profil einer Frau,
   und der Reiter „Prüfung“ mit Formular C Teil 3 (Coach-Verifizierung) und
   Formular E (Freigabe der Gratis-Produkte). Jede Entscheidung trifft ein Mensch. */

const datum = (iso) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "–");
const heute = () => new Date().toISOString().slice(0, 10);

function Box({ C, children, style }) {
  return <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, ...style }}>{children}</div>;
}
function Kopf({ C, children }) {
  return <div style={{ ...sys, fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 8 }}>{children}</div>;
}
function Zeile({ C, l, children }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: `1px solid ${C.line}`, ...sys, fontSize: 14 }}>
      <span style={{ width: 140, flexShrink: 0, color: C.ink }}>{l}</span>
      <span style={{ color: C.espresso, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{children || "–"}</span>
    </div>
  );
}
const Status = ({ C, s }) => {
  const f = { eingereicht: ["#FBF0DC", "#9A6A1F"], verifiziert: ["#EAF6EC", "#2F6B5B"], freigegeben: ["#EAF6EC", "#2F6B5B"],
    nachreichung: ["#FBF0DC", "#9A6A1F"], ueberarbeiten: ["#FBF0DC", "#9A6A1F"], abgelehnt: ["#F9E8E2", "#B0492F"] }[s] || [C.goldPale, C.plum];
  const t = { ueberarbeiten: "überarbeiten" }[s] || s;
  return <span style={{ ...sys, fontSize: 11, fontWeight: 700, background: f[0], color: f[1], borderRadius: 20, padding: "3px 10px" }}>{t}</span>;
};

// ── Formular B im Profil ────────────────────────────────────────────────────
const B_LEER = {
  gespraech_am: heute(), dauer_min: "20", kamera_an: false, echte_person: "", als_frau: "", volljaehrig: "",
  krise: false, regeln_erklaert: false, keine_therapie: false, thema: "", notiz: "", empf_paket: "",
  agent_darf_notiz: false, empfehlung: "", begruendung: "",
};

export function KennenlernKarte({ C, userId, freigeschaltet, onFreischalten }) {
  const [d, setD] = useState(undefined);
  const [b, setB] = useState(B_LEER);
  const [offen, setOffen] = useState(false);
  const [meldung, setMeldung] = useState(null);
  const [busy, setBusy] = useState(false);
  const setze = (k) => (v) => setB((x) => ({ ...x, [k]: v }));

  const laden = () => adminKennenlernen(userId).then((r) => {
    setD(r || {});
    const p = r?.protokoll;
    if (p) setB({ ...B_LEER, ...p, dauer_min: p.dauer_min ? String(p.dauer_min) : "", notiz: p.notiz || "", begruendung: p.begruendung || "", thema: p.thema || "", empf_paket: p.empf_paket || "" });
    else if (r?.anfrage?.thema) setB((x) => ({ ...x, thema: LEBENSTHEMEN.includes(r.anfrage.thema) ? r.anfrage.thema : "" }));
  });
  useEffect(() => { laden(); }, [userId]);

  const unsicher = [b.echte_person, b.als_frau, b.volljaehrig].includes("unsicher");
  const allesJa = b.echte_person === "ja" && b.als_frau === "ja" && b.volljaehrig === "ja" && b.kamera_an;

  const speichern = async () => {
    setMeldung(null);
    if (!b.echte_person || !b.als_frau || !b.volljaehrig || !b.empfehlung) return setMeldung(["fehler", "Bitte alle drei Prüfpunkte und die Empfehlung ausfüllen."]);
    if ((b.empfehlung === "ablehnen" || unsicher) && !b.begruendung.trim()) return setMeldung(["fehler", "Bei „unsicher“ oder „ablehnen“ bitte kurz begründen."]);
    if (b.empfehlung === "freischalten" && !allesJa) return setMeldung(["fehler", "„Freischalten“ geht nur, wenn Kamera an war und alle drei Prüfpunkte „ja“ sind."]);
    if (b.krise && b.empfehlung === "freischalten") return setMeldung(["fehler", "Bei Hinweisen auf eine Krise bitte nicht direkt freischalten — erst Rücksprache im Team."]);
    setBusy(true);
    try {
      await adminKennenlernProtokoll(userId, b);
      await laden();
      setOffen(false);
      setMeldung(["ok", "Protokoll gespeichert."]);
    } catch (e) { setMeldung(["fehler", e.message]); }
    setBusy(false);
  };

  if (d === undefined) return null;
  const a = d.anfrage;
  const p = d.protokoll;

  return (
    <Box C={C} style={{ marginTop: 14 }}>
      <Kopf C={C}>Kennenlerngespräch</Kopf>
      {!a ? <p style={{ ...sys, fontSize: 14, color: C.ink, margin: "0 0 8px" }}>Noch keine Anmeldung (Formular A) ausgefüllt.</p> : (
        <>
          <Zeile C={C} l="Vorname">{a.vorname}</Zeile>
          <Zeile C={C} l="Thema">{a.thema}</Zeile>
          <Zeile C={C} l="Wunsch">{a.wunsch}</Zeile>
          <Zeile C={C} l="Interessen">{(a.interessen || []).join(", ")}</Zeile>
          <Zeile C={C} l="Sprache">{a.sprache}</Zeile>
          <Zeile C={C} l="Wunschtermin">{a.wunschtermin}</Zeile>
          <Zeile C={C} l="Telefon">{a.telefon}</Zeile>
          <Zeile C={C} l="Quelle">{a.quelle}</Zeile>
          <Zeile C={C} l="Angemeldet am">{datum(a.erstellt)}</Zeile>
        </>
      )}

      {p && !offen && (
        <div style={{ marginTop: 12 }}>
          <Zeile C={C} l="Gespräch">{datum(p.gespraech_am)}{p.dauer_min ? ` · ${p.dauer_min} Min.` : ""} · {p.begleiterin_email || "–"}</Zeile>
          <Zeile C={C} l="Prüfung">Person: {p.echte_person} · Frau: {p.als_frau} · 18+: {p.volljaehrig} · Kamera: {p.kamera_an ? "an" : "aus"}</Zeile>
          {p.krise && <Zeile C={C} l="Krise">⚠️ Hinweise auf Krise notiert</Zeile>}
          <Zeile C={C} l="Empfehlung">{{ freischalten: "freischalten", zweites_gespraech: "zweites Gespräch", ablehnen: "ablehnen" }[p.empfehlung]}{p.begruendung ? ` · ${p.begruendung}` : ""}</Zeile>
          {p.notiz && <Zeile C={C} l="Notiz">{p.notiz}{p.agent_darf_notiz ? " (ilho darf sie kennen)" : ""}</Zeile>}
          {d.gratis && <Zeile C={C} l="Gratis-Angebot">{d.gratis.titel} · {datum(d.gratis.eingeloest_am)}{d.gratis.feedback?.sterne ? ` · ${d.gratis.feedback.sterne}★` : ""}</Zeile>}
        </div>
      )}

      {meldung && <Meldung C={C} art={meldung[0]}>{meldung[1]}</Meldung>}
      {!offen && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <Knopf C={C} leise onClick={() => { setOffen(true); setMeldung(null); }}>{p ? "Protokoll bearbeiten" : "📝 Gesprächsprotokoll ausfüllen"}</Knopf>
          {p?.empfehlung === "freischalten" && !freigeschaltet && <Knopf C={C} onClick={onFreischalten}>✓ Jetzt freischalten</Knopf>}
        </div>
      )}

      {offen && (
        <div style={{ marginTop: 6 }}>
          <Abschnitt C={C} titel="Teil 1 — Verifizierung">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Feld C={C} label="Datum"><input type="date" value={b.gespraech_am} onChange={(e) => setze("gespraech_am")(e.target.value)} style={{ ...sys, fontSize: 15, padding: 9, borderRadius: 10, border: `1.5px solid ${C.line}`, width: "100%", boxSizing: "border-box" }} /></Feld>
              <Feld C={C} label="Dauer (Min.)"><Text C={C} wert={b.dauer_min} setze={setze("dauer_min")} max={3} inputMode="numeric" /></Feld>
            </div>
            <Haken C={C} wert={b.kamera_an} setze={setze("kamera_an")}>Kamera war an, Person klar erkennbar</Haken>
            <Feld C={C} label="Echte Person (kein Fake-Profil, Name passt)" pflicht><JaNein C={C} wert={b.echte_person} setze={setze("echte_person")} /></Feld>
            <Feld C={C} label="Teilnahme als Frau bestätigt" pflicht><JaNein C={C} wert={b.als_frau} setze={setze("als_frau")} /></Feld>
            <Feld C={C} label="Mindestens 18 Jahre" pflicht><JaNein C={C} wert={b.volljaehrig} setze={setze("volljaehrig")} /></Feld>
            <Haken C={C} wert={b.krise} setze={setze("krise")}>Hinweise auf akute Krise / Selbstgefährdung → Krisenplan (112, TelefonSeelsorge 0800 111 0 111), keine Freischaltung ohne Rücksprache</Haken>
            <Haken C={C} wert={b.regeln_erklaert} setze={setze("regeln_erklaert")}>Community-Regeln erklärt und akzeptiert</Haken>
            <Haken C={C} wert={b.keine_therapie} setze={setze("keine_therapie")}>„Kein Therapieangebot“ erklärt</Haken>
          </Abschnitt>
          <Abschnitt C={C} titel="Teil 2 — Thema & Empfehlung">
            <Feld C={C} label="Hauptthema"><Auswahl C={C} wert={b.thema} setze={setze("thema")} optionen={LEBENSTHEMEN} /></Feld>
            <Feld C={C} label="Kurze Notiz zum Anliegen" hinweis={a?.einwilligung_thema ? "Einwilligung liegt vor. Keine Diagnosen notieren." : "Keine Einwilligung zum Thema — bitte nichts Persönliches notieren."}>
              <Text C={C} wert={b.notiz} setze={setze("notiz")} max={500} zeilen={3} />
            </Feld>
            <Feld C={C} label="Empfohlenes Paket"><Auswahl C={C} wert={b.empf_paket} setze={setze("empf_paket")} optionen={["Basis", "Plus", "Gold", "offen"]} /></Feld>
            <Haken C={C} wert={b.agent_darf_notiz} setze={setze("agent_darf_notiz")}>Sie hat erlaubt, dass ihr persönlicher ilho-Agent diese Notiz kennt</Haken>
          </Abschnitt>
          <Abschnitt C={C} titel="Teil 3 — Entscheidung">
            <Feld C={C} label="Empfehlung" pflicht>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["freischalten", "freischalten"], ["zweites_gespraech", "zweites Gespräch"], ["ablehnen", "ablehnen"]].map(([k, t]) => (
                  <button key={k} type="button" onClick={() => setze("empfehlung")(k)} aria-pressed={b.empfehlung === k} style={{
                    ...sys, fontSize: 14, minHeight: 38, padding: "0 14px", borderRadius: 10, cursor: "pointer", fontWeight: 600,
                    border: `1.5px solid ${b.empfehlung === k ? C.gold : C.line}`, background: b.empfehlung === k ? C.goldPale : "#fff", color: C.espresso,
                  }}>{t}</button>
                ))}
              </div>
            </Feld>
            {(b.empfehlung === "ablehnen" || b.empfehlung === "zweites_gespraech" || unsicher) && (
              <Feld C={C} label="Begründung" pflicht={b.empfehlung === "ablehnen" || unsicher}><Text C={C} wert={b.begruendung} setze={setze("begruendung")} max={400} zeilen={2} /></Feld>
            )}
            <p style={{ ...sys, fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>
              Regel: alle drei „ja“ → freischalten. Ein „unsicher“ → zweites Gespräch mit einer anderen Begleiterin. Ein „nein“ → freundliche Absage.
            </p>
          </Abschnitt>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <Knopf C={C} onClick={speichern} disabled={busy}>{busy ? "…" : "Protokoll speichern"}</Knopf>
            <Knopf C={C} leise onClick={() => { setOffen(false); setMeldung(null); }}>Abbrechen</Knopf>
          </div>
        </div>
      )}
    </Box>
  );
}

// ── Reiter „Prüfung“: Formular C (Teil 3) + Formular E ─────────────────────
export function PruefungTab({ C }) {
  const [coaches, setCoaches] = useState(undefined);
  const [produkte, setProdukte] = useState(undefined);
  const laden = () => {
    adminCoachVerifizierungen().then(setCoaches).catch(() => setCoaches(null));
    adminGratisProdukte().then(setProdukte).catch(() => setProdukte(null));
  };
  useEffect(() => { laden(); }, []);
  const offenC = (coaches || []).filter((c) => c.status === "eingereicht").length;
  const offenP = (produkte || []).filter((p) => p.status === "eingereicht").length;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Box C={C}>
        <Kopf C={C}>Coach-Verifizierung (Formular C){offenC ? ` · ${offenC} offen` : ""}</Kopf>
        {coaches === undefined ? <p style={{ ...sys, color: C.ink }}>Lade …</p>
          : coaches === null || coaches.length === 0 ? <p style={{ ...sys, fontSize: 14, color: C.ink }}>Noch keine Einreichungen. {coaches === null && "(Ist die Migration 20261126_kennenlernen_gratis eingespielt?)"}</p>
          : coaches.map((c) => <CoachPruefen key={c.coach_id} C={C} c={c} onFertig={laden} />)}
      </Box>
      <Box C={C}>
        <Kopf C={C}>Gratis-Produkte (Formular E){offenP ? ` · ${offenP} offen` : ""}</Kopf>
        {produkte === undefined ? <p style={{ ...sys, color: C.ink }}>Lade …</p>
          : produkte === null || produkte.length === 0 ? <p style={{ ...sys, fontSize: 14, color: C.ink }}>Noch keine Gratis-Produkte eingereicht.</p>
          : produkte.map((p) => <ProduktPruefen key={p.id} C={C} p={p} onFertig={laden} />)}
      </Box>
      <p style={{ ...sys, fontSize: 11.5, color: C.ink, lineHeight: 1.5 }}>
        Zertifikate und Ausweise werden nicht hochgeladen oder gespeichert — sie zeigt sie im Videogespräch, hier steht nur „geprüft am … von …“.
      </p>
    </div>
  );
}

function CoachPruefen({ C, c, onFertig }) {
  const [auf, setAuf] = useState(c.status === "eingereicht");
  const [haken, setHaken] = useState(c.pruefung || {});
  const [kommentar, setKommentar] = useState(c.admin_kommentar || "");
  const [meldung, setMeldung] = useState(null);
  const [busy, setBusy] = useState(false);
  const alle = VERIFIZIERUNG_CHECK.every((x) => haken[x.k]);
  const entscheiden = async (status) => {
    setBusy(true); setMeldung(null);
    try { await adminCoachVerifizieren(c.coach_id, status, haken, kommentar); onFertig(); }
    catch (e) { setMeldung(e.message); }
    setBusy(false);
  };
  const b = c.bestaetigungen || {};
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, padding: "12px 0" }}>
      <button onClick={() => setAuf((x) => !x)} style={{ ...sys, display: "flex", width: "100%", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
        <span style={{ flex: 1 }}>
          <b style={{ fontSize: 15, color: C.espresso }}>{c.name}</b>
          <span style={{ fontSize: 13, color: C.ink }}> · {c.rolle} · {c.berufsbezeichnung} · {c.hauptthema}</span>
        </span>
        <Status C={C} s={c.status} />
      </button>
      {auf && (
        <div style={{ marginTop: 10 }}>
          <Zeile C={C} l="E-Mail">{c.email}</Zeile>
          <Zeile C={C} l="Weitere Themen">{(c.weitere_themen || []).join(", ")}</Zeile>
          <Zeile C={C} l="Sprachen">{(c.sprachen || []).join(", ")}</Zeile>
          <Zeile C={C} l="Kurzprofil">{c.kurzprofil}</Zeile>
          <Zeile C={C} l="Website">{c.website}</Zeile>
          <Zeile C={C} l="Ausbildungen">{c.ausbildungen}</Zeile>
          <Zeile C={C} l="Erfahrung">{c.erfahrung_jahre} Jahre</Zeile>
          <Zeile C={C} l="Heilerlaubnis">{c.heilerlaubnis ? "ja" : "nein"}</Zeile>
          <Zeile C={C} l="Bestätigt">{["heilprg", "gewerbe", "rechte", "richtlinien", "datenschutz"].map((k) => `${b[k] ? "✓" : "✗"} ${k}`).join("  ")}</Zeile>
          {c.geprueft_am && <Zeile C={C} l="Geprüft">{datum(c.geprueft_am)} · {c.geprueft_von_email}</Zeile>}
          <div style={{ marginTop: 12 }}>
            {VERIFIZIERUNG_CHECK.map((x) => <Haken key={x.k} C={C} wert={haken[x.k]} setze={(v) => setHaken((h) => ({ ...h, [x.k]: v }))}>{x.t}</Haken>)}
          </div>
          <Feld C={C} label="Nachricht an sie (Pflicht bei Nachreichung/Ablehnung)"><Text C={C} wert={kommentar} setze={setKommentar} max={400} zeilen={2} /></Feld>
          {meldung && <Meldung C={C} art="fehler">{meldung}</Meldung>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Knopf C={C} onClick={() => entscheiden("verifiziert")} disabled={busy || !alle}>✓ Verifizieren</Knopf>
            <Knopf C={C} leise onClick={() => entscheiden("nachreichung")} disabled={busy}>Nachreichung</Knopf>
            <Knopf C={C} leise onClick={() => entscheiden("abgelehnt")} disabled={busy}>Ablehnen</Knopf>
          </div>
        </div>
      )}
    </div>
  );
}

function ProduktPruefen({ C, p, onFertig }) {
  const [auf, setAuf] = useState(p.status === "eingereicht");
  const start = p.pruefung || { coach_verifiziert: p.coach_status === "verifiziert", thema_passt: p.thema === p.coach_hauptthema };
  const [haken, setHaken] = useState(start);
  const [kommentar, setKommentar] = useState(p.admin_kommentar || "");
  const [meldung, setMeldung] = useState(null);
  const [busy, setBusy] = useState(false);
  const alle = FREIGABE_CHECK.every((x) => haken[x.k]);
  const entscheiden = async (status) => {
    setBusy(true); setMeldung(null);
    const voll = Object.fromEntries(FREIGABE_CHECK.map((x) => [x.k, !!haken[x.k]]));
    try { await adminGratisPruefen(p.id, status, voll, kommentar); onFertig(); }
    catch (e) { setMeldung(e.message); }
    setBusy(false);
  };
  const b = p.bestaetigungen || {};
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, padding: "12px 0" }}>
      <button onClick={() => setAuf((x) => !x)} style={{ ...sys, display: "flex", width: "100%", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
        <span style={{ flex: 1 }}>
          <b style={{ fontSize: 15, color: C.espresso }}>{p.titel}</b>
          <span style={{ fontSize: 13, color: C.ink }}> · {artName(p.art)} · {p.thema} · {p.coach || p.email}{p.einloesungen ? ` · ${p.einloesungen}× gewählt` : ""}</span>
        </span>
        <Status C={C} s={p.status} />
      </button>
      {auf && (
        <div style={{ marginTop: 10 }}>
          <Zeile C={C} l="Coachin">{p.coach || "–"} ({p.email}) · Verifizierung: {p.coach_status} · Hauptthema: {p.coach_hauptthema || "–"}</Zeile>
          <Zeile C={C} l="Beschreibung">{p.beschreibung}</Zeile>
          <Zeile C={C} l="Umfang">{p.umfang}</Zeile>
          <Zeile C={C} l="Methode">{p.methode}</Zeile>
          <Zeile C={C} l="Inhalte">{p.inhalte}</Zeile>
          <Zeile C={C} l="Vorschaubild">{p.vorschaubild_url}</Zeile>
          <Zeile C={C} l="Nächster Schritt">{p.naechster_schritt}</Zeile>
          <Zeile C={C} l="Verfügbar bis">{p.verfuegbar_bis ? datum(p.verfuegbar_bis) : "unbefristet"}</Zeile>
          <Zeile C={C} l="Bestätigt">{["keine_therapie", "krisenhinweis", "erlaubnis", "rechte"].map((k) => `${b[k] ? "✓" : "✗"} ${k}`).join("  ")}</Zeile>
          <div style={{ marginTop: 12 }}>
            {FREIGABE_CHECK.map((x) => <Haken key={x.k} C={C} wert={haken[x.k]} setze={(v) => setHaken((h) => ({ ...h, [x.k]: v }))}>{x.t}</Haken>)}
          </div>
          <Feld C={C} label="Nachricht an die Coachin (Pflicht bei Überarbeitung/Ablehnung)"><Text C={C} wert={kommentar} setze={setKommentar} max={500} zeilen={2} /></Feld>
          {meldung && <Meldung C={C} art="fehler">{meldung}</Meldung>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Knopf C={C} onClick={() => entscheiden("freigegeben")} disabled={busy || !alle}>✓ Freigeben</Knopf>
            <Knopf C={C} leise onClick={() => entscheiden("ueberarbeiten")} disabled={busy}>Überarbeiten</Knopf>
            <Knopf C={C} leise onClick={() => entscheiden("abgelehnt")} disabled={busy}>Ablehnen</Knopf>
          </div>
          {!alle && <p style={{ ...sys, fontSize: 12.5, color: C.ink, marginTop: 6 }}>Freigeben geht erst, wenn alle 10 Punkte abgehakt sind.</p>}
        </div>
      )}
    </div>
  );
}
