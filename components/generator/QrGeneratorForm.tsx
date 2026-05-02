'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { useQrStore } from '@/store/qr-store';
import { createQr } from '@/lib/actions/qr';
import type { QrType } from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: QrType }[] = [
  { label: 'URL', value: 'URL' },
  { label: 'Text', value: 'TEXT' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'Phone', value: 'PHONE' },
];

const PLACEHOLDERS: Record<QrType, string> = {
  URL: 'https://example.com',
  TEXT: 'Enter any text…',
  EMAIL: 'you@example.com',
  PHONE: '+1 555 000 0000',
};

// ── Per-type validation ───────────────────────────────────────────────────────

function validateContent(type: QrType, content: string): string | null {
  if (!content.trim()) return null; // empty is handled separately

  switch (type) {
    case 'URL':
      if (!/^https?:\/\/.+/.test(content)) {
        return 'Must start with http:// or https://';
      }
      break;
    case 'EMAIL':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content)) {
        return 'Must be a valid email address';
      }
      break;
    case 'PHONE':
      // Accept E.164 (+14155552671) and common local formats
      if (!/^\+?[0-9\s\-().]{7,20}$/.test(content)) {
        return 'Must be a valid phone number (e.g. +1 555 000 0000)';
      }
      break;
  }
  return null;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface QrGeneratorFormProps {
  /** Called after a successful save with the new QR's publicId */
  onSaved: (publicId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QrGeneratorForm({ onSaved }: QrGeneratorFormProps) {
  const {
    formState,
    setFormField,
    setPreviewDataUrl,
    setIsGenerating,
    resetForm,
  } = useQrStore();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Hidden canvas used for QR generation — never shown in the DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stable ref to the latest generatePreview function so the debounce
  // useEffect never has it as a dependency (avoids stale-closure loops).
  const generatePreviewRef = useRef<() => Promise<void>>();

  // ── Core QR generation ──────────────────────────────────────────────────────

  const generatePreview = useCallback(async () => {
    const { content, type, foreground, background, size } = formState;

    if (!content.trim()) {
      setPreviewDataUrl(null);
      return;
    }

    const error = validateContent(type, content);
    setValidationError(error);
    if (error) return;

    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, content, {
        width: size,
        color: { dark: foreground, light: background },
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      setPreviewDataUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('[generatePreview]', err);
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  }, [formState, setIsGenerating, setPreviewDataUrl]);

  // Keep the ref current so the debounce always calls the latest version
  useEffect(() => {
    generatePreviewRef.current = generatePreview;
  });

  // ── Debounced auto-regenerate (400ms) ───────────────────────────────────────
  // We watch the individual fields — not the whole formState object —
  // to avoid triggering on label changes (which don't affect the QR image).

  useEffect(() => {
    const timer = setTimeout(() => {
      void generatePreviewRef.current?.();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formState.content,
    formState.foreground,
    formState.background,
    formState.size,
    formState.type,
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTypeChange = (type: QrType) => {
    setFormField('type', type);
    setFormField('content', '');
    setValidationError(null);
    setPreviewDataUrl(null);
  };

  const handleSave = async () => {
    const { content, type } = formState;

    if (!content.trim()) {
      toast.error('Please enter content before saving.');
      return;
    }

    const error = validateContent(type, content);
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }

    setIsSaving(true);
    const result = await createQr(formState);
    setIsSaving(false);

    if ('error' in result && result.error) {
      toast.error(result.error ?? 'Failed to save — please try again.');
    } else if ('data' in result && result.data) {
      toast.success('QR saved to history');
      onSaved(result.data.publicId);
      resetForm();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden canvas used for QR rendering */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Type tab switcher */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTypeChange(tab.value)}
            className={[
              'flex-1 py-2 text-sm font-medium transition-colors',
              formState.type === tab.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content input */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Content <span className="text-red-500">*</span>
        </label>
        <input
          type={
            formState.type === 'EMAIL'
              ? 'email'
              : formState.type === 'PHONE'
              ? 'tel'
              : 'text'
          }
          value={formState.content}
          placeholder={PLACEHOLDERS[formState.type]}
          onChange={(e) => {
            setFormField('content', e.target.value);
            if (validationError) setValidationError(null);
          }}
          className={[
            'w-full rounded-md border px-3 py-2 text-sm',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2',
            validationError
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500',
          ].join(' ')}
        />
        {validationError && (
          <p className="text-xs text-red-500 mt-0.5">{validationError}</p>
        )}
      </div>

      {/* Label */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Label{' '}
          <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={formState.label}
          placeholder="e.g. My website"
          onChange={(e) => setFormField('label', e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Size slider */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Size:{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {formState.size}px
          </span>
        </label>
        <input
          type="range"
          min={128}
          max={512}
          step={16}
          value={formState.size}
          onChange={(e) => setFormField('size', Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>128px</span>
          <span>512px</span>
        </div>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-4">
        {(
          [
            { field: 'foreground', label: 'Foreground' },
            { field: 'background', label: 'Background' },
          ] as const
        ).map(({ field, label }) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
            <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900">
              <input
                type="color"
                value={formState[field]}
                onChange={(e) => setFormField(field, e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                {formState[field].toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={() => void generatePreview()}
          className="w-full py-2.5 rounded-md bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          Generate Preview
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="w-full py-2.5 rounded-md border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-medium text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving…' : 'Save to History'}
        </button>
      </div>
    </div>
  );
}
