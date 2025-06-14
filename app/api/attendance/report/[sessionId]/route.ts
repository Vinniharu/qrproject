import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createClient()
    const sessionId = params.sessionId
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get session details
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

    // Get attendance records
    const { data: records, error: recordsError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('marked_at', { ascending: true })

    if (recordsError) {
      console.error('Error fetching attendance records:', recordsError)
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      )
    }

    // Generate PDF
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('Attendance Report', 20, 20)
    
    // Session details
    doc.setFontSize(12)
    doc.text(`Session: ${session.title}`, 20, 35)
    doc.text(`Course: ${session.course_code}`, 20, 45)
    doc.text(`Date: ${formatDate(session.session_date)}`, 20, 55)
    doc.text(`Time: ${formatTime(session.start_time)} - ${formatTime(session.end_time)}`, 20, 65)
    
    if (session.description) {
      doc.text(`Description: ${session.description}`, 20, 75)
    }

    // Statistics
    const onTimeCount = records?.filter(r => !r.is_late).length || 0
    const lateCount = records?.filter(r => r.is_late).length || 0
    const totalCount = records?.length || 0
    
    doc.text(`Total Students: ${totalCount}`, 20, 85)
    doc.text(`On Time: ${onTimeCount}`, 20, 95)
    doc.text(`Late: ${lateCount}`, 20, 105)
    doc.text(`Attendance Rate: ${totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 0}%`, 20, 115)

    // Attendance table
    if (records && records.length > 0) {
      const tableData = records.map((record, index) => [
        index + 1,
        record.student_name,
        record.student_email || '-',
        record.student_id || '-',
        formatDateTime(record.marked_at),
        record.is_late ? `Late (${record.late_by_minutes} min)` : 'On Time'
      ])

      doc.autoTable({
        startY: 130,
        head: [['#', 'Name', 'Email', 'Student ID', 'Time Marked', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 40 },
          2: { cellWidth: 45 },
          3: { cellWidth: 25 },
          4: { cellWidth: 35 },
          5: { cellWidth: 30 }
        }
      })
    } else {
      doc.text('No attendance records found.', 20, 140)
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      )
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="attendance-${session.course_code}-${session.session_date}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    )
  }
} 