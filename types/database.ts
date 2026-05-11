// Manual types — replace with: pnpm supabase gen types typescript --local > types/database.ts

export type EventStatus = 'pending' | 'published' | 'completed' | 'rejected'
export type DateQuality = 'confirmed' | 'estimated' | 'missing' | 'unrealistic' | 'reversed'
export type MediaTier = 'major' | 'minor' | 'blog' | 'community'
export type CoverImageSource = 'og_extracted' | 'category_fallback' | 'manual'
export type ReportReasonType = 'ended' | 'promotional' | 'wrong_period' | 'wrong_category' | 'other'

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          summary: string | null
          key_points: string[] | null
          brand_id: string | null
          brand_raw: string | null
          category_id: string | null
          subcategory_id: string | null
          discount_type: string | null
          discount_value: string | null
          starts_at: string | null
          ends_at: string | null
          is_ongoing: boolean
          regions: string[]
          status: EventStatus
          confidence: number | null
          date_quality: DateQuality | null
          affiliate_url: string | null
          cover_image_url: string | null
          cover_image_source: CoverImageSource | null
          cover_image_checked_at: string | null
          slug: string | null
          auto_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary?: string | null
          key_points?: string[] | null
          brand_id?: string | null
          brand_raw?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          discount_type?: string | null
          discount_value?: string | null
          starts_at?: string | null
          ends_at?: string | null
          is_ongoing?: boolean
          regions?: string[]
          status?: EventStatus
          confidence?: number | null
          date_quality?: DateQuality | null
          affiliate_url?: string | null
          cover_image_url?: string | null
          cover_image_source?: CoverImageSource | null
          cover_image_checked_at?: string | null
          slug?: string | null
          auto_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string | null
          key_points?: string[] | null
          brand_id?: string | null
          brand_raw?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          discount_type?: string | null
          discount_value?: string | null
          starts_at?: string | null
          ends_at?: string | null
          is_ongoing?: boolean
          regions?: string[]
          status?: EventStatus
          confidence?: number | null
          date_quality?: DateQuality | null
          affiliate_url?: string | null
          cover_image_url?: string | null
          cover_image_source?: CoverImageSource | null
          cover_image_checked_at?: string | null
          slug?: string | null
          auto_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_subcategory_id_fkey'
            columns: ['subcategory_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          parent_id: string | null
          display_order: number
          icon_svg: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          parent_id?: string | null
          display_order?: number
          icon_svg?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          parent_id?: string | null
          display_order?: number
          icon_svg?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      tags: {
        Row: { id: string; slug: string; name: string }
        Insert: { id?: string; slug: string; name: string }
        Update: { id?: string; slug?: string; name?: string }
        Relationships: []
      }
      brands: {
        Row: {
          id: string
          name: string
          aliases: string[]
          category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          aliases?: string[]
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          aliases?: string[]
          category_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: { id: string; name: string }
        Insert: { id?: string; name: string }
        Update: { id?: string; name?: string }
        Relationships: []
      }
      sources: {
        Row: {
          id: string
          name: string
          url: string | null
          tier: MediaTier
          config: Record<string, unknown>
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url?: string | null
          tier?: MediaTier
          config?: Record<string, unknown>
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          url?: string | null
          tier?: MediaTier
          config?: Record<string, unknown>
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      raw_articles: {
        Row: {
          id: string
          source_id: string | null
          original_url: string
          title: string
          body_excerpt: string | null
          original_published_at: string | null
          fetched_at: string
          processing_status: string
          search_run_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source_id?: string | null
          original_url: string
          title: string
          body_excerpt?: string | null
          original_published_at?: string | null
          fetched_at?: string
          processing_status?: string
          search_run_id?: string | null
          created_at?: string
        }
        Update: {
          processing_status?: string
          search_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'raw_articles_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'sources'
            referencedColumns: ['id']
          },
        ]
      }
      search_runs: {
        Row: {
          id: string
          window_start: string
          window_end: string
          status: string
          articles_count: number
          events_count: number
          ai_cost_usd: number
          started_at: string
          finished_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          window_start: string
          window_end: string
          status?: string
          articles_count?: number
          events_count?: number
          ai_cost_usd?: number
          started_at?: string
          finished_at?: string | null
          error_message?: string | null
        }
        Update: {
          status?: string
          articles_count?: number
          events_count?: number
          ai_cost_usd?: number
          finished_at?: string | null
          error_message?: string | null
        }
        Relationships: []
      }
      event_sources: {
        Row: {
          id: string
          event_id: string
          raw_article_id: string | null
          source_name: string | null
          source_url: string | null
          media_tier: MediaTier | null
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          raw_article_id?: string | null
          source_name?: string | null
          source_url?: string | null
          media_tier?: MediaTier | null
          published_at?: string | null
          created_at?: string
        }
        Update: {
          source_name?: string | null
          source_url?: string | null
          media_tier?: MediaTier | null
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'event_sources_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      event_tags: {
        Row: { event_id: string; tag_id: string }
        Insert: { event_id: string; tag_id: string }
        Update: { event_id?: string; tag_id?: string }
        Relationships: [
          {
            foreignKeyName: 'event_tags_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      event_embeddings: {
        Row: {
          id: string
          event_id: string
          embedding: number[] | null
          input_text: string | null
          model: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          embedding?: number[] | null
          input_text?: string | null
          model?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          embedding?: number[] | null
          input_text?: string | null
          model?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_embeddings_event_id_fkey'
            columns: ['event_id']
            isOneToOne: true
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      admin_sessions: {
        Row: {
          id: string
          token_hash: string | null
          created_at: string
          expires_at: string | null
          revoked_at: string | null
        }
        Insert: {
          id?: string
          token_hash?: string | null
          created_at?: string
          expires_at?: string | null
          revoked_at?: string | null
        }
        Update: {
          token_hash?: string | null
          expires_at?: string | null
          revoked_at?: string | null
        }
        Relationships: []
      }
      admin_login_attempts: {
        Row: {
          id: string
          ip: string
          attempted_at: string
          success: boolean
        }
        Insert: {
          id?: string
          ip: string
          attempted_at?: string
          success?: boolean
        }
        Update: {
          ip?: string
          success?: boolean
          attempted_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          before_data: Record<string, unknown> | null
          after_data: Record<string, unknown> | null
          ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          before_data?: Record<string, unknown> | null
          after_data?: Record<string, unknown> | null
          ip?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      event_reports: {
        Row: {
          id: string
          event_id: string
          reason_type: ReportReasonType
          message: string | null
          ip_hash: string
          user_agent_hash: string | null
          created_at: string
          reviewed: boolean
          reviewed_by: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          reason_type: ReportReasonType
          message?: string | null
          ip_hash: string
          user_agent_hash?: string | null
          created_at?: string
          reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: {
          reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'event_reports_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      match_events_by_embedding: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: unknown[]
      }
      match_related_events: {
        Args: {
          target_event_id: string
          query_embedding: number[]
          match_threshold: number
          match_count: number
          filter_subcategory_id: string | null
        }
        Returns: unknown[]
      }
    }
    Enums: Record<string, never>
  }
}
