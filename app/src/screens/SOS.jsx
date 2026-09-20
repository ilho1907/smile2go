// SOS.jsx — SOS-Hilfe, Archetypen-Test, Schattenspiegel und Zukunfts-Ich.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { FEUER_VIDEO } from "../media";
import { spracheMoeglich, sprich, stimmeAn, stimmeSetzen, stoppSprache } from "../sprache";
import { useEffect, useRef, useState } from "react";
import { askLuma } from "../lib/ki";
import { Btn, Card, Eyebrow, H, Mikro } from "../ui/basis";
import { C } from "../ui/tema";

/* ═══════════════ NEUE SEELEN-FEATURES ═══════════════ */

/* ── Schattenspiegel — das Tagebuch, das sich selbst vernichtet ── */
export function Schattenspiegel({ addPunkte }) {
  const [text, setText] = useState("");
  const [burning, setBurning] = useState(false);
  const [done, setDone] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const videoRef = useRef(null);
  const BURN_MS = 4800; // an die Länge des Feuer-Videos angepasst
  const verbrennen = () => {
    if (!text.trim() || burning) return;
    setBurning(true);
    setTimeout(() => {
      setText("");
      setBurning(false);
      setDone(true);
      addPunkte(2, "Losgelassen");
      setTimeout(() => setDone(false), 3400);
    }, BURN_MS);
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (videoRef.current) videoRef.current.muted = !next;
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <style>{`
        @keyframes burnAway { 0% { opacity: 1; filter: none; } 35% { opacity: .85; filter: blur(1px) sepia(.6); } 100% { opacity: 0; filter: blur(6px) sepia(1); transform: translateY(-26px) scale(.96); } }
        @keyframes ashRise { 0% { opacity: 0; transform: translateY(12px); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateY(-80px) rotate(24deg); } }
      `}</style>
      <Eyebrow color={C.plum}>Schattenspiegel</Eyebrow>
      <H size={25}>Schreib es. Lass es gehen.</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Hier darfst du alles aussprechen, was du nie jemandem zeigen würdest — Wut, Angst, dunkle Gedanken.
        Danach wird dein Text zeremoniell verbrannt.
      </p>
      <Card style={{ background: "#2E2320", border: "1px solid #4A3A30", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#C9A98C", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
            🖤 Nichts wird gespeichert · keine KI liest mit · kein Backup
          </div>
          <button
            onClick={toggleSound}
            title={soundOn ? "Ton aus" : "Ton an"}
            style={{
              flexShrink: 0, marginLeft: 10, width: 30, height: 30, borderRadius: 9, border: "1px solid #4A3A30",
              background: "rgba(255,255,255,.06)", color: "#F0E4D6", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
        </div>
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
          {burning && (
            <video
              ref={videoRef}
              src={FEUER_VIDEO}
              muted={!soundOn}
              playsInline
              autoPlay
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", mixBlendMode: "screen", pointerEvents: "none",
              }}
            />
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Was ist gerade am schwersten in dir? Schreib es hierher …"
            rows={8}
            disabled={burning}
            style={{
              width: "100%", boxSizing: "border-box", background: "transparent", border: "none", outline: "none",
              color: "#F0E4D6", fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1.7, resize: "vertical",
              animation: burning ? "burnAway 2.4s ease forwards" : "none", position: "relative",
            }}
          />
          {burning && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
              {["✨", "🌫️", "✨"].map((e, i) => (
                <span key={i} style={{ fontSize: 20, animation: `ashRise ${1.4 + i * 0.25}s ease-out ${i * 0.15}s forwards`, opacity: 0 }}>{e}</span>
              ))}
            </div>
          )}
        </div>
      </Card>
      <div style={{ marginTop: 14 }}>
        <Btn full onClick={verbrennen} disabled={burning || !text.trim()}>
          {burning ? "Es verbrennt …" : "🔥 Verbrennen & loslassen"}
        </Btn>
      </div>
      {done && (
        <Card style={{ marginTop: 14, textAlign: "center", background: C.goldPale }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso }}>Es ist gegangen. 🕊️</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 4 }}>Atme einmal tief. Dieser Raum gehört wieder dir.</div>
        </Card>
      )}
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.7, marginTop: 16, lineHeight: 1.6 }}>
        Technisches Versprechen: Dein Text existiert nur in diesem Moment auf deinem Gerät. Er wird nicht gespeichert,
        nicht gesendet und nicht analysiert.
      </p>
    </div>
  );
}

