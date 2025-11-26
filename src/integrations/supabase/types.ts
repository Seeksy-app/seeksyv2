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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_description: string
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          user_id: string
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ad_call_inquiries: {
        Row: {
          advertiser_id: string | null
          audio_ad_id: string | null
          call_duration_seconds: number | null
          call_end: string | null
          call_start: string
          caller_number: string
          campaign_id: string | null
          created_at: string | null
          id: string
          is_billable: boolean | null
          is_qualified: boolean | null
          promo_code_used: string | null
        }
        Insert: {
          advertiser_id?: string | null
          audio_ad_id?: string | null
          call_duration_seconds?: number | null
          call_end?: string | null
          call_start: string
          caller_number: string
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_billable?: boolean | null
          is_qualified?: boolean | null
          promo_code_used?: string | null
        }
        Update: {
          advertiser_id?: string | null
          audio_ad_id?: string | null
          call_duration_seconds?: number | null
          call_end?: string | null
          call_start?: string
          caller_number?: string
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_billable?: boolean | null
          is_qualified?: boolean | null
          promo_code_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_call_inquiries_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_call_inquiries_audio_ad_id_fkey"
            columns: ["audio_ad_id"]
            isOneToOne: false
            referencedRelation: "audio_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_call_inquiries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          advertiser_id: string | null
          budget: number
          campaign_type: string
          cpm_bid: number
          created_at: string | null
          end_date: string
          id: string
          max_impressions: number | null
          name: string
          remaining_impressions: number | null
          start_date: string
          status: string
          targeting_rules: Json | null
          total_impressions: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          advertiser_id?: string | null
          budget: number
          campaign_type?: string
          cpm_bid: number
          created_at?: string | null
          end_date: string
          id?: string
          max_impressions?: number | null
          name: string
          remaining_impressions?: number | null
          start_date: string
          status?: string
          targeting_rules?: Json | null
          total_impressions?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string | null
          budget?: number
          campaign_type?: string
          cpm_bid?: number
          created_at?: string | null
          end_date?: string
          id?: string
          max_impressions?: number | null
          name?: string
          remaining_impressions?: number | null
          start_date?: string
          status?: string
          targeting_rules?: Json | null
          total_impressions?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          audio_url: string | null
          campaign_id: string
          created_at: string | null
          creative_type: string
          duration_seconds: number
          id: string
          updated_at: string | null
          vast_tag_url: string | null
        }
        Insert: {
          audio_url?: string | null
          campaign_id: string
          created_at?: string | null
          creative_type: string
          duration_seconds: number
          id?: string
          updated_at?: string | null
          vast_tag_url?: string | null
        }
        Update: {
          audio_url?: string | null
          campaign_id?: string
          created_at?: string | null
          creative_type?: string
          duration_seconds?: number
          id?: string
          updated_at?: string | null
          vast_tag_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_cta_clicks: {
        Row: {
          ad_slot_id: string
          campaign_id: string | null
          clicked_at: string | null
          creator_id: string
          episode_id: string
          id: string
          listener_ip_hash: string
          podcast_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          ad_slot_id: string
          campaign_id?: string | null
          clicked_at?: string | null
          creator_id: string
          episode_id: string
          id?: string
          listener_ip_hash: string
          podcast_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          ad_slot_id?: string
          campaign_id?: string | null
          clicked_at?: string | null
          creator_id?: string
          episode_id?: string
          id?: string
          listener_ip_hash?: string
          podcast_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_cta_clicks_ad_slot_id_fkey"
            columns: ["ad_slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_cta_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_cta_clicks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_cta_clicks_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          ad_slot_id: string
          campaign_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          creator_id: string
          episode_id: string
          id: string
          is_valid: boolean | null
          listener_ip_hash: string
          played_at: string | null
          podcast_id: string
          user_agent: string | null
        }
        Insert: {
          ad_slot_id: string
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          creator_id: string
          episode_id: string
          id?: string
          is_valid?: boolean | null
          listener_ip_hash: string
          played_at?: string | null
          podcast_id: string
          user_agent?: string | null
        }
        Update: {
          ad_slot_id?: string
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          creator_id?: string
          episode_id?: string
          id?: string
          is_valid?: boolean | null
          listener_ip_hash?: string
          played_at?: string | null
          podcast_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_slot_id_fkey"
            columns: ["ad_slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          ad_source: string
          assigned_campaign_id: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          episode_id: string
          id: string
          manual_audio_url: string | null
          position_seconds: number | null
          slot_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          ad_source?: string
          assigned_campaign_id?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          episode_id: string
          id?: string
          manual_audio_url?: string | null
          position_seconds?: number | null
          slot_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          ad_source?: string
          assigned_campaign_id?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          episode_id?: string
          id?: string
          manual_audio_url?: string | null
          position_seconds?: number | null
          slot_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_slots_assigned_campaign_id_fkey"
            columns: ["assigned_campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_slots_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_videos: {
        Row: {
          advertiser_company: string | null
          campaign_name: string | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
        }
        Insert: {
          advertiser_company?: string | null
          campaign_name?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
        }
        Update: {
          advertiser_company?: string | null
          campaign_name?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
        }
        Relationships: []
      }
      advertiser_pricing_tiers: {
        Row: {
          conversational_ad_discount: number | null
          conversational_ad_rate: number
          cpm_max: number
          cpm_min: number
          created_at: string | null
          display_order: number
          features: Json | null
          id: string
          is_active: boolean | null
          min_deposit: number
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          conversational_ad_discount?: number | null
          conversational_ad_rate?: number
          cpm_max: number
          cpm_min: number
          created_at?: string | null
          display_order: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          min_deposit: number
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          conversational_ad_discount?: number | null
          conversational_ad_rate?: number
          cpm_max?: number
          cpm_min?: number
          created_at?: string | null
          display_order?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          min_deposit?: number
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      advertiser_team_members: {
        Row: {
          accepted_at: string | null
          advertiser_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["advertiser_team_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          advertiser_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["advertiser_team_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          advertiser_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["advertiser_team_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_team_members_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_transactions: {
        Row: {
          advertiser_id: string
          amount: number
          balance_after: number
          campaign_id: string | null
          created_at: string | null
          description: string | null
          id: string
          stripe_payment_intent_id: string | null
          transaction_type: string
        }
        Insert: {
          advertiser_id: string
          amount: number
          balance_after: number
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          transaction_type: string
        }
        Update: {
          advertiser_id?: string
          amount?: number
          balance_after?: number
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertiser_transactions_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertiser_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisers: {
        Row: {
          account_balance: number | null
          approved_at: string | null
          approved_by: string | null
          auto_topup_amount: number | null
          auto_topup_enabled: boolean | null
          auto_topup_threshold: number | null
          business_description: string | null
          campaign_goals: string[] | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          id: string
          pricing_tier_id: string | null
          rejection_reason: string | null
          status: string | null
          stripe_customer_id: string | null
          target_categories: string[] | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          account_balance?: number | null
          approved_at?: string | null
          approved_by?: string | null
          auto_topup_amount?: number | null
          auto_topup_enabled?: boolean | null
          auto_topup_threshold?: number | null
          business_description?: string | null
          campaign_goals?: string[] | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          pricing_tier_id?: string | null
          rejection_reason?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          target_categories?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          account_balance?: number | null
          approved_at?: string | null
          approved_by?: string | null
          auto_topup_amount?: number | null
          auto_topup_enabled?: boolean | null
          auto_topup_threshold?: number | null
          business_description?: string | null
          campaign_goals?: string[] | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          pricing_tier_id?: string | null
          rejection_reason?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          target_categories?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisers_pricing_tier_id_fkey"
            columns: ["pricing_tier_id"]
            isOneToOne: false
            referencedRelation: "advertiser_pricing_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_ads: {
        Row: {
          ad_type: string
          advertiser_id: string
          agent_setup_fee_charged: boolean | null
          audio_url: string | null
          campaign_id: string | null
          campaign_name: string | null
          conversation_config: Json | null
          created_at: string | null
          creator_voice_profile_id: string | null
          custom_phone_fee_charged: boolean | null
          duration_seconds: number | null
          elevenlabs_agent_id: string | null
          greeting_audio_url: string | null
          greeting_script: string | null
          greeting_voice_id: string | null
          id: string
          payout_amount: number | null
          payout_type: string | null
          phone_number: string | null
          phone_number_type: string | null
          promo_code: string | null
          script: string
          status: string
          thumbnail_url: string | null
          tracking_phone_number: string | null
          updated_at: string | null
          uses_creator_voice: boolean | null
          voice_id: string
          voice_name: string | null
        }
        Insert: {
          ad_type?: string
          advertiser_id: string
          agent_setup_fee_charged?: boolean | null
          audio_url?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          conversation_config?: Json | null
          created_at?: string | null
          creator_voice_profile_id?: string | null
          custom_phone_fee_charged?: boolean | null
          duration_seconds?: number | null
          elevenlabs_agent_id?: string | null
          greeting_audio_url?: string | null
          greeting_script?: string | null
          greeting_voice_id?: string | null
          id?: string
          payout_amount?: number | null
          payout_type?: string | null
          phone_number?: string | null
          phone_number_type?: string | null
          promo_code?: string | null
          script: string
          status?: string
          thumbnail_url?: string | null
          tracking_phone_number?: string | null
          updated_at?: string | null
          uses_creator_voice?: boolean | null
          voice_id: string
          voice_name?: string | null
        }
        Update: {
          ad_type?: string
          advertiser_id?: string
          agent_setup_fee_charged?: boolean | null
          audio_url?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          conversation_config?: Json | null
          created_at?: string | null
          creator_voice_profile_id?: string | null
          custom_phone_fee_charged?: boolean | null
          duration_seconds?: number | null
          elevenlabs_agent_id?: string | null
          greeting_audio_url?: string | null
          greeting_script?: string | null
          greeting_voice_id?: string | null
          id?: string
          payout_amount?: number | null
          payout_type?: string | null
          phone_number?: string | null
          phone_number_type?: string | null
          promo_code?: string | null
          script?: string
          status?: string
          thumbnail_url?: string | null
          tracking_phone_number?: string | null
          updated_at?: string | null
          uses_creator_voice?: boolean | null
          voice_id?: string
          voice_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_ads_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_ads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_ads_creator_voice_profile_id_fkey"
            columns: ["creator_voice_profile_id"]
            isOneToOne: false
            referencedRelation: "creator_voice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      award_categories: {
        Row: {
          allow_media_submission: boolean | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          max_nominees: number | null
          media_type: string | null
          name: string
          program_id: string
          updated_at: string
        }
        Insert: {
          allow_media_submission?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          max_nominees?: number | null
          media_type?: string | null
          name: string
          program_id: string
          updated_at?: string
        }
        Update: {
          allow_media_submission?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          max_nominees?: number | null
          media_type?: string | null
          name?: string
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_categories_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_nominees: {
        Row: {
          audio_url: string | null
          category_id: string
          created_at: string
          id: string
          nominee_description: string | null
          nominee_email: string | null
          nominee_image_url: string | null
          nominee_name: string
          predicted_rank: number | null
          program_id: string
          rss_feed_url: string | null
          status: Database["public"]["Enums"]["nominee_status"]
          submitted_by_user_id: string | null
          total_votes: number | null
          unique_voting_link: string | null
          updated_at: string
          video_url: string | null
          vote_breakdown: Json | null
        }
        Insert: {
          audio_url?: string | null
          category_id: string
          created_at?: string
          id?: string
          nominee_description?: string | null
          nominee_email?: string | null
          nominee_image_url?: string | null
          nominee_name: string
          predicted_rank?: number | null
          program_id: string
          rss_feed_url?: string | null
          status?: Database["public"]["Enums"]["nominee_status"]
          submitted_by_user_id?: string | null
          total_votes?: number | null
          unique_voting_link?: string | null
          updated_at?: string
          video_url?: string | null
          vote_breakdown?: Json | null
        }
        Update: {
          audio_url?: string | null
          category_id?: string
          created_at?: string
          id?: string
          nominee_description?: string | null
          nominee_email?: string | null
          nominee_image_url?: string | null
          nominee_name?: string
          predicted_rank?: number | null
          program_id?: string
          rss_feed_url?: string | null
          status?: Database["public"]["Enums"]["nominee_status"]
          submitted_by_user_id?: string | null
          total_votes?: number | null
          unique_voting_link?: string | null
          updated_at?: string
          video_url?: string | null
          vote_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "award_nominees_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "award_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_nominees_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_payouts: {
        Row: {
          amount: number
          created_at: string
          creator_user_id: string
          hold_until_date: string | null
          id: string
          net_amount: number
          paid_at: string | null
          payout_scheduled_date: string | null
          payout_type: string
          platform_fee: number | null
          processing_started_at: string | null
          program_id: string
          source_id: string
          status: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          creator_user_id: string
          hold_until_date?: string | null
          id?: string
          net_amount: number
          paid_at?: string | null
          payout_scheduled_date?: string | null
          payout_type: string
          platform_fee?: number | null
          processing_started_at?: string | null
          program_id: string
          source_id: string
          status?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          creator_user_id?: string
          hold_until_date?: string | null
          id?: string
          net_amount?: number
          paid_at?: string | null
          payout_scheduled_date?: string | null
          payout_type?: string
          platform_fee?: number | null
          processing_started_at?: string | null
          program_id?: string
          source_id?: string
          status?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "award_payouts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_registrations: {
        Row: {
          amount_paid: number
          attendee_email: string
          attendee_name: string
          created_at: string
          id: string
          paid_at: string | null
          program_id: string
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_paid: number
          attendee_email: string
          attendee_name: string
          created_at?: string
          id?: string
          paid_at?: string | null
          program_id: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_paid?: number
          attendee_email?: string
          attendee_name?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          program_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "award_registrations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_self_nominations: {
        Row: {
          amount_paid: number
          category_id: string
          created_at: string
          id: string
          nominee_id: string
          paid_at: string | null
          program_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          category_id: string
          created_at?: string
          id?: string
          nominee_id: string
          paid_at?: string | null
          program_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          category_id?: string
          created_at?: string
          id?: string
          nominee_id?: string
          paid_at?: string | null
          program_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_self_nominations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "award_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_self_nominations_nominee_id_fkey"
            columns: ["nominee_id"]
            isOneToOne: false
            referencedRelation: "award_nominees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_self_nominations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_sponsorship_packages: {
        Row: {
          benefits: Json | null
          created_at: string
          display_order: number | null
          fee_configuration: Json | null
          id: string
          logo_size: string | null
          max_sponsors: number | null
          package_description: string | null
          package_name: string
          price: number
          program_id: string
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string
          display_order?: number | null
          fee_configuration?: Json | null
          id?: string
          logo_size?: string | null
          max_sponsors?: number | null
          package_description?: string | null
          package_name: string
          price: number
          program_id: string
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string
          display_order?: number | null
          fee_configuration?: Json | null
          id?: string
          logo_size?: string | null
          max_sponsors?: number | null
          package_description?: string | null
          package_name?: string
          price?: number
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_sponsorship_packages_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_sponsorships: {
        Row: {
          amount_paid: number
          created_at: string
          hashtags: string[] | null
          id: string
          mentions: string[] | null
          package_id: string
          paid_at: string | null
          program_id: string
          social_media_handles: Json | null
          sponsor_email: string
          sponsor_logo_url: string | null
          sponsor_name: string
          sponsor_website_url: string | null
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          hashtags?: string[] | null
          id?: string
          mentions?: string[] | null
          package_id: string
          paid_at?: string | null
          program_id: string
          social_media_handles?: Json | null
          sponsor_email: string
          sponsor_logo_url?: string | null
          sponsor_name: string
          sponsor_website_url?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          hashtags?: string[] | null
          id?: string
          mentions?: string[] | null
          package_id?: string
          paid_at?: string | null
          program_id?: string
          social_media_handles?: Json | null
          sponsor_email?: string
          sponsor_logo_url?: string | null
          sponsor_name?: string
          sponsor_website_url?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "award_sponsorships_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "award_sponsorship_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_sponsorships_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_votes: {
        Row: {
          category_id: string
          id: string
          nominee_id: string
          program_id: string
          rank_position: number | null
          vote_weight: number | null
          voted_at: string
          voter_email: string | null
          voter_id: string | null
          voter_ip_hash: string | null
          voter_name: string | null
        }
        Insert: {
          category_id: string
          id?: string
          nominee_id: string
          program_id: string
          rank_position?: number | null
          vote_weight?: number | null
          voted_at?: string
          voter_email?: string | null
          voter_id?: string | null
          voter_ip_hash?: string | null
          voter_name?: string | null
        }
        Update: {
          category_id?: string
          id?: string
          nominee_id?: string
          program_id?: string
          rank_position?: number | null
          vote_weight?: number | null
          voted_at?: string
          voter_email?: string | null
          voter_id?: string | null
          voter_ip_hash?: string | null
          voter_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "award_votes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "award_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_votes_nominee_id_fkey"
            columns: ["nominee_id"]
            isOneToOne: false
            referencedRelation: "award_nominees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_votes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_winners: {
        Row: {
          announced_at: string | null
          category_id: string
          created_at: string
          id: string
          nominee_id: string
          placement: number
          program_id: string
        }
        Insert: {
          announced_at?: string | null
          category_id: string
          created_at?: string
          id?: string
          nominee_id: string
          placement: number
          program_id: string
        }
        Update: {
          announced_at?: string | null
          category_id?: string
          created_at?: string
          id?: string
          nominee_id?: string
          placement?: number
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_winners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "award_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_winners_nominee_id_fkey"
            columns: ["nominee_id"]
            isOneToOne: false
            referencedRelation: "award_nominees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_winners_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "awards_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      awards_programs: {
        Row: {
          allow_public_nominations: boolean | null
          ceremony_date: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          fee_configuration: Json | null
          id: string
          max_votes_per_voter: number | null
          nomination_type: string | null
          nominations_close_date: string | null
          nominations_open_date: string | null
          payout_scheduled_date: string | null
          registration_fee: number | null
          require_voter_registration: boolean | null
          self_nomination_fee: number | null
          show_live_results: boolean | null
          sponsorship_flyer_url: string | null
          status: Database["public"]["Enums"]["award_program_status"]
          stripe_connect_account_id: string | null
          stripe_connect_status: string | null
          studio_session_id: string | null
          title: string
          updated_at: string
          user_id: string
          voting_close_date: string | null
          voting_method: Database["public"]["Enums"]["voting_method"]
          voting_open_date: string | null
        }
        Insert: {
          allow_public_nominations?: boolean | null
          ceremony_date?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          fee_configuration?: Json | null
          id?: string
          max_votes_per_voter?: number | null
          nomination_type?: string | null
          nominations_close_date?: string | null
          nominations_open_date?: string | null
          payout_scheduled_date?: string | null
          registration_fee?: number | null
          require_voter_registration?: boolean | null
          self_nomination_fee?: number | null
          show_live_results?: boolean | null
          sponsorship_flyer_url?: string | null
          status?: Database["public"]["Enums"]["award_program_status"]
          stripe_connect_account_id?: string | null
          stripe_connect_status?: string | null
          studio_session_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          voting_close_date?: string | null
          voting_method?: Database["public"]["Enums"]["voting_method"]
          voting_open_date?: string | null
        }
        Update: {
          allow_public_nominations?: boolean | null
          ceremony_date?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          fee_configuration?: Json | null
          id?: string
          max_votes_per_voter?: number | null
          nomination_type?: string | null
          nominations_close_date?: string | null
          nominations_open_date?: string | null
          payout_scheduled_date?: string | null
          registration_fee?: number | null
          require_voter_registration?: boolean | null
          self_nomination_fee?: number | null
          show_live_results?: boolean | null
          sponsorship_flyer_url?: string | null
          status?: Database["public"]["Enums"]["award_program_status"]
          stripe_connect_account_id?: string | null
          stripe_connect_status?: string | null
          studio_session_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          voting_close_date?: string | null
          voting_method?: Database["public"]["Enums"]["voting_method"]
          voting_open_date?: string | null
        }
        Relationships: []
      }
      blocked_times: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          reason: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          content: string
          created_at: string
          episode_id: string | null
          excerpt: string | null
          external_id: string | null
          featured_image_url: string | null
          id: string
          is_ai_generated: boolean | null
          master_published_at: string | null
          podcast_id: string | null
          publish_to_master: boolean | null
          published_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          source_platform: string | null
          source_rss_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          episode_id?: string | null
          excerpt?: string | null
          external_id?: string | null
          featured_image_url?: string | null
          id?: string
          is_ai_generated?: boolean | null
          master_published_at?: string | null
          podcast_id?: string | null
          publish_to_master?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          source_platform?: string | null
          source_rss_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          episode_id?: string | null
          excerpt?: string | null
          external_id?: string | null
          featured_image_url?: string | null
          id?: string
          is_ai_generated?: boolean | null
          master_published_at?: string | null
          podcast_id?: string | null
          publish_to_master?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          source_platform?: string | null
          source_rss_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          calendar_email: string | null
          calendar_id: string | null
          created_at: string
          id: string
          provider: string
          refresh_token: string
          token_expiry: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_email?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          provider?: string
          refresh_token: string
          token_expiry: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_email?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          provider?: string
          refresh_token?: string
          token_expiry?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_properties: {
        Row: {
          allocated_budget: number
          allocated_impressions: number
          cpm_rate: number
          created_at: string | null
          creator_id: string | null
          creator_response_date: string | null
          id: string
          multi_channel_campaign_id: string | null
          property_id: string
          property_name: string
          property_type: string
          rejection_reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          allocated_budget: number
          allocated_impressions: number
          cpm_rate: number
          created_at?: string | null
          creator_id?: string | null
          creator_response_date?: string | null
          id?: string
          multi_channel_campaign_id?: string | null
          property_id: string
          property_name: string
          property_type: string
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          allocated_budget?: number
          allocated_impressions?: number
          cpm_rate?: number
          created_at?: string | null
          creator_id?: string | null
          creator_response_date?: string | null
          id?: string
          multi_channel_campaign_id?: string | null
          property_id?: string
          property_name?: string
          property_type?: string
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_properties_multi_channel_campaign_id_fkey"
            columns: ["multi_channel_campaign_id"]
            isOneToOne: false
            referencedRelation: "multi_channel_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_property_impressions: {
        Row: {
          campaign_property_id: string | null
          created_at: string | null
          id: string
          impression_count: number | null
          metadata: Json | null
          multi_channel_campaign_id: string | null
          tracked_at: string | null
          tracking_method: string | null
        }
        Insert: {
          campaign_property_id?: string | null
          created_at?: string | null
          id?: string
          impression_count?: number | null
          metadata?: Json | null
          multi_channel_campaign_id?: string | null
          tracked_at?: string | null
          tracking_method?: string | null
        }
        Update: {
          campaign_property_id?: string | null
          created_at?: string | null
          id?: string
          impression_count?: number | null
          metadata?: Json | null
          multi_channel_campaign_id?: string | null
          tracked_at?: string | null
          tracking_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_property_impressions_campaign_property_id_fkey"
            columns: ["campaign_property_id"]
            isOneToOne: false
            referencedRelation: "campaign_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_property_impressions_multi_channel_campaign_id_fkey"
            columns: ["multi_channel_campaign_id"]
            isOneToOne: false
            referencedRelation: "multi_channel_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_articles: {
        Row: {
          ai_drafted: boolean | null
          author: string | null
          category: string | null
          content: string
          created_at: string
          hero_image_url: string | null
          id: string
          publish_date: string | null
          related_event_ids: string[] | null
          slug: string
          status: string
          title: string
          topics: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_drafted?: boolean | null
          author?: string | null
          category?: string | null
          content: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          publish_date?: string | null
          related_event_ids?: string[] | null
          slug: string
          status?: string
          title: string
          topics?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_drafted?: boolean | null
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          publish_date?: string | null
          related_event_ids?: string[] | null
          slug?: string
          status?: string
          title?: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      civic_compliance_records: {
        Row: {
          created_at: string
          disclosure_notes: string | null
          event_id: string
          filing_links: string[] | null
          funding_notes: string | null
          id: string
          recap_documents: Json | null
          recap_summary: string | null
          required_notices: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          disclosure_notes?: string | null
          event_id: string
          filing_links?: string[] | null
          funding_notes?: string | null
          id?: string
          recap_documents?: Json | null
          recap_summary?: string | null
          required_notices?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          disclosure_notes?: string | null
          event_id?: string
          filing_links?: string[] | null
          funding_notes?: string | null
          id?: string
          recap_documents?: Json | null
          recap_summary?: string | null
          required_notices?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_compliance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "civic_events"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_events: {
        Row: {
          agenda: string | null
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          location_details: string | null
          location_type: string | null
          status: string
          title: string
          topics: string[] | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type: string
          id?: string
          location_details?: string | null
          location_type?: string | null
          status?: string
          title: string
          topics?: string[] | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          agenda?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location_details?: string | null
          location_type?: string | null
          status?: string
          title?: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      civic_live_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          event_id: string
          id: string
          key_moments: Json | null
          recording_enabled: boolean | null
          recording_url: string | null
          started_at: string | null
          stream_status: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          event_id: string
          id?: string
          key_moments?: Json | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          started_at?: string | null
          stream_status?: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          event_id?: string
          id?: string
          key_moments?: Json | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          started_at?: string | null
          stream_status?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_live_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "civic_events"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          client_contact_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          source: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          client_contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          client_contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tickets_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_name: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      constituent_requests: {
        Row: {
          address: string | null
          ai_suggested_response: string | null
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          staff_response: string | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          ai_suggested_response?: string | null
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          staff_response?: string | null
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          ai_suggested_response?: string | null
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          staff_response?: string | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_list_members: {
        Row: {
          added_at: string | null
          contact_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string | null
          contact_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string | null
          contact_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_list_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_tag_assignments: {
        Row: {
          assigned_at: string | null
          contact_id: string
          id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string | null
          contact_id: string
          id?: string
          tag_id: string
        }
        Update: {
          assigned_at?: string | null
          contact_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tag_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "contact_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          lead_source: string | null
          lead_status: string | null
          name: string
          notes: string | null
          phone: string | null
          pipeline_stage_id: string | null
          sales_rep_id: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          lead_source?: string | null
          lead_status?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          pipeline_stage_id?: string | null
          sales_rep_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_source?: string | null
          lead_status?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pipeline_stage_id?: string | null
          sales_rep_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      conversational_ad_charges: {
        Row: {
          advertiser_id: string
          amount: number
          audio_ad_id: string | null
          campaign_id: string | null
          charge_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          advertiser_id: string
          amount: number
          audio_ad_id?: string | null
          campaign_id?: string | null
          charge_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          advertiser_id?: string
          amount?: number
          audio_ad_id?: string | null
          campaign_id?: string | null
          charge_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversational_ad_charges_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversational_ad_charges_audio_ad_id_fkey"
            columns: ["audio_ad_id"]
            isOneToOne: false
            referencedRelation: "audio_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversational_ad_charges_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      conversational_ad_usage: {
        Row: {
          advertiser_id: string
          audio_ad_id: string | null
          caller_phone: string | null
          campaign_id: string | null
          conversation_id: string | null
          cost_per_minute: number
          created_at: string | null
          duration_seconds: number
          ended_at: string
          id: string
          started_at: string
          total_cost: number
        }
        Insert: {
          advertiser_id: string
          audio_ad_id?: string | null
          caller_phone?: string | null
          campaign_id?: string | null
          conversation_id?: string | null
          cost_per_minute: number
          created_at?: string | null
          duration_seconds: number
          ended_at: string
          id?: string
          started_at: string
          total_cost: number
        }
        Update: {
          advertiser_id?: string
          audio_ad_id?: string | null
          caller_phone?: string | null
          campaign_id?: string | null
          conversation_id?: string | null
          cost_per_minute?: number
          created_at?: string | null
          duration_seconds?: number
          ended_at?: string
          id?: string
          started_at?: string
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversational_ad_usage_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversational_ad_usage_audio_ad_id_fkey"
            columns: ["audio_ad_id"]
            isOneToOne: false
            referencedRelation: "audio_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversational_ad_usage_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_campaign_alerts: {
        Row: {
          alert_type: string | null
          counter_bid_amount: number | null
          created_at: string | null
          creator_id: string | null
          id: string
          multi_channel_campaign_id: string | null
          property_id: string
          property_type: string
          responded_at: string | null
          response: string | null
          viewed_at: string | null
        }
        Insert: {
          alert_type?: string | null
          counter_bid_amount?: number | null
          created_at?: string | null
          creator_id?: string | null
          id?: string
          multi_channel_campaign_id?: string | null
          property_id: string
          property_type: string
          responded_at?: string | null
          response?: string | null
          viewed_at?: string | null
        }
        Update: {
          alert_type?: string | null
          counter_bid_amount?: number | null
          created_at?: string | null
          creator_id?: string | null
          id?: string
          multi_channel_campaign_id?: string | null
          property_id?: string
          property_type?: string
          responded_at?: string | null
          response?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_campaign_alerts_multi_channel_campaign_id_fkey"
            columns: ["multi_channel_campaign_id"]
            isOneToOne: false
            referencedRelation: "multi_channel_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_earnings: {
        Row: {
          campaign_id: string
          created_at: string | null
          creator_share: number | null
          id: string
          paid_at: string | null
          payout_status: string
          period_end: string
          period_start: string
          platform_share: number | null
          revenue_generated: number | null
          total_impressions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          creator_share?: number | null
          id?: string
          paid_at?: string | null
          payout_status?: string
          period_end: string
          period_start: string
          platform_share?: number | null
          revenue_generated?: number | null
          total_impressions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          creator_share?: number | null
          id?: string
          paid_at?: string | null
          payout_status?: string
          period_end?: string
          period_start?: string
          platform_share?: number | null
          revenue_generated?: number | null
          total_impressions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_tips: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string
          id: string
          message: string | null
          paid_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id: string
          id?: string
          message?: string | null
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string
          id?: string
          message?: string | null
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      creator_voice_profiles: {
        Row: {
          created_at: string | null
          elevenlabs_voice_id: string | null
          id: string
          is_available_for_ads: boolean | null
          is_verified: boolean | null
          price_per_ad: number | null
          sample_audio_url: string | null
          updated_at: string | null
          usage_terms: string | null
          user_id: string
          voice_name: string
        }
        Insert: {
          created_at?: string | null
          elevenlabs_voice_id?: string | null
          id?: string
          is_available_for_ads?: boolean | null
          is_verified?: boolean | null
          price_per_ad?: number | null
          sample_audio_url?: string | null
          updated_at?: string | null
          usage_terms?: string | null
          user_id: string
          voice_name: string
        }
        Update: {
          created_at?: string | null
          elevenlabs_voice_id?: string | null
          id?: string
          is_available_for_ads?: boolean | null
          is_verified?: boolean | null
          price_per_ad?: number | null
          sample_audio_url?: string | null
          updated_at?: string | null
          usage_terms?: string | null
          user_id?: string
          voice_name?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          activity_type: string | null
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          transaction_type: string
          user_id: string
        }
        Update: {
          activity_type?: string | null
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_link_sections: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_link_sections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_links: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          profile_id: string
          section: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          profile_id: string
          section?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          profile_id?: string
          section?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_ads: {
        Row: {
          ad_size_preset: string
          advertiser_id: string
          campaign_id: string | null
          caption: string | null
          created_at: string | null
          creative_type: string
          creative_url: string
          cta_text: string
          cta_url: string
          hashtags: string[] | null
          height: number
          id: string
          mentions: string[] | null
          platform_type: string
          social_platform: string | null
          status: string
          updated_at: string | null
          width: number
        }
        Insert: {
          ad_size_preset: string
          advertiser_id: string
          campaign_id?: string | null
          caption?: string | null
          created_at?: string | null
          creative_type: string
          creative_url: string
          cta_text?: string
          cta_url: string
          hashtags?: string[] | null
          height: number
          id?: string
          mentions?: string[] | null
          platform_type: string
          social_platform?: string | null
          status?: string
          updated_at?: string | null
          width: number
        }
        Update: {
          ad_size_preset?: string
          advertiser_id?: string
          campaign_id?: string | null
          caption?: string | null
          created_at?: string | null
          creative_type?: string
          creative_url?: string
          cta_text?: string
          cta_url?: string
          hashtags?: string[] | null
          height?: number
          id?: string
          mentions?: string[] | null
          platform_type?: string
          social_platform?: string | null
          status?: string
          updated_at?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "digital_ads_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_ads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          created_at: string | null
          document_content: string
          id: string
          signature_fields: Json | null
          template_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_content: string
          id?: string
          signature_fields?: Json | null
          template_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_content?: string
          id?: string
          signature_fields?: Json | null
          template_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          campaign_name: string
          created_at: string | null
          id: string
          sent_at: string | null
          status: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          campaign_name: string
          created_at?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          campaign_name?: string
          created_at?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          recipient_email: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          recipient_email: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          recipient_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string
          related_id: string | null
          sent_at: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name: string
          related_id?: string | null
          sent_at?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string
          related_id?: string | null
          sent_at?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      email_reminders_sent: {
        Row: {
          created_at: string
          id: string
          recipient_email: string
          related_id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_email: string
          related_id: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_email?: string
          related_id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: []
      }
      email_template_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      episode_blockchain_certificates: {
        Row: {
          blockchain_network: string | null
          blockchain_transaction_id: string | null
          certificate_hash: string
          certificate_status: string | null
          certificate_url: string | null
          certified_at: string | null
          created_at: string | null
          episode_id: string
          id: string
          metadata: Json | null
          podcast_id: string
        }
        Insert: {
          blockchain_network?: string | null
          blockchain_transaction_id?: string | null
          certificate_hash: string
          certificate_status?: string | null
          certificate_url?: string | null
          certified_at?: string | null
          created_at?: string | null
          episode_id: string
          id?: string
          metadata?: Json | null
          podcast_id: string
        }
        Update: {
          blockchain_network?: string | null
          blockchain_transaction_id?: string | null
          certificate_hash?: string
          certificate_status?: string | null
          certificate_url?: string | null
          certified_at?: string | null
          created_at?: string | null
          episode_id?: string
          id?: string
          metadata?: Json | null
          podcast_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_blockchain_certificates_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_blockchain_certificates_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          audio_url: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          episode_number: number | null
          file_size_bytes: number | null
          id: string
          is_published: boolean | null
          podcast_id: string
          publish_date: string
          season_number: number | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          file_size_bytes?: number | null
          id?: string
          is_published?: boolean | null
          podcast_id: string
          publish_date?: string
          season_number?: number | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          file_size_bytes?: number | null
          id?: string
          is_published?: boolean | null
          podcast_id?: string
          publish_date?: string
          season_number?: number | null
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attendee_email: string
          attendee_name: string
          attendee_phone: string | null
          checked_in: boolean | null
          custom_responses: Json | null
          event_id: string
          id: string
          registered_at: string | null
        }
        Insert: {
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          checked_in?: boolean | null
          custom_responses?: Json | null
          event_id: string
          id?: string
          registered_at?: string | null
        }
        Update: {
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          checked_in?: boolean | null
          custom_responses?: Json | null
          event_id?: string
          id?: string
          registered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsorship_packages: {
        Row: {
          benefits: Json | null
          created_at: string | null
          display_order: number | null
          event_id: string
          id: string
          max_sponsors: number | null
          package_description: string | null
          package_name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          max_sponsors?: number | null
          package_description?: string | null
          package_name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          max_sponsors?: number | null
          package_description?: string | null
          package_name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsorship_packages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsorships: {
        Row: {
          amount_paid: number
          created_at: string | null
          event_id: string
          hashtags: string[] | null
          id: string
          mentions: string[] | null
          package_id: string
          paid_at: string | null
          social_media_handles: Json | null
          sponsor_email: string
          sponsor_logo_url: string | null
          sponsor_name: string
          sponsor_website_url: string | null
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          event_id: string
          hashtags?: string[] | null
          id?: string
          mentions?: string[] | null
          package_id: string
          paid_at?: string | null
          social_media_handles?: Json | null
          sponsor_email: string
          sponsor_logo_url?: string | null
          sponsor_name: string
          sponsor_website_url?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          event_id?: string
          hashtags?: string[] | null
          id?: string
          mentions?: string[] | null
          package_id?: string
          paid_at?: string | null
          social_media_handles?: Json | null
          sponsor_email?: string
          sponsor_logo_url?: string | null
          sponsor_name?: string
          sponsor_website_url?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsorships_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsorships_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "event_sponsorship_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string | null
          description: string | null
          event_date: string
          id: string
          image_url: string | null
          is_published: boolean | null
          location: string | null
          registration_questions: Json | null
          show_on_profile: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          registration_questions?: Json | null
          show_on_profile?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          registration_questions?: Json | null
          show_on_profile?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_assumptions: {
        Row: {
          assumption_name: string
          assumption_type: string
          created_at: string | null
          current_value: number | null
          id: string
          notes: string | null
          projected_values: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assumption_name: string
          assumption_type: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          notes?: string | null
          projected_values?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assumption_name?: string
          assumption_type?: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          notes?: string | null
          projected_values?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_snapshots: {
        Row: {
          active_creators: number | null
          ad_revenue: number | null
          ai_compute_costs: number | null
          average_cpm: number | null
          burn_rate: number | null
          cac: number | null
          created_at: string | null
          creator_payouts: number | null
          fill_rate: number | null
          gross_margin: number | null
          id: string
          ltv: number | null
          payment_processing_costs: number | null
          runway_months: number | null
          snapshot_date: string
          snapshot_type: string
          sponsorship_revenue: number | null
          storage_costs: number | null
          subscription_mrr: number | null
          total_costs: number | null
          total_episodes: number | null
          total_impressions: number | null
          total_podcasts: number | null
          total_revenue: number | null
          total_users: number | null
        }
        Insert: {
          active_creators?: number | null
          ad_revenue?: number | null
          ai_compute_costs?: number | null
          average_cpm?: number | null
          burn_rate?: number | null
          cac?: number | null
          created_at?: string | null
          creator_payouts?: number | null
          fill_rate?: number | null
          gross_margin?: number | null
          id?: string
          ltv?: number | null
          payment_processing_costs?: number | null
          runway_months?: number | null
          snapshot_date: string
          snapshot_type: string
          sponsorship_revenue?: number | null
          storage_costs?: number | null
          subscription_mrr?: number | null
          total_costs?: number | null
          total_episodes?: number | null
          total_impressions?: number | null
          total_podcasts?: number | null
          total_revenue?: number | null
          total_users?: number | null
        }
        Update: {
          active_creators?: number | null
          ad_revenue?: number | null
          ai_compute_costs?: number | null
          average_cpm?: number | null
          burn_rate?: number | null
          cac?: number | null
          created_at?: string | null
          creator_payouts?: number | null
          fill_rate?: number | null
          gross_margin?: number | null
          id?: string
          ltv?: number | null
          payment_processing_costs?: number | null
          runway_months?: number | null
          snapshot_date?: string
          snapshot_type?: string
          sponsorship_revenue?: number | null
          storage_costs?: number | null
          subscription_mrr?: number | null
          total_costs?: number | null
          total_episodes?: number | null
          total_impressions?: number | null
          total_podcasts?: number | null
          total_revenue?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      gmail_connections: {
        Row: {
          access_token: string
          created_at: string
          email: string | null
          id: string
          refresh_token: string
          token_expiry: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email?: string | null
          id?: string
          refresh_token: string
          token_expiry: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string | null
          id?: string
          refresh_token?: string
          token_expiry?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influencehub_creators: {
        Row: {
          agency_user_id: string
          created_at: string | null
          creator_bio: string | null
          creator_email: string | null
          creator_image_url: string | null
          creator_name: string
          creator_user_id: string | null
          id: string
          is_managed: boolean | null
          updated_at: string | null
        }
        Insert: {
          agency_user_id: string
          created_at?: string | null
          creator_bio?: string | null
          creator_email?: string | null
          creator_image_url?: string | null
          creator_name: string
          creator_user_id?: string | null
          id?: string
          is_managed?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agency_user_id?: string
          created_at?: string | null
          creator_bio?: string | null
          creator_email?: string | null
          creator_image_url?: string | null
          creator_name?: string
          creator_user_id?: string | null
          id?: string
          is_managed?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      influencehub_posts: {
        Row: {
          caption: string | null
          created_at: string | null
          creator_id: string | null
          first_comment: string | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          metadata: Json | null
          platforms: string[] | null
          post_ids: Json | null
          published_at: string | null
          scheduled_for: string | null
          social_account_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          creator_id?: string | null
          first_comment?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platforms?: string[] | null
          post_ids?: Json | null
          published_at?: string | null
          scheduled_for?: string | null
          social_account_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          creator_id?: string | null
          first_comment?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platforms?: string[] | null
          post_ids?: Json | null
          published_at?: string | null
          scheduled_for?: string | null
          social_account_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencehub_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "influencehub_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencehub_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_metadata: {
        Row: {
          created_at: string | null
          description: string
          id: string
          title: string
          tooltip_text: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id: string
          title: string
          tooltip_text?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          title?: string
          tooltip_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      investor_access: {
        Row: {
          access_code: string
          access_count: number | null
          allowed_paths: string[]
          created_at: string | null
          email: string
          expires_at: string
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          user_id: string
        }
        Insert: {
          access_code: string
          access_count?: number | null
          allowed_paths?: string[]
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          user_id: string
        }
        Update: {
          access_code?: string
          access_count?: number | null
          allowed_paths?: string[]
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investor_portal_emails: {
        Row: {
          access_code: string
          clicked_at: string | null
          created_at: string | null
          forecast_type: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          resend_email_id: string | null
          sent_at: string | null
          sent_by_user_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          access_code: string
          clicked_at?: string | null
          created_at?: string | null
          forecast_type?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          sent_by_user_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          access_code?: string
          clicked_at?: string | null
          created_at?: string | null
          forecast_type?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          sent_by_user_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      investor_shares: {
        Row: {
          access_code: string
          created_at: string
          expires_at: string
          id: string
          investor_email: string
          investor_name: string | null
          notes: string | null
          revoked_at: string | null
          revoked_by: string | null
          share_config: Json | null
          status: string
          user_id: string
        }
        Insert: {
          access_code: string
          created_at?: string
          expires_at?: string
          id?: string
          investor_email: string
          investor_name?: string | null
          notes?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          share_config?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          access_code?: string
          created_at?: string
          expires_at?: string
          id?: string
          investor_email?: string
          investor_name?: string | null
          notes?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          share_config?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_spreadsheets: {
        Row: {
          created_at: string | null
          description: string | null
          file_path: string
          file_type: string
          id: string
          name: string
          period: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_path: string
          file_type: string
          id?: string
          name: string
          period?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_type?: string
          id?: string
          name?: string
          period?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      investor_talking_points: {
        Row: {
          assumptions_used: Json | null
          created_at: string | null
          generated_by_user_id: string
          generation_date: string | null
          id: string
          key_metrics: Json | null
          period_end: string
          period_start: string
          talking_points: string
          version: number | null
        }
        Insert: {
          assumptions_used?: Json | null
          created_at?: string | null
          generated_by_user_id: string
          generation_date?: string | null
          id?: string
          key_metrics?: Json | null
          period_end: string
          period_start: string
          talking_points: string
          version?: number | null
        }
        Update: {
          assumptions_used?: Json | null
          created_at?: string | null
          generated_by_user_id?: string
          generation_date?: string | null
          id?: string
          key_metrics?: Json | null
          period_end?: string
          period_start?: string
          talking_points?: string
          version?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number | null
          client_contact_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          items: Json | null
          notes: string | null
          paid_at: string | null
          payment_link: string | null
          privacy_policy_id: string | null
          proposal_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms_conditions_id: string | null
          title: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          client_contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_link?: string | null
          privacy_policy_id?: string | null
          proposal_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms_conditions_id?: string | null
          title: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          client_contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_link?: string | null
          privacy_policy_id?: string | null
          proposal_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms_conditions_id?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_privacy_policy_id_fkey"
            columns: ["privacy_policy_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_terms_conditions_id_fkey"
            columns: ["terms_conditions_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          photo_url: string
          ticket_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url: string
          ticket_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          document_type: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_type: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          clicked_at: string
          id: string
          link_type: string
          link_url: string
          profile_id: string
          visitor_city: string | null
          visitor_country: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          link_type: string
          link_url: string
          profile_id: string
          visitor_city?: string | null
          visitor_country?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          link_type?: string
          link_url?: string
          profile_id?: string
          visitor_city?: string | null
          visitor_country?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_viewers: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string
          last_seen_at: string
          profile_id: string
          session_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string
          last_seen_at?: string
          profile_id: string
          session_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string
          last_seen_at?: string
          profile_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_viewers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_ad_slots: {
        Row: {
          ad_duration_seconds: number | null
          ad_file_url: string | null
          audio_ad_id: string | null
          created_at: string | null
          id: string
          media_file_id: string
          notes: string | null
          position_seconds: number | null
          processing_job_id: string | null
          slot_type: string
          updated_at: string | null
        }
        Insert: {
          ad_duration_seconds?: number | null
          ad_file_url?: string | null
          audio_ad_id?: string | null
          created_at?: string | null
          id?: string
          media_file_id: string
          notes?: string | null
          position_seconds?: number | null
          processing_job_id?: string | null
          slot_type: string
          updated_at?: string | null
        }
        Update: {
          ad_duration_seconds?: number | null
          ad_file_url?: string | null
          audio_ad_id?: string | null
          created_at?: string | null
          id?: string
          media_file_id?: string
          notes?: string | null
          position_seconds?: number | null
          processing_job_id?: string | null
          slot_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_ad_slots_audio_ad_id_fkey"
            columns: ["audio_ad_id"]
            isOneToOne: false
            referencedRelation: "audio_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_ad_slots_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_ad_slots_processing_job_id_fkey"
            columns: ["processing_job_id"]
            isOneToOne: false
            referencedRelation: "media_processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          clip_metadata: Json | null
          converted_to_episode_id: string | null
          created_at: string | null
          duration_seconds: number | null
          edit_status: string | null
          edit_transcript: Json | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          original_file_url: string | null
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clip_metadata?: Json | null
          converted_to_episode_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          edit_status?: string | null
          edit_transcript?: Json | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          original_file_url?: string | null
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clip_metadata?: Json | null
          converted_to_episode_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          edit_status?: string | null
          edit_transcript?: Json | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          original_file_url?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_converted_to_episode_id_fkey"
            columns: ["converted_to_episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      media_processing_jobs: {
        Row: {
          config: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          media_file_id: string
          output_duration_seconds: number | null
          output_file_size_bytes: number | null
          output_file_url: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          processing_time_seconds: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          media_file_id: string
          output_duration_seconds?: number | null
          output_file_size_bytes?: number | null
          output_file_url?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_time_seconds?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          media_file_id?: string
          output_duration_seconds?: number | null
          output_file_size_bytes?: number | null
          output_file_url?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_time_seconds?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_processing_jobs_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
        ]
      }
      media_versions: {
        Row: {
          ads_inserted: number | null
          created_at: string | null
          duration_seconds: number | null
          edits_applied: Json | null
          file_size_bytes: number | null
          file_url: string
          id: string
          is_primary: boolean | null
          original_media_id: string
          processing_job_id: string | null
          time_saved_seconds: number | null
          updated_at: string | null
          version_type: string
        }
        Insert: {
          ads_inserted?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          edits_applied?: Json | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          is_primary?: boolean | null
          original_media_id: string
          processing_job_id?: string | null
          time_saved_seconds?: number | null
          updated_at?: string | null
          version_type: string
        }
        Update: {
          ads_inserted?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          edits_applied?: Json | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          is_primary?: boolean | null
          original_media_id?: string
          processing_job_id?: string | null
          time_saved_seconds?: number | null
          updated_at?: string | null
          version_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_versions_original_media_id_fkey"
            columns: ["original_media_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_versions_processing_job_id_fkey"
            columns: ["processing_job_id"]
            isOneToOne: false
            referencedRelation: "media_processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          attendee_email: string
          attendee_name: string
          attendee_phone: string | null
          created_at: string | null
          id: string
          meeting_id: string
          rsvp_status: string | null
          rsvp_timestamp: string | null
        }
        Insert: {
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          created_at?: string | null
          id?: string
          meeting_id: string
          rsvp_status?: string | null
          rsvp_timestamp?: string | null
        }
        Update: {
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string
          rsvp_status?: string | null
          rsvp_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_intelligence: {
        Row: {
          action_items: Json | null
          created_at: string | null
          decisions: string[] | null
          id: string
          key_takeaways: string[] | null
          meeting_id: string
          summary: string | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          created_at?: string | null
          decisions?: string[] | null
          id?: string
          key_takeaways?: string[] | null
          meeting_id: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          created_at?: string | null
          decisions?: string[] | null
          id?: string
          key_takeaways?: string[] | null
          meeting_id?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_intelligence_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_invitations: {
        Row: {
          created_at: string | null
          custom_message: string | null
          id: string
          invitee_email: string
          invitee_name: string
          inviter_id: string
          meeting_type_id: string
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_message?: string | null
          id?: string
          invitee_email: string
          invitee_name: string
          inviter_id: string
          meeting_type_id: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_message?: string | null
          id?: string
          invitee_email?: string
          invitee_name?: string
          inviter_id?: string
          meeting_type_id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_invitations_meeting_type_id_fkey"
            columns: ["meeting_type_id"]
            isOneToOne: false
            referencedRelation: "meeting_types"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_types: {
        Row: {
          availability_windows: Json | null
          buffer_time_after: number | null
          buffer_time_before: number | null
          created_at: string | null
          custom_location_url: string | null
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          location_type: Database["public"]["Enums"]["location_type"]
          name: string
          pre_meeting_questions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability_windows?: Json | null
          buffer_time_after?: number | null
          buffer_time_before?: number | null
          created_at?: string | null
          custom_location_url?: string | null
          description?: string | null
          duration: number
          id?: string
          is_active?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"]
          name: string
          pre_meeting_questions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability_windows?: Json | null
          buffer_time_after?: number | null
          buffer_time_before?: number | null
          created_at?: string | null
          custom_location_url?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          location_type?: Database["public"]["Enums"]["location_type"]
          name?: string
          pre_meeting_questions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          attendee_email: string
          attendee_name: string
          attendee_phone: string | null
          attendee_responses: Json | null
          attendee_rsvp_method: string | null
          attendee_rsvp_status: string | null
          attendee_rsvp_timestamp: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          location_details: string | null
          location_type: Database["public"]["Enums"]["location_type"]
          meeting_type_id: string | null
          recording_duration: number | null
          recording_size: number | null
          recording_url: string | null
          show_ai_notes: boolean | null
          start_time: string
          status: Database["public"]["Enums"]["meeting_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          attendee_responses?: Json | null
          attendee_rsvp_method?: string | null
          attendee_rsvp_status?: string | null
          attendee_rsvp_timestamp?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          location_details?: string | null
          location_type: Database["public"]["Enums"]["location_type"]
          meeting_type_id?: string | null
          recording_duration?: number | null
          recording_size?: number | null
          recording_url?: string | null
          show_ai_notes?: boolean | null
          start_time: string
          status?: Database["public"]["Enums"]["meeting_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          attendee_responses?: Json | null
          attendee_rsvp_method?: string | null
          attendee_rsvp_status?: string | null
          attendee_rsvp_timestamp?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          location_details?: string | null
          location_type?: Database["public"]["Enums"]["location_type"]
          meeting_type_id?: string | null
          recording_duration?: number | null
          recording_size?: number | null
          recording_url?: string | null
          show_ai_notes?: boolean | null
          start_time?: string
          status?: Database["public"]["Enums"]["meeting_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_meeting_type_id_fkey"
            columns: ["meeting_type_id"]
            isOneToOne: false
            referencedRelation: "meeting_types"
            referencedColumns: ["id"]
          },
        ]
      }
      microsoft_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          microsoft_email: string | null
          refresh_token: string
          token_expiry: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          microsoft_email?: string | null
          refresh_token: string
          token_expiry: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          microsoft_email?: string | null
          refresh_token?: string
          token_expiry?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_purchases: {
        Row: {
          amount_paid: number
          id: string
          module_id: string
          purchased_at: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          id?: string
          module_id: string
          purchased_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          id?: string
          module_id?: string
          purchased_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_purchases_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          route: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          tier: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          route: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tier?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          route?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tier?: string
        }
        Relationships: []
      }
      multi_channel_campaigns: {
        Row: {
          advertiser_id: string | null
          campaign_name: string
          created_at: string | null
          end_date: string
          id: string
          impression_goal: number
          sales_team_member_id: string | null
          start_date: string
          status: string | null
          total_budget: number
          updated_at: string | null
        }
        Insert: {
          advertiser_id?: string | null
          campaign_name: string
          created_at?: string | null
          end_date: string
          id?: string
          impression_goal: number
          sales_team_member_id?: string | null
          start_date: string
          status?: string | null
          total_budget: number
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string | null
          campaign_name?: string
          created_at?: string | null
          end_date?: string
          id?: string
          impression_goal?: number
          sales_team_member_id?: string | null
          start_date?: string
          status?: string | null
          total_budget?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multi_channel_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_channel_campaigns_sales_team_member_id_fkey"
            columns: ["sales_team_member_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      my_page_video_impressions: {
        Row: {
          id: string
          profile_id: string
          session_duration_seconds: number | null
          user_agent: string | null
          video_id: string
          video_type: string
          viewed_at: string | null
          viewer_ip_hash: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          session_duration_seconds?: number | null
          user_agent?: string | null
          video_id: string
          video_type: string
          viewed_at?: string | null
          viewer_ip_hash?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          session_duration_seconds?: number | null
          user_agent?: string | null
          video_id?: string
          video_type?: string
          viewed_at?: string | null
          viewer_ip_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "my_page_video_impressions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          clicked_count: number | null
          created_at: string
          html_content: string
          id: string
          opened_count: number | null
          preview_text: string | null
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clicked_count?: number | null
          created_at?: string
          html_content: string
          id?: string
          opened_count?: number | null
          preview_text?: string | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clicked_count?: number | null
          created_at?: string
          html_content?: string
          id?: string
          opened_count?: number | null
          preview_text?: string | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_sends: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          email: string
          id: string
          metadata: Json | null
          opened_at: string | null
          sent_at: string
          status: string
          subscriber_id: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string
          status?: string
          subscriber_id: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string
          status?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          name: string | null
          source: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          name?: string | null
          source?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          source?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          notification_type: string
          sms_enabled: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          notification_type: string
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          notification_type?: string
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pixel_leads: {
        Row: {
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          creator_id: string
          email: string | null
          enrichment_data: Json | null
          enrichment_status: string | null
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          name: string | null
          page_url: string
          page_views: number | null
          phone: string | null
          referrer: string | null
          session_duration: number | null
          user_agent: string | null
          visitor_id: string | null
          visitor_ip_hash: string
        }
        Insert: {
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          creator_id: string
          email?: string | null
          enrichment_data?: Json | null
          enrichment_status?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          name?: string | null
          page_url: string
          page_views?: number | null
          phone?: string | null
          referrer?: string | null
          session_duration?: number | null
          user_agent?: string | null
          visitor_id?: string | null
          visitor_ip_hash: string
        }
        Update: {
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          creator_id?: string
          email?: string | null
          enrichment_data?: Json | null
          enrichment_status?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          name?: string | null
          page_url?: string
          page_views?: number | null
          phone?: string | null
          referrer?: string | null
          session_duration?: number | null
          user_agent?: string | null
          visitor_id?: string | null
          visitor_ip_hash?: string
        }
        Relationships: []
      }
      podcast_ad_settings: {
        Row: {
          ad_mode: string | null
          auto_approve_ads: boolean | null
          blocked_categories: string[] | null
          created_at: string | null
          id: string
          minimum_cpm: number | null
          platform_ads_enabled: boolean | null
          podcast_id: string
          revenue_share_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_mode?: string | null
          auto_approve_ads?: boolean | null
          blocked_categories?: string[] | null
          created_at?: string | null
          id?: string
          minimum_cpm?: number | null
          platform_ads_enabled?: boolean | null
          podcast_id: string
          revenue_share_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_mode?: string | null
          auto_approve_ads?: boolean | null
          blocked_categories?: string[] | null
          created_at?: string | null
          id?: string
          minimum_cpm?: number | null
          platform_ads_enabled?: boolean | null
          podcast_id?: string
          revenue_share_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_ad_settings_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: true
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_campaign_selections: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          opted_in_at: string | null
          podcast_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          opted_in_at?: string | null
          podcast_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          opted_in_at?: string | null
          podcast_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_campaign_selections_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_campaign_selections_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_directories: {
        Row: {
          approved_at: string | null
          created_at: string | null
          directory_name: string
          directory_specific_url: string | null
          directory_url: string | null
          id: string
          notes: string | null
          podcast_id: string
          status: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          directory_name: string
          directory_specific_url?: string | null
          directory_url?: string | null
          id?: string
          notes?: string | null
          podcast_id: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          directory_name?: string
          directory_specific_url?: string | null
          directory_url?: string | null
          id?: string
          notes?: string | null
          podcast_id?: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcast_directories_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_rss_auto_updates: {
        Row: {
          auto_update_enabled: boolean | null
          created_at: string | null
          directories: Json | null
          id: string
          last_update_at: string | null
          podcast_id: string
          update_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          auto_update_enabled?: boolean | null
          created_at?: string | null
          directories?: Json | null
          id?: string
          last_update_at?: string | null
          podcast_id: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_update_enabled?: boolean | null
          created_at?: string | null
          directories?: Json | null
          id?: string
          last_update_at?: string | null
          podcast_id?: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcast_rss_auto_updates_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: true
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          author_email: string | null
          author_name: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_explicit: boolean | null
          is_published: boolean | null
          language: string | null
          rss_feed_url: string | null
          show_on_profile: boolean | null
          title: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_explicit?: boolean | null
          is_published?: boolean | null
          language?: string | null
          rss_feed_url?: string | null
          show_on_profile?: boolean | null
          title: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_explicit?: boolean | null
          is_published?: boolean | null
          language?: string | null
          rss_feed_url?: string | null
          show_on_profile?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          option_date: string
          poll_id: string
          start_time: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          option_date: string
          poll_id: string
          start_time?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          option_date?: string
          poll_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          voter_email: string
          voter_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          voter_email: string
          voter_name: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          voter_email?: string
          voter_name?: string
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
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple_votes: boolean
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          require_voter_info: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_multiple_votes?: boolean
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          require_voter_info?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_multiple_votes?: boolean
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          require_voter_info?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_section_order: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_visible: boolean
          profile_id: string
          section_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          profile_id: string
          section_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          profile_id?: string
          section_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_section_order_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string
          visitor_city: string | null
          visitor_country: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
          visitor_city?: string | null
          visitor_country?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
          visitor_city?: string | null
          visitor_country?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_avatar_url: string | null
          account_full_name: string | null
          account_phone: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          admin_avatar_url: string | null
          admin_email: string | null
          admin_full_name: string | null
          admin_phone: string | null
          auto_publish_rss: boolean | null
          avatar_url: string | null
          bio: string | null
          blog_name: string | null
          blog_rss_url: string | null
          categories: string[] | null
          created_at: string | null
          custom_bg_colors: Json | null
          custom_hero_colors: Json | null
          custom_theme_colors: Json | null
          full_name: string | null
          hero_section_color: string | null
          id: string
          include_logo_in_qr: boolean | null
          is_live: boolean | null
          is_live_on_profile: boolean | null
          legal_on_profile: boolean | null
          live_stream_title: string | null
          live_video_url: string | null
          my_page_ad_id: string | null
          my_page_cta_button_text: string | null
          my_page_cta_phone_number: string | null
          my_page_cta_text_keyword: string | null
          my_page_video_id: string | null
          my_page_video_loop: boolean | null
          my_page_video_type: string | null
          newsletter_description: string | null
          newsletter_enabled: boolean | null
          newsletter_heading: string | null
          page_background_color: string | null
          qr_code_color: string | null
          show_blog_on_profile: boolean | null
          show_latest_blog_only: boolean | null
          social_icons_color: boolean | null
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean | null
          stripe_connect_details_submitted: boolean | null
          stripe_connect_payouts_enabled: boolean | null
          stripe_connect_status: string | null
          theme_color: string | null
          tipping_button_text: string | null
          tipping_enabled: boolean | null
          updated_at: string | null
          use_separate_admin_profile: boolean | null
          username: string
        }
        Insert: {
          account_avatar_url?: string | null
          account_full_name?: string | null
          account_phone?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          admin_avatar_url?: string | null
          admin_email?: string | null
          admin_full_name?: string | null
          admin_phone?: string | null
          auto_publish_rss?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          blog_name?: string | null
          blog_rss_url?: string | null
          categories?: string[] | null
          created_at?: string | null
          custom_bg_colors?: Json | null
          custom_hero_colors?: Json | null
          custom_theme_colors?: Json | null
          full_name?: string | null
          hero_section_color?: string | null
          id: string
          include_logo_in_qr?: boolean | null
          is_live?: boolean | null
          is_live_on_profile?: boolean | null
          legal_on_profile?: boolean | null
          live_stream_title?: string | null
          live_video_url?: string | null
          my_page_ad_id?: string | null
          my_page_cta_button_text?: string | null
          my_page_cta_phone_number?: string | null
          my_page_cta_text_keyword?: string | null
          my_page_video_id?: string | null
          my_page_video_loop?: boolean | null
          my_page_video_type?: string | null
          newsletter_description?: string | null
          newsletter_enabled?: boolean | null
          newsletter_heading?: string | null
          page_background_color?: string | null
          qr_code_color?: string | null
          show_blog_on_profile?: boolean | null
          show_latest_blog_only?: boolean | null
          social_icons_color?: boolean | null
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
          stripe_connect_status?: string | null
          theme_color?: string | null
          tipping_button_text?: string | null
          tipping_enabled?: boolean | null
          updated_at?: string | null
          use_separate_admin_profile?: boolean | null
          username: string
        }
        Update: {
          account_avatar_url?: string | null
          account_full_name?: string | null
          account_phone?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          admin_avatar_url?: string | null
          admin_email?: string | null
          admin_full_name?: string | null
          admin_phone?: string | null
          auto_publish_rss?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          blog_name?: string | null
          blog_rss_url?: string | null
          categories?: string[] | null
          created_at?: string | null
          custom_bg_colors?: Json | null
          custom_hero_colors?: Json | null
          custom_theme_colors?: Json | null
          full_name?: string | null
          hero_section_color?: string | null
          id?: string
          include_logo_in_qr?: boolean | null
          is_live?: boolean | null
          is_live_on_profile?: boolean | null
          legal_on_profile?: boolean | null
          live_stream_title?: string | null
          live_video_url?: string | null
          my_page_ad_id?: string | null
          my_page_cta_button_text?: string | null
          my_page_cta_phone_number?: string | null
          my_page_cta_text_keyword?: string | null
          my_page_video_id?: string | null
          my_page_video_loop?: boolean | null
          my_page_video_type?: string | null
          newsletter_description?: string | null
          newsletter_enabled?: boolean | null
          newsletter_heading?: string | null
          page_background_color?: string | null
          qr_code_color?: string | null
          show_blog_on_profile?: boolean | null
          show_latest_blog_only?: boolean | null
          social_icons_color?: boolean | null
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
          stripe_connect_status?: string | null
          theme_color?: string | null
          tipping_button_text?: string | null
          tipping_enabled?: boolean | null
          updated_at?: string | null
          use_separate_admin_profile?: boolean | null
          username?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          client_contact_id: string | null
          created_at: string
          description: string | null
          id: string
          items: Json | null
          notes: string | null
          privacy_policy_id: string | null
          proposal_number: string
          sent_at: string | null
          sent_to_email: string | null
          signature_data: string | null
          signed_at: string | null
          signed_by_email: string | null
          signed_by_name: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms_conditions_id: string | null
          title: string
          total_amount: number
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          client_contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          privacy_policy_id?: string | null
          proposal_number: string
          sent_at?: string | null
          sent_to_email?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms_conditions_id?: string | null
          title: string
          total_amount?: number
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          client_contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          privacy_policy_id?: string | null
          proposal_number?: string
          sent_at?: string | null
          sent_to_email?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms_conditions_id?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_privacy_policy_id_fkey"
            columns: ["privacy_policy_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_terms_conditions_id_fkey"
            columns: ["terms_conditions_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          title: string
          type: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          title: string
          type: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      rss_migrations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          host_type: string | null
          id: string
          last_check_at: string | null
          migration_notes: string | null
          migration_status: string | null
          migration_step: string | null
          new_rss_url: string
          old_rss_url: string
          podcast_id: string
          redirect_setup: boolean | null
          redirect_status: string | null
          redirect_verified_at: string | null
          third_party_platform: string | null
          user_notes: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          host_type?: string | null
          id?: string
          last_check_at?: string | null
          migration_notes?: string | null
          migration_status?: string | null
          migration_step?: string | null
          new_rss_url: string
          old_rss_url: string
          podcast_id: string
          redirect_setup?: boolean | null
          redirect_status?: string | null
          redirect_verified_at?: string | null
          third_party_platform?: string | null
          user_notes?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          host_type?: string | null
          id?: string
          last_check_at?: string | null
          migration_notes?: string | null
          migration_status?: string | null
          migration_step?: string | null
          new_rss_url?: string
          old_rss_url?: string
          podcast_id?: string
          redirect_setup?: boolean | null
          redirect_status?: string | null
          redirect_verified_at?: string | null
          third_party_platform?: string | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rss_migrations_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_redirect_instructions: {
        Row: {
          created_at: string | null
          help_url: string | null
          id: string
          instructions: string
          platform_display_name: string
          platform_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          help_url?: string | null
          id?: string
          instructions: string
          platform_display_name: string
          platform_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          help_url?: string | null
          id?: string
          instructions?: string
          platform_display_name?: string
          platform_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_commissions: {
        Row: {
          campaign_revenue: number
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          multi_channel_campaign_id: string | null
          paid_at: string | null
          sales_team_member_id: string | null
          status: string | null
        }
        Insert: {
          campaign_revenue: number
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          multi_channel_campaign_id?: string | null
          paid_at?: string | null
          sales_team_member_id?: string | null
          status?: string | null
        }
        Update: {
          campaign_revenue?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          multi_channel_campaign_id?: string | null
          paid_at?: string | null
          sales_team_member_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_multi_channel_campaign_id_fkey"
            columns: ["multi_channel_campaign_id"]
            isOneToOne: false
            referencedRelation: "multi_channel_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_sales_team_member_id_fkey"
            columns: ["sales_team_member_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_team_members: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_email_templates: {
        Row: {
          created_at: string | null
          customization_data: Json | null
          customized_html: string
          folder_id: string | null
          id: string
          name: string
          template_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customization_data?: Json | null
          customized_html: string
          folder_id?: string | null
          id?: string
          name: string
          template_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customization_data?: Json | null
          customized_html?: string
          folder_id?: string | null
          id?: string
          name?: string
          template_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_email_templates_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "email_template_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_proformas: {
        Row: {
          created_at: string
          id: string
          proforma_data: Json
          proforma_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proforma_data: Json
          proforma_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proforma_data?: Json
          proforma_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signature_documents: {
        Row: {
          access_token: string
          client_id: string | null
          created_at: string | null
          document_content: string
          document_title: string
          id: string
          pdf_url: string | null
          recipient_email: string
          recipient_name: string
          sent_at: string | null
          signature_data: Json | null
          signed_at: string | null
          status: string | null
          template_id: string | null
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          client_id?: string | null
          created_at?: string | null
          document_content: string
          document_title: string
          id?: string
          pdf_url?: string | null
          recipient_email: string
          recipient_name: string
          sent_at?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          client_id?: string | null
          created_at?: string | null
          document_content?: string
          document_title?: string
          id?: string
          pdf_url?: string | null
          recipient_email?: string
          recipient_name?: string
          sent_at?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signature_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_documents_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_sheets: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_published: boolean | null
          location: string | null
          slot_duration: number
          start_date: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_published?: boolean | null
          location?: string | null
          slot_duration: number
          start_date: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_published?: boolean | null
          location?: string | null
          slot_duration?: number
          start_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signup_slots: {
        Row: {
          created_at: string | null
          id: string
          is_filled: boolean | null
          notes: string | null
          sheet_id: string
          signed_up_at: string | null
          slot_end: string
          slot_start: string
          volunteer_email: string | null
          volunteer_name: string | null
          volunteer_phone: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_filled?: boolean | null
          notes?: string | null
          sheet_id: string
          signed_up_at?: string | null
          slot_end: string
          slot_start: string
          volunteer_email?: string | null
          volunteer_name?: string | null
          volunteer_phone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_filled?: boolean | null
          notes?: string | null
          sheet_id?: string
          signed_up_at?: string | null
          slot_end?: string
          slot_start?: string
          volunteer_email?: string | null
          volunteer_name?: string | null
          volunteer_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signup_slots_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "signup_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_consent_records: {
        Row: {
          consent_given: boolean
          consent_text: string
          created_at: string
          id: string
          ip_address: string | null
          phone_number: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_given?: boolean
          consent_text: string
          created_at?: string
          id?: string
          ip_address?: string | null
          phone_number: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_text?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          phone_number?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_image_url: string | null
          account_name: string
          account_username: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_id: string
          account_image_url?: string | null
          account_name: string
          account_username?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          account_image_url?: string | null
          account_name?: string
          account_username?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          platform: string
          profile_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          platform: string
          profile_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          platform?: string
          profile_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_accounts: {
        Row: {
          access_token: string | null
          account_metadata: Json | null
          created_at: string | null
          engagement_rate: number | null
          followers_count: number | null
          id: string
          is_business_account: boolean | null
          is_verified: boolean | null
          last_synced_at: string | null
          platform: string
          platform_user_id: string | null
          platform_username: string | null
          profile_url: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          access_token?: string | null
          account_metadata?: Json | null
          created_at?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          id?: string
          is_business_account?: boolean | null
          is_verified?: boolean | null
          last_synced_at?: string | null
          platform: string
          platform_user_id?: string | null
          platform_username?: string | null
          profile_url?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string | null
          account_metadata?: Json | null
          created_at?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          id?: string
          is_business_account?: boolean | null
          is_verified?: boolean | null
          last_synced_at?: string | null
          platform?: string
          platform_user_id?: string | null
          platform_username?: string | null
          profile_url?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      social_media_properties: {
        Row: {
          account_handle: string
          avg_engagement_rate: number | null
          created_at: string | null
          creator_id: string | null
          follower_count: number | null
          id: string
          is_verified: boolean | null
          platform: string
          rate_per_post: number | null
          rate_per_reel: number | null
          rate_per_story: number | null
          updated_at: string | null
        }
        Insert: {
          account_handle: string
          avg_engagement_rate?: number | null
          created_at?: string | null
          creator_id?: string | null
          follower_count?: number | null
          id?: string
          is_verified?: boolean | null
          platform: string
          rate_per_post?: number | null
          rate_per_reel?: number | null
          rate_per_story?: number | null
          updated_at?: string | null
        }
        Update: {
          account_handle?: string
          avg_engagement_rate?: number | null
          created_at?: string | null
          creator_id?: string | null
          follower_count?: number | null
          id?: string
          is_verified?: boolean | null
          platform?: string
          rate_per_post?: number | null
          rate_per_reel?: number | null
          rate_per_story?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spin_wheel_history: {
        Row: {
          credits_spent_threshold: number
          credits_won: number
          id: string
          spun_at: string | null
          user_id: string
        }
        Insert: {
          credits_spent_threshold: number
          credits_won: number
          id?: string
          spun_at?: string | null
          user_id: string
        }
        Update: {
          credits_spent_threshold?: number
          credits_won?: number
          id?: string
          spun_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stream_impressions: {
        Row: {
          created_at: string
          creator_id: string
          ended_at: string | null
          id: string
          session_id: string
          started_at: string
          stream_title: string | null
          stream_type: string
          user_agent: string | null
          viewer_ip_hash: string
          viewer_location: Json | null
          watch_duration_seconds: number | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          ended_at?: string | null
          id?: string
          session_id: string
          started_at?: string
          stream_title?: string | null
          stream_type: string
          user_agent?: string | null
          viewer_ip_hash: string
          viewer_location?: Json | null
          watch_duration_seconds?: number | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          ended_at?: string | null
          id?: string
          session_id?: string
          started_at?: string
          stream_title?: string | null
          stream_type?: string
          user_agent?: string | null
          viewer_ip_hash?: string
          viewer_location?: Json | null
          watch_duration_seconds?: number | null
        }
        Relationships: []
      }
      studio_guests: {
        Row: {
          created_at: string | null
          display_order: number | null
          guest_name: string
          guest_title: string | null
          guest_website: string | null
          id: string
          is_active: boolean | null
          studio_session_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          guest_name: string
          guest_title?: string | null
          guest_website?: string | null
          id?: string
          is_active?: boolean | null
          studio_session_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          guest_name?: string
          guest_title?: string | null
          guest_website?: string | null
          id?: string
          is_active?: boolean | null
          studio_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_guests_studio_session_id_fkey"
            columns: ["studio_session_id"]
            isOneToOne: false
            referencedRelation: "studio_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_recording_ads: {
        Row: {
          ad_slot_id: string
          created_at: string | null
          id: string
          inserted_at: string | null
          recording_id: string
        }
        Insert: {
          ad_slot_id: string
          created_at?: string | null
          id?: string
          inserted_at?: string | null
          recording_id: string
        }
        Update: {
          ad_slot_id?: string
          created_at?: string | null
          id?: string
          inserted_at?: string | null
          recording_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_recording_ads_ad_slot_id_fkey"
            columns: ["ad_slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_recording_ads_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "studio_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_recordings: {
        Row: {
          converted_to_episode_id: string | null
          created_at: string | null
          daily_recording_id: string | null
          duration_seconds: number | null
          edit_status: string | null
          edit_transcript: Json | null
          edited_recording_url: string | null
          file_size_bytes: number | null
          id: string
          original_recording_url: string | null
          recording_url: string | null
          session_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          converted_to_episode_id?: string | null
          created_at?: string | null
          daily_recording_id?: string | null
          duration_seconds?: number | null
          edit_status?: string | null
          edit_transcript?: Json | null
          edited_recording_url?: string | null
          file_size_bytes?: number | null
          id?: string
          original_recording_url?: string | null
          recording_url?: string | null
          session_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          converted_to_episode_id?: string | null
          created_at?: string | null
          daily_recording_id?: string | null
          duration_seconds?: number | null
          edit_status?: string | null
          edit_transcript?: Json | null
          edited_recording_url?: string | null
          file_size_bytes?: number | null
          id?: string
          original_recording_url?: string | null
          recording_url?: string | null
          session_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_recordings_converted_to_episode_id_fkey"
            columns: ["converted_to_episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "studio_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_sessions: {
        Row: {
          created_at: string | null
          daily_room_url: string
          ended_at: string | null
          id: string
          participants_count: number | null
          recording_status: string | null
          room_name: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_room_url: string
          ended_at?: string | null
          id?: string
          participants_count?: number | null
          recording_status?: string | null
          room_name: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_room_url?: string
          ended_at?: string | null
          id?: string
          participants_count?: number | null
          recording_status?: string | null
          room_name?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      studio_templates: {
        Row: {
          created_at: string
          description: string | null
          host_name: string | null
          id: string
          session_name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          host_name?: string | null
          id?: string
          session_name: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          host_name?: string | null
          id?: string
          session_name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_chat_participants: {
        Row: {
          account_holder_user_id: string | null
          admin_user_id: string | null
          chat_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          account_holder_user_id?: string | null
          admin_user_id?: string | null
          chat_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          account_holder_user_id?: string | null
          admin_user_id?: string | null
          chat_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      tab_views: {
        Row: {
          id: string
          profile_id: string
          tab_name: string
          viewed_at: string | null
          visitor_city: string | null
          visitor_country: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          tab_name: string
          viewed_at?: string | null
          visitor_city?: string | null
          visitor_country?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          tab_name?: string
          viewed_at?: string | null
          visitor_city?: string | null
          visitor_country?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          mentioned_user_ids: string[] | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          mentioned_user_ids?: string[] | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          mentioned_user_ids?: string[] | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invited_at: string | null
          invitee_email: string
          invitee_name: string | null
          inviter_id: string
          role: string
          status: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invitee_email: string
          invitee_name?: string | null
          inviter_id: string
          role?: string
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invitee_email?: string
          invitee_name?: string | null
          inviter_id?: string
          role?: string
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          added_at: string | null
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          chat_type: Database["public"]["Enums"]["chat_type"] | null
          created_at: string
          id: string
          message: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_type?: Database["public"]["Enums"]["chat_type"] | null
          created_at?: string
          id?: string
          message: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_type?: Database["public"]["Enums"]["chat_type"] | null
          created_at?: string
          id?: string
          message?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          best_contact_times: string[] | null
          category: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          id: string
          last_activity_at: string | null
          latitude: number | null
          location_accuracy: number | null
          longitude: number | null
          notes: string | null
          photos: string[] | null
          preferred_contact_method: string[] | null
          priority: string | null
          property_address: string | null
          resolved_at: string | null
          scheduled_estimate_time: string | null
          status: string | null
          ticket_number: string
          title: string
          updated_at: string | null
          user_id: string
          work_types: string[] | null
        }
        Insert: {
          assigned_to?: string | null
          best_contact_times?: string[] | null
          category?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_activity_at?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          notes?: string | null
          photos?: string[] | null
          preferred_contact_method?: string[] | null
          priority?: string | null
          property_address?: string | null
          resolved_at?: string | null
          scheduled_estimate_time?: string | null
          status?: string | null
          ticket_number: string
          title: string
          updated_at?: string | null
          user_id: string
          work_types?: string[] | null
        }
        Update: {
          assigned_to?: string | null
          best_contact_times?: string[] | null
          category?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_activity_at?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          notes?: string | null
          photos?: string[] | null
          preferred_contact_method?: string[] | null
          priority?: string | null
          property_address?: string | null
          resolved_at?: string | null
          scheduled_estimate_time?: string | null
          status?: string | null
          ticket_number?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          work_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_failure_logs: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string
          file_name: string
          file_size_bytes: number
          id: string
          upload_progress: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type: string
          file_name: string
          file_size_bytes: number
          id?: string
          upload_progress?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          upload_progress?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string | null
          feature_type: string
          id: string
          period_end: string
          period_start: string
          updated_at: string | null
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_type: string
          id?: string
          period_end: string
          period_start: string
          updated_at?: string | null
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_type?: string
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string | null
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string | null
          credit_goal: number | null
          id: string
          total_earned: number | null
          total_purchased: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          credit_goal?: number | null
          id?: string
          total_earned?: number | null
          total_purchased?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          credit_goal?: number | null
          id?: string
          total_earned?: number | null
          total_purchased?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_modules: {
        Row: {
          granted_at: string | null
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          contacts_enabled: boolean | null
          created_at: string | null
          dismissed_dependency_warnings: string[] | null
          id: string
          meetings_enabled: boolean | null
          module_advertiser_enabled: boolean | null
          module_agency_enabled: boolean | null
          module_awards_enabled: boolean | null
          module_blog_enabled: boolean | null
          module_civic_enabled: boolean | null
          module_events_enabled: boolean | null
          module_influencer_enabled: boolean | null
          module_lead_pixel_enabled: boolean | null
          module_marketing_enabled: boolean | null
          module_media_enabled: boolean | null
          module_monetization_enabled: boolean | null
          module_polls_enabled: boolean | null
          module_project_management_enabled: boolean | null
          module_qr_codes_enabled: boolean | null
          module_rss_podcast_posting_enabled: boolean | null
          module_signup_sheets_enabled: boolean | null
          module_sms_enabled: boolean | null
          module_team_chat_enabled: boolean | null
          my_page_enabled: boolean | null
          my_page_visited: boolean | null
          onboarding_completed: boolean | null
          pinned_modules: Json | null
          podcasts_enabled: boolean | null
          sms_event_registrations: boolean | null
          sms_feature_updates: boolean | null
          sms_follower_requests: boolean | null
          sms_maintenance_alerts: boolean | null
          sms_meeting_confirmations: boolean | null
          sms_meeting_reminders: boolean | null
          sms_new_account_alerts: boolean | null
          sms_notifications_enabled: boolean | null
          sms_ticket_assignments: boolean | null
          task_reminder_enabled: boolean | null
          task_reminder_frequency: string | null
          task_view_mode: string | null
          theme_preference: string | null
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          contacts_enabled?: boolean | null
          created_at?: string | null
          dismissed_dependency_warnings?: string[] | null
          id?: string
          meetings_enabled?: boolean | null
          module_advertiser_enabled?: boolean | null
          module_agency_enabled?: boolean | null
          module_awards_enabled?: boolean | null
          module_blog_enabled?: boolean | null
          module_civic_enabled?: boolean | null
          module_events_enabled?: boolean | null
          module_influencer_enabled?: boolean | null
          module_lead_pixel_enabled?: boolean | null
          module_marketing_enabled?: boolean | null
          module_media_enabled?: boolean | null
          module_monetization_enabled?: boolean | null
          module_polls_enabled?: boolean | null
          module_project_management_enabled?: boolean | null
          module_qr_codes_enabled?: boolean | null
          module_rss_podcast_posting_enabled?: boolean | null
          module_signup_sheets_enabled?: boolean | null
          module_sms_enabled?: boolean | null
          module_team_chat_enabled?: boolean | null
          my_page_enabled?: boolean | null
          my_page_visited?: boolean | null
          onboarding_completed?: boolean | null
          pinned_modules?: Json | null
          podcasts_enabled?: boolean | null
          sms_event_registrations?: boolean | null
          sms_feature_updates?: boolean | null
          sms_follower_requests?: boolean | null
          sms_maintenance_alerts?: boolean | null
          sms_meeting_confirmations?: boolean | null
          sms_meeting_reminders?: boolean | null
          sms_new_account_alerts?: boolean | null
          sms_notifications_enabled?: boolean | null
          sms_ticket_assignments?: boolean | null
          task_reminder_enabled?: boolean | null
          task_reminder_frequency?: string | null
          task_view_mode?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          contacts_enabled?: boolean | null
          created_at?: string | null
          dismissed_dependency_warnings?: string[] | null
          id?: string
          meetings_enabled?: boolean | null
          module_advertiser_enabled?: boolean | null
          module_agency_enabled?: boolean | null
          module_awards_enabled?: boolean | null
          module_blog_enabled?: boolean | null
          module_civic_enabled?: boolean | null
          module_events_enabled?: boolean | null
          module_influencer_enabled?: boolean | null
          module_lead_pixel_enabled?: boolean | null
          module_marketing_enabled?: boolean | null
          module_media_enabled?: boolean | null
          module_monetization_enabled?: boolean | null
          module_polls_enabled?: boolean | null
          module_project_management_enabled?: boolean | null
          module_qr_codes_enabled?: boolean | null
          module_rss_podcast_posting_enabled?: boolean | null
          module_signup_sheets_enabled?: boolean | null
          module_sms_enabled?: boolean | null
          module_team_chat_enabled?: boolean | null
          my_page_enabled?: boolean | null
          my_page_visited?: boolean | null
          onboarding_completed?: boolean | null
          pinned_modules?: Json | null
          podcasts_enabled?: boolean | null
          sms_event_registrations?: boolean | null
          sms_feature_updates?: boolean | null
          sms_follower_requests?: boolean | null
          sms_maintenance_alerts?: boolean | null
          sms_meeting_confirmations?: boolean | null
          sms_meeting_reminders?: boolean | null
          sms_new_account_alerts?: boolean | null
          sms_notifications_enabled?: boolean | null
          sms_ticket_assignments?: boolean | null
          task_reminder_enabled?: boolean | null
          task_reminder_frequency?: string | null
          task_view_mode?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          is_online: boolean
          last_seen: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          is_online?: boolean
          last_seen?: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          is_online?: boolean
          last_seen?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_markers: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          id: string
          marker_type: string
          media_file_id: string
          metadata: Json | null
          timestamp_seconds: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          marker_type: string
          media_file_id: string
          metadata?: Json | null
          timestamp_seconds: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          marker_type?: string
          media_file_id?: string
          metadata?: Json | null
          timestamp_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_markers_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
        ]
      }
      video_post_production_edits: {
        Row: {
          created_at: string
          id: string
          markers: Json
          media_file_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          markers?: Json
          media_file_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          markers?: Json
          media_file_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_post_production_edits_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_ad_usage: {
        Row: {
          advertiser_id: string | null
          amount_paid: number | null
          audio_ad_id: string | null
          created_at: string | null
          id: string
          voice_profile_id: string | null
        }
        Insert: {
          advertiser_id?: string | null
          amount_paid?: number | null
          audio_ad_id?: string | null
          created_at?: string | null
          id?: string
          voice_profile_id?: string | null
        }
        Update: {
          advertiser_id?: string | null
          amount_paid?: number | null
          audio_ad_id?: string | null
          created_at?: string | null
          id?: string
          voice_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_ad_usage_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_ad_usage_audio_ad_id_fkey"
            columns: ["audio_ad_id"]
            isOneToOne: false
            referencedRelation: "audio_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_ad_usage_voice_profile_id_fkey"
            columns: ["voice_profile_id"]
            isOneToOne: false
            referencedRelation: "creator_voice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zoom_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
          token_expiry: string
          updated_at: string
          user_id: string
          zoom_email: string | null
          zoom_user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
          token_expiry: string
          updated_at?: string
          user_id: string
          zoom_email?: string | null
          zoom_user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
          token_expiry?: string
          updated_at?: string
          user_id?: string
          zoom_email?: string | null
          zoom_user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_to_system_list: {
        Args: { _contact_id: string; _list_name: string }
        Returns: undefined
      }
      calculate_impression_revenue: {
        Args: {
          _campaign_id: string
          _creator_id: string
          _impression_count: number
        }
        Returns: {
          creator_share: number
          platform_share: number
          revenue_generated: number
        }[]
      }
      create_meeting_public: {
        Args: {
          p_attendee_email: string
          p_attendee_name: string
          p_attendee_phone?: string
          p_attendee_responses?: Json
          p_description: string
          p_end_time: string
          p_location_details: string
          p_location_type: Database["public"]["Enums"]["location_type"]
          p_meeting_type_id: string
          p_start_time: string
          p_status?: Database["public"]["Enums"]["meeting_status"]
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      ensure_contact_exists: {
        Args: { _email: string; _name: string; _owner_id: string }
        Returns: string
      }
      generate_investor_code: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      get_current_usage: {
        Args: { _feature_type: string; _user_id: string }
        Returns: number
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { _feature_type: string; _increment?: number; _user_id: string }
        Returns: undefined
      }
      is_team_owner: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_action_description: string
          p_action_type: string
          p_metadata?: Json
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_user_id: string
        }
        Returns: string
      }
      validate_ad_impression: {
        Args: {
          p_ad_slot_id: string
          p_campaign_id: string
          p_listener_ip_hash: string
          p_user_agent: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type:
        | "creator"
        | "advertiser"
        | "meeting_planner"
        | "seeksy_admin"
      advertiser_team_role:
        | "super_admin"
        | "admin"
        | "ad_manager"
        | "creative"
        | "sales"
      app_role:
        | "admin"
        | "creator"
        | "attendee"
        | "super_admin"
        | "manager"
        | "scheduler"
        | "sales"
        | "member"
        | "advertiser"
        | "staff"
      award_program_status:
        | "draft"
        | "nominations_open"
        | "voting_open"
        | "closed"
        | "completed"
      chat_type: "team_chat" | "admin_internal" | "support_chat"
      location_type:
        | "phone"
        | "zoom"
        | "teams"
        | "meet"
        | "in-person"
        | "custom"
        | "seeksy_studio"
      meeting_status: "scheduled" | "completed" | "cancelled"
      nominee_status: "pending" | "approved" | "rejected"
      voting_method: "public" | "jury" | "hybrid" | "ranked_choice"
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
      account_type: [
        "creator",
        "advertiser",
        "meeting_planner",
        "seeksy_admin",
      ],
      advertiser_team_role: [
        "super_admin",
        "admin",
        "ad_manager",
        "creative",
        "sales",
      ],
      app_role: [
        "admin",
        "creator",
        "attendee",
        "super_admin",
        "manager",
        "scheduler",
        "sales",
        "member",
        "advertiser",
        "staff",
      ],
      award_program_status: [
        "draft",
        "nominations_open",
        "voting_open",
        "closed",
        "completed",
      ],
      chat_type: ["team_chat", "admin_internal", "support_chat"],
      location_type: [
        "phone",
        "zoom",
        "teams",
        "meet",
        "in-person",
        "custom",
        "seeksy_studio",
      ],
      meeting_status: ["scheduled", "completed", "cancelled"],
      nominee_status: ["pending", "approved", "rejected"],
      voting_method: ["public", "jury", "hybrid", "ranked_choice"],
    },
  },
} as const
