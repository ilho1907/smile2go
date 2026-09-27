/* Export-Helfer für App und Coach-Panel (PDF über das Druckfenster, CSV als Download). */

/* Druck-/PDF-Export ohne Zusatzbibliothek: eigenes Fenster, Browser-Dialog "Als PDF sichern". */
export function alsPdf(titel, text, untertitel = "") {
  const esc = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const w = window.open("", "_blank");
  if (!w) { alert("Bitte erlaube Pop-ups, um das PDF zu erstellen."); return; }
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(titel)}</title>
<style>body{font-family:Georgia,serif;color:#3A2A22;max-width:680px;margin:40px auto;padding:0 24px;line-height:1.6}
h1{font-size:24px;margin:0 0 4px}.u{font-family:system-ui,sans-serif;font-size:12px;color:#8a7a70;margin-bottom:24px}
pre{white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:13.5px}.f{font-family:system-ui,sans-serif;font-size:10.5px;color:#8a7a70;border-top:1px solid #e8dcd2;margin-top:28px;padding-top:8px}</style></head>
<body><h1>${esc(titel)}</h1><div class="u">${esc(untertitel || new Date().toLocaleDateString("de-DE"))}</div><pre>${esc(text)}</pre>
<div class="f">Erstellt mit smile2go · KI-unterstützt (ilho) · von der Coachin geprüft und verantwortet</div>
<script>window.onload=()=>{window.print()}<\/script></body></html>`);
  w.document.close();
}

// CSV mit Semikolon + BOM, damit Excel (de-DE) Umlaute und Spalten richtig erkennt.
export function alsCsv(dateiname, zeilen) {
  const zelle = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const text = "\uFEFF" + zeilen.map((z) => z.map(zelle).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: dateiname });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