/* ── Zukunfts-Ich — Dialog mit dir in 10 Jahren (echte KI via askLuma) ── */
export function ZukunftsIch({ name, entries, ziele, archetyp, msgs, setMsgs }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  const senden = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next); setInput(""); setBusy(true);
    const journal = (entries || []).slice(0, 5).map((e) => `- ${[e.intention, ...(e.items || [])].filter(Boolean).join(" · ")}`.slice(0, 200)).join("\n");
    const zieleTxt = (ziele || []).map((z) => z.titel).join(", ");
    const system = `Du bist das Zukunfts-Ich von ${name || "der Nutzerin"} — sie selbst, 10 Jahre weiter, warm, weise, angekommen. Du sprichst Deutsch in der Du-Form ("wir", "du damals"), liebevoll und konkret, 2-6 Sätze. Du erinnerst dich an ihr heutiges Leben:
${journal ? `Ihre letzten Journal-Gedanken:\n${journal}` : "Sie hat noch nichts ins Journal geschrieben."}
${zieleTxt ? `Ihre Ziele heute: ${zieleTxt}.` : ""}
${archetyp ? `Ihr Archetyp: ${archetyp.name}.` : ""}
Regeln: Erfinde keine konkreten Fakten über ihr Leben, die oben nicht stehen. Sprich über Gefühle, Haltung und Möglichkeiten statt über erfundene Ereignisse. Keine Diagnosen; bei ernsten Krisen empfiehl liebevoll professionelle Hilfe.`;
    try {
      const reply = await askLuma(next, system);
      setMsgs([...next, { role: "assistant", content: reply || "Ich bin hier — bei dir, aus der Zukunft. 🤍" }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Gerade reißt die Verbindung durch die Zeit ab — versuch es gleich noch einmal. 🤍" }]);
    }
    setBusy(false);
  };
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Zukunfts-Ich</Eyebrow>
      <H size={25}>Sprich mit dir in 10 Jahren</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: "10px 0 16px" }}>
        Dein Zukunfts-Ich kennt deine Journal-Gedanken und Ziele — und antwortet dir mit der Ruhe von jemandem, der weiß, wie es weitergeht.
      </p>
      {msgs.length === 0 && (
        <Card style={{ marginBottom: 12, background: C.goldPale }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15.5, color: C.espresso, lineHeight: 1.6 }}>
            „Hallo du. Ich bin du — nur ein Stück weiter auf dem Weg. Frag mich, was du wissen willst.“
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 8 }}>
            Zum Beispiel: „Hat sich der Mut gelohnt?“ · „Was soll ich heute nicht mehr mit mir herumtragen?“
          </div>
        </Card>
      )}
      {msgs.map((m, i) => (
        <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
          <div style={{
            maxWidth: "82%", padding: "12px 15px", borderRadius: 18,
            borderBottomRightRadius: m.role === "user" ? 6 : 18,
            borderBottomLeftRadius: m.role === "user" ? 18 : 6,
            background: m.role === "user" ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.card,
            border: m.role === "user" ? "none" : `1px solid ${C.line}`,
            color: m.role === "user" ? "#fff" : C.espresso,
            fontFamily: "system-ui, sans-serif", fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap",
          }}>{m.role === "assistant" ? "🕰️ " : ""}{m.content}</div>
        </div>
      ))}
      {busy && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 10 }}>🕰️ Dein Zukunfts-Ich denkt zurück …</div>}
      <div ref={endRef} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && senden()}
          placeholder="Frag dein Zukunfts-Ich …"
          style={{ flex: 1, padding: "13px 15px", borderRadius: 14, border: `1.5px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 14.5, outline: "none", background: C.card, color: C.espresso }}
        />
        <Mikro size={44} onText={(t) => setInput((prev) => (prev ? prev + " " : "") + t)} />
        <Btn onClick={senden} disabled={busy || !input.trim()}>➤</Btn>
      </div>
    </div>
  );
}

/* ── S.O.S. — Ich brauche jetzt Halt (Overlay) ── */
export const SOS_WEGE = [
  { k: "panik", icon: "🫀", t: "Panik & Herzrasen", s: "Mein Körper dreht durch" },
  { k: "traurig", icon: "🌧️", t: "Tiefe Traurigkeit", s: "Ich komme nicht raus" },
  { k: "wut", icon: "⚡", t: "Wut & Druck", s: "Es platzt gleich aus mir" },
  { k: "einsam", icon: "🕯️", t: "Einsamkeit", s: "Niemand ist da" },
  { k: "ueberfordert", icon: "🌀", t: "Überforderung", s: "Alles zu viel auf einmal" },
  { k: "dunkel", icon: "🖤", t: "Ganz dunkle Gedanken", s: "Ich brauche echte Hilfe" },
];

export const SOS_ERDUNG = {
  panik: { name: "5-4-3-2-1 Erdung", schritte: ["Nenne 5 Dinge, die du siehst.", "Nenne 4 Dinge, die du hören kannst.", "Berühre 3 Dinge — spür ihre Oberfläche.", "Nenne 2 Dinge, die du riechst.", "Nenne 1 Ding, das du schmeckst."], hinweis: "Panik ist eine Welle. Sie steigt, sie bricht, sie geht wieder. Immer." },
  traurig: { name: "Sanfte Wärme", schritte: ["Leg eine Hand auf dein Herz, eine auf deinen Bauch.", "Spür die Wärme deiner eigenen Hände.", "Sag leise: „Das ist gerade schwer. Und ich bin da.“", "Atme dreimal langsam in die Hand auf dem Bauch.", "Trink einen Schluck Wasser — ganz bewusst."], hinweis: "Traurigkeit will nicht weggemacht werden. Sie will begleitet werden." },
  wut: { name: "Druck ablassen", schritte: ["Balle beide Fäuste fest — 5 Sekunden.", "Und loslassen. Spür das Prickeln.", "Noch einmal: fest anspannen … loslassen.", "Atme durch den Mund kräftig aus, wie ein Seufzer.", "Sag innerlich: „Meine Wut hat einen guten Grund.“"], hinweis: "Wut zeigt dir, wo eine Grenze überschritten wurde. Sie ist eine Botschaft, kein Fehler." },
  einsam: { name: "Verbindung spüren", schritte: ["Umarme dich selbst — Arme über Kreuz, Hände an die Schultern.", "Wiege dich ganz leicht hin und her.", "Denk an einen Menschen, der dich einmal gesehen hat.", "Atme, als würdest du ihm gegenübersitzen.", "Erinnere dich: Gerade jetzt sitzt irgendwo eine andere Frau genauso da wie du."], hinweis: "Einsamkeit lügt. Sie sagt „für immer“ — dabei meint sie „gerade jetzt“." },
  ueberfordert: { name: "Eins nach dem anderen", schritte: ["Schließ kurz die Augen. Alles darf warten.", "Atme 4 Sekunden ein, 6 Sekunden aus.", "Frag dich: Was ist in den nächsten 10 Minuten wirklich nötig?", "Nur das. Alles andere existiert gerade nicht.", "Sag: „Ich muss nicht alles. Ich muss nur das Nächste.“"], hinweis: "Du bist nicht überfordert, weil du zu schwach bist — sondern weil es zu viel ist." },
  dunkel: { name: "Jetzt nicht allein", schritte: ["Bleib genau da, wo du bist. Du musst nichts entscheiden.", "Atme mit mir — ein … und langsam aus.", "Ruf jemanden an, der jetzt für dich da sein kann.", "Wenn niemand da ist: Die TelefonSeelsorge ist immer erreichbar.", "Diese Nacht musst du nicht allein durchstehen."], hinweis: "Du bist wichtig. Was du gerade fühlst, ist echt — und es ist nicht das Ende der Geschichte." },
};

export function SOSOverlay({ onClose, entries, setEntries, addPunkte, archetyp }) {
  const [phase, setPhase] = useState("wahl");
  const [weg, setWeg] = useState(null);
  const [atemZyklus, setAtemZyklus] = useState(0);
  const [atemPhase, setAtemPhase] = useState("ein");
  const [schritt, setSchritt] = useState(0);
  const [text, setText] = useState("");
  const [stimme, setStimme] = useState(() => stimmeAn());
  // 4-7-8 Atmung: 6 Zyklen
  useEffect(() => {
    if (phase !== "atmen") return;
    const seq = [["ein", 4000], ["halten", 7000], ["aus", 8000]];
    let i = 0, z = 0, timer;
    const lauf = () => {
      const [p, ms] = seq[i];
      setAtemPhase(p);
      timer = setTimeout(() => {
        i++;
        if (i >= seq.length) { i = 0; z++; setAtemZyklus(z); if (z >= 6) { setPhase("erdung"); return; } }
        lauf();
      }, ms);
    };
    lauf();
    return () => clearTimeout(timer);
  }, [phase]);

  /* ── Sprachbegleitung ──
     Wer in Panik ist, tippt sich nicht durch fünf Schritte. Darum liest die App
     hier vor und geht von allein weiter — Hände frei, Augen zu.
     Alles bleibt sichtbar und klickbar; die Stimme ist ein Angebot, keine Pflicht. */
  useEffect(() => () => stoppSprache(), []);

  // Auswahl: vorlesen, was zur Wahl steht — und notfalls von allein anfangen.
  useEffect(() => {
    if (!stimme || phase !== "wahl") return;
    let ab = false;
    (async () => {
      await sprich("Ich bin bei dir. Was ist gerade los? Ich suche den passenden Weg für dich.", { pauseDanach: 400 });
      if (ab) return;
      await sprich("Panik und Herzrasen. Tiefe Traurigkeit. Wut und Druck. Einsamkeit. Überforderung. Oder ganz dunkle Gedanken.", { rate: 0.84, pauseDanach: 6000 });
      if (ab) return;
      await sprich("Du musst nichts aussuchen. Ich fange einfach mit dem Atem an — tipp jederzeit etwas anderes an.", { pauseDanach: 1200 });
      if (ab) return;
      setWeg("ueberfordert");
      setPhase("atmen");
    })();
    return () => { ab = true; stoppSprache(); };
  }, [phase, stimme]);

  // Atem: jede Phase wird angesagt, damit niemand auf den Kreis schauen muss.
  useEffect(() => {
    if (!stimme || phase !== "atmen") return;
    sprich(atemPhase === "ein" ? "Einatmen" : atemPhase === "halten" ? "Halten" : "Und langsam ausatmen", { rate: 0.8 });
  }, [atemPhase, phase, stimme]);

  // Erdung: Schritt vorlesen, Zeit zum Tun lassen, dann selbst weiterblättern.
  useEffect(() => {
    if (!stimme || phase !== "erdung" || !weg) return;
    const uebung = SOS_ERDUNG[weg];
    if (!uebung) return;
    let ab = false;
    const pause = weg === "dunkel" ? 11000 : 7000;
    (async () => {
      if (schritt === 0) { await sprich(uebung.name, { pauseDanach: 500 }); if (ab) return; }
      await sprich(uebung.schritte[schritt], { pauseDanach: pause });
      if (ab) return;
      if (schritt < uebung.schritte.length - 1) setSchritt(schritt + 1);
      else setPhase("halt");
    })();
    return () => { ab = true; stoppSprache(); };
  }, [phase, schritt, weg, stimme]);

  // Halt: der Satz der Coachin — bei dunklen Gedanken zusätzlich die Nummer.
  useEffect(() => {
    if (!stimme || phase !== "halt") return;
    let ab = false;
    (async () => {
      await sprich(SOS_ERDUNG[weg]?.hinweis || "Was du gerade fühlst, darf da sein. Du musst es nicht allein tragen.", { pauseDanach: 800 });
      if (ab) return;
      if (weg === "dunkel") {
        await sprich("Die Telefonseelsorge ist rund um die Uhr da, kostenlos: 0 8 0 0 . 1 1 1 . 0 . 1 1 1.", { rate: 0.78, pauseDanach: 800 });
        if (ab) return;
      }
      await sprich("Magst du aufschreiben, was gerade am lautesten in dir ist?");
    })();
    return () => { ab = true; stoppSprache(); };
  }, [phase, weg, stimme]);
  const speichern = () => {
    stoppSprache();
    if (text.trim() && setEntries) {
      setEntries([{ date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }), intention: `🤍 S.O.S. · ${SOS_WEGE.find((w) => w.k === weg)?.t || "Halt gesucht"}`, items: [text.trim()] }, ...(entries || [])]);
      if (addPunkte) addPunkte(8, "Du hast dich gehalten");
    }
    onClose();
  };
  const schliessen = () => { stoppSprache(); onClose(); };
  const erdung = weg ? SOS_ERDUNG[weg] : null;
  const dunkel = weg === "dunkel";
  const Hilfe = ({ voll }) => (
    <div style={{ marginTop: 14, padding: "12px 14px", background: voll ? C.roseSoft : C.beige, borderRadius: 12, fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.espresso, lineHeight: 1.7 }}>
      <b>Wenn es zu viel wird — kostenlos & rund um die Uhr:</b><br />
      📞 TelefonSeelsorge <b>0800 111 0 111</b> oder <b>0800 111 0 222</b><br />
      {voll && <>💬 Chat & Mail: telefonseelsorge.de<br />🚑 Bei akuter Gefahr: <b>112</b></>}
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(46,35,32,.9)", backdropFilter: "blur(6px)" }} onClick={phase === "atmen" ? undefined : schliessen} />
      <div style={{ position: "relative", width: "100%", maxWidth: 430, maxHeight: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "26px 20px", boxSizing: "border-box" }}>

        {spracheMoeglich() && (
          <button
            onClick={() => { const neu = !stimme; setStimme(neu); stimmeSetzen(neu); }}
            aria-label={stimme ? "Sprachbegleitung ausschalten" : "Sprachbegleitung einschalten"}
            style={{
              position: "absolute", top: 12, right: 16, zIndex: 2,
              background: "rgba(251,246,238,.1)", border: "1.5px solid #5A473C", borderRadius: 20,
              color: "#D8C4AE", padding: "7px 13px", cursor: "pointer",
              fontFamily: "system-ui, sans-serif", fontSize: 12,
            }}
          >
            {stimme ? "🔊 Stimme an" : "🔇 Stimme aus"}
          </button>
        )}

        {phase === "wahl" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#F5E9DB" }}>Ich bin bei dir.</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#D8C4AE", marginTop: 6, lineHeight: 1.6 }}>
                Was ist gerade los? Ich such den passenden Weg für dich.
              </div>
              {stimme && spracheMoeglich() && (
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#A8927C", marginTop: 8, lineHeight: 1.55 }}>
                  Du musst nichts tippen — ich lese vor und gehe von allein mit dir weiter.
                </div>
              )}
            </div>
            {SOS_WEGE.map((w) => (
              <button key={w.k} onClick={() => { setWeg(w.k); setPhase(w.k === "dunkel" ? "erdung" : "atmen"); }} style={{
                display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", marginBottom: 9,
                padding: "14px 16px", borderRadius: 16, cursor: "pointer",
                border: w.k === "dunkel" ? `2px solid ${C.rose}` : "1.5px solid #5A473C",
                background: w.k === "dunkel" ? "rgba(217,110,139,.16)" : "rgba(251,246,238,.07)",
              }}>
                <span style={{ fontSize: 25 }}>{w.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: "#F5E9DB" }}>{w.t}</span>
                  <span style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: "#C0AC98", marginTop: 2 }}>{w.s}</span>
                </span>
                <span style={{ color: "#C0AC98", fontSize: 19 }}>›</span>
              </button>
            ))}
            <button onClick={schliessen} style={{ display: "block", width: "100%", marginTop: 12, background: "none", border: "1.5px solid #5A473C", borderRadius: 14, color: "#C0AC98", padding: "12px 0", fontFamily: "system-ui, sans-serif", fontSize: 13.5, cursor: "pointer" }}>
              Doch nicht — schließen
            </button>
          </div>
        )}

        {phase === "atmen" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 21, color: "#F5E9DB", marginBottom: 6 }}>Atme mit mir</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#C0AC98", marginBottom: 26 }}>4 Sekunden ein · 7 halten · 8 aus</div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, marginBottom: 22 }}>
              <div style={{
                width: 190, height: 190, borderRadius: "50%",
                background: `radial-gradient(circle, ${C.rose} 0%, ${C.gold} 100%)`, opacity: 0.9,
                transform: atemPhase === "ein" ? "scale(1)" : atemPhase === "halten" ? "scale(1)" : "scale(0.5)",
                transition: atemPhase === "ein" ? "transform 4s ease-in-out" : atemPhase === "aus" ? "transform 8s ease-in-out" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>
                  {atemPhase === "ein" ? "einatmen" : atemPhase === "halten" ? "halten" : "ausatmen"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < atemZyklus ? C.gold : "#5A473C" }} />
              ))}
            </div>
            <button onClick={() => setPhase("erdung")} style={{ background: "none", border: "1.5px solid #D8C4AE", borderRadius: 14, color: "#D8C4AE", padding: "11px 22px", fontFamily: "system-ui, sans-serif", fontSize: 13.5, cursor: "pointer" }}>
              Weiter →
            </button>
          </div>
        )}

        {phase === "erdung" && erdung && (
          <Card style={{ background: C.cream }}>
            <Eyebrow color={C.plum}>{erdung.name}</Eyebrow>
            <div style={{ display: "flex", gap: 5, margin: "10px 0 16px" }}>
              {erdung.schritte.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 3, background: i <= schritt ? C.gold : C.line }} />
              ))}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, lineHeight: 1.55, minHeight: 84 }}>
              {erdung.schritte[schritt]}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {schritt > 0 && <Btn ghost small onClick={() => setSchritt(schritt - 1)}>←</Btn>}
              {schritt < erdung.schritte.length - 1 ? (
                <Btn full onClick={() => setSchritt(schritt + 1)}>Weiter</Btn>
              ) : (
                <Btn full onClick={() => setPhase("halt")}>Ich bin durch</Btn>
              )}
            </div>
            {dunkel && <Hilfe voll />}
          </Card>
        )}

        {phase === "halt" && (
          <Card style={{ background: C.cream }}>
            <Eyebrow color={C.plum}>Deine Coachin</Eyebrow>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18.5, color: C.espresso, lineHeight: 1.6, marginBottom: 12 }}>
              „{erdung?.hinweis || "Was du gerade fühlst, darf da sein. Du musst es nicht sofort lösen — du musst es nur nicht allein tragen."}“
            </div>
            {archetyp && (
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.7, marginBottom: 14, padding: "10px 12px", background: C.goldPale, borderRadius: 12 }}>
                {ARCHETYPEN[archetyp.key]?.icon} Auch {ARCHETYPEN[archetyp.key]?.name} darf schwach sein. Deine Kraft verschwindet nicht, nur weil du sie gerade nicht spürst.
              </div>
            )}
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7, marginBottom: 16 }}>
              Magst du aufschreiben, was gerade am lautesten in dir ist? Du entscheidest, ob es bleibt oder geht.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn full onClick={() => setPhase("schreiben")}>Aufschreiben</Btn>
              <Btn full ghost onClick={schliessen}>Mir geht's besser</Btn>
            </div>
            <Hilfe voll={dunkel} />
          </Card>
        )}

        {phase === "schreiben" && (
          <Card style={{ background: C.cream }}>
            <Eyebrow color={C.plum}>Was ist gerade am lautesten in dir?</Eyebrow>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Es darf unsortiert sein …"
              style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.card, color: C.espresso }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn full onClick={speichern} disabled={!text.trim()}>Ins Journal legen</Btn>
              <Btn full ghost onClick={schliessen}>Verwerfen</Btn>
            </div>
            <Hilfe voll={dunkel} />
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── Der 36-Fragen-Archetypen-Test — 12 Archetypen, je 3 Aussagen, Likert-Skala 1–5 ── */
export const ARCHETYPEN = {
  herrscherin: { name: "Die Herrscherin", icon: "👑", farbe: "#8A6D3B", satz: "Ich übernehme Verantwortung und schaffe Ordnung.", text: "Du fühlst dich wohl, wenn du die Fäden in der Hand hältst. Deine Kraft ist Struktur und Führung. Dein Wachstum: Kontrolle auch mal loslassen können, ohne dass alles zusammenbricht." },
  schoepferin: { name: "Die Schöpferin", icon: "🎨", farbe: "#C9963C", satz: "Ich bringe Neues in die Welt.", text: "Ideen fliegen dir zu, und du machst daraus etwas Echtes. Deine Kraft ist Ausdruck. Dein Wachstum: fertig machen statt nur anfangen — und dein Werk zeigen." },
  fuersorgliche: { name: "Die Fürsorgliche", icon: "🌿", farbe: "#6E8B6A", satz: "Ich halte Raum — auch für mich.", text: "Bei dir finden andere Halt und Wärme. Deine Kraft ist Fürsorge. Dein Wachstum: dich selbst genauso liebevoll zu halten wie alle anderen." },
  bodenstaendige: { name: "Die Bodenständige", icon: "🏡", farbe: "#9C8465", satz: "Ich gehöre dazu, ohne mich zu verstellen.", text: "Du bist echt, fair und nahbar — das gibt anderen Halt. Deine Kraft ist Verlässlichkeit. Dein Wachstum: dir erlauben, auch mal aufzufallen." },
  liebende: { name: "Die Liebende", icon: "🌹", farbe: "#D96E8B", satz: "Ich öffne mein Herz — zuerst für mich.", text: "Du fühlst tief und verbindest Menschen. Deine Kraft ist Empathie. Dein Wachstum: Grenzen setzen, ohne dich schuldig zu fühlen." },
  frohnatur: { name: "Die Frohnatur", icon: "🎭", farbe: "#E0A23C", satz: "Ich nehme das Leben leicht.", text: "Du bringst Humor in ernste Momente und lebst im Hier und Jetzt. Deine Kraft ist Leichtigkeit. Dein Wachstum: auch schwere Gefühle dalassen, statt sie wegzulachen." },
  heldin: { name: "Die Heldin", icon: "🔥", farbe: "#B0503C", satz: "Ich kämpfe für das, was mir wichtig ist.", text: "Du gehst voran, auch wenn es unbequem wird. Deine Kraft ist Mut. Dein Wachstum: nicht jeden Kampf allein austragen zu müssen." },
  rebellin: { name: "Die Rebellin", icon: "⚡", farbe: "#A6483C", satz: "Ich stelle infrage, was längst überholt ist.", text: "Regeln sind für dich Diskussionsgrundlage, nicht Gesetz. Deine Kraft ist Veränderung. Dein Wachstum: Provokation gezielt einsetzen statt aus Reflex." },
  magierin: { name: "Die Magierin", icon: "✨", farbe: "#6A5399", satz: "Ich verwandle, was ist, in das, was sein könnte.", text: "Du spürst die unsichtbaren Zusammenhänge hinter den Dingen. Deine Kraft ist Transformation. Dein Wachstum: Bodenhaftung behalten bei aller Vision." },
  unschuldige: { name: "Die Unschuldige", icon: "🕊️", farbe: "#D9C79E", satz: "Ich glaube an das Gute — das ist meine Kraft, kein Makel.", text: "Dein Optimismus trägt dich und andere durch schwierige Zeiten. Deine Kraft ist Vertrauen. Dein Wachstum: Enttäuschungen aushalten, ohne den Glauben zu verlieren." },
  entdeckerin: { name: "Die Entdeckerin", icon: "🧭", farbe: "#8E4A63", satz: "Ich folge meiner Neugier, wohin sie auch führt.", text: "Enge macht dich unruhig, Weite macht dich lebendig. Deine Kraft ist Unabhängigkeit. Dein Wachstum: Bindung als Abenteuer begreifen, nicht als Käfig." },
  weise: { name: "Die Weise", icon: "🦉", farbe: "#5C7A99", satz: "Ich vertraue dem, was ich erkenne.", text: "Du suchst Tiefe statt Lärm und siehst Zusammenhänge, wo andere nur Chaos sehen. Deine Kraft ist Klarheit. Dein Wachstum: dem Herzen so viel Stimme geben wie dem Kopf." },
};

export const ARCHETYP_BLOCKS = ["Sicherheit & Stabilität", "Zugehörigkeit & Verbindung", "Veränderung & Risiko", "Unabhängigkeit & Erkenntnis"];

export const ARCHETYP_FRAGEN = [
  // Block 1: Sicherheit & Stabilität
  { f: "Ich übernehme in Gruppen gerne die Verantwortung und organisiere das Geschehen.", key: "herrscherin" },
  { f: "Es ist mir wichtig, Ordnung, Struktur und klare Regeln um mich herum zu schaffen.", key: "herrscherin" },
  { f: "Ich fühle mich am wohlsten, wenn ich die Kontrolle über meine Lebensumstände habe.", key: "herrscherin" },
  { f: "Ich habe ein starkes Bedürfnis, Dinge, Projekte oder Kunstwerke von bleibendem Wert zu erschaffen.", key: "schoepferin" },
  { f: "Ich verliere mich oft in meiner Fantasie und stelle mir neue, kreative Welten vor.", key: "schoepferin" },
  { f: "Für mich ist Innovation und das Erschaffen von Neuem wichtiger als das Bewahren von Altem.", key: "schoepferin" },
  { f: "Es erfüllt mich zutiefst, anderen Menschen zu helfen und sie zu unterstützen.", key: "fuersorgliche" },
  { f: "Ich stelle die Bedürfnisse von Freunden oder der Familie oft über meine eigenen Bedürfnisse.", key: "fuersorgliche" },
  { f: "Ich möchte für andere ein sicherer Hafen sein und sie vor Gefahren beschützen.", key: "fuersorgliche" },
  // Block 2: Zugehörigkeit & Verbindung
  { f: "Ich bin bodenständig und passe mich gerne an die Gemeinschaft an, ohne aufzufallen.", key: "bodenstaendige" },
  { f: "Mir ist es wichtig, dass alle Menschen gleich und fair auf Augenhöhe behandelt werden.", key: "bodenstaendige" },
  { f: "Ich mag keine künstliche Statussymbole; ich schätze das einfache, ehrliche Leben.", key: "bodenstaendige" },
  { f: "Tiefe emotionale Bindungen und Leidenschaft sind das Wichtigste in meinem Leben.", key: "liebende" },
  { f: "Ich umgebe mich gerne mit schönen Dingen, Harmonie und einer liebevollen Atmosphäre.", key: "liebende" },
  { f: "Ich habe große Angst davor, von den Menschen, die ich liebe, abgelehnt zu werden.", key: "liebende" },
  { f: "Ich versuche immer, Humor und Leichtigkeit in ernste Situationen zu bringen.", key: "frohnatur" },
  { f: "Das Leben ist für mich ein Spiel, das man im Hier und Jetzt genießen sollte.", key: "frohnatur" },
  { f: "Ich breche gerne das Eis mit Witzen und nehme das Leben selten zu ernst.", key: "frohnatur" },
  // Block 3: Veränderung & Risiko
  { f: "Wenn ich mir ein Ziel gesetzt habe, kämpfe ich mit maximalem Einsatz dafür.", key: "heldin" },
  { f: "Ich stelle mich Herausforderungen und Konkurrenzkämpfen, um meine Stärke zu beweisen.", key: "heldin" },
  { f: "Ich kann Ungerechtigkeit nicht ertragen und verteidige Schwächere mit Mut.", key: "heldin" },
  { f: "Regeln sind für mich da, um hinterfragt, verändert oder gebrochen zu werden.", key: "rebellin" },
  { f: "Ich fühle mich oft als Außenseiterin, die gegen den Strom der Masse schwimmt.", key: "rebellin" },
  { f: "Ich liebe die Provokation, um verkrustete Strukturen in der Gesellschaft aufzubrechen.", key: "rebellin" },
  { f: "Ich glaube fest daran, dass Gedanken die Realität verändern und Wunder möglich sind.", key: "magierin" },
  { f: "Ich suche nach den tieferen, unsichtbaren Gesetzen des Universums und der Natur.", key: "magierin" },
  { f: "Menschen sagen über mich, dass ich eine transformierende oder magische Ausstrahlung habe.", key: "magierin" },
  // Block 4: Unabhängigkeit & Erkenntnis
  { f: "Ich glaube fest an das Gute im Menschen und behalte immer meinen Optimismus.", key: "unschuldige" },
  { f: "Ich sehne mich nach einem einfachen, reinen und perfekt harmonischen Leben.", key: "unschuldige" },
  { f: "Ich versuche stets, alles richtig zu machen und moralisch fehlerfrei zu handeln.", key: "unschuldige" },
  { f: "Freiheit und Unabhängigkeit sind mir wichtiger als finanzielle oder soziale Sicherheit.", key: "entdeckerin" },
  { f: "Ich liebe es, neue Orte, Kulturen und Ideen ganz auf eigene Faust zu entdecken.", key: "entdeckerin" },
  { f: "Ich langweile mich schnell, wenn mein Leben in eine alltägliche Routine verfällt.", key: "entdeckerin" },
  { f: "Ich suche ununterbrochen nach Wissen, Wahrheit und den logischen Zusammenhängen der Welt.", key: "weise" },
  { f: "Bevor ich eine Entscheidung treffe, analysiere ich alle Fakten sehr gründlich.", key: "weise" },
  { f: "Es treibt mich an, die Welt durch den Verstand und durch Weisheit zu begreifen.", key: "weise" },
];

export const LIKERT = [["1", "trifft nicht zu"], ["2", ""], ["3", "teils/teils"], ["4", ""], ["5", "trifft völlig zu"]];

export function ArchetypTest({ archetyp, setArchetyp, addPunkte }) {
  const [schritt, setSchritt] = useState(archetyp ? -1 : 0);
  const [punkteMap, setPunkteMap] = useState({});
  const antworte = (wert) => {
    const key = ARCHETYP_FRAGEN[schritt].key;
    const neu = { ...punkteMap, [key]: (punkteMap[key] || 0) + wert };
    setPunkteMap(neu);
    if (schritt + 1 < ARCHETYP_FRAGEN.length) { setSchritt(schritt + 1); return; }
    const best = Object.entries(neu).sort((a, b) => b[1] - a[1])[0][0];
    setArchetyp({ key: best, name: ARCHETYPEN[best].name, datum: new Date().toLocaleDateString("de-DE") });
    setSchritt(-1);
    addPunkte(15, "Archetyp entdeckt");
  };
  const neustart = () => { setPunkteMap({}); setSchritt(0); };
  if (schritt === -1 && archetyp) {
    const a = ARCHETYPEN[archetyp.key] || ARCHETYPEN.weise;
    return (
      <div style={{ padding: "26px 20px" }}>
        <Eyebrow color={C.plum}>Dein Archetyp</Eyebrow>
        <Card style={{ textAlign: "center", border: `2px solid ${a.farbe}`, background: C.card }}>
          <div style={{ fontSize: 54, marginBottom: 6 }}>{a.icon}</div>
          <H size={26} style={{ color: a.farbe }}>{a.name}</H>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 16, color: C.espresso, margin: "12px 0" }}>„{a.satz}“</div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.7 }}>{a.text}</p>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.7, marginTop: 10 }}>Entdeckt am {archetyp.datum}</div>
        </Card>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.7, margin: "14px 0" }}>
          Dein Archetyp begleitet dich ab jetzt: Dein Zukunfts-Ich kennt ihn, und deine Reflexionen dürfen in seiner Sprache zu dir sprechen.
        </p>
        <Btn full ghost onClick={neustart}>Test neu machen</Btn>
      </div>
    );
  }
  const frage = ARCHETYP_FRAGEN[schritt];
  const blockIdx = Math.floor(schritt / 9);
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow color={C.plum}>Der 36-Fragen-Archetypen-Test</Eyebrow>
      <H size={25}>Welche innere Kraft leitet dich?</H>
      <div style={{ height: 5, borderRadius: 3, background: C.line, margin: "14px 0 6px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((schritt + 1) / ARCHETYP_FRAGEN.length) * 100}%`, background: C.gold, borderRadius: 3, transition: "width .2s" }} />
      </div>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.75, marginBottom: 18 }}>
        Frage {schritt + 1}/{ARCHETYP_FRAGEN.length} · Block {blockIdx + 1}: {ARCHETYP_BLOCKS[blockIdx]}
      </div>
      <Card>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, marginBottom: 18, lineHeight: 1.5 }}>
          {frage.f}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          {LIKERT.map(([num]) => (
            <button key={num} onClick={() => antworte(Number(num))} style={{
              flex: 1, padding: "12px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.cream, cursor: "pointer",
              fontFamily: "system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: C.espresso,
            }}>{num}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>trifft nicht zu</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>trifft völlig zu</span>
        </div>
      </Card>
    </div>
  );
}

