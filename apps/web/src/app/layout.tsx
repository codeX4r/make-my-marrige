import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Script from "next/script";

export const metadata: Metadata = {
  title: "MakeMyMarrige",
  description: "Wedding planning workspace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Material+Symbols+Outlined:wght,FILL@300..600,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300..600,0..1&display=swap"
          rel="stylesheet"
        />
        <Script
          strategy="lazyOnload"
          src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
        />
        <Script
          strategy="lazyOnload"
          src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
        />
        <Script
          strategy="lazyOnload"
          src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"
        />
        <Script
          strategy="lazyOnload"
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}