// Fortschritt.jsx — Fortschritt, Punkte, Abzeichen und Belohnungen.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { useState } from "react";
import { BADGES } from "../daten/inhalte";
import { WochenCheckin, Wochenbild, coachingIntelligenz } from "./CoachIntelligenz";
import { Btn, Card, Eyebrow, H, TeilenBtn } from "../ui/basis";
import { C } from "../ui/tema";

export function Fortschritt({ streak, entries, punkte, energie, aufgaben, ch369, checkins, setCheckins, addPunkte, prefs, setPrefs, twinTon = "", go }) {
  const ci = coachingIntelligenz({ energie, entries, aufgaben, streak, ch369 });
  const week = [3, 2, 4, 1, 3, 2, 4];
  const max = Math.max(...week);
  const index = ci.index;
  const trendUp = week[6] >= week[5];
  return (
    <div style={{ padding: "12px 0" }}>
      <Eyebrow>Coaching-Intelligenz</Eyebrow>
      <H size={25} style={{ marginBottom: 16 }}>Dein Wohlbefinden im Blick</H>

      {/* Wohlbefindens-Index */}
      <Card style={{ marginBottom: 14, textAlign: "center", background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 140%)`, border: "none" }}>
        <Eyebrow color={C.goldPale}>Wohlbefindens-Index</Eyebrow>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 52, color: "#FFF8F0", lineHeight: 1.1 }}>{index}<span style={{ fontSize: 22 }}>/100</span></div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#FFF3F0", fontWeight: 600 }}>{trendUp ? "↑ steigend diese Woche" : "→ stabil diese Woche"}</div>
        <div style={{ height: 8, borderRadius: 6, background: "rgba(255,255,255,.25)", overflow: "hidden", margin: "12px 6px 8px" }}>
          <div style={{ width: `${index}%`, height: "100%", borderRadius: 6, background: "#FFF8F0" }} />
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#FFF3F0", opacity: 0.9, lineHeight: 1.5 }}>
          Aus deinen täglichen Signalen (Energie, Journal, Aufgaben, Streak) berechnet. Mit deiner Einwilligung sieht deine Coachin diesen Verlauf.
        </p>
      </Card>

      {streak > 0 && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <TeilenBtn
            eyebrow="Mein Weg"
            titel={`${streak} Tage am Stück`}
            text="Jeden Tag ein kleiner Schritt für mich."
            beschriftung="Meinen Streak teilen"
          />
        </div>
      )}

      <WochenCheckin checkins={checkins} setCheckins={setCheckins} addPunkte={addPunkte} prefs={prefs} setPrefs={setPrefs} />

      <Wochenbild entries={entries} checkins={checkins} streak={streak} prefs={prefs} setPrefs={setPrefs} addPunkte={addPunkte} twinTon={twinTon} />

      {/* Frühwarnung (aus der Analyse-Engine) */}
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

      {/* Empfehlung (ilho, aus der Analyse) */}
      <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "flex-start", background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>🌿</div>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold }}>ilho empfiehlt</div>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.espresso, lineHeight: 1.55, marginTop: 3 }}>
            Dein schwächster Bereich ist gerade <strong>{ci.schwaechster}</strong>. Fokus diese Woche: {ci.empfehlung}. 🤍
          </p>
        </div>
      </Card>

      {/* Coach-Briefing wird im Hintergrund erzeugt (ci.briefing) und nur mit Einwilligung
          an die Coachin übermittelt — in der Klientinnen-Ansicht bewusst nicht sichtbar. */}

      <Card style={{ textAlign: "center", marginBottom: 14, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`, border: "none" }}>
        <div style={{ fontSize: 38 }}>🔥</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 42, color: C.plum }}>{streak}</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, fontWeight: 600 }}>Tage in Folge aktiv</div>
      </Card>

      {(() => {
        const STUFEN = ["Erwachen", "Aufblühen", "Strahlen", "Fülle", "Göttin"];
        const lvl = Math.min(5, Math.floor((punkte || 0) / 150) + 1);
        const next = lvl < 5 ? lvl * 150 : null;
        const pct = next ? Math.min(100, Math.round(((punkte || 0) / next) * 100)) : 100;
        return (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <Eyebrow color={C.plum}>✨ Lichtpunkte</Eyebrow>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.espresso }}>{punkte}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Stufe {lvl}</div>
                <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 17, color: C.plum }}>{STUFEN[lvl - 1]}</div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: C.beige, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})` }} />
            </div>
            {next && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 7 }}>Noch {next - punkte} Punkte bis „{STUFEN[lvl]}" — sammle täglich: Karte ziehen, Journal, Challenge & Rituale ✨</div>}
          </Card>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.espresso }}>{12 + entries.length}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>Tagebuch-Einträge</div>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.espresso }}>4 h 20</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>Meditation gesamt</div>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Eyebrow color={C.plum}>Energie-Trend · 7 Tage</Eyebrow>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90, marginTop: 8 }}>
          {week.map((v, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: `${(v / max) * 70}px`, borderRadius: 6, background: i === 6 ? `linear-gradient(180deg, ${C.gold}, ${C.rose})` : C.beige }} />
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, marginTop: 6 }}>{["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][i]}</div>
            </div>
          ))}
        </div>
      </Card>

      <Eyebrow>Deine Abzeichen</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
        {BADGES.map((b) => (
          <Card key={b.t} style={{ textAlign: "center", padding: 14, opacity: b.got ? 1 : 0.42 }}>
            <div style={{ fontSize: 26 }}>{b.icon}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.espresso, fontWeight: 600, marginTop: 5 }}>{b.t}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Lichtpunkte-Modal: Meilensteine & Belohnungen ── */

export const MEILENSTEINE = [120, 300, 500, 1000, 5000];

export const BELOHNUNGEN = [
  { p: 300, icon: "🎓", t: "30 % Rabatt auf einen Kurs", s: "Einlösbar auf der Plattform" },
  { p: 500, icon: "🛍️", t: "10 € Shop-Gutschein", s: "Für den smile2go-Shop" },
  { p: 1000, icon: "🌕", t: "Exklusive Vollmond-Meditation", s: "Nur für Sammlerinnen" },
];

/* Abzeichen: erreichbar statt endlos. Alles hier ist in Wochen zu schaffen,
   nicht in Jahren — sonst ist die Liste eine Mahnung statt einer Freude. */
export const ABZEICHEN = [
  { g: "Anfang", id: "erster", icon: "🌱", t: "Erster Eintrag", s: "Schreib deinen ersten Tagebucheintrag", ziel: 1, k: "eintraege" },
  { g: "Anfang", id: "karte", icon: "🃏", t: "Erste Karte", s: "Zieh deine erste Tageskarte", ziel: 1, k: "karte" },
  { g: "Anfang", id: "ritual", icon: "🕯️", t: "Erstes Ritual", s: "Nähre ein Ritual in der Woche", ziel: 1, k: "rituale" },
  { g: "Anfang", id: "woche1", icon: "🔥", t: "Erste Woche", s: "Sieben Tage am Stück da sein", ziel: 7, k: "serie" },

  { g: "Schreiben", id: "e10", icon: "📓", t: "Zehn Einträge", s: "Zehn Mal deinen Raum genutzt", ziel: 10, k: "eintraege" },
  { g: "Schreiben", id: "e50", icon: "📚", t: "Fünfzig Einträge", s: "Fünfzig Mal aufgeschrieben, was war", ziel: 50, k: "eintraege" },
  { g: "Schreiben", id: "w1000", icon: "✍️", t: "Tausend Wörter", s: "Insgesamt 1000 Wörter geschrieben", ziel: 1000, k: "woerter" },
  { g: "Schreiben", id: "w5000", icon: "🖋️", t: "Fünftausend Wörter", s: "Insgesamt 5000 Wörter geschrieben", ziel: 5000, k: "woerter" },
  { g: "Schreiben", id: "brief", icon: "💌", t: "Brief an dich", s: "Schreib einen Brief an dein Zukunfts-Ich", ziel: 1, k: "briefe" },

  { g: "Ankommen", id: "a5", icon: "🖐️", t: "Fünf Momente", s: "Fünf achtsame Momente gesammelt", ziel: 5, k: "achtsam" },
  { g: "Ankommen", id: "a25", icon: "🌊", t: "Fünfundzwanzig Momente", s: "25 achtsame Momente gesammelt", ziel: 25, k: "achtsam" },
  { g: "Ankommen", id: "q10", icon: "🌿", t: "Zehn mal Qigong", s: "Zehn Einheiten Die Acht Brokate", ziel: 10, k: "qigong" },
  { g: "Ankommen", id: "d10", icon: "🤍", t: "Zehn Dankbarkeits-Tage", s: "An zehn Tagen drei Dinge notiert", ziel: 10, k: "dank" },
  { g: "Ankommen", id: "l10", icon: "🕊️", t: "Zehn mal losgelassen", s: "Zehn Dinge bewusst abgelegt", ziel: 10, k: "losgelassen" },

  { g: "Dranbleiben", id: "s3", icon: "✨", t: "Drei Tage", s: "Drei Tage Serie", ziel: 3, k: "serie" },
  { g: "Dranbleiben", id: "s21", icon: "🌙", t: "Einundzwanzig Tage", s: "21 Tage Serie — eine Gewohnheit entsteht", ziel: 21, k: "serie" },
  { g: "Dranbleiben", id: "s40", icon: "🌕", t: "Vierzig Tage", s: "40 Tage Serie", ziel: 40, k: "serie" },
  { g: "Dranbleiben", id: "p300", icon: "💫", t: "Dreihundert Lichtpunkte", s: "300 Lichtpunkte gesammelt", ziel: 300, k: "punkte" },

  { g: "Wege", id: "r1", icon: "🛤️", t: "Reise begonnen", s: "Eine Transformations-Reise gestartet", ziel: 1, k: "reisen" },
  { g: "Wege", id: "rf", icon: "🏔️", t: "Reise vollendet", s: "Eine Reise bis zum letzten Tag gegangen", ziel: 1, k: "reisenFertig" },
  { g: "Wege", id: "ch", icon: "🔢", t: "369 gegangen", s: "Die 369-Methode abgeschlossen", ziel: 1, k: "ch369" },
  { g: "Wege", id: "mt", icon: "🛁", t: "Me-Time gehalten", s: "Einen Termin mit dir selbst eingehalten", ziel: 1, k: "metime" },
];

export const ABZ_GRUPPEN = ["Anfang", "Schreiben", "Ankommen", "Dranbleiben", "Wege"];

export function zaehleAlles(d) {
  const arr = (x) => (Array.isArray(x) ? x : []);
  const eintraege = arr(d.entries);
  const textVon = (e) => [e.intention, (arr(e.items) || []).join(" "), e.text].filter(Boolean).join(" ");
  const woerterVon = (e) => textVon(e).trim().split(/\s+/).filter(Boolean).length;
  return {
    punkte: d.punkte || 0,
    serie: d.streak || 0,
    eintraege: eintraege.length,
    woerter: eintraege.reduce((s, e) => s + woerterVon(e), 0),
    laengster: eintraege.reduce((m, e) => Math.max(m, woerterVon(e)), 0),
    briefe: arr(d.briefe).length,
    karte: d.drawn ? 1 : 0,
    rituale: d.ritual ? Object.values(d.ritual).filter(Boolean).length : 0,
    achtsam: arr(d.achtsam).length,
    qigong: arr(d.qigong).length,
    qigongMin: arr(d.qigong).reduce((s, x) => s + (Number(x.minuten) || 0), 0),
    dank: arr(d.dank).filter((x) => x && x.datum).length,
    losgelassen: arr(d.losgelassen).filter((x) => x && x.los_am).length,
    metime: arr(d.metime).filter((x) => x && x.erledigt).length,
    reisen: arr(d.reisen).length,
    reisenFertig: arr(d.reisen).filter((r) => r.fertig).length,
    ch369: d.ch369 && d.ch369.fertig ? 1 : 0,
    checkins: arr(d.checkins).length,
  };
}

export function PunkteModal({ punkte, onClose, onEinloesen, ...daten }) {
  const [reiter, setReiter] = useState("abzeichen");
  const [alle, setAlle] = useState(false);
  const z = zaehleAlles({ punkte, ...daten });

  const mitStand = ABZEICHEN.map((a) => {
    const wert = Math.min(z[a.k] || 0, a.ziel);
    return { ...a, wert, fertig: wert >= a.ziel, anteil: a.ziel ? wert / a.ziel : 0 };
  });
  const geschafft = mitStand.filter((a) => a.fertig);
  const naechste = mitStand.filter((a) => !a.fertig).sort((x, y) => y.anteil - x.anteil).slice(0, 5);
  const naechsterMs = MEILENSTEINE.find((m) => m > punkte) || MEILENSTEINE[MEILENSTEINE.length - 1];

  const Kachel = ({ a }) => (
    <div style={{
      background: a.fertig ? `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})` : C.card,
      border: `1px solid ${a.fertig ? C.goldSoft : C.line}`, borderRadius: 14,
      padding: "12px 8px", textAlign: "center",
    }}>
      <div style={{ fontSize: 24, filter: a.fertig ? "none" : "grayscale(1)", opacity: a.fertig ? 1 : 0.4 }}>
        {a.fertig ? a.icon : "🔒"}
      </div>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, fontWeight: 700, color: C.espresso, marginTop: 5, lineHeight: 1.3 }}>{a.t}</div>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.mut, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
        {a.fertig ? "✓ geschafft" : `${a.wert}/${a.ziel}`}
      </div>
    </div>
  );

  const StatBlock = ({ titel, zeilen }) => (
    <>
      <Eyebrow color={C.plum}>{titel}</Eyebrow>
      <Card style={{ marginTop: 6, marginBottom: 14, paddingTop: 2, paddingBottom: 2 }}>
        {zeilen.map(([n, w], i) => (
          <div key={n} style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
            padding: "11px 0", borderBottom: i === zeilen.length - 1 ? "none" : `1px solid ${C.line}`,
          }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink }}>{n}</span>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: C.espresso, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{w}</span>
          </div>
        ))}
      </Card>
    </>
  );

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 40, background: "rgba(58,42,34,.45)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(3px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 430, maxHeight: "88vh", overflowY: "auto",
        background: C.cream, borderRadius: "24px 24px 0 0", padding: "18px 20px 30px",
        animation: "fadeUp .35s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 3, background: C.beige, borderRadius: 22, padding: 3, flex: 1 }}>
            {[["abzeichen", "Abzeichen"], ["statistik", "Statistiken"]].map(([k, n]) => (
              <button key={k} onClick={() => setReiter(k)} style={{
                flex: 1, padding: "9px 0", borderRadius: 19, border: "none", cursor: "pointer", minHeight: 40,
                fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700,
                background: reiter === k ? C.card : "transparent", color: reiter === k ? C.plum : C.ink,
              }}>{n}</button>
            ))}
          </div>
          <button onClick={onClose} aria-label="Schließen" style={{
            background: C.card, border: `1px solid ${C.line}`, borderRadius: "50%",
            width: 38, height: 38, fontSize: 16, cursor: "pointer", color: C.ink, flexShrink: 0,
          }}>✕</button>
        </div>

        {reiter === "abzeichen" ? (
          <>
            <Card style={{ textAlign: "center", marginBottom: 16, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`, border: "none" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 42, color: C.plum, lineHeight: 1.1 }}>{geschafft.length}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: C.ink }}>
                von {ABZEICHEN.length} Abzeichen
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 8 }}>
                ✨ {punkte} Lichtpunkte · noch {Math.max(0, naechsterMs - punkte)} bis {naechsterMs}
              </div>
            </Card>

            {!alle && naechste.length > 0 && (
              <>
                <Eyebrow color={C.plum}>Deine nächsten Abzeichen</Eyebrow>
                <div style={{ marginTop: 6, marginBottom: 12 }}>
                  {naechste.map((a) => (
                    <Card key={a.id} style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center", padding: 13 }}>
                      <div style={{ fontSize: 22, opacity: 0.45 }}>{a.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{a.t}</div>
                        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 1 }}>{a.s}</div>
                        <div style={{ height: 4, borderRadius: 3, background: C.beige, marginTop: 7, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round(a.anteil * 100)}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})` }} />
                        </div>
                      </div>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: C.plum, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {a.wert}/{a.ziel}
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            <button onClick={() => setAlle(!alle)} style={{
              width: "100%", background: "none", border: "none", cursor: "pointer", minHeight: 40,
              fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum,
              textDecoration: "underline", marginBottom: 14,
            }}>
              {alle ? "Nur die nächsten zeigen" : "Alle Abzeichen anzeigen"}
            </button>

            {alle && ABZ_GRUPPEN.map((g) => (
              <div key={g} style={{ marginBottom: 16 }}>
                <Eyebrow color={C.plum}>{g}</Eyebrow>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 6 }}>
                  {mitStand.filter((a) => a.g === g).map((a) => <Kachel key={a.id} a={a} />)}
                </div>
              </div>
            ))}

            <Eyebrow color={C.plum}>🎁 Lichtpunkte einlösen</Eyebrow>
            <div style={{ marginTop: 6 }}>
              {BELOHNUNGEN.map((b) => {
                const kann = punkte >= b.p;
                return (
                  <Card key={b.t} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", opacity: kann ? 1 : 0.55 }}>
                    <span style={{ fontSize: 24 }}>{b.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{b.t}</div>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>{b.s} · {b.p} Punkte</div>
                    </div>
                    <Btn small ghost={!kann} onClick={() => kann && onEinloesen(b.p, b.t)}>{kann ? "Einlösen" : `${b.p} P`}</Btn>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 16 }}>
              {[["Lichtpunkte", z.punkte], ["Tage Serie", z.serie], ["Einträge", z.eintraege], ["Abzeichen", geschafft.length]].map(([n, w]) => (
                <Card key={n} style={{ textAlign: "center", padding: "14px 8px" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.plum, fontVariantNumeric: "tabular-nums" }}>{w}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 2 }}>{n}</div>
                </Card>
              ))}
            </div>

            <StatBlock titel="Bestwerte" zeilen={[
              ["Längster Eintrag", `${z.laengster} Wörter`],
              ["Aktuelle Serie", `${z.serie} Tage`],
              ["Qigong-Minuten", `${z.qigongMin} Min.`],
            ]} />

            <StatBlock titel="Schreiben" zeilen={[
              ["Tagebucheinträge", z.eintraege],
              ["Geschriebene Wörter", z.woerter],
              ["Briefe an dich", z.briefe],
              ["Check-Ins", z.checkins],
            ]} />

            <StatBlock titel="Ankommen" zeilen={[
              ["Achtsame Momente", z.achtsam],
              ["Qigong-Einheiten", z.qigong],
              ["Dankbarkeits-Tage", z.dank],
              ["Losgelassen", z.losgelassen],
              ["Me-Time gehalten", z.metime],
            ]} />

            <StatBlock titel="Wege" zeilen={[
              ["Reisen begonnen", z.reisen],
              ["Reisen vollendet", z.reisenFertig],
              ["369-Methode", z.ch369 ? "abgeschlossen" : "offen"],
              ["Rituale diese Woche", z.rituale],
            ]} />
          </>
        )}
      </div>
    </div>
  );
}

