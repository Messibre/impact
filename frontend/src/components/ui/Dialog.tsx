import { ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/30 p-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="animate-rise relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 pr-6 text-lg font-bold tracking-tight text-foreground">{title}</h3>
        {children}
        <button
          className="absolute right-4 top-4 rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
