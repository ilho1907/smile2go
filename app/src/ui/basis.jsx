// basis.jsx — Gemeinsame UI-Bausteine: Karten, Knöpfe, Überschriften, Hören, Teilen.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { stoppSprache } from "../sprache";
import { holeAudio } from "../supabase";
import { useRef, useState } from "react";
import { C } from "./tema";

/* ── Hörknopf (AI Coach Twin · Voice-Layer) ──
   Zeigt sich nur, wenn wirklich Audio erzeugt werden kann. Ohne konfigurierten
   Anbieter bleibt die Stelle leer statt einen toten Knopf anzubieten.
   Kennzeichnung „KI-Stimme" ist Pflicht (AI Act Art. 50) und steht direkt am Knopf. */
export function Hoerknopf({ text, kategorie = "karte", twin, klein = false }) {
  const [url, setUrl] = useState(null);
  const [laedt, setLaedt] = useState(false);
  const [nichtVerfuegbar, setNichtVerfuegbar] = useState(false);
  const audioRef = useRef(null);

  if (!text || nichtVerfuegbar) return null;

  const abspielen = async () => {
    if (url) { audioRef.current?.play(); return; }
    setLaedt(true);
    const u = await holeAudio({
      text: String(text).slice(0, 2000), kategorie,
      coach_id: twin?.coach_id || null, voice_id: twin?.voice_id || null,
    });
    setLaedt(false);
    if (!u) { setNichtVerfuegbar(true); return; }
    setUrl(u);
    setTimeout(() => audioRef.current?.play(), 60);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: klein ? 6 : 10 }}>
      <button onClick={abspielen} disabled={laedt} style={{
        display: "flex", alignItems: "center", gap: 7, border: "none", cursor: "pointer",
        background: C.roseSoft, color: C.plum, borderRadius: 20,
        padding: klein ? "6px 12px" : "9px 16px",
        fontFamily: "system-ui, sans-serif", fontSize: klein ? 12 : 13, fontWeight: 600,
        opacity: laedt ? 0.6 : 1,
      }}>
        {laedt ? "…" : "🔊"} {laedt ? "wird gesprochen" : "Anhören"}
      </button>
      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7 }}>
        KI-Stimme{twin?.voice_id ? " deiner Coachin" : ""}
      </span>
      {url && <audio ref={audioRef} src={url} preload="none" />}
    </div>
  );
}

/* ── Hörspur — geführte Übung als Audio ──
   Für Momente, in denen Lesen zu viel ist: Play drücken, Augen zu, mitgehen.
   Die Übung bleibt zusätzlich als Text da — niemand muss Ton hören wollen. */
export function Hoerspur({ src, titel = "Anhören", beiEnde, dunkel = false }) {
  const audioRef = useRef(null);
  const [laeuft, setLaeuft] = useState(false);
  const [jetzt, setJetzt] = useState(0);
  const [dauer, setDauer] = useState(0);
  const [fehler, setFehler] = useState(false);

  const zeit = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ":" + String(r).padStart(2, "0");
  };

  const umschalten = () => {
    const a = audioRef.current;
    if (!a) return;
    if (laeuft) { a.pause(); return; }
    stoppSprache();                       // Vorlesestimme schweigt, wenn die Spur läuft
    a.play().catch(() => setFehler(true));
  };

  if (fehler) return null;

  const rand = dunkel ? "#5A473C" : C.line;
  const schrift = dunkel ? "#F5E9DB" : C.espresso;
  const leise = dunkel ? "#C0AC98" : C.ink;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px", border: `1.5px solid ${rand}`, borderRadius: 14,
      background: dunkel ? "rgba(251,246,238,.07)" : C.goldPale,
    }}>
      <button
        onClick={umschalten}
        aria-label={laeuft ? "Pause" : titel}
        style={{
          width: 44, height: 44, flexShrink: 0, borderRadius: "50%", border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", fontSize: 16,
        }}
      >
        {laeuft ? "❚❚" : "▶"}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: schrift }}>
          {laeuft ? "Läuft — leg das Handy weg" : titel}
        </div>
        <div style={{ height: 4, borderRadius: 3, background: rand, margin: "7px 0 5px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${dauer ? (jetzt / dauer) * 100 : 0}%`, background: C.gold, transition: "width .25s linear" }} />
        </div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: leise }}>
          {zeit(jetzt)} / {zeit(dauer)}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDauer(e.target.duration)}
        onTimeUpdate={(e) => setJetzt(e.target.currentTime)}
        onPlay={() => setLaeuft(true)}
        onPause={() => setLaeuft(false)}
        onError={() => setFehler(true)}
        onEnded={() => { setLaeuft(false); setJetzt(0); beiEnde?.(); }}
      />
    </div>
  );
}

