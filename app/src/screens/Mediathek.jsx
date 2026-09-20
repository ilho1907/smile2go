// Mediathek.jsx — Mediathek, Musik, Meditation und Podcast.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { dateiLink, ladeDateiHoch, ladeMaterialien, ladeMeineDateien, loescheDatei, supabase } from "../supabase";
import { useEffect, useState } from "react";
import { TRACKS } from "../daten/inhalte";
import { Btn, Card, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Musik & Meditation ── */

export function Musik() {
  const [playing, setPlaying] = useState(null);
  const cats = [...new Set(TRACKS.map((t) => t.cat))];
  const [cat, setCat] = useState("Alle");
  const list = cat === "Alle" ? TRACKS : TRACKS.filter((t) => t.cat === cat);

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <Eyebrow>Musik & Meditation</Eyebrow>
      <H size={25} style={{ marginBottom: 16 }}>Klänge für deine Ruhe</H>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {["Alle", ...cats].map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{
            fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600,
            padding: "9px 16px", borderRadius: 20, cursor: "pointer", minHeight: 38,
            border: `1.5px solid ${cat === c ? C.rose : C.line}`,
            background: cat === c ? C.roseSoft : "transparent",
            color: cat === c ? C.plum : C.ink,
          }}>{c}</button>
        ))}
      </div>

      {list.map((t) => {
        const active = playing?.t === t.t;
        return (
          <Card key={t.t} onClick={() => setPlaying(active ? null : t)} style={{ marginBottom: 10, display: "flex", gap: 14, alignItems: "center", borderColor: active ? C.rose : C.line }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: active ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: active ? 18 : 22, color: "#fff", flexShrink: 0 }}>
              {active ? "❚❚" : t.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{t.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{t.cat} · {t.len}</div>
            </div>
            {!active && <div style={{ color: C.rose, fontSize: 16 }}>▶</div>}
          </Card>
        );
      })}

      {playing && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 76, margin: "0 auto", maxWidth: 430,
          background: C.plum, color: C.cream, borderRadius: "16px 16px 0 0",
          padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, zIndex: 5,
        }}>
          <div style={{ fontSize: 20 }}>{playing.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 700 }}>{playing.t}</div>
            <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,.22)", marginTop: 7 }}>
              <div style={{ width: "34%", height: "100%", borderRadius: 3, background: C.goldSoft }} />
            </div>
          </div>
          <button onClick={() => setPlaying(null)} style={{ background: "none", border: "none", color: C.goldPale, fontSize: 20, cursor: "pointer", minWidth: 44, minHeight: 44 }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ── Mediathek · Downloads, Uploads, Hilfe ── */

export const TOOLS_KATALOG = [
  { k: "gcal", icon: "🗓️", t: "Google Kalender", s: "Termine automatisch im Heute-Widget" },
  { k: "health", icon: "💗", t: "Apple Health / Fitness", s: "Bewegung & Achtsamkeit verbinden" },
  { k: "notion", icon: "📝", t: "Notion", s: "Journal-Einträge exportieren" },
  { k: "spotify", icon: "🎧", t: "Spotify", s: "Eigene Playlists in der Meditation" },
  { k: "zoom", icon: "🎥", t: "Zoom", s: "Coaching-Sessions direkt starten" },
  { k: "whatsapp", icon: "💬", t: "WhatsApp", s: "Support & Erinnerungen" },
];

export const KAT_ICON = { Artikel: "📄", "E-Books": "📕", Videos: "🎬", Audio: "🎧", Aufgabe: "✍️" };

export function Mediathek({ uploads, setUploads, tools, setTools, office, setOffice, bindung }) {
  const [kat, setKat] = useState("Alle");
  const [hinweis, setHinweis] = useState("");
  const [materialien, setMaterialien] = useState([]);
  const [matLaedt, setMatLaedt] = useState(true);
  const kats = ["Alle", "Artikel", "E-Books", "Videos", "Audio", "Aufgabe"];
  const liste = kat === "Alle" ? materialien : materialien.filter((m) => m.kategorie === kat);

  // Materialien der eigenen Coachin — nichts Erfundenes mehr im Code.
  useEffect(() => {
    if (!bindung?.coach_id) { setMatLaedt(false); return; }
    ladeMaterialien(bindung.coach_id).then((m) => { setMaterialien(m); setMatLaedt(false); });
  }, [bindung?.coach_id]);

  const materialOeffnen = async (m) => {
    if (m.extern_url) { window.open(m.extern_url, "_blank", "noopener"); return; }
    const url = await dateiLink(m.datei_pfad, "coach-material", 900);
    if (url) window.open(url, "_blank", "noopener");
    else setHinweis("Diese Datei lässt sich gerade nicht öffnen.");
  };
  const typIcon = (name) => {
    const n = name.toLowerCase();
    if (n.match(/\.(jpg|jpeg|png|gif|webp|heic)$/)) return "🖼️";
    if (n.match(/\.(mp4|mov|webm|avi)$/)) return "🎬";
    if (n.endsWith(".pdf")) return "📕";
    if (n.match(/\.(mp3|wav|m4a)$/)) return "🎧";
    return "📄";
  };

  // Beim Oeffnen: was liegt bereits im privaten Bucket dieser Nutzerin?
  useEffect(() => {
    if (!supabase) return;
    ladeMeineDateien().then((dateien) => {
      if (!dateien.length) return;
      setUploads((vorher) => {
        const bekannt = new Set(vorher.map((u) => u.pfad).filter(Boolean));
        const zusatz = dateien
          .filter((d) => !bekannt.has(d.pfad))
          .map((d) => ({ name: d.name.replace(/^\d+-/, ""), size: Math.round(d.groesse / 1024), pfad: d.pfad, cloud: true }));
        return [...vorher, ...zusatz];
      });
    });
  }, []); // eslint-disable-line

  // Hochladen: echte Datei in den privaten EU-Bucket (klientin-dateien/<user_id>/…).
  // Bilder bekommen zusaetzlich eine lokale Vorschau, damit das Briefkopf-Logo sofort sitzt.
  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    for (const f of files) {
      const basis = { name: f.name, size: Math.round(f.size / 1024) };
      let eintrag = basis;

      if (f.type.startsWith("image/") && f.size < 1500000) {
        const dataUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = () => res(null);
          r.readAsDataURL(f);
        });
        if (dataUrl) eintrag = { ...basis, dataUrl };
      }

      if (supabase) {
        setHinweis(`Lade „${f.name}" hoch …`);
        const hoch = await ladeDateiHoch(f);
        if (hoch) eintrag = { ...eintrag, pfad: hoch.pfad, cloud: true };
        else eintrag = { ...eintrag, fehler: true };
      }

      setUploads((vorher) => [eintrag, ...vorher]);
    }
    setHinweis("");
  };

  const dateiOeffnen = async (u) => {
    if (!u.pfad) return;
    const url = await dateiLink(u.pfad);
    if (url) window.open(url, "_blank", "noopener");
  };

  const dateiEntfernen = async (i) => {
    const u = uploads[i];
    if (u?.pfad) await loescheDatei(u.pfad);
    setUploads(uploads.filter((_, j) => j !== i));
  };

  const alsLogo = (u) => {
    setOffice({ ...office, logoImg: u.dataUrl });
    setHinweis(`✓ „${u.name}" ist jetzt dein Briefkopf-Logo — sichtbar in Mein Office`);
    setTimeout(() => setHinweis(""), 3200);
  };

  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Mediathek</Eyebrow>
      <H size={25} style={{ marginBottom: 18 }}>Deine Medien & Materialien</H>

      <Eyebrow color={C.plum}>🌿 Von deiner Coachin</Eyebrow>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5, margin: "6px 0 10px" }}>
        Materialien, PDFs und Aufgaben, die {bindung?.coach_name || "deine Coachin"} für dich hinterlegt hat — sicher in der EU, nur für dich.
      </p>

      <div style={{ display: "flex", gap: 7, margin: "8px 0 12px", flexWrap: "wrap" }}>
        {kats.map((c) => (
          <button key={c} onClick={() => setKat(c)} style={{
            fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
            padding: "8px 13px", borderRadius: 18, cursor: "pointer", minHeight: 36,
            border: `1.5px solid ${kat === c ? C.rose : C.line}`,
            background: kat === c ? C.roseSoft : "transparent",
            color: kat === c ? C.plum : C.ink,
          }}>{c}</button>
        ))}
      </div>

      <div style={{ marginBottom: 22 }}>
        {matLaedt && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink }}>Lade Materialien …</p>}

        {!matLaedt && liste.length === 0 && (
          <Card>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>
              {bindung?.coach_id
                ? "Hier ist noch nichts hinterlegt. Sobald deine Coachin dir etwas schickt, findest du es an dieser Stelle."
                : "Sobald du mit deiner Coachin verbunden bist, erscheinen ihre Materialien hier."}
            </p>
          </Card>
        )}

        {liste.map((m) => (
          <Card key={m.id} style={{ marginBottom: 9, display: "flex", gap: 12, alignItems: "center", padding: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.goldPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>
              {KAT_ICON[m.kategorie] || "📄"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.espresso }}>{m.titel}</span>
                {Date.now() - new Date(m.sichtbar_ab).getTime() < 7 * 864e5 && (
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 9.5, fontWeight: 700, color: "#fff", background: C.rose, borderRadius: 10, padding: "2px 7px" }}>NEU</span>
                )}
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, marginTop: 2 }}>
                {[m.kategorie, m.beschreibung].filter(Boolean).join(" · ")}
              </div>
            </div>
            <Btn small ghost onClick={() => materialOeffnen(m)}>↗</Btn>
          </Card>
        ))}
      </div>

      <div style={{ margin: "0 -20px 8px" }}><Musik /></div>

      {hinweis && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700, color: C.plum, background: C.roseSoft, borderRadius: 12, padding: "10px 14px", marginBottom: 12, animation: "fadeUp .3s ease" }}>{hinweis}</div>}

      <Eyebrow color={C.plum}>📤 Eigene Medien hochladen</Eyebrow>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, lineHeight: 1.5, margin: "6px 0 8px" }}>
        Was passiert mit deinen Uploads? Sie liegen in deinem privaten Bereich in der EU (Supabase Storage, Verschlüsselung im Ruhezustand) — nur du kommst heran, Links sind zeitlich begrenzt. Fotos kannst du zusätzlich als <strong>Briefkopf-Logo</strong> für Angebote & Rechnungen nutzen.
      </p>
      <Card style={{ marginTop: 8, marginBottom: 12, textAlign: "center", border: `2px dashed ${C.goldSoft}`, background: C.goldPale }}>
        <label style={{ cursor: "pointer", display: "block", padding: "10px 0" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>☁️</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: C.espresso }}>Foto, Video oder PDF auswählen</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 4 }}>Tippe hier — deine Dateien bleiben privat (DSGVO)</div>
          <input type="file" multiple accept="image/*,video/*,.pdf,audio/*" onChange={onFiles} style={{ display: "none" }} />
        </label>
      </Card>

      {uploads.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {uploads.map((u, i) => (
            <Card key={i} style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center", padding: 13 }}>
              {u.dataUrl ? <img src={u.dataUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} /> : <span style={{ fontSize: 20 }}>{typIcon(u.name)}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, fontWeight: 600, color: C.espresso, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: u.fehler ? "#A8552F" : C.sage, fontWeight: 600 }}>
                  {u.fehler ? "⚠ Upload fehlgeschlagen" : u.cloud ? "✓ Sicher gespeichert (EU)" : "✓ Bereit"} · {u.size} KB
                </div>
                {u.pfad && (
                  <button onClick={() => dateiOeffnen(u)} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: "3px 8px 0 0", textDecoration: "underline" }}>
                    ↗ Öffnen
                  </button>
                )}
                {u.dataUrl && (
                  <button onClick={() => alsLogo(u)} style={{ background: "none", border: "none", color: C.plum, fontFamily: "system-ui, sans-serif", fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: "3px 0 0", textDecoration: "underline" }}>
                    🏷️ Als Briefkopf-Logo verwenden
                  </button>
                )}
              </div>
              <button onClick={() => dateiEntfernen(i)} style={{ background: "none", border: "none", color: C.ink, opacity: 0.5, cursor: "pointer", fontSize: 16, minWidth: 36, minHeight: 36 }}>✕</button>
            </Card>
          ))}
        </div>
      )}

      <Eyebrow color={C.plum}>🤝 Plattform & Hilfe</Eyebrow>
      <Card style={{ marginTop: 8, marginBottom: 10, display: "flex", gap: 13, alignItems: "center" }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🌐</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Zur smile2go-Plattform</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Website, Blog & Community</div>
        </div>
        <div style={{ color: C.gold, fontSize: 20 }}>›</div>
      </Card>
      <Card style={{ display: "flex", gap: 13, alignItems: "center", background: "#EAF6EC", border: "1px solid #BBDFC2" }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💬</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Hilfe & Support</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Per WhatsApp oder E-Mail — wir antworten persönlich 🤍</div>
        </div>
        <div style={{ color: "#3E7A4A", fontSize: 20 }}>›</div>
      </Card>
    </div>
  );
}

