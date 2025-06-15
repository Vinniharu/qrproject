import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  console.log('=== Simple Attendance Mark API Called ===')
  
  try {
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      )
    }

    const { sessionId } = await params
    const body = await request.json()
    
    console.log('Session ID from params:', sessionId)
    console.log('Request body:', {
      student_name: body.student_name ? '[PROVIDED]' : '[MISSING]',
      student_email: body.student_email ? '[PROVIDED]' : '[MISSING]',
      student_id: body.student_id ? '[PROVIDED]' : '[MISSING]'
    })
    
    const { student_name, student_email, student_id } = body

    // Validate required fields
    if (!student_name || !student_email) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Student name and email are required' },
        { status: 400 }
      )
    }

    // Use service role client to bypass all RLS policies
    console.log('Creating Supabase service role client...')
    const supabase = createServiceRoleClient()
    
    console.log('Checking if session exists and is active...')
    
    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('id, title, course_code, session_date, start_time, is_active')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('Session not found:', sessionError)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.is_active) {
      console.log('Session is not active')
      return NextResponse.json(
        { error: 'This attendance session is no longer active' },
        { status: 400 }
      )
    }

    console.log('Session found and active:', session.title)

    // Check for duplicate attendance (by email or name for this session)
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId)
      .or(`student_email.eq.${student_email.trim().toLowerCase()},student_name.eq.${student_name.trim()}`)
      .maybeSingle()

    if (existingRecord) {
      console.log('Duplicate attendance detected')
      return NextResponse.json(
        { error: 'You have already marked attendance for this session' },
        { status: 409 }
      )
    }

    console.log('No duplicate found, creating attendance record...')

    // Calculate if student is late (15 minutes after start time)
    const now = new Date()
    const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`)
    const diffMinutes = Math.max(0, Math.floor((now.getTime() - sessionDateTime.getTime()) / (1000 * 60)))
    const isLate = diffMinutes > 15
    const lateByMinutes = isLate ? diffMinutes : 0

    // Create attendance record
    const attendanceData = {
      session_id: sessionId,
      student_name: student_name.trim(),
      student_email: student_email.trim().toLowerCase(),
      student_id: student_id?.trim() || null,
      marked_at: now.toISOString(),
      is_late: isLate,
      late_by_minutes: lateByMinutes
    }

    console.log('Inserting attendance record...')

    const { data: attendanceRecord, error: insertError } = await supabase
      .from('attendance_records')
      .insert(attendanceData)
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert attendance record:', insertError)
      return NextResponse.json(
        { error: 'Failed to mark attendance. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Attendance marked successfully:', attendanceRecord.id)

    // Return success response
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
        is_late: attendanceRecord.is_late,
        late_by_minutes: attendanceRecord.late_by_minutes,
        status: attendanceRecord.is_late ? `Late (${attendanceRecord.late_by_minutes} minutes)` : 'On Time'
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 