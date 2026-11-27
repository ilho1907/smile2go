import { useState, useEffect, useRef } from "react";
import {
  supportAdminListe, supportAdminTicket, supportAdminZaehler, supportTeamListe, supportRegelnListe,
  supportAdminAntworten, supportAdminStatus, supportAdminZuweisen, supportAdminEinstufen,
  supportTeamSetzen, supportRegelSetzen, supportRegelLoeschen, supportAnhangLink, neuerSchluessel,
  supportWissenSuche, supportWissenListe, supportWissenSpeichern, supportWissenEinreichen, supportWissenLoeschen,
} from "./supabase";
import {
  SUPPORT_KATEGORIEN, SUPPORT_PRIORITAETEN, SUPPORT_STATUS, KATEGORIE_LABEL, PRIORITAET_LABEL, STATUS_LABEL,
  STATUS_TON, PRIORITAET_TON, zeitpunkt,
} from "./supportTexte";

/* ─────────────────────────────────────────────
   Admin › Support-Tickets (ilho-technik)
   Sichtbar für Admins und das Support-Team. Jede Aktion prüft die Datenbank
   erneut (ist_support / ist_admin) — die Oberfläche ist nur Bedienung.
   Die KI hat nur vorsortiert; hier entscheidet ein Mensch.
   ───────────────────────────────────────────── */

const sys = { fontFamily: "system-ui, sans-serif" };
const AKTION = { erstellt: "Erstellt", status: "Status", zuweisung: "Zuweisung", einstufung: "Einstufung geändert", ki_routing: "KI-Einstufung", ki_fehler: "KI-Fehler → manuelle Prüfung" };
const KI_TON = { ok: ["#E7F5EC", "#2F7A4B", "KI"], fehler: ["#FBE3DE", "#A3321F", "KI-Fehler"], ausstehend: ["#F1F1F3", "#5D5D6B", "KI läuft"], ueberschrieben: ["#EEF1FB", "#3A4C8C", "manuell eingestuft"] };

const Chip = ({ ton, children }) => (
  <span style={{ ...sys, fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: ton[0], color: ton[1], whiteSpace: "nowrap" }}>{children}</span>
);

