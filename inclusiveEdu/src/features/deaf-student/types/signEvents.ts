export type SignGlossPayload = {
  language: "ASL" | "LSP" | string;
  mode: "simulation" | string;
  original_text: string;
  gloss: string[];
  pose?: {
    mode: string;
    frames: unknown[];
  };
};