/* ── Basis-Bausteine ── */

export const Card = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: C.card,
      border: `1px solid ${C.line}`,
      borderRadius: 18,
      padding: 18,
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
  >
    {children}
  </div>
);

/* Wiederverwendbarer Mikrofon-Knopf — echte Web-Speech-API (Browser-Diktat), an jedem Textfeld
   nutzbar. Füllt den Text per Callback ein statt automatisch zu senden — Nutzerin behält Kontrolle. */
export const Mikro = ({ onText, size = 36 }) => {
  const [an, setAn] = useState(false);
  const recRef = useRef(null);
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) return null;
  const toggle = () => {
    if (an) { recRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "de-DE"; r.interimResults = false; r.continuous = false;
    r.onstart = () => setAn(true);
    r.onresult = (e) => {
      const text = Array.from(e.results).map((x) => x[0].transcript).join(" ").trim();
      if (text) onText(text);
    };
    r.onerror = () => setAn(false);
    r.onend = () => setAn(false);
    recRef.current = r;
    r.start();
  };
  return (
    <button type="button" onClick={toggle} aria-label="Diktieren" title="Diktieren (Spracherkennung)"
      style={{
        width: size, height: size, borderRadius: "50%", border: `1.5px solid ${C.rose}`, flexShrink: 0,
        background: an ? C.rose : C.roseSoft, fontSize: size * 0.42, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: an ? `0 0 0 4px ${C.roseSoft}` : "none", transition: "box-shadow .3s",
      }}>🎤</button>
  );
};

/* ── Teilen: aus einem Moment wird ein Bild fürs Handy ──────────────────────
   Kein Netzwerk, keine API, kein Konto: die Karte wird lokal auf ein Canvas
   gezeichnet und an das Teilen-Menü des Geräts übergeben (Instagram-Story,
   WhatsApp, Fotos …). Wo das nicht geht, wird sie heruntergeladen.        */

export function textUmbrechen(x, text, breite, zeilenHoehe, startY, mitte) {
  const woerter = String(text).split(/\s+/);
  let zeile = "";
  let y = startY;
  const zeilen = [];
  woerter.forEach((w) => {
    const test = zeile ? `${zeile} ${w}` : w;
    if (x.measureText(test).width > breite && zeile) { zeilen.push(zeile); zeile = w; }
    else zeile = test;
  });
  if (zeile) zeilen.push(zeile);
  zeilen.forEach((z) => { x.fillText(z, mitte, y); y += zeilenHoehe; });
  return y;
}

export async function erzeugeTeilbild({ eyebrow, titel, text, fuss = "smile2go" }) {
  const B = 1080, H = 1920, M = B / 2;
  const c = document.createElement("canvas");
  c.width = B; c.height = H;
  const x = c.getContext("2d");

  const g = x.createLinearGradient(0, 0, B, H);
  g.addColorStop(0, "#FBF6EE"); g.addColorStop(0.55, "#F7E7DC"); g.addColorStop(1, "#EEDCC6");
  x.fillStyle = g; x.fillRect(0, 0, B, H);

  // heller Kartenkörper
  x.fillStyle = "rgba(255,253,250,.92)";
  const kx = 90, ky = 430, kb = B - 180, kh = 1060, r = 48;
  x.beginPath();
  x.moveTo(kx + r, ky);
  x.arcTo(kx + kb, ky, kx + kb, ky + kh, r);
  x.arcTo(kx + kb, ky + kh, kx, ky + kh, r);
  x.arcTo(kx, ky + kh, kx, ky, r);
  x.arcTo(kx, ky, kx + kb, ky, r);
  x.closePath(); x.fill();

  x.textAlign = "center";

  x.fillStyle = "#C9963C";
  x.font = "600 30px system-ui, sans-serif";
  x.fillText(String(eyebrow || "").toUpperCase(), M, ky + 110);

  x.fillStyle = "#3A2A22";
  x.font = "italic 76px Georgia, serif";
  let y = textUmbrechen(x, titel, kb - 140, 90, ky + 240, M);

  if (text) {
    x.fillStyle = "#6E5A4E";
    x.font = "34px system-ui, sans-serif";
    textUmbrechen(x, text, kb - 160, 52, y + 60, M);
  }

  x.fillStyle = "#8E4A63";
  x.font = "italic 46px Georgia, serif";
  x.fillText(fuss, M, ky + kh - 70);

  return new Promise((res) => c.toBlob(res, "image/png"));
}

