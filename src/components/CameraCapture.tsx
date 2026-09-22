"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

export default function CameraCapture({
  onCapture,
  onBack,
}: {
  onCapture: (dataUrl: string) => void;
  onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facingMode] = useState<"user" | "environment">("user");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Camera unavailable";
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")) {
        setError("Camera permission denied. You can upload a photo instead.");
      } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("not found")) {
        setError("No camera found on this device. Please upload a photo.");
      } else {
        setError("We couldn't access your camera. You can upload a photo instead.");
      }
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // mirror if front camera
    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopStream();
    onCapture(dataUrl);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      stopStream();
      onCapture(result);
    };
    reader.onerror = () => setError("Failed to read the image. Please try again.");
    reader.readAsDataURL(file);
    // reset input
    e.target.value = "";
  };

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col px-6 py-6">
      <div className="flex items-center justify-between">
        <button onClick={() => { stopStream(); onBack(); }} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur hover:bg-white/15 cursor-pointer">
          ← Back
        </button>
        <span className="text-xs font-bold tracking-[0.18em] text-white/50">STEP 2 • CAMERA</span>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-3xl flex-1 flex-col items-center">
        <h2 className="text-center text-2xl font-black tracking-tight text-white">Position your face inside the frame</h2>
        <p className="mt-2 text-center text-sm text-white/60">Center your face, good lighting helps!</p>

        <div className="relative mt-6 w-full overflow-hidden rounded-[28px] border border-white/15 bg-black shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
          <div className="aspect-[4/3] w-full bg-zinc-900 sm:aspect-[16/10]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""} ${ready ? "opacity-100" : "opacity-0"}`}
            />
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <p className="text-sm text-white/60">Starting camera…</p>
                </div>
              </div>
            )}
            {/* face oval guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-[62%] w-[48%] rounded-[50%] border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] sm:h-[64%] sm:w-[42%]">
                <div className="absolute -top-1 -left-1 h-6 w-6 rounded-tl-[18px] border-l-[3px] border-t-[3px] border-white" />
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-tr-[18px] border-r-[3px] border-t-[3px] border-white" />
                <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-[18px] border-b-[3px] border-l-[3px] border-white" />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-br-[18px] border-b-[3px] border-r-[3px] border-white" />
              </div>
            </div>
          </div>

          {error && (
            <div className="absolute bottom-0 w-full bg-amber-500/95 px-4 py-3 text-center text-sm font-semibold text-zinc-900">
              {error}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* controls */}
        <div className="mt-6 flex w-full flex-col items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCapture}
            disabled={!ready}
            className="group flex h-[84px] w-[84px] items-center justify-center rounded-full bg-white p-1.5 shadow-[0_10px_40px_rgba(255,255,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Take photo"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full border-[3px] border-zinc-900 bg-white transition group-active:bg-zinc-100">
              <span className="h-12 w-12 rounded-full bg-zinc-900" />
            </span>
          </motion.button>
          <p className="text-xs font-semibold tracking-widest text-white/50">TAP TO CAPTURE</p>

          <div className="flex w-full max-w-md flex-col items-center gap-3 pt-2">
            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs tracking-widest text-white/40">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <label className="flex w-full cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15">
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />
              📁 Upload a photo instead
            </label>

            {!ready && !error && (
              <button onClick={startCamera} className="text-xs font-semibold text-white/60 underline underline-offset-4">
                Retry camera
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-4 text-white/45">🔒 Photo is used temporarily for your match and not saved.</p>
      </div>
    </div>
  );
}
