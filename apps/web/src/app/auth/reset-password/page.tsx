"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { validatePassword } from "@/lib/validation";
import { useAuth } from "@/lib/auth-context";

interface ResetFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFieldError,
    clearErrors,
  } = useForm<ResetFormData>({
    mode: "onBlur",
    resolver: async (values) => {
      const errors: Record<string, { message: string }> = {};
      const passwordResult = validatePassword(values.password);
      if (!passwordResult.valid) {
        errors.password = { message: passwordResult.error! };
      }
      if (values.password !== values.confirmPassword) {
        errors.confirmPassword = { message: "Passwords do not match" };
      }
      return { errors, values };
    },
  });

  const password = watch("password");

  const onSubmit = async (data: ResetFormData) => {
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    clearErrors();

    try {
      await resetPassword(token, data.password);
      router.push("/auth/login?reset=success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password. Please try again.";
      setError(message);
      if (message.toLowerCase().includes("token")) {
        setFieldError("password", { message: "Invalid or expired reset token" });
      } else if (message.toLowerCase().includes("password")) {
        setFieldError("password", { message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInvalidToken = () => (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <header className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-text hover:text-primary transition-colors">
            <span className="text-xl font-semibold tracking-tight">MakeMyMarrige</span>
          </Link>
        </header>
        <div className="bg-surface rounded-xl border border-border p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-danger/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.34 0L3.34 16.5c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-text">Invalid link</h1>
            <p className="mt-2 text-muted">
              This password reset link is invalid or has expired.
              Please request a new password reset link.
            </p>
          </div>
          <div className="text-center">
            <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary-hover">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    </main>
  );

  if (!token) {
    return <div />;
  }

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
            <h1 className="text-2xl font-semibold text-text">Reset your password</h1>
            <p className="mt-2 text-muted">
              Enter your new password below. It must be at least 12 characters.
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
                label="New password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 12 characters"
                error={errors.password?.message}
                required
                hint="At least 12 characters"
                {...register("password")}
              />

              <TextField
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your new password"
                error={errors.confirmPassword?.message}
                required
                {...register("confirmPassword")}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting || authLoading}
            >
              Reset password
            </Button>

            <p className="text-center text-sm text-muted">
              <Link href="/auth/login" className="font-medium text-primary hover:text-primary-hover">
                Back to sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}