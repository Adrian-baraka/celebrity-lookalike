"use client";
import { motion } from "framer-motion";
import PrivacyNotice from "./PrivacyNotice";

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col items-center justify-center px-6 py-10 text-center">
      {/* glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
        <div className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-3xl flex-col items-center"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-white/90 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          PROGRAMMING CLUB • CLUB FAIR 2026
        </div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-balance bg-gradient-to-b from-white to-white/70 bg-clip-text text-5xl font-black leading-[0.9] tracking-tighter text-transparent sm:text-6xl md:text-7xl"
        >
          WHO&apos;S YOUR
          <br />
          <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            CELEBRITY
          </span>
          <br />
          LOOK-ALIKE?
        </motion.h1>

        <p className="mt-6 max-w-xl text-pretty text-base leading-6 text-white/70 sm:text-lg">
          Take a photo and discover your celebrity match.
          <span className="text-white/90"> Fast. Fun. Surprisingly accurate.</span>
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="group relative mt-10 inline-flex h-[64px] w-full max-w-sm items-center justify-center gap-3 rounded-full bg-white text-base font-black tracking-wide text-zinc-900 shadow-[0_20px_60px_rgba(255,255,255,0.18)] transition hover:shadow-[0_20px_60px_rgba(168,85,247,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 cursor-pointer"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 opacity-0 transition group-hover:opacity-10" />
          <span className="relative">START THE CHALLENGE →</span>
        </motion.button>

        <div className="mt-6 flex flex-col items-center gap-3">
          <PrivacyNotice className="max-w-md" />
          <p className="text-[11px] font-semibold tracking-[0.18em] text-white/35">Built by the Programming Club</p>
        </div>

        {/* feature pills */}
        <div className="mt-12 grid w-full max-w-2xl grid-cols-3 gap-3 text-xs">
          {[
            { k: "⚡", t: "10 sec" },
            { k: "🎭", t: "12+ stars" },
            { k: "🔒", t: "No save" },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur">
              <div className="text-base">{f.k}</div>
              <div className="mt-1 font-semibold tracking-wide text-white/80">{f.t}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
