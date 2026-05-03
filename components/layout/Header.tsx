'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Menu, Sun, Moon } from 'lucide-react';
import MobileDrawer from '@/components/layout/MobileDrawer';

/**
 * Top header bar shown on all dashboard pages.
 *
 * Desktop: only the dark-mode toggle is visible (sidebar is always present).
 * Mobile: hamburger button + dark-mode toggle.
 */
export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        {/* Left — hamburger (mobile only) */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open navigation menu"
          suppressHydrationWarning
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Spacer so the toggle is pushed to the right on desktop */}
        <div className="hidden lg:block" />

        {/* Right — dark mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          suppressHydrationWarning
        >
          {/* Render a placeholder until client mounts to avoid SSR/client icon mismatch */}
          {!mounted ? (
            <span className="w-5 h-5 block" />
          ) : resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Mobile drawer — rendered in a portal-like position above everything */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
