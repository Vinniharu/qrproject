import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { id } = await params
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session details and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', id)
      .eq('lecturer_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Generate QR code for attendance
    const attendanceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/attendance/${id}`
    const qrCodeDataUrl = await QRCode.toDataURL(attendanceUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Optionally update session with QR code data
    const { error: updateError } = await supabase
      .from('attendance_sessions')
      .update({ qr_code_data: qrCodeDataUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating session with QR code:', updateError)
      // Continue anyway, as QR generation succeeded
    }

    return NextResponse.json({
      success: true,
      qr_code: qrCodeDataUrl,
      attendance_url: attendanceUrl,
      session: {
        id: session.id,
        title: session.title,
        course_code: session.course_code
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { id } = await params
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session details and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', id)
      .eq('lecturer_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if QR code already exists
    if (session.qr_code_data) {
      return NextResponse.json({
        success: true,
        qr_code: session.qr_code_data,
        attendance_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/attendance/${id}`,
        session: {
          id: session.id,
          title: session.title,
          course_code: session.course_code
        }
      })
    }

    // Generate new QR code if it doesn't exist
    const attendanceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/attendance/${id}`
    const qrCodeDataUrl = await QRCode.toDataURL(attendanceUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Update session with new QR code
    const { error: updateError } = await supabase
      .from('attendance_sessions')
      .update({ qr_code_data: qrCodeDataUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating session with QR code:', updateError)
      // Continue anyway, as QR generation succeeded
    }

    return NextResponse.json({
      success: true,
      qr_code: qrCodeDataUrl,
      attendance_url: attendanceUrl,
      session: {
        id: session.id,
        title: session.title,
        course_code: session.course_code
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