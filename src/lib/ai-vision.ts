/**
 * Server-only vision-model adapter (OpenAI-compatible chat completions).
 *
 * Receives the STUDENT image plus the gender-filtered CELEBRITY candidate
 * images together, so the model genuinely compares visuals — never names
 * alone. No SDK dependency: plain fetch against an OpenAI-compatible
 * endpoint, so providers can be swapped via env without touching the UI.
 *
 * Env:
 *   AI_API_KEY   (required) — server-side only, never NEXT_PUBLIC_
 *   AI_MODEL     (optional, default "gpt-4o-mini")
 *   AI_BASE_URL  (optional, default "https://api.openai.com/v1")
 */

export interface VisionMatchInput {
  studentDataUrl: string;
  candidates: { id: string; dataUrl: string; mimeType: string }[];
}

export interface VisionMatchOutput {
  celebrityId: string;
  /** Game-style visual-match score 70-96 (not biometric). */
  score: number;
}

interface ChatMessage {
  role: "system" | "user";
  content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "low" } }
  >;
}

function getConfig(): { apiKey: string; model: string; baseUrl: string } {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    const err = new Error("AI_NOT_CONFIGURED") as Error & { code: string };
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }
  return {
    apiKey,
    model: process.env.AI_MODEL || "gpt-4o-mini",
    baseUrl: (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  };
}

function buildMessages(input: VisionMatchInput): ChatMessage[] {
  const allowedIds = input.candidates.map((c) => c.id).join(", ");
  const content: ChatMessage["content"] = [
    {
      type: "text",
      text:
        "You are the judge of a fun CELEBRITY LOOK-ALIKE game (not a biometric or identity system). " +
        "Compare the STUDENT photo (first image) against each CANDIDATE celebrity photo that follows. " +
        "Pick the candidate with the strongest playful visual resemblance (face structure, vibe, features). " +
        "Base your choice ONLY on visible resemblance in the pixels: every candidate photo genuinely depicts the person named by its id, so do not favor anyone for being more famous and do not use outside knowledge about these people. " +
        "If unsure, still pick the closest visual match — never abstain. " +
        `You MUST choose exactly one id from this allowed list: ${allowedIds}. ` +
        "Never invent a person. Respond with ONLY a JSON object, no other text: " +
        '{"celebrityId": "<one id from the allowed list>", "score": <integer 70-96 game-style visual-match number>}.',
    },
    { type: "text", text: "STUDENT PHOTO:" },
    { type: "image_url", image_url: { url: input.studentDataUrl, detail: "low" } },
  ];

  for (const c of input.candidates) {
    content.push({ type: "text", text: `CANDIDATE id="${c.id}":` });
    content.push({ type: "image_url", image_url: { url: c.dataUrl, detail: "low" } });
  }

  return [
    {
      role: "system",
      content: [
        {
          type: "text",
          text: "You judge a lighthearted look-alike game. Output valid JSON only. Never identify the student or claim biometric accuracy.",
        },
      ],
    },
    { role: "user", content },
  ];
}

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("AI_EMPTY");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function runVisionMatch(
  input: VisionMatchInput,
  opts?: { timeoutMs?: number }
): Promise<VisionMatchOutput> {
  const { apiKey, model, baseUrl } = getConfig();
  if (input.candidates.length === 0) throw new Error("NO_CANDIDATES");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 50000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        // Best-effort reproducibility for the same inputs (provider-dependent).
        seed: 7,
        max_tokens: 150,
        response_format: { type: "json_object" },
        messages: buildMessages(input),
      }),
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) throw new Error("AI_AUTH");
    if (res.status === 429) throw new Error("AI_RATE_LIMIT");
    if (!res.ok) throw new Error("AI_PROVIDER");

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = body.choices?.[0]?.message?.content;
    if (!text) throw new Error("AI_EMPTY");

    const parsed = extractJson(text) as Partial<VisionMatchOutput>;
    if (typeof parsed.celebrityId !== "string" || !parsed.celebrityId) {
      throw new Error("AI_INVALID");
    }
    // Candidate-set enforcement happens in the route (dataset lookup);
    // clamp the game-style score here so only 70-96 can propagate.
    const score =
      typeof parsed.score === "number" && Number.isFinite(parsed.score)
        ? Math.max(70, Math.min(96, Math.round(parsed.score)))
        : 85;

    return { celebrityId: parsed.celebrityId, score };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw new Error("AI_TIMEOUT");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
