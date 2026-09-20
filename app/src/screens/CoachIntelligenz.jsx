// CoachIntelligenz.jsx — Coach-Werkzeuge: Wissenssuche, Session-Auswertung, Twin, Wochenbild.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { STIMME_EINWILLIGUNG_TEXT, gibDossierFrei, gibSessionNotizFrei, ladeEigenesDossier, ladeInhaltsUebersicht, ladeStimmProfil, logEvent, merkeInhalt, speichereDossierEntwurf, speichereSessionNotiz, speichereStimmProfil, sucheInhalte, widerrufeStimme } from "../supabase";
import { useEffect, useRef, useState } from "react";
import { ILHO_SYSTEM, askLuma, tonalitaetsZusatz } from "../lib/ki";
import { wochenKey } from "../lib/zeit";
import { Btn, Card, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Fortschritt ── */

/* ── Coaching-Intelligenz: echte, transparente Analyse-Engine (regelbasiert, erklärbar · EU-AI-Act-freundlich) ── */
export function coachingIntelligenz({ energie, entries, aufgaben, streak, ch369 }) {
  const tasks = aufgaben || [];
  const energieScore = energie ? (energie.v / 5) * 100 : 60;
  const taskDone = tasks.length ? (tasks.filter((a) => a.erledigt).length / tasks.length) * 100 : 50;
  const journalScore = Math.min(100, (entries?.length || 0) * 20 + 20);
  const streakScore = Math.min(100, (streak || 0) * 12);
  // Dankbarkeits-Challenge zählt bewusst stärker als die anderen Faktoren:
  // sie ist die einzige Übung, die täglich UND kumulativ (Tag 1→21) wächst,
  // und ist damit der verlässlichste Indikator für echtes Dranbleiben.
  const dankbarkeitHeute = ch369?.letzterTag === new Date().toDateString();
  const challengeScore = ch369?.tag ? Math.min(100, (ch369.tag / 21) * 100) : 0;
  const index = Math.round(0.25 * energieScore + 0.15 * streakScore + 0.20 * taskDone + 0.15 * journalScore + 0.25 * challengeScore);
  const offen = tasks.filter((a) => !a.erledigt).length;
  const erledigt = tasks.filter((a) => a.erledigt).length;
  // Jede Warnung weiß, wohin sie führt — sonst weiß man, was fehlt, aber nicht, wo es liegt.
  const warnungen = [];
  if (energie && energie.v <= 2) warnungen.push({ t: `Energie heute niedrig (${energie.v}/5)`, tab: "fortschritt", hin: "Energie-Check öffnen" });
  if (offen >= 3) warnungen.push({ t: `${offen} offene Aufgaben stauen sich`, tab: "aufgaben", hin: "Aufgaben öffnen" });
  if ((streak || 0) === 0) warnungen.push({ t: "Streak unterbrochen — Reaktivierung sinnvoll", tab: "tagebuch", hin: "Eintrag schreiben" });
  if (ch369?.tag && !dankbarkeitHeute) warnungen.push({ t: `Dankbarkeits-Challenge heute noch nicht gemacht (Tag ${ch369.tag}/21)`, tab: "aufgaben", hin: "Challenge öffnen" });
  const briefing = `Wohlbefindens-Index ${index}/100. ` +
    (energie ? `Energie heute ${energie.v}/5. ` : "") +
    `Streak ${streak || 0} Tage · Aufgaben ${erledigt}/${tasks.length}` +
    (ch369?.tag ? ` · Dankbarkeits-Challenge Tag ${ch369.tag}/21 (heute ${dankbarkeitHeute ? "erledigt" : "offen"})` : "") + ". " +
    (warnungen.length ? "⚠ " + warnungen.map((w) => w.t).join("; ") + "." : "Keine Auffälligkeiten.");
  const comps = [
    ["Energie", energieScore, "eine Atemübung oder Meditation"],
    ["Aktivität", streakScore, "eine kleine tägliche Routine"],
    ["Aufgaben", taskDone, "eine offene Aufgabe abschließen"],
    ["Journal", journalScore, "einen kurzen Tagebuch-Eintrag"],
  ].sort((a, b) => a[1] - b[1]);
  return { index, warnungen, briefing, empfehlung: comps[0][2], schwaechster: comps[0][0], offen, dankbarkeitHeute };
}

/* ── AI Coach Twin — Konfigurationsinterview + Methoden-Dossier (Fable-5-Auftrag 6, Phase A) ──
   18 Fragen in 4 Blöcken, danach synthetisiert Claude AUSSCHLIESSLICH aus den echten Antworten
   ein strukturiertes Dossier (kein Freitext-Erfinden). Nichts geht ohne Freigabe der Coachin an
   Klientinnen — deshalb: Entwurf speichern → prüfen/editieren → explizit freigeben. */
export const COACH_TWIN_BLOCKS = ["Methode & Ansatz", "Sprache & Ausdruck", "Grenzen & Tabus", "Typische Situationen"];

export const COACH_TWIN_FRAGEN = [
  { f: "Wie würdest du deinen Coaching-Ansatz in 2–3 Sätzen beschreiben?", k: "ansatz" },
  { f: "Mit welcher Methode oder welchem Werkzeug arbeitest du am liebsten?", k: "methode" },
  { f: "Was unterscheidet deine Arbeit von anderen Coachinnen in deinem Bereich?", k: "unterschied" },
  { f: "Woran erkennst du, dass eine Klientin einen Durchbruch hatte?", k: "durchbruch" },
  { f: "Was ist der wichtigste Glaubenssatz, den du deinen Klientinnen vermitteln willst?", k: "kernbotschaft" },
  { f: "Welche 3–5 Wörter oder Formulierungen verwendest du besonders oft?", k: "lieblingsbegriffe" },
  { f: "Duzt oder siezt du deine Klientinnen normalerweise?", k: "anrede" },
  { f: "Bist du eher direkt und klar, oder sanft und zurückhaltend in deiner Ansprache?", k: "ton" },
  { f: "Gibt es Sätze oder Floskeln, die du NIE benutzen würdest?", k: "verbotene_saetze" },
  { f: "Wie würdest du deinen Humor/Ton beschreiben — ernst, verspielt, poetisch, nüchtern?", k: "stil" },
  { f: "Bei welchem Thema verweist du sofort an eine andere Fachperson (z. B. Therapie)?", k: "verweisgrenze" },
  { f: "Gibt es Heilsversprechen oder Formulierungen, die du bewusst vermeidest?", k: "vermiedene_versprechen" },
  { f: "Wie reagierst du, wenn eine Klientin über etwas spricht, das dich fachlich überfordert?", k: "ueberforderung" },
  { f: "Was würdest du niemals versprechen, egal wie sehr eine Klientin es sich wünscht?", k: "nie_versprechen" },
  { f: "Beschreibe eine typische Klientin, mit der du gerade arbeitest (anonymisiert).", k: "typische_klientin" },
  { f: "Was ist ein Satz, den du oft zu Beginn einer Session sagst?", k: "eroeffnungssatz" },
  { f: "Was ist ein Satz, den du oft am Ende einer Session sagst?", k: "abschlusssatz" },
  { f: "Wenn eine Klientin sich zurückzieht/still wird, wie sprichst du sie an?", k: "rueckzug_ansprache" },
  // Der wichtigste Schritt für die Qualität: echte Textproben schlagen jede Beschreibung.
  { f: "Füge hier 2–3 eigene Texte ein, die klingen wie du — ein Instagram-Post, eine Sprachnachricht an eine Klientin, ein Absatz aus deinem Newsletter. Roh und ungeschliffen ist besser als poliert.", k: "stilproben_roh" },
];

/* ── Knowledge Brain (Katman 1 · Baustein 6) ──
   Suche über die EIGENEN Inhalte der Coachin. Harte Regel im Prompt:
   Ohne Treffer wird NICHTS erfunden — die Antwort lautet dann "nichts gefunden". */
export const WISSEN_SYSTEM = `Du beantwortest die Frage einer Coachin AUSSCHLIESSLICH auf Basis der mitgelieferten Auszüge aus ihren eigenen Inhalten.
STRIKTE REGELN:
1. Nutze NUR die gelieferten Auszüge. Kein Allgemeinwissen, keine Ergänzung, keine Vermutung.
2. Nenne bei jeder Aussage den Titel des Auszugs, aus dem sie stammt — in der Form (Quelle: Titel).
3. Wenn die Auszüge die Frage nicht beantworten, sage genau das: dass du dazu nichts in ihren Inhalten findest. Erfinde NIEMALS etwas.
4. Deutsch, Du-Form, kurz (2–5 Sätze).`;

export function WissensSuche({ addPunkte }) {
  const [frage, setFrage] = useState("");
  const [treffer, setTreffer] = useState(null);
  const [antwort, setAntwort] = useState("");
  const [busy, setBusy] = useState(false);
  const [uebersicht, setUebersicht] = useState([]);
  const [neuTitel, setNeuTitel] = useState("");
  const [neuText, setNeuText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => { ladeInhaltsUebersicht().then(setUebersicht); }, []);

  const suchen = async () => {
    if (busy || !frage.trim()) return;
    setBusy(true); setAntwort(""); setTreffer(null);
    const gefunden = await sucheInhalte(frage.trim(), 5);
    setTreffer(gefunden);
    if (gefunden.length) {
      const kontext = gefunden.map((t, i) => `[${i + 1}] Titel: ${t.titel} (${t.quelle})\n${t.chunk}`).join("\n\n");
      const txt = await askLuma([{ role: "user", content: `Frage: ${frage.trim()}\n\nAuszüge aus meinen Inhalten:\n${kontext}` }], WISSEN_SYSTEM);
      setAntwort(txt);
      logEvent("wissenssuche");
    }
    setBusy(false);
  };

  const hinzufuegen = async () => {
    if (!neuText.trim()) return;
    setStatus("…");
    const n = await merkeInhalt({ titel: neuTitel.trim() || "Ohne Titel", text: neuText.trim(), quelle: "upload" });
    setStatus(n ? `✓ ${n} Abschnitt(e) gemerkt` : "Konnte nicht gespeichert werden");
    if (n) { setNeuTitel(""); setNeuText(""); ladeInhaltsUebersicht().then(setUebersicht); if (addPunkte) addPunkte(10, "Inhalt archiviert"); }
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>Coach-Werkstatt</Eyebrow>
      <H size={24} style={{ marginBottom: 6 }}>Dein Wissensarchiv</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, marginBottom: 16 }}>
        Alles, was du hier ablegst, findest du später mit einer normalen Frage wieder — z. B. „Was habe ich über Selbstwert gesagt?".
        Gefunden wird nur, was wirklich da ist; erfunden wird nichts.
      </p>

      <Card style={{ marginBottom: 14 }}>
        <Eyebrow color={C.plum}>Frage an dein Archiv</Eyebrow>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={frage} onChange={(e) => setFrage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && suchen()}
            placeholder="z. B. Was habe ich über Grenzen setzen gesagt?"
            style={{ flex: 1, padding: "12px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none" }} />
          <button onClick={suchen} disabled={busy} style={{ width: 46, borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 17, opacity: busy ? 0.6 : 1 }}>🔍</button>
        </div>
      </Card>

      {busy && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, marginBottom: 12 }}>✨ ilho durchsucht dein Archiv …</p>}

      {treffer !== null && !busy && (
        treffer.length === 0 ? (
          <Card style={{ marginBottom: 14 }}>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.55 }}>
              Dazu finde ich nichts in deinen Inhalten. {uebersicht.length === 0 ? "Dein Archiv ist noch leer — leg unten den ersten Inhalt ab." : "Vielleicht mit anderen Worten suchen?"}
            </p>
          </Card>
        ) : (
          <>
            {antwort && (
              <Card style={{ marginBottom: 12, background: `linear-gradient(150deg, ${C.card}, ${C.goldPale})` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Eyebrow color={C.gold}>Antwort aus deinem Archiv</Eyebrow>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>ilho · KI</span>
                </div>
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, lineHeight: 1.6, marginTop: 8, whiteSpace: "pre-wrap" }}>{antwort}</p>
              </Card>
            )}
            <Eyebrow color={C.plum}>Fundstellen</Eyebrow>
            {treffer.map((t) => (
              <Card key={t.id} style={{ marginTop: 8, marginBottom: 8 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: C.plum }}>{t.titel} <span style={{ fontWeight: 400, opacity: 0.7 }}>· {t.quelle}</span></div>
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, lineHeight: 1.55, marginTop: 5 }}>{t.chunk.slice(0, 260)}{t.chunk.length > 260 ? " …" : ""}</p>
              </Card>
            ))}
          </>
        )
      )}

      <Card style={{ marginTop: 16, marginBottom: 14 }}>
        <Eyebrow color={C.plum}>Inhalt ablegen</Eyebrow>
        <input value={neuTitel} onChange={(e) => setNeuTitel(e.target.value)} placeholder="Titel — z. B. Reel Selbstwert, Mai 2024"
          style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", boxSizing: "border-box", margin: "8px 0" }} />
        <textarea rows={5} value={neuText} onChange={(e) => setNeuText(e.target.value)} placeholder="Text, Transkript oder Notiz einfügen …"
          style={{ width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10, lineHeight: 1.5 }} />
        <Btn small ghost={!neuText.trim()} onClick={hinzufuegen}>Ins Archiv legen</Btn>
        {status && <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.sage, marginLeft: 10 }}>{status}</span>}
      </Card>

      {uebersicht.length > 0 && (
        <Card>
          <Eyebrow color={C.plum}>Im Archiv · {uebersicht.length} Inhalt(e)</Eyebrow>
          {uebersicht.slice(0, 12).map((u, i) => (
            <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, padding: "7px 0", borderBottom: i < Math.min(11, uebersicht.length - 1) ? `1px solid ${C.line}` : "none" }}>
              {u.titel} <span style={{ opacity: 0.6 }}>· {u.quelle} · {u.teile} Abschnitt(e)</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ── Session Intelligence (Katman 1 · Baustein 5) ──
   Transkript → strukturierter Notiz-ENTWURF für die Coachin.
   Zwei harte Regeln aus der Leitplanken-Liste:
   1) Einwilligungs-Gate VOR der Analyse (Art.-9-Nähe) — ohne Häkchen kein Knopf.
   2) Freigabe-Prinzip: Der Entwurf erreicht niemanden ohne Freigabe der Coachin.
   Bewusst NICHT enthalten: Emotions-/Persönlichkeitsanalyse, Risikobewertung der Person,
   Muster-/Blind-Spot-Deutung (das ist Katman 3). Nur explizit Gesagtes. */
export const SESSION_SYSTEM = `Du strukturierst das Transkript einer Coaching-Session für die Coachin. Antworte AUSSCHLIESSLICH mit gültigem JSON in exakt dieser Form:
{"kernthemen":["..."],"vereinbarungen":["..."],"aufgaben":["..."],"offene_punkte":["..."]}
STRIKTE REGELN:
1. Nimm NUR auf, was im Transkript wörtlich gesagt wurde. Keine Interpretation, keine Vermutung, keine Ergänzung aus Allgemeinwissen.
2. KEINE Diagnosen, keine psychologische Deutung, keine Bewertung der Klientin, keine Einschätzung ihres Zustands oder Risikos, keine Muster-/Verhaltensanalyse.
3. "aufgaben" nur, wenn im Gespräch tatsächlich eine Aufgabe/Übung vereinbart wurde.
4. Sprache: Deutsch, knapp, sachlich. Jeder Punkt max. ein Satz.
5. Wenn ein Feld leer bleiben muss, gib ein leeres Array zurück. Erfinde nichts.
6. Kein Text außerhalb des JSON.`;

export function SessionIntelligenz({ addPunkte }) {
  const [titel, setTitel] = useState("");
  const [transkript, setTranskript] = useState("");
  const [einwilligung, setEinwilligung] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entwurf, setEntwurf] = useState(null); // { id?, notiz, notiz_text, freigegeben }
  const [fehler, setFehler] = useState("");
  const [hoeren, setHoeren] = useState(false);
  const recRef = useRef(null);

  const diktieren = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setFehler("Spracherkennung wird von diesem Browser nicht unterstützt."); return; }
    if (hoeren) { recRef.current?.stop(); setHoeren(false); return; }
    const r = new SR();
    r.lang = "de-DE"; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => {
      let neu = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) neu += e.results[i][0].transcript + " ";
      if (neu) setTranskript((t) => (t + " " + neu).trim());
    };
    r.onerror = () => setHoeren(false);
    r.onend = () => setHoeren(false);
    recRef.current = r; r.start(); setHoeren(true);
  };

  const analysieren = async () => {
    if (busy || !einwilligung || transkript.trim().length < 40) return;
    setBusy(true); setFehler("");
    const roh = await askLuma([{ role: "user", content: transkript.trim().slice(0, 12000) }], SESSION_SYSTEM);
    let notiz = null;
    try { notiz = JSON.parse((roh.match(/\{[\s\S]*\}/) || [roh])[0]); } catch { /* unten abgefangen */ }
    if (!notiz) { setFehler("Der Entwurf konnte nicht strukturiert werden — bitte noch einmal versuchen."); setBusy(false); return; }
    const abschnitt = (t, arr) => (arr?.length ? `**${t}**\n${arr.map((x) => `- ${x}`).join("\n")}\n\n` : "");
    const text =
      abschnitt("Kernthemen", notiz.kernthemen) +
      abschnitt("Vereinbarungen", notiz.vereinbarungen) +
      abschnitt("Aufgaben bis zur nächsten Session", notiz.aufgaben) +
      abschnitt("Offene Punkte", notiz.offene_punkte);
    const gespeichert = await speichereSessionNotiz({
      titel: titel.trim() || `Session ${new Date().toLocaleDateString("de-DE")}`,
      transkript: transkript.trim(), notiz, notiz_text: text.trim(), einwilligung: true,
    });
    setEntwurf({ id: gespeichert?.id, notiz, notiz_text: text.trim(), freigegeben: false });
    if (addPunkte) addPunkte(15, "Session-Notiz erstellt");
    logEvent("session_notiz_entwurf");
    setBusy(false);
  };

  const freigeben = async () => {
    if (!entwurf) return;
    if (entwurf.id) await gibSessionNotizFrei(entwurf.id);
    // Erst nach Freigabe wandert die Notiz ins Wissensarchiv (Knowledge Brain) —
    // nie der Rohtranskript, nur der geprüfte Entwurf.
    if (entwurf.notiz_text) {
      await merkeInhalt({
        titel: titel.trim() || `Session ${new Date().toLocaleDateString("de-DE")}`,
        text: entwurf.notiz_text, quelle: "session_notiz", quelle_id: entwurf.id || null,
      });
    }
    setEntwurf({ ...entwurf, freigegeben: true });
  };

  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>Coach-Werkstatt</Eyebrow>
      <H size={24} style={{ marginBottom: 6 }}>Session-Notiz</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, marginBottom: 16 }}>
        Sprich oder füge dein Transkript ein — ilho strukturiert daraus einen <strong>Entwurf</strong>: Kernthemen, Vereinbarungen, Aufgaben, offene Punkte.
        Nur, was tatsächlich gesagt wurde. Keine Deutung, keine Bewertung.
      </p>

      {!entwurf && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <Eyebrow color={C.plum}>Bezeichnung (ohne Klarnamen)</Eyebrow>
            <input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="z. B. Session 12.08. · A."
              style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", boxSizing: "border-box", marginTop: 8 }} />
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Eyebrow color={C.plum}>Transkript</Eyebrow>
              <button onClick={diktieren} style={{ border: "none", background: hoeren ? C.rose : C.roseSoft, color: hoeren ? "#fff" : C.plum, borderRadius: 18, padding: "7px 14px", fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                {hoeren ? "⏹ Aufnahme stoppen" : "🎙️ Diktieren"}
              </button>
            </div>
            <textarea rows={9} value={transkript} onChange={(e) => setTranskript(e.target.value)} placeholder="Transkript einfügen oder diktieren …"
              style={{ width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} />
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 6 }}>{transkript.trim().length} Zeichen{transkript.trim().length < 40 ? " · mindestens 40 nötig" : ""}</div>
          </Card>

          {/* Einwilligungs-Gate — Pflicht vor der Analyse */}
          <Card style={{ marginBottom: 14, border: `1.5px solid ${einwilligung ? C.sage : "#E7B7A8"}`, background: einwilligung ? "#F2F8F0" : "#FBF6F2" }}>
            <div onClick={() => setEinwilligung(!einwilligung)} style={{ display: "flex", gap: 11, alignItems: "flex-start", cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, border: `1.5px solid ${einwilligung ? C.sage : C.line}`, background: einwilligung ? C.sage : C.card, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{einwilligung ? "✓" : ""}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, lineHeight: 1.5 }}>
                Meine Klientin hat der Verarbeitung dieser Session durch eine KI <strong>ausdrücklich zugestimmt</strong> (Art. 9 DSGVO). Ohne diese Zustimmung darf die Analyse nicht erfolgen.
              </div>
            </div>
          </Card>

          {fehler && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#B0492F", marginBottom: 10 }}>{fehler}</p>}
          <Btn full ghost={!einwilligung || transkript.trim().length < 40} onClick={analysieren} disabled={busy}>
            {busy ? "✨ ilho strukturiert …" : "Notiz-Entwurf erstellen"}
          </Btn>
          {!einwilligung && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "center", marginTop: 8 }}>Ohne bestätigte Einwilligung ist die Analyse gesperrt.</p>}
        </>
      )}

      {entwurf && (
        <>
          <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, ${C.card}, ${C.goldPale})` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Eyebrow color={C.gold}>{entwurf.freigegeben ? "✅ Freigegeben" : "📝 Entwurf — noch nicht freigegeben"}</Eyebrow>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>von ilho · KI-generiert</span>
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, lineHeight: 1.65, marginTop: 10, whiteSpace: "pre-wrap" }}>
              {entwurf.notiz_text || "— keine strukturierten Inhalte gefunden —"}
            </div>
          </Card>
          {!entwurf.freigegeben ? (
            <>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5, marginBottom: 10 }}>
                Prüfe den Entwurf. Erst nach deiner Freigabe darf er weiterverwendet oder mit deiner Klientin geteilt werden.
              </p>
              <Btn full onClick={freigeben}>Entwurf freigeben</Btn>
            </>
          ) : (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, marginBottom: 10 }}>✓ Freigegeben — die Notiz ist jetzt für die weitere Verwendung markiert.</p>
          )}
          <div style={{ marginTop: 10 }}>
            <Btn small ghost onClick={() => { setEntwurf(null); setTranskript(""); setTitel(""); setEinwilligung(false); }}>Neue Session</Btn>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Stimmprofil: Einwilligung, Widerruf, klare Grenze ──
   Bewusste Produktentscheidung: Der persönliche Wochenimpuls bleibt ihre echte Stimme.
   Geklont wird nur, was sie nie selbst einsprechen könnte. */
export function StimmProfil() {
  const [profil, setProfil] = useState(null);
  const [zeigen, setZeigen] = useState(false);
  const [zugestimmt, setZugestimmt] = useState(false);
  const [voiceId, setVoiceId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { ladeStimmProfil().then(setProfil); }, []);

  const speichern = async () => {
    if (!zugestimmt || !voiceId.trim() || busy) return;
    setBusy(true);
    const p = await speichereStimmProfil({ anbieter: "extern", voice_id: voiceId.trim() });
    if (p) { setProfil(p); setZeigen(false); logEvent("stimme_aktiviert"); }
    setBusy(false);
  };

  const widerrufen = async () => {
    if (!confirm("Stimmodell widerrufen? Alle damit erzeugten Audios werden entfernt.")) return;
    if (await widerrufeStimme()) setProfil(null);
  };

  return (
    <Card style={{ marginBottom: 18, background: `linear-gradient(150deg, ${C.card}, ${C.roseSoft})` }}>
      <Eyebrow color={C.plum}>🔊 Deine Stimme</Eyebrow>
      {profil ? (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.55, margin: "8px 0 10px" }}>
            ✅ Aktiv seit {new Date(profil.einwilligung_am).toLocaleDateString("de-DE")}. Kartenbotschaften und Rituale
            werden in deiner Stimme gesprochen — immer sichtbar als KI-Stimme gekennzeichnet.
          </p>
          <Btn small ghost onClick={widerrufen}>Widerrufen & löschen</Btn>
        </>
      ) : !zeigen ? (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "6px 0 10px" }}>
            44 Kartenbotschaften, jedes Ritual, jede Meditation — das könntest du nie alles selbst einsprechen.
            Ein Stimmodell übernimmt genau diesen Teil. <strong>Dein persönlicher Wochenimpuls bleibt deine echte Aufnahme</strong> —
            das ist der Moment, in dem deine Klientinnen wirklich dich hören sollen.
          </p>
          <Btn small onClick={() => setZeigen(true)}>Stimme einrichten</Btn>
        </>
      ) : (
        <>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.espresso, lineHeight: 1.55, background: C.card, borderRadius: 12, padding: 12, margin: "10px 0" }}>
            {STIMME_EINWILLIGUNG_TEXT}
          </div>
          <div onClick={() => setZugestimmt(!zugestimmt)} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, border: `1.5px solid ${zugestimmt ? C.sage : C.line}`, background: zugestimmt ? C.sage : C.card, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{zugestimmt ? "✓" : ""}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso }}>Ich stimme dem oben stehenden Text zu.</div>
          </div>
          <input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder="Voice-ID deines Stimmodells"
            style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small ghost={!zugestimmt || !voiceId.trim()} onClick={speichern}>{busy ? "…" : "Aktivieren"}</Btn>
            <Btn small ghost onClick={() => setZeigen(false)}>Abbrechen</Btn>
          </div>
        </>
      )}
    </Card>
  );
}

export function CoachTwinInterview({ addPunkte }) {
  const [schritt, setSchritt] = useState(0); // -1 = fertig/Übersicht
  const [antworten, setAntworten] = useState({});
  const [eingabe, setEingabe] = useState("");
  const [erzeuge, setErzeuge] = useState(false);
  const [dossier, setDossier] = useState(null); // { id, dossier, dossier_text, freigegeben, version }
  const [fehler, setFehler] = useState("");
  const [probeMsgs, setProbeMsgs] = useState([]);
  const [probeText, setProbeText] = useState("");

  useEffect(() => {
    (async () => {
      const bestehend = await ladeEigenesDossier();
      if (bestehend) { setDossier(bestehend); setSchritt(-1); }
    })();
  }, []);

  const weiter = () => {
    const frage = COACH_TWIN_FRAGEN[schritt];
    setAntworten((prev) => ({ ...prev, [frage.k]: eingabe.trim() }));
    setEingabe("");
    if (schritt + 1 < COACH_TWIN_FRAGEN.length) setSchritt(schritt + 1);
    else erzeugeDossier({ ...antworten, [frage.k]: eingabe.trim() });
  };

  const erzeugeDossier = async (alleAntworten) => {
    setErzeuge(true);
    setFehler("");
    const rohListe = COACH_TWIN_FRAGEN.map((q) => `${q.f}\nAntwort: ${alleAntworten[q.k] || "—"}`).join("\n\n");
    const sysPrompt = `Du erstellst ein Methoden-Dossier für eine Coachin — AUSSCHLIESSLICH aus den unten gegebenen echten Interview-Antworten. Erfinde NICHTS hinzu, was nicht in den Antworten steht oder sich direkt daraus ableiten lässt. Antworte NUR mit einem JSON-Objekt (kein Fließtext davor/danach) mit genau diesen Feldern: {"ton": "kurze Beschreibung ihres Tonfalls", "anrede": "du oder Sie", "kernbegriffe": ["...", "..."], "tabus": ["...", "..."], "methodeKurz": "1 Satz", "eroeffnungssatz": "...", "abschlusssatz": "...", "grenzenText": "wie sie bei Überforderung/Verweisung reagiert", "rueckzugAnsprache": "...", "stilproben": ["...", "..."]}
Zu "stilproben": Wähle aus ihren Antworten — vor allem aus den eingefügten eigenen Texten — 4 bis 6 WÖRTLICHE, charakteristische Sätze von ihr aus. Nicht umformulieren, nicht glätten, nicht erfinden. Wenn keine eigenen Texte vorliegen, nimm die prägnantesten Originalsätze aus ihren Interview-Antworten.`;
    try {
      const antwortJson = await askLuma([{ role: "user", content: rohListe }], sysPrompt);
      let geparst = null;
      try { geparst = JSON.parse(antwortJson.replace(/```json|```/g, "").trim()); } catch { geparst = null; }
      const dossierText = geparst
        ? `# Methoden-Dossier\n\n**Ton:** ${geparst.ton}\n**Anrede:** ${geparst.anrede}\n**Methode:** ${geparst.methodeKurz}\n**Lieblingsbegriffe:** ${(geparst.kernbegriffe || []).join(", ")}\n**Tabus:** ${(geparst.tabus || []).join(", ")}\n**Eröffnungssatz:** „${geparst.eroeffnungssatz}"\n**Abschlusssatz:** „${geparst.abschlusssatz}"\n**Grenzen:** ${geparst.grenzenText}\n**Bei Rückzug:** ${geparst.rueckzugAnsprache}${geparst.stilproben?.length ? `\n\n**Deine Stilproben (so klingst du wirklich):**\n${geparst.stilproben.map((s) => `> „${s}"`).join("\n")}` : ""}`
        : antwortJson;
      const gespeichert = await speichereDossierEntwurf({ antworten: alleAntworten, dossier: geparst, dossier_text: dossierText });
      if (gespeichert) { setDossier(gespeichert); setSchritt(-1); addPunkte?.(20, "Methoden-Dossier erstellt"); }
      else setFehler("Konnte das Dossier nicht speichern — bitte gleich noch einmal versuchen.");
    } catch {
      setFehler("Gerade nicht erreichbar — versuch es in einem Moment erneut.");
    } finally {
      setErzeuge(false);
    }
  };

  const freigeben = async () => {
    if (!dossier?.id) return;
    const ok = await gibDossierFrei(dossier.id);
    if (ok) setDossier({ ...dossier, freigegeben: true, freigegeben_am: new Date().toISOString() });
  };

  const exportieren = () => {
    const blob = new Blob([dossier?.dossier_text || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "methoden-dossier.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const probeSprechen = async () => {
    if (!probeText.trim()) return;
    const next = [...probeMsgs, { role: "user", content: probeText }];
    setProbeMsgs(next); setProbeText("");
    // Dieselbe zentrale Ton-Funktion wie im echten ilho — damit die Probe zeigt,
    // was die Klientin später wirklich hört (Entwurf wird zum Test als freigegeben behandelt).
    const ton = tonalitaetsZusatz({ ...dossier, freigegeben: true });
    const reply = await askLuma(next, ILHO_SYSTEM + ton);
    setProbeMsgs([...next, { role: "assistant", content: reply }]);
  };

  // Fertig-Ansicht: Dossier prüfen, freigeben, Probesprechen
  if (schritt === -1 && dossier) {
    return (
      <div style={{ padding: "12px 0" }}>
        <Eyebrow>KI Coach Twin</Eyebrow>
        <H size={22} style={{ marginBottom: 4 }}>Dein Methoden-Dossier</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginBottom: 14 }}>
          Version {dossier.version} · {dossier.freigegeben ? "✅ freigegeben — ilho spricht jetzt in deinem Ton" : "Entwurf — noch nicht freigegeben"}
        </p>
        <Card style={{ marginBottom: 14, whiteSpace: "pre-wrap", fontFamily: "system-ui, sans-serif", fontSize: 13, lineHeight: 1.6, color: C.espresso }}>
          {dossier.dossier_text}
        </Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {!dossier.freigegeben && (
            <button onClick={freigeben} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              ✓ Dossier freigeben
            </button>
          )}
          <button onClick={exportieren} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.espresso, fontWeight: 600, cursor: "pointer" }}>
            📄 Als Text exportieren
          </button>
          <button onClick={() => { setDossier(null); setSchritt(0); setAntworten({}); }} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: "transparent", color: C.ink, cursor: "pointer" }}>
            ↻ Neu
          </button>
        </div>

        <StimmProfil />

        <Eyebrow>Probesprechen mit „deiner" ilho</Eyebrow>
        <Card style={{ marginBottom: 10, minHeight: 100 }}>
          {probeMsgs.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Schreib etwas, wie es eine Klientin tun würde — ilho antwortet in deinem konfigurierten Ton.</p>}
          {probeMsgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
              <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: 16, fontFamily: "system-ui, sans-serif", fontSize: 13.5, background: m.role === "user" ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.beige, color: m.role === "user" ? "#fff" : C.espresso }}>{m.content}</div>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={probeText} onChange={(e) => setProbeText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && probeSprechen()} placeholder="Nachricht wie eine Klientin…"
            style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14 }} />
          <button onClick={probeSprechen} style={{ padding: "11px 16px", borderRadius: 12, border: "none", background: C.espresso, color: "#fff", cursor: "pointer" }}>→</button>
        </div>
      </div>
    );
  }

  if (erzeuge) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>✨</div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink }}>ilho erstellt dein Methoden-Dossier aus deinen Antworten …</p>
      </div>
    );
  }

  const frage = COACH_TWIN_FRAGEN[schritt];
  const blockIndex = Math.floor(schritt / (COACH_TWIN_FRAGEN.length / COACH_TWIN_BLOCKS.length));
  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>KI Coach Twin · Konfigurationsinterview</Eyebrow>
      <H size={22} style={{ marginBottom: 4 }}>Frage {schritt + 1}/{COACH_TWIN_FRAGEN.length}</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.plum, marginBottom: 16 }}>Block: {COACH_TWIN_BLOCKS[Math.min(blockIndex, 3)]}</p>
      <div style={{ height: 4, background: C.line, borderRadius: 2, marginBottom: 20 }}>
        <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})`, width: `${((schritt + 1) / COACH_TWIN_FRAGEN.length) * 100}%`, transition: "width .3s" }} />
      </div>
      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, lineHeight: 1.5 }}>{frage.f}</p>
      </Card>
      {fehler && <p style={{ color: C.rose, fontSize: 12.5, marginBottom: 10 }}>{fehler}</p>}
      <textarea value={eingabe} onChange={(e) => setEingabe(e.target.value)} rows={4} placeholder="Deine Antwort…"
        style={{ width: "100%", padding: 14, borderRadius: 14, border: `1px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14.5, marginBottom: 14, resize: "vertical" }} />
      <button onClick={weiter} disabled={!eingabe.trim()} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: eingabe.trim() ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.line, color: "#fff", fontWeight: 700, fontSize: 15, cursor: eingabe.trim() ? "pointer" : "default" }}>
        {schritt + 1 < COACH_TWIN_FRAGEN.length ? "Weiter →" : "✨ Dossier erstellen"}
      </button>
    </div>
  );
}

