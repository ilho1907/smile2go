// Auth.jsx — Anmeldung, Registrierung und neues Passwort.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { neuesPasswortSetzen, passwortZuruecksetzen, supabase } from "../supabase";
import { useState } from "react";
import { sternzeichenAusDatum } from "./Orakel";
import { Btn, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Auth ── */

export function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [dsgvo, setDsgvo] = useState(false);
  const [geburt, setGeburt] = useState("");
  const [ilhoOn, setIlhoOn] = useState(true);
  const [optin, setOptin] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const echterBackend = !!supabase;

  const [resetHinweis, setResetHinweis] = useState("");

  // Passwort vergessen: Supabase schickt einen Link, der mit #passwort-neu
  // zurueck in die App fuehrt (siehe PasswortNeu weiter unten).
  const passwortVergessen = async () => {
    setErr(""); setResetHinweis("");
    if (!email.includes("@")) return setErr("Bitte gib zuerst deine E-Mail-Adresse ein.");
    if (!echterBackend) return setResetHinweis("Prototyp-Modus: In der fertigen App bekommst du jetzt eine E-Mail.");
    setBusy(true);
    try {
      await passwortZuruecksetzen(email);
      setResetHinweis(`Wir haben dir einen Link an ${email} geschickt — er gilt 60 Minuten.`);
    } catch (e) {
      setErr(e.message || "Das hat gerade nicht geklappt.");
    }
    setBusy(false);
  };

  const input = {
    width: "100%", padding: "15px 16px", fontSize: 16,
    fontFamily: "system-ui, sans-serif",
    border: `1.5px solid ${C.line}`, borderRadius: 14,
    background: C.card, color: C.espresso, marginBottom: 12, outline: "none",
  };

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) return setErr("Bitte gib eine gültige E-Mail-Adresse ein.");
    if (pw.length < 8) return setErr("Dein Passwort braucht mindestens 8 Zeichen.");
    if (mode === "register" && !dsgvo) return setErr("Bitte stimme der Datenschutzerklärung zu.");

    // Prototyp-Modus (kein Supabase konfiguriert): altes Simulationsverhalten, unverändert.
    if (!echterBackend) {
      if (mode === "register") return setOptin(true);
      onLogin(email);
      return;
    }

    // Echter Supabase-Auth-Modus:
    setBusy(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email, password: pw,
          options: { data: { geburtsdatum: geburt, ilho_aktiv: ilhoOn } },
        });
        if (error) { setErr(error.message); setBusy(false); return; }
        if (data?.session) {
          onLogin(email, sternzeichenAusDatum(geburt), ilhoOn);
        } else {
          setOptin(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) { setErr(error.message === "Invalid login credentials" ? "E-Mail oder Passwort ist falsch." : error.message); setBusy(false); return; }
        onLogin(email);
      }
    } catch (e) {
      setErr("Verbindung fehlgeschlagen — bitte versuch es gleich noch einmal.");
    }
    setBusy(false);
  };

  const googleLogin = async () => {
    if (!echterBackend) { onLogin("google.nutzerin@gmail.com"); return; }
    setErr("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setErr("Google-Login ist gerade nicht verfügbar. Bitte melde dich mit E-Mail an.");
  };

  // Nach echter Registrierung: prüft per Klick, ob die E-Mail-Bestätigung schon erfolgt ist.
  const nachBestaetigungPruefen = async () => {
    if (!echterBackend) { onLogin(email, sternzeichenAusDatum(geburt), ilhoOn); return; }
    setBusy(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) { setErr("Noch nicht bestätigt — bitte klicke zuerst den Link in deiner E-Mail."); return; }
    if (data?.session) onLogin(email, sternzeichenAusDatum(geburt), ilhoOn);
  };

  if (optin)
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>💌</div>
        <H size={26} style={{ marginBottom: 12 }}>Fast geschafft!</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, color: C.ink, lineHeight: 1.6, marginBottom: 28 }}>
          Wir haben dir eine E-Mail an <strong>{email}</strong> geschickt. Bitte bestätige deine Anmeldung (Double-Opt-in).
        </p>
        {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#A8552F", background: "#F9EBE2", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>{err}</div>}
        <Btn full onClick={nachBestaetigungPruefen}>{busy ? "Prüfe …" : "Ich habe bestätigt → Weiter"}</Btn>
        {!echterBackend && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 16 }}>(Prototyp: Bestätigung wird simuliert)</p>}
      </div>
    );

  return (
    <div style={{ padding: "48px 24px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Eyebrow>smile2go · München</Eyebrow>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 40, color: C.espresso, letterSpacing: 1 }}>
          smile<span style={{ color: C.rose, fontStyle: "italic" }}>2</span>go
        </div>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15.5, color: C.ink, marginTop: 8 }}>
          Dein Raum für Ruhe & Wachstum
        </p>
      </div>

      {/* Google-Login */}
      {import.meta.env.VITE_GOOGLE_LOGIN === "1" && (<>
      <button
        onClick={googleLogin}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "14px 20px", borderRadius: 14, border: `1.5px solid ${C.line}`,
          background: "#fff", cursor: "pointer", minHeight: 48,
          fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 600, color: C.espresso,
          marginBottom: 18,
        }}
      >
        <svg width="19" height="19" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.3 1.5 7.8 2.8l5.7-5.7C34 3.3 29.5 1.5 24 1.5 14.9 1.5 7.2 6.9 3.7 14.6l6.9 5.4C12.2 13.7 17.6 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v8.1h12.7c-.3 2.1-1.7 5.2-4.8 7.3l7.3 5.7c4.6-4.3 7.3-10.5 7.3-17.1z" />
          <path fill="#FBBC05" d="M10.6 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-6.9-5.4C2.3 16.8 1.5 20.3 1.5 24s.8 7.2 2.2 10.1l6.9-5.4z" />
          <path fill="#34A853" d="M24 46.5c5.5 0 10-1.8 13.2-4.9l-7.3-5.7c-1.9 1.3-4.4 2.2-5.9 2.2-6.4 0-11.8-4.2-13.4-10.1l-6.9 5.4C7.2 41.1 14.9 46.5 24 46.5z" />
        </svg>
        Mit Google anmelden
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 18px" }}>
        <div style={{ flex: 1, height: 1, background: C.line }} />
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink }}>oder mit E-Mail</span>
        <div style={{ flex: 1, height: 1, background: C.line }} />
      </div>
      </>)}

      <div style={{ display: "flex", gap: 8, marginBottom: 18, background: C.beige, borderRadius: 14, padding: 5 }}>
        {[["login", "Anmelden"], ["register", "Registrieren"]].map(([k, label]) => (
          <button key={k} onClick={() => { setMode(k); setErr(""); }} style={{
            flex: 1, padding: "12px 0", borderRadius: 11, border: "none", cursor: "pointer",
            fontFamily: "system-ui, sans-serif", fontSize: 14.5, fontWeight: 600,
            background: mode === k ? C.card : "transparent",
            color: mode === k ? C.espresso : C.ink,
            boxShadow: mode === k ? "0 2px 8px rgba(58,42,34,.08)" : "none",
          }}>{label}</button>
        ))}
      </div>

      <input style={input} type="email" placeholder="E-Mail-Adresse" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={input} type="password" placeholder="Passwort (min. 8 Zeichen)" value={pw} onChange={(e) => setPw(e.target.value)} />

      {mode === "register" && (
        <>
          <label style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginBottom: 5 }}>Geburtsdatum <span style={{ color: C.plum }}>· für dein persönliches Sternzeichen</span></label>
          <input style={input} type="date" value={geburt} onChange={(e) => setGeburt(e.target.value)} />
        </>
      )}

      {mode === "register" && (
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={dsgvo} onChange={(e) => setDsgvo(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.gold, flexShrink: 0, marginTop: 1 }} />
          <span>Ich stimme der <u>Datenschutzerklärung</u> zu. Meine Daten werden DSGVO-konform in der EU gespeichert.</span>
        </label>
      )}

      {mode === "register" && (
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5, marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={ilhoOn} onChange={(e) => setIlhoOn(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.gold, flexShrink: 0, marginTop: 1 }} />
          <span>✨ <strong>ilho</strong>, meinen KI-Begleiter, aktivieren. Jederzeit in den Einstellungen änderbar.</span>
        </label>
      )}

      {err && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#A8552F", background: "#F9EBE2", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>{err}</div>
      )}

      <Btn full onClick={submit} disabled={busy}>{busy ? "Einen Moment …" : mode === "login" ? "Anmelden" : "Konto erstellen"}</Btn>

      {mode === "login" && (
        <button onClick={passwortVergessen} disabled={busy} style={{
          width: "100%", background: "none", border: "none", cursor: "pointer", marginTop: 14,
          fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.plum, fontWeight: 600,
          textDecoration: "underline", minHeight: 44,
        }}>Passwort vergessen?</button>
      )}

      {resetHinweis && (
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#3E7A4A", background: "#EAF6EC", borderRadius: 12, padding: "11px 14px", marginTop: 12, lineHeight: 1.5 }}>{resetHinweis}</div>
      )}

      <p style={{ textAlign: "center", fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 20, lineHeight: 1.6 }}>
        🇪🇺 Hosting in der EU · DSGVO-konform · Jederzeit kündbar
      </p>
    </div>
  );
}

