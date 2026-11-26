import { useEffect, useState } from "react";
import { ladeKennenlernAnfrage, speichereKennenlernAnfrage, ladeExpertinnen } from "../supabase";
import { LEBENSTHEMEN, THEMA_OFFEN, INTERESSEN, SPRACHEN, QUELLEN, KRISE_HINWEIS } from "./felder";
import { Feld, Text, Auswahl, Chips, Haken, Knopf, Meldung, Abschnitt, sys, STANDARD } from "./ui";

/* Formular A — Anmeldung zum kostenlosen Kennenlerngespräch.
   Steht auf der Warteseite (Konto angelegt, noch nicht freigeschaltet).
   Fragt bewusst keine Diagnosen ab; das Thema ist eine Einwilligung (Art. 9 DSGVO). */

const TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const ZEITEN = ["vormittags", "nachmittags", "abends"];

const leer = {
  vorname: "", telefon: "", als_frau: false, volljaehrig: false, thema: "", wunsch: "",
  interessen: [], wunsch_coach: "", sprache: "Deutsch", tage: [], zeiten: [], termin_notiz: "",
  quelle: "", datenschutz: false, einwilligung_thema: false, newsletter: false,
};

// „Di, Do · abends · nach 18 Uhr“ ↔ Felder
const terminText = (w) => [w.tage.join(", "), w.zeiten.join(", "), w.termin_notiz.trim()].filter(Boolean).join(" · ");

