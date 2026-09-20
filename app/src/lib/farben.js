// farben.js — Farbmathematik und Markenstile für den Marken-Baukasten (Office).
// Aus App.jsx herausgelöst; Verhalten unverändert.

export const STILE = ["Elegant", "Modern", "Verspielt"];

export const VORLAGEN = [
  { icon: "💎", t: "1:1 Coaching-Paket", typ: "Angebot", pos: [{ t: "1:1 Coaching-Paket (4 Sessions à 60 Min)", p: "480" }, { t: "Workbook & WhatsApp-Begleitung", p: "0" }], wunsch: "Warm und wertschätzend; den Nutzen für innere Klarheit betonen." },
  { icon: "🌕", t: "Workshop / Retreat", typ: "Angebot", pos: [{ t: "Tages-Workshop „Vollmond-Ritual“ (6 Std)", p: "129" }], wunsch: "Gruppenerlebnis und Gemeinschaft betonen." },
  { icon: "🧾", t: "Einzelsession", typ: "Rechnung", pos: [{ t: "1:1 Coaching-Session (60 Min)", p: "120" }], wunsch: "Kurz, herzlich, mit Dank." },
  { icon: "✨", t: "Paket-Abschluss", typ: "Rechnung", pos: [{ t: "Coaching-Paket „Innere Klarheit“ (4 Sessions)", p: "480" }], wunsch: "" },
];

export const FARBEN = ["#C9963C", "#D96E8B", "#8E4A63", "#6E8B6A", "#5C7A99", "#3A2A22"];

// ── Markenerstellung ───────────────────────────────────────────────────────
// Aus dem hochgeladenen Logo werden Farben gelesen (Canvas, im Browser, kostenlos —
// kein Dienst, kein Upload). Der Stil bestimmt echte Schriften und Formen, nicht nur
// ein Etikett. Beides zusammen ergibt die Marke, die auf jedem Dokument erscheint.
export const MARKE_STILE = {
  Elegant: {
    kopf: "Georgia, 'Times New Roman', serif",
    text: "Georgia, 'Times New Roman', serif",
    spur: "0em", gross: false, radius: 4, linie: 3,
    beschreibung: "Serifen, ruhig, zeitlos — für Beratung und Retreats.",
  },
  Modern: {
    kopf: "'Helvetica Neue', Inter, system-ui, sans-serif",
    text: "system-ui, -apple-system, 'Helvetica Neue', sans-serif",
    spur: "0.14em", gross: true, radius: 0, linie: 2,
    beschreibung: "Klar, gesperrt, reduziert — für Kurse und Business-Angebote.",
  },
  Verspielt: {
    kopf: "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
    text: "system-ui, -apple-system, sans-serif",
    spur: "0.02em", gross: false, radius: 18, linie: 5,
    beschreibung: "Weich, rund, warm — für Circles und kreative Formate.",
  },
};

export const stilVon = (name) => MARKE_STILE[name] || MARKE_STILE.Elegant;

export const hex2rgb = (h) => {
  const m = String(h).replace("#", "");
  const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
};

export const rgb2hex = (r, g, b) => "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");

export const mischen = (h, ziel, anteil) => {
  const [r, g, b] = hex2rgb(h); const [zr, zg, zb] = hex2rgb(ziel);
  return rgb2hex(r + (zr - r) * anteil, g + (zg - g) * anteil, b + (zb - b) * anteil);
};

export const helligkeit = (h) => { const [r, g, b] = hex2rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

// Zu helle Markenfarben sind auf Weiß nicht lesbar — sie werden so weit abgedunkelt,
// bis Text und Linien auf dem Dokument sicher stehen.
export const lesbar = (h) => { let f = h, i = 0; while (helligkeit(f) > 0.62 && i++ < 8) f = mischen(f, "#000000", 0.16); return f; };

export const farbTon = (h) => {
  const [r, g, b] = hex2rgb(h).map((x) => x / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  let t = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (t * 60 + 360) % 360;
};

export const saettigung = (h) => { const [r, g, b] = hex2rgb(h); return (Math.max(r, g, b) - Math.min(r, g, b)) / 255; };

// Liest die tragenden Farben aus einem Bild. Weiß, Schwarz und Transparenz fallen raus,
// ähnliche Töne werden zusammengefasst. Ergebnis: bis zu vier Vorschläge.
export function farbenAusLogo(dataUrl) {
  return new Promise((fertig) => {
    if (typeof window === "undefined" || !dataUrl) { fertig([]); return; }
    const bild = new Image();
    bild.crossOrigin = "anonymous";
    bild.onerror = () => fertig([]);
    bild.onload = () => {
      try {
        const n = 72;
        const cv = document.createElement("canvas");
        cv.width = n; cv.height = n;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bild, 0, 0, n, n);
        const d = ctx.getImageData(0, 0, n, n).data;
        const eimer = new Map();
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const mitte = (max + min) / 2;
          if (max - min < 20 && (mitte > 228 || mitte < 30)) continue; // Papierweiß und Tiefschwarz raus
          const k = `${r >> 4}_${g >> 4}_${b >> 4}`;
          const e = eimer.get(k) || { n: 0, r: 0, g: 0, b: 0 };
          e.n++; e.r += r; e.g += g; e.b += b;
          eimer.set(k, e);
        }
        const kandidaten = [...eimer.values()]
          .sort((a, b) => b.n - a.n).slice(0, 12)
          .map((e) => rgb2hex(e.r / e.n, e.g / e.n, e.b / e.n));
        const raus = [];
        for (const f of kandidaten) {
          if (raus.length >= 4) break;
          const nah = raus.some((v) => Math.abs(farbTon(v) - farbTon(f)) < 22 && Math.abs(helligkeit(v) - helligkeit(f)) < 0.18);
          if (!nah) raus.push(lesbar(f));
        }
        fertig(raus);
      } catch (e) { fertig([]); }
    };
    bild.src = dataUrl;
  });
}

