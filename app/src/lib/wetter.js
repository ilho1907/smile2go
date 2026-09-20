// wetter.js — Wetter über open-meteo — ohne Schlüssel, mit Rückfallort München.
// Aus App.jsx herausgelöst; Verhalten unverändert.

/* Wetter — echte Daten via Open-Meteo (kostenlos, kein API-Key nötig) */
export const WETTER_FALLBACK_ORT = { lat: 48.137, lon: 11.575, stadt: "München" };

// falls Standort nicht freigegeben wird
export function wmoIcon(code) {
  if (code === 0) return { icon: "☀️", txt: "klarer Himmel" };
  if (code <= 2) return { icon: "🌤️", txt: "leicht bewölkt" };
  if (code === 3) return { icon: "☁️", txt: "bedeckt" };
  if (code <= 48) return { icon: "🌫️", txt: "neblig" };
  if (code <= 57) return { icon: "🌦️", txt: "Nieselregen" };
  if (code <= 67) return { icon: "🌧️", txt: "Regen" };
  if (code <= 77) return { icon: "🌨️", txt: "Schnee" };
  if (code <= 82) return { icon: "🌧️", txt: "Schauer" };
  if (code <= 86) return { icon: "🌨️", txt: "Schneeschauer" };
  if (code >= 95) return { icon: "⛈️", txt: "Gewitter" };
  return { icon: "🌤️", txt: "wechselhaft" };
}

export async function ladeWetter(setWetter) {
  const holen = async (lat, lon, stadt) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      const cw = data?.current_weather;
      if (!cw) return;
      const { icon, txt } = wmoIcon(cw.weathercode);
      setWetter({ stadt, temp: Math.round(cw.temperature), icon, txt });
    } catch { /* Wetter bleibt einfach leer — keine erfundenen Werte */ }
  };
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (p) => holen(p.coords.latitude.toFixed(3), p.coords.longitude.toFixed(3), "Dein Standort"),
      () => holen(WETTER_FALLBACK_ORT.lat, WETTER_FALLBACK_ORT.lon, WETTER_FALLBACK_ORT.stadt),
      { timeout: 4000 }
    );
  } else {
    holen(WETTER_FALLBACK_ORT.lat, WETTER_FALLBACK_ORT.lon, WETTER_FALLBACK_ORT.stadt);
  }
}

