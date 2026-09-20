// CoachingHub.jsx — Coaching-Übersicht und Wochenbericht an die Coachin.
// Aus App.jsx herausgelöst; Verhalten unverändert.

import { ladeAngebote, ladeCoachBeitraege, ladeCoachProfil, ladeKursFortschritt, ladeKursModule, ladeMaterialien, ladeMeineTermine, ladeNachrichten, sendeNachricht } from "../supabase";
import { useEffect, useMemo, useState } from "react";
import { montagVon, wochenNummer } from "../lib/zeit";
import { KAT_ICON } from "./Mediathek";
import { CoachVerbinden } from "./Profil";
import { Btn, Card, Eyebrow, H, Mikro } from "../ui/basis";
import { C } from "../ui/tema";

/* ── Meine Coachin — hier treffen sich Begleitung und Alltag ──
   Eine Seite beantwortet drei Fragen: Wer begleitet mich? Was ist von ihr für
   mich da? Was steht an? Dazu — offen und nachlesbar — was sie von mir sieht.
   Ohne Verbindung wird daraus die Einladung, sich zu verbinden. */

export const SIEHT = [
  "Deinen Anzeigenamen und seit wann ihr verbunden seid",
  "Eure Nachrichten und Sprachnachrichten",
  "Termine, die du bei ihr buchst",
  "Deinen Fortschritt in ihren Kursen",
  "Anfragen, die du zu ihren Paketen stellst",
];

export const SIEHT_NICHT = [
  "Dein Journal, deine Briefe und Reflexionen",
  "Orakel, Schattenspiegel und deine Rituale",
  "Stimmung, Lichtpunkte, Streaks und Tests",
  "Deine Dateien — außer du schickst sie ihr im Chat",
  "Alles, was du ilho schreibst",
];

