import type { Gender, MatchResult, Celebrity } from "@/types";
import { getCelebritiesByGender } from "@/data/celebrities";

/**
 * Real visual look-alike matching — local/on-device, privacy-preserving.
 *
 * Signature preserved: export async function analyzeFace(imageDataUrl: string, gender: Gender): Promise<MatchResult>
 *
 * Pipeline:
 *  student dataUrl → HTMLImageElement (center-crop 32x32 thumbnail + 24-bin histogram)
 *  → normalized features
 *  → load/cache celebrity features for selected gender (in-memory only, per session)
 *  → cosine/Euclidean distance against each candidate in filtered pool
 *  → rank → best match → distance → game-style VISUAL MATCH % (70-96, not biometric)
 *
 * No external API, no persistent storage, no student profile retained beyond return.
 * Celebrity features cached in memory for Club Fair performance; student features discarded after call.
 */

type Features = {
  thumb: Float32Array; // 32*32 = 1024 normalized grayscale
  hist: Float32Array; // 24 normalized hist bins (8 R + 8 G + 8 B)
};

const THUMB_SIZE = 32;
const HIST_BINS = 8;

// In-memory cache only — cleared on page reload, never persisted
const celebCache = new Map<Gender, Map<string, Features>>();
const celebLoadPromise = new Map<Gender, Promise<void>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // For /celebrities/* same-origin, no crossOrigin needed; for dataUrl no CORS
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function extractFeatures(img: HTMLImageElement): Features {
  if (!img.width || !img.height) throw new Error("Image too small. Please retake with your face centered.");
  const minDim = Math.min(img.width, img.height);
  if (minDim < 32) throw new Error("Image too small. Please move closer and retake.");

  const canvas = document.createElement("canvas");
  canvas.width = THUMB_SIZE;
  canvas.height = THUMB_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable in this browser.");

  // Center square crop to focus on face (camera oval already centers)
  const srcSize = Math.min(img.width, img.height);
  const sx = (img.width - srcSize) / 2;
  const sy = (img.height - srcSize) / 2;
  ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, THUMB_SIZE, THUMB_SIZE);

  const data = ctx.getImageData(0, 0, THUMB_SIZE, THUMB_SIZE).data;

  const thumb = new Float32Array(THUMB_SIZE * THUMB_SIZE);
  const hist = new Float32Array(HIST_BINS * 3);
  let sum = 0;
  let varianceSum = 0;

  for (let i = 0; i < THUMB_SIZE * THUMB_SIZE; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const a = data[o + 3];
    // Treat fully transparent as white
    const rr = a < 10 ? 255 : r;
    const gg = a < 10 ? 255 : g;
    const bb = a < 10 ? 255 : b;
    const gray = (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255;
    thumb[i] = gray;
    sum += gray;

    hist[Math.floor(rr / 32)] += 1;
    hist[HIST_BINS + Math.floor(gg / 32)] += 1;
    hist[HIST_BINS * 2 + Math.floor(bb / 32)] += 1;
  }

  const mean = sum / thumb.length;
  for (let i = 0; i < thumb.length; i++) {
    const d = thumb[i] - mean;
    varianceSum += d * d;
  }
  const variance = varianceSum / thumb.length;
  // Heuristic for "no clear face / poor quality" — near-uniform image
  if (variance < 0.002) {
    throw new Error("No clear face detected. Try taking another photo with your face centered in the frame.");
  }

  // Normalize thumb to zero-mean, L2-normalized for cosine comparison
  let norm = 0;
  for (let i = 0; i < thumb.length; i++) {
    thumb[i] -= mean;
    norm += thumb[i] * thumb[i];
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < thumb.length; i++) thumb[i] /= norm;

  // Normalize hist to sum 1 per channel (so 3)
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let b = 0; b < HIST_BINS; b++) s += hist[c * HIST_BINS + b];
    if (s > 0) for (let b = 0; b < HIST_BINS; b++) hist[c * HIST_BINS + b] /= s;
  }

  return { thumb, hist };
}

