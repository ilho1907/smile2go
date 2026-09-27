import { useState, useEffect } from "react";
import { zweiFaktorStatus, zweiFaktorEinrichten, zweiFaktorPruefen, zweiFaktorEntfernen } from "./supabase";

/* Zwei-Faktor-Anmeldung (ICF F.12) — geteilt von App und Coach-Panel.
   Farben kommen vom Aufrufer, damit beide Oberflächen ihren eigenen Look behalten. */
const sys = { fontFamily: "system-ui, sans-serif" };

function CodeFeld({ wert, setWert, onEnter, C }) {
  return (
    <input value={wert} onChange={(e) => setWert(e.target.value.replace(/\D/g, "").slice(0, 6))}
      onKeyDown={(e) => e.key === "Enter" && onEnter()} inputMode="numeric" autoComplete="one-time-code" placeholder="6-stelliger Code" autoFocus
      style={{ ...sys, width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 20, letterSpacing: 6, textAlign: "center", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card, color: C.espresso, outline: "none", margin: "10px 0" }} />
  );
}

function Knopf({ children, onClick, disabled, ghost, C }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...sys, fontSize: 14, fontWeight: 700, borderRadius: 22, padding: "11px 20px", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
      border: ghost ? `1.5px solid ${C.line}` : "none", background: ghost ? "transparent" : `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: ghost ? C.espresso : "#fff",
    }}>{children}</button>
  );
}

// Abfrage direkt nach dem Passwort-Login.
export function ZweiFaktorAbfrage({ faktorId, onOk, onAbbruch, C }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const pruefen = async () => {
    if (code.length !== 6 || busy) return;
    setBusy(true); setErr("");
    const ok = await zweiFaktorPruefen(faktorId, code);
    setBusy(false);
    if (ok) onOk(); else { setErr("Der Code stimmt nicht oder ist abgelaufen."); setCode(""); }
  };
  return (
    <div>
      <div style={{ ...sys, fontSize: 15, fontWeight: 700, color: C.espresso }}>🔐 Zweiter Schritt</div>
      <p style={{ ...sys, fontSize: 13, color: C.ink, lineHeight: 1.5, margin: "6px 0 0" }}>Gib den Code aus deiner Authenticator-App ein.</p>
      <CodeFeld wert={code} setWert={setCode} onEnter={pruefen} C={C} />
      {err && <div style={{ ...sys, fontSize: 13, color: "#A8552F", marginBottom: 8 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <Knopf onClick={pruefen} disabled={busy || code.length !== 6} C={C}>{busy ? "Prüfe …" : "Bestätigen"}</Knopf>
        {onAbbruch && <Knopf ghost onClick={onAbbruch} C={C}>Abbrechen</Knopf>}
      </div>
    </div>
  );
}

// Einrichten / Abschalten im Profil.
export function ZweiFaktorEinstellung({ C }) {
  const [status, setStatus] = useState(null); // { aktiv, faktorId }
  const [setup, setSetup] = useState(null);   // { faktorId, qr, geheimnis }
  const [code, setCode] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const laden = () => zweiFaktorStatus().then(setStatus).catch(() => setStatus({ aktiv: false, faktorId: null }));
  useEffect(() => { laden(); }, []);

  const starten = async () => {
    setBusy(true); setInfo("");
    const r = await zweiFaktorEinrichten();
    setBusy(false);
    if (r.fehler) setInfo("Einrichtung gerade nicht möglich: " + r.fehler); else setSetup(r);
  };
  const bestaetigen = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    const ok = await zweiFaktorPruefen(setup.faktorId, code);
    setBusy(false);
    if (ok) { setSetup(null); setCode(""); setInfo("✓ Zwei-Faktor-Anmeldung ist aktiv."); laden(); }
    else { setInfo("Der Code stimmt nicht — bitte den aktuellen Code eingeben."); setCode(""); }
  };
  const abschalten = async () => {
    if (!window.confirm("Zwei-Faktor-Anmeldung wirklich abschalten? Dein Konto ist dann nur noch per Passwort geschützt.")) return;
    setBusy(true);
    const ok = await zweiFaktorEntfernen(status.faktorId);
    setBusy(false);
    setInfo(ok ? "Zwei-Faktor-Anmeldung ist abgeschaltet." : "Abschalten nicht möglich — bitte melde dich neu an und versuche es erneut.");
    laden();
  };

  if (!status) return <p style={{ ...sys, fontSize: 13, color: C.ink }}>Lade …</p>;
  return (
    <div>
      <p style={{ ...sys, fontSize: 13, color: C.ink, lineHeight: 1.55, marginTop: 0 }}>
        Mit Zwei-Faktor-Anmeldung braucht es neben deinem Passwort einen Code aus einer Authenticator-App (z. B. Google Authenticator, Microsoft Authenticator, 1Password). So bleibt dein Konto geschützt, selbst wenn jemand dein Passwort kennt.
      </p>
      {status.aktiv && !setup && (
        <>
          <div style={{ ...sys, fontSize: 14, fontWeight: 700, color: C.sage || C.espresso, margin: "8px 0 12px" }}>✓ Aktiv</div>
          <Knopf ghost onClick={abschalten} disabled={busy} C={C}>Abschalten</Knopf>
        </>
      )}
      {!status.aktiv && !setup && <Knopf onClick={starten} disabled={busy} C={C}>{busy ? "Einen Moment …" : "Jetzt einrichten"}</Knopf>}
      {setup && (
        <div>
          <p style={{ ...sys, fontSize: 13, color: C.espresso, lineHeight: 1.5 }}>1. Scanne den QR-Code mit deiner Authenticator-App.</p>
          <img src={setup.qr} alt="QR-Code für die Authenticator-App" style={{ width: 180, height: 180, background: "#fff", borderRadius: 12, padding: 8 }} />
          <p style={{ ...sys, fontSize: 11.5, color: C.ink, wordBreak: "break-all" }}>Oder Schlüssel manuell eingeben: <code>{setup.geheimnis}</code></p>
          <p style={{ ...sys, fontSize: 13, color: C.espresso, lineHeight: 1.5, marginBottom: 0 }}>2. Gib den 6-stelligen Code aus der App ein.</p>
          <CodeFeld wert={code} setWert={setCode} onEnter={bestaetigen} C={C} />
          <div style={{ display: "flex", gap: 8 }}>
            <Knopf onClick={bestaetigen} disabled={busy || code.length !== 6} C={C}>Bestätigen</Knopf>
            <Knopf ghost onClick={() => { setSetup(null); setCode(""); }} C={C}>Abbrechen</Knopf>
          </div>
        </div>
      )}
      {info && <p style={{ ...sys, fontSize: 13, color: C.plum || C.espresso, marginTop: 12 }}>{info}</p>}
    </div>
  );
}
