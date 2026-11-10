// IlhoAgent.jsx — smile2go
// Aus dem allgemeinen ilho wird IHR ilho.
//
// Drei Dinge kommen dazu, und alle drei liegen offen vor ihr:
//
//   Kennenlernen   Beim ersten Öffnen fragt ilho, was sie gerade bewegt und
//                  was sie sich wünscht. Nichts davon wird erraten.
//   Gedächtnis     ilho darf sich einzelne Sätze merken — nur wenn sie es
//                  erlaubt, jeder Satz ist sichtbar und einzeln löschbar.
//   Wegweiser      ilho kennt die Gemeinschaft und die Übungen der App und
//                  kann einen Knopf dorthin anbieten, statt nur davon zu reden.
//
// Gespeichert wird alles in prefs.ilhoProfil — also dort, wo auch der Rest
// ihres App-Zustands liegt. Keine neue Tabelle.
import { useEffect, useState } from "react";

const MAX_NOTIZEN = 12;

// Wohin ilho einen Knopf anbieten darf. Nur diese Schlüssel — alles andere
// aus der Antwort wird verworfen, damit kein Knopf ins Leere führt.
export const ILHO_ZIELE = {
  gemeinschaft: "Zur Gemeinschaft",
  meditation: "Zu den Meditationen",
  tagebuch: "Zum Tagebuch",
  achtsamkeit: "Zur Achtsamkeit",
  dankbarkeit: "Zur Dankbarkeit",
  loslassen: "Zum Loslassen",
  mondrituale: "Zu den Mondritualen",
  metime: "Zur Me-Time",
  kurse: "Zu den Kursen",
  buchen: "Termin buchen",
  kreis: "Zum Freundinnen-Kreis",
};

export const leeresProfil = () => ({ fertig: false, themen: [], ziel: "", merken: true, notizen: [] });

/* Der Zusatz zum System-Prompt: wer sie ist, was ilho sich gemerkt hat,
   was es in der Gemeinschaft für sie gibt — und die zwei Zeichen, mit denen
   ilho der App etwas mitteilt. */
export function agentKontext(profil, beduerfnisse = [], beitraege = []) {
  if (!profil?.fertig) return "";
  const BED = Object.fromEntries(beduerfnisse.map((b) => [b.id, b.t]));
  const teil = ["\n\nDU BIST IHR PERSÖNLICHER BEGLEITER. Das weißt du über sie — nutze es selbstverständlich, ohne es aufzuzählen:"];
  const themen = (profil.themen || []).map((id) => BED[id]).filter(Boolean);
  if (themen.length) teil.push(`– Was sie gerade bewegt (von ihr selbst gewählt): ${themen.join("; ")}`);
  if (profil.ziel) teil.push(`– Was sie sich wünscht: ${profil.ziel.slice(0, 300)}`);
  const notizen = (profil.notizen || []).map((n) => n.t).filter(Boolean);
  if (notizen.length) teil.push(`– Was du dir aus früheren Gesprächen gemerkt hast:\n${notizen.map((n) => `  · ${n}`).join("\n")}`);

  if (beitraege.length) {
    teil.push(
      "\nGEMEINSCHAFT: Diese Beiträge von Coachinnen passen zu dem, was sie bewegt. Wenn es im Gespräch wirklich passt, nenne EINEN davon beim Titel — erfinde keine anderen:\n" +
      beitraege.slice(0, 5).map((b) => `  · „${b.titel}"${b.coach_name ? ` von ${b.coach_name}` : ""}${b.dauer_min ? ` (${b.dauer_min} Min)` : ""}`).join("\n"),
    );
  }

  teil.push(
    `\nWEGWEISER: Wenn ein Bereich der App jetzt wirklich hilft, hänge ganz ans Ende deiner Antwort eine Zeile [[OEFFNE:schluessel]] an. Erlaubte Schlüssel: ${Object.keys(ILHO_ZIELE).join(", ")}. Höchstens eine solche Zeile, und nur wenn es passt — nicht in jeder Antwort. Fühlt sie sich allein oder sucht Austausch, ist „gemeinschaft" oder „kreis" richtig.`,
  );
  if (profil.merken) {
    teil.push(
      `GEDÄCHTNIS: Teilt sie etwas Bleibendes über sich mit, das dir in späteren Gesprächen hilft (ein Ziel, eine Lebenssituation, was ihr guttut), hänge ans Ende eine Zeile [[MERKEN: ein kurzer Satz in der dritten Person]] an. Höchstens eine pro Antwort, nur Neues. NIEMALS merken: Diagnosen, Krankheiten, Medikamente, Angaben zu Religion, Herkunft, Sexualität oder Finanzen, Namen anderer Menschen, Krisen oder Selbstverletzung.`,
    );
  }
  teil.push("Die Zeilen in doppelten eckigen Klammern sieht sie nicht. Erwähne sie nie im Text.");
  return teil.join("\n");
}

