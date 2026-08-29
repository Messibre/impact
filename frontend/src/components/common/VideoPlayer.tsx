import { useState } from "react";

export function VideoPlayer({ src }: { src: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
        Couldn't load this clip.
      </div>
    );
  }

  return (
    <video
      className="aspect-video w-full rounded-lg bg-black"
      src={src}
      controls
      muted
      autoPlay
      playsInline
      onError={() => setError(true)}
    />
  );
}
