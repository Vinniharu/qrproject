'use client'

import { AttendanceSession, AttendanceRecord } from '@/types'
import { Button } from './ui/button'
import { Download } from 'lucide-react'

interface PDFGeneratorProps {
  session: AttendanceSession
  records: AttendanceRecord[]
  isGenerating?: boolean
  onGenerate: () => Promise<void>
}

export default function PDFGenerator({ 
  session, 
  records, 
  isGenerating = false,
  onGenerate 
}: PDFGeneratorProps) {
  const onTimeCount = records.filter(r => !r.is_late).length
  const lateCount = records.filter(r => r.is_late).length

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Download Report</h3>
          <p className="text-sm text-gray-600">
            Generate a PDF report of attendance for this session
          </p>
        </div>
        <Button 
          onClick={onGenerate}
          disabled={isGenerating || records.length === 0}
          className="flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Download PDF'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Total Students</p>
          <p className="font-semibold text-lg">{records.length}</p>
        </div>
        <div>
          <p className="text-gray-600">On Time</p>
          <p className="font-semibold text-lg text-green-600">{onTimeCount}</p>
        </div>
        <div>
          <p className="text-gray-600">Late</p>
          <p className="font-semibold text-lg text-red-600">{lateCount}</p>
        </div>
        <div>
          <p className="text-gray-600">Attendance Rate</p>
          <p className="font-semibold text-lg">
            {records.length > 0 ? Math.round((onTimeCount / records.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {records.length === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            No attendance records available for this session yet.
          </p>
        </div>
      )}
    </div>
  )
} 