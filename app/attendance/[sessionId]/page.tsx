'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AttendanceForm } from '@/components/attendance/AttendanceForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface Session {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  status: 'active' | 'ended'
  lecturer: {
    full_name: string
    email: string
  }
}

interface AttendanceStatus {
  isMarked: boolean
  studentName?: string
  markedAt?: string
}

export default function AttendancePage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<Session | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({ isMarked: false })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const fetchSession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          lecturers!lecturer_id (
            full_name,
            email
          )
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          setError('Session not found')
        } else {
          setError('Failed to load session details')
        }
        return
      }

      if (!sessionData) {
        setError('Session not found')
        return
      }

      setSession({
        ...sessionData,
        lecturer: sessionData.lecturers
      })

      // Check if session is still active
      if (sessionData.status === 'ended') {
        setError('This attendance session has ended')
        return
      }

    } catch (error) {
      console.error('Error fetching session:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttendanceMarked = (studentName: string) => {
    setAttendanceStatus({
      isMarked: true,
      studentName,
      markedAt: new Date().toISOString()
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Session</h3>
            <p className="text-gray-600 text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Session Not Found</h3>
            <p className="text-gray-600 text-center">
              The attendance session you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (attendanceStatus.isMarked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Attendance Marked!</h3>
            <p className="text-gray-600 text-center mb-4">
              Thank you, <strong>{attendanceStatus.studentName}</strong>. Your attendance has been successfully recorded.
            </p>
            <div className="text-sm text-gray-500 text-center">
              <p>Session: {session.title}</p>
              <p>Marked at: {formatTime(attendanceStatus.markedAt!)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
          <p className="text-gray-600">Please fill in your details to mark your attendance</p>
        </div>

        {/* Session Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{session.title}</CardTitle>
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                {session.status === 'active' ? 'Active' : 'Ended'}
              </Badge>
            </div>
            {session.description && (
              <CardDescription className="text-base">
                {session.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Lecturer: {session.lecturer.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Started: {formatDate(session.start_time)} at {formatTime(session.start_time)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Form */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              Please provide your details to mark your attendance for this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceForm
              sessionId={sessionId}
              onSuccess={handleAttendanceMarked}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>QR Attendance System - Secure and Easy Attendance Tracking</p>
        </div>
      </div>
    </div>
  )
} 