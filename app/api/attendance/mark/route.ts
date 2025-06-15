import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const headersList = await headers()
  
  console.log('=== Attendance Mark API Called ===')
  console.log('Environment check:', {
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV
  })
  
  try {
    const body = await request.json()
    console.log('Request body received:', {
      session_id: body.session_id,
      student_name: body.student_name ? '[PROVIDED]' : '[MISSING]',
      student_email: body.student_email ? '[PROVIDED]' : '[MISSING]',
      student_id: body.student_id ? '[PROVIDED]' : '[MISSING]'
    })
    
    const { session_id, student_name, student_email, student_id } = body

    // Validate required fields
    if (!session_id || !student_name || !student_email) {
      console.log('Validation failed - missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Checking session existence and status...')
    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('is_active', true)
      .single()

    if (sessionError) {
      console.error('Session query error:', sessionError)
      return NextResponse.json(
        { error: 'Session not found or inactive' },
        { status: 404 }
      )
    }

    if (!session) {
      console.log('Session not found or inactive')
      return NextResponse.json(
        { error: 'Session not found or inactive' },
        { status: 404 }
      )
    }

    console.log('Session found:', {
      id: session.id,
      title: session.title,
      is_active: session.is_active
    })

    // Try to use service role client, fallback to regular client
    let dbClient = supabase
    let usingServiceRole = false
    
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('Creating service role client...')
        dbClient = createServiceRoleClient()
        usingServiceRole = true
        console.log('Service role client created successfully')
      } else {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using regular client')
      }
    } catch (error) {
      console.error('Failed to create service role client:', error)
      console.warn('Falling back to regular client')
    }

    console.log('Database client info:', {
      usingServiceRole,
      clientType: usingServiceRole ? 'service_role' : 'anon'
    })

    console.log('Checking for existing attendance record...')
    // Check if student has already marked attendance for this session
    const { data: existingRecord, error: checkError } = await dbClient
      .from('attendance_records')
      .select('id')
      .eq('session_id', session_id)
      .or(`student_email.eq.${student_email.toLowerCase()},student_name.eq.${student_name.trim()}`)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing records:', checkError)
    }

    if (existingRecord) {
      console.log('Duplicate attendance found:', existingRecord.id)
      return NextResponse.json(
        { error: 'Attendance already marked for this session' },
        { status: 409 }
      )
    }

    console.log('No existing record found, proceeding with attendance marking...')

    // Get client IP for tracking (optional)
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    headersList.get('x-real-ip') || 
                    null

    console.log('Client IP:', clientIp || 'Not available')

    const attendanceData = {
      session_id,
      student_name: student_name.trim(),
      student_email: student_email.trim().toLowerCase(),
      student_id: student_id?.trim() || null,
      ip_address: clientIp,
      marked_at: new Date().toISOString()
    }

    console.log('Inserting attendance record:', {
      ...attendanceData,
      student_name: '[PROVIDED]',
      student_email: '[PROVIDED]',
      student_id: attendanceData.student_id ? '[PROVIDED]' : null
    })

    // Mark attendance - let the database trigger calculate lateness
    const { data: attendanceRecord, error: markError } = await dbClient
      .from('attendance_records')
      .insert(attendanceData)
      .select()
      .single()

    if (markError) {
      console.error('Error marking attendance:', {
        code: markError.code,
        message: markError.message,
        details: markError.details,
        hint: markError.hint
      })
      
      // If it's an RLS policy error, provide helpful message
      if (markError.code === '42501' || markError.message?.includes('policy')) {
        console.error('RLS Policy Error - Service role key likely missing or invalid')
        return NextResponse.json(
          { 
            error: 'Database permission error. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured in environment variables.',
            details: markError.message,
            debug: {
              usingServiceRole,
              hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
              errorCode: markError.code
            }
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to mark attendance', 
          details: markError.message,
          debug: {
            usingServiceRole,
            errorCode: markError.code
          }
        },
        { status: 500 }
      )
    }

    console.log('Attendance marked successfully:', {
      id: attendanceRecord.id,
      is_late: attendanceRecord.is_late,
      late_by_minutes: attendanceRecord.late_by_minutes
    })

    const response = {
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
    }

    console.log('Sending success response')
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Unexpected error in attendance mark API:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          timestamp: new Date().toISOString(),
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      },
      { status: 500 }
    )
  }
} 