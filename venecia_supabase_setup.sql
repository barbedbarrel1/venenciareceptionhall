-- ============================================================
-- VENECIA RECEPTION HALL — SUPABASE SETUP
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Packages: the templates. Website reads these, admin edits them.
create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_price numeric(10,2) not null,
  description text,
  included_items text[],            -- array of strings for the checklist on packages.html
  is_popular boolean default false, -- drives the "most popular" badge
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Inquiries: public website form writes here. Anonymous inserts allowed.
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  event_type text,
  event_date date,
  guest_count int,
  message text,
  status text not null default 'new'
    check (status in ('new','contacted','booked','lost')),
  converted_client_id uuid,         -- set when converted, proves website ROI
  created_at timestamptz default now()
);

-- Clients: booked business. contract_price is SNAPSHOTTED at booking
-- so future package price changes never shift existing balances.
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  event_type text,
  event_date date not null,
  package_id uuid references packages(id),
  contract_price numeric(10,2) not null,
  status text not null default 'active'
    check (status in ('active','completed','cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- Payments: append-only ledger. Never edit history — add rows.
-- Credits (client removed something) = negative amounts.
create table payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) not null,
  amount numeric(10,2) not null,    -- negative = credit or refund
  type text not null default 'payment'
    check (type in ('deposit','payment','credit','refund')),
  method text,                       -- cash, zelle, card, check...
  note text,
  paid_at date not null default current_date,
  created_at timestamptz default now()
);

-- Gallery: powers gallery.html, managed from admin Settings tab.
create table gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  category text not null default 'venue'
    check (category in ('weddings','quinceaneras','sweet16','other','venue')),
  alt_text text,                     -- SEO: describe photo + keywords
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. INDEXES (the queries the admin panel runs constantly)
-- ============================================================
create index idx_payments_client on payments(client_id);
create index idx_payments_paid_at on payments(paid_at);
create index idx_clients_event_date on clients(event_date);
create index idx_clients_status on clients(status);
create index idx_inquiries_status on inquiries(status);

-- ============================================================
-- 3. VIEW: client balances
-- One query gives the admin panel everything: paid, owed, status.
-- Balance is always computed, never stored — it can't go stale.
-- ============================================================
create or replace view client_balances as
select
  c.id,
  c.name,
  c.phone,
  c.email,
  c.event_type,
  c.event_date,
  c.status,
  c.contract_price,
  coalesce(sum(p.amount), 0)                    as total_paid,
  c.contract_price - coalesce(sum(p.amount), 0) as balance_owed
from clients c
left join payments p on p.client_id = c.id
group by c.id;

-- security_invoker makes the view respect RLS of the querying user
alter view client_balances set (security_invoker = true);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- Rule: public can insert inquiries + read packages/gallery.
-- Everything else requires a logged-in user (owner/manager).
-- ============================================================
alter table packages  enable row level security;
alter table inquiries enable row level security;
alter table clients   enable row level security;
alter table payments  enable row level security;
alter table gallery   enable row level security;

-- PACKAGES: anyone can read active ones (website), only auth can manage
create policy "public read active packages"
  on packages for select
  using (active = true);

create policy "auth full access packages"
  on packages for all
  to authenticated
  using (true) with check (true);

-- INQUIRIES: anonymous INSERT only (the contact form).
-- Public can never read/edit them. Auth users manage everything.
create policy "public can submit inquiries"
  on inquiries for insert
  to anon
  with check (true);

create policy "auth full access inquiries"
  on inquiries for all
  to authenticated
  using (true) with check (true);

-- CLIENTS: auth only. The public never touches money data.
create policy "auth full access clients"
  on clients for all
  to authenticated
  using (true) with check (true);

-- PAYMENTS: auth only.
create policy "auth full access payments"
  on payments for all
  to authenticated
  using (true) with check (true);

-- GALLERY: public reads active photos, auth manages.
create policy "public read active gallery"
  on gallery for select
  using (active = true);

create policy "auth full access gallery"
  on gallery for all
  to authenticated
  using (true) with check (true);

-- ============================================================
-- 5. SEED DATA — placeholder packages (edit names/prices with
-- the client, or later through the admin Settings tab)
-- ============================================================
insert into packages (name, base_price, description, included_items, is_popular, sort_order) values
('Paquete Plata', 3500.00, 'Everything you need for a beautiful celebration.',
  array['Hall rental (6 hours)','Tables & chairs for 150','Basic linens','Setup & cleanup'],
  false, 1),
('Paquete Oro', 5500.00, 'Our most popular package — elegance without the stress.',
  array['Hall rental (8 hours)','Tables & chairs for 250','Premium linens & chair covers','Centerpieces','DJ (4 hours)','Setup & cleanup'],
  true, 2),
('Paquete Diamante', 7500.00, 'The full experience. You show up, we handle the rest.',
  array['Largest hall (8 hours)','Tables & chairs for 300+','Premium linens & decor','Centerpieces & uplighting','DJ (6 hours)','Catering for 200','Cake table & throne setup','Setup & cleanup'],
  false, 3);
