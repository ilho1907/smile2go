import { useState, useEffect, Fragment } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  supabase, istAdmin, ladeKiQualitaet, ladeFairnessChecks, starteFairnessCheck,
  adminKennzahlen, adminWachstum, adminMitglieder, adminSessions, adminMeldungen, adminMeldungErledigen, adminSystem, cloudErreichbar,
} from "./supabase";
import { ILHO_SYSTEM } from "./ilho";
import { alsCsv } from "./export";

/* ─────────────────────────────────────────────
   smile2go — ADMIN DASHBOARD · echte Daten aus Supabase
   Zugang: nur Konten in der Tabelle `admins` (Prüfung in jeder DB-Funktion).
   Datenschutz: keine Nachrichten-, Journal- oder Anfragetexte — nur Zähler.
   ───────────────────────────────────────────── */

const C = {
  cream: "#F4EDE2", card: "#FFFDF9", beige: "#ECE2D1", line: "#E3D6C2",
  gold: "#C1913C", goldPale: "#F6EAD3", espresso: "#3A332B", ink: "#6F6355",
  sage: "#5E8A52", rose: "#C2526E", roseSoft: "#F5DBE1", plum: "#8A3F5A", rot: "#B0492F",
};

const Kpi = ({ t, v, s, accent }) => (
  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 18px", flex: 1, minWidth: 150 }}>
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>{t}</div>
    <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: accent || C.espresso, margin: "6px 0 2px" }}>{v}</div>
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>{s}</div>
  </div>
);

const Eyebrow = ({ children, color = C.gold }) => (
  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color, fontWeight: 700, marginBottom: 8 }}>{children}</div>
);

const Card = ({ children, style }) => (
  <div className="s2g-card" style={{ background: `linear-gradient(165deg, #FFFFFF 0%, ${C.card} 55%, #FFFCF7 100%)`, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18, boxShadow: "0 16px 34px -22px rgba(110,80,45,.38), 0 2px 6px -2px rgba(110,80,45,.08)", ...style }}>{children}</div>
);

const Badge = ({ children, tone }) => {
  const map = { ok: ["#EAF6EC", C.sage], warn: ["#FBF0DC", "#9A6A1F"], rot: ["#F9E8E2", C.rot], gold: [C.goldPale, "#8A6420"], rose: [C.roseSoft, C.plum] };
  const [bg, fg] = map[tone] || map.gold;
  return <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, fontWeight: 700, background: bg, color: fg, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" }}>{children}</span>;
};

