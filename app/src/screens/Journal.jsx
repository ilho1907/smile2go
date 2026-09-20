// Journal.jsx — Tagebuch: Einträge, Rituale, Challenges, Briefe, MoneyMind.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import MediaBanner from "../MediaBanner";
import { IMG as S2GIMG, VIDEO as S2GVID } from "../media";
import { logEvent } from "../supabase";
import { useEffect, useState } from "react";
import { affirmationDesTages } from "../daten/inhalte";
import { dayIndex, mondphase } from "../lib/zeit";
import { AUFGABEN_KARTEN } from "./Orakel";
import { Btn, Card, Eyebrow, H, Mikro } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Journal-Hub: Tagebuch · Aufgaben · 3-6-9 · Money Mind ── */

export function Journal({ entries, setEntries, ritual, setRitual, ch369, setCh369, mm, setMm, briefe, setBriefe, akarte, setAkarte, addPunkte, streak, punkte, initialSec }) {
  const [sec, setSec] = useState(initialSec || "heute");

  const chips = [
    { k: "heute", t: "📔 Journaling" },
    { k: "rituale", t: "🔮 Rituale" },
    { k: "brief", t: "💌 Zukunftsbrief" },
    { k: "money", t: "💰 Fülle" },
  ];

  // Higgsfield-Kinovideos pro Bereich (Erklärtexte bleiben Text)
  const SEC_MEDIA = {
    heute:     { v: S2GVID.journal,   p: S2GIMG.journal,   t: "Journaling",    s: "Dein Raum. Kein richtig, kein falsch." },
    rituale:   { v: S2GVID.rituale,   p: S2GIMG.rituale,   t: "Rituale",       s: "Kleine Rituale, große Wirkung." },
    brief:     { v: S2GVID.brief,     p: S2GIMG.brief,     t: "Zukunftsbrief", s: "Ein Brief an dich selbst." },
    money:     { v: S2GVID.fuelle,    p: S2GIMG.fuelle,    t: "Fülle",         s: "Du darfst empfangen." },
  };
  const sm = SEC_MEDIA[sec];

  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Journal & Aufgaben</Eyebrow>
      <H size={25} style={{ marginBottom: 14 }}>Dein täglicher Raum</H>

      <div style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
        {chips.map((c) => (
          <button key={c.k} onClick={() => setSec(c.k)} style={{
            fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600,
            padding: "9px 13px", borderRadius: 20, cursor: "pointer", minHeight: 38,
            border: `1.5px solid ${sec === c.k ? C.rose : C.line}`,
            background: sec === c.k ? C.roseSoft : "transparent",
            color: sec === c.k ? C.plum : C.ink,
          }}>{c.t}</button>
        ))}
      </div>

      {sm && <MediaBanner video={sm.v} poster={sm.p} title={sm.t} subtitle={sm.s} height={190} />}

      {sec === "heute" && <JournalHeute entries={entries} setEntries={setEntries} addPunkte={addPunkte} />}
      {sec === "rituale" && <Rituale ritual={ritual} setRitual={setRitual} addPunkte={addPunkte} />}
      {sec === "brief" && <Brief briefe={briefe} setBriefe={setBriefe} addPunkte={addPunkte} />}
      {sec === "money" && <MoneyMind mm={mm} setMm={setMm} addPunkte={addPunkte} />}
    </div>
  );
}

/* — Heute: Intention · Dankbarkeit · Wachstum — */
export const FRAGEN = [
  { icon: "🌤️", q: "Was wünsche ich mir heute am meisten?" },
  { icon: "🏆", q: "Worauf bin ich heute besonders stolz?" },
  { icon: "🌱", q: "Was kann ich morgen besser machen als heute?" },
  { icon: "🔍", q: "Was in meinem Leben verdient mehr Aufmerksamkeit von mir?" },
  { icon: "🍃", q: "Gibt es etwas, was ich loslassen darf?" },
  { icon: "💗", q: "Hör auf dein Herz: Welcher Satz kommt heute direkt aus deinem Herzen?" },
];

