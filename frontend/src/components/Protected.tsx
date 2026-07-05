"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth, isAuthority } from "@/lib/auth";
import { Spinner } from "./Spinner";

export function Protected({
  children,
  requireAuthority = false,
}: {
  children: ReactNode;
  requireAuthority?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (requireAuthority && !isAuthority(user.role)) {
      router.replace("/report");
    }
  }, [user, loading, requireAuthority, router]);

  if (loading) {
    return (
      <div className="p-8">
        <Spinner label="Loading…" />
      </div>
    );
  }
  if (!user) return null;
  if (requireAuthority && !isAuthority(user.role)) return null;
  return <>{children}</>;
}
