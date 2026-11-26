import { useEffect, useState } from "react";
import { ladeMeineVerifizierung, verifizierungEinreichen, ladeMeinGratisProduktCoach, gratisProduktEinreichen } from "../supabase";
import { LEBENSTHEMEN, SPRACHEN, ROLLEN, PRODUKT_ARTEN, METHODEN, KRISE_HINWEIS } from "../onboarding/felder";
import { Feld, Text, Auswahl, Chips, Haken, Knopf, Meldung, Abschnitt, sys } from "../onboarding/ui";

/* Coach-Panel › „Geprüft & Gratis“
   Formular C — Verifizierung als Coachin/Expertin/Mentorin (Prüfung im Videogespräch,
                 Zertifikate werden NICHT hochgeladen).
   Formular D — genau EIN Gratis-Produkt einreichen; erst nach der Verifizierung. */

const STATUS_TEXT = {
  eingereicht: ["info", "Eingereicht — wir melden uns für ein kurzes Videogespräch (20 Min.). Bitte halte dein Zertifikat bereit."],
  verifiziert: ["ok", "Du bist verifiziert ✓ — dein Profil trägt das Zeichen „geprüft“."],
  nachreichung: ["fehler", "Es fehlt noch etwas:"],
  abgelehnt: ["fehler", "Deine Verifizierung wurde nicht bestätigt:"],
};
const PRODUKT_STATUS = {
  eingereicht: ["info", "Eingereicht — wir prüfen dein Angebot (Formular E) und melden uns."],
  freigegeben: ["ok", "Freigegeben ✓ — neue Frauen können dein Angebot jetzt wählen."],
  ueberarbeiten: ["fehler", "Bitte überarbeiten:"],
};

export default function Verifizierung({ C }) {
  const [v, setV] = useState(undefined);
  const [prod, setProd] = useState(undefined);
  const laden = () => {
    ladeMeineVerifizierung().then((x) => setV(x || null));
    ladeMeinGratisProduktCoach().then((x) => setProd(x || null));
  };
  useEffect(() => { laden(); }, []);
  if (v === undefined) return <p style={{ ...sys, color: C.ink }}>Lade …</p>;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <VerifizierungsFormular C={C} v={v} onFertig={laden} />
      {v?.status === "verifiziert"
        ? <GratisFormular C={C} prod={prod} onFertig={laden} />
        : (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso, marginBottom: 6 }}>🎁 Dein Gratis-Angebot</div>
            <p style={{ ...sys, fontSize: 14.5, color: C.ink, lineHeight: 1.55, margin: 0 }}>
              Nach deiner Verifizierung kannst du hier genau ein Gratis-Angebot einreichen — einen Videokurs, ein Workbook oder einen Workshop. Jede neue Frau darf sich ein Angebot aussuchen; so lernen dich die Frauen kennen, die zu dir passen.
            </p>
          </div>
        )}
    </div>
  );
}

