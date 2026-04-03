"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut();
        router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
        router.push("/");
      }
    };

    performSignOut();
  }, [signOut, router]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>Signing out...</h2>
      <p>You are being redirected.</p>
    </div>
  );
}
