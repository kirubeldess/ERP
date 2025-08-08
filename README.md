# ERP Prototype

Tech stack: Next.js App Router, Tailwind (Shadcn), Supabase, Recharts.

## Setup
1. Copy `.env` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Run `npm i` then `npm run dev`.
3. In Supabase SQL editor, run the schema below.

## Database schema
```sql
create table if not exists users (
  id uuid primary key,
  name text,
  email text unique,
  role text check (role in ('admin','manager','staff')) default 'staff'
);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  quantity int default 0,
  price numeric default 0,
  warehouse_id uuid references warehouses(id) on delete set null
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_info text,
  notes text
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  status text,
  notes text
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  date timestamptz default now(),
  amount numeric default 0,
  status text default 'pending'
);

create table if not exists ledger (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('income','expense')) not null,
  amount numeric not null,
  date timestamptz default now(),
  description text
);
```

## Notes
- Auth via Supabase; middleware protects app routes.
- Realtime on `products` and `invoices`.
- Sidebar is collapsible; light/dark theme toggle in topbar.
