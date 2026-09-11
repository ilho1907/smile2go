import { useState, useEffect, useRef } from "react";
import {
  supabase,
  ladeCoachProfilSelbst, coachProfilSpeichern, coachProfilSichern,
  ladeMeineKlientinnen, klientinStatus,
  ladeEinladungscodes, erzeugeEinladungscode, codeUmschalten,
  ladeNachrichten, sendeNachrichtAlsCoach, abonniereNachrichten,
  ladeUngelesen, markiereGelesenAlsCoach, dateiLink,
  ladeAlleSlots, slotAnlegen, slotLoeschen, ladeTermineCoach, terminVideoLink,
  ladeMaterialien, materialHochladen, materialAnlegen, materialLoeschen,
  ladeAngebote, angebotAnlegen, angebotLoeschen, ladeKursModule, modulAnlegen, modulLoeschen,
  ladeCoachBeitraege, beitragAnlegen, beitragLoeschen,
  ladeAnfragenCoach, anfrageStatus,
} from "./supabase";

/* ─────────────────────────────────────────────
   smile2go — COACH-PANEL
   Die Gegenstelle zur Klientinnen-App: hier entstehen Einladungscodes,
   Antworten, freie Termine, Materialien und Angebote. Alles echte Daten
   aus der Datenbank — kein Demo-Datensatz.
   Aufruf:  http://localhost:5173/#coach
   ───────────────────────────────────────────── */

const C = {
  cream: "#FBF6EE", card: "#FFFFFE", beige: "#F5E9DB", line: "#EBD8C6",
  gold: "#C9963C", goldPale: "#FAEDD2", espresso: "#3A2A22", ink: "#6B5443",
  sage: "#5E8A52", rose: "#D96E8B", roseSoft: "#F8DCE3", plum: "#8E4A63", rot: "#B0492F",
};

const Eyebrow = ({ children, color = C.gold }) => (
  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color, fontWeight: 700, marginBottom: 6 }}>{children}</div>
);

const Card = ({ children, style }) => (
  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, ghost, small, disabled, ton }) => (
  <button onClick={onClick} disabled={disabled} style={{
    fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: small ? 13 : 14.5,
    padding: small ? "9px 14px" : "12px 20px", borderRadius: 12, cursor: disabled ? "default" : "pointer",
    border: ghost ? `1.5px solid ${C.line}` : "none",
    background: ghost ? "transparent" : ton === "rot" ? C.rot : `linear-gradient(135deg, ${C.gold}, ${C.rose})`,
    color: ghost ? C.plum : "#fff", opacity: disabled ? 0.5 : 1, minHeight: 40,
  }}>{children}</button>
);

const feldStil = {
  width: "100%", padding: "11px 13px", fontSize: 14.5, fontFamily: "system-ui, sans-serif",
  border: `1.5px solid ${C.line}`, borderRadius: 11, background: C.card, color: C.espresso,
  outline: "none", boxSizing: "border-box", marginBottom: 10,
};

const Feld = ({ label, ...rest }) => (
  <label style={{ display: "block" }}>
    {label && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>{label}</div>}
    <input style={feldStil} {...rest} />
  </label>
);

const Leer = ({ children }) => (
  <Card style={{ textAlign: "center" }}>
    <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.ink, lineHeight: 1.6, margin: 0 }}>{children}</p>
  </Card>
);

const datumZeit = (iso) => new Date(iso).toLocaleString("de-DE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/* ── Anmeldung ──────────────────────────────────────────────────────────── */

function Anmeldung({ onFertig }) {
  const [mail, setMail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const anmelden = async () => {
    setErr(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: mail.trim(), password: pw });
    setBusy(false);
    if (error) { setErr("Anmeldung fehlgeschlagen — E-Mail oder Passwort stimmt nicht."); return; }
    await coachProfilSichern();
    onFertig();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 34, color: C.espresso }}>
            smile<span style={{ color: C.rose, fontStyle: "italic" }}>2</span>go
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 4 }}>Coach-Panel</div>
        </div>
        <Card>
          <Feld label="E-Mail" type="email" value={mail} onChange={(e) => setMail(e.target.value)} />
          <Feld label="Passwort" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && anmelden()} />
          {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.rot, marginBottom: 10 }}>{err}</div>}
          <Btn onClick={anmelden} disabled={busy}>{busy ? "Einen Moment …" : "Anmelden"}</Btn>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, lineHeight: 1.6, marginTop: 14, marginBottom: 0 }}>
            Dasselbe Konto wie in der App. Wer sich hier anmeldet, wird als Coachin geführt
            und sieht ausschließlich die eigenen Klientinnen.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ── Klientinnen & Einladungscodes ──────────────────────────────────────── */

