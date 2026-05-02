"use client";

import { useEffect, useState } from "react";
import {
  X,
  Copy,
  Check,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
} from "lucide-react";

interface ShareModalProps {
  /** Scan URL — e.g. https://yourdomain.com/abc123 */
  url: string;
  /** Display name for the QR code */
  label: string;
  onClose: () => void;
}

// ── Share platform definitions ────────────────────────────────────────────────

interface Platform {
  id: string;
  label: string;
  icon: React.ReactElement;
  colorClass: string;
  build: (url: string, text: string) => string;
}

const PLATFORMS: Platform[] = [
  {
    id: "twitter",
    label: "X / Twitter",
    icon: <Twitter className="w-5 h-5" />,
    colorClass: "bg-black hover:bg-gray-800 text-white",
    build: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    colorClass: "bg-[#1877F2] hover:bg-[#1565d8] text-white",
    build: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin className="w-5 h-5" />,
    colorClass: "bg-[#0A66C2] hover:bg-[#094fa3] text-white",
    build: (url, text) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: <MessageCircle className="w-5 h-5" />,
    colorClass: "bg-[#25D366] hover:bg-[#1ebe5b] text-white",
    build: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    id: "email",
    label: "Email",
    icon: <Mail className="w-5 h-5" />,
    colorClass:
      "bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400 text-white",
    build: (url, text) =>
      `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`Check out this QR code:\n${url}`)}`,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShareModal({ url, label, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const openPlatform = (platform: Platform) => {
    const shareUrl = platform.build(url, label);
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  // Native Web Share API (mobile)
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: label, url });
    } catch {
      // User cancelled — do nothing
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Share QR code"
    >
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Share QR Code
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* URL display + copy */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
            <span className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
              {url}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy link"
              className="shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Platform buttons */}
          <div className="grid grid-cols-1 gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => openPlatform(platform)}
                className={[
                  "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  platform.colorClass,
                ].join(" ")}
              >
                {platform.icon}
                {platform.label}
              </button>
            ))}

            {/* Native share (mobile browsers) */}
            {canNativeShare && (
              <button
                type="button"
                onClick={() => void handleNativeShare()}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                More options…
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
