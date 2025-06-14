export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateSessionData(data: {
  title: string
  course_code: string
  session_date: string
  start_time: string
  end_time: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.title.trim()) {
    errors.push('Title is required')
  }

  if (!data.course_code.trim()) {
    errors.push('Course code is required')
  }

  if (!data.session_date) {
    errors.push('Session date is required')
  }

  if (!data.start_time) {
    errors.push('Start time is required')
  }

  if (!data.end_time) {
    errors.push('End time is required')
  }

  if (data.start_time && data.end_time && data.start_time >= data.end_time) {
    errors.push('End time must be after start time')
  }

  const sessionDate = new Date(data.session_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (sessionDate < today) {
    errors.push('Session date cannot be in the past')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateAttendanceData(data: {
  student_name: string
  student_email?: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.student_name.trim()) {
    errors.push('Student name is required')
  }

  if (data.student_email && !validateEmail(data.student_email)) {
    errors.push('Invalid email format')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
} 