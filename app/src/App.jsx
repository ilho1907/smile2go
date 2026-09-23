import HeuteHero from "./HeuteHero";
import MediaBanner from "./MediaBanner";
import { Meditation as MeditationCine, Podcast as PodcastCine } from "./MediaScreens";
import { IMG as S2GIMG, VIDEO as S2GVID } from "./media";
import { cloudErreichbar, ladeAppState, ladeMeineBindung, ladeTwinMeinerCoachin, sendeNachricht, speichereAppState, supabase } from "./supabase";
import { useEffect, useMemo, useState } from "react";
import { tonalitaetsZusatz } from "./lib/ki";
import { wochenNummer } from "./lib/zeit";
import { Auth, PasswortNeu } from "./screens/Auth";
import { CoachDashboard, CoachTwinInterview, SessionIntelligenz, WissensSuche } from "./screens/CoachIntelligenz";
import { CoachingHub, Wochenbericht, baueWochenbericht, berichtText } from "./screens/CoachingHub";
import { Fortschritt, PunkteModal } from "./screens/Fortschritt";
import { Heute, Luma } from "./screens/Heute";
import { AppGuide, Community, Datenschutz, Fragebogen, Impressum, Pakete } from "./screens/Info";
import { Journal } from "./screens/Journal";
import { Kurse } from "./screens/Kurse";
import { Mediathek } from "./screens/Mediathek";
import { Mehr, ThemaScreen } from "./screens/Mehr";
import { Office } from "./screens/Office";
import { Orakel } from "./screens/Orakel";
import { Buchen, CoachChat, Profil } from "./screens/Profil";
import { ArchetypTest, SOSOverlay, Schattenspiegel, ZukunftsIch } from "./screens/SOS";
import { Achtsamkeit, Dankbarkeit, Flamme, FreundinnenKreis, Intuition, Jahreskreis, Jahresrueckblick, Loslassen, MeTime, MeTimeKarte, Mondrituale, Qigong, Reisen, RitualDerLeere, WochenOrakel } from "./screens/Uebungen";
import { Aufgaben, Ziele } from "./screens/Ziele";
import { C } from "./ui/tema";

const ROOTS = ["heute", "orakel", "coaching", "tagebuch", "mehr"];

const TITLES = { ziele: "Ziele & Meilensteine", aufgaben: "Challenges & Ziele", kurse: "Kurse", buchen: "Termin buchen", coach: "Coach-Nachrichten", media: "Mediathek", meditation: "Meditation", podcast: "Podcast", community: "Community", fortschritt: "Fortschritt", fragebogen: "Willkommens-Fragebogen", pakete: "Coaching-Pakete", coaching: "Coaching", wochenbericht: "Wochenbericht", profil: "Mein Bereich", appguide: "App-Guide", impressum: "Impressum", datenschutz: "Datenschutz", schatten: "Schattenspiegel", zukunftsich: "Zukunfts-Ich", archetyp: "Archetypen-Test", flamme: "Gemeinsame Flamme", qigong: "Qigong", metime: "Me-Time", achtsamkeit: "Achtsamkeit", dankbarkeit: "Dankbarkeit", loslassen: "Loslassen", kreis: "Freundinnen-Kreis", mondrituale: "Mondrituale", geocaching: "Orakel-Geocaching", intuition: "Intuitions-Training", reisen: "Transformations-Reisen", jahreskreis: "Jahreskreis", leere: "Ritual der Leere", wochenorakel: "Wochen-Orakel", rueckblick: "Jahres-Rückblick" };

