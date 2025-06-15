'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, CheckCircle, XCircle, Mail, Hash, Calendar, Zap, Activity, AlertTriangle, Loader2 } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'

interface Session {
  id: string
  title: string
  description: string | null
  course_code: string
  session_date: string
  start_time: string
  end_time: string
  status: 'upcoming' | 'active' | 'completed'
  is_active: boolean
  lecturer_id: string
  profiles: {
    full_name: string
    email: string
  }
}

interface AttendanceStatus {
  isMarked: boolean
  studentName?: string
  markedAt?: string
  isLate?: boolean
  lateByMinutes?: number
}

export default function AttendancePage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<Session | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({ isMarked: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_id: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
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
          profiles!attendance_sessions_lecturer_id_fkey (
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

      setSession(sessionData)

      // Check if session is still active
      if (!sessionData.is_active) {
        setError('This attendance session is no longer active')
        return
      }

    } catch (error) {
      console.error('Error fetching session:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Full name is required'
    }

    if (!formData.student_email.trim()) {
      newErrors.student_email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.student_email)) {
      newErrors.student_email = 'Please enter a valid email address'
    }

    if (!formData.student_id.trim()) {
      newErrors.student_id = 'Student ID is required'
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateLateness = (sessionStartTime: string, sessionDate: string) => {
    const now = new Date()
    const sessionDateTime = new Date(`${sessionDate}T${sessionStartTime}`)
    
    if (now > sessionDateTime) {
      const diffMs = now.getTime() - sessionDateTime.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return {
        isLate: diffMinutes > 15, // Consider late if more than 15 minutes after start
        lateByMinutes: diffMinutes
      }
    }
    
    return { isLate: false, lateByMinutes: 0 }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !session) {
      console.log('Form validation failed or session not found', { 
        formValid: validateForm(), 
        sessionExists: !!session 
      })
      return
    }

    setIsSubmitting(true)
    console.log('Submitting attendance with data:', {
      session_id: sessionId,
      student_name: formData.student_name.trim(),
      student_email: formData.student_email.trim(),
      student_id: formData.student_id.trim()
    })

    try {
      // Use the API endpoint instead of direct Supabase calls
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          student_name: formData.student_name.trim(),
          student_email: formData.student_email.trim(),
          student_id: formData.student_id.trim()
        })
      })

      console.log('API Response status:', response.status)
      const result = await response.json()
      console.log('API Response data:', result)

      if (!response.ok) {
        if (response.status === 409) {
          setFormErrors({ student_email: 'You have already marked attendance for this session' })
        } else if (response.status === 404) {
          setFormErrors({ submit: 'This attendance session is no longer active' })
        } else {
          setFormErrors({ submit: result.error || 'Failed to mark attendance. Please try again.' })
        }
        return
      }

      if (result.success) {
        console.log('Attendance marked successfully:', result.data)
        setAttendanceStatus({
          isMarked: true,
          studentName: formData.student_name,
          markedAt: result.data.marked_at,
          isLate: result.data.is_late,
          lateByMinutes: result.data.late_by_minutes
        })

        toast.success('Attendance marked successfully!')
      } else {
        console.error('API returned success=false:', result)
        setFormErrors({ submit: 'Failed to mark attendance. Please try again.' })
      }
    } catch (error) {
      console.error('Error submitting attendance:', error)
      setFormErrors({ submit: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-black via-purple-900/20 to-black">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card className="w-full max-w-md cyber-glass border-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 animate-pulse" />
              </div>
              <p className="mt-6 text-purple-300 font-mono text-center">
                <span className="text-cyan-400">&gt;</span> Loading session data
                <span className="loading-dots"></span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />
        
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card className="w-full max-w-md cyber-glass border-red-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-pink-500/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative">
              <div className="p-4 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 mb-6">
                <XCircle className="h-12 w-12 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Access Denied</h3>
              <p className="text-red-300/80 text-center font-mono">
                <span className="text-cyan-400">&gt;</span> {error}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-500/10 via-transparent to-transparent" />
        
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card className="w-full max-w-md cyber-glass border-gray-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 via-transparent to-slate-500/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative">
              <div className="p-4 rounded-full bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-400/30 mb-6">
                <AlertTriangle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Session Not Found</h3>
              <p className="text-gray-300/80 text-center font-mono">
                <span className="text-cyan-400">&gt;</span> The attendance session you're looking for doesn't exist or has been removed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (attendanceStatus.isMarked) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-black via-purple-900/20 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent" />
        
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card className="w-full max-w-md cyber-glass border-green-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative">
              <div className="p-6 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 mb-6 animate-pulse-glow">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent mb-3">
                Attendance Confirmed!
              </h3>
              <p className="text-green-300/80 text-center mb-6 font-mono">
                <span className="text-cyan-400">&gt;</span> Thank you, <strong className="text-white">{attendanceStatus.studentName}</strong>. 
                Your attendance has been successfully recorded.
              </p>
              
              {/* Status Badge */}
              <div className="mb-6">
                <Badge 
                  variant={attendanceStatus.isLate ? "destructive" : "secondary"}
                  className={`font-mono text-sm px-4 py-2 ${
                    attendanceStatus.isLate 
                      ? 'bg-red-500/20 text-red-300 border-red-400/30' 
                      : 'bg-green-500/20 text-green-300 border-green-400/30'
                  }`}
                >
                  {attendanceStatus.isLate ? `Late (${attendanceStatus.lateByMinutes}m)` : 'On Time'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-green-400/70 text-center font-mono">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Session: {session.title}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Marked at: {formatTime(attendanceStatus.markedAt!)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-black via-purple-900/20 to-black">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
      
      <div className="max-w-2xl mx-auto px-4 py-8 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
            Mark Attendance
          </h1>
          <p className="text-purple-300/80 font-mono">
            <span className="text-cyan-400">&gt;</span> Please fill in your details to mark your attendance
          </p>
        </div>

        {/* Session Info Card */}
        <Card className="cyber-glass border-purple-500/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                {session.title}
              </CardTitle>
              <Badge 
                variant="outline" 
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30 animate-pulse-glow font-mono"
              >
                <Activity className="h-3 w-3 mr-1" />
                ACTIVE
              </Badge>
            </div>
            {session.description && (
              <CardDescription className="text-purple-300/80 font-mono mt-2">
                <span className="text-cyan-400">&gt;</span> {session.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <User className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-sm font-mono text-blue-300">{session.profiles.full_name}</div>
                  <div className="text-xs text-blue-400/70">Lecturer</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-mono text-emerald-300">{formatDate(session.session_date)}</div>
                  <div className="text-xs text-emerald-400/70">Session Date</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                <Clock className="h-5 w-5 text-purple-400" />
                <div>
                  <div className="text-sm font-mono text-purple-300">{formatTime(session.start_time)} - {formatTime(session.end_time)}</div>
                  <div className="text-xs text-purple-400/70">Time Range</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Form */}
        <Card className="cyber-glass border-purple-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
          <CardHeader className="relative">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-400" />
              Student Information
            </CardTitle>
            <CardDescription className="text-purple-300/80 font-mono">
              <span className="text-cyan-400">&gt;</span> Provide your details to mark attendance for this session
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="student_name" className="flex items-center gap-2 text-purple-300 font-mono">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => handleInputChange('student_name', e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                  className={`cyber-input border-purple-500/30 focus:border-purple-400/50 bg-black/20 font-mono ${
                    formErrors.student_name ? 'border-red-500/50' : ''
                  }`}
                />
                {formErrors.student_name && (
                  <p className="text-sm text-red-400 font-mono">
                    <span className="text-red-500">&gt;</span> {formErrors.student_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="student_email" className="flex items-center gap-2 text-purple-300 font-mono">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="student_email"
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => handleInputChange('student_email', e.target.value)}
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                  className={`cyber-input border-purple-500/30 focus:border-purple-400/50 bg-black/20 font-mono ${
                    formErrors.student_email ? 'border-red-500/50' : ''
                  }`}
                />
                {formErrors.student_email && (
                  <p className="text-sm text-red-400 font-mono">
                    <span className="text-red-500">&gt;</span> {formErrors.student_email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="student_id" className="flex items-center gap-2 text-purple-300 font-mono">
                  <Hash className="h-4 w-4" />
                  Student ID *
                </Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  placeholder="Enter your student ID"
                  disabled={isSubmitting}
                  className={`cyber-input border-purple-500/30 focus:border-purple-400/50 bg-black/20 font-mono ${
                    formErrors.student_id ? 'border-red-500/50' : ''
                  }`}
                />
                {formErrors.student_id && (
                  <p className="text-sm text-red-400 font-mono">
                    <span className="text-red-500">&gt;</span> {formErrors.student_id}
                  </p>
                )}
              </div>

              {formErrors.submit && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-400/30">
                  <p className="text-sm text-red-300 font-mono">
                    <span className="text-red-400">&gt;</span> {formErrors.submit}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono py-3 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    <span className="loading-dots">Processing</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark My Attendance
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-purple-400/60 font-mono">
            <span className="text-cyan-400">&gt;</span> QR Attendance System - Secure and Easy Attendance Tracking
          </p>
        </div>
      </div>
    </div>
  )
} 