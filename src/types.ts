export interface Offer {
  id: string;
  name: string;
  status: string;
  description?: string;
  niche?: string;
  commission_type: string;
  commission_amount: string;
  commission_percent?: string;
  payout_amount: string;
  payout_frequency?: string;
  geo_targets?: string[];
  geo_commissions?: GeoCommission[];
  allowed_traffic_sources?: string[];
  restricted_geos?: string[];
  offer_image?: string;
  created_at?: string;
  advertiser_id?: string;
  is_featured?: boolean;
  url?: string;
  marketing_materials?: string[];
  target_audience?: string;
  restrictions?: string;
  conversion_requirements?: string;
}

export interface GeoCommission {
  geo: string;
  amount: string;
}

// ... rest of the types ... 