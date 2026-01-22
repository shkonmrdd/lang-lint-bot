import { z } from "zod";
import chalk from "chalk";

const SUPPORTED_LLM_PROVIDERS = ["openai"] as const;
type SupportedLlmProvider = (typeof SUPPORTED_LLM_PROVIDERS)[number];

const asBool = (value?: string) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true";
};

const trimOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const EnvSchema = z
  .object({
    TELERGRAM_API_KEY: z.string().min(1),
    GRAMMAR_TARGET_LANGUAGE: z.string().optional(),
    BOT_UI_LANGUAGE: z.string().optional(),
    MARK_AS_REPLY: z.string().optional(),
    LLM_MODEL: z.string().optional(),
    LLM_PROVIDER: z
      .string()
      .transform((value) => value.trim().toLowerCase())
      .pipe(z.enum(SUPPORTED_LLM_PROVIDERS)),
    LLM_PROMPT: z.string().optional(),
    LLM_BASE_URL: z.string().optional(),
    LLM_API_KEY: z
      .string()
      .transform((value) => value.trim())
      .pipe(
        z
          .string()
          .min(1, { message: "LLM_API_KEY is required for all providers." })
      ),
    BOT_AUTH_CODE: z.string().optional(),
    DATABASE_PROVIDER: z.string().optional(),
    DATABASE_URL: z.string().optional(),
  })
  .loose();

const parsed = EnvSchema.parse(process.env);

const rawProvider = parsed.LLM_PROVIDER as SupportedLlmProvider;
const grammarTargetLanguage = trimOrUndefined(parsed.GRAMMAR_TARGET_LANGUAGE);
const botUiLanguage = trimOrUndefined(parsed.BOT_UI_LANGUAGE) ?? "English";

const env = {
  TELERGRAM_API_KEY: parsed.TELERGRAM_API_KEY.trim(),
  GRAMMAR_TARGET_LANGUAGE: grammarTargetLanguage ?? null,
  BOT_UI_LANGUAGE: botUiLanguage,
  MARK_AS_REPLY: asBool(parsed.MARK_AS_REPLY),
  LLM_MODEL: trimOrUndefined(parsed.LLM_MODEL) ?? "gpt-5-mini",
  LLM_PROVIDER: rawProvider,
  LLM_PROMPT: trimOrUndefined(parsed.LLM_PROMPT) ?? "",
  LLM_BASE_URL: trimOrUndefined(parsed.LLM_BASE_URL) ?? null,
  LLM_API_KEY: parsed.LLM_API_KEY,
  BOT_AUTH_CODE: trimOrUndefined(parsed.BOT_AUTH_CODE) ?? null,
  DATABASE_PROVIDER:
    trimOrUndefined(parsed.DATABASE_PROVIDER)?.toLowerCase() ?? null,
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
