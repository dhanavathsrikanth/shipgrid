"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MatchedStoriesShelf } from "@/components/MatchedStoriesShelf";
import { IcpBanner } from "@/components/IcpBanner";
import { StoryList } from "@/components/StoryList";
import { useLayoutContext } from "@/components/Layout";
import type { Story } from "@/types";

export default function HomePage() {
  const { viewMode, selectedTagId, sortPeriod } = useLayoutContext();
  const settings = useQuery(api.settings.get);

  const {
    results: stories,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.stories.listApproved,
    { tagId: selectedTagId, sortPeriod: sortPeriod },
    { initialNumItems: settings?.itemsPerPage || 20 },
  );

  if (status === "LoadingFirstPage" || settings === undefined) {
    return <div>Loading...</div>;
  }

  if (!stories || stories.length === 0) {
    return (
      <div>
        No apps found in this category.{" "}
        <a href="/submit">Why not submit one?</a>
      </div>
    );
  }

  return (
    <>
      <IcpBanner />
      {!selectedTagId && <MatchedStoriesShelf />}
      <StoryList
        stories={stories as Story[]}
        viewMode={viewMode}
        status={status}
        loadMore={loadMore}
        itemsPerPage={settings.itemsPerPage}
      />
    </>
  );
}
