"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthenticatedHeader } from "@/components/AuthenticatedHeader";

interface Session {
  sessionId: string;
  issuedAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const { listSessions, revokeSession, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await listSessions();
        if (mounted) setSessions(list);
      } catch {
        if (mounted) setError("Failed to load sessions");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [listSessions]);

  const handleRevoke = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) return;

    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke session";
      setError(message);
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to sign out of all devices?")) return;

    setRevokingAll(true);
    try {
      await logout();
      router.replace("/auth?tab=login&logged_out=true");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign out of all sessions";
      setError(message);
      setRevokingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <AuthenticatedHeader />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1100px]">
            <header className="mb-8 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Account security
              </p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                Active sessions
              </h1>
              <p className="mt-2 text-muted">Manage your active sessions across all devices</p>
            </header>

            {error && <InlineBanner type="error" message={error} />}

            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(40,37,34,0.04)]">
              {loading ? (
                <div className="p-10 text-center" role="status" aria-live="polite">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-4 text-muted">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z"
                      />
                    </svg>
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-text">No active sessions</h2>
                  <p className="mt-2 text-sm text-muted">
                    No active sessions are currently listed for your account.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-[#fcfaf7] sm:flex-row sm:items-center sm:px-6"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <svg
                            className="h-5 w-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text">Session</p>
                          <p className="truncate text-sm text-muted">
                            Started {formatDate(session.issuedAt)} • Last active{" "}
                            {formatDate(session.lastUsedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="hidden text-sm text-muted sm:block">
                          Expires {formatDate(session.expiresAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={revoking === session.sessionId}
                          onClick={() => handleRevoke(session.sessionId)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <section className="border-t border-border bg-[#fcfaf7] p-5 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-medium text-text">Sign out everywhere</p>
                    <p className="text-sm text-muted">
                      Revoke all sessions and sign out of all devices
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleRevokeAll}
                    loading={revokingAll}
                    disabled={revokingAll}
                  >
                    Sign out everywhere
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
