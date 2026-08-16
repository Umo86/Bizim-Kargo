-- ===========================================================================
-- Bizim Kargo — security hardening + carrier suspension (0002)
--
-- 1. quotes: remove the anon policies. `using (true)` on SELECT let anyone
--    with the public anon key page through the whole table via PostgREST
--    (GET /rest/v1/quotes?select=*), leaking request snapshots wholesale —
--    the "unguessable uuid" was never a real guard at the API layer. The app
--    now reads/writes quotes exclusively through the service-role client
--    (src/lib/data.ts saveQuote/getQuote), which keeps the uuid-as-capability
--    model enforced by trusted server code. Anon INSERT goes too: without the
--    select policy, `insert ... returning id` would fail under RLS anyway.
--    NOTE: SUPABASE_SERVICE_ROLE_KEY is now required for the quote flow in
--    Supabase mode (previously admin-only).
--
-- 2. carriers: verified / rating / review_count are customer-facing trust
--    signals. The owner-update RLS policy is row-scoped only, so a signed-in
--    carrier could PATCH their own row via PostgREST and self-assign the
--    Verified badge or a 5.0 rating. A BEFORE UPDATE trigger makes these
--    columns admin-only regardless of how the update arrives.
--
-- 3. carriers.suspended: suspension used to be modelled by force-toggling
--    every carrier_services.active flag, which destroyed the carrier's own
--    per-service on/off choices on unsuspend. A dedicated column keeps
--    suspension orthogonal to the carrier's service toggles; the quote path
--    (src/lib/data.ts getServicesForLane) filters on it.
-- ===========================================================================

-- ------------------------------------------------------------------- quotes

drop policy if exists "quotes_anon_insert" on public.quotes;
drop policy if exists "quotes_select_by_id" on public.quotes;
-- quotes_admin_all remains; the service-role key bypasses RLS entirely.

-- ----------------------------------------------------------------- carriers

-- Reject any change to the admin-curated trust columns unless the caller is
-- an admin. auth.uid() is null for service-role calls (the admin server
-- actions in src/app/admin/actions.ts), which are trusted server code and
-- stay permitted; any end-user JWT must carry the admin profile role.
create or replace function public.carriers_guard_trust_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.verified is distinct from old.verified
      or new.rating is distinct from old.rating
      or new.review_count is distinct from old.review_count)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'verified, rating and review_count are admin-only';
  end if;
  return new;
end;
$$;

create trigger carriers_guard_trust_columns
  before update on public.carriers
  for each row execute function public.carriers_guard_trust_columns();

-- Admin-managed suspension flag, independent of per-service active toggles.
alter table public.carriers
  add column suspended boolean not null default false;

comment on column public.carriers.suspended is
  'Admin-set: true removes every service of this carrier from quoting without touching the carrier''s own per-service active flags.';
