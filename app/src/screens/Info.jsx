// Info.jsx — Community, App-Guide, Fragebogen, Pakete und Rechtstexte.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { herzSetzen, ladeCoachBeitraege, ladeFeed, loescheBeitrag, meldeBeitrag, schreibeBeitrag } from "../supabase";
import { useEffect, useState } from "react";
import { Absatz, Btn, Card, Eyebrow, H, RechtSeite } from "../ui/basis";
import { C } from "../ui/tema";

export function Impressum() {
  return (
    <RechtSeite title="Impressum">
      <Absatz h="Angaben gemäß § 5 DDG">Ilham Savran<br />Justinus-Kerner-Str. 22<br />80686 München · Deutschland</Absatz>
      <Absatz h="Kontakt">Telefon: [Telefonnummer]<br />E-Mail: [E-Mail-Adresse]</Absatz>
      <Absatz h="Umsatzsteuer-ID">[USt-IdNr. gemäß § 27 a UStG, falls vorhanden]</Absatz>
      <Absatz h="Verantwortlich i. S. d. § 18 Abs. 2 MStV">Ilham Savran, Anschrift wie oben</Absatz>
      <Absatz h="Hinweis">Die Inhalte von smile2go dienen der Persönlichkeitsentwicklung und ersetzen keine medizinische, psychotherapeutische oder rechtliche Beratung.</Absatz>
    </RechtSeite>
  );
}

export function Datenschutz() {
  return (
    <RechtSeite title="Datenschutzerklärung">
      <Absatz h="1 · Verantwortliche Stelle">Ilham Savran, Justinus-Kerner-Str. 22, 80686 München. Kontakt Datenschutz: [E-Mail].</Absatz>
      <Absatz h="2 · Welche Daten wir verarbeiten">Kontodaten (E-Mail, Anzeigename), deine Eingaben (Tagebuch, Energie-Check, Ziele, Aufgaben, Nachrichten) und Nutzungsdaten. Angaben zu Stimmung und Energie können Gesundheitsdaten i. S. d. Art. 9 DSGVO sein und werden nur mit deiner ausdrücklichen Einwilligung verarbeitet.</Absatz>
      <Absatz h="3 · Zwecke & Rechtsgrundlage">Bereitstellung der App und Coaching-Begleitung (Art. 6 Abs. 1 b DSGVO), gesetzliche Pflichten (Art. 6 Abs. 1 c) sowie deine Einwilligung für sensible Daten und KI-Funktionen (Art. 6 Abs. 1 a · Art. 9 Abs. 2 a).</Absatz>
      <Absatz h="4 · Hosting & Auftragsverarbeiter">Speicherung in der EU (Supabase, Region Frankfurt). Weitere Dienstleister mit AVV nach Art. 28 DSGVO: KI-Anbieter (Textanalyse), Zahlungsdienstleister, E-Mail- und Push-Dienst.</Absatz>
      <Absatz h="5 · Deine Rechte">Auskunft (15), Berichtigung (16), Löschung (17), Einschränkung (18), Datenübertragbarkeit (20), Widerspruch (21). Einwilligungen jederzeit mit Wirkung für die Zukunft widerrufbar. Beschwerderecht bei einer Aufsichtsbehörde.</Absatz>
      <Absatz h="6 · Speicherdauer">Wir speichern deine Daten, solange dein Konto besteht. Bei Kontolöschung werden alle zugeordneten Daten entfernt (Recht auf Vergessen), soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</Absatz>
    </RechtSeite>
  );
}

/* ── Community-Feed · echte Beiträge aus der Datenbank, mit Meldefunktion ── */

