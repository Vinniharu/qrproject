'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QrCode, Users, FileText, Calendar, Clock, Edit, Trash2, Eye, Zap, Activity, Download } from 'lucide-react'
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

interface SessionCardProps {
  session: Session
  onGenerateQR: (sessionId: string) => void
  onViewAttendance: (sessionId: string) => void
  onEditSession?: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
  onGenerateReport?: (sessionId: string) => void
}

export function SessionCard({ 
  session, 
  onGenerateQR, 
  onViewAttendance,
  onEditSession,
  onDeleteSession,
  onGenerateReport
}: SessionCardProps) {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'upcoming':
        return {
          color: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-400/30',
          icon: Clock,
          text: 'Scheduled',
          glow: 'shadow-blue-500/20'
        }
      case 'active':
        return {
          color: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30',
          icon: Activity,
          text: 'Active',
          glow: 'shadow-green-500/20 animate-pulse-glow'
        }
      case 'completed':
        return {
          color: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border-purple-400/30',
          icon: Zap,
          text: 'Completed',
          glow: 'shadow-purple-500/20'
        }
      default:
        return {
          color: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border-gray-400/30',
          icon: Clock,
          text: 'Unknown',
          glow: 'shadow-gray-500/20'
        }
    }
  }

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true)
    try {
      await onGenerateQR(session.id)
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleDownloadQR = () => {
    if (!session.qr_code) return

    try {
      // If it's a data URL, convert it to blob for better download handling
      if (session.qr_code.startsWith('data:')) {
        // Convert data URL to blob
        const byteCharacters = atob(session.qr_code.split(',')[1])
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })
        
        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `qr-code-${session.course_code}-${session.session_date}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('QR Code downloaded successfully!')
      } else {
        // Handle regular URLs
        const link = document.createElement('a')
        link.href = session.qr_code
        link.download = `qr-code-${session.course_code}-${session.session_date}.png`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('QR Code downloaded successfully!')
      }
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Failed to download QR code')
      // Fallback: open in new tab
      window.open(session.qr_code, '_blank')
    }
  }

  const isSessionActive = () => {
    const now = new Date()
    const sessionDate = new Date(session.session_date)
    const [startHour, startMinute] = session.start_time.split(':').map(Number)
    const [endHour, endMinute] = session.end_time.split(':').map(Number)
    
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(startHour, startMinute, 0, 0)
    
    const sessionEnd = new Date(sessionDate)
    sessionEnd.setHours(endHour, endMinute, 0, 0)
    
    return now >= sessionStart && now <= sessionEnd
  }

  const isSessionUpcoming = () => {
    const now = new Date()
    const sessionDate = new Date(session.session_date)
    const [startHour, startMinute] = session.start_time.split(':').map(Number)
    
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(startHour, startMinute, 0, 0)
    
    return now < sessionStart
  }

  const statusConfig = getStatusConfig(session.status)
  const StatusIcon = statusConfig.icon

  return (
    <Card className="group relative overflow-hidden cyber-glass hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 border-purple-500/20 hover:border-purple-400/40 animate-float">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Cyber scan line effect */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent mb-2 group-hover:neon-text transition-all duration-300">
              {session.title}
            </CardTitle>
            <CardDescription className="text-sm text-purple-300/80 dark:text-purple-400/80 font-mono">
              <span className="text-cyan-400">[</span>
              {session.course_code}
              <span className="text-cyan-400">]</span>
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`${statusConfig.color} ${statusConfig.glow} font-mono text-xs px-3 py-1 shadow-lg backdrop-blur-sm`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.text}
          </Badge>
        </div>
        {session.description && (
          <div className="mt-3 p-2 rounded-md bg-black/20 dark:bg-white/5 border border-purple-500/20">
            <p className="text-sm text-gray-300 dark:text-gray-400 line-clamp-2 font-mono">
              <span className="text-purple-400">&gt;</span> {session.description}
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 relative z-10">
        <div className="space-y-4">
          {/* Session Details with Cyber Styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-mono text-blue-300">{formatDate(session.session_date)}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-mono text-emerald-300">{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
            </div>
          </div>

          {/* Attendance Count with Neon Effect */}
          {session.attendance_count !== undefined && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <Users className="h-5 w-5 text-purple-400 animate-pulse" />
              <span className="text-sm font-mono text-purple-300">
                <span className="text-cyan-400">[</span>
                <span className="text-white font-bold">{session.attendance_count}</span>
                <span className="text-cyan-400">]</span>
                <span className="ml-1">students attended</span>
              </span>
            </div>
          )}

          {/* Futuristic Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {/* QR Code Generation */}
            {(isSessionActive() || isSessionUpcoming()) && (
              <Button
                size="sm"
                onClick={handleGenerateQR}
                disabled={isGeneratingQR}
                className="cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono"
              >
                <QrCode className="h-4 w-4 mr-1" />
                {isGeneratingQR ? (
                  <span className="loading-dots">Generating</span>
                ) : (
                  session.qr_code ? 'Regenerate QR Code' : 'Generate QR Code'
                )}
              </Button>
            )}

            {/* View Attendance */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewAttendance(session.id)}
              className="cyber-button border-cyan-400/50 text-cyan-300 hover:text-cyan-200 hover:border-cyan-300/70 font-mono"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Attendance
            </Button>

            {/* Generate Report */}
            {session.status === 'completed' && onGenerateReport && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateReport(session.id)}
                className="cyber-button border-emerald-400/50 text-emerald-300 hover:text-emerald-200 hover:border-emerald-300/70 font-mono"
              >
                <FileText className="h-4 w-4 mr-1" />
                Generate Report
              </Button>
            )}

            {/* Edit Session */}
            {onEditSession && session.status !== 'completed' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditSession(session.id)}
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-400/40 font-mono"
              >
                <Edit className="h-4 w-4 mr-1" />
                Modify
              </Button>
            )}

            {/* Delete Session */}
            {onDeleteSession && session.status === 'upcoming' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteSession(session.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-400/40 font-mono"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Terminate
              </Button>
            )}
          </div>

          {/* Enhanced QR Code Display */}
          {session.qr_code && (
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-black/40 to-purple-900/20 border border-purple-400/30 shadow-2xl shadow-purple-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-purple-300 font-mono flex items-center gap-2">
                  <Zap className="h-4 w-4 animate-pulse" />
                  QR Code Active
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30 animate-pulse-glow font-mono">
                    <Activity className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDownloadQR}
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/40 font-mono p-2"
                    title="Download QR Code"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-center relative">
                <div className="relative p-2 bg-white rounded-lg shadow-2xl">
                  <img 
                    src={session.qr_code} 
                    alt={`QR Code for ${session.title}`}
                    className="w-32 h-32 rounded"
                  />
                  {/* Scanning animation overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/20 to-transparent animate-pulse rounded-lg" />
                </div>
              </div>
              <p className="text-xs text-purple-400/80 text-center mt-3 font-mono">
                <span className="text-cyan-400">&gt;</span> Ready for student scanning
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 