/* Trennt die Antwort in das, was sie liest, und das, was die App tut. */
export function verarbeiteAntwort(roh) {
  let text = roh || "";
  let oeffne = null;
  let merke = null;
  text = text.replace(/\[\[\s*OEFFNE\s*:\s*([a-z]+)\s*\]\]/gi, (_, k) => {
    const key = k.toLowerCase();
    if (!oeffne && ILHO_ZIELE[key]) oeffne = key;
    return "";
  });
  text = text.replace(/\[\[\s*MERKEN\s*:\s*([^\]]{3,200})\]\]/gi, (_, s) => {
    if (!merke) merke = s.trim();
    return "";
  });
  // Falls ein Zeichen abgeschnitten ankam: nichts davon zeigen.
  text = text.replace(/\[\[[^\]]*$/g, "").trim();
  return { text, oeffne, merke };
}

export function notizDazu(profil, satz) {
  const p = profil || leeresProfil();
  const alt = p.notizen || [];
  if (!satz || alt.some((n) => n.t.toLowerCase() === satz.toLowerCase())) return p;
  const neu = [...alt, { t: satz, d: new Date().toISOString().slice(0, 10) }].slice(-MAX_NOTIZEN);
  return { ...p, notizen: neu };
}

/* ── Kennenlernen: zwei Fragen, eine Erlaubnis ── */
export function IlhoKennenlernen({ C, name, beduerfnisse, profil, onFertig, onSpaeter }) {
  const [themen, setThemen] = useState(profil?.themen || []);
  const [ziel, setZiel] = useState(profil?.ziel || "");
  const [merken, setMerken] = useState(profil?.merken ?? true);
  const sys = { fontFamily: "system-ui, sans-serif" };

  const tippen = (id) =>
    setThemen((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length >= 3 ? t : [...t, id]));

  return (
    <div style={{ textAlign: "left", padding: "6px 2px 4px" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, marginBottom: 6 }}>
        Schön, dass du da bist{name ? `, ${name}` : ""}.
      </div>
      <p style={{ ...sys, fontSize: 15, color: C.ink, lineHeight: 1.55, margin: "0 0 16px" }}>
        Ich bin ilho, dein persönlicher Begleiter hier. Zwei kurze Fragen, damit ich wirklich für dich da sein kann.
      </p>

      <div style={{ ...sys, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, color: C.gold, marginBottom: 8 }}>
        Was bewegt dich gerade? <span style={{ opacity: 0.7, textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(bis zu drei)</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
        {beduerfnisse.map((b) => {
          const an = themen.includes(b.id);
          return (
            <button key={b.id} onClick={() => tippen(b.id)} aria-pressed={an} style={{
              ...sys, fontSize: 13.5, padding: "9px 13px", borderRadius: 18, cursor: "pointer",
              border: `1.5px solid ${an ? C.gold : C.line}`, background: an ? C.goldPale : C.card,
              color: an ? C.plum : C.ink, fontWeight: an ? 600 : 500, textAlign: "left",
            }}>{b.t}</button>
          );
        })}
      </div>

      <div style={{ ...sys, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, color: C.gold, marginBottom: 8 }}>
        Was wünschst du dir für die nächsten Wochen?
      </div>
      <textarea value={ziel} onChange={(e) => setZiel(e.target.value.slice(0, 300))} rows={3}
        placeholder="Zum Beispiel: wieder durchschlafen · mehr Ruhe im Kopf · mich selbst ernster nehmen"
        style={{ ...sys, width: "100%", boxSizing: "border-box", fontSize: 15.5, lineHeight: 1.5, padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.card, color: C.espresso, outline: "none", resize: "vertical", marginBottom: 14 }} />

      <label style={{ ...sys, display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13.5, color: C.ink, lineHeight: 1.45, cursor: "pointer", marginBottom: 16 }}>
        <input type="checkbox" checked={merken} onChange={(e) => setMerken(e.target.checked)} style={{ marginTop: 2 }} />
        <span>ilho darf sich einzelne Sätze aus unseren Gesprächen merken. Du siehst jeden davon und kannst ihn jederzeit löschen.</span>
      </label>

      <button onClick={() => onFertig({ ...(profil || leeresProfil()), fertig: true, themen, ziel: ziel.trim(), merken })}
        disabled={!themen.length && !ziel.trim()}
        style={{
          ...sys, width: "100%", minHeight: 50, border: "none", borderRadius: 25, fontSize: 15.5, fontWeight: 600,
          cursor: !themen.length && !ziel.trim() ? "default" : "pointer", color: "#fff",
          background: `linear-gradient(135deg, ${C.gold}, ${C.plum})`, opacity: !themen.length && !ziel.trim() ? 0.45 : 1,
        }}>So kennst du mich</button>
      {onSpaeter && (
        <button onClick={onSpaeter} style={{ ...sys, display: "block", margin: "10px auto 0", background: "none", border: "none", color: C.ink, fontSize: 13.5, cursor: "pointer", textDecoration: "underline" }}>
          Später
        </button>
      )}
    </div>
  );
}

/* ── Was ilho über dich weiß: alles sichtbar, alles löschbar ── */
export function IlhoWissen({ C, beduerfnisse, profil, setProfil, onBearbeiten }) {
  const BED = Object.fromEntries(beduerfnisse.map((b) => [b.id, b.t]));
  const sys = { fontFamily: "system-ui, sans-serif" };
  const themen = (profil.themen || []).map((id) => BED[id]).filter(Boolean);
  const notizen = profil.notizen || [];
  return (
    <div style={{ ...sys, fontSize: 13.5, color: C.ink, lineHeight: 1.5, textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontWeight: 700, color: C.espresso, marginBottom: 6 }}>Was ilho über dich weiß</div>
      {themen.length > 0 && <div style={{ marginBottom: 4 }}><b style={{ color: C.espresso, fontWeight: 600 }}>Bewegt dich:</b> {themen.join(" · ")}</div>}
      {profil.ziel && <div style={{ marginBottom: 4 }}><b style={{ color: C.espresso, fontWeight: 600 }}>Dein Wunsch:</b> {profil.ziel}</div>}
      {notizen.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, color: C.espresso, marginBottom: 4 }}>Gemerkt</div>
          {notizen.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
              <span style={{ flex: 1 }}>{n.t}</span>
              <button onClick={() => setProfil({ ...profil, notizen: notizen.filter((_, j) => j !== i) })}
                aria-label={`Löschen: ${n.t}`} style={{ border: "none", background: "none", color: C.ink, cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
      {!themen.length && !profil.ziel && !notizen.length && <div>Noch nichts.</div>}
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={!!profil.merken} onChange={(e) => setProfil({ ...profil, merken: e.target.checked })} style={{ marginTop: 2 }} />
        <span>ilho darf sich Neues merken</span>
      </label>
      <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
        <button onClick={onBearbeiten} style={{ border: "none", background: "none", color: C.plum, fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>Antworten ändern</button>
        <button onClick={() => setProfil(leeresProfil())} style={{ border: "none", background: "none", color: C.ink, fontSize: 13, cursor: "pointer", padding: 0, textDecoration: "underline" }}>Alles vergessen</button>
      </div>
    </div>
  );
}

/* Lädt zu ihren Themen passende Beiträge aus der Gemeinschaft — einmal je
   Themenwahl, nicht bei jeder Nachricht. */
export function usePassendeBeitraege(themen, lade) {
  const [beitraege, setBeitraege] = useState([]);
  const schluessel = (themen || []).join(",");
  useEffect(() => {
    let aktiv = true;
    if (!schluessel) { setBeitraege([]); return; }
    Promise.all(schluessel.split(",").slice(0, 3).map((id) => lade(id, 2).catch(() => [])))
      .then((r) => { if (aktiv) setBeitraege(r.flat()); });
    return () => { aktiv = false; };
  }, [schluessel]); // eslint-disable-line react-hooks/exhaustive-deps
  return beitraege;
}