/* ── App-Rahmen ── */

/* ── Neues Passwort setzen · Ziel des Links aus der Passwort-vergessen-Mail ── */
export function PasswortNeu({ onFertig }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [fertig, setFertig] = useState(false);

  const input = {
    width: "100%", padding: "15px 16px", fontSize: 16, fontFamily: "system-ui, sans-serif",
    border: `1.5px solid ${C.line}`, borderRadius: 14, background: C.card, color: C.espresso,
    marginBottom: 12, outline: "none",
  };

  const speichern = async () => {
    setErr("");
    if (pw.length < 8) return setErr("Dein neues Passwort braucht mindestens 8 Zeichen.");
    if (pw !== pw2) return setErr("Die beiden Passwörter stimmen nicht überein.");
    setBusy(true);
    try {
      await neuesPasswortSetzen(pw);
      setFertig(true);
    } catch (e) {
      setErr(e.message || "Das hat nicht geklappt — bitte fordere den Link neu an.");
    }
    setBusy(false);
  };

  if (fertig)
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>🤍</div>
        <H size={26} style={{ marginBottom: 12 }}>Passwort geändert</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, color: C.ink, lineHeight: 1.6, marginBottom: 28 }}>
          Du kannst dich ab sofort mit deinem neuen Passwort anmelden.
        </p>
        <Btn full onClick={onFertig}>Weiter zur App</Btn>
      </div>
    );

  return (
    <div style={{ padding: "56px 24px 40px" }}>
      <Eyebrow>smile2go</Eyebrow>
      <H size={26} style={{ marginBottom: 8 }}>Neues Passwort</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, marginBottom: 20 }}>
        Wähle ein neues Passwort für dein Konto — mindestens 8 Zeichen.
      </p>
      <input style={input} type="password" placeholder="Neues Passwort" value={pw} onChange={(e) => setPw(e.target.value)} />
      <input style={input} type="password" placeholder="Neues Passwort wiederholen" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: "#A8552F", background: "#F9EBE2", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>{err}</div>}
      <Btn full onClick={speichern} disabled={busy}>{busy ? "Speichere …" : "Passwort speichern"}</Btn>
    </div>
  );
}