/* ── Coach-Dashboard: tägliche Aufgaben-Erledigung je Klientin (Demo · Einzelnutzer-Prototyp) ── */
/* ── Business Manager Light: „Heute"-Aktionsliste (Katman 1 · Baustein 4) ──
   REGELBASIERT — kein LLM wählt aus, was wichtig ist. Max. 7 Einträge, jede Zeile eine Handlung.
   Im Mehrklientinnen-Betrieb speist sich das aus allen verknüpften Klientinnen; im Prototyp aus der Einzelnutzerin. */
export function coachHeuteAktionen({ ci, checkins, entries, streak, ch369 }) {
  const a = [];
  const heuteStr = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  // 1. Kritische Signale zuerst (bestehende Signal-Logik)
  ci.warnungen.forEach((w) => a.push({ icon: "🔴", t: w.t, art: "Signal prüfen" }));
  // 2. Stille Klientin: kein Journal seit >3 Einträgen zurückliegendem Datum bzw. Streak-Riss
  if (streak === 0 && entries?.length) a.push({ icon: "🕯️", t: "Klientin war zuletzt nicht aktiv — sanft nachfragen?", art: "Kontakt" });
  // 3. Unbeantwortete Check-in-Notiz (Notiz an Coachin vorhanden)
  const notiz = (checkins || []).find((c) => c.notiz);
  if (notiz) a.push({ icon: "💬", t: `Check-in-Notiz vom ${notiz.datum}: „${notiz.notiz}"`, art: "Antworten" });
  // 4. Challenge-Meilenstein
  if (ch369?.tag === 21) a.push({ icon: "🏆", t: "Challenge abgeschlossen (Tag 21) — gratulieren!", art: "Feiern" });
  else if (ch369?.tag >= 1 && !ci.dankbarkeitHeute) a.push({ icon: "🔔", t: `Challenge Tag ${ch369.tag}/21 heute noch offen`, art: "Im Blick behalten" });
  // 5. Kein Journaleintrag heute
  if (!entries?.some((e) => e.date === heuteStr)) a.push({ icon: "📔", t: "Heute noch kein Journaleintrag", art: "Beobachten" });
  // 6. Wochenimpuls fällig (Montag)
  if (new Date().getDay() === 1) a.push({ icon: "🎙️", t: "Montag: Zeit für deinen Wochenimpuls", art: "Aufnehmen" });
  return a.slice(0, 7);
}