export default function IlhoApp() {
  const [user, setUser] = useState(null);
  const [bindung, setBindung] = useState(null);
  const [cloudAus, setCloudAus] = useState(false);
  const [pwReset, setPwReset] = useState(typeof window !== "undefined" && window.location.hash === "#passwort-neu");
  const [tab, setTab] = useState("heute");
  const [stack, setStack] = useState([]);
  const [entries, setEntries] = useState([]);
  const [drawn, setDrawn] = useState(null);
  const [energie, setEnergie] = useState(null);
  const [lumaMsgs, setLumaMsgs] = useState([]);
  const [ritual, setRitual] = useState({});
  const [ch369, setCh369] = useState({ tag: 1, archiv: {}, letzterTag: null, fertig: false });
  const [mm, setMm] = useState([]);
  const [horo, setHoro] = useState(null);
  const [briefe, setBriefe] = useState([]);
  const [akarte, setAkarte] = useState(null);
  const [punkte, setPunkte] = useState(120);
  const [uploads, setUploads] = useState([]);
  const [prefs, setPrefs] = useState({ tiles: ["orakel", "luma", "tagebuch", "musik"] });
  const [meinZeichen, setMeinZeichen] = useState(null);
  const [pkModal, setPkModal] = useState(false);
  const [tools, setTools] = useState({ gcal: true, health: false, notion: false, spotify: false, zoom: false, whatsapp: true });
  const [kursWahl, setKursWahl] = useState([]);
  const [ziele, setZiele] = useState([
    { id: 1, titel: "Mehr Ruhe im Alltag", bereich: "Selbstfürsorge", faellig: "31.08.", warum: "Ich will abends abschalten können — ohne schlechtes Gewissen.", fortschritt: 40, meilen: [
      { t: "7 Tage Morgenritual gehalten", done: true },
      { t: "Handy-freie Stunde am Abend", done: true },
      { t: "1 Retreat-Tag gebucht", done: false },
      { t: "Wöchentlicher Journal-Rückblick", done: false },
      { t: "Grenzen bei der Arbeit gesetzt", done: false },
    ] },
    { id: 2, titel: "Selbstvertrauen stärken", bereich: "Persönlichkeit", faellig: "30.09.", warum: "Ich möchte in Meetings ruhig für meine Ideen einstehen.", fortschritt: 20, meilen: [
      { t: "Stärken-Liste erstellt", done: true },
      { t: "3 Erfolge pro Woche notiert", done: false },
      { t: "Einmal bewusst „Nein“ gesagt", done: false },
      { t: "Positive Affirmation etabliert", done: false },
      { t: "Feedback-Gespräch geführt", done: false },
    ] },
  ]);
  const [aufgaben, setAufgaben] = useState([
    { id: 1, titel: "Energie-Check heute ausfüllen", von: "coach", erledigt: false, faellig: "heute" },
    { id: 2, titel: "3-6-9 Dankbarkeit — heutige Runde abschließen", von: "coach", erledigt: false, faellig: "heute" },
    { id: 3, titel: "Brief an dein zukünftiges Ich schreiben", von: "coach", erledigt: false, faellig: "So" },
    { id: 4, titel: "Morgenmeditation gehört", von: "ich", erledigt: true, faellig: "" },
  ]);
  const [coachMsgs, setCoachMsgs] = useState([]);
  const [office, setOffice] = useState({ briefkopf: null, docs: [], kaeufe: [{ t: "Online-Retreat: Vollmond-Nacht", p: "49 €", d: "Mai 2026" }] });
  const [termine, setTermine] = useState([{ z: "09:00", t: "Morgenmeditation" }]);
  const [toast, setToast] = useState(null);
  const [alias, setAlias] = useState("");
  const [anon, setAnon] = useState(false);
  const [journalSec, setJournalSec] = useState("heute");
  const [intake, setIntake] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [ilhoOpen, setIlhoOpen] = useState(false);
  const [ilhoAktiv, setIlhoAktiv] = useState(true);
  const [archetyp, setArchetyp] = useState(null);
  const [qigong, setQigong] = useState([]);
  const [metime, setMetime] = useState([]);
  const [achtsam, setAchtsam] = useState([]);
  const [dank, setDank] = useState([]);
  const [losgelassen, setLosgelassen] = useState([]);
  const [flamme, setFlamme] = useState(null);
  const [zkMsgs, setZkMsgs] = useState([]);
  const [sosOpen, setSosOpen] = useState(false);
  const [kreis, setKreis] = useState(null);
  const [mondrit, setMondrit] = useState(null);
  const [caches, setCaches] = useState([]);
  const [intu, setIntu] = useState(null);
  const [reisen, setReisen] = useState([]);
  const [feste, setFeste] = useState([]);
  const [leere, setLeere] = useState(null);
  const [wo, setWo] = useState(null);
  const streak = 7;

  const addPunkte = (n, label) => {
    const bonus = Math.random() < 0.18 ? [3, 5, 8][Math.floor(Math.random() * 3)] : 0;
    const neu = punkte + n + bonus;
    const ms = [120, 300, 500, 1000, 5000].find((m) => punkte < m && neu >= m);
    setPunkte(neu);
    setToast(ms ? `🎉 ${ms} Lichtpunkte — Meilenstein erreicht!` : bonus ? `+${n} ✨ ${label} · 🎁 +${bonus} Überraschung!` : `+${n} ✨ ${label}`);
    setTimeout(() => setToast(null), ms ? 3400 : bonus ? 2800 : 2200);
  };

  const name = useMemo(() => {
    if (!user) return "";
    const raw = user.split("@")[0];
    if (raw.toLowerCase().includes("google")) return "";
    const n = raw.replace(/[._\d]/g, " ").trim();
    return n ? n.charAt(0).toUpperCase() + n.slice(1).split(" ")[0] : "";
  }, [user]);

  const anzeigeName = anon ? "" : (alias.trim() || name);

  // Ein Zustand, viele Setter: von localStorage UND von Supabase genutzt, damit beide
  // Wege (offline lokal / echt in der Cloud) exakt dieselbe Struktur wiederherstellen.
  const anwendenState = (s) => {
    if (!s) return;
    if (s.user !== undefined) setUser(s.user);
    if (s.entries) setEntries(s.entries);
    if (s.ziele) setZiele(s.ziele);
    if (s.aufgaben) setAufgaben(s.aufgaben);
    if (s.energie !== undefined) setEnergie(s.energie);
    if (s.ch369) setCh369(s.ch369);
    if (s.briefe) setBriefe(s.briefe);
    if (s.mm) setMm(s.mm);
    if (typeof s.punkte === "number") setPunkte(s.punkte);
    if (s.ritual) setRitual(s.ritual);
    if (typeof s.alias === "string") setAlias(s.alias);
    if (typeof s.anon === "boolean") setAnon(s.anon);
    if (s.kursWahl) setKursWahl(s.kursWahl);
    if (s.prefs) setPrefs(s.prefs);
    if (s.meinZeichen) setMeinZeichen(s.meinZeichen);
    if (s.drawn) setDrawn(s.drawn);
    if (s.horo) setHoro(s.horo);
    if (s.akarte) setAkarte(s.akarte);
    if (s.coachMsgs) setCoachMsgs(s.coachMsgs);
    if (s.termine) setTermine(s.termine);
    if (s.lumaMsgs) setLumaMsgs(s.lumaMsgs);
    if (s.intake) setIntake(s.intake);
    if (s.checkins) setCheckins(s.checkins);
    if (typeof s.ilhoAktiv === "boolean") setIlhoAktiv(s.ilhoAktiv);
    if (s.archetyp) setArchetyp(s.archetyp);
    if (s.qigong) setQigong(s.qigong);
    if (s.metime) setMetime(s.metime);
    if (s.achtsam) setAchtsam(s.achtsam);
    if (s.dank) setDank(s.dank);
    if (s.losgelassen) setLosgelassen(s.losgelassen);
    if (s.flamme) setFlamme(s.flamme);
    if (s.zkMsgs) setZkMsgs(s.zkMsgs);
    if (s.kreis) setKreis(s.kreis);
    if (s.mondrit) setMondrit(s.mondrit);
    if (s.caches) setCaches(s.caches);
    if (s.intu) setIntu(s.intu);
    if (s.reisen) setReisen(s.reisen);
    if (s.feste) setFeste(s.feste);
    if (s.leere) setLeere(s.leere);
    if (s.office) setOffice(s.office);
    if (s.wo) setWo(s.wo);
  };

  // Persistenz (localStorage) — Daten überleben den Reload, auch ohne Login/Supabase.
  useEffect(() => {
    try { anwendenState(JSON.parse(localStorage.getItem("s2g_state") || "null")); } catch (e) {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("s2g_state", JSON.stringify({ user, entries, ziele, aufgaben, energie, ch369, briefe, mm, punkte, ritual, alias, anon, kursWahl, prefs, meinZeichen, drawn, horo, akarte, coachMsgs, termine, lumaMsgs, intake, checkins, ilhoAktiv, archetyp, qigong, metime, achtsam, dank, losgelassen, flamme, zkMsgs, kreis, mondrit, caches, intu, reisen, feste, leere, wo, office }));
    } catch (e) {}
  }, [user, entries, ziele, aufgaben, energie, ch369, briefe, mm, punkte, ritual, alias, anon, kursWahl, prefs, meinZeichen, drawn, horo, akarte, coachMsgs, termine, lumaMsgs, intake, checkins, ilhoAktiv, archetyp, qigong, metime, achtsam, dank, losgelassen, flamme, zkMsgs, kreis, mondrit, caches, intu, reisen, feste, leere, wo, office]);

  // Echte Supabase-Session: stellt Login nach Reload/Google-Redirect wieder her.
  // Ohne konfiguriertes Supabase (kein .env) bleibt supabase === null und hier passiert nichts —
  // die App läuft dann unverändert im Prototyp-Modus (localStorage-Login von oben).
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const sUser = data?.session?.user;
      if (sUser?.email) setUser(sUser.email);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) setUser(session.user.email);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  // Echte Cloud-Persistenz: sobald eine echte Supabase-Nutzerin eingeloggt ist, wird ihr
  // gesamter App-Zustand (Journal, Mood, Challenge, Streak, ...) geräteübergreifend geladen
  // und gespeichert — nicht mehr nur im Browser-localStorage. Fällt Supabase aus (kein .env,
  // kein Login), läuft die App unverändert im lokalen Modus weiter.
  const [cloudBereit, setCloudBereit] = useState(false);
  useEffect(() => {
    if (!supabase || !user) return;
    let aktiv = true;
    ladeAppState().then((s) => {
      if (aktiv && s) anwendenState(s);
      if (aktiv) setCloudBereit(true);
    });
    return () => { aktiv = false; };
  }, [supabase, user]);

  // ── AI Coach Twin: das freigegebene Methoden-Dossier einmal laden ──
  // Solange es keine Klientinnen-Coachin-Zuordnung gibt, ist das das eigene Dossier
  // (die Coachin erlebt ihre eigene ilho). Später kommt hier das Dossier der
  // verknüpften Coachin her — der Rest des Codes bleibt unverändert.
  // Der Twin gehört der COACHIN, nicht der Nutzerin: geladen wird das
  // freigegebene Dossier der verbundenen Coachin. Ohne Bindung kein Twin —
  // dann spricht ilho in seinem eigenen, neutralen Ton.
  const [twin, setTwin] = useState(null);
  const [themaId, setThemaId] = useState(null);
  useEffect(() => {
    if (!supabase || !user || !bindung?.coach_id) { setTwin(null); return; }
    let aktiv = true;
    ladeTwinMeinerCoachin(bindung.coach_id).then((d) => { if (aktiv) setTwin(d); });
    return () => { aktiv = false; };
  }, [user, bindung?.coach_id]); // eslint-disable-line
  const twinTon = tonalitaetsZusatz(twin);

  useEffect(() => {
    if (!supabase || !user || !cloudBereit) return; // nichts speichern, bevor der Cloud-Stand geladen (oder als leer bestätigt) wurde
    const state = { user, entries, ziele, aufgaben, energie, ch369, briefe, mm, punkte, ritual, alias, anon, kursWahl, prefs, meinZeichen, drawn, horo, akarte, coachMsgs, termine, lumaMsgs, intake, checkins, ilhoAktiv, archetyp, qigong, metime, achtsam, dank, losgelassen, flamme, zkMsgs, kreis, mondrit, caches, intu, reisen, feste, leere, wo, office };
    const timer = setTimeout(() => { speichereAppState(state); }, 1200); // debounced, kein Schreiben bei jeder Mikro-Änderung
    return () => clearTimeout(timer);
  }, [user, cloudBereit, entries, ziele, aufgaben, energie, ch369, briefe, mm, punkte, ritual, alias, anon, kursWahl, prefs, meinZeichen, drawn, horo, akarte, coachMsgs, termine, lumaMsgs, intake, checkins, ilhoAktiv, archetyp, qigong, metime, achtsam, dank, losgelassen, flamme, zkMsgs, kreis, mondrit, caches, intu, reisen, feste, leere, wo, office]);

  // Erreichbarkeit der Cloud einmal beim Start pruefen (pausiertes Projekt, Funkloch).
  useEffect(() => {
    if (!supabase) return;
    let aktiv = true;
    cloudErreichbar().then((ok) => { if (aktiv) setCloudAus(!ok); });
    return () => { aktiv = false; };
  }, []);

  // Bindung zur Coachin: bestimmt, wohin Nachrichten, Termine und Materialien gehoeren.
  const aufBindung = async () => {
    const b = await ladeMeineBindung();
    setBindung(b);
  };
  useEffect(() => {
    if (user) aufBindung();
    else setBindung(null);
  }, [user]); // eslint-disable-line

  // Wochenbericht: montags von allein an die Coachin — nur wenn eingeschaltet.
  useEffect(() => {
    if (!bindung?.id) return;
    let an = false, zuletzt = null;
    try {
      an = localStorage.getItem("s2g_bericht_auto") === "an";
      zuletzt = localStorage.getItem("s2g_bericht_woche");
    } catch {}
    if (!an) return;
    const letzte = wochenNummer() - 1;
    if (zuletzt !== null && Number(zuletzt) >= letzte) return;
    const b = baueWochenbericht({ entries, achtsam, dank, qigong, metime, losgelassen, punkte }, -1);
    sendeNachricht({ klientinId: bindung.id, text: berichtText(b, b.zeilen.map((z) => z.k), "") })
      .then((ok) => { if (ok) { try { localStorage.setItem("s2g_bericht_woche", String(letzte)); } catch {} } });
  }, [bindung?.id]); // eslint-disable-line

  const go = (next) => {
    setStack([...stack, tab]);
    setTab(next);
  };
  const goRoot = (next) => {
    setStack([]);
    if (next === "tagebuch") setJournalSec("heute");
    setTab(next);
  };
  const back = () => {
    const s = [...stack];
    const prev = s.pop() ?? "heute";
    setStack(s);
    setTab(prev);
  };

  const isSub = !ROOTS.includes(tab);

  const NAV = [
    { k: "heute", icon: "☀️", t: "Heute" },
    { k: "orakel", icon: "🔮", t: "Orakel" },
    { k: "coaching", icon: "🌸", t: "Coaching", center: true },
    { k: "tagebuch", icon: "📔", t: "Journal" },
    { k: "mehr", icon: "✦", t: "Mehr" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.beige, display: "flex", justifyContent: "center", fontSize: 16 }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 6px 18px rgba(217,110,139,.38); } 50% { box-shadow: 0 6px 30px rgba(217,110,139,.7); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes breathe { 0%,100% { transform: scale(0.58); } 50% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
      <div style={{ width: "100%", maxWidth: 430, background: C.cream, minHeight: "100vh", position: "relative", boxShadow: "0 0 40px rgba(58,42,34,.10)" }}>
        {cloudAus && (
          <div style={{
            position: "sticky", top: 0, zIndex: 40,
            background: "#F9EBE2", borderBottom: "1px solid #E5CDBE",
            padding: "10px 14px", fontFamily: "system-ui, sans-serif",
            fontSize: 12.5, color: "#A8552F", lineHeight: 1.5,
          }}>
            ☁️ Keine Verbindung zur Cloud — Anmeldung, Nachrichten und Termine pausieren.
            Alles, was du hier eingibst, bleibt auf deinem Gerät und wird später synchronisiert.
          </div>
        )}

        {pwReset ? (
          <div style={{ animation: "fadeUp .5s ease" }}>
            <PasswortNeu onFertig={() => { window.location.hash = ""; setPwReset(false); }} />
          </div>
        ) : !user ? (
          <div style={{ animation: "fadeUp .5s ease" }}><Auth onLogin={(mail, zeichen, ilho) => { setUser(mail); if (zeichen) setMeinZeichen(zeichen); if (typeof ilho === "boolean") setIlhoAktiv(ilho); }} /></div>
        ) : (
          <>
            {/* Zurück-Leiste für Unterseiten */}
            {isSub && (
              <div style={{
                position: "sticky", top: 0, zIndex: 15,
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 12px", background: "rgba(251,246,238,.95)",
                backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}`,
              }}>
                <button onClick={back} style={{
                  display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1.5px solid ${C.line}`,
                  borderRadius: 20, cursor: "pointer", color: C.plum, fontFamily: "system-ui, sans-serif",
                  fontSize: 14.5, fontWeight: 700, padding: "9px 16px", minHeight: 44,
                }}>
                  ← Zurück
                </button>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, fontWeight: 600 }}>{TITLES[tab]}</span>
              </div>
            )}

            {pkModal && (
              <PunkteModal
                punkte={punkte}
                streak={streak}
                entries={entries}
                briefe={briefe}
                drawn={drawn}
                ritual={ritual}
                achtsam={achtsam}
                qigong={qigong}
                dank={dank}
                losgelassen={losgelassen}
                metime={metime}
                reisen={reisen}
                ch369={ch369}
                checkins={checkins}
                onClose={() => setPkModal(false)}
                onEinloesen={(p, t) => { setPunkte((x) => x - p); setToast(`🎁 ${t} — eingelöst!`); setTimeout(() => setToast(null), 2600); setPkModal(false); }}
              />
            )}

            {toast && (
              <div style={{
                position: "fixed", top: 14, left: 0, right: 0, margin: "0 auto", width: "fit-content",
                zIndex: 30, background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff",
                fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700,
                padding: "11px 20px", borderRadius: 24, boxShadow: "0 8px 24px rgba(217,110,139,.45)",
                animation: "fadeUp .35s ease",
              }}>{toast}</div>
            )}

            {/* Zurück: sichtbar, sobald man von einem Hauptbereich aus weitergegangen ist. */}
            {stack.length > 0 && tab !== "luma" && (
              <div style={{ padding: "10px 20px 0" }}>
                <button onClick={back} style={{
                  display: "inline-flex", alignItems: "center", gap: 7, minHeight: 40,
                  padding: "8px 14px 8px 11px", cursor: "pointer",
                  background: C.card, border: `1px solid ${C.line}`, borderRadius: 20,
                  fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: C.plum,
                }}>
                  <span style={{ fontSize: 15 }}>‹</span> Zurück
                </button>
              </div>
            )}

            <div key={tab} style={{ paddingBottom: tab === "luma" ? 0 : ilhoAktiv ? 172 : 86, animation: "fadeUp .45s ease" }}>
              {tab === "heute" && <><HeuteHero name={anzeigeName} punkte={punkte} /><MeTimeKarte metime={metime} go={go} /><Heute name={anzeigeName} go={go} streak={streak} punkte={punkte} addPunkte={addPunkte} termine={termine} setTermine={setTermine} prefs={prefs} setPrefs={setPrefs} ch369={ch369} meinZeichen={meinZeichen} openPunkte={() => setPkModal(true)} drawn={drawn} horo={horo} entries={entries} setJournalSec={setJournalSec} twinTon={twinTon} /></>}
              {tab === "orakel" && <><MediaBanner video={S2GVID.orakel} poster={S2GIMG.orakel} title="Orakel" subtitle="Zieh deine Tageskarte" /><Orakel drawn={drawn} setDrawn={setDrawn} energie={energie} horo={horo} setHoro={setHoro} addPunkte={addPunkte} setMeinZeichen={setMeinZeichen} meinZeichen={meinZeichen} briefkopf={office.briefkopf} entries={entries} setEntries={setEntries} archetyp={archetyp} twin={twin} twinTon={twinTon} /></>}
              {tab === "coaching" && <><MediaBanner video={S2GVID.coaching} poster={S2GIMG.coaching} title="Deine Begleitung" subtitle="Achtsam begleitet" /><CoachingHub go={go} bindung={bindung} aufBindung={aufBindung} /></>}
              {tab === "wochenbericht" && <Wochenbericht bindung={bindung} aufBindung={aufBindung} entries={entries} achtsam={achtsam} dank={dank} qigong={qigong} metime={metime} losgelassen={losgelassen} punkte={punkte} />}
              {tab === "impressum" && <Impressum />}
              {tab === "datenschutz" && <Datenschutz />}
              {tab === "tagebuch" && <Journal entries={entries} setEntries={setEntries} ritual={ritual} setRitual={setRitual} ch369={ch369} setCh369={setCh369} mm={mm} setMm={setMm} briefe={briefe} setBriefe={setBriefe} akarte={akarte} setAkarte={setAkarte} addPunkte={addPunkte} streak={streak} punkte={punkte} initialSec={journalSec} />}
              {tab === "mehr" && <><MediaBanner video={S2GVID.mehr} poster={S2GIMG.mehr} title="Mehr" subtitle="Entdecke alle Bereiche" height={190} /><Mehr go={go} addPunkte={addPunkte} bindung={bindung} openPunkte={() => setPkModal(true)} openThema={(id) => { setThemaId(id); go("thema"); }} /></>}
              {tab === "thema" && <ThemaScreen id={themaId} go={go} bindung={bindung} />}
              {tab === "ziele" && <><MediaBanner video={S2GVID.ziele} poster={S2GIMG.ziele} title="Ziele" subtitle="Deine Richtung, dein Nordstern" height={190} /><Ziele ziele={ziele} setZiele={setZiele} addPunkte={addPunkte} /></>}
              {tab === "aufgaben" && <><MediaBanner video={S2GVID.aufgaben} poster={S2GIMG.aufgaben} title="Aufgaben" subtitle="Schritt für Schritt" height={190} /><Aufgaben aufgaben={aufgaben} setAufgaben={setAufgaben} addPunkte={addPunkte} go={go} ch369={ch369} setCh369={setCh369} akarte={akarte} setAkarte={setAkarte} /></>}
              {tab === "appguide" && <><MediaBanner video={S2GVID.appguide} poster={S2GIMG.appguide} title="App-Guide" subtitle="Dein Wegweiser" height={190} /><AppGuide /></>}
              {tab === "kurse" && <><MediaBanner video={S2GVID.kurse} poster={S2GIMG.kurse} title="Deine Kurse" subtitle="Weiterlernen, wo du warst" height={200} /><Kurse bindung={bindung} aufBindung={aufBindung} addPunkte={addPunkte} /></>}
              {tab === "buchen" && <><MediaBanner video={S2GVID.buchen} poster={S2GIMG.buchen} title="Termin buchen" subtitle="Zeit für dich" height={190} /><Buchen bindung={bindung} aufBindung={aufBindung} termine={termine} setTermine={setTermine} /></>}
              {tab === "coach" && <><MediaBanner video={S2GVID.coach} poster={S2GIMG.coach} title="Coach-Chat" subtitle="Du wirst gehört" height={190} /><CoachChat bindung={bindung} aufBindung={aufBindung} /></>}
              {tab === "media" && <><MediaBanner video={S2GVID.mediathek} poster={S2GIMG.mediathek} title="Mediathek" subtitle="Deine Inhalte, dein Raum" height={200} /><Mediathek uploads={uploads} setUploads={setUploads} tools={tools} setTools={setTools} office={office} setOffice={setOffice} bindung={bindung} /></>}
              {tab === "meditation" && <MeditationCine addPunkte={addPunkte} />}
              {tab === "podcast" && <PodcastCine addPunkte={addPunkte} />}
              {tab === "community" && <><MediaBanner video={S2GVID.community} poster={S2GIMG.community} title="Community" subtitle="Gemeinsam leuchten" height={190} /><Community addPunkte={addPunkte} alias={alias} anon={anon} bindung={bindung} /></>}
              {tab === "fortschritt" && <><MediaBanner video={S2GVID.fortschritt} poster={S2GIMG.fortschritt} title="Mein Fortschritt" subtitle="Du wächst" height={190} /><Fortschritt streak={streak} entries={entries} punkte={punkte} energie={energie} aufgaben={aufgaben} ch369={ch369} checkins={checkins} setCheckins={setCheckins} addPunkte={addPunkte} prefs={prefs} setPrefs={setPrefs} twinTon={twinTon} go={go} /></>}
              {tab === "fragebogen" && <><MediaBanner video={S2GVID.fragebogen} poster={S2GIMG.fragebogen} title="Fragebogen" subtitle="Lerne dich kennen" height={190} /><Fragebogen intake={intake} setIntake={setIntake} addPunkte={addPunkte} /></>}
              {tab === "pakete" && <><MediaBanner video={S2GVID.pakete} poster={S2GIMG.pakete} title="Pakete" subtitle="Wähle dein Geschenk an dich" height={190} /><Pakete addPunkte={addPunkte} go={go} /></>}
              {tab === "office" && <Office office={office} setOffice={setOffice} addPunkte={addPunkte} />}
              {tab === "profil" && <><MediaBanner video={S2GVID.profil} poster={S2GIMG.profil} title="Profil" subtitle="Dein Spiegel" height={190} /><Profil email={user} go={go} alias={alias} setAlias={setAlias} anon={anon} setAnon={setAnon} bindung={bindung} aufBindung={aufBindung} onLogout={() => { if (supabase) supabase.auth.signOut(); setUser(null); setStack([]); setTab("heute"); }} /></>}
              {tab === "coachdash" && <CoachDashboard name={anzeigeName} streak={streak} entries={entries} ch369={ch369} drawn={drawn} horo={horo} energie={energie} aufgaben={aufgaben} checkins={checkins} go={go} />}
              {tab === "coachtwin" && <CoachTwinInterview addPunkte={addPunkte} />}
              {tab === "sessionnotiz" && <SessionIntelligenz addPunkte={addPunkte} />}
              {tab === "wissen" && <WissensSuche addPunkte={addPunkte} />}
              {tab === "schatten" && <Schattenspiegel addPunkte={addPunkte} />}
              {tab === "zukunftsich" && <ZukunftsIch name={anzeigeName} entries={entries} ziele={ziele} archetyp={archetyp} msgs={zkMsgs} setMsgs={setZkMsgs} />}
              {tab === "archetyp" && <ArchetypTest archetyp={archetyp} setArchetyp={setArchetyp} addPunkte={addPunkte} />}
              {tab === "flamme" && <Flamme flamme={flamme} setFlamme={setFlamme} addPunkte={addPunkte} />}
              {tab === "metime" && <MeTime metime={metime} setMetime={setMetime} addPunkte={addPunkte} />}
              {tab === "qigong" && <Qigong qigong={qigong} setQigong={setQigong} addPunkte={addPunkte} />}
              {tab === "achtsamkeit" && <Achtsamkeit achtsam={achtsam} setAchtsam={setAchtsam} addPunkte={addPunkte} />}
              {tab === "dankbarkeit" && <Dankbarkeit dank={dank} setDank={setDank} addPunkte={addPunkte} />}
              {tab === "loslassen" && <Loslassen losgelassen={losgelassen} setLosgelassen={setLosgelassen} addPunkte={addPunkte} />}
              {tab === "kreis" && <FreundinnenKreis kreis={kreis} setKreis={setKreis} streak={streak} addPunkte={addPunkte} />}
              {tab === "mondrituale" && <Mondrituale mondrit={mondrit} setMondrit={setMondrit} addPunkte={addPunkte} />}
              {tab === "intuition" && <Intuition intu={intu} setIntu={setIntu} addPunkte={addPunkte} />}
              {tab === "reisen" && <Reisen reisen={reisen} setReisen={setReisen} addPunkte={addPunkte} />}
              {tab === "jahreskreis" && <Jahreskreis feste={feste} setFeste={setFeste} addPunkte={addPunkte} />}
              {tab === "leere" && <RitualDerLeere leere={leere} setLeere={setLeere} addPunkte={addPunkte} />}
              {tab === "wochenorakel" && <WochenOrakel wo={wo} setWo={setWo} addPunkte={addPunkte} />}
              {tab === "rueckblick" && <Jahresrueckblick entries={entries} qigong={qigong} dank={dank} losgelassen={losgelassen} punkte={punkte} streak={streak} drawn={drawn} reisen={reisen} feste={feste} />}
            </div>

            <nav style={{
              position: "fixed", bottom: 0, left: 0, right: 0, margin: "0 auto", maxWidth: 430,
              background: C.card, borderTop: `1px solid ${C.line}`,
              display: "flex", justifyContent: "space-around", alignItems: "flex-end",
              padding: "8px 4px 14px", zIndex: 10,
            }}>
              {NAV.map((n) => {
                const active = tab === n.k || (n.k === "mehr" && isSub);
                if (n.center)
                  return (
                    <button key={n.k} onClick={() => goRoot(n.k)} style={{
                      background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`,
                      border: "3px solid " + C.card, cursor: "pointer",
                      width: 58, height: 58, borderRadius: "50%", marginTop: -26,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      color: "#fff", animation: "glowPulse 2.6s ease-in-out infinite",
                    }}>
                      <span style={{ fontSize: 22 }}>{n.icon}</span>
                      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, marginTop: 1 }}>{n.t}</span>
                    </button>
                  );
                return (
                  <button key={n.k} onClick={() => goRoot(n.k)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    minWidth: 56, minHeight: 50, padding: "6px 4px",
                    color: active ? C.plum : C.ink, opacity: active ? 1 : 0.7,
                  }}>
                    <span style={{ fontSize: 21 }}>{n.icon}</span>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10.5, fontWeight: active ? 700 : 500, letterSpacing: 0.3 }}>{n.t}</span>
                    {active && <span style={{ width: 16, height: 2.5, borderRadius: 2, background: C.rose }} />}
                  </button>
                );
              })}
            </nav>

            {/* S.O.S. — immer sichtbarer Halt-Button (unten links) */}
            {!sosOpen && (
              <div style={{ position: "fixed", left: 0, right: 0, top: 0, bottom: 0, margin: "0 auto", maxWidth: 430, pointerEvents: "none", zIndex: 21 }}>
                <button onClick={() => setSosOpen(true)} style={{
                  position: "absolute", left: 16, bottom: 96, pointerEvents: "auto",
                  borderRadius: 22, cursor: "pointer", padding: "10px 14px",
                  background: C.card, border: `2px solid ${C.rose}`, color: C.plum,
                  fontFamily: "system-ui, sans-serif", fontSize: 12.5, fontWeight: 700,
                  boxShadow: "0 6px 18px rgba(58,42,34,.18)",
                }}>🤍 Halt</button>
              </div>
            )}
            {sosOpen && <SOSOverlay onClose={() => setSosOpen(false)} entries={entries} setEntries={setEntries} addPunkte={addPunkte} archetyp={archetyp} />}

            {/* ilho — schwebender Chat-Begleiter (unten rechts) */}
            {ilhoAktiv && (
              <div style={{ position: "fixed", left: 0, right: 0, top: 0, bottom: 0, margin: "0 auto", maxWidth: 430, pointerEvents: "none", zIndex: ilhoOpen ? 26 : 22 }}>
                {!ilhoOpen && (
                  <button onClick={() => setIlhoOpen(true)} style={{
                    position: "absolute", right: 16, bottom: 96, pointerEvents: "auto",
                    width: 58, height: 58, borderRadius: "50%", cursor: "pointer",
                    background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, border: "3px solid " + C.card, color: "#fff",
                    boxShadow: "0 8px 24px rgba(217,110,139,.45)", animation: "glowPulse 2.6s ease-in-out infinite",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 21 }}>✨</span>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 8.5, fontWeight: 700 }}>ilho</span>
                  </button>
                )}
                {ilhoOpen && (
                  <>
                    <div onClick={() => setIlhoOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(58,42,34,.35)", backdropFilter: "blur(2px)", pointerEvents: "auto" }} />
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, pointerEvents: "auto", background: C.cream, borderRadius: "22px 22px 0 0", maxHeight: "82vh", overflowY: "auto", boxShadow: "0 -8px 30px rgba(58,42,34,.22)", animation: "fadeUp .3s ease" }}>
                      <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: C.cream, borderBottom: `1px solid ${C.line}` }}>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.espresso }}>✨ ilho · dein Begleiter</div>
                        <button onClick={() => setIlhoOpen(false)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: "50%", width: 34, height: 34, fontSize: 15, cursor: "pointer", color: C.ink }}>✕</button>
                      </div>
                      <Luma name={anzeigeName} energie={energie} msgs={lumaMsgs} setMsgs={setLumaMsgs} twin={twin} twinTon={twinTon} />
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

