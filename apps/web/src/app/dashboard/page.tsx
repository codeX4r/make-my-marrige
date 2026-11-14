import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthenticatedHeader } from "@/components/AuthenticatedHeader";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <AuthenticatedHeader />
        <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <header className="mb-8">
              <h1 className="text-3xl font-semibold text-text">Dashboard</h1>
              <p className="mt-2 text-muted">Welcome to your MakeMyMarrige workspace</p>
            </header>

            <div className="bg-surface rounded-xl border border-border p-8">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 00.707.293h7.714a2 2 0 012 2v10a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-text">Welcome to your workspace</h2>
                <p className="mt-2 text-muted">
                  Your wedding planning dashboard is coming soon.
                </p>
                <div className="mt-8 space-y-4">
                  <p className="text-sm text-muted">
                    This page will show your dashboard with needs attention, wedding overview,
                    upcoming functions, planning progress, finance summary, recent activity, and
                    quick actions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
