
import { Database } from '@/integrations/supabase/types';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface GeoCommission {
  country: string;
  commission_amount: number;
  commission_percent: number;
  geo?: string; // Added to maintain backward compatibility
}

export interface MarketingMaterial {
  id: string;
  url: string;
  type: string;
  name?: string;
  path?: string;
  size?: number;
  description: string | null;
}

export interface Offer {
  id: string;
  advertiser_id: string;
  name: string;
  description: string | null;
  url: string;
  commission_type: string;
  commission_amount: number;
  commission_percent: number;
  niche: string | null;
  status: string | null;
  target_audience: string | null;
  conversion_requirements: string | null;
  restrictions: string | null;
  payout_frequency: string | null;
  geo_commissions: GeoCommission[] | null;
  geo_targets: string[] | null;
  restricted_geos: string[] | null;
  allowed_traffic_sources: string[] | null;
  marketing_materials: MarketingMaterial[] | null;
  offer_image: string | null;
  is_featured: boolean;
  featured_until: string | null;
  created_at: string | null;
  updated_at: string | null;
  payout_amount?: number; // Made optional with a default value
  advertiser?: { // Optional property for joins
    id?: string;
    name?: string;
    email?: string;
  }
}

export type AffiliateOffer = Database['public']['Tables']['affiliate_offers']['Row'];
export type Click = Database['public']['Tables']['clicks']['Row'];
export type Conversion = Database['public']['Tables']['conversions']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type TrackingLink = Database['public']['Tables']['tracking_links']['Row'] & {
  link_type: 'direct' | 'shortened' | 'qr';
};
export type Wallet = Database['public']['Tables']['wallets']['Row'];
export type UserData = Database['public']['Tables']['users']['Row'];
export type PayoutRequest = Database['public']['Tables']['payout_requests']['Row'];

export type UserRole = 'admin' | 'advertiser' | 'affiliate';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface AffiliateOfferWithOffer extends AffiliateOffer {
  offer: Offer;
}

export interface TrackingLinkWithOffer extends TrackingLink {
  offer: Partial<Offer>;
  link_type: 'direct' | 'shortened' | 'qr';
}

export interface TrackingLinkGeneratorProps {
  offer: Offer;
  linkType: string;
}

// Fix User interface (removing duplicate)
export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  bio?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  website?: string | null;
}

// Fix the `formatGeoTargets` utility to handle both types of geo_targets
<lov-write file_path="src/components/affiliate/utils/offerUtils.ts">
import { Offer, GeoCommission } from '@/types';
import countryCodes from '../../offers/countryCodes';

export const formatGeoTargets = (offer: Offer | { geo_targets?: any }) => {
  if (!offer || !offer.geo_targets) return [];

  let geoArray: string[] = [];

  // Handle different forms of geo_targets
  if (Array.isArray(offer.geo_targets)) {
    geoArray = offer.geo_targets;
  } else if (typeof offer.geo_targets === 'object') {
    geoArray = Object.keys(offer.geo_targets);
  } else if (typeof offer.geo_targets === 'string') {
    try {
      const parsed = JSON.parse(offer.geo_targets);
      if (Array.isArray(parsed)) {
        geoArray = parsed;
      } else if (typeof parsed === 'object') {
        geoArray = Object.keys(parsed);
      }
    } catch (e) {
      console.error("Error parsing geo_targets:", e);
    }
  }

  return geoArray.map(code => {
    const countryName = countryCodes[code] || code;
    // Get flag emoji for the country code
    const flag = code.toUpperCase().replace(/./g, char => 
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
    
    return {
      code,
      name: countryName,
      flag
    };
  });
};

export const getCountryFilterOptions = (offers: Offer[]) => {
  const allCountries = new Set<string>();
  
  offers.forEach(offer => {
    if (offer.geo_targets && Array.isArray(offer.geo_targets)) {
      offer.geo_targets.forEach(code => allCountries.add(code));
    } else if (offer.geo_targets && typeof offer.geo_targets === 'object') {
      Object.keys(offer.geo_targets).forEach(code => allCountries.add(code));
    }
  });
  
  return Array.from(allCountries).map(code => ({
    value: code,
    label: countryCodes[code] || code,
    flag: code.toUpperCase().replace(/./g, char => 
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    )
  }));
};

export const formatTrackingUrl = (url: string) => {
  if (!url) return '';
  
  const maxLength = 30;
  if (url.length <= maxLength) return url;
  
  return `${url.substring(0, maxLength)}...`;
};