export function terminText(beginn) {
  const d = new Date(beginn);
  const tage = Math.round((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);
  const uhr = new Date(beginn).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const wann = tage === 0 ? "heute" : tage === 1 ? "morgen" : tage < 7 ? `in ${tage} Tagen` :
    new Date(beginn).toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  return `${wann} um ${uhr} Uhr`;
}

export function CoachingHub({ go, bindung, aufBindung }) {
  const [profil, setProfil] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [termine, setTermine] = useState([]);
  const [material, setMaterial] = useState([]);
  const [angebote, setAngebote] = useState([]);
  const [beitraege, setBeitraege] = useState([]);
  const [kurs, setKurs] = useState(null);
  const [laedt, setLaedt] = useState(true);
  const [zeigTransparenz, setZeigTransparenz] = useState(false);

  useEffect(() => {
    let aktiv = true;
    if (!bindung?.coach_id) { setLaedt(false); return; }
    (async () => {
      setLaedt(true);
      const [p, n, t, m, a, b, f] = await Promise.all([
        ladeCoachProfil(bindung.coach_id),
        ladeNachrichten(bindung.id, 50),
        ladeMeineTermine(),
        ladeMaterialien(bindung.coach_id),
        ladeAngebote(bindung.coach_id),
        ladeCoachBeitraege(bindung.coach_id, 3),
        ladeKursFortschritt(bindung.id),
      ]);
      if (!aktiv) return;
      setProfil(p); setMsgs(n || []); setTermine(t || []);
      setMaterial(m || []); setAngebote(a || []); setBeitraege(b || []);
      const kursAngebot = (a || []).find((x) => x.typ === "kurs");
      if (kursAngebot) {
        const module = await ladeKursModule(kursAngebot.id);
        if (!aktiv) return;
        setKurs({ titel: kursAngebot.titel, erledigt: module.filter((mo) => f[mo.id]).length, gesamt: module.length });
      }
      setLaedt(false);
    })();
    return () => { aktiv = false; };
  }, [bindung?.coach_id, bindung?.id]);

  /* ── Ohne Verbindung: erklären, was danach anders ist ── */
  if (!bindung?.coach_id) {
    return (
      <div style={{ padding: "26px 20px" }}>
        <Eyebrow>Deine Begleitung</Eyebrow>
        <H size={25} style={{ marginBottom: 8 }}>Noch bist du hier allein unterwegs</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
          Alles in dieser App gehört dir — auch ohne Coachin. Mit einem Einladungscode
          wird daraus ein gemeinsamer Raum: geschützt, nur ihr zwei.
        </p>
        <CoachVerbinden onVerbunden={aufBindung} />
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.espresso, marginBottom: 10 }}>Was sich dann ändert</div>
          {[
            ["💌", "Ein Chat, der nur euch gehört", "Text und Sprachnachrichten — sie antwortet dir persönlich."],
            ["📅", "Termine direkt bei ihr", "Du siehst ihre freien Zeiten und buchst mit einem Tippen."],
            ["📁", "Ihre Materialien und Kurse", "Was sie für dich einstellt, liegt hier bereit."],
            ["🤍", "Und trotzdem: dein Raum bleibt deiner", "Journal, Orakel und Rituale sieht sie nicht."],
          ].map(([i, t, s]) => (
            <div key={t} style={{ display: "flex", gap: 11, marginBottom: 11 }}>
              <span style={{ fontSize: 19 }}>{i}</span>
              <span>
                <span style={{ display: "block", fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: 13.5, color: C.espresso }}>{t}</span>
                <span style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.5, marginTop: 2 }}>{s}</span>
              </span>
            </div>
          ))}
        </Card>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, opacity: 0.75, lineHeight: 1.6 }}>
          Du hast noch keinen Code? Deine Coachin findet ihn in ihrem Bereich unter „Klientinnen".
        </p>
      </div>
    );
  }

  const name = profil?.name || bindung.coach_name || "Deine Coachin";
  const vorname = name.split(" ")[0];
  const initialen = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const ungelesen = msgs.filter((m) => m.absender === "coach" && !m.gelesen_am).length;
  const letzteVonIhr = [...msgs].reverse().find((m) => m.absender === "coach");
  const naechster = termine[0];
  const pausiert = bindung.status === "pausiert";

  // Was ansteht — aus echten Daten, nicht aus einer Wunschliste.
  const anstehend = [];
  if (ungelesen) anstehend.push({ icon: "💌", t: `${ungelesen} neue Nachricht${ungelesen > 1 ? "en" : ""} von ${vorname}`, s: "Lesen und in Ruhe antworten", tab: "coach" });
  if (naechster) anstehend.push({ icon: "📅", t: `Session ${terminText(naechster.beginn)}`, s: `${naechster.dauer_min} Min · ${naechster.kanal === "video" ? "Video" : naechster.kanal === "telefon" ? "Telefon" : "vor Ort"}`, tab: "buchen" });
  if (kurs && kurs.gesamt > 0 && kurs.erledigt < kurs.gesamt) anstehend.push({ icon: "🎓", t: `${kurs.titel}: Modul ${kurs.erledigt + 1} von ${kurs.gesamt}`, s: "Da wartet noch etwas auf dich", tab: "kurse" });
  if (!naechster) anstehend.push({ icon: "🗓️", t: "Noch kein Termin ausgemacht", s: `Freie Zeiten von ${vorname} ansehen`, tab: "buchen" });
  let berichtWoche = null;
  try { berichtWoche = localStorage.getItem("s2g_bericht_woche"); } catch {}
  if (berichtWoche !== String(wochenNummer())) anstehend.push({ icon: "🌿", t: `Deine Woche an ${vorname} schicken`, s: "Zahlen statt Inhalte — du wählst aus", tab: "wochenbericht" });

  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Deine Begleitung</Eyebrow>

      {/* Wer dich begleitet — alles, was sie über sich hinterlegt hat */}
      <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${C.card}, ${C.goldPale})` }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 58, height: 58, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${C.gold}, ${C.rose})`, color: "#fff",
            fontFamily: "Georgia, serif", fontSize: 21,
          }}>{initialen || "C"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.espresso }}>{name}</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 3 }}>
              {pausiert ? "⏸ Begleitung pausiert" : "✓ verbunden"}
              {bindung.verbunden_am ? ` seit ${new Date(bindung.verbunden_am).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}` : ""}
            </div>
          </div>
        </div>

        {profil?.kurzprofil && (
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14.5, fontStyle: "italic", color: C.espresso, lineHeight: 1.6, margin: "12px 0 0" }}>
            {profil.kurzprofil}
          </p>
        )}

        {/* Die beiden Wege zu ihr */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <Btn small onClick={() => go("coach")}>💌 Nachricht schreiben</Btn>
          {profil?.buchungslink ? (
            <a href={profil.buchungslink} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <Btn small ghost>📅 Termin buchen</Btn>
            </a>
          ) : (
            <Btn small ghost onClick={() => go("buchen")}>📅 Termin buchen</Btn>
          )}
        </div>

        {/* Wo man sie sonst findet */}
        {(() => {
          const links = [
            ["Website", profil?.website],
            ["Instagram", profil?.instagram && (String(profil.instagram).startsWith("http") ? profil.instagram : `https://instagram.com/${String(profil.instagram).replace("@", "")}`)],
            ["YouTube", profil?.youtube],
            ["TikTok", profil?.tiktok],
            ["Facebook", profil?.facebook],
            ["Pinterest", profil?.pinterest],
            ["LinkedIn", profil?.linkedin],
          ].filter(([, u]) => u);
          const direkt = [
            ["✉️", profil?.email_oeffentlich, `mailto:${profil?.email_oeffentlich}`],
            ["☎️", profil?.telefon, `tel:${String(profil?.telefon || "").replace(/\s/g, "")}`],
          ].filter(([, t]) => t);
          if (!links.length && !direkt.length) return null;
          return (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              {direkt.length > 0 && (
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: links.length ? 8 : 0 }}>
                  {direkt.map(([ic, t, href]) => (
                    <a key={t} href={href} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.plum, textDecoration: "none" }}>{ic} {t}</a>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {links.map(([t, u]) => (
                  <a key={t} href={u} target="_blank" rel="noreferrer" style={{
                    fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.plum, textDecoration: "none",
                    border: `1px solid ${C.goldSoft}`, borderRadius: 16, padding: "5px 11px", background: C.card,
                  }}>{t}</a>
                ))}
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Was ansteht */}
      <Eyebrow color={C.plum}>Was ansteht</Eyebrow>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        {anstehend.map((x) => (
          <Card key={x.t} onClick={() => go(x.tab)} style={{ marginBottom: 9, display: "flex", gap: 13, alignItems: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{x.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14.5, color: C.espresso }}>{x.t}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, marginTop: 2 }}>{x.s}</div>
            </div>
            <div style={{ color: C.gold, fontSize: 20 }}>›</div>
          </Card>
        ))}
      </div>

      {/* Was von ihr da ist */}
      <Eyebrow color={C.plum}>Von {vorname} für dich</Eyebrow>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        {letzteVonIhr && (
          <Card onClick={() => go("coach")} style={{ marginBottom: 9, borderLeft: `3px solid ${C.rose}` }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.plum, fontWeight: 600, marginBottom: 5 }}>
              Ihre letzte Nachricht · {new Date(letzteVonIhr.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.espresso, lineHeight: 1.55 }}>
              {letzteVonIhr.text ? `„${String(letzteVonIhr.text).slice(0, 130)}${letzteVonIhr.text.length > 130 ? " …" : ""}"` : "🎙️ Eine Sprachnachricht wartet auf dich."}
            </div>
          </Card>
        )}
        {material.slice(0, 3).map((m) => (
          <Card key={m.id} onClick={() => go("media")} style={{ marginBottom: 9, display: "flex", gap: 13, alignItems: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
              {KAT_ICON[m.kategorie] || "📄"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>{m.titel}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>{m.beschreibung || m.kategorie}</div>
            </div>
            <div style={{ color: C.gold, fontSize: 20 }}>›</div>
          </Card>
        ))}
        {angebote.length > 0 && (
          <Card onClick={() => go("kurse")} style={{ marginBottom: 9, display: "flex", gap: 13, alignItems: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>💎</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>
                {angebote.length} {angebote.length === 1 ? "Angebot" : "Angebote"} von {vorname}
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Kurse & Pakete ansehen</div>
            </div>
            <div style={{ color: C.gold, fontSize: 20 }}>›</div>
          </Card>
        )}
        {beitraege.slice(0, 2).map((b) => (
          <Card key={b.id} style={{ marginBottom: 9 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.plum, fontWeight: 600, marginBottom: 4 }}>Impuls</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15.5, color: C.espresso, marginBottom: 4 }}>{b.titel}</div>
            {b.text && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.6 }}>{String(b.text).slice(0, 160)}{b.text.length > 160 ? " …" : ""}</div>}
          </Card>
        ))}
        {!laedt && !letzteVonIhr && material.length === 0 && angebote.length === 0 && beitraege.length === 0 && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
            {vorname} hat hier noch nichts eingestellt. Schreib ihr gern zuerst — der Anfang darf auch von dir kommen.
          </p>
        )}
      </div>

      {/* Offen gesagt: was sie sieht */}
      <Card style={{ marginBottom: 16, background: C.cream }}>
        <div onClick={() => setZeigTransparenz(!zeigTransparenz)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <span style={{ fontSize: 19 }}>🔍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: C.espresso }}>Was {vorname} von dir sieht</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2 }}>Damit du es weißt — und nicht raten musst</div>
          </div>
          <span style={{ color: C.gold, fontSize: 18 }}>{zeigTransparenz ? "⌃" : "⌄"}</span>
        </div>
        {zeigTransparenz && (
          <div style={{ marginTop: 14, animation: "fadeUp .3s ease" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: C.plum, marginBottom: 6 }}>Sie sieht</div>
            {SIEHT.map((z) => (
              <div key={z} style={{ display: "flex", gap: 8, fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.6, marginBottom: 4 }}>
                <span style={{ color: C.sage }}>✓</span><span>{z}</span>
              </div>
            ))}
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: C.plum, margin: "12px 0 6px" }}>Sie sieht nicht</div>
            {SIEHT_NICHT.map((z) => (
              <div key={z} style={{ display: "flex", gap: 8, fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.6, marginBottom: 4 }}>
                <span style={{ opacity: 0.5 }}>—</span><span>{z}</span>
              </div>
            ))}
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11.5, color: C.ink, opacity: 0.8, lineHeight: 1.6, marginTop: 12 }}>
              Magst du die Begleitung beenden, sag es ihr im Chat — sie löst die Verbindung. Deine Daten kannst du im Profil jederzeit exportieren oder löschen.
            </div>
          </div>
        )}
      </Card>

      {/* Direkt weiter */}
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <Btn small onClick={() => go("coach")}><span style={{ marginRight: 6 }}>💌</span>Schreiben</Btn>
        <Btn small ghost onClick={() => go("buchen")}><span style={{ marginRight: 6 }}>📅</span>Termin</Btn>
        <Btn small ghost onClick={() => go("kurse")}><span style={{ marginRight: 6 }}>🎓</span>Kurse</Btn>
        <Btn small ghost onClick={() => go("media")}><span style={{ marginRight: 6 }}>📁</span>Material</Btn>
      </div>
    </div>
  );
}

