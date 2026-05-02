"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { useSearchParams } from "next/navigation"

export default function VerdictPage() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get("r")
  const verdict = searchParams.get("v")

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productName, setProductName] = useState<string | null>(null)

  const recordVerdict = useMutation(api.verdictLoop.recordVerdict)

  useEffect(() => {
    if (!requestId || !verdict) {
      setError("Missing required parameters")
      return
    }

    const submitVerdict = async () => {
      try {
        await recordVerdict({
          requestId: requestId as Id<"verdict_requests">,
          verdict,
        })
        setSubmitted(true)

        // Try to get product name for the thank you message
        // This requires a query to get the request, then the story
        // For now, we'll show a generic message
      } catch (e: any) {
        setError(e.message ?? "Failed to record verdict")
      }
    }

    submitVerdict()
  }, [requestId, verdict, recordVerdict])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <a
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Return to home
          </a>
        </div>
      </div>
    )
  }

  if (!submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
          <p className="text-center mt-4 text-gray-700 dark:text-gray-300">
            Recording your feedback...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Thank you for your feedback!
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Your response helps founders improve their products and build better
          solutions for everyone.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          Return to ShipGrid
        </a>
      </div>
    </div>
  )
}
