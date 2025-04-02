-- ============================================================================
-- COMBINED MIGRATION TO FIX AFFILIATE APPLICATIONS
-- ============================================================================

-- Part 1: Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Add RLS to system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'system_logs'
    AND policyname = 'admin_all_system_logs'
  ) THEN
    DROP POLICY IF EXISTS "admin_all_system_logs" ON public.system_logs;
  END IF;
END
$$;

CREATE POLICY "admin_all_system_logs" ON public.system_logs
  FOR ALL 
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.system_logs TO authenticated;

-- Part 2: Fix the affiliate_offers RLS policies
-- First, drop the existing policy for affiliate applications if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_offers'
    AND policyname = 'affiliates_create_applications'
  ) THEN
    DROP POLICY IF EXISTS "affiliates_create_applications" ON public.affiliate_offers;
  END IF;
END
$$;

-- Create a proper policy that allows affiliates to insert their applications
CREATE POLICY "affiliates_create_applications" ON public.affiliate_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id = auth.uid() AND 
    (auth.jwt() ->> 'role') = 'affiliate' AND
    -- Make sure offer exists and is active
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = affiliate_offers.offer_id
      AND offers.status = 'active'
    )
  );

-- Double check the affiliate_offers table has RLS enabled
ALTER TABLE public.affiliate_offers ENABLE ROW LEVEL SECURITY;

-- Ensure affiliates can read their own applications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_offers'
    AND policyname = 'affiliates_view_own_applications'
  ) THEN
    DROP POLICY IF EXISTS "affiliates_view_own_applications" ON public.affiliate_offers;
  END IF;
END
$$;

CREATE POLICY "affiliates_view_own_applications" ON public.affiliate_offers
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() AND 
    (auth.jwt() ->> 'role') = 'affiliate'
  );

-- Also ensure required permissions are granted
GRANT INSERT, SELECT ON public.affiliate_offers TO authenticated;

-- Make sure admin has full access to affiliate_offers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_offers'
    AND policyname = 'admin_all_affiliate_offers'
  ) THEN
    DROP POLICY IF EXISTS "admin_all_affiliate_offers" ON public.affiliate_offers;
  END IF;
END
$$;

CREATE POLICY "admin_all_affiliate_offers" ON public.affiliate_offers
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Make sure advertisers can view applications for their offers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_offers'
    AND policyname = 'advertisers_view_applications'
  ) THEN
    DROP POLICY IF EXISTS "advertisers_view_applications" ON public.affiliate_offers;
  END IF;
END
$$;

CREATE POLICY "advertisers_view_applications" ON public.affiliate_offers
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'advertiser' AND
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = affiliate_offers.offer_id
      AND offers.advertiser_id = auth.uid()
    )
  );

-- Log this change
INSERT INTO public.system_logs (action, details)
VALUES ('policy_update', 'Fixed affiliate application policies')
ON CONFLICT DO NOTHING; 