export function JournalHeute({ entries, setEntries, addPunkte }) {
  const [intention, setIntention] = useState("");
  const [dank, setDank] = useState(["", "", "", "", "", ""]);
  const [stimmung, setStimmung] = useState(null);
  const [saved, setSaved] = useState(false);

  const input = {
    width: "100%", padding: "14px 15px", fontSize: 15.5,
    fontFamily: "Georgia, serif", fontStyle: "italic",
    border: `1.5px solid ${C.line}`, borderRadius: 14,
    background: C.card, color: C.espresso, marginBottom: 12, outline: "none",
  };

  const save = () => {
    const items = dank.map((x, i) => x.trim() && `${FRAGEN[i].icon} ${x.trim()}`).filter(Boolean);
    if (stimmung) items.unshift(`📊 Heute geht es mir: ${stimmung}/10`);
    if (!intention.trim() && !items.length) return;
    setEntries([{
      date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }),
      intention: intention.trim(), items, stimmung,
    }, ...entries]);
    setIntention(""); setDank(["", "", "", "", "", ""]); setStimmung(null);
    if (addPunkte) addPunkte(10, "Tagebuch-Eintrag");
    logEvent("journal_eintrag");
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      {(() => {
        const a = affirmationDesTages();
        return (
          <Card style={{ marginBottom: 14, background: C.goldPale, border: `1px solid ${C.goldSoft}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>🌅 Deine Tages-Inspiration</Eyebrow>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.plum, fontWeight: 700 }}>{a.icon} {a.t}</span>
            </div>
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 17.5, color: C.espresso, lineHeight: 1.55, margin: "4px 0 10px" }}>
              „{a.s}“
            </p>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.85 }}>
              Sprich diesen Satz heute ein paar Mal langsam aus — morgen wartet ein neuer.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <input
                style={{ ...input, margin: 0, background: "#fff", flex: 1 }}
                placeholder="Deine eigene Intention für heute (optional) …"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
              />
              <Mikro size={38} onText={(t) => setIntention((prev) => (prev ? prev + " " : "") + t)} />
            </div>
          </Card>
        );
      })()}

      {/* Buchseite — schreiben wie in einem echten Tagebuch */}
      <div style={{
        marginBottom: 14, borderRadius: "6px 16px 16px 6px", padding: "18px 18px 22px",
        background: "linear-gradient(105deg, #F3E9D8 0%, #FDF9EF 7%, #FFFDF6 60%, #F8EFDD 100%)",
        border: `1px solid ${C.line}`, borderLeft: `6px solid ${C.gold}`,
        boxShadow: "inset 14px 0 18px -14px rgba(58,42,34,.22), 0 6px 18px rgba(58,42,34,.08)",
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <Eyebrow color={C.plum}>📖 Deine Ausrichtung für heute</Eyebrow>
          <span style={{ fontFamily: '"Snell Roundhand", "Savoye LET", "Segoe Script", cursive', fontSize: 15, color: C.ink, opacity: 0.8 }}>
            {new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginBottom: 12 }}>✍️ 7 Fragen · dein täglicher Check-in</div>

        {/* Frage 1 — Stimmungsskala 1–10 */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.espresso, marginBottom: 8 }}>📊 Wie geht es mir heute?</div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const n = i + 1;
              const aktiv = stimmung === n;
              return (
                <button key={n} onClick={() => setStimmung(aktiv ? null : n)} style={{
                  flex: 1, minWidth: 0, padding: "9px 0", borderRadius: 9, cursor: "pointer",
                  border: aktiv ? `2px solid ${C.gold}` : `1px solid ${C.line}`,
                  background: aktiv ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : "rgba(255,255,255,.6)",
                  color: aktiv ? "#fff" : C.ink,
                  fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: aktiv ? 700 : 500,
                }}>{n}</button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.75 }}>schwer</span>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.75 }}>wunderbar</span>
          </div>
        </div>

        {FRAGEN.map((f, i) => (
          <div key={i} style={{ marginBottom: i < FRAGEN.length - 1 ? 14 : 0 }}>
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.espresso, margin: "4px 0 2px" }}>{f.icon} {f.q}</div>
            <textarea
              rows={2}
              placeholder="Schreib es auf …"
              value={dank[i]}
              onChange={(e) => setDank(dank.map((x, j) => (j === i ? e.target.value : x)))}
              style={{
                width: "100%", border: "none", outline: "none", resize: "none",
                background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(201,150,60,.38) 31px, rgba(201,150,60,.38) 32px)",
                fontFamily: '"Snell Roundhand", "Savoye LET", "Bradley Hand", "Segoe Script", cursive',
                fontSize: 19, lineHeight: "32px", color: "#4A3320",
                padding: "0 2px", caretColor: C.plum,
              }}
            />
          </div>
        ))}
        {/* Seitenecke */}
        <div style={{ position: "absolute", right: 0, bottom: 0, width: 26, height: 26, borderRadius: "16px 0 14px 0", background: "linear-gradient(315deg, #E9DAC0 0%, #F8EFDD 55%, transparent 56%)", boxShadow: "-2px -2px 5px rgba(58,42,34,.10)" }} />
      </div>

      <Btn full onClick={save}>Eintrag speichern</Btn>
      {saved && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.sage, textAlign: "center", marginTop: 12, fontWeight: 600 }}>
          ✓ Gespeichert — schön, dass du dir den Moment genommen hast.
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Eyebrow color={C.ink}>Deine Einträge</Eyebrow>
          {entries.map((e, i) => (
            <Card key={i} style={{ marginBottom: 10, padding: 16 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.rose, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{e.date}</div>
              {e.intention && <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.6 }}>🌅 {e.intention}</div>}
              {e.items?.map((it, j) => (
                <div key={j} style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.6 }}>{it}</div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* — Rituelles Energie-Update — */
export function Rituale({ ritual, setRitual, addPunkte }) {
  const RITUALE = [
    {
      k: "raeu",
      t: "🕯️ Kerze / Räuchern",
      d: "Eine Kerze anzuzünden dauert zehn Sekunden und macht aus einem Zimmer einen Raum. Es ist kein Zauber — es ist ein Zeichen an dich selbst, dass jetzt etwas anderes beginnt.",
      s: [
        "Such dir eine Kerze und einen Platz, an dem du sie sehen kannst.",
        "Zünde sie an und bleib einen Moment davor stehen.",
        "Sag innerlich, wofür sie brennt — ein Wort reicht.",
        "Räuchere danach, wenn du magst: Fenster auf, Rauch ziehen lassen.",
        "Lösch sie bewusst, wenn du fertig bist.",
      ],
    },
    {
      k: "natur",
      t: "🌳 Zeit in der Natur",
      d: "Die Natur macht nichts mit dir, was du nicht selbst tust — sie gibt dir nur den Raum dafür. Zwanzig Minuten draußen ohne Ziel wirken mehr als eine Stunde mit Kopfhörern im Ohr.",
      s: [
        "Geh ohne Ziel los — der Weg entscheidet sich unterwegs.",
        "Lass Kopfhörer und Podcast weg.",
        "Bleib einmal stehen und schau bewusst nach oben.",
        "Nimm drei Dinge wahr: eine Farbe, ein Geräusch, einen Geruch.",
        "Nimm etwas Kleines mit nach Hause — ein Blatt, einen Stein.",
      ],
    },
    {
      k: "mond",
      t: "🌙 Mondritual",
      d: "Der Mond gibt dir einen Rhythmus, der nicht aus deinem Kalender kommt. Zunehmend heißt: etwas beginnen. Abnehmend heißt: etwas abgeben. Mehr braucht es nicht.",
      s: [
        "Schau oben nach, in welcher Phase der Mond gerade steht.",
        "Bei zunehmendem Mond: Schreib auf, was wachsen soll.",
        "Bei abnehmendem Mond: Schreib auf, was gehen darf.",
        "Lies den Satz einmal laut.",
        "Leg den Zettel weg — bis zur nächsten Phase.",
      ],
    },
    {
      k: "körper",
      t: "💧 Körper & Wasser",
      d: "Dein Körper meldet sich lange bevor der Kopf es merkt. Wasser ist der einfachste Weg, ihm zu antworten — trinken, duschen, Hände unter den Hahn.",
      s: [
        "Trink morgens ein Glas Wasser, bevor du zum Handy greifst.",
        "Stell dir ein Glas sichtbar hin — was du siehst, trinkst du.",
        "Halt einmal am Tag die Handgelenke unter kaltes Wasser.",
        "Dusch am Ende zehn Sekunden kühler als angenehm.",
        "Spür kurz nach, bevor du weitermachst.",
      ],
    },
  ];
  const [offen, setOffen] = useState(null);
  const toggleR = (k) => {
    if (!ritual[k] && addPunkte) addPunkte(2, "Ritual genährt");
    setRitual({ ...ritual, [k]: !ritual[k] });
  };
  const doneCount = RITUALE.filter((r) => ritual[r.k]).length;
  const mond = mondphase();

  return (
    <div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 14, alignItems: "center", background: C.goldPale, border: `1px solid ${C.goldSoft}` }}>
        <div style={{ fontSize: 36, animation: "floaty 3s ease-in-out infinite" }}>{mond.e}</div>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{mond.n}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginTop: 2 }}>{mond.imp}</div>
        </div>
      </Card>

      <Card style={{ background: `linear-gradient(135deg, ${C.card}, ${C.roseSoft})` }}>
        <Eyebrow color={C.plum}>🔮 Rituelles Energie-Update · wöchentlich</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginBottom: 12 }}>
          Welche Rituale haben dich diese Woche genährt? ({doneCount}/{RITUALE.length})
        </p>

        {RITUALE.map((r) => (
          <div key={r.k} style={{
            marginBottom: 7, borderRadius: 12,
            border: `1.5px solid ${ritual[r.k] ? C.rose : C.line}`,
            background: ritual[r.k] ? "#fff" : "transparent",
            transition: "border-color .2s, background .2s", overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={() => setOffen(offen === r.k ? null : r.k)}
                aria-expanded={offen === r.k}
                style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 12px", border: "none", background: "transparent",
                  cursor: "pointer", textAlign: "left", minHeight: 44,
                }}
              >
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, flex: 1 }}>{r.t}</span>
                <span style={{ color: C.mut, fontSize: 12, transform: offen === r.k ? "rotate(180deg)" : "none", transition: "transform .2s" }}>⌄</span>
              </button>
              <button
                onClick={() => toggleR(r.k)}
                aria-label={ritual[r.k] ? "Als offen markieren" : "Als genährt markieren"}
                style={{
                  border: "none", background: "transparent", cursor: "pointer",
                  padding: "11px 14px", minHeight: 44,
                  color: ritual[r.k] ? C.rose : C.line, fontSize: 18,
                }}
              >
                {ritual[r.k] ? "✓" : "○"}
              </button>
            </div>

            {offen === r.k && (
              <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.line}` }}>
                <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: "12px 0 10px" }}>
                  {r.d}
                </p>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {r.s.map((schritt, i) => (
                    <li key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.6, marginBottom: 5 }}>
                      {schritt}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}

        {doneCount === RITUALE.length && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, fontWeight: 700, textAlign: "center", marginTop: 8 }}>
            ✨ Alle Rituale genährt — deine Energie strahlt!
          </p>
        )}
      </Card>
    </div>
  );
}

