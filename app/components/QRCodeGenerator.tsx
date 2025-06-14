'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
}

export default function QRCodeGenerator({ 
  value, 
  size = 256, 
  className = '' 
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('Error generating QR code:', error)
        }
      })
    }
  }, [value, size])

  if (!value) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-gray-500 text-sm">No QR Code Data</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas 
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
      <p className="mt-2 text-xs text-gray-600 text-center max-w-xs">
        Scan this QR code to mark attendance
      </p>
    </div>
  )
} 