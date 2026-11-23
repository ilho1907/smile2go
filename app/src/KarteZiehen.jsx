// KarteZiehen.jsx — smile2go
// Zieh-Moment der Tageskarte: Die Karte hebt sich aus ihrem Platz in der App,
// wächst drehend auf Vollbildgröße (Rückseite → Vorderseite), bleibt kurz groß
// stehen und fliegt dann zurück an ihren Platz im Layout.
// Ein Tipp während der Pause schickt sie sofort zurück.
// Bei „Bewegung reduzieren" wird diese Sequenz gar nicht erst gestartet (siehe Orakel).

import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

const KURVE = "cubic-bezier(.2,.9,.12,1)";
const DREH_KURVE = "cubic-bezier(.55,0,.25,1)";
const AUF_MS = 1100;
const HALTEN_MS = 1500;
const ZURUECK_MS = 720;

export const wenigBewegung = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function KarteZiehen({ quelle, rueckseite, vorderseite, onFertig }) {
  const buehneRef = useRef(null);
  const huelleRef = useRef(null);
  const dreherRef = useRef(null);
  const rechteck = useRef(null);
  const zustand = useRef({ phase: "auf", timer: null, fertig: false });

  // Startrechteck einmal messen (vor dem ersten Paint), damit die Karte exakt dort beginnt.
  if (!rechteck.current && quelle?.current) {
    const el = quelle.current;
    let r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) {
      el.scrollIntoView({ block: "center", behavior: "instant" });
      r = el.getBoundingClientRect();
    }
    rechteck.current = { left: r.left, top: r.top, width: r.width, height: r.height };
  }
  const q = rechteck.current;

  // Ziel: Karte mittig, so groß wie der Bildschirm es im Seitenverhältnis zulässt.
  const ziel = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min((vh * 0.86) / q.height, (vw * 0.92) / q.width);
    const dx = vw / 2 - (q.left + q.width / 2);
    const dy = vh / 2 - (q.top + q.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${s})`;
  };

  const zurueck = () => {
    const z = zustand.current;
    if (z.phase !== "halten") return;
    z.phase = "zurueck";
    clearTimeout(z.timer);
    buehneRef.current?.classList.add("zu");
    const a = huelleRef.current.animate(
      [{ transform: ziel() }, { transform: "translate(0, 0) scale(1)" }],
      { duration: ZURUECK_MS, easing: KURVE, fill: "forwards" }
    );
    a.onfinish = fertig;
  };

  const fertig = () => {
    const z = zustand.current;
    if (z.fertig) return;
    z.fertig = true;
    clearTimeout(z.timer);
    onFertig();
  };

  useLayoutEffect(() => {
    const h = huelleRef.current, d = dreherRef.current;
    if (!q || !h || !d || !h.animate) { fertig(); return; }
    const wachsen = h.animate(
      [{ transform: "translate(0, 0) scale(1)" }, { transform: ziel() }],
      { duration: AUF_MS, easing: KURVE, fill: "forwards" }
    );
    d.animate(
      [{ transform: "rotateY(0deg)" }, { transform: "rotateY(540deg)" }],
      { duration: AUF_MS + 80, easing: DREH_KURVE, fill: "forwards" }
    );
    wachsen.onfinish = () => {
      const z = zustand.current;
      z.phase = "halten";
      buehneRef.current?.classList.add("offen");
      try { navigator.vibrate?.(10); } catch { /* egal */ }
      z.timer = setTimeout(zurueck, HALTEN_MS);
    };
    // Sicherheitsnetz, falls ein Tab im Hintergrund die Animation einfriert
    const notfall = setTimeout(fertig, AUF_MS + HALTEN_MS + ZURUECK_MS + 1500);
    return () => { clearTimeout(notfall); clearTimeout(zustand.current.timer); };
  }, []);

  useEffect(() => {
    const alt = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const taste = (e) => (e.key === "Escape" || e.key === "Enter" || e.key === " ") && zurueck();
    window.addEventListener("keydown", taste);
    return () => { document.body.style.overflow = alt; window.removeEventListener("keydown", taste); };
  }, []);

  if (!q) return null;

  return createPortal(
    <div ref={buehneRef} className="s2gZk" onClick={zurueck} role="dialog" aria-modal="true" aria-label="Deine Tageskarte wird gezogen">
      <style>{CSS}</style>
      <div className="s2gZk-hinter" aria-hidden="true" />
      <div
        ref={huelleRef}
        className="s2gZk-huelle"
        style={{ left: q.left, top: q.top, width: q.width, height: q.height }}
      >
        <div className="s2gZk-schein" aria-hidden="true" />
        <div ref={dreherRef} className="s2gZk-dreher">
          <div className="s2gZk-seite">{rueckseite}</div>
          <div className="s2gZk-seite s2gZk-vorne">{vorderseite}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const CSS = `
.s2gZk { position: fixed; inset: 0; z-index: 9998; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.s2gZk-hinter { position: absolute; inset: 0;
  background: radial-gradient(120% 80% at 50% 40%, rgba(38,42,107,.94) 0%, rgba(20,22,63,.96) 50%, rgba(11,12,36,.98) 100%);
  animation: s2gZkEin .45s ease both; }
.s2gZk.zu .s2gZk-hinter { animation: s2gZkAus ${ZURUECK_MS}ms ease both; }
.s2gZk-huelle { position: fixed; transform-origin: center center; perspective: 1400px; }
.s2gZk-dreher { position: absolute; inset: 0; transform-style: preserve-3d; }
.s2gZk-seite { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.s2gZk-vorne { transform: rotateY(180deg); }
.s2gZk-schein { position: absolute; left: 50%; top: 50%; width: 260%; height: 200%; transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(243,223,166,.55), rgba(217,181,106,.18) 45%, rgba(217,181,106,0) 70%);
  opacity: 0; pointer-events: none; }
.s2gZk.offen .s2gZk-schein { animation: s2gZkSchein 1.4s ease-out both; }
.s2gZk.zu .s2gZk-schein { animation: s2gZkAus .3s ease both; }
@keyframes s2gZkEin { from { opacity: 0; } }
@keyframes s2gZkAus { to { opacity: 0; } }
@keyframes s2gZkSchein { 0% { opacity: 0; transform: translate(-50%, -50%) scale(.6); } 35% { opacity: 1; } 100% { opacity: .55; transform: translate(-50%, -50%) scale(1); } }
`;
