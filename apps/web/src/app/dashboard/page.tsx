import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthenticatedHeader } from "@/components/AuthenticatedHeader";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <AuthenticatedHeader />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <header className="mb-8 pt-3">
              <h1 className="font-serif text-[3rem] font-semibold leading-none tracking-[-0.06em] text-[#282522] sm:text-[3.8rem]">
                Dashboard
              </h1>
              <p className="mt-5 text-[1.7rem] italic leading-snug text-[#4f4b47]">
                Welcome to your MakeMyMarrige workspace
              </p>
            </header>

            <div className="rounded-[28px] border border-[#d8d1c8] bg-[#f4f1ee] px-5 py-10 shadow-[0_0_0_1px_rgba(122,46,66,0.02)] sm:px-8 lg:px-10">
              <div className="mx-auto max-w-[980px] py-8 text-center sm:py-14">
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0d9e0] text-[1.15rem] text-[#7A2E42]">
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
                      d="M15.232 5.232h3.536a2 2 0 0 1 2 2v9.536a2 2 0 0 1-2 2H5.232a2 2 0 0 1-2-2V7.232a2 2 0 0 1 2-2h3.536m4 2.5l-3 3m3-3l-3-3m3 3h-7.5"
                    />
                  </svg>
                </div>

                <h2 className="font-serif text-[2.5rem] font-semibold leading-none tracking-[-0.05em] text-[#282522] sm:text-[3.2rem]">
                  Welcome to your workspace
                </h2>

                <p className="mx-auto mt-5 max-w-[760px] text-[1.35rem] leading-relaxed text-[#4f4b47] sm:text-[1.7rem]">
                  Your wedding planning dashboard is coming soon.
                </p>

                <p className="mx-auto mt-8 max-w-[900px] text-[1.05rem] leading-relaxed text-[#5d5956] sm:text-[1.2rem]">
                  This page will show your dashboard with needs attention, wedding overview,
                  upcoming functions, planning progress, finance summary, recent activity, and quick
                  actions.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
