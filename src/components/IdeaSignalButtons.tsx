"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"

interface IdeaSignalButtonsProps {
  storyId: Id<"stories">
  storyUserId: Id<"users">
  currentStage?: string
  currentUserId?: Id<"users">
}

export function IdeaSignalButtons({
  storyId,
  storyUserId,
  currentStage,
  currentUserId,
}: IdeaSignalButtonsProps) {
  const { user } = useUser()
  const [mySignal, setMySignal] = useState<string | null>(null)

  const sendIdeaSignal = useMutation(api.ideaSignals.sendIdeaSignal)
  const summary = useQuery(api.ideaSignals.getIdeaSignalSummary, { storyId })
  const mySignalQuery = useQuery(
    api.ideaSignals.getMySignal,
    user ? { storyId } : "skip"
  )

  // Sync with query result
  useEffect(() => {
    if (mySignalQuery) {
      setMySignal(mySignalQuery.signal)
    }
  }, [mySignalQuery])

  // Only show for building or idea stage, not for product owner (compare Convex IDs)
  const shouldShow =
    user &&
    currentUserId &&
    currentUserId !== storyUserId &&
    (currentStage === "building" || currentStage === "idea")

  if (!shouldShow) return null

  const handleSignal = async (signal: string) => {
    // If clicking the same signal, deselect
    if (mySignal === signal) {
      await sendIdeaSignal({ storyId, signal })
      setMySignal(null)
    } else {
      // Otherwise, set new signal
      await sendIdeaSignal({ storyId, signal })
      setMySignal(signal)
    }
  }

  const buttons = [
    { signal: "interested", label: "I'd use this", emoji: "👀" },
    { signal: "would_pay", label: "I'd pay for this", emoji: "💰" },
    { signal: "not_for_me", label: "Not for me", emoji: "❌" },
  ]

  const counts = summary?.counts || { interested: 0, would_pay: 0, not_for_me: 0 }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {buttons.map((btn) => {
          const isSelected = mySignal === btn.signal
          const count = counts[btn.signal as keyof typeof counts] || 0

          return (
            <button
              key={btn.signal}
              onClick={() => handleSignal(btn.signal)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <span>{btn.emoji}</span>
              <span>{btn.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Signal summary */}
      {summary && summary.total > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {counts.interested} people said they'd use this · {counts.would_pay} said
          they'd pay
        </p>
      )}
    </div>
  )
}
