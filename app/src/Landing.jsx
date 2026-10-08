// Landing.jsx — smile2go
// Öffentliche Startseite für Besucherinnen ohne Konto (unter "/") und für alle unter "/start".
// Aufbau angelehnt an die Tony-Robbins-AI-Seite: dunkler Hero, Video, Einleitung, Momente,
// Sonnenstrahl, Vorteile, So funktioniert es, Funktionen, Wochen-Karte, App, Einstieg,
// Fragen, Schluss. Farben und Schriften kommen aus der App selbst.
// Inhalte bewusst nur aus echten Funktionen: keine erfundenen Bewertungen, keine Preise.
import { useEffect, useRef, useState } from "react";
import { IMG, KARTEN } from "./media";

const BEGRUESSUNG_VIDEO = "/begruessung_klein.mp4";
const BEGRUESSUNG_POSTER = "/media/img/begruessung.jpg";

const MOMENTE = [
  { wann: "Nachts, wenn das Gedankenkarussell nicht anhält", was: "ilho atmet mit dir. Zwei Minuten, bis du wieder bei dir ankommst." },
  { wann: "Vor einer Entscheidung, bei der du dich im Kreis drehst", was: "ilho fragt nach, bis du klarer siehst, was du wirklich willst." },
  { wann: "Am Morgen, bevor der Tag dich übernimmt", was: "Deine Tageskarte und ein Sonnenstrahl geben dir eine Richtung für heute." },
  { wann: "Nach einem Streit, der noch nachhallt", was: "Im Journal darfst du alles aufschreiben. Nur du entscheidest, was du teilst." },
  { wann: "Wenn du dranbleiben willst", was: "Challenges, Ziele und Lichtpunkte zeigen dir, wie weit du schon gekommen bist." },
  { wann: "Zwischen zwei Coaching-Terminen", was: "Schreib deiner Coachin direkt in der App oder buch deinen nächsten Termin." },
];

const VORTEILE = [
  { icon: "💬", t: "Persönliche Antworten", s: "ilho geht auf deine Situation ein, mit Fragen, die weiterführen, statt mit Floskeln." },
  { icon: "🌙", t: "Rund um die Uhr da", s: "Kein Termin, kein Warten. Impulse und nächste Schritte genau in dem Moment, in dem es zählt." },
  { icon: "🌸", t: "Aus echter Praxis", s: "Rituale, Übungen und Kurse aus der Arbeit von Coachinnen, die Frauen begleiten." },
  { icon: "🎙️", t: "Im Ton deiner Coachin", s: "Bist du mit deiner Coachin verbunden, spricht ilho in ihrem Ton: zugewandt und auf Augenhöhe." },
  { icon: "🌱", t: "Wächst mit dir", s: "Journal, Lichtpunkte und dein Wochenbericht zeigen dir, was sich verändert." },
  { icon: "📱", t: "Überall dabei", s: "Auf dem Handy, am Laptop und sogar ohne Netz, wenn der Empfang mal weg ist." },
];

const SCHRITTE = [
  { t: "Zur Ruhe kommen", s: "mit Atemritualen, Meditationen und Körperreisen, die dich in wenigen Minuten bei dir ankommen lassen." },
  { t: "Klarheit finden", s: "ilho stellt Fragen, die Gedankenkreise sichtbar machen und neue Blickwinkel öffnen." },
  { t: "Den einen Schritt gehen", s: "jeden Tag ein konkreter Schritt statt großer Vorsätze." },
  { t: "Dein Warum spüren", s: "Ziele mit dem verbinden, was dir wirklich wichtig ist." },
  { t: "Dranbleiben", s: "deine Serie, Lichtpunkte und dein Wochenbericht halten dich in Bewegung, auf Wunsch gemeinsam mit deiner Coachin." },
];

const FUNKTIONEN = [
  { bild: IMG.orakel, t: "Orakel & Tageskarte", s: "44 Göttinnen-Karten mit persönlicher Deutung." },
  { bild: IMG.meditation, t: "Meditation & Körperreise", s: "Geführte Ruhemomente zum Anhören." },
  { bild: IMG.podcast, t: "Podcast & Mediathek", s: "Impulse zum Hören, wann immer du magst." },
  { bild: IMG.lichtpunkte, t: "Challenges & Lichtpunkte", s: "Kleine Erfolge sichtbar machen und feiern." },
];

const WOCHEN_KARTEN = [
  { bild: KARTEN["Freya"], name: "Freya" },
  { bild: KARTEN["Die Göttin der lebendigen Schöpfung"], name: "Die Göttin der lebendigen Schöpfung" },
  { bild: KARTEN["Lakshmi"], name: "Lakshmi" },
];

const ENTHALTEN = [
  "ilho, dein KI-Begleiter",
  "Tageskarte, Orakel und Sonnenstrahlen",
  "Journal, Rituale und Meditationen",
  "Challenges, Ziele und Lichtpunkte",
  "Nachrichten und Termine mit deiner Coachin",
  "Auf allen Geräten, auch ohne Netz",
];

