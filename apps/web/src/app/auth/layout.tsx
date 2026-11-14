import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | MakeMyMarrige",
  description: "Sign in or create your MakeMyMarrige account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
