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
      business_hours_overrides: {
        Row: {
          business_id: string
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          notes: string | null
          open_time: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_id: string
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          notes?: string | null
          open_time?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_id?: string
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          notes?: string | null
          open_time?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      business_offers: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          description: string | null
          id: string
          owner_user_id: string
          title: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          owner_user_id: string
          title: string
          valid_from?: string
          valid_to: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          owner_user_id?: string
          title?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: []
      }
      business_ownership: {
        Row: {
          admin_notes: string | null
          business_id: string
          created_at: string | null
          document_url: string | null
          id: string
          oib: string | null
          owner_user_id: string | null
          updated_at: string | null
          verification_level: number | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_id: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          oib?: string | null
          owner_user_id?: string | null
          updated_at?: string | null
          verification_level?: number | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_id?: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          oib?: string | null
          owner_user_id?: string | null
          updated_at?: string | null
          verification_level?: number | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      cafe_smoking_reports: {
        Row: {
          business_id: string
          created_at: string
          fingerprint_hash: string
          id: string
          ip_hash: string | null
          report_value: string
        }
        Insert: {
          business_id: string
          created_at?: string
          fingerprint_hash: string
          id?: string
          ip_hash?: string | null
          report_value: string
        }
        Update: {
          business_id?: string
          created_at?: string
          fingerprint_hash?: string
          id?: string
          ip_hash?: string | null
          report_value?: string
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
      city_alerts: {
        Row: {
          created_at: string
          geo_relevance: string | null
          hash: string
          id: string
          priority: number
          source: string
          source_url: string | null
          summary: string
          title: string
          type: string
          updated_at: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          geo_relevance?: string | null
          hash: string
          id?: string
          priority?: number
          source?: string
          source_url?: string | null
          summary: string
          title: string
          type?: string
          updated_at?: string
          valid_until: string
        }
        Update: {
          created_at?: string
          geo_relevance?: string | null
          hash?: string
          id?: string
          priority?: number
          source?: string
          source_url?: string | null
          summary?: string
          title?: string
          type?: string
          updated_at?: string
          valid_until?: string
        }
        Relationships: []
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
      city_events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          event_date_from: string | null
          event_date_to: string | null
          hash: string
          id: string
          image_url: string | null
          location: string | null
          region: string
          source: string
          title: string
          updated_at: string
          venue: string | null
          website_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          event_date_from?: string | null
          event_date_to?: string | null
          hash: string
          id?: string
          image_url?: string | null
          location?: string | null
          region?: string
          source: string
          title: string
          updated_at?: string
          venue?: string | null
          website_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          event_date_from?: string | null
          event_date_to?: string | null
          hash?: string
          id?: string
          image_url?: string | null
          location?: string | null
          region?: string
          source?: string
          title?: string
          updated_at?: string
          venue?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      city_pulse_votes: {
        Row: {
          created_at: string
          fingerprint_hash: string
          id: string
          vote_level: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          fingerprint_hash: string
          id?: string
          vote_level: string
          zone_id: string
        }
        Update: {
          created_at?: string
          fingerprint_hash?: string
          id?: string
          vote_level?: string
          zone_id?: string
        }
        Relationships: []
      }
      daily_poll: {
        Row: {
          context_hash: string | null
          context_key: string
          context_type: string
          created_at: string
          expires_at: string
          id: string
          question_text: string
        }
        Insert: {
          context_hash?: string | null
          context_key?: string
          context_type?: string
          created_at?: string
          expires_at: string
          id?: string
          question_text: string
        }
        Update: {
          context_hash?: string | null
          context_key?: string
          context_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          question_text?: string
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
      ev_charger_reports: {
        Row: {
          charger_id: string
          created_at: string
          id: string
          status: string
          user_hash: string
        }
        Insert: {
          charger_id: string
          created_at?: string
          id?: string
          status: string
          user_hash: string
        }
        Update: {
          charger_id?: string
          created_at?: string
          id?: string
          status?: string
          user_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "ev_charger_reports_charger_id_fkey"
            columns: ["charger_id"]
            isOneToOne: false
            referencedRelation: "ev_chargers"
            referencedColumns: ["id"]
          },
        ]
      }
      ev_chargers: {
        Row: {
          address: string | null
          confidence: number
          created_at: string
          id: string
          last_reported_at: string | null
          lat: number
          lng: number
          name: string
          operator: string | null
          osm_id: string | null
          plug_count: number | null
          plug_types: string[] | null
          power_kw: number | null
          source: string
          status: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          address?: string | null
          confidence?: number
          created_at?: string
          id?: string
          last_reported_at?: string | null
          lat: number
          lng: number
          name: string
          operator?: string | null
          osm_id?: string | null
          plug_count?: number | null
          plug_types?: string[] | null
          power_kw?: number | null
          source?: string
          status?: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          address?: string | null
          confidence?: number
          created_at?: string
          id?: string
          last_reported_at?: string | null
          lat?: number
          lng?: number
          name?: string
          operator?: string | null
          osm_id?: string | null
          plug_count?: number | null
          plug_types?: string[] | null
          power_kw?: number | null
          source?: string
          status?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      health_places: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          enabled: boolean
          head_doctor: string | null
          hours: Json | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          neighborhood: string | null
          notes: string | null
          phone: string | null
          specialty: string | null
          subcategory: string
          updated_at: string
          updated_by: string | null
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          enabled?: boolean
          head_doctor?: string | null
          hours?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          specialty?: string | null
          subcategory: string
          updated_at?: string
          updated_by?: string | null
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          enabled?: boolean
          head_doctor?: string | null
          hours?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          specialty?: string | null
          subcategory?: string
          updated_at?: string
          updated_by?: string | null
          verified?: boolean
          website?: string | null
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
      owner_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
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
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          attempts: number | null
          business_id: string
          code_hash: string
          created_at: string | null
          document_url: string | null
          email: string
          expires_at: string
          id: string
          ip: string | null
          last_attempt_at: string | null
          oib: string | null
          rejection_reason: string | null
          requester_user_id: string | null
          status: string | null
          user_agent: string | null
          verification_level: number | null
        }
        Insert: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          attempts?: number | null
          business_id: string
          code_hash: string
          created_at?: string | null
          document_url?: string | null
          email: string
          expires_at: string
          id?: string
          ip?: string | null
          last_attempt_at?: string | null
          oib?: string | null
          rejection_reason?: string | null
          requester_user_id?: string | null
          status?: string | null
          user_agent?: string | null
          verification_level?: number | null
        }
        Update: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          attempts?: number | null
          business_id?: string
          code_hash?: string
          created_at?: string | null
          document_url?: string | null
          email?: string
          expires_at?: string
          id?: string
          ip?: string | null
          last_attempt_at?: string | null
          oib?: string | null
          rejection_reason?: string | null
          requester_user_id?: string | null
          status?: string | null
          user_agent?: string | null
          verification_level?: number | null
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
      pending_places: {
        Row: {
          category: string
          created_at: string
          fingerprint_hash: string
          id: string
          ip_hash: string | null
          lat: number | null
          lng: number | null
          notes: string | null
          phone: string | null
          proposed_address: string
          proposed_name: string
          proposed_smoking_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitter_email: string | null
          website: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          fingerprint_hash: string
          id?: string
          ip_hash?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          phone?: string | null
          proposed_address: string
          proposed_name: string
          proposed_smoking_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitter_email?: string | null
          website?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          fingerprint_hash?: string
          id?: string
          ip_hash?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          phone?: string | null
          proposed_address?: string
          proposed_name?: string
          proposed_smoking_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitter_email?: string | null
          website?: string | null
        }
        Relationships: []
      }
      poll_history: {
        Row: {
          context_hash: string | null
          context_key: string
          context_type: string
          created_at: string
          expire_reason: string
          expired_at: string
          id: string
          original_poll_id: string
          question_text: string
          total_votes: number
        }
        Insert: {
          context_hash?: string | null
          context_key?: string
          context_type?: string
          created_at?: string
          expire_reason?: string
          expired_at?: string
          id?: string
          original_poll_id: string
          question_text: string
          total_votes?: number
        }
        Update: {
          context_hash?: string | null
          context_key?: string
          context_type?: string
          created_at?: string
          expire_reason?: string
          expired_at?: string
          id?: string
          original_poll_id?: string
          question_text?: string
          total_votes?: number
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          option_text: string
          poll_id: string
          votes_count: number
        }
        Insert: {
          id?: string
          option_text: string
          poll_id: string
          votes_count?: number
        }
        Update: {
          id?: string
          option_text?: string
          poll_id?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "daily_poll"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          fingerprint_hash: string
          id: string
          option_id: string
          poll_id: string
        }
        Insert: {
          created_at?: string
          fingerprint_hash: string
          id?: string
          option_id: string
          poll_id: string
        }
        Update: {
          created_at?: string
          fingerprint_hash?: string
          id?: string
          option_id?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "daily_poll"
            referencedColumns: ["id"]
          },
        ]
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
      public_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      quest_checkpoints: {
        Row: {
          challenge_correct: string | null
          challenge_options: Json | null
          challenge_question: Json | null
          challenge_type: string
          created_at: string
          id: string
          lat: number
          lng: number
          local_tip: Json | null
          order_num: number
          points: number
          quest_id: string
          radius_inner: number
          radius_outer: number
          story: Json | null
          updated_at: string
        }
        Insert: {
          challenge_correct?: string | null
          challenge_options?: Json | null
          challenge_question?: Json | null
          challenge_type?: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          local_tip?: Json | null
          order_num?: number
          points?: number
          quest_id: string
          radius_inner?: number
          radius_outer?: number
          story?: Json | null
          updated_at?: string
        }
        Update: {
          challenge_correct?: string | null
          challenge_options?: Json | null
          challenge_question?: Json | null
          challenge_type?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          local_tip?: Json | null
          order_num?: number
          points?: number
          quest_id?: string
          radius_inner?: number
          radius_outer?: number
          story?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_checkpoints_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_progress: {
        Row: {
          checkpoints_completed: Json | null
          completed_at: string | null
          created_at: string
          id: string
          quest_id: string
          session_id: string
          started_at: string
          status: string
          total_points: number
        }
        Insert: {
          checkpoints_completed?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          quest_id: string
          session_id: string
          started_at?: string
          status?: string
          total_points?: number
        }
        Update: {
          checkpoints_completed?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          quest_id?: string
          session_id?: string
          started_at?: string
          status?: string
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          active: boolean
          availability: string
          created_at: string
          description: Json | null
          duration_minutes: number | null
          id: string
          time_end: string | null
          time_start: string | null
          title: Json
          total_points: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          availability?: string
          created_at?: string
          description?: Json | null
          duration_minutes?: number | null
          id?: string
          time_end?: string | null
          time_start?: string | null
          title: Json
          total_points?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          availability?: string
          created_at?: string
          description?: Json | null
          duration_minutes?: number | null
          id?: string
          time_end?: string | null
          time_start?: string | null
          title?: Json
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_sunday_schedule: {
        Row: {
          business_id: string
          close_time: string | null
          created_at: string
          id: string
          notes: string | null
          open_time: string | null
          sunday_date: string
          updated_at: string
        }
        Insert: {
          business_id: string
          close_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          open_time?: string | null
          sunday_date: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          close_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          open_time?: string | null
          sunday_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      sports_events: {
        Row: {
          api_match_id: string | null
          away_score: number | null
          away_team: string
          confidence: number | null
          created_at: string
          fetched_at: string | null
          home_score: number | null
          home_team: string
          id: string
          is_local_team: boolean
          is_stale: boolean | null
          league: string | null
          link_url: string | null
          manual_expires_at: string | null
          match_minute: string | null
          match_status: string
          round: string | null
          source: string
          source_url: string | null
          sport: string
          start_time: string
          team_tag: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          api_match_id?: string | null
          away_score?: number | null
          away_team: string
          confidence?: number | null
          created_at?: string
          fetched_at?: string | null
          home_score?: number | null
          home_team: string
          id?: string
          is_local_team?: boolean
          is_stale?: boolean | null
          league?: string | null
          link_url?: string | null
          manual_expires_at?: string | null
          match_minute?: string | null
          match_status?: string
          round?: string | null
          source?: string
          source_url?: string | null
          sport?: string
          start_time: string
          team_tag?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          api_match_id?: string | null
          away_score?: number | null
          away_team?: string
          confidence?: number | null
          created_at?: string
          fetched_at?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          is_local_team?: boolean
          is_stale?: boolean | null
          league?: string | null
          link_url?: string | null
          manual_expires_at?: string | null
          match_minute?: string | null
          match_status?: string
          round?: string | null
          source?: string
          source_url?: string | null
          sport?: string
          start_time?: string
          team_tag?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      sports_fetch_status: {
        Row: {
          consecutive_failures: number
          fetched_count: number
          id: string
          last_run_at: string
          message: string | null
          ok: boolean
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          fetched_count?: number
          id?: string
          last_run_at?: string
          message?: string | null
          ok?: boolean
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          fetched_count?: number
          id?: string
          last_run_at?: string
          message?: string | null
          ok?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sports_manual_submissions: {
        Row: {
          away_team: string
          competition: string | null
          created_at: string
          home_team: string
          id: string
          link_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sport: string
          start_time: string
          status: string
          submitted_by_fingerprint: string
          team_tag: string
          venue: string | null
        }
        Insert: {
          away_team: string
          competition?: string | null
          created_at?: string
          home_team: string
          id?: string
          link_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sport?: string
          start_time: string
          status?: string
          submitted_by_fingerprint: string
          team_tag?: string
          venue?: string | null
        }
        Update: {
          away_team?: string
          competition?: string | null
          created_at?: string
          home_team?: string
          id?: string
          link_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sport?: string
          start_time?: string
          status?: string
          submitted_by_fingerprint?: string
          team_tag?: string
          venue?: string | null
        }
        Relationships: []
      }
      sports_sources_health: {
        Row: {
          last_error: string | null
          last_success_at: string | null
          source: string
          updated_at: string
        }
        Insert: {
          last_error?: string | null
          last_success_at?: string | null
          source: string
          updated_at?: string
        }
        Update: {
          last_error?: string | null
          last_success_at?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      sports_teams_cache: {
        Row: {
          api_team_id: number
          fetched_at: string
          id: string
          name: string
          sport: string
        }
        Insert: {
          api_team_id: number
          fetched_at?: string
          id?: string
          name: string
          sport?: string
        }
        Update: {
          api_team_id?: number
          fetched_at?: string
          id?: string
          name?: string
          sport?: string
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
      increment_poll_vote: { Args: { p_option_id: string }; Returns: undefined }
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
