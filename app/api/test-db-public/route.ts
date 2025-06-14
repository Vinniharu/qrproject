import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('Testing database tables (public)...')
    
    // Test 1: Check if profiles table exists
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    console.log('Profiles table test:', { profilesError })

    // Test 2: Check if attendance_sessions table exists
    const { data: sessionsTest, error: sessionsError } = await supabase
      .from('attendance_sessions')
      .select('id')
      .limit(1)

    console.log('Sessions table test:', { sessionsError })

    // Test 3: Check if attendance_records table exists
    const { data: recordsTest, error: recordsError } = await supabase
      .from('attendance_records')
      .select('id')
      .limit(1)

    console.log('Records table test:', { recordsError })

    return NextResponse.json({
      success: true,
      tables: {
        profiles: {
          exists: !profilesError || (profilesError.code !== 'PGRST106' && profilesError.code !== '42P01'),
          error: profilesError?.message,
          code: profilesError?.code
        },
        attendance_sessions: {
          exists: !sessionsError || (sessionsError.code !== 'PGRST106' && sessionsError.code !== '42P01'),
          error: sessionsError?.message,
          code: sessionsError?.code
        },
        attendance_records: {
          exists: !recordsError || (recordsError.code !== 'PGRST106' && recordsError.code !== '42P01'),
          error: recordsError?.message,
          code: recordsError?.code
        }
      },
      message: 'Database table existence check completed'
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 