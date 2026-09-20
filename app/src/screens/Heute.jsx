// Heute.jsx — Startseite „Heute" samt Energiekompass und ilho-Chat (Luma).
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { useEffect, useRef, useState } from "react";
import { ENERGIE, MOTIVATION } from "../daten/inhalte";
import { ILHO_SYSTEM, askLuma } from "../lib/ki";
import { ladeWetter } from "../lib/wetter";
import { besondererTag, dayIndex, kalenderwoche } from "../lib/zeit";
import { WochenChallenge } from "./Mehr";
import { Card, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Energie-Kompass ── */

export function EnergieKompass({ energie, setEnergie, addPunkte }) {
  const [impuls, setImpuls] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (lvl) => {
    const erst = !energie;
    setEnergie(lvl);
    if (erst && addPunkte) addPunkte(3, "Energie-Check");
    setBusy(true);
    setImpuls("");
    try {
      const txt = await askLuma(
        [{ role: "user", content: `Meine Energie heute: ${lvl.t} (${lvl.v}/5). Gib mir einen kurzen, liebevollen Impuls für meinen Tag — max. 2 Sätze.` }],
        ILHO_SYSTEM
      );
      setImpuls(txt || "Sei heute besonders sanft mit dir. 🤍");
    } catch {
      setImpuls("Sei heute besonders sanft mit dir — du machst das wunderbar. 🤍");
    }
    setBusy(false);
  };

  return (
    <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, ${C.roseSoft})` }}>
      <Eyebrow color={C.plum}>🧭 Energie-Kompass · KI-personalisiert</Eyebrow>
      <H size={16.5} style={{ marginBottom: 12 }}>Wie ist deine Energie heute?</H>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        {ENERGIE.map((x) => {
          const active = energie?.v === x.v;
          return (
            <button key={x.v} onClick={() => pick(x)} style={{
              flex: 1, padding: "10px 2px", borderRadius: 14, cursor: "pointer",
              border: `1.5px solid ${active ? C.rose : C.line}`,
              background: active ? "#fff" : "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minHeight: 62,
            }}>
              <span style={{ fontSize: 22 }}>{x.e}</span>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 9.5, fontWeight: 600, color: active ? C.plum : C.ink }}>{x.t}</span>
            </button>
          );
        })}
      </div>
      {busy && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, marginTop: 12 }}>✨ ilho spürt in deinen Tag hinein …</p>}
      {impuls && !busy && (
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.55, marginTop: 12 }}>
          ✨ {impuls}
        </p>
      )}
    </Card>
  );
}

/* ── Heute-Widget: Wetter · Kalender · besonderer Tag · Termine ── */

export function HeuteWidget({ termine, setTermine }) {
  const [neu, setNeu] = useState("");
  const [wetter, setWetter] = useState(null);
  const bt = besondererTag();
  const kw = kalenderwoche();
  const datum = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => { ladeWetter(setWetter); }, []);

  const add = () => {
    if (!neu.trim()) return;
    setTermine([...termine, { z: "", t: neu.trim() }]);
    setNeu("");
  };

  return (
    <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
      {/* Datum */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: `linear-gradient(135deg, ${C.goldPale}, ${C.card})` }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, fontWeight: 600 }}>{datum}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {wetter && (
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.espresso, display: "flex", alignItems: "center", gap: 4 }} title={`${wetter.stadt} · ${wetter.txt}`}>
              <span>{wetter.icon}</span><span>{wetter.temp}°C</span>
            </div>
          )}
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold }}>KW {kw}</div>
        </div>
      </div>
    </Card>
  );
}

/* ── Heute (Dashboard · anpassbar) ── */

export const TILE_KATALOG = {
  orakel: { icon: "🔮", t: "Orakel", s: "Karte ziehen", tab: "orakel" },
  luma: { icon: "✨", t: "ilho", s: "Mit deinem Begleiter reden", tab: "luma" },
  tagebuch: { icon: "📔", t: "Journaling", s: "Heute festhalten", tab: "tagebuch" },
  musik: { icon: "🎵", t: "Meditation", s: "10 Min Ruhe", tab: "media" },
  horoskop: { icon: "⭐", t: "Horoskop", s: "Dein Tag in den Sternen", tab: "orakel" },
  challenge: { icon: "🏆", t: "Challenge", s: "Weitermachen", tab: "tagebuch" },
  kurse: { icon: "🎓", t: "Kurse", s: "Weiterlernen, wo du warst", tab: "kurse" },
  mail: { icon: "📧", t: "Nachrichten", s: "Dein Postfach öffnen", mail: true },
};

export function Heute({ name, go, streak, punkte, addPunkte, termine, setTermine, prefs, setPrefs, ch369, meinZeichen, openPunkte, drawn, horo, entries, setJournalSec, twinTon = "" }) {
  // Nur eine heute gezogene Karte gilt als gezogen — sonst wartet sie wieder.
  const heutigeKarte = drawn && (!drawn.tag || drawn.tag === new Date().toDateString()) ? drawn : null;
  /* Morning notification: 7-8am ilho prep alert */
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const lastNotif = localStorage.getItem("ilho_notif_date");
    const today = now.toDateString();

    if (hour >= 7 && hour < 9 && lastNotif !== today && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("☀️ Dein Tag ist vorbereitet", {
        body: "ilho hat deine Tageskarte, Mantra & Atemritual bereit. Komm in smile2go! 🤍",
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23FFD700'/></svg>",
      });
      localStorage.setItem("ilho_notif_date", today);
    }
  }, []);
  const di = dayIndex();
  const mot = MOTIVATION[di % MOTIVATION.length];
  const hour = new Date().getHours();
  const gruss = hour < 11 ? "Guten Morgen" : hour < 18 ? "Schön, dass du da bist" : "Guten Abend";
  const heuteStr = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });

  /* ilho-Logik: bestimme den heutigen Fokus */
  const determineUniqueFocus = () => {
    const items = [
      { k: "journal", icon: "📔", t: "Journaling", done: entries?.some((e) => e.date === heuteStr), nav: "tagebuch", sec: "heute", p: "+10", priority: 100 },
      { k: "challenge", icon: "🏆", t: "Challenge", done: ch369?.letzterTag === new Date().toDateString(), nav: "aufgaben", p: "+20", priority: 90 },
      { k: "horoskop", icon: "⭐", t: "Horoskop", done: !!horo?.text, nav: "orakel", p: "+3", priority: 50 },
    ];
    const pending = items.filter((x) => !x.done);
    return pending.length > 0 ? pending[0] : null;
  };

  const uniqueFocus = determineUniqueFocus();

  return (
    <div style={{ padding: "26px 20px 20px" }}>
      {/* ilho-Kopfzeile */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: C.sage, marginBottom: 2 }}>✨ ilho hat deinen Tag vorbereitet</div>
          <H size={26} style={{ marginBottom: 4 }}>{gruss}{name ? `, ${name}` : ""} 🤍</H>
        </div>
        <button onClick={() => go("profil")} aria-label="Mein Bereich" style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid ${C.gold}`, background: C.card, cursor: "pointer", fontSize: 22, color: C.gold, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(58,42,34,.1)" }}>👤</button>
      </div>

      {/* ilho bereitet vor — die Tageskarte gehört aber nicht in diese Liste:
          die zieht die Nutzerin selbst. Deshalb steht sie getrennt darunter. */}
      <Card style={{ marginBottom: 12, background: C.roseSoft, border: `1px dashed ${C.rose}` }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.plum, marginBottom: 10 }}>📋 Für dich vorbereitet</div>
        <WochenChallenge go={go} />
        <button
          onClick={() => !heutigeKarte && go("orakel")}
          disabled={!!heutigeKarte}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 44,
            padding: "8px 10px", marginBottom: 10, textAlign: "left",
            cursor: heutigeKarte ? "default" : "pointer",
            background: C.card, border: `1px solid ${C.goldSoft}`, borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 16 }}>🎴</span>
          <span style={{ flex: 1, minWidth: 0, fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>
            {heutigeKarte
              ? <>Tageskarte gezogen — <b style={{ fontWeight: 700 }}>{heutigeKarte.n}</b></>
              : <>Deine <b style={{ fontWeight: 700 }}>Tageskarte</b> wartet auf dich</>}
          </span>
          {!heutigeKarte && <span style={{ color: C.gold, fontSize: 16 }}>›</span>}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>☀️</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>Mantra bereit — <span style={{ fontStyle: "italic", fontWeight: 500 }}>„{mot.t}"</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🕯️</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>2-Min-Atemritual bereit</span>
        </div>
      </Card>

      {/* Dein heutiger Sonnenstrahl */}
      <Card style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <div style={{ fontSize: 20, flexShrink: 0 }}>☀️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.plum }}>Dein heutiger Sonnenstrahl</div>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.55, marginTop: 4, marginBottom: 0 }}><strong>{mot.t}</strong> {mot.s}</p>
        </div>
      </Card>

      {/* Dein einziger Schritt heute */}
      {uniqueFocus ? (
        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, ${C.roseSoft})`, padding: "16px 18px" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.plum, marginBottom: 12 }}>💫 Dein einziger Schritt heute</div>
          <button onClick={() => {
            if (uniqueFocus.sec && setJournalSec) setJournalSec(uniqueFocus.sec);
            go(uniqueFocus.nav);
          }} style={{
            width: "100%", padding: "16px 14px", borderRadius: 14, cursor: "pointer",
            border: `2px solid ${C.plum}`, background: "#fff8f0", textAlign: "left",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>{uniqueFocus.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 700, color: C.espresso }}>{uniqueFocus.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>{uniqueFocus.p} · klick mich 👈</div>
            </div>
          </button>
        </Card>
      ) : (
        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, #E8F5E0)` }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.sage, marginBottom: 8 }}>🎉 Alles erledigt!</div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.5, marginBottom: 0 }}>Du hast heute alles geschafft. <strong>Ruhe dich aus — du verdienst es.</strong></p>
        </Card>
      )}

      {/* Status: Punkte & Streak */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, fontWeight: 600 }}>🔥 {streak} Tage Serie</span>
        <button onClick={openPunkte} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum, background: C.roseSoft, border: `1.5px solid ${C.rose}`, borderRadius: 20, padding: "5px 12px", cursor: "pointer" }}>✨ {punkte} Sonnenstrahlen ›</button>
      </div>

      {/* Mehr: Alle Features */}
      <Card style={{ marginTop: 16, background: C.cream, textAlign: "center", padding: "12px" }}>
        <button onClick={() => go("tagebuch")} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: C.plum, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Alle Funktionen (25+)</button>
      </Card>
    </div>
  );
}

