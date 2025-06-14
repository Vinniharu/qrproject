'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, QrCode, Users, FileText, LogOut, Calendar, Clock, Zap, Activity, Database, Shield, Brain } from 'lucide-react'
import { SessionCard } from '@/components/attendance/SessionCard'
import { CreateSessionModal } from '@/components/attendance/CreateSessionModal'
import EditSessionModal from '@/components/attendance/EditSessionModal'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'

interface Session {
  id: string
  title: string
  description?: string
  course_code: string
  session_date: string
  start_time: string
  end_time: string
  status: 'upcoming' | 'active' | 'completed'
  qr_code?: string
  created_at: string
  attendance_count?: number
}

interface User {
  id: string
  email: string
  user_metadata: {
    first_name?: string
    last_name?: string
    full_name?: string
  }
}

export default function LecturerDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalAttendance: 0
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchSessions()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user as User)
  }

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No authenticated user found')
        return
      }

      console.log('Fetching sessions for user:', user.id)

      // First, get all sessions for the lecturer
      const { data: sessions, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('lecturer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching sessions:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return
      }

      if (!sessions) {
        console.log('No sessions returned from database')
        setSessions([])
        setStats({ totalSessions: 0, activeSessions: 0, totalAttendance: 0 })
        return
      }

      // Get attendance counts for each session
      const sessionsWithCount = await Promise.all(
        sessions.map(async (session) => {
          console.log('Processing session:', session.id)
          
          const { count, error: countError } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)

          if (countError) {
            console.error('Error counting attendance for session', session.id, ':', countError)
          }

          // Determine session status based on current time and session timing
          const now = new Date()
          const sessionDate = new Date(session.session_date)
          const [startHour, startMinute] = session.start_time.split(':').map(Number)
          const [endHour, endMinute] = session.end_time.split(':').map(Number)
          
          const sessionStart = new Date(sessionDate)
          sessionStart.setHours(startHour, startMinute, 0, 0)
          
          const sessionEnd = new Date(sessionDate)
          sessionEnd.setHours(endHour, endMinute, 0, 0)
          
          let status: 'upcoming' | 'active' | 'completed'
          if (now < sessionStart) {
            status = 'upcoming'
          } else if (now >= sessionStart && now <= sessionEnd && session.is_active) {
            status = 'active'
          } else {
            status = 'completed'
          }

          return {
            ...session,
            description: session.description ?? undefined,
            attendance_count: count || 0,
            status,
            qr_code: session.qr_code_data || undefined
          }
        })
      )

      setSessions(sessionsWithCount)

      // Calculate stats
      const totalSessions = sessionsWithCount.length
      const activeSessions = sessionsWithCount.filter(s => s.status === 'active').length
      const totalAttendance = sessionsWithCount.reduce((sum, s) => sum + (s.attendance_count || 0), 0)

      setStats({
        totalSessions,
        activeSessions,
        totalAttendance
      })
    } catch (error) {
      console.error('Unexpected error in fetchSessions:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSessionCreated = () => {
    setIsCreateModalOpen(false)
    fetchSessions()
  }

  const handleGenerateQR = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/qr`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.qr_code) {
          // Update the session with the QR code
          setSessions(prevSessions => 
            prevSessions.map(session => 
              session.id === sessionId 
                ? { ...session, qr_code: data.qr_code }
                : session
            )
          )
          toast.success('QR Code generated successfully!')
        } else {
          toast.error('Failed to generate QR code')
        }
      } else {
        toast.error('Failed to generate QR code')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Error generating QR code')
    }
  }

  const handleViewAttendance = (sessionId: string) => {
    router.push(`/dashboard/lecturer/sessions/${sessionId}/attendance`)
  }

  const handleGenerateReport = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/attendance/report/${sessionId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendance-report-${sessionId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  const handleEditSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setSelectedSession(session)
      setIsEditModalOpen(true)
    }
  }

  const handleSessionUpdated = (updatedSession: Session) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      )
    )
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId))
        // Recalculate stats
        const updatedSessions = sessions.filter(s => s.id !== sessionId)
        const totalSessions = updatedSessions.length
        const activeSessions = updatedSessions.filter(s => s.status === 'active').length
        const totalAttendance = updatedSessions.reduce((sum, s) => sum + (s.attendance_count || 0), 0)
        setStats({ totalSessions, activeSessions, totalAttendance })
        toast.success('Session deleted successfully!')
      } else {
        toast.error('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Error deleting session')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 dark:bg-violet-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400/30 mx-auto"></div>
          </div>
          <p className="mt-6 text-purple-300 dark:text-purple-400 font-mono">
            <span className="text-cyan-400">&gt;</span> Loading Dashboard
            <span className="loading-dots"></span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Futuristic Header */}
      <header className="cyber-glass border-b border-purple-500/20 sticky top-0 z-40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-violet-500/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30">
                <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                  QR Attendance System
                </h1>
                <p className="text-sm text-purple-300/80 dark:text-purple-400/80 font-mono">
                  <span className="text-cyan-400">[</span>
                  Dashboard Active
                  <span className="text-cyan-400">]</span>
                  <span className="ml-2 text-green-400">●</span>
                  <span className="ml-1">{user?.user_metadata?.full_name || user?.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="cyber-button border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400/70 font-mono"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Stats Grid with Futuristic Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cyber-glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-purple-300 font-mono">Total Sessions</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                <Database className="h-4 w-4 text-blue-400 group-hover:animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {stats.totalSessions}
              </div>
              <p className="text-xs text-blue-300/80 font-mono mt-1">
                <span className="text-cyan-400">&gt;</span> Sessions created
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-purple-300 font-mono">Active Sessions</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30">
                <Activity className="h-4 w-4 text-green-400 group-hover:animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {stats.activeSessions}
              </div>
              <p className="text-xs text-green-300/80 font-mono mt-1">
                <span className="text-cyan-400">&gt;</span> Currently running
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-purple-300 font-mono">Total Attendance</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30">
                <Users className="h-4 w-4 text-purple-400 group-hover:animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                {stats.totalAttendance}
              </div>
              <p className="text-xs text-purple-300/80 font-mono mt-1">
                <span className="text-cyan-400">&gt;</span> Students recorded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent mb-2">
              Attendance Sessions
            </h2>
            <p className="text-purple-300/80 dark:text-purple-400/80 font-mono text-sm">
              <span className="text-cyan-400">&gt;</span> Manage your attendance sessions
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Session
          </Button>
        </div>

        {/* Sessions Grid or Empty State */}
        {sessions.length === 0 ? (
          <Card className="cyber-glass border-purple-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
            <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
              <div className="p-6 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 mb-6">
                <QrCode className="h-16 w-16 text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent mb-3">
                No Sessions Found
              </h3>
              <p className="text-purple-300/80 dark:text-purple-400/80 text-center mb-6 font-mono max-w-md">
                <span className="text-cyan-400">&gt;</span> No attendance sessions created yet. Create your first session to start tracking attendance.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono"
              >
                <Zap className="h-4 w-4 mr-2" />
                Create First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onGenerateQR={handleGenerateQR}
                onViewAttendance={handleViewAttendance}
                onGenerateReport={handleGenerateReport}
                onEditSession={handleEditSession}
                onDeleteSession={handleDeleteSession}
              />
            ))}
          </div>
        )}
      </main>

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSessionCreated={handleSessionCreated}
      />

      <EditSessionModal
        session={selectedSession}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedSession(null)
        }}
        onSessionUpdated={handleSessionUpdated}
      />
    </div>
  )
} 