import { HTMLAttributes } from "react";

type Variant = "default" | "destructive";

const variantClasses: Record<Variant, string> = {
  default: "border-slate-200 bg-slate-50 text-slate-900",
  destructive: "border-red-200 bg-red-50 text-red-800",
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Alert({ variant = "default", className = "", ...props }: AlertProps) {
  return <div className={`rounded-md border p-3 text-sm ${variantClasses[variant]} ${className}`} {...props} />;
}
