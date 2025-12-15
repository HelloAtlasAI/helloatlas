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
      ai_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          insight_type: string
          is_read: boolean | null
          is_spoken: boolean | null
          priority: number | null
          related_event_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          is_spoken?: boolean | null
          priority?: number | null
          related_event_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          is_spoken?: boolean | null
          priority?: number | null
          related_event_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "user_life_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memory: {
        Row: {
          category: string
          created_at: string
          id: string
          importance: number | null
          key: string
          last_mentioned: string | null
          memory_type: string
          mention_count: number | null
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          importance?: number | null
          key: string
          last_mentioned?: string | null
          memory_type: string
          mention_count?: number | null
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          importance?: number | null
          key?: string
          last_mentioned?: string | null
          memory_type?: string
          mention_count?: number | null
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      atlas_error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          error_type: string
          id: string
          resolved: boolean
          severity: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          resolved?: boolean
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      atlas_health_metrics: {
        Row: {
          context: Json | null
          id: string
          metric_type: string
          recorded_at: string
          value: number
        }
        Insert: {
          context?: Json | null
          id?: string
          metric_type: string
          recorded_at?: string
          value: number
        }
        Update: {
          context?: Json | null
          id?: string
          metric_type?: string
          recorded_at?: string
          value?: number
        }
        Relationships: []
      }
      atlas_knowledge_entries: {
        Row: {
          access_count: number
          category: string
          confidence: number
          content: Json
          created_at: string
          id: string
          last_accessed: string | null
          relevance_score: number
          source: string
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_count?: number
          category?: string
          confidence?: number
          content: Json
          created_at?: string
          id?: string
          last_accessed?: string | null
          relevance_score?: number
          source?: string
          topic: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_count?: number
          category?: string
          confidence?: number
          content?: Json
          created_at?: string
          id?: string
          last_accessed?: string | null
          relevance_score?: number
          source?: string
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      atlas_learning_sessions: {
        Row: {
          created_at: string
          discoveries: Json | null
          ended_at: string | null
          id: string
          mode: string
          status: string
          topic: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discoveries?: Json | null
          ended_at?: string | null
          id?: string
          mode?: string
          status?: string
          topic: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discoveries?: Json | null
          ended_at?: string | null
          id?: string
          mode?: string
          status?: string
          topic?: string
          user_id?: string | null
        }
        Relationships: []
      }
      atlas_research_topics: {
        Row: {
          auto_generated: boolean
          completed_at: string | null
          created_at: string
          depth_level: number
          description: string | null
          findings: Json | null
          id: string
          parent_id: string | null
          priority: number
          sources: Json | null
          status: string
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_generated?: boolean
          completed_at?: string | null
          created_at?: string
          depth_level?: number
          description?: string | null
          findings?: Json | null
          id?: string
          parent_id?: string | null
          priority?: number
          sources?: Json | null
          status?: string
          topic: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_generated?: boolean
          completed_at?: string | null
          created_at?: string
          depth_level?: number
          description?: string | null
          findings?: Json | null
          id?: string
          parent_id?: string | null
          priority?: number
          sources?: Json | null
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_research_topics_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "atlas_research_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_synced: string | null
          source_name: string
          source_type: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced?: string | null
          source_name: string
          source_type: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced?: string | null
          source_name?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
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
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          communication_style: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          nickname: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          communication_style?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          nickname?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          communication_style?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          nickname?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          attendees: Json | null
          created_at: string
          description: string | null
          end_time: string | null
          event_type: string | null
          id: string
          location: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_life_events: {
        Row: {
          created_at: string
          description: string
          event_date: string
          event_type: string
          follow_up_after: string | null
          id: string
          is_recurring: boolean | null
          people_involved: Json | null
          sentiment: string | null
          should_follow_up: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_date: string
          event_type: string
          follow_up_after?: string | null
          id?: string
          is_recurring?: boolean | null
          people_involved?: Json | null
          sentiment?: string | null
          should_follow_up?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_date?: string
          event_type?: string
          follow_up_after?: string | null
          id?: string
          is_recurring?: boolean | null
          people_involved?: Json | null
          sentiment?: string | null
          should_follow_up?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          due_date: string | null
          id: string
          priority: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string
          id: string
          name: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      user_weather_settings: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string
          id: string
          lat: number | null
          lon: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lon?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lon?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
