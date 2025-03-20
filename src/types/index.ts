
import { Database } from '@/integrations/supabase/types';

export type Offer = Database['public']['Tables']['offers']['Row'] & {
  is_featured?: boolean;
  advertiser_name?: string;
  allowed_traffic_sources?: string[];
  restricted_geos?: string[];
  target_audience?: string;
  restrictions?: string;
  marketing_materials?: any;
  conversion_requirements?: string;
  geo_targets?: string[] | string | Record<string, any> | null;
  offer_image?: string;
  payout_frequency?: string;
};
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
