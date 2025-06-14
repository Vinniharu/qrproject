'use client'

import Link from 'next/link'
import { AttendanceSession } from '@/types'
import { formatDate, formatTime } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Calendar, Clock, Users, QrCode } from 'lucide-react'

interface SessionCardProps {
  session: AttendanceSession
  attendanceCount?: number
}

export default function SessionCard({ session, attendanceCount = 0 }: SessionCardProps) {
  const isActive = session.is_active
  const sessionDate = new Date(session.session_date)
  const today = new Date()
  const isPast = sessionDate < today

  return (
    <Card className={`transition-all hover:shadow-md ${!isActive ? 'opacity-75' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            <CardDescription className="mt-1">
              {session.course_code}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {isActive ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Inactive
              </span>
            )}
            {isPast && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Past
              </span>
            )}
          </div>
        </div>
        {session.description && (
          <p className="text-sm text-gray-600 mt-2">{session.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(session.session_date)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {formatTime(session.start_time)} - {formatTime(session.end_time)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {attendanceCount} student{attendanceCount !== 1 ? 's' : ''} attended
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/dashboard/lecturer/sessions/${session.id}`}>
              <QrCode className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
          {isActive && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/attend/${session.id}`} target="_blank">
                Test QR
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 