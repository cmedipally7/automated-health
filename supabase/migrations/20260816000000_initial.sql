create table public.health_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed integer not null default 0,
  status varchar(16) not null default 'draft' check (status in ('draft', 'approved')),
  profile_snapshot jsonb not null,
  targets_snapshot jsonb not null,
  plan_snapshot jsonb not null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meal_plans_user_updated_idx on public.meal_plans(user_id, updated_at desc);

create table public.saved_meals (
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_key text not null,
  meal_name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, meal_key)
);

create table public.grocery_item_states (
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  updated_at timestamptz not null default now(),
  primary key (plan_id, item_key)
);
create index grocery_item_states_user_idx on public.grocery_item_states(user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger health_profiles_set_updated_at before update on public.health_profiles
for each row execute function public.set_updated_at();
create trigger meal_plans_set_updated_at before update on public.meal_plans
for each row execute function public.set_updated_at();
create trigger grocery_item_states_set_updated_at before update on public.grocery_item_states
for each row execute function public.set_updated_at();

alter table public.health_profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.saved_meals enable row level security;
alter table public.grocery_item_states enable row level security;

create policy "profiles belong to their user" on public.health_profiles
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "plans belong to their user" on public.meal_plans
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "saved meals belong to their user" on public.saved_meals
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "grocery state belongs to plan owner" on public.grocery_item_states
for all to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.meal_plans where id = plan_id and user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.meal_plans where id = plan_id and user_id = (select auth.uid()))
);

grant select, insert, update, delete on public.health_profiles to authenticated;
grant select, insert, update, delete on public.meal_plans to authenticated;
grant select, insert, update, delete on public.saved_meals to authenticated;
grant select, insert, update, delete on public.grocery_item_states to authenticated;
