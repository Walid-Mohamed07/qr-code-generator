import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "QR Studio",
    template: "%s | QR Studio",
  },
  description:
    "Generate, manage, and track QR codes for URLs, text, emails, and phone numbers.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://myqrcode-opal.vercel.app",
  ),
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        {/*
          ThemeProvider must wrap everything so next-themes can inject
          the `dark` class onto <html>.

          attribute="class"     → Tailwind's `dark:` variant strategy
          defaultTheme="system" → respects OS preference on first visit
          disableTransitionOnChange → prevents a flash of unstyled content
            when switching themes mid-session
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          {/*
            Toaster is placed here so it's available across every route.
            position="top-right" keeps toasts away from interactive UI.
          */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontSize: "0.875rem",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
