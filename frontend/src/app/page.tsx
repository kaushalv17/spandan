"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, isAuthority } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (isAuthority(user.role)) router.replace("/dashboard");
    else router.replace("/report");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label="Loading Spandan…" />
    </div>
  );
}
