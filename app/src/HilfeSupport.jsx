import { useState, useEffect, useRef } from "react";
import {
  supabase, supportTicketErstellen, supportAnhangHochladen, supportAnhangLink,
  meineSupportTickets, meinSupportTicket, supportAntworten, neuerSchluessel,
  SUPPORT_ANHANG_TYPEN, SUPPORT_ANHANG_MAX,
} from "./supabase";
import { SUPPORT_KATEGORIEN, KATEGORIE_LABEL, STATUS_LABEL, STATUS_TON, zeitpunkt } from "./supportTexte";

/* ─────────────────────────────────────────────
   Hilfe & Support (ilho-technik) — für Mitglieder, Klientinnen und Coachinnen.
   Nur nach Anmeldung. Jede Frau sieht ausschließlich ihre eigenen Tickets,
   die Antworten des Supports und den Status-Verlauf. Interne Notizen,
   Zuweisung und KI-Einstufung liefert die Datenbank gar nicht erst aus.
   Nichts hiervon erscheint in der Community.
   Farben: C aus der jeweiligen Oberfläche (App-Thema oder Coach-Panel).
   ───────────────────────────────────────────── */

const STANDARD = {
  cream: "#FBF6FA", card: "#FFFDFE", beige: "#F5EBF3", line: "#EFDFEC",
  gold: "#8E4C85", goldPale: "#F9EAF4", espresso: "#2E2430", ink: "#7A6B7A", plum: "#6E3568", aufGold: "#FFFFFF",
};
const sys = { fontFamily: "system-ui, sans-serif" };

export default function HilfeSupport({ C: farben, startTicket = null }) {
  const C = { ...STANDARD, ...(farben || {}) };
  const [ansicht, setAnsicht] = useState(startTicket ? { art: "ticket", id: startTicket } : { art: "liste" });
  const [angemeldet, setAngemeldet] = useState(undefined);

  useEffect(() => {
    if (!supabase) { setAngemeldet(false); return; }
    supabase.auth.getSession().then(({ data }) => setAngemeldet(!!data.session));
  }, []);

  if (angemeldet === undefined) return <div style={{ padding: 22 }} />;
  if (!angemeldet)
    return (
      <div style={{ padding: 22 }}>
        <p style={{ ...sys, fontSize: 16.5, color: C.ink, lineHeight: 1.6 }}>
          Hilfe & Support ist nur mit Anmeldung möglich — so bleiben deine Anfragen privat. Bitte melde dich an und öffne diesen Bereich erneut.
        </p>
      </div>
    );

  if (ansicht.art === "neu") return <NeueAnfrage C={C} onFertig={(id) => setAnsicht({ art: "ticket", id, neu: true })} onZurueck={() => setAnsicht({ art: "liste" })} />;
  if (ansicht.art === "ticket") return <TicketAnsicht C={C} id={ansicht.id} frischAngelegt={!!ansicht.neu} onZurueck={() => setAnsicht({ art: "liste" })} />;
  return <Liste C={C} onNeu={() => setAnsicht({ art: "neu" })} onOeffnen={(id) => setAnsicht({ art: "ticket", id })} />;
}

const StatusChip = ({ status }) => {
  const [bg, fg] = STATUS_TON[status] || ["#eee", "#333"];
  return <span style={{ ...sys, fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: bg, color: fg, whiteSpace: "nowrap" }}>{STATUS_LABEL[status] || status}</span>;
};

const Knopf = ({ C, children, onClick, disabled, zart, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...sys, fontSize: 16.5, fontWeight: 700, padding: "13px 18px", borderRadius: 16, cursor: disabled ? "default" : "pointer", minHeight: 48,
    border: zart ? `1.5px solid ${C.line}` : "none", background: zart ? C.card : C.gold, color: zart ? C.espresso : (C.aufGold || "#fff"),
    opacity: disabled ? 0.55 : 1, ...style,
  }}>{children}</button>
);

