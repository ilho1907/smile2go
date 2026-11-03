// MediaBanner.jsx — smile2go
// Der Kopf jeder Unterseite: Orakel, Kurse, Mediathek, Profil und ein
// Dutzend weitere. Fuenfzehn Seiten haengen an dieser einen Datei.
//
// Die Verhaeltnisse sind dieselben wie beim Heute-Bild, nur eine Stufe
// kleiner — ein Seitenkopf darf nicht so laut sein wie der erste Blick am
// Morgen, aber er gehoert in dieselbe Familie:
//
//   randlos   bis in die Ecken, ohne abgerundete Kanten. Das ist der
//             deutlichste Unterschied zwischen Anwendung und Webseite.
//   hoch      40 Prozent der Schirmhoehe statt 190 fester Pixel, damit der
//             Kopf auf einem grossen und einem kleinen Telefon gleich wirkt.
//   Titel     links unten im Bild, nicht mittig unter dem Rand, und gross
//             genug, um der Titel der Seite zu sein.
//   dunkel    der Verlauf geht unten wirklich zu, sonst traegt weisse
//             Serifenschrift nicht.
export default function MediaBanner({ video, poster, title, subtitle, height = 240 }) {
  // height ist von fuenfzehn Aufrufstellen in Pixeln gesetzt. Statt sie alle
  // anzufassen, wird die Zahl hier als das gelesen, was sie meint: gross oder
  // klein. Gerechnet wird dann in Schirmhoehe.
  const gross = height >= 210;

  return (
    <div style={{
      position: "relative", overflow: "hidden", borderRadius: 0,
      margin: "0 0 16px",
      height: gross ? "min(46dvh, 350px)" : "min(40dvh, 300px)",
      minHeight: gross ? 270 : 240,
    }}>
      <video
        src={video} poster={poster} autoPlay muted loop playsInline preload="auto"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(30,19,10,.30) 0%, rgba(30,19,10,.04) 34%, rgba(30,19,10,.40) 66%, rgba(24,15,7,.84) 100%)",
      }} />
      <div style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
        <h1 style={{
          fontFamily: "Georgia, serif", fontWeight: 400,
          fontSize: "clamp(26px, 7vw, 36px)", lineHeight: 1.08, letterSpacing: "-0.024em",
          color: "#FFFBF4", margin: 0, textShadow: "0 2px 18px rgba(0,0,0,.55)",
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            fontFamily: "system-ui, sans-serif", fontSize: 13.5, lineHeight: 1.45,
            color: "rgba(255,248,238,.78)", margin: "8px 0 0", maxWidth: 290,
            textShadow: "0 1px 8px rgba(0,0,0,.5)",
          }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
