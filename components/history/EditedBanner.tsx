'use client';

import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

/**
 * Dismissible success banner rendered after a successful QR edit.
 * Shown when the history page is loaded with ?edited=true.
 */
export default function EditedBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-4 py-3 mb-6">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        QR updated successfully.
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
