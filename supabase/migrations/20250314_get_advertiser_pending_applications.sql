
-- Create a function to get pending applications for an advertiser
CREATE OR REPLACE FUNCTION public.get_advertiser_pending_applications(advertiser_id UUID)
RETURNS TABLE (
  id UUID,
  offer_id UUID,
  affiliate_id UUID,
  applied_at TIMESTAMPTZ,
  traffic_source TEXT,
  notes TEXT,
  status TEXT,
  reviewed_at TIMESTAMPTZ,
  offers JSONB,
  users JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ao.id,
    ao.offer_id,
    ao.affiliate_id,
    ao.applied_at,
    ao.traffic_source,
    ao.notes,
    ao.status,
    ao.reviewed_at,
    json_build_object(
      'id', o.id,
      'name', o.name,
      'description', o.description,
      'niche', o.niche,
      'advertiser_id', o.advertiser_id,
      'offer_image', o.offer_image,
      'geo_commissions', o.geo_commissions
    )::jsonb AS offers,
    json_build_object(
      'id', u.id,
      'email', u.email,
      'contact_name', u.contact_name,
      'company_name', u.company_name,
      'website', u.website
    )::jsonb AS users
  FROM 
    affiliate_offers ao
  JOIN 
    offers o ON ao.offer_id = o.id
  JOIN 
    users u ON ao.affiliate_id = u.id
  WHERE 
    o.advertiser_id = get_advertiser_pending_applications.advertiser_id
    AND ao.status = 'pending';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_advertiser_pending_applications TO authenticated;
