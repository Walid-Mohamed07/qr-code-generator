'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ResetConfirmDialogProps {
  qrLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ResetConfirmDialog({
  qrLabel,
  onConfirm,
  onCancel,
  isLoading,
}: ResetConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Auto-focus Cancel so Enter/Escape doesn't accidentally trigger Reset
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) onCancel();
  };

  useEffect(() => {
    if (isLoading) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, isLoading]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 shadow-xl p-6 flex flex-col gap-4">
        {/* Warning icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>

        {/* Title */}
        <h2
          id="reset-dialog-title"
          className="text-base font-semibold text-gray-900 dark:text-white text-center"
        >
          Reset QR Stats?
        </h2>

        {/* Message */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
          This will clear all scan data for{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            &ldquo;{qrLabel}&rdquo;
          </span>
          . The QR code itself will not be changed.{' '}
          <span className="text-orange-600 dark:text-orange-400 font-medium">
            This cannot be undone.
          </span>
        </p>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting…
              </>
            ) : (
              'Reset Stats'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
