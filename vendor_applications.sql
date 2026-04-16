-- Run this in Supabase SQL Editor
-- Vendor applications table for admin approval workflow

CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name     TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

-- RLS: allow anyone to insert (public application)
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a vendor application"
  ON public.vendor_applications FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
  ON public.vendor_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update applications"
  ON public.vendor_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
