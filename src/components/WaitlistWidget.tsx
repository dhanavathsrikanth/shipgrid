"use client"
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { copyToClipboard } from "@/lib/clipboard"

interface WaitlistWidgetProps {
  storyId: Id<"stories">
  productName: string
  icpRoles?: string[]
  icpProblem?: string
  icpBudget?: string
}

const ROLE_OPTIONS = [
  "Freelance Designer", "Developer", "Marketer", "Ops Manager",
  "Consultant", "Founder", "HR Manager", "Content Creator", "Other"
]

const PROBLEM_OPTIONS = [
  "Chasing late payments",
  "Manual repetitive work",
  "Managing client communication",
  "Tracking time and projects",
  "Team coordination",
  "Finding and converting leads",
  "Automating workflows",
  "Data analysis and reporting",
]

const BUDGET_OPTIONS = [
  { label: "Free only", value: "free" },
  { label: "$10–30 / month", value: "10_30" },
  { label: "$30–50 / month", value: "30_50" },
  { label: "$50–100 / month", value: "50_100" },
  { label: "$100+ / month", value: "100_plus" },
]

export function WaitlistWidget({
  storyId, productName, icpRoles, icpProblem, icpBudget
}: WaitlistWidgetProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [problem, setProblem] = useState("")
  const [budget, setBudget] = useState("")
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [step, setStep] = useState<"form" | "success">("form")
  const [position, setPosition] = useState<number | null>(null)
  const [isMatch, setIsMatch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyDone, setCopyDone] = useState(false)

  // Get referral code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) setReferralCode(ref)
  }, [])

  const publicData = useQuery(api.waitlist.getWaitlistPublicData, { storyId })
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist)

  const handleJoin = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }
    if (!role) { setError("Please select your role"); return }
    if (!problem) { setError("Please select your main problem"); return }
    if (!budget) { setError("Please select your budget"); return }

    setLoading(true)
    setError(null)

    try {
      const result = await joinWaitlist({
        storyId,
        email,
        role,
        problem,
        budgetRange: budget,
        referredBy: referralCode ?? undefined,
      })

      if (result.alreadyJoined) {
        setError("You're already on this waitlist!")
        setLoading(false)
        return
      }

      setPosition(result.position)
      setIsMatch(result.isMatch ?? false)
      setReferralCode(result.referralCode ?? null)
      setStep("success")
    } catch (e: any) {
      setError(e.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const copyReferral = async () => {
    const url = `${window.location.origin}/products/${storyId}?ref=${referralCode}`
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    }
  }

  const MILESTONE_LABELS = ["1 referral — skip 20 spots", "3 referrals — skip 60 spots", "5 referrals — early access", "10 referrals — 3 months free"]

  if (step === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-6">
        <div className="text-green-700 dark:text-green-400 text-sm font-semibold mb-1">
          🎉 You're #{position} on the waitlist
        </div>
        <p className="text-xs text-green-600 dark:text-green-500 mb-4">
          {isMatch
            ? `Great news — your profile matches ${productName}'s target audience. You'll get priority access when beta opens.`
            : `You're on the waitlist! You'll be notified when ${productName} launches beta.`}
        </p>

        {/* Referral box */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">
            📣 Move up — share your link
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 text-xs font-mono bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md px-3 py-2 text-green-700 dark:text-green-400 truncate">
              {typeof window !== "undefined"
                ? `${window.location.origin}/products/${storyId}?ref=${referralCode}`
                : `shipgrid.com/p/${storyId}?ref=${referralCode}`}
            </div>
            <button
              onClick={copyReferral}
              className="px-3 py-2 bg-green-700 text-white rounded-md text-xs font-semibold hover:bg-green-800 transition-colors"
            >
              {copyDone ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {MILESTONE_LABELS.map((m, i) => (
              <div key={i} className="text-center p-2 rounded bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800">
                <div className="text-xs text-green-700 dark:text-green-400 leading-tight">{m}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header with live stats */}
      {publicData && (
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-center">
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{publicData.total}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">On waitlist</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-green-600">{publicData.icpMatchPct}%</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">ICP matched</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Join waitlist — declare your intent
        </div>

        {/* ICP Questions */}
        <div className="space-y-3 mb-4">
          {/* Role */}
          <div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Your role</div>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    role === r
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Problem */}
          <div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Main problem you want solved</div>
            <div className="flex flex-wrap gap-1.5">
              {PROBLEM_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setProblem(p)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    problem === p
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Monthly budget for this type of tool</div>
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_OPTIONS.map(b => (
                <button
                  key={b.value}
                  onClick={() => setBudget(b.value)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    budget === b.value
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Email + Submit */}
        <div className="flex gap-2 mb-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400"
            onKeyDown={e => e.key === "Enter" && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? "Joining..." : "Join waitlist →"}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <p className="text-xs text-gray-400">Your ICP data helps the founder understand who is waiting. No spam.</p>
      </div>
    </div>
  )
}