const Hinweis247 = ({ C }) => (
  <p style={{ ...sys, fontSize: 13.5, color: C.ink, lineHeight: 1.55, margin: "0 0 18px" }}>
    Du kannst rund um die Uhr eine Anfrage stellen; wir melden uns so bald wie möglich. Deine Anfragen sieht nur das smile2go-Support-Team — nicht deine Coachin und nicht die Community.
    In einer Krise ruf bitte die TelefonSeelsorge an (0800 111 0 111) oder im Notfall die 112.
  </p>
);

// ── Liste der eigenen Tickets ───────────────────────────────────────────────
function Liste({ C, onNeu, onOeffnen }) {
  const [tickets, setTickets] = useState(undefined);
  const laden = () => meineSupportTickets().then(setTickets);
  useEffect(() => { laden(); const t = setInterval(laden, 30000); return () => clearInterval(t); }, []);

  return (
    <div style={{ padding: "18px 18px 30px" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 19, lineHeight: 1.5, color: C.espresso, margin: "0 0 6px" }}>
        Etwas klappt nicht oder du hast eine Frage? Wir helfen dir.
      </p>
      <Hinweis247 C={C} />
      <Knopf C={C} onClick={onNeu} style={{ width: "100%", marginBottom: 22 }}>+ Neue Anfrage</Knopf>

      <div style={{ ...sys, fontSize: 12.5, letterSpacing: 1.8, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 8 }}>Deine Anfragen</div>
      {tickets === undefined && <p style={{ ...sys, fontSize: 15.5, color: C.ink }}>Lade …</p>}
      {tickets === null && <p style={{ ...sys, fontSize: 15.5, color: C.ink }}>Deine Anfragen sind gerade nicht erreichbar. Bitte prüfe deine Verbindung.</p>}
      {tickets?.length === 0 && <p style={{ ...sys, fontSize: 15.5, color: C.ink }}>Du hast noch keine Anfrage gestellt.</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {(tickets || []).map((t) => (
          <button key={t.id} onClick={() => onOeffnen(t.id)} style={{
            all: "unset", cursor: "pointer", display: "block", boxSizing: "border-box", width: "100%", padding: "14px 15px", borderRadius: 16,
            background: C.card, border: `1px solid ${Number(t.ungelesen) ? C.gold : C.line}`,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span style={{ ...sys, fontSize: 13, color: C.ink, fontWeight: 600 }}>{t.nummer}</span>
              <StatusChip status={t.status} />
            </div>
            <div style={{ ...sys, fontSize: 17, fontWeight: 700, color: C.espresso, marginTop: 6, wordBreak: "break-word" }}>
              {Number(t.ungelesen) > 0 && <span aria-label="neu" style={{ display: "inline-block", width: 9, height: 9, borderRadius: 9, background: C.gold, marginRight: 7, verticalAlign: "middle" }} />}
              {t.betreff}
            </div>
            <div style={{ ...sys, fontSize: 13.5, color: C.ink, marginTop: 3 }}>{KATEGORIE_LABEL[t.kategorie]} · zuletzt {zeitpunkt(t.aktualisiert_am)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Screenshot-Auswahl ──────────────────────────────────────────────────────
function ScreenshotWahl({ C, datei, setDatei, setFehler }) {
  const feld = useRef(null);
  const waehlen = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!SUPPORT_ANHANG_TYPEN.includes(f.type)) { setFehler("Bitte nur PNG, JPG oder WebP."); return; }
    if (f.size > SUPPORT_ANHANG_MAX) { setFehler("Der Screenshot ist größer als 5 MB."); return; }
    setFehler(""); setDatei(f);
  };
  return (
    <div style={{ marginTop: 4 }}>
      <input ref={feld} type="file" accept="image/png,image/jpeg,image/webp" onChange={waehlen} style={{ display: "none" }} />
      {datei ? (
        <div style={{ ...sys, display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: C.espresso, background: C.beige, borderRadius: 12, padding: "9px 12px" }}>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📎 {datei.name}</span>
          <button onClick={() => setDatei(null)} style={{ ...sys, border: "none", background: "none", color: C.plum, fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>Entfernen</button>
        </div>
      ) : (
        <button onClick={() => feld.current?.click()} style={{ ...sys, border: `1.5px dashed ${C.line}`, background: "transparent", color: C.plum, fontWeight: 700, fontSize: 15, padding: "11px 14px", borderRadius: 12, cursor: "pointer", width: "100%" }}>
          📷 Screenshot anhängen (optional · PNG/JPG/WebP, max. 5 MB)
        </button>
      )}
    </div>
  );
}

// ── Neue Anfrage ────────────────────────────────────────────────────────────
function NeueAnfrage({ C, onFertig, onZurueck }) {
  const [kategorie, setKategorie] = useState("");
  const [betreff, setBetreff] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [datei, setDatei] = useState(null);
  const [fehler, setFehler] = useState("");
  const [sendet, setSendet] = useState(false);
  // Ein Schlüssel pro Formular: wer zweimal tippt oder neu sendet, erzeugt kein zweites Ticket.
  const schluessel = useRef(neuerSchluessel());

  const bereit = kategorie && betreff.trim().length >= 3 && beschreibung.trim().length >= 10;
  const feld = { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 17, ...sys, border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, outline: "none" };
  const label = { ...sys, display: "block", fontSize: 14.5, fontWeight: 700, color: C.espresso, margin: "16px 0 6px" };

  const absenden = async () => {
    if (!bereit || sendet) return;
    setSendet(true); setFehler("");
    const r = await supportTicketErstellen({ betreff: betreff.trim(), beschreibung: beschreibung.trim(), kategorie, schluessel: schluessel.current });
    if (r?.fehler) { setSendet(false); setFehler(r.fehler); return; }
    if (datei) {
      const a = await supportAnhangHochladen(r.id, datei);
      if (a?.fehler) try { sessionStorage.setItem("s2g_support_hinweis", `Deine Anfrage ${r.nummer} ist gespeichert, aber: ${a.fehler}`); } catch {}
    }
    setSendet(false);
    onFertig(r.id);
  };

  return (
    <div style={{ padding: "16px 18px 30px" }}>
      <button onClick={onZurueck} style={{ ...sys, border: "none", background: "none", color: C.plum, fontSize: 15.5, fontWeight: 700, padding: 0, cursor: "pointer" }}>‹ Meine Anfragen</button>
      <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 24, color: C.espresso, margin: "10px 0 4px" }}>Neue Anfrage</h2>
      <Hinweis247 C={C} />

      <span style={label}>Worum geht es?</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} role="radiogroup" aria-label="Kategorie">
        {SUPPORT_KATEGORIEN.map(([k, l]) => (
          <button key={k} role="radio" aria-checked={kategorie === k} onClick={() => setKategorie(k)} style={{
            ...sys, fontSize: 15, fontWeight: 600, padding: "10px 14px", borderRadius: 999, cursor: "pointer", minHeight: 42,
            border: `1.5px solid ${kategorie === k ? C.gold : C.line}`, background: kategorie === k ? C.goldPale : C.card, color: C.espresso,
          }}>{l}</button>
        ))}
      </div>

      <label style={label} htmlFor="sup-betreff">Betreff</label>
      <input id="sup-betreff" value={betreff} onChange={(e) => setBetreff(e.target.value)} maxLength={150} placeholder="z. B. App lädt nach dem Login nicht" style={feld} />

      <label style={label} htmlFor="sup-text">Beschreibung</label>
      <textarea id="sup-text" rows={6} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} maxLength={5000}
        placeholder="Was ist passiert? Was hast du davor gemacht? Welches Gerät nutzt du?" style={{ ...feld, resize: "vertical" }} />
      <div style={{ ...sys, fontSize: 12.5, color: C.ink, textAlign: "right", marginTop: 3 }}>{beschreibung.length} / 5000</div>

      <ScreenshotWahl C={C} datei={datei} setDatei={setDatei} setFehler={setFehler} />

      {fehler && <p role="alert" style={{ ...sys, fontSize: 15, color: "#B0492F", margin: "12px 0 0" }}>{fehler}</p>}
      <Knopf C={C} onClick={absenden} disabled={!bereit || sendet} style={{ width: "100%", marginTop: 18 }}>{sendet ? "Wird gesendet …" : "Anfrage senden"}</Knopf>
      {!bereit && <p style={{ ...sys, fontSize: 13, color: C.ink, margin: "8px 0 0" }}>Bitte Kategorie wählen, Betreff (mind. 3 Zeichen) und Beschreibung (mind. 10 Zeichen) ausfüllen.</p>}
    </div>
  );
}

// ── Ein Ticket ──────────────────────────────────────────────────────────────
function TicketAnsicht({ C, id, frischAngelegt, onZurueck }) {
  const [daten, setDaten] = useState(undefined);
  const [links, setLinks] = useState({});
  const [text, setText] = useState("");
  const [datei, setDatei] = useState(null);
  const [fehler, setFehler] = useState("");
  const [sendet, setSendet] = useState(false);
  const [hinweis] = useState(() => { try { const h = sessionStorage.getItem("s2g_support_hinweis"); sessionStorage.removeItem("s2g_support_hinweis"); return h; } catch { return null; } });
  const schluessel = useRef(neuerSchluessel());

  const laden = () => meinSupportTicket(id).then(setDaten);
  useEffect(() => { laden(); const t = setInterval(laden, 30000); return () => clearInterval(t); }, [id]);
  useEffect(() => {
    (daten?.anhaenge || []).forEach((a) => {
      if (links[a.pfad]) return;
      supportAnhangLink(a.pfad).then((u) => u && setLinks((l) => ({ ...l, [a.pfad]: u })));
    });
  }, [daten?.anhaenge?.length]);

  const antworten = async () => {
    if (!text.trim() || sendet) return;
    setSendet(true); setFehler("");
    const r = await supportAntworten(id, text.trim(), schluessel.current);
    if (r.fehler) { setSendet(false); setFehler(r.fehler); return; }
    if (datei) {
      const a = await supportAnhangHochladen(id, datei, r.id);
      if (a?.fehler) setFehler(a.fehler);
    }
    schluessel.current = neuerSchluessel();
    setText(""); setDatei(null); setSendet(false);
    laden();
  };

  if (daten === undefined) return <div style={{ padding: 22, ...sys, color: C.ink }}>Lade …</div>;
  if (daten === null)
    return (
      <div style={{ padding: 22 }}>
        <button onClick={onZurueck} style={{ ...sys, border: "none", background: "none", color: C.plum, fontSize: 15.5, fontWeight: 700, padding: 0, cursor: "pointer" }}>‹ Meine Anfragen</button>
        <p style={{ ...sys, fontSize: 16, color: C.ink, lineHeight: 1.6 }}>Diese Anfrage ist nicht verfügbar.</p>
      </div>
    );

  const t = daten.ticket;
  return (
    <div style={{ padding: "16px 18px 30px" }}>
      <button onClick={onZurueck} style={{ ...sys, border: "none", background: "none", color: C.plum, fontSize: 15.5, fontWeight: 700, padding: 0, cursor: "pointer" }}>‹ Meine Anfragen</button>

      {frischAngelegt && (
        <div role="status" style={{ ...sys, background: "#E7F5EC", color: "#2F7A4B", borderRadius: 14, padding: "12px 14px", fontSize: 15.5, margin: "12px 0 0", lineHeight: 1.5 }}>
          Danke! Deine Anfrage ist eingegangen. Deine Ticketnummer: <b>{t.nummer}</b>
        </div>
      )}
      {hinweis && <div style={{ ...sys, background: "#FFF3DD", color: "#8A5A12", borderRadius: 14, padding: "10px 14px", fontSize: 14.5, margin: "10px 0 0" }}>{hinweis}</div>}

      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginTop: 14 }}>
        <span style={{ ...sys, fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{t.nummer} · {KATEGORIE_LABEL[t.kategorie]}</span>
        <StatusChip status={t.status} />
      </div>
      <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 23, color: C.espresso, margin: "8px 0 12px", wordBreak: "break-word" }}>{t.betreff}</h2>

      {/* Status-Verlauf */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ ...sys, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 6 }}>Verlauf</div>
        {daten.verlauf.map((v, i) => (
          <div key={i} style={{ ...sys, display: "flex", gap: 10, fontSize: 14.5, color: C.espresso, padding: "4px 0" }}>
            <span style={{ color: C.ink, minWidth: 128, fontSize: 13.5 }}>{zeitpunkt(v.created_at)}</span>
            <span>{v.aktion === "erstellt" ? "Anfrage eingegangen" : `Status: ${STATUS_LABEL[v.neu] || v.neu}`}</span>
          </div>
        ))}
      </div>

      {/* Nachrichten: zuerst die Beschreibung */}
      <div style={{ display: "grid", gap: 9 }}>
        <Blase C={C} von="nutzerin" autor="Du" zeit={t.created_at} text={t.beschreibung} />
        {daten.nachrichten.map((n) => <Blase key={n.id} C={C} von={n.von} autor={n.autor} zeit={n.created_at} text={n.text} />)}
      </div>

      {daten.anhaenge.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {daten.anhaenge.map((a) => links[a.pfad] ? (
            <a key={a.id} href={links[a.pfad]} target="_blank" rel="noreferrer" title={a.dateiname}>
              <img src={links[a.pfad]} alt={a.dateiname} style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 12, border: `1px solid ${C.line}` }} />
            </a>
          ) : <div key={a.id} style={{ width: 92, height: 92, borderRadius: 12, background: C.beige }} />)}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <label htmlFor="sup-antwort" style={{ ...sys, display: "block", fontSize: 14.5, fontWeight: 700, color: C.espresso, marginBottom: 6 }}>
          {t.status === "geloest" ? "Noch etwas offen? Schreib uns — die Anfrage wird wieder geöffnet." : "Antwort schreiben"}
        </label>
        <textarea id="sup-antwort" rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder="Deine Nachricht …"
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 17, ...sys, border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso, outline: "none", resize: "vertical" }} />
        <ScreenshotWahl C={C} datei={datei} setDatei={setDatei} setFehler={setFehler} />
        {fehler && <p role="alert" style={{ ...sys, fontSize: 15, color: "#B0492F", margin: "10px 0 0" }}>{fehler}</p>}
        <Knopf C={C} onClick={antworten} disabled={sendet || !text.trim()} style={{ width: "100%", marginTop: 12 }}>{sendet ? "Wird gesendet …" : "Senden"}</Knopf>
      </div>
    </div>
  );
}

const Blase = ({ C, von, autor, zeit, text }) => {
  const team = von === "team";
  return (
    <div style={{
      justifySelf: team ? "start" : "end", maxWidth: "88%", padding: "10px 14px", borderRadius: 16,
      background: team ? C.card : C.goldPale, border: `1px solid ${C.line}`,
      ...sys, fontSize: 16.5, lineHeight: 1.5, color: C.espresso, whiteSpace: "pre-wrap", wordBreak: "break-word",
    }}>
      <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: team ? C.gold : C.ink, fontWeight: 700, marginBottom: 3 }}>{autor}</div>
      {text}
      <div style={{ fontSize: 12, color: C.ink, marginTop: 4, textAlign: "right" }}>{zeitpunkt(zeit)}</div>
    </div>
  );
};