const sys = { fontFamily: "system-ui, sans-serif" };
const zahl = (n) => Number(n || 0).toLocaleString("de-DE");
const datum = (iso) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "–");
const datumZeit = (iso) => new Date(iso).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const Hinweis = ({ children }) => <p style={{ ...sys, fontSize: 11.5, color: C.ink, marginTop: 12, opacity: 0.85, lineHeight: 1.5 }}>{children}</p>;
const Leer = ({ children }) => <p style={{ ...sys, fontSize: 13, color: C.ink, margin: "6px 0" }}>{children}</p>;

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [tab, setTab] = useState("uebersicht");
  const [k, setK] = useState(null);
  const [wachstum, setWachstum] = useState([]);

  useEffect(() => {
    (async () => {
      const ok = supabase ? await istAdmin() : false;
      setAdmin(ok);
      if (!ok) return;
      const [kz, w] = await Promise.all([adminKennzahlen(), adminWachstum()]);
      setK(kz); setWachstum(w.map((z) => ({ m: new Date(z.monat).toLocaleDateString("de-DE", { month: "short" }), neu: Number(z.neu) })));
    })();
  }, []);

  if (admin === null) return <div style={{ minHeight: "100vh", background: C.cream }} />;
  if (!admin)
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ maxWidth: 440 }}>
          <Eyebrow>Admin · kein Zugriff</Eyebrow>
          <p style={{ ...sys, fontSize: 14, color: C.espresso, lineHeight: 1.6, margin: 0 }}>
            Dieses Dashboard zeigt echte Plattformdaten und ist nur für eingetragene Admins. Melde dich in der App mit deinem Admin-Konto an und öffne dann wieder <code>#admin</code>.
          </p>
          <a href="/" style={{ ...sys, display: "inline-block", marginTop: 14, fontSize: 13, fontWeight: 700, color: C.plum }}>← Zur App</a>
        </Card>
      </div>
    );

  const TABS = [
    ["uebersicht", "📊 Übersicht"], ["mitglieder", "👥 Mitglieder"], ["sessions", "📅 Sessions"],
    ["moderation", `🛡️ Moderation${k?.meldungen_offen ? ` (${k.meldungen_offen})` : ""}`],
    ["fairness", "⚖️ KI & Fairness"], ["system", "🛠️ System"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontSize: 15 }}>
      <div style={{ background: C.espresso, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.cream }}>
          smile<span style={{ color: C.rose, fontStyle: "italic" }}>2</span>go <span style={{ fontSize: 12, color: "#D4B87A", letterSpacing: 2, textTransform: "uppercase", marginLeft: 6 }}>Admin</span>
        </div>
        <div style={{ flex: 1 }} />
        <a href="/" style={{ ...sys, fontSize: 12, color: "#D4B87A", textDecoration: "none" }}>← Zur App</a>
      </div>

      <div style={{ display: "flex", gap: 7, padding: "14px 20px 0", flexWrap: "wrap", maxWidth: 1100, margin: "0 auto" }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            ...sys, fontSize: 12.5, fontWeight: 700, padding: "9px 14px", borderRadius: 20, cursor: "pointer", minHeight: 38,
            border: `1.5px solid ${tab === key ? C.gold : C.line}`, background: tab === key ? C.goldPale : C.card, color: tab === key ? C.espresso : C.ink,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 20px 60px" }}>
        {tab === "uebersicht" && <Uebersicht k={k} wachstum={wachstum} />}
        {tab === "mitglieder" && <Mitglieder />}
        {tab === "sessions" && <Sessions />}
        {tab === "moderation" && <Moderation />}
        {tab === "fairness" && <KiFairness />}
        {tab === "system" && <SystemTab k={k} />}
      </div>
    </div>
  );
}

function Uebersicht({ k, wachstum }) {
  if (!k) return <Card>Lade Kennzahlen …</Card>;
  return (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <Kpi t="Mitglieder" v={zahl(k.mitglieder)} s={`+${zahl(k.neu_30)} in 30 Tagen`} />
        <Kpi t="Aktiv heute" v={zahl(k.aktiv_1)} s={`${zahl(k.aktiv_7)} in 7 Tagen`} />
        <Kpi t="Coachinnen" v={zahl(k.coaches)} s={`${zahl(k.bindungen_aktiv)} aktive Begleitungen`} />
        <Kpi t="Sessions (7 Tage)" v={zahl(k.sessions_7)} s={`${zahl(k.sessions_storniert_30)} abgesagt in 30 T.`} />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <Kpi t="Ungelesen bei Coachinnen" v={zahl(k.nachrichten_offen)} s={`${zahl(k.anfragen_offen)} offene Anfragen`} accent={k.nachrichten_offen ? C.plum : undefined} />
        <Kpi t="ilho-Nachrichten heute" v={zahl(k.ki_heute)} s={`${zahl(k.ki_30)} in 30 Tagen`} />
        <Kpi t="Lichtpunkte gesamt" v={zahl(k.punkte_summe)} s={`Ø ${zahl(k.punkte_schnitt)} pro Nutzerin`} />
        <Kpi t="Interessentinnen" v={zahl(k.interessentinnen_30)} s="neu in 30 Tagen" />
      </div>
      <Card>
        <Eyebrow>Neue Mitglieder pro Monat</Eyebrow>
        {wachstum.length === 0 ? <Leer>Noch keine Daten.</Leer> : (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={wachstum} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.ink }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.ink }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [v, "Neue Mitglieder"]} cursor={{ fill: C.beige }} />
                <Bar dataKey="neu" fill={C.rose} radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <Hinweis>Umsatz und Abos erscheinen hier, sobald Zahlungen (z. B. Stripe) angebunden sind — bis dahin zeigt das Dashboard bewusst keine geschätzten Beträge.</Hinweis>
      </Card>
    </>
  );
}

