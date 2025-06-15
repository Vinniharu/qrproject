'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, CheckCircle, XCircle, Mail, Hash, Calendar, Zap, Activity, AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react'
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
  const [isOnline, setIsOnline] = useState(true)
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_id: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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
    } else if (formData.student_name.trim().length < 2) {
      newErrors.student_name = 'Name must be at least 2 characters'
    }

    if (!formData.student_email.trim()) {
      newErrors.student_email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.student_email)) {
      newErrors.student_email = 'Please enter a valid email address'
    }

    if (!formData.student_id.trim()) {
      newErrors.student_id = 'Student ID is required'
    } else if (formData.student_id.trim().length < 3) {
      newErrors.student_id = 'Student ID must be at least 3 characters'
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
    
    if (!isOnline) {
      setFormErrors({ submit: 'No internet connection. Please check your network and try again.' })
      return
    }
    
    if (!validateForm() || !session) {
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    try {
      console.log('Submitting attendance data:', {
        session_id: sessionId,
        student_name: formData.student_name.trim(),
        student_email: formData.student_email.trim(),
        student_id: formData.student_id.trim()
      })

      // Use the new simplified API endpoint with session ID in URL
      const response = await fetch(`/api/attendance/${sessionId}/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: formData.student_name.trim(),
          student_email: formData.student_email.trim(),
          student_id: formData.student_id.trim()
        })
      })

      console.log('API Response status:', response.status)
      
      let result
      try {
        result = await response.json()
        console.log('API Response data:', result)
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError)
        setFormErrors({ submit: 'Server returned invalid response. Please try again.' })
        return
      }

      if (!response.ok) {
        console.error('API Error:', result)
        
        if (response.status === 409) {
          setFormErrors({ student_email: 'You have already marked attendance for this session' })
        } else if (response.status === 404) {
          setFormErrors({ submit: 'This attendance session was not found' })
        } else if (response.status === 400) {
          setFormErrors({ submit: result.error || 'Invalid data provided. Please check your inputs.' })
        } else if (response.status === 500) {
          setFormErrors({ submit: 'Server error occurred. Please try again later.' })
        } else {
          setFormErrors({ submit: result.error || 'Failed to mark attendance. Please try again.' })
        }
        return
      }

      if (result.success) {
        setAttendanceStatus({
          isMarked: true,
          studentName: formData.student_name,
          markedAt: result.data.marked_at,
          isLate: result.data.is_late,
          lateByMinutes: result.data.late_by_minutes
        })

        toast.success('Attendance marked successfully!')
      } else {
        setFormErrors({ submit: 'Failed to mark attendance. Please try again.' })
      }
    } catch (error) {
      console.error('Network error submitting attendance:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setFormErrors({ submit: 'Network error. Please check your internet connection and try again.' })
      } else {
        setFormErrors({ submit: 'An unexpected error occurred. Please try again.' })
      }
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

  // Loading skeleton for mobile
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/50 to-black relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-full blur-3xl animate-spin-slow" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 max-w-md">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="text-center space-y-4">
              <div className="h-8 bg-purple-500/20 rounded-lg animate-pulse" />
              <div className="h-4 bg-purple-500/10 rounded animate-pulse" />
            </div>
            
            {/* Card skeleton */}
            <Card className="cyber-glass border-purple-500/20">
              <CardHeader>
                <div className="space-y-3">
                  <div className="h-6 bg-purple-500/20 rounded animate-pulse" />
                  <div className="h-4 bg-purple-500/10 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-32 bg-purple-500/10 rounded-lg animate-pulse" />
                <div className="space-y-3">
                  <div className="h-10 bg-purple-500/10 rounded animate-pulse" />
                  <div className="h-10 bg-purple-500/10 rounded animate-pulse" />
                  <div className="h-10 bg-purple-500/10 rounded animate-pulse" />
                  <div className="h-12 bg-purple-500/20 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/50 to-black relative overflow-hidden flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="cyber-glass border-red-500/30">
            <CardContent className="p-8 text-center">
              <div className="p-4 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 mb-6 inline-block">
                <XCircle className="h-12 w-12 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Session Error</h2>
              <p className="text-red-300 font-mono mb-6">
                <span className="text-red-400">&gt;</span> {error}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="cyber-button bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white border-red-400/50 shadow-lg shadow-red-500/25 font-mono"
              >
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success state
  if (attendanceStatus.isMarked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/50 to-black relative overflow-hidden flex items-center justify-center">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 container mx-auto px-4 max-w-md">
          <Card className="cyber-glass border-green-500/30">
            <CardContent className="p-8 text-center">
              <div className="p-4 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 mb-6 inline-block animate-pulse-glow">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent mb-3">
                Attendance Confirmed!
              </h2>
              
              <div className="space-y-3 mb-6">
                <p className="text-green-300 font-mono">
                  <span className="text-cyan-400">&gt;</span> Welcome, {attendanceStatus.studentName}
                </p>
                
                {attendanceStatus.isLate ? (
                  <Badge variant="outline" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-400/30 font-mono">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Late ({attendanceStatus.lateByMinutes} minutes)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30 font-mono">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    On Time
                  </Badge>
                )}
                
                <p className="text-sm text-purple-400/80 font-mono">
                  Marked at: {new Date(attendanceStatus.markedAt!).toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 mb-6">
                <p className="text-sm text-purple-300 font-mono">
                  <span className="text-cyan-400">&gt;</span> Your attendance has been successfully recorded for this session.
                </p>
              </div>

              <Button
                onClick={() => window.close()}
                className="w-full cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono"
              >
                Close Window
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/50 to-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-full blur-3xl animate-spin-slow" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-md">
        {/* Network status indicator */}
        {!isOnline && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-400/30 flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-300 font-mono">No internet connection</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            Mark Attendance
          </h1>
          <p className="text-purple-300/80 font-mono">
            <span className="text-cyan-400">&gt;</span> Secure attendance verification system
          </p>
        </div>

        {/* Session Info Card */}
        {session && (
          <Card className="cyber-glass border-purple-500/20 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
            <CardHeader className="relative pb-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400 animate-pulse" />
                {session.title}
              </CardTitle>
              <CardDescription className="text-purple-300/80 font-mono">
                <span className="text-cyan-400">[</span>{session.course_code}<span className="text-cyan-400">]</span>
                {session.description && ` - ${session.description}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-300 font-mono">{formatDate(session.session_date)}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300 font-mono">
                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                  <User className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-300 font-mono text-sm">
                    Instructor: {session.profiles?.full_name || 'Unknown'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Form */}
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
                  className={`cyber-input border-purple-500/30 focus:border-purple-400/50 bg-black/20 font-mono text-base ${
                    formErrors.student_name ? 'border-red-500/50' : ''
                  }`}
                  autoComplete="name"
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
                  className={`cyber-input border-purple-500/30 focus:border-purple-400/50 bg-black/20 font-mono text-base ${
                    formErrors.student_email ? 'border-red-500/50' : ''
                  }`}
                  autoComplete="email"
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
                  className={`cyber-input border-purple-500/30 focus:border-purple-400/50 bg-black/20 font-mono text-base ${
                    formErrors.student_id ? 'border-red-500/50' : ''
                  }`}
                  autoComplete="username"
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
                disabled={isSubmitting || !isOnline}
                className="w-full cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono py-3 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    <span className="loading-dots">Processing</span>
                  </>
                ) : !isOnline ? (
                  <>
                    <WifiOff className="h-5 w-5 mr-2" />
                    No Connection
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
          {isOnline && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-400/60">
              <Wifi className="h-3 w-3" />
              <span>Connected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 