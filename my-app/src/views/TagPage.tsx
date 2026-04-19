"use client";

import Link from "next/link";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { StoryList } from "../components/StoryList";
import { useLayoutContext } from "../components/Layout";
import type { Story } from "../types";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";

export function TagPage({ tagSlug }: { tagSlug: string }) {
  const { viewMode } = useLayoutContext();
  const { isSignedIn } = useUser();
  const currentUser = useQuery(api.users.getMyUserDocument);
  const updateFollowedTags = useMutation(api.users.updateFollowedTags);

  const tag = useQuery(api.tags.getBySlug, tagSlug ? { slug: tagSlug } : "skip");

  const { results: stories, status, loadMore } = usePaginatedQuery(
    api.stories.listApproved,
    tag && tag._id ? { tagId: tag._id, sortPeriod: "all" } : "skip",
    { initialNumItems: 20 },
  );

  const totalCount = useQuery(
    api.stories.getApprovedCountByTag,
    tag && tag._id ? { tagId: tag._id, sortPeriod: "all" } : "skip",
  );

  if (tag === undefined) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><div className="text-center">Loading tag...</div></div>;
  }

  if (tag === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-block mb-6">← Back to Apps</Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Tag Not Found</h1>
          <p className="text-muted-foreground">The tag &quot;{tagSlug}&quot; doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const getTagDisplay = () => {
    const baseStyle = {
      backgroundColor: tag.backgroundColor || "#F4F0ED",
      color: tag.textColor || "#525252",
      border: `1px solid ${tag.borderColor || (tag.backgroundColor ? "transparent" : "#D5D3D0")}`,
    };
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium" style={baseStyle}>
        {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
        {tag.iconUrl && !tag.emoji && <img src={tag.iconUrl} alt="" className="w-4 h-4 mr-1 rounded-sm object-cover" />}
        {tag.name}
      </span>
    );
  };

  const isFollowing = Boolean(tag && currentUser?.followedTagIds?.includes(tag._id));

  const handleFollowToggle = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to follow topics");
      return;
    }
    if (!tag?._id) return;
    
    try {
      let newTags = currentUser?.followedTagIds || [];
      if (isFollowing) {
        newTags = newTags.filter(id => id !== tag._id);
      } else {
        newTags = [...newTags, tag._id];
      }
      await updateFollowedTags({ tagIds: newTags });
      toast.success(isFollowing ? `Unfollowed ${tag.name}` : `Following ${tag.name}`);
    } catch (e) {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-muted-foreground hover:text-foreground inline-block mb-6">← Back to Apps</Link>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-foreground">Apps tagged with</h1>
          {getTagDisplay()}
          {tag && (
            <button
              onClick={handleFollowToggle}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isFollowing 
                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" 
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-4 h-4" />
                  Following
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Follow Topic
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-muted-foreground">
          {totalCount === undefined ? "Loading..." : `${totalCount || 0} ${totalCount === 1 ? "app" : "apps"} found`}
        </p>
      </div>
      {stories === undefined ? (
        <div className="text-center py-12"><div className="text-muted-foreground">Loading apps...</div></div>
      ) : stories.length > 0 ? (
        <StoryList stories={stories as Story[]} viewMode={viewMode || "list"} status={status} loadMore={loadMore} itemsPerPage={20} />
      ) : totalCount === undefined ? (
        <div className="text-center py-12"><div className="text-muted-foreground">Loading apps...</div></div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-foreground mb-2">No apps found</h2>
          <p className="text-muted-foreground mb-6">There are no apps with the tag &quot;{tag.name}&quot; yet.</p>
          <Link href="/submit" className="inline-flex items-center px-4 py-2 bg-foreground text-white rounded-md hover:opacity-90 transition-opacity">Submit an App</Link>
        </div>
      )}
    </div>
  );
}