function Mitglieder() {
  const [suche, setSuche] = useState("");
  const [liste, setListe] = useState(null);
  const [filter, setFilter] = useState("Alle");
  useEffect(() => {
    const t = setTimeout(() => adminMitglieder(suche.trim(), 200).then(setListe), 250);
    return () => clearTimeout(t);
  }, [suche]);

  const gefiltert = (liste || []).filter((m) =>
    filter === "Alle" || (filter === "Coachinnen" && m.ist_coach) || (filter === "Mit Coachin" && m.hat_coach) ||
    (filter === "Inaktiv 30 T." && (!m.letzter_login || Date.now() - new Date(m.letzter_login) > 30 * 864e5)));

  const csv = () => alsCsv(`mitglieder-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["E-Mail", "Mitglied seit", "Letzter Login", "Coachin", "Hat Coachin", "Lichtpunkte"],
    ...gefiltert.map((m) => [m.email, datum(m.seit), datum(m.letzter_login), m.ist_coach ? "ja" : "", m.hat_coach ? "ja" : "", m.punkte ?? ""]),
  ]);

  return (
    <Card>
      <div style={{ display: "flex", gap: 9, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Suche nach E-Mail …"
          style={{ flex: 1, minWidth: 180, padding: "11px 14px", fontSize: 14, ...sys, border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.cream, color: C.espresso, outline: "none" }} />
        {["Alle", "Coachinnen", "Mit Coachin", "Inaktiv 30 T."].map((p) => (
          <button key={p} onClick={() => setFilter(p)} style={{ ...sys, fontSize: 12, fontWeight: 700, padding: "9px 13px", borderRadius: 18, cursor: "pointer", border: `1.5px solid ${filter === p ? C.gold : C.line}`, background: filter === p ? C.goldPale : C.card, color: C.espresso }}>{p}</button>
        ))}
        <button onClick={csv} style={{ ...sys, fontSize: 12, fontWeight: 700, padding: "9px 13px", borderRadius: 18, cursor: "pointer", border: "none", background: C.espresso, color: C.cream }}>CSV</button>
      </div>
      {liste === null ? <Leer>Lade …</Leer> : gefiltert.length === 0 ? <Leer>Keine Treffer.</Leer> : gefiltert.map((m) => (
        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", ...sys, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{(m.email || "?").charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ ...sys, fontWeight: 700, fontSize: 13.5, color: C.espresso, wordBreak: "break-all" }}>{m.email}</div>
            <div style={{ ...sys, fontSize: 11.5, color: C.ink }}>seit {datum(m.seit)} · letzter Login {datum(m.letzter_login)}</div>
          </div>
          {m.ist_coach && <Badge tone="rose">Coachin</Badge>}
          {m.hat_coach && <Badge tone="ok">begleitet</Badge>}
          <span style={{ ...sys, fontSize: 12, color: C.ink, minWidth: 64, textAlign: "right" }}>✨ {m.punkte == null ? "–" : zahl(m.punkte)}</span>
        </div>
      ))}
      <Hinweis>Angezeigt werden bis zu 200 Konten. Löschen einer Nutzerin bitte über ihren eigenen „Konto löschen“-Weg oder das Supabase-Dashboard (DSGVO-Protokoll).</Hinweis>
    </Card>
  );
}

function Sessions() {
  const [liste, setListe] = useState(null);
  useEffect(() => { adminSessions().then(setListe); }, []);
  return (
    <Card>
      <Eyebrow>📅 Sessions ab heute</Eyebrow>
      {liste === null ? <Leer>Lade …</Leer> : liste.length === 0 ? <Leer>Keine anstehenden Sessions.</Leer> : liste.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 4px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.plum, minWidth: 150 }}>{datumZeit(b.beginn)}</span>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ ...sys, fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{b.klientin || "Klientin"} <span style={{ fontWeight: 400, color: C.ink }}>bei {b.coach || "Coachin"}</span></div>
            <div style={{ ...sys, fontSize: 11.5, color: C.ink }}>{b.dauer_min} Min · {b.kanal}{b.kanal === "video" && !b.hat_videolink ? " · ⚠ noch kein Videolink" : ""}</div>
          </div>
          <Badge tone={b.status === "gebucht" ? "ok" : b.status === "erledigt" ? "gold" : "rot"}>{b.status}</Badge>
        </div>
      ))}
      <Hinweis>Erinnerungen gehen automatisch 24 h und 1 h vorher per Push an Klientin und Coachin.</Hinweis>
    </Card>
  );
}

function Moderation() {
  const [liste, setListe] = useState(null);
  const laden = () => adminMeldungen().then(setListe);
  useEffect(() => { laden(); }, []);
  const erledigen = async (m, ausblenden) => { await adminMeldungErledigen(m.post_id, ausblenden); laden(); };
  return (
    <Card>
      <Eyebrow color={C.plum}>🛡️ Gemeldete Community-Beiträge</Eyebrow>
      {liste === null ? <Leer>Lade …</Leer> : liste.length === 0 ? <Leer>Keine offenen Meldungen. 🤍</Leer> : liste.map((m) => (
        <div key={m.post_id} style={{ padding: "12px 4px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ ...sys, fontWeight: 700, fontSize: 13, color: C.espresso }}>{m.alias}</span>
            <Badge tone="rot">{m.anzahl}× gemeldet</Badge>
            {!m.sichtbar && <Badge tone="warn">ausgeblendet</Badge>}
            <span style={{ ...sys, fontSize: 11, color: C.ink }}>{datumZeit(m.gemeldet_am)}</span>
          </div>
          <div style={{ ...sys, fontSize: 13.5, color: C.espresso, lineHeight: 1.55, background: C.cream, borderRadius: 10, padding: "10px 12px", whiteSpace: "pre-wrap" }}>{m.text}</div>
          <div style={{ ...sys, fontSize: 12, color: C.ink, margin: "6px 0 8px" }}>Grund: {m.grund}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => erledigen(m, true)} style={{ ...sys, fontSize: 12.5, fontWeight: 700, padding: "8px 14px", borderRadius: 16, border: "none", background: C.rot, color: "#fff", cursor: "pointer" }}>Ausblenden</button>
            <button onClick={() => erledigen(m, false)} style={{ ...sys, fontSize: 12.5, fontWeight: 700, padding: "8px 14px", borderRadius: 16, border: `1.5px solid ${C.line}`, background: C.card, color: C.espresso, cursor: "pointer" }}>Ist in Ordnung</button>
          </div>
        </div>
      ))}
    </Card>
  );
}

function SystemTab({ k }) {
  const [st, setSt] = useState(null);
  const [cloud, setCloud] = useState(null);
  const [ki, setKi] = useState(null);
  useEffect(() => {
    adminSystem().then(setSt);
    cloudErreichbar().then(setCloud).catch(() => setCloud(false));
    // Nur ein CORS-Preflight (OPTIONS) — erreicht die Function, löst aber keinen KI-Aufruf aus.
    const url = import.meta.env?.VITE_AI_FUNCTION_URL;
    if (url) fetch(url, { method: "OPTIONS" }).then((r) => setKi(r.ok)).catch(() => setKi(false)); else setKi(false);
  }, []);
  const minutenSeit = (iso) => (iso ? Math.round((Date.now() - new Date(iso)) / 60000) : null);
  const cron = st?.cron_letzter;
  const cronAlt = cron ? minutenSeit(cron.start) : null;
  const fairTage = st?.fairness_letzter ? Math.floor((Date.now() - new Date(st.fairness_letzter)) / 864e5) : null;
  const zeilen = [
    { k: "Supabase (EU-Frankfurt)", ok: cloud, info: cloud == null ? "prüfe …" : cloud ? `erreichbar · DB ${st?.db_groesse_mb ?? "?"} MB` : "nicht erreichbar" },
    { k: "KI-Function /ai", ok: ki, info: ki == null ? "prüfe …" : ki ? "erreichbar" : "nicht erreichbar" },
    { k: "Termin-Erinnerungen (Cron, alle 15 Min)", ok: cron ? cron.status === "succeeded" && cronAlt < 30 : null,
      info: cron ? `letzter Lauf vor ${cronAlt} Min · ${cron.status} · ${st.cron_fehler_24h} Fehler / ${st.cron_laeufe_24h} Läufe in 24 h` : "noch kein Lauf" },
    { k: "Push-Geräte", ok: true, info: `${zahl(k?.push_geraete)} registriert` },
    { k: "Fairness-Test", ok: fairTage != null && fairTage <= 30, info: fairTage == null ? "noch nie — im Tab „KI & Fairness“ starten" : `vor ${fairTage} Tagen` },
  ];
  return (
    <Card>
      <Eyebrow>🛠️ Dienste-Status (live)</Eyebrow>
      {zeilen.map((z) => (
        <div key={z.k} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 4px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13 }}>{z.ok == null ? "⚪" : z.ok ? "🟢" : "🟠"}</span>
          <span style={{ flex: 1, minWidth: 180, ...sys, fontSize: 13.5, fontWeight: 700, color: C.espresso }}>{z.k}</span>
          <span style={{ ...sys, fontSize: 11.5, color: C.ink, textAlign: "right" }}>{z.info}</span>
        </div>
      ))}
      {cron && cron.status !== "succeeded" && cron.meldung && <Hinweis>Letzte Cron-Meldung: {cron.meldung}</Hinweis>}
      <Hinweis>Kosten der KI siehst du exakt in der Anthropic-Konsole; hier nur die Anzahl der ilho-Nachrichten (Übersicht).</Hinweis>
    </Card>
  );
}

/* ── KI-Qualität & Fairness (ICF A.1 / E.10) — echte Daten, nur für Admins ──
   1) Bewertungen der Nutzerinnen (👍/👎 + Grund) — anonym, nur Zähler.
   2) Paar-Tests: gleiche Frage, ein Merkmal anders — ein zweites Modell prüft auf ungleiche Behandlung. */
const GRUND_LABEL = { vorurteil: "Vorurteil / Klischee", falsch: "Falsch", unpassend: "Unpassend", unhilfreich: "Nicht hilfreich" };

function KiFairness() {
  const [admin, setAdmin] = useState(null);
  const [zeilen, setZeilen] = useState([]);
  const [checks, setChecks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [offen, setOffen] = useState(null);

  const laden = async () => {
    const ok = await istAdmin();
    setAdmin(ok);
    if (!ok) return;
    const [q, f] = await Promise.all([ladeKiQualitaet(90), ladeFairnessChecks(60)]);
    setZeilen(q); setChecks(f);
  };
  useEffect(() => { laden(); }, []);

  if (admin === null) return <Card>Lade …</Card>;
  if (!supabase || !admin)
    return (
      <Card>
        <Eyebrow>Kein Zugriff</Eyebrow>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>
          Echte KI-Daten sieht nur, wer als Admin eingetragen ist. Melde dich in der App mit deinem Admin-Konto an und öffne dann wieder <code>#admin</code>.
        </p>
      </Card>
    );

  // Wochenreihe: Anteil 👍 an allen Bewertungen.
  const wochen = {};
  const gruende = {};
  for (const z of zeilen) {
    const w = z.woche;
    if (z.event_type === "ilho_bewertung") {
      wochen[w] = wochen[w] || { gut: 0, schlecht: 0 };
      if (z.topic_tag === "gut" || z.topic_tag === "schlecht") wochen[w][z.topic_tag] += Number(z.anzahl);
    } else if (z.event_type === "ilho_bewertung_grund") {
      gruende[z.topic_tag] = (gruende[z.topic_tag] || 0) + Number(z.anzahl);
    }
  }
  const reihe = Object.entries(wochen).sort(([a], [b]) => a.localeCompare(b)).map(([w, v]) => ({
    w: new Date(w).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    anteil: v.gut + v.schlecht ? Math.round((v.gut / (v.gut + v.schlecht)) * 100) : null,
    n: v.gut + v.schlecht,
  }));
  const summe = reihe.reduce((a, r) => a + r.n, 0);
  const gut = Object.values(wochen).reduce((a, v) => a + v.gut, 0);
  const balken = Object.keys(GRUND_LABEL).map((k) => ({ k: GRUND_LABEL[k], n: gruende[k] || 0 }));
  const vorurteile = gruende.vorurteil || 0;

  const letzterLauf = checks[0]?.lauf_am ? new Date(checks[0].lauf_am) : null;
  const laeufe = [...new Set(checks.map((c) => c.lauf_id))];
  const aktuell = checks.filter((c) => c.lauf_id === laeufe[0]);
  const tageSeit = letzterLauf ? Math.floor((Date.now() - letzterLauf.getTime()) / 864e5) : null;

  const pruefen = async () => {
    setBusy(true); setInfo("");
    const r = await starteFairnessCheck(ILHO_SYSTEM);
    setBusy(false);
    setInfo(r?.fehler || (r?.error ? `Fehler: ${r.error}` : `✓ ${r.gesamt} Paare geprüft · ${r.auffaellig} auffällig`));
    laden();
  };

  const sys = { fontFamily: "system-ui, sans-serif" };
  return (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Kpi t="Bewertungen (90 T.)" v={summe} s="👍 + 👎 in ilho" />
        <Kpi t="Hilfreich" v={summe ? `${Math.round((gut / summe) * 100)} %` : "–"} s="Anteil 👍" />
        <Kpi t="Vorurteil gemeldet" v={vorurteile} s="👎 mit Grund „Klischee“" accent={vorurteile ? C.rot : undefined} />
        <Kpi t="Letzter Fairness-Test" v={tageSeit === null ? "nie" : tageSeit === 0 ? "heute" : `vor ${tageSeit} T.`} s={aktuell.length ? `${aktuell.filter((c) => c.auffaellig).length} von ${aktuell.length} auffällig` : "Empfehlung: monatlich"} accent={tageSeit === null || tageSeit > 30 ? "#9A6A1F" : undefined} />
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <Card style={{ flex: "1 1 420px" }}>
          <Eyebrow>Anteil hilfreicher Antworten pro Woche</Eyebrow>
          {reihe.length === 0 ? <p style={{ ...sys, fontSize: 13, color: C.ink }}>Noch keine Bewertungen.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={reihe} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11, fill: C.ink }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: C.ink }} axisLine={false} tickLine={false} unit=" %" />
                <Tooltip formatter={(v, _n, p) => [`${v} % (${p.payload.n} Bewertungen)`, "Hilfreich"]} />
                <Line type="monotone" dataKey="anteil" stroke={C.plum} strokeWidth={2} dot={{ r: 4, fill: C.plum, stroke: C.card, strokeWidth: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card style={{ flex: "1 1 320px" }}>
          <Eyebrow>Gründe für 👎</Eyebrow>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={balken} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 0 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.ink }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="k" width={120} tick={{ fontSize: 11.5, fill: C.espresso }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [v, "Meldungen"]} cursor={{ fill: C.beige }} />
              <Bar dataKey="n" fill={C.rose} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Eyebrow>Fairness-Test · Paarvergleich</Eyebrow>
            <p style={{ ...sys, fontSize: 12.5, color: C.ink, lineHeight: 1.55, margin: 0, maxWidth: 620 }}>
              ilho bekommt sechsmal dieselbe Frage in zwei Varianten — nur ein Merkmal ändert sich (Religion, Herkunft, Familienform, Alter, Behinderung, Einkommen). Ein zweites Modell prüft, ob beide gleich warm, ermutigend und klischeefrei beantwortet werden. Dauer ca. 1 Minute, Kosten wenige Cent.
            </p>
          </div>
          <button onClick={pruefen} disabled={busy} style={{ ...sys, fontSize: 13, fontWeight: 700, borderRadius: 20, padding: "10px 18px", border: "none", cursor: busy ? "default" : "pointer", background: C.espresso, color: C.cream, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Prüfe …" : "Jetzt prüfen"}
          </button>
        </div>
        {info && <div style={{ ...sys, fontSize: 13, color: C.plum, marginTop: 10 }}>{info}</div>}

        {aktuell.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14, ...sys, fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: C.ink, fontSize: 11.5 }}>
                <th style={{ padding: "6px 4px" }}>Merkmal</th><th>Varianten</th><th>Unterschied</th><th>Klischee</th><th>Einschätzung</th>
              </tr>
            </thead>
            <tbody>
              {aktuell.map((c) => (
                <Fragment key={c.id}>
                  <tr onClick={() => setOffen(offen === c.id ? null : c.id)} style={{ borderTop: `1px solid ${C.line}`, cursor: "pointer", verticalAlign: "top" }}>
                    <td style={{ padding: "8px 4px", fontWeight: 700, color: C.espresso }}>{c.merkmal}</td>
                    <td style={{ padding: "8px 4px", color: C.ink }}>{c.variante_a} / {c.variante_b}</td>
                    <td style={{ padding: "8px 4px" }}>{c.unterschied == null ? "–" : <Badge tone={c.unterschied >= 3 ? "rot" : c.unterschied === 2 ? "warn" : "ok"}>{c.unterschied}/5</Badge>}</td>
                    <td style={{ padding: "8px 4px" }}>{c.stereotyp == null ? "–" : c.stereotyp ? <Badge tone="rot">⚠ ja</Badge> : <Badge tone="ok">✓ nein</Badge>}</td>
                    <td style={{ padding: "8px 4px", color: C.espresso }}>{c.begruendung}</td>
                  </tr>
                  {offen === c.id && c.antwort_a && (
                    <tr>
                      <td colSpan={5} style={{ padding: "4px 4px 14px" }}>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {[[c.variante_a, c.antwort_a], [c.variante_b, c.antwort_b]].map(([v, a]) => (
                            <div key={v} style={{ flex: "1 1 300px", background: C.cream, borderRadius: 12, padding: 12 }}>
                              <div style={{ fontWeight: 700, fontSize: 12, color: C.plum, marginBottom: 6 }}>„{c.frage.replace("{X}", v)}“</div>
                              <div style={{ whiteSpace: "pre-wrap", fontSize: 12.5, color: C.espresso, lineHeight: 1.55 }}>{a}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
        {aktuell.length > 0 && <div style={{ ...sys, fontSize: 11.5, color: C.ink, marginTop: 8 }}>Zeile anklicken, um beide Antworten nebeneinander zu sehen. Auffällige Paare → ilho-Prompt in <code>src/ilho.js</code> nachschärfen und erneut prüfen.</div>}
      </Card>
    </>
  );
}
