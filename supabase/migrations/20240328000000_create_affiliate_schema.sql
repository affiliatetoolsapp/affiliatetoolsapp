-- Update users table with missing columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS company_name varchar(255),
ADD COLUMN IF NOT EXISTS contact_name varchar(255),
ADD COLUMN IF NOT EXISTS phone varchar(50),
ADD COLUMN IF NOT EXISTS website varchar(255),
ADD COLUMN IF NOT EXISTS bio text;

-- Create conversions table
CREATE TABLE IF NOT EXISTS public.conversions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid REFERENCES public.users(id),
    offer_id uuid,
    payout_amount decimal(10,2) NOT NULL DEFAULT 0,
    status varchar(20) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create clicks table
CREATE TABLE IF NOT EXISTS public.clicks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid REFERENCES public.users(id),
    offer_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    ip_address varchar(45),
    user_agent text,
    referrer text
);

-- Create affiliate_offers table
CREATE TABLE IF NOT EXISTS public.affiliate_offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid REFERENCES public.users(id),
    offer_id uuid,
    status varchar(20) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS users_role_status_idx ON public.users(role, status);
CREATE INDEX IF NOT EXISTS conversions_affiliate_id_idx ON public.conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS clicks_affiliate_id_idx ON public.clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_offers_affiliate_id_status_idx ON public.affiliate_offers(affiliate_id, status);

-- Add RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_offers ENABLE ROW LEVEL SECURITY;

-- Admin can read all data
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

-- Insert some test affiliate users
INSERT INTO public.users (id, email, role, status, company_name, contact_name, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'affiliate1@test.com', 'affiliate', 'active', 'Test Company 1', 'John Doe', now(), now()),
    (gen_random_uuid(), 'affiliate2@test.com', 'affiliate', 'active', 'Test Company 2', 'Jane Smith', now(), now())
ON CONFLICT (email) DO NOTHING; 