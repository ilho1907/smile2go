// Office.jsx — Marken-Baukasten: Logo, Palette, Vorlagen, Dokumente.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { useEffect, useRef, useState } from "react";
import { FARBEN, STILE, VORLAGEN, docHtml, farbenAusLogo, lesbar, logoVerkleinern, mischen, paletteAus, stilVon } from "../lib/farben";
import { ILHO_SYSTEM, askLuma } from "../lib/ki";
import { Btn, Card, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

// Zeigt sofort, wie die Marke wirkt — dieselben Schriften und Farben wie im Dokument.
export function MarkeVorschau({ setup, logoImg }) {
  const st = stilVon(setup.stil);
  const f1 = setup.farbe || FARBEN[0];
  const f2 = setup.farbe2 || f1;
  const pale = setup.farbePale || mischen(f1, "#FFFFFF", 0.9);
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 16px 14px", margin: "10px 0 16px" }}>
      <div style={{ borderBottom: `${st.linie}px solid ${f1}`, paddingBottom: 11, display: "flex", alignItems: "center", gap: 9 }}>
        {logoImg
          ? <img src={logoImg} alt="" style={{ height: 34, borderRadius: st.radius }} />
          : <span style={{ fontSize: 24 }}>{setup.logo || "🌹"}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: st.kopf, letterSpacing: st.spur, textTransform: st.gross ? "uppercase" : "none", fontSize: 17, color: f1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {setup.firma || "Dein Markenname"}
          </div>
          <div style={{ fontFamily: st.text, fontSize: 10.5, color: C.ink }}>{setup.nische || "Deine Nische"}</div>
        </div>
      </div>
      <div style={{ fontFamily: st.kopf, letterSpacing: st.spur, textTransform: st.gross ? "uppercase" : "none", fontSize: 14, color: C.espresso, margin: "12px 0 4px" }}>
        Angebot <span style={{ color: f2 }}>A-2026-001</span>
      </div>
      <div style={{ fontFamily: st.text, fontSize: 12, color: C.ink, lineHeight: 1.6 }}>
        Liebe Kundin, hier kommt dein persönliches Angebot …
      </div>
      <div style={{ background: pale, borderRadius: st.radius, padding: "7px 11px", marginTop: 10, fontFamily: st.text, fontSize: 11, color: C.ink }}>
        Gesamt <b style={{ color: f1 }}>480,00 €</b>
      </div>
    </div>
  );
}

export function Office({ office, setOffice, addPunkte }) {
  const bk = office.briefkopf;
  const bkStil = stilVon(bk && bk.stil);
  const bkKopf = { fontFamily: bkStil.kopf, letterSpacing: bkStil.spur, textTransform: bkStil.gross ? "uppercase" : "none" };
  const [setup, setSetup] = useState({ firma: "", nische: "", unterthemen: "", stil: "Elegant", farbe: FARBEN[0], farbe2: FARBEN[2], farbePale: mischen(FARBEN[0], "#FFFFFF", 0.9), logo: "🌹", adresse: "", ustid: "" });
  const [schritt, setSchritt] = useState(1);
  const [vorschlaege, setVorschlaege] = useState([]);
  const [typ, setTyp] = useState("Angebot");
  const [empfaenger, setEmpfaenger] = useState("");
  const [positionen, setPositionen] = useState([{ t: "", p: "" }]);
  const [wunsch, setWunsch] = useState("");
  const [doc, setDoc] = useState(null);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [mail, setMail] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [hoerend, setHoerend] = useState(false);
  const recognitionRef = useRef(null);

  const speichernBk = () => {
    if (!setup.firma.trim()) return;
    setOffice({ ...office, briefkopf: setup });
    setSchritt(1);
    if (addPunkte) addPunkte(10, "Marke erstellt");
  };

  // Logo aussuchen: das Bild bleibt auf dem Geraet, die Farben werden hier im Browser
  // ausgelesen und sofort als Palettenvorschlag uebernommen.
  const logoWaehlen = (e) => {
    const datei = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!datei) return;
    if (datei.size > 3 * 1024 * 1024) {
      setInfo("⚠️ Bitte ein Logo unter 3 MB — kleiner lädt schneller.");
      setTimeout(() => setInfo(""), 3400);
      return;
    }
    const leser = new FileReader();
    leser.onload = async () => {
      const roh = String(leser.result || "");
      const dataUrl = await logoVerkleinern(roh);
      setOffice({ ...office, logoImg: dataUrl });
      const f = await farbenAusLogo(dataUrl);
      setVorschlaege(f);
      if (f.length) setSetup((v) => ({ ...v, ...paletteAus(f[0], f[1]) }));
    };
    leser.readAsDataURL(datei);
  };

  // Ist schon ein Logo hinterlegt (z. B. aus der Mediathek), werden die Farben
  // beim Öffnen einmal gelesen.
  useEffect(() => {
    if (!office.logoImg || vorschlaege.length) return;
    let aktiv = true;
    farbenAusLogo(office.logoImg).then((f) => { if (aktiv) setVorschlaege(f); });
    return () => { aktiv = false; };
  }, [office.logoImg]); // eslint-disable-line

  const sprachEingabe = () => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setInfo("🎤 Sprach-Erkennung wird von diesem Browser nicht unterstützt — bitte Chrome/Safari nutzen oder direkt tippen.");
      setTimeout(() => setInfo(""), 3400);
      return;
    }
    if (hoerend) { recognitionRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = "de-DE";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onstart = () => { setHoerend(true); setInfo("🎤 Ich höre zu …"); };
    rec.onresult = (e) => {
      const gesagt = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
      setWunsch((prev) => (prev.trim() ? `${prev.trim()} ${gesagt}` : gesagt));
      setInfo("✓ Übernommen");
      setTimeout(() => setInfo(""), 2000);
    };
    rec.onerror = () => {
      setInfo("Konnte dich gerade nicht verstehen — versuch es noch einmal oder tippe direkt.");
      setTimeout(() => setInfo(""), 3000);
    };
    rec.onend = () => setHoerend(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const erstellen = async () => {
    if (!empfaenger.trim() || !positionen[0].t.trim()) { setInfo("Bitte Empfänger und mindestens eine Position ausfüllen."); setTimeout(() => setInfo(""), 2600); return; }
    setBusy(true);
    const nr = `${typ === "Angebot" ? "AG" : "RE"}-2026-${String(office.docs.length + 1).padStart(3, "0")}`;
    const datum = new Date().toLocaleDateString("de-DE");
    let text = "";
    try {
      text = await askLuma(
        [{ role: "user", content: `Schreibe den Fließtext für ein professionelles deutsches ${typ} (Sie-Form, warm aber geschäftlich) einer Coachin (${bk.nische}, Stil: ${bk.stil}). Empfänger: ${empfaenger}. Leistungen: ${positionen.map((p) => p.t).join("; ")}. ${wunsch ? "Zusätzliche Wünsche: " + wunsch : ""} Struktur: Anrede, 1 Absatz Einleitung, 1 Absatz Leistungsbeschreibung/Nutzen, 1 kurzer Absatz Abschluss mit ${typ === "Angebot" ? "Einladung zur Rückmeldung" : "Dank und Zahlungshinweis"}. KEINE Überschrift, KEINE Grußformel am Ende, keine Preise nennen.` }],
        ILHO_SYSTEM
      );
    } catch {
      text = `Sehr geehrte/r ${empfaenger},\n\nvielen Dank für Ihr Vertrauen. Gerne ${typ === "Angebot" ? "unterbreite ich Ihnen folgendes Angebot" : "stelle ich Ihnen folgende Leistungen in Rechnung"}.\n\nIch freue mich auf die gemeinsame Arbeit.`;
    }
    setDoc({ typ, nr, datum, empfaenger, positionen: positionen.filter((p) => p.t.trim()), text });
    setBusy(false);
    if (addPunkte) addPunkte(8, `${typ} erstellt`);
  };

  const herunterladen = () => {
    const html = docHtml(bk, doc, office.logoImg);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.typ}-${doc.nr}.html`;
    a.click();
    setInfo("⬇️ Heruntergeladen — im Browser öffnen → Drucken → „Als PDF speichern“");
    setTimeout(() => setInfo(""), 3500);
  };

  const speichernDoc = () => {
    setOffice({ ...office, docs: [{ ...doc }, ...office.docs] });
    setInfo("💾 Gespeichert in „Meine Dokumente“");
    setTimeout(() => setInfo(""), 2400);
  };

  const senden = () => {
    if (!mail.includes("@")) { setInfo("Bitte gültige E-Mail eingeben."); setTimeout(() => setInfo(""), 2400); return; }
    setOffice({ ...office, docs: [{ ...doc, gesendetAn: mail }, ...office.docs.filter((d) => d.nr !== doc.nr)] });
    setInfo(`📧 ${doc.typ} ${doc.nr} an ${mail} gesendet ✓ (Produktion: echter Mail-Versand)`);
    setMail("");
    setTimeout(() => setInfo(""), 3200);
  };

  const input = { width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, marginBottom: 10, outline: "none" };

  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Mein Office</Eyebrow>
      <H size={24} style={{ marginBottom: 16 }}>Business an einem Ort</H>

      {info && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum, background: C.roseSoft, borderRadius: 12, padding: "10px 14px", marginBottom: 12, animation: "fadeUp .3s ease" }}>{info}</div>}

      {/* Käufe */}
      <Eyebrow color={C.plum}>🛍️ Meine Käufe</Eyebrow>
      <div style={{ marginTop: 8, marginBottom: 20 }}>
        {office.kaeufe.map((k, i) => (
          <Card key={i} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", padding: 14 }}>
            <span style={{ fontSize: 20 }}>🌕</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{k.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>{k.d} · {k.p}</div>
            </div>
            <Btn small ghost>Beleg</Btn>
          </Card>
        ))}
      </div>

      {/* Dokumente (Business) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Eyebrow color={C.plum}>📄 Dokumente · Angebote & Rechnungen</Eyebrow>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold, border: `1px solid ${C.goldSoft}`, borderRadius: 20, padding: "2px 8px" }}>Business</span>
      </div>

      {!bk ? (
        <Card style={{ marginBottom: 16 }}>
          <Eyebrow>✨ Deine Marke — in drei Schritten</Eyebrow>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.55, margin: "6px 0 4px" }}>
            Logo, Farben, Schrift. Danach trägt jedes Angebot und jede Rechnung deine Handschrift — automatisch.
          </p>

          <div style={{ display: "flex", gap: 6, margin: "12px 0 2px" }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ flex: 1, height: 4, borderRadius: 4, background: schritt >= n ? (setup.farbe || C.rose) : C.line, transition: "background .25s" }} />
            ))}
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.mut, marginTop: 6 }}>
            Schritt {schritt} von 3 · {schritt === 1 ? "Logo & Name" : schritt === 2 ? "Farben" : "Schrift & Angaben"}
          </div>

          <MarkeVorschau setup={setup} logoImg={office.logoImg} />

          {schritt === 1 && (
            <>
              <Eyebrow color={C.plum}>Logo</Eyebrow>
              <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "8px 0 14px", flexWrap: "wrap" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 15px", borderRadius: 13, border: `1.5px dashed ${C.rose}`, background: C.roseSoft, cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, color: C.plum, minHeight: 44 }}>
                  🖼️ {office.logoImg ? "Logo austauschen" : "Logo hochladen"}
                  <input type="file" accept="image/*" onChange={logoWaehlen} style={{ display: "none" }} />
                </label>
                {office.logoImg && (
                  <button onClick={() => setOffice({ ...office, logoImg: null })} style={{ background: "none", border: "none", color: C.mut, fontFamily: "system-ui, sans-serif", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>entfernen</button>
                )}
                <input value={setup.logo} onChange={(e) => setSetup({ ...setup, logo: e.target.value })} maxLength={2} style={{ ...input, width: 62, marginBottom: 0, textAlign: "center", fontSize: 20 }} />
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.mut, marginTop: -8, marginBottom: 12 }}>
                Kein Logo? Das Emoji rechts wird stattdessen verwendet. Dein Bild bleibt auf deinem Gerät — die Farben werden hier im Browser gelesen.
              </div>

              <Eyebrow color={C.plum}>Name & Nische</Eyebrow>
              <input style={input} placeholder="Firmen-/Coachname *" value={setup.firma} onChange={(e) => setSetup({ ...setup, firma: e.target.value })} />
              <input style={input} placeholder="Deine Nische (z. B. Spirituelles Coaching)" value={setup.nische} onChange={(e) => setSetup({ ...setup, nische: e.target.value })} />
              <input style={input} placeholder="Unterthemen (z. B. Energiearbeit, Frauen-Circles)" value={setup.unterthemen} onChange={(e) => setSetup({ ...setup, unterthemen: e.target.value })} />
              <Btn full onClick={() => setup.firma.trim() && setSchritt(2)} disabled={!setup.firma.trim()}>Weiter zu den Farben →</Btn>
            </>
          )}

          {schritt === 2 && (
            <>
              {vorschlaege.length > 0 && (
                <>
                  <Eyebrow color={C.plum}>Aus deinem Logo gelesen</Eyebrow>
                  <div style={{ display: "flex", gap: 9, alignItems: "center", margin: "8px 0 6px", flexWrap: "wrap" }}>
                    {vorschlaege.map((f, i) => (
                      <button key={f + i} onClick={() => setSetup({ ...setup, ...paletteAus(f, vorschlaege.find((v) => v !== f)) })} title={f} style={{ width: 40, height: 40, borderRadius: "50%", background: f, border: setup.farbe === lesbar(f) ? `3px solid ${C.espresso}` : "2px solid #fff", cursor: "pointer", boxShadow: "0 2px 7px rgba(0,0,0,.18)" }} />
                    ))}
                    <button onClick={() => setSetup({ ...setup, ...paletteAus(vorschlaege[0], vorschlaege[1]) })} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Vorschlag übernehmen</button>
                  </div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.mut, marginBottom: 12 }}>
                    Aus deinem Logo. Zu helle Töne werden automatisch abgedunkelt, damit sie auf Papier lesbar bleiben.
                  </div>
                </>
              )}
              {!office.logoImg && (
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.mut, margin: "4px 0 12px", lineHeight: 1.5 }}>
                  Noch kein Logo hochgeladen — such dir unten eine Farbe aus, oder geh zurück und lade dein Logo hoch, dann schlage ich passende Farben vor.
                </div>
              )}

              <Eyebrow color={C.plum}>Oder eine Grundfarbe wählen</Eyebrow>
              <div style={{ display: "flex", gap: 9, alignItems: "center", margin: "8px 0 12px", flexWrap: "wrap" }}>
                {FARBEN.map((f) => (
                  <button key={f} onClick={() => setSetup({ ...setup, ...paletteAus(f) })} style={{ width: 36, height: 36, borderRadius: "50%", background: f, border: setup.farbe === f ? `3px solid ${C.espresso}` : "2px solid #fff", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,.15)" }} />
                ))}
                <label style={{ width: 36, height: 36, borderRadius: "50%", border: `2px dashed ${C.line}`, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 15 }}>
                  🎨
                  <input type="color" value={setup.farbe || FARBEN[0]} onChange={(e) => setSetup({ ...setup, ...paletteAus(e.target.value) })} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                </label>
              </div>

              <Eyebrow color={C.plum}>Deine Palette</Eyebrow>
              <div style={{ display: "flex", gap: 8, margin: "8px 0 16px" }}>
                {[["Hauptfarbe", setup.farbe], ["Akzent", setup.farbe2], ["Fläche", setup.farbePale]].map(([n, f]) => (
                  <div key={n} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: 34, borderRadius: 10, background: f || C.line, border: `1px solid ${C.line}` }} />
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, color: C.mut, marginTop: 4 }}>{n}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Btn ghost onClick={() => setSchritt(1)}>← Zurück</Btn>
                <div style={{ flex: 1 }}><Btn full onClick={() => setSchritt(3)}>Weiter zur Schrift →</Btn></div>
              </div>
            </>
          )}

          {schritt === 3 && (
            <>
              <Eyebrow color={C.plum}>Schrift & Form</Eyebrow>
              <div style={{ margin: "8px 0 14px" }}>
                {STILE.map((s) => {
                  const st = stilVon(s);
                  const an = setup.stil === s;
                  return (
                    <button key={s} onClick={() => setSetup({ ...setup, stil: s })} style={{
                      display: "block", width: "100%", textAlign: "left", marginBottom: 8,
                      padding: "12px 14px", borderRadius: 14, cursor: "pointer", minHeight: 44,
                      border: `1.5px solid ${an ? C.rose : C.line}`, background: an ? C.roseSoft : "transparent",
                    }}>
                      <div style={{ fontFamily: st.kopf, letterSpacing: st.spur, textTransform: st.gross ? "uppercase" : "none", fontSize: 15.5, color: an ? C.plum : C.espresso }}>{s}</div>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 3 }}>{st.beschreibung}</div>
                    </button>
                  );
                })}
              </div>

              <Eyebrow color={C.plum}>Angaben fürs Dokument</Eyebrow>
              <textarea style={{ ...input, resize: "vertical", marginTop: 8 }} rows={2} placeholder={"Adresse (Straße\nPLZ Ort)"} value={setup.adresse} onChange={(e) => setSetup({ ...setup, adresse: e.target.value })} />
              <input style={input} placeholder="USt-IdNr. (optional)" value={setup.ustid} onChange={(e) => setSetup({ ...setup, ustid: e.target.value })} />

              <div style={{ display: "flex", gap: 8 }}>
                <Btn ghost onClick={() => setSchritt(2)}>← Zurück</Btn>
                <div style={{ flex: 1 }}><Btn full onClick={speichernBk}>Marke speichern ✓</Btn></div>
              </div>
            </>
          )}
        </Card>
      ) : !doc ? (
        <Card style={{ marginBottom: 16 }}>
          {/* Briefkopf-Vorschau */}
          <div style={{ borderBottom: `${bkStil.linie}px solid ${bk.farbe}`, paddingBottom: 10, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...bkKopf, fontSize: 18, color: bk.farbe, display: "flex", alignItems: "center", gap: 8 }}>
                {office.logoImg ? <img src={office.logoImg} alt="" style={{ height: 30, borderRadius: bkStil.radius }} /> : bk.logo} {bk.firma}
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink }}>{bk.nische}</div>
            </div>
            <button onClick={() => { setSetup({ ...setup, ...bk }); setSchritt(1); setOffice({ ...office, briefkopf: null }); }} style={{ background: "none", border: "none", color: C.plum, fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline", fontFamily: "system-ui, sans-serif" }}>Bearbeiten</button>
          </div>

          <Eyebrow>2 · Schnellstart — Vorlagen für deine Nische</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0 16px" }}>
            {VORLAGEN.map((v) => (
              <button key={v.t} onClick={() => { setTyp(v.typ); setPositionen(v.pos.map((p) => ({ ...p }))); setWunsch(v.wunsch); setInfo(`✓ Vorlage „${v.t}" geladen — Variablen anpassen & los`); setTimeout(() => setInfo(""), 2600); }} style={{
                textAlign: "left", padding: "11px 12px", borderRadius: 13, cursor: "pointer",
                border: `1.5px solid ${C.goldSoft}`, background: C.goldPale,
              }}>
                <div style={{ fontSize: 19 }}>{v.icon}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: C.espresso, marginTop: 3 }}>{v.t}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, color: C.ink, marginTop: 1 }}>{v.typ}</div>
              </button>
            ))}
          </div>

          <Eyebrow>3 · Variablen anpassen</Eyebrow>
          <div style={{ display: "flex", gap: 8, margin: "8px 0 12px", background: C.beige, borderRadius: 13, padding: 4 }}>
            {["Angebot", "Rechnung"].map((t) => (
              <button key={t} onClick={() => setTyp(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700, background: typ === t ? C.card : "transparent", color: typ === t ? C.plum : C.ink }}>{t === "Angebot" ? "📋 Angebot" : "🧾 Rechnung"}</button>
            ))}
          </div>

          <input style={input} placeholder="Empfängerin / Kundin (Name, ggf. Firma) *" value={empfaenger} onChange={(e) => setEmpfaenger(e.target.value)} />

          <Eyebrow color={C.plum}>Positionen</Eyebrow>
          {positionen.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input style={{ ...input, flex: 1 }} placeholder={`Leistung ${i + 1} *`} value={p.t} onChange={(e) => setPositionen(positionen.map((x, j) => j === i ? { ...x, t: e.target.value } : x))} />
              <input style={{ ...input, width: 90 }} placeholder="€" value={p.p} onChange={(e) => setPositionen(positionen.map((x, j) => j === i ? { ...x, p: e.target.value } : x))} />
            </div>
          ))}
          {positionen.length < 4 && (
            <button onClick={() => setPositionen([...positionen, { t: "", p: "" }])} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "0 0 12px", textDecoration: "underline" }}>+ Position hinzufügen</button>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <textarea style={{ ...input, flex: 1, resize: "vertical" }} rows={2} placeholder="Sag ilho, was wichtig ist (Ton, Details) — oder nutze 🎤" value={wunsch} onChange={(e) => setWunsch(e.target.value)} />
            <button onClick={sprachEingabe} style={{ width: 46, height: 46, borderRadius: "50%", border: `1.5px solid ${C.rose}`, background: hoerend ? C.rose : C.roseSoft, fontSize: 18, cursor: "pointer", flexShrink: 0, boxShadow: hoerend ? `0 0 0 4px ${C.roseSoft}` : "none", transition: "box-shadow .3s" }}>🎤</button>
          </div>

          <Btn full onClick={erstellen} disabled={busy}>{busy ? "✨ ilho schreibt dein Dokument …" : `✨ ilho, erstelle mein ${typ}`}</Btn>
        </Card>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          {/* Dokument-Vorschau */}
          <div style={{ borderBottom: `${bkStil.linie}px solid ${bk.farbe}`, paddingBottom: 10, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <div style={{ ...bkKopf, fontSize: 17, color: bk.farbe, display: "flex", alignItems: "center", gap: 8 }}>
              {office.logoImg ? <img src={office.logoImg} alt="" style={{ height: 28, borderRadius: bkStil.radius }} /> : bk.logo} {bk.firma}
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, textAlign: "right" }}>{doc.datum}</div>
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginBottom: 8 }}>{doc.empfaenger}</div>
          <H size={18} style={{ marginBottom: 10 }}>{doc.typ} <span style={{ color: bk.farbe2 || bk.farbe }}>{doc.nr}</span></H>

          {bearbeiten ? (
            <textarea value={doc.text} onChange={(e) => setDoc({ ...doc, text: e.target.value })} rows={9}
              style={{ width: "100%", padding: "13px 14px", fontSize: 13.5, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.rose}`, borderRadius: 13, background: C.card, color: C.espresso, marginBottom: 10, outline: "none", resize: "vertical", lineHeight: 1.6 }} />
          ) : (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso, lineHeight: 1.65, whiteSpace: "pre-wrap", marginBottom: 12 }}>{doc.text}</p>
          )}

          {doc.positionen.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.line}`, fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
              <span style={{ color: C.espresso }}>{p.t}</span><span style={{ color: C.ink }}>{p.p} €</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 14px", fontFamily: "system-ui, sans-serif", fontSize: 14.5, fontWeight: 700 }}>
            <span>Gesamt</span>
            <span style={{ color: bk.farbe }}>{doc.positionen.reduce((s, p) => s + (parseFloat(String(p.p).replace(",", ".")) || 0), 0).toFixed(2).replace(".", ",")} €</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><Btn full ghost small onClick={() => setBearbeiten(!bearbeiten)}>{bearbeiten ? "✓ Fertig" : "✏️ Bearbeiten"}</Btn></div>
            <div style={{ flex: 1 }}><Btn full ghost small onClick={speichernDoc}>💾 Speichern</Btn></div>
            <div style={{ flex: 1 }}><Btn full small onClick={herunterladen}>⬇️ PDF</Btn></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input style={{ ...input, flex: 1, marginBottom: 0 }} placeholder="E-Mail der Empfängerin …" value={mail} onChange={(e) => setMail(e.target.value)} />
            <Btn small onClick={senden}>📧 Senden</Btn>
          </div>
          <button onClick={() => { setDoc(null); setBearbeiten(false); }} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: "6px 0" }}>← Neues Dokument</button>
        </Card>
      )}

      {/* Gespeicherte Dokumente */}
      {office.docs.length > 0 && (
        <>
          <Eyebrow color={C.plum}>📁 Meine Dokumente</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {office.docs.map((d, i) => (
              <Card key={i} style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center", padding: 13 }}>
                <span style={{ fontSize: 19 }}>{d.typ === "Angebot" ? "📋" : "🧾"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: C.espresso }}>{d.typ} {d.nr} · {d.empfaenger}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: d.gesendetAn ? C.sage : C.ink, fontWeight: d.gesendetAn ? 700 : 400 }}>{d.gesendetAn ? `✓ Gesendet an ${d.gesendetAn}` : d.datum}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

