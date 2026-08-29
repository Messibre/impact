import { useState } from "react";
import { Button } from "../ui/Button";

export function ShareButton({ url }: { url: string }) {
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
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" onClick={handleClick}>
      {copied ? "Link copied!" : "Share"}
    </Button>
  );
}
