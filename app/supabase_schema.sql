-- smile2go · Supabase Schema (Backend)
-- Ausführen im Supabase SQL Editor. Aktiviert Row-Level-Security (DSGVO: jede Nutzerin
-- sieht nur ihre eigenen Daten). Voraussetzung: Supabase Auth (E-Mail) ist aktiv.

-- 1) PROFILE
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  pseudonym     text,
  is_anonymous  boolean default false,
  role          text default 'client' check (role in ('client','coach','admin')),
  locale        text default 'de',
  onboarded_at  timestamptz,
  created_at    timestamptz default now()
);

-- 2) ENERGIE / LICHTPUNKTE
create table if not exists energy_ledger (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  points      int  not null,
  reason      text not null,
  created_at  timestamptz default now()
);
create index if not exists energy_user_idx on energy_ledger(user_id, created_at desc);
create or replace view energy_balance as
  select user_id, coalesce(sum(points),0) as lichtpunkte
  from energy_ledger group by user_id;

-- 3) TAGEBUCH · DANKBARKEIT · ZUKUNFTSBRIEF
create table if not exists journal_entries (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'tagebuch'
              check (kind in ('tagebuch','dankbarkeit','intention','brief')),
  mood        int check (mood between 1 and 5),
  body        text,
  deliver_at  timestamptz,
  created_at  timestamptz default now()
);
create index if not exists journal_user_idx on journal_entries(user_id, created_at desc);

-- 4) ORAKEL
create table if not exists oracle_cards (
  id        bigint generated always as identity primary key,
  slug      text unique not null,
  name      text not null,
  subtitle  text,
  message   text,
  image_url text,
  deck      text default 'basis',
  is_premium boolean default false
);
create table if not exists oracle_draws (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  card_id   bigint references oracle_cards(id),
  drawn_on  date default current_date,
  created_at timestamptz default now(),
  unique (user_id, drawn_on)
);

-- 5) INHALTE: MEDITATION · PODCAST · AUDIO
create table if not exists media_library (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('meditation','podcast','affirmation','sleepstory','sound')),
  title      text not null,
  duration_s int,
  audio_url  text,
  cover_url  text,
  is_premium boolean default false,
  created_at timestamptz default now()
);
create table if not exists media_progress (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  media_id    bigint references media_library(id) on delete cascade,
  position_s  int default 0,
  completed   boolean default false,
  updated_at  timestamptz default now(),
  unique (user_id, media_id)
);

-- 6) SHOP / DIGITALE PRODUKTE
create table if not exists products (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  title       text not null,
  kind        text check (kind in ('journal','meditation_pack','kartendeck','kurs')),
  price_cents int not null,
  currency    text default 'EUR',
  asset_url   text,
  is_active   boolean default true
);
create table if not exists purchases (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  product_id    bigint references products(id),
  provider      text,
  provider_ref  text,
  amount_cents  int,
  status        text default 'pending' check (status in ('pending','paid','refunded','failed')),
  invoice_no    text,
  created_at    timestamptz default now()
);

-- ROW LEVEL SECURITY (DSGVO)
alter table profiles        enable row level security;
alter table energy_ledger   enable row level security;
alter table journal_entries enable row level security;
alter table oracle_draws    enable row level security;
alter table media_progress  enable row level security;
alter table purchases       enable row level security;
create policy own_profile   on profiles        for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy own_energy    on energy_ledger   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_journal   on journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_draws     on oracle_draws    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_progress  on media_progress  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_purchases on purchases       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table oracle_cards  enable row level security;
alter table media_library enable row level security;
alter table products      enable row level security;
create policy read_cards    on oracle_cards  for select using (true);
create policy read_media    on media_library for select using (true);
create policy read_products on products      for select using (true);

-- SEED
insert into oracle_cards (slug,name,subtitle,message,image_url,deck) values
  ('saraswati','Saraswati','Göttin der Erkenntnis · Klarheit','Weisheit fließt wie Wasser zu dir. Hör auf die leise Stimme deiner Erkenntnis.','/media/img/orakel.png','basis'),
  ('neubeginn','Neubeginn','Neuanfang · Loslassen','Heute darf etwas Altes gehen, damit Neues Platz findet.','/media/img/orakel.png','basis')
on conflict (slug) do nothing;
insert into media_library (kind,title,duration_s,audio_url,cover_url) values
  ('meditation','Ankommen bei dir',35,'/media/audio/meditation.wav','/media/img/meditation.png'),
  ('podcast','Willkommen zurück',6,'/media/audio/podcast.wav','/media/img/podcast.png')
on conflict do nothing;
insert into products (slug,title,kind,price_cents) values
  ('journal-30','30-Tage Journal','journal',900),
  ('meditations-paket','Meditations-Paket','meditation_pack',2400),
  ('ritual-deck','Ritual-Kartendeck','kartendeck',3200)
on conflict (slug) do nothing;
