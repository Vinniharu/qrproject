import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAttendanceData } from '@/lib/validations'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { session_id, student_name, student_email, student_id } = body

    // Validate input data
    const validation = validateAttendanceData({
      student_name,
      student_email
    })

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
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
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_name', student_name)
      .single()

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Attendance already marked for this session' },
        { status: 409 }
      )
    }

    // Get client IP and user agent for tracking
    const headersList = headers()
    const ip_address = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      request.ip || 
                      'unknown'
    const user_agent = headersList.get('user-agent') || 'unknown'

    // Mark attendance
    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        session_id,
        student_name,
        student_email: student_email || null,
        student_id: student_id || null,
        ip_address,
        user_agent
      })
      .select()
      .single()

    if (attendanceError) {
      console.error('Error marking attendance:', attendanceError)
      return NextResponse.json(
        { error: 'Failed to mark attendance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendanceRecord
    })

  } catch (error) {
    console.error('Error in mark attendance API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 