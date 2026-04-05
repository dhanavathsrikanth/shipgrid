"use client";

// Per Clerk + Convex docs: use <Authenticated>/<Unauthenticated> from convex/react
// instead of Clerk's useAuth() — Convex components fire only after the token is
// validated by the Convex backend, not just when Clerk says the user is signed in.
import { Authenticated, Unauthenticated } from "convex/react";
import { RedirectToSignIn } from "@clerk/nextjs";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
    </>
  );
}
