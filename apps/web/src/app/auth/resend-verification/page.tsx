"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { validateEmail } from "@/lib/validation";
import { useAuth } from "@/lib/auth-context";

interface ResendFormData {
  email: string;
}

export default function ResendVerificationPage() {
  const router = useRouter();
  const { resendVerification, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderSuccess = () => (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <header className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-text hover:text-primary transition-colors">
            <span className="text-xl font-semibold tracking-tight">MakeMyMarrige</span>
          </Link>
        </header>
        <div className="bg-surface rounded-xl border border-border p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-text">Email sent!</h1>
            <p className="mt-2 text-muted">
              We've sent a new verification link to your email address.
              Please check your inbox (and spam folder) and click the link to verify your account.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted">
              Didn't receive the email?{" "}
              <button onClick={() => setSuccess(false)} className="font-medium text-primary hover:text-primary-hover">
                Try again
              </button>
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

  function renderForm() {
    const {
      register,
      handleSubmit,
      formState: { errors },
      setError: setFieldError,
      clearErrors,
    } = useForm<{ email: string }>({
      mode: "onBlur",
      resolver: async (values) => {
        const errors: Record<string, { message: string }> = {};
        const emailResult = validateEmail(values.email);
        if (!emailResult.valid) {
          errors.email = { message: emailResult.error! };
        }
        return { errors, values };
      },
    });

    const onSubmit = async (data: { email: string }) => {
      setIsSubmitting(true);
      setError(null);
      clearErrors();

      try {
        await resendVerification(data.email);
        setSuccess(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to resend verification. Please try again.";
        setError(message);
        if (message.toLowerCase().includes("email")) {
          setFieldError("email", { message });
        }
      } finally {
        setIsSubmitting(false);
      }
    };

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
              <h1 className="text-2xl font-semibold text-text">Resend verification</h1>
              <p className="mt-2 text-muted">
                Enter your email address and we'll send a new verification link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {error && (
                <InlineBanner
                  type="error"
                  message={error}
                  onDismiss={() => setError(null)}
                />
              )}

              <div className="space-y-5">
                <TextField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  required
                  {...register("email")}
                />
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={isSubmitting}
              >
                Send verification email
              </Button>

              <p className="text-center text-sm text-muted">
                <Link href="/auth/login" className="font-medium text-primary hover:text-primary-hover">
                  Back to sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
  }

  return success ? renderSuccess() : renderForm();
}