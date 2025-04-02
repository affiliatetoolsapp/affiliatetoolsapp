
import { Offer, GeoCommission } from '@/types';

/**
 * Helper function to safely transform database offer data to the Offer type
 * This helps prevent TypeScript errors when database columns don't exactly match our type definitions
 */
export const transformOfferData = (offerData: any): Offer => {
  return {
    id: offerData.id || '',
    advertiser_id: offerData.advertiser_id || '',
    name: offerData.name || '',
    description: offerData.description || null,
    url: offerData.url || '',
    commission_type: offerData.commission_type || '',
    commission_amount: Number(offerData.commission_amount || 0),
    commission_percent: Number(offerData.commission_percent || 0),
    niche: offerData.niche || null,
    status: offerData.status || null,
    target_audience: offerData.target_audience || null,
    conversion_requirements: offerData.conversion_requirements || null,
    restrictions: offerData.restrictions || null,
    payout_frequency: offerData.payout_frequency || null,
    geo_commissions: Array.isArray(offerData.geo_commissions) 
      ? offerData.geo_commissions.map((gc: any) => ({
          country: gc.country || '',
          commission_amount: Number(gc.commission_amount || 0),
          commission_percent: Number(gc.commission_percent || 0),
          geo: gc.geo || gc.country || '' // Backward compatibility
        }))
      : null,
    geo_targets: Array.isArray(offerData.geo_targets) 
      ? offerData.geo_targets 
      : offerData.geo_targets ? Object.keys(offerData.geo_targets) : null,
    restricted_geos: Array.isArray(offerData.restricted_geos) ? offerData.restricted_geos : null,
    allowed_traffic_sources: Array.isArray(offerData.allowed_traffic_sources) ? offerData.allowed_traffic_sources : null,
    marketing_materials: offerData.marketing_materials || null,
    offer_image: offerData.offer_image || null,
    is_featured: Boolean(offerData.is_featured),
    featured_until: offerData.featured_until || null,
    created_at: offerData.created_at || null,
    updated_at: offerData.updated_at || null,
    payout_amount: Number(offerData.payout_amount || offerData.commission_amount || 0),
    subtitle: offerData.subtitle || null,
    // Handle joined advertiser data if present
    advertiser: offerData.advertiser ? {
      id: offerData.advertiser.id || offerData.advertiser_id || '',
      name: offerData.advertiser.name || '',
      email: offerData.advertiser.email || ''
    } : undefined
  };
};

/**
 * Helper function to transform an array of offer data from the database
 */
export const transformOffersData = (offersData: any[]): Offer[] => {
  if (!Array.isArray(offersData)) return [];
  return offersData.map(transformOfferData);
};