/* ── Meditation & Achtsamkeit (Atemübung · geführte Meditationen · Report) ── */
export function Meditation({ addPunkte }) {
  const [atmung, setAtmung] = useState(false);
  const [phase, setPhase] = useState("Bereit?");
  const [sessions, setSessions] = useState(0);
  const [minuten, setMinuten] = useState(0);

  useEffect(() => {
    if (!atmung) { setPhase("Bereit?"); return; }
    const phasen = ["Einatmen …", "Halten …", "Ausatmen …", "Halten …"];
    let i = 0; setPhase(phasen[0]);
    const id = setInterval(() => { i = (i + 1) % phasen.length; setPhase(phasen[i]); }, 4000);
    return () => clearInterval(id);
  }, [atmung]);

  const abschliessen = (min) => {
    setSessions((s) => s + 1);
    setMinuten((m) => m + min);
    if (addPunkte) addPunkte(5, "Meditation abgeschlossen");
  };

  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Meditation & Achtsamkeit</Eyebrow>
      <H size={25} style={{ marginBottom: 14 }}>Komm zur Ruhe 🤍</H>

      <Card style={{ marginBottom: 18, textAlign: "center", background: `linear-gradient(160deg, ${C.card}, ${C.roseSoft})` }}>
        <Eyebrow color={C.plum}>🌬️ Atemübung · 4-4-4-4</Eyebrow>
        <div style={{ height: 176, display: "flex", alignItems: "center", justifyContent: "center", margin: "6px 0" }}>
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Georgia, serif", fontSize: 16, animation: atmung ? "breathe 8s ease-in-out infinite" : "none", boxShadow: "0 8px 30px rgba(217,110,139,.35)" }}>
            {phase}
          </div>
        </div>
        <Btn onClick={() => { if (atmung) { setAtmung(false); abschliessen(2); } else setAtmung(true); }}>{atmung ? "Beenden & +5 ✨" : "Atemübung starten"}</Btn>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 10, lineHeight: 1.5 }}>
          Folge dem Kreis: 4 Sek. ein · 4 halten · 4 aus · 4 halten. Schon 1 Minute beruhigt dein Nervensystem.
        </p>
      </Card>

      <Card style={{ marginBottom: 18, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div><div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.plum }}>{sessions}</div><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>Sessions</div></div>
        <div><div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.plum }}>{minuten}</div><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink }}>Minuten</div></div>
      </Card>

      <div style={{ margin: "0 -20px" }}><Musik /></div>
    </div>
  );
}

