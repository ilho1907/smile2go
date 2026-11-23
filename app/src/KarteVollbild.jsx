// KarteVollbild.jsx — smile2go
// Tageskarte im Vollbild: die Karte wächst aus ihrer Position heraus über den
// ganzen Bildschirm (Shared-Element-Morph), dazu Holo-Glanz, der dem Finger bzw.
// der Handyneigung folgt, langsam kreisendes Licht, aufsteigender Goldstaub und
// ein Text, der Wort für Wort aus der Unschärfe auftaucht.
// Schließen: ✕, Escape oder nach unten wischen — die Karte kehrt an ihren Platz zurück.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GOLD = "#D9B56A";
const CREME = "#F6EBCF";
const NACHT = "#0B0C24";
const KURVE = "cubic-bezier(.2,.9,.12,1)";

const wenigBewegung = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function KarteVollbild({ karte, bild, fallback, quelle, onClose }) {
  const karteRef = useRef(null);
  const buehneRef = useRef(null);
  const glanzRef = useRef(null);
  const ziehRef = useRef({ start: null, dy: 0 });
  const [phase, setPhase] = useState("auf"); // auf → offen → zu

  // Morph: Startposition = Rechteck der kleinen Karte, Ziel = Vollbild
  const morph = (rueckwaerts) => {
    const el = karteRef.current;
    const q = quelle?.current?.getBoundingClientRect();
    if (!el || !q || wenigBewegung() || !el.animate) return null;
    // Nur den Bildbereich messen — der Text darunter gehört nicht zur kleinen Karte
    const z = (glanzRef.current || el).getBoundingClientRect();
    const sx = q.width / z.width, sy = q.height / z.height;
    const dx = q.left - z.left, dy = q.top - z.top;
    const klein = { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, borderRadius: `${18 / sx}px / ${18 / sy}px` };
    const gross = { transform: `translate(0, ${ziehRef.current.dy}px) scale(1)`, borderRadius: "0px" };
    return el.animate(rueckwaerts ? [gross, klein] : [klein, gross], {
      duration: rueckwaerts ? 560 : 820, easing: KURVE, fill: "both",
    });
  };

  useLayoutEffect(() => {
    const a = morph(false);
    if (a) a.onfinish = () => { a.cancel(); setPhase("offen"); };
    else setPhase("offen");
    try { navigator.vibrate?.(8); } catch { /* egal */ }
  }, []);

  const schliessen = () => {
    if (phase === "zu") return;
    setPhase("zu");
    const a = morph(true);
    if (a) a.onfinish = () => onClose();
    else setTimeout(onClose, 260);
  };

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

  // Nach unten wischen zum Schließen (nur ganz oben im Scrollbereich)
  const tStart = (e) => {
    if (buehneRef.current?.scrollTop > 0) return;
    ziehRef.current = { start: e.touches[0].clientY, dy: 0 };
  };
  const tMove = (e) => {
    const z = ziehRef.current;
    if (z.start == null) return;
    const dy = e.touches[0].clientY - z.start;
    if (dy <= 0) return;
    z.dy = dy * 0.6; // Gummiband
    const el = karteRef.current;
    if (el) el.style.transform = `translateY(${z.dy}px) scale(${1 - Math.min(z.dy, 300) / 1600})`;
    if (buehneRef.current) buehneRef.current.style.setProperty("--dunkel", String(1 - Math.min(z.dy, 300) / 500));
  };
  const tEnd = () => {
    const z = ziehRef.current;
    if (z.start == null) return;
    z.start = null;
    if (z.dy > 110) return schliessen();
    z.dy = 0;
    const el = karteRef.current;
    if (el) { el.style.transition = `transform .45s ${KURVE}`; el.style.transform = ""; setTimeout(() => { if (el) el.style.transition = ""; }, 460); }
    buehneRef.current?.style.setProperty("--dunkel", "1");
  };

  const offen = phase === "offen";
  const zu = phase === "zu";
  const woerter = (karte.txt || "").split(" ");

  return createPortal(
    <div
      ref={buehneRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Tageskarte ${karte.n}`}
      className={`s2gVb ${zu ? "zu" : ""}`}
      onTouchStart={tStart}
      onTouchMove={tMove}
      onTouchEnd={tEnd}
    >
      <style>{CSS}</style>
      <div className="s2gVb-hinter" aria-hidden="true" />

      <div ref={karteRef} className="s2gVb-karte" onPointerMove={zeiger}>
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
            <div className="s2gVb-griff" aria-hidden="true" />
            <div className="s2gVb-eyebrow">{karte.sub} · {karte.b}</div>
            <h2 className="s2gVb-name">{karte.n}</h2>
            <p className="s2gVb-botschaft">
              {woerter.map((w, i) => (
                <span key={i} style={{ animationDelay: `${0.55 + i * 0.055}s` }}>{w}{" "}</span>
              ))}
            </p>
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

      <button type="button" className="s2gVb-zu" onClick={schliessen} aria-label="Schließen">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
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
  -webkit-overflow-scrolling: touch; --dunkel: 1; }
.s2gVb-hinter { position: fixed; inset: 0; background: radial-gradient(120% 80% at 50% 10%, #262A6B 0%, #14163F 45%, ${NACHT} 100%);
  opacity: var(--dunkel); animation: s2gVbEin .5s ease both; }
.s2gVb.zu .s2gVb-hinter { animation: s2gVbAus .5s ease both; }
.s2gVb-karte { position: relative; margin: 0 auto; width: min(100vw, 560px); min-height: 100dvh;
  overflow: hidden; background: ${NACHT}; transform-origin: top left; will-change: transform;
  box-shadow: 0 0 120px rgba(217,181,106,.18); }
.s2gVb-bild { position: relative; height: 100dvh; overflow: hidden; --x: 50%; --y: 40%; --rx: 0deg; --ry: 0deg;
  perspective: 900px; }
.s2gVb-bild img, .s2gVb-ersatz { position: absolute; inset: -3%; width: 106%; height: 106%; object-fit: cover; display: block;
  transform: rotateX(var(--rx)) rotateY(var(--ry)); transition: transform .35s ease-out;
  animation: s2gVbKenBurns 14s ease-out both; user-select: none; -webkit-user-drag: none; }
.s2gVb-ersatz { display: flex; align-items: center; justify-content: center; padding: 24px; }
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
.s2gVb-text { position: relative; margin-top: -44dvh; padding: 0 28px calc(56px + env(safe-area-inset-bottom)); text-align: center; color: ${CREME}; }
.s2gVb-griff { width: 38px; height: 4px; border-radius: 4px; background: rgba(246,235,207,.35); margin: 0 auto 26px; animation: s2gVbHoch .6s .2s ${KURVE} both; }
.s2gVb-eyebrow { font: 600 11.5px/1.4 system-ui, sans-serif; letter-spacing: .32em; text-transform: uppercase; color: ${GOLD};
  animation: s2gVbSperren 1.1s .15s ${KURVE} both; }
.s2gVb-name { font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(40px, 12vw, 60px); line-height: 1.02;
  margin: 12px 0 18px; letter-spacing: -.01em;
  background: linear-gradient(100deg, #F6EBCF 0%, #FFF8E4 40%, ${GOLD} 50%, #FFF8E4 60%, #F6EBCF 100%); background-size: 250% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: s2gVbSchaerfe 1s .3s ${KURVE} both, s2gVbGold 5s 1.4s ease-in-out infinite; }
.s2gVb-botschaft { font-family: Georgia, serif; font-size: 21px; line-height: 1.5; margin: 0 auto; max-width: 30ch; }
.s2gVb-botschaft span { display: inline-block; white-space: pre; animation: s2gVbSchaerfe .8s ${KURVE} both; }
.s2gVb-mehr { margin: 44px auto 0; max-width: 34ch; text-align: left; animation: s2gVbHoch .9s ${KURVE} both; }
.s2gVb-abschnitt { padding: 18px 20px; margin-bottom: 14px; border-radius: 20px; background: rgba(246,235,207,.06);
  border: 1px solid rgba(217,181,106,.22); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
.s2gVb-abschnitt-t { font: 600 11px/1 system-ui, sans-serif; letter-spacing: .22em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 10px; }
.s2gVb-abschnitt p { margin: 0; font: 16px/1.6 Georgia, serif; color: rgba(246,235,207,.88); }
.s2gVb-zu { position: fixed; top: calc(14px + env(safe-area-inset-top)); right: max(14px, calc(50vw - 266px)); z-index: 2;
  width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(246,235,207,.28); cursor: pointer;
  color: ${CREME}; background: rgba(11,12,36,.35); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center; animation: s2gVbEin .4s .5s ease both; }
.s2gVb.zu .s2gVb-zu, .s2gVb.zu .s2gVb-text, .s2gVb.zu .s2gVb-strahlen, .s2gVb.zu .s2gVb-holo { animation: s2gVbAus .25s ease both; }
@keyframes s2gVbEin { from { opacity: 0; } }
@keyframes s2gVbAus { to { opacity: 0; } }
@keyframes s2gVbDreh { to { transform: rotate(360deg); } }
@keyframes s2gVbKenBurns { from { scale: 1.12; } to { scale: 1; } }
@keyframes s2gVbHoch { from { opacity: 0; transform: translateY(22px); } }
@keyframes s2gVbSperren { from { opacity: 0; letter-spacing: .9em; } }
@keyframes s2gVbSchaerfe { from { opacity: 0; filter: blur(12px); transform: translateY(10px); } }
@keyframes s2gVbGold { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0% 0; } }
@keyframes s2gVbStaub { 0% { opacity: 0; transform: translateY(0); } 15% { opacity: .9; } 100% { opacity: 0; transform: translateY(-95dvh) translateX(24px); } }
@media (prefers-reduced-motion: reduce) {
  .s2gVb *, .s2gVb-hinter { animation-duration: .01s !important; animation-iteration-count: 1 !important; transition: none !important; }
  .s2gVb-staub, .s2gVb-strahlen { display: none; }
}
`;
