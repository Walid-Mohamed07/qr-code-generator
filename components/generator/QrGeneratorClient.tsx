'use client';

import { useState } from 'react';
import QrGeneratorForm from '@/components/generator/QrGeneratorForm';
import QrPreviewPanel from '@/components/generator/QrPreviewPanel';

/**
 * Thin client wrapper that owns the `savedPublicId` state and renders
 * the form and preview side-by-side.
 *
 * We need this because:
 *  1. The parent page is a Server Component (cannot hold useState).
 *  2. QrGeneratorForm and QrPreviewPanel are siblings — they share the
 *     savedPublicId value, which doesn't belong in the global Zustand
 *     store (it's ephemeral UI state, not form state).
 */
export default function QrGeneratorClient() {
  const [savedPublicId, setSavedPublicId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left column — form controls */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
          Configure
        </h2>
        <QrGeneratorForm onSaved={setSavedPublicId} />
      </div>

      {/* Right column — live preview */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
          Preview
        </h2>
        <QrPreviewPanel savedPublicId={savedPublicId} />
      </div>
    </div>
  );
}