export const PODCAST = [
  { t: "Sanft in den Tag starten", serie: "Morgenimpuls", dauer: "6 Min", neu: true },
  { t: "Wenn der Kopf nicht abschalten will", serie: "Tiefe Gespräche", dauer: "22 Min" },
  { t: "Grenzen setzen ohne schlechtes Gewissen", serie: "Tiefe Gespräche", dauer: "18 Min" },
  { t: "3-Minuten-Atempause für zwischendurch", serie: "Meditation", dauer: "3 Min" },
  { t: "Deine Fülle-Routine am Abend", serie: "Business", dauer: "14 Min" },
  { t: "Selbstmitgefühl an schweren Tagen", serie: "Tiefe Gespräche", dauer: "16 Min" },
];

export function Podcast({ addPunkte }) {
  const [serie, setSerie] = useState("Alle");
  const [playing, setPlaying] = useState(null);
  const SERIEN = ["Alle", "Morgenimpuls", "Tiefe Gespräche", "Meditation", "Business"];
  const liste = serie === "Alle" ? PODCAST : PODCAST.filter((p) => p.serie === serie);
  const neueste = PODCAST.find((p) => p.neu) || PODCAST[0];
  const toggle = (t) => { const on = playing === t; setPlaying(on ? null : t); if (!on && addPunkte) addPunkte(4, "Podcast gehört"); };
  const PlayBtn = ({ t, big }) => (
    <button onClick={() => toggle(t)} style={{ width: big ? 54 : 42, height: big ? 54 : 42, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0, background: playing === t ? C.plum : `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: big ? 22 : 17, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(217,110,139,.35)" }}>{playing === t ? "❚❚" : "▶"}</button>
  );
  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Podcast</Eyebrow>
      <H size={25} style={{ marginBottom: 6 }}>Hör deiner Coachin zu</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginBottom: 18 }}>
        Kurze Impulse & tiefe Gespräche — mit der Stimme von Anja. Neue Folgen jede Woche.
      </p>

      {/* Neueste Folge */}
      <Card style={{ marginBottom: 18, background: `linear-gradient(150deg, ${C.plum}, ${C.rose} 140%)`, border: "none" }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.goldPale, fontWeight: 700 }}>🎧 Neueste Folge</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
          <PlayBtn t={neueste.t} big />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#FFF8F0", lineHeight: 1.3 }}>{neueste.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#FFF3F0", opacity: 0.9, marginTop: 3 }}>{neueste.serie} · {neueste.dauer}</div>
          </div>
        </div>
      </Card>

      {/* Serien-Filter */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {SERIEN.map((s) => (
          <button key={s} onClick={() => setSerie(s)} style={{ padding: "8px 13px", borderRadius: 20, cursor: "pointer", border: `1.5px solid ${serie === s ? C.rose : C.line}`, background: serie === s ? C.roseSoft : "transparent", fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 600, color: serie === s ? C.plum : C.ink }}>{s}</button>
        ))}
      </div>

      {liste.map((p) => (
        <Card key={p.t} style={{ marginBottom: 10, display: "flex", gap: 13, alignItems: "center" }}>
          <PlayBtn t={p.t} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{p.t}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{p.serie} · {p.dauer}{p.neu ? " · 🆕" : ""}</div>
          </div>
          {playing === p.t && <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, color: C.plum }}>läuft…</span>}
        </Card>
      ))}

      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.8, textAlign: "center", marginTop: 12 }}>
        Neue Folgen werden von deiner Coachin hochgeladen 🎙️
      </p>
    </div>
  );
}

