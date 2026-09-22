import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /api/match reads the fixed celebrity assets via fs at runtime. The
  // filenames are resolved dynamically, so file-tracing cannot discover them
  // automatically — include them explicitly or production functions will fail
  // to find the candidate images (local dev works without this, Vercel does not).
  outputFileTracingIncludes: {
    "/api/match": ["./public/celebrities/*.webp"],
  },
};

export default nextConfig;
