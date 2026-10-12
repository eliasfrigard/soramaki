-- Epic 6: Time Budgeting

alter table public.tasks
    add column estimated_minutes int check (estimated_minutes is null or estimated_minutes >= 0),
    add column actual_minutes int check (actual_minutes is null or actual_minutes >= 0);
