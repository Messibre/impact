import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QRCodeDisplay({ url, size = 200 }: { url: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: size, margin: 1 });
    }
  }, [url, size]);

  return (
    <div className="inline-flex rounded-xl border border-border bg-white p-3 shadow-soft">
      <canvas ref={canvasRef} />
    </div>
  );
}
