import { create } from "zustand";
import type { IQrCode, IQrFormState, IQrCustomization } from "@/types";

// -- Default form values ------------------------------------------------------

const DEFAULT_CUSTOMIZATION: IQrCustomization = {
  size: 256,
  foreground: "#000000",
  background: "#FFFFFF",
  dotStyle: "square",
  cornerSquareStyle: "square",
  cornerDotStyle: "square",
  cornerSquareColor: "#000000",
  cornerDotColor: "#000000",
  logo: undefined,
  logoSize: 20,
  logoBackgroundColor: "#FFFFFF",
  margin: 4,
  errorCorrectionLevel: "M",
  borderWidth: 0,
  borderColor: "#000000",
  borderPadding: 0,
};

const DEFAULT_FORM: IQrFormState = {
  type: "URL",
  content: "",
  label: "",
  ...DEFAULT_CUSTOMIZATION,
};

// -- Store shape --------------------------------------------------------------

interface QrStoreState {
  formState: IQrFormState;
  previewDataUrl: string | null;
  isGenerating: boolean;
  /** The _id of the QR being edited; null means create mode */
  editingId: string | null;
  /** Optional note describing what changed in an edit */
  editNote: string;
}

interface QrStoreActions {
  /** Update any single form field (content, label, type) */
  setFormField: <K extends keyof IQrFormState>(
    field: K,
    value: IQrFormState[K],
  ) => void;
  /** Update any single customization field */
  setCustomization: <K extends keyof IQrCustomization>(
    field: K,
    value: IQrCustomization[K],
  ) => void;
  setPreviewDataUrl: (url: string | null) => void;
  setIsGenerating: (value: boolean) => void;
  /** Enter edit mode: populate the form from an existing IQrCode */
  loadQrForEdit: (qr: IQrCode) => void;
  /** Set which QR is being edited (null = create mode) */
  setEditMode: (id: string | null) => void;
  setEditNote: (note: string) => void;
  /** Reset everything back to create-mode defaults */
  resetForm: () => void;
}

type QrStore = QrStoreState & QrStoreActions;

// -- Store implementation -----------------------------------------------------

export const useQrStore = create<QrStore>((set) => ({
  // Initial state
  formState: { ...DEFAULT_FORM },
  previewDataUrl: null,
  isGenerating: false,
  editingId: null,
  editNote: "",

  // -- Actions --

  setFormField: (field, value) =>
    set((state) => ({
      formState: { ...state.formState, [field]: value },
    })),

  setCustomization: (field, value) =>
    set((state) => ({
      formState: { ...state.formState, [field]: value },
    })),

  setPreviewDataUrl: (url) => set({ previewDataUrl: url }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  loadQrForEdit: (qr) =>
    set({
      editingId: qr._id,
      editNote: "",
      previewDataUrl: null,
      formState: {
        type: qr.type,
        content: qr.content,
        label: qr.label ?? "",
        size: qr.size,
        foreground: qr.foreground,
        background: qr.background,
        dotStyle: qr.dotStyle,
        cornerSquareStyle: qr.cornerSquareStyle,
        cornerDotStyle: qr.cornerDotStyle,
        cornerSquareColor: qr.cornerSquareColor,
        cornerDotColor: qr.cornerDotColor,
        logo: qr.logo,
        logoSize: qr.logoSize,
        logoBackgroundColor: qr.logoBackgroundColor,
        margin: qr.margin,
        errorCorrectionLevel: qr.errorCorrectionLevel,
        borderWidth: qr.borderWidth,
        borderColor: qr.borderColor,
        borderPadding: qr.borderPadding,
      },
    }),

  setEditMode: (id) =>
    set((state) =>
      id === null
        ? {
            editingId: null,
            editNote: "",
            formState: { ...DEFAULT_FORM },
            previewDataUrl: null,
          }
        : { ...state, editingId: id },
    ),

  setEditNote: (note) => set({ editNote: note }),

  resetForm: () =>
    set({
      formState: { ...DEFAULT_FORM },
      previewDataUrl: null,
      isGenerating: false,
      editingId: null,
      editNote: "",
    }),
}));