export function TeilenBtn({ eyebrow, titel, text, klein = true, beschriftung = "Teilen" }) {
  const [busy, setBusy] = useState(false);
  const [hinweis, setHinweis] = useState("");

  const teilen = async () => {
    setBusy(true); setHinweis("");
    try {
      const blob = await erzeugeTeilbild({ eyebrow, titel, text });
      const datei = new File([blob], "smile2go.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [datei] })) {
        await navigator.share({ files: [datei], text: `${titel} · smile2go` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "smile2go.png"; a.click();
        URL.revokeObjectURL(url);
        setHinweis("Bild gespeichert — du findest es in deinen Downloads.");
        setTimeout(() => setHinweis(""), 4000);
      }
    } catch (e) {
      if (e?.name !== "AbortError") setHinweis("Teilen hat gerade nicht geklappt.");
    }
    setBusy(false);
  };

  return (
    <>
      <button onClick={teilen} disabled={busy} style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        background: "none", border: `1.5px solid ${C.line}`, borderRadius: 20,
        padding: klein ? "9px 15px" : "12px 20px", cursor: "pointer", minHeight: 44,
        fontFamily: "system-ui, sans-serif", fontSize: klein ? 13 : 14.5,
        fontWeight: 700, color: C.plum, opacity: busy ? 0.6 : 1,
      }}>
        <span style={{ fontSize: 15 }}>↗</span> {busy ? "einen Moment …" : beschriftung}
      </button>
      {hinweis && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 6 }}>{hinweis}</div>}
    </>
  );
}

export const Eyebrow = ({ children, color = C.gold }) => (
  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color, fontWeight: 600, marginBottom: 6 }}>
    {children}
  </div>
);

export const H = ({ children, size = 22, style }) => (
  <div style={{ fontFamily: "Georgia, serif", fontSize: size, color: C.espresso, lineHeight: 1.25, ...style }}>{children}</div>
);

export const Btn = ({ children, onClick, ghost, full, small, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      fontFamily: "system-ui, sans-serif",
      fontSize: small ? 13 : 15.5,
      fontWeight: 600,
      padding: small ? "10px 16px" : "15px 22px",
      borderRadius: 14,
      border: ghost ? `1.5px solid ${C.gold}` : "none",
      background: ghost ? "transparent" : `linear-gradient(135deg, ${C.gold}, ${C.rose})`,
      color: ghost ? C.gold : "#fff",
      width: full ? "100%" : "auto",
      cursor: disabled ? "wait" : "pointer",
      opacity: disabled ? 0.6 : 1,
      minHeight: 44,
    }}
  >
    {children}
  </button>
);

/* ── Kurse: Paket-Wahl · QR-Videos · Shop & Retreats ── */

/* Pseudo-QR (Prototyp) — Produktion: echter QR mit Video-Link der Coachin */
export function QRCode({ seed }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = () => { h = (h * 1103515245 + 12345) >>> 0; return h / 4294967296; };
  const n = 17, cells = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const eck = (x < 5 && y < 5) || (x > n - 6 && y < 5) || (x < 5 && y > n - 6);
    if (eck) {
      const ix = x > n - 6 ? x - (n - 5) : x, iy = y > n - 6 ? y - (n - 5) : y;
      const ring = ix === 0 || iy === 0 || ix === 4 || iy === 4 || (ix > 1 && ix < 3 && iy > 1 && iy < 3) || (ix === 2 && iy === 2);
      if (ring) cells.push([x, y]);
    } else if (rnd() > 0.52) cells.push([x, y]);
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} style={{ width: 64, height: 64, background: "#fff", borderRadius: 8, padding: 4, border: `1px solid ${C.line}`, flexShrink: 0 }}>
      {cells.map(([x, y], i) => <rect key={i} x={x} y={y} width="1" height="1" fill={C.espresso} />)}
    </svg>
  );
}

/* ── Rechtliches: Impressum & Datenschutzerklärung ── */
export const Absatz = ({ h, children }) => (
  <div style={{ marginBottom: 15 }}>
    {h && <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso, marginBottom: 4 }}>{h}</div>}
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>{children}</div>
  </div>
);

export function RechtSeite({ title, children }) {
  return (
    <div style={{ padding: "26px 20px 34px" }}>
      <H size={24} style={{ marginBottom: 16 }}>{title}</H>
      {children}
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, opacity: 0.6, marginTop: 20, lineHeight: 1.6 }}>
        Platzhalter-Text · vor dem Livegang von einer Datenschutzbeauftragten bzw. Anwält:in prüfen und mit euren echten Daten füllen.
      </p>
    </div>
  );
}

