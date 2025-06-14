import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('Testing database connection...')
    
    // Test 1: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: authError.message
      })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user'
      })
    }

    console.log('User authenticated:', user.id, user.email)

    // Test 2: Check if profiles table exists and user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('Profile check result:', { profile, profileError })

    // Test 3: Check if attendance_sessions table exists
    const { data: sessions, error: sessionsError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .limit(1)

    console.log('Sessions table check result:', { sessions, sessionsError })

    // Test 4: Check if attendance_records table exists
    const { data: records, error: recordsError } = await supabase
      .from('attendance_records')
      .select('*')
      .limit(1)

    console.log('Records table check result:', { records, recordsError })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      tables: {
        profiles: {
          exists: !profileError || profileError.code !== 'PGRST106',
          userProfile: profile,
          error: profileError?.message
        },
        attendance_sessions: {
          exists: !sessionsError || sessionsError.code !== 'PGRST106',
          error: sessionsError?.message
        },
        attendance_records: {
          exists: !recordsError || recordsError.code !== 'PGRST106',
          error: recordsError?.message
        }
      }
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