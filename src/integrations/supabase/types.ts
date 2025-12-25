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
      admin_active_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string
          last_activity_at: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address: string
          last_activity_at?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string
          last_activity_at?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string
          success: boolean
          two_factor_used: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address: string
          success: boolean
          two_factor_used?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string
          success?: boolean
          two_factor_used?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_security_settings: {
        Row: {
          account_locked_until: string | null
          created_at: string
          failed_login_attempts: number | null
          id: string
          last_login_at: string | null
          last_login_ip: string | null
          last_login_user_agent: string | null
          login_alerts_enabled: boolean | null
          session_timeout_hours: number | null
          two_factor_backup_codes: string[] | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_locked_until?: string | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          last_login_user_agent?: string | null
          login_alerts_enabled?: boolean | null
          session_timeout_hours?: number | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_locked_until?: string | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          last_login_user_agent?: string | null
          login_alerts_enabled?: boolean | null
          session_timeout_hours?: number | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_campaigns: {
        Row: {
          affiliate_id: string
          campaign_name: string
          clicks: number
          conversion_rate: number | null
          conversions: number
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          pixel_code: string | null
          qr_code_url: string | null
          referral_link: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          affiliate_id: string
          campaign_name: string
          clicks?: number
          conversion_rate?: number | null
          conversions?: number
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          pixel_code?: string | null
          qr_code_url?: string | null
          referral_link: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          affiliate_id?: string
          campaign_name?: string
          clicks?: number
          conversion_rate?: number | null
          conversions?: number
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          pixel_code?: string | null
          qr_code_url?: string | null
          referral_link?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_campaigns_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_rewards: {
        Row: {
          affiliate_id: string
          affiliate_user_id: string | null
          amount_usd: number
          approved_at: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          reward_type: string
          status: string
        }
        Insert: {
          affiliate_id: string
          affiliate_user_id?: string | null
          amount_usd: number
          approved_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          reward_type: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          affiliate_user_id?: string | null
          amount_usd?: number
          approved_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          reward_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_rewards_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_rewards_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "affiliate_users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_users: {
        Row: {
          affiliate_id: string
          backtest_count: number
          bot_activated: boolean
          browser_fingerprint: string | null
          cpa_earned_usd: number
          cpu_units_earned: number
          created_at: string
          device_id: string | null
          first_activity_at: string | null
          fraud_flags: Json | null
          fraud_score: number | null
          id: string
          ip_address: unknown
          is_active: boolean
          is_premium: boolean
          last_activity_at: string | null
          lp_earned: number
          metadata: Json | null
          referral_link: string | null
          referral_source: string
          referred_user_id: string
          revenue_share_earned_usd: number
          status: string
          total_volume_usd: number
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          verified_at: string | null
        }
        Insert: {
          affiliate_id: string
          backtest_count?: number
          bot_activated?: boolean
          browser_fingerprint?: string | null
          cpa_earned_usd?: number
          cpu_units_earned?: number
          created_at?: string
          device_id?: string | null
          first_activity_at?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          is_premium?: boolean
          last_activity_at?: string | null
          lp_earned?: number
          metadata?: Json | null
          referral_link?: string | null
          referral_source: string
          referred_user_id: string
          revenue_share_earned_usd?: number
          status?: string
          total_volume_usd?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verified_at?: string | null
        }
        Update: {
          affiliate_id?: string
          backtest_count?: number
          bot_activated?: boolean
          browser_fingerprint?: string | null
          cpa_earned_usd?: number
          cpu_units_earned?: number
          created_at?: string
          device_id?: string | null
          first_activity_at?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          is_premium?: boolean
          last_activity_at?: string | null
          lp_earned?: number
          metadata?: Json | null
          referral_link?: string | null
          referral_source?: string
          referred_user_id?: string
          revenue_share_earned_usd?: number
          status?: string
          total_volume_usd?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_users_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          active_referrals: number
          affiliate_key: string
          cpa_rate_usd: number
          created_at: string
          id: string
          influence_weight: number
          last_activity_at: string | null
          metadata: Json | null
          pending_earnings_usd: number
          referral_code: string
          revenue_share_pct: number
          status: string
          tier: string
          total_cpu_units: number
          total_earnings_usd: number
          total_lp_earned: number
          total_referrals: number
          total_tokens_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_referrals?: number
          affiliate_key: string
          cpa_rate_usd?: number
          created_at?: string
          id?: string
          influence_weight?: number
          last_activity_at?: string | null
          metadata?: Json | null
          pending_earnings_usd?: number
          referral_code: string
          revenue_share_pct?: number
          status?: string
          tier?: string
          total_cpu_units?: number
          total_earnings_usd?: number
          total_lp_earned?: number
          total_referrals?: number
          total_tokens_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_referrals?: number
          affiliate_key?: string
          cpa_rate_usd?: number
          created_at?: string
          id?: string
          influence_weight?: number
          last_activity_at?: string | null
          metadata?: Json | null
          pending_earnings_usd?: number
          referral_code?: string
          revenue_share_pct?: number
          status?: string
          tier?: string
          total_cpu_units?: number
          total_earnings_usd?: number
          total_lp_earned?: number
          total_referrals?: number
          total_tokens_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          context_summary: Json | null
          created_at: string
          id: string
          input: string
          metadata: Json | null
          mode: string
          output: string
          user_id: string
        }
        Insert: {
          context_summary?: Json | null
          created_at?: string
          id?: string
          input: string
          metadata?: Json | null
          mode: string
          output: string
          user_id: string
        }
        Update: {
          context_summary?: Json | null
          created_at?: string
          id?: string
          input?: string
          metadata?: Json | null
          mode?: string
          output?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_signal_user_settings: {
        Row: {
          created_at: string
          global_settings: Json
          last_reset_at: string | null
          signal_source: string
          smart_mode_enabled: boolean
          timeframe_profiles: Json
          updated_at: string
          user_id: string
          weight_presets: Json
        }
        Insert: {
          created_at?: string
          global_settings?: Json
          last_reset_at?: string | null
          signal_source?: string
          smart_mode_enabled?: boolean
          timeframe_profiles?: Json
          updated_at?: string
          user_id: string
          weight_presets?: Json
        }
        Update: {
          created_at?: string
          global_settings?: Json
          last_reset_at?: string | null
          signal_source?: string
          smart_mode_enabled?: boolean
          timeframe_profiles?: Json
          updated_at?: string
          user_id?: string
          weight_presets?: Json
        }
        Relationships: []
      }
      ai_signals_active: {
        Row: {
          ai_score: number | null
          created_at: string
          entry_price: number | null
          final_confidence: number
          id: string
          metadata: Json | null
          pattern_score: number | null
          risk_level: string
          rr_ratio: number | null
          sentiment_score: number | null
          side: string
          sources_used: Json | null
          status: string | null
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          technical_score: number | null
          timeframe: string
          updated_at: string
          volume_score: number | null
          wave_score: number | null
        }
        Insert: {
          ai_score?: number | null
          created_at?: string
          entry_price?: number | null
          final_confidence: number
          id?: string
          metadata?: Json | null
          pattern_score?: number | null
          risk_level: string
          rr_ratio?: number | null
          sentiment_score?: number | null
          side: string
          sources_used?: Json | null
          status?: string | null
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          technical_score?: number | null
          timeframe: string
          updated_at?: string
          volume_score?: number | null
          wave_score?: number | null
        }
        Update: {
          ai_score?: number | null
          created_at?: string
          entry_price?: number | null
          final_confidence?: number
          id?: string
          metadata?: Json | null
          pattern_score?: number | null
          risk_level?: string
          rr_ratio?: number | null
          sentiment_score?: number | null
          side?: string
          sources_used?: Json | null
          status?: string | null
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          technical_score?: number | null
          timeframe?: string
          updated_at?: string
          volume_score?: number | null
          wave_score?: number | null
        }
        Relationships: []
      }
      ai_signals_history: {
        Row: {
          ai_score: number | null
          closed_at: string | null
          created_at: string
          entry_price: number | null
          final_confidence: number
          id: string
          metadata: Json | null
          pattern_score: number | null
          profit_loss_percentage: number | null
          result: string | null
          risk_level: string
          rr_ratio: number | null
          sentiment_score: number | null
          side: string
          sources_used: Json | null
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          technical_score: number | null
          timeframe: string
          volume_score: number | null
          wave_score: number | null
        }
        Insert: {
          ai_score?: number | null
          closed_at?: string | null
          created_at?: string
          entry_price?: number | null
          final_confidence: number
          id?: string
          metadata?: Json | null
          pattern_score?: number | null
          profit_loss_percentage?: number | null
          result?: string | null
          risk_level: string
          rr_ratio?: number | null
          sentiment_score?: number | null
          side: string
          sources_used?: Json | null
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          technical_score?: number | null
          timeframe: string
          volume_score?: number | null
          wave_score?: number | null
        }
        Update: {
          ai_score?: number | null
          closed_at?: string | null
          created_at?: string
          entry_price?: number | null
          final_confidence?: number
          id?: string
          metadata?: Json | null
          pattern_score?: number | null
          profit_loss_percentage?: number | null
          result?: string | null
          risk_level?: string
          rr_ratio?: number | null
          sentiment_score?: number | null
          side?: string
          sources_used?: Json | null
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          technical_score?: number | null
          timeframe?: string
          volume_score?: number | null
          wave_score?: number | null
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          channel: string
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean | null
          is_system: boolean | null
          metadata: Json | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          is_system?: boolean | null
          metadata?: Json | null
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          is_system?: boolean | null
          metadata?: Json | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          body: string
          channels_sent: Json | null
          context: Json | null
          created_at: string
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          in_app_sent: boolean | null
          is_read: boolean | null
          level: string
          position_id: string | null
          read_at: string | null
          rule_id: string | null
          signal_id: string | null
          telegram_sent: boolean | null
          telegram_sent_at: string | null
          title: string
          trade_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          body: string
          channels_sent?: Json | null
          context?: Json | null
          created_at?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          in_app_sent?: boolean | null
          is_read?: boolean | null
          level: string
          position_id?: string | null
          read_at?: string | null
          rule_id?: string | null
          signal_id?: string | null
          telegram_sent?: boolean | null
          telegram_sent_at?: string | null
          title: string
          trade_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          body?: string
          channels_sent?: Json | null
          context?: Json | null
          created_at?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          in_app_sent?: boolean | null
          is_read?: boolean | null
          level?: string
          position_id?: string | null
          read_at?: string | null
          rule_id?: string | null
          signal_id?: string | null
          telegram_sent?: boolean | null
          telegram_sent_at?: string | null
          title?: string
          trade_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "tradingview_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      api_key_health_status: {
        Row: {
          api_key_id: string | null
          created_at: string
          error_rate_percentage: number | null
          id: string
          last_10_errors: Json | null
          last_checked_at: string | null
          last_successful_endpoint: string | null
          last_successful_request_at: string | null
          platform: string
          security_flags: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          error_rate_percentage?: number | null
          id?: string
          last_10_errors?: Json | null
          last_checked_at?: string | null
          last_successful_endpoint?: string | null
          last_successful_request_at?: string | null
          platform: string
          security_flags?: Json | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          error_rate_percentage?: number | null
          id?: string
          last_10_errors?: Json | null
          last_checked_at?: string | null
          last_successful_endpoint?: string | null
          last_successful_request_at?: string | null
          platform?: string
          security_flags?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_health_status_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_key_rotations: {
        Row: {
          api_key_id: string
          created_at: string
          id: string
          metadata: Json | null
          new_api_key_hash: string | null
          old_api_key_hash: string | null
          rotated_at: string
          rotated_by: string | null
          rotation_reason: string | null
          user_id: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_api_key_hash?: string | null
          old_api_key_hash?: string | null
          rotated_at?: string
          rotated_by?: string | null
          rotation_reason?: string | null
          user_id: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_api_key_hash?: string | null
          old_api_key_hash?: string | null
          rotated_at?: string
          rotated_by?: string | null
          rotation_reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_rotations_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          api_key: string
          auto_rotate_enabled: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_rotated_at: string | null
          passphrase: string | null
          platform: string
          rotation_schedule_days: number | null
          secret_key: string
          testnet: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          auto_rotate_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_rotated_at?: string | null
          passphrase?: string | null
          platform: string
          rotation_schedule_days?: number | null
          secret_key: string
          testnet?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          auto_rotate_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_rotated_at?: string | null
          passphrase?: string | null
          platform?: string
          rotation_schedule_days?: number | null
          secret_key?: string
          testnet?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      asset_risk_profiles: {
        Row: {
          base_risk_level: string
          data_window: Json | null
          id: string
          leverage_recommendation: number | null
          liquidity_score: number | null
          metadata: Json | null
          position_size_factor: number | null
          sentiment_bias: string | null
          symbol: string
          updated_at: string
          volatility_score: number | null
        }
        Insert: {
          base_risk_level: string
          data_window?: Json | null
          id?: string
          leverage_recommendation?: number | null
          liquidity_score?: number | null
          metadata?: Json | null
          position_size_factor?: number | null
          sentiment_bias?: string | null
          symbol: string
          updated_at?: string
          volatility_score?: number | null
        }
        Update: {
          base_risk_level?: string
          data_window?: Json | null
          id?: string
          leverage_recommendation?: number | null
          liquidity_score?: number | null
          metadata?: Json | null
          position_size_factor?: number | null
          sentiment_bias?: string | null
          symbol?: string
          updated_at?: string
          volatility_score?: number | null
        }
        Relationships: []
      }
      auto_trade_logs: {
        Row: {
          auto_trade_id: string
          created_at: string
          data: Json | null
          id: string
          message: string
          step: string
        }
        Insert: {
          auto_trade_id: string
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          step: string
        }
        Update: {
          auto_trade_id?: string
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_trade_logs_auto_trade_id_fkey"
            columns: ["auto_trade_id"]
            isOneToOne: false
            referencedRelation: "auto_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_trades: {
        Row: {
          bot_id: string | null
          created_at: string
          direction: string
          executed_at: string | null
          id: string
          metadata: Json | null
          pair: string
          platform: string
          position_id: string | null
          reason_code: string | null
          signal_id: string | null
          signal_source: string
          status: string
          user_id: string
        }
        Insert: {
          bot_id?: string | null
          created_at?: string
          direction: string
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          pair: string
          platform?: string
          position_id?: string | null
          reason_code?: string | null
          signal_id?: string | null
          signal_source: string
          status: string
          user_id: string
        }
        Update: {
          bot_id?: string | null
          created_at?: string
          direction?: string
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          pair?: string
          platform?: string
          position_id?: string | null
          reason_code?: string | null
          signal_id?: string | null
          signal_source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          pair: string
          result_json: Json
          signature: string
          strategy_id: string
          timeframe: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          pair: string
          result_json: Json
          signature: string
          strategy_id: string
          timeframe: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          pair?: string
          result_json?: Json
          signature?: string
          strategy_id?: string
          timeframe?: string
        }
        Relationships: []
      }
      backtest_equity_curve: {
        Row: {
          backtest_id: string
          created_at: string
          equity: number
          id: string
          open_positions: number | null
          realized_pnl: number | null
          time: number
          unrealized_pnl: number | null
        }
        Insert: {
          backtest_id: string
          created_at?: string
          equity: number
          id?: string
          open_positions?: number | null
          realized_pnl?: number | null
          time: number
          unrealized_pnl?: number | null
        }
        Update: {
          backtest_id?: string
          created_at?: string
          equity?: number
          id?: string
          open_positions?: number | null
          realized_pnl?: number | null
          time?: number
          unrealized_pnl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backtest_equity_curve_backtest_id_fkey"
            columns: ["backtest_id"]
            isOneToOne: false
            referencedRelation: "backtests"
            referencedColumns: ["id"]
          },
        ]
      }
      backtest_metrics: {
        Row: {
          avg_loss: number | null
          avg_trade_duration_hours: number | null
          avg_win: number | null
          backtest_id: string
          cagr: number | null
          calmar_ratio: number | null
          created_at: string
          expectancy: number
          id: string
          losing_trades: number
          max_drawdown_duration_days: number | null
          max_drawdown_pct: number
          max_loss_streak: number | null
          max_win_streak: number | null
          metadata: Json | null
          profit_factor: number
          sharpe_ratio: number | null
          total_return_pct: number
          total_trades: number
          updated_at: string
          volatility: number | null
          win_rate: number
          winning_trades: number
        }
        Insert: {
          avg_loss?: number | null
          avg_trade_duration_hours?: number | null
          avg_win?: number | null
          backtest_id: string
          cagr?: number | null
          calmar_ratio?: number | null
          created_at?: string
          expectancy?: number
          id?: string
          losing_trades?: number
          max_drawdown_duration_days?: number | null
          max_drawdown_pct?: number
          max_loss_streak?: number | null
          max_win_streak?: number | null
          metadata?: Json | null
          profit_factor?: number
          sharpe_ratio?: number | null
          total_return_pct?: number
          total_trades?: number
          updated_at?: string
          volatility?: number | null
          win_rate?: number
          winning_trades?: number
        }
        Update: {
          avg_loss?: number | null
          avg_trade_duration_hours?: number | null
          avg_win?: number | null
          backtest_id?: string
          cagr?: number | null
          calmar_ratio?: number | null
          created_at?: string
          expectancy?: number
          id?: string
          losing_trades?: number
          max_drawdown_duration_days?: number | null
          max_drawdown_pct?: number
          max_loss_streak?: number | null
          max_win_streak?: number | null
          metadata?: Json | null
          profit_factor?: number
          sharpe_ratio?: number | null
          total_return_pct?: number
          total_trades?: number
          updated_at?: string
          volatility?: number | null
          win_rate?: number
          winning_trades?: number
        }
        Relationships: [
          {
            foreignKeyName: "backtest_metrics_backtest_id_fkey"
            columns: ["backtest_id"]
            isOneToOne: true
            referencedRelation: "backtests"
            referencedColumns: ["id"]
          },
        ]
      }
      backtest_runs: {
        Row: {
          created_at: string
          error: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          pair: string
          period_from: string
          period_to: string
          status: string
          strategy_id: string
          summary: Json | null
          timeframe: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          pair: string
          period_from: string
          period_to: string
          status?: string
          strategy_id?: string
          summary?: Json | null
          timeframe: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          pair?: string
          period_from?: string
          period_to?: string
          status?: string
          strategy_id?: string
          summary?: Json | null
          timeframe?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_trades: {
        Row: {
          backtest_id: string
          backtest_run_id: string | null
          created_at: string
          dca_fills: Json | null
          entry_fee: number | null
          entry_price: number
          entry_qty: number
          entry_time: number
          exit_fee: number | null
          exit_price: number | null
          exit_qty: number | null
          exit_reason: string | null
          exit_time: number | null
          id: string
          max_adverse_move_pct: number | null
          max_favorable_move_pct: number | null
          metadata: Json | null
          pnl_pct: number
          pnl_usd: number
          side: string
          sl_fill: Json | null
          status: string
          symbol: string
          tp_fills: Json | null
        }
        Insert: {
          backtest_id: string
          backtest_run_id?: string | null
          created_at?: string
          dca_fills?: Json | null
          entry_fee?: number | null
          entry_price: number
          entry_qty: number
          entry_time: number
          exit_fee?: number | null
          exit_price?: number | null
          exit_qty?: number | null
          exit_reason?: string | null
          exit_time?: number | null
          id?: string
          max_adverse_move_pct?: number | null
          max_favorable_move_pct?: number | null
          metadata?: Json | null
          pnl_pct?: number
          pnl_usd?: number
          side: string
          sl_fill?: Json | null
          status: string
          symbol: string
          tp_fills?: Json | null
        }
        Update: {
          backtest_id?: string
          backtest_run_id?: string | null
          created_at?: string
          dca_fills?: Json | null
          entry_fee?: number | null
          entry_price?: number
          entry_qty?: number
          entry_time?: number
          exit_fee?: number | null
          exit_price?: number | null
          exit_qty?: number | null
          exit_reason?: string | null
          exit_time?: number | null
          id?: string
          max_adverse_move_pct?: number | null
          max_favorable_move_pct?: number | null
          metadata?: Json | null
          pnl_pct?: number
          pnl_usd?: number
          side?: string
          sl_fill?: Json | null
          status?: string
          symbol?: string
          tp_fills?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "backtest_trades_backtest_id_fkey"
            columns: ["backtest_id"]
            isOneToOne: false
            referencedRelation: "backtests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backtest_trades_backtest_run_id_fkey"
            columns: ["backtest_run_id"]
            isOneToOne: false
            referencedRelation: "backtest_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      backtests: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          error: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          config: Json
          created_at?: string
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          active_strategy_instance_id: string | null
          allow_long_trades: boolean | null
          allow_short_trades: boolean | null
          allowed_directions: string[] | null
          allowed_signal_sources: string[] | null
          auto_leverage: boolean | null
          auto_trading_enabled: boolean | null
          auto_trading_mode: string | null
          auto_trading_notes: string | null
          bot_name: string | null
          created_at: string | null
          dca_levels: number | null
          default_platform: string | null
          default_trade_direction: string | null
          error_message: string | null
          id: string
          initial_order_percentage: number | null
          is_active: boolean | null
          last_started_at: string | null
          last_stopped_at: string | null
          leverage: number | null
          leverage_strategy: string | null
          market_type: string | null
          max_active_trades: number | null
          max_auto_trades_per_day: number | null
          max_concurrent_auto_positions: number | null
          max_leverage_increase: number | null
          min_signal_confidence: number | null
          order_type: string | null
          profit_taking_strategy: string | null
          risk_percentage: number | null
          risk_reward_ratio: number | null
          signal_source: string
          status: string
          stop_loss_calculation_method: string | null
          stop_loss_percentage: number | null
          strategy_instance_id: string | null
          strategy_type: string | null
          take_profit_percentage: number | null
          total_capital: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_strategy_instance_id?: string | null
          allow_long_trades?: boolean | null
          allow_short_trades?: boolean | null
          allowed_directions?: string[] | null
          allowed_signal_sources?: string[] | null
          auto_leverage?: boolean | null
          auto_trading_enabled?: boolean | null
          auto_trading_mode?: string | null
          auto_trading_notes?: string | null
          bot_name?: string | null
          created_at?: string | null
          dca_levels?: number | null
          default_platform?: string | null
          default_trade_direction?: string | null
          error_message?: string | null
          id?: string
          initial_order_percentage?: number | null
          is_active?: boolean | null
          last_started_at?: string | null
          last_stopped_at?: string | null
          leverage?: number | null
          leverage_strategy?: string | null
          market_type?: string | null
          max_active_trades?: number | null
          max_auto_trades_per_day?: number | null
          max_concurrent_auto_positions?: number | null
          max_leverage_increase?: number | null
          min_signal_confidence?: number | null
          order_type?: string | null
          profit_taking_strategy?: string | null
          risk_percentage?: number | null
          risk_reward_ratio?: number | null
          signal_source?: string
          status?: string
          stop_loss_calculation_method?: string | null
          stop_loss_percentage?: number | null
          strategy_instance_id?: string | null
          strategy_type?: string | null
          take_profit_percentage?: number | null
          total_capital?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_strategy_instance_id?: string | null
          allow_long_trades?: boolean | null
          allow_short_trades?: boolean | null
          allowed_directions?: string[] | null
          allowed_signal_sources?: string[] | null
          auto_leverage?: boolean | null
          auto_trading_enabled?: boolean | null
          auto_trading_mode?: string | null
          auto_trading_notes?: string | null
          bot_name?: string | null
          created_at?: string | null
          dca_levels?: number | null
          default_platform?: string | null
          default_trade_direction?: string | null
          error_message?: string | null
          id?: string
          initial_order_percentage?: number | null
          is_active?: boolean | null
          last_started_at?: string | null
          last_stopped_at?: string | null
          leverage?: number | null
          leverage_strategy?: string | null
          market_type?: string | null
          max_active_trades?: number | null
          max_auto_trades_per_day?: number | null
          max_concurrent_auto_positions?: number | null
          max_leverage_increase?: number | null
          min_signal_confidence?: number | null
          order_type?: string | null
          profit_taking_strategy?: string | null
          risk_percentage?: number | null
          risk_reward_ratio?: number | null
          signal_source?: string
          status?: string
          stop_loss_calculation_method?: string | null
          stop_loss_percentage?: number | null
          strategy_instance_id?: string | null
          strategy_type?: string | null
          take_profit_percentage?: number | null
          total_capital?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_settings_strategy_instance_id_fkey"
            columns: ["strategy_instance_id"]
            isOneToOne: false
            referencedRelation: "strategy_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_signal_executions: {
        Row: {
          bot_id: string | null
          confidence: number | null
          created_at: string
          entry_price: number | null
          error_message: string | null
          execution_reason: string | null
          execution_status: string
          id: string
          risk_flags: string[] | null
          side: string
          signal_id: string
          signal_source: string
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          timeframe: string
          trade_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_id?: string | null
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          error_message?: string | null
          execution_reason?: string | null
          execution_status: string
          id?: string
          risk_flags?: string[] | null
          side: string
          signal_id: string
          signal_source: string
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          timeframe: string
          trade_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_id?: string | null
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          error_message?: string | null
          execution_reason?: string | null
          execution_status?: string
          id?: string
          risk_flags?: string[] | null
          side?: string
          signal_id?: string
          signal_source?: string
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          trade_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_signal_executions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_settings"
            referencedColumns: ["user_id"]
          },
        ]
      }
      canned_responses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          id: string
          message_text: string
          title: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          message_text: string
          title: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          message_text?: string
          title?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      community_signal_votes: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          user_id: string
          vote: number
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          user_id: string
          vote: number
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          user_id?: string
          vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_signal_votes_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "community_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      community_signals: {
        Row: {
          ai_assisted: boolean
          ai_verification: Json | null
          analysis_text: string | null
          attachments: Json | null
          closed_at: string | null
          confidence: number | null
          created_at: string
          downvotes: number | null
          entry_price: number | null
          id: string
          metadata: Json | null
          pnl_percentage: number | null
          result: string | null
          side: string
          source: string
          status: string
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          timeframe: string
          total_votes: number | null
          updated_at: string
          upvotes: number | null
          user_id: string
          views: number | null
        }
        Insert: {
          ai_assisted?: boolean
          ai_verification?: Json | null
          analysis_text?: string | null
          attachments?: Json | null
          closed_at?: string | null
          confidence?: number | null
          created_at?: string
          downvotes?: number | null
          entry_price?: number | null
          id?: string
          metadata?: Json | null
          pnl_percentage?: number | null
          result?: string | null
          side: string
          source?: string
          status?: string
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          timeframe: string
          total_votes?: number | null
          updated_at?: string
          upvotes?: number | null
          user_id: string
          views?: number | null
        }
        Update: {
          ai_assisted?: boolean
          ai_verification?: Json | null
          analysis_text?: string | null
          attachments?: Json | null
          closed_at?: string | null
          confidence?: number | null
          created_at?: string
          downvotes?: number | null
          entry_price?: number | null
          id?: string
          metadata?: Json | null
          pnl_percentage?: number | null
          result?: string | null
          side?: string
          source?: string
          status?: string
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          total_votes?: number | null
          updated_at?: string
          upvotes?: number | null
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      community_trader_stats: {
        Row: {
          avg_return: number | null
          breakeven_count: number | null
          closed_signals: number | null
          created_at: string
          followers_count: number | null
          following_count: number | null
          influencer_level: string | null
          loss_count: number | null
          lp_points: number | null
          metadata: Json | null
          rank: string | null
          reputation_score: number | null
          total_return: number | null
          total_signals: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
          weight: number | null
          win_count: number | null
          win_rate: number | null
        }
        Insert: {
          avg_return?: number | null
          breakeven_count?: number | null
          closed_signals?: number | null
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          influencer_level?: string | null
          loss_count?: number | null
          lp_points?: number | null
          metadata?: Json | null
          rank?: string | null
          reputation_score?: number | null
          total_return?: number | null
          total_signals?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          weight?: number | null
          win_count?: number | null
          win_rate?: number | null
        }
        Update: {
          avg_return?: number | null
          breakeven_count?: number | null
          closed_signals?: number | null
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          influencer_level?: string | null
          loss_count?: number | null
          lp_points?: number | null
          metadata?: Json | null
          rank?: string | null
          reputation_score?: number | null
          total_return?: number | null
          total_signals?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          weight?: number | null
          win_count?: number | null
          win_rate?: number | null
        }
        Relationships: []
      }
      configuration_change_logs: {
        Row: {
          admin_id: string
          auto_revert_at: string | null
          config_key: string
          confirmed_at: string | null
          cooldown_until: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          requires_confirmation: boolean | null
          reverted: boolean | null
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          auto_revert_at?: string | null
          config_key: string
          confirmed_at?: string | null
          cooldown_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          requires_confirmation?: boolean | null
          reverted?: boolean | null
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          auto_revert_at?: string | null
          config_key?: string
          confirmed_at?: string | null
          cooldown_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          requires_confirmation?: boolean | null
          reverted?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      connection_status: {
        Row: {
          api_key_id: string
          created_at: string
          error_message: string | null
          id: string
          last_checked: string
          response_time_ms: number | null
          status: string
          user_id: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_checked?: string
          response_time_ms?: number | null
          status?: string
          user_id: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_checked?: string
          response_time_ms?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_status_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: true
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_fee_settlements: {
        Row: {
          created_at: string
          fee_amount: number
          fee_model: string
          follower_user_id: string
          gross_profit: number | null
          id: string
          master_user_id: string
          period: string
          settled_at: string | null
          status: string
          strategy_id: string
        }
        Insert: {
          created_at?: string
          fee_amount: number
          fee_model: string
          follower_user_id: string
          gross_profit?: number | null
          id?: string
          master_user_id: string
          period: string
          settled_at?: string | null
          status?: string
          strategy_id: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          fee_model?: string
          follower_user_id?: string
          gross_profit?: number | null
          id?: string
          master_user_id?: string
          period?: string
          settled_at?: string | null
          status?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_fee_settlements_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "copy_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_followers: {
        Row: {
          allocation_mode: string
          allocation_value: number
          created_at: string
          follower_user_id: string
          id: string
          max_daily_loss: number | null
          max_leverage: number | null
          max_open_trades: number | null
          max_total_loss: number | null
          risk_multiplier: number | null
          start_copy_at: string
          status: string
          stop_copy_at: string | null
          strategy_id: string
          updated_at: string
        }
        Insert: {
          allocation_mode?: string
          allocation_value: number
          created_at?: string
          follower_user_id: string
          id?: string
          max_daily_loss?: number | null
          max_leverage?: number | null
          max_open_trades?: number | null
          max_total_loss?: number | null
          risk_multiplier?: number | null
          start_copy_at?: string
          status?: string
          stop_copy_at?: string | null
          strategy_id: string
          updated_at?: string
        }
        Update: {
          allocation_mode?: string
          allocation_value?: number
          created_at?: string
          follower_user_id?: string
          id?: string
          max_daily_loss?: number | null
          max_leverage?: number | null
          max_open_trades?: number | null
          max_total_loss?: number | null
          risk_multiplier?: number | null
          start_copy_at?: string
          status?: string
          stop_copy_at?: string | null
          strategy_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_followers_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "copy_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_strategies: {
        Row: {
          avg_rating: number | null
          bot_id: string | null
          created_at: string
          description: string | null
          fee_model: string | null
          id: string
          is_public: boolean
          min_deposit: number | null
          monthly_fee: number | null
          name: string
          owner_user_id: string
          performance_window: string | null
          profit_share_percent: number | null
          risk_label: string | null
          status: string
          strategy_type: string
          total_ratings: number | null
          updated_at: string
        }
        Insert: {
          avg_rating?: number | null
          bot_id?: string | null
          created_at?: string
          description?: string | null
          fee_model?: string | null
          id?: string
          is_public?: boolean
          min_deposit?: number | null
          monthly_fee?: number | null
          name: string
          owner_user_id: string
          performance_window?: string | null
          profit_share_percent?: number | null
          risk_label?: string | null
          status?: string
          strategy_type: string
          total_ratings?: number | null
          updated_at?: string
        }
        Update: {
          avg_rating?: number | null
          bot_id?: string | null
          created_at?: string
          description?: string | null
          fee_model?: string | null
          id?: string
          is_public?: boolean
          min_deposit?: number | null
          monthly_fee?: number | null
          name?: string
          owner_user_id?: string
          performance_window?: string | null
          profit_share_percent?: number | null
          risk_label?: string | null
          status?: string
          strategy_type?: string
          total_ratings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_strategies_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_strategy_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_edited: boolean
          parent_comment_id: string | null
          strategy_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_comment_id?: string | null
          strategy_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_comment_id?: string | null
          strategy_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_strategy_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "copy_strategy_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_strategy_comments_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "copy_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_strategy_favorites: {
        Row: {
          created_at: string
          id: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          strategy_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_strategy_favorites_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "copy_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_strategy_performance: {
        Row: {
          avg_return: number | null
          last_30d_return: number | null
          last_7d_return: number | null
          max_drawdown: number | null
          strategy_id: string
          total_copiers: number | null
          total_trades: number | null
          total_volume: number | null
          updated_at: string
          win_rate: number | null
        }
        Insert: {
          avg_return?: number | null
          last_30d_return?: number | null
          last_7d_return?: number | null
          max_drawdown?: number | null
          strategy_id: string
          total_copiers?: number | null
          total_trades?: number | null
          total_volume?: number | null
          updated_at?: string
          win_rate?: number | null
        }
        Update: {
          avg_return?: number | null
          last_30d_return?: number | null
          last_7d_return?: number | null
          max_drawdown?: number | null
          strategy_id?: string
          total_copiers?: number | null
          total_trades?: number | null
          total_volume?: number | null
          updated_at?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "copy_strategy_performance_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: true
            referencedRelation: "copy_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_strategy_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          review: string | null
          strategy_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          strategy_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          strategy_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_strategy_ratings_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "copy_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_trades_log: {
        Row: {
          closed_at: string | null
          created_at: string
          fail_reason: string | null
          follower_allocation_after: number | null
          follower_allocation_before: number | null
          follower_position_size: number
          follower_user_id: string
          id: string
          leverage: number | null
          market_type: string
          master_position_size: number
          master_signal_execution_id: string | null
          master_trade_id: string | null
          master_user_id: string
          opened_at: string | null
          pnl_amount: number | null
          pnl_percentage: number | null
          side: string
          status: string
          strategy_id: string
          symbol: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          fail_reason?: string | null
          follower_allocation_after?: number | null
          follower_allocation_before?: number | null
          follower_position_size: number
          follower_user_id: string
          id?: string
          leverage?: number | null
          market_type: string
          master_position_size: number
          master_signal_execution_id?: string | null
          master_trade_id?: string | null
          master_user_id: string
          opened_at?: string | null
          pnl_amount?: number | null
          pnl_percentage?: number | null
          side: string
          status: string
          strategy_id: string
          symbol: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          fail_reason?: string | null
          follower_allocation_after?: number | null
          follower_allocation_before?: number | null
          follower_position_size?: number
          follower_user_id?: string
          id?: string
          leverage?: number | null
          market_type?: string
          master_position_size?: number
          master_signal_execution_id?: string | null
          master_trade_id?: string | null
          master_user_id?: string
          opened_at?: string | null
          pnl_amount?: number | null
          pnl_percentage?: number | null
          side?: string
          status?: string
          strategy_id?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_trades_log_master_signal_execution_id_fkey"
            columns: ["master_signal_execution_id"]
            isOneToOne: false
            referencedRelation: "bot_signal_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_trades_log_master_trade_id_fkey"
            columns: ["master_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_trades_log_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "copy_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_trading_alerts: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean
          message: string
          metadata: Json | null
          resolved_at: string | null
          severity: string
          strategy_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          severity: string
          strategy_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          strategy_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copy_trading_alerts_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "copy_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_trading_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cpu_units: {
        Row: {
          affiliate_id: string
          allocation_period: string
          claimed_at: string | null
          created_at: string
          estimated_value_usd: number | null
          id: string
          metadata: Json | null
          profit_pool_usd: number
          status: string
          total_weight_pool: number
          units: number
          vesting_schedule: Json | null
          weight_at_allocation: number
        }
        Insert: {
          affiliate_id: string
          allocation_period: string
          claimed_at?: string | null
          created_at?: string
          estimated_value_usd?: number | null
          id?: string
          metadata?: Json | null
          profit_pool_usd: number
          status?: string
          total_weight_pool: number
          units: number
          vesting_schedule?: Json | null
          weight_at_allocation: number
        }
        Update: {
          affiliate_id?: string
          allocation_period?: string
          claimed_at?: string | null
          created_at?: string
          estimated_value_usd?: number | null
          id?: string
          metadata?: Json | null
          profit_pool_usd?: number
          status?: string
          total_weight_pool?: number
          units?: number
          vesting_schedule?: Json | null
          weight_at_allocation?: number
        }
        Relationships: [
          {
            foreignKeyName: "cpu_units_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_loss_snapshots: {
        Row: {
          active_trades_count: number
          closed_trades_count: number
          created_at: string
          current_equity: number
          daily_pnl: number
          daily_pnl_percentage: number
          date: string
          id: string
          max_daily_loss_percentage: number | null
          max_daily_loss_usd: number | null
          peak_equity: number
          realized_pnl: number
          starting_equity: number
          trades_count: number
          unrealized_pnl: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_trades_count?: number
          closed_trades_count?: number
          created_at?: string
          current_equity: number
          daily_pnl?: number
          daily_pnl_percentage?: number
          date: string
          id?: string
          max_daily_loss_percentage?: number | null
          max_daily_loss_usd?: number | null
          peak_equity: number
          realized_pnl?: number
          starting_equity: number
          trades_count?: number
          unrealized_pnl?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_trades_count?: number
          closed_trades_count?: number
          created_at?: string
          current_equity?: number
          daily_pnl?: number
          daily_pnl_percentage?: number
          date?: string
          id?: string
          max_daily_loss_percentage?: number | null
          max_daily_loss_usd?: number | null
          peak_equity?: number
          realized_pnl?: number
          starting_equity?: number
          trades_count?: number
          unrealized_pnl?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_revenue_metrics: {
        Row: {
          arpu: number
          arr: number
          churned_revenue: number
          created_at: string | null
          date: string
          id: string
          ltv: number
          mrr: number
          new_revenue: number
          revenue_by_plan: Json | null
          updated_at: string | null
        }
        Insert: {
          arpu?: number
          arr?: number
          churned_revenue?: number
          created_at?: string | null
          date: string
          id?: string
          ltv?: number
          mrr?: number
          new_revenue?: number
          revenue_by_plan?: Json | null
          updated_at?: string | null
        }
        Update: {
          arpu?: number
          arr?: number
          churned_revenue?: number
          created_at?: string | null
          date?: string
          id?: string
          ltv?: number
          mrr?: number
          new_revenue?: number
          revenue_by_plan?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_user_metrics: {
        Row: {
          active_users_24h: number
          active_users_30d: number
          active_users_7d: number
          churn_rate: number | null
          conversion_rate_free_to_paid: number | null
          created_at: string | null
          date: string
          id: string
          new_users: number
          retention_rate_30d: number | null
          retention_rate_7d: number | null
          total_users: number
          updated_at: string | null
          users_by_plan: Json | null
        }
        Insert: {
          active_users_24h?: number
          active_users_30d?: number
          active_users_7d?: number
          churn_rate?: number | null
          conversion_rate_free_to_paid?: number | null
          created_at?: string | null
          date: string
          id?: string
          new_users?: number
          retention_rate_30d?: number | null
          retention_rate_7d?: number | null
          total_users?: number
          updated_at?: string | null
          users_by_plan?: Json | null
        }
        Update: {
          active_users_24h?: number
          active_users_30d?: number
          active_users_7d?: number
          churn_rate?: number | null
          conversion_rate_free_to_paid?: number | null
          created_at?: string | null
          date?: string
          id?: string
          new_users?: number
          retention_rate_30d?: number | null
          retention_rate_7d?: number | null
          total_users?: number
          updated_at?: string | null
          users_by_plan?: Json | null
        }
        Relationships: []
      }
      dca_orders: {
        Row: {
          amount: number
          created_at: string | null
          dca_level: number
          executed_at: string | null
          executed_price: number | null
          executed_quantity: number | null
          id: string
          platform_order_id: string | null
          quantity: number
          status: string | null
          target_price: number
          trade_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          dca_level: number
          executed_at?: string | null
          executed_price?: number | null
          executed_quantity?: number | null
          id?: string
          platform_order_id?: string | null
          quantity: number
          status?: string | null
          target_price: number
          trade_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          dca_level?: number
          executed_at?: string | null
          executed_price?: number | null
          executed_quantity?: number | null
          id?: string
          platform_order_id?: string | null
          quantity?: number
          status?: string | null
          target_price?: number
          trade_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dca_orders_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      dca_strategies: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          level_1_percentage: number | null
          level_2_percentage: number | null
          level_3_percentage: number | null
          level_4_percentage: number | null
          price_drop_level_1: number | null
          price_drop_level_2: number | null
          price_drop_level_3: number | null
          price_drop_level_4: number | null
          strategy_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          level_1_percentage?: number | null
          level_2_percentage?: number | null
          level_3_percentage?: number | null
          level_4_percentage?: number | null
          price_drop_level_1?: number | null
          price_drop_level_2?: number | null
          price_drop_level_3?: number | null
          price_drop_level_4?: number | null
          strategy_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          level_1_percentage?: number | null
          level_2_percentage?: number | null
          level_3_percentage?: number | null
          level_4_percentage?: number | null
          price_drop_level_1?: number | null
          price_drop_level_2?: number | null
          price_drop_level_3?: number | null
          price_drop_level_4?: number | null
          strategy_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      drawdown_snapshots: {
        Row: {
          created_at: string
          current_drawdown: number
          current_drawdown_percentage: number
          current_equity: number
          drawdown_duration_days: number
          id: string
          max_drawdown: number
          max_drawdown_percentage: number
          peak_date: string
          peak_equity: number
          recovery_needed: number
          recovery_percentage: number
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_drawdown?: number
          current_drawdown_percentage?: number
          current_equity: number
          drawdown_duration_days?: number
          id?: string
          max_drawdown?: number
          max_drawdown_percentage?: number
          peak_date: string
          peak_equity: number
          recovery_needed?: number
          recovery_percentage?: number
          timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_drawdown?: number
          current_drawdown_percentage?: number
          current_equity?: number
          drawdown_duration_days?: number
          id?: string
          max_drawdown?: number
          max_drawdown_percentage?: number
          peak_date?: string
          peak_equity?: number
          recovery_needed?: number
          recovery_percentage?: number
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      enhanced_signal_performance: {
        Row: {
          average_loss: number | null
          average_profit: number | null
          best_signal_profit: number | null
          by_strength: Json | null
          by_symbol: Json | null
          by_timeframe: Json | null
          created_at: string | null
          date: string
          failed_signals: number | null
          id: string
          pending_signals: number | null
          successful_signals: number | null
          total_profit_loss: number | null
          total_signals: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
          worst_signal_loss: number | null
        }
        Insert: {
          average_loss?: number | null
          average_profit?: number | null
          best_signal_profit?: number | null
          by_strength?: Json | null
          by_symbol?: Json | null
          by_timeframe?: Json | null
          created_at?: string | null
          date?: string
          failed_signals?: number | null
          id?: string
          pending_signals?: number | null
          successful_signals?: number | null
          total_profit_loss?: number | null
          total_signals?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
          worst_signal_loss?: number | null
        }
        Update: {
          average_loss?: number | null
          average_profit?: number | null
          best_signal_profit?: number | null
          by_strength?: Json | null
          by_symbol?: Json | null
          by_timeframe?: Json | null
          created_at?: string | null
          date?: string
          failed_signals?: number | null
          id?: string
          pending_signals?: number | null
          successful_signals?: number | null
          total_profit_loss?: number | null
          total_signals?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
          worst_signal_loss?: number | null
        }
        Relationships: []
      }
      enhanced_trading_signals: {
        Row: {
          confidence_score: number
          confirmations: string[] | null
          created_at: string
          entry_price: number
          expires_at: string | null
          id: string
          market_sentiment: Json | null
          price_source: string
          price_timestamp: string | null
          price_verified: boolean | null
          profit_loss_percentage: number | null
          result: string | null
          risk_reward_ratio: number | null
          signal_strength: string
          signal_type: string
          status: string
          stop_loss_price: number | null
          symbol: string
          take_profit_price: number | null
          technical_analysis: Json | null
          timeframe: string
          triggered_at: string | null
          updated_at: string
          user_id: string
          volume_analysis: Json | null
        }
        Insert: {
          confidence_score?: number
          confirmations?: string[] | null
          created_at?: string
          entry_price: number
          expires_at?: string | null
          id?: string
          market_sentiment?: Json | null
          price_source?: string
          price_timestamp?: string | null
          price_verified?: boolean | null
          profit_loss_percentage?: number | null
          result?: string | null
          risk_reward_ratio?: number | null
          signal_strength?: string
          signal_type: string
          status?: string
          stop_loss_price?: number | null
          symbol: string
          take_profit_price?: number | null
          technical_analysis?: Json | null
          timeframe?: string
          triggered_at?: string | null
          updated_at?: string
          user_id: string
          volume_analysis?: Json | null
        }
        Update: {
          confidence_score?: number
          confirmations?: string[] | null
          created_at?: string
          entry_price?: number
          expires_at?: string | null
          id?: string
          market_sentiment?: Json | null
          price_source?: string
          price_timestamp?: string | null
          price_verified?: boolean | null
          profit_loss_percentage?: number | null
          result?: string | null
          risk_reward_ratio?: number | null
          signal_strength?: string
          signal_type?: string
          status?: string
          stop_loss_price?: number | null
          symbol?: string
          take_profit_price?: number | null
          technical_analysis?: Json | null
          timeframe?: string
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
          volume_analysis?: Json | null
        }
        Relationships: []
      }
      exposure_snapshots: {
        Row: {
          active_trades_count: number
          created_at: string
          current_equity: number
          futures_exposure: number
          id: string
          spot_exposure: number
          symbol_exposures: Json
          timestamp: string
          total_exposure: number
          total_exposure_percentage: number
          user_id: string
        }
        Insert: {
          active_trades_count?: number
          created_at?: string
          current_equity: number
          futures_exposure?: number
          id?: string
          spot_exposure?: number
          symbol_exposures?: Json
          timestamp?: string
          total_exposure?: number
          total_exposure_percentage?: number
          user_id: string
        }
        Update: {
          active_trades_count?: number
          created_at?: string
          current_equity?: number
          futures_exposure?: number
          id?: string
          spot_exposure?: number
          symbol_exposures?: Json
          timestamp?: string
          total_exposure?: number
          total_exposure_percentage?: number
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_usage_daily: {
        Row: {
          created_at: string | null
          date: string
          feature_key: string
          id: string
          total_usage_count: number
          unique_users_count: number
          updated_at: string | null
          usage_by_plan: Json | null
        }
        Insert: {
          created_at?: string | null
          date: string
          feature_key: string
          id?: string
          total_usage_count?: number
          unique_users_count?: number
          updated_at?: string | null
          usage_by_plan?: Json | null
        }
        Update: {
          created_at?: string | null
          date?: string
          feature_key?: string
          id?: string
          total_usage_count?: number
          unique_users_count?: number
          updated_at?: string | null
          usage_by_plan?: Json | null
        }
        Relationships: []
      }
      feature_usage_logs: {
        Row: {
          created_at: string | null
          feature_key: string
          id: string
          last_used_at: string | null
          updated_at: string | null
          usage_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature_key: string
          id?: string
          last_used_at?: string | null
          updated_at?: string | null
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature_key?: string
          id?: string
          last_used_at?: string | null
          updated_at?: string | null
          usage_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      funding_rates: {
        Row: {
          created_at: string
          exchange: string
          funding_rate: number
          id: string
          mark_price: number | null
          metadata: Json | null
          next_funding_time: string | null
          open_interest: number | null
          symbol: string
        }
        Insert: {
          created_at?: string
          exchange: string
          funding_rate: number
          id?: string
          mark_price?: number | null
          metadata?: Json | null
          next_funding_time?: string | null
          open_interest?: number | null
          symbol: string
        }
        Update: {
          created_at?: string
          exchange?: string
          funding_rate?: number
          id?: string
          mark_price?: number | null
          metadata?: Json | null
          next_funding_time?: string | null
          open_interest?: number | null
          symbol?: string
        }
        Relationships: []
      }
      kill_switch_states: {
        Row: {
          can_reset: boolean
          cooldown_minutes: number
          created_at: string
          exchange: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string
          reset_at: string | null
          reset_by: string | null
          symbol: string | null
          triggered_at: string
          triggered_by: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          can_reset?: boolean
          cooldown_minutes?: number
          created_at?: string
          exchange: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason: string
          reset_at?: string | null
          reset_by?: string | null
          symbol?: string | null
          triggered_at?: string
          triggered_by: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          can_reset?: boolean
          cooldown_minutes?: number
          created_at?: string
          exchange?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string
          reset_at?: string | null
          reset_by?: string | null
          symbol?: string | null
          triggered_at?: string
          triggered_by?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          active_referrals: number
          affiliate_id: string
          created_at: string
          id: string
          influence_weight: number
          metadata: Json | null
          period: string
          period_type: string
          rank: number
          rewards: Json | null
          total_earnings_usd: number
          total_referrals: number
        }
        Insert: {
          active_referrals: number
          affiliate_id: string
          created_at?: string
          id?: string
          influence_weight: number
          metadata?: Json | null
          period: string
          period_type?: string
          rank: number
          rewards?: Json | null
          total_earnings_usd: number
          total_referrals: number
        }
        Update: {
          active_referrals?: number
          affiliate_id?: string
          created_at?: string
          id?: string
          influence_weight?: number
          metadata?: Json | null
          period?: string
          period_type?: string
          rank?: number
          rewards?: Json | null
          total_earnings_usd?: number
          total_referrals?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          action: string
          category: string
          context: Json | null
          created_at: string
          exchange: string | null
          id: string
          ip_address: string | null
          level: string
          market_type: string | null
          message: string
          position_id: string | null
          signal_id: string | null
          source: string | null
          symbol: string | null
          trade_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          category: string
          context?: Json | null
          created_at?: string
          exchange?: string | null
          id?: string
          ip_address?: string | null
          level: string
          market_type?: string | null
          message: string
          position_id?: string | null
          signal_id?: string | null
          source?: string | null
          symbol?: string | null
          trade_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string
          context?: Json | null
          created_at?: string
          exchange?: string | null
          id?: string
          ip_address?: string | null
          level?: string
          market_type?: string | null
          message?: string
          position_id?: string | null
          signal_id?: string | null
          source?: string | null
          symbol?: string | null
          trade_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "tradingview_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      lp_redemptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          item_details: Json | null
          item_id: string | null
          lp_cost: number
          metadata: Json | null
          redeemed_at: string | null
          redemption_type: string
          status: string
          user_id: string
          value_usd: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_details?: Json | null
          item_id?: string | null
          lp_cost: number
          metadata?: Json | null
          redeemed_at?: string | null
          redemption_type: string
          status?: string
          user_id: string
          value_usd?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_details?: Json | null
          item_id?: string | null
          lp_cost?: number
          metadata?: Json | null
          redeemed_at?: string | null
          redemption_type?: string
          status?: string
          user_id?: string
          value_usd?: number | null
        }
        Relationships: []
      }
      lp_transactions: {
        Row: {
          affiliate_id: string | null
          balance_after: number
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          lp_amount: number
          metadata: Json | null
          source: string
          source_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          affiliate_id?: string | null
          balance_after: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          lp_amount: number
          metadata?: Json | null
          source: string
          source_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          affiliate_id?: string | null
          balance_after?: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          lp_amount?: number
          metadata?: Json | null
          source?: string
          source_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lp_transactions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      market_analysis: {
        Row: {
          analysis_time: string | null
          confidence_score: number | null
          created_at: string | null
          ema_20: number | null
          ema_50: number | null
          id: string
          macd: number | null
          recommendation: string | null
          resistance_level: number | null
          rsi: number | null
          support_level: number | null
          symbol: string
          timeframe: string
          trend: string
        }
        Insert: {
          analysis_time?: string | null
          confidence_score?: number | null
          created_at?: string | null
          ema_20?: number | null
          ema_50?: number | null
          id?: string
          macd?: number | null
          recommendation?: string | null
          resistance_level?: number | null
          rsi?: number | null
          support_level?: number | null
          symbol: string
          timeframe: string
          trend: string
        }
        Update: {
          analysis_time?: string | null
          confidence_score?: number | null
          created_at?: string | null
          ema_20?: number | null
          ema_50?: number | null
          id?: string
          macd?: number | null
          recommendation?: string | null
          resistance_level?: number | null
          rsi?: number | null
          support_level?: number | null
          symbol?: string
          timeframe?: string
          trend?: string
        }
        Relationships: []
      }
      market_heatmap_metrics: {
        Row: {
          activity_score: number | null
          created_at: string
          heat_label: string | null
          id: string
          metadata: Json | null
          price_change_24h: number | null
          symbol: string
          timeframe: string
          trend_score: number | null
          volatility_score: number | null
          volume_24h: number | null
        }
        Insert: {
          activity_score?: number | null
          created_at?: string
          heat_label?: string | null
          id?: string
          metadata?: Json | null
          price_change_24h?: number | null
          symbol: string
          timeframe: string
          trend_score?: number | null
          volatility_score?: number | null
          volume_24h?: number | null
        }
        Update: {
          activity_score?: number | null
          created_at?: string
          heat_label?: string | null
          id?: string
          metadata?: Json | null
          price_change_24h?: number | null
          symbol?: string
          timeframe?: string
          trend_score?: number | null
          volatility_score?: number | null
          volume_24h?: number | null
        }
        Relationships: []
      }
      market_sentiment_snapshots: {
        Row: {
          created_at: string
          id: string
          label: string | null
          metadata: Json | null
          source: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          metadata?: Json | null
          source: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          metadata?: Json | null
          source?: string
          value?: number
        }
        Relationships: []
      }
      mission_logs: {
        Row: {
          affiliate_id: string
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          mission_id: string
          progress: Json | null
          rewards_claimed: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          mission_id: string
          progress?: Json | null
          rewards_claimed?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          mission_id?: string
          progress?: Json | null
          rewards_claimed?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_logs_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_logs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          id: string
          is_active: boolean
          max_completions: number | null
          metadata: Json | null
          mission_type: string
          requirements: Json
          rewards: Json
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          metadata?: Json | null
          mission_type: string
          requirements: Json
          rewards: Json
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          metadata?: Json | null
          mission_type?: string
          requirements?: Json
          rewards?: Json
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          trade_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          trade_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          trade_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_data: Json | null
          event_status: string
          event_type: string
          filled_quantity_at_event: number | null
          id: string
          message: string | null
          new_status: string | null
          position_id: string | null
          previous_status: string | null
          price_at_event: number | null
          quantity_at_event: number | null
          source: string | null
          trade_id: string | null
          trade_order_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_status: string
          event_type: string
          filled_quantity_at_event?: number | null
          id?: string
          message?: string | null
          new_status?: string | null
          position_id?: string | null
          previous_status?: string | null
          price_at_event?: number | null
          quantity_at_event?: number | null
          source?: string | null
          trade_id?: string | null
          trade_order_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_status?: string
          event_type?: string
          filled_quantity_at_event?: number | null
          id?: string
          message?: string | null
          new_status?: string | null
          position_id?: string | null
          previous_status?: string | null
          price_at_event?: number | null
          quantity_at_event?: number | null
          source?: string | null
          trade_id?: string | null
          trade_order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_trade_order_id_fkey"
            columns: ["trade_order_id"]
            isOneToOne: false
            referencedRelation: "trade_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          payment_id: string
          provider_status: string | null
          raw_payload: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          payment_id: string
          provider_status?: string | null
          raw_payload?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          payment_id?: string
          provider_status?: string | null
          raw_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_gateway: string | null
          payment_method: string
          payment_reference: string | null
          payment_status: string
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method: string
          payment_reference?: string | null
          payment_status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string
          payment_reference?: string | null
          payment_status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_plans"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_usd: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          pay_address: string | null
          pay_amount: number | null
          payment_method: string
          payment_url: string | null
          plan_code: string
          provider: string
          provider_payment_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd: number
          completed_at?: string | null
          created_at?: string
          currency: string
          id?: string
          metadata?: Json | null
          pay_address?: string | null
          pay_amount?: number | null
          payment_method?: string
          payment_url?: string | null
          plan_code: string
          provider?: string
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_usd?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          pay_address?: string | null
          pay_amount?: number | null
          payment_method?: string
          payment_url?: string | null
          plan_code?: string
          provider?: string
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_history: {
        Row: {
          created_at: string
          daily_pnl: number
          daily_pnl_pct: number | null
          date: string
          end_equity: number
          id: string
          losing_trades: number
          metadata: Json | null
          profit_factor: number | null
          sharpe_ratio: number | null
          start_equity: number
          trades_count: number
          user_id: string
          win_rate: number | null
          winning_trades: number
        }
        Insert: {
          created_at?: string
          daily_pnl?: number
          daily_pnl_pct?: number | null
          date?: string
          end_equity?: number
          id?: string
          losing_trades?: number
          metadata?: Json | null
          profit_factor?: number | null
          sharpe_ratio?: number | null
          start_equity?: number
          trades_count?: number
          user_id: string
          win_rate?: number | null
          winning_trades?: number
        }
        Update: {
          created_at?: string
          daily_pnl?: number
          daily_pnl_pct?: number | null
          date?: string
          end_equity?: number
          id?: string
          losing_trades?: number
          metadata?: Json | null
          profit_factor?: number | null
          sharpe_ratio?: number | null
          start_equity?: number
          trades_count?: number
          user_id?: string
          win_rate?: number | null
          winning_trades?: number
        }
        Relationships: []
      }
      plans: {
        Row: {
          billing_period: string
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price_usd: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_period?: string
          code: string
          created_at?: string
          features: Json
          id?: string
          is_active?: boolean
          limits: Json
          name: string
          price_usd: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price_usd?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_sync_status: {
        Row: {
          created_at: string | null
          exchange: string
          id: string
          last_error: string | null
          last_orders_sync_at: string | null
          last_portfolio_sync_at: string | null
          last_positions_sync_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exchange: string
          id?: string
          last_error?: string | null
          last_orders_sync_at?: string | null
          last_portfolio_sync_at?: string | null
          last_positions_sync_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exchange?: string
          id?: string
          last_error?: string | null
          last_orders_sync_at?: string | null
          last_portfolio_sync_at?: string | null
          last_positions_sync_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portfolio_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_level: string
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          sent_to_telegram: boolean | null
          severity: string
          telegram_sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_level?: string
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          sent_to_telegram?: boolean | null
          severity: string
          telegram_sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_level?: string
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          sent_to_telegram?: boolean | null
          severity?: string
          telegram_sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_balances: {
        Row: {
          api_key_id: string
          created_at: string
          free_balance: number
          id: string
          last_updated: string
          locked_balance: number
          market_type: string | null
          platform: string | null
          symbol: string
          total_balance: number
          usd_value: number | null
          user_id: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          free_balance?: number
          id?: string
          last_updated?: string
          locked_balance?: number
          market_type?: string | null
          platform?: string | null
          symbol: string
          total_balance?: number
          usd_value?: number | null
          user_id: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          free_balance?: number
          id?: string
          last_updated?: string
          locked_balance?: number
          market_type?: string | null
          platform?: string | null
          symbol?: string
          total_balance?: number
          usd_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_balances_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_forecasts: {
        Row: {
          best_asset: string | null
          confidence_score: number | null
          created_at: string
          expected_growth: number | null
          forecast_details: Json | null
          forecast_period: string
          id: string
          metadata: Json | null
          momentum_direction: string | null
          risk_adjusted_growth: number | null
          snapshot_id: string | null
          user_id: string
          worst_asset: string | null
        }
        Insert: {
          best_asset?: string | null
          confidence_score?: number | null
          created_at?: string
          expected_growth?: number | null
          forecast_details?: Json | null
          forecast_period: string
          id?: string
          metadata?: Json | null
          momentum_direction?: string | null
          risk_adjusted_growth?: number | null
          snapshot_id?: string | null
          user_id: string
          worst_asset?: string | null
        }
        Update: {
          best_asset?: string | null
          confidence_score?: number | null
          created_at?: string
          expected_growth?: number | null
          forecast_details?: Json | null
          forecast_period?: string
          id?: string
          metadata?: Json | null
          momentum_direction?: string | null
          risk_adjusted_growth?: number | null
          snapshot_id?: string | null
          user_id?: string
          worst_asset?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_forecasts_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "portfolio_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_history: {
        Row: {
          active_positions_count: number
          closed_positions_count: number
          created_at: string
          current_drawdown: number | null
          current_drawdown_pct: number | null
          daily_pnl: number | null
          futures_exposure: number
          id: string
          kill_switch_active: boolean | null
          max_drawdown: number | null
          max_drawdown_pct: number | null
          metadata: Json | null
          monthly_pnl: number | null
          peak_equity: number | null
          risk_level: string | null
          spot_exposure: number
          symbol_exposures: Json | null
          timestamp: string
          total_equity: number
          total_exposure: number
          total_invested: number
          total_realized_pnl: number
          total_unrealized_pnl: number
          user_id: string
          weekly_pnl: number | null
        }
        Insert: {
          active_positions_count?: number
          closed_positions_count?: number
          created_at?: string
          current_drawdown?: number | null
          current_drawdown_pct?: number | null
          daily_pnl?: number | null
          futures_exposure?: number
          id?: string
          kill_switch_active?: boolean | null
          max_drawdown?: number | null
          max_drawdown_pct?: number | null
          metadata?: Json | null
          monthly_pnl?: number | null
          peak_equity?: number | null
          risk_level?: string | null
          spot_exposure?: number
          symbol_exposures?: Json | null
          timestamp?: string
          total_equity?: number
          total_exposure?: number
          total_invested?: number
          total_realized_pnl?: number
          total_unrealized_pnl?: number
          user_id: string
          weekly_pnl?: number | null
        }
        Update: {
          active_positions_count?: number
          closed_positions_count?: number
          created_at?: string
          current_drawdown?: number | null
          current_drawdown_pct?: number | null
          daily_pnl?: number | null
          futures_exposure?: number
          id?: string
          kill_switch_active?: boolean | null
          max_drawdown?: number | null
          max_drawdown_pct?: number | null
          metadata?: Json | null
          monthly_pnl?: number | null
          peak_equity?: number | null
          risk_level?: string | null
          spot_exposure?: number
          symbol_exposures?: Json | null
          timestamp?: string
          total_equity?: number
          total_exposure?: number
          total_invested?: number
          total_realized_pnl?: number
          total_unrealized_pnl?: number
          user_id?: string
          weekly_pnl?: number | null
        }
        Relationships: []
      }
      portfolio_recommendations: {
        Row: {
          applied_at: string | null
          created_at: string
          description: string | null
          details: Json | null
          id: string
          is_applied: boolean | null
          metadata: Json | null
          priority: string
          recommendation_type: string
          risk_score_id: string | null
          snapshot_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          is_applied?: boolean | null
          metadata?: Json | null
          priority?: string
          recommendation_type: string
          risk_score_id?: string | null
          snapshot_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          is_applied?: boolean | null
          metadata?: Json | null
          priority?: string
          recommendation_type?: string
          risk_score_id?: string | null
          snapshot_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_recommendations_risk_score_id_fkey"
            columns: ["risk_score_id"]
            isOneToOne: false
            referencedRelation: "portfolio_risk_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_recommendations_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "portfolio_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_risk_scores: {
        Row: {
          ai_comment: string | null
          created_at: string
          diversification_score: number | null
          exposure_risk: number | null
          funding_risk: number | null
          id: string
          leverage_risk: number | null
          liquidation_risk: number | null
          metadata: Json | null
          overall_score: number | null
          risk_factors: Json | null
          risk_level: string
          sentiment_risk: number | null
          snapshot_id: string | null
          user_id: string
          volatility_score: number | null
        }
        Insert: {
          ai_comment?: string | null
          created_at?: string
          diversification_score?: number | null
          exposure_risk?: number | null
          funding_risk?: number | null
          id?: string
          leverage_risk?: number | null
          liquidation_risk?: number | null
          metadata?: Json | null
          overall_score?: number | null
          risk_factors?: Json | null
          risk_level: string
          sentiment_risk?: number | null
          snapshot_id?: string | null
          user_id: string
          volatility_score?: number | null
        }
        Update: {
          ai_comment?: string | null
          created_at?: string
          diversification_score?: number | null
          exposure_risk?: number | null
          funding_risk?: number | null
          id?: string
          leverage_risk?: number | null
          liquidation_risk?: number | null
          metadata?: Json | null
          overall_score?: number | null
          risk_factors?: Json | null
          risk_level?: string
          sentiment_risk?: number | null
          snapshot_id?: string | null
          user_id?: string
          volatility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_risk_scores_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "portfolio_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_snapshots: {
        Row: {
          allocation: Json | null
          api_key_id: string | null
          created_at: string
          exposure: Json | null
          futures_equity: number
          id: string
          metadata: Json | null
          metrics: Json | null
          platform: string | null
          realized_pnl: number
          scope_type: string
          spot_equity: number
          timestamp: string
          total_equity: number
          unrealized_pnl: number
          user_id: string
        }
        Insert: {
          allocation?: Json | null
          api_key_id?: string | null
          created_at?: string
          exposure?: Json | null
          futures_equity?: number
          id?: string
          metadata?: Json | null
          metrics?: Json | null
          platform?: string | null
          realized_pnl?: number
          scope_type?: string
          spot_equity?: number
          timestamp?: string
          total_equity?: number
          unrealized_pnl?: number
          user_id: string
        }
        Update: {
          allocation?: Json | null
          api_key_id?: string | null
          created_at?: string
          exposure?: Json | null
          futures_equity?: number
          id?: string
          metadata?: Json | null
          metrics?: Json | null
          platform?: string | null
          realized_pnl?: number
          scope_type?: string
          spot_equity?: number
          timestamp?: string
          total_equity?: number
          unrealized_pnl?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_snapshots_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      position_snapshots: {
        Row: {
          average_entry_price: number
          created_at: string
          current_price: number
          id: string
          position_meta: Json | null
          position_quantity: number
          position_status: string | null
          realized_pnl: number | null
          risk_state: Json | null
          snapshot_at: string
          trade_id: string
          unrealized_pnl: number | null
          user_id: string
        }
        Insert: {
          average_entry_price: number
          created_at?: string
          current_price: number
          id?: string
          position_meta?: Json | null
          position_quantity: number
          position_status?: string | null
          realized_pnl?: number | null
          risk_state?: Json | null
          snapshot_at?: string
          trade_id: string
          unrealized_pnl?: number | null
          user_id: string
        }
        Update: {
          average_entry_price?: number
          created_at?: string
          current_price?: number
          id?: string
          position_meta?: Json | null
          position_quantity?: number
          position_status?: string | null
          realized_pnl?: number | null
          risk_state?: Json | null
          snapshot_at?: string
          trade_id?: string
          unrealized_pnl?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_snapshots_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      price_watchlist: {
        Row: {
          created_at: string
          display_order: number
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          telegram_id: string | null
          telegram_notifications: boolean | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          telegram_id?: string | null
          telegram_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          telegram_id?: string | null
          telegram_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      recovery_events: {
        Row: {
          action: string
          created_at: string
          error_before: string | null
          id: string
          logs: Json | null
          metadata: Json | null
          recovery_time_ms: number | null
          service_name: string
          status: string
          triggered_by: string | null
          triggered_by_user: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_before?: string | null
          id?: string
          logs?: Json | null
          metadata?: Json | null
          recovery_time_ms?: number | null
          service_name: string
          status: string
          triggered_by?: string | null
          triggered_by_user?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_before?: string | null
          id?: string
          logs?: Json | null
          metadata?: Json | null
          recovery_time_ms?: number | null
          service_name?: string
          status?: string
          triggered_by?: string | null
          triggered_by_user?: string | null
        }
        Relationships: []
      }
      risk_event_logs: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          severity: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      risk_snapshots: {
        Row: {
          active_trades_count: number
          alerts: string[]
          created_at: string
          current_drawdown_percentage: number
          daily_pnl: number
          daily_pnl_percentage: number
          equity: number
          id: string
          is_killed: boolean
          kill_switch_reason: string | null
          max_drawdown_percentage: number
          peak_equity: number
          risk_flags: string[]
          risk_level: string
          starting_equity: number
          symbol_exposures: Json
          timestamp: string
          total_exposure: number
          total_exposure_percentage: number
          user_id: string
          warnings: string[]
        }
        Insert: {
          active_trades_count?: number
          alerts?: string[]
          created_at?: string
          current_drawdown_percentage?: number
          daily_pnl?: number
          daily_pnl_percentage?: number
          equity: number
          id?: string
          is_killed?: boolean
          kill_switch_reason?: string | null
          max_drawdown_percentage?: number
          peak_equity: number
          risk_flags?: string[]
          risk_level?: string
          starting_equity: number
          symbol_exposures?: Json
          timestamp?: string
          total_exposure?: number
          total_exposure_percentage?: number
          user_id: string
          warnings?: string[]
        }
        Update: {
          active_trades_count?: number
          alerts?: string[]
          created_at?: string
          current_drawdown_percentage?: number
          daily_pnl?: number
          daily_pnl_percentage?: number
          equity?: number
          id?: string
          is_killed?: boolean
          kill_switch_reason?: string | null
          max_drawdown_percentage?: number
          peak_equity?: number
          risk_flags?: string[]
          risk_level?: string
          starting_equity?: number
          symbol_exposures?: Json
          timestamp?: string
          total_exposure?: number
          total_exposure_percentage?: number
          user_id?: string
          warnings?: string[]
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          permission_key: string
          role_id: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission_key: string
          role_id: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission_key?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          admin_id: string | null
          detected_at: string
          event_type: string
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          detected_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          detected_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      settings_backups: {
        Row: {
          api_settings: Json | null
          backup_name: string
          backup_type: string | null
          bot_settings: Json | null
          created_at: string | null
          id: string
          is_auto_backup: boolean | null
          strategies: Json | null
          user_id: string
        }
        Insert: {
          api_settings?: Json | null
          backup_name: string
          backup_type?: string | null
          bot_settings?: Json | null
          created_at?: string | null
          id?: string
          is_auto_backup?: boolean | null
          strategies?: Json | null
          user_id: string
        }
        Update: {
          api_settings?: Json | null
          backup_name?: string
          backup_type?: string | null
          bot_settings?: Json | null
          created_at?: string | null
          id?: string
          is_auto_backup?: boolean | null
          strategies?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      signal_forecasts: {
        Row: {
          created_at: string
          expected_holding_seconds: number | null
          expected_return_pct: number | null
          features_snapshot: Json | null
          forecast_label: string
          forecast_model_version: string
          id: string
          metadata: Json | null
          risk_adjusted_score: number | null
          side: string
          signal_id: string | null
          success_probability: number
          symbol: string
          timeframe: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expected_holding_seconds?: number | null
          expected_return_pct?: number | null
          features_snapshot?: Json | null
          forecast_label: string
          forecast_model_version?: string
          id?: string
          metadata?: Json | null
          risk_adjusted_score?: number | null
          side: string
          signal_id?: string | null
          success_probability: number
          symbol: string
          timeframe: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expected_holding_seconds?: number | null
          expected_return_pct?: number | null
          features_snapshot?: Json | null
          forecast_label?: string
          forecast_model_version?: string
          id?: string
          metadata?: Json | null
          risk_adjusted_score?: number | null
          side?: string
          signal_id?: string | null
          success_probability?: number
          symbol?: string
          timeframe?: string
          user_id?: string | null
        }
        Relationships: []
      }
      signal_outcomes: {
        Row: {
          ai_score: number | null
          created_at: string
          entered_at: string | null
          entry_price: number | null
          exit_price: number | null
          exited_at: string | null
          holding_duration_seconds: number | null
          id: string
          max_adverse_excursion: number | null
          max_favorable_excursion: number | null
          metadata: Json | null
          pattern_score: number | null
          profit_loss_percentage: number
          result_label: string
          risk_level: string | null
          sentiment_score: number | null
          side: string
          signal_id: string | null
          signal_source: string | null
          symbol: string
          technical_score: number | null
          timeframe: string
          user_id: string | null
          volume_score: number | null
          wave_score: number | null
        }
        Insert: {
          ai_score?: number | null
          created_at?: string
          entered_at?: string | null
          entry_price?: number | null
          exit_price?: number | null
          exited_at?: string | null
          holding_duration_seconds?: number | null
          id?: string
          max_adverse_excursion?: number | null
          max_favorable_excursion?: number | null
          metadata?: Json | null
          pattern_score?: number | null
          profit_loss_percentage: number
          result_label: string
          risk_level?: string | null
          sentiment_score?: number | null
          side: string
          signal_id?: string | null
          signal_source?: string | null
          symbol: string
          technical_score?: number | null
          timeframe: string
          user_id?: string | null
          volume_score?: number | null
          wave_score?: number | null
        }
        Update: {
          ai_score?: number | null
          created_at?: string
          entered_at?: string | null
          entry_price?: number | null
          exit_price?: number | null
          exited_at?: string | null
          holding_duration_seconds?: number | null
          id?: string
          max_adverse_excursion?: number | null
          max_favorable_excursion?: number | null
          metadata?: Json | null
          pattern_score?: number | null
          profit_loss_percentage?: number
          result_label?: string
          risk_level?: string | null
          sentiment_score?: number | null
          side?: string
          signal_id?: string | null
          signal_source?: string | null
          symbol?: string
          technical_score?: number | null
          timeframe?: string
          user_id?: string | null
          volume_score?: number | null
          wave_score?: number | null
        }
        Relationships: []
      }
      signal_settings: {
        Row: {
          cache_duration_minutes: number | null
          created_at: string | null
          enable_advanced_indicators: boolean | null
          enable_ai_analysis: boolean | null
          enable_sentiment_analysis: boolean | null
          id: string
          is_enabled: boolean | null
          min_confidence_score: number | null
          symbols: string[] | null
          timeframes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cache_duration_minutes?: number | null
          created_at?: string | null
          enable_advanced_indicators?: boolean | null
          enable_ai_analysis?: boolean | null
          enable_sentiment_analysis?: boolean | null
          id?: string
          is_enabled?: boolean | null
          min_confidence_score?: number | null
          symbols?: string[] | null
          timeframes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cache_duration_minutes?: number | null
          created_at?: string | null
          enable_advanced_indicators?: boolean | null
          enable_ai_analysis?: boolean | null
          enable_sentiment_analysis?: boolean | null
          id?: string
          is_enabled?: boolean | null
          min_confidence_score?: number | null
          symbols?: string[] | null
          timeframes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      strategy_instances: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_in_use: boolean
          last_used_at: string | null
          name: string
          parent_id: string | null
          performance_data: Json | null
          status: string
          template_id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          config: Json
          created_at?: string
          description?: string | null
          id?: string
          is_in_use?: boolean
          last_used_at?: string | null
          name: string
          parent_id?: string | null
          performance_data?: Json | null
          status?: string
          template_id: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_in_use?: boolean
          last_used_at?: string | null
          name?: string
          parent_id?: string | null
          performance_data?: Json | null
          status?: string
          template_id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategy_instances_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "strategy_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "strategy_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_performance: {
        Row: {
          active_trades_count: number | null
          created_at: string | null
          date: string | null
          id: string
          losing_trades: number | null
          net_profit: number | null
          profit_factor: number | null
          strategy_id: string
          total_loss: number | null
          total_profit: number | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          active_trades_count?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          losing_trades?: number | null
          net_profit?: number | null
          profit_factor?: number | null
          strategy_id: string
          total_loss?: number | null
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          active_trades_count?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          losing_trades?: number | null
          net_profit?: number | null
          profit_factor?: number | null
          strategy_id?: string
          total_loss?: number | null
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: []
      }
      strategy_templates: {
        Row: {
          category: string
          created_at: string
          default_config: Json
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          risk_level: string
          schema: Json
          supports_futures: boolean
          supports_leverage: boolean
          supports_spot: boolean
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          default_config?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          risk_level?: string
          schema?: Json
          supports_futures?: boolean
          supports_leverage?: boolean
          supports_spot?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_config?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          risk_level?: string
          schema?: Json
          supports_futures?: boolean
          supports_leverage?: boolean
          supports_spot?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      strategy_trades: {
        Row: {
          closed_at: string | null
          created_at: string | null
          entry_price: number
          exchange: string | null
          exit_price: number | null
          id: string
          opened_at: string
          pnl_amount: number | null
          pnl_percentage: number | null
          position_id: string | null
          profit_loss: number | null
          quantity: number
          side: string | null
          status: string | null
          strategy_id: string
          symbol: string | null
          trade_id: string | null
          updated_at: string | null
          user_id: string
          volume: number | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          entry_price: number
          exchange?: string | null
          exit_price?: number | null
          id?: string
          opened_at: string
          pnl_amount?: number | null
          pnl_percentage?: number | null
          position_id?: string | null
          profit_loss?: number | null
          quantity: number
          side?: string | null
          status?: string | null
          strategy_id: string
          symbol?: string | null
          trade_id?: string | null
          updated_at?: string | null
          user_id: string
          volume?: number | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          entry_price?: number
          exchange?: string | null
          exit_price?: number | null
          id?: string
          opened_at?: string
          pnl_amount?: number | null
          pnl_percentage?: number | null
          position_id?: string | null
          profit_loss?: number | null
          quantity?: number
          side?: string | null
          status?: string | null
          strategy_id?: string
          symbol?: string | null
          trade_id?: string | null
          updated_at?: string | null
          user_id?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_trades_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_notifications: {
        Row: {
          created_at: string
          email_sent: boolean | null
          expires_at: string | null
          id: string
          metadata: Json | null
          notification_type: string
          plan_code: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          plan_code?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          plan_code?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_metrics_daily: {
        Row: {
          avg_resolution_time_hours: number | null
          avg_response_time_hours: number | null
          created_at: string
          date: string
          id: string
          open_tickets_count: number | null
          sla_breaches_count: number | null
          tickets_by_category: Json | null
          tickets_by_priority: Json | null
          tickets_closed_count: number | null
          tickets_reopened_count: number | null
          updated_at: string
        }
        Insert: {
          avg_resolution_time_hours?: number | null
          avg_response_time_hours?: number | null
          created_at?: string
          date: string
          id?: string
          open_tickets_count?: number | null
          sla_breaches_count?: number | null
          tickets_by_category?: Json | null
          tickets_by_priority?: Json | null
          tickets_closed_count?: number | null
          tickets_reopened_count?: number | null
          updated_at?: string
        }
        Update: {
          avg_resolution_time_hours?: number | null
          avg_response_time_hours?: number | null
          created_at?: string
          date?: string
          id?: string
          open_tickets_count?: number | null
          sla_breaches_count?: number | null
          tickets_by_category?: Json | null
          tickets_by_priority?: Json | null
          tickets_closed_count?: number | null
          tickets_reopened_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_health: {
        Row: {
          component: string
          component_type: string
          created_at: string
          details: Json | null
          error_count: number | null
          health_score: number | null
          id: string
          last_heartbeat: string | null
          message: string | null
          response_time_ms: number | null
          status: string
          success_count: number | null
          updated_at: string
        }
        Insert: {
          component: string
          component_type: string
          created_at?: string
          details?: Json | null
          error_count?: number | null
          health_score?: number | null
          id?: string
          last_heartbeat?: string | null
          message?: string | null
          response_time_ms?: number | null
          status: string
          success_count?: number | null
          updated_at?: string
        }
        Update: {
          component?: string
          component_type?: string
          created_at?: string
          details?: Json | null
          error_count?: number | null
          health_score?: number | null
          id?: string
          last_heartbeat?: string | null
          message?: string | null
          response_time_ms?: number | null
          status?: string
          success_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json | null
          source: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          message: string
          metadata?: Json | null
          source: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          source?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_stats: {
        Row: {
          active_users: number
          avg_latency_ms: number | null
          created_at: string | null
          date: string
          failed_jobs: number
          id: string
          total_trades: number
          total_volume_usd: number
        }
        Insert: {
          active_users?: number
          avg_latency_ms?: number | null
          created_at?: string | null
          date: string
          failed_jobs?: number
          id?: string
          total_trades?: number
          total_volume_usd?: number
        }
        Update: {
          active_users?: number
          avg_latency_ms?: number | null
          created_at?: string | null
          date?: string
          failed_jobs?: number
          id?: string
          total_trades?: number
          total_volume_usd?: number
        }
        Relationships: []
      }
      system_status: {
        Row: {
          avg_response_time_ms: number | null
          created_at: string
          error_count: number | null
          error_message: string | null
          id: string
          last_run: string | null
          last_success: string | null
          metadata: Json | null
          service_name: string
          status: string
          success_count: number | null
          updated_at: string
        }
        Insert: {
          avg_response_time_ms?: number | null
          created_at?: string
          error_count?: number | null
          error_message?: string | null
          id?: string
          last_run?: string | null
          last_success?: string | null
          metadata?: Json | null
          service_name: string
          status: string
          success_count?: number | null
          updated_at?: string
        }
        Update: {
          avg_response_time_ms?: number | null
          created_at?: string
          error_count?: number | null
          error_message?: string | null
          id?: string
          last_run?: string | null
          last_success?: string | null
          metadata?: Json | null
          service_name?: string
          status?: string
          success_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_access: {
        Row: {
          channel_code: string
          granted_at: string
          id: string
          metadata: Json | null
          revoked_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel_code: string
          granted_at?: string
          id?: string
          metadata?: Json | null
          revoked_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          channel_code?: string
          granted_at?: string
          id?: string
          metadata?: Json | null
          revoked_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_channels: {
        Row: {
          chat_id: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          plan_code: string
          type: string
        }
        Insert: {
          chat_id: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          plan_code: string
          type: string
        }
        Update: {
          chat_id?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          plan_code?: string
          type?: string
        }
        Relationships: []
      }
      ticket_events_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          performed_by: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal: boolean | null
          message_text: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message_text: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message_text?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_admin_id: string | null
          category: string
          closed_at: string | null
          created_at: string
          first_response_at: string | null
          id: string
          priority: string
          resolved_at: string | null
          sla_first_response_hours: number | null
          sla_resolution_hours: number | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_admin_id?: string | null
          category: string
          closed_at?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          sla_first_response_hours?: number | null
          sla_resolution_hours?: number | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_admin_id?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          sla_first_response_hours?: number | null
          sla_resolution_hours?: number | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_rewards: {
        Row: {
          affiliate_id: string
          claimed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          reward_type: string
          source_id: string | null
          status: string
          token_amount: number
          vesting_schedule: Json | null
        }
        Insert: {
          affiliate_id: string
          claimed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reward_type: string
          source_id?: string | null
          status?: string
          token_amount: number
          vesting_schedule?: Json | null
        }
        Update: {
          affiliate_id?: string
          claimed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reward_type?: string
          source_id?: string | null
          status?: string
          token_amount?: number
          vesting_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "token_rewards_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_orders: {
        Row: {
          average_fill_price: number | null
          cancelled_at: string | null
          client_order_id: string | null
          created_at: string | null
          error_message: string | null
          exchange_order_id: string | null
          exchange_response: Json | null
          fee_asset: string | null
          fees: number | null
          filled_at: string | null
          filled_price: number | null
          filled_quantity: number | null
          id: string
          order_level: number | null
          order_side: string
          order_status: string
          order_type: string
          order_type_exchange: string | null
          platform: string
          platform_order_id: string | null
          requested_price: number | null
          requested_quantity: number
          retry_count: number | null
          side: string
          symbol: string
          time_in_force: string | null
          trade_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          client_order_id?: string | null
          created_at?: string | null
          error_message?: string | null
          exchange_order_id?: string | null
          exchange_response?: Json | null
          fee_asset?: string | null
          fees?: number | null
          filled_at?: string | null
          filled_price?: number | null
          filled_quantity?: number | null
          id?: string
          order_level?: number | null
          order_side: string
          order_status?: string
          order_type: string
          order_type_exchange?: string | null
          platform: string
          platform_order_id?: string | null
          requested_price?: number | null
          requested_quantity: number
          retry_count?: number | null
          side: string
          symbol: string
          time_in_force?: string | null
          trade_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_fill_price?: number | null
          cancelled_at?: string | null
          client_order_id?: string | null
          created_at?: string | null
          error_message?: string | null
          exchange_order_id?: string | null
          exchange_response?: Json | null
          fee_asset?: string | null
          fees?: number | null
          filled_at?: string | null
          filled_price?: number | null
          filled_quantity?: number | null
          id?: string
          order_level?: number | null
          order_side?: string
          order_status?: string
          order_type?: string
          order_type_exchange?: string | null
          platform?: string
          platform_order_id?: string | null
          requested_price?: number | null
          requested_quantity?: number
          retry_count?: number | null
          side?: string
          symbol?: string
          time_in_force?: string | null
          trade_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_orders_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          average_entry_price: number | null
          break_even_state: Json | null
          client_order_id: string | null
          closed_at: string | null
          created_at: string | null
          current_price: number | null
          dca_level: number | null
          entry_price: number
          highest_price: number | null
          highest_price_at: string | null
          id: string
          leverage: number | null
          lowest_price: number | null
          lowest_price_at: string | null
          managed_by_bot: boolean | null
          management_profile_id: string | null
          max_dca_level: number | null
          opened_at: string | null
          partial_tp_levels: Json | null
          platform: string | null
          platform_order_id: string | null
          position_id: string | null
          position_meta: Json | null
          position_quantity: number | null
          position_status: string | null
          quantity: number
          realized_pnl: number | null
          risk_state: Json | null
          side: string
          signal_source: string | null
          source_mode: string | null
          status: string | null
          stop_loss_price: number | null
          symbol: string
          take_profit_price: number | null
          total_invested: number
          trade_type: string | null
          trailing_stop_state: Json | null
          unrealized_pnl: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_entry_price?: number | null
          break_even_state?: Json | null
          client_order_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          dca_level?: number | null
          entry_price: number
          highest_price?: number | null
          highest_price_at?: string | null
          id?: string
          leverage?: number | null
          lowest_price?: number | null
          lowest_price_at?: string | null
          managed_by_bot?: boolean | null
          management_profile_id?: string | null
          max_dca_level?: number | null
          opened_at?: string | null
          partial_tp_levels?: Json | null
          platform?: string | null
          platform_order_id?: string | null
          position_id?: string | null
          position_meta?: Json | null
          position_quantity?: number | null
          position_status?: string | null
          quantity: number
          realized_pnl?: number | null
          risk_state?: Json | null
          side: string
          signal_source?: string | null
          source_mode?: string | null
          status?: string | null
          stop_loss_price?: number | null
          symbol: string
          take_profit_price?: number | null
          total_invested: number
          trade_type?: string | null
          trailing_stop_state?: Json | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_entry_price?: number | null
          break_even_state?: Json | null
          client_order_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          dca_level?: number | null
          entry_price?: number
          highest_price?: number | null
          highest_price_at?: string | null
          id?: string
          leverage?: number | null
          lowest_price?: number | null
          lowest_price_at?: string | null
          managed_by_bot?: boolean | null
          management_profile_id?: string | null
          max_dca_level?: number | null
          opened_at?: string | null
          partial_tp_levels?: Json | null
          platform?: string | null
          platform_order_id?: string | null
          position_id?: string | null
          position_meta?: Json | null
          position_quantity?: number | null
          position_status?: string | null
          quantity?: number
          realized_pnl?: number | null
          risk_state?: Json | null
          side?: string
          signal_source?: string | null
          source_mode?: string | null
          status?: string | null
          stop_loss_price?: number | null
          symbol?: string
          take_profit_price?: number | null
          total_invested?: number
          trade_type?: string | null
          trailing_stop_state?: Json | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trading_performance: {
        Row: {
          average_loss: number | null
          average_win: number | null
          created_at: string | null
          date: string | null
          id: string
          losing_trades: number | null
          max_drawdown: number | null
          net_profit: number | null
          profit_factor: number | null
          roi_percentage: number | null
          total_loss: number | null
          total_profit: number | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          average_loss?: number | null
          average_win?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          losing_trades?: number | null
          max_drawdown?: number | null
          net_profit?: number | null
          profit_factor?: number | null
          roi_percentage?: number | null
          total_loss?: number | null
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          average_loss?: number | null
          average_win?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          losing_trades?: number | null
          max_drawdown?: number | null
          net_profit?: number | null
          profit_factor?: number | null
          roi_percentage?: number | null
          total_loss?: number | null
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: []
      }
      trading_signals: {
        Row: {
          ai_analysis: Json | null
          confidence_score: number
          confirmations: string[] | null
          created_at: string | null
          entry_price: number
          expires_at: string | null
          id: string
          pattern_analysis: Json | null
          profit_loss_percentage: number | null
          result: string | null
          risk_reward_ratio: number | null
          sentiment_analysis: Json | null
          signal_strength: string
          signal_type: string
          status: string | null
          stop_loss_price: number | null
          symbol: string
          take_profit_price: number | null
          technical_analysis: Json | null
          timeframe: string
          triggered_at: string | null
          updated_at: string | null
          user_id: string
          volume_analysis: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          confidence_score: number
          confirmations?: string[] | null
          created_at?: string | null
          entry_price: number
          expires_at?: string | null
          id?: string
          pattern_analysis?: Json | null
          profit_loss_percentage?: number | null
          result?: string | null
          risk_reward_ratio?: number | null
          sentiment_analysis?: Json | null
          signal_strength: string
          signal_type: string
          status?: string | null
          stop_loss_price?: number | null
          symbol: string
          take_profit_price?: number | null
          technical_analysis?: Json | null
          timeframe: string
          triggered_at?: string | null
          updated_at?: string | null
          user_id: string
          volume_analysis?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          confidence_score?: number
          confirmations?: string[] | null
          created_at?: string | null
          entry_price?: number
          expires_at?: string | null
          id?: string
          pattern_analysis?: Json | null
          profit_loss_percentage?: number | null
          result?: string | null
          risk_reward_ratio?: number | null
          sentiment_analysis?: Json | null
          signal_strength?: string
          signal_type?: string
          status?: string | null
          stop_loss_price?: number | null
          symbol?: string
          take_profit_price?: number | null
          technical_analysis?: Json | null
          timeframe?: string
          triggered_at?: string | null
          updated_at?: string | null
          user_id?: string
          volume_analysis?: Json | null
        }
        Relationships: []
      }
      tradingview_settings: {
        Row: {
          allowed_strategies: string[] | null
          allowed_symbols: string[] | null
          auto_cleanup_enabled: boolean | null
          auto_trade_enabled: boolean | null
          cleanup_days_15m: number | null
          cleanup_days_1d: number | null
          cleanup_days_1h: number | null
          cleanup_days_1m: number | null
          cleanup_days_4h: number | null
          cleanup_days_5m: number | null
          created_at: string
          id: string
          is_enabled: boolean | null
          max_daily_signals: number | null
          min_confidence_score: number | null
          updated_at: string
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          allowed_strategies?: string[] | null
          allowed_symbols?: string[] | null
          auto_cleanup_enabled?: boolean | null
          auto_trade_enabled?: boolean | null
          cleanup_days_15m?: number | null
          cleanup_days_1d?: number | null
          cleanup_days_1h?: number | null
          cleanup_days_1m?: number | null
          cleanup_days_4h?: number | null
          cleanup_days_5m?: number | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          max_daily_signals?: number | null
          min_confidence_score?: number | null
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          allowed_strategies?: string[] | null
          allowed_symbols?: string[] | null
          auto_cleanup_enabled?: boolean | null
          auto_trade_enabled?: boolean | null
          cleanup_days_15m?: number | null
          cleanup_days_1d?: number | null
          cleanup_days_1h?: number | null
          cleanup_days_1m?: number | null
          cleanup_days_4h?: number | null
          cleanup_days_5m?: number | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          max_daily_signals?: number | null
          min_confidence_score?: number | null
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      tradingview_signals: {
        Row: {
          alert_message: string | null
          auto_trade_executed: boolean | null
          confidence_score: number
          created_at: string
          entry_price: number
          executed_trade_id: string | null
          execution_attempts: number | null
          execution_completed_at: string | null
          execution_error: string | null
          execution_reason: string | null
          execution_scheduled_at: string | null
          execution_started_at: string | null
          execution_status: string | null
          expires_at: string | null
          id: string
          market_conditions: Json | null
          profit_loss_percentage: number | null
          result: string | null
          risk_reward_ratio: number | null
          signal_strength: string
          signal_type: string
          status: string
          stop_loss_price: number | null
          strategy_name: string
          symbol: string
          take_profit_price: number | null
          technical_indicators: Json | null
          timeframe: string
          triggered_at: string | null
          updated_at: string
          user_id: string
          webhook_data: Json | null
        }
        Insert: {
          alert_message?: string | null
          auto_trade_executed?: boolean | null
          confidence_score?: number
          created_at?: string
          entry_price: number
          executed_trade_id?: string | null
          execution_attempts?: number | null
          execution_completed_at?: string | null
          execution_error?: string | null
          execution_reason?: string | null
          execution_scheduled_at?: string | null
          execution_started_at?: string | null
          execution_status?: string | null
          expires_at?: string | null
          id?: string
          market_conditions?: Json | null
          profit_loss_percentage?: number | null
          result?: string | null
          risk_reward_ratio?: number | null
          signal_strength?: string
          signal_type: string
          status?: string
          stop_loss_price?: number | null
          strategy_name: string
          symbol: string
          take_profit_price?: number | null
          technical_indicators?: Json | null
          timeframe: string
          triggered_at?: string | null
          updated_at?: string
          user_id: string
          webhook_data?: Json | null
        }
        Update: {
          alert_message?: string | null
          auto_trade_executed?: boolean | null
          confidence_score?: number
          created_at?: string
          entry_price?: number
          executed_trade_id?: string | null
          execution_attempts?: number | null
          execution_completed_at?: string | null
          execution_error?: string | null
          execution_reason?: string | null
          execution_scheduled_at?: string | null
          execution_started_at?: string | null
          execution_status?: string | null
          expires_at?: string | null
          id?: string
          market_conditions?: Json | null
          profit_loss_percentage?: number | null
          result?: string | null
          risk_reward_ratio?: number | null
          signal_strength?: string
          signal_type?: string
          status?: string
          stop_loss_price?: number | null
          strategy_name?: string
          symbol?: string
          take_profit_price?: number | null
          technical_indicators?: Json | null
          timeframe?: string
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tradingview_signals_executed_trade_id_fkey"
            columns: ["executed_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[]
          created_at: string | null
          id: string
          is_enabled: boolean | null
          secret: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[]
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[]
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          count: number
          counter_type: string
          created_at: string
          date: string
          id: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          counter_type: string
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          counter_type?: string
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_cohorts: {
        Row: {
          arpu: number
          churn_rate: number | null
          cohort_month: string
          conversion_rate: number | null
          created_at: string | null
          id: string
          retention_by_month: Json | null
          total_users: number
          updated_at: string | null
        }
        Insert: {
          arpu?: number
          churn_rate?: number | null
          cohort_month: string
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          retention_by_month?: Json | null
          total_users?: number
          updated_at?: string | null
        }
        Update: {
          arpu?: number
          churn_rate?: number | null
          cohort_month?: string
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          retention_by_month?: Json | null
          total_users?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_error_logs: {
        Row: {
          created_at: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          suggested_action: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source: string
          suggested_action?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          suggested_action?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_funnel_stages: {
        Row: {
          api_connected_at: string | null
          converted_to_paid_at: string | null
          created_at: string | null
          first_feature_used_at: string | null
          first_trade_at: string | null
          id: string
          registered_at: string | null
          retention_d1: boolean | null
          retention_d30: boolean | null
          retention_d7: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_connected_at?: string | null
          converted_to_paid_at?: string | null
          created_at?: string | null
          first_feature_used_at?: string | null
          first_trade_at?: string | null
          id?: string
          registered_at?: string | null
          retention_d1?: boolean | null
          retention_d30?: boolean | null
          retention_d7?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_connected_at?: string | null
          converted_to_paid_at?: string | null
          created_at?: string | null
          first_feature_used_at?: string | null
          first_trade_at?: string | null
          id?: string
          registered_at?: string | null
          retention_d1?: boolean | null
          retention_d30?: boolean | null
          retention_d7?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          activated_at: string
          expires_at: string | null
          metadata: Json | null
          payment_method: string | null
          plan_id: string
          status: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          expires_at?: string | null
          metadata?: Json | null
          payment_method?: string | null
          plan_id: string
          status?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          expires_at?: string | null
          metadata?: Json | null
          payment_method?: string | null
          plan_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_dismissed: boolean | null
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_dismissed?: boolean | null
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_dismissed?: boolean | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_support_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          is_important: boolean | null
          note_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          note_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          note_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_timeline_events: {
        Row: {
          created_at: string
          description: string | null
          event_category: string
          event_type: string
          id: string
          metadata: Json | null
          severity: string | null
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_category: string
          event_type: string
          id?: string
          metadata?: Json | null
          severity?: string | null
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_category?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          severity?: string | null
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_trading_status: {
        Row: {
          created_at: string | null
          disabled_at: string | null
          disabled_by: string | null
          disabled_reason: string | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          trading_enabled: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          disabled_reason?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          trading_enabled?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          disabled_reason?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          trading_enabled?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users_portfolio_state: {
        Row: {
          api_key_id: string | null
          created_at: string
          futures_equity: number
          id: string
          last_error: string | null
          last_sync_at: string
          open_positions_count: number
          realized_pnl: number
          spot_equity: number
          sync_status: string | null
          total_equity: number
          unrealized_pnl: number
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          futures_equity?: number
          id?: string
          last_error?: string | null
          last_sync_at?: string
          open_positions_count?: number
          realized_pnl?: number
          spot_equity?: number
          sync_status?: string | null
          total_equity?: number
          unrealized_pnl?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          futures_equity?: number
          id?: string
          last_error?: string | null
          last_sync_at?: string
          open_positions_count?: number
          realized_pnl?: number
          spot_equity?: number
          sync_status?: string | null
          total_equity?: number
          unrealized_pnl?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_portfolio_state_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      verified_influencers: {
        Row: {
          bio: string | null
          created_at: string
          is_active: boolean | null
          level: string
          metadata: Json | null
          social_links: Json | null
          total_followers: number | null
          total_views: number | null
          updated_at: string
          user_id: string
          verification_date: string
          verified_by: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          is_active?: boolean | null
          level: string
          metadata?: Json | null
          social_links?: Json | null
          total_followers?: number | null
          total_views?: number | null
          updated_at?: string
          user_id: string
          verification_date?: string
          verified_by?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          is_active?: boolean | null
          level?: string
          metadata?: Json | null
          social_links?: Json | null
          total_followers?: number | null
          total_views?: number | null
          updated_at?: string
          user_id?: string
          verification_date?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      weight_history: {
        Row: {
          affiliate_id: string
          change_reason: string
          change_source: string
          created_at: string
          id: string
          metadata: Json | null
          source_id: string | null
          weight_after: number
          weight_before: number
          weight_change: number
        }
        Insert: {
          affiliate_id: string
          change_reason: string
          change_source: string
          created_at?: string
          id?: string
          metadata?: Json | null
          source_id?: string | null
          weight_after: number
          weight_before: number
          weight_change: number
        }
        Update: {
          affiliate_id?: string
          change_reason?: string
          change_source?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          source_id?: string | null
          weight_after?: number
          weight_before?: number
          weight_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_history_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      platform_statistics: {
        Row: {
          active_keys: number | null
          platform: string | null
          testnet: boolean | null
          total_keys: number | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_enhanced_signal_performance: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      calculate_trading_performance: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      calculate_tradingview_performance: {
        Args: { user_uuid: string }
        Returns: {
          average_loss: number
          average_profit: number
          by_strategy: Json
          by_timeframe: Json
          failed_signals: number
          pending_signals: number
          successful_signals: number
          total_pnl: number
          total_signals: number
          win_rate: number
        }[]
      }
      check_expiring_subscriptions: { Args: never; Returns: undefined }
      check_key_rotation_needed: {
        Args: never
        Returns: {
          api_key_id: string
          days_since_rotation: number
          platform: string
          rotation_schedule_days: number
          user_id: string
        }[]
      }
      clean_expired_backtest_cache: { Args: never; Returns: number }
      cleanup_old_tradingview_signals: {
        Args: { user_uuid: string }
        Returns: number
      }
      generate_ticket_number: { Args: never; Returns: string }
      get_auto_trades_count_today: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_concurrent_auto_positions: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_follower_strategy_pnl: {
        Args: { follower_uuid: string; strategy_uuid: string }
        Returns: number
      }
      get_latest_portfolio_snapshot: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          exposure: Json
          futures_positions: Json
          id: string
          leverage_used: number
          spot_balance: Json
          total_balance: number
          total_exposure: number
          unrealized_pnl: number
          user_id: string
        }[]
      }
      get_latest_risk_score: {
        Args: { p_user_id: string }
        Returns: {
          ai_comment: string
          created_at: string
          id: string
          overall_score: number
          risk_level: string
          user_id: string
        }[]
      }
      get_latest_system_logs: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json
          source: string
        }[]
      }
      get_strategy_followers_count: {
        Args: { strategy_uuid: string }
        Returns: number
      }
      get_system_health_summary: { Args: never; Returns: Json }
      get_system_statistics: { Args: { p_hours?: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_following_strategy: {
        Args: { strategy_uuid: string; user_uuid: string }
        Returns: boolean
      }
      log_copy_trading_audit: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      reset_daily_loss_snapshots: { Args: never; Returns: undefined }
      reset_signal_for_retry: {
        Args: { scheduled_at?: string; signal_id: string }
        Returns: boolean
      }
      update_signal_execution_status: {
        Args: {
          error_text?: string
          new_status: string
          reason?: string
          signal_id: string
          trade_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
