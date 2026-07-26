import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";

// Mitglieder-App standardmäßig · Admin unter http://localhost:5173/#admin
const Root = () => (window.location.hash === "#admin" ? <Admin /> : <App />);
window.addEventListener("hashchange", () => window.location.reload());

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
