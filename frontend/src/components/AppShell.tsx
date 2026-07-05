"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth, isAuthority } from "@/lib/auth";
import { useQueueSync } from "@/lib/useQueueSync";
import { OfflineBanner } from "./OfflineBanner";

const CITIZEN_LINKS = [
  { href: "/report", label: "Report" },
  { href: "/my-reports", label: "My Reports" },
  { href: "/assets", label: "Assets" },
];

const AUTHORITY_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/review", label: "Review" },
  { href: "/assets", label: "Assets" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  useQueueSync();

  const links =
    user && isAuthority(user.role) ? AUTHORITY_LINKS : CITIZEN_LINKS;

  function onLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-slate-900"
          >
            <span aria-hidden>🛰️</span> Spandan
          </Link>
          <nav className="flex items-center gap-1">
            {user
              ? links.map((l) => {
                  const active = pathname.startsWith(l.href);
                  const cls = active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100";
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium ${cls}`}
                    >
                      {l.label}
                    </Link>
                  );
                })
              : null}
            {user ? (
              <button
                onClick={onLogout}
                className="ml-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
        <OfflineBanner />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Spandan · National Asset Intelligence Grid · Prototype
      </footer>
    </div>
  );
}
