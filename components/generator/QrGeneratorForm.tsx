'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, AlertTriangle, X } from 'lucide-react';
import { useQrStore } from '@/store/qr-store';
import { createQr, updateQr } from '@/lib/actions/qr';
import { generateQrDataUrl } from '@/lib/qr-renderer';
import type {
  QrType,
  DotStyle,
  CornerSquareStyle,
  CornerDotStyle,
  ErrorCorrectionLevel,
} from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

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

const MAX_LOGO_BYTES = 200 * 1024; // 200 KB

// ── Style option definitions ──────────────────────────────────────────────────

interface StyleOption<T> {
  value: T;
  label: string;
  icon: React.ReactElement;
}

const DOT_STYLE_OPTIONS: StyleOption<DotStyle>[] = [
  {
    value: 'square',
    label: 'Square',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="1" y="1" width="10" height="10" />
        <rect x="13" y="1" width="10" height="10" />
        <rect x="1" y="13" width="10" height="10" />
        <rect x="13" y="13" width="10" height="10" />
      </svg>
    ),
  },
  {
    value: 'rounded',
    label: 'Rounded',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="1" y="1" width="10" height="10" rx="2.5" />
        <rect x="13" y="1" width="10" height="10" rx="2.5" />
        <rect x="1" y="13" width="10" height="10" rx="2.5" />
        <rect x="13" y="13" width="10" height="10" rx="2.5" />
      </svg>
    ),
  },
  {
    value: 'dots',
    label: 'Dots',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <circle cx="6" cy="6" r="5" />
        <circle cx="18" cy="6" r="5" />
        <circle cx="6" cy="18" r="5" />
        <circle cx="18" cy="18" r="5" />
      </svg>
    ),
  },
  {
    value: 'classy',
    label: 'Classy',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <polygon points="1,1 8,1 11,4 11,11 1,11" />
        <polygon points="13,1 20,1 23,4 23,11 13,11" />
        <polygon points="1,13 8,13 11,16 11,23 1,23" />
        <polygon points="13,13 20,13 23,16 23,23 13,23" />
      </svg>
    ),
  },
  {
    value: 'classy-rounded',
    label: 'Classy+',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M1,3 Q1,1 3,1 H8 L11,4 V9 Q11,11 9,11 H3 Q1,11 1,9 Z" />
        <path d="M13,3 Q13,1 15,1 H20 L23,4 V9 Q23,11 21,11 H15 Q13,11 13,9 Z" />
        <path d="M1,15 Q1,13 3,13 H8 L11,16 V21 Q11,23 9,23 H3 Q1,23 1,21 Z" />
        <path d="M13,15 Q13,13 15,13 H20 L23,16 V21 Q23,23 21,23 H15 Q13,23 13,21 Z" />
      </svg>
    ),
  },
  {
    value: 'extra-rounded',
    label: 'X-Round',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="1" y="1" width="10" height="10" rx="5" />
        <rect x="13" y="1" width="10" height="10" rx="5" />
        <rect x="1" y="13" width="10" height="10" rx="5" />
        <rect x="13" y="13" width="10" height="10" rx="5" />
      </svg>
    ),
  },
];

const CORNER_SQ_OPTIONS: StyleOption<CornerSquareStyle>[] = [
  {
    value: 'none',
    label: 'Auto',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <rect
          x="2" y="2" width="20" height="20" rx="1"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeDasharray="4 2"
        />
      </svg>
    ),
  },
  {
    value: 'dot',
    label: 'Dot',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    value: 'square',
    label: 'Square',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="2" y="2" width="20" height="20" />
      </svg>
    ),
  },
  {
    value: 'extra-rounded',
    label: 'X-Round',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="2" y="2" width="20" height="20" rx="8" />
      </svg>
    ),
  },
];

const CORNER_DOT_OPTIONS: StyleOption<CornerDotStyle>[] = [
  {
    value: 'none',
    label: 'Auto',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <rect
          x="7" y="7" width="10" height="10"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeDasharray="3 1.5"
        />
      </svg>
    ),
  },
  {
    value: 'dot',
    label: 'Dot',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <circle cx="12" cy="12" r="6" />
      </svg>
    ),
  },
  {
    value: 'square',
    label: 'Square',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="7" y="7" width="10" height="10" />
      </svg>
    ),
  },
];

const ECL_OPTIONS: { value: ErrorCorrectionLevel; label: string; description: string }[] = [
  { value: 'L', label: 'L', description: '7% recovery' },
  { value: 'M', label: 'M', description: '15% recovery' },
  { value: 'Q', label: 'Q', description: '25% recovery' },
  { value: 'H', label: 'H', description: '30% recovery' },
];

// ── Validation ────────────────────────────────────────────────────────────────

