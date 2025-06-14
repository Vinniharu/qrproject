import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSessionData } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { id } = await params
  
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session details
    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .select(`
        *,
        profiles!attendance_sessions_lecturer_id_fkey (
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching session:', error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if user owns this session
    if (session.lecturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get attendance count
    const { count: attendanceCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', id)

    return NextResponse.json({
      session: {
        ...session,
        attendance_count: attendanceCount || 0
      }
    })
  } catch (error) {
    console.error('Error in GET /api/sessions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { id } = await params
  
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, course_code, session_date, start_time, end_time } = body

    // Validate required fields
    if (!title || !course_code || !session_date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if session exists and user owns it
    const { data: existingSession, error: fetchError } = await supabase
      .from('attendance_sessions')
      .select('lecturer_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (existingSession.lecturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the session
    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .update({
        title,
        description,
        course_code,
        session_date,
        start_time,
        end_time,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating session:', error)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in PUT /api/sessions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { id } = await params
  
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { is_active } = body

    // Check if session exists and user owns it
    const { data: existingSession, error: fetchError } = await supabase
      .from('attendance_sessions')
      .select('lecturer_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (existingSession.lecturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the session status
    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating session status:', error)
      return NextResponse.json(
        { error: 'Failed to update session status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      session,
      message: `Session ${is_active ? 'activated' : 'deactivated'} successfully` 
    })
  } catch (error) {
    console.error('Error in PATCH /api/sessions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { id } = await params
  
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if session exists and user owns it
    const { data: existingSession, error: fetchError } = await supabase
      .from('attendance_sessions')
      .select('lecturer_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (existingSession.lecturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete related attendance records first
    const { error: deleteRecordsError } = await supabase
      .from('attendance_records')
      .delete()
      .eq('session_id', id)

    if (deleteRecordsError) {
      console.error('Error deleting attendance records:', deleteRecordsError)
      return NextResponse.json(
        { error: 'Failed to delete related attendance records' },
        { status: 500 }
      )
    }

    // Delete the session
    const { error: deleteSessionError } = await supabase
      .from('attendance_sessions')
      .delete()
      .eq('id', id)

    if (deleteSessionError) {
      console.error('Error deleting session:', deleteSessionError)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Session deleted successfully' 
    })
  } catch (error) {
    console.error('Error in DELETE /api/sessions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 