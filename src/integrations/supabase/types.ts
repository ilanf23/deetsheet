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
      account_security: {
        Row: {
          created_at: string
          email_verified: boolean
          recovery_email: string | null
          strong_password_set: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_verified?: boolean
          recovery_email?: string | null
          strong_password_set?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_verified?: boolean
          recovery_email?: string | null
          strong_password_set?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          like_count: number
          parent_comment_id: string | null
          post_id: string
          public_author_id: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          like_count?: number
          parent_comment_id?: string | null
          post_id: string
          public_author_id?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          like_count?: number
          parent_comment_id?: string | null
          post_id?: string
          public_author_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments_privileged"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_privileged"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_public_author_id_profiles_fkey"
            columns: ["public_author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_public_author_id_profiles_fkey"
            columns: ["public_author_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
        ]
      }
      comments_archive_fredbrewer_20260610: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          like_count: number
          parent_comment_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          like_count?: number
          parent_comment_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          like_count?: number
          parent_comment_id?: string | null
          post_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          category: string | null
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          admin_messages: boolean
          comment_notifications: boolean
          created_at: string
          email: string
          member_messages: boolean
          post_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_messages?: boolean
          comment_notifications?: boolean
          created_at?: string
          email: string
          member_messages?: boolean
          post_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_messages?: boolean
          comment_notifications?: boolean
          created_at?: string
          email?: string
          member_messages?: boolean
          post_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_privileged"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          state: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          state: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          state?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body_html: string | null
          created_at: string
          created_by: string | null
          deadline_default: string | null
          id: string
          reason_default: string | null
          subject: string
          suggestions_default: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_html?: string | null
          created_at?: string
          created_by?: string | null
          deadline_default?: string | null
          id?: string
          reason_default?: string | null
          subject: string
          suggestions_default?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_html?: string | null
          created_at?: string
          created_by?: string | null
          deadline_default?: string | null
          id?: string
          reason_default?: string | null
          subject?: string
          suggestions_default?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          created_at: string
          hidden_for_other_at: string | null
          hidden_for_user_at: string | null
          id: string
          initiated_by: string | null
          kind: string
          last_message_at: string
          last_read_at: string | null
          last_sender: string
          other_last_read_at: string | null
          other_user_id: string | null
          post_id: string | null
          request_status: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hidden_for_other_at?: string | null
          hidden_for_user_at?: string | null
          id?: string
          initiated_by?: string | null
          kind?: string
          last_message_at?: string
          last_read_at?: string | null
          last_sender?: string
          other_last_read_at?: string | null
          other_user_id?: string | null
          post_id?: string | null
          request_status?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hidden_for_other_at?: string | null
          hidden_for_user_at?: string | null
          id?: string
          initiated_by?: string | null
          kind?: string
          last_message_at?: string
          last_read_at?: string | null
          last_sender?: string
          other_last_read_at?: string | null
          other_user_id?: string | null
          post_id?: string | null
          request_status?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_privileged"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string
          email_message_id: string | null
          email_sent: boolean
          id: string
          sender_id: string
          sender_role: string
          slip: Json | null
          thread_id: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          email_message_id?: string | null
          email_sent?: boolean
          id?: string
          sender_id: string
          sender_role: string
          slip?: Json | null
          thread_id: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          email_message_id?: string | null
          email_sent?: boolean
          id?: string
          sender_id?: string
          sender_role?: string
          slip?: Json | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          post_id: string | null
          read_at: string | null
          thread_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          post_id?: string | null
          read_at?: string | null
          thread_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          post_id?: string | null
          read_at?: string | null
          thread_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_follows: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_follows_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_follows_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_privileged"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          approved_at: string | null
          author_id: string
          average_rating: number
          comment_count: number
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          follower_count: number
          id: string
          image_url: string | null
          is_anonymous: boolean
          is_national: boolean
          location_id: string | null
          public_author_id: string | null
          rating_count: number
          score: number
          status: string
          story: string | null
          title: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          author_id: string
          average_rating?: number
          comment_count?: number
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          follower_count?: number
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_national?: boolean
          location_id?: string | null
          public_author_id?: string | null
          rating_count?: number
          score?: number
          status?: string
          story?: string | null
          title: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          author_id?: string
          average_rating?: number
          comment_count?: number
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          follower_count?: number
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_national?: boolean
          location_id?: string | null
          public_author_id?: string | null
          rating_count?: number
          score?: number
          status?: string
          story?: string | null
          title?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_public_author_id_profiles_fkey"
            columns: ["public_author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_public_author_id_profiles_fkey"
            columns: ["public_author_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_archive_fredbrewer_20260610: {
        Row: {
          author_id: string
          average_rating: number
          comment_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_anonymous: boolean
          is_national: boolean
          location_id: string | null
          rating_count: number
          score: number
          status: string
          story: string | null
          title: string
          topic_id: string
        }
        Insert: {
          author_id: string
          average_rating?: number
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_national?: boolean
          location_id?: string | null
          rating_count?: number
          score?: number
          status?: string
          story?: string | null
          title: string
          topic_id: string
        }
        Update: {
          author_id?: string
          average_rating?: number
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_national?: boolean
          location_id?: string | null
          rating_count?: number
          score?: number
          status?: string
          story?: string | null
          title?: string
          topic_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_day: string | null
          birth_month: string | null
          birth_year: string | null
          city: string | null
          city_born: string | null
          college: string | null
          country: string | null
          created_at: string
          degree: string | null
          education: string | null
          email_frequency: string | null
          email_on_comment: boolean | null
          email_on_follow: boolean | null
          email_on_message: boolean | null
          email_on_post_edit: boolean | null
          email_top_posts: boolean | null
          entity_type: string | null
          favorite_movie: string | null
          follower_count: number
          following_count: number
          hide_age: boolean
          high_school: string | null
          id: string
          job: string | null
          location_id: string | null
          major: string | null
          name: string | null
          orientation: string | null
          reading: string | null
          sex: string | null
          state: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_day?: string | null
          birth_month?: string | null
          birth_year?: string | null
          city?: string | null
          city_born?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          degree?: string | null
          education?: string | null
          email_frequency?: string | null
          email_on_comment?: boolean | null
          email_on_follow?: boolean | null
          email_on_message?: boolean | null
          email_on_post_edit?: boolean | null
          email_top_posts?: boolean | null
          entity_type?: string | null
          favorite_movie?: string | null
          follower_count?: number
          following_count?: number
          hide_age?: boolean
          high_school?: string | null
          id: string
          job?: string | null
          location_id?: string | null
          major?: string | null
          name?: string | null
          orientation?: string | null
          reading?: string | null
          sex?: string | null
          state?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_day?: string | null
          birth_month?: string | null
          birth_year?: string | null
          city?: string | null
          city_born?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          degree?: string | null
          education?: string | null
          email_frequency?: string | null
          email_on_comment?: boolean | null
          email_on_follow?: boolean | null
          email_on_message?: boolean | null
          email_on_post_edit?: boolean | null
          email_top_posts?: boolean | null
          entity_type?: string | null
          favorite_movie?: string | null
          follower_count?: number
          following_count?: number
          hide_age?: boolean
          high_school?: string | null
          id?: string
          job?: string | null
          location_id?: string | null
          major?: string | null
          name?: string | null
          orientation?: string | null
          reading?: string | null
          sex?: string | null
          state?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_privileged"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings_archive_fredbrewer_20260610: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reasons: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reasons?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reasons?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_privileged"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reasons: {
        Row: {
          created_at: string
          detail: string
          id: string
          kind: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          kind: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          slug: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      thread_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          status: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_reports_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_follows: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_follows_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_image_ratings: {
        Row: {
          created_at: string
          id: string
          topic_image_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          topic_image_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          topic_image_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "topic_image_ratings_topic_image_id_fkey"
            columns: ["topic_image_id"]
            isOneToOne: false
            referencedRelation: "topic_images"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_images: {
        Row: {
          average_rating: number
          created_at: string
          id: string
          rating_count: number
          topic_id: string
          url: string
        }
        Insert: {
          average_rating?: number
          created_at?: string
          id?: string
          rating_count?: number
          topic_id: string
          url: string
        }
        Update: {
          average_rating?: number
          created_at?: string
          id?: string
          rating_count?: number
          topic_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_images_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category_name: string
          created_at: string
          created_by: string | null
          description: string | null
          follower_count: number
          id: string
          image_url: string | null
          name: string
          post_count: number
          slug: string
          status: string
          subtitle_override: string | null
        }
        Insert: {
          category_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          follower_count?: number
          id?: string
          image_url?: string | null
          name: string
          post_count?: number
          slug: string
          status?: string
          subtitle_override?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          follower_count?: number
          id?: string
          image_url?: string | null
          name?: string
          post_count?: number
          slug?: string
          status?: string
          subtitle_override?: string | null
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
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
    }
    Views: {
      comments_privileged: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          id: string | null
          is_anonymous: boolean | null
          like_count: number | null
          parent_comment_id: string | null
          post_id: string | null
          public_author_id: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          like_count?: number | null
          parent_comment_id?: string | null
          post_id?: string | null
          public_author_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          like_count?: number | null
          parent_comment_id?: string | null
          post_id?: string | null
          public_author_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments_privileged"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_privileged"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_public_author_id_profiles_fkey"
            columns: ["public_author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_public_author_id_profiles_fkey"
            columns: ["public_author_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_privileged: {
        Row: {
          approved_at: string | null
          author_id: string | null
          average_rating: number | null
          comment_count: number | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          follower_count: number | null
          id: string | null
          image_url: string | null
          is_anonymous: boolean | null
          is_national: boolean | null
          location_id: string | null
          public_author_id: string | null
          rating_count: number | null
          score: number | null
          status: string | null
          story: string | null
          title: string | null
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          author_id?: string | null
          average_rating?: number | null
          comment_count?: number | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          follower_count?: number | null
          id?: string | null
          image_url?: string | null
          is_anonymous?: boolean | null
          is_national?: boolean | null
          location_id?: string | null
          public_author_id?: string | null
          rating_count?: number | null
          score?: number | null
          status?: string | null
          story?: string | null
          title?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          author_id?: string | null
          average_rating?: number | null
          comment_count?: number | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          follower_count?: number | null
          id?: string | null
          image_url?: string | null
          is_anonymous?: boolean | null
          is_national?: boolean | null
          location_id?: string | null
          public_author_id?: string | null
          rating_count?: number | null
          score?: number | null
          status?: string | null
          story?: string | null
          title?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_public_author_id_profiles_fkey"
            columns: ["public_author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_public_author_id_profiles_fkey"
            columns: ["public_author_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_private: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_day: string | null
          birth_month: string | null
          birth_year: string | null
          city: string | null
          city_born: string | null
          college: string | null
          country: string | null
          created_at: string | null
          degree: string | null
          education: string | null
          email_frequency: string | null
          email_on_comment: boolean | null
          email_on_follow: boolean | null
          email_on_message: boolean | null
          email_on_post_edit: boolean | null
          email_top_posts: boolean | null
          entity_type: string | null
          favorite_movie: string | null
          follower_count: number | null
          following_count: number | null
          hide_age: boolean | null
          high_school: string | null
          id: string | null
          job: string | null
          location_id: string | null
          major: string | null
          name: string | null
          orientation: string | null
          reading: string | null
          sex: string | null
          state: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_day?: string | null
          birth_month?: string | null
          birth_year?: string | null
          city?: string | null
          city_born?: string | null
          college?: string | null
          country?: string | null
          created_at?: string | null
          degree?: string | null
          education?: string | null
          email_frequency?: string | null
          email_on_comment?: boolean | null
          email_on_follow?: boolean | null
          email_on_message?: boolean | null
          email_on_post_edit?: boolean | null
          email_top_posts?: boolean | null
          entity_type?: string | null
          favorite_movie?: string | null
          follower_count?: number | null
          following_count?: number | null
          hide_age?: boolean | null
          high_school?: string | null
          id?: string | null
          job?: string | null
          location_id?: string | null
          major?: string | null
          name?: string | null
          orientation?: string | null
          reading?: string | null
          sex?: string | null
          state?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_day?: string | null
          birth_month?: string | null
          birth_year?: string | null
          city?: string | null
          city_born?: string | null
          college?: string | null
          country?: string | null
          created_at?: string | null
          degree?: string | null
          education?: string | null
          email_frequency?: string | null
          email_on_comment?: boolean | null
          email_on_follow?: boolean | null
          email_on_message?: boolean | null
          email_on_post_edit?: boolean | null
          email_top_posts?: boolean | null
          entity_type?: string | null
          favorite_movie?: string | null
          follower_count?: number | null
          following_count?: number | null
          hide_age?: boolean | null
          high_school?: string | null
          id?: string | null
          job?: string | null
          location_id?: string | null
          major?: string | null
          name?: string | null
          orientation?: string | null
          reading?: string | null
          sex?: string | null
          state?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      build_post_link: { Args: { _post_id: string }; Returns: string }
      count_changed_words: {
        Args: { _new: string; _old: string }
        Returns: number
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_or_create_location: {
        Args: { _city: string; _country?: string; _state: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_pair: { Args: { _a: string; _b: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalculate_profile_follow_counts: {
        Args: { _profile_id: string }
        Returns: undefined
      }
      user_messaging_enabled: { Args: never; Returns: boolean }
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
