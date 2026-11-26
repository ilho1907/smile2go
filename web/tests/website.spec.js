import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const SEITEN = [
  ["/", "start"],
  ["/community-entdecken.html", "entdecken"],
  ["/community-beitreten.html", "beitreten"],
  ["/fuer-expertinnen.html", "expertinnen"],
  ["/impressum.html", "impressum"],
  ["/datenschutz.html", "datenschutz"],
  ["/agb-widerruf.html", "agb"],
];

mkdirSync("screenshots", { recursive: true });

for (const [pfad, name] of SEITEN) {
  test(`${name}: lädt ohne JS-Fehler, keine Drittanbieter-Anfragen, kein horizontales Scrollen`, async ({ page }, info) => {
    const fehler = [];
    const fremd = [];
    page.on("pageerror", (e) => fehler.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); });
    page.on("request", (r) => { if (!r.url().startsWith("http://localhost:5181")) fremd.push(r.url()); });
    await page.goto(pfad, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    expect(fehler, fehler.join("\n")).toEqual([]);
    expect(fremd, fremd.join("\n")).toEqual([]);
    const ueberlauf = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(ueberlauf).toBeLessThanOrEqual(0);
    // Lazy-Bilder laden lassen (auch in der waagerechten Galerie), dann ganzseitig fotografieren
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = "eager"; });
      for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      scrollTo(0, 0);
      await Promise.all([...document.images].map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })));
    });
    await page.screenshot({ path: `screenshots/${info.project.name}-${name}.png`, fullPage: true, style: ".dauer-cta{display:none!important}" });
  });

  test(`${name}: Barrierefreiheit (axe, WCAG 2.1 AA) ohne ernste Verstöße`, async ({ page }) => {
    await page.goto(pfad);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const ernst = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(ernst.map((v) => `${v.id}: ${v.nodes.length}× ${v.help}`)).toEqual([]);
  });
}

test("Navigation: mobiles Menü öffnet, schließt mit Escape, Links führen zu Entdecken/Beitreten", async ({ page }, info) => {
  await page.goto("/");
  if (info.project.name === "mobil") {
    const knopf = page.locator("[data-menueknopf]");
    await expect(page.locator("#hauptnav")).toBeHidden();
    await knopf.click();
    await expect(knopf).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#hauptnav")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(knopf).toHaveAttribute("aria-expanded", "false");
    await knopf.click();
  }
  await page.locator("#hauptnav").getByRole("link", { name: "Community entdecken" }).click();
  await expect(page).toHaveURL(/community-entdecken\.html$/);
  await expect(page.locator('#hauptnav a[aria-current="page"]')).toHaveText("Community entdecken");
  await page.getByRole("link", { name: "Community beitreten" }).first().click();
  await expect(page).toHaveURL(/community-beitreten\.html/);
});

test("Mobil: Beitreten-Leiste erscheint beim Scrollen (nicht auf der Beitreten-Seite)", async ({ page }, info) => {
  test.skip(info.project.name !== "mobil", "nur mobil");
  await page.goto("/");
  const leiste = page.locator("[data-dauer-cta]");
  await page.mouse.wheel(0, 1400);
  await expect(leiste).toHaveClass(/ist-sichtbar/);
  await expect(leiste.getByRole("link")).toBeInViewport();
  await page.goto("/community-beitreten.html");
  await expect(leiste).toBeHidden();
});

test("Mitglied vormerken: leeres Absenden zeigt Fehler, gültige Angaben zeigen Demo-Hinweis (nichts gesendet)", async ({ page }) => {
  const posts = [];
  page.on("request", (r) => { if (r.method() === "POST") posts.push(r.url()); });
  await page.goto("/community-beitreten.html#mitglied");
  const form = page.locator('form[data-formular="mitglied-vormerken"]');
  await form.getByRole("button", { name: "Platz vormerken" }).click();
  await expect(form.locator("#m-vorname-fehler")).toHaveText("Bitte fülle dieses Feld aus.");
  await expect(form.locator("#m-datenschutz-fehler")).not.toBeEmpty();
  await expect(form.locator("#m-vorname")).toBeFocused();
  await expect(form.locator("#m-news")).not.toBeChecked();

  await form.locator("#m-vorname").fill("Testperson");
  await form.locator("#m-email").fill("keine-mail");
  await form.locator("#m-email").blur();
  await expect(form.locator("#m-email-fehler")).toHaveText("Bitte gib eine gültige E-Mail-Adresse ein.");
  await form.locator("#m-email").fill("test@example.org");
  await form.locator("#m-datenschutz").check();
  await form.getByRole("button", { name: "Platz vormerken" }).click();
  await expect(form.locator("[data-meldung]")).toContainText("Demo-Modus");
  await expect(form.locator("[data-meldung]")).toContainText("NICHT gesendet");
  expect(posts).toEqual([]);
  const speicher = await page.evaluate(() => JSON.stringify(localStorage) + document.cookie);
  expect(speicher).not.toContain("test@example.org");
});

test("Expertin-Bewerbung: Pflicht-Gruppen werden geprüft, vollständige Bewerbung → Demo-Hinweis", async ({ page }) => {
  const posts = [];
  page.on("request", (r) => { if (r.method() === "POST") posts.push(r.url()); });
  await page.goto("/fuer-expertinnen.html#bewerbung");
  const form = page.locator('form[data-formular="expertin-bewerbung"]');
  await form.getByRole("button", { name: "Bewerbung absenden" }).click();
  await expect(form.locator("#b-format-fehler")).toHaveText("Bitte wähle mindestens eine Option.");
  await expect(form.locator("[data-meldung]")).toHaveText("Bitte prüfe die markierten Felder.");

  await form.locator("#b-name").fill("Test Expertin");
  await form.locator("#b-email").fill("expertin@example.org");
  await form.locator("#b-fach").selectOption("Life Coaching");
  await form.getByLabel("Online-Kurse").check();
  await form.getByLabel("Deutsch").check();
  await form.locator("#b-quali").fill("Zertifizierte Ausbildung, seit fünf Jahren in eigener Praxis tätig.");
  await form.locator("#b-warum").fill("Ich möchte Frauen in einem geschützten Rahmen begleiten.");
  await form.locator("#b-web").fill("keine-url");
  await form.getByRole("button", { name: "Bewerbung absenden" }).click();
  await expect(form.locator("#b-web-fehler")).toContainText("vollständige Adresse");
  await form.locator("#b-web").fill("https://example.org");
  await form.locator("#b-wahr").check();
  await form.locator("#b-ds").check();
  await form.getByRole("button", { name: "Bewerbung absenden" }).click();
  await expect(form.locator("[data-meldung]")).toContainText("NICHT gesendet");
  expect(posts).toEqual([]);
});

test("Expertinnen-Verzeichnis zeigt ohne Freigabe keine Profile", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-expertinnen] .karte")).toHaveCount(1);
  await expect(page.locator("[data-expertinnen]")).toContainText("nach ihrer Freigabe");
});

test("Login-Links zeigen auf die bestehende App", async ({ page }) => {
  await page.goto("/community-beitreten.html");
  const hrefs = await page.locator('a:has-text("Login")').evaluateAll((as) => as.map((a) => a.href));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) expect(h).toMatch(/^https:\/\/smile2go-app\.vercel\.app/);
});
