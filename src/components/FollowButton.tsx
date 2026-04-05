'use client'

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  storyId: Id<"stories">;
  className?: string;
  showLabel?: boolean;
}

export function FollowButton({ storyId, className = "", showLabel = false }: FollowButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();

  // We can also pass initial status if we want to avoid flicker, but query is usually fast
  const isFollowing = useQuery(api.follows.isFollowingProduct, { storyId });
  const toggleFollow = useMutation(api.follows.toggleProductFollow);

  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      toast.error("Please sign in to follow this product.");
      router.push("/sign-in");
      return;
    }

    try {
      setIsLoading(true);
      const res = await toggleFollow({ storyId });
      if (res.isFollowing) {
        toast.success("You are now following this product for updates!");
      } else {
        toast.success("You unfollowed this product.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFollowed = isFollowing ?? false;

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading || isFollowing === undefined}
      className={`inline-flex items-center justify-center gap-1.5 transition-colors ${
        isFollowed
          ? "text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
          : "text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border border-gray-200"
      } rounded-md px-3 py-1.5 text-sm font-medium ${className}`}
      title={isFollowed ? "Unfollow for updates" : "Follow for updates"}
    >
      {isFollowed ? (
        <BellRing className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {showLabel && (
        <span>{isFollowed ? "Following" : "Follow for updates"}</span>
      )}
    </button>
  );
}
