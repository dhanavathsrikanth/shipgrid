import React, { useEffect, useState, ReactNode } from "react";
import {
  Link,
  Outlet,
  useOutletContext,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  LayoutGrid,
  List,
  PlusCircle,
  Search,
  ThumbsUp,
  ChevronDown,
  Menu,
  User,
  Bell,
  Inbox,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useUser, useClerk, SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Id } from "./convex/_generated/dataModel";
import { api } from "./convex/_generated/api";

// =============================================================================
// CONVEX USER FUNCTIONS (from convex/users.ts)
// =============================================================================

import {
  mutation,
  query,
  QueryCtx,
  MutationCtx,
  internalMutation,
  action,
} from "./convex/_generated/server";
import { v } from "convex/values";
import { Doc } from "./convex/_generated/dataModel";

/**
 * Ensures a user record exists in the Convex database for the authenticated user.
 * If the user doesn't exist, it creates a new user record.
 *
 * This mutation should be called from the frontend after a successful
 * sign-in or sign-up with Clerk.
 */
export const ensureUser = mutation({
  args: {}, // No args needed, gets info from Clerk identity
  returns: v.id("users"), // Returns the Convex user ID
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called ensureUser without authentication");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    let clerkEmail: string | undefined = undefined;
    if (typeof identity.email === "string") {
      clerkEmail = identity.email;
    } else if (typeof identity.emailAddress === "string") {
      clerkEmail = identity.emailAddress;
    } else if (
      typeof (identity as any).primaryEmailAddress?.emailAddress === "string"
    ) {
      clerkEmail = (identity as any).primaryEmailAddress.emailAddress;
    }

    let candidateUsername: string | null = null;
    if (
      typeof identity.username === "string" &&
      identity.username.trim() !== ""
    ) {
      candidateUsername = identity.username.trim();
    }

    let clerkImageUrl: string | undefined = undefined;
    if (typeof identity.imageUrl === "string") {
      clerkImageUrl = identity.imageUrl || undefined;
    }

    if (existingUser) {
      let nameToStore = existingUser.name;
      if (identity.givenName && identity.familyName) {
        nameToStore = `${identity.givenName} ${identity.familyName}`;
      } else if (identity.name) {
        nameToStore = identity.name;
      } else if (identity.nickname) {
        nameToStore = identity.nickname;
      }

      const updates: Partial<Doc<"users">> = {};
      let changed = false;

      if (nameToStore !== existingUser.name) {
        updates.name = nameToStore;
        changed = true;
      }
      if (clerkEmail !== existingUser.email) {
        updates.email = clerkEmail;
        changed = true;
      }
      if (clerkImageUrl && clerkImageUrl !== existingUser.imageUrl) {
        updates.imageUrl = clerkImageUrl;
        changed = true;
      }

      // Handle username update for existing user
      if (existingUser.username === null && candidateUsername !== null) {
        const conflictingUser = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", candidateUsername!))
          .filter((q) => q.neq(q.field("_id"), existingUser._id))
          .first();
        if (!conflictingUser) {
          updates.username = candidateUsername;
          changed = true;
        } else {
          console.warn(
            `Clerk username '${candidateUsername}' is already taken. User ${existingUser._id} will need to set username manually.`,
          );
        }
      }

      if (changed) {
        await ctx.db.patch(existingUser._id, updates);
      }
      return existingUser._id;
    }

    // New user insertion
    let nameToStoreOnInsert = "Anonymous";
    if (identity.givenName && identity.familyName) {
      nameToStoreOnInsert = `${identity.givenName} ${identity.familyName}`;
    } else if (identity.name) {
      nameToStoreOnInsert = identity.name;
    } else if (identity.nickname) {
      nameToStoreOnInsert = identity.nickname;
    }

    let usernameForDbInsert: string | undefined = undefined;
    if (candidateUsername !== null) {
      const conflictingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", candidateUsername!))
        .first();
      if (!conflictingUser) {
        usernameForDbInsert = candidateUsername;
      } else {
        console.warn(
          `Clerk username '${candidateUsername}' is already taken for new user. New user will need to set username manually.`,
        );
      }
    }

    const userId = await ctx.db.insert("users", {
      name: nameToStoreOnInsert,
      clerkId: identity.subject,
      email: clerkEmail,
      username: usernameForDbInsert,
      imageUrl: clerkImageUrl,
    });

    return userId;
  },
});

