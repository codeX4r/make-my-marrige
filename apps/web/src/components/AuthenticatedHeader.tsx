"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export function AuthenticatedHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace("/auth?tab=login&logged_out=true");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign out. Please try again.";
      setLogoutError(message);
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/auth/profile", label: "Profile" },
    { href: "/auth/sessions", label: "Active Sessions" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5dfd7] bg-[#faf8f4]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[70px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6 lg:gap-8">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Go to dashboard"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7A2E42] text-[1.1rem] font-semibold text-white shadow-sm">
              M
            </span>
            <span className="flex items-center gap-2">
              <span className="font-serif text-[1.7rem] font-bold leading-none tracking-[-0.04em] text-[#7A2E42] sm:text-[2rem]">
                MakeMyMarrige
              </span>
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-[#BD9560] sm:inline">
                Workspace
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-6 text-[1.05rem] font-medium md:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative pb-1 transition-colors ${
                    isActive
                      ? "font-semibold text-[#7A2E42] after:absolute after:bottom-[-9px] after:left-0 after:h-[3px] after:w-full after:rounded-full after:bg-[#7A2E42]"
                      : "text-[#5d5956] hover:text-[#282522]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden items-center gap-2 rounded-lg border border-[#e5dfd7] bg-[#f4f1ee] px-2.5 py-1.5 text-right shadow-[0_1px_0_rgba(122,46,66,0.04)] sm:flex">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[0.72rem] font-semibold text-[#7A2E42] ring-1 ring-[#e5dfd7]">
                {((user.displayName || user.email || "U").charAt(0) || "U").toUpperCase()}
              </span>
              <span className="text-[0.86rem] text-[#4d4a45]">{user.email}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            loading={isLoggingOut}
            disabled={isLoggingOut}
            onClick={handleLogout}
            aria-label="Log out of account"
            className="rounded-lg border-[#7A2E42] bg-[#faf8f4] px-4 py-2 text-[1.05rem] font-medium text-[#7A2E42] shadow-[0_1px_0_rgba(122,46,66,0.04)] hover:bg-white"
          >
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
      {logoutError && (
        <div className="border-b border-danger/20 bg-danger/10 px-4 py-1.5 text-center text-xs text-danger">
          {logoutError}
        </div>
      )}
    </header>
  );
}
