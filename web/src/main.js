import "./styles.css";
import { formularStarten } from "./formular.js";
import { freigegebeneExpertinnen } from "./data/expertinnen.js";

document.documentElement.classList.remove("kein-js");

/* ── Mobiles Menü ── */
const knopf = document.querySelector("[data-menueknopf]");
const nav = document.querySelector("[data-nav-liste]");
if (knopf && nav) {
  const setze = (offen) => {
    knopf.setAttribute("aria-expanded", String(offen));
    knopf.querySelector(".nur-sr").textContent = offen ? "Menü schließen" : "Menü öffnen";
    nav.classList.toggle("ist-offen", offen);
  };
  knopf.addEventListener("click", () => setze(knopf.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("ist-offen")) { setze(false); knopf.focus(); } });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setze(false); });
  matchMedia("(min-width: 900px)").addEventListener("change", (m) => { if (m.matches) setze(false); });
}

/* ── Kopf-Linie beim Scrollen + mobile Beitreten-Leiste ── */
const kopf = document.querySelector("[data-kopf]");
const dauer = document.querySelector("[data-dauer-cta]");
const aufBeitretenSeite = location.pathname.endsWith("/community-beitreten.html");
const beimScrollen = () => {
  const y = window.scrollY;
  kopf?.classList.toggle("ist-gescrollt", y > 8);
  if (dauer && !aufBeitretenSeite) dauer.classList.toggle("ist-sichtbar", y > 520);
};
if (dauer && aufBeitretenSeite) dauer.hidden = true;
addEventListener("scroll", beimScrollen, { passive: true });
beimScrollen();

/* ── Formulare ── */
document.querySelectorAll("form[data-formular]").forEach(formularStarten);

/* ── Expertinnen-Verzeichnis: nur freigegebene Profile ── */
const ziel = document.querySelector("[data-expertinnen]");
if (ziel) {
  const liste = freigegebeneExpertinnen();
  if (liste.length) {
    ziel.innerHTML = "";
    liste.forEach((e) => {
      const art = document.createElement("article");
      art.className = "karte";
      const h = document.createElement("h3"); h.textContent = e.name;
      const p = document.createElement("p"); p.textContent = [e.schwerpunkte?.join(" · "), e.sprachen?.join(", ")].filter(Boolean).join(" — ");
      const k = document.createElement("p"); k.textContent = e.kurz || "";
      const m = document.createElement("span"); m.className = "marker"; m.textContent = "Geprüft & freigegeben";
      art.append(m, h, p, k);
      ziel.append(art);
    });
  }
}