/* ── Coach Reflection (Katman 1 · Baustein 3): EINE Frage nach dem Blick aufs Dashboard.
   Antwort bleibt privat bei der Coachin (Prototyp: localStorage, nie an Klientin/Server). */
export const REFLEXION_SYSTEM = `Du unterstützt eine Coachin bei ihrer eigenen Reflexion. Aus dem folgenden anonymisierten Wochen-Lagebild ihrer Klientin formulierst du GENAU EINE offene, kluge Reflexionsfrage an die Coachin selbst (Deutsch, Du-Form, max. 2 Sätze). Die Frage richtet sich auf IHR coacherisches Handeln oder ihre Wahrnehmung — nie auf eine Diagnose der Klientin. Keine Einleitung, nur die Frage.`;

export function CoachReflexion({ ci, checkins, streak }) {
  const [frage, setFrage] = useState(() => localStorage.getItem("s2g_reflex_frage") || "");
  const [antwort, setAntwort] = useState(() => localStorage.getItem("s2g_reflex_antwort") || "");
  const [busy, setBusy] = useState(false);
  const holen = async () => {
    if (busy) return;
    setBusy(true);
    const lage = `Wohlbefindens-Index: ${ci.index}/100 · Serie: ${streak} Tage · Warnungen: ${ci.warnungen.map((w) => w.t).join("; ") || "keine"} · Schwächster Bereich: ${ci.schwaechster} · Letzter Check-in: ${checkins?.[0] ? `${checkins[0].wert}/5${checkins[0].notiz ? ` — „${checkins[0].notiz}"` : ""}` : "keiner"}`;
    const f = await askLuma([{ role: "user", content: lage }], REFLEXION_SYSTEM);
    if (f) { setFrage(f); localStorage.setItem("s2g_reflex_frage", f); logEvent("coach_reflexion"); }
    setBusy(false);
  };
  return (
    <Card style={{ marginTop: 14, background: `linear-gradient(150deg, ${C.card}, ${C.goldPale})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow color={C.gold}>🪞 Deine Reflexion</Eyebrow>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>KI-Frage · Antwort bleibt privat</span>
      </div>
      {frage ? (
        <>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.espresso, lineHeight: 1.6, margin: "8px 0 10px" }}>{frage}</p>
          <textarea rows={3} value={antwort} placeholder="Dein Gedanke dazu — nur für dich …"
            onChange={(e) => { setAntwort(e.target.value); localStorage.setItem("s2g_reflex_antwort", e.target.value); }}
            style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
          <Btn small ghost onClick={holen} disabled={busy}>{busy ? "…" : "Neue Frage"}</Btn>
        </>
      ) : (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "6px 0 10px" }}>Nach dem Blick aufs Lagebild: eine Frage an dich selbst. Auch du wächst.</p>
          <Btn small onClick={holen} disabled={busy}>{busy ? "…" : "Reflexionsfrage erhalten"}</Btn>
        </>
      )}
    </Card>
  );
}

export function CoachDashboard({ name, streak, entries, ch369, drawn, horo, energie, aufgaben, checkins }) {
  const ci = coachingIntelligenz({ energie, entries, aufgaben, streak, ch369 });
  const heuteStr = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  const tasks = [
    { icon: "📔", t: "Journaling", done: entries?.some((e) => e.date === heuteStr) },
    { icon: "🏆", t: `Challenge (Tag ${ch369?.tag || 0}/21)`, done: ch369?.letzterTag === new Date().toDateString() },
    { icon: "🎴", t: "Tageskarte gezogen", done: !!drawn },
    { icon: "⭐", t: "Horoskop gelesen", done: !!horo?.text },
  ];
  const erledigt = tasks.filter((t) => t.done).length;

  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>Coach-Ansicht · Demo</Eyebrow>
      <H size={23} style={{ marginBottom: 4 }}>Klientin: {name || "—"}</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginBottom: 16 }}>
        Prototyp — zeigt aktuell nur diese Einzelnutzerin. Für echte Klientinnen-Konten braucht es Login je Nutzerin + Coach-Zuweisung in der Datenbank.
      </p>

      {/* „Heute"-Aktionsliste — regelbasiert, max. 7, jede Zeile eine Handlung (Business Manager Light) */}
      {(() => {
        const aktionen = coachHeuteAktionen({ ci, checkins, entries, streak, ch369 });
        return (
          <Card style={{ marginBottom: 14, border: `1.5px solid ${C.gold}` }}>
            <Eyebrow color={C.gold}>☀️ Heute wichtig</Eyebrow>
            {aktionen.length ? aktionen.map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < aktionen.length - 1 ? `1px solid ${C.line}` : "none" }}>
                <span style={{ fontSize: 16 }}>{x.icon}</span>
                <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, lineHeight: 1.4 }}>{x.t}</span>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.plum, flexShrink: 0 }}>{x.art}</span>
              </div>
            )) : (
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 6 }}>✓ Nichts offen — alles im grünen Bereich.</p>
            )}
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7, marginTop: 8 }}>Regelbasiert aus den Signalen — keine KI-Auswahl.</div>
          </Card>
        );
      })()}

      <Card style={{ marginBottom: 14, textAlign: "center", background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 140%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>Wohlbefindens-Index</Eyebrow>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 44, color: "#FFF8F0" }}>{ci.index}<span style={{ fontSize: 18 }}>/100</span></div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#FFF3F0" }}>🔥 {streak} Tage Serie</div>
      </Card>

      {/* Dankbarkeits-Challenge: eigene, hervorgehobene Karte — zählt stärker als andere Aufgaben
          und ihr Status muss dem Coach auf einen Blick auffallen, nicht in der Liste untergehen. */}
      <Card style={{
        marginBottom: 14, display: "flex", alignItems: "center", gap: 12,
        background: ci.dankbarkeitHeute ? "#F2F8F0" : "#FBF2E4",
        border: `1.5px solid ${ci.dankbarkeitHeute ? C.sage : C.gold || "#E0B24C"}`,
      }}>
        <span style={{ fontSize: 26 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.plum }}>Dankbarkeits-Challenge</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 600, color: C.espresso, marginTop: 2 }}>
            {ch369?.tag ? `Tag ${ch369.tag}/21 · heute ${ci.dankbarkeitHeute ? "erledigt ✓" : "noch offen"}` : "Noch nicht gestartet"}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Eyebrow color={C.plum}>Heutige Aufgaben · {heuteStr}</Eyebrow>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: erledigt === tasks.length ? C.sage : C.plum }}>{erledigt}/{tasks.length}</span>
        </div>
        {tasks.map((t, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", marginBottom: 6,
            borderRadius: 12, border: `1.5px solid ${t.done ? C.sage : C.line}`, background: t.done ? "#F2F8F0" : C.card,
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 600, color: C.espresso, opacity: t.done ? 0.75 : 1 }}>{t.t}</span>
            <div style={{ width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${t.done ? C.sage : C.line}`, background: t.done ? C.sage : C.card, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{t.done ? "✓" : ""}</div>
          </div>
        ))}
      </Card>

      {ci.warnungen.length > 0 && (
        <Card style={{ marginBottom: 14, background: "#F9E8E2", border: `1px solid #E7B7A8` }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#B0492F" }}>⚠ Frühwarnung</div>
          {ci.warnungen.map((w, i) => (
            <button
              key={i}
              onClick={() => go?.(w.tab)}
              disabled={!go}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", minHeight: 40,
                marginTop: 6, padding: "8px 10px", textAlign: "left",
                background: "rgba(255,255,255,.6)", border: "1px solid #E7B7A8", borderRadius: 10,
                cursor: go ? "pointer" : "default",
                fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso,
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>{w.t}</span>
              {go && (
                <>
                  <span style={{ fontSize: 11, color: "#B0492F", whiteSpace: "nowrap" }}>{w.hin}</span>
                  <span style={{ color: "#B0492F", fontSize: 15 }}>›</span>
                </>
              )}
            </button>
          ))}
        </Card>
      )}

      <Card>
        <Eyebrow color={C.plum}>Letzte Check-ins</Eyebrow>
        {checkins?.length ? checkins.slice(0, 5).map((c, i) => (
          <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.line}` : "none" }}>
            {c.datum} · Wert {c.wert}/5{c.notiz ? ` · „${c.notiz}"` : ""}
          </div>
        )) : (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Noch keine Check-ins.</p>
        )}
      </Card>

      <CoachReflexion ci={ci} checkins={checkins} streak={streak} />
    </div>
  );
}

