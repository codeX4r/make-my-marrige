"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
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

interface LoginFormData {
  email: string;
  password: string;
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "login" ? "login" : "register";
  const [activeTab, setActiveTab] = useState<"register" | "login">(initialTab);

  const { login, register: registerUser, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Form
  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors },
    setError: setRegFieldError,
    clearErrors: clearRegErrors,
  } = useForm<RegisterFormData>({
    mode: "onBlur",
    resolver: async (values) => {
      const errors: FieldErrors<RegisterFormData> = {};
      const emailResult = validateEmail(values.email);
      if (!emailResult.valid) errors.email = { type: "validate", message: emailResult.error! };
      const passwordResult = validatePassword(values.password);
      if (!passwordResult.valid)
        errors.password = { type: "validate", message: passwordResult.error! };
      const displayNameResult = validateDisplayName(values.displayName);
      if (!displayNameResult.valid)
        errors.displayName = { type: "validate", message: displayNameResult.error! };
      if (Object.keys(errors).length > 0) return { errors, values: {} };
      return { values, errors: {} };
    },
  });

  // Login Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    setError: setLoginFieldError,
    clearErrors: clearLoginErrors,
  } = useForm<LoginFormData>({
    mode: "onBlur",
    resolver: async (values) => {
      const errors: FieldErrors<LoginFormData> = {};
      const emailResult = validateEmail(values.email);
      if (!emailResult.valid) errors.email = { type: "validate", message: emailResult.error! };
      const passwordResult = validatePassword(values.password);
      if (!passwordResult.valid)
        errors.password = { type: "validate", message: passwordResult.error! };
      if (Object.keys(errors).length > 0) return { errors, values: {} };
      return { values, errors: {} };
    },
  });

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setError(null);
    clearRegErrors();
    try {
      await registerUser(data.email, data.password, data.displayName);
      router.push("/auth/verify-email?mode=registration");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
      if (message.toLowerCase().includes("email")) setRegFieldError("email", { message });
      else if (message.toLowerCase().includes("password"))
        setRegFieldError("password", { message });
      else if (message.toLowerCase().includes("display name"))
        setRegFieldError("displayName", { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);
    clearLoginErrors();
    try {
      await login(data.email, data.password);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(message);
      if (message.toLowerCase().includes("email")) setLoginFieldError("email", { message });
      else if (message.toLowerCase().includes("password"))
        setLoginFieldError("password", { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchTab = (tab: "register" | "login") => {
    setActiveTab(tab);
    setError(null);
    router.replace(`/auth?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-text">
      {/* Left Panel */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-serif font-bold">
              M
            </span>
            <div>
              <span className="font-serif font-bold text-lg text-primary block">MakeMyMarrige</span>
              <span className="text-[10px] tracking-widest text-accent uppercase block">
                Family Wedding Workspace
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF2ED] text-accent text-xs font-semibold tracking-wider uppercase mb-6 border border-[#EAE4DA]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
            Family Wedding Workspace
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary leading-[1.15] mb-6">
            Two families.
            <br />
            <span className="italic text-accent">One celebration.</span>
            <br />
            Everything in harmony.
          </h1>

          <p className="text-muted text-base sm:text-lg mb-10 max-w-xl">
            Coordinate functions, balance shared budgets, manage guest RSVPs, and collaborate
            seamlessly across family organizers and co-owners.
          </p>

          {/* Cultural Card */}
          <div className="bg-white rounded-xl border border-[#EAE4DA] p-5 shadow-sm max-w-md mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#FAF2ED] flex items-center justify-center text-primary font-serif text-xl border border-border">
                ॐ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial font-semibold text-text">Hastamelap • हस्तमेलाप</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#FAF2ED] text-[#BD9560] rounded border border-[#EAE4DA]">
                    Sacred Union
                  </span>
                </div>
                <p className="text-xs text-[#77716B] mt-1">
                  Uniting both sides in synchronized harmony, clarity, and shared joy.
                </p>
              </div>
            </div>
          </div>

          {/* Product Preview Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mb-12">
            <div className="bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#BD9560] uppercase tracking-wider">
                  Functions
                </span>
                <span className="text-[10px] bg-[#FAF2ED] text-[#7A2E42] px-2 py-0.5 rounded font-medium">
                  3 Itineraries
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#FAF2ED]">
                  <span className="text-[#282522] font-medium">• Haldi</span>
                  <span className="text-[#77716B]">10:30 AM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF2ED]">
                  <span className="text-[#282522] font-medium">• Mehendi</span>
                  <span className="text-[#77716B]">04:00 PM</span>
                </div>
                <div className="flex justify-between py-1 bg-[#FAF2ED] px-1 rounded text-[#7A2E42] font-medium">
                  <span>• Wedding Ceremony</span>
                  <span>Tomorrow 09:15 AM</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#BD9560] uppercase tracking-wider">
                  Guests &amp; RSVP
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                  76% Confirmed
                </span>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-serif font-bold text-xl text-[#282522]">
                  500 <span className="text-xs font-sans font-normal text-[#77716B]">Total</span>
                </span>
                <span className="font-serif font-bold text-emerald-700 text-sm">380 Confirmed</span>
              </div>
              <div className="w-full bg-[#EAE4DA] h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-emerald-600 h-full w-[76%] rounded-full"></div>
              </div>
              <div className="flex justify-between text-[11px] text-[#77716B]">
                <span>Pending responses: 120</span>
                <span>Family responses updated</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#BD9560] uppercase tracking-wider">
                  Shared Budget
                </span>
                <span className="text-[10px] bg-[#FAF2ED] text-[#BD9560] px-2 py-0.5 rounded font-medium">
                  Shared Budget
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <span className="text-[10px] text-[#77716B] uppercase block">
                    Allocated Budget
                  </span>
                  <span className="font-serif font-bold text-sm text-[#282522]">₹50,00,000</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#77716B] uppercase block">Expenses</span>
                  <span className="font-serif font-bold text-sm text-[#7A2E42]">₹28,50,000</span>
                </div>
              </div>
              <div className="text-[11px] bg-[#FAF2ED] text-[#BD9560] px-2 py-1 rounded text-center font-medium">
                Shared Budget ledger active
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#EAE4DA] p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#BD9560] uppercase tracking-wider">
                  Tasks &amp; Approvals
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium">
                  Joint Sign-off
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#FAF2ED]">
                  <span className="text-[#282522]">Venue confirmation</span>
                  <span className="text-emerald-700 font-medium">Approved</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF2ED]">
                  <span className="text-[#282522]">Vendor selection</span>
                  <span className="text-amber-700 font-medium">In Progress</span>
                </div>
                <div className="flex justify-between py-1 text-[#77716B]">
                  <span>Co-owner approval</span>
                  <span className="text-slate-500 font-medium">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#77716B] pt-6 border-t border-[#EAE4DA] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span>
            Coordinate wedding functions, guests, budgets and approvals with the right access for
            every family member.
          </span>
          <span className="font-serif italic text-[#BD9560]">॥ द्विगुण संगम • एक उत्सव ॥</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 bg-white flex flex-col justify-between">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#FAF2ED] flex items-center justify-center text-[#7A2E42] border border-[#EAE4DA]">
                🔒
              </div>
              <span className="text-xs font-semibold text-[#77716B] uppercase tracking-wider">
                Family Workspace Access
              </span>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#FAF2ED] text-[#BD9560] border border-[#EAE4DA]">
              Family Collaboration
            </span>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 bg-[#FAF2ED] p-1 rounded-xl mb-8 border border-[#EAE4DA]">
            <button
              onClick={() => switchTab("register")}
              className={`py-3 text-sm font-medium rounded-lg transition-all ${activeTab === "register"
                  ? "bg-[#7A2E42] text-white shadow-sm"
                  : "text-[#77716B] hover:text-[#282522]"
                }`}
            >
              Create Workspace
            </button>
            <button
              onClick={() => switchTab("login")}
              className={`py-3 text-sm font-medium rounded-lg transition-all ${activeTab === "login"
                  ? "bg-[#7A2E42] text-white shadow-sm"
                  : "text-[#77716B] hover:text-[#282522]"
                }`}
            >
              Sign In
            </button>
          </div>

          {error && (
            <div className="mb-6">
              <InlineBanner type="error" message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {activeTab === "register" ? (
            <div>
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-semibold text-[#282522] mb-1">
                  Start your family's wedding workspace.
                </h2>
                <p className="text-sm text-[#77716B]">
                  Create your account to begin bringing both families together.
                </p>
              </div>

              <form onSubmit={handleRegSubmit(onRegisterSubmit)} className="space-y-5" noValidate>
                <TextField
                  label="Full name"
                  placeholder="e.g. Priya Sharma"
                  error={regErrors.displayName?.message ?? undefined}
                  required
                  {...regRegister("displayName")}
                />

                <TextField
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. priya@family.com"
                  error={regErrors.email?.message ?? undefined}
                  required
                  {...regRegister("email")}
                />

                <TextField
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create password"
                  error={regErrors.password?.message ?? undefined}
                  required
                  {...regRegister("password")}
                />

                <div className="flex gap-2 flex-wrap pt-1">
                  <span className="text-[11px] px-2.5 py-1 rounded bg-[#FAF2ED] text-[#77716B] border border-[#EAE4DA]">
                    ✓ 8+ characters
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded bg-[#FAF2ED] text-[#77716B] border border-[#EAE4DA]">
                    ✓ 1 number
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded bg-[#FAF2ED] text-[#77716B] border border-[#EAE4DA]">
                    ✓ 1 symbol
                  </span>
                </div>

                <TextField
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  required
                />

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    defaultChecked
                    className="mt-1 rounded border-[#EAE4DA] text-[#7A2E42] focus:ring-[#7A2E42]"
                    required
                  />
                  <label htmlFor="terms" className="text-xs text-[#77716B]">
                    I agree to the MakeMyMarrige{" "}
                    <Link href="/terms" className="text-[#7A2E42] underline hover:text-[#662638]">
                      Terms of Service
                    </Link>{" "}
                    &amp;{" "}
                    <Link href="/privacy" className="text-[#7A2E42] underline hover:text-[#662638]">
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isSubmitting || authLoading}
                  className="mt-2"
                >
                  Create Workspace →
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[#EAE4DA]"></div>
                  <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-[#77716B]">
                    OR
                  </span>
                  <div className="flex-grow border-t border-[#EAE4DA]"></div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-lg border border-[#EAE4DA] bg-white text-sm font-medium text-[#77716B] flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google{" "}
                  <span className="text-[10px] bg-[#FAF2ED] text-[#77716B] px-1.5 py-0.5 rounded ml-1">
                    Coming soon
                  </span>
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-semibold text-[#282522] mb-1">
                  Welcome back to your workspace.
                </h2>
                <p className="text-sm text-[#77716B]">
                  Sign in to continue planning with your family.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-5" noValidate>
                <TextField
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. priya@family.com"
                  error={loginErrors.email?.message ?? undefined}
                  required
                  {...loginRegister("email")}
                />

                <TextField
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  error={loginErrors.password?.message ?? undefined}
                  required
                  {...loginRegister("password")}
                />

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-[#EAE4DA] text-[#7A2E42] focus:ring-[#7A2E42]"
                    />
                    <span className="text-[#77716B]">Remember me</span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[#7A2E42] font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isSubmitting || authLoading}
                  className="mt-2"
                >
                  Sign In →
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[#EAE4DA]"></div>
                  <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-[#77716B]">
                    OR
                  </span>
                  <div className="flex-grow border-t border-[#EAE4DA]"></div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-lg border border-[#EAE4DA] bg-white text-sm font-medium text-[#77716B] flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google{" "}
                  <span className="text-[10px] bg-[#FAF2ED] text-[#77716B] px-1.5 py-0.5 rounded ml-1">
                    Coming soon
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* Roles & Permissions Info */}
          <div className="mt-10 pt-6 border-t border-[#EAE4DA]">
            <h4 className="text-xs font-semibold text-[#282522] uppercase tracking-wider mb-2">
              Workspace Roles &amp; Permissions
            </h4>
            <ul className="text-xs text-[#77716B] space-y-1.5 mb-4">
              <li>
                • <strong className="text-[#282522]">Co-owner:</strong> Workspace governance and
                management.
              </li>
              <li>
                • <strong className="text-[#282522]">Organiser:</strong> Explicitly assigned
                permissions.
              </li>
              <li>
                • <strong className="text-[#282522]">Guest:</strong> Invitation-led guest portal
                with published function details, RSVP and approved gallery.
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-[#FAF2ED] border border-[#EAE4DA] flex items-start gap-2">
              <span className="text-sm">ℹ️</span>
              <p className="text-[11px] text-[#77716B]">
                Guests do not have access to internal workspace budgets, vendor approvals or
                management features.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-[#77716B]">
          © {new Date().getFullYear()} MakeMyMarrige Technologies. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F4] text-[#77716B]">
          Loading workspace...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
