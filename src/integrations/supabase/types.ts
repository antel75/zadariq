export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      business_ownership: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          owner_user_id: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          owner_user_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          owner_user_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      cinema_movies: {
        Row: {
          age_rating: string | null
          cinestar_url: string | null
          created_at: string
          description: string | null
          duration: string | null
          genre: string | null
          id: string
          poster_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          age_rating?: string | null
          cinestar_url?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          poster_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          age_rating?: string | null
          cinestar_url?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          poster_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cinema_screenings: {
        Row: {
          created_at: string
          format: string | null
          hall: string | null
          id: string
          movie_id: string
          screening_date: string
          screening_time: string
        }
        Insert: {
          created_at?: string
          format?: string | null
          hall?: string | null
          id?: string
          movie_id: string
          screening_date: string
          screening_time: string
        }
        Update: {
          created_at?: string
          format?: string | null
          hall?: string | null
          id?: string
          movie_id?: string
          screening_date?: string
          screening_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "cinema_screenings_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "cinema_movies"
            referencedColumns: ["id"]
          },
        ]
      }
      city_contacts: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          maps_url: string | null
          name: string
          phone: string | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          maps_url?: string | null
          name: string
          phone?: string | null
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          maps_url?: string | null
          name?: string
          phone?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      duty_services: {
        Row: {
          address: string | null
          created_at: string
          enabled: boolean
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["info_source"]
          type: Database["public"]["Enums"]["duty_service_type"]
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["info_source"]
          type: Database["public"]["Enums"]["duty_service_type"]
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["info_source"]
          type?: Database["public"]["Enums"]["duty_service_type"]
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      kino_zona_movies: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          duration: string | null
          genre: string | null
          id: string
          kino_zona_url: string | null
          poster_url: string | null
          title: string
          trailer_url: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          kino_zona_url?: string | null
          poster_url?: string | null
          title: string
          trailer_url?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          kino_zona_url?: string | null
          poster_url?: string | null
          title?: string
          trailer_url?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      kino_zona_screenings: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          screening_date: string
          screening_time: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          screening_date: string
          screening_time: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          screening_date?: string
          screening_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "kino_zona_screenings_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "kino_zona_movies"
            referencedColumns: ["id"]
          },
        ]
      }
      open_now_places: {
        Row: {
          address: string | null
          category: string
          created_at: string
          enabled: boolean
          id: string
          maps_url: string | null
          name: string
          open_247: boolean
          open_from: string | null
          open_until: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string
          enabled?: boolean
          id?: string
          maps_url?: string | null
          name: string
          open_247?: boolean
          open_from?: string | null
          open_until?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          enabled?: boolean
          id?: string
          maps_url?: string | null
          name?: string
          open_247?: boolean
          open_from?: string | null
          open_until?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ownership_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          business_id: string | null
          created_at: string | null
          details: Json | null
          email: string | null
          id: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          business_id?: string | null
          created_at?: string | null
          details?: Json | null
          email?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          business_id?: string | null
          created_at?: string | null
          details?: Json | null
          email?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ownership_claim_requests: {
        Row: {
          attempts: number | null
          business_id: string
          code_hash: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          ip: string | null
          last_attempt_at: string | null
          requester_user_id: string | null
          status: string | null
          user_agent: string | null
        }
        Insert: {
          attempts?: number | null
          business_id: string
          code_hash: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          ip?: string | null
          last_attempt_at?: string | null
          requester_user_id?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          attempts?: number | null
          business_id?: string
          code_hash?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          ip?: string | null
          last_attempt_at?: string | null
          requester_user_id?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      pending_changes: {
        Row: {
          confidence_score: number
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string
          fingerprint_hash: string
          id: string
          ip_hash: string | null
          old_value: string | null
          proposed_value: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          entity_id: string
          entity_type: string
          field_name: string
          fingerprint_hash: string
          id?: string
          ip_hash?: string | null
          old_value?: string | null
          proposed_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string
          fingerprint_hash?: string
          id?: string
          ip_hash?: string | null
          old_value?: string | null
          proposed_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      power_outages: {
        Row: {
          area: string
          created_at: string
          id: string
          outage_date: string
          raw_text: string | null
          reason: string | null
          time_from: string | null
          time_until: string | null
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          outage_date: string
          raw_text?: string | null
          reason?: string | null
          time_from?: string | null
          time_until?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          outage_date?: string
          raw_text?: string | null
          reason?: string | null
          time_from?: string | null
          time_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transport_schedules: {
        Row: {
          carrier: string | null
          created_at: string
          days_of_week: number[] | null
          departure_time: string
          destination: string | null
          enabled: boolean
          id: string
          line_name: string
          platform: string | null
          port_or_station: string | null
          route: string | null
          source: Database["public"]["Enums"]["info_source"]
          type: Database["public"]["Enums"]["transport_type"]
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          days_of_week?: number[] | null
          departure_time: string
          destination?: string | null
          enabled?: boolean
          id?: string
          line_name: string
          platform?: string | null
          port_or_station?: string | null
          route?: string | null
          source?: Database["public"]["Enums"]["info_source"]
          type: Database["public"]["Enums"]["transport_type"]
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          days_of_week?: number[] | null
          departure_time?: string
          destination?: string | null
          enabled?: boolean
          id?: string
          line_name?: string
          platform?: string | null
          port_or_station?: string | null
          route?: string | null
          source?: Database["public"]["Enums"]["info_source"]
          type?: Database["public"]["Enums"]["transport_type"]
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      water_outages: {
        Row: {
          area: string
          created_at: string
          id: string
          outage_date: string | null
          published_date: string
          raw_text: string
          time_from: string | null
          time_until: string | null
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          outage_date?: string | null
          published_date: string
          raw_text: string
          time_from?: string | null
          time_until?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          outage_date?: string | null
          published_date?: string
          raw_text?: string
          time_from?: string | null
          time_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      duty_service_type: "pharmacy" | "dentist" | "doctor" | "night_service"
      info_source: "phone" | "website" | "official" | "owner_confirmed"
      transport_type: "ferry" | "catamaran" | "city_bus" | "intercity_bus"
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
      app_role: ["admin", "moderator", "user"],
      duty_service_type: ["pharmacy", "dentist", "doctor", "night_service"],
      info_source: ["phone", "website", "official", "owner_confirmed"],
      transport_type: ["ferry", "catamaran", "city_bus", "intercity_bus"],
    },
  },
} as const
