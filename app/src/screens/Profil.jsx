// Profil.jsx — Mein Bereich, Coach-Verbindung, Terminbuchung und Coach-Chat.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { abonniereNachrichten, dateiLink, exportiereMeineDaten, ladeCoachProfil, ladeDateiHoch, ladeFreieSlots, ladeMeineTermine, ladeNachrichten, loescheKonto, markiereGelesen, merkeEinladung, mitCoachVerbinden, pushAktivieren, pushDeaktivieren, pushMoeglich, pushStatus, sendeNachricht, terminBuchen, terminStornieren } from "../supabase";
import { useEffect, useRef, useState } from "react";
import { Btn, Card, Eyebrow, H } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Profil ── */

export function Profil({ email, onLogout, go, alias, setAlias, anon, setAnon, bindung, aufBindung }) {
  const [time, setTime] = useState("07:00");
  const [push, setPush] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushHinweis, setPushHinweis] = useState("");
  const [plan, setPlan] = useState("Starter");
  const [dsgvoHinweis, setDsgvoHinweis] = useState("");
  const [loeschDialog, setLoeschDialog] = useState(false);
  const [loeschWort, setLoeschWort] = useState("");

  // Push-Status vom Geraet lesen (Erlaubnis + bestehendes Abo).
  useEffect(() => { pushStatus().then((st) => setPush(st === "aktiv")); }, []);

  const pushUmschalten = async () => {
    setPushHinweis(""); setPushBusy(true);
    try {
      if (push) { await pushDeaktivieren(); setPush(false); }
      else { await pushAktivieren(); setPush(true); }
    } catch (e) {
      setPushHinweis(pushMoeglich() ? (e.message || "Das hat nicht geklappt.") : "Dieses Gerät unterstützt keine Push-Nachrichten (auf iPhone: App erst zum Home-Bildschirm hinzufügen).");
    }
    setPushBusy(false);
  };

  // Art. 15/20 DSGVO — vollstaendige Auskunft als JSON-Datei.
  const datenExport = async () => {
    setDsgvoHinweis("Sammle deine Daten …");
    const daten = await exportiereMeineDaten();
    if (!daten) { setDsgvoHinweis("Export gerade nicht möglich — bitte später erneut versuchen."); return; }
    const blob = new Blob([JSON.stringify(daten, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smile2go-meine-daten-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDsgvoHinweis("✓ Deine Daten wurden heruntergeladen.");
    setTimeout(() => setDsgvoHinweis(""), 4000);
  };

  // Art. 17 DSGVO — Konto und alle Daten endgueltig loeschen.
  const kontoLoeschen = async () => {
    setDsgvoHinweis("");
    try {
      await loescheKonto(loeschWort);
      setLoeschDialog(false);
      onLogout?.();
    } catch (e) {
      setDsgvoHinweis(e.message || "Löschen fehlgeschlagen.");
    }
  };

  const Row = ({ children }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderBottom: `1px solid ${C.line}` }}>{children}</div>
  );
  const Label = ({ children }) => <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14.5, color: C.espresso, fontWeight: 600 }}>{children}</div>;

  const plans = [
    { n: "Starter", p: "29 €", f: "Spruch, Orakel, Tagebuch, Mondkalender" },
    { n: "Pro", p: "49 €", f: "+ ilho-Chat, Kurse, Challenges, Musik" },
    { n: "Business", p: "99 €", f: "+ Coach-Tools & Personalisierung" },
  ];

  const nameShown = anon ? "Anonym" : (alias.trim() || (email ? email.split("@")[0].replace(/[._\d]/g, " ").trim() : "Mein Profil"));
  // Echte Links aus dem Profil der Coachin — kein Platzhalter, der nirgends hinführt.
  const [coachProfil, setCoachProfil] = useState(null);
  useEffect(() => {
    if (bindung?.coach_id) ladeCoachProfil(bindung.coach_id).then(setCoachProfil);
  }, [bindung?.coach_id]);

  const cName = coachProfil?.name || bindung?.coach_name || "deine Coachin";
  const connect = [
    { icon: "📸", t: `${cName} auf Instagram`, url: coachProfil?.instagram },
    { icon: "📌", t: `${cName} auf Pinterest`, url: coachProfil?.pinterest },
    { icon: "▶️", t: `${cName} auf YouTube`, url: coachProfil?.youtube },
    { icon: "🌐", t: "Website", url: coachProfil?.website },
  ].filter((c) => c.url);

  // Einladung: die Freundin registriert sich selbst — niemand wird eingetragen.
  const einladen = async () => {
    const code = bindung?.id ? "S2G" : "S2G";
    const text = `Ich nutze smile2go für meine Tageskarte, mein Journal und meine Coaching-Termine. Magst du reinschauen? ${window.location.origin}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setDsgvoHinweis("✓ Einladungstext kopiert — füg ihn einfach in WhatsApp ein.");
        setTimeout(() => setDsgvoHinweis(""), 4000);
      }
      merkeEinladung(code, navigator.share ? "share" : "kopiert");
    } catch (e) { /* Abbruch durch die Nutzerin ist kein Fehler */ }
  };

  return (
    <div>
      {/* Avatar-Banner */}
      <div style={{ position: "relative", height: 178, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft} 65%, ${C.beige})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 116, height: 116, borderRadius: "50%", background: C.card, border: `3px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, color: C.gold, boxShadow: "0 6px 20px rgba(58,42,34,.15)" }}>👤</div>
          <button aria-label="Foto ändern" style={{ position: "absolute", bottom: 2, right: 2, width: 34, height: 34, borderRadius: "50%", border: "none", background: C.card, boxShadow: "0 2px 8px rgba(58,42,34,.25)", cursor: "pointer", fontSize: 15 }}>✏️</button>
        </div>
      </div>

      <div style={{ padding: "14px 20px 4px", textAlign: "center" }}>
        <H size={22}>{nameShown}</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 2 }}>{email}</p>
      </div>

      <div style={{ padding: "16px 20px 26px" }}>
        {/* Mein Bereich — was nur dich betrifft, an einem Ort. */}
        <Eyebrow color={C.plum}>Mein Bereich</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, margin: "8px 0 20px" }}>
          {[
            { icon: "🤍", t: "Me-Time", s: "Termin mit dir selbst", tab: "metime" },
            { icon: "🌿", t: "Wochenbericht", s: "Deine Woche für deine Coachin", tab: "wochenbericht" },
          ].map((x) => (
            <Card key={x.tab} onClick={() => go(x.tab)} style={{ padding: 13 }}>
              <div style={{ fontSize: 20 }}>{x.icon}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: C.espresso, marginTop: 5 }}>{x.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: C.ink, marginTop: 2 }}>{x.s}</div>
            </Card>
          ))}
        </div>

        {/* Account */}
        <Eyebrow color={C.plum}>Account</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          <Row><Label>Name</Label><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink }}>{nameShown}</div></Row>
          <Row><Label>E-Mail</Label><div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.ink }}>{email}</div></Row>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0" }}>
            <Label>Passwort ändern</Label>
            <span style={{ color: C.gold, fontSize: 18 }}>›</span>
          </div>
        </Card>

        {/* Benachrichtigungen */}
        <Eyebrow color={C.plum}>Benachrichtigungen</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          <Row>
            <Label>Push aktiv</Label>
            <button onClick={pushUmschalten} disabled={pushBusy} style={{ width: 52, height: 30, borderRadius: 20, border: "none", cursor: "pointer", position: "relative", background: push ? C.rose : C.line, transition: "background .2s", opacity: pushBusy ? 0.6 : 1 }}>
              <span style={{ position: "absolute", top: 3, left: push ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
            </button>
          </Row>
          {pushHinweis && (
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: "#A8552F", lineHeight: 1.5, padding: "0 0 12px" }}>{pushHinweis}</div>
          )}
          <Row>
            <Label>Erinnerung um</Label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, padding: "8px 12px", border: `1.5px solid ${C.line}`, borderRadius: 10, background: C.card, color: C.espresso }} />
          </Row>
        </Card>

        {/* Meine Coachin */}
        <Eyebrow color={C.plum}>Meine Coachin</Eyebrow>
        {bindung?.coach_id ? (
          <Card style={{ marginTop: 8, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 18, flexShrink: 0 }}>
              {(bindung.coach_name || "C").charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{bindung.coach_name || "Deine Coachin"}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.sage, fontWeight: 600 }}>
                ✓ verbunden seit {new Date(bindung.verbunden_am).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </Card>
        ) : (
          <div style={{ marginTop: 8 }}><CoachVerbinden onVerbunden={aufBindung} /></div>
        )}

        {/* Persönlich */}
        <Eyebrow color={C.plum}>Persönlich</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          <div onClick={() => go && go("fragebogen")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", cursor: "pointer" }}>
            <Label>📝 Willkommens-Fragebogen</Label>
            <span style={{ color: C.gold, fontSize: 18 }}>›</span>
          </div>
        </Card>

        {/* Einladen */}
        <Eyebrow color={C.plum}>Weitersagen</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, marginBottom: 4 }}>Eine Freundin einladen</div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.55, margin: "0 0 12px" }}>
            Schick ihr den Link — sie meldet sich selbst an. Wir schreiben ihr nichts, solange sie das nicht ausdrücklich möchte.
          </p>
          <Btn small onClick={einladen}>↗ Einladung teilen</Btn>
        </Card>

        {/* Community & Connect — nur echte Links der eigenen Coachin */}
        {connect.length > 0 && (
          <>
            <Eyebrow color={C.plum}>Community & Connect</Eyebrow>
            <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
              {connect.map((c, i) => (
                <a key={c.t} href={c.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i < connect.length - 1 ? `1px solid ${C.line}` : "none", textDecoration: "none" }}>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso }}>{c.t}</span>
                  <span style={{ color: C.gold, fontSize: 18 }}>›</span>
                </a>
              ))}
            </Card>
          </>
        )}

        {/* Abo & Käufe */}
        <Eyebrow color={C.plum}>Abo & Käufe</Eyebrow>
        <div style={{ display: "grid", gap: 10, marginTop: 8, marginBottom: 16 }}>
          {plans.map((p) => {
            const active = plan === p.n;
            return (
              <Card key={p.n} onClick={() => setPlan(p.n)} style={{ borderColor: active ? C.rose : C.line, background: active ? C.roseSoft : C.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: C.espresso }}>{p.n} {active && "✓"}</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{p.f}</div>
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.plum, whiteSpace: "nowrap" }}>{p.p}<span style={{ fontSize: 11, fontFamily: "system-ui, sans-serif", color: C.ink }}>/Monat</span></div>
              </Card>
            );
          })}
        </div>

        {/* Hilfe & Info */}
        <Eyebrow color={C.plum}>Hilfe & Info</Eyebrow>
        <Card style={{ marginTop: 8, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
          {[
            { t: "📖 App-Guide", fn: () => go("appguide") },
            { t: "🧑‍⚕️ Coach-Ansicht (Demo)", fn: () => go("coachdash") },
            { t: "🤝 KI Coach Twin (Beta)", fn: () => go("coachtwin") },
            { t: "📝 Session-Notiz (Coach-Werkstatt)", fn: () => go("sessionnotiz") },
            { t: "🧠 Wissensarchiv (Coach-Werkstatt)", fn: () => go("wissen") },
            { t: "💬 Support kontaktieren", fn: null },
            { t: "🆘 In Krisen: TelefonSeelsorge 0800 111 0 111 · Notruf 112", fn: null },
            { t: "📄 Datenschutzerklärung", fn: () => go("datenschutz") },
            { t: "📄 Impressum", fn: () => go("impressum") },
            { t: "📥 Meine Daten exportieren", fn: datenExport },
            { t: "🗑️ Konto & alle Daten löschen", fn: () => setLoeschDialog(true) },
          ].map((x, i, arr) => (
            <div key={x.t} onClick={x.fn || undefined} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : "none", cursor: x.fn ? "pointer" : "default", opacity: x.fn ? 1 : 0.55 }}>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso }}>{x.t}</span>
              <span style={{ color: C.gold, fontSize: 18 }}>{x.fn ? "›" : ""}</span>
            </div>
          ))}
        </Card>

        {dsgvoHinweis && (
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, background: C.roseSoft, borderRadius: 12, padding: "11px 14px", marginBottom: 14, lineHeight: 1.5 }}>{dsgvoHinweis}</div>
        )}

        {loeschDialog && (
          <Card style={{ marginBottom: 16, border: `1.5px solid ${C.rose}` }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, marginBottom: 6 }}>Konto wirklich löschen?</div>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "0 0 12px" }}>
              Damit werden dein Konto, dein Tagebuch, deine Nachrichten, Termine und Dateien
              endgültig gelöscht. Das lässt sich nicht rückgängig machen.
              Tippe zur Bestätigung <strong>LÖSCHEN</strong> ein.
            </p>
            <input
              value={loeschWort}
              onChange={(e) => setLoeschWort(e.target.value)}
              placeholder="LÖSCHEN"
              style={{ width: "100%", padding: "13px 14px", fontSize: 15, letterSpacing: 1, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 13, background: C.card, color: C.espresso, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><Btn full ghost onClick={() => { setLoeschDialog(false); setLoeschWort(""); }}>Abbrechen</Btn></div>
              <div style={{ flex: 1 }}><Btn full onClick={kontoLoeschen} disabled={loeschWort.trim().toUpperCase() !== "LÖSCHEN"}>Endgültig löschen</Btn></div>
            </div>
          </Card>
        )}

        <Btn full ghost onClick={onLogout}>Abmelden</Btn>
      </div>
    </div>
  );
}