/* — 3-6-9 Methode · 21-Tage-Challenge — */
export function Challenge369({ ch, setCh, akarte, setAkarte, addPunkte }) {
  const ziehen = () => {
    setAkarte(AUFGABEN_KARTEN[Math.floor(Math.random() * AUFGABEN_KARTEN.length)]);
    if (addPunkte) addPunkte(5, "Aufgaben-Karte");
  };
  return (
    <div>
      {/* Aufgaben-Karte des Tages */}
      <Card style={{ marginBottom: 14, textAlign: "center", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <Eyebrow>🃏 Aufgaben-Karte des Tages</Eyebrow>
        {!akarte ? (
          <>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 12 }}>
              Zieh deine kleine Tagesaufgabe — ein liebevoller Mini-Impuls für heute.
            </p>
            <Btn small onClick={ziehen}>Karte ziehen ✨</Btn>
          </>
        ) : (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={{ fontSize: 34, margin: "4px 0 8px" }}>{akarte.icon}</div>
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15.5, color: C.espresso, lineHeight: 1.6 }}>{akarte.t}</p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 10 }}>Deine Aufgabe für heute — morgen wartet eine neue.</p>
          </div>
        )}
      </Card>

      <DankbarkeitsChallenge ch={ch} setCh={setCh} addPunkte={addPunkte} />
    </div>
  );
}

