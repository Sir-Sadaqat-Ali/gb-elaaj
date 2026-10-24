import type { Metadata, Viewport } from "next";
import { Inter, Poppins, JetBrains_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Display face: Poppins (Curenast-matched). Keep the `--font-fraunces` var name
// so tailwind.config + every .ge-display usage keeps resolving with no changes.
const fraunces = Poppins({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-fraunces", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--font-nastaliq", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Gb Elaaj — Health that travels with you",
    template: "%s · Gb Elaaj",
  },
  description:
    "Pakistan's connected healthcare platform. Verified doctors, lab tests at home, online pharmacy, home nursing. Built in Gilgit-Baltistan.",
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0B84FE",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${mono.variable} ${nastaliq.variable}`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ge-primary focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SessionProvider>
          <QueryProvider>
            {children}
            <ToastProvider />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
