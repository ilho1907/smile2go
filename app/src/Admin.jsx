import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ─────────────────────────────────────────────
   smile2go — ADMIN DASHBOARD (Prototyp, Demo-Daten)
   Produktion: admin.smile2go.de · nur is_admin + 2FA
   ───────────────────────────────────────────── */

const C = {
  cream: "#FBF6EE", card: "#FFFFFE", beige: "#F5E9DB", line: "#EBD8C6",
  gold: "#C9963C", goldPale: "#FAEDD2", espresso: "#3A2A22", ink: "#6B5443",
  sage: "#5E8A52", rose: "#D96E8B", roseSoft: "#F8DCE3", plum: "#8E4A63", rot: "#B0492F",
};

const UMSATZ = [
  { m: "Jan", mrr: 4100, neu: 41 }, { m: "Feb", mrr: 7900, neu: 86 },
  { m: "Mär", mrr: 12400, neu: 102 }, { m: "Apr", mrr: 16800, neu: 97 },
  { m: "Mai", mrr: 20900, neu: 88 }, { m: "Jun", mrr: 24580, neu: 76 },
];

const MITGLIEDER = [
  { n: "Sabine M.", mail: "sabine.m@…", paket: "Pro", seit: "Feb 26", streak: 21, status: "aktiv" },
  { n: "Claudia R.", mail: "claudia.r@…", paket: "Business", seit: "Jan 26", streak: 44, status: "aktiv" },
  { n: "Petra K.", mail: "petra.k@…", paket: "Starter", seit: "Mär 26", streak: 3, status: "aktiv" },
  { n: "Monika S.", mail: "monika.s@…", paket: "Pro", seit: "Apr 26", streak: 0, status: "inaktiv 14 T." },
  { n: "Birgit L.", mail: "birgit.l@…", paket: "Starter", seit: "Mai 26", streak: 8, status: "aktiv" },
  { n: "Andrea W.", mail: "andrea.w@…", paket: "Business", seit: "Feb 26", streak: 31, status: "aktiv" },
  { n: "Heike F.", mail: "heike.f@…", paket: "Pro", seit: "Jun 26", streak: 5, status: "Trial" },
  { n: "Susanne B.", mail: "susanne.b@…", paket: "Starter", seit: "Mai 26", streak: 0, status: "gekündigt" },
];

const INBOX = [
  { von: "Sabine M.", txt: "Liebe Anja, die 3-6-9 Challenge verändert gerade alles für mich…", zeit: "vor 12 Min", neu: true },
  { von: "Petra K.", txt: "🎤 Sprachnachricht (0:42)", zeit: "vor 1 Std", neu: true },
  { von: "Claudia R.", txt: "Können wir den Termin am Do auf 16:30 schieben?", zeit: "vor 3 Std", neu: true },
  { von: "Birgit L.", txt: "Danke für die Deutung gestern 🤍", zeit: "gestern", neu: false },
];

const BUCHUNGEN = [
  { wer: "Claudia R.", wann: "Mo 15.6. · 09:00", typ: "1:1 Session", st: "bestätigt" },
  { wer: "Heike F.", wann: "Mo 15.6. · 14:00", typ: "Erstgespräch", st: "bestätigt" },
  { wer: "Sabine M.", wann: "Di 16.6. · 11:00", typ: "1:1 Session", st: "verschoben" },
  { wer: "Andrea W.", wann: "Mi 17.6. · 16:30", typ: "1:1 Session", st: "bestätigt" },
];

const SPRUECHE_POOL = [
  "Du musst nicht perfekt sein, um wertvoll zu sein.",
  "Jeder kleine Schritt zählt — auch der von heute.",
  "Ruhe ist keine Pause vom Leben. Sie ist Teil davon.",
  "Vertraue dem Weg, auch wenn du ihn noch nicht siehst.",
];

const EINLOESUNGEN = [
  { wer: "Andrea W.", was: "30 % Kurs-Rabatt", p: 300, zeit: "heute" },
  { wer: "Claudia R.", was: "Vollmond-Meditation", p: 1000, zeit: "gestern" },
  { wer: "Sabine M.", was: "10 € Shop-Gutschein", p: 500, zeit: "vor 3 Tagen" },
];

