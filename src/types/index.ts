
import { Database } from '@/integrations/supabase/types';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = 'admin' | 'advertiser' | 'affiliate';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface GeoCommission {
  country: string;
  geo?: string; // Added for backward compatibility
  commission_amount: number;
  commission_percent: number;
}

export interface MarketingMaterial {
  id?: string;
  url: string;
  type?: string;
  name?: string;
  path?: string;
  size?: number;
  description?: string | null;
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
  payout_amount: number;
  subtitle?: string | null;
  advertiser?: { // Optional property for joins
    id?: string;
    name?: string;
    email?: string;
  }
}

export interface AffiliateOffer {
  id: string;
  affiliate_id: string;
  offer_id: string;
  status: string;
  applied_at: string | null;
  traffic_source: string | null;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AffiliateOfferWithOffer extends AffiliateOffer {
  offer: Offer;
}

export interface TrackingLink {
  id: string;
  affiliate_id: string;
  offer_id: string;
  tracking_code: string;
  custom_params: any | null;
  created_at: string | null;
  link_type: 'direct' | 'shortened' | 'qr';
}

export interface TrackingLinkWithOffer extends TrackingLink {
  offer: Partial<Offer>;
}

export interface Click {
  id: string;
  click_id: string;
  tracking_code: string;
  affiliate_id: string;
  offer_id: string;
  ip_address: string | null;
  geo: string | null;
  user_agent: string | null;
  device: string | null;
  referrer: string | null;
  custom_params: any | null;
  created_at: string | null;
  advertiser_id?: string; // Added for joining with offers
}

export interface Conversion {
  id: string;
  click_id: string;
  event_type: string;
  revenue: number | null;
  commission: number | null;
  status: string;
  metadata: any | null;
  created_at: string | null;
  updated_at: string | null;
  payout_amount: number | null;
  advertiser_id?: string; // For certain queries that add this 
}

export interface Payment {
  id: string;
  affiliate_id: string | null;
  advertiser_id: string | null;
  amount: number;
  fee: number;
  total: number;
  status: PaymentStatus;
  payment_method: string | null;
  payment_details: any | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Wallet {
  id: string;
  user_id: string | null;
  balance: number | null;
  pending: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PayoutRequest {
  id: string;
  affiliate_id: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  created_at: string;
  processed_at: string | null;
}

// User interface for primary app usage
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

// Processed from database, used in transformations
export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}
