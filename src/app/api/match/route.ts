import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { celebrities, getCelebritiesByGender } from "@/data/celebrities";
import type { Gender } from "@/types";
import { runVisionMatch } from "@/lib/ai-vision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 60s cap for the multi-image vision call. Within current Vercel plan limits
// (Hobby/Pro default max 300s with Fluid compute); verify Fluid is enabled in
// dashboard Functions settings for older projects.
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // decoded student image limit
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

function error(status: number, code: string, message: string) {
  // Never leak provider details, keys, stack traces, or image data.
  return NextResponse.json({ error: message, code }, { status });
}

/** Read the fixed local celebrity assets for the validated gender pool. */
async function loadCandidateImages(gender: Gender) {
  const pool = getCelebritiesByGender(gender);
  const loaded: { id: string; dataUrl: string; mimeType: string }[] = [];
  await Promise.all(
    pool.map(async (cel) => {
      try {
        const fileName = path.basename(cel.image);
        const filePath = path.join(process.cwd(), "public", "celebrities", fileName);
        const buf = await fs.readFile(filePath);
        const mimeType = fileName.endsWith(".png") ? "image/png" : "image/webp";
        loaded.push({
          id: cel.id,
          dataUrl: `data:${mimeType};base64,${buf.toString("base64")}`,
          mimeType,
        });
      } catch {
        // Skip unreadable assets; fail only if none load (checked below).
      }
    })
  );
  // Preserve dataset order for deterministic prompting.
  const order = new Map(pool.map((c, i) => [c.id, i]));
  loaded.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { pool, loaded };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(400, "BAD_REQUEST", "Invalid request. Please try again.");
  }

  const { imageDataUrl, gender } = (body ?? {}) as {
    imageDataUrl?: unknown;
    gender?: unknown;
  };

  // Server-side gender enforcement — the ONLY candidate source.
  if (gender !== "male" && gender !== "female") {
    return error(400, "BAD_GENDER", "Please choose a match pool first.");
  }
  const validatedGender = gender as Gender;

  // Student image validation (data URL only — never remote URLs).
  if (typeof imageDataUrl !== "string") {
    return error(400, "BAD_IMAGE", "We couldn't read that photo. Please retake it.");
  }
  const match = imageDataUrl.match(DATA_URL_RE);
  if (!match) {
    return error(400, "BAD_IMAGE", "We couldn't read that photo. Please retake it.");
  }
  const mimeType = match[1];
  let byteLength = 0;
  try {
    byteLength = Buffer.from(match[2], "base64").length;
  } catch {
    return error(400, "BAD_IMAGE", "We couldn't read that photo. Please retake it.");
  }
  if (byteLength === 0 || byteLength > MAX_IMAGE_BYTES) {
    return error(400, "BAD_IMAGE", "That photo is unusable. Please retake it.");
  }
  // Sanity: JPEG/PNG/WebP magic bytes.
  const head = Buffer.from(match[2].slice(0, 32), "base64");
  const isJpeg = head[0] === 0xff && head[1] === 0xd8;
  const isPng = head[0] === 0x89 && head[1] === 0x50;
  const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50; // "WEBP" in RIFF header
  if (!((mimeType === "image/jpeg" && isJpeg) || (mimeType === "image/png" && isPng) || (mimeType === "image/webp" && isWebp))) {
    return error(400, "BAD_IMAGE", "We couldn't read that photo. Please retake it.");
  }

  // Candidate images come from the local dataset only — never client input.
  const { pool, loaded } = await loadCandidateImages(validatedGender);
  if (loaded.length === 0) {
    return error(500, "CANDIDATES_UNAVAILABLE", "Celebrity images are unavailable. Please try again.");
  }

  let result: { celebrityId: string; score: number };
  try {
    result = await runVisionMatch({
      studentDataUrl: imageDataUrl,
      candidates: loaded,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI_PROVIDER";
    if (msg === "AI_NOT_CONFIGURED") {
      return error(503, "AI_NOT_CONFIGURED", "AI matching isn't set up right now. Please try again.");
    }
    if (msg === "AI_RATE_LIMIT" || msg === "AI_TIMEOUT") {
      return error(503, msg, "AI matching is busy. Please try again in a moment.");
    }
    return error(502, "AI_FAILED", "AI matching failed. Please try again.");
  }

  // Candidate validation: must exist in dataset AND in the gender pool.
  const allowedIds = new Set(pool.map((c) => c.id));
  if (!allowedIds.has(result.celebrityId)) {
    return error(502, "AI_INVALID", "AI matching failed. Please try again.");
  }
  const celebrity = celebrities.find((c) => c.id === result.celebrityId) ?? null;
  if (!celebrity || celebrity.gender !== validatedGender) {
    return error(502, "AI_INVALID", "AI matching failed. Please try again.");
  }

  // Temporary processing only: nothing about the student image is stored.
  // No cookies, no logs of image data (only id + score flow back).
  return NextResponse.json({
    celebrityId: celebrity.id,
    similarity: result.score,
    source: "ai" as const,
  });
}
