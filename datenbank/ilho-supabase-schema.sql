-- ════════════════════════════════════════════════════
-- smile2go — Supabase Schema (PostgreSQL, Region: EU)
-- Im Supabase SQL-Editor ausführen.
-- DSGVO: RLS aktiv — jede Nutzerin sieht NUR ihre Daten.
-- ════════════════════════════════════════════════════

-- Profile (erweitert auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  sternzeichen text,
  paket text default 'starter' check (paket in ('starter','pro','business')),
  push_zeit time default '07:00',
  punkte int default 0,
  streak int default 0,
  letzter_login date,
  home_prefs jsonb default '{"tiles":["orakel","luma","tagebuch","musik"],"energie":true,"mond":true,"astro":true}',
  created_at timestamptz default now()
);

-- Tagescontent (von n8n um 07:00 befüllt)
create table daily_content (
  datum date primary key,
  spruch text not null,
  motivation_titel text,
  motivation_text text,
  push_text text
);

-- Journal (Intention, Dankbarkeit, Stolz, Wachstum)
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  datum date default current_date,
  intention text,
  items jsonb,          -- ["🤍 ...", "🌱 ...", "✨ ..."]
  created_at timestamptz default now()
);

-- Energie-Checks (Kompass, 1x täglich)
create table energie_checks (
  user_id uuid references profiles(id) on delete cascade,
  datum date default current_date,
  wert int check (wert between 1 and 5),
  impuls text,
  primary key (user_id, datum)
);

-- Tageskarte (1x pro Tag erzwungen!)
create table tageskarten (
  user_id uuid references profiles(id) on delete cascade,
  datum date default current_date,
  karte text not null,
  deutung text,
  primary key (user_id, datum)
);

-- 3-6-9 Dankbarkeits-Challenge
create table challenge_369 (
  user_id uuid primary key references profiles(id) on delete cascade,
  affirmation text,
  tag int default 0,
  m int default 0, t int default 0, a int default 0,
  letztes_update date
);

-- Briefe an das zukünftige Ich
create table briefe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  inhalt text not null,
  zustellung date not null,
  zugestellt boolean default false,
  created_at timestamptz default now()
);

-- Money-Mind-Notizen
create table money_mind (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  inhalt text not null,
  created_at timestamptz default now()
);

-- Punkte-Log (Lichtpunkte, mit Tageslimits gegen Missbrauch)
create table punkte_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  aktion text not null,
  punkte int not null,
  created_at timestamptz default now()
);

-- Kurswahl (3 Kurse je Paket) & Fortschritt
create table kurs_wahl (
  user_id uuid references profiles(id) on delete cascade,
  kurs text not null,
  fortschritt int default 0,
  primary key (user_id, kurs)
);

-- Termin-Buchungen (Coaching-Sessions)
create table buchungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  start_zeit timestamptz not null,
  status text default 'gebucht' check (status in ('gebucht','verschoben','storniert','erledigt')),
  zoom_link text,
  created_at timestamptz default now()
);

-- Coach-Nachrichten (Text + Voice-URL aus Storage)
create table coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  von text check (von in ('klientin','coach')),
  inhalt text,
  voice_url text,
  gelesen boolean default false,
  created_at timestamptz default now()
);

-- ── RLS: jede Nutzerin nur ihre eigenen Daten (DSGVO) ──
alter table profiles enable row level security;
alter table journal_entries enable row level security;
alter table energie_checks enable row level security;
alter table tageskarten enable row level security;
alter table challenge_369 enable row level security;
alter table briefe enable row level security;
alter table money_mind enable row level security;
alter table punkte_log enable row level security;
alter table kurs_wahl enable row level security;
alter table buchungen enable row level security;
alter table coach_messages enable row level security;

create policy "eigene daten" on profiles for all using (auth.uid() = id);
create policy "eigene daten" on journal_entries for all using (auth.uid() = user_id);
create policy "eigene daten" on energie_checks for all using (auth.uid() = user_id);
create policy "eigene daten" on tageskarten for all using (auth.uid() = user_id);
create policy "eigene daten" on challenge_369 for all using (auth.uid() = user_id);
create policy "eigene daten" on briefe for all using (auth.uid() = user_id);
create policy "eigene daten" on money_mind for all using (auth.uid() = user_id);
create policy "eigene daten" on punkte_log for all using (auth.uid() = user_id);
create policy "eigene daten" on kurs_wahl for all using (auth.uid() = user_id);
create policy "eigene daten" on buchungen for all using (auth.uid() = user_id);
create policy "eigene daten" on coach_messages for all using (auth.uid() = user_id);

-- daily_content ist öffentlich lesbar (kein User-Bezug)
alter table daily_content enable row level security;
create policy "alle lesen" on daily_content for select using (true);

-- DSGVO-Löschrecht: on delete cascade überall → Konto löschen = alles weg ✓
