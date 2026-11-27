// Text → PDF im smile2go-Briefkopf. jsPDF wird erst geladen, wenn es gebraucht
// wird — die Mitglieder-App lädt es nie.

const PFLAUME = [110, 53, 104];
const TINTE = [46, 36, 48];
const GRAU = [122, 107, 122];

// Eine Zeile gilt als Überschrift, wenn sie kurz ist, nicht mit "- " beginnt
// und nicht mit einem Satzzeichen endet.
const istUeberschrift = (z) => z.length > 0 && z.length < 70 && !/^[-•]\s/.test(z) && !/[.,;:!?]$/.test(z);

export async function textAlsPdf({ titel, text, untertitel = "" }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const B = 210, RAND = 20, BREITE = B - 2 * RAND, UNTEN = 280;
  let y = 0;

  const kopf = () => {
    doc.setFillColor(...PFLAUME);
    doc.rect(0, 0, B, 4, "F");
    doc.setFont("times", "normal"); doc.setFontSize(15); doc.setTextColor(...TINTE);
    doc.text("smile", RAND, 16);
    const w = doc.getTextWidth("smile");
    doc.setFont("times", "italic"); doc.setTextColor(232, 168, 212); doc.text("2", RAND + w, 16);
    doc.setFont("times", "normal"); doc.setTextColor(...TINTE); doc.text("go", RAND + w + doc.getTextWidth("2"), 16);
    doc.setDrawColor(239, 223, 236); doc.line(RAND, 20, B - RAND, 20);
    y = 30;
  };
  const fuss = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...GRAU);
      doc.text(`smile2go · ${titel}`, RAND, 290);
      doc.text(`Seite ${i} von ${n}`, B - RAND, 290, { align: "right" });
    }
  };
  const platz = (h) => { if (y + h > UNTEN) { doc.addPage(); kopf(); } };

  kopf();
  doc.setFont("times", "bold"); doc.setFontSize(20); doc.setTextColor(...TINTE);
  for (const z of doc.splitTextToSize(titel, BREITE)) { platz(9); doc.text(z, RAND, y); y += 8.5; }
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...GRAU);
  doc.text(untertitel || new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }), RAND, y);
  y += 10;

  for (const roh of String(text || "").replace(/\r/g, "").split("\n")) {
    const zeile = roh.trim();
    if (!zeile) { y += 3; continue; }
    if (istUeberschrift(zeile)) {
      y += 2; platz(8);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...PFLAUME);
      for (const z of doc.splitTextToSize(zeile, BREITE)) { platz(6); doc.text(z, RAND, y); y += 6; }
      y += 1;
      continue;
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...TINTE);
    const punkt = /^[-•]\s+/.test(zeile);
    const inhalt = punkt ? zeile.replace(/^[-•]\s+/, "") : zeile;
    const einzug = punkt ? 5 : 0;
    doc.splitTextToSize(inhalt, BREITE - einzug).forEach((z, i) => {
      platz(5.5);
      if (punkt && i === 0) doc.text("•", RAND + 1, y);
      doc.text(z, RAND + einzug, y);
      y += 5.2;
    });
    y += 1.2;
  }
  fuss();
  return doc.output("blob");
}