export default function KennenlernAnfrage({ C = STANDARD, vorname = "", onDatenschutz }) {
  const [w, setW] = useState({ ...leer, vorname });
  const [gespeichert, setGespeichert] = useState(null);   // vorhandene Anfrage
  const [bearbeiten, setBearbeiten] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [fehler, setFehler] = useState({});
  const [meldung, setMeldung] = useState("");
  const [busy, setBusy] = useState(false);
  const setze = (k) => (v) => setW((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    ladeKennenlernAnfrage().then((a) => {
      if (!a) return;
      setGespeichert(a);
      setW((x) => ({ ...x, ...a, wunsch_coach: a.wunsch_coach || "", tage: a.tage || [], zeiten: a.zeiten || [], termin_notiz: a.wunschtermin || "" }));
    });
    ladeExpertinnen(50).then(setCoaches).catch(() => {});
  }, []);

  const pruefen = () => {
    const f = {};
    if (!w.vorname.trim()) f.vorname = "Wie dürfen wir dich nennen?";
    if (!w.thema) f.thema = "Bitte wähle ein Thema — „Weiß ich noch nicht“ ist auch okay.";
    if (!terminText(w)) f.termin = "Wann passt es dir ungefähr?";
    if (!w.als_frau || !w.volljaehrig || !w.datenschutz || !w.einwilligung_thema) f.haken = "Bitte bestätige die vier Pflichtpunkte.";
    setFehler(f);
    return Object.keys(f).length === 0;
  };

  const senden = async () => {
    setMeldung("");
    if (!pruefen()) return;
    setBusy(true);
    try {
      const z = await speichereKennenlernAnfrage({
        vorname: w.vorname.trim(), telefon: w.telefon.trim() || null, als_frau: w.als_frau, volljaehrig: w.volljaehrig,
        thema: w.thema, wunsch: w.wunsch.trim() || null, interessen: w.interessen, wunsch_coach: w.wunsch_coach || null,
        sprache: w.sprache, wunschtermin: terminText(w), quelle: w.quelle || null,
        datenschutz: w.datenschutz, einwilligung_thema: w.einwilligung_thema, newsletter: w.newsletter,
      });
      setGespeichert(z); setBearbeiten(false);
    } catch (e) { setMeldung(e.message); }
    setBusy(false);
  };

  // Bestätigung
  if (gespeichert && !bearbeiten) {
    return (
      <div style={{ margin: "4px 0 18px" }}>
        <Meldung C={C} art="ok">
          <b>Danke, {gespeichert.vorname}!</b> Deine Anmeldung ist da. Eine Begleiterin meldet sich in den nächsten Tagen mit einem Terminvorschlag
          ({gespeichert.wunschtermin}). Den Zoom-Link bekommst du hier im Verlauf und per E-Mail. Bitte nimm mit Kamera teil — so halten wir den Raum für alle Frauen sicher.
        </Meldung>
        <p style={{ ...sys, fontSize: 12.5, color: C.ink, lineHeight: 1.5, margin: "6px 2px 10px" }}>{KRISE_HINWEIS}</p>
        <Knopf C={C} leise onClick={() => setBearbeiten(true)}>Angaben ändern</Knopf>
      </div>
    );
  }

  return (
    <div style={{ margin: "4px 0 18px" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 16.5, color: C.ink, lineHeight: 1.6, margin: "0 0 6px" }}>
        In 20 Minuten per Zoom lernst du eine unserer ausgebildeten Begleiterinnen kennen. Danach schenken wir dir ein Angebot einer geprüften Coachin zu deinem Thema.
      </p>

      <Abschnitt C={C} titel="Über dich">
        <Feld C={C} label="Vorname" pflicht fehler={fehler.vorname} hinweis="Deinen Nachnamen brauchen wir hier nicht.">
          <Text C={C} wert={w.vorname} setze={setze("vorname")} max={60} autoComplete="given-name" />
        </Feld>
        <Feld C={C} label="Handynummer" hinweis="Freiwillig — nur für eine Erinnerung per SMS.">
          <Text C={C} wert={w.telefon} setze={setze("telefon")} max={30} type="tel" autoComplete="tel" />
        </Feld>
      </Abschnitt>

      <Abschnitt C={C} titel="Dein Thema">
        <Feld C={C} label="Was bewegt dich gerade am meisten?" pflicht fehler={fehler.thema}>
          <Chips C={C} wert={w.thema} setze={setze("thema")} optionen={[...LEBENSTHEMEN, THEMA_OFFEN]} />
        </Feld>
        <Feld C={C} label="Was wünschst du dir von smile2go?" hinweis="Freiwillig. Ein, zwei Sätze reichen — keine Diagnosen nötig.">
          <Text C={C} wert={w.wunsch} setze={setze("wunsch")} max={300} zeilen={3} />
        </Feld>
        <Feld C={C} label="Woran hast du Interesse?">
          <Chips C={C} wert={w.interessen} setze={setze("interessen")} optionen={INTERESSEN} mehrfach />
        </Feld>
        {coaches.length > 0 && (
          <Feld C={C} label="Hast du schon eine Wunsch-Coachin?" hinweis="Freiwillig.">
            <Auswahl C={C} wert={w.wunsch_coach} setze={setze("wunsch_coach")} optionen={coaches.map((c) => ({ id: c.id, t: c.name }))} leer="Noch keine" />
          </Feld>
        )}
      </Abschnitt>

      <Abschnitt C={C} titel="Dein Gespräch">
        <Feld C={C} label="Sprache">
          <Chips C={C} wert={w.sprache} setze={setze("sprache")} optionen={SPRACHEN} />
        </Feld>
        <Feld C={C} label="Wann passt es dir?" pflicht fehler={fehler.termin} hinweis="Wähle Tage und Tageszeit — die Begleiterin schlägt dir dann einen Termin vor.">
          <div style={{ display: "grid", gap: 8 }}>
            <Chips C={C} wert={w.tage} setze={setze("tage")} optionen={TAGE} mehrfach />
            <Chips C={C} wert={w.zeiten} setze={setze("zeiten")} optionen={ZEITEN} mehrfach />
            <Text C={C} wert={w.termin_notiz} setze={setze("termin_notiz")} max={80} placeholder="z. B. nicht vor 18 Uhr" />
          </div>
        </Feld>
        <Feld C={C} label="Wie hast du von uns erfahren?">
          <Auswahl C={C} wert={w.quelle} setze={setze("quelle")} optionen={QUELLEN} />
        </Feld>
      </Abschnitt>

      <Abschnitt C={C} titel="Bestätigen">
        <Haken C={C} wert={w.als_frau} setze={setze("als_frau")} pflicht>Ich melde mich als Frau an. smile2go ist ein Raum nur für Frauen; wir bestätigen das im Gespräch.</Haken>
        <Haken C={C} wert={w.volljaehrig} setze={setze("volljaehrig")} pflicht>Ich bin mindestens 18 Jahre alt.</Haken>
        <Haken C={C} wert={w.datenschutz} setze={setze("datenschutz")} pflicht>
          Ich habe die{" "}
          <button type="button" onClick={(e) => { e.preventDefault(); onDatenschutz?.(); }} style={{ ...sys, fontSize: 14.5, padding: 0, border: "none", background: "none", color: C.plum, textDecoration: "underline", cursor: "pointer" }}>Datenschutzhinweise</button>{" "}
          gelesen.
        </Haken>
        <Haken C={C} wert={w.einwilligung_thema} setze={setze("einwilligung_thema")} pflicht>
          Meine Angaben zu meinem Thema dürfen für die Vorbereitung des Gesprächs genutzt werden. Ich kann das jederzeit widerrufen.
        </Haken>
        <Haken C={C} wert={w.newsletter} setze={setze("newsletter")}>Ich möchte den smile2go-Newsletter bekommen (freiwillig, jederzeit abbestellbar).</Haken>
        {fehler.haken && <Meldung C={C} art="fehler">{fehler.haken}</Meldung>}
      </Abschnitt>

      {meldung && <Meldung C={C} art="fehler">{meldung}</Meldung>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <Knopf C={C} onClick={senden} disabled={busy}>{busy ? "Sende …" : "Kennenlerngespräch anfragen"}</Knopf>
        {gespeichert && <Knopf C={C} leise onClick={() => setBearbeiten(false)}>Abbrechen</Knopf>}
      </div>
      <p style={{ ...sys, fontSize: 12.5, color: C.ink, lineHeight: 1.5, margin: "12px 2px 0" }}>{KRISE_HINWEIS}</p>
    </div>
  );
}
