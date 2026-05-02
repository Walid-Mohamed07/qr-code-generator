'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 mb-5">
        <AlertTriangle className="w-10 h-10" />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to load dashboard
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        Something went wrong while loading your analytics. This is usually a
        temporary issue — please try again.
      </p>

      {error.digest && (
        <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mb-6">
          Error ID: {error.digest}
        </p>
      )}

      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
