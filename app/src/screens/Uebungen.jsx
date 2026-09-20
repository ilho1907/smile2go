// Uebungen.jsx — Übungen und Rituale: Qigong, Achtsamkeit, Dankbarkeit, Me-Time u. a.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { AUDIO as S2GAUDIO } from "../media";
import { useEffect, useState } from "react";
import { kalenderwoche, mondphase } from "../lib/zeit";
import { Btn, Card, Eyebrow, H, Hoerspur, TeilenBtn } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Gemeinsame Flamme — kollektives Streak-Ritual (Community-Vorschau) ── */
export function Flamme({ flamme, setFlamme, addPunkte }) {
  const heute = new Date().toDateString();
  const beigetragen = flamme?.letzterTag === heute;
  const tage = flamme?.tage || 0;
  // Ehrliche Demo: Die Community-Zahl ist eine Vorschau, solange der Server-Teil nicht live ist.
  const demoAndere = 11 + (new Date().getDate() % 7);
  const beitragen = () => {
    if (beigetragen) return;
    setFlamme({ letzterTag: heute, tage: tage + 1 });
    addPunkte(3, "Dein Licht brennt mit");
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <style>{`@keyframes flicker { 0%,100% { transform: scale(1) rotate(-1deg); opacity: 1; } 30% { transform: scale(1.08) rotate(1.5deg); opacity: .92; } 60% { transform: scale(.96) rotate(-.5deg); opacity: .97; } }`}</style>
      <Eyebrow color={C.plum}>Gemeinsame Flamme</Eyebrow>
      <H size={25}>Ein Licht, das uns allen gehört</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 18px" }}>
        Die Flamme brennt, solange jeden Tag genug von uns ihr Ritual vollenden. Dein Beitrag zählt — für alle.
      </p>
      <Card style={{ textAlign: "center", background: "#2E2320", border: "1px solid #4A3A30" }}>
        <div style={{ fontSize: 74, animation: "flicker 2.2s ease-in-out infinite", display: "inline-block", filter: "drop-shadow(0 0 18px rgba(230,190,108,.65))" }}>🕯️</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#F0E4D6", marginTop: 10 }}>Die Flamme brennt</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#C9A98C", marginTop: 6 }}>
          Heute haben {demoAndere + (beigetragen ? 1 : 0)} Frauen ihr Licht dazugegeben{beigetragen ? " — du bist dabei. 🤍" : "."}
        </div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#9C8470", marginTop: 8 }}>Community-Vorschau — die Live-Zählung startet mit dem Server-Update.</div>
      </Card>
      <div style={{ marginTop: 14 }}>
        <Btn full onClick={beitragen} disabled={beigetragen}>
          {beigetragen ? "Dein Licht brennt heute schon 🤍" : "🕯️ Mein Licht dazugeben"}
        </Btn>
      </div>
      <Card style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Deine Beiträge zur Flamme</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.espresso }}>{tage} Tage</div>
        </div>
        <div style={{ fontSize: 30 }}>{tage >= 21 ? "🌟" : tage >= 7 ? "✨" : "🕯️"}</div>
      </Card>
    </div>
  );
}

/* ── Freundinnen-Kreis — geteilte Rituale (lokaler Kreis, Server folgt) ── */
export function FreundinnenKreis({ kreis, setKreis, streak, addPunkte }) {
  const [name, setName] = useState("");
  const [thema, setThema] = useState(kreis?.thema || "");
  const mitglieder = kreis?.mitglieder || [];
  const heute = new Date().toDateString();
  const einladen = () => {
    const n = name.trim();
    if (!n || mitglieder.length >= 5) return;
    setKreis({ ...(kreis || {}), mitglieder: [...mitglieder, { name: n, eingeladen: new Date().toLocaleDateString("de-DE"), status: "eingeladen" }] });
    setName("");
    addPunkte(5, "Freundin eingeladen");
  };
  const entfernen = (i) => setKreis({ ...(kreis || {}), mitglieder: mitglieder.filter((_, x) => x !== i) });
  const themaSetzen = () => {
    if (!thema.trim()) return;
    setKreis({ ...(kreis || {}), thema: thema.trim(), themaStart: heute, themaTag: 1 });
    addPunkte(5, "Gemeinsames Thema gesetzt");
  };
  const tagZaehlen = () => {
    if (kreis?.letzterTag === heute) return;
    setKreis({ ...(kreis || {}), letzterTag: heute, themaTag: (kreis?.themaTag || 0) + 1 });
    addPunkte(8, "Kreis-Tag geschafft");
  };
  const heuteGemacht = kreis?.letzterTag === heute;
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Freundinnen-Kreis</Eyebrow>
      <H size={25}>Gemeinsam wächst es sich leichter</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Lade bis zu 5 Freundinnen in deinen privaten Kreis. Ihr journalt 21 Tage zum selben Thema — jede für sich, und doch zusammen.
      </p>
      <Card style={{ marginBottom: 14 }}>
        <Eyebrow color={C.espresso}>Dein Kreis ({mitglieder.length + 1}/6)</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17 }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Du</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>🔥 {streak} Tage Serie</div>
          </div>
        </div>
        {mitglieder.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.plum, fontWeight: 700 }}>{m.name.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{m.name}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>Einladung offen · {m.eingeladen}</div>
            </div>
            <button onClick={() => entfernen(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink, fontSize: 16 }}>✕</button>
          </div>
        ))}
        {mitglieder.length < 5 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && einladen()} placeholder="Name deiner Freundin"
              style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14, outline: "none", background: C.cream, color: C.espresso }} />
            <Btn small onClick={einladen} disabled={!name.trim()}>Einladen</Btn>
          </div>
        )}
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.7, marginTop: 10 }}>
          Vorschau: Der Einladungs-Versand startet mit dem Server-Update — bis dahin planst du deinen Kreis hier.
        </div>
      </Card>
      <Card>
        <Eyebrow color={C.espresso}>Euer gemeinsames Thema</Eyebrow>
        {!kreis?.thema ? (
          <>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={thema} onChange={(e) => setThema(e.target.value)} placeholder="z. B. Grenzen setzen"
                style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14, outline: "none", background: C.cream, color: C.espresso }} />
              <Btn small onClick={themaSetzen} disabled={!thema.trim()}>Start</Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso, margin: "6px 0 10px" }}>{kreis.thema}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
              {Array.from({ length: 21 }).map((_, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: 7, background: i < (kreis.themaTag || 0) ? C.gold : C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{i < (kreis.themaTag || 0) ? "✓" : ""}</div>
              ))}
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 12 }}>Tag {Math.min(kreis.themaTag || 0, 21)} von 21</div>
            <Btn full onClick={tagZaehlen} disabled={heuteGemacht}>{heuteGemacht ? "Heute schon dabei 🤍" : "Heutigen Tag abschließen"}</Btn>
          </>
        )}
      </Card>
    </div>
  );
}

