import { z } from "zod";
import chalk from "chalk";

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
    BOT_AUTH_CODE: z.string().optional(),
    DATABASE_PROVIDER: z.string().optional(),
    DATABASE_URL: z.string().optional(),
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
  TELERGRAM_API_KEY: parsed.TELERGRAM_API_KEY.trim(),
  TARGET_LANG: trimOrUndefined(parsed.TARGET_LANG) ?? "English",
  NATIVE_LANG: trimOrUndefined(parsed.NATIVE_LANG) ?? "Spanish",
  MARK_AS_REPLY: asBool(parsed.MARK_AS_REPLY),
  LLM_MODEL: trimOrUndefined(parsed.LLM_MODEL) ?? "gpt-5-mini",
  LLM_PROVIDER: rawProvider?.toLowerCase() ?? null,
  LLM_PROMPT: trimOrUndefined(parsed.LLM_PROMPT) ?? "",
  LLM_BASE_URL: trimOrUndefined(parsed.LLM_BASE_URL) ?? null,
  LLM_API_KEY:
    providerApiKey ??
    trimOrUndefined(parsed.OPENAI_API_KEY) ??
    trimOrUndefined(parsed.LLM_API_KEY) ??
    null,
  BOT_AUTH_CODE: trimOrUndefined(parsed.BOT_AUTH_CODE) ?? null,
  DATABASE_PROVIDER: trimOrUndefined(parsed.DATABASE_PROVIDER)?.toLowerCase() ?? null,
  DATABASE_URL: trimOrUndefined(parsed.DATABASE_URL) ?? null,
};

if (!env.BOT_AUTH_CODE) {
  const warningLines = [
    "========================================",
    "WARNING: BOT AUTHENTICATION DISABLED",
    "The bot is insecure and can be used by anyone.",
    "Please set BOT_AUTH_CODE in production environments.",
    "========================================",
  ];

  console.warn(chalk.yellow(warningLines.join("\n")));
}

export type Env = typeof env;
export { env };
