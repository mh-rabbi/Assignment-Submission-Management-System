"use client";

import Link from "next/link";
import { useCurrentUser } from "./CurrentUserProvider";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "./StatusBadge";
import { BookOpen, LogOut, User, Shield, GraduationCap, School } from "lucide-react";

export function Navbar() {
  const user = useCurrentUser();
  const { logout, isLoggingOut } = useAuth();

  const rolePath = user?.role ? `/${user.role.toLowerCase()}` : "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href={rolePath} className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            EduTask Pro
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 border-r pr-4 dark:border-slate-800">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-foreground">
                  {user.name || user.email}
                </span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              <StatusBadge status={user.role} />
            </div>

            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
