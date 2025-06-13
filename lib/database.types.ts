export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: string
          status: string
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category: string
          status: string
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: string
          status?: string
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      technical_logs: {
        Row: {
          id: string
          user_id: string
          title: string
          system: string
          description: string
          resolution: string
          outcome: string
          tags: string[]
          images: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          system: string
          description: string
          resolution: string
          outcome: string
          tags?: string[]
          images?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          system?: string
          description?: string
          resolution?: string
          outcome?: string
          tags?: string[]
          images?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      improvement_projects: {
        Row: {
          id: string
          user_id: string
          title: string
          objective: string
          system: string
          status: string
          timeline: string
          contractor_involved: boolean
          results: string
          images: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          objective: string
          system: string
          status: string
          timeline: string
          contractor_involved?: boolean
          results?: string
          images?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          objective?: string
          system?: string
          status?: string
          timeline?: string
          contractor_involved?: boolean
          results?: string
          images?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      skills_analysis: {
        Row: {
          id: string
          user_id: string
          analysis_date: string
          report_type: string
          date_range: string
          start_date: string | null
          end_date: string | null
          skills: Json
          suggestions: Json
          data_summary: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          analysis_date?: string
          report_type: string
          date_range: string
          start_date?: string | null
          end_date?: string | null
          skills?: Json
          suggestions?: Json
          data_summary?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          analysis_date?: string
          report_type?: string
          date_range?: string
          start_date?: string | null
          end_date?: string | null
          skills?: Json
          suggestions?: Json
          data_summary?: Json
          created_at?: string
          updated_at?: string
        }
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
  }
}
