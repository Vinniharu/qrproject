import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const headersList = await headers()
  
  try {
    const body = await request.json()
    const { session_id, student_name, student_email, student_id } = body

    // Validate required fields
    if (!session_id || !student_name || !student_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or inactive' },
        { status: 404 }
      )
    }

    // Check if student has already marked attendance for this session
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_email', student_email.toLowerCase())
      .single()

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Attendance already marked for this session' },
        { status: 409 }
      )
    }

    // Calculate lateness
    const now = new Date()
    const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`)
    
    let isLate = false
    let lateByMinutes = 0
    
    if (now > sessionDateTime) {
      const diffMs = now.getTime() - sessionDateTime.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      isLate = diffMinutes > 15 // Consider late if more than 15 minutes after start
      lateByMinutes = diffMinutes
    }

    // Get client IP for tracking (optional)
    const clientIp = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown'

    // Mark attendance
    const { data: attendanceRecord, error: markError } = await supabase
      .from('attendance_records')
      .insert({
        session_id,
        student_name: student_name.trim(),
        student_email: student_email.trim().toLowerCase(),
        student_id: student_id?.trim() || null,
        ip_address: clientIp,
        marked_at: new Date().toISOString(),
        is_late: isLate,
        late_by_minutes: lateByMinutes
      })
      .select()
      .single()

    if (markError) {
      console.error('Error marking attendance:', markError)
      return NextResponse.json(
        { error: 'Failed to mark attendance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        id: attendanceRecord.id,
        session: {
          title: session.title,
          course_code: session.course_code,
          session_date: session.session_date
        },
        marked_at: attendanceRecord.marked_at,
        is_late: isLate,
        late_by_minutes: lateByMinutes,
        status: isLate ? `Late (${lateByMinutes} minutes)` : 'On Time'
      }
    })
  } catch (error) {
    console.error('Error in attendance mark API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 