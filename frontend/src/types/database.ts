export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role: string
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          key: string
          plan: string
          seats: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          key: string
          plan?: string
          seats?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          key?: string
          plan?: string
          seats?: number
          created_at?: string
          updated_at?: string
        }
      }
      applicants: {
        Row: {
          id: string
          company_id: string
          user_id?: string | null
          full_name: string
          email: string
          phone: string | null
          household_size?: number | null
          income?: number | null
          ami_percent?: number | null
          location_preference?: string | null
          latitude?: number | null
          longitude?: number | null
          status: string
          created_at: string
          updated_at: string
          preferences?: Json | null
        }
        Insert: {
          id?: string
          company_id: string
          user_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          household_size?: number | null
          income?: number | null
          ami_percent?: number | null
          location_preference?: string | null
          latitude?: number | null
          longitude?: number | null
          status?: string
          created_at?: string
          updated_at?: string
          preferences?: Json | null
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          household_size?: number | null
          income?: number | null
          ami_percent?: number | null
          location_preference?: string | null
          latitude?: number | null
          longitude?: number | null
          status?: string
          created_at?: string
          updated_at?: string
          preferences?: Json | null
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          user_id: string
          name: string
          description: string | null
          address: string
          city: string
          state: string
          zip_code: string
          latitude: number
          longitude: number
          total_units: number
          affordable_units: number
          ami_levels: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          name: string
          description?: string | null
          address: string
          city: string
          state: string
          zip_code: string
          latitude?: number
          longitude?: number
          total_units: number
          affordable_units: number
          ami_levels?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          name?: string
          description?: string | null
          address?: string
          city?: string
          state?: string
          zip_code?: string
          latitude?: number
          longitude?: number
          total_units?: number
          affordable_units?: number
          ami_levels?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          applicant_id: string
          project_id: string
          score: number
          reasons: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          applicant_id: string
          project_id: string
          score: number
          reasons?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          applicant_id?: string
          project_id?: string
          score?: number
          reasons?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      user_statistics_view: {
        Row: {
          user_id: string
          total_applicants: number
          total_projects: number
          total_matches: number
          avg_match_score: number
          applications: Json
          trends: Json
          demographics: Json
        }
      }
    }
    Functions: {
      match_projects: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          company_id: string
        }
        Returns: {
          project_id: string
          similarity: number
          reasons: Json
        }[]
      }
    }
  }
}