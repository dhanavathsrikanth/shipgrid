"use client";

import { use } from "react";
import UserProfilePage from "@/views/UserProfilePage";

export default function UserProfileRoute({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return <UserProfilePage username={username} />;
}
