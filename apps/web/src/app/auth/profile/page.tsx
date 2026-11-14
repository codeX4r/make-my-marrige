"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { validateDisplayName, validatePassword } from "@/lib/validation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthenticatedHeader } from "@/components/AuthenticatedHeader";

interface ProfileFormData {
  displayName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    reset,
  } = useForm<ProfileFormData>({
    mode: "onBlur",
    resolver: async (values) => {
      const errors: FieldErrors<ProfileFormData> = {};

      if (activeTab === "profile") {
        const displayNameResult = validateDisplayName(values.displayName);
        if (!displayNameResult.valid) {
          errors.displayName = { type: "validate", message: displayNameResult.error! };
        }
      } else {
        const passwordResult = validatePassword(values.newPassword);
        if (!passwordResult.valid) {
          errors.newPassword = { type: "validate", message: passwordResult.error! };
        }
        if (values.newPassword !== values.confirmPassword) {
          errors.confirmPassword = { type: "validate", message: "Passwords do not match" };
        }
        if (!values.currentPassword) {
          errors.currentPassword = { type: "validate", message: "Current password is required" };
        }
      }

      if (Object.keys(errors).length > 0) {
        return { errors, values: {} };
      }
      return { values, errors: {} };
    },
    defaultValues: {
      displayName: user?.displayName || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (_data: ProfileFormData) => {
    void _data;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    clearErrors();

    try {
      // For now, we'll just simulate the API call
      // In a real implementation, you'd call the appropriate API endpoints
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(
        activeTab === "profile" ? "Profile updated successfully" : "Password changed successfully",
      );

      if (activeTab === "profile") {
        await refreshUser();
      } else {
        reset({
          displayName: user?.displayName || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: "profile" | "security") => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
    clearErrors();
    if (tab === "profile") {
      reset({
        displayName: user?.displayName || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      reset({
        displayName: user?.displayName || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <AuthenticatedHeader />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1100px]">
            <header className="mb-8 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Account settings
              </p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                Profile & security
              </h1>
              <p className="mt-2 text-muted">
                Manage your account settings and security preferences
              </p>
            </header>

            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(40,37,34,0.04)]">
              <nav className="flex border-b border-border bg-[#fcfaf7]" aria-label="Settings tabs">
                <button
                  onClick={() => handleTabChange("profile")}
                  className={`flex-1 border-b-2 px-6 py-4 text-center text-sm font-medium transition-colors ${
                    activeTab === "profile"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => handleTabChange("security")}
                  className={`flex-1 border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === "security"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  Security
                </button>
              </nav>

              <div className="p-5 sm:p-8">
                {activeTab === "profile" && (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                    {error && (
                      <InlineBanner type="error" message={error} onDismiss={() => setError(null)} />
                    )}
                    {success && (
                      <InlineBanner
                        type="info"
                        message={success}
                        onDismiss={() => setSuccess(null)}
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
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" size="lg" loading={isSubmitting}>
                        Save changes
                      </Button>
                    </div>
                  </form>
                )}

                {activeTab === "security" && (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                    {error && (
                      <InlineBanner type="error" message={error} onDismiss={() => setError(null)} />
                    )}
                    {success && (
                      <InlineBanner
                        type="info"
                        message={success}
                        onDismiss={() => setSuccess(null)}
                      />
                    )}

                    <div>
                      <h3 className="text-lg font-medium text-text mb-4">Change password</h3>
                      <p className="text-sm text-muted mb-6">
                        Your current password is required to confirm the change.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <TextField
                        label="Current password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your current password"
                        error={errors.currentPassword?.message ?? undefined}
                        required
                        {...register("currentPassword")}
                      />

                      <TextField
                        label="New password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 12 characters"
                        error={errors.newPassword?.message ?? undefined}
                        required
                        hint="At least 12 characters"
                        {...register("newPassword")}
                      />

                      <TextField
                        label="Confirm new password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm your new password"
                        error={errors.confirmPassword?.message ?? undefined}
                        required
                        {...register("confirmPassword")}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" size="lg" loading={isSubmitting}>
                        Change password
                      </Button>
                    </div>
                  </form>
                )}

                <section className="mt-10 border-t border-border pt-6">
                  <h3 className="mb-2 font-serif text-xl font-semibold text-text">
                    Account actions
                  </h3>
                  <p className="mb-4 text-sm text-muted">
                    Manage your signed-in devices or review account-level actions. Account deletion
                    is irreversible.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" onClick={() => router.push("/auth/sessions")}>
                      Manage sessions
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => confirm("Are you sure you want to delete your account?")}
                    >
                      Delete account
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
