-- Epic 2: Locations & Categories

create table public.locations (
    id uuid primary key default gen_random_uuid(),
    name text not null unique check (char_length(trim(name)) > 0),
    icon text,
    sort_order int not null default 0
);

create table public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique check (char_length(trim(name)) > 0),
    icon text,
    sort_order int not null default 0
);

alter table public.tasks
    add column location_id uuid references public.locations (id) on delete set null,
    add column category_id uuid references public.categories (id) on delete set null;

create index idx_tasks_location on public.tasks (location_id);
create index idx_tasks_category on public.tasks (category_id);

-- TODO: enable RLS with policies once Supabase Auth is added.
alter table public.locations disable row level security;
alter table public.categories disable row level security;

grant select, insert, update, delete on public.locations to anon, authenticated;
grant select, insert, update, delete on public.categories to anon, authenticated;

insert into public.locations (name, icon, sort_order) values
    ('Yläkerta',   '🛏️', 10),
    ('Makuuhuone', '🛏️', 20),
    ('Keittiö',    '🍳', 30),
    ('Etukuisti',  '🚪', 40),
    ('Takakuisti', '🌿', 50),
    ('Studio',     '🎸', 60),
    ('Verstas',    '🔨', 70),
    ('Aitta',      '🏚️', 80),
    ('Sauna',      '🧖‍♂️', 90),
    ('Piha',       '🌳', 100)
on conflict (name) do nothing;

insert into public.categories (name, icon, sort_order) values
    ('Purchase',     '🛒', 10),
    ('Construction', '🏗️', 20),
    ('Maintenance',  '🔧', 30),
    ('Cleaning',     '🧹', 40)
on conflict (name) do nothing;
