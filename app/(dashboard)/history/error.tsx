'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js error boundary for the /history route segment.
 * Must be a Client Component — Next.js requires error.tsx files to be
 * client components so the `reset` function (a React re-render trigger)
 * can be used in event handlers.
 */
export default function HistoryError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error('[HistoryError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 mb-5">
        <AlertTriangle className="w-10 h-10" />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to load history
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        Something went wrong while fetching your QR code history. This is
        usually a temporary issue — please try again.
      </p>

      {/* Error digest helps correlate with server logs without exposing internals */}
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