/* ── ilho — KI-Assistent (echte Claude-API) ── */

export function Luma({ name, energie, msgs, setMsgs, twin, twinTon = "" }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const ctx = energie ? `\n(Kontext: Die Nutzerin heißt ${name}, ihre heutige Energie: ${energie.t} ${energie.v}/5.)` : `\n(Kontext: Die Nutzerin heißt ${name}.)`;
      const reply = await askLuma(next, ILHO_SYSTEM + ctx + twinTon);
      setMsgs([...next, { role: "assistant", content: reply || "Ich bin hier. Erzähl mir mehr davon. 🤍" }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Gerade kann ich dich nicht erreichen — versuch es gleich noch einmal. 🤍" }]);
    }
    setBusy(false);
  };

  const starters = ["Ich fühle mich heute unruhig", "Hilf mir, eine Intention zu setzen", "Wie lasse ich Grübeln los?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 86px)", maxHeight: "calc(100vh - 86px)" }}>
      <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${C.line}`, background: C.cream }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✨</div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso }}>ilho</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.sage, fontWeight: 600 }}>
              ● Dein KI-Assistent · {twinTon ? "im Ton deiner Coachin" : "immer für dich da"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
            <H size={19} style={{ marginBottom: 8 }}>Hallo{name ? ` ${name}` : ""} 🤍</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, marginBottom: 20 }}>
              Ich bin ilho. Was dich bewegt, hat hier Raum — ohne Bewertung, in deinem Tempo.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {starters.map((s) => (
                <button key={s} onClick={() => setInput(s)} style={{
                  fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.plum,
                  background: C.roseSoft, border: "none", borderRadius: 20, padding: "12px 16px", cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>
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
              fontFamily: "system-ui, sans-serif", fontSize: 14.5, lineHeight: 1.55,
              whiteSpace: "pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {busy && (
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, padding: "4px 2px" }}>✨ ilho schreibt …</div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "10px 14px 12px", borderTop: `1px solid ${C.line}`, background: C.cream, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Schreib ilho …"
          style={{ flex: 1, padding: "13px 16px", fontSize: 15, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 22, background: C.card, color: C.espresso, outline: "none" }}
        />
        <button onClick={send} disabled={busy} style={{
          width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 18, flexShrink: 0,
          opacity: busy ? 0.6 : 1,
        }}>↑</button>
      </div>
    </div>
  );
}