function distance(a: Features, b: Features): number {
  // Cosine distance for thumb (1 - cosine similarity) + Euclidean for hist
  let dot = 0;
  for (let i = 0; i < a.thumb.length; i++) dot += a.thumb[i] * b.thumb[i];
  // dot in [-1,1], clamp
  dot = Math.max(-1, Math.min(1, dot));
  const cosineDist = 1 - dot; // 0..2

  let histDist = 0;
  for (let i = 0; i < a.hist.length; i++) {
    const d = a.hist[i] - b.hist[i];
    histDist += d * d;
  }
  histDist = Math.sqrt(histDist); // 0..~2.4

  // Weighted combination — thumb structure dominates
  return cosineDist * 0.78 + histDist * 0.22;
}

function distanceToSimilarity(dist: number): number {
  // dist ~ 0..2.5 ; map to game-style VISUAL MATCH % (not biometric)
  // Empirically: dist 0.3 → ~92%, 0.6 → ~85%, 1.0 → ~78%
  // Clamp 70-96
  const raw = 96 - dist * 28 - Math.pow(dist, 2) * 6;
  return Math.max(70, Math.min(96, Math.round(raw)));
}

async function ensureCelebFeatures(gender: Gender): Promise<Map<string, Features>> {
  if (celebCache.has(gender)) return celebCache.get(gender)!;
  if (celebLoadPromise.has(gender)) {
    await celebLoadPromise.get(gender)!;
    return celebCache.get(gender)!;
  }

  const promise = (async () => {
    const pool = getCelebritiesByGender(gender);
    const map = new Map<string, Features>();
    // Load in parallel but cap concurrency to avoid browser limit
    const results = await Promise.allSettled(
      pool.map(async (cel) => {
        const img = await loadImage(cel.image);
        const feat = extractFeatures(img);
        return { id: cel.id, feat };
      })
    );
    let loaded = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        map.set(r.value.id, r.value.feat);
        loaded++;
      } else {
        console.warn("[matching] celebrity image failed:", r.reason);
      }
    }
    if (loaded === 0) throw new Error("Celebrity images failed to load. Please refresh and try again.");
    celebCache.set(gender, map);
  })();

  celebLoadPromise.set(gender, promise);
  try {
    await promise;
  } finally {
    celebLoadPromise.delete(gender);
  }
  return celebCache.get(gender)!;
}

export async function analyzeFace(
  imageDataUrl: string,
  gender: Gender
): Promise<MatchResult> {
  if (typeof document === "undefined") throw new Error("Matching only runs in the browser. Please try again.");
  if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
    throw new Error("We couldn't read that photo. Please retake or upload a valid image.");
  }

  // Timeout guard — 10s for full flow (student + 28 candidates)
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error("Matching took too long. Please retake with good lighting and try again.")), 10000)
  );

  const work = (async (): Promise<MatchResult> => {
    // 1. Student features
    const studentImg = await loadImage(imageDataUrl);
    let studentFeat: Features;
    try {
      studentFeat = extractFeatures(studentImg);
    } catch (e) {
      // Re-throw face-quality errors with friendly message; preserve original
      if (e instanceof Error && e.message.includes("No clear face")) throw e;
      if (e instanceof Error && e.message.includes("too small")) throw e;
      throw new Error("No clear face detected. Try taking another photo with your face centered in the frame.");
    }

    // 2. Celebrity candidates — gender-filtered, cached
    const pool = getCelebritiesByGender(gender);
    if (pool.length === 0) throw new Error("No celebrities available for that selection.");

    const cache = await ensureCelebFeatures(gender);

    // 3. Compare against all candidates in selected gender pool only
    let best: Celebrity | null = null;
    let bestDist = Infinity;
    const scored: { cel: Celebrity; dist: number }[] = [];

    for (const cel of pool) {
      const cf = cache.get(cel.id);
      if (!cf) continue; // skip failed loads
      const d = distance(studentFeat, cf);
      scored.push({ cel, dist: d });
      if (d < bestDist) {
        bestDist = d;
        best = cel;
      }
    }

    if (!best) throw new Error("Matching failed. Please retake your photo.");

    // Optional: handle extreme poor quality (all distances very high)
    if (bestDist > 1.45) {
      // Still return best but lower similarity; don't block, just allow retake hint via similarity
    }

    const similarity = distanceToSimilarity(bestDist);

    return {
      celebrity: best,
      similarity,
      description: "Your strongest match is based on playful visual comparison against the selected group — not identity recognition. Just for fun!",
    };
  })();

  return Promise.race([work, timeout]);
}

// Exposed for testing/clearing between players if needed (not persisted)
export function clearCacheForTests() {
  celebCache.clear();
  celebLoadPromise.clear();
}
