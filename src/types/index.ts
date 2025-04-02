import { Database } from '@/integrations/supabase/types';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface GeoCommission {
  country: string;
  commission_amount: number;
  commission_percent: number;
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
}

export type AffiliateOffer = Database['public']['Tables']['affiliate_offers']['Row'];
export type Click = Database['public']['Tables']['clicks']['Row'];
export type Conversion = Database['public']['Tables']['conversions']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type TrackingLink = Database['public']['Tables']['tracking_links']['Row'] & {
  link_type: 'direct' | 'shortened' | 'qr';
};
export type Wallet = Database['public']['Tables']['wallets']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
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
