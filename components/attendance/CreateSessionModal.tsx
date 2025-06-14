'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { validateSessionData } from '@/lib/validations'
import { X, Calendar, Clock, BookOpen, FileText, Zap, Activity, Database } from 'lucide-react'

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSessionCreated: () => void
}

export function CreateSessionModal({ isOpen, onClose, onSessionCreated }: CreateSessionModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_code: '',
    session_date: '',
    start_time: '',
    end_time: ''
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateSessionData({
      title: formData.title,
      course_code: formData.course_code,
      session_date: formData.session_date,
      start_time: formData.start_time,
      end_time: formData.end_time
    })

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle different types of errors
        if (result.details && Array.isArray(result.details)) {
          setErrors(result.details)
        } else if (result.details && typeof result.details === 'string') {
          setErrors([result.details])
        } else if (result.error) {
          setErrors([result.error])
        } else {
          setErrors(['Failed to create session. Please try again.'])
        }
        return
      }

      // Check if session was created successfully
      if (result.success && result.session) {
        // Reset form and close modal
        setFormData({
          title: '',
          description: '',
          course_code: '',
          session_date: '',
          start_time: '',
          end_time: ''
        })
        onSessionCreated()
        onClose()
      } else {
        setErrors(['Session creation failed. Please try again.'])
      }
    } catch (error) {
      console.error('Session creation error:', error)
      setErrors(['Network error. Please check your connection and try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        course_code: '',
        session_date: '',
        start_time: '',
        end_time: ''
      })
      setErrors([])
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>
      
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto cyber-glass border-purple-500/30 shadow-2xl shadow-purple-500/20 relative">
        {/* Cyber scan line effect */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-white to-purple-200 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30">
                  <Database className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
                Create New Session
              </CardTitle>
              <CardDescription className="text-purple-300/80 dark:text-purple-400/80 font-mono mt-2">
                <span className="text-cyan-400">&gt;</span> Configure attendance session parameters
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-400/40"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-bold mb-3 text-purple-300 font-mono flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <span className="text-cyan-400">[</span>Session Title<span className="text-cyan-400">]</span>
                  <span className="text-red-400">*</span>
                </label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Advanced Computer Science - Lecture 1"
                  required
                  disabled={isSubmitting}
                  className="cyber-glass border-purple-500/30 focus:border-purple-400/60 bg-black/20 dark:bg-white/5 text-white placeholder:text-purple-400/60 font-mono focus-cyber"
                />
              </div>

              <div>
                <label htmlFor="course_code" className="block text-sm font-bold mb-3 text-purple-300 font-mono flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-cyan-400">[</span>Course Code<span className="text-cyan-400">]</span>
                  <span className="text-red-400">*</span>
                </label>
                <Input
                  id="course_code"
                  type="text"
                  value={formData.course_code}
                  onChange={(e) => handleInputChange('course_code', e.target.value)}
                  placeholder="e.g., CS-2024"
                  required
                  disabled={isSubmitting}
                  className="cyber-glass border-purple-500/30 focus:border-purple-400/60 bg-black/20 dark:bg-white/5 text-white placeholder:text-purple-400/60 font-mono focus-cyber"
                />
              </div>

              <div>
                <label htmlFor="session_date" className="block text-sm font-bold mb-3 text-purple-300 font-mono flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-cyan-400">[</span>Session Date<span className="text-cyan-400">]</span>
                  <span className="text-red-400">*</span>
                </label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => handleInputChange('session_date', e.target.value)}
                  required
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]}
                  className="cyber-glass border-purple-500/30 focus:border-purple-400/60 bg-black/20 dark:bg-white/5 text-white font-mono focus-cyber"
                />
              </div>

              <div>
                <label htmlFor="start_time" className="block text-sm font-bold mb-3 text-purple-300 font-mono flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-400" />
                  <span className="text-cyan-400">[</span>Start Time<span className="text-cyan-400">]</span>
                  <span className="text-red-400">*</span>
                </label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="cyber-glass border-purple-500/30 focus:border-purple-400/60 bg-black/20 dark:bg-white/5 text-white font-mono focus-cyber"
                />
              </div>

              <div>
                <label htmlFor="end_time" className="block text-sm font-bold mb-3 text-purple-300 font-mono flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <span className="text-cyan-400">[</span>End Time<span className="text-cyan-400">]</span>
                  <span className="text-red-400">*</span>
                </label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="cyber-glass border-purple-500/30 focus:border-purple-400/60 bg-black/20 dark:bg-white/5 text-white font-mono focus-cyber"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold mb-3 text-purple-300 font-mono flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-400" />
                <span className="text-cyan-400">[</span>Description<span className="text-cyan-400">]</span>
                <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional session details and notes..."
                rows={4}
                disabled={isSubmitting}
                className="flex w-full rounded-md cyber-glass border-purple-500/30 focus:border-purple-400/60 bg-black/20 dark:bg-white/5 px-4 py-3 text-sm text-white placeholder:text-purple-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono transition-all duration-300"
              />
            </div>

            {errors.length > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 shadow-lg shadow-red-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-red-400 animate-pulse" />
                  <span className="text-sm font-bold text-red-300 font-mono">Error Detected</span>
                </div>
                <ul className="text-sm text-red-300 space-y-1 font-mono">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-red-400">&gt;</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 cyber-button border-gray-500/50 text-gray-300 hover:text-gray-200 hover:border-gray-400/70 font-mono"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 font-mono"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    <span className="loading-dots">Creating Session</span>
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 