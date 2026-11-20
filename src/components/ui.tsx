"use client";

import { useEffect, type ReactNode, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = (p: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const Icon = {
  Play: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M7 4v16l13-8z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Pause: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Next: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5 5l10 7-10 7z" fill="currentColor" stroke="none" />
      <path d="M19 5v14" />
    </svg>
  ),
  Prev: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M19 5L9 12l10 7z" fill="currentColor" stroke="none" />
      <path d="M5 5v14" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Edit: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </svg>
  ),
  Copy: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h9" />
    </svg>
  ),
  Trash: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  ),
  X: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Up: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  ),
  Down: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Back: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  Clock: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Sound: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  ),
  Mute: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M17 9l5 6M22 9l-5 6" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  ),
  Share: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  ),
  Import: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 4v11M8 11l4 4 4-4" />
      <path d="M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />
    </svg>
  ),
  Info: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  ),
};

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-fade-up w-full ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface border border-line`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 bg-surface/95 backdrop-blur border-b border-line">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-muted hover:text-ink hover:bg-surface-2"
            aria-label="Close"
          >
            <Icon.X />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        tone === "accent" ? "bg-accent/15 text-accent-strong" : "bg-surface-2 text-muted"
      }`}
    >
      {children}
    </span>
  );
}
