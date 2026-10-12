-- Epic 1: Task Lifecycle & Ownership

create type public.task_priority as enum ('NEXT', 'SOON', 'LATER', 'MAYBE');
create type public.task_status as enum ('BACKLOG', 'IN_PROGRESS', 'DONE');

create table public.tasks (
    id uuid primary key default gen_random_uuid(),
    title varchar(255) not null check (char_length(trim(title)) > 0),
    description text,
    status public.task_status not null default 'BACKLOG',
    priority public.task_priority not null default 'NEXT',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz
);

create index idx_tasks_status on public.tasks (status);
create index idx_tasks_priority on public.tasks (priority);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- TODO: enable RLS with policies once Supabase Auth is added.
alter table public.tasks disable row level security;

grant select, insert, update, delete on public.tasks to anon, authenticated;
