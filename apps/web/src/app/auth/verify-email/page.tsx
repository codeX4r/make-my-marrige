import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verify Email | MakeMyMarrige",
};

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <header className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-text hover:text-primary transition-colors">
            <span className="text-xl font-semibold tracking-tight">MakeMyMarrige</span>
          </Link>
        </header>
        <div className="bg-surface rounded-xl border border-border p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-text">Check your email</h1>
            <p className="mt-2 text-muted">
              We&apos;ve sent a verification link to your email address.
              Please check your inbox (and spam folder) and click the link to verify your account.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted">
              Didn&apos;t receive the email?{" "}
              <Link href="/auth/resend-verification" className="font-medium text-primary hover:text-primary-hover">
                Resend verification email
              </Link>
            </p>
            <p className="text-sm text-muted">
              Already verified?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:text-primary-hover">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}