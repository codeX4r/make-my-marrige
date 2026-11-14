import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-playfair-display",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MakeMyMarrige",
  description: "Wedding planning workspace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} ${notoSansDevanagari.variable}`}
    >
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased">
        <AuthProvider>{children}</AuthProvider>

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
      </body>
    </html>
  );
}
