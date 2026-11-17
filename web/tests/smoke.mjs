/* Smoke-Test der gebauten Website (dist/) – ohne Browser, ohne Abhängigkeiten.
   Prüft das Gate von Phase 1 (Masterplan 13 / QA-Gate G1):
   Links, CTAs, SEO-Grundlagen, A11y-Grundlagen, Datenschutz-Grundregeln.
   Aufruf: npm run build && npm run test:smoke */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
if (!existsSync(DIST)) { console.error("dist/ fehlt – zuerst `npm run build`."); process.exit(1); }

const APP_URL = process.env.VITE_APP_URL || "https://smile2go-app.vercel.app";
const seiten = readdirSync(DIST).filter((f) => f.endsWith(".html"));
let fehler = 0, ok = 0;
const pruefe = (bed, text) => { if (bed) ok++; else { fehler++; console.log("  ✗ " + text); } };

const alle = (re, s) => [...s.matchAll(re)];

for (const datei of seiten) {
  const html = readFileSync(join(DIST, datei), "utf8");
  console.log(`• ${datei}`);
  // Seitengrundlagen
  pruefe(/<html lang="de"/.test(html), "lang=de fehlt");
  pruefe(/<meta name="viewport"[^>]*width=device-width/.test(html), "viewport fehlt");
  const titel = html.match(/<title>([^<]+)<\/title>/)?.[1] || "";
  pruefe(titel.length >= 10 && titel.length <= 75, `Titel-Länge ${titel.length} (10–75)`);
  const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1] || "";
  pruefe(desc.length >= 40 && desc.length <= 170, `Meta-Description-Länge ${desc.length} (40–170)`);
  pruefe(alle(/<h1[\s>]/g, html).length === 1, "genau eine H1 erwartet");
  pruefe(/<meta name="robots" content="noindex,nofollow">/.test(html) || process.env.VITE_SITE_INDEXIERBAR === "ja", "noindex fehlt (Indexierung nicht freigegeben)");
  pruefe(!/<!--@|%APP_URL%/.test(html), "Platzhalter nicht ersetzt");
  pruefe(/id="inhalt"/.test(html) && /href="#inhalt"/.test(html), "Skip-Link/Hauptbereich fehlt");
  pruefe(/aria-label="Hauptnavigation"/.test(html), "Hauptnavigation fehlt");

  // Bilder: alt-Attribut Pflicht
  for (const [img] of alle(/<img\b[^>]*>/g, html)) pruefe(/\salt="/.test(img), `Bild ohne alt: ${img.slice(0, 80)}`);

  // Keine Drittanbieter-Ressourcen (DSGVO): src/href auf fremde Hosts nur als Link zur App
  for (const [, url] of alle(/(?:src|href)="(https?:[^"]+)"/g, html)) {
    const istLinkZurApp = url.startsWith(APP_URL);
    pruefe(istLinkZurApp, `Externe Ressource/Link: ${url}`);
  }
  pruefe(!/fonts\.googleapis|googletagmanager|google-analytics|facebook\.net/.test(html), "Tracking/Google Fonts gefunden");

  // Interne Links müssen auf existierende Dateien/Anker zeigen
  for (const [, href] of alle(/href="(\/[^"]*)"/g, html)) {
    const [pfad, anker] = href.split("#");
    const ziel = pfad === "/" ? "index.html" : pfad.replace(/^\//, "");
    const zielDatei = join(DIST, ziel);
    pruefe(existsSync(zielDatei), `Toter Link: ${href}`);
    if (anker && existsSync(zielDatei)) pruefe(readFileSync(zielDatei, "utf8").includes(`id="${anker}"`), `Anker fehlt: ${href}`);
  }
  for (const [, anker] of alle(/href="#([^"]+)"/g, html)) pruefe(html.includes(`id="${anker}"`), `Anker fehlt auf Seite: #${anker}`);

  // Formulare: jedes Eingabefeld hat ein Label, Pflicht-Einwilligung vorhanden, freiwillige nicht vorausgewählt
  for (const [form] of alle(/<form\b[\s\S]*?<\/form>/g, html)) {
    for (const [feld] of alle(/<(input|select|textarea)\b[^>]*>/g, form)) {
      if (/type="hidden"/.test(feld)) continue;
      const id = feld.match(/\sid="([^"]+)"/)?.[1];
      const umschlossen = /<label>(?:(?!<\/label>)[\s\S])*$/.test(form.slice(0, form.indexOf(feld)));
      pruefe(umschlossen || (id && form.includes(`for="${id}"`)), `Feld ohne Label: ${feld.slice(0, 70)}`);
    }
    pruefe(/name="datenschutz_gelesen"[^>]*required/.test(form), "Pflicht-Datenschutzhinweis fehlt im Formular");
    pruefe(!/name="newsletter"[^>]*checked/.test(form), "Freiwillige Einwilligung ist vorausgewählt");
    pruefe(/data-meldung[^>]*role="status"|role="status"[^>]*data-meldung/.test(form), "Statusmeldung (aria-live) fehlt");
  }
}

// Seitenübergreifende Anforderungen (Masterplan 02, QA G1)
const lies = (f) => readFileSync(join(DIST, f), "utf8");
console.log("• Seitenübergreifend");
pruefe(seiten.includes("community-entdecken.html") && seiten.includes("community-beitreten.html"), "Entdecken und Beitreten müssen getrennte Seiten sein");
const start = lies("index.html");
pruefe(/href="\/community-entdecken\.html"[^>]*>Community entdecken</.test(start), "Startseite: CTA „Community entdecken“ fehlt");
pruefe(/href="\/community-beitreten\.html"[^>]*>Community beitreten</.test(start), "Startseite: CTA „Community beitreten“ fehlt");
pruefe(start.includes("Gemeinsam") && start.includes("einsam"), "Hero „Gemeinsam statt einsam“ fehlt");
const beitreten = lies("community-beitreten.html");
for (const muss of ["Mitglied werden", "Als Expertin bewerben", "Login", "Mitgliedschaften", "Fragen zum Beitritt"]) pruefe(beitreten.includes(muss), `Beitreten-Seite: „${muss}“ fehlt`);
pruefe(lies("fuer-expertinnen.html").includes("nie automatisch zu einer Verkaufsfreigabe"), "Expertinnen: Hinweis „keine automatische Freigabe“ fehlt");
for (const f of seiten) pruefe(lies(f).includes('data-dauer-cta'), `${f}: mobile Dauer-CTA fehlt`);
for (const f of ["impressum.html", "datenschutz.html", "agb-widerruf.html"]) pruefe(lies(f).includes("ENTWURF"), `${f}: Entwurfs-Kennzeichnung fehlt`);

console.log(`\nErgebnis: ${ok} Prüfungen bestanden, ${fehler} fehlgeschlagen.`);
process.exit(fehler ? 1 : 0);
