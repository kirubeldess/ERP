-- Enable Row Level Security and per-user ownership on core tables
-- Run this SQL in your Supabase project's SQL editor

-- IMPORTANT: Replace this with the UUID of the user (or tenant owner) who should own existing rows
-- You can find it in the Supabase dashboard under Authentication > Users
-- Example: SELECT id, email FROM auth.users;
DO $$ BEGIN
  IF current_setting('request.jwt.claim.sub', true) IS NOT NULL THEN
    RAISE NOTICE 'JWT present, auth.uid() = %', auth.uid();
  END IF;
END $$;

-- 1) Add user_id to tables as NULLABLE first (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN user_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.warehouses ADD COLUMN user_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.suppliers ADD COLUMN user_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN user_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.ledger ADD COLUMN user_id uuid;
  END IF;
END $$;

-- 2) BACKFILL existing rows so there are no NULL user_id values
-- Set this to the correct owner UUID before running
-- Example: SELECT id FROM auth.users WHERE email = 'owner@example.com';
DO $$
DECLARE
  default_owner uuid := 'REPLACE_WITH_USER_UUID'; -- TODO: set this
BEGIN
  -- Safety check
  IF default_owner = 'REPLACE_WITH_USER_UUID'::uuid THEN
    RAISE EXCEPTION 'Please set default_owner to a real user id before running backfill';
  END IF;

  UPDATE public.products  SET user_id = default_owner WHERE user_id IS NULL;
  UPDATE public.warehouses SET user_id = default_owner WHERE user_id IS NULL;
  UPDATE public.suppliers  SET user_id = default_owner WHERE user_id IS NULL;
  UPDATE public.invoices  SET user_id = default_owner WHERE user_id IS NULL;
  UPDATE public.ledger    SET user_id = default_owner WHERE user_id IS NULL;
END $$;

-- 3) Now enforce NOT NULL and add indexes
ALTER TABLE public.products  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.warehouses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.suppliers  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.invoices  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ledger    ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_user_id   ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_user_id ON public.warehouses(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id  ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id   ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user_id     ON public.ledger(user_id);

-- 4) Enable RLS
ALTER TABLE public.products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger    ENABLE ROW LEVEL SECURITY;

-- 5) Policies: allow users to manage only their own rows
DO $$ BEGIN
  -- Products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_select_own') THEN
    CREATE POLICY products_select_own ON public.products FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_insert_own') THEN
    CREATE POLICY products_insert_own ON public.products FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_update_own') THEN
    CREATE POLICY products_update_own ON public.products FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_delete_own') THEN
    CREATE POLICY products_delete_own ON public.products FOR DELETE USING (user_id = auth.uid());
  END IF;

  -- Warehouses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warehouses' AND policyname='warehouses_select_own') THEN
    CREATE POLICY warehouses_select_own ON public.warehouses FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warehouses' AND policyname='warehouses_insert_own') THEN
    CREATE POLICY warehouses_insert_own ON public.warehouses FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warehouses' AND policyname='warehouses_update_own') THEN
    CREATE POLICY warehouses_update_own ON public.warehouses FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warehouses' AND policyname='warehouses_delete_own') THEN
    CREATE POLICY warehouses_delete_own ON public.warehouses FOR DELETE USING (user_id = auth.uid());
  END IF;

  -- Suppliers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_select_own') THEN
    CREATE POLICY suppliers_select_own ON public.suppliers FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_insert_own') THEN
    CREATE POLICY suppliers_insert_own ON public.suppliers FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_update_own') THEN
    CREATE POLICY suppliers_update_own ON public.suppliers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' AND policyname='suppliers_delete_own') THEN
    CREATE POLICY suppliers_delete_own ON public.suppliers FOR DELETE USING (user_id = auth.uid());
  END IF;

  -- Invoices
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='invoices_select_own') THEN
    CREATE POLICY invoices_select_own ON public.invoices FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='invoices_insert_own') THEN
    CREATE POLICY invoices_insert_own ON public.invoices FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='invoices_update_own') THEN
    CREATE POLICY invoices_update_own ON public.invoices FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='invoices_delete_own') THEN
    CREATE POLICY invoices_delete_own ON public.invoices FOR DELETE USING (user_id = auth.uid());
  END IF;

  -- Ledger
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ledger' AND policyname='ledger_select_own') THEN
    CREATE POLICY ledger_select_own ON public.ledger FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ledger' AND policyname='ledger_insert_own') THEN
    CREATE POLICY ledger_insert_own ON public.ledger FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ledger' AND policyname='ledger_update_own') THEN
    CREATE POLICY ledger_update_own ON public.ledger FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ledger' AND policyname='ledger_delete_own') THEN
    CREATE POLICY ledger_delete_own ON public.ledger FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Optional: auto-populate user_id with auth.uid() when NULL on insert
-- This trigger helps ensure inserts done with a user JWT set the owner automatically
CREATE OR REPLACE FUNCTION public.set_user_id_default()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to each table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'products' AND trigger_name = 'set_user_id_default_products'
  ) THEN
    CREATE TRIGGER set_user_id_default_products BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'warehouses' AND trigger_name = 'set_user_id_default_warehouses'
  ) THEN
    CREATE TRIGGER set_user_id_default_warehouses BEFORE INSERT ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'suppliers' AND trigger_name = 'set_user_id_default_suppliers'
  ) THEN
    CREATE TRIGGER set_user_id_default_suppliers BEFORE INSERT ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'invoices' AND trigger_name = 'set_user_id_default_invoices'
  ) THEN
    CREATE TRIGGER set_user_id_default_invoices BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'ledger' AND trigger_name = 'set_user_id_default_ledger'
  ) THEN
    CREATE TRIGGER set_user_id_default_ledger BEFORE INSERT ON public.ledger FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
  END IF;
END $$;

-- Add customers.user_id column (nullable first)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Backfill customers
DO $$
DECLARE
  default_owner uuid := 'REPLACE_WITH_USER_UUID'; -- TODO: set this
BEGIN
  IF default_owner = 'REPLACE_WITH_USER_UUID'::uuid THEN
    RAISE EXCEPTION 'Please set default_owner for customers before running backfill';
  END IF;
  UPDATE public.customers SET user_id = default_owner WHERE user_id IS NULL;
END $$;

-- Enforce NOT NULL and add index for customers
ALTER TABLE public.customers ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policies for customers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_select_own') THEN
    CREATE POLICY customers_select_own ON public.customers FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_insert_own') THEN
    CREATE POLICY customers_insert_own ON public.customers FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_update_own') THEN
    CREATE POLICY customers_update_own ON public.customers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_delete_own') THEN
    CREATE POLICY customers_delete_own ON public.customers FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Trigger for customers to set user_id default
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'customers' AND trigger_name = 'set_user_id_default_customers'
  ) THEN
    CREATE TRIGGER set_user_id_default_customers BEFORE INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
  END IF;
END $$;

-- Note: For existing data without user_id, set it manually for each user if needed:
-- UPDATE public.products  SET user_id = '<USER_UUID>' WHERE user_id IS NULL;
-- UPDATE public.warehouses SET user_id = '<USER_UUID>' WHERE user_id IS NULL;
-- UPDATE public.suppliers  SET user_id = '<USER_UUID>' WHERE user_id IS NULL;
-- UPDATE public.invoices  SET user_id = '<USER_UUID>' WHERE user_id IS NULL;
-- UPDATE public.ledger    SET user_id = '<USER_UUID>' WHERE user_id IS NULL; 