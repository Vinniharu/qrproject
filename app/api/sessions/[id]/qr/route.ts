import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

export async function POST(
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

    // Get session details and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('lecturer_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    // Generate attendance URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const attendanceUrl = `${baseUrl}/attendance/${sessionId}`
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(attendanceUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })

    // Update session with QR code data URL (optional - for caching)
    const { error: updateError } = await supabase
      .from('attendance_sessions')
      .update({ 
        qr_code_data: qrCodeDataUrl // Store the data URL for quick access
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session with QR code:', updateError)
      // Don't fail the request if we can't update the session
    }

    return NextResponse.json({
      success: true,
      qr_code: qrCodeDataUrl,
      attendance_url: attendanceUrl,
      session: {
        id: session.id,
        title: session.title,
        course_code: session.course_code,
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time
      }
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

export async function GET(
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

    // Get session details and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('lecturer_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    // If QR code already exists, return it
    if (session.qr_code_data) {
      const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const attendanceUrl = `${baseUrl}/attendance/${sessionId}`
      
      return NextResponse.json({
        success: true,
        qr_code: session.qr_code_data,
        attendance_url: attendanceUrl,
        session: {
          id: session.id,
          title: session.title,
          course_code: session.course_code,
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time
        }
      })
    }

    // If no QR code exists, generate one
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const attendanceUrl = `${baseUrl}/attendance/${sessionId}`
    
    const qrCodeDataUrl = await QRCode.toDataURL(attendanceUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })

    // Update session with QR code
    const { error: updateError } = await supabase
      .from('attendance_sessions')
      .update({ 
        qr_code_data: qrCodeDataUrl
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session with QR code:', updateError)
    }

    return NextResponse.json({
      success: true,
      qr_code: qrCodeDataUrl,
      attendance_url: attendanceUrl,
      session: {
        id: session.id,
        title: session.title,
        course_code: session.course_code,
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time
      }
    })

  } catch (error) {
    console.error('Error getting QR code:', error)
    return NextResponse.json(
      { error: 'Failed to get QR code' },
      { status: 500 }
    )
  }
} 