/* — Dankbarkeits-Challenge · 21 Tage, jeden Tag eine Dankbarkeit mehr — */
export function DankbarkeitsChallenge({ ch, setCh, addPunkte }) {
  const heute = new Date().toDateString();
  const tag = Math.min(Math.max(ch?.tag || 1, 1), 21);
  const archiv = ch?.archiv || {};        // { 1: ["…"], 2: [...] }
  const heuteFertig = ch?.letzterTag === heute;
  const [felder, setFelder] = useState(() => Array.from({ length: tag }, (_, i) => (archiv[tag]?.[i] || "")));
  const [gefeiert, setGefeiert] = useState(false);

  useEffect(() => {
    setFelder(Array.from({ length: tag }, (_, i) => (archiv[tag]?.[i] || "")));
  }, [tag, heuteFertig]);

  const gefuellt = felder.filter((x) => x.trim()).length;
  const alleGefuellt = gefuellt >= tag;

  const tagAbschliessen = () => {
    if (!alleGefuellt || heuteFertig) return;
    const neu = {
      ...(ch || {}),
      archiv: { ...archiv, [tag]: felder.map((x) => x.trim()) },
      letzterTag: heute,
      tag,
      fertig: tag >= 21,
    };
    setCh(neu);
    setGefeiert(true);
    if (addPunkte) addPunkte(10 + tag, `Tag ${tag}: ${tag} Dankbarkeiten`);
    logEvent("challenge_tag", "dankbarkeit");
    setTimeout(() => setGefeiert(false), 4000);
  };

  const naechsterTag = () => {
    setGefeiert(false);
    setCh({ ...(ch || {}), tag: Math.min(tag + 1, 21), letzterTag: null });
  };

  const gesamt = Object.values(archiv).reduce((s, arr) => s + arr.length, 0);

  return (
    <>
      <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 140%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>🏆 Dankbarkeits-Challenge · 21 Tage</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#FFF3F0", lineHeight: 1.65 }}>
          <strong>So funktioniert's:</strong> Du schreibst 21 Tage lang deine Dankbarkeiten auf — und <strong>mit jedem Tag eine mehr</strong>.
          An Tag 1 eine, an Tag 4 vier, an Tag 21 einundzwanzig. So lernt dein Blick, immer mehr Schönes zu sehen.
        </p>
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,.14)", borderRadius: 12 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.goldPale, fontWeight: 700, marginBottom: 5 }}>Beispiel · Tag 4</div>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13.5, color: "#FFF3F0", lineHeight: 1.7 }}>
            Ich bin dankbar für die schöne Rückmeldung meiner Kollegin.<br />
            Ich bin dankbar für das Telefonat mit meiner Freundin.<br />
            Ich bin dankbar für den schönen Sonnenaufgang.<br />
            Ich bin dankbar für den Guten-Morgen-Gruß von meinem Schatz.
          </div>
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 9, borderRadius: 8, background: "rgba(255,255,255,.25)", overflow: "hidden" }}>
            <div style={{ width: `${((heuteFertig ? tag : tag - 1) / 21) * 100}%`, height: "100%", background: C.goldPale, borderRadius: 8, transition: "width .5s" }} />
          </div>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>Tag {tag}/21</span>
        </div>
      </Card>

      {ch?.fertig && tag >= 21 && heuteFertig ? (
        <Card style={{ textAlign: "center", background: C.goldPale }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌟</div>
          <H size={19} style={{ marginBottom: 8 }}>21 Tage — du hast es geschafft!</H>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>
            Insgesamt <strong>{gesamt} Dankbarkeiten</strong> hast du aufgeschrieben. Dein Blick hat sich verändert — und das bleibt.
          </p>
        </Card>
      ) : heuteFertig ? (
        <Card style={{ textAlign: "center", background: C.roseSoft, border: "none", animation: gefeiert ? "fadeUp .5s ease" : "none" }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>🎉</div>
          <H size={17} style={{ marginBottom: 6 }}>Tag {tag} geschafft — {tag} {tag === 1 ? "Dankbarkeit" : "Dankbarkeiten"}!</H>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.6 }}>
            Morgen wartet Tag {tag + 1} — dann sind es {tag + 1}. Du schaffst das.
          </p>
          <Btn small onClick={naechsterTag}>Tag {tag + 1} starten →</Btn>
        </Card>
      ) : (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <Eyebrow color={C.plum}>Tag {tag} · {tag} {tag === 1 ? "Dankbarkeit" : "Dankbarkeiten"}</Eyebrow>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: alleGefuellt ? C.sage : C.ink }}>{gefuellt}/{tag}</span>
          </div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.6, marginBottom: 14 }}>
            Wofür bist du heute dankbar? Ganz konkrete kleine Dinge wirken am stärksten.
          </p>
          <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
            {felder.map((f, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 5, background: f.trim() ? `linear-gradient(90deg, ${C.gold}, ${C.rose})` : C.beige }} />
            ))}
          </div>
          {felder.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: f.trim() ? C.gold : C.line, width: 18, textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
              <input
                value={f}
                onChange={(e) => setFelder(felder.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="Ich bin dankbar für …"
                style={{
                  flex: 1, minWidth: 0, padding: "11px 13px", fontSize: 14.5,
                  fontFamily: "Georgia, serif", fontStyle: "italic",
                  border: `1.5px solid ${f.trim() ? C.goldSoft : C.line}`, borderRadius: 12,
                  background: f.trim() ? C.goldPale : C.cream, color: C.espresso, outline: "none",
                }}
              />
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <Btn full onClick={tagAbschliessen} disabled={!alleGefuellt}>
              {alleGefuellt ? `Tag ${tag} abschließen (+${10 + tag} ✨)` : `Noch ${tag - gefuellt} ${tag - gefuellt === 1 ? "Dankbarkeit" : "Dankbarkeiten"}`}
            </Btn>
          </div>
        </Card>
      )}

      {gesamt > 0 && (
        <Card style={{ marginTop: 14 }}>
          <Eyebrow color={C.ink}>Deine gesammelten Dankbarkeiten ({gesamt})</Eyebrow>
          {Object.keys(archiv).sort((a, b) => b - a).map((d) => (
            <div key={d} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 6 }}>Tag {d}</div>
              {archiv[d].map((x, i) => (
                <div key={i} style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.espresso, lineHeight: 1.7 }}>🤍 {x}</div>
              ))}
            </div>
          ))}
        </Card>
      )}

      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "center", marginTop: 14, lineHeight: 1.6, opacity: 0.85 }}>
        Tipp: Wiederhole dich ruhig nicht — such jeden Tag neue Momente. Genau darin liegt die Kraft dieser Übung.
      </p>
    </>
  );
}

