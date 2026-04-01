"use client";

import React from "react";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { WeeklyTopCategory } from "../../convex/tags"; // Import the type
import { Hash } from "lucide-react"; // Example icon
import type { Id } from "../../convex/_generated/dataModel";

interface TopCategoriesOfWeekProps {
  selectedTagId: Id<"tags"> | undefined;
  setSelectedTagId: (tagId: Id<"tags"> | undefined) => void;
}

export function TopCategoriesOfWeek({
  selectedTagId,
  setSelectedTagId,
}: TopCategoriesOfWeekProps) {
  const topCategories = useQuery(api.tags.getWeeklyTopCategories, {
    limit: 10,
  });
  const router = useRouter();
  const pathname = usePathname();

  if (topCategories === undefined) {
    return (
      <div className="p-4 bg-card rounded-lg border border-border">
        Loading categories...
      </div>
    );
  }

  if (!topCategories || topCategories.length === 0) {
    return (
      <div className="p-4 bg-card rounded-lg border border-border">
        <h3 className="text-md font-normal text-foreground mb-3">
          Top Categories This Week
        </h3>
        <p className="text-sm text-muted-foreground">
          No active categories this week.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card rounded-lg border border-border">
      <h3 className="text-md font-normal text-foreground mb-3">
        Top Categories This Week
      </h3>
      <ul className="space-y-2">
        {/* "All" button */}
        <li>
          <button
            onClick={() => {
              setSelectedTagId(undefined);
              if (pathname !== "/") {
                router.push("/");
              }
            }}
            className={`flex items-center w-full text-left gap-2 text-sm py-1 rounded-md focus:outline-none
                        ${
                          selectedTagId === undefined
                            ? "text-foreground font-semibold ring-1 ring-offset-1 bg-muted ring-ring"
                            : "text-muted-foreground hover:text-foreground hover:underline"
                        }`}
            title="Show All Categories"
          >
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="flex-grow truncate" title="All Categories">
              All
            </span>
            {/* Optionally, you might want to hide or not show a count for "All" */}
          </button>
        </li>

        {topCategories
          .filter(
            (category) =>
              category.name !== "resendhackathon" &&
              category.name !== "ychackathon",
          )
          .map((category) => {
            if (!category.slug) {
              // Optionally, render something different for tags without slugs, or just skip
              // For now, we skip rendering if no slug, as it can't be linked.
              // console.warn(`Category "${category.name}" has no slug, skipping link.`);
              return (
                <li
                  key={category._id}
                  className="flex items-center gap-2 text-sm text-foreground py-1 opacity-90"
                >
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span
                    className="flex-grow truncate"
                    title={`${category.name} (no slug)`}
                  >
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({category.count})
                  </span>
                </li>
              );
            }
            // Category has a slug, make it a button
            const isSelected = selectedTagId === category._id;
            return (
              <li key={category._id}>
                <button
                  onClick={() => {
                    const newSelectedId = isSelected ? undefined : category._id;
                    setSelectedTagId(newSelectedId);
                    if (pathname !== "/") {
                      router.push("/");
                    }
                  }}
                  className={`flex items-center w-full text-left gap-2 text-sm py-1 rounded-md focus:outline-none
                            ${
                              isSelected
                                ? "text-foreground font-semibold ring-1 ring-offset-1  bg-background ring-ring"
                                : "text-muted-foreground hover:text-foreground hover:underline"
                            }`}
                  title={category.name}
                >
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-grow truncate" title={category.name}>
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({category.count})
                  </span>
                </button>
              </li>
            );
          })}
      </ul>
      {/* Optionally, add a link to explore all communities/categories like in the image */}
      {/* <div className="mt-4">
        <Link href="/communities" className="text-sm text-blue-600 hover:underline">Explore Communities</Link>
      </div> */}
    </div>
  );
}





