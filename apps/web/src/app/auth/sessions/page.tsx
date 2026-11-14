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
      const message =
        err instanceof Error ? err.message : "Failed to sign out of all sessions";
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
        <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <header className="mb-8">
              <h1 className="text-3xl font-semibold text-text">Active sessions</h1>
              <p className="mt-2 text-muted">Manage your active sessions across all devices</p>
            </header>

            {error && (
              <InlineBanner
                type="error"
                message={error}
              />
            )}

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="mt-4 text-muted">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted">No active sessions found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-primary"
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
                          <p className="font-medium text-text truncate">Session</p>
                          <p className="text-sm text-muted truncate">
                            Started {formatDate(session.issuedAt)} • Last active{" "}
                            {formatDate(session.lastUsedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted hidden sm:block">
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

              <div className="border-t border-border p-5">
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
