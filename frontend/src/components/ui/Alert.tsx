import { HTMLAttributes } from "react";

type Variant = "default" | "destructive" | "success";

const variantClasses: Record<Variant, string> = {
  default: "border-border bg-surface-muted text-foreground",
  destructive: "border-destructive/25 bg-destructive/10 text-destructive",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Alert({ variant = "default", className = "", ...props }: AlertProps) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
