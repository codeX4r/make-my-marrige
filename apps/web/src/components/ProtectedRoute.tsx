"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/Skeleton";
import { buildLoginRedirectUrl } from "@/lib/route-protection";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      const search = searchParams?.toString();
      const currentDestination = pathname + (search ? `?${search}` : "");
      const redirectUrl = buildLoginRedirectUrl(currentDestination);
      router.replace(redirectUrl.pathname + redirectUrl.search);
    }
  }, [isLoading, isAuthenticated, user, router, pathname, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="mt-8 bg-[var(--card)] border border-[var(--line)] rounded-xl p-8 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}
