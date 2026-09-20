"use client";
import { motion } from "framer-motion";
import type { Gender } from "@/types";

export default function GenderSelector({
  onSelect,
  onBack,
}: {
  onSelect: (g: Gender) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col px-6 py-8">
      <button
        onClick={onBack}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur hover:bg-white/15 cursor-pointer"
      >
        ← Back
      </button>

      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-3xl font-black tracking-tight text-white sm:text-4xl"
        >
          WHO SHOULD WE
          <br />
          <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">MATCH YOU WITH?</span>
        </motion.h2>
        <p className="mt-3 text-center text-sm text-white/60">Choose a pool — we&apos;ll find your closest look-alike.</p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          <GenderCard
            title="MALE"
            subtitle="Male celebrities"
            gradient="from-violet-600 via-indigo-600 to-cyan-500"
            emoji="♂"
            onClick={() => onSelect("male")}
          />
          <GenderCard
            title="FEMALE"
            subtitle="Female celebrities"
            gradient="from-fuchsia-600 via-pink-500 to-orange-400"
            emoji="♀"
            onClick={() => onSelect("female")}
          />
        </div>

        <p className="mt-8 text-center text-xs text-white/45">You can switch anytime with TRY AGAIN.</p>
      </div>
    </div>
  );
}

function GenderCard({
  title,
  subtitle,
  gradient,
  emoji,
  onClick,
}: {
  title: string;
  subtitle: string;
  gradient: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/15 bg-white/5 p-1 text-left backdrop-blur cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <div className={`relative flex h-[220px] items-center justify-center rounded-[22px] bg-gradient-to-br ${gradient} p-6`}>
        <div className="absolute inset-0 rounded-[22px] bg-black/10" />
        <div className="absolute inset-0 rounded-[22px] opacity-0 transition group-hover:opacity-100"
             style={{ background: "radial-gradient(400px circle at 50% 30%, rgba(255,255,255,0.22), transparent 70%)" }} />
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white text-4xl font-black text-zinc-900 shadow-xl"
        >
          {emoji}
        </motion.div>
      </div>
      <div className="px-6 py-5">
        <div className="text-lg font-black tracking-widest text-white">{title} CELEBRITIES</div>
        <div className="text-sm text-white/60">{subtitle}</div>
        <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white">
          Select <span className="transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </motion.button>
  );
}
