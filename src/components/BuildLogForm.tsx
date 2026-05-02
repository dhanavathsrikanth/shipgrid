"use client"
import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"

interface BuildLogFormProps {
  storyId: Id<"stories">
  storyUserId: Id<"users">
  currentUserId?: Id<"users">
}

export function BuildLogForm({ storyId, storyUserId, currentUserId }: BuildLogFormProps) {
  const [buildingNow, setBuildingNow] = useState("")
  const [shippedLast, setShippedLast] = useState("")
  const [notWorking, setNotWorking] = useState("")
  const [learnedThis, setLearnedThis] = useState("")
  const [needHelpWith, setNeedHelpWith] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publishBuildLog = useMutation(api.buildlog.publishBuildLog)

  // Only show for the product owner (compare Convex IDs)
  if (!currentUserId || currentUserId !== storyUserId) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!buildingNow.trim()) {
      setError("Building now is required")
      return
    }
    if (!shippedLast.trim()) {
      setError("Shipped last is required")
      return
    }

    setLoading(true)

    try {
      await publishBuildLog({
        storyId,
        buildingNow: buildingNow.trim(),
        shippedLast: shippedLast.trim(),
        notWorking: notWorking.trim() || undefined,
        learnedThis: learnedThis.trim() || undefined,
        needHelpWith: needHelpWith.trim() || undefined,
      })
      setSuccess(true)
      // Reset form
      setBuildingNow("")
      setShippedLast("")
      setNotWorking("")
      setLearnedThis("")
      setNeedHelpWith("")
    } catch (e: any) {
      setError(e.message ?? "Failed to publish build log")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4">
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
          ✓ Build log published successfully!
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs text-green-600 dark:text-green-500 hover:underline"
        >
          Publish another
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        Publish Build Update
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Building Now (required) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Building now <span className="text-red-500">*</span>
          </label>
          <textarea
            value={buildingNow}
            onChange={(e) => setBuildingNow(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 resize-none"
            placeholder="What are you building right now?"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {buildingNow.length}/200
          </div>
        </div>

        {/* Shipped Last (required) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Shipped last <span className="text-red-500">*</span>
          </label>
          <textarea
            value={shippedLast}
            onChange={(e) => setShippedLast(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 resize-none"
            placeholder="What did you ship recently?"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {shippedLast.length}/200
          </div>
        </div>

        {/* Not Working (optional) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Not working yet (optional)
          </label>
          <textarea
            value={notWorking}
            onChange={(e) => setNotWorking(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 resize-none"
            placeholder="What's not working yet? (Trust signal)"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {notWorking.length}/200
          </div>
        </div>

        {/* Learned This (optional) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Learned (optional)
          </label>
          <textarea
            value={learnedThis}
            onChange={(e) => setLearnedThis(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 resize-none"
            placeholder="What did you learn?"
          />
        </div>

        {/* Need Help With (optional) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Need help with (optional)
          </label>
          <textarea
            value={needHelpWith}
            onChange={(e) => setNeedHelpWith(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 resize-none"
            placeholder="What do you need help with?"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {loading ? "Publishing..." : "Publish Build Log"}
        </button>
      </form>
    </div>
  )
}
