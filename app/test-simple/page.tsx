'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SimpleTestPage() {
  const [sessionId, setSessionId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testAttendance = async () => {
    if (!sessionId || !studentName || !studentEmail) {
      alert('Please fill in Session ID, Student Name, and Student Email')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/attendance/${sessionId}/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName,
          student_email: studentEmail,
          student_id: studentId
        })
      })

      const data = await response.json()
      
      setResult({
        status: response.status,
        success: response.ok,
        data: data
      })

    } catch (error) {
      setResult({
        status: 'ERROR',
        success: false,
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Simple Attendance API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Session ID *</label>
            <Input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Enter session ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Student Name *</label>
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Student Email *</label>
            <Input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="Enter student email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Student ID (Optional)</label>
            <Input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID"
            />
          </div>
          
          <Button 
            onClick={testAttendance} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Attendance Submission'}
          </Button>
          
          {result && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-bold mb-2">Result:</h3>
              <div className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p><strong>Status:</strong> {result.status}</p>
                <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
              </div>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 