/* ── Coachin verbinden: Einladungscode einlösen ── */

export function CoachVerbinden({ onVerbunden, kompakt = false }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const einloesen = async () => {
    setErr("");
    if (code.trim().length < 4) return setErr("Bitte gib den Code deiner Coachin ein.");
    setBusy(true);
    try {
      await mitCoachVerbinden(code);
      setCode("");
      onVerbunden?.();
    } catch (e) {
      setErr(e.message?.includes("ungueltig") ? "Dieser Code gilt nicht (mehr). Frag deine Coachin nach einem neuen." : (e.message || "Das hat nicht geklappt."));
    }
    setBusy(false);
  };

  return (
    <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
      {!kompakt && (
        <>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso, marginBottom: 4 }}>Mit deiner Coachin verbinden</div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: "0 0 12px" }}>
            Deine Coachin hat dir einen Einladungscode gegeben. Damit gehören Nachrichten, Termine und Materialien ab sofort euch beiden — und niemandem sonst.
          </p>
        </>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && einloesen()}
          placeholder="z. B. S2G-2026"
          style={{ flex: 1, padding: "13px 14px", fontSize: 15, letterSpacing: 1, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 13, background: C.card, color: C.espresso, outline: "none" }}
        />
        <Btn small onClick={einloesen} disabled={busy}>{busy ? "…" : "Verbinden"}</Btn>
      </div>
      {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: "#A8552F", marginTop: 10 }}>{err}</div>}
    </Card>
  );
}

