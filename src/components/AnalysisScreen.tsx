"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Gender, MatchResult } from "@/types";
import { analyzeFace } from "@/lib/matching";

const steps = [
  "Preparing your photo...",
  "Comparing visual details...",
  "Finding your closest match...",
  "Almost there...",
];

export default function AnalysisScreen({
  image,
  gender,
  onComplete,
  onError,
}: {
  image: string;
  gender: Gender;
  onComplete: (r: MatchResult) => void;
  onError: (msg: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    let cancelled = false;

    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => !cancelled && setStep(i), i * 650));
    });

    const prog = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + Math.random() * 9));
    }, 320);

    (async () => {
      try {
        const result = await analyzeFace(image, gender);
        // ensure minimum delight time (~2.6s)
        await new Promise((r) => setTimeout(r, 2600));
        if (cancelled) return;
        clearInterval(prog);
        setProgress(100);
        setTimeout(() => onComplete(result), 450);
      } catch (e) {
        if (cancelled) return;
        clearInterval(prog);
        onError(e instanceof Error ? e.message : "Something went wrong with the AI match. Let's try again!");
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearInterval(prog);
    };
  }, [image, gender, onComplete, onError]);

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col items-center justify-center px-6 py-10 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="h-16 w-16 rounded-full border-2 border-white/20 border-t-white"
          />
        </div>

        <h2 className="mt-8 text-2xl font-black tracking-tight text-white">FINDING YOUR MATCH...</h2>

        <div className="mt-6 h-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="text-sm font-semibold tracking-wide text-white/80"
            >
              {steps[step]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-8 overflow-hidden rounded-full bg-white/10 p-1">
          <motion.div
            className="h-3 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
        <p className="mt-3 text-xs font-bold tracking-[0.18em] text-white/50">{Math.round(progress)}%</p>

        <div className="mt-10 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "w-8 bg-white" : "w-4 bg-white/20"}`} />
          ))}
        </div>

        <p className="mt-10 text-xs leading-5 text-white/45">
          Fun resemblance game — not identity recognition.
          <br />
          Your photo is processed temporarily and not saved.
        </p>
      </motion.div>
    </div>
  );
}
