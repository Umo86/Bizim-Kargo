-- ===========================================================================
-- Bizim Kargo — initial schema (0001_init)
--
-- Tables: profiles, carriers, carrier_services, rate_tiers, zone_surcharges,
--         quotes, leads, lead_responses.
-- Every table has row level security enabled; access is granted exclusively
-- through the policies at the bottom of this file. The service-role key
-- (src/lib/supabase/admin.ts) bypasses RLS as usual.
--
-- Conventions: snake_case columns mirror the camelCase fields of the frozen
-- domain contract in src/lib/types.ts. All monetary values are GBP in v1.
-- gen_random_uuid() is built into Postgres 13+ (no extension required).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, created automatically on signup
-- ---------------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'customer'
             check (role in ('customer', 'carrier', 'admin')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user application profile. role drives authorisation: customer | carrier | admin.';

-- Creates a profile whenever a user signs up. The requested role is read from
-- the signup metadata (supabase.auth.signUp({ options: { data: { role } } })).
-- Only customer and carrier are accepted from metadata — admin can never be
-- self-assigned; it is granted manually by an existing admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' in ('customer', 'carrier')
        then new.raw_user_meta_data ->> 'role'
      else 'customer'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- carriers — the public directory of cargo companies
-- ---------------------------------------------------------------------------

create table public.carriers (
  id              uuid primary key default gen_random_uuid(),
  -- null owner_id = platform-seeded demo carrier (see supabase/seed.sql);
  -- real carriers are rows owned by the auth user who manages them.
  owner_id        uuid references auth.users (id) on delete set null,
  slug            text not null unique,
  company_name    text not null,
  blurb           text not null default '',
  base_country    text not null check (base_country in ('GB', 'TR')),
  contact_email   text not null,
  contact_phone   text not null,
  verified        boolean not null default false,
  rating          numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  review_count    integer not null default 0 check (review_count >= 0),
  years_operating integer check (years_operating >= 0),
  logo_url        text,
  created_at      timestamptz not null default now()
);

comment on table public.carriers is
  'Cargo companies listed in the marketplace. Publicly readable directory.';

-- ---------------------------------------------------------------------------
-- carrier_services — one offering per lane per service type
-- (scalar columns mirror CarrierService in src/lib/types.ts; the tiers and
--  zones arrays live in rate_tiers / zone_surcharges)
-- ---------------------------------------------------------------------------

create table public.carrier_services (
  id                 uuid primary key default gen_random_uuid(),
  carrier_id         uuid not null references public.carriers (id) on delete cascade,
  service_type       text not null check (service_type in ('parcel', 'pallet', 'volume', 'vehicle')),
  origin             text not null check (origin in ('GB', 'TR')),
  destination        text not null check (destination in ('GB', 'TR')),
  mode               text not null check (mode in ('road', 'air', 'sea')),
  name               text not null,
  transit_days_min   integer not null check (transit_days_min >= 0),
  transit_days_max   integer not null check (transit_days_max >= 0),
  currency           text not null default 'GBP' check (currency in ('GBP', 'EUR', 'USD')),
  volumetric_divisor numeric not null check (volumetric_divisor > 0),
  min_charge         numeric not null default 0 check (min_charge >= 0),
  fuel_pct           numeric not null default 0 check (fuel_pct >= 0),
  customs_fee        numeric not null default 0 check (customs_fee >= 0),
  collection_fee     numeric not null default 0 check (collection_fee >= 0),
  delivery_fee       numeric not null default 0 check (delivery_fee >= 0),
  residential_fee    numeric not null default 0 check (residential_fee >= 0),
  insurance_pct      numeric not null default 0 check (insurance_pct >= 0),
  insurance_min      numeric not null default 0 check (insurance_min >= 0),
  max_weight_kg      numeric check (max_weight_kg > 0),
  max_dim_cm         numeric check (max_dim_cm > 0),
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  constraint transit_range_valid check (transit_days_min <= transit_days_max)
);

comment on table public.carrier_services is
  'A carrier''s offering on one lane (origin→destination) for one service type.';

-- ---------------------------------------------------------------------------
-- rate_tiers — the priced bands of a service's tariff
-- Bands are half-open (from_qty < q <= to_qty); to_qty null = open-ended.
-- Exactly one of flat_price / price_per_unit is set per band.
-- ---------------------------------------------------------------------------

create table public.rate_tiers (
  id             uuid primary key default gen_random_uuid(),
  service_id     uuid not null references public.carrier_services (id) on delete cascade,
  unit           text not null check (unit in ('kg', 'cbm', 'pallet')),
  from_qty       numeric not null check (from_qty >= 0),
  to_qty         numeric check (to_qty > from_qty),
  flat_price     numeric check (flat_price >= 0),
  price_per_unit numeric check (price_per_unit >= 0),
  sort           integer not null default 0,
  constraint exactly_one_price check (num_nonnulls(flat_price, price_per_unit) = 1)
);

comment on table public.rate_tiers is
  'Tariff bands per service. flat_price = fixed for the band; price_per_unit = charged across the whole quantity.';

-- ---------------------------------------------------------------------------
-- zone_surcharges — per-service zone coverage and flat surcharges
-- ---------------------------------------------------------------------------

create table public.zone_surcharges (
  id         uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.carrier_services (id) on delete cascade,
  zone       text not null check (zone in (
               'GB-MAINLAND', 'GB-HIGHLANDS', 'GB-NI', 'GB-ISLANDS',
               'TR-MARMARA', 'TR-ANKARA', 'TR-AEGEAN', 'TR-MED',
               'TR-CENTRAL', 'TR-BLACKSEA', 'TR-EAST'
             )),
  flat       numeric not null default 0 check (flat >= 0),
  served     boolean not null default true,
  constraint zone_unique_per_service unique (service_id, zone)
);

comment on table public.zone_surcharges is
  'Zone coverage per service: served=false disqualifies the service; flat is added when pickup or delivery falls in the zone.';

-- ---------------------------------------------------------------------------
-- quotes — anonymous quote snapshots (request + computed results as jsonb)
-- ---------------------------------------------------------------------------

create table public.quotes (
  id         uuid primary key default gen_random_uuid(),
  request    jsonb not null,  -- ShipmentRequest
  results    jsonb,           -- QuoteResult[] (null until/unless computed server-side)
  created_at timestamptz not null default now()
);

comment on table public.quotes is
  'Anonymous quote snapshots. No user FK — the unguessable uuid is the retrieval secret.';

-- ---------------------------------------------------------------------------
-- leads — the booking handoff from a quote to a chosen carrier
-- ---------------------------------------------------------------------------

create table public.leads (
  id                uuid primary key default gen_random_uuid(),
  quote_id          uuid references public.quotes (id) on delete set null,
  carrier_id        uuid not null references public.carriers (id) on delete cascade,
  service_id        uuid references public.carrier_services (id) on delete set null,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text not null,
  preferred_contact text not null default 'phone'
                    check (preferred_contact in ('phone', 'email', 'whatsapp')),
  notes             text,
  price_snapshot    jsonb, -- the QuoteResult the customer accepted, frozen at submission
  status            text not null default 'new'
                    check (status in ('new', 'contacted', 'accepted', 'declined', 'completed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.leads is
  'Customer booking requests handed to a carrier. Carriers manage status via their dashboard.';

-- Keeps leads.updated_at accurate on every update (status changes etc.).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lead_responses — carrier replies/counter-offers on a lead
-- ---------------------------------------------------------------------------

create table public.lead_responses (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.leads (id) on delete cascade,
  carrier_id   uuid not null references public.carriers (id) on delete cascade,
  message      text not null,
  quoted_price numeric check (quoted_price >= 0),
  created_at   timestamptz not null default now()
);

comment on table public.lead_responses is
  'Messages/counter-offers a carrier records against a lead.';

-- ---------------------------------------------------------------------------
-- Authorisation helpers
-- All three are SECURITY DEFINER so they can be used inside RLS policies
-- without tripping over the very policies they are evaluating.
-- ---------------------------------------------------------------------------

-- True when the current user's profile has the admin role.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- True when the current user owns the given carrier.
create or replace function public.owns_carrier(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.carriers c
    where c.id = cid and c.owner_id = auth.uid()
  );
$$;

-- True when the current user owns the carrier the given service belongs to.
create or replace function public.owns_service(sid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.carrier_services s
    join public.carriers c on c.id = s.carrier_id
    where s.id = sid and c.owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.carriers        enable row level security;
alter table public.carrier_services enable row level security;
alter table public.rate_tiers      enable row level security;
alter table public.zone_surcharges enable row level security;
alter table public.quotes          enable row level security;
alter table public.leads           enable row level security;
alter table public.lead_responses  enable row level security;

-- ----------------------------------------------------------------- profiles

-- Users can read their own profile (role lookup for the UI).
create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid());

-- Users can insert their own profile row — normally the signup trigger does
-- this, but the policy allows self-repair if the trigger row is ever missing.
create policy "profiles_self_insert" on public.profiles
  for insert with check (id = auth.uid());

-- Users can update their own profile but can never promote themselves to
-- admin — only an existing admin may set role = 'admin'.
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and (role <> 'admin' or public.is_admin()));

-- Admins have unrestricted access to all profiles (role management).
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------- carriers

-- Anyone (including anonymous visitors) can browse the carrier directory.
create policy "carriers_public_select" on public.carriers
  for select using (true);

-- A signed-in carrier user may create a carrier they own; they cannot create
-- rows owned by someone else (or unowned demo rows — those are seeded).
create policy "carriers_owner_insert" on public.carriers
  for insert with check (owner_id = auth.uid());

-- Owners may edit their own carrier and cannot reassign ownership.
-- (verified/rating/review_count are admin-curated by convention in v1.)
create policy "carriers_owner_update" on public.carriers
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Admins have unrestricted access (verify carriers, curate ratings, delete).
create policy "carriers_admin_all" on public.carriers
  for all using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------- carrier_services

-- Services (with their tariffs) are public so the quote engine can price
-- anonymous requests and the directory can show what each carrier offers.
create policy "services_public_select" on public.carrier_services
  for select using (true);

-- Only the owner of the parent carrier may add services to it.
create policy "services_owner_insert" on public.carrier_services
  for insert with check (public.owns_carrier(carrier_id));

-- Only the owner may edit a service; moving it to another carrier is only
-- possible if they own the target carrier too.
create policy "services_owner_update" on public.carrier_services
  for update using (public.owns_carrier(carrier_id))
  with check (public.owns_carrier(carrier_id));

-- Only the owner may delete a service (tiers/zones cascade).
create policy "services_owner_delete" on public.carrier_services
  for delete using (public.owns_carrier(carrier_id));

-- Admins have unrestricted access to services.
create policy "services_admin_all" on public.carrier_services
  for all using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------- rate_tiers

-- Tariff bands are public — required by the anonymous quote engine.
create policy "tiers_public_select" on public.rate_tiers
  for select using (true);

-- Only the carrier owning the parent service may add bands.
create policy "tiers_owner_insert" on public.rate_tiers
  for insert with check (public.owns_service(service_id));

-- Only the owning carrier may edit bands (and only within services they own).
create policy "tiers_owner_update" on public.rate_tiers
  for update using (public.owns_service(service_id))
  with check (public.owns_service(service_id));

-- Only the owning carrier may delete bands.
create policy "tiers_owner_delete" on public.rate_tiers
  for delete using (public.owns_service(service_id));

-- Admins have unrestricted access to tariff bands.
create policy "tiers_admin_all" on public.rate_tiers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------- zone_surcharges

-- Zone coverage is public — required by the anonymous quote engine.
create policy "zones_public_select" on public.zone_surcharges
  for select using (true);

-- Only the carrier owning the parent service may add zone rows.
create policy "zones_owner_insert" on public.zone_surcharges
  for insert with check (public.owns_service(service_id));

-- Only the owning carrier may edit zone rows.
create policy "zones_owner_update" on public.zone_surcharges
  for update using (public.owns_service(service_id))
  with check (public.owns_service(service_id));

-- Only the owning carrier may delete zone rows.
create policy "zones_owner_delete" on public.zone_surcharges
  for delete using (public.owns_service(service_id));

-- Admins have unrestricted access to zone rows.
create policy "zones_admin_all" on public.zone_surcharges
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------- quotes

-- Anyone — including anonymous visitors — may store a quote snapshot.
create policy "quotes_anon_insert" on public.quotes
  for insert with check (true);

-- Quotes are readable by anyone holding the id: the unguessable uuid acts as
-- the retrieval secret (capability URL). No listing endpoint is exposed.
create policy "quotes_select_by_id" on public.quotes
  for select using (true);

-- Admins may update/delete quotes (e.g. GDPR erasure requests).
create policy "quotes_admin_all" on public.quotes
  for all using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------------- leads

-- Anyone — including anonymous customers — may submit a lead to a carrier.
create policy "leads_anon_insert" on public.leads
  for insert with check (true);

-- Only the carrier the lead was sent to may read it (their dashboard inbox).
create policy "leads_carrier_select" on public.leads
  for select using (public.owns_carrier(carrier_id));

-- Only the receiving carrier may update the lead (working the status column);
-- the with check prevents re-pointing the lead at another carrier.
create policy "leads_carrier_update" on public.leads
  for update using (public.owns_carrier(carrier_id))
  with check (public.owns_carrier(carrier_id));

-- Admins have unrestricted access to leads (support and moderation).
create policy "leads_admin_all" on public.leads
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------- lead_responses

-- A carrier may read only the responses recorded under their own carrier.
create policy "lead_responses_carrier_select" on public.lead_responses
  for select using (public.owns_carrier(carrier_id));

-- A carrier may respond only as themselves, and only to a lead that was
-- actually addressed to that same carrier.
create policy "lead_responses_carrier_insert" on public.lead_responses
  for insert with check (
    public.owns_carrier(carrier_id)
    and exists (
      select 1
      from public.leads l
      where l.id = lead_id
        and l.carrier_id = lead_responses.carrier_id
    )
  );

-- Admins have unrestricted access to lead responses.
create policy "lead_responses_admin_all" on public.lead_responses
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Quote engine hot path: fetch active services for a lane + service type.
create index carrier_services_lane_active_idx
  on public.carrier_services (origin, destination, service_type)
  where active;

create index carrier_services_carrier_idx on public.carrier_services (carrier_id);

-- Tariff/zone lookups are always by service.
create index rate_tiers_service_idx on public.rate_tiers (service_id, sort);
create index zone_surcharges_service_idx on public.zone_surcharges (service_id);

-- Carrier dashboard inbox: leads filtered by carrier and status.
create index leads_carrier_status_idx on public.leads (carrier_id, status);
create index leads_quote_idx on public.leads (quote_id);
create index lead_responses_lead_idx on public.lead_responses (lead_id);

-- Owner → carrier resolution on login.
create index carriers_owner_idx on public.carriers (owner_id);