// ── Formular C ──────────────────────────────────────────────────────────────
function VerifizierungsFormular({ C, v, onFertig }) {
  const [offen, setOffen] = useState(!v);
  const [w, setW] = useState(() => ({
    name: v?.name || "", berufsbezeichnung: v?.berufsbezeichnung || "", rolle: v?.rolle || "",
    hauptthema: v?.hauptthema || "", weitere_themen: v?.weitere_themen || [], sprachen: v?.sprachen || ["Deutsch"],
    kurzprofil: v?.kurzprofil || "", website: v?.website || "", ausbildungen: v?.ausbildungen || "",
    erfahrung_jahre: v?.erfahrung_jahre != null ? String(v.erfahrung_jahre) : "", heilerlaubnis: v?.heilerlaubnis ? "ja" : v ? "nein" : "",
    b: v?.bestaetigungen || {},
  }));
  const [meldung, setMeldung] = useState(null);
  const [busy, setBusy] = useState(false);
  const setze = (k) => (x) => setW((a) => ({ ...a, [k]: x }));
  const setzeB = (k) => (x) => setW((a) => ({ ...a, b: { ...a.b, [k]: x } }));

  const senden = async () => {
    setMeldung(null);
    const fehlt = [];
    if (w.name.trim().length < 2) fehlt.push("Name");
    if (w.berufsbezeichnung.trim().length < 2) fehlt.push("Berufsbezeichnung");
    if (!w.rolle) fehlt.push("Rolle");
    if (!w.hauptthema) fehlt.push("Hauptthema");
    if (w.kurzprofil.trim().length < 20) fehlt.push("Kurzprofil (mind. 20 Zeichen)");
    if (w.ausbildungen.trim().length < 5) fehlt.push("Ausbildung");
    if (w.erfahrung_jahre === "" || isNaN(Number(w.erfahrung_jahre))) fehlt.push("Berufserfahrung");
    if (!w.heilerlaubnis) fehlt.push("Heilerlaubnis ja/nein");
    if (!["heilprg", "gewerbe", "rechte", "richtlinien", "datenschutz"].every((k) => w.b[k])) fehlt.push("alle Bestätigungen");
    if (fehlt.length) return setMeldung(["fehler", `Bitte ergänzen: ${fehlt.join(", ")}.`]);
    setBusy(true);
    try {
      await verifizierungEinreichen({
        name: w.name.trim(), berufsbezeichnung: w.berufsbezeichnung.trim(), rolle: w.rolle, hauptthema: w.hauptthema,
        weitere_themen: w.weitere_themen.filter((t) => t !== w.hauptthema), sprachen: w.sprachen.length ? w.sprachen : ["Deutsch"],
        kurzprofil: w.kurzprofil.trim(), website: w.website.trim(), ausbildungen: w.ausbildungen.trim(),
        erfahrung_jahre: Number(w.erfahrung_jahre), heilerlaubnis: w.heilerlaubnis === "ja", bestaetigungen: w.b,
      });
      setOffen(false); onFertig();
    } catch (e) { setMeldung(["fehler", e.message]); }
    setBusy(false);
  };

  const st = v && STATUS_TEXT[v.status];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso, marginBottom: 6 }}>✅ Verifizierung als Expertin</div>
      <p style={{ ...sys, fontSize: 14.5, color: C.ink, lineHeight: 1.55, margin: "0 0 6px" }}>
        Auf smile2go begleiten nur geprüfte Frauen. Du füllst das Formular aus, wir sprechen 20 Minuten per Video, du zeigst dein Zertifikat — wir speichern davon keine Kopie.
      </p>
      {st && !offen && (
        <Meldung C={C} art={st[0]}>{st[1]}{v.admin_kommentar && v.status !== "verifiziert" ? ` ${v.admin_kommentar}` : ""}</Meldung>
      )}
      {!offen && v?.status !== "verifiziert" && <Knopf C={C} leise onClick={() => setOffen(true)}>Angaben ändern</Knopf>}

      {offen && (
        <>
          <Abschnitt C={C} titel="Person & Angebot">
            <Feld C={C} label="Vor- und Nachname" pflicht><Text C={C} wert={w.name} setze={setze("name")} max={100} autoComplete="name" /></Feld>
            <Feld C={C} label="Berufsbezeichnung" pflicht hinweis="z. B. Trauerbegleiterin, Yogalehrerin, systemische Coachin"><Text C={C} wert={w.berufsbezeichnung} setze={setze("berufsbezeichnung")} max={100} /></Feld>
            <Feld C={C} label="Deine Rolle bei smile2go" pflicht><Chips C={C} wert={w.rolle} setze={setze("rolle")} optionen={ROLLEN} /></Feld>
            <Feld C={C} label="Hauptthema" pflicht hinweis="Genau eins — hier wirst du neuen Frauen empfohlen."><Auswahl C={C} wert={w.hauptthema} setze={setze("hauptthema")} optionen={LEBENSTHEMEN} /></Feld>
            <Feld C={C} label="Weitere Themen" hinweis="Höchstens zwei."><Chips C={C} wert={w.weitere_themen} setze={setze("weitere_themen")} optionen={LEBENSTHEMEN.filter((t) => t !== w.hauptthema)} mehrfach max={2} /></Feld>
            <Feld C={C} label="Sprachen" pflicht><Chips C={C} wert={w.sprachen} setze={setze("sprachen")} optionen={SPRACHEN} mehrfach /></Feld>
            <Feld C={C} label="Kurzprofil (öffentlich)" pflicht hinweis="Wen begleitest du, wie arbeitest du? Ohne Heilversprechen.">
              <Text C={C} wert={w.kurzprofil} setze={setze("kurzprofil")} max={600} zeilen={4} />
            </Feld>
            <Feld C={C} label="Website oder Instagram"><Text C={C} wert={w.website} setze={setze("website")} max={200} type="url" placeholder="https://" /></Feld>
          </Abschnitt>
          <Abschnitt C={C} titel="Qualifikation">
            <Feld C={C} label="Ausbildung(en)" pflicht hinweis="Name der Ausbildung, Institut, Jahr — eine pro Zeile.">
              <Text C={C} wert={w.ausbildungen} setze={setze("ausbildungen")} max={800} zeilen={3} />
            </Feld>
            <Feld C={C} label="Berufserfahrung in Jahren" pflicht><Text C={C} wert={w.erfahrung_jahre} setze={setze("erfahrung_jahre")} max={2} inputMode="numeric" /></Feld>
            <Feld C={C} label="Hast du eine Heilerlaubnis (Heilpraktikerin, Psychotherapie)?" pflicht><Chips C={C} wert={w.heilerlaubnis} setze={setze("heilerlaubnis")} optionen={["ja", "nein"]} /></Feld>
          </Abschnitt>
          <Abschnitt C={C} titel="Bestätigungen">
            <Haken C={C} wert={w.b.heilprg} setze={setzeB("heilprg")} pflicht>Ohne Heilerlaubnis biete ich keine Heilbehandlung an (Heilpraktikergesetz).</Haken>
            <Haken C={C} wert={w.b.gewerbe} setze={setzeB("gewerbe")} pflicht>Ich bin selbstständig angemeldet (Gewerbe oder Freiberuf) und stelle meine Rechnungen selbst.</Haken>
            <Haken C={C} wert={w.b.rechte} setze={setzeB("rechte")} pflicht>Ich habe die Rechte an allen Inhalten, die ich einstelle (Texte, Musik, Bilder, Videos).</Haken>
            <Haken C={C} wert={w.b.richtlinien} setze={setzeB("richtlinien")} pflicht>Ich akzeptiere die Inhaltsrichtlinien und AGB für Expertinnen.</Haken>
            <Haken C={C} wert={w.b.datenschutz} setze={setzeB("datenschutz")} pflicht>Ich willige ein, dass smile2go meine Angaben zur Prüfung verarbeitet.</Haken>
          </Abschnitt>
          {meldung && <Meldung C={C} art={meldung[0]}>{meldung[1]}</Meldung>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <Knopf C={C} onClick={senden} disabled={busy}>{busy ? "…" : "Zur Prüfung einreichen"}</Knopf>
            {v && <Knopf C={C} leise onClick={() => setOffen(false)}>Abbrechen</Knopf>}
          </div>
        </>
      )}
    </div>
  );
}

