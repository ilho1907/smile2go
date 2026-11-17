import { defineConfig, loadEnv } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* Smile2Go · öffentliche Website
   Mehrseitige, statische Seite: echtes HTML pro Seite (gut für SEO und ohne
   JavaScript lesbar). Kopf- und Fußbereich stehen einmal in src/partials/ und
   werden beim Bauen eingesetzt – Platzhalter <!--@kopf--> und <!--@fuss-->. */

const SEITEN = {
  start: "index.html",
  entdecken: "community-entdecken.html",
  beitreten: "community-beitreten.html",
  expertinnen: "fuer-expertinnen.html",
  impressum: "impressum.html",
  datenschutz: "datenschutz.html",
  agb: "agb-widerruf.html",
  fehlt: "404.html",
};

const teil = (name) => readFileSync(resolve(__dirname, "src/partials", name), "utf8");

function teileEinsetzen(env) {
  // Ohne ausdrückliche Freigabe wird nichts indexiert (keine unkontrollierte Veröffentlichung).
  const indexierbar = env.VITE_SITE_INDEXIERBAR === "ja";
  const appUrl = env.VITE_APP_URL || "https://smile2go-app.vercel.app";
  return {
    name: "s2g-teile",
    transformIndexHtml(html, ctx) {
      const datei = ctx.path.replace(/^\//, "") || "index.html";
      const aktiv = Object.entries(SEITEN).find(([, f]) => f === datei)?.[0] || "";
      const markiere = (s) =>
        s.replace(/data-nav="([a-z]+)"/g, (m, key) => (key === aktiv ? `${m} aria-current="page"` : m));
      return html
        .replace("<!--@kopf-->", markiere(teil("kopf.html")))
        .replace("<!--@fuss-->", markiere(teil("fuss.html")))
        .replaceAll("%APP_URL%", appUrl)
        .replace(
          "<!--@robots-->",
          indexierbar ? '<meta name="robots" content="index,follow">' : '<meta name="robots" content="noindex,nofollow">'
        );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");
  return {
    plugins: [teileEinsetzen(env)],
    build: {
      rollupOptions: {
        input: Object.fromEntries(Object.entries(SEITEN).map(([k, f]) => [k, resolve(__dirname, f)])),
      },
    },
  };
});
