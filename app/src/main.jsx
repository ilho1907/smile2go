import React from "react";
import ReactDOM from "react-dom/client";
import "./premium.css";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import Coach from "./Coach.jsx";

// Mitglieder-App standardmäßig
//   #coach → Coach-Panel (echte Daten: Klientinnen, Nachrichten, Termine, Material)
//   #admin → Plattform-Dashboard (Prototyp mit Demo-Zahlen)
const Root = () => {
  const h = window.location.hash;
  if (h === "#coach") return <Coach />;
  if (h === "#admin") return <Admin />;
  return <App />;
};
window.addEventListener("hashchange", () => window.location.reload());

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

// Service Worker: Offline-Hülle + Push. Nur im Produktions-Build registrieren,
// damit der Vite-Dev-Server nicht gegen einen gecachten Stand arbeitet.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // Hatte die Seite beim Laden schon einen Service Worker? Dann ist ein
  // spaeterer Wechsel eine neue Fassung — und nur dann wird neu geladen.
  // Beim allerersten Besuch uebernimmt der Worker sofort; ein Reload waere
  // dort eine Schleife.
  const schonBetreut = !!navigator.serviceWorker.controller;
  let neuGeladen = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!schonBetreut || neuGeladen) return;
    neuGeladen = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Eine App, die auf dem Home-Bildschirm liegt, wird tagelang nicht neu
      // geladen. Darum hier selbst nachfragen: beim Zurueckkehren und
      // stuendlich. Ohne das sieht eine Nutzerin Wochen alte Staende.
      const nachsehen = () => reg.update().catch(() => {});
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") nachsehen();
      });
      setInterval(nachsehen, 60 * 60 * 1000);
    }).catch((e) => console.warn("SW:", e.message));
  });
}
