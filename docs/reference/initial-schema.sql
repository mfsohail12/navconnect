-- NavConnect demo: shared state for the patient app (/) and the staff dashboard (/staff-dashboard).
-- Static data (languages, destinations, routes, map) stays in the Next.js code.
-- Reads and realtime subscriptions use the public (anon) key; all writes go through
-- Next.js Server Actions using the service role key.

------------------------------------------------------------
-- Tables
------------------------------------------------------------

create table public.closures (
  key text primary key,                       -- 'cElev' | 'aWing'
  label text not null,
  description text not null,
  affects text[] not null default '{}',       -- destination ids, e.g. {'card','dial'}
  is_closed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,                    -- random id stored in each phone's localStorage
  reason text not null
    check (reason in ('lost', 'wheelchair', 'interpreter', 'other', 'escort')),
  lang text not null default 'en',
  location text not null,
  destination text,                           -- destination id, if the visitor was navigating
  escort_for text references public.closures (key),  -- set when the request came from a closure
  note text,
  status text not null default 'open'
    check (status in ('open', 'assigned', 'done')),
  volunteer text,
  created_at timestamptz not null default now(),
  assigned_at timestamptz
);
create index help_requests_client_id_idx on public.help_requests (client_id);
create index help_requests_status_idx on public.help_requests (status, created_at desc);

create table public.activity (
  id bigint generated always as identity primary key,
  message text not null,
  created_at timestamptz not null default now()
);
create index activity_created_at_idx on public.activity (created_at desc);

create table public.destination_counts (
  destination text primary key,
  count integer not null default 0
);

create table public.demo_stats (
  key text primary key,                       -- 'arrivals_today' | 'median_minutes'
  value numeric not null
);

------------------------------------------------------------
-- Access: anyone can read, only the server (service_role) can write
------------------------------------------------------------

alter table public.closures enable row level security;
alter table public.help_requests enable row level security;
alter table public.activity enable row level security;
alter table public.destination_counts enable row level security;
alter table public.demo_stats enable row level security;

create policy "Demo data is readable by everyone" on public.closures
  for select to anon, authenticated using (true);
create policy "Demo data is readable by everyone" on public.help_requests
  for select to anon, authenticated using (true);
create policy "Demo data is readable by everyone" on public.activity
  for select to anon, authenticated using (true);
create policy "Demo data is readable by everyone" on public.destination_counts
  for select to anon, authenticated using (true);
create policy "Demo data is readable by everyone" on public.demo_stats
  for select to anon, authenticated using (true);

grant select on
  public.closures, public.help_requests, public.activity,
  public.destination_counts, public.demo_stats
  to anon, authenticated;

grant all on
  public.closures, public.help_requests, public.activity,
  public.destination_counts, public.demo_stats
  to service_role;
grant usage, select on all sequences in schema public to service_role;

------------------------------------------------------------
-- Realtime
------------------------------------------------------------

-- Full row data on UPDATE/DELETE events (tables are tiny, so the cost is negligible).
alter table public.closures replica identity full;
alter table public.help_requests replica identity full;
alter table public.activity replica identity full;
alter table public.destination_counts replica identity full;
alter table public.demo_stats replica identity full;

alter publication supabase_realtime add table
  public.closures, public.help_requests, public.activity,
  public.destination_counts, public.demo_stats;

------------------------------------------------------------
-- Functions (server-only)
------------------------------------------------------------

-- Atomically count an arrival.
create or replace function public.record_arrival(p_destination text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.destination_counts (destination, count)
  values (p_destination, 1)
  on conflict (destination) do update
    set count = public.destination_counts.count + 1;

  update public.demo_stats
    set value = value + 1
    where key = 'arrivals_today';
$$;

-- Restore the demo to its starting state. Run before every pitch.
create or replace function public.reset_demo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.help_requests where true;
  delete from public.activity where true;
  delete from public.destination_counts where true;
  delete from public.demo_stats where true;

  insert into public.closures (key, label, description, affects, is_closed)
  values
    ('cElev', 'Purple Elevator · C Wing',
     'Affects Cardiology (Floor 7) and Dialysis (Floor 8). Visitors choose a detour via the Grey Elevator (A Wing) or a volunteer escort.',
     array['card', 'dial'], false),
    ('aWing', 'A Wing hallway',
     'Affects Diagnostic Imaging (X-ray, ultrasound, CT). Visitors choose a detour through the Food Court and F Wing or a volunteer escort.',
     array['img'], false)
  on conflict (key) do update
    set label = excluded.label,
        description = excluded.description,
        affects = excluded.affects,
        is_closed = false,
        updated_at = now();

  insert into public.help_requests
    (client_id, reason, lang, location, note, status, volunteer, created_at, assigned_at)
  values
    ('seed-1', 'wheelchair', 'en', 'Main lobby', null, 'open', null,
     now() - interval '2 minutes', null),
    ('seed-2', 'lost', 'pa', 'A Wing hallway, Blue Elevator', 'Looking for MRI', 'assigned', 'Daniel O.',
     now() - interval '9 minutes', now() - interval '7 minutes');

  insert into public.destination_counts (destination, count)
  values ('img', 96), ('dial', 61), ('cancer', 58), ('mri', 44), ('card', 37);

  insert into public.demo_stats (key, value)
  values ('arrivals_today', 412), ('median_minutes', 5.8);

  insert into public.activity (message, created_at)
  values
    ('Daniel O. assigned to a visitor at the Blue Elevator (Punjabi speaker).', now() - interval '22 minutes'),
    ('14 visitors navigated to Diagnostic Imaging in the last hour.', now() - interval '6 minutes');
end;
$$;

-- New functions in public are executable by anon by default; lock these to the server.
revoke execute on function public.record_arrival(text) from public, anon, authenticated;
revoke execute on function public.reset_demo() from public, anon, authenticated;
grant execute on function public.record_arrival(text) to service_role;
grant execute on function public.reset_demo() to service_role;

-- Seed the demo.
select public.reset_demo();