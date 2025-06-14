'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Download, QrCode, Zap, Activity, Eye, Share2 } from 'lucide-react'
import QRCodeLib from 'qrcode'

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

interface QRPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session | null
  qrCodeData?: string
}

export function QRPreviewModal({ isOpen, onClose, session, qrCodeData }: QRPreviewModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen && session && qrCodeData) {
      generateQRCode()
    }
  }, [isOpen, session, qrCodeData])

  const generateQRCode = async () => {
    if (!session || !qrCodeData) return

    setIsGenerating(true)
    try {
      // Generate attendance URL
      const attendanceUrl = `${window.location.origin}/attendance/${session.id}`
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCodeLib.toDataURL(attendanceUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      
      setQrCodeUrl(qrDataUrl)

      // Also generate on canvas for download
      if (canvasRef.current) {
        await QRCodeLib.toCanvas(canvasRef.current, attendanceUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        })
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!canvasRef.current || !session) return

    // Create download link
    const link = document.createElement('a')
    link.download = `qr-code-${session.course_code}-${session.session_date}.png`
    link.href = canvasRef.current.toDataURL()
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (!session) return

    const attendanceUrl = `${window.location.origin}/attendance/${session.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${session.title} - Attendance`,
          text: `Join the attendance session: ${session.title}`,
          url: attendanceUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
        // Fallback to clipboard
        copyToClipboard(attendanceUrl)
      }
    } else {
      // Fallback to clipboard
      copyToClipboard(attendanceUrl)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  if (!isOpen || !session) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-lg cyber-glass border-purple-500/30 shadow-2xl shadow-purple-500/20">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-violet-500/10" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30">
                  <QrCode className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
                QR Code Preview
              </CardTitle>
              <CardDescription className="text-purple-300/80 dark:text-purple-400/80 font-mono mt-2">
                <span className="text-cyan-400">&gt;</span> {session.title}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-400/40"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-6">
          {/* Session Info */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-blue-300 font-mono">Session Details</span>
              <Badge 
                variant="outline" 
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30 animate-pulse-glow font-mono"
              >
                <Activity className="h-3 w-3 mr-1" />
                {session.status === 'active' ? 'LIVE' : session.status.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-cyan-300 font-mono">
                <span className="text-cyan-400">[</span>{session.course_code}<span className="text-cyan-400">]</span>
              </div>
              <div className="text-purple-300 font-mono">
                {session.session_date} • {session.start_time} - {session.end_time}
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center w-80 h-80 bg-gradient-to-br from-black/40 to-purple-900/20 border border-purple-400/30 rounded-lg">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500"></div>
                <p className="mt-4 text-purple-300 font-mono">
                  <span className="text-cyan-400">&gt;</span> Generating QR Code
                  <span className="loading-dots"></span>
                </p>
              </div>
            ) : qrCodeUrl ? (
              <div className="relative">
                <div className="p-6 bg-white rounded-lg shadow-2xl">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR Code for ${session.title}`}
                    className="w-80 h-80 rounded"
                  />
                  {/* Scanning animation overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/10 to-transparent animate-pulse rounded-lg pointer-events-none" />
                </div>
                
                {/* Status indicator */}
                <div className="absolute -top-2 -right-2">
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 shadow-lg shadow-green-500/20">
                    <Zap className="h-4 w-4 text-green-400 animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-80 h-80 bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-400/30 rounded-lg">
                <X className="h-16 w-16 text-red-400 mb-4" />
                <p className="text-red-300 font-mono text-center">
                  <span className="text-cyan-400">&gt;</span> Failed to generate QR Code
                </p>
              </div>
            )}

            {/* Hidden canvas for download */}
            <canvas 
              ref={canvasRef} 
              className="hidden" 
              width={400} 
              height={400}
            />
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-bold text-violet-300 font-mono">Instructions</span>
            </div>
            <p className="text-sm text-violet-200 font-mono">
              <span className="text-cyan-400">&gt;</span> Students can scan this QR code to mark their attendance for this session.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              disabled={!qrCodeUrl}
              className="flex-1 cyber-button bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-green-400/50 shadow-lg shadow-green-500/25 font-mono"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            <Button
              onClick={handleShare}
              disabled={!qrCodeUrl}
              variant="outline"
              className="flex-1 cyber-button border-cyan-400/50 text-cyan-300 hover:text-cyan-200 hover:border-cyan-300/70 font-mono"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Button>
          </div>

          {/* URL Display */}
          {session && (
            <div className="p-3 rounded-lg bg-black/20 dark:bg-white/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-purple-300 font-mono">Attendance URL:</span>
              </div>
              <code className="text-xs text-cyan-300 font-mono break-all">
                {window.location.origin}/attendance/{session.id}
              </code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 