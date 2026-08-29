import { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        {children}
        <button
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
