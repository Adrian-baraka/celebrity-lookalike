"use client";
import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AppScreen, Gender, MatchResult } from "@/types";
import WelcomeScreen from "@/components/WelcomeScreen";
import GenderSelector from "@/components/GenderSelector";
import CameraCapture from "@/components/CameraCapture";
import PhotoPreview from "@/components/PhotoPreview";
import AnalysisScreen from "@/components/AnalysisScreen";
import ResultScreen from "@/components/ResultScreen";

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [gender, setGender] = useState<Gender | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForNextPlayer = useCallback(() => {
    setGender(null);
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setScreen("welcome");
  }, []);

  const handleGenderSelect = (g: Gender) => {
    setGender(g);
    setError(null);
    setScreen("camera");
  };

  const handleCapture = (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setScreen("preview");
  };

  const handleConfirmPhoto = () => {
    if (!capturedImage || !gender) {
      setError("Missing photo or selection. Please try again.");
      return;
    }
    setScreen("analysis");
  };

  const handleAnalysisComplete = (r: MatchResult) => {
    setResult(r);
    setScreen("result");
  };

  const handleAnalysisError = (msg: string) => {
    setError(msg);
    // graceful fallback: go back to preview so player can retry
    setScreen("preview");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-fuchsia-500/30">
      {/* app chrome */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_circle_at_50%_-10%,rgba(168,85,247,0.18),transparent_60%),radial-gradient(900px_circle_at_90%_80%,rgba(34,211,238,0.12),transparent_60%)]" />
      <div className="relative flex min-h-screen flex-col">
        {/* top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-black/20 px-4 backdrop-blur supports-[backdrop-filter]:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-zinc-900">◎</div>
            <span className="text-sm font-black tracking-widest">CELEBRITY LOOK-ALIKE</span>
            <span className="hidden rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-white/70 sm:inline">CLUB FAIR MODE</span>
          </div>
          {screen !== "welcome" && (
            <button
              onClick={resetForNextPlayer}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-white hover:bg-white/15 cursor-pointer"
            >
              ⟲ NEXT PLAYER
            </button>
          )}
        </header>

        {/* error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto mt-4 w-[calc(100%-24px)] max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="shrink-0 rounded-full bg-amber-900 px-3 py-1 text-xs font-bold text-white cursor-pointer">
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* screens */}
        <main className="flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            {screen === "welcome" && (
              <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <WelcomeScreen onStart={() => setScreen("gender")} />
              </motion.div>
            )}

            {screen === "gender" && (
              <motion.div key="gender" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <GenderSelector onSelect={handleGenderSelect} onBack={() => setScreen("welcome")} />
              </motion.div>
            )}

            {screen === "camera" && (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CameraCapture onCapture={handleCapture} onBack={() => setScreen("gender")} />
              </motion.div>
            )}

            {screen === "preview" && capturedImage && (
              <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <PhotoPreview image={capturedImage} onConfirm={handleConfirmPhoto} onRetake={() => setScreen("camera")} />
              </motion.div>
            )}

            {screen === "analysis" && capturedImage && gender && (
              <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnalysisScreen image={capturedImage} gender={gender} onComplete={handleAnalysisComplete} onError={handleAnalysisError} />
              </motion.div>
            )}

            {screen === "result" && capturedImage && result && (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ResultScreen
                  userImage={capturedImage}
                  result={result}
                  onTryAgain={() => {
                    setResult(null);
                    setScreen("gender");
                  }}
                  onNextPlayer={resetForNextPlayer}
                  onRetakePhoto={() => {
                    setResult(null);
                    setScreen("camera");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="border-t border-white/10 px-4 py-3 text-center text-[11px] tracking-widest text-white/35">
          Built by the Programming Club • Photos are temporary and not saved
        </footer>
      </div>
    </div>
  );
}
