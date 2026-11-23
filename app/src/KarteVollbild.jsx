// KarteVollbild.jsx — smile2go
// Tageskarte im Vollbild.
//
// modus="zieh":   Beim Ziehen öffnet sich sofort die dunkle Bühne, die Karte
//                 erscheint als Rücken, dreht sich mehrmals um sich selbst,
//                 landet mit der Vorderseite und wächst dann über den ganzen
//                 Bildschirm.
// modus="zeigen": Tipp auf die schon gezogene Karte — sie wächst direkt aus
//                 ihrer Position heraus.
//
// Danach: Holo-Glanz (Finger/Neigung), Lichtstrahlen, Goldstaub, Text Wort für
// Wort. Oben läuft ein Fortschrittsbalken wie bei Stories — ist er voll, kehrt
// die Karte von allein in die App zurück. Festhalten pausiert, ein einfacher
// Tipp schließt sofort, Wischen nach unten auch. Teilen über das Symbol oben.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GOLD = "#D9B56A";
const CREME = "#F6EBCF";
const NACHT = "#0B0C24";
const KURVE = "cubic-bezier(.2,.9,.12,1)";
const DREH_MS = 2300;

const wenigBewegung = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const summe = (dauer) => { try { navigator.vibrate?.(dauer); } catch { /* egal */ } };

