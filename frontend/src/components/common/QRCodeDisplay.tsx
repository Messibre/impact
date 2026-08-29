import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QRCodeDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 1 });
    }
  }, [url]);

  return <canvas ref={canvasRef} className="rounded-md border border-slate-200" />;
}
