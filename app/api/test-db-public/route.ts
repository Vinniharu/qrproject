import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  console.log('Starting database table existence tests...')
  
  // Test 1: Check if user_profiles table exists
  let profilesExists = false
  let profilesError = null
  let profilesErrorCode = null
  
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('User profiles table error:', error.message, 'Code:', error.code)
      profilesError = error.message
      profilesErrorCode = error.code
    } else {
      profilesExists = true
      console.log('User profiles table exists')
    }
  } catch (err) {
    console.log('User profiles table check failed:', err)
    profilesError = 'Check failed'
  }
  
  // Test 2: Check if attendance_sessions table exists
  let sessionsExists = false
  let sessionsError = null
  let sessionsErrorCode = null
  
  try {
    const { error } = await supabase
      .from('attendance_sessions')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('Sessions table error:', error.message, 'Code:', error.code)
      sessionsError = error.message
      sessionsErrorCode = error.code
    } else {
      sessionsExists = true
      console.log('Sessions table exists')
    }
  } catch (err) {
    console.log('Sessions table check failed:', err)
    sessionsError = 'Check failed'
  }
  
  // Test 3: Check if attendance_records table exists
  let recordsExists = false
  let recordsError = null
  let recordsErrorCode = null
  
  try {
    const { error } = await supabase
      .from('attendance_records')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('Records table error:', error.message, 'Code:', error.code)
      recordsError = error.message
      recordsErrorCode = error.code
    } else {
      recordsExists = true
      console.log('Records table exists')
    }
  } catch (err) {
    console.log('Records table check failed:', err)
    recordsError = 'Check failed'
  }
  
  return NextResponse.json({
    success: true,
    message: 'Database table existence tests completed',
    results: {
      user_profiles: {
        exists: profilesExists,
        error: profilesError,
        errorCode: profilesErrorCode
      },
      attendance_sessions: {
        exists: sessionsExists,
        error: sessionsError,
        errorCode: sessionsErrorCode
      },
      attendance_records: {
        exists: recordsExists,
        error: recordsError,
        errorCode: recordsErrorCode
      }
    }
  })
} 