const FRAGEN = [
  {
    f: "Was ist ilho?",
    a: "ilho ist dein KI-Begleiter in smile2go. ilho hört zu, stellt Fragen und schlägt dir kleine nächste Schritte vor, zu jeder Tageszeit. ilho ist eine künstliche Intelligenz, kein Mensch, und in der App immer klar als KI gekennzeichnet.",
  },
  {
    f: "Ersetzt ilho eine Coachin oder eine Therapie?",
    a: "Nein. ilho begleitet dich im Alltag und zwischen deinen Terminen. Tiefe Prozesse gehören zu deiner Coachin und in einer Krise zu Fachleuten. Über den Halt-Knopf in der App findest du jederzeit sofort Hilfe, zum Beispiel die Telefonseelsorge unter 0800 111 0 111, kostenlos und rund um die Uhr.",
  },
  {
    f: "Was passiert mit meinen Daten?",
    a: "Deine Daten werden in der EU gespeichert. In deinem Profil kannst du sie jederzeit exportieren oder dein Konto vollständig löschen. Auf Wunsch schützt du dein Konto zusätzlich mit einer Zwei-Faktor-Anmeldung.",
  },
  {
    f: "Brauche ich eine Coachin, um smile2go zu nutzen?",
    a: "Nein, du kannst sofort loslegen. Hast du eine Coachin, verbindest du dich mit ihrem Einladungscode. Dann laufen Nachrichten, Termine und Material direkt über die App.",
  },
  {
    f: "Was kostet smile2go?",
    a: "Die Registrierung ist kostenlos und du brauchst keine Zahlungsdaten.",
  },
  {
    f: "Wie bekomme ich smile2go auf mein Handy?",
    a: "smile2go läuft direkt im Browser. Öffne die Seite auf deinem Handy und wähle im Browser-Menü „Zum Home-Bildschirm“. Dann startet smile2go wie eine App, sogar ohne Netz.",
  },
  {
    f: "Ich bin Coachin. Ist smile2go auch etwas für mich?",
    a: "Ja. Bei der Registrierung wählst du „Ich bin Coachin“ und bekommst zusätzlich deinen Coach-Bereich mit Klientinnen, Nachrichten, Terminen und Material.",
    coach: true,
  },
];