function Klientinnen({ klientinnen, neuLaden, ungelesen, oeffneChat }) {
  const [codes, setCodes] = useState([]);
  const [neuerCode, setNeuerCode] = useState("");
  const [err, setErr] = useState("");

  const codesLaden = () => ladeEinladungscodes().then(setCodes);
  useEffect(() => { codesLaden(); }, []);

  const anlegen = async () => {
    setErr("");
    try {
      await erzeugeEinladungscode(neuerCode);
      setNeuerCode("");
      codesLaden();
    } catch (e) { setErr(e.message); }
  };

  const vorschlag = () => {
    const teil = Math.random().toString(36).slice(2, 6).toUpperCase();
    setNeuerCode(`S2G-${teil}`);
  };

  return (
    <>
      <Eyebrow color={C.plum}>Einladungscodes</Eyebrow>
      <Card style={{ marginBottom: 22 }}>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.6, margin: "0 0 12px" }}>
          Gib einer Klientin einen Code. Sie trägt ihn in der App unter „Mit deiner Coachin
          verbinden" ein — ab dann gehören eure Nachrichten, Termine und Materialien nur euch beiden.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <input value={neuerCode} onChange={(e) => setNeuerCode(e.target.value.toUpperCase())} placeholder="z. B. S2G-2026" style={{ ...feldStil, marginBottom: 0, letterSpacing: 1 }} />
          </div>
          <Btn small ghost onClick={vorschlag}>Vorschlag</Btn>
          <Btn small onClick={anlegen} disabled={neuerCode.trim().length < 4}>Anlegen</Btn>
        </div>
        {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.rot, marginTop: 8 }}>{err}</div>}

        {codes.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {codes.map((c) => (
              <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
                <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 1, color: c.aktiv ? C.espresso : C.ink, textDecoration: c.aktiv ? "none" : "line-through" }}>{c.code}</span>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, flex: 1 }}>
                  {c.nutzungen}× eingelöst{c.max_nutzungen ? ` · max ${c.max_nutzungen}` : ""}
                </span>
                <button onClick={() => navigator.clipboard?.writeText(c.code)} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>kopieren</button>
                <button onClick={async () => { await codeUmschalten(c.code, !c.aktiv); codesLaden(); }} style={{ background: "none", border: "none", color: C.ink, fontFamily: "system-ui, sans-serif", fontSize: 12, cursor: "pointer" }}>
                  {c.aktiv ? "sperren" : "freigeben"}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Eyebrow color={C.plum}>Meine Klientinnen ({klientinnen.length})</Eyebrow>
      {klientinnen.length === 0 ? (
        <Leer>Noch niemand verbunden. Sobald jemand deinen Code einlöst, erscheint sie hier.</Leer>
      ) : (
        klientinnen.map((k) => (
          <Card key={k.id} style={{ marginBottom: 10, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 19, flexShrink: 0 }}>
              {(k.anzeigename || "K").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>
                {k.anzeigename || "Ohne Namen"}
                {ungelesen[k.id] > 0 && (
                  <span style={{ marginLeft: 8, fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", background: C.rose, borderRadius: 10, padding: "2px 8px" }}>
                    {ungelesen[k.id]} neu
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>
                {k.status} · verbunden seit {new Date(k.verbunden_am).toLocaleDateString("de-DE")}
              </div>
            </div>
            <Btn small ghost onClick={() => oeffneChat(k)}>Chat</Btn>
            <Btn small ghost onClick={async () => { await klientinStatus(k.id, k.status === "aktiv" ? "pausiert" : "aktiv"); neuLaden(); }}>
              {k.status === "aktiv" ? "pausieren" : "aktivieren"}
            </Btn>
          </Card>
        ))
      )}
    </>
  );
}

/* ── Nachrichten ────────────────────────────────────────────────────────── */

function Nachrichten({ klientinnen, offen, setOffen, ungelesenNeu }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [audioLinks, setAudioLinks] = useState({});
  const endRef = useRef(null);

  useEffect(() => {
    if (!offen) return;
    let aktiv = true;
    setLaedt(true);
    ladeNachrichten(offen.id).then((v) => {
      if (!aktiv) return;
      setMsgs(v); setLaedt(false);
      markiereGelesenAlsCoach(offen.id).then(ungelesenNeu);
    });
    const ab = abonniereNachrichten(offen.id, (neu) => {
      setMsgs((m) => (m.some((x) => x.id === neu.id) ? m : [...m, neu]));
      if (neu.absender === "klientin") markiereGelesenAlsCoach(offen.id).then(ungelesenNeu);
    });
    return () => { aktiv = false; ab(); };
  }, [offen?.id]); // eslint-disable-line

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  useEffect(() => {
    msgs.filter((m) => m.audio_pfad && !audioLinks[m.id]).forEach(async (m) => {
      const url = await dateiLink(m.audio_pfad);
      if (url) setAudioLinks((a) => ({ ...a, [m.id]: url }));
    });
  }, [msgs]); // eslint-disable-line

  const senden = async () => {
    const t = text.trim();
    if (!t || !offen) return;
    setText("");
    const g = await sendeNachrichtAlsCoach({ klientinId: offen.id, text: t });
    if (g) setMsgs((m) => (m.some((x) => x.id === g.id) ? m : [...m, g]));
    else setText(t);
  };

  if (!offen)
    return (
      <>
        <Eyebrow color={C.plum}>Verlauf wählen</Eyebrow>
        {klientinnen.length === 0
          ? <Leer>Noch keine Klientinnen verbunden.</Leer>
          : klientinnen.map((k) => (
            <Card key={k.id} style={{ marginBottom: 9, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{k.anzeigename || "Ohne Namen"}</div>
              <Btn small ghost onClick={() => setOffen(k)}>Öffnen</Btn>
            </Card>
          ))}
      </>
    );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <Btn small ghost onClick={() => setOffen(null)}>← Alle</Btn>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso }}>{offen.anzeigename || "Klientin"}</div>
      </div>

      <Card style={{ marginBottom: 12, maxHeight: "56vh", overflowY: "auto" }}>
        {laedt && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Lade Verlauf …</div>}
        {!laedt && msgs.length === 0 && (
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.ink, textAlign: "center", padding: "16px 0" }}>
            Noch keine Nachrichten. Schreib den ersten Satz.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m) => {
            const ich = m.absender === "coach";
            return (
              <div key={m.id} style={{ alignSelf: ich ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                <div style={{
                  background: ich ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.beige,
                  color: ich ? "#fff" : C.espresso,
                  borderRadius: ich ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "10px 13px", fontFamily: "system-ui, sans-serif", fontSize: 14, lineHeight: 1.55,
                }}>
                  {m.audio_pfad
                    ? (audioLinks[m.id] ? <audio controls src={audioLinks[m.id]} style={{ width: 200, maxWidth: "100%" }} /> : "🎙️ Sprachnachricht")
                    : m.text}
                </div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7, marginTop: 3, textAlign: ich ? "right" : "left" }}>
                  {datumZeit(m.created_at)}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && senden()} placeholder="Antwort schreiben …" style={{ ...feldStil, marginBottom: 0, flex: 1 }} />
        <Btn onClick={senden}>Senden</Btn>
      </div>
    </>
  );
}

/* ── Termine ────────────────────────────────────────────────────────────── */

function Termine() {
  const [slots, setSlots] = useState([]);
  const [termine, setTermine] = useState([]);
  const [datum, setDatum] = useState("");
  const [zeit, setZeit] = useState("09:00");
  const [dauer, setDauer] = useState(50);
  const [kanal, setKanal] = useState("video");
  const [err, setErr] = useState("");

  const laden = async () => {
    const [s, t] = await Promise.all([ladeAlleSlots(), ladeTermineCoach()]);
    setSlots(s); setTermine(t);
  };
  useEffect(() => { laden(); }, []);

  const anlegen = async () => {
    setErr("");
    if (!datum) return setErr("Bitte ein Datum wählen.");
    try {
      await slotAnlegen({ beginn: new Date(`${datum}T${zeit}`).toISOString(), dauerMin: Number(dauer), kanal });
      laden();
    } catch (e) { setErr(e.message); }
  };

  const woche = async () => {
    setErr("");
    if (!datum) return setErr("Bitte ein Startdatum wählen.");
    const start = new Date(`${datum}T${zeit}`);
    let angelegt = 0;
    for (let i = 0; i < 5; i++) {
      const d = new Date(start.getTime() + i * 864e5);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      try { await slotAnlegen({ beginn: d.toISOString(), dauerMin: Number(dauer), kanal }); angelegt++; } catch { /* schon da */ }
    }
    setErr(angelegt ? `${angelegt} Fenster angelegt.` : "Diese Fenster gab es schon.");
    laden();
  };

  const gebucht = termine.filter((t) => t.status === "gebucht");

  return (
    <>
      <Eyebrow color={C.plum}>Freies Zeitfenster anlegen</Eyebrow>
      <Card style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 150px" }}><Feld label="Datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} /></div>
          <div style={{ flex: "1 1 110px" }}><Feld label="Uhrzeit" type="time" value={zeit} onChange={(e) => setZeit(e.target.value)} /></div>
          <div style={{ flex: "1 1 110px" }}><Feld label="Dauer (Min)" type="number" value={dauer} onChange={(e) => setDauer(e.target.value)} /></div>
          <label style={{ flex: "1 1 130px" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Kanal</div>
            <select value={kanal} onChange={(e) => setKanal(e.target.value)} style={feldStil}>
              <option value="video">Video</option>
              <option value="telefon">Telefon</option>
              <option value="vor_ort">Vor Ort</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <Btn small onClick={anlegen}>Fenster anlegen</Btn>
          <Btn small ghost onClick={woche}>Gleiche Zeit, ganze Woche</Btn>
        </div>
        {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 10 }}>{err}</div>}
      </Card>

      <Eyebrow color={C.plum}>Gebuchte Sessions ({gebucht.length})</Eyebrow>
      {gebucht.length === 0 ? <Leer>Noch keine Buchungen.</Leer> : gebucht.map((t) => (
        <Card key={t.id} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso }}>{datumZeit(t.beginn)}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 3 }}>
            {t.klientin_name} · {t.dauer_min} Min · {t.kanal}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              defaultValue={t.video_url || ""}
              placeholder="Videolink (Zoom, Whereby …)"
              onBlur={(e) => terminVideoLink(t.id, e.target.value.trim() || null)}
              style={{ ...feldStil, marginBottom: 0, flex: "1 1 220px" }}
            />
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>wird beim Verlassen des Feldes gespeichert</span>
          </div>
        </Card>
      ))}

      <div style={{ marginTop: 22 }}>
        <Eyebrow color={C.plum}>Offene Zeitfenster ({slots.filter((s) => s.aktiv).length})</Eyebrow>
        {slots.filter((s) => s.aktiv).length === 0 ? <Leer>Keine offenen Fenster — deine Klientinnen sehen gerade nichts zum Buchen.</Leer> : (
          <Card>
            {slots.filter((s) => s.aktiv).map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>{datumZeit(s.beginn)}</span>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>{s.dauer_min} Min · {s.kanal}</span>
                <button onClick={async () => { await slotLoeschen(s.id); laden(); }} style={{ background: "none", border: "none", color: C.rot, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>entfernen</button>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}

/* ── Material ───────────────────────────────────────────────────────────── */

function Material({ coachId, klientinnen }) {
  const [liste, setListe] = useState([]);
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [kategorie, setKategorie] = useState("Artikel");
  const [fuer, setFuer] = useState("");
  const [externUrl, setExternUrl] = useState("");
  const [datei, setDatei] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hinweis, setHinweis] = useState("");

  const laden = () => { if (coachId) ladeMaterialien(coachId).then(setListe); };
  useEffect(() => { laden(); }, [coachId]); // eslint-disable-line

  const anlegen = async () => {
    if (!titel.trim()) return setHinweis("Bitte einen Titel angeben.");
    if (!datei && !externUrl.trim()) return setHinweis("Bitte eine Datei wählen oder einen Link angeben.");
    setBusy(true); setHinweis("");
    let pfad = null;
    if (datei) {
      pfad = await materialHochladen(datei);
      if (!pfad) { setBusy(false); return setHinweis("Upload fehlgeschlagen."); }
    }
    const erg = await materialAnlegen({
      titel: titel.trim(), beschreibung: beschreibung.trim() || null, kategorie,
      dateiPfad: pfad, externUrl: externUrl.trim() || null, klientinId: fuer || null,
    });
    setBusy(false);
    if (!erg) return setHinweis("Speichern fehlgeschlagen.");
    setTitel(""); setBeschreibung(""); setExternUrl(""); setDatei(null); setFuer("");
    setHinweis("✓ Material ist in der App sichtbar.");
    laden();
  };

  return (
    <>
      <Eyebrow color={C.plum}>Neues Material</Eyebrow>
      <Card style={{ marginBottom: 22 }}>
        <Feld label="Titel" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="z. B. Workbook Woche 1" />
        <Feld label="Kurze Beschreibung" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="PDF · 8 Seiten" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ flex: "1 1 160px" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Kategorie</div>
            <select value={kategorie} onChange={(e) => setKategorie(e.target.value)} style={feldStil}>
              {["Artikel", "E-Books", "Videos", "Audio", "Aufgabe"].map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label style={{ flex: "1 1 200px" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Für wen?</div>
            <select value={fuer} onChange={(e) => setFuer(e.target.value)} style={feldStil}>
              <option value="">Alle meine Klientinnen</option>
              {klientinnen.map((k) => <option key={k.id} value={k.id}>{k.anzeigename || "Ohne Namen"}</option>)}
            </select>
          </label>
        </div>
        <Feld label="Oder: Link statt Datei" value={externUrl} onChange={(e) => setExternUrl(e.target.value)} placeholder="https://…" />
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Datei</div>
          <input type="file" onChange={(e) => setDatei(e.target.files?.[0] || null)} style={{ fontFamily: "system-ui, sans-serif", fontSize: 13 }} />
        </div>
        <Btn onClick={anlegen} disabled={busy}>{busy ? "Lade hoch …" : "Veröffentlichen"}</Btn>
        {hinweis && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.plum, marginTop: 10 }}>{hinweis}</div>}
      </Card>

      <Eyebrow color={C.plum}>Veröffentlicht ({liste.length})</Eyebrow>
      {liste.length === 0 ? <Leer>Noch nichts veröffentlicht.</Leer> : liste.map((m) => (
        <Card key={m.id} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{m.titel}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>
              {m.kategorie} · {new Date(m.sichtbar_ab).toLocaleDateString("de-DE")}
            </div>
          </div>
          <button onClick={async () => { await materialLoeschen(m.id); laden(); }} style={{ background: "none", border: "none", color: C.rot, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>löschen</button>
        </Card>
      ))}
    </>
  );
}

/* ── Angebote & Kursmodule ──────────────────────────────────────────────── */

function Angebote({ coachId }) {
  const [liste, setListe] = useState([]);
  const [anfragen, setAnfragen] = useState([]);
  const [form, setForm] = useState({ typ: "kurs", titel: "", untertitel: "", beschreibung: "", preis: "", einheiten: "" });
  const [offen, setOffen] = useState(null);
  const [module, setModule] = useState([]);
  const [modul, setModul] = useState({ titel: "", typ: "text", text: "", dauer: "" });

  const laden = () => {
    if (coachId) ladeAngebote(coachId).then(setListe);
    ladeAnfragenCoach().then(setAnfragen);
  };
  useEffect(() => { laden(); }, [coachId]); // eslint-disable-line
  useEffect(() => { if (offen) ladeKursModule(offen.id).then(setModule); }, [offen?.id]); // eslint-disable-line

  const anlegen = async () => {
    if (!form.titel.trim()) return;
    await angebotAnlegen({
      typ: form.typ, titel: form.titel.trim(), untertitel: form.untertitel.trim() || null,
      beschreibung: form.beschreibung.trim() || null, einheiten: form.einheiten.trim() || null,
      preis_cent: form.preis ? Math.round(Number(form.preis) * 100) : null,
    });
    setForm({ typ: "kurs", titel: "", untertitel: "", beschreibung: "", preis: "", einheiten: "" });
    laden();
  };

  const modulSpeichern = async () => {
    if (!modul.titel.trim() || !offen) return;
    await modulAnlegen({
      angebotId: offen.id, nr: (module.at(-1)?.nr || 0) + 1, titel: modul.titel.trim(),
      typ: modul.typ, text: modul.text.trim() || null, dauerMin: modul.dauer ? Number(modul.dauer) : null,
    });
    setModul({ titel: "", typ: "text", text: "", dauer: "" });
    ladeKursModule(offen.id).then(setModule);
  };

  if (offen)
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Btn small ghost onClick={() => setOffen(null)}>← Angebote</Btn>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso }}>{offen.titel}</div>
        </div>

        <Eyebrow color={C.plum}>Modul hinzufügen</Eyebrow>
        <Card style={{ marginBottom: 20 }}>
          <Feld label="Titel" value={modul.titel} onChange={(e) => setModul({ ...modul, titel: e.target.value })} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <label style={{ flex: "1 1 140px" }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Art</div>
              <select value={modul.typ} onChange={(e) => setModul({ ...modul, typ: e.target.value })} style={feldStil}>
                <option value="text">Text</option><option value="video">Video</option>
                <option value="audio">Audio</option><option value="aufgabe">Aufgabe</option>
              </select>
            </label>
            <div style={{ flex: "1 1 120px" }}><Feld label="Dauer (Min)" type="number" value={modul.dauer} onChange={(e) => setModul({ ...modul, dauer: e.target.value })} /></div>
          </div>
          <textarea value={modul.text} onChange={(e) => setModul({ ...modul, text: e.target.value })} rows={4} placeholder="Inhalt oder Anleitung …" style={{ ...feldStil, resize: "vertical" }} />
          <Btn small onClick={modulSpeichern}>Modul anlegen</Btn>
        </Card>

        <Eyebrow color={C.plum}>Module ({module.length})</Eyebrow>
        {module.length === 0 ? <Leer>Noch keine Module.</Leer> : module.map((m) => (
          <Card key={m.id} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{m.nr}. {m.titel}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{m.typ}{m.dauer_min ? ` · ${m.dauer_min} Min` : ""}</div>
            </div>
            <button onClick={async () => { await modulLoeschen(m.id); ladeKursModule(offen.id).then(setModule); }} style={{ background: "none", border: "none", color: C.rot, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>löschen</button>
          </Card>
        ))}
      </>
    );

  return (
    <>
      <Eyebrow color={C.plum}>Neues Angebot</Eyebrow>
      <Card style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ flex: "1 1 140px" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Art</div>
            <select value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value })} style={feldStil}>
              <option value="kurs">Kurs</option><option value="paket">Paket</option>
              <option value="retreat">Retreat</option><option value="shop">Sonstiges</option>
            </select>
          </label>
          <div style={{ flex: "2 1 220px" }}><Feld label="Titel" value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })} /></div>
        </div>
        <Feld label="Untertitel" value={form.untertitel} onChange={(e) => setForm({ ...form, untertitel: e.target.value })} placeholder="8 Module · Video" />
        <textarea value={form.beschreibung} onChange={(e) => setForm({ ...form, beschreibung: e.target.value })} rows={3} placeholder="Worum geht es?" style={{ ...feldStil, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 130px" }}><Feld label="Preis (€, optional)" type="number" value={form.preis} onChange={(e) => setForm({ ...form, preis: e.target.value })} /></div>
          <div style={{ flex: "1 1 130px" }}><Feld label="Umfang" value={form.einheiten} onChange={(e) => setForm({ ...form, einheiten: e.target.value })} placeholder="8 Einheiten" /></div>
        </div>
        <Btn onClick={anlegen} disabled={!form.titel.trim()}>Anlegen</Btn>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, lineHeight: 1.6, margin: "10px 0 0" }}>
          Bezahlung läuft nicht über die App: Klientinnen senden dir eine Anfrage, den Rest klärt ihr im Chat.
        </p>
      </Card>

      <Eyebrow color={C.plum}>Meine Angebote ({liste.length})</Eyebrow>
      {liste.length === 0 ? <Leer>Noch keine Angebote — in der App steht bei deinen Klientinnen gerade nichts.</Leer> : liste.map((a) => (
        <Card key={a.id} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{a.titel}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>
              {[a.typ, a.einheiten, a.preis_cent != null ? `${(a.preis_cent / 100).toFixed(0)} €` : null].filter(Boolean).join(" · ")}
            </div>
          </div>
          {a.typ === "kurs" && <Btn small ghost onClick={() => setOffen(a)}>Module</Btn>}
          <button onClick={async () => { await angebotLoeschen(a.id); laden(); }} style={{ background: "none", border: "none", color: C.rot, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>löschen</button>
        </Card>
      ))}

      <div style={{ marginTop: 22 }}>
        <Eyebrow color={C.plum}>Anfragen ({anfragen.filter((a) => a.status === "offen").length} offen)</Eyebrow>
        {anfragen.length === 0 ? <Leer>Noch keine Anfragen.</Leer> : anfragen.map((a) => (
          <Card key={a.id} style={{ marginBottom: 9 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>
              {a.klientin_name} · {a.angebot_titel}
            </div>
            {a.nachricht && <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.espresso, lineHeight: 1.6, margin: "6px 0" }}>{a.nachricht}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, flex: 1 }}>
                {new Date(a.created_at).toLocaleDateString("de-DE")} · {a.status}
              </span>
              {a.status === "offen" && (
                <Btn small ghost onClick={async () => { await anfrageStatus(a.id, "erledigt"); laden(); }}>erledigt</Btn>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ── Beiträge ───────────────────────────────────────────────────────────── */

function Beitraege({ coachId }) {
  const [liste, setListe] = useState([]);
  const [form, setForm] = useState({ titel: "", text: "", quelle: "app", url: "" });

  const laden = () => { if (coachId) ladeCoachBeitraege(coachId, 50).then(setListe); };
  useEffect(() => { laden(); }, [coachId]); // eslint-disable-line

  const anlegen = async () => {
    if (!form.text.trim()) return;
    await beitragAnlegen({
      titel: form.titel.trim() || null, text: form.text.trim(),
      quelle: form.quelle, externUrl: form.url.trim() || null,
    });
    setForm({ titel: "", text: "", quelle: "app", url: "" });
    laden();
  };

  return (
    <>
      <Eyebrow color={C.plum}>Neuer Beitrag</Eyebrow>
      <Card style={{ marginBottom: 22 }}>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.6, margin: "0 0 12px" }}>
          Erscheint bei deinen Klientinnen unter „Neu von deiner Coachin". Wenn du den
          Inhalt auch auf Instagram oder YouTube veröffentlicht hast, trag den Link ein —
          dann führt ein Tipp direkt zum Original.
        </p>
        <Feld label="Titel (optional)" value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })} />
        <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={5} placeholder="Impuls der Woche …" style={{ ...feldStil, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ flex: "1 1 150px" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Quelle</div>
            <select value={form.quelle} onChange={(e) => setForm({ ...form, quelle: e.target.value })} style={feldStil}>
              <option value="app">Nur App</option><option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option><option value="pinterest">Pinterest</option>
              <option value="blog">Blog</option><option value="newsletter">Newsletter</option>
            </select>
          </label>
          <div style={{ flex: "2 1 220px" }}><Feld label="Link zum Original (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
        </div>
        <Btn onClick={anlegen} disabled={!form.text.trim()}>Veröffentlichen</Btn>
      </Card>

      <Eyebrow color={C.plum}>Veröffentlicht ({liste.length})</Eyebrow>
      {liste.length === 0 ? <Leer>Noch nichts veröffentlicht.</Leer> : liste.map((b) => (
        <Card key={b.id} style={{ marginBottom: 9 }}>
          {b.titel && <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso, marginBottom: 4 }}>{b.titel}</div>}
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.espresso, lineHeight: 1.6, margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{b.text}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, flex: 1 }}>
              {new Date(b.veroeffentlicht_am).toLocaleDateString("de-DE")} · {b.quelle}
            </span>
            <button onClick={async () => { await beitragLoeschen(b.id); laden(); }} style={{ background: "none", border: "none", color: C.rot, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>löschen</button>
          </div>
        </Card>
      ))}
    </>
  );
}

/* ── Profil ─────────────────────────────────────────────────────────────── */

function Profil({ profil, neuLaden }) {
  const [f, setF] = useState({
    name: profil?.name || "", kurzprofil: profil?.kurzprofil || "",
    email_oeffentlich: profil?.email_oeffentlich || "", telefon: profil?.telefon || "",
    buchungslink: profil?.buchungslink || "",
    instagram: profil?.instagram || "", youtube: profil?.youtube || "",
    pinterest: profil?.pinterest || "", website: profil?.website || "",
    tiktok: profil?.tiktok || "", facebook: profil?.facebook || "", linkedin: profil?.linkedin || "",
  });
  const [hinweis, setHinweis] = useState("");

  const speichern = async () => {
    const putz = (x) => (x || "").trim() || null;
    const ok = await coachProfilSpeichern({
      name: putz(f.name), kurzprofil: putz(f.kurzprofil),
      email_oeffentlich: putz(f.email_oeffentlich), telefon: putz(f.telefon),
      buchungslink: putz(f.buchungslink),
      instagram: putz(f.instagram), youtube: putz(f.youtube), pinterest: putz(f.pinterest),
      website: putz(f.website), tiktok: putz(f.tiktok), facebook: putz(f.facebook), linkedin: putz(f.linkedin),
    });
    setHinweis(ok ? "✓ Gespeichert — deine Klientinnen sehen die Änderung sofort." : "Speichern fehlgeschlagen.");
    if (ok) neuLaden();
    setTimeout(() => setHinweis(""), 4000);
  };

  return (
    <>
      <Eyebrow color={C.plum}>Dein Profil in der App</Eyebrow>
      <Card style={{ marginBottom: 20 }}>
        <Feld label="Name, den deine Klientinnen sehen" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Vor- und Nachname" />
        <Feld label="Ein, zwei Sätze über dich" value={f.kurzprofil} onChange={(e) => setF({ ...f, kurzprofil: e.target.value })} placeholder="Womit du arbeitest, in deinen Worten" />
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.6, margin: "6px 0 12px" }}>
          Nur ausgefüllte Felder erscheinen in der App — leere werden gar nicht angezeigt.
        </p>

        <Feld label="E-Mail für Klientinnen" value={f.email_oeffentlich} onChange={(e) => setF({ ...f, email_oeffentlich: e.target.value })} placeholder="hallo@deine-praxis.de" />
        <Feld label="Telefon (optional)" value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} placeholder="+49 â¦" />
        <Feld label="Buchungslink" value={f.buchungslink} onChange={(e) => setF({ ...f, buchungslink: e.target.value })} placeholder="https://calendly.com/â¦ oder cal.com, eTermin â¦" />
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, lineHeight: 1.6, margin: "-4px 0 14px", opacity: .8 }}>
          Der Termin entsteht in deinem eigenen Werkzeug. Trägst du hier nichts ein, buchen deine
          Klientinnen über die freien Zeitfenster, die du unter „Termine" anlegst.
        </p>

        <Feld label="Instagram" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} placeholder="https://instagram.com/…" />
        <Feld label="YouTube" value={f.youtube} onChange={(e) => setF({ ...f, youtube: e.target.value })} placeholder="https://youtube.com/@…" />
        <Feld label="Pinterest" value={f.pinterest} onChange={(e) => setF({ ...f, pinterest: e.target.value })} placeholder="https://pinterest.com/…" />
        <Feld label="Website" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://…" />
        <Feld label="TikTok" value={f.tiktok} onChange={(e) => setF({ ...f, tiktok: e.target.value })} placeholder="https://tiktok.com/@…" />
        <Feld label="Facebook" value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} placeholder="https://facebook.com/…" />
        <Feld label="LinkedIn" value={f.linkedin} onChange={(e) => setF({ ...f, linkedin: e.target.value })} placeholder="https://linkedin.com/in/…" />
        <Btn onClick={speichern}>Speichern</Btn>
        {hinweis && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.plum, marginTop: 10 }}>{hinweis}</div>}
      </Card>

      <Btn ghost onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>Abmelden</Btn>
    </>
  );
}

