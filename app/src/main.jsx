import React from "react";
import ReactDOM from "react-dom/client";
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
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("SW:", e.message));
  });
}
