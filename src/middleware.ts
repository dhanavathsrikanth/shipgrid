import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk middleware — required for Next.js Clerk integration.
 * See: https://clerk.com/docs/references/nextjs/clerk-middleware
 *
 * By default clerkMiddleware() does NOT protect any routes.
 * All routes are public unless you opt-in to protection.
 * Add auth guards inside pages/components using <Authenticated> from convex/react.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
