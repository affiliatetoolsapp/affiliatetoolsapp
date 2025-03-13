export type UserRole = 'admin' | 'advertiser' | 'affiliate';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  company_name?: string;
  contact_name?: string;
  website?: string;
  bio?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  advertiser_id: string;
  name: string;
  description?: string;
  url: string;
  commission_type: 'CPC' | 'CPL' | 'CPA' | 'CPS' | 'RevShare';
  commission_amount?: number;
  commission_percent?: number;
  niche?: string;
  geo_targets?: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateOffer {
  id: string;
  affiliate_id: string;
  offer_id: string;
  status: 'pending' | 'approved' | 'rejected';
  traffic_source?: string;
  notes?: string;
  applied_at: string;
  reviewed_at?: string;
}

export interface Click {
  id: string;
  click_id: string;
  tracking_code: string;
  affiliate_id: string;
  offer_id: string;
  ip_address?: string;
  user_agent?: string;
  device?: string;
  geo?: string;
  referrer?: string;
  custom_params?: any;
  created_at: string;
}

export interface Conversion {
  id: string;
  click_id: string;
  event_type: 'lead' | 'sale' | 'action' | 'deposit';
  revenue?: number;
  commission?: number;
  status: 'pending' | 'approved' | 'rejected';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  advertiser_id: string;
  affiliate_id: string;
  amount: number;
  fee: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method?: string;
  payment_details?: any;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  pending: number;
  created_at: string;
  updated_at: string;
}

export interface TrackingLink {
  id: string;
  affiliate_id: string;
  offer_id: string;
  tracking_code: string;
  custom_params?: any;
  created_at: string;
}