/**
 * Retrieves the full user document of the currently authenticated user.
 * Returns null if the user is not authenticated or not found.
 */
export const getMyUserDocument = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.optional(v.string()),
      name: v.string(),
      username: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      role: v.optional(v.string()),
      bio: v.optional(v.string()),
      website: v.optional(v.string()),
      twitter: v.optional(v.string()),
      bluesky: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      isVerified: v.optional(v.boolean()),
      inboxEnabled: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    return user;
  },
});

export const setUsername = mutation({
  args: { newUsername: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error(
        "Authenticated user not found in DB. Cannot set username.",
      );
    }

    // Basic validation for username
    const trimmedUsername = args.newUsername.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      throw new Error("Username must be between 3 and 20 characters.");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      throw new Error(
        "Username can only contain letters, numbers, and underscores.",
      );
    }

    // Check for uniqueness
    const conflictingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", trimmedUsername))
      .filter((q) => q.neq(q.field("_id"), user._id))
      .first();

    if (conflictingUser) {
      throw new Error(
        `Username "${trimmedUsername}" is already taken. Please choose another.`,
      );
    }

    // Update the user's username
    await ctx.db.patch(user._id, { username: trimmedUsername });

    return { success: true, username: trimmedUsername };
  },
});

export const syncUserFromClerkWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.union(v.string(), v.null())),
    lastName: v.optional(v.union(v.string(), v.null())),
    imageUrl: v.optional(v.union(v.string(), v.null())),
    publicMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    let nameToStore = "Anonymous";
    if (args.firstName && args.lastName) {
      nameToStore = `${args.firstName} ${args.lastName}`;
    } else if (args.firstName) {
      nameToStore = args.firstName;
    } else if (args.lastName) {
      nameToStore = args.lastName;
    }

    if (existingUser) {
      // User exists, update them
      const updates: Partial<Doc<"users">> = {};
      let changed = false;

      if (nameToStore !== existingUser.name) {
        updates.name = nameToStore;
        changed = true;
      }
      if (args.email && args.email !== existingUser.email) {
        updates.email = args.email;
        changed = true;
      }
      if (args.imageUrl && args.imageUrl !== existingUser.imageUrl) {
        updates.imageUrl = args.imageUrl;
        changed = true;
      }

      if (changed) {
        await ctx.db.patch(existingUser._id, updates);
      }
    } else {
      // Create new user
      await ctx.db.insert("users", {
        name: nameToStore,
        clerkId: args.clerkId,
        email: args.email,
        username: null,
        imageUrl: args.imageUrl,
      });
    }
  },
});

// =============================================================================
// USER SYNCER COMPONENT
// =============================================================================

/**
 * This component ensures that when a user is signed in with Clerk,
 * a corresponding user record is created or verified in the Convex database.
 * It calls the `ensureUser` mutation.
 */
