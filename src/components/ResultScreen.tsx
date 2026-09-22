"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { MatchResult } from "@/types";

export default function ResultScreen({
  userImage,
  result,
  onTryAgain,
  onNextPlayer,
  onRetakePhoto,
}: {
  userImage: string;
  result: MatchResult;
  onTryAgain: () => void;
  onNextPlayer: () => void;
  onRetakePhoto: () => void;
}) {
  const [showQR, setShowQR] = useState(false);
  const qrData = `Celebrity Look-Alike • You look like ${result.celebrity.name} (${result.similarity}% match) — Programming Club Fair 2026`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col px-6 py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center">
        {/* confetti-ish header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 text-xs font-black tracking-widest text-zinc-900">
            ✨ YOUR CELEBRITY MATCH ✨
          </div>
          <p className="mt-3 text-xs font-bold tracking-[0.2em] text-white/50">PROGRAMMING CLUB • CLUB FAIR</p>
        </motion.div>

        {/* comparison */}
        <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          {/* you */}
          <motion.div
            initial={{ opacity: 0, x: -12, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="overflow-hidden rounded-[24px] border border-white/15 bg-zinc-900 p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={userImage} alt="Your photo" className="aspect-[4/5] w-full rounded-[18px] object-cover" />
            <div className="px-3 py-3 text-center">
              <div className="text-xs font-bold tracking-widest text-white/60">YOU</div>
            </div>
          </motion.div>

          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-black text-zinc-900 shadow-xl">✦</div>
          </div>

          {/* celebrity */}
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="overflow-hidden rounded-[24px] border border-white/15 bg-zinc-900 p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.celebrity.image} alt={result.celebrity.name} className="aspect-[4/5] w-full rounded-[18px] object-cover bg-white" />
            <div className="px-3 py-3 text-center">
              <div className="text-xs font-bold tracking-widest text-fuchsia-300">{result.celebrity.knownFor}</div>
            </div>
          </motion.div>
        </div>

        {/* reveal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          className="mt-8 w-full max-w-2xl rounded-[28px] border border-white/15 bg-white p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-8"
        >
          <p className="text-xs font-black tracking-[0.22em] text-zinc-500">YOU LOOK LIKE</p>
          <motion.h2
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 18 }}
            className="mt-2 text-3xl font-black tracking-tighter text-zinc-900 sm:text-4xl"
          >
            {result.celebrity.name.toUpperCase()}
          </motion.h2>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-black tracking-wide text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {result.similarity}% LOOK-ALIKE
          </div>
          <p className="mt-2 text-[11px] font-bold tracking-[0.18em] text-zinc-400">
            {result.source === "fallback" ? "OFFLINE GAME MATCH • JUST FOR FUN" : "VISUAL MATCH • JUST FOR FUN"}
          </p>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-600">
            {result.celebrity.description} <span className="font-semibold text-zinc-900">{result.description}</span>
          </p>

          {showQR && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mt-6 w-fit rounded-2xl border border-zinc-200 bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR code" width={220} height={220} className="h-[180px] w-[180px]" />
              <p className="mt-2 text-xs font-semibold text-zinc-500">Scan to share</p>
            </motion.div>
          )}
        </motion.div>

        {/* actions */}
        <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <button onClick={onRetakePhoto} className="h-12 rounded-full border border-white/15 bg-white/10 text-sm font-bold text-white backdrop-blur hover:bg-white/15 cursor-pointer">
            TAKE ANOTHER PHOTO
          </button>
          <button onClick={onTryAgain} className="h-12 rounded-full border border-white/15 bg-white/10 text-sm font-bold text-white backdrop-blur hover:bg-white/15 cursor-pointer">
            TRY AGAIN
          </button>
          <button onClick={onNextPlayer} className="h-12 rounded-full bg-white text-sm font-black text-zinc-900 shadow hover:bg-zinc-100 cursor-pointer">
            NEXT PLAYER →
          </button>
        </div>

        <button
          onClick={() => setShowQR((v) => !v)}
          className="mt-4 text-sm font-semibold text-white/70 underline underline-offset-4 hover:text-white cursor-pointer"
        >
          {showQR ? "Hide QR Code" : "Show QR Code"}
        </button>

        <p className="mt-6 text-center text-xs leading-5 text-white/45">
          🔒 Fun resemblance game — not identity recognition. Photo cleared when you press NEXT PLAYER.
          <br />
          <span className="font-semibold tracking-widest text-white/55">Built by the Programming Club</span>
        </p>
      </div>
    </div>
  );
}
