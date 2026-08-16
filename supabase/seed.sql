-- ===========================================================================
-- Bizim Kargo — demo seed data
--
-- GENERATED from src/lib/demo-data.ts — the uuids here are fixed and MUST
-- stay identical to that file so the in-memory fallback and the database
-- return the same carriers. Edit demo-data.ts, then regenerate this file.
--
-- Idempotent: the demo carriers are deleted first; carrier_services,
-- rate_tiers, zone_surcharges (and any demo leads) cascade with them.
-- ===========================================================================

begin;

delete from public.carriers where id in (
  'c1000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000002',
  'c1000000-0000-4000-8000-000000000003',
  'c1000000-0000-4000-8000-000000000004',
  'c1000000-0000-4000-8000-000000000005'
);

-- ---------------------------------------------------------------------------
-- Carriers (owner_id null = platform-seeded demo carrier, not user-managed)
-- ---------------------------------------------------------------------------
insert into public.carriers
  (id, owner_id, slug, company_name, blurb, base_country, contact_email, contact_phone, verified, rating, review_count, years_operating, logo_url)
values
  ('c1000000-0000-4000-8000-000000000001', null, 'anadolu-express-cargo', 'Anadolu Express Cargo', 'Weekly road departures between London and Istanbul with door-to-door delivery across every Turkish province, plus a three-day air express option for urgent parcels. Turkish domestic distribution from our Istanbul hub.', 'TR', 'bookings@anadoluexpress.example.com', '+90 212 555 04 12', true, 4.7, 214, 12, null),
  ('c1000000-0000-4000-8000-000000000002', null, 'thames-bosphorus-logistics', 'Thames & Bosphorus Logistics', 'Full-service UK–Turkey freight forwarder: weekly groupage trailers, palletised freight, economical sea freight for household moves, and fully insured covered vehicle transport in both directions.', 'GB', 'quotes@thamesbosphorus.example.co.uk', '+44 20 7946 0810', true, 4.9, 156, 18, null),
  ('c1000000-0000-4000-8000-000000000003', null, 'marmara-vanlines', 'Marmara Vanlines', 'Owner-driven van fleet running fortnightly between the UK and the Marmara region. Friendly, flexible part-load removals and parcel service at keen prices — ideal for students and family moves.', 'TR', 'info@marmaravanlines.example.com', '+90 216 555 07 43', true, 4.4, 89, 7, null),
  ('c1000000-0000-4000-8000-000000000004', null, 'pennine-freight-bridge', 'Pennine Freight Bridge', 'Yorkshire-based pallet specialist with a weekly UK–Turkey pallet line and same-week UK domestic man-and-van and parcel services. Forklift collection and tail-lift delivery available nationwide.', 'GB', 'ops@penninefreightbridge.example.co.uk', '+44 113 496 0522', true, 4.2, 47, 5, null),
  ('c1000000-0000-4000-8000-000000000005', null, 'lale-removals', 'Lale Removals', 'Family-run removals firm newly listed on Bizim Kargo. Careful, budget-friendly van loads and parcels between Britain and western Turkey — every job is handled personally by the owners.', 'GB', 'hello@laleremovals.example.co.uk', '+44 20 7946 0333', false, 0, 0, 2, null);

-- ---------------------------------------------------------------------------
-- Anadolu Express Cargo
-- ---------------------------------------------------------------------------

