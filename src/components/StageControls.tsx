"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { StageBadge } from "./StageBadge"
import { BuildLogForm } from "./BuildLogForm"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Users, TrendingUp, ExternalLink, AlertCircle, Copy, Check } from "lucide-react"

interface StageControlsProps {
  storyId: Id<"stories">
  storyUserId: Id<"users">
  currentStage?: string
  betaOpenedAt?: number
  waitlistEnabled?: boolean
  storySlug?: string
  currentUserId?: Id<"users">
}

export function StageControls({
  storyId,
  storyUserId,
  currentStage,
  betaOpenedAt,
  waitlistEnabled,
  storySlug,
  currentUserId,
}: StageControlsProps) {
  const [showBuildForm, setShowBuildForm] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [movingToLive, setMovingToLive] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [mounted, setMounted] = useState(false)

  const moveToBeta = useMutation(api.stories.moveToBeta)
  const moveToLive = useMutation(api.stories.moveToLive)
  const enableWaitlist = useMutation(api.waitlist.enableWaitlist)
  const [enablingWaitlist, setEnablingWaitlist] = useState(false)

  // Fetch followers count
  const followers = useQuery(api.follows.getProductFollowers, { storyId })

  // Calculate beta window status
  const betaWindowHoursLeft = betaOpenedAt
    ? Math.max(0, 72 - (Date.now() - betaOpenedAt) / 3600000)
    : 0
  const betaWindowClosed = betaOpenedAt && betaWindowHoursLeft <= 0

  const handleLaunchBeta = async () => {
    if (!waitlistEnabled) {
      if (!confirm("Tip: Enable your waitlist to collect ICP-declared signups before beta. You can still launch without it. Continue?")) {
        return
      }
    }
    setLaunching(true)
    try {
      await moveToBeta({ storyId })
      toast.success("Beta launched! Your 72h window is now open.")
    } catch (e: any) {
      alert(e.message ?? "Failed to launch beta")
    } finally {
      setLaunching(false)
    }
  }

  const handleMoveToLive = async () => {
    setMovingToLive(true)
    try {
      await moveToLive({ storyId })
      toast.success("Product is now live! It will be permanently indexed.")
    } catch (e: any) {
      alert(e.message ?? "Failed to move to live")
    } finally {
      setMovingToLive(false)
    }
  }

  const handleEnableWaitlist = async () => {
    setEnablingWaitlist(true)
    try {
      await enableWaitlist({ storyId })
      toast.success("Waitlist enabled! Share your waitlist URL to collect signups.")
    } catch (e: any) {
      console.error("[EnableWaitlist] Error:", e)
      alert(e.message ?? "Failed to enable waitlist")
    } finally {
      setEnablingWaitlist(false)
    }
  }

  const handleCopyWaitlistUrl = () => {
    if (typeof window !== "undefined" && storySlug) {
      const url = `${window.location.origin}/s/${storySlug}?tab=waitlist`
      navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  useEffect(() => { setMounted(true) }, [])

  const stage = currentStage || "building"

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      {/* Stage Badge */}
      <div className="flex items-center gap-3 mb-4">
        <StageBadge stage={stage} betaOpenedAt={betaOpenedAt} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {stage === "idea" && "Idea Stage"}
            {stage === "building" && "Building Stage"}
            {stage === "beta" && "Beta Launch Window"}
            {stage === "live" && "Live Product"}
          </h3>
        </div>
      </div>

      {/* Context Message */}
      <div className="mb-6">
        {stage === "idea" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your product is in the idea phase. Gather interest and validate demand before building.
          </p>
        )}
        {stage === "building" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your product is not in the feed yet. Build followers and enable your
            waitlist before launching beta.
          </p>
        )}
        {stage === "beta" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {betaWindowClosed
              ? "Your beta window has closed. Move to Live when ready."
              : "Your 72h launch window is open. ICP-matched users can see you at the top of their feed."}
          </p>
        )}
        {stage === "live" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your product is permanently indexed. Post changelogs to resurface
            in matched feeds.
          </p>
        )}
      </div>

      {/* IDEA STAGE */}
      {stage === "idea" && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!waitlistEnabled && (
              <button
                onClick={handleEnableWaitlist}
                disabled={enablingWaitlist}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {enablingWaitlist ? "Enabling..." : "Enable Waitlist"}
              </button>
            )}
          </div>

          {/* Warning */}
          {!waitlistEnabled && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Enable your waitlist to collect ICP-declared signups and validate demand.
              </p>
            </div>
          )}
        </div>
      )}

      {/* BUILDING STAGE */}
      {stage === "building" && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!waitlistEnabled && (
              <button
                onClick={handleEnableWaitlist}
                disabled={enablingWaitlist}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {enablingWaitlist ? "Enabling..." : "Enable Waitlist"}
              </button>
            )}
            <button
              onClick={() => setShowBuildForm(!showBuildForm)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {showBuildForm ? "Hide Build Form" : "Publish Build Update"}
            </button>
            <button
              onClick={handleLaunchBeta}
              disabled={launching}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {launching ? "Launching..." : "Launch Beta — 72h Window"}
            </button>
          </div>

          {/* Warning */}
          {!waitlistEnabled && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Tip: Enable your waitlist to collect ICP-declared signups before
                beta. You can still launch without it.
              </p>
            </div>
          )}

          {/* Follower Count */}
          {followers !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>
                {followers.length} people following for beta notification
              </span>
            </div>
          )}

          {/* Inline Build Form */}
          {showBuildForm && (
            <div className="mt-4">
              <BuildLogForm storyId={storyId} storyUserId={storyUserId} currentUserId={currentUserId} />
            </div>
          )}
        </div>
      )}

      {/* BETA STAGE */}
      {stage === "beta" && (
        <div className="space-y-4">
          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>ICP-matched views: Coming soon</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowBuildForm(!showBuildForm)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {showBuildForm ? "Hide Changelog Form" : "Post Changelog"}
            </button>
            {!betaWindowClosed && (
              <button
                onClick={handleMoveToLive}
                disabled={movingToLive}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {movingToLive ? "Moving..." : "Mark as Live"}
              </button>
            )}
          </div>

          {/* Inline Build Form */}
          {showBuildForm && (
            <div className="mt-4">
              <BuildLogForm storyId={storyId} storyUserId={storyUserId} currentUserId={currentUserId} />
            </div>
          )}
        </div>
      )}

      {/* LIVE STAGE */}
      {stage === "live" && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>Total ICP-matched views: Coming soon</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowBuildForm(!showBuildForm)}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              {showBuildForm ? "Hide Changelog Form" : "Post Changelog"}
            </button>
          </div>

          {/* Inline Build Form */}
          {showBuildForm && (
            <div className="mt-4">
              <BuildLogForm storyId={storyId} storyUserId={storyUserId} currentUserId={currentUserId} />
            </div>
          )}

          {/* Last Activity Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Post changelogs regularly to resurface in matched feeds and maintain
              visibility.
            </p>
          </div>
        </div>
      )}

      {/* ACROSS ALL STAGES */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {/* Waitlist Share URL */}
        {waitlistEnabled && storySlug && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                  Share your waitlist
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-500 font-mono truncate" suppressHydrationWarning>
                  {mounted
                    ? `${window.location.origin}/s/${storySlug}?tab=waitlist`
                    : `/s/${storySlug}?tab=waitlist`}
                </div>
              </div>
              <button
                onClick={handleCopyWaitlistUrl}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Follower Count */}
        {followers !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Users className="w-4 h-4" />
            <span>{followers.length} active followers</span>
          </div>
        )}

        {/* Waitlist Link */}
        {waitlistEnabled && storySlug && (
          <a
            href={`/w/${storySlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View public waitlist page</span>
          </a>
        )}
      </div>
    </div>
  )
}
