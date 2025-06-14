export interface AttendanceSession {
  id: string
  lecturer_id: string
  title: string
  description?: string
  course_code: string
  session_date: string
  start_time: string
  end_time: string
  qr_code_data: string
  is_active: boolean
  created_at: string
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_name: string
  student_email?: string
  student_id?: string
  marked_at: string
  is_late: boolean
  late_by_minutes: number
  ip_address?: string
  user_agent?: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  role: string
  created_at: string
}

export interface CreateSessionData {
  title: string
  description?: string
  course_code: string
  session_date: string
  start_time: string
  end_time: string
}

export interface MarkAttendanceData {
  session_id: string
  student_name: string
  student_email?: string
  student_id?: string
} 