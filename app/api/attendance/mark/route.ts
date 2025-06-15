import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
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

    if (sessionError) {
      return NextResponse.json(
        { error: 'Session not found or inactive' },
        { status: 404 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or inactive' },
        { status: 404 }
      )
    }

    // Try to use service role client, fallback to regular client
    let dbClient = supabase
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        dbClient = createServiceRoleClient()
      }
    } catch (error) {
      console.warn('Service role client not available, using regular client')
    }

    // Check if student has already marked attendance for this session
    const { data: existingRecord, error: checkError } = await dbClient
      .from('attendance_records')
      .select('id')
      .eq('session_id', session_id)
      .or(`student_email.eq.${student_email.toLowerCase()},student_name.eq.${student_name.trim()}`)
      .maybeSingle()

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Attendance already marked for this session' },
        { status: 409 }
      )
    }

    // Get client IP for tracking (optional)
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    headersList.get('x-real-ip') || 
                    null

    // Mark attendance - let the database trigger calculate lateness
    const { data: attendanceRecord, error: markError } = await dbClient
      .from('attendance_records')
      .insert({
        session_id,
        student_name: student_name.trim(),
        student_email: student_email.trim().toLowerCase(),
        student_id: student_id?.trim() || null,
        ip_address: clientIp,
        marked_at: new Date().toISOString()
      })
      .select()
      .single()

    if (markError) {
      console.error('Error marking attendance:', markError)
      
      // If it's an RLS policy error, provide helpful message
      if (markError.code === '42501' || markError.message?.includes('policy')) {
        return NextResponse.json(
          { 
            error: 'Database permission error. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured in environment variables.',
            details: markError.message 
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to mark attendance', details: markError.message },
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
        is_late: attendanceRecord.is_late,
        late_by_minutes: attendanceRecord.late_by_minutes,
        status: attendanceRecord.is_late ? `Late (${attendanceRecord.late_by_minutes} minutes)` : 'On Time'
      }
    })
  } catch (error) {
    console.error('Error in attendance mark API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 