/* ── Termin-Buchung: echte Zeitfenster der Coachin, echte Buchung ── */

export function Buchen({ bindung, aufBindung, termine, setTermine }) {
  const [slots, setSlots] = useState([]);
  const [meine, setMeine] = useState([]);
  const [tag, setTag] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [laedt, setLaedt] = useState(true);

  const laden = async () => {
    if (!bindung?.coach_id) { setLaedt(false); return; }
    const [frei, gebucht] = await Promise.all([ladeFreieSlots(bindung.coach_id), ladeMeineTermine()]);
    setSlots(frei);
    setMeine(gebucht);
    // Startseite (Heute) zeigt die naechsten Termine — Zustand gespiegelt halten.
    setTermine?.(gebucht.map((t) => ({
      z: new Date(t.beginn).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      t: `${t.titel || "Coaching-Session"} (${new Date(t.beginn).toLocaleDateString("de-DE", { day: "numeric", month: "short" })})`,
    })));
    setLaedt(false);
  };

  useEffect(() => { laden(); /* eslint-disable-next-line */ }, [bindung?.coach_id]);

  const buchen = async (slot) => {
    setErr(""); setBusy(true);
    try {
      await terminBuchen(slot.id);
      setTag(null);
      await laden();
    } catch (e) {
      setErr(e.message?.includes("verfuegbar") ? "Dieses Zeitfenster wurde eben vergeben. Bitte wähle ein anderes." : (e.message || "Buchung fehlgeschlagen."));
      await laden();
    }
    setBusy(false);
  };

  const stornieren = async (id) => {
    setBusy(true);
    try { await terminStornieren(id); await laden(); } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  if (!bindung?.coach_id)
    return (
      <div style={{ padding: "20px 20px" }}>
        <Eyebrow>Termin buchen</Eyebrow>
        <H size={24} style={{ marginBottom: 10 }}>Erst verbinden, dann buchen</H>
        <CoachVerbinden onVerbunden={aufBindung} />
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.6 }}>
          Sobald ihr verbunden seid, siehst du hier die echten freien Zeiten deiner Coachin.
        </p>
      </div>
    );

  // Freie Fenster nach Tag gruppieren
  const nachTag = {};
  slots.forEach((sl) => {
    const d = new Date(sl.beginn);
    const key = d.toDateString();
    (nachTag[key] = nachTag[key] || []).push(sl);
  });
  const tage = Object.keys(nachTag);

  return (
    <div style={{ padding: "20px 20px" }}>
      <Eyebrow>Termin buchen</Eyebrow>
      <H size={24} style={{ marginBottom: 8 }}>Deine Sessions</H>

      {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#A8552F", background: "#F9EBE2", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>{err}</div>}

      {meine.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          {meine.map((t) => {
            const d = new Date(t.beginn);
            return (
              <Card key={t.id} style={{ marginBottom: 10, background: `linear-gradient(135deg, ${C.goldPale}, ${C.roseSoft})`, border: "none" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso }}>
                  {d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })} · {d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, marginTop: 4 }}>
                  {t.titel || "1:1 Coaching-Session"}{bindung.coach_name ? ` mit ${bindung.coach_name}` : ""} · {t.dauer_min} Min · {t.kanal === "video" ? "Video" : t.kanal === "telefon" ? "Telefon" : "Vor Ort"}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  {t.video_url && (
                    <div style={{ flex: 1 }}>
                      <a href={t.video_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Btn full small>Session beitreten</Btn></a>
                    </div>
                  )}
                  <div style={{ flex: 1 }}><Btn full small ghost onClick={() => stornieren(t.id)} disabled={busy}>Stornieren</Btn></div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {laedt ? (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink }}>Lade freie Zeiten …</p>
      ) : tage.length === 0 ? (
        <Card>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: C.espresso, fontWeight: 600, marginBottom: 4 }}>Gerade keine freien Zeiten</div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.55, margin: 0 }}>
            {bindung.coach_name || "Deine Coachin"} hat aktuell keine offenen Zeitfenster eingetragen. Schreib ihr gern im Chat — sie öffnet dir eines.
          </p>
        </Card>
      ) : (
        <>
          <Eyebrow color={C.plum}>1 · Tag wählen</Eyebrow>
          <div style={{ display: "flex", gap: 8, margin: "8px 0 16px", flexWrap: "wrap" }}>
            {tage.map((k) => {
              const d = new Date(k);
              const aktiv = tag === k;
              return (
                <button key={k} onClick={() => setTag(k)} style={{
                  flex: "1 0 70px", minWidth: 70, padding: "11px 6px", borderRadius: 14, cursor: "pointer",
                  border: `1.5px solid ${aktiv ? C.rose : C.line}`,
                  background: aktiv ? C.roseSoft : C.card, textAlign: "center",
                }}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: aktiv ? C.plum : C.ink }}>{d.toLocaleDateString("de-DE", { weekday: "short" })}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: C.espresso, marginTop: 2 }}>{d.getDate()}.</div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.sage, fontWeight: 700, marginTop: 2 }}>{nachTag[k].length} frei</div>
                </button>
              );
            })}
          </div>

          {tag && (
            <div style={{ animation: "fadeUp .35s ease" }}>
              <Eyebrow color={C.plum}>2 · Uhrzeit wählen</Eyebrow>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 8 }}>
                {nachTag[tag].map((sl) => (
                  <button key={sl.id} onClick={() => buchen(sl)} disabled={busy} style={{
                    padding: "15px 0", borderRadius: 14, cursor: busy ? "default" : "pointer",
                    border: `1.5px solid ${C.gold}`, background: C.card, opacity: busy ? 0.6 : 1,
                    fontFamily: "system-ui, sans-serif", fontSize: 15.5, fontWeight: 700, color: C.espresso, minHeight: 50,
                  }}>{new Date(sl.beginn).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Coach-Chat: echte Nachrichten zwischen Klientin und Coachin ── */

export function CoachChat({ bindung, aufBindung }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [laedt, setLaedt] = useState(true);
  const [err, setErr] = useState("");
  const [nimmtAuf, setNimmtAuf] = useState(false);
  const [audioLinks, setAudioLinks] = useState({});
  const endRef = useRef(null);
  const recRef = useRef(null);

  const klientinId = bindung?.id;

  useEffect(() => {
    let aktiv = true;
    if (!klientinId) { setLaedt(false); return; }
    (async () => {
      const verlauf = await ladeNachrichten(klientinId);
      if (!aktiv) return;
      setMsgs(verlauf);
      setLaedt(false);
      markiereGelesen(klientinId);
    })();
    const ab = abonniereNachrichten(klientinId, (neu) => {
      setMsgs((m) => (m.some((x) => x.id === neu.id) ? m : [...m, neu]));
      if (neu.absender === "coach") markiereGelesen(klientinId);
    });
    return () => { aktiv = false; ab(); };
  }, [klientinId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Sprachnachrichten liegen im privaten Bucket — Links werden bei Bedarf signiert.
  useEffect(() => {
    msgs.filter((m) => m.audio_pfad && !audioLinks[m.id]).forEach(async (m) => {
      const url = await dateiLink(m.audio_pfad);
      if (url) setAudioLinks((a) => ({ ...a, [m.id]: url }));
    });
  }, [msgs]); // eslint-disable-line

  const senden = async () => {
    const text = input.trim();
    if (!text || !klientinId) return;
    setInput("");
    const gesendet = await sendeNachricht({ klientinId, text });
    if (!gesendet) { setErr("Nachricht konnte nicht gesendet werden."); setInput(text); return; }
    setMsgs((m) => (m.some((x) => x.id === gesendet.id) ? m : [...m, gesendet]));
  };

  const aufnahmeStarten = async () => {
    setErr("");
    try {
      const strom = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(strom);
      const teile = [];
      const start = Date.now();
      rec.ondataavailable = (e) => teile.push(e.data);
      rec.onstop = async () => {
        strom.getTracks().forEach((t) => t.stop());
        const sek = Math.max(1, Math.round((Date.now() - start) / 1000));
        const blob = new Blob(teile, { type: rec.mimeType || "audio/webm" });
        const datei = new File([blob], `sprachnachricht-${Date.now()}.webm`, { type: blob.type });
        const hoch = await ladeDateiHoch(datei);
        if (!hoch) { setErr("Sprachnachricht konnte nicht hochgeladen werden."); return; }
        const gesendet = await sendeNachricht({ klientinId, audioPfad: hoch.pfad, audioSek: sek });
        if (gesendet) setMsgs((m) => (m.some((x) => x.id === gesendet.id) ? m : [...m, gesendet]));
      };
      recRef.current = rec;
      rec.start();
      setNimmtAuf(true);
    } catch {
      setErr("Ohne Mikrofon-Erlaubnis geht die Sprachnachricht leider nicht.");
    }
  };

  const aufnahmeStoppen = () => {
    recRef.current?.stop();
    recRef.current = null;
    setNimmtAuf(false);
  };

  if (!klientinId)
    return (
      <div style={{ padding: "20px 16px" }}>
        <Eyebrow>Coach-Chat</Eyebrow>
        <H size={24} style={{ marginBottom: 10 }}>Noch keine Coachin verbunden</H>
        <CoachVerbinden onVerbunden={aufBindung} />
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.6 }}>
          Deine Nachrichten sind Ende-zu-Ende an eure Verbindung gebunden: nur du und deine Coachin könnt sie lesen.
        </p>
      </div>
    );

  return (
    <div style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", minHeight: "60vh" }}>
      <Card style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, padding: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 19, flexShrink: 0 }}>
          {(bindung.coach_name || "C").charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: C.espresso }}>{bindung.coach_name || "Deine Coachin"}</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.sage, fontWeight: 600 }}>Antwortet meist innerhalb eines Tages</div>
        </div>
      </Card>

      {err && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#A8552F", background: "#F9EBE2", borderRadius: 12, padding: "10px 13px", marginBottom: 10 }}>{err}</div>}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {laedt && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink }}>Lade Verlauf …</div>}
        {!laedt && msgs.length === 0 && (
          <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.ink, lineHeight: 1.6, textAlign: "center", padding: "20px 10px" }}>
            Noch keine Nachrichten. Schreib den ersten Gedanken — auch ein Satz reicht. 🤍
          </p>
        )}
        {msgs.map((m) => {
          const ich = m.absender === "klientin";
          return (
            <div key={m.id} style={{ alignSelf: ich ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <div style={{
                background: ich ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.card,
                color: ich ? "#fff" : C.espresso,
                border: ich ? "none" : `1px solid ${C.line}`,
                borderRadius: ich ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
                padding: "11px 14px", fontFamily: "system-ui, sans-serif", fontSize: 14.5, lineHeight: 1.55,
              }}>
                {m.audio_pfad ? (
                  audioLinks[m.id]
                    ? <audio controls src={audioLinks[m.id]} style={{ width: 190, maxWidth: "100%" }} />
                    : <span>🎙️ Sprachnachricht {m.audio_sek ? `· 0:${String(m.audio_sek).padStart(2, "0")}` : ""}</span>
                ) : m.text}
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, color: C.ink, opacity: 0.7, marginTop: 3, textAlign: ich ? "right" : "left" }}>
                {new Date(m.created_at).toLocaleString("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                {ich && m.gelesen_am ? " · gelesen" : ""}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", position: "sticky", bottom: 0, background: C.cream, paddingTop: 6 }}>
        <button
          onClick={nimmtAuf ? aufnahmeStoppen : aufnahmeStarten}
          aria-label={nimmtAuf ? "Aufnahme beenden" : "Sprachnachricht aufnehmen"}
          style={{
            width: 46, height: 46, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
            border: `1.5px solid ${nimmtAuf ? C.rose : C.line}`,
            background: nimmtAuf ? C.roseSoft : C.card, fontSize: 19,
          }}
        >{nimmtAuf ? "⏹" : "🎙️"}</button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && senden()}
          placeholder={`Nachricht an ${bindung.coach_name || "deine Coachin"} …`}
          style={{ flex: 1, padding: "13px 15px", fontSize: 15, fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.line}`, borderRadius: 22, background: C.card, color: C.espresso, outline: "none" }}
        />
        <Btn small onClick={senden}>Senden</Btn>
      </div>
    </div>
  );
}

