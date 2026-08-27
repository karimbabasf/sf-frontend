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
        {/* Ordered (Bayer) dithering for the print view. The tile is a 4x4
            threshold map; each pixel is compared against its position in it and
            snapped to black or white, which is how newsprint fakes grey. */}
        <svg aria-hidden="true" focusable="false" className="absolute h-0 w-0">
          <filter id="halftone" colorInterpolationFilters="sRGB">
            <feImage
              href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAAAAACMmsGiAAAAHUlEQVR42mNgb1dfznDc/Xk6g/l28ekM38uvhwMAR/QH8eqUdOUAAAAASUVORK5CYII="
              width="4"
              height="4"
              result="cell"
            />
            <feTile in="cell" result="threshold" />
            <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="grey" />
            <feComposite
              in="grey"
              in2="threshold"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="-0.5"
              result="biased"
            />
            <feComponentTransfer in="biased">
              <feFuncR type="discrete" tableValues="0 1" />
              <feFuncG type="discrete" tableValues="0 1" />
              <feFuncB type="discrete" tableValues="0 1" />
            </feComponentTransfer>
          </filter>
        </svg>

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