-- UK → Turkey Road Parcel (parcel, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000101', 'c1000000-0000-4000-8000-000000000001', 'parcel', 'GB', 'TR', 'road', 'UK → Turkey Road Parcel', 7, 12, 'GBP', 3000, 45, 0.12, 35, 10, 0, 0, 0.02, 10, 300, 200, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000101', 'kg', 0, 10, 72, null, 0),
  ('5e100000-0000-4000-8000-000000000101', 'kg', 10, 30, null, 5.6, 1),
  ('5e100000-0000-4000-8000-000000000101', 'kg', 30, 300, null, 4.2, 2);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000101', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000101', 'GB-HIGHLANDS', 25, true),
  ('5e100000-0000-4000-8000-000000000101', 'GB-NI', 20, true),
  ('5e100000-0000-4000-8000-000000000101', 'GB-ISLANDS', 35, true),
  ('5e100000-0000-4000-8000-000000000101', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000101', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000101', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000101', 'TR-MED', 10, true),
  ('5e100000-0000-4000-8000-000000000101', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000101', 'TR-BLACKSEA', 18, true),
  ('5e100000-0000-4000-8000-000000000101', 'TR-EAST', 25, true);

-- Turkey → UK Road Parcel (parcel, TR -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000102', 'c1000000-0000-4000-8000-000000000001', 'parcel', 'TR', 'GB', 'road', 'Turkey → UK Road Parcel', 7, 13, 'GBP', 3000, 45, 0.12, 35, 10, 0, 0, 0.02, 10, 300, 200, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000102', 'kg', 0, 10, 75, null, 0),
  ('5e100000-0000-4000-8000-000000000102', 'kg', 10, 30, null, 5.8, 1),
  ('5e100000-0000-4000-8000-000000000102', 'kg', 30, 300, null, 4.4, 2);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000102', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000102', 'GB-HIGHLANDS', 25, true),
  ('5e100000-0000-4000-8000-000000000102', 'GB-NI', 20, true),
  ('5e100000-0000-4000-8000-000000000102', 'GB-ISLANDS', 35, true),
  ('5e100000-0000-4000-8000-000000000102', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000102', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000102', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000102', 'TR-MED', 10, true),
  ('5e100000-0000-4000-8000-000000000102', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000102', 'TR-BLACKSEA', 18, true),
  ('5e100000-0000-4000-8000-000000000102', 'TR-EAST', 25, true);

-- UK → Turkey Air Express (parcel, GB -> TR, air)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000103', 'c1000000-0000-4000-8000-000000000001', 'parcel', 'GB', 'TR', 'air', 'UK → Turkey Air Express', 3, 5, 'GBP', 5000, 55, 0.15, 40, 12, 0, 5, 0.025, 12, 150, 150, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000103', 'kg', 0, 10, 95, null, 0),
  ('5e100000-0000-4000-8000-000000000103', 'kg', 10, 150, null, 8, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000103', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000103', 'GB-HIGHLANDS', 30, true),
  ('5e100000-0000-4000-8000-000000000103', 'GB-NI', 25, true),
  ('5e100000-0000-4000-8000-000000000103', 'GB-ISLANDS', 40, true),
  ('5e100000-0000-4000-8000-000000000103', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000103', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000103', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000103', 'TR-MED', 0, true),
  ('5e100000-0000-4000-8000-000000000103', 'TR-CENTRAL', 10, true),
  ('5e100000-0000-4000-8000-000000000103', 'TR-BLACKSEA', 15, true),
  ('5e100000-0000-4000-8000-000000000103', 'TR-EAST', 30, true);

-- Turkey Domestic Parcel (parcel, TR -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000104', 'c1000000-0000-4000-8000-000000000001', 'parcel', 'TR', 'TR', 'road', 'Turkey Domestic Parcel', 1, 3, 'GBP', 3000, 15, 0.1, 0, 0, 0, 0, 0.015, 7.5, 300, 200, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000104', 'kg', 0, 10, 18, null, 0),
  ('5e100000-0000-4000-8000-000000000104', 'kg', 10, 30, null, 1.2, 1),
  ('5e100000-0000-4000-8000-000000000104', 'kg', 30, 300, null, 0.9, 2);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000104', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000104', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000104', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000104', 'TR-MED', 0, true),
  ('5e100000-0000-4000-8000-000000000104', 'TR-CENTRAL', 5, true),
  ('5e100000-0000-4000-8000-000000000104', 'TR-BLACKSEA', 8, true),
  ('5e100000-0000-4000-8000-000000000104', 'TR-EAST', 12, true);

-- ---------------------------------------------------------------------------
-- Thames & Bosphorus Logistics
-- ---------------------------------------------------------------------------

-- UK → Turkey Road Groupage (volume, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000201', 'c1000000-0000-4000-8000-000000000002', 'volume', 'GB', 'TR', 'road', 'UK → Turkey Road Groupage', 10, 18, 'GBP', 3000, 120, 0.12, 45, 15, 15, 10, 0.025, 15, 2500, 400, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000201', 'cbm', 0, 1, 140, null, 0),
  ('5e100000-0000-4000-8000-000000000201', 'cbm', 1, null, null, 125, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000201', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000201', 'GB-HIGHLANDS', 30, true),
  ('5e100000-0000-4000-8000-000000000201', 'GB-NI', 25, true),
  ('5e100000-0000-4000-8000-000000000201', 'GB-ISLANDS', 40, true),
  ('5e100000-0000-4000-8000-000000000201', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000201', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000201', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000201', 'TR-MED', 12, true),
  ('5e100000-0000-4000-8000-000000000201', 'TR-CENTRAL', 15, true),
  ('5e100000-0000-4000-8000-000000000201', 'TR-BLACKSEA', 20, true),
  ('5e100000-0000-4000-8000-000000000201', 'TR-EAST', 30, true);

-- Turkey → UK Road Groupage (volume, TR -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000202', 'c1000000-0000-4000-8000-000000000002', 'volume', 'TR', 'GB', 'road', 'Turkey → UK Road Groupage', 10, 21, 'GBP', 3000, 120, 0.12, 45, 15, 15, 10, 0.025, 15, 2500, 400, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000202', 'cbm', 0, 1, 135, null, 0),
  ('5e100000-0000-4000-8000-000000000202', 'cbm', 1, null, null, 118, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000202', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000202', 'GB-HIGHLANDS', 30, true),
  ('5e100000-0000-4000-8000-000000000202', 'GB-NI', 25, true),
  ('5e100000-0000-4000-8000-000000000202', 'GB-ISLANDS', 40, true),
  ('5e100000-0000-4000-8000-000000000202', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000202', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000202', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000202', 'TR-MED', 12, true),
  ('5e100000-0000-4000-8000-000000000202', 'TR-CENTRAL', 15, true),
  ('5e100000-0000-4000-8000-000000000202', 'TR-BLACKSEA', 20, true),
  ('5e100000-0000-4000-8000-000000000202', 'TR-EAST', 30, true);

-- UK → Turkey Sea Freight (volume, GB -> TR, sea)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000203', 'c1000000-0000-4000-8000-000000000002', 'volume', 'GB', 'TR', 'sea', 'UK → Turkey Sea Freight', 28, 42, 'GBP', 1000, 95, 0.1, 45, 15, 15, 10, 0.02, 15, 5000, 500, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000203', 'cbm', 0, 1, 95, null, 0),
  ('5e100000-0000-4000-8000-000000000203', 'cbm', 1, null, null, 78, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000203', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000203', 'GB-HIGHLANDS', 30, true),
  ('5e100000-0000-4000-8000-000000000203', 'GB-NI', 25, true),
  ('5e100000-0000-4000-8000-000000000203', 'GB-ISLANDS', 40, true),
  ('5e100000-0000-4000-8000-000000000203', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000203', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000203', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000203', 'TR-MED', 12, true),
  ('5e100000-0000-4000-8000-000000000203', 'TR-CENTRAL', 15, true),
  ('5e100000-0000-4000-8000-000000000203', 'TR-BLACKSEA', 22, true),
  ('5e100000-0000-4000-8000-000000000203', 'TR-EAST', 35, true);

-- UK → Turkey Pallet Service (pallet, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000204', 'c1000000-0000-4000-8000-000000000002', 'pallet', 'GB', 'TR', 'road', 'UK → Turkey Pallet Service', 8, 14, 'GBP', 3000, 195, 0.12, 45, 0, 0, 10, 0.02, 15, 3000, 240, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000204', 'pallet', 0, 1, 240, null, 0),
  ('5e100000-0000-4000-8000-000000000204', 'pallet', 1, 2, 400, null, 1),
  ('5e100000-0000-4000-8000-000000000204', 'pallet', 2, 3, 545, null, 2),
  ('5e100000-0000-4000-8000-000000000204', 'pallet', 3, null, null, 165, 3);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000204', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000204', 'GB-HIGHLANDS', 35, true),
  ('5e100000-0000-4000-8000-000000000204', 'GB-NI', 30, true),
  ('5e100000-0000-4000-8000-000000000204', 'GB-ISLANDS', 40, true),
  ('5e100000-0000-4000-8000-000000000204', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000204', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000204', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000204', 'TR-MED', 12, true),
  ('5e100000-0000-4000-8000-000000000204', 'TR-CENTRAL', 15, true),
  ('5e100000-0000-4000-8000-000000000204', 'TR-BLACKSEA', 20, true),
  ('5e100000-0000-4000-8000-000000000204', 'TR-EAST', 30, true);

-- Turkey → UK Pallet Service (pallet, TR -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000205', 'c1000000-0000-4000-8000-000000000002', 'pallet', 'TR', 'GB', 'road', 'Turkey → UK Pallet Service', 9, 15, 'GBP', 3000, 190, 0.12, 45, 0, 0, 10, 0.02, 15, 3000, 240, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000205', 'pallet', 0, 1, 230, null, 0),
  ('5e100000-0000-4000-8000-000000000205', 'pallet', 1, 2, 385, null, 1),
  ('5e100000-0000-4000-8000-000000000205', 'pallet', 2, 3, 525, null, 2),
  ('5e100000-0000-4000-8000-000000000205', 'pallet', 3, null, null, 160, 3);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000205', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000205', 'GB-HIGHLANDS', 35, true),
  ('5e100000-0000-4000-8000-000000000205', 'GB-NI', 30, true),
  ('5e100000-0000-4000-8000-000000000205', 'GB-ISLANDS', 40, true),
  ('5e100000-0000-4000-8000-000000000205', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000205', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000205', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000205', 'TR-MED', 12, true),
  ('5e100000-0000-4000-8000-000000000205', 'TR-CENTRAL', 15, true),
  ('5e100000-0000-4000-8000-000000000205', 'TR-BLACKSEA', 20, true),
  ('5e100000-0000-4000-8000-000000000205', 'TR-EAST', 30, true);

-- UK → Turkey Vehicle Transport (vehicle, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000206', 'c1000000-0000-4000-8000-000000000002', 'vehicle', 'GB', 'TR', 'road', 'UK → Turkey Vehicle Transport', 10, 16, 'GBP', 3000, 850, 0.12, 0, 0, 0, 0, 0.02, 15, null, null, true);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000206', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000206', 'GB-HIGHLANDS', 40, true),
  ('5e100000-0000-4000-8000-000000000206', 'GB-NI', 40, true),
  ('5e100000-0000-4000-8000-000000000206', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000206', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000206', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000206', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000206', 'TR-MED', 0, true),
  ('5e100000-0000-4000-8000-000000000206', 'TR-CENTRAL', 0, true),
  ('5e100000-0000-4000-8000-000000000206', 'TR-BLACKSEA', 0, true),
  ('5e100000-0000-4000-8000-000000000206', 'TR-EAST', 0, false);

-- Turkey → UK Vehicle Transport (vehicle, TR -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000207', 'c1000000-0000-4000-8000-000000000002', 'vehicle', 'TR', 'GB', 'road', 'Turkey → UK Vehicle Transport', 10, 16, 'GBP', 3000, 850, 0.12, 0, 0, 0, 0, 0.02, 15, null, null, true);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000207', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000207', 'GB-HIGHLANDS', 40, true),
  ('5e100000-0000-4000-8000-000000000207', 'GB-NI', 40, true),
  ('5e100000-0000-4000-8000-000000000207', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000207', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000207', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000207', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000207', 'TR-MED', 0, true),
  ('5e100000-0000-4000-8000-000000000207', 'TR-CENTRAL', 0, true),
  ('5e100000-0000-4000-8000-000000000207', 'TR-BLACKSEA', 0, true),
  ('5e100000-0000-4000-8000-000000000207', 'TR-EAST', 0, false);

-- ---------------------------------------------------------------------------
-- Marmara Vanlines
-- ---------------------------------------------------------------------------

-- UK → Turkey Economy Parcel (parcel, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000301', 'c1000000-0000-4000-8000-000000000003', 'parcel', 'GB', 'TR', 'road', 'UK → Turkey Economy Parcel', 8, 14, 'GBP', 3000, 40, 0.1, 28, 8, 0, 5, 0.02, 9, 300, 180, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000301', 'kg', 0, 10, 65, null, 0),
  ('5e100000-0000-4000-8000-000000000301', 'kg', 10, 30, null, 4.8, 1),
  ('5e100000-0000-4000-8000-000000000301', 'kg', 30, 300, null, 3.6, 2);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000301', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000301', 'GB-HIGHLANDS', 20, true),
  ('5e100000-0000-4000-8000-000000000301', 'GB-NI', 18, true),
  ('5e100000-0000-4000-8000-000000000301', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000301', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000301', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000301', 'TR-AEGEAN', 5, true),
  ('5e100000-0000-4000-8000-000000000301', 'TR-MED', 8, true),
  ('5e100000-0000-4000-8000-000000000301', 'TR-CENTRAL', 10, true),
  ('5e100000-0000-4000-8000-000000000301', 'TR-BLACKSEA', 15, true),
  ('5e100000-0000-4000-8000-000000000301', 'TR-EAST', 22, true);

-- Turkey → UK Economy Parcel (parcel, TR -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000302', 'c1000000-0000-4000-8000-000000000003', 'parcel', 'TR', 'GB', 'road', 'Turkey → UK Economy Parcel', 8, 14, 'GBP', 3000, 40, 0.1, 28, 8, 0, 5, 0.02, 9, 300, 180, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000302', 'kg', 0, 10, 68, null, 0),
  ('5e100000-0000-4000-8000-000000000302', 'kg', 10, 30, null, 5, 1),
  ('5e100000-0000-4000-8000-000000000302', 'kg', 30, 300, null, 3.8, 2);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000302', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000302', 'GB-HIGHLANDS', 20, true),
  ('5e100000-0000-4000-8000-000000000302', 'GB-NI', 18, true),
  ('5e100000-0000-4000-8000-000000000302', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000302', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000302', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000302', 'TR-AEGEAN', 5, true),
  ('5e100000-0000-4000-8000-000000000302', 'TR-MED', 8, true),
  ('5e100000-0000-4000-8000-000000000302', 'TR-CENTRAL', 10, true),
  ('5e100000-0000-4000-8000-000000000302', 'TR-BLACKSEA', 15, true),
  ('5e100000-0000-4000-8000-000000000302', 'TR-EAST', 22, true);

-- UK → Turkey Part-Load Van (volume, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000303', 'c1000000-0000-4000-8000-000000000003', 'volume', 'GB', 'TR', 'road', 'UK → Turkey Part-Load Van', 12, 21, 'GBP', 3000, 110, 0.11, 30, 10, 10, 8, 0.02, 12, 2000, 350, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000303', 'cbm', 0, 1, 115, null, 0),
  ('5e100000-0000-4000-8000-000000000303', 'cbm', 1, null, null, 98, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000303', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000303', 'GB-HIGHLANDS', 22, true),
  ('5e100000-0000-4000-8000-000000000303', 'GB-NI', 20, true),
  ('5e100000-0000-4000-8000-000000000303', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000303', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000303', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000303', 'TR-AEGEAN', 5, true),
  ('5e100000-0000-4000-8000-000000000303', 'TR-MED', 8, true),
  ('5e100000-0000-4000-8000-000000000303', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000303', 'TR-BLACKSEA', 16, true),
  ('5e100000-0000-4000-8000-000000000303', 'TR-EAST', 24, true);

-- Turkey → UK Part-Load Van (volume, TR -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000304', 'c1000000-0000-4000-8000-000000000003', 'volume', 'TR', 'GB', 'road', 'Turkey → UK Part-Load Van', 12, 21, 'GBP', 3000, 110, 0.11, 30, 10, 10, 8, 0.02, 12, 2000, 350, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000304', 'cbm', 0, 1, 112, null, 0),
  ('5e100000-0000-4000-8000-000000000304', 'cbm', 1, null, null, 96, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000304', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000304', 'GB-HIGHLANDS', 22, true),
  ('5e100000-0000-4000-8000-000000000304', 'GB-NI', 20, true),
  ('5e100000-0000-4000-8000-000000000304', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000304', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000304', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000304', 'TR-AEGEAN', 5, true),
  ('5e100000-0000-4000-8000-000000000304', 'TR-MED', 8, true),
  ('5e100000-0000-4000-8000-000000000304', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000304', 'TR-BLACKSEA', 16, true),
  ('5e100000-0000-4000-8000-000000000304', 'TR-EAST', 24, true);

-- ---------------------------------------------------------------------------
-- Pennine Freight Bridge
-- ---------------------------------------------------------------------------

-- UK → Turkey Pallet Line (pallet, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000401', 'c1000000-0000-4000-8000-000000000004', 'pallet', 'GB', 'TR', 'road', 'UK → Turkey Pallet Line', 9, 15, 'GBP', 3000, 160, 0.13, 38, 0, 0, 10, 0.02, 12, 2400, 240, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000401', 'pallet', 0, 1, 185, null, 0),
  ('5e100000-0000-4000-8000-000000000401', 'pallet', 1, null, null, 130, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000401', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000401', 'GB-HIGHLANDS', 25, true),
  ('5e100000-0000-4000-8000-000000000401', 'GB-NI', 22, true),
  ('5e100000-0000-4000-8000-000000000401', 'GB-ISLANDS', 38, true),
  ('5e100000-0000-4000-8000-000000000401', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000401', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000401', 'TR-AEGEAN', 8, true),
  ('5e100000-0000-4000-8000-000000000401', 'TR-MED', 10, true),
  ('5e100000-0000-4000-8000-000000000401', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000401', 'TR-BLACKSEA', 18, true),
  ('5e100000-0000-4000-8000-000000000401', 'TR-EAST', 0, false);

-- Turkey → UK Pallet Line (pallet, TR -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000402', 'c1000000-0000-4000-8000-000000000004', 'pallet', 'TR', 'GB', 'road', 'Turkey → UK Pallet Line', 10, 15, 'GBP', 3000, 160, 0.13, 38, 0, 0, 10, 0.02, 12, 2400, 240, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000402', 'pallet', 0, 1, 190, null, 0),
  ('5e100000-0000-4000-8000-000000000402', 'pallet', 1, null, null, 135, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000402', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000402', 'GB-HIGHLANDS', 25, true),
  ('5e100000-0000-4000-8000-000000000402', 'GB-NI', 22, true),
  ('5e100000-0000-4000-8000-000000000402', 'GB-ISLANDS', 38, true),
  ('5e100000-0000-4000-8000-000000000402', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000402', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000402', 'TR-AEGEAN', 8, true),
  ('5e100000-0000-4000-8000-000000000402', 'TR-MED', 10, true),
  ('5e100000-0000-4000-8000-000000000402', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000402', 'TR-BLACKSEA', 18, true),
  ('5e100000-0000-4000-8000-000000000402', 'TR-EAST', 0, false);

-- UK Man & Van (volume, GB -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000403', 'c1000000-0000-4000-8000-000000000004', 'volume', 'GB', 'GB', 'road', 'UK Man & Van', 1, 3, 'GBP', 3000, 45, 0.1, 0, 0, 0, 0, 0.015, 7.5, 1200, 300, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000403', 'cbm', 0, 1, 55, null, 0),
  ('5e100000-0000-4000-8000-000000000403', 'cbm', 1, null, null, 38, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000403', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000403', 'GB-HIGHLANDS', 35, true),
  ('5e100000-0000-4000-8000-000000000403', 'GB-NI', 40, true),
  ('5e100000-0000-4000-8000-000000000403', 'GB-ISLANDS', 0, false);

-- UK Domestic Parcel (parcel, GB -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000404', 'c1000000-0000-4000-8000-000000000004', 'parcel', 'GB', 'GB', 'road', 'UK Domestic Parcel', 1, 2, 'GBP', 3000, 10, 0.1, 0, 0, 0, 0, 0.015, 7.5, 300, 180, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000404', 'kg', 0, 10, 12, null, 0),
  ('5e100000-0000-4000-8000-000000000404', 'kg', 10, 30, null, 0.9, 1),
  ('5e100000-0000-4000-8000-000000000404', 'kg', 30, 300, null, 0.7, 2);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000404', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000404', 'GB-HIGHLANDS', 15, true),
  ('5e100000-0000-4000-8000-000000000404', 'GB-NI', 18, true),
  ('5e100000-0000-4000-8000-000000000404', 'GB-ISLANDS', 22, true);

-- ---------------------------------------------------------------------------
-- Lale Removals
-- ---------------------------------------------------------------------------

-- UK → Turkey Removals Van (volume, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000501', 'c1000000-0000-4000-8000-000000000005', 'volume', 'GB', 'TR', 'road', 'UK → Turkey Removals Van', 14, 21, 'GBP', 3000, 95, 0.1, 25, 0, 0, 0, 0.015, 7.5, 1500, 320, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000501', 'cbm', 0, 1, 110, null, 0),
  ('5e100000-0000-4000-8000-000000000501', 'cbm', 1, null, null, 95, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000501', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000501', 'GB-HIGHLANDS', 15, true),
  ('5e100000-0000-4000-8000-000000000501', 'GB-NI', 0, false),
  ('5e100000-0000-4000-8000-000000000501', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000501', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000501', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000501', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000501', 'TR-MED', 10, true),
  ('5e100000-0000-4000-8000-000000000501', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000501', 'TR-BLACKSEA', 18, true),
  ('5e100000-0000-4000-8000-000000000501', 'TR-EAST', 0, false);

-- Turkey → UK Removals Van (volume, TR -> GB, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000502', 'c1000000-0000-4000-8000-000000000005', 'volume', 'TR', 'GB', 'road', 'Turkey → UK Removals Van', 14, 21, 'GBP', 3000, 95, 0.1, 25, 0, 0, 0, 0.015, 7.5, 1500, 320, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000502', 'cbm', 0, 1, 110, null, 0),
  ('5e100000-0000-4000-8000-000000000502', 'cbm', 1, null, null, 95, 1);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000502', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000502', 'GB-HIGHLANDS', 15, true),
  ('5e100000-0000-4000-8000-000000000502', 'GB-NI', 0, false),
  ('5e100000-0000-4000-8000-000000000502', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000502', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000502', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000502', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000502', 'TR-MED', 10, true),
  ('5e100000-0000-4000-8000-000000000502', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000502', 'TR-BLACKSEA', 18, true),
  ('5e100000-0000-4000-8000-000000000502', 'TR-EAST', 0, false);

-- UK → Turkey Budget Parcel (parcel, GB -> TR, road)
insert into public.carrier_services
  (id, carrier_id, service_type, origin, destination, mode, name, transit_days_min, transit_days_max, currency, volumetric_divisor, min_charge, fuel_pct, customs_fee, collection_fee, delivery_fee, residential_fee, insurance_pct, insurance_min, max_weight_kg, max_dim_cm, active)
values
  ('5e100000-0000-4000-8000-000000000503', 'c1000000-0000-4000-8000-000000000005', 'parcel', 'GB', 'TR', 'road', 'UK → Turkey Budget Parcel', 10, 14, 'GBP', 3000, 40, 0.1, 25, 0, 0, 0, 0.015, 7.5, 250, 180, true);
insert into public.rate_tiers (service_id, unit, from_qty, to_qty, flat_price, price_per_unit, sort)
values
  ('5e100000-0000-4000-8000-000000000503', 'kg', 0, 10, 66, null, 0),
  ('5e100000-0000-4000-8000-000000000503', 'kg', 10, 30, null, 4.5, 1),
  ('5e100000-0000-4000-8000-000000000503', 'kg', 30, 250, null, 3.5, 2);
insert into public.zone_surcharges (service_id, zone, flat, served)
values
  ('5e100000-0000-4000-8000-000000000503', 'GB-MAINLAND', 0, true),
  ('5e100000-0000-4000-8000-000000000503', 'GB-HIGHLANDS', 15, true),
  ('5e100000-0000-4000-8000-000000000503', 'GB-NI', 0, false),
  ('5e100000-0000-4000-8000-000000000503', 'GB-ISLANDS', 0, false),
  ('5e100000-0000-4000-8000-000000000503', 'TR-MARMARA', 0, true),
  ('5e100000-0000-4000-8000-000000000503', 'TR-ANKARA', 0, true),
  ('5e100000-0000-4000-8000-000000000503', 'TR-AEGEAN', 0, true),
  ('5e100000-0000-4000-8000-000000000503', 'TR-MED', 10, true),
  ('5e100000-0000-4000-8000-000000000503', 'TR-CENTRAL', 12, true),
  ('5e100000-0000-4000-8000-000000000503', 'TR-BLACKSEA', 18, true),
  ('5e100000-0000-4000-8000-000000000503', 'TR-EAST', 0, false);

commit;
