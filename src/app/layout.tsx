import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import AppShell from "@/components/AppShell";

// Self-hosted so production builds do not fetch Google Fonts at compile time.
const manrope = localFont({
  src: "./fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "200 800",
});

// Same family for headings: Manrope's 800 is a different voice from its 400,
// so the directory keeps one type system instead of two competing ones.
const manropeDisplay = localFont({
  src: "./fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "200 800",
});

export const metadata: Metadata = {
  title: {
    default: "SF Contacts",
    template: "%s · SF Contacts",
  },
  description: "Add, search, and manage contacts backed by the Contacts API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${manropeDisplay.variable}`}
    >
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased transition-colors duration-200"
        suppressHydrationWarning
      >
        {/* No Suspense boundary around the shell: it would let Next flush the
            HTML before a page calls notFound(), and the 404 status would be
            lost. Route-level loading.tsx supplies the streaming boundary. */}
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
