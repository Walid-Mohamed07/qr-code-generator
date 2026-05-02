'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-in sidebar drawer for mobile viewports.
 * - Renders a backdrop overlay that closes the drawer on click.
 * - Traps focus via Escape key listener.
 * - Locks body scroll while open.
 */
export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Full-screen overlay
    <div
      className="fixed inset-0 z-40 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl flex flex-col">
        {/* Close button */}
        <div className="flex items-center justify-end px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reuse the same Sidebar content */}
        <div className="flex-1 overflow-y-auto">
          <Sidebar mobile onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
