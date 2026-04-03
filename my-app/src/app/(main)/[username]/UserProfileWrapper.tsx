"use client";

import UserProfilePage from "@/views/UserProfilePage";

export default function UserProfileWrapper({ username }: { username: string }) {
  return <UserProfilePage username={username} />;
}