// ── Formular D ──────────────────────────────────────────────────────────────
function GratisFormular({ C, prod, onFertig }) {
  const [offen, setOffen] = useState(!prod);
  const [w, setW] = useState(() => ({
    art: prod?.art || "", titel: prod?.titel || "", thema: prod?.thema || "", beschreibung: prod?.beschreibung || "",
    umfang: prod?.umfang || "", inhalte: prod?.inhalte || "", methode: prod?.methode || "",
    vorschaubild_url: prod?.vorschaubild_url || "", naechster_schritt: prod?.naechster_schritt || "",
    verfuegbar_bis: prod?.verfuegbar_bis || "", b: prod?.bestaetigungen || {},
  }));
  const [meldung, setMeldung] = useState(null);
  const [busy, setBusy] = useState(false);
  const setze = (k) => (x) => setW((a) => ({ ...a, [k]: x }));
  const setzeB = (k) => (x) => setW((a) => ({ ...a, b: { ...a.b, [k]: x } }));
  const art = PRODUKT_ARTEN.find((a) => a.id === w.art);

  const senden = async () => {
    setMeldung(null);
    const fehlt = [];
    if (!w.art) fehlt.push("Art");
    if (w.titel.trim().length < 3) fehlt.push("Titel");
    if (!w.thema) fehlt.push("Thema");
    if (w.beschreibung.trim().length < 20) fehlt.push("Beschreibung (mind. 20 Zeichen)");
    if (!w.umfang.trim()) fehlt.push("Umfang");
    if (!w.inhalte.trim()) fehlt.push("Inhalte / Links");
    if (!w.methode) fehlt.push("Methode");
    if (!["keine_therapie", "krisenhinweis", "erlaubnis", "rechte"].every((k) => w.b[k])) fehlt.push("alle Bestätigungen");
    if (fehlt.length) return setMeldung(["fehler", `Bitte ergänzen: ${fehlt.join(", ")}.`]);
    setBusy(true);
    try {
      await gratisProduktEinreichen({ ...w, titel: w.titel.trim(), beschreibung: w.beschreibung.trim(), bestaetigungen: w.b });
      setOffen(false); onFertig();
    } catch (e) { setMeldung(["fehler", e.message]); }
    setBusy(false);
  };

  const st = prod && PRODUKT_STATUS[prod.status];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso, marginBottom: 6 }}>🎁 Dein Gratis-Angebot</div>
      <p style={{ ...sys, fontSize: 14.5, color: C.ink, lineHeight: 1.55, margin: "0 0 6px" }}>
        Genau ein Angebot pro Expertin. Jede neue Frau darf sich nach ihrem Kennenlerngespräch eines aussuchen — kostenlos für sie, ohne Honorar für dich, mit einem klaren nächsten Schritt zu deinem bezahlten Angebot.
      </p>
      {st && !offen && <Meldung C={C} art={st[0]}>{st[1]}{prod.admin_kommentar && prod.status !== "freigegeben" ? ` ${prod.admin_kommentar}` : ""}</Meldung>}
      {prod && !offen && (
        <p style={{ ...sys, fontSize: 15, color: C.espresso, margin: "6px 0 10px" }}><b>{prod.titel}</b> · {PRODUKT_ARTEN.find((a) => a.id === prod.art)?.t} · {prod.thema}</p>
      )}
      {!offen && prod?.status !== "freigegeben" && <Knopf C={C} leise onClick={() => setOffen(true)}>Angebot bearbeiten</Knopf>}

      {offen && (
        <>
          <Abschnitt C={C} titel="Was bietest du an?">
            <Feld C={C} label="Art" pflicht><Chips C={C} wert={w.art} setze={setze("art")} optionen={PRODUKT_ARTEN} /></Feld>
            {art && <p style={{ ...sys, fontSize: 12.5, color: C.ink, margin: "-6px 0 12px" }}>{art.icon} {art.t} · Mindestmaß: {art.mass}</p>}
            <Feld C={C} label="Titel" pflicht><Text C={C} wert={w.titel} setze={setze("titel")} max={60} /></Feld>
            <Feld C={C} label="Thema" pflicht hinweis="Sollte zu deinem Hauptthema passen."><Auswahl C={C} wert={w.thema} setze={setze("thema")} optionen={LEBENSTHEMEN} /></Feld>
            <Feld C={C} label="Was kann die Frau danach?" pflicht><Text C={C} wert={w.beschreibung} setze={setze("beschreibung")} max={400} zeilen={3} /></Feld>
            <Feld C={C} label="Umfang" pflicht hinweis={art?.umfang}><Text C={C} wert={w.umfang} setze={setze("umfang")} max={80} /></Feld>
            <Feld C={C} label="Inhalte / Links" pflicht hinweis={art?.inhalte || "Links, eine pro Zeile — sie sieht sie erst nach dem Einlösen."}>
              <Text C={C} wert={w.inhalte} setze={setze("inhalte")} max={2000} zeilen={4} />
            </Feld>
            <Feld C={C} label="Methodische Grundlage" pflicht><Auswahl C={C} wert={w.methode} setze={setze("methode")} optionen={METHODEN} /></Feld>
            <Feld C={C} label="Vorschaubild (Link, 1200 × 630 px)"><Text C={C} wert={w.vorschaubild_url} setze={setze("vorschaubild_url")} max={400} type="url" placeholder="https://" /></Feld>
            <Feld C={C} label="Nächster Schritt für sie" hinweis="z. B. „1:1-Begleitung, 4 Termine, 280 € — Link …“"><Text C={C} wert={w.naechster_schritt} setze={setze("naechster_schritt")} max={300} zeilen={2} /></Feld>
            <Feld C={C} label="Verfügbar bis" hinweis="Leer lassen = unbefristet.">
              <input type="date" value={w.verfuegbar_bis || ""} onChange={(e) => setze("verfuegbar_bis")(e.target.value)}
                style={{ ...sys, fontSize: 15, padding: 10, borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card }} />
            </Feld>
          </Abschnitt>
          <Abschnitt C={C} titel="Bestätigungen">
            <Haken C={C} wert={w.b.keine_therapie} setze={setzeB("keine_therapie")} pflicht>Im Angebot steht „angelehnt an …, keine Therapie“, wo eine Methode genannt wird.</Haken>
            <Haken C={C} wert={w.b.krisenhinweis} setze={setzeB("krisenhinweis")} pflicht>Der Krisenhinweis ist enthalten: {KRISE_HINWEIS}</Haken>
            <Haken C={C} wert={w.b.erlaubnis} setze={setzeB("erlaubnis")} pflicht>smile2go darf das Angebot kostenlos an neue Mitglieder geben; ich erhalte dafür kein Honorar.</Haken>
            <Haken C={C} wert={w.b.rechte} setze={setzeB("rechte")} pflicht>Ich habe alle Rechte an Musik, Bildern und Texten.</Haken>
          </Abschnitt>
          {meldung && <Meldung C={C} art={meldung[0]}>{meldung[1]}</Meldung>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <Knopf C={C} onClick={senden} disabled={busy}>{busy ? "…" : "Zur Prüfung einreichen"}</Knopf>
            {prod && <Knopf C={C} leise onClick={() => setOffen(false)}>Abbrechen</Knopf>}
          </div>
        </>
      )}
    </div>
  );
}
