"use client"
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"

interface BetaFeedbackFormProps {
  storyId: Id<"stories">
  storyUserId: Id<"users">
  currentStage?: string
  currentUserId?: Id<"users">
}

export function BetaFeedbackForm({
  storyId,
  storyUserId,
  currentStage,
  currentUserId,
}: BetaFeedbackFormProps) {
  const { user } = useUser()
  const [problemSolved, setProblemSolved] = useState("")
  const [doesntDo, setDoesntDo] = useState("")
  const [notForWho, setNotForWho] = useState("")
  const [verdict, setVerdict] = useState<"using" | "dropped" | "never_tried">("using")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitBetaFeedback = useMutation(api.feedback.submitBetaFeedback)
  const myFeedback = useQuery(
    api.feedback.getMyBetaFeedback,
    user ? { storyId } : "skip"
  )

  // Only show for beta or live stage, not for product owner (compare Convex IDs)
  const shouldShow =
    user &&
    currentUserId &&
    currentUserId !== storyUserId &&
    (currentStage === "beta" || currentStage === "live")

  if (!shouldShow) return null

  // If user has existing feedback, populate form
  useEffect(() => {
    if (myFeedback) {
      setProblemSolved(myFeedback.problemSolved)
      setDoesntDo(myFeedback.doesntDo)
      setNotForWho(myFeedback.notForWho)
      setVerdict(myFeedback.verdict as "using" | "dropped" | "never_tried")
      setSubmitted(true)
    }
  }, [myFeedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!problemSolved.trim()) {
      setError("Please describe what problem it solved")
      return
    }
    if (!doesntDo.trim()) {
      setError("Please describe what it doesn't do")
      return
    }
    if (!notForWho.trim()) {
      setError("Please specify who should not use this")
      return
    }

    setLoading(true)

    try {
      await submitBetaFeedback({
        storyId,
        problemSolved: problemSolved.trim(),
        doesntDo: doesntDo.trim(),
        notForWho: notForWho.trim(),
        verdict,
      })
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message ?? "Failed to submit feedback")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    setSubmitted(false)
  }

  if (submitted && myFeedback) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4">
        <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">
          ✓ Your Feedback
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Problem solved:</span>
            <p className="text-gray-700 dark:text-gray-300">{myFeedback.problemSolved}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Doesn't do:</span>
            <p className="text-gray-700 dark:text-gray-300">{myFeedback.doesntDo}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Not for:</span>
            <p className="text-gray-700 dark:text-gray-300">{myFeedback.notForWho}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Verdict:</span>
            <span
              className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                myFeedback.verdict === "using"
                  ? "bg-green-100 text-green-700"
                  : myFeedback.verdict === "dropped"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {myFeedback.verdict === "using"
                ? "✅ Still using"
                : myFeedback.verdict === "dropped"
                ? "⚠️ Tried and dropped"
                : "❌ Never activated"}
            </span>
          </div>
        </div>
        <button
          onClick={handleUpdate}
          className="mt-3 text-xs text-green-600 dark:text-green-500 hover:underline"
        >
          Update feedback
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        Beta Feedback
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Problem Solved */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            What problem did it solve for you?
          </label>
          <textarea
            value={problemSolved}
            onChange={(e) => setProblemSolved(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 resize-none"
            placeholder="Describe the problem this product solved for you..."
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {problemSolved.length}/500
          </div>
        </div>

        {/* Doesn't Do */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            What does it NOT do that you expected?
          </label>
          <textarea
            value={doesntDo}
            onChange={(e) => setDoesntDo(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 resize-none"
            placeholder="What features or functionality were you expecting..."
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {doesntDo.length}/500
          </div>
        </div>

        {/* Not For Who */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Who should NOT use this?
          </label>
          <input
            type="text"
            value={notForWho}
            onChange={(e) => setNotForWho(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400"
            placeholder="e.g., Small teams, non-technical users..."
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {notForWho.length}/200
          </div>
        </div>

        {/* Verdict */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Your verdict
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setVerdict("using")}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                verdict === "using"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              }`}
            >
              ✅ Still using
            </button>
            <button
              type="button"
              onClick={() => setVerdict("dropped")}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                verdict === "dropped"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              }`}
            >
              ⚠️ Tried & dropped
            </button>
            <button
              type="button"
              onClick={() => setVerdict("never_tried")}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                verdict === "never_tried"
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              }`}
            >
              ❌ Never activated
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  )
}
