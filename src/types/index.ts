
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

// Commission type definition
export type CommissionType = 'CPC' | 'CPL' | 'CPA' | 'CPS' | 'RevShare';

// Event type definition for conversions
export type EventType = 'lead' | 'sale' | 'action' | 'deposit';

// Approval status definition
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// Payment status definition
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
  status: 'active' | 'paused' | 'deleted';
  created_at: string;
  updated_at: string;
  // Additional fields as per PRD
  daily_cap?: number;
  weekly_cap?: number;
  monthly_cap?: number;
  budget_cap?: number;
  is_featured?: boolean;
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

export interface TrackingLink {
  id: string;
  affiliate_id: string;
  offer_id: string;
  tracking_code: string;
  custom_params?: Record<string, string>;
  created_at: string;
  link_type?: 'direct' | 'shortened' | 'qr';
  qr_code_url?: string;
}

export interface SmartLink {
  id: string;
  affiliate_id: string;
  offer_ids: string[];
  smart_link_id: string;
  rules?: {
    geo?: string[];
    device?: string[];
    time?: string[];
    [key: string]: any;
  };
  created_at: string;
}

export interface CustomPixel {
  id: string;
  user_id: string; // Can be either affiliate_id or advertiser_id
  pixel_code: string;
  type: 'js' | 'img';
  created_at: string;
}

export interface CustomPostback {
  id: string;
  affiliate_id: string;
  url: string;
  events: EventType[];
  created_at: string;
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
  custom_params?: Record<string, string>;
  created_at: string;
}

export interface Conversion {
  id: string;
  click_id: string;
  event_type: EventType;
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
  status: PaymentStatus;
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

export interface PayoutRequest {
  id: string;
  affiliate_id: string;
  amount: number;
  method: 'paypal' | 'bank' | 'crypto';
  status: PaymentStatus;
  created_at: string;
  processed_at?: string;
}