/* — Zukunftsbrief (Brief an dein zukünftiges Ich · Methode: zeitliche Distanzierung) — */
export function Brief({ briefe, setBriefe, addPunkte }) {
  const [text, setText] = useState("");
  const [offen, setOffen] = useState(null);

  const senden = () => {
    if (!text.trim()) return;
    setBriefe([{
      txt: text.trim(),
      geschrieben: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }),
    }, ...briefe]);
    setText("");
    if (addPunkte) addPunkte(10, "Zukunftsbrief geschrieben");
  };

  return (
    <div>
      <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 150%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>💌 Zukunftsbrief</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#FFF3F0", lineHeight: 1.6 }}>
          Ein Brief an dein zukünftiges Ich — schreib dir selbst deine Wünsche und Worte von heute.
        </p>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Liebe Ich,\n\nwenn du das liest, dann …"}
          rows={7}
          style={{ width: "100%", padding: "15px 16px", fontSize: 15.5, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, marginBottom: 12, outline: "none", resize: "vertical", lineHeight: 1.6 }}
        />
        <Btn full onClick={senden}>Brief speichern 💌</Btn>
      </Card>

      {briefe.length > 0 && (
        <>
          <Eyebrow color={C.ink}>Deine Zukunftsbriefe</Eyebrow>
          {briefe.map((b, i) => (
            <Card key={i} onClick={() => setOffen(offen === i ? null : i)} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 26 }}>{offen === i ? "📖" : "✉️"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700, color: C.espresso }}>Geschrieben am {b.geschrieben}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.gold, marginTop: 2 }}>{offen === i ? "Tippen zum Schließen" : "Tippen zum Lesen"}</div>
                </div>
                <div style={{ fontSize: 15, color: C.gold }}>{offen === i ? "▾" : "›"}</div>
              </div>
              {offen === i && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{b.txt}</p>
                  <div style={{ marginTop: 12, background: C.goldPale, borderRadius: 12, padding: "10px 13px" }}>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, fontWeight: 700, color: C.plum }}>🪞 Reflexion</div>
                    <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginTop: 3 }}>Was hat sich seitdem verändert? Was möchtest du deinem heutigen Ich sagen?</p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

