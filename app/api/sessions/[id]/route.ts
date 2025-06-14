import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSessionData } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const sessionId = params.id

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // For public access (students), only return basic session info if active
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.id !== session.lecturer_id) {
      // Public access - only return basic info for active sessions
      if (!session.is_active) {
        return NextResponse.json(
          { error: 'Session not found or inactive' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: {
          id: session.id,
          title: session.title,
          description: session.description,
          course_code: session.course_code,
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          is_active: session.is_active
        }
      })
    }

    // Lecturer access - return full details with attendance records
    const { data: attendanceRecords, error: recordsError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('marked_at', { ascending: false })

    if (recordsError) {
      console.error('Error fetching attendance records:', recordsError)
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        session,
        attendance_records: attendanceRecords || []
      }
    })

  } catch (error) {
    console.error('Error in get session API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const sessionId = params.id
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Update session request body:', body)
    
    // Validate session data
    const validation = validateSessionData(body)
    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Check if session exists and user owns it
    const { data: existingSession, error: checkError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('lecturer_id', user.id)
      .single()

    if (checkError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update session with new data
    const { data: session, error: updateError } = await supabase
      .from('attendance_sessions')
      .update({
        title: body.title,
        description: body.description || null,
        course_code: body.course_code,
        session_date: body.session_date,
        start_time: body.start_time,
        end_time: body.end_time
      })
      .eq('id', sessionId)
      .eq('lecturer_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating session:', updateError)
      return NextResponse.json(
        { error: 'Failed to update session', details: updateError.message },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    console.log('Session updated successfully:', session)

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session: session
    })

  } catch (error) {
    console.error('Error in update session API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const sessionId = params.id
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { is_active } = body

    // Update session (only allow toggling active status for now)
    const { data: session, error: updateError } = await supabase
      .from('attendance_sessions')
      .update({ is_active })
      .eq('id', sessionId)
      .eq('lecturer_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating session:', updateError)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      data: session
    })

  } catch (error) {
    console.error('Error in update session API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const sessionId = params.id
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if session exists and user owns it
    const { data: existingSession, error: checkError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('lecturer_id', user.id)
      .single()

    if (checkError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete related attendance records first (cascade delete)
    const { error: deleteRecordsError } = await supabase
      .from('attendance_records')
      .delete()
      .eq('session_id', sessionId)

    if (deleteRecordsError) {
      console.error('Error deleting attendance records:', deleteRecordsError)
      return NextResponse.json(
        { error: 'Failed to delete attendance records' },
        { status: 500 }
      )
    }

    // Delete the session
    const { error: deleteSessionError } = await supabase
      .from('attendance_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('lecturer_id', user.id)

    if (deleteSessionError) {
      console.error('Error deleting session:', deleteSessionError)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    console.log('Session deleted successfully:', sessionId)

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    })

  } catch (error) {
    console.error('Error in delete session API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 