-- Epic 5: Granular Budgeting & Procurement

create table public.cost_items (
    id uuid primary key default gen_random_uuid(),
    task_id uuid not null references public.tasks (id) on delete cascade,
    name text not null check (char_length(trim(name)) > 0),
    cost_type text not null default 'MATERIAL'
        check (cost_type in ('MATERIAL', 'TOOL', 'CONTRACTOR', 'OTHER')),
    store_url text check (store_url is null or store_url ~* '^https?://'),
    estimated_cost numeric(10, 2) not null default 0 check (estimated_cost >= 0),
    actual_cost numeric(10, 2) check (actual_cost is null or actual_cost >= 0),
    is_purchased boolean not null default false,
    created_at timestamptz not null default now()
);

create index idx_cost_items_task on public.cost_items (task_id);

-- TODO: enable RLS with policies once Supabase Auth is added.
alter table public.cost_items disable row level security;

grant select, insert, update, delete on public.cost_items to anon, authenticated;