/* ── Rahmen ─────────────────────────────────────────────────────────────── */

export default function CoachPanel() {
  const [bereit, setBereit] = useState(false);
  const [session, setSession] = useState(null);
  const [profil, setProfil] = useState(null);
  const [klientinnen, setKlientinnen] = useState([]);
  const [ungelesen, setUngelesen] = useState({});
  const [tab, setTab] = useState("klientinnen");
  const [chat, setChat] = useState(null);

  const alles = async () => {
    const [p, k, u] = await Promise.all([ladeCoachProfilSelbst(), ladeMeineKlientinnen(), ladeUngelesen()]);
    setProfil(p); setKlientinnen(k); setUngelesen(u);
  };

  useEffect(() => {
    if (!supabase) { setBereit(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBereit(true);
      if (data.session) alles();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) alles();
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  if (!supabase)
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Card style={{ maxWidth: 420 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso, marginBottom: 8 }}>Keine Cloud konfiguriert</div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            Das Coach-Panel arbeitet ausschließlich mit echten Daten. Trag in <code>app/.env</code>
            {" "}die Supabase-Zugänge ein und lade neu.
          </p>
        </Card>
      </div>
    );

  if (!bereit) return <div style={{ minHeight: "100vh", background: C.cream }} />;
  if (!session) return <Anmeldung onFertig={alles} />;

  const TABS = [
    ["klientinnen", "Klientinnen"],
    ["nachrichten", `Nachrichten${Object.values(ungelesen).reduce((a, b) => a + b, 0) ? ` (${Object.values(ungelesen).reduce((a, b) => a + b, 0)})` : ""}`],
    ["termine", "Termine"],
    ["material", "Material"],
    ["angebote", "Angebote"],
    ["beitraege", "Beiträge"],
    ["profil", "Profil"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "26px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 27, color: C.espresso }}>
            smile<span style={{ color: C.rose, fontStyle: "italic" }}>2</span>go
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Coach-Panel</div>
        </div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginBottom: 20 }}>
          {profil?.name || session.user.email}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => { setTab(k); setChat(null); }} style={{
              fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600,
              padding: "9px 15px", borderRadius: 20, cursor: "pointer", minHeight: 38,
              border: `1.5px solid ${tab === k ? C.gold : C.line}`,
              background: tab === k ? C.goldPale : C.card,
              color: tab === k ? C.espresso : C.ink,
            }}>{label}</button>
          ))}
        </div>

        {tab === "klientinnen" && (
          <Klientinnen
            klientinnen={klientinnen}
            neuLaden={alles}
            ungelesen={ungelesen}
            oeffneChat={(k) => { setChat(k); setTab("nachrichten"); }}
          />
        )}
        {tab === "nachrichten" && (
          <Nachrichten
            klientinnen={klientinnen}
            offen={chat}
            setOffen={setChat}
            ungelesenNeu={() => ladeUngelesen().then(setUngelesen)}
          />
        )}
        {tab === "termine" && <Termine />}
        {tab === "material" && <Material coachId={session.user.id} klientinnen={klientinnen} />}
        {tab === "angebote" && <Angebote coachId={session.user.id} />}
        {tab === "beitraege" && <Beitraege coachId={session.user.id} />}
        {tab === "profil" && <Profil profil={profil} neuLaden={alles} />}
      </div>
    </div>
  );
}