// Aus einer Hauptfarbe wird die vollständige Palette: Akzent (verschobener Ton) und
// ein sehr heller Grund für Flächen.
export function paletteAus(haupt, zweiter) {
  const p = lesbar(haupt || FARBEN[0]);
  let akzent = zweiter && saettigung(zweiter) > 0.12 ? lesbar(zweiter) : null;
  if (!akzent || Math.abs(farbTon(akzent) - farbTon(p)) < 15) akzent = mischen(p, "#8E4A63", 0.45);
  return { farbe: p, farbe2: akzent, farbePale: mischen(p, "#FFFFFF", 0.9) };
}

// Logos werden vor dem Speichern verkleinert — ein großes Bild würde den lokalen
// Speicher sprengen und jeden Dokument-Download unnötig aufblähen.
export function logoVerkleinern(dataUrl, maxKante = 480) {
  return new Promise((fertig) => {
    if (typeof window === "undefined") { fertig(dataUrl); return; }
    const bild = new Image();
    bild.onerror = () => fertig(dataUrl);
    bild.onload = () => {
      try {
        const f = Math.min(1, maxKante / Math.max(bild.width, bild.height));
        if (f >= 1 && dataUrl.length < 400000) { fertig(dataUrl); return; }
        const cv = document.createElement("canvas");
        cv.width = Math.round(bild.width * f) || 1;
        cv.height = Math.round(bild.height * f) || 1;
        cv.getContext("2d").drawImage(bild, 0, 0, cv.width, cv.height);
        fertig(cv.toDataURL("image/png"));
      } catch (e) { fertig(dataUrl); }
    };
    bild.src = dataUrl;
  });
}

export function docHtml(bk, doc, logoImg) {
  const st = stilVon(bk.stil);
  const f1 = bk.farbe || FARBEN[0];
  const f2 = bk.farbe2 || f1;
  const pale = bk.farbePale || mischen(f1, "#FFFFFF", 0.9);
  const kopfStil = `font-family:${st.kopf};letter-spacing:${st.spur};${st.gross ? "text-transform:uppercase;" : ""}`;
  const pos = doc.positionen.map((p) => `<tr><td style="padding:9px 0;border-bottom:1px solid ${pale}">${p.t}</td><td style="text-align:right;padding:9px 0;border-bottom:1px solid ${pale}">${p.p} €</td></tr>`).join("");
  const summe = doc.positionen.reduce((s, p) => s + (parseFloat(String(p.p).replace(",", ".")) || 0), 0).toFixed(2).replace(".", ",");
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${doc.typ} ${doc.nr}</title></head>
<body style="font-family:${st.text};color:#3A2A22;max-width:700px;margin:40px auto;padding:0 24px">
<div style="border-bottom:${st.linie}px solid ${f1};padding-bottom:18px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center">
  <div><div style="font-size:26px;color:${f1};${kopfStil}">${logoImg ? `<img src="${logoImg}" style="height:44px;border-radius:${st.radius}px;vertical-align:middle;margin-right:10px">` : bk.logo + " "}${bk.firma}</div>
  <div style="font-size:12px;color:#6B5443;margin-top:4px">${bk.nische}${bk.unterthemen ? " · " + bk.unterthemen : ""}</div></div>
  <div style="font-size:11px;color:#6B5443;text-align:right">${bk.adresse.replace(/\n/g, "<br>")}</div>
</div>
<div style="font-size:12px;color:#6B5443">${doc.empfaenger}</div>
<h2 style="margin:26px 0 4px;font-weight:normal;${kopfStil}">${doc.typ} <span style="color:${f2}">${doc.nr}</span></h2>
<div style="font-size:12px;color:#6B5443;margin-bottom:22px">Datum: ${doc.datum}${doc.typ === "Angebot" ? " · Gültig 30 Tage" : " · Zahlbar innerhalb 14 Tagen"}</div>
<div style="font-size:14px;line-height:1.7;white-space:pre-wrap">${doc.text}</div>
<table style="width:100%;margin:24px 0;font-size:14px;border-collapse:collapse">${pos}
<tr><td style="padding:12px 0;font-weight:bold">Gesamt</td><td style="text-align:right;padding:12px 0;font-weight:bold;color:${f1}">${summe} €</td></tr></table>
<div style="background:${pale};border-radius:${st.radius}px;padding:10px 14px;font-size:11px;color:#6B5443">Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.${bk.ustid ? " · USt-IdNr.: " + bk.ustid : ""}</div>
<div style="margin-top:34px;font-size:13px">Herzliche Grüße<br><span style="color:${f1};font-size:17px;${kopfStil}">${bk.firma}</span></div>
</body></html>`;
}

