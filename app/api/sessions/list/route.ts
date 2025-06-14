import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get sessions for the authenticated lecturer
    const { data: sessions, error: sessionsError } = await supabase
      .from('attendance_sessions')
      .select(`
        *,
        attendance_records(count)
      `)
      .eq('lecturer_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // Transform the data to include attendance count
    const sessionsWithCount = sessions.map(session => ({
      ...session,
      attendance_count: session.attendance_records?.length || 0,
      attendance_records: undefined // Remove the nested data
    }))

    return NextResponse.json({
      success: true,
      data: sessionsWithCount
    })

  } catch (error) {
    console.error('Error in list sessions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 