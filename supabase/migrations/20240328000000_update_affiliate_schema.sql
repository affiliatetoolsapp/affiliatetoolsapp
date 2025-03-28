-- Update users table with missing columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS bio text;

-- Create conversions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conversions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid REFERENCES public.users(id),
    offer_id uuid,
    payout_amount decimal(10,2) NOT NULL DEFAULT 0,
    status varchar(20) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create clicks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clicks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid REFERENCES public.users(id),
    offer_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    ip_address varchar(45),
    user_agent text,
    referrer text
);

-- Create affiliate_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.affiliate_offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid REFERENCES public.users(id),
    offer_id uuid,
    status varchar(20) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better query performance if they don't exist
CREATE INDEX IF NOT EXISTS users_role_status_idx ON public.users(role, status);
CREATE INDEX IF NOT EXISTS conversions_affiliate_id_idx ON public.conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS clicks_affiliate_id_idx ON public.clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_offers_affiliate_id_status_idx ON public.affiliate_offers(affiliate_id, status);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_offers ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS admin_all_users ON public.users;
DROP POLICY IF EXISTS admin_all_conversions ON public.conversions;
DROP POLICY IF EXISTS admin_all_clicks ON public.clicks;
DROP POLICY IF EXISTS admin_all_affiliate_offers ON public.affiliate_offers;

CREATE POLICY admin_all_users ON public.users
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_conversions ON public.conversions
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_clicks ON public.clicks
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_affiliate_offers ON public.affiliate_offers
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Update existing affiliate users to have status
UPDATE public.users
SET status = 'active'
WHERE role = 'affiliate' AND status IS NULL; 