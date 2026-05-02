"use client"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { formatDistanceToNow } from "date-fns"

interface BuildLogDisplayProps {
  storyId: Id<"stories">
}

export function BuildLogDisplay({ storyId }: BuildLogDisplayProps) {
  const buildLog = useQuery(api.buildlog.getLatestBuildLog, { storyId })

  if (!buildLog) return null

  const sections = [
    { label: "Building now", content: buildLog.buildingNow, color: "text-gray-900 dark:text-white" },
    { label: "Shipped last", content: buildLog.shippedLast, color: "text-gray-900 dark:text-white" },
    { label: "Not working yet", content: buildLog.notWorking, color: "text-orange-600 dark:text-orange-400" },
    { label: "Learned", content: buildLog.learnedThis, color: "text-gray-700 dark:text-gray-300" },
    { label: "Need help with", content: buildLog.needHelpWith, color: "text-gray-700 dark:text-gray-300" },
  ]

  const visibleSections = sections.filter((s) => s.content)

  if (visibleSections.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Latest Build Update
        </h3>
        <span className="text-xs text-gray-400" suppressHydrationWarning>
          {formatDistanceToNow(buildLog.publishedAt)} ago
        </span>
      </div>

      <div className="space-y-3">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <div className="text-xs font-medium text-gray-500 mb-1">{section.label}</div>
            <p className={`text-sm ${section.color} leading-relaxed`}>
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
