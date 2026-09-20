"use client";
import { motion } from "framer-motion";

export default function PhotoPreview({
  image,
  onConfirm,
  onRetake,
}: {
  image: string;
  onConfirm: () => void;
  onRetake: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col px-6 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
        <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-2xl font-black text-white">
          Looking good!
        </motion.h2>
        <p className="mt-2 text-center text-sm text-white/60">Use this photo or retake it.</p>

        <div className="relative mt-8 w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-zinc-900 p-2 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Your captured photo" className="aspect-[4/5] w-full rounded-[20px] object-cover" />
          <div className="pointer-events-none absolute inset-2 rounded-[20px] ring-1 ring-white/10" />
        </div>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <button
            onClick={onRetake}
            className="flex h-14 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-bold tracking-wide text-white backdrop-blur hover:bg-white/15 cursor-pointer"
          >
            ↺ RETAKE
          </button>
          <button
            onClick={onConfirm}
            className="flex h-14 flex-1 items-center justify-center rounded-full bg-white text-sm font-black tracking-wide text-zinc-900 shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:bg-zinc-100 cursor-pointer"
          >
            USE THIS PHOTO →
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-white/45">We&apos;ll analyze visual similarity — not your identity.</p>
      </div>
    </div>
  );
}
