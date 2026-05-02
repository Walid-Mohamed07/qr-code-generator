import type { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Shared layout for all (dashboard) route group pages:
 *   /generator, /history, /dashboard
 *
 * Structure:
 *   ┌─────────────────────────────────────┐
 *   │  Sidebar (fixed 240px, desktop)     │
 *   │  ┌───────────────────────────────┐  │
 *   │  │  Header (sticky, full width)  │  │
 *   │  ├───────────────────────────────┤  │
 *   │  │  <main> page content          │  │
 *   │  └───────────────────────────────┘  │
 *   └─────────────────────────────────────┘
 *
 * On mobile the sidebar is hidden; the Header's hamburger opens a drawer.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Desktop sidebar — fixed, 240px wide ──────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-r lg:border-gray-200 dark:border-gray-700 lg:bg-white dark:bg-gray-900 z-20">
        <Sidebar />
      </aside>

      {/* ── Content area — offset by sidebar width on desktop ────────────── */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Sticky top header (contains mobile hamburger + dark mode toggle) */}
        <Header />

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
