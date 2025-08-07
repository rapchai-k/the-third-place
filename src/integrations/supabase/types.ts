export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          city: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_comments: {
        Row: {
          created_at: string
          discussion_id: string
          flagged_count: number
          id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discussion_id: string
          flagged_count?: number
          id?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discussion_id?: string
          flagged_count?: number
          id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_comments_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          community_id: string
          created_at: string
          created_by: string
          expires_at: string
          extended: boolean
          id: string
          is_visible: boolean
          prompt: string | null
          title: string
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by: string
          expires_at: string
          extended?: boolean
          id?: string
          is_visible?: boolean
          prompt?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          extended?: boolean
          id?: string
          is_visible?: boolean
          prompt?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          payment_id: string | null
          payment_session_id: string | null
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          payment_id?: string | null
          payment_session_id?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          payment_id?: string | null
          payment_session_id?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_payment_session_id_fkey"
            columns: ["payment_session_id"]
            isOneToOne: false
            referencedRelation: "payment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          event_id: string
          tag_id: string
        }
        Insert: {
          event_id: string
          tag_id: string
        }
        Update: {
          event_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          community_id: string
          created_at: string
          currency: string | null
          date_time: string
          description: string | null
          host_id: string | null
          id: string
          image_url: string | null
          is_cancelled: boolean
          price: number | null
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          capacity: number
          community_id: string
          created_at?: string
          currency?: string | null
          date_time: string
          description?: string | null
          host_id?: string | null
          id?: string
          image_url?: string | null
          is_cancelled?: boolean
          price?: number | null
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          capacity?: number
          community_id?: string
          created_at?: string
          currency?: string | null
          date_time?: string
          description?: string | null
          host_id?: string | null
          id?: string
          image_url?: string | null
          is_cancelled?: boolean
          price?: number | null
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          comment_id: string | null
          created_at: string
          flagged_by_id: string
          flagged_user_id: string
          id: string
          reason: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          flagged_by_id: string
          flagged_user_id: string
          id?: string
          reason: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          flagged_by_id?: string
          flagged_user_id?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "discussion_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_flagged_by_id_fkey"
            columns: ["flagged_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_flagged_user_id_fkey"
            columns: ["flagged_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email: boolean
          sms: boolean
          updated_at: string
          user_id: string
          whatsapp: boolean
        }
        Insert: {
          created_at?: string
          email?: boolean
          sms?: boolean
          updated_at?: string
          user_id: string
          whatsapp?: boolean
        }
        Update: {
          created_at?: string
          email?: boolean
          sms?: boolean
          updated_at?: string
          user_id?: string
          whatsapp?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          cashfree_signature: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          payment_session_id: string
        }
        Insert: {
          cashfree_signature?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          payment_session_id: string
        }
        Update: {
          cashfree_signature?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          payment_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_payment_session_id_fkey"
            columns: ["payment_session_id"]
            isOneToOne: false
            referencedRelation: "payment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_sessions: {
        Row: {
          amount: number
          cashfree_order_id: string | null
          cashfree_payment_id: string | null
          created_at: string
          currency: string
          event_id: string
          expires_at: string
          id: string
          payment_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          created_at?: string
          currency?: string
          event_id: string
          expires_at?: string
          id?: string
          payment_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          expires_at?: string
          id?: string
          payment_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          joined_at: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action_type: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action_type: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action_type?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge: string
          granted_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge: string
          granted_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge?: string
          granted_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          is_banned: boolean
          name: string
          photo_url: string | null
          referral_code: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_banned?: boolean
          name: string
          photo_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_banned?: boolean
          name?: string
          photo_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configurations: {
        Row: {
          created_at: string
          created_by: string
          events: string[]
          id: string
          is_active: boolean
          name: string
          secret_key: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          events: string[]
          id?: string
          is_active?: boolean
          name: string
          secret_key?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          secret_key?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          last_attempt_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
          webhook_config_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          last_attempt_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          webhook_config_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          webhook_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dispatch_webhook: {
        Args: { event_type: string; event_data: Json; actor_user_id?: string }
        Returns: undefined
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      registration_status: "pending" | "success" | "failed" | "cancelled"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      registration_status: ["pending", "success", "failed", "cancelled"],
      user_role: ["user", "admin"],
    },
  },
} as const
