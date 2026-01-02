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
      agents: {
        Row: {
          created_at: string | null
          daily_budget_limit: number | null
          description: string | null
          enabled_tools_json: Json | null
          id: string
          is_active: boolean | null
          max_steps: number | null
          model_config_json: Json | null
          name: string
          risky_tools_json: Json | null
          system_prompt: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_budget_limit?: number | null
          description?: string | null
          enabled_tools_json?: Json | null
          id?: string
          is_active?: boolean | null
          max_steps?: number | null
          model_config_json?: Json | null
          name: string
          risky_tools_json?: Json | null
          system_prompt: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_budget_limit?: number | null
          description?: string | null
          enabled_tools_json?: Json | null
          id?: string
          is_active?: boolean | null
          max_steps?: number | null
          model_config_json?: Json | null
          name?: string
          risky_tools_json?: Json | null
          system_prompt?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
          is_fake: boolean | null
          is_validated: boolean | null
          key: string
          last_mentioned: string | null
          memory_type: string
          mention_count: number | null
          updated_at: string
          user_id: string
          validation_score: number | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          importance?: number | null
          is_fake?: boolean | null
          is_validated?: boolean | null
          key: string
          last_mentioned?: string | null
          memory_type: string
          mention_count?: number | null
          updated_at?: string
          user_id: string
          validation_score?: number | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          importance?: number | null
          is_fake?: boolean | null
          is_validated?: boolean | null
          key?: string
          last_mentioned?: string | null
          memory_type?: string
          mention_count?: number | null
          updated_at?: string
          user_id?: string
          validation_score?: number | null
          value?: Json
        }
        Relationships: []
      }
      approvals: {
        Row: {
          action_summary: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          reason: string | null
          risk_level: string | null
          run_id: string | null
          status: string
          tool_call_id: string
          user_id: string
        }
        Insert: {
          action_summary: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          risk_level?: string | null
          run_id?: string | null
          status?: string
          tool_call_id: string
          user_id: string
        }
        Update: {
          action_summary?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          risk_level?: string | null
          run_id?: string | null
          status?: string
          tool_call_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_tool_call_id_fkey"
            columns: ["tool_call_id"]
            isOneToOne: false
            referencedRelation: "tool_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_brain_runs: {
        Row: {
          completed_at: string | null
          entries_validated: number | null
          error_message: string | null
          id: string
          metrics: Json | null
          news_collected: number | null
          research_completed: number | null
          run_type: string
          started_at: string | null
          status: string | null
          topics_generated: number | null
        }
        Insert: {
          completed_at?: string | null
          entries_validated?: number | null
          error_message?: string | null
          id?: string
          metrics?: Json | null
          news_collected?: number | null
          research_completed?: number | null
          run_type: string
          started_at?: string | null
          status?: string | null
          topics_generated?: number | null
        }
        Update: {
          completed_at?: string | null
          entries_validated?: number | null
          error_message?: string | null
          id?: string
          metrics?: Json | null
          news_collected?: number | null
          research_completed?: number | null
          run_type?: string
          started_at?: string | null
          status?: string | null
          topics_generated?: number | null
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
          is_fake: boolean | null
          is_validated: boolean | null
          last_accessed: string | null
          relevance_score: number
          relevance_to_root: number | null
          research_topic_id: string | null
          root_topic_context: Json | null
          source: string
          topic: string
          updated_at: string
          user_id: string | null
          validated_at: string | null
          validation_consensus: Json | null
          validation_score: number | null
          validation_status: string | null
        }
        Insert: {
          access_count?: number
          category?: string
          confidence?: number
          content: Json
          created_at?: string
          id?: string
          is_fake?: boolean | null
          is_validated?: boolean | null
          last_accessed?: string | null
          relevance_score?: number
          relevance_to_root?: number | null
          research_topic_id?: string | null
          root_topic_context?: Json | null
          source?: string
          topic: string
          updated_at?: string
          user_id?: string | null
          validated_at?: string | null
          validation_consensus?: Json | null
          validation_score?: number | null
          validation_status?: string | null
        }
        Update: {
          access_count?: number
          category?: string
          confidence?: number
          content?: Json
          created_at?: string
          id?: string
          is_fake?: boolean | null
          is_validated?: boolean | null
          last_accessed?: string | null
          relevance_score?: number
          relevance_to_root?: number | null
          research_topic_id?: string | null
          root_topic_context?: Json | null
          source?: string
          topic?: string
          updated_at?: string
          user_id?: string | null
          validated_at?: string | null
          validation_consensus?: Json | null
          validation_score?: number | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_knowledge_entries_research_topic_id_fkey"
            columns: ["research_topic_id"]
            isOneToOne: false
            referencedRelation: "atlas_research_topics"
            referencedColumns: ["id"]
          },
        ]
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
      atlas_research_queue: {
        Row: {
          attempts: number | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          metadata: Json | null
          priority_score: number | null
          processing_started_at: string | null
          scheduled_for: string | null
          source: string
          status: string | null
          topic: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          priority_score?: number | null
          processing_started_at?: string | null
          scheduled_for?: string | null
          source?: string
          status?: string | null
          topic: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          priority_score?: number | null
          processing_started_at?: string | null
          scheduled_for?: string | null
          source?: string
          status?: string | null
          topic?: string
          updated_at?: string | null
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
          is_fake: boolean | null
          is_validated: boolean | null
          learning_session_id: string | null
          parent_id: string | null
          priority: number
          root_topic_context: Json | null
          sources: Json | null
          status: string
          topic: string
          updated_at: string
          user_id: string | null
          validation_score: number | null
        }
        Insert: {
          auto_generated?: boolean
          completed_at?: string | null
          created_at?: string
          depth_level?: number
          description?: string | null
          findings?: Json | null
          id?: string
          is_fake?: boolean | null
          is_validated?: boolean | null
          learning_session_id?: string | null
          parent_id?: string | null
          priority?: number
          root_topic_context?: Json | null
          sources?: Json | null
          status?: string
          topic: string
          updated_at?: string
          user_id?: string | null
          validation_score?: number | null
        }
        Update: {
          auto_generated?: boolean
          completed_at?: string | null
          created_at?: string
          depth_level?: number
          description?: string | null
          findings?: Json | null
          id?: string
          is_fake?: boolean | null
          is_validated?: boolean | null
          learning_session_id?: string | null
          parent_id?: string | null
          priority?: number
          root_topic_context?: Json | null
          sources?: Json | null
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string | null
          validation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_research_topics_learning_session_id_fkey"
            columns: ["learning_session_id"]
            isOneToOne: false
            referencedRelation: "atlas_learning_sessions"
            referencedColumns: ["id"]
          },
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
      events_inbox: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload_json: Json
          processed_at: string | null
          run_id: string | null
          source: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload_json: Json
          processed_at?: string | null
          run_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload_json?: Json
          processed_at?: string | null
          run_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_inbox_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_policies: {
        Row: {
          auto_prune: boolean | null
          category: string
          created_at: string | null
          id: string
          importance_threshold: number | null
          is_active: boolean | null
          policy_name: string
          retention_days: number | null
          should_remember: boolean | null
          user_id: string
        }
        Insert: {
          auto_prune?: boolean | null
          category: string
          created_at?: string | null
          id?: string
          importance_threshold?: number | null
          is_active?: boolean | null
          policy_name: string
          retention_days?: number | null
          should_remember?: boolean | null
          user_id: string
        }
        Update: {
          auto_prune?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          importance_threshold?: number | null
          is_active?: boolean | null
          policy_name?: string
          retention_days?: number | null
          should_remember?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      memory_synthesis_logs: {
        Row: {
          conflicts_resolved: number | null
          created_at: string
          details: Json | null
          duration_ms: number | null
          id: string
          input_count: number | null
          insights_extracted: number | null
          operation_type: string
          output_count: number | null
          user_id: string | null
        }
        Insert: {
          conflicts_resolved?: number | null
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          id?: string
          input_count?: number | null
          insights_extracted?: number | null
          operation_type: string
          output_count?: number | null
          user_id?: string | null
        }
        Update: {
          conflicts_resolved?: number | null
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          id?: string
          input_count?: number | null
          insights_extracted?: number | null
          operation_type?: string
          output_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      memory_vectors: {
        Row: {
          chunk_text: string
          created_at: string | null
          embedding: string | null
          id: string
          knowledge_entry_id: string | null
          memory_item_id: string | null
          source_ref_json: Json | null
          user_id: string
        }
        Insert: {
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          knowledge_entry_id?: string | null
          memory_item_id?: string | null
          source_ref_json?: Json | null
          user_id: string
        }
        Update: {
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          knowledge_entry_id?: string | null
          memory_item_id?: string | null
          source_ref_json?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_vectors_knowledge_entry_id_fkey"
            columns: ["knowledge_entry_id"]
            isOneToOne: false
            referencedRelation: "atlas_knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_vectors_memory_item_id_fkey"
            columns: ["memory_item_id"]
            isOneToOne: false
            referencedRelation: "ai_memory"
            referencedColumns: ["id"]
          },
        ]
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
      model_configs: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          max_tokens: number | null
          model_name: string
          temperature: number | null
          tier: Database["public"]["Enums"]["model_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          max_tokens?: number | null
          model_name: string
          temperature?: number | null
          tier: Database["public"]["Enums"]["model_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          max_tokens?: number | null
          model_name?: string
          temperature?: number | null
          tier?: Database["public"]["Enums"]["model_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      research_citations: {
        Row: {
          accessed_at: string | null
          citation_type: string | null
          created_at: string | null
          credibility_score: number | null
          domain: string | null
          id: string
          raw_json: Json | null
          research_topic_id: string | null
          run_id: string | null
          snippet: string | null
          title: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          citation_type?: string | null
          created_at?: string | null
          credibility_score?: number | null
          domain?: string | null
          id?: string
          raw_json?: Json | null
          research_topic_id?: string | null
          run_id?: string | null
          snippet?: string | null
          title?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          citation_type?: string | null
          created_at?: string | null
          credibility_score?: number | null
          domain?: string | null
          id?: string
          raw_json?: Json | null
          research_topic_id?: string | null
          run_id?: string | null
          snippet?: string | null
          title?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_citations_research_topic_id_fkey"
            columns: ["research_topic_id"]
            isOneToOne: false
            referencedRelation: "atlas_research_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_citations_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      run_steps: {
        Row: {
          created_at: string | null
          finished_at: string | null
          id: string
          input_json: Json | null
          kind: string
          model_tier: Database["public"]["Enums"]["model_tier"] | null
          model_used: string | null
          output_json: Json | null
          run_id: string
          started_at: string | null
          step_index: number
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          finished_at?: string | null
          id?: string
          input_json?: Json | null
          kind: string
          model_tier?: Database["public"]["Enums"]["model_tier"] | null
          model_used?: string | null
          output_json?: Json | null
          run_id: string
          started_at?: string | null
          step_index: number
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          finished_at?: string | null
          id?: string
          input_json?: Json | null
          kind?: string
          model_tier?: Database["public"]["Enums"]["model_tier"] | null
          model_used?: string | null
          output_json?: Json | null
          run_id?: string
          started_at?: string | null
          step_index?: number
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "run_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          agent_id: string
          cost_estimate: number | null
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          goal_text: string
          id: string
          plan_json: Json | null
          result_json: Json | null
          started_at: string | null
          status: string
          tokens_planner: number | null
          tokens_reasoner: number | null
          tokens_worker: number | null
          user_id: string
          verification_json: Json | null
        }
        Insert: {
          agent_id: string
          cost_estimate?: number | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          goal_text: string
          id?: string
          plan_json?: Json | null
          result_json?: Json | null
          started_at?: string | null
          status?: string
          tokens_planner?: number | null
          tokens_reasoner?: number | null
          tokens_worker?: number | null
          user_id: string
          verification_json?: Json | null
        }
        Update: {
          agent_id?: string
          cost_estimate?: number | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          goal_text?: string
          id?: string
          plan_json?: Json | null
          result_json?: Json | null
          started_at?: string | null
          status?: string
          tokens_planner?: number | null
          tokens_reasoner?: number | null
          tokens_worker?: number | null
          user_id?: string
          verification_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          agent_id: string
          created_at: string | null
          cron_expression: string
          description: string | null
          enabled: boolean | null
          id: string
          last_run_at: string | null
          last_run_id: string | null
          last_run_status: string | null
          name: string
          next_run_at: string | null
          payload_json: Json | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          cron_expression: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          last_run_id?: string | null
          last_run_status?: string | null
          name: string
          next_run_at?: string | null
          payload_json?: Json | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          cron_expression?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          last_run_id?: string | null
          last_run_status?: string | null
          name?: string
          next_run_at?: string | null
          payload_json?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_last_run_id_fkey"
            columns: ["last_run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      session_context: {
        Row: {
          confidence: number | null
          content: Json
          context_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          content: Json
          context_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          content?: Json
          context_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tool_calls: {
        Row: {
          args_json: Json
          completed_at: string | null
          cost_estimate: number | null
          created_at: string | null
          error_message: string | null
          id: string
          requires_approval: boolean | null
          result_json: Json | null
          run_id: string | null
          sandboxed: boolean | null
          status: string
          step_id: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          args_json?: Json
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          requires_approval?: boolean | null
          result_json?: Json | null
          run_id?: string | null
          sandboxed?: boolean | null
          status?: string
          step_id?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          args_json?: Json
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          requires_approval?: boolean | null
          result_json?: Json | null
          run_id?: string | null
          sandboxed?: boolean | null
          status?: string
          step_id?: string | null
          tool_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_calls_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_calls_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "run_steps"
            referencedColumns: ["id"]
          },
        ]
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
      validation_logs: {
        Row: {
          confidence: number
          created_at: string
          entry_id: string
          entry_type: string
          id: string
          processing_time_ms: number | null
          reasoning: string | null
          sources_checked: Json | null
          validator_model: string
          verdict: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          entry_id: string
          entry_type: string
          id?: string
          processing_time_ms?: number | null
          reasoning?: string | null
          sources_checked?: Json | null
          validator_model: string
          verdict: string
        }
        Update: {
          confidence?: number
          created_at?: string
          entry_id?: string
          entry_type?: string
          id?: string
          processing_time_ms?: number | null
          reasoning?: string | null
          sources_checked?: Json | null
          validator_model?: string
          verdict?: string
        }
        Relationships: []
      }
      workspace_settings: {
        Row: {
          auto_approve_low_risk: boolean | null
          created_at: string | null
          daily_budget_limit: number | null
          daily_run_limit: number | null
          daily_tool_call_limit: number | null
          id: string
          require_approval_for_risky: boolean | null
          settings_json: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_approve_low_risk?: boolean | null
          created_at?: string | null
          daily_budget_limit?: number | null
          daily_run_limit?: number | null
          daily_tool_call_limit?: number | null
          id?: string
          require_approval_for_risky?: boolean | null
          settings_json?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_approve_low_risk?: boolean | null
          created_at?: string | null
          daily_budget_limit?: number | null
          daily_run_limit?: number | null
          daily_tool_call_limit?: number | null
          id?: string
          require_approval_for_risky?: boolean | null
          settings_json?: Json | null
          updated_at?: string | null
          user_id?: string
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
      match_brain_vectors: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          id: string
          knowledge_entry_id: string
          memory_item_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      model_tier: "planner" | "worker" | "reasoner"
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
      model_tier: ["planner", "worker", "reasoner"],
    },
  },
} as const
