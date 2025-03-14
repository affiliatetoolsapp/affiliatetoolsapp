export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      affiliate_offers: {
        Row: {
          affiliate_id: string | null
          applied_at: string | null
          id: string
          notes: string | null
          offer_id: string | null
          reviewed_at: string | null
          status: string | null
          traffic_source: string | null
        }
        Insert: {
          affiliate_id?: string | null
          applied_at?: string | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          reviewed_at?: string | null
          status?: string | null
          traffic_source?: string | null
        }
        Update: {
          affiliate_id?: string | null
          applied_at?: string | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          reviewed_at?: string | null
          status?: string | null
          traffic_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_offers_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "affiliate_offer_details"
            referencedColumns: ["o_id"]
          },
          {
            foreignKeyName: "affiliate_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      clicks: {
        Row: {
          affiliate_id: string | null
          click_id: string
          created_at: string | null
          custom_params: Json | null
          device: string | null
          geo: string | null
          id: string
          ip_address: string | null
          offer_id: string | null
          referrer: string | null
          tracking_code: string
          user_agent: string | null
        }
        Insert: {
          affiliate_id?: string | null
          click_id: string
          created_at?: string | null
          custom_params?: Json | null
          device?: string | null
          geo?: string | null
          id?: string
          ip_address?: string | null
          offer_id?: string | null
          referrer?: string | null
          tracking_code: string
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string | null
          click_id?: string
          created_at?: string | null
          custom_params?: Json | null
          device?: string | null
          geo?: string | null
          id?: string
          ip_address?: string | null
          offer_id?: string | null
          referrer?: string | null
          tracking_code?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "affiliate_offer_details"
            referencedColumns: ["o_id"]
          },
          {
            foreignKeyName: "clicks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversions: {
        Row: {
          click_id: string | null
          commission: number | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          revenue: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          click_id?: string | null
          commission?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          revenue?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          click_id?: string | null
          commission?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          revenue?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "clicks"
            referencedColumns: ["click_id"]
          },
        ]
      }
      custom_postbacks: {
        Row: {
          affiliate_id: string
          created_at: string
          events: string[] | null
          id: string
          postback_url: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          events?: string[] | null
          id?: string
          postback_url?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          events?: string[] | null
          id?: string
          postback_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_postbacks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          advertiser_id: string | null
          allowed_traffic_sources: string[] | null
          commission_amount: number | null
          commission_percent: number | null
          commission_type: string
          conversion_requirements: string | null
          created_at: string | null
          description: string | null
          featured_until: string | null
          geo_targets: Json | null
          id: string
          is_featured: boolean
          marketing_materials: Json | null
          name: string
          niche: string | null
          restricted_geos: string[] | null
          restrictions: string | null
          status: string | null
          target_audience: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          advertiser_id?: string | null
          allowed_traffic_sources?: string[] | null
          commission_amount?: number | null
          commission_percent?: number | null
          commission_type: string
          conversion_requirements?: string | null
          created_at?: string | null
          description?: string | null
          featured_until?: string | null
          geo_targets?: Json | null
          id?: string
          is_featured?: boolean
          marketing_materials?: Json | null
          name: string
          niche?: string | null
          restricted_geos?: string[] | null
          restrictions?: string | null
          status?: string | null
          target_audience?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          advertiser_id?: string | null
          allowed_traffic_sources?: string[] | null
          commission_amount?: number | null
          commission_percent?: number | null
          commission_type?: string
          conversion_requirements?: string | null
          created_at?: string | null
          description?: string | null
          featured_until?: string | null
          geo_targets?: Json | null
          id?: string
          is_featured?: boolean
          marketing_materials?: Json | null
          name?: string
          niche?: string | null
          restricted_geos?: string[] | null
          restrictions?: string | null
          status?: string | null
          target_audience?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          advertiser_id: string | null
          affiliate_id: string | null
          amount: number
          created_at: string | null
          fee: number
          id: string
          payment_details: Json | null
          payment_method: string | null
          status: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          advertiser_id?: string | null
          affiliate_id?: string | null
          amount: number
          created_at?: string | null
          fee: number
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          status?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string | null
          affiliate_id?: string | null
          amount?: number
          created_at?: string | null
          fee?: number
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          status?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          method: string
          processed_at: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          method: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          method?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      tracking_links: {
        Row: {
          affiliate_id: string | null
          created_at: string | null
          custom_params: Json | null
          id: string
          link_type: string
          offer_id: string | null
          tracking_code: string
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string | null
          custom_params?: Json | null
          id?: string
          link_type?: string
          offer_id?: string | null
          tracking_code: string
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string | null
          custom_params?: Json | null
          id?: string
          link_type?: string
          offer_id?: string | null
          tracking_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_links_affiliate_id_offer_id_fkey"
            columns: ["affiliate_id", "offer_id"]
            isOneToOne: false
            referencedRelation: "affiliate_offer_details"
            referencedColumns: ["affiliate_id", "ao_offer_id"]
          },
          {
            foreignKeyName: "tracking_links_affiliate_id_offer_id_fkey"
            columns: ["affiliate_id", "offer_id"]
            isOneToOne: false
            referencedRelation: "affiliate_offers"
            referencedColumns: ["affiliate_id", "offer_id"]
          },
          {
            foreignKeyName: "tracking_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "affiliate_offer_details"
            referencedColumns: ["o_id"]
          },
          {
            foreignKeyName: "tracking_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          email: string
          id: string
          phone: string | null
          role: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email: string
          id: string
          phone?: string | null
          role: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          pending: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          pending?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          pending?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      affiliate_offer_details: {
        Row: {
          advertiser_id: string | null
          advertiser_name: string | null
          affiliate_id: string | null
          affiliate_offer_id: string | null
          allowed_traffic_sources: string[] | null
          ao_offer_id: string | null
          application_status: string | null
          applied_at: string | null
          commission_amount: number | null
          commission_percent: number | null
          commission_type: string | null
          conversion_requirements: string | null
          description: string | null
          featured_until: string | null
          geo_targets: Json | null
          is_featured: boolean | null
          marketing_materials: Json | null
          niche: string | null
          notes: string | null
          o_id: string | null
          offer_created_at: string | null
          offer_name: string | null
          offer_status: string | null
          offer_updated_at: string | null
          restricted_geos: string[] | null
          restrictions: string | null
          reviewed_at: string | null
          target_audience: string | null
          traffic_source: string | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_offers_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_offers_offer_id_fkey"
            columns: ["ao_offer_id"]
            isOneToOne: false
            referencedRelation: "affiliate_offer_details"
            referencedColumns: ["o_id"]
          },
          {
            foreignKeyName: "affiliate_offers_offer_id_fkey"
            columns: ["ao_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_advertiser_pending_applications: {
        Args: {
          advertiser_id: string
        }
        Returns: {
          id: string
          offer_id: string
          affiliate_id: string
          applied_at: string
          traffic_source: string
          notes: string
          status: string
          reviewed_at: string
          offers: Json
          users: Json
        }[]
      }
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      log_conversion: {
        Args: {
          p_click_id: string
          p_event_type: string
          p_revenue: number
          p_metadata: Json
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
