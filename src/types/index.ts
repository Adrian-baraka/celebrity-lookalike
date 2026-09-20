export type Gender = "male" | "female";

export type AppScreen =
  | "welcome"
  | "gender"
  | "camera"
  | "preview"
  | "analysis"
  | "result";

export interface Celebrity {
  id: string;
  name: string;
  gender: Gender;
  image: string;
  description: string;
  knownFor: string;
}

export interface MatchResult {
  celebrity: Celebrity;
  similarity: number; // 70-99
  description: string;
}
