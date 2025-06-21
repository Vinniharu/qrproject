'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Users, Search, Download, Calendar, Clock, Mail, Hash, User, FileText, Filter, UserCheck } from 'lucide-react'
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
  is_late?: boolean
  late_by_minutes?: number
}

// Loading skeleton component for table rows
function AttendanceTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="border-purple-500/20">
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full bg-purple-500/20" />
              <Skeleton className="h-4 w-32 bg-purple-500/20" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48 bg-purple-500/20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 bg-purple-500/20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 bg-purple-500/20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16 bg-purple-500/20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
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
      
      // Fetch session details
      const sessionResponse = await fetch(`/api/sessions/${sessionId}`)
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch session data')
      }

      const sessionData = await sessionResponse.json()
      
      if (!sessionData.success || !sessionData.session) {
        throw new Error('Invalid session response format')
      }

      setSession(sessionData.session)

      // Fetch attendance records for this session
      const attendanceResponse = await fetch(`/api/attendance/report/${sessionId}`)
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        if (attendanceData.success && attendanceData.attendance_records) {
          setAttendanceRecords(attendanceData.attendance_records)
        }
      } else {
        // If attendance API fails, just set empty records (session still loads)
        console.warn('Failed to fetch attendance records, continuing with empty list')
        setAttendanceRecords([])
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

    const csvHeaders = ['Student Name', 'Student Email', 'Student ID', 'Marked At', 'Status']
    const csvData = filteredRecords.map(record => [
      record.student_name,
      record.student_email,
      record.student_id,
      new Date(record.marked_at).toLocaleString(),
      record.is_late ? `Late (${record.late_by_minutes} min)` : 'On Time'
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
                  <Skeleton className="h-6 w-48 bg-purple-500/20 mb-2" />
                  <Skeleton className="h-4 w-32 bg-purple-500/20" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Session Info Card Skeleton */}
          <Card className="cyber-glass border-purple-500/20 mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
            <CardHeader className="relative">
              <Skeleton className="h-8 w-64 bg-purple-500/20 mb-4" />
              <Skeleton className="h-4 w-96 bg-purple-500/20 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-12 bg-purple-500/20" />
                <Skeleton className="h-12 bg-purple-500/20" />
                <Skeleton className="h-12 bg-purple-500/20" />
              </div>
            </CardHeader>
          </Card>

          {/* Controls Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1 bg-purple-500/20" />
            <Skeleton className="h-10 w-32 bg-purple-500/20" />
          </div>

          {/* Table Skeleton */}
          <Card className="cyber-glass border-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
            <CardContent className="p-0 relative">
              <Table>
                <TableHeader>
                  <TableRow className="border-purple-500/20 hover:bg-transparent">
                    <TableHead className="text-purple-300 font-mono">#</TableHead>
                    <TableHead className="text-purple-300 font-mono">Student Name</TableHead>
                    <TableHead className="text-purple-300 font-mono">Email</TableHead>
                    <TableHead className="text-purple-300 font-mono">Student ID</TableHead>
                    <TableHead className="text-purple-300 font-mono">Marked At</TableHead>
                    <TableHead className="text-purple-300 font-mono">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AttendanceTableSkeleton />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md cyber-glass border-purple-500/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 mb-4">
              <FileText className="h-12 w-12 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Session Not Found</h3>
            <p className="text-purple-300/80 text-center mb-4 font-mono">
              <span className="text-cyan-400">&gt;</span> The session you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button 
              onClick={() => router.push('/dashboard/lecturer')}
              className="cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono"
            >
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
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent mb-2">
                  {session.title}
                </CardTitle>
                {session.description && (
                  <CardDescription className="text-purple-300/80 dark:text-purple-400/80 font-mono mb-4">
                    <span className="text-cyan-400">&gt;</span> {session.description}
                  </CardDescription>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-sm font-mono text-blue-300">{formatDate(session.session_date)}</div>
                      <div className="text-xs text-blue-400/70">Session Date</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <Clock className="h-5 w-5 text-emerald-400" />
                    <div>
                      <div className="text-sm font-mono text-emerald-300">{formatTime(session.start_time)} - {formatTime(session.end_time)}</div>
                      <div className="text-xs text-emerald-400/70">Time Range</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                    <Users className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-sm font-mono text-purple-300">
                        <span className="text-white font-bold text-lg">{filteredRecords.length}</span> 
                        <span className="ml-1">students</span>
                      </div>
                      <div className="text-xs text-purple-400/70">Total Attendance</div>
                    </div>
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
            className="cyber-button bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-green-400/50 shadow-lg shadow-green-500/25 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV ({filteredRecords.length})
          </Button>
        </div>

        {/* Attendance Table */}
        <Card className="cyber-glass border-purple-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5" />
          <CardContent className="p-0 relative">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="p-6 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 mb-6">
                  <UserCheck className="h-16 w-16 text-purple-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent mb-3">
                  {searchTerm ? 'No Matching Records' : 'No Student Has Attended'}
                </h3>
                <p className="text-purple-300/80 dark:text-purple-400/80 text-center font-mono max-w-md">
                  <span className="text-cyan-400">&gt;</span> {searchTerm 
                    ? 'No attendance records match your search criteria. Try adjusting your search terms.' 
                    : 'No students have marked their attendance for this session yet. Share the QR code to allow students to check in.'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => router.push('/dashboard/lecturer')}
                    className="mt-4 cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono"
                  >
                    Back to Sessions
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-purple-500/20 hover:bg-transparent">
                      <TableHead className="text-purple-300 font-mono text-center w-16">#</TableHead>
                      <TableHead className="text-purple-300 font-mono">Student Details</TableHead>
                      <TableHead className="text-purple-300 font-mono">Contact</TableHead>
                      <TableHead className="text-purple-300 font-mono text-center">Student ID</TableHead>
                      <TableHead className="text-purple-300 font-mono text-center">Marked At</TableHead>
                      <TableHead className="text-purple-300 font-mono text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record, index) => (
                      <TableRow 
                        key={record.id} 
                        className="border-purple-500/20 hover:bg-purple-500/5 transition-colors duration-200"
                      >
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30">
                            <span className="text-sm font-bold text-purple-300 font-mono">
                              {index + 1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                              <User className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-white">{record.student_name}</div>
                              <div className="text-xs text-purple-400/70 font-mono">Student Profile</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-emerald-400" />
                            <span className="text-emerald-300 font-mono text-sm">{record.student_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Hash className="h-4 w-4 text-cyan-400" />
                            <span className="text-cyan-300 font-mono font-semibold">{record.student_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="text-sm text-purple-300 font-mono">
                              {formatDate(record.marked_at)}
                            </div>
                            <div className="text-xs text-purple-400 font-mono">
                              {formatTime(record.marked_at)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={record.is_late ? "destructive" : "secondary"}
                            className={`font-mono text-xs ${
                              record.is_late 
                                ? 'bg-red-500/20 text-red-300 border-red-400/30' 
                                : 'bg-green-500/20 text-green-300 border-green-400/30'
                            }`}
                          >
                            {record.is_late ? `Late (${record.late_by_minutes}m)` : 'On Time'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 