export function Community({ addPunkte, alias, anon, bindung }) {
  const [coachPosts, setCoachPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [neu, setNeu] = useState("");
  const [geherzt, setGeherzt] = useState({});
  const [laedt, setLaedt] = useState(true);
  const [hinweis, setHinweis] = useState("");
  const [gemeldet, setGemeldet] = useState({});

  const name = anon ? "Anonym" : (alias?.trim() || "Anonym");

  const laden = async () => {
    const daten = await ladeFeed();
    setPosts(daten);
    setLaedt(false);
  };
  useEffect(() => { laden(); }, []);

  // „Neu von deiner Coachin" — ihre Inhalte landen in der App, nicht nur auf Instagram.
  useEffect(() => {
    if (bindung?.coach_id) ladeCoachBeitraege(bindung.coach_id, 5).then(setCoachPosts);
  }, [bindung?.coach_id]);

  const teilen = async () => {
    const text = neu.trim();
    if (!text) return;
    setNeu("");
    const post = await schreibeBeitrag(text, name);
    if (!post) { setHinweis("Beitrag konnte nicht gespeichert werden."); setNeu(text); return; }
    setPosts((ps) => [post, ...ps]);
    addPunkte?.(5, "Community-Beitrag");
  };

  const herz = async (id) => {
    if (geherzt[id]) return;
    setGeherzt((g) => ({ ...g, [id]: true }));
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, herzen: (p.herzen || 0) + 1 } : p)));
    const ok = await herzSetzen(id);
    if (!ok) setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, herzen: Math.max(0, (p.herzen || 1) - 1) } : p)));
  };

  const melden = async (id) => {
    const grund = window.prompt("Was stimmt mit diesem Beitrag nicht? (kurz)");
    if (grund === null) return;
    const ok = await meldeBeitrag(id, grund);
    setGemeldet((m) => ({ ...m, [id]: true }));
    setHinweis(ok ? "Danke — wir schauen uns den Beitrag an." : "Melden hat nicht geklappt.");
    setTimeout(() => setHinweis(""), 3500);
  };

  const loeschen = async (id) => {
    if (!window.confirm("Diesen Beitrag löschen?")) return;
    const ok = await loescheBeitrag(id);
    if (ok) setPosts((ps) => ps.filter((p) => p.id !== id));
  };

  const zeit = (iso) => {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 2) return "gerade eben";
    if (min < 60) return `vor ${min} Min`;
    if (min < 1440) return `vor ${Math.round(min / 60)} Std`;
    return new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  };

  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Community</Eyebrow>
      <H size={25} style={{ marginBottom: 6 }}>Frauen unterstützen Frauen</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
        Teile einen Gedanken oder feiere jemanden. Ein liebes ♥ tut mehr, als du denkst.
        Du schreibst als <strong>{name}</strong>.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={neu} onChange={(e) => setNeu(e.target.value)} onKeyDown={(e) => e.key === "Enter" && teilen()} placeholder="Etwas Schönes teilen…" style={{ flex: 1, padding: "13px 14px", fontSize: 15, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 13, background: C.card, color: C.espresso, outline: "none" }} />
        <Btn small onClick={teilen}>Teilen</Btn>
      </div>

      {hinweis && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum, background: C.roseSoft, borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>{hinweis}</div>}

      {coachPosts.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <Eyebrow color={C.plum}>Neu von {bindung?.coach_name || "deiner Coachin"}</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {coachPosts.map((b) => (
              <Card key={b.id} style={{ marginBottom: 10, background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
                {b.titel && <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, marginBottom: 4 }}>{b.titel}</div>}
                <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.6, margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{b.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink }}>
                    {new Date(b.veroeffentlicht_am).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                  </span>
                  {b.extern_url && (
                    <a href={b.extern_url} target="_blank" rel="noreferrer" style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: C.plum, textDecoration: "underline" }}>
                      {b.quelle === "instagram" ? "Auf Instagram ansehen" : b.quelle === "youtube" ? "Auf YouTube ansehen" : "Ansehen"} ↗
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {laedt && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink }}>Lade Beiträge …</p>}

      {!laedt && posts.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🌸</div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            Hier ist noch still. Magst du den ersten Gedanken teilen?
          </p>
        </Card>
      )}

      {posts.map((p) => (
        <Card key={p.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: C.plum, fontWeight: 700, flexShrink: 0 }}>{(p.alias || "A").charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{p.alias}</span>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 1 }}>{zeit(p.created_at)}</div>
            </div>
          </div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.espresso, lineHeight: 1.6, margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{p.text}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => herz(p.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: geherzt[p.id] ? "default" : "pointer", color: geherzt[p.id] ? C.rose : C.ink, fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, padding: 0, minHeight: 36 }}>
              <span style={{ fontSize: 16 }}>{geherzt[p.id] ? "❤️" : "🤍"}</span> {p.herzen || 0}
            </button>
            <button onClick={() => melden(p.id)} disabled={gemeldet[p.id]} style={{ background: "none", border: "none", cursor: gemeldet[p.id] ? "default" : "pointer", color: C.ink, opacity: 0.6, fontFamily: "system-ui, sans-serif", fontSize: 12, padding: 0, minHeight: 36 }}>
              {gemeldet[p.id] ? "gemeldet" : "melden"}
            </button>
            <button onClick={() => loeschen(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink, opacity: 0.6, fontFamily: "system-ui, sans-serif", fontSize: 12, padding: 0, minHeight: 36, marginLeft: "auto" }}>
              löschen
            </button>
          </div>
        </Card>
      ))}

      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.75, lineHeight: 1.6, marginTop: 18 }}>
        Beiträge, die mehrfach gemeldet werden, verschwinden automatisch aus dem Feed, bis sie geprüft sind.
        Eigene Beiträge kannst du jederzeit selbst löschen.
      </p>
    </div>
  );
}

