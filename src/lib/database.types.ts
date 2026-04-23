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
      mezmurs: {
        Row: {
          audio_url: string | null
          created_at: string
          id: string
          lyrics: string | null
          order_index: number
          title: string
          title_am: string | null
          title_en: string | null
          transliteration: string | null
          updated_at: string
          weekly_class_id: string
          youtube_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          id?: string
          lyrics?: string | null
          order_index: number
          title: string
          title_am?: string | null
          title_en?: string | null
          transliteration?: string | null
          updated_at?: string
          weekly_class_id: string
          youtube_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          id?: string
          lyrics?: string | null
          order_index?: number
          title?: string
          title_am?: string | null
          title_en?: string | null
          transliteration?: string | null
          updated_at?: string
          weekly_class_id?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mezmurs_weekly_class_id_fkey"
            columns: ["weekly_class_id"]
            isOneToOne: false
            referencedRelation: "weekly_classes"
            referencedColumns: ["id"]
          }
        ]
      }
      multiple_choice_options: {
        Row: {
          created_at: string
          id: string
          option_index: number
          option_text: string | null
          option_text_am: string | null
          option_text_en: string | null
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          option_text?: string | null
          option_text_am?: string | null
          option_text_en?: string | null
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          option_text?: string | null
          option_text_am?: string | null
          option_text_en?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiple_choice_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          correct_index: number | null
          created_at: string
          explanation: string | null
          explanation_am: string | null
          explanation_en: string | null
          helper_text: string | null
          helper_text_am: string | null
          helper_text_en: string | null
          id: string
          order_index: number
          placeholder: string | null
          placeholder_am: string | null
          placeholder_en: string | null
          prompt: string | null
          prompt_am: string | null
          prompt_en: string | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
          weekly_class_id: string
        }
        Insert: {
          correct_index?: number | null
          created_at?: string
          explanation?: string | null
          explanation_am?: string | null
          explanation_en?: string | null
          helper_text?: string | null
          helper_text_am?: string | null
          helper_text_en?: string | null
          id: string
          order_index: number
          placeholder?: string | null
          placeholder_am?: string | null
          placeholder_en?: string | null
          prompt?: string | null
          prompt_am?: string | null
          prompt_en?: string | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
          weekly_class_id: string
        }
        Update: {
          correct_index?: number | null
          created_at?: string
          explanation?: string | null
          explanation_am?: string | null
          explanation_en?: string | null
          helper_text?: string | null
          helper_text_am?: string | null
          helper_text_en?: string | null
          id?: string
          order_index?: number
          placeholder?: string | null
          placeholder_am?: string | null
          placeholder_en?: string | null
          prompt?: string | null
          prompt_am?: string | null
          prompt_en?: string | null
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
          weekly_class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_weekly_class_id_fkey"
            columns: ["weekly_class_id"]
            isOneToOne: false
            referencedRelation: "weekly_classes"
            referencedColumns: ["id"]
          }
        ]
      }
      upcoming_mezmurs: {
        Row: {
          audio_url: string | null
          created_at: string
          id: string
          lyrics: string | null
          order_index: number
          title: string
          title_am: string | null
          title_en: string | null
          transliteration: string | null
          upcoming_timirit_id: string
          youtube_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          id?: string
          lyrics?: string | null
          order_index: number
          title: string
          title_am?: string | null
          title_en?: string | null
          transliteration?: string | null
          upcoming_timirit_id: string
          youtube_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          id?: string
          lyrics?: string | null
          order_index?: number
          title?: string
          title_am?: string | null
          title_en?: string | null
          transliteration?: string | null
          upcoming_timirit_id?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upcoming_mezmurs_upcoming_timirit_id_fkey"
            columns: ["upcoming_timirit_id"]
            isOneToOne: false
            referencedRelation: "upcoming_timirit"
            referencedColumns: ["id"]
          }
        ]
      }
      upcoming_timirit: {
        Row: {
          created_at: string
          created_by: string | null
          class_summary: string | null
          class_summary_am: string | null
          class_summary_en: string | null
          audio_title: string | null
          audio_url: string | null
          id: string
          is_active: boolean | null
          key_verse: string | null
          note: string | null
          note_am: string | null
          note_en: string | null
          organizer_note: string | null
          status: string | null
          scheduled_date: string
          topic_preview: string | null
          topic_preview_am: string | null
          topic_preview_en: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          class_summary?: string | null
          class_summary_am?: string | null
          class_summary_en?: string | null
          audio_title?: string | null
          audio_url?: string | null
          id?: string
          is_active?: boolean | null
          key_verse?: string | null
          note?: string | null
          note_am?: string | null
          note_en?: string | null
          organizer_note?: string | null
          status?: string | null
          scheduled_date: string
          topic_preview?: string | null
          topic_preview_am?: string | null
          topic_preview_en?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          class_summary?: string | null
          class_summary_am?: string | null
          class_summary_en?: string | null
          audio_title?: string | null
          audio_url?: string | null
          id?: string
          is_active?: boolean | null
          key_verse?: string | null
          note?: string | null
          note_am?: string | null
          note_en?: string | null
          organizer_note?: string | null
          status?: string | null
          scheduled_date?: string
          topic_preview?: string | null
          topic_preview_am?: string | null
          topic_preview_en?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upcoming_timirit_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_responses: {
        Row: {
          attendance_choice: Database["public"]["Enums"]["attendance_choice"] | null
          id: string
          question_id: string
          response_text: string | null
          selected_option_index: number | null
          submitted_at: string
          user_fingerprint: string | null
          weekly_class_id: string
        }
        Insert: {
          attendance_choice?: Database["public"]["Enums"]["attendance_choice"] | null
          id?: string
          question_id: string
          response_text?: string | null
          selected_option_index?: number | null
          submitted_at?: string
          user_fingerprint?: string | null
          weekly_class_id: string
        }
        Update: {
          attendance_choice?: Database["public"]["Enums"]["attendance_choice"] | null
          id?: string
          question_id?: string
          response_text?: string | null
          selected_option_index?: number | null
          submitted_at?: string
          user_fingerprint?: string | null
          weekly_class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_responses_weekly_class_id_fkey"
            columns: ["weekly_class_id"]
            isOneToOne: false
            referencedRelation: "weekly_classes"
            referencedColumns: ["id"]
          }
        ]
      }
      weekly_classes: {
        Row: {
          amharic_summary: string
          audio_note: string | null
          audio_title: string | null
          audio_url: string | null
          created_at: string
          created_by: string | null
          date: string
          english_summary: string
          id: string
          key_verse: string | null
          lesson_media_enabled: boolean | null
          organizer_note: string | null
          speaker: string
          status: string | null
          teaching_notes: string | null
          topic: string | null
          topic_am: string | null
          topic_en: string | null
          updated_at: string
          updated_by: string | null
          verses: Json | null
          youtube_url: string | null
        }
        Insert: {
          amharic_summary: string
          audio_note?: string | null
          audio_title?: string | null
          audio_url?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          english_summary: string
          id: string
          key_verse?: string | null
          lesson_media_enabled?: boolean | null
          organizer_note?: string | null
          speaker: string
          status?: string | null
          teaching_notes?: string | null
          topic?: string | null
          topic_am?: string | null
          topic_en?: string | null
          updated_at?: string
          updated_by?: string | null
          verses?: Json | null
          youtube_url?: string | null
        }
        Update: {
          amharic_summary?: string
          audio_note?: string | null
          audio_title?: string | null
          audio_url?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          english_summary?: string
          id?: string
          key_verse?: string | null
          lesson_media_enabled?: boolean | null
          organizer_note?: string | null
          speaker?: string
          status?: string | null
          teaching_notes?: string | null
          topic?: string | null
          topic_am?: string | null
          topic_en?: string | null
          updated_at?: string
          updated_by?: string | null
          verses?: Json | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_classes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      weekly_knowledge: {
        Row: {
          button_link: string | null
          button_text: string | null
          content: string | null
          content_am: string | null
          content_en: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          extra_note: string | null
          extra_note_am: string | null
          extra_note_en: string | null
          id: string
          image_url: string | null
          is_active: boolean
          start_date: string | null
          status: string
          subtitle: string | null
          subtitle_am: string | null
          subtitle_en: string | null
          title: string | null
          title_am: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          content?: string | null
          content_am?: string | null
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          extra_note?: string | null
          extra_note_am?: string | null
          extra_note_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          start_date?: string | null
          status?: string
          subtitle?: string | null
          subtitle_am?: string | null
          subtitle_en?: string | null
          title?: string | null
          title_am?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          content?: string | null
          content_am?: string | null
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          extra_note?: string | null
          extra_note_am?: string | null
          extra_note_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          start_date?: string | null
          status?: string
          subtitle?: string | null
          subtitle_am?: string | null
          subtitle_en?: string | null
          title?: string | null
          title_am?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_knowledge_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      anonymous_feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          status: string | null
          subject: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      review_sessions: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          created_at: string
          id: string
          question_count: number | null
          score_percent: number | null
          user_fingerprint: string | null
          weekly_class_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          id?: string
          question_count?: number | null
          score_percent?: number | null
          user_fingerprint?: string | null
          weekly_class_id: string
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          id?: string
          question_count?: number | null
          score_percent?: number | null
          user_fingerprint?: string | null
          weekly_class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_sessions_weekly_class_id_fkey"
            columns: ["weekly_class_id"]
            isOneToOne: false
            referencedRelation: "weekly_classes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_attendance_summary: {
        Args: {
          target_week_id: string
        }
        Returns: {
          attendance_choice: Database["public"]["Enums"]["attendance_choice"]
          choice_count: number
        }[]
      }
      get_organizer_analytics: {
        Args: {
          target_week_id: string
        }
        Returns: {
          week_id: string
          week_label: string
          total_responses: number
          reviewed_or_watched: number
          most_missed_question_id: string
          most_missed_question_label: string
          miss_rate_percent: number
          top_unclear_topics: Json
          language_difficulty_avg: number
        }[]
      }
    }
    Enums: {
      attendance_choice: "in-person" | "online" | "maybe" | "cannot-attend"
      question_type:
        | "multiple-choice"
        | "short-answer"
        | "reflection"
        | "feedback-open"
        | "attendance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}