export function WochenCheckin({ checkins, setCheckins, addPunkte, prefs, setPrefs }) {
  const [wert, setWert] = useState(0);
  const [notiz, setNotiz] = useState("");
  if (!setCheckins) return null;
  const heute = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  const letzte = checkins && checkins[0];
  const schonHeute = letzte && letzte.datum === heute;
  const SMILEYS = [["😔", 1], ["😕", 2], ["😐", 3], ["🙂", 4], ["😊", 5]];
  const erinnerung = prefs?.checkinReminder ?? true;
  const speichern = () => {
    if (!wert) return;
    setCheckins([{ datum: heute, wert, notiz: notiz.trim() }, ...(checkins || [])].slice(0, 12));
    setNotiz(""); setWert(0);
    if (addPunkte) addPunkte(10, "Wöchentlicher Check-in");
  };
  return (
    <Card style={{ marginBottom: 14 }}>
      <Eyebrow color={C.plum}>Wöchentlicher Check-in</Eyebrow>
      {schonHeute ? (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, marginTop: 6 }}>✓ Heute schon eingecheckt — schön, dass du dranbleibst. 🤍</p>
      ) : (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, margin: "6px 0 10px", lineHeight: 1.5 }}>Wie fühlst du dich mit deinen Zielen diese Woche?</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {SMILEYS.map(([e, v]) => (
              <button key={v} onClick={() => setWert(v)} style={{ flex: 1, padding: "10px 0", borderRadius: 13, cursor: "pointer", border: `1.5px solid ${wert === v ? C.rose : C.line}`, background: wert === v ? C.roseSoft : C.card, fontSize: 22 }}>{e}</button>
            ))}
          </div>
          <textarea rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="Kurze Notiz für deine Coachin (optional)" style={{ width: "100%", padding: "11px 13px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
          <Btn small ghost={!wert} onClick={speichern}>Check-in speichern</Btn>
        </>
      )}
      <div onClick={() => setPrefs && setPrefs({ ...(prefs || {}), checkinReminder: !erinnerung })} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, cursor: "pointer" }}>
        <span style={{ fontSize: 17 }}>🔔</span>
        <div style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Erinnerung: Sonntagabend</div>
        <div style={{ width: 42, height: 24, borderRadius: 14, background: erinnerung ? C.gold : C.line, position: "relative", transition: "background .2s" }}>
          <div style={{ position: "absolute", top: 2, left: erinnerung ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
        </div>
      </div>
      {letzte && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 10 }}>Letzter Check-in: {letzte.datum} · {(SMILEYS.find((s) => s[1] === letzte.wert) || ["–"])[0]}</div>
      )}
    </Card>
  );
}

