-- ════════════════════════════════════════════════════════════════
-- smile2go · Coaching-Intelligenz & Klient-Tracking (PostgreSQL / Supabase)
-- Ergänzt das bestehende Schema (profiles, energie_checks, journal_entries …).
-- Im Supabase SQL-Editor ausführen. Region: EU/Frankfurt.
-- DSGVO: Coachin sieht NUR eigene UND zustimmende Klientinnen (RLS).
-- ════════════════════════════════════════════════════════════════

-- ── Coach ↔ Klientin Zuordnung ──
create table if not exists coach_klient (
  coach_id  uuid references profiles(id) on delete cascade,
  klient_id uuid references profiles(id) on delete cascade,
  status text default 'aktiv' check (status in ('aktiv','pausiert','beendet')),
  created_at timestamptz default now(),
  primary key (coach_id, klient_id)
);

-- ── Einwilligungen (granular · Widerruf jederzeit) ──
create table if not exists einwilligungen (
  user_id uuid primary key references profiles(id) on delete cascade,
  coach_einsicht    boolean default false,  -- darf meine Coachin meinen Verlauf sehen?
  gesundheitsdaten  boolean default false,  -- Energie/Stimmung (Art. 9 DSGVO)
  ki_analyse        boolean default false,  -- KI darf meine Daten analysieren
  updated_at timestamptz default now()
);

-- ── Ziele & Meilensteine ──
create table if not exists ziele (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  titel text not null,
  bereich text,
  warum text,
  faellig date,
  fortschritt int default 0 check (fortschritt between 0 and 100),
  meilen jsonb default '[]',
  created_at timestamptz default now()
);

-- ── Aufgaben (Hausaufgaben zwischen den Sessions) ──
create table if not exists aufgaben (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  titel text not null,
  von text default 'coach' check (von in ('coach','ich')),
  erledigt boolean default false,
  faellig text,
  created_at timestamptz default now()
);

-- ── Aktivitäts-Ereignisse (Signal-Rohdaten für die Analyse) ──
create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  typ text not null,          -- login | tageskarte | journal | energie | aufgabe_erledigt | meditation …
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- ── Wöchentliche KI-Reports (Coach-Briefing) ──
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  coach_id  uuid references profiles(id) on delete cascade,
  klient_id uuid references profiles(id) on delete cascade,
  woche date not null,
  index int,
  warnungen jsonb default '[]',
  inhalt text,                -- von der KI generierte Zusammenfassung
  created_at timestamptz default now()
);

-- ════════════════════════════════════════════════════════════════
-- Wohlbefindens-Index als View (aggregiert, KEINE Rohtexte an die Coachin)
-- Nur die letzten 30 Tage; berechnet aus Energie, Aktivität, Aufgaben.
-- ════════════════════════════════════════════════════════════════
create or replace view v_wohlbefinden as
select
  p.id as user_id,
  coalesce(p.streak, 0)                                            as streak,
  (select round(avg(wert)) from energie_checks e
     where e.user_id = p.id and e.datum > current_date - 30)       as energie_schnitt,
  (select count(*) from journal_entries j
     where j.user_id = p.id and j.datum > current_date - 30)       as journal_30d,
  (select count(*) from aufgaben a
     where a.user_id = p.id and a.erledigt = false)                as offene_aufgaben
from profiles p;

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
alter table coach_klient     enable row level security;
alter table einwilligungen   enable row level security;
alter table ziele            enable row level security;
alter table aufgaben         enable row level security;
alter table activity_events  enable row level security;
alter table reports          enable row level security;

-- Hilfsfunktion: darf auth.uid() (Coach) diese Klientin sehen?
create or replace function darf_coach_sehen(klient uuid) returns boolean as $$
  select exists (
    select 1 from coach_klient ck
    join einwilligungen ew on ew.user_id = ck.klient_id
    where ck.coach_id = auth.uid()
      and ck.klient_id = klient
      and ck.status = 'aktiv'
      and ew.coach_einsicht = true
  );
$$ language sql security definer stable;

-- Klientin: eigene Daten
create policy "eigene ziele"      on ziele           for all using (auth.uid() = user_id);
create policy "eigene aufgaben"   on aufgaben        for all using (auth.uid() = user_id);
create policy "eigene events"     on activity_events for all using (auth.uid() = user_id);
create policy "eigene einwilligung" on einwilligungen for all using (auth.uid() = user_id);

-- Coach: nur zustimmende, zugeordnete Klientinnen (nur lesen)
create policy "coach liest ziele"    on ziele           for select using (darf_coach_sehen(user_id));
create policy "coach liest aufgaben" on aufgaben        for select using (darf_coach_sehen(user_id));
create policy "coach liest reports"  on reports         for select using (auth.uid() = coach_id);

-- coach_klient: beide Beteiligten sehen ihre Verknüpfung
create policy "eigene verknuepfung" on coach_klient for all
  using (auth.uid() = coach_id or auth.uid() = klient_id);

-- ── Hinweis: Rohtexte (journal_entries.items) werden NIE an die Coachin
--    exponiert — die Coachin sieht nur Index, Warnungen und den KI-Report.
