/* Formular-Logik: Prüfung im Browser + Versand-Adapter.

   Datenschutz-Grundsätze (GDPR_CHECKLIST.md):
   - Keine Formulardaten in localStorage, Cookies oder in der Konsole.
   - Pflicht-Hinweise und freiwillige Einwilligungen sind getrennte Felder;
     freiwillige Häkchen sind nie vorausgewählt.
   - Ist kein Server-Endpunkt konfiguriert (VITE_FORMULAR_ENDPUNKT), läuft der
     ausdrücklich gekennzeichnete DEMO-MODUS: Es wird NICHTS übertragen und
     NICHTS gespeichert. Die Seite sagt das der Nutzerin offen. */

const ENDPUNKT = import.meta.env.VITE_FORMULAR_ENDPUNKT || "";

const TEXTE = {
  valueMissing: "Bitte fülle dieses Feld aus.",
  typeMismatchEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
  typeMismatchUrl: "Bitte gib eine vollständige Adresse ein, z. B. https://…",
  tooShort: (n) => `Bitte schreib mindestens ${n} Zeichen.`,
  tooLong: (n) => `Bitte höchstens ${n} Zeichen.`,
  checkbox: "Bitte bestätige diesen Punkt, um fortzufahren.",
  gruppe: "Bitte wähle mindestens eine Option.",
};

function fehlerFeld(el) {
  const id = el.getAttribute("aria-describedby")?.split(" ").find((x) => x.endsWith("-fehler"));
  return id ? document.getElementById(id) : null;
}

function meldungFuer(el) {
  const v = el.validity;
  if (v.valueMissing) return el.type === "checkbox" ? TEXTE.checkbox : TEXTE.valueMissing;
  if (v.typeMismatch) return el.type === "email" ? TEXTE.typeMismatchEmail : TEXTE.typeMismatchUrl;
  if (v.tooShort) return TEXTE.tooShort(el.minLength);
  if (v.tooLong) return TEXTE.tooLong(el.maxLength);
  if (v.patternMismatch) return el.dataset.musterText || TEXTE.valueMissing;
  return "";
}

function pruefeFeld(el) {
  const text = el.validity.valid ? "" : meldungFuer(el);
  el.setAttribute("aria-invalid", text ? "true" : "false");
  const f = fehlerFeld(el);
  if (f) f.textContent = text;
  return !text;
}

/* Checkbox-Gruppen mit data-mindestens="1": mindestens eine Auswahl. */
function pruefeGruppe(fs) {
  const ok = fs.querySelectorAll("input:checked").length >= Number(fs.dataset.mindestens || 1);
  const f = fs.querySelector(".fehler");
  if (f) f.textContent = ok ? "" : TEXTE.gruppe;
  fs.setAttribute("aria-invalid", ok ? "false" : "true");
  return ok;
}

function sammle(form) {
  const daten = {};
  new FormData(form).forEach((wert, schluessel) => {
    if (schluessel === "website_feld") return; // Honigtopf nicht mitsenden
    if (daten[schluessel] !== undefined) daten[schluessel] = [].concat(daten[schluessel], wert);
    else daten[schluessel] = wert;
  });
  return daten;
}

export function formularStarten(form) {
  const meldung = form.querySelector("[data-meldung]");
  const knopf = form.querySelector('[type="submit"]');
  const felder = [...form.querySelectorAll("input, select, textarea")].filter((el) => el.name && el.type !== "hidden" && !el.closest(".honig") && !el.closest("[data-mindestens]"));
  const gruppen = [...form.querySelectorAll("[data-mindestens]")];

  form.noValidate = true; // eigene, verständliche Meldungen statt Browser-Standard
  felder.forEach((el) => {
    el.addEventListener("blur", () => { if (el.value || el.type === "checkbox") pruefeFeld(el); });
    el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") pruefeFeld(el); });
    el.addEventListener("change", () => { if (el.type === "checkbox" && el.getAttribute("aria-invalid") === "true") pruefeFeld(el); });
  });
  gruppen.forEach((fs) => fs.addEventListener("change", () => { if (fs.getAttribute("aria-invalid") === "true") pruefeGruppe(fs); }));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    meldung.className = "meldung"; meldung.textContent = "";

    const feldOk = felder.map(pruefeFeld).every(Boolean);
    const gruppeOk = gruppen.map(pruefeGruppe).every(Boolean);
    if (!feldOk || !gruppeOk) {
      const erstes = form.querySelector('[aria-invalid="true"]');
      (erstes?.matches("fieldset") ? erstes.querySelector("input") : erstes)?.focus();
      meldung.className = "meldung meldung--fehler";
      meldung.textContent = "Bitte prüfe die markierten Felder.";
      return;
    }

    // Honigtopf: von Menschen unsichtbar. Ist er gefüllt, still verwerfen.
    if (form.querySelector('[name="website_feld"]')?.value) {
      meldung.className = "meldung meldung--ok";
      meldung.textContent = "Danke!";
      form.reset();
      return;
    }

    if (!ENDPUNKT) {
      meldung.className = "meldung meldung--demo";
      meldung.textContent = form.dataset.demoText ||
        "Demo-Modus: Deine Eingaben sind gültig, wurden aber NICHT gesendet und nirgends gespeichert. Die Anmeldung wird in Phase 2 freigeschaltet.";
      form.dataset.zustand = "demo";
      return;
    }

    knopf.disabled = true;
    const alterText = knopf.textContent;
    knopf.textContent = "Wird gesendet …";
    try {
      const antwort = await fetch(ENDPUNKT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formular: form.dataset.formular, daten: sammle(form) }),
      });
      if (!antwort.ok) throw new Error(String(antwort.status));
      meldung.className = "meldung meldung--ok";
      meldung.textContent = form.dataset.okText || "Danke! Deine Angaben sind bei uns angekommen.";
      form.dataset.zustand = "gesendet";
      form.reset();
    } catch {
      meldung.className = "meldung meldung--fehler";
      meldung.textContent = "Das hat leider nicht geklappt. Bitte versuch es später noch einmal.";
      form.dataset.zustand = "fehler";
    } finally {
      knopf.disabled = false;
      knopf.textContent = alterText;
    }
  });
}
