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
      const message =
        err instanceof Error ? err.message : "Failed to sign out. Please try again.";
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
    <header className="border-b border-[var(--line)] bg-[var(--card)] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-serif font-bold text-xl text-primary tracking-tight">
              MakeMyMarrige
            </span>
            <span className="text-[10px] tracking-widest text-[var(--gold)] uppercase font-semibold">
              Workspace
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors py-1 ${
                    isActive
                      ? "text-primary border-b-2 border-primary font-semibold"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-text">
                {user.displayName || user.email}
              </span>
              <span className="text-[11px] text-muted">{user.email}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            loading={isLoggingOut}
            disabled={isLoggingOut}
            onClick={handleLogout}
            aria-label="Log out of account"
          >
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
      {logoutError && (
        <div className="bg-danger/10 border-b border-danger/20 text-danger text-xs py-1.5 px-4 text-center">
          {logoutError}
        </div>
      )}
    </header>
  );
}
