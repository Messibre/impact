import { ButtonHTMLAttributes } from "react";

type Variant = "default" | "outline" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-muted",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-soft",
  ghost: "text-foreground hover:bg-surface-muted",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "default", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
