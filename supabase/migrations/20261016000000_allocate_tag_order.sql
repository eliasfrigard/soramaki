begin;

lock table public.locations, public.categories in access exclusive mode;

create sequence public.locations_sort_order_seq as integer increment by 10;
create sequence public.categories_sort_order_seq as integer increment by 10;

select setval('public.locations_sort_order_seq',
    greatest(coalesce((select max(sort_order) from public.locations), 0) + 10, 1), false);
select setval('public.categories_sort_order_seq',
    greatest(coalesce((select max(sort_order) from public.categories), 0) + 10, 1), false);

alter sequence public.locations_sort_order_seq owned by public.locations.sort_order;
alter sequence public.categories_sort_order_seq owned by public.categories.sort_order;

alter table public.locations alter column sort_order
    set default nextval('public.locations_sort_order_seq');
alter table public.categories alter column sort_order
    set default nextval('public.categories_sort_order_seq');

grant usage on sequence public.locations_sort_order_seq, public.categories_sort_order_seq
    to anon, authenticated;

commit;
