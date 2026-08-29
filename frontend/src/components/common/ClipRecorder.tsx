import { useRef, useState } from "react";
import { Button } from "../ui/Button";

interface ClipRecorderProps {
  onChange: (file: File | null) => void;
}

export function ClipRecorder({ onChange }: ClipRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }

    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `clip-${Date.now()}.webm`, { type: "video/webm" });
      setFileName(file.name);
      onChange(file);
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onChange(file);
  };

  return (
    <div className="space-y-2">
      {recording && <video ref={videoRef} muted className="aspect-video w-full max-w-xs rounded-md bg-black" />}
      <div className="flex items-center gap-2">
        <Button type="button" variant={recording ? "destructive" : "outline"} onClick={recording ? stopRecording : startRecording}>
          {recording ? "Stop recording" : "Record clip"}
        </Button>
        <span className="text-sm text-slate-500">or</span>
        <input type="file" accept="video/*,image/*" onChange={handleFileUpload} className="text-sm" />
      </div>
      {fileName && <p className="text-xs text-slate-500">Selected: {fileName}</p>}
    </div>
  );
}