/* ── Progress Narrative: „Dein Wochenbild" (Katman 1 · Baustein 2) ──
   Erzählender Wochenrückblick NUR aus dem, was die Nutzerin selbst geschrieben hat.
   Harte Sprachregeln (HeilprG-Grenze): paraphrasieren statt bewerten, keine Diagnose-/Messsprache. */
export const WOCHENBILD_SYSTEM = `Du bist ilho, der klar als KI gekennzeichnete Begleiter der App smile2go. Du schreibst „Dein Wochenbild": einen kurzen, warmen Rückblick (4–7 Sätze, Deutsch, Du-Form) für die Nutzerin — ausschließlich aus ihren eigenen Journal-Einträgen, Intentionen und Check-ins der letzten 7 Tage.
STRIKTE REGELN:
1. Paraphrasiere NUR, was die Nutzerin selbst geschrieben hat. Beispiel richtig: „Du hast diese Woche dreimal über Druck im Job geschrieben." Beispiel FALSCH: „Dein Stresslevel ist gestiegen."
2. Keine Diagnosen, keine Bewertungen ihrer Person, keine Mess- oder Punktzahl-Sprache, keine Therapie-Begriffe.
3. Benenne höchstens EIN wiederkehrendes Thema und EINE beobachtbare Veränderung — mit Bezug auf ihre eigenen Worte.
4. Schließe mit einer einzigen sanften, offenen Frage für die kommende Woche.
5. Wenn die Einträge Hinweise auf Krise, Selbstverletzung oder schweres seelisches Leid enthalten: KEIN Wochenbild schreiben, sondern einfühlsam sagen, dass du eine KI bist, und professionelle Hilfe empfehlen (TelefonSeelsorge 0800 111 0 111, Notruf 112).
6. Wenige oder keine Einträge: ehrlich und liebevoll sagen, dass das Bild diese Woche dünn ist — ohne Vorwurf.`;

