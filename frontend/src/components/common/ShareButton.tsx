import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "../ui/Button";

interface ShareButtonProps {
  url: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function ShareButton({ url, label = "Share", variant = "outline", className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // fall through to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard may be unavailable; ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant={variant} onClick={handleClick} className={className}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link copied!" : label}
    </Button>
  );
}
