-- =====================================================================
-- PITU 2.0 · Esquema del document d'estat de l'entrenador
-- Executa'l sencer a Supabase → SQL Editor → New query → Run
-- És idempotent: el pots tornar a executar sense trencar res.
-- =====================================================================

-- Proves oficials. 'general' serveix per a observacions transversals.
do $$ begin
  create type prova_t as enum ('navette','piscina','press_banca','circuit_agilitat','general');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 1. PERFIL — una fila per usuari. El que no canvia en mesos.
-- ---------------------------------------------------------------------
create table if not exists perfil (
  usuari            text primary key,
  edat              int,
  pes_kg            numeric(5,2),
  alcada_cm         int,
  fc_maxima         int,
  fc_repos          int,
  piscina_metres    int     default 25,
  dies_disponibles  text[]  default array['dl','dm','dc','dj','dv','ds'],
  dies_castells     text[]  default array[]::text[],
  material          text[]  default array[]::text[],
  -- objectiu
  data_examen_1     date,
  data_examen_2     date,
  minims            jsonb   default '{}'::jsonb,  -- {"navette": 9, "press_banca": 28, ...}
  fase_actual       text    default 'base',       -- base | intensify | taper
  actualitzat_el    timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 2. MARQUES — historial complet. La marca vigent és la més recent.
-- ---------------------------------------------------------------------
create table if not exists marques (
  id         bigserial primary key,
  usuari     text    not null,
  prova      prova_t not null,
  valor      numeric not null,
  unitat     text    not null,          -- 'sector', 'rep', 'seg', 'm'
  data       date    not null,
  origen     text,                      -- quin FIT o quin test manual ho justifica
  creat_el   timestamptz default now()
);
create index if not exists idx_marques_usuari_prova on marques (usuari, prova, data desc);

-- Marca vigent per prova, per no repetir la subconsulta a tot arreu.
create or replace view v_marca_vigent as
select distinct on (usuari, prova)
       usuari, prova, valor, unitat, data, origen
from   marques
order  by usuari, prova, data desc, id desc;

-- ---------------------------------------------------------------------
-- 3. SESSIONS — una fila per dia de calendari amb WOD.
--    'previst' = el que tocava. 'realitzat' = el que diu el FIT.
-- ---------------------------------------------------------------------
create table if not exists sessions (
  id           bigserial primary key,
  usuari       text    not null,
  data         date    not null,
  prova        prova_t,
  previst      jsonb   default '{}'::jsonb,   -- WOD: sèries, càrregues, ritmes
  realitzat    jsonb   default '{}'::jsonb,   -- resum del FIT: fc, durada, distància
  notes        text,                          -- les teves sensacions
  completada   boolean default false,
  fitxer_fit   text,
  actualitzat_el timestamptz default now(),
  unique (usuari, data)
);
create index if not exists idx_sessions_usuari_data on sessions (usuari, data desc);

-- ---------------------------------------------------------------------
-- 4. ANALISIS — la lectura de l'entrenador sobre una sessió concreta.
-- ---------------------------------------------------------------------
create table if not exists analisis (
  id          bigserial primary key,
  usuari      text not null,
  data_sessio date not null,
  veredicte   text not null,   -- 'compleix' | 'parcial' | 'no_compleix'
  text        text not null,
  creat_el    timestamptz default now()
);
create index if not exists idx_analisis_usuari_data on analisis (usuari, data_sessio desc);

-- ---------------------------------------------------------------------
-- 5. DIARI — la memòria de l'entrenador entre consultes.
--    Això és el que li dona continuïtat i el que fa possible
--    detectar tendències en comptes de reaccionar a l'últim dia.
-- ---------------------------------------------------------------------
create table if not exists diari (
  id          bigserial primary key,
  usuari      text not null,
  prova       prova_t default 'general',
  observacio  text not null,
  que_vigila  text,
  creat_el    timestamptz default now()
);
create index if not exists idx_diari_usuari on diari (usuari, creat_el desc);

-- ---------------------------------------------------------------------
-- 6. AJUSTOS — canvis petits ja aplicats.
--    Serveix també per limitar la freqüència: un per prova cada 14 dies.
-- ---------------------------------------------------------------------
create table if not exists ajustos (
  id          bigserial primary key,
  usuari      text    not null,
  prova       prova_t not null,
  data_sessio date    not null,          -- quin dia del calendari s'ha tocat
  canvis      jsonb   not null,
  motiu       text    not null,
  evidencia   date[]  not null,          -- les dates que ho justifiquen
  aplicat_el  timestamptz default now()
);
create index if not exists idx_ajustos_usuari_prova on ajustos (usuari, prova, aplicat_el desc);

-- ---------------------------------------------------------------------
-- 7. CANVIS PENDENTS — els grans, esperant que els aprovis.
-- ---------------------------------------------------------------------
create table if not exists canvis_pendents (
  id          bigserial primary key,
  usuari      text    not null,
  abast       text    not null,          -- 'setmana' | 'repartiment' | 'fase'
  fase        text,
  canvis      jsonb   not null,
  motiu       text    not null,
  evidencia   date[]  not null,
  estat       text    default 'pendent', -- pendent | aprovat | rebutjat
  creat_el    timestamptz default now(),
  resolt_el   timestamptz
);
create index if not exists idx_canvis_usuari_estat on canvis_pendents (usuari, estat, creat_el desc);

-- ---------------------------------------------------------------------
-- 8. PREGUNTES — les que et deixa pendents i les que has contestat.
-- ---------------------------------------------------------------------
create table if not exists preguntes (
  id          bigserial primary key,
  usuari      text not null,
  text        text not null,
  per_que     text,
  resposta    text,
  creat_el    timestamptz default now(),
  resposta_el timestamptz
);
create index if not exists idx_preguntes_usuari on preguntes (usuari, creat_el desc);

-- =====================================================================
-- RLS
-- =====================================================================
-- L'app s'autentica amb PIN propi, no amb Supabase Auth, així que no hi
-- ha auth.uid() per filtrar. Les polítiques deixen passar la clau anon.
-- El secret que de debò importa (la clau de l'API de Claude) no és aquí:
-- viu dins de l'Edge Function i no surt mai al navegador.
alter table perfil          enable row level security;
alter table marques         enable row level security;
alter table sessions        enable row level security;
alter table analisis        enable row level security;
alter table diari           enable row level security;
alter table ajustos         enable row level security;
alter table canvis_pendents enable row level security;
alter table preguntes       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['perfil','marques','sessions','analisis','diari','ajustos','canvis_pendents','preguntes']
  loop
    execute format('drop policy if exists anon_tot on %I', t);
    execute format('create policy anon_tot on %I for all using (true) with check (true)', t);
  end loop;
end $$;
