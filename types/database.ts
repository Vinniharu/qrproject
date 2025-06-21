export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
      }
      attendance_sessions: {
        Row: {
          id: string
          lecturer_id: string
          title: string
          description: string | null
          course_code: string
          session_date: string
          start_time: string
          end_time: string
          qr_code_data: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lecturer_id: string
          title: string
          description?: string | null
          course_code: string
          session_date: string
          start_time: string
          end_time: string
          qr_code_data: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lecturer_id?: string
          title?: string
          description?: string | null
          course_code?: string
          session_date?: string
          start_time?: string
          end_time?: string
          qr_code_data?: string
          is_active?: boolean
          created_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          student_name: string
          student_email: string | null
          student_id: string | null
          marked_at: string
          is_late: boolean
          late_by_minutes: number
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          session_id: string
          student_name: string
          student_email?: string | null
          student_id?: string | null
          marked_at?: string
          is_late?: boolean
          late_by_minutes?: number
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          student_name?: string
          student_email?: string | null
          student_id?: string | null
          marked_at?: string
          is_late?: boolean
          late_by_minutes?: number
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
  }
} 