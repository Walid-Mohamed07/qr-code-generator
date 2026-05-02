import { create } from 'zustand';
import type { IQrFormState } from '@/types';

// ── Default form values ───────────────────────────────────────────────────────

const DEFAULT_FORM: IQrFormState = {
  type: 'URL',
  content: '',
  label: '',
  foreground: '#000000',
  background: '#FFFFFF',
  size: 256,
};

// ── Store shape ───────────────────────────────────────────────────────────────

interface QrStoreState {
  formState: IQrFormState;
  previewDataUrl: string | null;
  isGenerating: boolean;
}

interface QrStoreActions {
  setFormField: <K extends keyof IQrFormState>(
    field: K,
    value: IQrFormState[K]
  ) => void;
  setPreviewDataUrl: (url: string | null) => void;
  setIsGenerating: (value: boolean) => void;
  resetForm: () => void;
}

type QrStore = QrStoreState & QrStoreActions;

// ── Store implementation ──────────────────────────────────────────────────────

export const useQrStore = create<QrStore>((set) => ({
  // ── Initial state ──
  formState: { ...DEFAULT_FORM },
  previewDataUrl: null,
  isGenerating: false,

  // ── Actions ──

  /**
   * Update a single form field without touching the rest of the state.
   * Generic key constraint ensures type-safety: the value type must match
   * the field being updated — no mismatched assignments possible.
   */
  setFormField: (field, value) =>
    set((state) => ({
      formState: { ...state.formState, [field]: value },
    })),

  /**
   * Store the data URL produced by the qrcode canvas render.
   * Pass null to clear the preview (e.g. after a form reset).
   */
  setPreviewDataUrl: (url) => set({ previewDataUrl: url }),

  /**
   * Toggle the generating spinner while the QR canvas is being rendered.
   */
  setIsGenerating: (value) => set({ isGenerating: value }),

  /**
   * Reset form fields and clear the preview.
   * Spreads DEFAULT_FORM to avoid mutating the constant.
   */
  resetForm: () =>
    set({
      formState: { ...DEFAULT_FORM },
      previewDataUrl: null,
      isGenerating: false,
    }),
}));
