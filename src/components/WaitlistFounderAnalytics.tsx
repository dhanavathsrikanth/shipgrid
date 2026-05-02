"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { formatDistanceToNow } from "date-fns"
import { Download, Users, Target, TrendingUp } from "lucide-react"

interface WaitlistFounderAnalyticsProps {
  storyId: Id<"stories">
  waitlistEnabled: boolean
}

export function WaitlistFounderAnalytics({
  storyId,
  waitlistEnabled,
}: WaitlistFounderAnalyticsProps) {
  const data = useQuery(api.waitlist.getWaitlistFounderData, { storyId })
  const enableWaitlist = useMutation(api.waitlist.enableWaitlist)
  const [enabling, setEnabling] = useState(false)

  const handleEnableWaitlist = async () => {
    setEnabling(true)
    try {
      await enableWaitlist({ storyId })
    } catch (e: any) {
      console.error("Failed to enable waitlist:", e)
    } finally {
      setEnabling(false)
    }
  }

  // Export CSV
  const exportCSV = () => {
    if (!data?.topSignups) return

    const headers = ["Email", "Role", "Problem", "ICP Score", "Joined At", "Referrals"]
    const rows = data.topSignups.map((s) => [
      s.email,
      s.role || "",
      s.problem || "",
      s.icpScore,
      new Date(s.joinedAt).toISOString(),
      s.referralCount,
    ])

    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `waitlist-${storyId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Generate insight text
  const getInsight = () => {
    if (!data) return ""
    const { icpMatchPct, roleCounts } = data
    const topRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]
    const topRoleName = topRole ? topRole[0] : "your audience"
    const topRolePct = topRole ? Math.round((topRole[1] / data.total) * 100) : 0

    if (icpMatchPct >= 80) {
      return `Strong ICP fit — ${topRoleName} is your core audience. Your messaging is working.`
    } else if (icpMatchPct >= 60) {
      return `Good ICP fit — ${topRoleName} leads at ${topRolePct}%. Consider messaging specifically for them.`
    } else {
      return `Low ICP match — consider revisiting your ICP declaration or your product positioning.`
    }
  }

  // Section 5: Enable waitlist toggle
  if (!waitlistEnabled) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Enable Waitlist
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Collect email signups and ICP data for your product
            </p>
          </div>
          <button
            onClick={handleEnableWaitlist}
            disabled={enabling}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {enabling ? "Enabling..." : "Enable Waitlist"}
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    )
  }

  const { total, icpMatched, outsideIcp, icpMatchPct, roleCounts, topSignups } = data

  // Sort roles by count
  const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])
  const topRole = sortedRoles[0]

  return (
    <div className="space-y-6">
      {/* SECTION 1 — Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
        </div>

        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">ICP Matched</span>
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{icpMatched}</div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Outside ICP</span>
          </div>
          <div className="text-2xl font-bold text-gray-400">{outsideIcp}</div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">ICP Match %</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{icpMatchPct}%</div>
        </div>
      </div>

      {/* SECTION 2 — Role breakdown chart */}
      {sortedRoles.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Role Breakdown
          </h3>
          <div className="space-y-3">
            {sortedRoles.map(([role, count], index) => {
              const pct = Math.round((count / total) * 100)
              const isTop = index === 0
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm ${
                        isTop ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {role}
                    </span>
                    <span className="text-xs text-gray-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isTop ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 3 — Insight text */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">{getInsight()}</p>
      </div>

      {/* SECTION 4 — Top waitlist contacts */}
      {topSignups.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Top ICP-Matched Signups
            </h3>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Email</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Role</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">ICP Score</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {topSignups.slice(0, 10).map((signup, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-gray-900 dark:text-white">
                      {signup.email.length > 20
                        ? `${signup.email.slice(0, 10)}...${signup.email.slice(-7)}`
                        : signup.email}
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                      {signup.role || "-"}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          signup.icpScore >= 70
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : signup.icpScore >= 40
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {signup.icpScore}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500" suppressHydrationWarning>
                      {formatDistanceToNow(signup.joinedAt, { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
