import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSessionData } from '@/lib/validations'
import { generateSessionId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id, user.email)

    const body = await request.json()
    console.log('Request body:', body)
    
    // Validate session data
    const validation = validateSessionData(body)
    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Check if user profile exists, create if not
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileCheckError && profileCheckError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('Creating profile for user:', user.id)
      const { error: profileCreateError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          role: 'lecturer'
        })

      if (profileCreateError) {
        console.error('Profile creation error:', profileCreateError)
        return NextResponse.json(
          { error: 'Failed to create user profile', details: profileCreateError.message },
          { status: 500 }
        )
      }
      console.log('Profile created successfully')
    } else if (profileCheckError) {
      console.error('Profile check error:', profileCheckError)
      return NextResponse.json(
        { error: 'Failed to verify user profile', details: profileCheckError.message },
        { status: 500 }
      )
    }

    // Generate QR code data (unique identifier for the session)
    const qrCodeData = generateSessionId()
    
    console.log('Creating session with data:', {
      lecturer_id: user.id,
      title: body.title,
      description: body.description || null,
      course_code: body.course_code,
      session_date: body.session_date,
      start_time: body.start_time,
      end_time: body.end_time,
      qr_code_data: qrCodeData,
      is_active: true
    })

    // Create session in database - let the database auto-generate the id
    const { data: session, error: createError } = await supabase
      .from('attendance_sessions')
      .insert({
        lecturer_id: user.id,
        title: body.title,
        description: body.description || null,
        course_code: body.course_code,
        session_date: body.session_date,
        start_time: body.start_time,
        end_time: body.end_time,
        qr_code_data: qrCodeData,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Session creation error:', createError)
      console.error('Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      })
      return NextResponse.json(
        { error: 'Failed to create session', details: createError.message },
        { status: 500 }
      )
    }

    console.log('Session created successfully:', session)

    return NextResponse.json({
      success: true,
      session: session
    })
  } catch (error) {
    console.error('Error in session create API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 