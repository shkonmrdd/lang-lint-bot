import { z } from "zod";

const EnvSchema = z
  .object({
    TELERGRAM_API_KEY: z.string().min(1),
    TARGET_LANG: z.string().optional(),
    NATIVE_LANG: z.string().optional(),
    MARK_AS_REPLY: z.string().optional(),
    LLM_MODEL: z.string().optional(),
    LLM_PROVIDER: z.string().optional(),
    LLM_PROMPT: z.string().optional(),
    LLM_BASE_URL: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    LLM_API_KEY: z.string().optional(),
  })
  .loose();

const parsed = EnvSchema.parse(process.env);

const asBool = (value?: string) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true";
};

const trimOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const rawProvider = trimOrUndefined(parsed.LLM_PROVIDER);
const providerKeyName = rawProvider
  ? `${rawProvider.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}_API_KEY`
  : undefined;
const providerApiKey = providerKeyName ? trimOrUndefined(process.env[providerKeyName]) : undefined;

const env = {
  telegramApiKey: parsed.TELERGRAM_API_KEY.trim(),
  targetLanguage: trimOrUndefined(parsed.TARGET_LANG) ?? "English",
  nativeLanguage: trimOrUndefined(parsed.NATIVE_LANG) ?? "Spanish",
  markAsReply: asBool(parsed.MARK_AS_REPLY),
  llmModel: trimOrUndefined(parsed.LLM_MODEL) ?? "gpt-5-mini",
  llmProvider: rawProvider?.toLowerCase() ?? null,
  llmPrompt: trimOrUndefined(parsed.LLM_PROMPT) ?? "",
  llmBaseUrl: trimOrUndefined(parsed.LLM_BASE_URL) ?? null,
  llmApiKey: providerApiKey ?? trimOrUndefined(parsed.OPENAI_API_KEY) ?? trimOrUndefined(parsed.LLM_API_KEY) ?? null,
};

export type Env = typeof env;
export { env };