export default function KarteVollbild({ karte, bild, fallback, quelle, modus = "zeigen", onTeilen, onClose }) {
  const karteRef = useRef(null);
  const buehneRef = useRef(null);
  const glanzRef = useRef(null);
  const drehRef = useRef(null);
  const balkenRef = useRef(null);
  const ziehRef = useRef({ start: null, dy: 0, bewegt: false });
  const uhrRef = useRef({ verbraucht: 0, letzte: 0, pause: false, aus: false });
  const [phase, setPhase] = useState(modus === "zieh" ? "dreh" : "auf"); // dreh → auf → offen → zu
  const [teilt, setTeilt] = useState(false);

  // Morph zwischen einem Rechteck (kleine/drehende Karte) und dem Vollbild
  const morph = (vonEl, rueckwaerts) => {
    const el = karteRef.current;
    const q = vonEl?.getBoundingClientRect();
    if (!el || !q || !q.width || wenigBewegung() || !el.animate) return null;
    const z = (glanzRef.current || el).getBoundingClientRect();
    const sx = q.width / z.width, sy = q.height / z.height;
    const dx = q.left - z.left, dy = q.top - z.top;
    const klein = { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, borderRadius: `${18 / sx}px / ${18 / sy}px`, opacity: 1 };
    const gross = { transform: `translate(0, ${ziehRef.current.dy}px) scale(1)`, borderRadius: "0px", opacity: 1 };
    return el.animate(rueckwaerts ? [gross, klein] : [klein, gross], {
      duration: rueckwaerts ? 560 : 820, easing: KURVE, fill: "both",
    });
  };

  const aufziehen = (vonEl) => {
    setPhase("auf");
    const a = morph(vonEl, false);
    if (a) a.onfinish = () => { a.cancel(); setPhase("offen"); };
    else setPhase("offen");
  };

  // Start: entweder drehen oder direkt aufziehen
  useLayoutEffect(() => {
    summe(8);
    if (phase !== "dreh") { aufziehen(quelle?.current); return; }
    const d = drehRef.current;
    if (!d?.animate || wenigBewegung()) { aufziehen(d); return; }
    const a = d.animate([
      { transform: "translateY(40px) scale(.72) rotateY(0deg)", opacity: 0, filter: "brightness(1)" },
      { transform: "translateY(0) scale(.9) rotateY(240deg)", opacity: 1, offset: .18 },
      { transform: "translateY(-10px) scale(1.02) rotateY(720deg)", filter: "brightness(1.35)", offset: .72 },
      { transform: "translateY(0) scale(1) rotateY(900deg)", opacity: 1, filter: "brightness(1)" },
    ], { duration: DREH_MS, easing: "cubic-bezier(.3,.05,.2,1)", fill: "forwards" });
    a.onfinish = () => { summe([10, 40, 18]); setTimeout(() => aufziehen(d), 380); };
    return () => a.cancel();
  }, []);

  const schliessen = () => {
    if (phase === "zu") return;
    uhrRef.current.aus = true;
    setPhase("zu");
    const a = morph(quelle?.current, true);
    if (a) a.onfinish = () => onClose();
    else setTimeout(onClose, 260);
  };

  // Lesezeit: Text-Einblendung + ruhiges Lesen, danach automatisch zurück
  const woerter = (karte.txt || "").split(" ").filter(Boolean);
  const lesezeit = 5200 + woerter.length * 330;
  useEffect(() => {
    if (phase !== "offen") return;
    const u = uhrRef.current;
    u.letzte = performance.now();
    let id;
    const tick = (t) => {
      if (u.aus) return;
      if (!u.pause) u.verbraucht += t - u.letzte;
      u.letzte = t;
      const anteil = Math.min(1, u.verbraucht / lesezeit);
      if (balkenRef.current) balkenRef.current.style.transform = `scaleX(${anteil})`;
      if (anteil >= 1) return schliessen();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [phase]);

  // Scroll sperren, Escape, Handyneigung → Holo-Glanz
  useEffect(() => {
    const alt = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const taste = (e) => e.key === "Escape" && schliessen();
    const neigung = (e) => {
      if (e.gamma == null) return;
      setzeGlanz(50 + Math.max(-30, Math.min(30, e.gamma)) * 1.4, 50 + Math.max(-30, Math.min(30, (e.beta || 45) - 45)) * 1.4);
    };
    window.addEventListener("keydown", taste);
    window.addEventListener("deviceorientation", neigung);
    return () => {
      document.body.style.overflow = alt;
      window.removeEventListener("keydown", taste);
      window.removeEventListener("deviceorientation", neigung);
    };
  }, [phase]);

  const setzeGlanz = (x, y) => {
    const g = glanzRef.current;
    if (!g) return;
    g.style.setProperty("--x", `${x}%`);
    g.style.setProperty("--y", `${y}%`);
    g.style.setProperty("--rx", `${(y - 50) / -9}deg`);
    g.style.setProperty("--ry", `${(x - 50) / 9}deg`);
  };
  const zeiger = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setzeGlanz(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };

  // Festhalten pausiert · nach unten wischen schließt · Scrollen stoppt die Uhr
  const tStart = (e) => {
    uhrRef.current.pause = true;
    const oben = !(buehneRef.current?.scrollTop > 0);
    ziehRef.current = { start: oben ? e.touches[0].clientY : null, dy: 0, bewegt: false };
  };
  const tMove = (e) => {
    const z = ziehRef.current;
    z.bewegt = true;
    if (z.start == null || phase !== "offen") return;
    const dy = e.touches[0].clientY - z.start;
    if (dy <= 0) return;
    z.dy = dy * 0.6; // Gummiband
    const el = karteRef.current;
    if (el) el.style.transform = `translateY(${z.dy}px) scale(${1 - Math.min(z.dy, 300) / 1600})`;
    buehneRef.current?.style.setProperty("--dunkel", String(1 - Math.min(z.dy, 300) / 500));
  };
  const tEnd = () => {
    const z = ziehRef.current;
    uhrRef.current.pause = false;
    if (z.start == null) return;
    z.start = null;
    if (z.dy > 110) return schliessen();
    if (!z.dy) return;
    z.dy = 0;
    const el = karteRef.current;
    if (el) { el.style.transition = `transform .45s ${KURVE}`; el.style.transform = ""; setTimeout(() => { if (el) el.style.transition = ""; }, 460); }
    buehneRef.current?.style.setProperty("--dunkel", "1");
  };
  const mausRunter = () => { uhrRef.current.pause = true; };
  const mausHoch = () => { uhrRef.current.pause = false; };
  const scroll = () => {
    // Wer weiterliest, bekommt alle Zeit der Welt
    if (buehneRef.current?.scrollTop > 40) { uhrRef.current.aus = true; if (balkenRef.current) balkenRef.current.style.opacity = "0"; }
  };

  // Ein einfacher Tipp irgendwo (nicht auf Knöpfen, nicht nach Wischen) → zurück in die App
  const tipp = (e) => {
    if (phase !== "offen") return;
    if (e.target.closest("button")) return;
    if (ziehRef.current.bewegt) { ziehRef.current.bewegt = false; return; }
    schliessen();
  };

  const teilen = async (e) => {
    e.stopPropagation();
    if (!onTeilen || teilt) return;
    uhrRef.current.pause = true;
    setTeilt(true);
    try { await onTeilen(); } finally { setTeilt(false); uhrRef.current.pause = false; }
  };

  const dreht = phase === "dreh";
  const offen = phase === "offen";
  const zu = phase === "zu";

  return createPortal(
    <div
      ref={buehneRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Tageskarte ${karte.n}`}
      className={`s2gVb ${zu ? "zu" : ""}`}
      onClick={tipp}
      onScroll={scroll}
      onTouchStart={tStart}
      onTouchMove={tMove}
      onTouchEnd={tEnd}
      onMouseDown={mausRunter}
      onMouseUp={mausHoch}
    >
      <style>{CSS}</style>
      <div className="s2gVb-hinter" aria-hidden="true" />

      {/* Drehende Karte beim Ziehen */}
      {(dreht || phase === "auf") && modus === "zieh" && (
        <div className="s2gVb-drehbuehne" aria-hidden="true" style={{ opacity: dreht ? 1 : 0 }}>
          <div className="s2gVb-burst" />
          <div ref={drehRef} className="s2gVb-dreh">
            <div className="s2gVb-seite s2gVb-ruecken">
              <div className="s2gVb-rahmen" />
              <svg width="110" height="110" viewBox="0 0 120 120" fill="none" stroke={GOLD} strokeWidth="1">
                <circle cx="60" cy="60" r="22" /><circle cx="60" cy="60" r="34" strokeDasharray="2 4" />
                {Array.from({ length: 16 }).map((_, i) => { const w = (i * Math.PI) / 8; return <line key={i} x1={60 + Math.cos(w) * 40} y1={60 + Math.sin(w) * 40} x2={60 + Math.cos(w) * (i % 2 ? 50 : 58)} y2={60 + Math.sin(w) * (i % 2 ? 50 : 58)} />; })}
                <path d="M66 46a15 15 0 1 0 0 28a12 12 0 1 1 0-28z" fill={GOLD} stroke="none" />
              </svg>
            </div>
            <div className="s2gVb-seite s2gVb-front">
              {bild ? <img src={bild} alt="" draggable="false" /> : <div className="s2gVb-ersatz">{fallback}</div>}
            </div>
          </div>
        </div>
      )}

      <div ref={karteRef} className="s2gVb-karte" onPointerMove={zeiger} style={{ opacity: dreht ? 0 : 1 }}>
        <div ref={glanzRef} className="s2gVb-bild">
          {bild
            ? <img src={bild} alt={karte.n} draggable="false" />
            : <div className="s2gVb-ersatz">{fallback}</div>}
          <div className="s2gVb-strahlen" aria-hidden="true" />
          <div className="s2gVb-holo" aria-hidden="true" />
          <div className="s2gVb-schleier" aria-hidden="true" />
          <div className="s2gVb-staub" aria-hidden="true">
            {Array.from({ length: 22 }).map((_, i) => (
              <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.53) % 6}s`, animationDuration: `${6 + (i % 5)}s`, width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3 }} />
            ))}
          </div>
        </div>

        {offen && (
          <div className="s2gVb-text">
            <div className="s2gVb-eyebrow">{karte.sub} · {karte.b}</div>
            <h2 className="s2gVb-name">{karte.n}</h2>
            <p className="s2gVb-botschaft">
              {woerter.map((w, i) => (
                <span key={i} style={{ animationDelay: `${0.55 + i * 0.055}s` }}>{w}{" "}</span>
              ))}
            </p>
            <div className="s2gVb-hinweis" style={{ animationDelay: `${1.2 + woerter.length * 0.055}s` }}>
              Tippe, um zurückzukehren · halte fest zum Verweilen
            </div>
            {(karte.tief || karte.frage || karte.ritual) && (
              <div className="s2gVb-mehr" style={{ animationDelay: `${0.9 + woerter.length * 0.055}s` }}>
                {karte.tief && <Abschnitt titel="Tiefer schauen">{karte.tief}</Abschnitt>}
                {karte.frage && <Abschnitt titel="Deine Frage für heute">{karte.frage}</Abschnitt>}
                {karte.ritual && <Abschnitt titel="Kleines Ritual">{karte.ritual}</Abschnitt>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Oben: Story-Balken · Teilen · Schließen */}
      <div className="s2gVb-leiste">
        <div className="s2gVb-spur" aria-hidden="true" style={{ opacity: offen ? 1 : 0 }}>
          <div ref={balkenRef} className="s2gVb-balken" />
        </div>
        <div className="s2gVb-knoepfe">
          {onTeilen && (
            <button type="button" className="s2gVb-knopf" onClick={teilen} disabled={teilt} aria-label="Karte teilen">
              {teilt
                ? <span className="s2gVb-lade" />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="M7.5 7.5L12 3l4.5 4.5" /><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" /></svg>}
            </button>
          )}
          <button type="button" className="s2gVb-knopf" onClick={(e) => { e.stopPropagation(); schliessen(); }} aria-label="Schließen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Abschnitt({ titel, children }) {
  return (
    <section className="s2gVb-abschnitt">
      <div className="s2gVb-abschnitt-t">{titel}</div>
      <p>{children}</p>
    </section>
  );
}

const CSS = `
.s2gVb { position: fixed; inset: 0; z-index: 9999; overflow-y: auto; overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch; --dunkel: 1; -webkit-tap-highlight-color: transparent; }
.s2gVb-hinter { position: fixed; inset: 0; background: radial-gradient(120% 80% at 50% 10%, #262A6B 0%, #14163F 45%, ${NACHT} 100%);
  opacity: var(--dunkel); animation: s2gVbEin .45s ease both; }
.s2gVb.zu .s2gVb-hinter { animation: s2gVbAus .5s ease both; }

.s2gVb-drehbuehne { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  perspective: 1400px; transition: opacity .35s ease; pointer-events: none; }
.s2gVb-burst { position: absolute; width: 160vmax; height: 160vmax; border-radius: 50%;
  background: repeating-conic-gradient(from 0deg, rgba(243,223,166,.16) 0deg 3deg, transparent 3deg 12deg);
  mask-image: radial-gradient(circle, #000 0%, transparent 42%); -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 42%);
  animation: s2gVbDreh 14s linear infinite, s2gVbBurst ${DREH_MS}ms ease-out both; }
.s2gVb-dreh { position: relative; width: min(268px, 66vw); aspect-ratio: 268 / 418; transform-style: preserve-3d; opacity: 0; }
.s2gVb-seite { position: absolute; inset: 0; border-radius: 18px; backface-visibility: hidden; -webkit-backface-visibility: hidden;
  overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,.6), 0 0 60px rgba(217,181,106,.35); }
.s2gVb-ruecken { background: linear-gradient(165deg, #2A2E6E 0%, #15163A 100%); border: 2px solid ${GOLD};
  display: flex; align-items: center; justify-content: center; }
.s2gVb-rahmen { position: absolute; inset: 9px; border-radius: 12px; border: 1px solid rgba(217,181,106,.55); }
.s2gVb-front { transform: rotateY(180deg); background: #FBF6EC; padding: 7px; box-sizing: border-box; }
.s2gVb-front img, .s2gVb-front .s2gVb-ersatz { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; display: block; }

.s2gVb-karte { position: relative; margin: 0 auto; width: min(100vw, 560px); min-height: 100dvh;
  overflow: hidden; background: ${NACHT}; transform-origin: top left; will-change: transform;
  box-shadow: 0 0 120px rgba(217,181,106,.18); transition: opacity .2s ease; }
.s2gVb-bild { position: relative; height: 100dvh; overflow: hidden; --x: 50%; --y: 40%; --rx: 0deg; --ry: 0deg; perspective: 900px; }
.s2gVb-bild img, .s2gVb-bild .s2gVb-ersatz { position: absolute; inset: -3%; width: 106%; height: 106%; object-fit: cover; display: block;
  transform: rotateX(var(--rx)) rotateY(var(--ry)); transition: transform .35s ease-out;
  animation: s2gVbKenBurns 14s ease-out both; user-select: none; -webkit-user-drag: none; }
.s2gVb-ersatz { display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
.s2gVb-strahlen { position: absolute; left: 50%; top: 32%; width: 180vmax; height: 180vmax; margin: -90vmax 0 0 -90vmax;
  background: repeating-conic-gradient(from 0deg, rgba(243,223,166,.10) 0deg 4deg, transparent 4deg 15deg);
  mix-blend-mode: screen; mask-image: radial-gradient(circle, #000 0%, transparent 55%);
  -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 55%);
  animation: s2gVbDreh 60s linear infinite, s2gVbEin 1.6s .3s ease both; pointer-events: none; }
.s2gVb-holo { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: color-dodge; opacity: .5;
  background:
    radial-gradient(circle at var(--x) var(--y), rgba(255,246,214,.55) 0%, rgba(255,246,214,0) 32%),
    linear-gradient(115deg, transparent 30%, rgba(255,190,220,.22) 42%, rgba(170,230,255,.22) 50%, rgba(255,236,170,.22) 58%, transparent 70%);
  background-size: 100% 100%, 220% 220%; background-position: center, var(--x) var(--y);
  transition: background-position .3s ease-out; animation: s2gVbEin 1.2s .4s ease both; }
.s2gVb-schleier { position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(11,12,36,.55) 0%, rgba(11,12,36,0) 16%, rgba(11,12,36,0) 42%, rgba(11,12,36,.78) 72%, ${NACHT} 100%); }
.s2gVb-staub { position: absolute; inset: 0; pointer-events: none; }
.s2gVb-staub i { position: absolute; bottom: -10px; border-radius: 50%; background: #F3DFA6;
  box-shadow: 0 0 8px 2px rgba(243,223,166,.7); animation-name: s2gVbStaub; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; }

.s2gVb-text { position: relative; margin-top: -42dvh; padding: 0 28px calc(56px + env(safe-area-inset-bottom)); text-align: center; color: ${CREME}; }
.s2gVb-eyebrow { font: 600 11.5px/1.4 system-ui, sans-serif; letter-spacing: .32em; text-transform: uppercase; color: ${GOLD};
  animation: s2gVbSperren 1.1s .15s ${KURVE} both; }
.s2gVb-name { font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(40px, 12vw, 60px); line-height: 1.02;
  margin: 12px 0 18px; letter-spacing: -.01em;
  background: linear-gradient(100deg, #F6EBCF 0%, #FFF8E4 40%, ${GOLD} 50%, #FFF8E4 60%, #F6EBCF 100%); background-size: 250% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: s2gVbSchaerfe 1s .3s ${KURVE} both, s2gVbGold 5s 1.4s ease-in-out infinite; }
.s2gVb-botschaft { font-family: Georgia, serif; font-size: 21px; line-height: 1.5; margin: 0 auto; max-width: 30ch; }
.s2gVb-botschaft span { display: inline-block; white-space: pre; animation: s2gVbSchaerfe .8s ${KURVE} both; }
.s2gVb-hinweis { margin-top: 26px; font: 500 11.5px/1.4 system-ui, sans-serif; letter-spacing: .08em; color: rgba(246,235,207,.5);
  animation: s2gVbHoch .8s ${KURVE} both; }
.s2gVb-mehr { margin: 40px auto 0; max-width: 34ch; text-align: left; animation: s2gVbHoch .9s ${KURVE} both; }
.s2gVb-abschnitt { padding: 18px 20px; margin-bottom: 14px; border-radius: 20px; background: rgba(246,235,207,.06);
  border: 1px solid rgba(217,181,106,.22); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
.s2gVb-abschnitt-t { font: 600 11px/1 system-ui, sans-serif; letter-spacing: .22em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 10px; }
.s2gVb-abschnitt p { margin: 0; font: 16px/1.6 Georgia, serif; color: rgba(246,235,207,.88); }

.s2gVb-leiste { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: min(100vw, 560px); z-index: 2;
  padding: calc(10px + env(safe-area-inset-top)) 14px 0; box-sizing: border-box; pointer-events: none; }
.s2gVb-spur { height: 3px; border-radius: 3px; background: rgba(246,235,207,.22); overflow: hidden; transition: opacity .4s ease; }
.s2gVb-balken { height: 100%; background: linear-gradient(90deg, ${GOLD}, #FFF3CF); transform: scaleX(0); transform-origin: left; transition: opacity .3s; }
.s2gVb-knoepfe { display: flex; justify-content: flex-end; gap: 4px; margin-top: 10px; margin-left: auto; width: max-content;
  padding: 4px; border-radius: 30px; pointer-events: auto;
  background: rgba(24,26,64,.42); border: 1px solid rgba(246,235,207,.16);
  backdrop-filter: blur(22px) saturate(1.6); -webkit-backdrop-filter: blur(22px) saturate(1.6);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 8px 24px rgba(0,0,0,.25); animation: s2gVbEin .4s .5s ease both; }
.s2gVb-knopf { width: 44px; height: 44px; border-radius: 50%; border: 0; cursor: pointer; color: ${CREME}; background: transparent;
  display: flex; align-items: center; justify-content: center; transition: background .2s; }
.s2gVb-knopf:active { background: rgba(246,235,207,.14); }
.s2gVb-lade { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(246,235,207,.3); border-top-color: ${CREME}; animation: s2gVbDreh .8s linear infinite; }
.s2gVb.zu .s2gVb-leiste, .s2gVb.zu .s2gVb-text, .s2gVb.zu .s2gVb-strahlen, .s2gVb.zu .s2gVb-holo { animation: s2gVbAus .25s ease both; }

@keyframes s2gVbEin { from { opacity: 0; } }
@keyframes s2gVbAus { to { opacity: 0; } }
@keyframes s2gVbDreh { to { transform: rotate(360deg); } }
@keyframes s2gVbBurst { 0% { opacity: 0; scale: .3; } 70% { opacity: .6; } 100% { opacity: 1; scale: 1; } }
@keyframes s2gVbKenBurns { from { scale: 1.12; } to { scale: 1; } }
@keyframes s2gVbHoch { from { opacity: 0; transform: translateY(22px); } }
@keyframes s2gVbSperren { from { opacity: 0; letter-spacing: .9em; } }
@keyframes s2gVbSchaerfe { from { opacity: 0; filter: blur(12px); transform: translateY(10px); } }
@keyframes s2gVbGold { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0% 0; } }
@keyframes s2gVbStaub { 0% { opacity: 0; transform: translateY(0); } 15% { opacity: .9; } 100% { opacity: 0; transform: translateY(-95dvh) translateX(24px); } }
@media (prefers-reduced-motion: reduce) {
  .s2gVb *, .s2gVb-hinter { animation-duration: .01s !important; animation-iteration-count: 1 !important; transition: none !important; }
  .s2gVb-staub, .s2gVb-strahlen, .s2gVb-burst { display: none; }
}
`;
