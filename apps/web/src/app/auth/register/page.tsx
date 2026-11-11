"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { validateEmail, validatePassword, validateDisplayName } from "@/lib/validation";
import { useAuth } from "@/lib/auth-context";

interface RegisterFormData {
  email: string;
  password: string;
  displayName: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFieldError,
    clearErrors,
  } = useForm<RegisterFormData>({
    mode: "onBlur",
    resolver: async (values) => {
      const errors: Record<string, { message: string }> = {};
      const emailResult = validateEmail(values.email);
      if (!emailResult.valid) {
        errors.email = { message: emailResult.error! };
      }
      const passwordResult = validatePassword(values.password);
      if (!passwordResult.valid) {
        errors.password = { message: passwordResult.error! };
      }
      const displayNameResult = validateDisplayName(values.displayName);
      if (!displayNameResult.valid) {
        errors.displayName = { message: displayNameResult.error! };
      }
      if (Object.keys(errors).length > 0) {
        return { errors, values: undefined as any };
      }
      return { values, errors: undefined as any };
    },
  });

  const onSubmit = async (data: { email: string; password: string; displayName: string }) => {
    setIsSubmitting(true);
    setError(null);
    clearErrors();

    try {
      await registerUser(data.email, data.password, data.displayName);
      router.push("/auth/verify-email?mode=registration");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
      if (message.toLowerCase().includes("email")) {
        setFieldError("email", { message });
      } else if (message.toLowerCase().includes("password")) {
        setFieldError("password", { message });
      } else if (message.toLowerCase().includes("display name")) {
        setFieldError("displayName", { message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          label="Display name"
          placeholder="Your name"
          error={errors.displayName?.message ?? undefined}
          required
          {...register("displayName")}
        />

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
          autoComplete="new-password"
          placeholder="At least 12 characters"
          error={errors.password?.message ?? undefined}
          required
          hint="Must be at least 12 characters"
          {...register("password")}
        />
      </div>

      <p className="text-sm text-muted">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:text-primary-hover underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:text-primary-hover underline">
          Privacy Policy
        </Link>
        .
      </p>

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isSubmitting}
      >
        Create account
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:text-primary-hover">
          Sign in
        </Link>
      </p>
    </form>
  );
}