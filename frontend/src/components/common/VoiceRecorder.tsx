import { useRef, useState } from "react";
import { Button } from "../ui/Button";

interface VoiceRecorderProps {
  onChange: (file: File | null) => void;
}

// Native MediaRecorder API for in-browser recording, with a file-upload
// fallback (spec section 2).
export function VoiceRecorder({ onChange }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
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
      <div className="flex items-center gap-2">
        <Button type="button" variant={recording ? "destructive" : "outline"} onClick={recording ? stopRecording : startRecording}>
          {recording ? "Stop recording" : "Record voice note"}
        </Button>
        <span className="text-sm text-slate-500">or</span>
        <input type="file" accept="audio/*" onChange={handleFileUpload} className="text-sm" />
      </div>
      {fileName && <p className="text-xs text-slate-500">Selected: {fileName}</p>}
    </div>
  );
}
