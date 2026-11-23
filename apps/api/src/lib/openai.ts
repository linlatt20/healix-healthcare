import OpenAI from "openai";

// Replit의 AI_INTEGRATIONS_* 변수와 일반 OPENAI_* 변수를 모두 지원
const apiKey =
  process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const baseURL =
  process.env.OPENAI_BASE_URL ?? process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY must be set (see .env.example).");
}

export const openai = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});
