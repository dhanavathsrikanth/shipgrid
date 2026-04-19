import React from "react";
import { formatDistanceToNow } from "date-fns";

export const StageBadge = ({
  stage,
  betaOpenedAt,
}: {
  stage?: string;
  betaOpenedAt?: number;
}) => {
  if (!stage) return null;

  switch (stage) {
    case "idea":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
          💡 Idea Stage
        </span>
      );
    case "building":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
          🚧 Building
        </span>
      );
    case "beta":
      let betaLabel = "Beta";
      if (betaOpenedAt) {
        const openedAtStr = formatDistanceToNow(betaOpenedAt, { addSuffix: true });
        betaLabel = `Beta (Opened ${openedAtStr})`;
      }
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400" title={betaLabel}>
          🧪 Beta
        </span>
      );
    case "live":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
          🚀 Live
        </span>
      );
    case "acquired":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400">
          🤝 Acquired
        </span>
      );
    case "sunset":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:border-gray-800 dark:text-gray-400">
          🌅 Sunset
        </span>
      );
    default:
      return null;
  }
};