export default function AdminSupport({ C, Card, Eyebrow, istAdmin, onZaehler }) {
  const [filter, setFilter] = useState({ status: "", kategorie: "", prioritaet: "", zustaendig: "", von: "", bis: "", suche: "", manuell: false });
  const [liste, setListe] = useState(undefined);
  const [zaehler, setZaehler] = useState(null);
  const [team, setTeam] = useState([]);
  const [offen, setOffen] = useState(null);
  const [verwaltung, setVerwaltung] = useState(false);
  const [wissenAuf, setWissenAuf] = useState(false);

  const laden = async () => {
    const [l, z] = await Promise.all([supportAdminListe(filter), supportAdminZaehler()]);
    setListe(l); setZaehler(z); onZaehler?.(z);
  };
  useEffect(() => { laden(); }, [filter.status, filter.kategorie, filter.prioritaet, filter.zustaendig, filter.von, filter.bis, filter.manuell]);
  useEffect(() => { const t = setTimeout(laden, 350); return () => clearTimeout(t); }, [filter.suche]);
  useEffect(() => { supportTeamListe().then(setTeam); const t = setInterval(laden, 45000); return () => clearInterval(t); }, []);

  if (liste === null)
    return <Card><p style={{ ...sys, fontSize: 14.5, color: C.ink }}>Die Support-Tickets sind noch nicht eingerichtet. Bitte die Migration <code>20261124_ilho_technik.sql</code> im Supabase-SQL-Editor ausführen.</p></Card>;

  const sel = { ...sys, fontSize: 14, padding: "9px 10px", borderRadius: 11, border: `1.5px solid ${C.line}`, background: C.card, color: C.espresso, minHeight: 40 };
  const setF = (k) => (e) => setFilter((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {zaehler && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[["Offen", zaehler.offen, () => setFilter((f) => ({ ...f, status: "", manuell: false }))],
            ["Neu", zaehler.neu, () => setFilter((f) => ({ ...f, status: "eingegangen" }))],
            ["Manuelle Prüfung", zaehler.manuell, () => setFilter((f) => ({ ...f, manuell: true }))],
            ["Mir zugewiesen", zaehler.meine, () => setFilter((f) => ({ ...f, zustaendig: "ich" }))]].map(([t, n, fn]) => (
            <button key={t} onClick={fn} style={{ all: "unset", cursor: "pointer", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 16px", minWidth: 110 }}>
              <div style={{ ...sys, fontSize: 12, color: C.ink, letterSpacing: 1, textTransform: "uppercase" }}>{t}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.espresso }}>{Number(n || 0)}</div>
            </button>
          ))}
        </div>
      )}

      <Card>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <input aria-label="Suche" placeholder="Suche: Nummer, Betreff, Text, E-Mail" value={filter.suche} onChange={setF("suche")} style={{ ...sel, gridColumn: "1 / -1" }} />
          <select aria-label="Status" value={filter.status} onChange={setF("status")} style={sel}><option value="">Alle Status</option>{SUPPORT_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select aria-label="Kategorie" value={filter.kategorie} onChange={setF("kategorie")} style={sel}><option value="">Alle Kategorien</option>{SUPPORT_KATEGORIEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select aria-label="Priorität" value={filter.prioritaet} onChange={setF("prioritaet")} style={sel}><option value="">Alle Prioritäten</option>{SUPPORT_PRIORITAETEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select aria-label="Zuständig" value={filter.zustaendig} onChange={setF("zustaendig")} style={sel}>
            <option value="">Alle Zuständigen</option><option value="ich">Mir zugewiesen</option><option value="niemand">Admin-Queue (niemand)</option>
            {team.filter((m) => m.aktiv).map((m) => <option key={m.user_id} value={m.user_id}>{m.anzeigename}</option>)}
          </select>
          <label style={{ ...sys, fontSize: 12.5, color: C.ink }}>Von<input type="date" value={filter.von} onChange={setF("von")} style={{ ...sel, width: "100%", boxSizing: "border-box" }} /></label>
          <label style={{ ...sys, fontSize: 12.5, color: C.ink }}>Bis<input type="date" value={filter.bis} onChange={setF("bis")} style={{ ...sel, width: "100%", boxSizing: "border-box" }} /></label>
          <label style={{ ...sys, fontSize: 14, color: C.espresso, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={filter.manuell} onChange={setF("manuell")} /> Nur manuelle Prüfung
          </label>
        </div>
      </Card>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "start" }}>
        <Card style={{ padding: 10 }}>
          {liste === undefined ? <p style={{ ...sys, color: C.ink, padding: 8 }}>Lade …</p> : liste.length === 0 ? <p style={{ ...sys, color: C.ink, padding: 8 }}>Keine Tickets für diesen Filter.</p> :
            liste.map((t) => (
              <button key={t.id} onClick={() => setOffen(t.id)} style={{
                all: "unset", cursor: "pointer", display: "block", boxSizing: "border-box", width: "100%", padding: "11px 10px", borderRadius: 12,
                borderBottom: `1px solid ${C.line}`, background: offen === t.id ? C.goldPale : "transparent",
              }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ ...sys, fontSize: 12.5, color: C.ink, fontWeight: 700 }}>{t.nummer}</span>
                  <Chip ton={STATUS_TON[t.status]}>{STATUS_LABEL[t.status]}</Chip>
                  <Chip ton={PRIORITAET_TON[t.prioritaet]}>{PRIORITAET_LABEL[t.prioritaet]}</Chip>
                  {t.manuell_pruefen && t.status !== "geloest" && <Chip ton={["#FFF3DD", "#8A5A12"]}>Admin-Queue</Chip>}
                  {t.ki_status === "fehler" && <Chip ton={KI_TON.fehler}>{KI_TON.fehler[2]}</Chip>}
                </div>
                <div style={{ ...sys, fontSize: 15, fontWeight: 700, color: C.espresso, marginTop: 4, wordBreak: "break-word" }}>{t.betreff}</div>
                <div style={{ ...sys, fontSize: 12.5, color: C.ink, marginTop: 2, wordBreak: "break-all" }}>
                  {t.email} · {t.rolle === "coachin" ? "Coachin" : "Mitglied"} · {KATEGORIE_LABEL[t.kategorie]} · {t.zustaendig_name || "nicht zugewiesen"} · {zeitpunkt(t.aktualisiert_am)}
                </div>
              </button>
            ))}
        </Card>
        <div>{offen ? <Detail key={offen} id={offen} C={C} Card={Card} Eyebrow={Eyebrow} team={team} onGeaendert={laden} /> : <Card><p style={{ ...sys, color: C.ink }}>Wähle links ein Ticket.</p></Card>}</div>
      </div>

      <Card>
        <button onClick={() => setWissenAuf((v) => !v)} style={{ ...sys, border: "none", background: "none", color: C.plum, fontWeight: 700, fontSize: 14.5, padding: 0, cursor: "pointer" }}>
          {wissenAuf ? "▾" : "▸"} 📚 Wissensbasis (lernt aus gelösten Tickets · Ar-Ge · Web)
        </button>
        {wissenAuf && <Wissensbasis C={C} sel={sel} />}
      </Card>

      {istAdmin && (
        <Card>
          <button onClick={() => setVerwaltung((v) => !v)} style={{ ...sys, border: "none", background: "none", color: C.plum, fontWeight: 700, fontSize: 14.5, padding: 0, cursor: "pointer" }}>
            {verwaltung ? "▾" : "▸"} Support-Team & Routing-Regeln
          </button>
          {verwaltung && <Verwaltung C={C} team={team} setTeam={setTeam} sel={sel} />}
        </Card>
      )}
    </div>
  );
}

function Detail({ id, C, Card, Eyebrow, team, onGeaendert }) {
  const [d, setD] = useState(undefined);
  const [links, setLinks] = useState({});
  const [text, setText] = useState("");
  const [intern, setIntern] = useState(false);
  const [statusDanach, setStatusDanach] = useState("");
  const [meldung, setMeldung] = useState("");
  const [arbeitet, setArbeitet] = useState(false);
  const [einst, setEinst] = useState(null);
  const [treffer, setTreffer] = useState([]);
  const schluessel = useRef(neuerSchluessel());

  const laden = () => supportAdminTicket(id).then((x) => { setD(x); if (x) setEinst({ kategorie: x.ticket.kategorie, prioritaet: x.ticket.prioritaet }); });
  useEffect(() => { laden(); }, [id]);
  useEffect(() => {
    if (d?.ticket) supportWissenSuche(`${d.ticket.betreff} ${d.ticket.beschreibung}`, 3).then((w) => setTreffer((w || []).filter((x) => x.freigegeben)));
  }, [d?.ticket?.id]);
  useEffect(() => {
    (d?.anhaenge || []).forEach((a) => { if (!links[a.pfad]) supportAnhangLink(a.pfad).then((u) => u && setLinks((l) => ({ ...l, [a.pfad]: u }))); });
  }, [d?.anhaenge?.length]);

  if (d === undefined) return <Card><p style={{ ...sys, color: C.ink }}>Lade …</p></Card>;
  if (!d) return <Card><p style={{ ...sys, color: C.ink }}>Ticket nicht verfügbar.</p></Card>;
  const t = d.ticket;
  const sel = { ...sys, fontSize: 14, padding: "8px 10px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.espresso, minHeight: 38 };
  const knopf = { ...sys, fontSize: 13.5, fontWeight: 700, padding: "9px 14px", borderRadius: 14, cursor: "pointer", border: "none", background: C.gold, color: "#fff", minHeight: 38 };

  const ausfuehren = async (fn, ok) => {
    setArbeitet(true); setMeldung("");
    const r = await fn();
    setArbeitet(false);
    if (r?.fehler) setMeldung("Fehler: " + r.fehler); else { setMeldung(ok); laden(); onGeaendert?.(); }
  };
  const senden = () => text.trim() && ausfuehren(async () => {
    const r = await supportAdminAntworten({ ticketId: t.id, userId: t.user_id, nummer: t.nummer, text: text.trim(), intern, schluessel: schluessel.current, status: statusDanach || null });
    if (!r.fehler) { schluessel.current = neuerSchluessel(); setText(""); setStatusDanach(""); }
    return r;
  }, intern ? "Interne Notiz gespeichert." : "Antwort gesendet.");

  const ki = KI_TON[t.ki_status] || KI_TON.ausstehend;
  return (
    <Card>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <Eyebrow color={C.plum}>{t.nummer}</Eyebrow>
        <Chip ton={STATUS_TON[t.status]}>{STATUS_LABEL[t.status]}</Chip>
        <Chip ton={PRIORITAET_TON[t.prioritaet]}>{PRIORITAET_LABEL[t.prioritaet]}</Chip>
      </div>
      <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 21, color: C.espresso, margin: "4px 0 2px", wordBreak: "break-word" }}>{t.betreff}</h3>
      <div style={{ ...sys, fontSize: 13, color: C.ink, wordBreak: "break-all" }}>{t.email} · {t.rolle === "coachin" ? "Coachin" : "Mitglied"} · eingegangen {zeitpunkt(t.created_at)}</div>

      {/* KI-Einstufung + Überschreiben */}
      <div style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 14, padding: 12, marginTop: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Chip ton={ki}>{ki[2]}</Chip>
          {t.ki_kategorie && <span style={{ ...sys, fontSize: 13, color: C.espresso }}>Vorschlag: {KATEGORIE_LABEL[t.ki_kategorie]} · {PRIORITAET_LABEL[t.ki_prioritaet]}</span>}
          <span style={{ ...sys, fontSize: 12.5, color: C.ink }}>Gewählt von der Nutzerin: {KATEGORIE_LABEL[t.kategorie_nutzerin]}</span>
        </div>
        {t.ki_begruendung && <p style={{ ...sys, fontSize: 13.5, color: C.espresso, margin: "6px 0 0" }}>„{t.ki_begruendung}“</p>}
        {t.ki_fehler && <p style={{ ...sys, fontSize: 13, color: "#A3321F", margin: "6px 0 0" }}>{t.ki_fehler}</p>}
        {einst && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <select aria-label="Kategorie ändern" value={einst.kategorie} onChange={(e) => setEinst({ ...einst, kategorie: e.target.value })} style={sel}>{SUPPORT_KATEGORIEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <select aria-label="Priorität ändern" value={einst.prioritaet} onChange={(e) => setEinst({ ...einst, prioritaet: e.target.value })} style={sel}>{SUPPORT_PRIORITAETEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <button disabled={arbeitet || (einst.kategorie === t.kategorie && einst.prioritaet === t.prioritaet)} onClick={() => ausfuehren(() => supportAdminEinstufen(t.id, einst.kategorie, einst.prioritaet), "Einstufung gespeichert.")}
              style={{ ...knopf, opacity: einst.kategorie === t.kategorie && einst.prioritaet === t.prioritaet ? 0.5 : 1 }}>Einstufung übernehmen</button>
          </div>
        )}
      </div>

      {/* Zuständig + Status */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <label style={{ ...sys, fontSize: 12.5, color: C.ink, display: "grid", gap: 3 }}>Zuständig
          <select aria-label="Zuständig ändern" value={t.zustaendig || ""} disabled={arbeitet} onChange={(e) => ausfuehren(() => supportAdminZuweisen(t.id, e.target.value || null), "Zuweisung gespeichert.")} style={sel}>
            <option value="">Admin-Queue (niemand)</option>
            {team.filter((m) => m.aktiv || m.user_id === t.zustaendig).map((m) => <option key={m.user_id} value={m.user_id}>{m.anzeigename}</option>)}
          </select>
        </label>
        <label style={{ ...sys, fontSize: 12.5, color: C.ink, display: "grid", gap: 3 }}>Status
          <select aria-label="Status ändern" value={t.status} disabled={arbeitet} onChange={(e) => ausfuehren(() => supportAdminStatus({ ticketId: t.id, userId: t.user_id, nummer: t.nummer, status: e.target.value, label: STATUS_LABEL[e.target.value] }), "Status gespeichert.")} style={sel}>
            {SUPPORT_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>

      {/* Verlauf der Nachrichten */}
      <div style={{ display: "grid", gap: 8, marginTop: 14, maxHeight: 420, overflowY: "auto", padding: "2px" }}>
        <Nachricht C={C} n={{ von: "nutzerin", autor: "Nutzerin", text: t.beschreibung, created_at: t.created_at }} />
        {d.nachrichten.map((n) => <Nachricht key={n.id} C={C} n={n} />)}
      </div>
      {d.anhaenge.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {d.anhaenge.map((a) => links[a.pfad]
            ? <a key={a.id} href={links[a.pfad]} target="_blank" rel="noreferrer"><img src={links[a.pfad]} alt={a.dateiname} style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.line}` }} /></a>
            : <div key={a.id} style={{ width: 84, height: 84, borderRadius: 10, background: C.beige }} />)}
        </div>
      )}

      {treffer.length > 0 && (
        <div style={{ marginTop: 12, border: `1px dashed ${C.line}`, borderRadius: 12, padding: "8px 10px" }}>
          <div style={{ ...sys, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.ink }}>📚 Passend aus der Wissensbasis</div>
          {treffer.map((w) => (
            <div key={w.id} style={{ ...sys, fontSize: 13.5, color: C.espresso, padding: "6px 0", display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 180 }}>{w.titel}</span>
              <button onClick={() => { setIntern(false); setText((x) => (x ? x + "\n\n" : "") + w.inhalt); }}
                style={{ ...sys, fontSize: 12.5, border: `1px solid ${C.line}`, background: C.card, borderRadius: 10, padding: "4px 9px", cursor: "pointer", color: C.plum }}>in Antwort übernehmen</button>
            </div>
          ))}
        </div>
      )}

      {/* Antworten / interne Notiz */}
      <div style={{ marginTop: 12, background: intern ? "#FFF8E6" : "transparent", borderRadius: 12, padding: intern ? 8 : 0 }}>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000}
          placeholder={intern ? "Interne Notiz — nur für das Support-Team sichtbar" : "Antwort an die Nutzerin …"}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) senden(); }}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 15, ...sys, border: `1.5px solid ${intern ? "#E8C46A" : C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", resize: "vertical" }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
          <label style={{ ...sys, fontSize: 13.5, color: C.espresso, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={intern} onChange={(e) => setIntern(e.target.checked)} /> Interne Notiz
          </label>
          {!intern && (
            <select aria-label="Status nach dem Senden" value={statusDanach} onChange={(e) => setStatusDanach(e.target.value)} style={sel}>
              <option value="">Status beibehalten</option>
              {SUPPORT_STATUS.map(([k, l]) => <option key={k} value={k}>danach: {l}</option>)}
            </select>
          )}
          <button onClick={senden} disabled={arbeitet || !text.trim()} style={{ ...knopf, opacity: text.trim() ? 1 : 0.5 }}>{intern ? "Notiz speichern" : "Antwort senden"}</button>
        </div>
        {meldung && <p role="status" style={{ ...sys, fontSize: 13, color: meldung.startsWith("Fehler") ? "#A3321F" : C.ink, margin: "6px 0 0" }}>{meldung}</p>}
      </div>

      {/* Protokoll */}
      <details style={{ marginTop: 14 }}>
        <summary style={{ ...sys, fontSize: 13.5, fontWeight: 700, color: C.plum, cursor: "pointer" }}>Protokoll ({d.verlauf.length})</summary>
        <div style={{ marginTop: 6 }}>
          {d.verlauf.map((v, i) => (
            <div key={i} style={{ ...sys, fontSize: 12.5, color: C.espresso, padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ color: C.ink }}>{zeitpunkt(v.created_at)}</span> · <b>{v.akteur}</b> · {AKTION[v.aktion] || v.aktion}
              {v.aktion === "status" ? `: ${STATUS_LABEL[v.alt] || v.alt || "—"} → ${STATUS_LABEL[v.neu] || v.neu}` : v.alt ? `: ${v.alt} → ${v.neu}` : v.neu ? `: ${v.neu}` : ""}
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
}

const Nachricht = ({ C, n }) => {
  const team = n.von === "team";
  return (
    <div style={{
      justifySelf: team ? "end" : "start", maxWidth: "88%", padding: "9px 12px", borderRadius: 14, whiteSpace: "pre-wrap", wordBreak: "break-word",
      background: n.intern ? "#FFF3D1" : team ? C.goldPale : C.beige, border: n.intern ? "1.5px dashed #E0B44C" : "none", ...sys, fontSize: 14.5, color: C.espresso,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: n.intern ? "#8A5A12" : C.ink, marginBottom: 2 }}>
        {n.intern ? `🔒 Interne Notiz · ${n.autor}` : n.autor}
      </div>
      {n.text}
      <div style={{ fontSize: 10.5, color: C.ink, marginTop: 4 }}>{zeitpunkt(n.created_at)}</div>
    </div>
  );
};

function Verwaltung({ C, team, setTeam, sel }) {
  const [regeln, setRegeln] = useState([]);
  const [neu, setNeu] = useState({ email: "", name: "" });
  const [regel, setRegel] = useState({ kategorie: "", prioritaet: "", zustaendig: "", rang: 100 });
  const [meldung, setMeldung] = useState("");
  const laden = () => { supportTeamListe().then(setTeam); supportRegelnListe().then(setRegeln); };
  useEffect(() => { supportRegelnListe().then(setRegeln); }, []);
  const knopf = { ...sys, fontSize: 13.5, fontWeight: 700, padding: "9px 14px", borderRadius: 14, cursor: "pointer", border: "none", background: C.gold, color: "#fff", minHeight: 38 };
  const fertig = (r, ok) => { setMeldung(r?.fehler ? "Fehler: " + r.fehler : ok); laden(); };

  return (
    <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
      <div>
        <div style={{ ...sys, fontSize: 13, fontWeight: 700, color: C.espresso, marginBottom: 6 }}>Support-Team</div>
        {team.map((m) => (
          <div key={m.user_id} style={{ ...sys, fontSize: 13.5, color: C.espresso, display: "flex", gap: 8, alignItems: "center", padding: "5px 0", flexWrap: "wrap" }}>
            <b>{m.anzeigename}</b><span style={{ color: C.ink }}>{m.email}</span><span style={{ color: C.ink }}>· {m.offen} offen</span>
            <button onClick={async () => fertig(await supportTeamSetzen(m.email, m.anzeigename, !m.aktiv), "Gespeichert.")} style={{ ...sys, fontSize: 12.5, border: `1px solid ${C.line}`, background: C.card, borderRadius: 10, padding: "3px 8px", cursor: "pointer", color: C.plum }}>
              {m.aktiv ? "deaktivieren" : "aktivieren"}
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <input placeholder="E-Mail des Kontos" value={neu.email} onChange={(e) => setNeu({ ...neu, email: e.target.value })} style={sel} />
          <input placeholder="Anzeigename" value={neu.name} onChange={(e) => setNeu({ ...neu, name: e.target.value })} style={sel} />
          <button style={knopf} onClick={async () => { const r = await supportTeamSetzen(neu.email, neu.name); if (!r.fehler) setNeu({ email: "", name: "" }); fertig(r, "Teammitglied gespeichert."); }}>Hinzufügen</button>
        </div>
      </div>

      <div>
        <div style={{ ...sys, fontSize: 13, fontWeight: 700, color: C.espresso, marginBottom: 6 }}>Routing-Regeln (spezifischste zuerst, dann Rang, dann geringste Auslastung)</div>
        {regeln.length === 0 && <p style={{ ...sys, fontSize: 13, color: C.ink, margin: 0 }}>Keine Regeln — alle Tickets landen in der Admin-Queue.</p>}
        {regeln.map((r) => (
          <div key={r.id} style={{ ...sys, fontSize: 13.5, color: C.espresso, display: "flex", gap: 8, alignItems: "center", padding: "4px 0", flexWrap: "wrap" }}>
            <span>{r.kategorie ? KATEGORIE_LABEL[r.kategorie] : "jede Kategorie"} · {r.prioritaet ? PRIORITAET_LABEL[r.prioritaet] : "jede Priorität"} → <b>{r.zustaendig_name}</b> (Rang {r.rang})</span>
            <button onClick={async () => fertig(await supportRegelLoeschen(r.id), "Regel gelöscht.")} style={{ ...sys, fontSize: 12.5, border: `1px solid ${C.line}`, background: C.card, borderRadius: 10, padding: "3px 8px", cursor: "pointer", color: "#A3321F" }}>löschen</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <select value={regel.kategorie} onChange={(e) => setRegel({ ...regel, kategorie: e.target.value })} style={sel}><option value="">jede Kategorie</option>{SUPPORT_KATEGORIEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select value={regel.prioritaet} onChange={(e) => setRegel({ ...regel, prioritaet: e.target.value })} style={sel}><option value="">jede Priorität</option>{SUPPORT_PRIORITAETEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select value={regel.zustaendig} onChange={(e) => setRegel({ ...regel, zustaendig: e.target.value })} style={sel}><option value="">zuständig …</option>{team.filter((m) => m.aktiv).map((m) => <option key={m.user_id} value={m.user_id}>{m.anzeigename}</option>)}</select>
          <input type="number" min={1} max={999} value={regel.rang} onChange={(e) => setRegel({ ...regel, rang: Number(e.target.value) || 100 })} style={{ ...sel, width: 80 }} aria-label="Rang" />
          <button style={knopf} disabled={!regel.zustaendig} onClick={async () => fertig(await supportRegelSetzen(regel), "Regel gespeichert.")}>Regel anlegen</button>
        </div>
      </div>
      {meldung && <p role="status" style={{ ...sys, fontSize: 13, color: C.ink, margin: 0 }}>{meldung}</p>}
    </div>
  );
}

const QUELLE = { ticket: "aus Ticket", arge: "Ar-Ge", web: "Web", manuell: "manuell" };

function Wissensbasis({ C, sel }) {
  const [liste, setListe] = useState(undefined);
  const [nurEntwuerfe, setNurEntwuerfe] = useState(true);
  const [bearbeiten, setBearbeiten] = useState(null);
  const [neu, setNeu] = useState({ titel: "", inhalt: "", kategorie: "", quelle: "manuell", url: "" });
  const [meldung, setMeldung] = useState("");
  const laden = () => supportWissenListe(nurEntwuerfe).then(setListe);
  useEffect(() => { laden(); }, [nurEntwuerfe]);
  const knopf = { ...sys, fontSize: 13.5, fontWeight: 700, padding: "9px 14px", borderRadius: 14, cursor: "pointer", border: "none", background: C.gold, color: "#fff", minHeight: 38 };
  const klein = { ...sys, fontSize: 12.5, border: `1px solid ${C.line}`, background: C.card, borderRadius: 10, padding: "4px 9px", cursor: "pointer", color: C.plum };
  const fertig = (r, ok) => { setMeldung(r?.fehler ? "Fehler: " + r.fehler : ok); if (!r?.fehler) { setBearbeiten(null); laden(); } };
  const feld = { ...sel, width: "100%", boxSizing: "border-box" };

  if (liste === null) return <p style={{ ...sys, fontSize: 13.5, color: C.ink }}>Wissensbasis noch nicht eingerichtet (Migration ausführen).</p>;
  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <p style={{ ...sys, fontSize: 13, color: C.ink, margin: 0, lineHeight: 1.5 }}>
        Gelöste Tickets werden automatisch zu Entwürfen; der Ar-Ge-Agent oder n8n liefert per <code>support_wissen_einreichen</code> zu.
        Erst nach Freigabe nutzt das Team den Eintrag; mit „für Nutzerinnen“ erscheint er als Selbsthilfe im Formular. Bitte persönliche Angaben vor der Freigabe entfernen.
      </p>
      <label style={{ ...sys, fontSize: 13.5, color: C.espresso, display: "flex", gap: 6, alignItems: "center" }}>
        <input type="checkbox" checked={nurEntwuerfe} onChange={(e) => setNurEntwuerfe(e.target.checked)} /> nur Entwürfe (zu prüfen)
      </label>
      {liste === undefined ? <p style={{ ...sys, color: C.ink }}>Lade …</p> : liste.length === 0 ? <p style={{ ...sys, fontSize: 13.5, color: C.ink }}>Keine Einträge.</p> :
        liste.map((w) => bearbeiten?.id === w.id ? (
          <div key={w.id} style={{ border: `1px solid ${C.gold}`, borderRadius: 12, padding: 10, display: "grid", gap: 8 }}>
            <input aria-label="Titel" value={bearbeiten.titel} onChange={(e) => setBearbeiten({ ...bearbeiten, titel: e.target.value })} maxLength={160} style={feld} />
            <textarea aria-label="Inhalt" rows={6} value={bearbeiten.inhalt} onChange={(e) => setBearbeiten({ ...bearbeiten, inhalt: e.target.value })} maxLength={3000} style={{ ...feld, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <select value={bearbeiten.kategorie || ""} onChange={(e) => setBearbeiten({ ...bearbeiten, kategorie: e.target.value })} style={sel}><option value="">ohne Kategorie</option>{SUPPORT_KATEGORIEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <label style={{ ...sys, fontSize: 13.5 }}><input type="checkbox" checked={bearbeiten.freigegeben} onChange={(e) => setBearbeiten({ ...bearbeiten, freigegeben: e.target.checked, fuer_nutzerinnen: e.target.checked && bearbeiten.fuer_nutzerinnen })} /> freigegeben</label>
              <label style={{ ...sys, fontSize: 13.5, opacity: bearbeiten.freigegeben ? 1 : 0.5 }}><input type="checkbox" disabled={!bearbeiten.freigegeben} checked={bearbeiten.fuer_nutzerinnen} onChange={(e) => setBearbeiten({ ...bearbeiten, fuer_nutzerinnen: e.target.checked })} /> für Nutzerinnen (Selbsthilfe)</label>
              <button style={knopf} onClick={async () => fertig(await supportWissenSpeichern({ ...bearbeiten, fuerNutzerinnen: bearbeiten.fuer_nutzerinnen }), "Gespeichert.")}>Speichern</button>
              <button style={klein} onClick={() => setBearbeiten(null)}>abbrechen</button>
            </div>
          </div>
        ) : (
          <div key={w.id} style={{ borderBottom: `1px solid ${C.line}`, padding: "8px 0" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <Chip ton={w.freigegeben ? ["#E7F5EC", "#2F7A4B"] : ["#FFF3DD", "#8A5A12"]}>{w.freigegeben ? "freigegeben" : "Entwurf"}</Chip>
              {w.fuer_nutzerinnen && <Chip ton={["#EEF1FB", "#3A4C8C"]}>Selbsthilfe</Chip>}
              <span style={{ ...sys, fontSize: 12, color: C.ink }}>{QUELLE[w.quelle]}{w.ticket_nummer ? ` ${w.ticket_nummer}` : ""}{w.kategorie ? ` · ${KATEGORIE_LABEL[w.kategorie]}` : ""}</span>
              {w.quelle_url && <a href={w.quelle_url} target="_blank" rel="noreferrer" style={{ ...sys, fontSize: 12, color: C.plum }}>Quelle ↗</a>}
            </div>
            <div style={{ ...sys, fontSize: 14.5, fontWeight: 700, color: C.espresso, marginTop: 3 }}>{w.titel}</div>
            <div style={{ ...sys, fontSize: 13, color: C.ink, marginTop: 2, whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden" }}>{w.inhalt}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button style={klein} onClick={() => setBearbeiten({ ...w })}>prüfen / bearbeiten</button>
              <button style={{ ...klein, color: "#A3321F" }} onClick={async () => fertig(await supportWissenLoeschen(w.id), "Gelöscht.")}>löschen</button>
            </div>
          </div>
        ))}

      <div style={{ display: "grid", gap: 8, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
        <div style={{ ...sys, fontSize: 13, fontWeight: 700, color: C.espresso }}>Neuer Eintrag</div>
        <input placeholder="Titel (z. B. „Push kommt auf dem iPhone nicht an“)" value={neu.titel} onChange={(e) => setNeu({ ...neu, titel: e.target.value })} maxLength={160} style={feld} />
        <textarea rows={4} placeholder="Lösung in einfachen Worten" value={neu.inhalt} onChange={(e) => setNeu({ ...neu, inhalt: e.target.value })} maxLength={3000} style={{ ...feld, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select aria-label="Quelle" value={neu.quelle} onChange={(e) => setNeu({ ...neu, quelle: e.target.value })} style={sel}>
            <option value="manuell">Quelle: eigenes Wissen</option><option value="web">Quelle: Web</option><option value="arge">Quelle: Ar-Ge</option>
          </select>
          {neu.quelle !== "manuell" && <input placeholder="https://… (Quelle)" value={neu.url} onChange={(e) => setNeu({ ...neu, url: e.target.value })} style={{ ...sel, flex: 1, minWidth: 180 }} />}
          <select value={neu.kategorie} onChange={(e) => setNeu({ ...neu, kategorie: e.target.value })} style={sel}><option value="">ohne Kategorie</option>{SUPPORT_KATEGORIEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <button style={knopf} disabled={neu.titel.trim().length < 3 || neu.inhalt.trim().length < 10} onClick={async () => {
            const r = neu.quelle === "manuell"
              ? await supportWissenSpeichern({ titel: neu.titel, inhalt: neu.inhalt, kategorie: neu.kategorie, freigegeben: false })
              : await supportWissenEinreichen({ titel: neu.titel, inhalt: neu.inhalt, kategorie: neu.kategorie, quelle: neu.quelle, url: neu.url || null });
            if (!r.fehler) setNeu({ titel: "", inhalt: "", kategorie: "", quelle: "manuell", url: "" });
            fertig(r, "Als Entwurf gespeichert.");
          }}>Als Entwurf speichern</button>
        </div>
      </div>
      {meldung && <p role="status" style={{ ...sys, fontSize: 13, color: C.ink, margin: 0 }}>{meldung}</p>}
    </div>
  );
}
