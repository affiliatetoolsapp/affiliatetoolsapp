
export type UserRole = 'admin' | 'advertiser' | 'affiliate';

export type CommissionType = 'CPC' | 'CPL' | 'CPA' | 'CPS' | 'RevShare';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ConversionEventType = 'lead' | 'sale' | 'action' | 'deposit';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type PaymentMethod = 'paypal' | 'bank_transfer' | 'crypto';

export type LinkType = 'direct' | 'shortened' | 'qr';

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
  commission_type: CommissionType;
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
  status: ApprovalStatus;
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
  event_type: ConversionEventType;
  revenue?: number;
  commission?: number;
  status: ApprovalStatus;
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
  status: PaymentStatus;
  payment_method?: PaymentMethod;
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

export interface SmartLink {
  id: string;
  affiliate_id: string;
  name: string;
  smart_link_id: string;
  rules: any;
  created_at: string;
}

export interface PixelCode {
  id: string;
  user_id: string;
  pixel_code: string;
  type: 'js' | 'img';
  created_at: string;
}

export interface PostbackUrl {
  id: string;
  affiliate_id: string;
  url: string;
  events: ConversionEventType[];
  created_at: string;
}
