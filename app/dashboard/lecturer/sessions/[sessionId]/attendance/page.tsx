'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Users, Search, Download, Calendar, Clock, Mail, Hash, User, FileText, Filter } from 'lucide-react'
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
  created_at: string
}

interface AttendanceRecord {
  id: string
  student_name: string
  student_email: string
  student_id: string
  marked_at: string
}

export default function AttendancePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<Session | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  useEffect(() => {
    // Filter records based on search term
    if (searchTerm.trim() === '') {
      setFilteredRecords(attendanceRecords)
    } else {
      const filtered = attendanceRecords.filter(record =>
        record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRecords(filtered)
    }
  }, [searchTerm, attendanceRecords])

  const fetchSessionData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch session details and attendance records
      const response = await fetch(`/api/sessions/${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch session data')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setSession(data.data.session)
        setAttendanceRecords(data.data.attendance_records || [])
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching session data:', error)
      toast.error('Failed to load session data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No attendance records to export')
      return
    }

    const csvHeaders = ['Student Name', 'Student Email', 'Student ID', 'Marked At']
    const csvData = filteredRecords.map(record => [
      record.student_name,
      record.student_email,
      record.student_id,
      new Date(record.marked_at).toLocaleString()
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance-${session?.course_code}-${session?.session_date}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Attendance data exported successfully!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
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
            <span className="text-cyan-400">&gt;</span> Loading Attendance Data
            <span className="loading-dots"></span>
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Session Not Found</h3>
            <p className="text-gray-600 text-center mb-4">
              The session you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/dashboard/lecturer')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="cyber-glass border-b border-purple-500/20 sticky top-0 z-40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-violet-500/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/lecturer')}
                className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-400/40 font-mono"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-8 w-px bg-purple-500/30" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                  Session Attendance
                </h1>
                <p className="text-sm text-purple-300/80 dark:text-purple-400/80 font-mono">
                  <span className="text-cyan-400">[</span>
                  {session.course_code}
                  <span className="text-cyan-400">]</span>
                  <span className="ml-2">{session.title}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Session Info Card */}
        <Card className="cyber-glass border-purple-500/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent mb-2">
                  {session.title}
                </CardTitle>
                {session.description && (
                  <CardDescription className="text-purple-300/80 dark:text-purple-400/80 font-mono mb-4">
                    <span className="text-cyan-400">&gt;</span> {session.description}
                  </CardDescription>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-mono text-blue-300">{formatDate(session.session_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-mono text-emerald-300">{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-mono text-purple-300">
                      <span className="text-white font-bold">{filteredRecords.length}</span> students
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 cyber-input border-purple-500/30 focus:border-purple-400/50 bg-black/20 dark:bg-white/5 font-mono"
            />
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="cyber-button bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-green-400/50 shadow-lg shadow-green-500/25 font-mono"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Attendance Records */}
        {filteredRecords.length === 0 ? (
          <Card className="cyber-glass border-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
            <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
              <div className="p-6 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 mb-6">
                <Users className="h-16 w-16 text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent mb-3">
                {searchTerm ? 'No Matching Records' : 'No Attendance Records'}
              </h3>
              <p className="text-purple-300/80 dark:text-purple-400/80 text-center font-mono max-w-md">
                <span className="text-cyan-400">&gt;</span> {searchTerm 
                  ? 'No attendance records match your search criteria.' 
                  : 'No students have marked their attendance for this session yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRecords.map((record, index) => (
              <Card key={record.id} className="cyber-glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-violet-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30">
                        <span className="text-lg font-bold text-purple-300 font-mono">
                          {index + 1}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-400" />
                          <span className="font-semibold text-white">{record.student_name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-300 font-mono">{record.student_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-3 w-3 text-cyan-400" />
                            <span className="text-cyan-300 font-mono">{record.student_id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-purple-300 font-mono">
                        {formatDate(record.marked_at)}
                      </div>
                      <div className="text-xs text-purple-400 font-mono">
                        {formatTime(record.marked_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 