/* ── Wochenbericht — was ich diese Woche getan habe, geht zu meiner Coachin ──
   Grundsatz: Zahlen statt Inhalte. Die Coachin sieht, wie oft geübt wurde und
   was die Klientin ihr selbst schreiben möchte — nie den Text aus Journal,
   Orakel oder Schattenspiegel. Jede Zeile lässt sich vor dem Senden abwählen.
   Verschickt wird als ganz normale Nachricht im gemeinsamen Chat. */

export const wochenBereich = (versatz = 0) => {
  const start = montagVon(Date.now());
  start.setDate(start.getDate() + versatz * 7);
  const ende = new Date(start);
  ende.setDate(ende.getDate() + 6);
  return { start, ende };
};

export const zeitraumText = ({ start, ende }) =>
  `${start.toLocaleDateString("de-DE", { day: "numeric", month: start.getMonth() === ende.getMonth() ? undefined : "long" })}.–${ende.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}`;

/* Ein Tag kann in drei Schreibweisen im Zustand stehen — wir prüfen alle. */
export const tageDerWoche = (bereich) => {
  const de = new Set(), lang = new Set(), iso = new Set();
  const d = new Date(bereich.start);
  while (d <= bereich.ende) {
    de.add(d.toLocaleDateString("de-DE"));
    lang.add(d.toLocaleDateString("de-DE", { day: "numeric", month: "long" }));
    iso.add(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return { de, lang, iso, drin: (w) => !!w && (de.has(w) || lang.has(w) || iso.has(w)) };
};

export function baueWochenbericht(daten, versatz = 0) {
  const bereich = wochenBereich(versatz);
  const tage = tageDerWoche(bereich);
  const { entries = [], achtsam = [], dank = [], qigong = [], metime = [], losgelassen = [], punkte = 0 } = daten || {};

  const achtsamWoche = (achtsam || []).filter((a) => tage.drin(a.datum));
  const arten = [...new Set(achtsamWoche.map((a) => a.art))];
  const dankWoche = (dank || []).filter((d) => tage.drin(d.datum));
  const journalWoche = (entries || []).filter((e) => tage.drin(e.date));
  const qiWoche = (qigong || []).filter((q) => tage.drin(q.datum));
  const qiMin = qiWoche.reduce((s, q) => s + (q.minuten || 0), 0);
  const metimeWoche = (metime || []).filter((t) => t.erledigt && tage.drin(t.datum));
  const losWoche = (losgelassen || []).filter((l) => tage.drin(l.los_am));
  let tuer = false;
  try { tuer = localStorage.getItem("s2g_woche_bonus") === String(wochenNummer(bereich.start.getTime())); } catch {}

  const zeilen = [];
  if (achtsamWoche.length) zeilen.push({ k: "achtsam", icon: "🖐️", text: `Achtsamkeit: ${achtsamWoche.length}×${arten.length ? ` (${arten.slice(0, 3).join(", ")})` : ""}` });
  if (dankWoche.length) zeilen.push({ k: "dank", icon: "🤍", text: `Dankbarkeit: an ${dankWoche.length} ${dankWoche.length === 1 ? "Tag" : "Tagen"}` });
  if (journalWoche.length) zeilen.push({ k: "journal", icon: "📔", text: `Journal: ${journalWoche.length} ${journalWoche.length === 1 ? "Eintrag" : "Einträge"} (Inhalt bleibt bei mir)` });
  if (qiWoche.length) zeilen.push({ k: "qigong", icon: "🌿", text: `Qigong: ${qiWoche.length}× · ${qiMin} Min` });
  if (metimeWoche.length) zeilen.push({ k: "metime", icon: "💗", text: `Me-Time: ${metimeWoche.length} gehalten` });
  if (losWoche.length) zeilen.push({ k: "los", icon: "🕊️", text: `Losgelassen: ${losWoche.length}` });
  if (tuer) zeilen.push({ k: "tuer", icon: "🔑", text: "Meine Wochen-Tür habe ich geöffnet" });
  if (punkte) zeilen.push({ k: "punkte", icon: "✨", text: `Lichtpunkte gesamt: ${punkte}` });

  return { bereich, zeitraum: zeitraumText(bereich), zeilen, leer: zeilen.length === 0 };
}

export function berichtText(bericht, ausgewaehlt, notiz) {
  const zeilen = bericht.zeilen.filter((z) => ausgewaehlt.includes(z.k));
  const teile = [`🌿 Meine Woche · ${bericht.zeitraum}`, ""];
  if (zeilen.length) teile.push(...zeilen.map((z) => `${z.icon} ${z.text}`));
  else teile.push("Diese Woche war ruhig — ich war wenig in der App.");
  if (notiz?.trim()) teile.push("", "Was ich dir sagen möchte:", `„${notiz.trim()}"`);
  return teile.join("\n");
}

export function Wochenbericht({ bindung, aufBindung, entries, achtsam, dank, qigong, metime, losgelassen, punkte }) {
  const bericht = useMemo(
    () => baueWochenbericht({ entries, achtsam, dank, qigong, metime, losgelassen, punkte }, 0),
    [entries, achtsam, dank, qigong, metime, losgelassen, punkte]
  );
  const [aus, setAus] = useState([]);          // abgewählte Zeilen
  const [notiz, setNotiz] = useState("");
  const [busy, setBusy] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [auto, setAuto] = useState(() => { try { return localStorage.getItem("s2g_bericht_auto") === "an"; } catch { return false; } });
  const [gesendet, setGesendet] = useState(() => { try { return localStorage.getItem("s2g_bericht_woche"); } catch { return null; } });

  const dieseWoche = String(wochenNummer());
  const schonGesendet = gesendet === dieseWoche;
  const ausgewaehlt = bericht.zeilen.map((z) => z.k).filter((k) => !aus.includes(k));
  const text = berichtText(bericht, ausgewaehlt, notiz);
  const vorname = (bindung?.coach_name || "deiner Coachin").split(" ")[0];

  if (!bindung?.coach_id) {
    return (
      <div style={{ padding: "26px 20px" }}>
        <Eyebrow>Wochenbericht</Eyebrow>
        <H size={24} style={{ marginBottom: 8 }}>Dafür braucht es eine Coachin</H>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
          Sobald ihr verbunden seid, kannst du ihr am Ende der Woche zeigen, was du getan hast — in Zahlen, ohne deine Texte.
        </p>
        <CoachVerbinden onVerbunden={aufBindung} />
      </div>
    );
  }

  const senden = async () => {
    setBusy(true);
    const ok = await sendeNachricht({ klientinId: bindung.id, text });
    setBusy(false);
    if (!ok) { setHinweis("Das hat gerade nicht geklappt — versuch es gleich noch einmal."); return; }
    try { localStorage.setItem("s2g_bericht_woche", dieseWoche); } catch {}
    setGesendet(dieseWoche);
    setHinweis(`✓ Deine Woche ist bei ${vorname}.`);
  };

  const autoUmschalten = () => {
    const neu = !auto;
    setAuto(neu);
    try { localStorage.setItem("s2g_bericht_auto", neu ? "an" : "aus"); } catch {}
  };

  return (
    <div style={{ padding: "26px 20px" }}>
      <Eyebrow>Wochenbericht</Eyebrow>
      <H size={24} style={{ marginBottom: 8 }}>Deine Woche für {vorname}</H>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
        {bericht.zeitraum} · Sie sieht Zahlen, keine Inhalte. Was du nicht schicken
        magst, tippst du einfach weg.
      </p>

      <Card style={{ marginBottom: 14 }}>
        {bericht.leer ? (
          <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            Diese Woche ist noch nichts zusammengekommen. Das ist auch eine Antwort —
            du kannst sie trotzdem schicken.
          </p>
        ) : bericht.zeilen.map((z) => {
          const an = !aus.includes(z.k);
          return (
            <div
              key={z.k}
              onClick={() => setAus(an ? [...aus, z.k] : aus.filter((k) => k !== z.k))}
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", marginBottom: 6,
                borderRadius: 12, cursor: "pointer", opacity: an ? 1 : 0.4,
                background: an ? C.goldPale : "transparent", border: `1px solid ${an ? C.line : "transparent"}`,
              }}
            >
              <span style={{ fontSize: 18 }}>{z.icon}</span>
              <span style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 13.5, color: C.espresso }}>{z.text}</span>
              <span style={{ color: an ? C.gold : C.ink, fontSize: 15 }}>{an ? "✓" : "○"}</span>
            </div>
          );
        })}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: C.espresso, marginBottom: 8 }}>
          Was möchtest du ihr sagen? <span style={{ fontWeight: 400, color: C.ink }}>(freiwillig)</span>
        </div>
        <textarea
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          rows={4}
          placeholder="Diese Woche war …"
          style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical", background: C.card, color: C.espresso }}
        />
        <div style={{ marginTop: 8 }}>
          <Mikro size={40} onText={(t) => setNotiz((v) => (v ? v + " " : "") + t)} />
        </div>
      </Card>

      <Eyebrow color={C.plum}>So kommt es bei ihr an</Eyebrow>
      <Card style={{ margin: "8px 0 14px", background: C.cream }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.espresso, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{text}</div>
      </Card>

      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Btn onClick={senden} disabled={busy}>{busy ? "Wird geschickt …" : schonGesendet ? "Noch einmal schicken" : `An ${vorname} schicken`}</Btn>
        {schonGesendet && <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12.5, color: C.sage }}>✓ diese Woche schon geschickt</span>}
      </div>
      {hinweis && <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: C.plum, marginBottom: 12 }}>{hinweis}</div>}

      <Card onClick={autoUmschalten} style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 26, borderRadius: 20, flexShrink: 0, padding: 3, display: "flex",
          justifyContent: auto ? "flex-end" : "flex-start", alignItems: "center",
          background: auto ? `linear-gradient(135deg, ${C.gold}, ${C.rose})` : C.line, transition: "all .2s",
        }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: 13.5, color: C.espresso }}>Jeden Montag automatisch schicken</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: C.ink, marginTop: 2, lineHeight: 1.5 }}>
            Nur die Zahlen der vergangenen Woche — ohne deine Notiz, die schreibst du selbst.
          </div>
        </div>
      </Card>
    </div>
  );
}

