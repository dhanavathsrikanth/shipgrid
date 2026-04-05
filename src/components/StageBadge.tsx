'use client'
import { useState, useEffect } from 'react'

export function StageBadge({ stage, betaOpenedAt }: {
  stage?: string
  betaOpenedAt?: number
}) {
  const [hoursLeft, setHoursLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!betaOpenedAt) return
    const calc = () => {
      const elapsed = (Date.now() - betaOpenedAt) / 3600000
      setHoursLeft(Math.max(0, 72 - elapsed))
    }
    calc()
    const interval = setInterval(calc, 60000) // update every minute
    return () => clearInterval(interval)
  }, [betaOpenedAt])

  if (stage === 'building') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">🏗 Building</span>
  }

  if (stage === 'beta') {
    if (hoursLeft !== null && hoursLeft > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)] animate-pulse">
          ⚡ Beta · {Math.floor(hoursLeft)}h left
        </span>
      )
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">⚡ Beta</span>
  }

  if (stage === 'live') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">✅ Live</span>
  }

  // Handle older products seamlessly or default state
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">✅ Live</span> 
}