/* ── Mondkalender — Rituale zu Voll- und Neumond ── */
export function Mondrituale({ mondrit, setMondrit, addPunkte }) {
  const m = mondphase();
  const istVoll = m.n === "Vollmond";
  const istNeu = m.n === "Neumond";
  const [text, setText] = useState("");
  const [burning, setBurning] = useState(false);
  const intentionen = mondrit?.intentionen || [];
  const losRitual = () => {
    if (!text.trim()) return;
    setBurning(true);
    setTimeout(() => { setText(""); setBurning(false); addPunkte(10, "Vollmond-Loslassen"); }, 2000);
  };
  const intentionSetzen = () => {
    if (!text.trim()) return;
    const faellig = new Date(Date.now() + 14 * 864e5);
    setMondrit({ ...(mondrit || {}), intentionen: [{ text: text.trim(), gesetzt: new Date().toLocaleDateString("de-DE"), erinnerung: faellig.toLocaleDateString("de-DE"), erinnerungTs: faellig.getTime() }, ...intentionen] });
    setText("");
    addPunkte(10, "Neumond-Intention");
  };
  const faellige = intentionen.filter((i) => i.erinnerungTs && i.erinnerungTs <= Date.now());
  return (
    <div style={{ padding: "26px 20px" }}>
      <style>{`@keyframes moonBurn { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-20px); filter: blur(5px); } }`}</style>
      <Eyebrow color={C.plum}>Mondrituale</Eyebrow>
      <H size={25}>Im Rhythmus des Mondes</H>
      <Card style={{ margin: "16px 0 14px", textAlign: "center", background: C.goldPale }}>
        <div style={{ fontSize: 54 }}>{m.e}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, marginTop: 6 }}>{m.n}</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginTop: 8 }}>{m.imp}</div>
      </Card>
      {faellige.length > 0 && (
        <Card style={{ marginBottom: 14, border: `2px solid ${C.gold}` }}>
          <Eyebrow color={C.espresso}>Erinnerst du dich?</Eyebrow>
          {faellige.map((i, x) => (
            <div key={x} style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.espresso, lineHeight: 1.6, marginBottom: 6 }}>
              „{i.text}“ <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>— gesetzt am {i.gesetzt}</span>
            </div>
          ))}
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 6 }}>Was ist seitdem daraus geworden?</div>
        </Card>
      )}
      <Card>
        <Eyebrow color={C.espresso}>{istVoll ? "🌕 Loslass-Ritual" : istNeu ? "🌑 Manifestations-Ritual" : "Dein Mond-Impuls"}</Eyebrow>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "6px 0 12px" }}>
          {istVoll ? "Schreib auf, was du zurücklassen willst — und lass es verbrennen." : istNeu ? "Setze eine Intention. In 14 Tagen hole ich sie für dich hervor." : "Auch zwischen den Phasen darfst du säen oder loslassen — wähle unten."}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
          placeholder={istVoll ? "Ich lasse los …" : "Ich setze die Intention …"}
          style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso, animation: burning ? "moonBurn 2s ease forwards" : "none" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Btn full onClick={losRitual} disabled={!text.trim() || burning}>🔥 Loslassen</Btn>
          <Btn full ghost onClick={intentionSetzen} disabled={!text.trim() || burning}>🌱 Intention setzen</Btn>
        </div>
      </Card>
      {intentionen.length > 0 && (
        <Card style={{ marginTop: 14 }}>
          <Eyebrow color={C.espresso}>Deine Intentionen</Eyebrow>
          {intentionen.map((i, x) => (
            <div key={x} style={{ padding: "8px 0", borderBottom: x < intentionen.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso }}>{i.text}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>gesetzt {i.gesetzt} · Rückblick {i.erinnerung}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ── Intuitions-Training ── */
export const INTU_KARTEN = [
  { s: "🌙", n: "Mond" }, { s: "☀️", n: "Sonne" }, { s: "⭐", n: "Stern" },
  { s: "🌊", n: "Welle" }, { s: "🔥", n: "Feuer" }, { s: "🌿", n: "Blatt" },
];

export function Intuition({ intu, setIntu, addPunkte }) {
  const [ziel, setZiel] = useState(null);
  const [wahl, setWahl] = useState(null);
  const [runde, setRunde] = useState(0);
  const stats = intu || { versuche: 0, treffer: 0, verlauf: [] };
  const start = () => { setZiel(Math.floor(Math.random() * INTU_KARTEN.length)); setWahl(null); setRunde(runde + 1); };
  useEffect(() => { if (ziel === null) start(); }, []);
  const raten = (i) => {
    if (wahl !== null || ziel === null) return;
    setWahl(i);
    const richtig = i === ziel;
    const neu = { versuche: stats.versuche + 1, treffer: stats.treffer + (richtig ? 1 : 0), verlauf: [...(stats.verlauf || []), richtig ? 1 : 0].slice(-50) };
    setIntu(neu);
    if (richtig) addPunkte(3, "Intuitions-Treffer");
  };
  const quote = stats.versuche ? Math.round((stats.treffer / stats.versuche) * 100) : 0;
  const zufall = Math.round(100 / INTU_KARTEN.length);
  const letzte10 = (stats.verlauf || []).slice(-10);
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Intuitions-Training</Eyebrow>
      <H size={25}>Welche Karte liegt verdeckt?</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Atme einmal durch, spür kurz nach — und wähle. Über viele Runden siehst du, ob dein Gefühl den Zufall schlägt.
      </p>
      <Card style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>{wahl === null ? "🂠" : INTU_KARTEN[ziel].s}</div>
        {wahl !== null && (
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: wahl === ziel ? C.sage : C.ink, marginBottom: 12 }}>
            {wahl === ziel ? "Treffer! Dein Gefühl lag richtig. ✨" : `Diesmal war es ${INTU_KARTEN[ziel].n}.`}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {INTU_KARTEN.map((k, i) => (
            <button key={i} onClick={() => raten(i)} disabled={wahl !== null} style={{
              width: 62, height: 62, fontSize: 26, borderRadius: 14, cursor: wahl === null ? "pointer" : "default",
              border: wahl === i ? `2.5px solid ${C.gold}` : `1.5px solid ${C.line}`,
              background: wahl !== null && i === ziel ? C.goldPale : C.cream, opacity: wahl !== null && i !== ziel && i !== wahl ? 0.45 : 1,
            }}>{k.s}</button>
          ))}
        </div>
        {wahl !== null && <div style={{ marginTop: 14 }}><Btn full onClick={start}>Nächste Karte</Btn></div>}
      </Card>
      <Card>
        <Eyebrow color={C.espresso}>Deine Trefferquote</Eyebrow>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 34, color: quote > zufall ? C.sage : C.espresso }}>{quote}%</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>bei {stats.versuche} Runden · Zufall wäre {zufall}%</div>
        </div>
        {letzte10.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
            {letzte10.map((v, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: 6, background: v ? C.sage : C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{v ? "✓" : ""}</div>
            ))}
          </div>
        )}
        {stats.versuche >= 20 && (
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 10, lineHeight: 1.6 }}>
            {quote > zufall + 8 ? "Du liegst deutlich über dem Zufall — schön, wie du dir vertraust." : quote < zufall - 8 ? "Gerade liegst du unter dem Zufall. Auch das ist eine Information: Vielleicht denkst du zu viel und fühlst zu wenig." : "Du bewegst dich im Bereich des Zufalls — genau darum geht es: üben, nicht beweisen."}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Transformations-Reisen (21/40 Tage) ── */
export const REISEN = [
  { id: "selbstwert", t: "Ich bin genug", tage: 21, icon: "💗", farbe: "#D96E8B", was: "21 Tage für dein Selbstwertgefühl", impulse: ["Was hast du heute gut gemacht — auch wenn es klein war?", "Wessen Stimme hörst du, wenn du dich kritisierst?", "Schreib drei Sätze, die mit „Ich darf“ beginnen.", "Was würdest du einer Freundin sagen, die so über sich spricht wie du?", "Welche Eigenschaft an dir magst du insgeheim sehr?", "Wo hast du dich heute kleiner gemacht als du bist?", "Wofür bist du dir heute dankbar?"] },
  { id: "loslassen", t: "Loslassen lernen", tage: 21, icon: "🍃", farbe: "#6E8B6A", was: "21 Tage sanftes Loslassen", impulse: ["Was trägst du mit dir, das dir längst nicht mehr gehört?", "Welche Erwartung darf heute gehen?", "Was würde leichter, wenn du aufhörst zu kämpfen?", "Wem darfst du innerlich vergeben — vielleicht dir selbst?", "Was hältst du fest aus Angst, nicht aus Liebe?", "Was möchtest du am Ende dieser Reise nicht mehr tragen?", "Wie fühlt sich Leichtigkeit in deinem Körper an?"] },
  { id: "grenzen", t: "Grenzen setzen", tage: 40, icon: "🛡️", farbe: "#B0503C", was: "40 Tage für dein klares Nein", impulse: ["Wo hast du heute Ja gesagt, obwohl du Nein meintest?", "Was macht dir Angst an einem klaren Nein?", "Wie klingt ein liebevolles Nein in deinen Worten?", "Wer respektiert deine Grenzen — und wer nicht?", "Welche Grenze darfst du heute laut aussprechen?", "Was gewinnst du, wenn du dich schützt?", "Wo brauchst du Abstand statt Erklärung?"] },
];

export function Reisen({ reisen, setReisen, addPunkte }) {
  const aktiv = (reisen || []).find((r) => !r.fertig);
  const heute = new Date().toDateString();
  const starten = (r) => {
    setReisen([{ id: r.id, tag: 0, start: new Date().toLocaleDateString("de-DE"), letzterTag: null, fertig: false }, ...(reisen || [])]);
    addPunkte(10, `Reise „${r.t}“ gestartet`);
  };
  const tagMachen = () => {
    if (!aktiv || aktiv.letzterTag === heute) return;
    const def = REISEN.find((x) => x.id === aktiv.id);
    const neuTag = aktiv.tag + 1;
    const fertig = neuTag >= def.tage;
    setReisen((reisen || []).map((r) => r === aktiv ? { ...r, tag: neuTag, letzterTag: heute, fertig } : r));
    addPunkte(fertig ? 50 : 10, fertig ? "Reise abgeschlossen!" : `Tag ${neuTag} geschafft`);
  };
  if (aktiv) {
    const def = REISEN.find((x) => x.id === aktiv.id);
    const impuls = def.impulse[aktiv.tag % def.impulse.length];
    const heuteGemacht = aktiv.letzterTag === heute;
    return (
      <div style={{ padding: "26px 20px" }}>
        <Eyebrow color={C.plum}>Deine Reise</Eyebrow>
        <Card style={{ border: `2px solid ${def.farbe}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 34 }}>{def.icon}</div>
            <div>
              <H size={21} style={{ color: def.farbe }}>{def.t}</H>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Tag {aktiv.tag} von {def.tage} · seit {aktiv.start}</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 5, background: C.beige, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ width: `${(aktiv.tag / def.tage) * 100}%`, height: "100%", background: def.farbe, transition: "width .5s" }} />
          </div>
          <div style={{ background: C.goldPale, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <Eyebrow color={C.espresso}>Impuls für heute</Eyebrow>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, lineHeight: 1.6 }}>{impuls}</div>
          </div>
          <Btn full onClick={tagMachen} disabled={heuteGemacht}>{heuteGemacht ? "Heute geschafft 🤍" : "Tag abschließen"}</Btn>
        </Card>
      </div>
    );
  }
  const fertige = (reisen || []).filter((r) => r.fertig);
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Transformations-Reisen</Eyebrow>
      <H size={25}>Wähle deinen Weg</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Eine Reise nach der anderen — jeden Tag ein Impuls, bis das Thema in dir wirklich angekommen ist.
      </p>
      {REISEN.map((r) => (
        <Card key={r.id} style={{ marginBottom: 12, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{r.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15.5, color: C.espresso }}>{r.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>{r.was}</div>
          </div>
          <Btn small onClick={() => starten(r)}>Start</Btn>
        </Card>
      ))}
      {fertige.length > 0 && (
        <Card style={{ marginTop: 14, background: C.goldPale }}>
          <Eyebrow color={C.espresso}>Abgeschlossen</Eyebrow>
          {fertige.map((f, i) => {
            const d = REISEN.find((x) => x.id === f.id);
            return <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, padding: "4px 0" }}>{d?.icon} {d?.t} · seit {f.start} 🏆</div>;
          })}
        </Card>
      )}
    </div>
  );
}

/* ── Jahreskreis-Feste ── */
export const JAHRESFESTE = [
  { n: "Imbolc", d: "1. Februar", md: [1, 1], icon: "🕯️", was: "Licht kehrt zurück", ritual: "Zünde eine Kerze an und benenne, was in dir erwachen will." },
  { n: "Frühlings-Tagundnachtgleiche", d: "20. März", md: [2, 20], icon: "🌷", was: "Gleichgewicht & Aufbruch", ritual: "Säe etwas — im Topf und in deinem Leben." },
  { n: "Beltane", d: "1. Mai", md: [4, 1], icon: "🔥", was: "Lebensfreude & Sinnlichkeit", ritual: "Tu heute etwas nur, weil es sich gut anfühlt." },
  { n: "Sommersonnenwende", d: "21. Juni", md: [5, 21], icon: "☀️", was: "Höchste Kraft", ritual: "Feiere, was gewachsen ist — schreib deine drei größten Erfolge auf." },
  { n: "Lughnasadh", d: "1. August", md: [7, 1], icon: "🌾", was: "Erste Ernte", ritual: "Wofür darfst du dir heute danken?" },
  { n: "Herbst-Tagundnachtgleiche", d: "22. September", md: [8, 22], icon: "🍂", was: "Ernte & Dankbarkeit", ritual: "Was war reif dieses Jahr? Was darf jetzt ruhen?" },
  { n: "Samhain", d: "31. Oktober", md: [9, 31], icon: "🌑", was: "Schleier & Ahninnen", ritual: "Schreib einen Brief an eine Frau vor dir, die dich geprägt hat." },
  { n: "Wintersonnenwende", d: "21. Dezember", md: [11, 21], icon: "❄️", was: "Stille & Neubeginn", ritual: "In der längsten Nacht: Was willst du im neuen Jahr nicht mehr mitnehmen?" },
];

export function Jahreskreis({ feste, setFeste, addPunkte }) {
  const jetzt = new Date();
  const jahr = jetzt.getFullYear();
  const mitDatum = JAHRESFESTE.map((f) => {
    let d = new Date(jahr, f.md[0], f.md[1]);
    if (d < new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate())) d = new Date(jahr + 1, f.md[0], f.md[1]);
    return { ...f, dt: d, tage: Math.round((d - jetzt) / 864e5) };
  }).sort((a, b) => a.dt - b.dt);
  const naechstes = mitDatum[0];
  const gefeiert = feste || [];
  const feiern = (n) => {
    if (gefeiert.includes(n)) return;
    setFeste([...gefeiert, n]);
    addPunkte(15, `${n} gefeiert`);
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Jahreskreis</Eyebrow>
      <H size={25}>Die acht Feste des Jahres</H>
      <Card style={{ margin: "16px 0 14px", background: C.goldPale, textAlign: "center" }}>
        <div style={{ fontSize: 46 }}>{naechstes.icon}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, marginTop: 6 }}>{naechstes.n}</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 4 }}>
          {naechstes.tage === 0 ? "Heute ist es soweit! 🤍" : `in ${naechstes.tage} Tagen · ${naechstes.d}`}
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 15.5, color: C.espresso, lineHeight: 1.6, marginTop: 12 }}>{naechstes.ritual}</div>
        {naechstes.tage <= 2 && (
          <div style={{ marginTop: 14 }}>
            <Btn full onClick={() => feiern(naechstes.n)} disabled={gefeiert.includes(naechstes.n)}>
              {gefeiert.includes(naechstes.n) ? "Gefeiert 🤍" : "Ritual vollziehen"}
            </Btn>
          </div>
        )}
      </Card>
      {mitDatum.slice(1).map((f) => (
        <Card key={f.n} style={{ marginBottom: 10, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{f.n} {gefeiert.includes(f.n) ? "🤍" : ""}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>{f.d} · {f.was}</div>
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.gold, fontWeight: 700 }}>{f.tage} T</div>
        </Card>
      ))}
    </div>
  );
}

/* ── Ritual der Leere — die App, die sich selbst sperrt ── */
export function RitualDerLeere({ leere, setLeere, addPunkte }) {
  const [reflexion, setReflexion] = useState("");
  const jetzt = Date.now();
  const aktiv = leere?.bis && leere.bis > jetzt;
  const offen = leere?.bis && leere.bis <= jetzt && !leere.abgeschlossen;
  const stunden = aktiv ? Math.ceil((leere.bis - jetzt) / 36e5) : 0;
  const starten = () => setLeere({ start: jetzt, bis: jetzt + 24 * 36e5, abgeschlossen: false, runde: (leere?.runde || 0) + 1 });
  const abschliessen = () => {
    setLeere({ ...leere, abgeschlossen: true, reflexion: reflexion.trim(), meilensteine: (leere?.meilensteine || 0) + 1 });
    addPunkte(30, "Stille-Meilenstein");
    setReflexion("");
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Ritual der Leere</Eyebrow>
      <H size={25}>24 Stunden ohne mich</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Diese App will nicht deine Bildschirmzeit — sie will dein Wachstum. Nimm dir einen Tag ganz ohne sie.
      </p>
      {aktiv && (
        <Card style={{ textAlign: "center", background: "#2E2320", border: "1px solid #4A3A30" }}>
          <div style={{ fontSize: 44 }}>🤍</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "#F0E4D6", marginTop: 8 }}>Deine Stille läuft</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#C9A98C", marginTop: 6, lineHeight: 1.6 }}>
            Noch etwa {stunden} Stunden. Leg das Handy weg — ich bin danach noch da.
          </div>
        </Card>
      )}
      {offen && (
        <Card>
          <Eyebrow color={C.espresso}>Willkommen zurück 🤍</Eyebrow>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, lineHeight: 1.6, marginBottom: 12 }}>
            Du hast es durchgehalten. Was hat die Stille mit dir gemacht?
          </div>
          <textarea value={reflexion} onChange={(e) => setReflexion(e.target.value)} rows={4} placeholder="Was war anders an diesem Tag?"
            style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso }} />
          <div style={{ marginTop: 10 }}><Btn full onClick={abschliessen}>Stille-Meilenstein einlösen</Btn></div>
        </Card>
      )}
      {!aktiv && !offen && (
        <>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🕊️</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, lineHeight: 1.6, marginBottom: 14 }}>
              24 Stunden ohne smile2go. Kein Streak geht verloren — im Gegenteil.
            </div>
            <Btn full onClick={starten}>Stille beginnen</Btn>
          </Card>
          {(leere?.meilensteine || 0) > 0 && (
            <Card style={{ marginTop: 14, background: C.goldPale }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>
                🏆 {leere.meilensteine}× Stille-Meilenstein erreicht
              </div>
              {leere.reflexion && <div style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.ink, marginTop: 8, lineHeight: 1.6 }}>„{leere.reflexion}“</div>}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ── Wochen-Orakel der Coachin ── */
export const WOCHEN_ORAKEL = [
  { karte: "Die Quelle", icon: "💧", text: "Diese Woche geht es ums Auffüllen, nicht ums Geben. Frag dich jeden Morgen: Was brauche ich?", coach: "Ich sehe gerade so viele von euch, die für alle da sind — außer für sich. Diese Woche drehen wir das um." },
  { karte: "Der Schwellenstein", icon: "🚪", text: "Etwas endet, damit Neues beginnen kann. Steh ruhig auf der Schwelle, ohne zu drängen.", coach: "Übergänge fühlen sich selten schön an. Sie fühlen sich unfertig an. Das ist normal — bleib da." },
  { karte: "Die klare Stimme", icon: "🗣️", text: "Sprich diese Woche einmal aus, was du sonst schluckst. Ruhig, klar, ohne Rechtfertigung.", coach: "Ein Satz reicht. Du musst niemanden überzeugen, nur dich selbst hören." },
  { karte: "Der stille Garten", icon: "🌿", text: "Nicht alles muss wachsen. Manches darf einfach ruhen und Wurzeln schlagen.", coach: "Wenn du dich gerade unproduktiv fühlst: Wurzeln sieht man nicht. Sie zählen trotzdem." },
  { karte: "Das offene Fenster", icon: "🪟", text: "Eine Möglichkeit steht offen — kleiner, als du erwartet hast. Schau genau hin.", coach: "Die großen Türen sind selten. Die kleinen Fenster übersehen wir dauernd." },
];

export function WochenOrakel({ wo, setWo, addPunkte }) {
  const kw = kalenderwoche();
  const karte = WOCHEN_ORAKEL[kw % WOCHEN_ORAKEL.length];
  const gesehen = wo?.kw === kw;
  const [notiz, setNotiz] = useState(wo?.kw === kw ? (wo.notiz || "") : "");
  const merken = () => {
    setWo({ kw, notiz: notiz.trim(), datum: new Date().toLocaleDateString("de-DE") });
    if (!gesehen) addPunkte(5, "Wochen-Orakel");
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Wochen-Orakel</Eyebrow>
      <H size={25}>Die Karte deiner Coachin</H>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 6 }}>Kalenderwoche {kw}</div>
      <Card style={{ margin: "16px 0 14px", textAlign: "center", background: C.goldPale }}>
        <div style={{ fontSize: 50 }}>{karte.icon}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.espresso, marginTop: 8 }}>{karte.karte}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.espresso, lineHeight: 1.7, marginTop: 12 }}>{karte.text}</div>
      </Card>
      <Card style={{ marginBottom: 14, display: "flex", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🌸</div>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Deine Coachin</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.espresso, lineHeight: 1.6, marginTop: 4 }}>„{karte.coach}“</div>
        </div>
      </Card>
      <Card>
        <Eyebrow color={C.espresso}>Was nimmst du mit?</Eyebrow>
        <textarea value={notiz} onChange={(e) => setNotiz(e.target.value)} rows={3} placeholder="Diese Woche achte ich auf …"
          style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.cream, color: C.espresso }} />
        <div style={{ marginTop: 10 }}><Btn full onClick={merken} disabled={!notiz.trim()}>Für diese Woche merken</Btn></div>
      </Card>
    </div>
  );
}

/* ── Qigong · Die Acht Brokate (Ba Duan Jin) ────────────────────────────────
   Sanfte Bewegungsfolge, seit Jahrhunderten überliefert. Kein Heilversprechen:
   die App führt durch die Bewegungen und zählt mit, mehr nicht.             */

export const BROKATE = [
  { nr: 1, t: "Den Himmel stützen", s: "Beide Hände heben sich über den Kopf", atem: "Einatmen beim Heben, ausatmen beim Senken", wdh: "6 ×",
    text: "Steh locker, Füße hüftbreit. Verschränke die Finger vor dem Bauch, drehe die Handflächen nach oben und schiebe sie über den Kopf, als würdest du den Himmel stützen. Streck dich sanft, schau den Händen nach. Dann öffne die Arme und senke sie in einem großen Bogen." },
  { nr: 2, t: "Den Bogen spannen", s: "Blick über die Fingerspitzen in die Weite", atem: "Ausatmen beim Spannen", wdh: "je Seite 5 ×",
    text: "Geh in einen leichten Reitsitz. Kreuze die Arme vor der Brust, ziehe die eine Hand wie eine Bogensehne zur Seite, die andere zeigt mit ausgestrecktem Zeigefinger in die Ferne. Der Blick folgt dem Finger." },
  { nr: 3, t: "Milz und Magen weiten", s: "Eine Hand hebt, eine sinkt", atem: "Ruhig und gleichmäßig", wdh: "je Seite 6 ×",
    text: "Eine Handfläche schiebt nach oben zum Himmel, die andere drückt nach unten zur Erde. Beide Handgelenke bleiben weich. Dann die Seite wechseln — wie eine langsame Welle durch den Rumpf." },
  { nr: 4, t: "Nach hinten schauen", s: "Kopf dreht sich, Schultern bleiben weich", atem: "Einatmen beim Drehen", wdh: "je Seite 5 ×",
    text: "Stell dich aufrecht, Arme locker. Drehe den Kopf langsam nach links, als wolltest du über die Schulter etwas hinter dir sehen. Halte drei Atemzüge, komm zurück, wechsle die Seite." },
  { nr: 5, t: "Kopf und Rumpf wiegen", s: "Löst Hitze und Unruhe", atem: "Lang ausatmen", wdh: "je Seite 5 ×",
    text: "Breiter Stand, Hände auf den Oberschenkeln. Neige den Oberkörper zur Seite und wiege ihn in einem weichen Bogen nach vorn zur anderen Seite. Nichts erzwingen — es darf ganz klein sein." },
  { nr: 6, t: "Mit den Händen die Füße greifen", s: "Dehnt den Rücken", atem: "Ausatmen beim Beugen", wdh: "6 ×",
    text: "Streck die Arme über den Kopf, roll dann Wirbel für Wirbel nach vorn und lass die Hände Richtung Füße wandern. Nur so weit, wie es angenehm ist. Roll genauso langsam wieder auf." },
  { nr: 7, t: "Mit Blick und Faust zuschlagen", s: "Weckt die Kraft", atem: "Kräftig ausatmen beim Stoß", wdh: "je Seite 6 ×",
    text: "Reitsitz, Fäuste an der Hüfte, Handrücken nach unten. Stoß eine Faust langsam nach vorn, die Augen weit, und zieh sie ebenso langsam zurück. Der Boden trägt dich." },
  { nr: 8, t: "Auf den Zehen wippen", s: "Der Abschluss — sieben Mal", atem: "Einatmen beim Heben", wdh: "7 ×",
    text: "Füße parallel, Arme locker. Heb die Fersen, halte kurz oben, und lass sie sanft fallen, sodass eine kleine Erschütterung durch den Körper geht. Zum Schluss still stehen und nachspüren." },
];

export function Qigong({ qigong, setQigong, addPunkte }) {
  const [aktiv, setAktiv] = useState(null);
  const [laufend, setLaufend] = useState(false);
  const [sek, setSek] = useState(0);

  useEffect(() => {
    if (!laufend) return;
    const t = setInterval(() => setSek((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [laufend]);

  const heute = new Date().toLocaleDateString("de-DE");
  const heuteGemacht = (qigong || []).find((e) => e.datum === heute);
  const gesamt = (qigong || []).length;

  const beenden = () => {
    const minuten = Math.max(1, Math.round(sek / 60));
    setQigong([{ datum: heute, minuten, uebungen: BROKATE.length }, ...(qigong || []).filter((e) => e.datum !== heute)]);
    addPunkte?.(10, "Qigong geübt");
    setLaufend(false); setSek(0); setAktiv(null);
  };

  return (
    <div style={{ padding: "22px 20px" }}>
      <Eyebrow color={C.plum}>Qigong</Eyebrow>
      <H size={25} style={{ marginBottom: 8 }}>Die Acht Brokate</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
        Acht ruhige Bewegungen, zusammen etwa zehn Minuten. Du brauchst nichts außer
        einem Platz zum Stehen. Bewege dich nur so weit, wie es sich gut anfühlt — bei
        Schmerzen hör auf und frag jemanden vom Fach.
      </p>

      <Card style={{ marginBottom: 16, display: "flex", gap: 14, alignItems: "center", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🌿</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>
            {heuteGemacht ? `Heute geübt · ${heuteGemacht.minuten} Min` : laufend ? `Läuft · ${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, "0")}` : "Noch nicht geübt heute"}
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>
            {gesamt > 0 ? `${gesamt} ${gesamt === 1 ? "Übungstag" : "Übungstage"} insgesamt` : "Deine erste Runde wartet"}
          </div>
        </div>
        {laufend
          ? <Btn small onClick={beenden}>Fertig</Btn>
          : <Btn small onClick={() => { setLaufend(true); setSek(0); setAktiv(1); }}>Starten</Btn>}
      </Card>

      {BROKATE.map((b) => {
        const auf = aktiv === b.nr;
        return (
          <Card key={b.nr} style={{ marginBottom: 10, borderColor: auf ? C.gold : C.line }}>
            <div onClick={() => setAktiv(auf ? null : b.nr)} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: auf ? C.goldPale : C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 17, color: C.plum, flexShrink: 0 }}>{b.nr}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{b.t}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 2 }}>{b.s} · {b.wdh}</div>
              </div>
              <span style={{ color: C.gold, fontSize: 18 }}>{auf ? "▾" : "›"}</span>
            </div>
            {auf && (
              <div style={{ marginTop: 10, animation: "fadeUp .3s ease" }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.7, margin: "0 0 8px" }}>{b.text}</p>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.plum, fontWeight: 600 }}>🌬️ {b.atem}</div>
              </div>
            )}
          </Card>
        );
      })}

      {(qigong || []).length > 0 && (
        <div style={{ marginTop: 18 }}>
          <Eyebrow color={C.plum}>Deine letzten Runden</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {(qigong || []).slice(0, 7).map((e) => (
              <div key={e.datum} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>
                <span>{e.datum}</span><span style={{ color: C.sage, fontWeight: 700 }}>{e.minuten} Min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Achtsamkeit · drei kleine Übungen für zwischendurch ────────────────── */

export const ATEM_TAKT = [["Einatmen", 4], ["Halten", 7], ["Ausatmen", 8]];

export function Achtsamkeit({ achtsam, setAchtsam, addPunkte }) {
  const [modus, setModus] = useState(null);
  const [phase, setPhase] = useState(0);
  const [rest, setRest] = useState(4);
  const [runde, setRunde] = useState(0);
  const [sinne, setSinne] = useState(["", "", "", "", ""]);

  useEffect(() => {
    if (modus !== "atem") return;
    const t = setInterval(() => {
      setRest((r) => {
        if (r > 1) return r - 1;
        setPhase((ph) => {
          const naechste = (ph + 1) % ATEM_TAKT.length;
          if (naechste === 0) setRunde((x) => x + 1);
          setRest(ATEM_TAKT[naechste][1]);
          return naechste;
        });
        return ATEM_TAKT[(phase + 1) % ATEM_TAKT.length][1];
      });
    }, 1000);
    return () => clearInterval(t);
  }, [modus, phase]);

  const merken = (art) => {
    const heute = new Date().toLocaleDateString("de-DE");
    setAchtsam([{ datum: heute, art }, ...(achtsam || [])].slice(0, 60));
    addPunkte?.(5, "Achtsamkeit geübt");
  };

  const SINN_FRAGEN = [
    "5 Dinge, die du siehst",
    "4 Dinge, die du hörst",
    "3 Dinge, die du spürst",
    "2 Dinge, die du riechst",
    "1 Sache, für die du gerade dankbar bist",
  ];

  return (
    <div style={{ padding: "22px 20px" }}>
      <Eyebrow color={C.plum}>Achtsamkeit</Eyebrow>
      <H size={25} style={{ marginBottom: 8 }}>Ankommen, wo du bist</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 18 }}>
        Drei kurze Übungen. Keine braucht mehr als ein paar Minuten — und keine
        verlangt, dass du dabei etwas fühlst oder erreichst.
      </p>

      {/* 4-7-8 Atem */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, marginBottom: 4 }}>🌬️ Der 4-7-8-Atem</div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "0 0 12px" }}>
          Vier zählen beim Einatmen, sieben halten, acht ausatmen. Vier Runden reichen.
        </p>
        {modus === "atem" ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{
              width: 130, height: 130, margin: "0 auto 14px", borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              transform: `scale(${phase === 0 ? 1 : phase === 1 ? 1 : 0.72})`, transition: "transform 1s ease",
            }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso }}>{ATEM_TAKT[phase][0]}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.plum }}>{rest}</div>
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginBottom: 12 }}>Runde {runde + 1}</div>
            <Btn small ghost onClick={() => { setModus(null); if (runde > 0) merken("Atem 4-7-8"); setRunde(0); setPhase(0); setRest(4); }}>Beenden</Btn>
          </div>
        ) : (
          <Btn small onClick={() => { setModus("atem"); setPhase(0); setRest(4); setRunde(0); }}>Beginnen</Btn>
        )}
      </Card>

      {/* 5-4-3-2-1 */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, marginBottom: 4 }}>🖐️ 5 · 4 · 3 · 2 · 1</div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "0 0 12px" }}>
          Wenn die Gedanken rasen: hol dich über deine Sinne zurück in den Raum.
        </p>
        {modus === "sinne" ? (
          <div style={{ animation: "fadeUp .3s ease" }}>
            {SINN_FRAGEN.map((f, i) => (
              <div key={f} style={{ marginBottom: 9 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.plum, fontWeight: 600, marginBottom: 4 }}>{f}</div>
                <input
                  value={sinne[i]}
                  onChange={(e) => setSinne(sinne.map((x, j) => (j === i ? e.target.value : x)))}
                  style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 11, background: C.card, color: C.espresso, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 9, marginTop: 10 }}>
              <Btn small onClick={() => { merken("5-4-3-2-1"); setModus(null); setSinne(["", "", "", "", ""]); }}>Fertig</Btn>
              <Btn small ghost onClick={() => setModus(null)}>Abbrechen</Btn>
            </div>
          </div>
        ) : (
          <Btn small onClick={() => setModus("sinne")}>Beginnen</Btn>
        )}
      </Card>

      {/* Körperreise */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, marginBottom: 4 }}>🫀 Kleine Körperreise</div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "0 0 10px" }}>
          Wandere langsam durch deinen Körper — Füße, Beine, Becken, Bauch, Brust,
          Schultern, Arme, Hals, Gesicht. Bei jeder Station ein Atemzug. Nichts
          verändern, nur bemerken.
        </p>
        <Hoerspur
          src={S2GAUDIO.koerperreise}
          titel="Körperreise anhören · ca. 3 Min"
          beiEnde={() => merken("Körperreise")}
        />
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.75, margin: "8px 0 12px" }}>
          Kopfhörer sind schön, aber nicht nötig. Am Ende wird die Übung von allein eingetragen.
        </div>
        <Btn small ghost onClick={() => merken("Körperreise")}>Gemacht ✓</Btn>
      </Card>

      {(achtsam || []).length > 0 && (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, opacity: 0.8, textAlign: "center" }}>
          Du hast dir {(achtsam || []).length} × bewusst diesen Moment genommen. 🤍
        </p>
      )}
    </div>
  );
}

/* ── Dankbarkeit · drei Dinge am Tag ────────────────────────────────────── */

export const DANK_IMPULSE = [
  "Wer hat dir heute — auch ganz klein — das Leben leichter gemacht?",
  "Was an deinem Körper hat heute gut für dich gearbeitet?",
  "Welcher Moment war heute schöner, als du erwartet hast?",
  "Wofür würde die Frau, die du vor fünf Jahren warst, dich beneiden?",
  "Was hast du heute gehabt, das nicht selbstverständlich ist?",
  "Welcher Ort hat dir heute gutgetan?",
];

export function Dankbarkeit({ dank, setDank, addPunkte }) {
  const heute = new Date().toLocaleDateString("de-DE");
  const heutiger = (dank || []).find((d) => d.datum === heute);
  const [drei, setDrei] = useState(heutiger?.drei || ["", "", ""]);
  const impuls = DANK_IMPULSE[new Date().getDate() % DANK_IMPULSE.length];

  const speichern = () => {
    const sauber = drei.map((x) => x.trim()).filter(Boolean);
    if (!sauber.length) return;
    setDank([{ datum: heute, drei: drei.map((x) => x.trim()) }, ...(dank || []).filter((d) => d.datum !== heute)]);
    if (!heutiger) addPunkte?.(10, "Dankbarkeit notiert");
  };

  // Wie viele Tage am Stück?
  let serie = 0;
  const tage = (dank || []).map((d) => d.datum);
  for (let i = 0; i < 400; i++) {
    const t = new Date(Date.now() - i * 864e5).toLocaleDateString("de-DE");
    if (tage.includes(t)) serie++;
    else if (i > 0) break;
  }

  return (
    <div style={{ padding: "22px 20px" }}>
      <Eyebrow color={C.plum}>Dankbarkeit</Eyebrow>
      <H size={25} style={{ marginBottom: 8 }}>Drei Dinge von heute</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
        Nicht die großen Dinge — die kleinen zählen genauso. Ein Satz reicht.
      </p>

      <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <Eyebrow color={C.plum}>Impuls für heute</Eyebrow>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15.5, color: C.espresso, lineHeight: 1.6, margin: "6px 0 0" }}>{impuls}</p>
      </Card>

      {[0, 1, 2].map((i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.plum, fontWeight: 600, marginBottom: 4 }}>{i + 1}.</div>
          <textarea
            value={drei[i]}
            onChange={(e) => setDrei(drei.map((x, j) => (j === i ? e.target.value : x)))}
            rows={2}
            placeholder="Ich bin dankbar für …"
            style={{ width: "100%", padding: "11px 13px", fontSize: 14.5, fontFamily: "Georgia, serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
      ))}

      <Btn full onClick={speichern}>{heutiger ? "Aktualisieren" : "Für heute festhalten"}</Btn>

      {serie > 0 && (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.sage, fontWeight: 700, textAlign: "center", marginTop: 14 }}>
          🔥 {serie} {serie === 1 ? "Tag" : "Tage"} am Stück
        </p>
      )}

      {(dank || []).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Eyebrow color={C.plum}>Zurückblättern</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {(dank || []).slice(0, 14).map((d) => (
              <Card key={d.datum} style={{ marginBottom: 9 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginBottom: 6 }}>{d.datum}</div>
                {d.drei.filter(Boolean).map((x, i) => (
                  <div key={i} style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.espresso, lineHeight: 1.6 }}>· {x}</div>
                ))}
              </Card>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <TeilenBtn
              eyebrow="Dankbar heute"
              titel={(dank[0]?.drei || []).filter(Boolean)[0] || "Drei Dinge von heute"}
              text="Nicht die großen Dinge — die kleinen zählen genauso."
              beschriftung="Dankbarkeit teilen"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Loslassen · was darf gehen? ────────────────────────────────────────── */

export function Loslassen({ losgelassen, setLosgelassen, addPunkte }) {
  const [text, setText] = useState("");
  const [gehend, setGehend] = useState(null);

  const offene = (losgelassen || []).filter((x) => !x.los_am);
  const gegangen = (losgelassen || []).filter((x) => x.los_am);

  const hinzufuegen = () => {
    const t = text.trim();
    if (!t) return;
    setLosgelassen([{ id: `${Date.now()}`, text: t, seit: new Date().toLocaleDateString("de-DE"), los_am: null }, ...(losgelassen || [])]);
    setText("");
  };

  const loslassen = (id) => {
    setGehend(id);
    setTimeout(() => {
      setLosgelassen((losgelassen || []).map((x) => (x.id === id ? { ...x, los_am: new Date().toLocaleDateString("de-DE") } : x)));
      setGehend(null);
      addPunkte?.(10, "Losgelassen");
    }, 900);
  };

  return (
    <div style={{ padding: "22px 20px" }}>
      <Eyebrow color={C.plum}>Loslassen</Eyebrow>
      <H size={25} style={{ marginBottom: 8 }}>Was darf gehen?</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
        Schreib auf, was du gerade mitträgst — ein Gedanke, ein Anspruch, ein Satz von
        früher. Es bleibt hier stehen, bis du bereit bist. Nichts davon verlässt dein Gerät,
        solange du nicht synchronisierst.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && hinzufuegen()}
          placeholder="z. B. Ich muss es allen recht machen"
          style={{ flex: 1, padding: "13px 14px", fontSize: 15, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 13, background: C.card, color: C.espresso, outline: "none" }}
        />
        <Btn small onClick={hinzufuegen}>Ablegen</Btn>
      </div>

      {offene.length === 0 && gegangen.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🕊️</div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            Noch nichts abgelegt. Manchmal ist der erste Satz der schwerste.
          </p>
        </Card>
      )}

      {offene.length > 0 && (
        <>
          <Eyebrow color={C.plum}>Noch bei mir</Eyebrow>
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            {offene.map((x) => (
              <Card key={x.id} style={{
                marginBottom: 10,
                opacity: gehend === x.id ? 0 : 1,
                transform: gehend === x.id ? "translateY(-24px)" : "none",
                transition: "opacity .9s ease, transform .9s ease",
              }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 15.5, color: C.espresso, lineHeight: 1.6, margin: "0 0 4px" }}>{x.text}</p>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginBottom: 10 }}>abgelegt am {x.seit}</div>
                <Btn small ghost onClick={() => loslassen(x.id)}>🕊️ Jetzt loslassen</Btn>
              </Card>
            ))}
          </div>
        </>
      )}

      {gegangen.length > 0 && (
        <>
          <Eyebrow color={C.sage}>Gegangen</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {gegangen.slice(0, 20).map((x) => (
              <div key={x.id} style={{ padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.ink, textDecoration: "line-through", opacity: 0.75 }}>{x.text}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.sage, fontWeight: 600, marginTop: 2 }}>losgelassen am {x.los_am}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, opacity: 0.8, lineHeight: 1.6, marginTop: 14 }}>
            {gegangen.length} {gegangen.length === 1 ? "Sache" : "Dinge"} tragen sich nicht mehr mit dir.
          </p>
        </>
      )}
    </div>
  );
}

/* ── Me-Time · Termine mit dir selbst ───────────────────────────────────────
   Kein Vorsatz, sondern ein Eintrag: Datum wählen, Art wählen, in einem Satz
   sagen worum es geht — fertig. Danach steht er da wie jeder andere Termin
   und lässt sich in den eigenen Kalender mitnehmen.                       */

export const METIME_ARTEN = [
  { k: "wellness", icon: "🧖‍♀️", t: "Wellness", bsp: "z. B. Sauna, langes Bad, Massage" },
  { k: "essen",    icon: "🍽️",  t: "Essen",    bsp: "z. B. in Ruhe kochen, Lieblingscafé" },
  { k: "reisen",   icon: "✈️",  t: "Reisen",   bsp: "z. B. Tagesausflug, ein Wochenende weg" },
  { k: "anderes",  icon: "✦",   t: "Anderes",  bsp: "z. B. lesen, spazieren, gar nichts" },
];

export function icsTermin({ datum, uhrzeit, dauer, titel }) {
  const start = new Date(`${datum}T${uhrzeit || "10:00"}`);
  const ende = new Date(start.getTime() + (dauer || 60) * 60000);
  const f = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//smile2go//Me-Time//DE",
    "BEGIN:VEVENT",
    `UID:metime-${start.getTime()}@smile2go`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(start)}`,
    `DTEND:${f(ende)}`,
    `SUMMARY:Me-Time · ${titel}`,
    "DESCRIPTION:Diese Zeit gehört dir. — smile2go",
    "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:Deine Me-Time beginnt bald",
    "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function kalenderMitnehmen(t) {
  const text = icsTermin({ datum: t.datum, uhrzeit: t.uhrzeit, dauer: t.dauer, titel: t.text || METIME_ARTEN.find((a) => a.k === t.art)?.t || "Me-Time" });
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = "me-time.ics"; a.click();
  URL.revokeObjectURL(url);
}

export function MeTime({ metime, setMetime, addPunkte }) {
  const [offen, setOffen] = useState(false);
  const [datum, setDatum] = useState("");
  const [uhrzeit, setUhrzeit] = useState("10:00");
  const [dauer, setDauer] = useState(60);
  const [art, setArt] = useState("wellness");
  const [text, setText] = useState("");
  const [hinweis, setHinweis] = useState("");

  const liste = [...(metime || [])].sort((a, b) => `${a.datum}T${a.uhrzeit}`.localeCompare(`${b.datum}T${b.uhrzeit}`));
  const heuteIso = new Date().toISOString().slice(0, 10);
  const kommende = liste.filter((t) => t.datum >= heuteIso && !t.erledigt);
  const vergangene = liste.filter((t) => t.datum < heuteIso || t.erledigt).reverse();

  const eintragen = () => {
    if (!datum) { setHinweis("Bitte wähle zuerst ein Datum."); return; }
    const neu = {
      id: `${Date.now()}`, datum, uhrzeit, dauer: Number(dauer),
      art, text: text.trim(), erledigt: false,
    };
    setMetime([...(metime || []), neu]);
    addPunkte?.(15, "Me-Time eingetragen");
    setOffen(false); setDatum(""); setText(""); setArt("wellness"); setUhrzeit("10:00"); setDauer(60);
    setHinweis("✓ Dein Termin steht.");
    setTimeout(() => setHinweis(""), 3500);
  };

  const erledigen = (id) => {
    setMetime((metime || []).map((t) => (t.id === id ? { ...t, erledigt: true } : t)));
    addPunkte?.(30, "Me-Time gehalten");
  };

  const loeschen = (id) => setMetime((metime || []).filter((t) => t.id !== id));

  const zeigDatum = (t) => {
    const d = new Date(`${t.datum}T${t.uhrzeit || "10:00"}`);
    return d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long" });
  };

  const feld = {
    width: "100%", padding: "12px 13px", fontSize: 15, fontFamily: "system-ui, sans-serif",
    border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "22px 20px" }}>
      <Eyebrow color={C.plum}>Me-Time</Eyebrow>
      <H size={25} style={{ marginBottom: 8 }}>Zeit, die dir gehört</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 18 }}>
        Termine mit anderen hältst du. Diese hier auch: trag sie ein wie jeden
        anderen Termin — mit Datum, damit sie wirklich stattfindet.
      </p>

      {!offen && (
        <div style={{ marginBottom: 18 }}>
          <Btn full onClick={() => setOffen(true)}>＋ Termin vereinbaren</Btn>
        </div>
      )}

      {hinweis && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.sage, fontWeight: 700, marginBottom: 14 }}>{hinweis}</div>
      )}

      {offen && (
        <Card style={{ marginBottom: 18, animation: "fadeUp .3s ease" }}>
          {/* 1 · Wann */}
          <Eyebrow color={C.plum}>1 · Wann?</Eyebrow>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "8px 0 16px" }}>
            <div style={{ flex: "2 1 160px" }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Datum</div>
              <input type="date" value={datum} min={heuteIso} onChange={(e) => setDatum(e.target.value)} style={feld} />
            </div>
            <div style={{ flex: "1 1 100px" }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Uhrzeit</div>
              <input type="time" value={uhrzeit} onChange={(e) => setUhrzeit(e.target.value)} style={feld} />
            </div>
            <div style={{ flex: "1 1 90px" }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Minuten</div>
              <input type="number" step={15} min={15} value={dauer} onChange={(e) => setDauer(e.target.value)} style={feld} />
            </div>
          </div>

          {/* 2 · Was */}
          <Eyebrow color={C.plum}>2 · Wofür?</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, margin: "8px 0 14px" }}>
            {METIME_ARTEN.map((a) => {
              const aktiv = art === a.k;
              return (
                <button key={a.k} onClick={() => setArt(a.k)} style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "12px 13px",
                  borderRadius: 13, cursor: "pointer", minHeight: 50, textAlign: "left",
                  border: `1.5px solid ${aktiv ? C.rose : C.line}`,
                  background: aktiv ? C.roseSoft : C.card,
                }}>
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: aktiv ? C.plum : C.espresso }}>{a.t}</span>
                </button>
              );
            })}
          </div>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && eintragen()}
            placeholder={METIME_ARTEN.find((a) => a.k === art)?.bsp}
            style={{ ...feld, marginBottom: 14 }}
          />

          <div style={{ display: "flex", gap: 9 }}>
            <Btn onClick={eintragen}>Termin eintragen</Btn>
            <Btn ghost onClick={() => { setOffen(false); setHinweis(""); }}>Abbrechen</Btn>
          </div>
        </Card>
      )}

      {kommende.length > 0 && (
        <>
          <Eyebrow color={C.plum}>Deine nächsten Zeiten</Eyebrow>
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            {kommende.map((t) => {
              const a = METIME_ARTEN.find((x) => x.k === t.art) || METIME_ARTEN[3];
              const istHeute = t.datum === heuteIso;
              return (
                <Card key={t.id} style={{
                  marginBottom: 10,
                  background: istHeute ? `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})` : C.card,
                  border: istHeute ? "none" : `1px solid ${C.line}`,
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>{a.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso }}>
                        {istHeute ? "Heute" : zeigDatum(t)} · {t.uhrzeit}
                      </div>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>
                        {a.t}{t.text ? ` · ${t.text}` : ""} · {t.dauer} Min
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <Btn small onClick={() => erledigen(t.id)}>Gehalten · +30 ✨</Btn>
                    <Btn small ghost onClick={() => kalenderMitnehmen(t)}>📅 Kalender</Btn>
                    <button onClick={() => loeschen(t.id)} style={{ background: "none", border: "none", color: C.ink, opacity: 0.55, fontFamily: "system-ui, sans-serif", fontSize: 12.5, cursor: "pointer", minHeight: 40 }}>entfernen</button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {kommende.length === 0 && !offen && (
        <Card style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🤍</div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            Noch nichts eingetragen. Was hättest du diese Woche gern für dich —
            eine Stunde Sauna, ein Essen in Ruhe, ein Tag weg?
          </p>
        </Card>
      )}

      {vergangene.length > 0 && (
        <>
          <Eyebrow color={C.sage}>Gehalten</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {vergangene.slice(0, 12).map((t) => {
              const a = METIME_ARTEN.find((x) => x.k === t.art) || METIME_ARTEN[3];
              return (
                <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 17 }}>{a.icon}</span>
                  <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>
                    {zeigDatum(t)} · {a.t}{t.text ? ` · ${t.text}` : ""}
                  </span>
                  {t.erledigt && <span style={{ color: C.sage, fontWeight: 700, fontSize: 13 }}>✓</span>}
                </div>
              );
            })}
          </div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.sage, fontWeight: 700, marginTop: 12 }}>
            🤍 {vergangene.filter((t) => t.erledigt).length}× hast du dir diese Zeit wirklich genommen
          </p>
        </>
      )}
    </div>
  );
}

/* ── Me-Time-Erinnerung auf der Startseite ── */

export function MeTimeKarte({ metime, go }) {
  const heuteIso = new Date().toISOString().slice(0, 10);
  const heute = (metime || []).filter((t) => t.datum === heuteIso && !t.erledigt);
  if (heute.length === 0) return null;
  const t = heute[0];
  const a = METIME_ARTEN.find((x) => x.k === t.art) || METIME_ARTEN[3];

  return (
    <div style={{ padding: "0 20px 16px" }}>
      <Card onClick={() => go("metime")} style={{
        cursor: "pointer", display: "flex", gap: 13, alignItems: "center",
        background: `linear-gradient(135deg, ${C.card}, ${C.roseSoft})`,
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{a.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>Heute ist deine Me-Time</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>
            {t.uhrzeit} · {a.t}{t.text ? ` · ${t.text}` : ""}
          </div>
        </div>
        <span style={{ color: C.gold, fontSize: 20 }}>›</span>
      </Card>
    </div>
  );
}

/* ── Jahres-Rückblick ── */
export function Jahresrueckblick({ entries, qigong, dank, losgelassen, punkte, streak, drawn, reisen, feste }) {
  const jahr = new Date().getFullYear();
  const worte = {};
  (entries || []).forEach((e) => {
    [e.intention, ...(e.items || [])].filter(Boolean).join(" ").toLowerCase().replace(/[^a-zäöüß\s]/g, " ").split(/\s+/)
      .filter((w) => w.length > 4).forEach((w) => { worte[w] = (worte[w] || 0) + 1; });
  });
  const topWorte = Object.entries(worte).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const qigongMin = (qigong || []).reduce((sum, e) => sum + (e.minuten || 0), 0);
  const dankSaetze = (dank || []).reduce((sum, d) => sum + (d.drei || []).filter(Boolean).length, 0);
  const gegangen = (losgelassen || []).filter((x) => x.los_am).length;
  const fertigeReisen = (reisen || []).filter((r) => r.fertig).length;
  const leer = !(entries || []).length && !(qigong || []).length && !(dank || []).length;
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Rückblick</Eyebrow>
      <H size={25}>Dein Jahr in Karten & Worten</H>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 6, marginBottom: 16 }}>{jahr} · aus deinen echten Einträgen</div>
      {leer ? (
        <Card>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>
            Dein Rückblick entsteht aus dem, was du schreibst. Schreib deinen ersten Journal-Eintrag oder halte drei Dinge fest, für die du dankbar bist — dann füllt sich diese Seite ganz von selbst.
          </div>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`, textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 44, color: C.espresso }}>{(entries || []).length}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Journal-Einträge</div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16 }}>
              {[["🌿", (qigong || []).length, "Qigong"], ["🤍", (dank || []).length, "Dank-Tage"], ["🏆", fertigeReisen, "Reisen"], ["🔥", streak, "Tage"]].map(([i, n, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 20 }}>{i}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso }}>{n}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
          {topWorte.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <Eyebrow color={C.espresso}>Deine Worte dieses Jahres</Eyebrow>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline", marginTop: 6 }}>
                {topWorte.map(([w, n], i) => (
                  <span key={w} style={{ fontFamily: "Georgia, serif", fontSize: 26 - i * 2, color: i < 3 ? C.plum : C.ink }}>{w}</span>
                ))}
              </div>
            </Card>
          )}
          <Card style={{ marginBottom: 12 }}>
            <Eyebrow color={C.espresso}>Zahlen & Zeichen</Eyebrow>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.9 }}>
              ✨ {punkte} Lichtpunkte gesammelt<br />
              {qigongMin > 0 && <>🌿 {qigongMin} Minuten Qigong an {(qigong || []).length} Tagen<br /></>}
              {dankSaetze > 0 && <>🤍 {dankSaetze} Dinge, für die du dankbar warst<br /></>}
              {gegangen > 0 && <>🕊️ {gegangen} {gegangen === 1 ? "Sache" : "Dinge"} losgelassen<br /></>}
              {drawn && <>🔮 Zuletzt gezogen: {drawn.name || drawn.titel || "deine Tageskarte"}<br /></>}
              {(feste || []).length > 0 && <>🕯️ {feste.length} Jahreskreis-Feste gefeiert</>}
            </div>
          </Card>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, opacity: 0.75, lineHeight: 1.6 }}>
            Alle Zahlen stammen ausschließlich aus deinen eigenen Einträgen — nichts ist geschätzt.
          </div>
        </>
      )}
    </div>
  );
}