const SYSTEM = [
  { k: "Supabase (EU-Frankfurt)", st: "ok", info: "DB 6 % · Storage 2 %" },
  { k: "Claude API (Edge Function /ai)", st: "ok", info: "1.412 Calls heute · Ø 1,9 s" },
  { k: "n8n · Tagescontent 07:00", st: "ok", info: "Letzter Lauf: heute 07:00 ✓" },
  { k: "OneSignal Push", st: "ok", info: "Zustellrate 94 %" },
  { k: "Stripe Webhooks", st: "ok", info: "Letztes Event: vor 22 Min" },
  { k: "Resend Mail", st: "warn", info: "Bounce-Rate 2,8 % — Liste prüfen" },
];

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
  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, ...style }}>{children}</div>
);

const Badge = ({ children, tone }) => {
  const map = { ok: ["#EAF6EC", C.sage], warn: ["#FBF0DC", "#9A6A1F"], rot: ["#F9E8E2", C.rot], gold: [C.goldPale, "#8A6420"], rose: [C.roseSoft, C.plum] };
  const [bg, fg] = map[tone] || map.gold;
  return <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, fontWeight: 700, background: bg, color: fg, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" }}>{children}</span>;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("uebersicht");
  const [suche, setSuche] = useState("");
  const [paketF, setPaketF] = useState("Alle");
  const [wartung, setWartung] = useState(false);
  const [sprueche, setSprueche] = useState(SPRUECHE_POOL);

  const TABS = [
    ["uebersicht", "📊 Übersicht"], ["mitglieder", "👥 Mitglieder"], ["umsatz", "💶 Umsatz"],
    ["content", "📝 Content"], ["inbox", "💬 Inbox"], ["buchungen", "📅 Buchungen"],
    ["punkte", "✨ Punkte"], ["system", "🛠️ System"],
  ];

  const liste = MITGLIEDER.filter((m) =>
    (paketF === "Alle" || m.paket === paketF) &&
    (m.n + m.mail).toLowerCase().includes(suche.toLowerCase())
  );

  const stTone = (s) => s === "aktiv" ? "ok" : s === "Trial" ? "gold" : s.startsWith("inaktiv") ? "warn" : "rot";

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontSize: 15 }}>
      {/* Topbar */}
      <div style={{ background: C.espresso, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.cream }}>
          smile<span style={{ color: C.rose, fontStyle: "italic" }}>2</span>go <span style={{ fontSize: 12, color: "#D4B87A", letterSpacing: 2, textTransform: "uppercase", marginLeft: 6 }}>Admin</span>
        </div>
        <div style={{ flex: 1 }} />
        {wartung && <Badge tone="rot">⚠ Wartungsmodus aktiv</Badge>}
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#D4B87A" }}>👋 Eingeloggt als Admin · 2FA ✓</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 7, padding: "14px 20px 0", flexWrap: "wrap", maxWidth: 1100, margin: "0 auto" }}>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700,
            padding: "9px 14px", borderRadius: 20, cursor: "pointer", minHeight: 38,
            border: `1.5px solid ${tab === k ? C.gold : C.line}`,
            background: tab === k ? C.goldPale : C.card, color: tab === k ? C.espresso : C.ink,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 20px 60px" }}>

        {tab === "uebersicht" && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <Kpi t="Mitglieder" v="612" s="+76 diesen Monat" />
              <Kpi t="MRR" v="24.580 €" s="+17,6 % vs. Mai" accent={C.sage} />
              <Kpi t="Täglich aktiv" v="38 %" s="233 von 612" />
              <Kpi t="Ø Streak" v="6,2 Tage" s="🔥 Top: 44 Tage" />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <Kpi t="Kündigungsquote" v="2,1 %" s="Ziel < 4 % ✓" accent={C.sage} />
              <Kpi t="ilho-Calls heute" v="1.412" s="≈ 4,8 € KI-Kosten" />
              <Kpi t="Offene Nachrichten" v="3" s="Coach-Inbox" accent={C.plum} />
              <Kpi t="Sessions diese Woche" v="4" s="1 verschoben" />
            </div>
            <Card>
              <Eyebrow>MRR-Entwicklung (€)</Eyebrow>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={UMSATZ} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.ink }} />
                    <YAxis tick={{ fontSize: 11, fill: C.ink }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="mrr" stroke={C.gold} strokeWidth={3} dot={{ fill: C.rose, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}

        {tab === "mitglieder" && (
          <Card>
            <div style={{ display: "flex", gap: 9, marginBottom: 14, flexWrap: "wrap" }}>
              <input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Suche Name / Mail …"
                style={{ flex: 1, minWidth: 180, padding: "11px 14px", fontSize: 14, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.cream, color: C.espresso, outline: "none" }} />
              {["Alle", "Starter", "Pro", "Business"].map((p) => (
                <button key={p} onClick={() => setPaketF(p)} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, padding: "9px 13px", borderRadius: 18, cursor: "pointer", border: `1.5px solid ${paketF === p ? C.rose : C.line}`, background: paketF === p ? C.roseSoft : "transparent", color: paketF === p ? C.plum : C.ink }}>{p}</button>
              ))}
            </div>
            {liste.map((m) => (
              <div key={m.mail} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{m.n[0]}</div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{m.n}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>{m.mail} · seit {m.seit}</div>
                </div>
                <Badge tone={m.paket === "Business" ? "rose" : m.paket === "Pro" ? "gold" : "ok"}>{m.paket}</Badge>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, minWidth: 54 }}>🔥 {m.streak}</span>
                <Badge tone={stTone(m.status)}>{m.status}</Badge>
              </div>
            ))}
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 12, opacity: 0.8 }}>
              Demo: 8 von 612 · Produktion: Supabase-Tabelle `profiles` mit Pagination, Export (CSV), DSGVO-Löschung pro Mitglied.
            </p>
          </Card>
        )}

        {tab === "umsatz" && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <Kpi t="Starter (29 €)" v="410" s="11.890 € MRR" />
              <Kpi t="Pro (49 €)" v="168" s="8.232 € MRR" />
              <Kpi t="Business (99 €)" v="34" s="3.366 € MRR" />
              <Kpi t="Shop & Retreats" v="2.140 €" s="Juni, einmalig" accent={C.sage} />
            </div>
            <Card>
              <Eyebrow>Neue Mitglieder pro Monat</Eyebrow>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={UMSATZ} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.ink }} />
                    <YAxis tick={{ fontSize: 11, fill: C.ink }} />
                    <Tooltip />
                    <Bar dataKey="neu" fill={C.rose} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 10, opacity: 0.8 }}>
                Produktion: Live aus Stripe (MCP/API) — MRR, Churn, fehlgeschlagene Zahlungen, Auszahlungen.
              </p>
            </Card>
          </>
        )}

        {tab === "content" && (
          <>
            <Card style={{ marginBottom: 14 }}>
              <Eyebrow>✦ Spruch-Pool (Tagescontent)</Eyebrow>
              {sprueche.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 8 }}>
                  <input value={s} onChange={(e) => setSprueche(sprueche.map((x, j) => j === i ? e.target.value : x))}
                    style={{ flex: 1, padding: "10px 13px", fontSize: 13.5, fontFamily: "Georgia, serif", fontStyle: "italic", border: `1.5px solid ${C.line}`, borderRadius: 11, background: C.cream, color: C.espresso, outline: "none" }} />
                  <button onClick={() => setSprueche(sprueche.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.ink, opacity: 0.5, cursor: "pointer", fontSize: 15 }}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={() => setSprueche([...sprueche, ""])} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${C.gold}`, background: "transparent", color: C.gold, cursor: "pointer" }}>+ Spruch</button>
                <button style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, padding: "10px 14px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", cursor: "pointer" }}>✨ 7 neue von ilho generieren</button>
              </div>
            </Card>
            <Card>
              <Eyebrow>🌹 Orakel-Deck</Eyebrow>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
                11 Karten aktiv · 3 mit HD-Bild, 8 mit SVG (HD-Upload offen) · Bereiche: Schöpfung, Fülle, Loslassen, Klarheit, Annahme, Fokus.<br />
                Produktion: Karten anlegen/bearbeiten, Bild-Upload, Bereich zuordnen, A/B-Texte.
              </p>
            </Card>
          </>
        )}

        {tab === "inbox" && (
          <Card>
            <Eyebrow color={C.plum}>💬 Coach-Inbox · {INBOX.filter((x) => x.neu).length} neu</Eyebrow>
            {INBOX.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 4px", borderBottom: `1px solid ${C.line}`, background: m.neu ? C.roseSoft + "55" : "transparent", borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13, flexShrink: 0, color: C.espresso }}>{m.von[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: C.espresso }}>{m.von} {m.neu && <Badge tone="rose">neu</Badge>}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.txt}</div>
                </div>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, whiteSpace: "nowrap" }}>{m.zeit}</span>
              </div>
            ))}
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 12, opacity: 0.8 }}>
              Produktion: Antworten direkt hier (Text + Voice), Vorlagen, ilho-Antwortvorschläge zum Freigeben.
            </p>
          </Card>
        )}

        {tab === "buchungen" && (
          <Card>
            <Eyebrow>📅 Kommende Sessions</Eyebrow>
            {BUCHUNGEN.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 4px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: C.plum, minWidth: 130 }}>{b.wann}</span>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{b.wer}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>{b.typ} · 50 Min · Zoom</div>
                </div>
                <Badge tone={b.st === "bestätigt" ? "ok" : "warn"}>{b.st}</Badge>
              </div>
            ))}
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 12, opacity: 0.8 }}>
              Produktion: Verfügbarkeiten pflegen (Slots), Google-Kalender-Sync, automatische Zoom-Links & Erinnerungen.
            </p>
          </Card>
        )}

        {tab === "punkte" && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <Kpi t="Punkte im Umlauf" v="184.320" s="✨ über alle Mitglieder" />
              <Kpi t="Einlösungen Juni" v="23" s="≈ 410 € Gegenwert" />
              <Kpi t="Ø Punkte/aktive Nutzerin" v="301" s="Stufe 3 „Strahlen“" />
            </div>
            <Card>
              <Eyebrow>🎁 Letzte Einlösungen</Eyebrow>
              {EINLOESUNGEN.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 4px", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}><strong>{e.wer}</strong> · {e.was}</span>
                  <Badge tone="gold">−{e.p} ✨</Badge>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink }}>{e.zeit}</span>
                </div>
              ))}
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 12, opacity: 0.8 }}>
                Produktion: Belohnungen & Punktwerte hier konfigurieren, Tageslimits, Missbrauch-Alarme.
              </p>
            </Card>
          </>
        )}

        {tab === "system" && (
          <>
            <Card style={{ marginBottom: 14 }}>
              <Eyebrow>🛠️ Dienste-Status</Eyebrow>
              {SYSTEM.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 4px", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 13 }}>{s.st === "ok" ? "🟢" : "🟠"}</span>
                  <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700, color: C.espresso }}>{s.k}</span>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, textAlign: "right" }}>{s.info}</span>
                </div>
              ))}
            </Card>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <Kpi t="KI-Kosten heute" v="4,80 €" s="Monat: ≈ 128 €" />
              <Kpi t="Fehler (24 h)" v="0" s="Sentry ✓" accent={C.sage} />
              <Kpi t="Uptime 30 Tage" v="99,98 %" s="BetterStack" accent={C.sage} />
            </div>
            <Card style={{ border: `1.5px solid ${C.rot}40` }}>
              <Eyebrow color={C.rot}>⚠ Gefahrenzone</Eyebrow>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>Wartungsmodus</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>App zeigt allen Nutzerinnen eine liebevolle Pause-Seite.</div>
                </div>
                <button onClick={() => setWartung(!wartung)} style={{ width: 52, height: 30, borderRadius: 20, border: "none", cursor: "pointer", position: "relative", background: wartung ? C.rot : C.line }}>
                  <span style={{ position: "absolute", top: 3, left: wartung ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                </button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
