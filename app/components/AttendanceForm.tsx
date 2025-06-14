'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { validateAttendanceData } from '@/lib/validations'

interface AttendanceFormProps {
  sessionId: string
  sessionTitle: string
  courseCode: string
  onSubmit: (data: { student_name: string; student_email?: string; student_id?: string }) => Promise<void>
  isSubmitting?: boolean
}

export default function AttendanceForm({
  sessionId,
  sessionTitle,
  courseCode,
  onSubmit,
  isSubmitting = false
}: AttendanceFormProps) {
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_id: ''
  })
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateAttendanceData({
      student_name: formData.student_name,
      student_email: formData.student_email || undefined
    })

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])
    
    try {
      await onSubmit({
        student_name: formData.student_name,
        student_email: formData.student_email || undefined,
        student_id: formData.student_id || undefined
      })
    } catch (error) {
      setErrors(['Failed to mark attendance. Please try again.'])
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors.length > 0) {
      setErrors([])
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
        <CardDescription>
          {sessionTitle} - {courseCode}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="student_name" className="block text-sm font-medium mb-1">
              Full Name *
            </label>
            <Input
              id="student_name"
              type="text"
              value={formData.student_name}
              onChange={(e) => handleInputChange('student_name', e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="student_email" className="block text-sm font-medium mb-1">
              Email (Optional)
            </label>
            <Input
              id="student_email"
              type="email"
              value={formData.student_email}
              onChange={(e) => handleInputChange('student_email', e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="student_id" className="block text-sm font-medium mb-1">
              Student ID (Optional)
            </label>
            <Input
              id="student_id"
              type="text"
              value={formData.student_id}
              onChange={(e) => handleInputChange('student_id', e.target.value)}
              placeholder="Enter your student ID"
              disabled={isSubmitting}
            />
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Marking Attendance...' : 'Mark Attendance'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 