function validateContent(type: QrType, content: string): string | null {
  if (!content.trim()) return null;
  switch (type) {
    case 'URL':
      if (!/^https?:\/\/.+/.test(content)) return 'Must start with http:// or https://';
      break;
    case 'EMAIL':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content)) return 'Must be a valid email address';
      break;
    case 'PHONE':
      if (!/^\+?[0-9\s\-().]{7,20}$/.test(content)) return 'Must be a valid phone number (e.g. +1 555 000 0000)';
      break;
  }
  return null;
}

// ── StyleSelector sub-component ───────────────────────────────────────────────

interface StyleSelectorProps<T extends string> {
  label: string;
  value: T;
  options: StyleOption<T>[];
  cols?: number;
  onChange: (v: T) => void;
}

function StyleSelector<T extends string>({
  label,
  value,
  options,
  cols = 3,
  onChange,
}: StyleSelectorProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            onClick={() => onChange(opt.value)}
            className={[
              'flex flex-col items-center gap-1 px-1 py-2 rounded-lg border-2 transition-colors',
              value === opt.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
            ].join(' ')}
          >
            <span className="flex items-center justify-center w-6 h-6">{opt.icon}</span>
            <span className="text-xs leading-tight text-center">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface QrGeneratorFormProps {
  onSaved: (publicId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QrGeneratorForm({ onSaved }: QrGeneratorFormProps) {
  const {
    formState,
    setFormField,
    setCustomization,
    setPreviewDataUrl,
    setIsGenerating,
    resetForm,
    editingId,
    editNote,
    setEditNote,
    setEditMode,
  } = useQrStore();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const isEditing = editingId !== null;

  // Warn before navigating away with unsaved edits
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEditing]);

  const router = useRouter();

  const generatePreviewRef = useRef<() => Promise<void>>();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Logo upload ────────────────────────────────────────────────────────────

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo too large. Max 200KB.');
      e.target.value = '';
      return;
    }

    setLogoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setCustomization('logo', reader.result as string);
      setCustomization('errorCorrectionLevel', 'H');
    };
    reader.onerror = () => setLogoError('Failed to read file. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCustomization('logo', undefined);
    setLogoError(null);
    setCustomization('errorCorrectionLevel', 'M');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // ── QR preview generation ──────────────────────────────────────────────────

  const generatePreview = useCallback(async () => {
    const { content, type } = formState;

    if (!content.trim()) {
      setPreviewDataUrl(null);
      setRenderError(null);
      return;
    }

    const error = validateContent(type, content);
    setValidationError(error);
    if (error) return;

    setIsGenerating(true);
    setRenderError(null);

    try {
      const dataUrl = await generateQrDataUrl(formState);
      setPreviewDataUrl(dataUrl);
    } catch (err) {
      console.error('[generatePreview]', err);
      setRenderError('Failed to render QR code. Try simplifying the content or styling.');
    } finally {
      setIsGenerating(false);
    }
  }, [formState, setIsGenerating, setPreviewDataUrl]);

  useEffect(() => {
    generatePreviewRef.current = generatePreview;
  });

  // Debounced re-render on any visual field change
  useEffect(() => {
    const timer = setTimeout(() => {
      void generatePreviewRef.current?.();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formState.content,
    formState.type,
    formState.foreground,
    formState.background,
    formState.size,
    formState.dotStyle,
    formState.cornerSquareStyle,
    formState.cornerDotStyle,
    formState.cornerSquareColor,
    formState.cornerDotColor,
    formState.logo,
    formState.logoSize,
    formState.margin,
    formState.errorCorrectionLevel,
    formState.borderWidth,
    formState.borderColor,
  ]);

  // ── Type change ────────────────────────────────────────────────────────────

  const handleTypeChange = (type: QrType) => {
    setFormField('type', type);
    setFormField('content', '');
    setValidationError(null);
    setPreviewDataUrl(null);
  };

  // ── Save handler ───────────────────────────────────────────────────────────

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

    if (isEditing && editingId) {
      const result = await updateQr(editingId, {
        ...formState,
        editNote: editNote.trim() || undefined,
      });
      setIsSaving(false);

      if ('error' in result && result.error) {
        toast.error(result.error ?? 'Failed to update — please try again.');
      } else if ('data' in result && result.data) {
        toast.success('QR code updated');
        resetForm();
        router.push('/history?edited=true');
      }
    } else {
      const result = await createQr(formState);
      setIsSaving(false);

      if ('error' in result && result.error) {
        toast.error(result.error ?? 'Failed to save — please try again.');
      } else if ('data' in result && result.data) {
        toast.success('QR saved to history');
        onSaved(result.data.publicId);
        resetForm();
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Edit mode banner */}
      {isEditing && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Editing QR
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate max-w-[220px]">
              {formState.label || formState.content || 'Untitled'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditMode(null);
              resetForm();
            }}
            className="flex items-center gap-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Exit Edit Mode
          </button>
        </div>
      )}

      {/* Render error */}
      {renderError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{renderError}</span>
        </div>
      )}

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
            formState.type === 'EMAIL' ? 'email' : formState.type === 'PHONE' ? 'tel' : 'text'
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

      {/* Advanced Styling (collapsible) */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsStyleOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span>Advanced Styling</span>
          {isStyleOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {isStyleOpen && (
          <div className="px-4 py-4 flex flex-col gap-6 border-t border-gray-200 dark:border-gray-700">

            {/* Section 1 — Dot Style */}
            <StyleSelector
              label="Dot Style"
              value={formState.dotStyle}
              options={DOT_STYLE_OPTIONS}
              cols={6}
              onChange={(v) => setCustomization('dotStyle', v)}
            />

            {/* Section 2 — Corner Square Style */}
            <StyleSelector
              label="Corner Square Style"
              value={formState.cornerSquareStyle}
              options={CORNER_SQ_OPTIONS}
              cols={4}
              onChange={(v) => setCustomization('cornerSquareStyle', v)}
            />

            {/* Section 3 — Corner Dot Style */}
            <StyleSelector
              label="Corner Dot Style"
              value={formState.cornerDotStyle}
              options={CORNER_DOT_OPTIONS}
              cols={3}
              onChange={(v) => setCustomization('cornerDotStyle', v)}
            />

            {/* Section 4 — Corner Colors */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Corner Colors</span>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { field: 'cornerSquareColor', label: 'Corner Square' },
                    { field: 'cornerDotColor',    label: 'Corner Dot'    },
                  ] as const
                ).map(({ field, label }) => (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
                    <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900">
                      <input
                        type="color"
                        value={formState[field]}
                        onChange={(e) => setCustomization(field, e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                        {formState[field].toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4 — Logo Upload */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo</span>

              <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Error correction will be set to High (H) when a logo is present.</span>
              </div>

              {formState.logo ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formState.logo}
                    alt="Logo preview"
                    className="w-12 h-12 rounded border border-gray-200 dark:border-gray-700 object-contain bg-white p-0.5"
                  />
                  <div className="flex flex-col gap-1 flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Logo loaded</p>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors w-fit"
                    >
                      <X className="w-3 h-3" />
                      Remove Logo
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 w-28 shrink-0">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      Size:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formState.logoSize}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={40}
                      step={5}
                      value={formState.logoSize}
                      onChange={(e) => setCustomization('logoSize', Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPEG or SVG · Max 200 KB
                  </span>
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Choose file
                  </span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
              )}

              {logoError && (
                <p className="text-xs text-red-500">{logoError}</p>
              )}
            </div>

            {/* Section 5 — Fine Tuning */}
            <div className="flex flex-col gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fine Tuning
              </span>

              {/* Margin slider */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Margin:{' '}
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">
                    {formState.margin} modules
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={formState.margin}
                  onChange={(e) => setCustomization('margin', Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              {/* Error Correction Level */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Error Correction Level
                  {formState.logo && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      (locked to H — logo present)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ECL_OPTIONS.map((opt) => {
                    const locked = !!formState.logo;
                    const selected = formState.errorCorrectionLevel === opt.value;
                    const disabled = locked && opt.value !== 'H';
                    return (
                      <label
                        key={opt.value}
                        className={[
                          'flex flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-2 transition-colors',
                          disabled
                            ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700'
                            : 'cursor-pointer',
                          selected && !disabled
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                            : !disabled
                            ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="ecl"
                          value={opt.value}
                          checked={selected}
                          disabled={disabled}
                          onChange={() =>
                            setCustomization('errorCorrectionLevel', opt.value)
                          }
                          className="sr-only"
                        />
                        <span className="text-sm font-bold">{opt.label}</span>
                        <span className="text-xs text-center leading-tight opacity-75">
                          {opt.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 6 — Border */}
            <div className="flex flex-col gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Border</span>

              {/* Border width */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Width:{' '}
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">
                    {formState.borderWidth === 0 ? 'None' : `${formState.borderWidth}px`}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={2}
                  value={formState.borderWidth}
                  onChange={(e) => setCustomization('borderWidth', Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>None</span>
                  <span>30px</span>
                </div>
              </div>

              {/* Border color — only visible when width > 0 */}
              {formState.borderWidth > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Border Color</label>
                  <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900 w-fit">
                    <input
                      type="color"
                      value={formState.borderColor}
                      onChange={(e) => setCustomization('borderColor', e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                      {formState.borderColor.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Edit Note (edit mode only) */}
      {isEditing && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Note about this change{' '}
            <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="e.g. Updated URL for summer campaign"
            rows={2}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={() => void generatePreview()}
          suppressHydrationWarning
          className="w-full py-2.5 rounded-md bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          Generate Preview
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          suppressHydrationWarning
          className="w-full py-2.5 rounded-md border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-medium text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save to History'}
        </button>
      </div>
    </div>
  );
}
