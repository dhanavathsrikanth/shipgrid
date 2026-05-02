"use client"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"

interface BetaFeedbackSummaryProps {
  storyId: Id<"stories">
}

export function BetaFeedbackSummary({ storyId }: BetaFeedbackSummaryProps) {
  const summary = useQuery(api.feedback.getBetaFeedbackSummary, { storyId })

  if (!summary || summary.total === 0) return null

  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
      <div className="flex items-center gap-1">
        <span className="font-medium">{summary.total}</span>
        <span>feedback</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium text-green-600">{summary.verdictCounts.using}</span>
        <span>using</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium text-amber-600">{summary.verdictCounts.dropped}</span>
        <span>dropped</span>
      </div>
      {summary.usingPct > 0 && (
        <div className="flex items-center gap-1">
          <span className="font-medium">{summary.usingPct}%</span>
          <span>retention</span>
        </div>
      )}
    </div>
  )
}
