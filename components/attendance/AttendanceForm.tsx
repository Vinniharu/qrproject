'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User, Mail, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AttendanceFormProps {
  sessionId: string
  onSuccess: (studentName: string) => void
}

export function AttendanceForm({ sessionId, onSuccess }: AttendanceFormProps) {
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Check if student has already marked attendance for this session
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', sessionId)
        .eq('student_email', formData.student_email)
        .single()

      if (existingRecord) {
        setErrors({ student_email: 'You have already marked attendance for this session' })
        return
      }

      // Mark attendance
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          student_name: formData.student_name.trim(),
          student_email: formData.student_email.trim().toLowerCase(),
          student_id: formData.student_id.trim(),
          marked_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error marking attendance:', error)
        setErrors({ submit: 'Failed to mark attendance. Please try again.' })
        return
      }

      onSuccess(formData.student_name)
    } catch (error) {
      console.error('Error submitting attendance:', error)
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="student_name" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name *
        </Label>
        <Input
          id="student_name"
          value={formData.student_name}
          onChange={(e) => handleInputChange('student_name', e.target.value)}
          placeholder="Enter your full name"
          disabled={isSubmitting}
          className={errors.student_name ? 'border-red-500' : ''}
        />
        {errors.student_name && (
          <p className="text-sm text-red-500">{errors.student_name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="student_email" className="flex items-center gap-2">
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
          className={errors.student_email ? 'border-red-500' : ''}
        />
        {errors.student_email && (
          <p className="text-sm text-red-500">{errors.student_email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="student_id" className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Student ID *
        </Label>
        <Input
          id="student_id"
          value={formData.student_id}
          onChange={(e) => handleInputChange('student_id', e.target.value)}
          placeholder="Enter your student ID"
          disabled={isSubmitting}
          className={errors.student_id ? 'border-red-500' : ''}
        />
        {errors.student_id && (
          <p className="text-sm text-red-500">{errors.student_id}</p>
        )}
      </div>

      {errors.submit && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Marking Attendance...
          </>
        ) : (
          'Mark My Attendance'
        )}
      </Button>
    </form>
  )
} 