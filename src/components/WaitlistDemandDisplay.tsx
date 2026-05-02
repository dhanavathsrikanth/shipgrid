"use client"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"

interface WaitlistDemandDisplayProps {
  storyId: Id<"stories">
}

export function WaitlistDemandDisplay({ storyId }: WaitlistDemandDisplayProps) {
  const data = useQuery(api.waitlist.getWaitlistPublicData, { storyId })

  if (!data || data.total === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Live demand data — {data.total} people waiting
      </div>

      {/* Role bars */}
      {data.roleBreakdown.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">Waitlist by role</div>
          <div className="space-y-1.5">
            {data.roleBreakdown.map(r => (
              <div key={r.role}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-700 dark:text-gray-300">{r.role}</span>
                  <span className="text-gray-400">{r.pct}%</span>
                </div>
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-1 bg-gray-800 dark:bg-white rounded"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top problems */}
      {data.topProblems.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1.5">Top declared problems</div>
          <div className="flex flex-wrap gap-1.5">
            {data.topProblems.map((p, i) => (
              <span
                key={p}
                className={`px-2 py-1 rounded-full text-xs ${
                  i === 0
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
