import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication | MakeMyMarrige",
  description: "Sign in or create your MakeMyMarrige account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <header className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-text hover:text-primary transition-colors">
            <span className="text-xl font-semibold tracking-tight">MakeMyMarrige</span>
          </Link>
        </header>
        <div className="bg-surface rounded-xl border border-border p-8 sm:p-10">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} MakeMyMarrige. All rights reserved.
        </p>
      </div>
    </main>
  );
}