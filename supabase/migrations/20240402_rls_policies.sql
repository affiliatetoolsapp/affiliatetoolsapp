-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_links ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'affiliate_offers_offer_id_fkey'
  ) THEN
    ALTER TABLE public.affiliate_offers
    ADD CONSTRAINT affiliate_offers_offer_id_fkey
    FOREIGN KEY (offer_id)
    REFERENCES public.offers(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'affiliate_offers_affiliate_id_fkey'
  ) THEN
    ALTER TABLE public.affiliate_offers
    ADD CONSTRAINT affiliate_offers_affiliate_id_fkey
    FOREIGN KEY (affiliate_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'clicks_offer_id_fkey'
  ) THEN
    ALTER TABLE public.clicks
    ADD CONSTRAINT clicks_offer_id_fkey
    FOREIGN KEY (offer_id)
    REFERENCES public.offers(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'clicks_affiliate_id_fkey'
  ) THEN
    ALTER TABLE public.clicks
    ADD CONSTRAINT clicks_affiliate_id_fkey
    FOREIGN KEY (affiliate_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversions_click_id_fkey'
  ) THEN
    ALTER TABLE public.conversions
    ADD CONSTRAINT conversions_click_id_fkey
    FOREIGN KEY (click_id)
    REFERENCES public.clicks(click_id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Advertisers can view their own offers" ON public.offers;
DROP POLICY IF EXISTS "Advertisers can create offers" ON public.offers;
DROP POLICY IF EXISTS "Advertisers can update their own offers" ON public.offers;
DROP POLICY IF EXISTS "Advertisers can delete their own offers" ON public.offers;
DROP POLICY IF EXISTS "Affiliates can view approved offers" ON public.offers;
DROP POLICY IF EXISTS "Advertisers can view their own clicks" ON public.clicks;
DROP POLICY IF EXISTS "Advertisers can view their own conversions" ON public.conversions;
DROP POLICY IF EXISTS "Advertisers can view their own affiliate offers" ON public.affiliate_offers;
DROP POLICY IF EXISTS "Advertisers can update their own affiliate offers" ON public.affiliate_offers;
DROP POLICY IF EXISTS "Affiliates can view their own affiliate offers" ON public.affiliate_offers;
DROP POLICY IF EXISTS "Affiliates can view their own tracking links" ON public.tracking_links;

-- Create new policies with simplified checks
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (id = auth.uid()::uuid);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (id = auth.uid()::uuid);

-- Simplified offer policies to avoid recursion
CREATE POLICY "Advertisers can view their own offers" ON public.offers
  FOR SELECT USING (advertiser_id = auth.uid()::uuid);

CREATE POLICY "Advertisers can create offers" ON public.offers
  FOR INSERT WITH CHECK (advertiser_id = auth.uid()::uuid);

CREATE POLICY "Advertisers can update their own offers" ON public.offers
  FOR UPDATE USING (advertiser_id = auth.uid()::uuid);

CREATE POLICY "Advertisers can delete their own offers" ON public.offers
  FOR DELETE USING (advertiser_id = auth.uid()::uuid);

-- Simplified affiliate offer view policy
CREATE POLICY "Affiliates can view approved offers" ON public.offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_offers ao
      WHERE ao.offer_id = offers.id
      AND ao.affiliate_id = auth.uid()::uuid
      AND ao.status = 'approved'
    )
  );

-- Simplified click policies
CREATE POLICY "Advertisers can view their own clicks" ON public.clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = clicks.offer_id
      AND o.advertiser_id = auth.uid()::uuid
    )
  );

-- Simplified conversion policies
CREATE POLICY "Advertisers can view their own conversions" ON public.conversions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clicks c
      JOIN public.offers o ON o.id = c.offer_id
      WHERE c.click_id = conversions.click_id
      AND o.advertiser_id = auth.uid()::uuid
    )
  );

-- Simplified affiliate offer policies
CREATE POLICY "Advertisers can view their own affiliate offers" ON public.affiliate_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = affiliate_offers.offer_id
      AND o.advertiser_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Advertisers can update their own affiliate offers" ON public.affiliate_offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = affiliate_offers.offer_id
      AND o.advertiser_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Affiliates can view their own affiliate offers" ON public.affiliate_offers
  FOR SELECT USING (affiliate_id = auth.uid()::uuid);

CREATE POLICY "Affiliates can view their own tracking links" ON public.tracking_links
  FOR SELECT USING (affiliate_id = auth.uid()::uuid); 