export function UserSyncer() {
  const { isSignedIn, user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const ensureUserMutation = useMutation(api.users.ensureUser);
  const navigate = useNavigate();

  // Fetch the Convex user document after Clerk loads and user is signed in
  const convexUserDoc = useQuery(
    api.users.getMyUserDocument,
    isClerkLoaded && isSignedIn ? {} : "skip"
  );

  const [isSyncedAndChecked, setIsSyncedAndChecked] = useState(false);

  useEffect(() => {
    // Effect for ensuring user record in Convex DB
    if (isClerkLoaded && isSignedIn && clerkUser && !isSyncedAndChecked) {
      ensureUserMutation()
        .then((userId) => {
          // After ensuring user, convexUserDoc query will refetch or update.
          // The next useEffect will handle username check.
        })
        .catch((error) => {
          console.error("Error running ensureUser mutation:", error);
        });
    }
  }, [isClerkLoaded, isSignedIn, clerkUser, ensureUserMutation, isSyncedAndChecked]);

  useEffect(() => {
    // Effect for checking username and redirecting if null
    // This runs after convexUserDoc is fetched/updated
    if (isClerkLoaded && isSignedIn && convexUserDoc !== undefined && !isSyncedAndChecked) {
      if (convexUserDoc === null) {
        // This implies ensureUser might have failed or is still in progress, or user somehow not in DB
        console.warn(
          "UserSyncer: Convex user document is null after ensureUser should have run. Waiting for query to update."
        );
      } else if (convexUserDoc.username === null || convexUserDoc.username === undefined) {
        navigate("/set-username");
      }
      setIsSyncedAndChecked(true); // Mark as checked for this session/user state
    }

    // Reset if user signs out
    if (isClerkLoaded && !isSignedIn) {
      setIsSyncedAndChecked(false);
    }
  }, [isClerkLoaded, isSignedIn, convexUserDoc, navigate, isSyncedAndChecked]);

  return null; // This component doesn't render anything
}

// =============================================================================
// SET USERNAME PAGE
// =============================================================================

export default function SetUsernamePage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setUsernameMutation = useMutation(api.users.setUsername);
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  const convexUser = useQuery(
    api.users.getMyUserDocument,
    isClerkLoaded && clerkUser ? {} : "skip"
  );

  useEffect(() => {
    if (isClerkLoaded && convexUser && convexUser.username) {
      // Username is set and available
      navigate(`/${convexUser.username}`);
    }
  }, [isClerkLoaded, convexUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    if (!username.trim()) {
      setError("Username cannot be empty.");
      setIsLoading(false);
      return;
    }
    if (!clerkUser) {
      setError("User not authenticated. Please sign in again.");
      setIsLoading(false);
      return;
    }
    try {
      const newTrimmedUsername = username.trim();
      await setUsernameMutation({ newUsername: newTrimmedUsername });
      // Successfully set username in Convex.
      // Navigate directly. The useEffect will also catch this if this navigation fails
      // or if the component re-renders before navigation fully happens.
      navigate(`/${newTrimmedUsername}`);
    } catch (err: any) {
      console.error("Error setting username:", err);
      setError(
        err.data?.message || err.message || "Failed to set username. It might be taken or invalid."
      );
    }
    setIsLoading(false);
  };

  if (!isClerkLoaded || convexUser === undefined) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (convexUser && convexUser.username) {
    // Should have been redirected by useEffect, but as a fallback:
    return <div className="text-center p-8">Username already set. Redirecting...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg border border-gray-200">
      <h1 className="text-2xl font-bold text-[#292929] mb-6 text-center">Set Your Username</h1>
      <p className="text-sm text-[#545454] mb-4">
        Choose a unique username for your profile. This will be part of your public profile URL.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-[#525252]">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-[#292929] focus:border-[#292929] sm:text-sm"
            placeholder="e.g., janedoe"
            required
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-[#292929] hover:bg-[#525252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#292929] disabled:opacity-50">
          {isLoading ? "Saving..." : "Set Username"}
        </button>
      </form>
    </div>
  );
}

// =============================================================================
// LAYOUT COMPONENT (Simplified version focusing on auth-related parts)
// =============================================================================

interface LayoutContextType {
  viewMode: "list" | "grid" | "vibe";
  selectedTagId?: Id<"tags">;
  sortPeriod: SortPeriod;
}

type SortPeriod =
  | "today"
  | "week"
  | "month"
  | "year"
  | "all"
  | "votes_today"
  | "votes_week"
  | "votes_month"
  | "votes_year"
  | "votes_all";

export function Layout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const { user: clerkUser, isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const clerk = useClerk();
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();

  const settings = useQuery(api.settings.get);

  const convexUserDoc = useQuery(
    api.users.getMyUserDocument,
    isClerkLoaded && isSignedIn ? {} : "skip",
  );

  let profileUrl = "/sign-in";
  if (isClerkLoaded && isSignedIn) {
    if (convexUserDoc === undefined) {
      profileUrl = "#";
    } else if (convexUserDoc && convexUserDoc.username) {
      profileUrl = `/${convexUserDoc.username}`;
    } else {
      profileUrl = "/set-username";
    }
  }

  // Close profile dropdown on outside click
  React.useEffect(() => {
    if (!showProfileDropdown) return;
    function handleClick(e: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfileDropdown]);

  const siteTitle = settings?.siteTitle || "Vibe Apps";

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#F4F2EE]">
        <header className="pt-5 pb-0 bg-[#F4F2EE] sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-y-2 md:flex-row md:justify-between md:items-center">
              <div className="flex w-full justify-between items-center md:contents">
                <Link
                  to="/"
                  className="inline-block text-[#292929] hover:text-[#525252] md:order-1"
                >
                  <h1 className="title-font text-xl">{siteTitle}</h1>
                </Link>

                <div className="flex items-center gap-2 md:order-3">
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <button
                        className="px-4 py-2 bg-[#292929] border border-[#D8E1EC] text-[#ffffff] rounded-md text-xs font-normal hover:bg-[#F2F0ED] hover:text-[#292929] transition-colors"
                        type="button"
                      >
                        Sign up
                      </button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <button
                        className="px-4 py-2 bg-[#292929] border border-[#D8E1EC] text-[#ffffff] rounded-md text-xs font-normal hover:bg-[#F2F0ED] hover:text-[#292929] transition-colors"
                        type="button"
                      >
                        Sign in
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <UserSyncer />

                    {/* Custom Profile Dropdown */}
                    <div className="relative" ref={profileDropdownRef}>
                      <button
                        onClick={() =>
                          setShowProfileDropdown(!showProfileDropdown)
                        }
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#292929] hover:bg-[#525252] transition-colors"
                        aria-label="Profile menu"
                      >
                        {clerkUser?.imageUrl ? (
                          <img
                            src={clerkUser.imageUrl}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </button>

                      {showProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg border border-[#D8E1EC] py-0.5 z-50">
                          <Link
                            to={profileUrl}
                            className="block px-3 py-1.5 text-xs text-[#292929] hover:bg-[#F4F2EE] transition-colors"
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            My Profile
                          </Link>
                          <button
                            onClick={() => {
                              clerk.openUserProfile();
                              setShowProfileDropdown(false);
                            }}
                            className="block w-full px-3 py-1.5 text-xs text-[#292929] hover:bg-[#F4F2EE] transition-colors text-left"
                          >
                            Manage Account
                          </button>
                          <button
                            onClick={() => {
                              clerk.signOut({ redirectUrl: "/" });
                              setShowProfileDropdown(false);
                            }}
                            className="block w-full px-3 py-1.5 text-xs text-[#292929] hover:bg-[#F4F2EE] transition-colors text-left"
                          >
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  </SignedIn>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </>
  );
}

// =============================================================================
// AUTHENTICATION FLOW DOCUMENTATION
// =============================================================================

/*
AUTHENTICATION FLOW:

1. User signs in → Clerk authentication completes
2. UserSyncer detects signed-in user → calls ensureUser mutation
3. ensureUser creates/updates user record in Convex with Clerk data
4. UserSyncer checks if username exists → redirects to /set-username if needed
5. SetUsernamePage → user sets username → calls setUsername mutation
6. User redirected to their profile page

The UserSyncer component is the critical bridge that ensures the Convex users table 
is updated immediately after Clerk authentication completes.

KEY COMPONENTS:
- UserSyncer: Automatically syncs Clerk auth to Convex database
- ensureUser mutation: Creates/updates user records in Convex
- SetUsernamePage: Handles username setting after auth
- Layout component: Renders UserSyncer and manages auth state
- syncUserFromClerkWebhook: Handles webhook-based user sync

ROUTE STRUCTURE:
- /: Main app page (requires auth for certain features)
- /set-username: Username setup page (redirected here after auth if no username)
- /{username}: User profile page (after username is set)
*/