const Pfeil = ({ links }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={links ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Haken = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#F8DCE3" />
    <path d="M7.5 12.4l3 3 6-6.4" fill="none" stroke="#8E4A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Logo = () => (
  <span className="lp-logo">smile<span>2</span>go</span>
);

export default function Landing({ onStart, angemeldet = false, rechtsSeite }) {
  const [atmet, setAtmet] = useState(false);
  const [phase, setPhase] = useState("einatmen");
  const [videoAn, setVideoAn] = useState(false);
  const [recht, setRecht] = useState(null);
  const momenteRef = useRef(null);

  // Atem-Orb: 8 Sekunden pro Atemzug, 4 ein, 4 aus — synchron zur CSS-Animation.
  useEffect(() => {
    if (!atmet) return;
    setPhase("einatmen");
    const id = setInterval(() => setPhase((p) => (p === "einatmen" ? "ausatmen" : "einatmen")), 4000);
    return () => clearInterval(id);
  }, [atmet]);

  // Rechtliches als Overlay: Escape schließt, Seite dahinter scrollt nicht mit.
  useEffect(() => {
    if (!recht) return;
    const esc = (e) => { if (e.key === "Escape") setRecht(null); };
    window.addEventListener("keydown", esc);
    const vorher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = vorher; };
  }, [recht]);

  const blaettern = (richtung) => {
    const band = momenteRef.current;
    if (!band) return;
    const karte = band.querySelector(".lp-moment");
    const schritt = karte ? karte.getBoundingClientRect().width + 16 : band.clientWidth * 0.8;
    band.scrollBy({ left: richtung * schritt, behavior: "smooth" });
  };

  const registrieren = () => onStart("register", "klientin");
  const anmelden = () => onStart("login", "klientin");
  const alsCoachin = () => onStart("register", "coach");

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* ── Kopf ── */}
      <header className="lp-kopf">
        <div className="lp-wrap lp-kopf-in">
          <Logo />
          <div className="lp-kopf-btns">
            {angemeldet ? (
              <button className="lp-btn lp-btn-klein" onClick={anmelden}>Zur App</button>
            ) : (
              <>
                <button className="lp-btn lp-btn-klein lp-btn-geist" onClick={anmelden}>Anmelden</button>
                <button className="lp-btn lp-btn-klein lp-nur-breit" onClick={registrieren}>Kostenlos starten</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-orb-zone">
            <button
              className={"lp-orb" + (atmet ? " atmet" : "")}
              onClick={() => setAtmet((a) => !a)}
              aria-pressed={atmet}
              aria-label={atmet ? "Atemübung beenden" : "Mit ilho atmen"}
            >
              <span className="lp-orb-name">ilho</span>
              <span className="lp-orb-hinweis" aria-live="polite">{atmet ? phase : "atme mit"}</span>
            </button>
          </div>
          <h1 className="lp-h1">
            <span className="lp-zeile">Frag ilho, was dich bewegt.</span>
            <span className="lp-zeile">Auch nachts um drei.</span>
          </h1>
          <p className="lp-lead">
            ilho ist dein KI-Begleiter in smile2go. ilho hört zu, stellt die richtigen Fragen und zeigt dir den
            nächsten kleinen Schritt. Dazu kommen Tageskarte, Rituale, Journal und echte Coachinnen, alles in einer App.
          </p>
          <div className="lp-cta-reihe">
            <button className="lp-btn" onClick={registrieren}>{angemeldet ? "Zur App" : "Kostenlos starten"}</button>
            {!angemeldet && <button className="lp-text" onClick={anmelden}>Ich habe schon ein Konto</button>}
          </div>
          <p className="lp-beruhigt">Kostenlos und ohne Zahlungsdaten. ilho ist immer klar als KI gekennzeichnet.</p>
        </div>
      </section>

      {/* ── Video ── */}
      <section className="lp-sek lp-dunkel2">
        <div className="lp-wrap lp-split lp-split-mitte">
          <div className="lp-video-text">
            <h2 className="lp-h2">Schön, dass du da bist</h2>
            <p className="lp-lead">
              Anja begrüßt dich persönlich. Nimm dir einen Moment, mach es dir gemütlich und lern uns kennen.
            </p>
          </div>
          <div className="lp-video-rahmen">
            {videoAn ? (
              <video src={BEGRUESSUNG_VIDEO} poster={BEGRUESSUNG_POSTER} controls autoPlay playsInline>
                Dein Browser kann das Video nicht abspielen.
              </video>
            ) : (
              <>
                <img src={BEGRUESSUNG_POSTER} alt="" width="576" height="1024" loading="lazy" decoding="async" />
                <button className="lp-play" onClick={() => setVideoAn(true)}>
                  <span className="lp-play-kreis" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
                  </span>
                  <span>Begrüßung ansehen</span>
                  <span className="lp-play-dauer">Video, 12 Minuten</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Einleitung ── */}
      <section className="lp-sek">
        <div className="lp-schmal lp-mitte">
          <h2 className="lp-h2">Begleitung, die in deine Tasche passt</h2>
          <div className="lp-absaetze">
            <p className="lp-lead">
              Die wichtigsten Gedanken kommen selten im Coaching-Termin. Sie kommen nachts, im Zug oder nach einem
              schwierigen Gespräch.
            </p>
            <p className="lp-lead">
              Genau dafür gibt es smile2go. ilho hört zu und hilft dir, Ordnung in deine Gedanken zu bringen. Die
              Tageskarte schenkt dir einen Impuls, das Journal hält fest, was dich bewegt, und kleine Rituale bringen
              dich zurück zu dir.
            </p>
            <p className="lp-lead">
              Und wenn du mehr brauchst als einen Impuls, ist deine Coachin nur eine Nachricht entfernt, mit Chat,
              Terminen und Material direkt in der App.
            </p>
          </div>
        </div>
      </section>

      {/* ── Momente ── */}
      <section className="lp-sek lp-sand">
        <div className="lp-wrap">
          <div className="lp-kopfzeile">
            <h2 className="lp-h2">Für die Momente dazwischen</h2>
            <div className="lp-pfeile">
              <button className="lp-pfeil" onClick={() => blaettern(-1)} aria-label="Zurück blättern"><Pfeil links /></button>
              <button className="lp-pfeil" onClick={() => blaettern(1)} aria-label="Weiter blättern"><Pfeil /></button>
            </div>
          </div>
          <div className="lp-band" ref={momenteRef}>
            {MOMENTE.map((m) => (
              <article className="lp-moment" key={m.wann}>
                <h3 className="lp-moment-wann">{m.wann}</h3>
                <p className="lp-moment-was">{m.was}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sonnenstrahl ── */}
      <section className="lp-strahl">
        <figure className="lp-schmal">
          <blockquote className="lp-strahl-text">„Ich muss nicht den ganzen Weg kennen. Mein nächster wahrer Schritt genügt.“</blockquote>
          <figcaption className="lp-strahl-quelle">Ein Sonnenstrahl aus der smile2go-App</figcaption>
        </figure>
      </section>

      {/* ── Vorteile ── */}
      <section className="lp-sek">
        <div className="lp-wrap">
          <h2 className="lp-h2 lp-mitte">Deine Fragen. Deine Ziele. Kein Warten.</h2>
          <div className="lp-vorteile">
            {VORTEILE.map((v) => (
              <div className="lp-vorteil" key={v.t}>
                <div className="lp-vorteil-icon" aria-hidden="true">{v.icon}</div>
                <h3 className="lp-h3">{v.t}</h3>
                <p>{v.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── So funktioniert es ── */}
      <section className="lp-sek lp-dunkel">
        <div className="lp-wrap lp-split">
          <div>
            <h2 className="lp-h2">Kleine Schritte. Echte Veränderung.</h2>
            <p className="lp-lead lp-abstand">
              smile2go verbindet bewährte Werkzeuge aus dem Coaching mit einer KI, die zuhört. So kommst du in Bewegung:
            </p>
            <p className="lp-schluss">Kein Ratgeber zum Durchlesen, sondern Begleitung für jeden Tag.</p>
          </div>
          <ul className="lp-liste">
            {SCHRITTE.map((s) => (
              <li key={s.t}><strong>{s.t}:</strong> {s.s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Funktionen ── */}
      <section className="lp-sek lp-sand">
        <div className="lp-wrap">
          <h2 className="lp-h2">Mehr als ein Chat</h2>
          <p className="lp-lead lp-abstand">Über 25 Funktionen begleiten dich durch den Tag. Vier davon:</p>
          <div className="lp-kacheln">
            {FUNKTIONEN.map((f) => (
              <article className="lp-kachel" key={f.t}>
                <img src={f.bild} alt="" loading="lazy" decoding="async" />
                <div className="lp-kachel-text">
                  <h3 className="lp-h3">{f.t}</h3>
                  <p>{f.s}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wochen-Karte ── */}
      <section className="lp-sek">
        <div className="lp-wrap lp-split lp-split-mitte">
          <div>
            <p className="lp-kicker">Jede Woche neu</p>
            <h2 className="lp-h2">Deine Karte für die Woche</h2>
            <p className="lp-lead lp-abstand">
              Jede Woche ziehst du eine Karte aus dem Göttinnen-Deck mit 44 Karten. ilho deutet sie für dich, und ein
              Ritual und eine Challenge begleiten dich durch die kommenden Tage.
            </p>
            <button className="lp-btn lp-abstand-gross" onClick={registrieren}>Erste Karte ziehen</button>
          </div>
          <div className="lp-faecher">
            {WOCHEN_KARTEN.map((k) => (
              <img key={k.name} src={k.bild} alt={`Orakelkarte ${k.name}`} width="1024" height="1372" loading="lazy" decoding="async" />
            ))}
          </div>
        </div>
      </section>

      {/* ── App ── */}
      <section className="lp-sek lp-sand">
        <div className="lp-wrap lp-split lp-split-mitte">
          <div>
            <h2 className="lp-h2">Starte heute mit smile2go</h2>
            <p className="lp-lead lp-abstand">
              Registrieren, Tageskarte ziehen und ilho deine erste Frage stellen. Das dauert keine zwei Minuten.
            </p>
            <button className="lp-btn lp-abstand-gross" onClick={registrieren}>{angemeldet ? "Zur App" : "Kostenlos starten"}</button>
            <p className="lp-tipp">
              Tipp: Wähle in deinem Browser „Zum Home-Bildschirm“, dann liegt smile2go wie eine App auf deinem Handy.
            </p>
          </div>
          <div>
            <div className="lp-telefon">
              <div className="lp-telefon-schirm">
                <div className="lp-telefon-kopf">
                  <span className="lp-ilho-punkt" aria-hidden="true" />
                  <div>
                    <div className="lp-telefon-name">ilho</div>
                    <div className="lp-telefon-unter">Dein KI-Begleiter</div>
                  </div>
                </div>
                <p className="lp-blase lp-blase-ich">Ich muss morgen etwas entscheiden und dreh mich im Kreis.</p>
                <p className="lp-blase lp-blase-ilho">Danke, dass du das teilst. Lass uns kurz ankommen: Was wäre für dich ein gutes Ergebnis? Nicht das perfekte, ein gutes.</p>
                <p className="lp-blase lp-blase-ich">Dass ich danach ruhig schlafen kann.</p>
                <p className="lp-blase lp-blase-ilho">Dann schauen wir, welche Möglichkeit dir genau diese Ruhe gibt.</p>
              </div>
            </div>
            <p className="lp-beispiel">So kann ein Gespräch mit ilho aussehen.</p>
          </div>
        </div>
      </section>

      {/* ── Einstieg ── */}
      <section className="lp-sek lp-dunkel2">
        <div className="lp-wrap lp-mitte">
          <h2 className="lp-h2">Klarheit und Ruhe, wann immer du sie brauchst</h2>
          <div className="lp-angebot">
            <div className="lp-angebot-titel">Kostenlos starten</div>
            <p className="lp-angebot-unter">Ohne Zahlungsdaten. Du kannst dein Konto jederzeit löschen.</p>
            <ul className="lp-haken">
              {ENTHALTEN.map((e) => (
                <li key={e}><Haken />{e}</li>
              ))}
            </ul>
            <button className="lp-btn lp-btn-voll" onClick={registrieren}>{angemeldet ? "Zur App" : "Jetzt kostenlos registrieren"}</button>
          </div>
        </div>
      </section>

      {/* ── Fragen ── */}
      <section className="lp-sek">
        <div className="lp-schmal">
          <h2 className="lp-h2 lp-mitte">Gut zu wissen</h2>
          <div className="lp-faq">
            {FRAGEN.map((q) => (
              <details key={q.f}>
                <summary>{q.f}</summary>
                <div className="lp-faq-antwort">
                  <p>{q.a}</p>
                  {q.coach && !angemeldet && (
                    <button className="lp-text lp-text-gold" onClick={alsCoachin}>Als Coachin registrieren</button>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Schluss ── */}
      <section className="lp-schlussbild">
        <div className="lp-wrap">
          <h2 className="lp-h1 lp-h1-schluss">Deine Ruhe. Dein Wachstum. Jederzeit.</h2>
          <div className="lp-cta-reihe">
            <button className="lp-btn" onClick={registrieren}>{angemeldet ? "Zur App" : "Kostenlos starten"}</button>
          </div>
        </div>
      </section>

      {/* ── Fuß ── */}
      <footer className="lp-fuss">
        <div className="lp-wrap lp-fuss-in">
          <div>
            <Logo />
            <p className="lp-fuss-zeile">Dein Raum für Ruhe & Wachstum aus München.</p>
          </div>
          <nav className="lp-fuss-links" aria-label="Weitere Links">
            {!angemeldet && <button className="lp-link" onClick={anmelden}>Anmelden</button>}
            {!angemeldet && <button className="lp-link" onClick={alsCoachin}>Als Coachin registrieren</button>}
            <button className="lp-link" onClick={() => setRecht("impressum")}>Impressum</button>
            <button className="lp-link" onClick={() => setRecht("datenschutz")}>Datenschutz</button>
          </nav>
        </div>
        <div className="lp-wrap lp-fuss-copy">© {new Date().getFullYear()} smile2go</div>
      </footer>

      {recht && rechtsSeite && (
        <div className="lp-modal" role="dialog" aria-modal="true" aria-label={recht === "impressum" ? "Impressum" : "Datenschutzerklärung"} onClick={() => setRecht(null)}>
          <div className="lp-modal-karte" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-zu">
              <button className="lp-btn lp-btn-klein lp-btn-hell" onClick={() => setRecht(null)} autoFocus>Schließen</button>
            </div>
            {rechtsSeite(recht)}
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
.lp {
  --nacht: #22150F; --nacht2: #2C1B15; --pflaume: #8E4A63;
  --creme: #FBF6EE; --sand: #F5E9DB; --karte: #FFFFFE; --linie: #EBD8C6;
  --gold: #C9963C; --goldhell: #E6BE6C; --rose: #D96E8B; --rosehell: #F8DCE3;
  --espresso: #3A2A22; --tinte: #6B5443; --hell: #F7EEE5; --hellgedimmt: #D2BFB1;
  min-height: 100vh; background: var(--creme); color: var(--espresso);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 16px; line-height: 1.65;
  -webkit-font-smoothing: antialiased; overflow-x: hidden;
}
.lp *, .lp *::before, .lp *::after { box-sizing: border-box; }
/* Grundwerte ohne Spezifität (:where), damit Klassen wie .lp-abstand sie überschreiben können. */
:where(.lp) h1, :where(.lp) h2, :where(.lp) h3 { font-family: Georgia, "Times New Roman", serif; font-weight: 400; margin: 0; }
:where(.lp) p, :where(.lp) figure, :where(.lp) blockquote { margin: 0; }
.lp-wrap { max-width: 1080px; margin: 0 auto; padding: 0 20px; }
.lp-schmal { max-width: 700px; margin: 0 auto; padding: 0 20px; }
.lp-sek { padding: 80px 0; }
.lp-dunkel { background: var(--nacht); color: var(--hell); }
.lp-dunkel2 { background: var(--nacht2); color: var(--hell); }
.lp-sand { background: var(--sand); }
.lp-mitte { text-align: center; }
.lp-h2 { font-size: clamp(1.85rem, 4.4vw, 2.75rem); line-height: 1.15; letter-spacing: -0.01em; text-wrap: balance; }
.lp-h3 { font-size: 1.28rem; line-height: 1.3; }
.lp-lead { font-size: 1.08rem; line-height: 1.75; color: var(--tinte); max-width: 38rem; }
.lp-h2 + .lp-lead { margin-top: 16px; }
.lp-mitte .lp-lead { margin-left: auto; margin-right: auto; }
.lp-dunkel .lp-lead, .lp-dunkel2 .lp-lead { color: var(--hellgedimmt); }
.lp-abstand { margin-top: 18px; }
.lp-abstand-gross { margin-top: 30px; }
.lp-absaetze { display: grid; gap: 18px; margin-top: 26px; }
.lp-kicker { font-size: 1rem; font-weight: 600; color: var(--gold); margin-bottom: 10px; }

.lp-btn {
  display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 0 30px;
  border: 0; border-radius: 999px; cursor: pointer; text-decoration: none;
  font: 600 1rem/1.2 system-ui, -apple-system, sans-serif; color: #fff;
  background: linear-gradient(135deg, var(--gold), var(--rose));
  box-shadow: 0 8px 26px rgba(217,110,139,.35); transition: transform .15s ease, box-shadow .15s ease;
}
.lp-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(217,110,139,.45); }
.lp-btn-klein { min-height: 40px; padding: 0 18px; font-size: .92rem; box-shadow: none; }
.lp-btn-geist { background: transparent; border: 1px solid rgba(247,238,229,.4); color: var(--hell); }
.lp-btn-geist:hover { box-shadow: none; border-color: var(--goldhell); }
.lp-btn-hell { background: var(--sand); color: var(--espresso); }
.lp-btn-voll { width: 100%; }
.lp-text {
  background: none; border: 0; padding: 12px 6px; cursor: pointer; color: inherit;
  font: 600 1rem system-ui, -apple-system, sans-serif;
  text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px;
}
.lp-text-gold { color: var(--pflaume); padding: 10px 0 0; }
.lp button:focus-visible, .lp summary:focus-visible { outline: 3px solid var(--goldhell); outline-offset: 3px; }

/* Kopf */
.lp-kopf { position: absolute; top: 0; left: 0; right: 0; z-index: 5; }
.lp-kopf-in { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.lp-logo { font-family: Georgia, serif; font-size: 1.55rem; letter-spacing: .5px; color: var(--hell); }
.lp-logo span { color: var(--rose); font-style: italic; }
.lp-kopf-btns { display: flex; gap: 10px; align-items: center; }

/* Hero */
.lp-hero {
  position: relative; text-align: center; color: var(--hell); padding: 118px 0 92px;
  background: radial-gradient(120% 80% at 50% 16%, #5A2B40 0%, #35201A 46%, var(--nacht) 100%);
}
.lp-orb-zone { position: relative; width: 224px; height: 224px; margin: 0 auto 34px; display: grid; place-items: center; }
.lp-orb-zone::before, .lp-orb-zone::after { content: ""; position: absolute; border-radius: 50%; border: 1px solid rgba(230,190,108,.26); }
.lp-orb-zone::before { inset: 0; }
.lp-orb-zone::after { inset: 28px; border-color: rgba(230,190,108,.16); }
.lp-orb {
  position: relative; z-index: 1; width: 134px; height: 134px; border-radius: 50%; border: 0; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: #4A3410;
  background: radial-gradient(circle at 38% 32%, #F8E0A0 0%, #E2B45C 50%, #B98030 100%);
  box-shadow: 0 0 60px rgba(230,190,108,.55), 0 0 150px rgba(217,110,139,.38);
  animation: lp-schweben 6s ease-in-out infinite;
}
.lp-orb.atmet { animation: lp-atmen 8s ease-in-out infinite; }
.lp-orb-name { font-family: Georgia, serif; font-size: 1.5rem; line-height: 1; }
.lp-orb-hinweis { font-size: .8rem; font-weight: 600; opacity: .85; }
@keyframes lp-schweben { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes lp-atmen { 0%, 100% { transform: scale(.86); } 50% { transform: scale(1.14); } }
.lp-h1 { font-size: clamp(2.3rem, 6.4vw, 4.1rem); line-height: 1.08; letter-spacing: -0.02em; }
.lp-zeile { display: block; text-wrap: balance; }
.lp-hero .lp-lead { margin: 24px auto 0; font-size: 1.12rem; color: var(--hellgedimmt); }
.lp-cta-reihe { display: flex; flex-wrap: wrap; gap: 8px 18px; justify-content: center; align-items: center; margin-top: 34px; }
.lp-beruhigt { margin-top: 20px; font-size: .92rem; color: #BBA597; }

/* Zwei Spalten */
.lp-split { display: grid; gap: 44px; align-items: start; }

/* Video */
.lp-video-text { text-align: center; }
.lp-video-rahmen {
  position: relative; width: min(100%, 360px); margin: 0 auto; aspect-ratio: 9 / 16;
  border-radius: 28px; overflow: hidden; background: #1A100C; box-shadow: 0 30px 80px rgba(0,0,0,.45);
}
.lp-video-rahmen img, .lp-video-rahmen video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.lp-play {
  position: absolute; inset: 0; border: 0; cursor: pointer; color: #fff;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; padding-bottom: 34px;
  background: linear-gradient(180deg, rgba(20,12,9,0) 42%, rgba(20,12,9,.78) 100%);
  font: 600 1.02rem system-ui, -apple-system, sans-serif;
}
.lp-play-kreis {
  width: 74px; height: 74px; margin-bottom: 8px; border-radius: 50%; display: grid; place-items: center;
  background: var(--creme); color: var(--rose); box-shadow: 0 8px 30px rgba(0,0,0,.35); padding-left: 4px;
}
.lp-play-dauer { font-weight: 400; font-size: .88rem; opacity: .85; }

/* Momente */
.lp-kopfzeile { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 34px; }
.lp-pfeile { display: flex; gap: 10px; flex-shrink: 0; }
.lp-pfeil {
  width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--linie); background: var(--karte);
  color: var(--espresso); display: grid; place-items: center; cursor: pointer;
}
.lp-pfeil:hover { border-color: var(--gold); }
.lp-band {
  display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 20px;
  padding: 4px 20px 24px; margin: 0 -20px; scrollbar-width: none;
}
.lp-band::-webkit-scrollbar { display: none; }
.lp-moment {
  flex: 0 0 min(82%, 330px); scroll-snap-align: start; min-height: 240px; gap: 22px;
  display: flex; flex-direction: column; background: var(--karte); border-radius: 24px; padding: 30px 26px 26px;
  box-shadow: 0 10px 30px rgba(58,42,34,.07);
}
.lp-moment-wann { font-size: 1.32rem; line-height: 1.32; color: var(--espresso); }
.lp-moment-was { margin-top: auto; padding-top: 18px; border-top: 1px solid var(--linie); color: var(--tinte); line-height: 1.6; }

/* Sonnenstrahl */
.lp-strahl { background: linear-gradient(120deg, var(--gold) 0%, var(--rose) 100%); color: #fff; text-align: center; padding: 84px 0; }
.lp-strahl-text { font-family: Georgia, serif; font-size: clamp(1.6rem, 3.8vw, 2.4rem); line-height: 1.3; max-width: 30ch; margin: 0 auto; text-wrap: balance; }
.lp-strahl-quelle { margin-top: 18px; font-size: .98rem; opacity: .92; }

/* Vorteile */
.lp-vorteile { display: grid; grid-template-columns: 1fr; gap: 40px 48px; margin-top: 56px; }
.lp-vorteil-icon { width: 54px; height: 54px; border-radius: 50%; background: var(--rosehell); display: grid; place-items: center; font-size: 1.5rem; margin-bottom: 16px; }
.lp-vorteil .lp-h3 { margin-bottom: 8px; }
.lp-vorteil p { color: var(--tinte); line-height: 1.65; }

/* So funktioniert es */
.lp-liste { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.lp-liste li {
  padding: 20px 22px; border-radius: 18px; line-height: 1.6; color: var(--hellgedimmt);
  background: rgba(255,255,255,.04); border: 1px solid rgba(230,190,108,.18);
}
.lp-liste strong { color: var(--hell); font-weight: 600; }
.lp-schluss { margin-top: 28px; font-family: Georgia, serif; font-size: 1.25rem; line-height: 1.4; color: var(--goldhell); max-width: 28ch; text-wrap: balance; }

/* Funktionen */
.lp-kacheln {
  display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 20px;
  padding: 4px 20px 20px; margin: 36px -20px 0; scrollbar-width: none;
}
.lp-kacheln::-webkit-scrollbar { display: none; }
.lp-kachel {
  position: relative; flex: 0 0 min(72%, 270px); scroll-snap-align: start; aspect-ratio: 3 / 4;
  border-radius: 22px; overflow: hidden; background: var(--linie);
}
.lp-kachel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.lp-kachel-text {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 70px 20px 20px; color: #fff;
  background: linear-gradient(180deg, rgba(34,21,15,0) 0%, rgba(34,21,15,.85) 100%);
}
.lp-kachel-text .lp-h3 { font-size: 1.18rem; margin-bottom: 4px; }
.lp-kachel-text p { font-size: .92rem; line-height: 1.5; opacity: .92; }

/* Wochen-Karte */
.lp-faecher { position: relative; height: 330px; display: flex; justify-content: center; align-items: center; }
.lp-faecher img {
  position: absolute; width: 138px; height: auto; aspect-ratio: 1024 / 1372; object-fit: cover;
  border-radius: 12px; border: 3px solid #fff; box-shadow: 0 22px 50px rgba(58,42,34,.28);
}
.lp-faecher img:nth-child(1) { transform: translateX(-92px) rotate(-11deg); }
.lp-faecher img:nth-child(2) { z-index: 2; width: 156px; transform: translateY(-12px); }
.lp-faecher img:nth-child(3) { transform: translateX(92px) rotate(11deg); }

/* App */
.lp-telefon {
  width: min(100%, 320px); margin: 0 auto; padding: 12px; border-radius: 44px;
  background: var(--nacht); box-shadow: 0 30px 70px rgba(58,42,34,.28);
}
.lp-telefon-schirm {
  min-height: 460px; border-radius: 34px; background: var(--creme); padding: 22px 16px 26px;
  display: flex; flex-direction: column; gap: 12px;
}
.lp-telefon-kopf { display: flex; align-items: center; gap: 10px; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 1px solid var(--linie); }
.lp-ilho-punkt {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: radial-gradient(circle at 38% 32%, #F8E0A0, #D9A94E 60%, #B98030);
  box-shadow: 0 0 14px rgba(230,190,108,.6);
}
.lp-telefon-name { font-family: Georgia, serif; font-size: 1.05rem; line-height: 1.2; }
.lp-telefon-unter { font-size: .8rem; color: var(--tinte); }
.lp-blase { max-width: 86%; padding: 11px 14px; border-radius: 18px; font-size: .93rem; line-height: 1.5; }
.lp-blase-ich { align-self: flex-end; color: #fff; background: linear-gradient(135deg, var(--gold), var(--rose)); border-bottom-right-radius: 6px; }
.lp-blase-ilho { align-self: flex-start; background: var(--karte); border: 1px solid var(--linie); border-bottom-left-radius: 6px; }
.lp-beispiel { margin-top: 14px; text-align: center; font-size: .88rem; color: var(--tinte); }
.lp-tipp { margin-top: 22px; font-size: .95rem; line-height: 1.6; color: var(--tinte); max-width: 34rem; }

/* Einstieg */
.lp-angebot {
  max-width: 460px; margin: 48px auto 0; padding: 40px 30px 32px; border-radius: 30px; text-align: left;
  background: var(--creme); color: var(--espresso);
  box-shadow: 0 0 0 1px rgba(230,190,108,.55), 0 0 70px rgba(217,110,139,.32);
}
.lp-angebot-titel { font-family: Georgia, serif; font-size: 2.15rem; line-height: 1.1; }
.lp-angebot-unter { margin-top: 8px; color: var(--tinte); }
.lp-haken { list-style: none; margin: 24px 0 30px; padding: 0; }
.lp-haken li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid var(--linie); line-height: 1.5; }
.lp-haken svg { flex-shrink: 0; margin-top: 1px; }

/* Fragen */
.lp-faq { margin-top: 40px; border-top: 1px solid var(--linie); }
.lp-faq details { border-bottom: 1px solid var(--linie); }
.lp-faq summary {
  list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding: 22px 0; font-family: Georgia, serif; font-size: 1.18rem; line-height: 1.35; color: var(--espresso);
}
.lp-faq summary::-webkit-details-marker { display: none; }
.lp-faq summary::after {
  content: "+"; flex-shrink: 0; font: 400 1.7rem/1 system-ui, sans-serif; color: var(--gold); transition: transform .2s ease;
}
.lp-faq details[open] summary::after { transform: rotate(45deg); }
.lp-faq-antwort { padding: 0 0 24px; color: var(--tinte); line-height: 1.75; }

/* Schluss */
.lp-schlussbild {
  text-align: center; color: var(--hell); padding: 104px 0;
  background: radial-gradient(110% 95% at 50% 100%, #6A3049 0%, #35201A 55%, var(--nacht) 100%);
}
.lp-h1-schluss { max-width: 15ch; margin: 0 auto; text-wrap: balance; }

/* Fuß */
.lp-fuss { background: #170E0A; color: #B9A395; padding: 44px 0 40px; font-size: .94rem; }
.lp-fuss-in { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 24px; align-items: flex-start; }
.lp-fuss-zeile { margin-top: 8px; }
.lp-fuss-links { display: flex; flex-wrap: wrap; gap: 4px 22px; }
.lp-link { background: none; border: 0; padding: 8px 0; color: inherit; font: inherit; cursor: pointer; }
.lp-link:hover { color: var(--goldhell); }
.lp-fuss-copy { margin-top: 28px; font-size: .85rem; opacity: .7; }

/* Rechtliches */
.lp-modal { position: fixed; inset: 0; z-index: 50; background: rgba(23,14,10,.62); display: flex; justify-content: center; align-items: flex-end; }
.lp-modal-karte { position: relative; width: 100%; max-width: 640px; max-height: 88vh; overflow-y: auto; background: var(--creme); border-radius: 24px 24px 0 0; }
.lp-modal-zu { position: sticky; top: 0; z-index: 1; display: flex; justify-content: flex-end; padding: 14px 14px 4px; background: linear-gradient(var(--creme) 75%, rgba(251,246,238,0)); }

@media (min-width: 640px) {
  .lp-vorteile { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 520px) {
  .lp-nur-breit { display: none; }
}
@media (min-width: 700px) {
  .lp-modal { align-items: center; padding: 24px; }
  .lp-modal-karte { border-radius: 24px; }
}
@media (min-width: 900px) {
  .lp-sek { padding: 112px 0; }
  .lp-hero { padding: 150px 0 120px; }
  .lp-split { grid-template-columns: 1fr 1fr; gap: 72px; }
  .lp-split-mitte { align-items: center; }
  .lp-video-text { text-align: left; }
  .lp-vorteile { grid-template-columns: repeat(3, 1fr); }
  .lp-kacheln { display: grid; grid-template-columns: repeat(4, 1fr); overflow: visible; padding: 0; margin: 48px 0 0; }
  .lp-faecher { height: 430px; }
  .lp-faecher img { width: 196px; }
  .lp-faecher img:nth-child(1) { transform: translateX(-136px) rotate(-11deg); }
  .lp-faecher img:nth-child(2) { width: 220px; transform: translateY(-14px); }
  .lp-faecher img:nth-child(3) { transform: translateX(136px) rotate(11deg); }
}
@media (prefers-reduced-motion: reduce) {
  .lp *, .lp *::before, .lp *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
`;