export function Wochenbild({ entries, checkins, streak, prefs, setPrefs, addPunkte, twinTon = "" }) {
  const [busy, setBusy] = useState(false);
  const key = wochenKey();
  const gespeichert = prefs?.wochenbild;
  const aktuell = gespeichert && gespeichert.woche === key ? gespeichert : null;

  const erstellen = async () => {
    if (busy) return;
    setBusy(true);
    const letzte = (entries || []).slice(0, 10).map((e) =>
      `${e.date}: Intention: ${e.intention || "—"}${e.stimmung ? ` · Selbstauskunft: ${e.stimmung}/10` : ""}${e.items?.length ? ` · ${e.items.join(" | ")}` : ""}`
    ).join("\n");
    const ci = (checkins || []).slice(0, 2).map((c) => `${c.datum}: ${c.wert}/5${c.notiz ? ` — „${c.notiz}"` : ""}`).join("\n");
    const user = `Journal der letzten Tage:\n${letzte || "(keine Einträge)"}\n\nWochen-Check-ins:\n${ci || "(keine)"}\n\nAktive Tage in Folge: ${streak}`;
    const text = await askLuma([{ role: "user", content: user }], WOCHENBILD_SYSTEM + twinTon);
    if (text && setPrefs) {
      setPrefs({ ...(prefs || {}), wochenbild: { woche: key, datum: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }), text } });
      if (!aktuell && addPunkte) addPunkte(15, "Wochenbild angesehen");
      logEvent("wochenbild_erstellt");
    }
    setBusy(false);
  };

  return (
    <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, ${C.card}, ${C.roseSoft})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow color={C.plum}>🌙 Dein Wochenbild</Eyebrow>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>von ilho · KI</span>
      </div>
      {aktuell ? (
        <>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.65, margin: "8px 0 10px", whiteSpace: "pre-wrap" }}>{aktuell.text}</p>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink }}>Erstellt am {aktuell.datum} · aus deinen eigenen Worten dieser Woche</div>
          <div style={{ marginTop: 10 }}><Btn small ghost onClick={erstellen} disabled={busy}>{busy ? "✨ entsteht …" : "Neu erstellen"}</Btn></div>
        </>
      ) : (
        <>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "6px 0 10px" }}>
            ilho fasst deine Woche in Worte — nur aus dem, was du selbst geschrieben hast. Nichts wird bewertet, nichts gemessen.
          </p>
          <Btn small onClick={erstellen} disabled={busy}>{busy ? "✨ ilho liest deine Woche …" : "Wochenbild erstellen"}</Btn>
        </>
      )}
    </Card>
  );
}