/* ── App-Guide (mit Begrüßungsvideo von Anja) ── */
export function AppGuide() {
  const [ab, setAb] = useState(false);
  const schritte = [
    { icon: "☀️", t: "Heute", s: "Dein Tagesüberblick & tägliche Impulse." },
    { icon: "🔮", t: "Orakel", s: "Tageskarte, Horoskop & Mystik." },
    { icon: "✨", t: "ilho", s: "Dein KI-Begleiter — jederzeit für dich da." },
    { icon: "📔", t: "Journal", s: "Tagebuch, Zukunftsbrief, Fülle & Rituale." },
    { icon: "✦", t: "Mehr", s: "Coaching, Ziele, Challenges & Community." },
  ];
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>App-Guide</Eyebrow>
      <H size={25} style={{ marginBottom: 12 }}>Willkommen bei smile2go 🤍</H>
      <Card style={{ marginBottom: 20, padding: 10, background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        {!ab ? (
          <button onClick={() => setAb(true)} style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <span style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(217,110,139,.35)" }}>▶</span>
            <span style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 16.5, color: C.espresso }}>Begrüßungsvideo ansehen</span>
              <span style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Anja begrüßt dich persönlich · 1 Video</span>
            </span>
          </button>
        ) : (
          <video controls autoPlay playsInline src="/begruessung_klein.mp4" style={{ width: "100%", borderRadius: 12, background: C.espresso, maxHeight: 380 }}>
            Dein Browser kann das Video nicht abspielen.
          </video>
        )}
      </Card>
      <Eyebrow color={C.plum}>So findest du dich zurecht</Eyebrow>
      <div style={{ marginTop: 8 }}>
        {schritte.map((s) => (
          <Card key={s.t} style={{ marginBottom: 10, display: "flex", gap: 13, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{s.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>{s.s}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Intake-Fragebogen: Onboarding vor der ersten Session (die Coachin sieht die Antworten) ── */

export const FB_FOKUS = [
  { e: "🥰", t: "Selbstliebe" }, { e: "😌", t: "Stress & Ruhe" }, { e: "✨", t: "Positives Denken" },
  { e: "💪", t: "Gesundheit" }, { e: "💗", t: "Beziehungen" }, { e: "🌱", t: "Fülle & Finanzen" },
];

export const FB_RHYTHMUS = ["Gerade nicht", "1–2× pro Woche", "3–4× pro Woche", "Jeden Tag"];

export const FB_THEMEN = ["Selbstfürsorge", "Stress & Ruhe", "Selbstvertrauen", "Beziehungen", "Beruf & Sinn", "Grenzen setzen", "Fülle & Finanzen", "Spiritualität"];

export const FB_TOTAL = 6;

export function Fragebogen({ intake, setIntake, addPunkte }) {
  const [f, setF] = useState(intake || { fokus: "", rhythmus: "", themen: [], energie: 5, ziel: "" });
  const [step, setStep] = useState(intake ? 99 : 0);
  const [gesendet, setGesendet] = useState(!!intake);

  const toggleThema = (t) => setF((p) => ({ ...p, themen: p.themen.includes(t) ? p.themen.filter((x) => x !== t) : [...p.themen, t] }));
  const senden = () => { setIntake(f); setGesendet(true); setStep(99); if (addPunkte) addPunkte(15, "Fragebogen ausgefüllt"); };

  const cardSel = (aktiv) => ({ width: "100%", textAlign: "left", cursor: "pointer", padding: "16px 18px", borderRadius: 16, marginBottom: 11, border: `1.5px solid ${aktiv ? C.rose : C.line}`, background: aktiv ? C.roseSoft : C.card, fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 600, color: aktiv ? C.plum : C.espresso, display: "flex", alignItems: "center", gap: 12 });
  const heroGrad = `linear-gradient(160deg, ${C.goldPale}, ${C.roseSoft} 120%)`;

  // — Abschluss / Zusammenfassung —
  if (gesendet)
    return (
      <div style={{ padding: "20px 20px" }}>
        <Card style={{ textAlign: "center", background: heroGrad, border: "none", marginBottom: 16, padding: "26px 20px" }}>
          <div style={{ fontSize: 42, marginBottom: 6 }}>🤍</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.espresso }}>Danke — alles angekommen.</div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 8, lineHeight: 1.5 }}>Deine Coachin liest deine Antworten vor eurer ersten Session. So startet ihr direkt beim Wesentlichen.</p>
        </Card>
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          {[["Fokus", f.fokus], ["Rhythmus", f.rhythmus], ["Themen", (f.themen || []).join(", ") || "—"], ["Energie", `${f.energie}/10`], ["Ziel", f.ziel]].map(([k, v]) => (
            <Card key={k} style={{ display: "flex", gap: 12 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold, minWidth: 84 }}>{k}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>{v || "—"}</div>
            </Card>
          ))}
        </div>
        <Btn full ghost onClick={() => { setGesendet(false); setStep(1); }}>Antworten bearbeiten</Btn>
      </div>
    );

  // — Willkommen (Schritt 0) —
  if (step === 0)
    return (
      <div style={{ padding: "32px 22px", textAlign: "center" }}>
        <div style={{ margin: "20px auto 24px", width: 132, height: 132, borderRadius: 34, background: heroGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🌸</div>
        <Eyebrow>Willkommen bei smile2go</Eyebrow>
        <H size={27} style={{ margin: "6px 0 10px" }}>Schön, dass du da bist</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14.5, color: C.ink, lineHeight: 1.6, marginBottom: 8, maxWidth: 320, marginInline: "auto" }}>
          Ein paar kurze Fragen — damit deine Coachin dich schon kennt, bevor ihr das erste Mal sprecht.
        </p>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, opacity: 0.8, marginBottom: 28 }}>Dauert unter 1 Minute · 🇪🇺 DSGVO-konform</p>
        <Btn full onClick={() => setStep(1)}>Los geht’s</Btn>
      </div>
    );

  // — Fragenschritte —
  const kannWeiter = (step === 1 && f.fokus) || (step === 2 && f.rhythmus) || step === 3 || step === 4 || step === 5 || step === 6;
  const weiter = () => (step === 6 ? senden() : setStep(step + 1));

  return (
    <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", minHeight: "70vh" }}>
      {/* Kopf: Zurück + Fortschritt */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={() => setStep(step - 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${C.line}`, background: C.card, cursor: "pointer", fontSize: 16, color: C.ink, flexShrink: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, borderRadius: 4, background: C.beige, overflow: "hidden" }}>
            <div style={{ width: `${(step / FB_TOTAL) * 100}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})`, transition: "width .3s ease" }} />
          </div>
        </div>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, fontWeight: 700, color: C.ink, flexShrink: 0 }}>{step}/{FB_TOTAL}</span>
      </div>

      <div style={{ flex: 1, animation: "fadeUp .35s ease" }}>
        {step === 1 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Was möchtest du gerade stärken?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>Wähle deinen wichtigsten Fokus.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {FB_FOKUS.map((x) => {
                const on = f.fokus === x.t;
                return (
                  <button key={x.t} onClick={() => setF({ ...f, fokus: x.t })} style={{ cursor: "pointer", padding: "18px 10px", borderRadius: 16, border: `1.5px solid ${on ? C.rose : C.line}`, background: on ? C.roseSoft : C.card, textAlign: "center" }}>
                    <div style={{ fontSize: 30 }}>{x.e}</div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: on ? C.plum : C.espresso, marginTop: 6 }}>{x.t}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Wie oft möchtest du an dir arbeiten?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>Wähle, was sich realistisch anfühlt.</p>
            {FB_RHYTHMUS.map((r) => (
              <button key={r} onClick={() => setF({ ...f, rhythmus: r })} style={cardSel(f.rhythmus === r)}>{r}</button>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Deine Themen</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>Wähle eins oder mehrere.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {FB_THEMEN.map((t) => {
                const on = f.themen.includes(t);
                return (
                  <button key={t} onClick={() => toggleThema(t)} style={{ padding: "11px 16px", borderRadius: 22, cursor: "pointer", border: `1.5px solid ${on ? C.rose : C.line}`, background: on ? C.roseSoft : C.card, fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 600, color: on ? C.plum : C.ink }}>{t}</button>
                );
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Wie ist deine Energie heute?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 26 }}>Ganz ehrlich — es gibt kein Richtig.</p>
            <div style={{ textAlign: "center", fontFamily: "Georgia, serif", fontSize: 52, color: C.plum, marginBottom: 8 }}>{f.energie}<span style={{ fontSize: 22, color: C.ink }}>/10</span></div>
            <input type="range" min={1} max={10} value={f.energie} onChange={(e) => setF({ ...f, energie: +e.target.value })} style={{ width: "100%", accentColor: C.gold }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 6 }}><span>erschöpft</span><span>voller Kraft</span></div>
          </>
        )}

        {step === 5 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Was möchtest du erreichen?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>In deinen Worten — optional.</p>
            <textarea rows={4} value={f.ziel} onChange={(e) => setF({ ...f, ziel: e.target.value })} placeholder="z. B. „Ich möchte abends besser abschalten können.“"
              style={{ width: "100%", padding: "14px 15px", fontSize: 15, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </>
        )}

        {step === 6 && (
          <>
            <H size={23} style={{ marginBottom: 4 }}>Passt das so?</H>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 18 }}>Deine Coachin bekommt diese Übersicht.</p>
            <div style={{ display: "grid", gap: 10 }}>
              {[["Fokus", f.fokus], ["Rhythmus", f.rhythmus], ["Themen", (f.themen || []).join(", ") || "—"], ["Energie", `${f.energie}/10`], ["Ziel", f.ziel || "—"]].map(([k, v]) => (
                <Card key={k} style={{ display: "flex", gap: 12 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold, minWidth: 84 }}>{k}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>{v || "—"}</div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <Btn full ghost={!kannWeiter} onClick={() => kannWeiter && weiter()}>{step === 6 ? "An meine Coachin senden" : "Weiter"}</Btn>
        {step === 6 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "center", marginTop: 12 }}>🇪🇺 DSGVO-konform · nur für dich & deine Coachin sichtbar</p>}
      </div>
    </div>
  );
}

/* ── Coaching-Pakete & Buchung (Anfrage-Flow · keine Zahlung in der App) ── */

export const PAKETE = [
  { icon: "🌱", t: "Kennenlern-Gespräch", dauer: "20 Min · kostenlos", preis: "0 €", desc: "Unverbindliches Erstgespräch, um zu spüren, ob es zwischen euch passt.", cta: "Kostenlos anfragen" },
  { icon: "🤍", t: "Einzelsession", dauer: "60 Min · Zoom", preis: "120 €", desc: "Eine fokussierte 1:1 Session für ein konkretes Thema.", cta: "Anfragen" },
  { icon: "💎", t: "Paket „Innere Klarheit“", dauer: "4 Sessions à 60 Min", preis: "480 €", desc: "Begleitung über 8 Wochen inkl. Workbook & Nachrichten-Support.", cta: "Anfragen", best: true },
  { icon: "🌷", t: "Retreat-Tag", dauer: "1 Tag · in Präsenz", preis: "auf Anfrage", desc: "Ein ganzer Tag Ruhe & Wachstum in kleiner Gruppe.", cta: "Interesse melden" },
];

export function Pakete({ addPunkte, go }) {
  const [angefragt, setAngefragt] = useState(null);
  const anfragen = (p) => { setAngefragt(p.t); if (addPunkte) addPunkte(5, "Paket angefragt"); };
  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Coaching-Pakete</Eyebrow>
      <H size={24} style={{ marginBottom: 8 }}>Wähle deine Begleitung</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 18 }}>
        Sende eine unverbindliche Anfrage — deine Coachin meldet sich mit den nächsten Schritten. Die Bezahlung läuft sicher außerhalb der App.
      </p>
      {PAKETE.map((p) => (
        <Card key={p.t} style={{ marginBottom: 12, border: p.best ? `1.5px solid ${C.gold}` : `1px solid ${C.line}`, background: p.best ? `linear-gradient(135deg, ${C.card}, ${C.goldPale})` : C.card }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15.5, color: C.espresso }}>{p.t}{p.best && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.plum, background: C.roseSoft, borderRadius: 8, padding: "2px 7px", marginLeft: 8 }}>beliebt</span>}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.plum, whiteSpace: "nowrap" }}>{p.preis}</div>
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{p.dauer}</div>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, margin: "8px 0 12px" }}>{p.desc}</p>
              {angefragt === p.t
                ? <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: C.sage }}>✓ Anfrage gesendet — deine Coachin meldet sich 🤍</div>
                : <Btn small onClick={() => anfragen(p)}>{p.cta}</Btn>}
            </div>
          </div>
        </Card>
      ))}
      <Card style={{ marginTop: 6, display: "flex", gap: 12, alignItems: "center", background: C.beige }}>
        <span style={{ fontSize: 22 }}>📅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Schon Kundin?</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink }}>Buche direkt einen freien Termin.</div>
        </div>
        <Btn small ghost onClick={() => go("buchen")}>Termin buchen</Btn>
      </Card>
    </div>
  );
}

