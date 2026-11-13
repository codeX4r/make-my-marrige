"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { validateEmail, validatePassword } from "@/lib/validation";
import { useAuth } from "@/lib/auth-context";

interface LoginFormData {
  email: string;
  password: string;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectToRaw = searchParams.get("redirect") || "/";
  const redirectTo =
    redirectToRaw.startsWith("/") && !redirectToRaw.startsWith("//") ? redirectToRaw : "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFieldError,
    clearErrors,
  } = useForm<LoginFormData>({
    mode: "onBlur",
    resolver: async (values) => {
      const errors: FieldErrors<LoginFormData> = {};
      const emailResult = validateEmail(values.email);
      if (!emailResult.valid) {
        errors.email = { type: "validate", message: emailResult.error! };
      }
      const passwordResult = validatePassword(values.password);
      if (!passwordResult.valid) {
        errors.password = { type: "validate", message: passwordResult.error! };
      }
      if (Object.keys(errors).length > 0) return { errors, values: {} };
      return { values, errors: {} };
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);
    clearErrors();

    try {
      await login(data.email, data.password);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(message);
      if (message.toLowerCase().includes("email")) {
        setFieldError("email", { message });
      } else if (message.toLowerCase().includes("password")) {
        setFieldError("password", { message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {error && <InlineBanner type="error" message={error} onDismiss={() => setError(null)} />}

      <div className="space-y-5">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message ?? undefined}
          required
          {...register("email")}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message ?? undefined}
          required
          {...register("password")}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-2"
          />
          <span className="text-sm text-text">Remember me</span>
        </label>
        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth size="lg" loading={isSubmitting || authLoading}>
        Sign in
      </Button>

      <p className="text-center text-sm text-muted">
        Don't have an account?{" "}
        <Link href="/auth/register" className="font-medium text-primary hover:text-primary-hover">
          Create an account
        </Link>
      </p>

      <p className="text-center text-sm text-muted">
        Or continue with{" "}
        <button className="font-medium text-primary hover:text-primary-hover">Google</button>
        {" (coming soon)"}
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="space-y-6">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