/* — Money Mind — */
export function MoneyMind({ mm, setMm, addPunkte }) {
  const [note, setNote] = useState("");
  const di = dayIndex();
  const AFFS = [
    "Geld ist Energie — und sie fließt gern zu mir.",
    "Ich darf gut verdienen mit dem, was ich liebe.",
    "Fülle ist mein natürlicher Zustand.",
    "Ich treffe klare, ruhige Entscheidungen über mein Geld.",
    "Mein Wert wächst — und mein Einkommen wächst mit.",
  ];
  const PROMPTS = [
    "Welcher Glaubenssatz über Geld begleitet dich aus deiner Kindheit?",
    "Wofür hast du heute Geld ausgegeben, das dich wirklich genährt hat?",
    "Was würdest du tun, wenn Geld keine Rolle spielen würde?",
    "Welche Einnahme-Idee trägst du schon lange in dir?",
    "Wie fühlt sich finanzielle Freiheit in deinem Körper an?",
  ];

  const save = () => {
    if (!note.trim()) return;
    setMm([{ date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" }), txt: note.trim() }, ...mm]);
    setNote("");
    if (addPunkte) addPunkte(5, "Fülle");
  };

  return (
    <div>
      <Card style={{ marginBottom: 14, background: `linear-gradient(150deg, #3E5C46, ${C.sage} 160%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>💰 Fülle-Affirmation des Tages</Eyebrow>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 18, color: "#F5FAF2", lineHeight: 1.5 }}>
          „{AFFS[di % AFFS.length]}"
        </p>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <Eyebrow color={C.plum}>✍️ Fülle-Impuls</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, lineHeight: 1.55, marginBottom: 12, fontWeight: 600 }}>
          {PROMPTS[di % PROMPTS.length]}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Schreib frei — ohne Bewertung …"
          rows={4}
          style={{ width: "100%", padding: "14px 15px", fontSize: 15, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, marginBottom: 12, outline: "none", resize: "vertical" }}
        />
        <Btn full onClick={save}>Notiz speichern</Btn>
      </Card>

      {mm.length > 0 && (
        <>
          <Eyebrow color={C.ink}>Deine Fülle-Notizen</Eyebrow>
          {mm.map((e, i) => (
            <Card key={i} style={{ marginBottom: 10, padding: 16 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.sage, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{e.date}</div>
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14.5, color: C.espresso, lineHeight: 1.6 }}>{e.txt}</div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

