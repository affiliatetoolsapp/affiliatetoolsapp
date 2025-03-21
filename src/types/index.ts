import { Database } from '@/integrations/supabase/types';

export interface Offer {
  id: string;
  name: string;
  description?: string;
  niche?: string;
  status: string;
  commission_type: string;
  commission_amount: string;
  commission_percent?: string;
  payout_amount: string;
  payout_frequency?: string;
  offer_image?: string;
  is_featured?: boolean;
  geo_targets?: string[];
  restricted_geos?: string[];
  allowed_traffic_sources?: string[];
  allowed_traffic_types?: string[];
  geo_commissions?: Array<{
    geo: string;
    amount: string | number;
  }>;
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
