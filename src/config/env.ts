const telegramApiKey = process.env.TG_API_KEY;
if (!telegramApiKey) {
  throw new Error("TG_API_KEY is not set in environment variables");
}

const openAIApiKey = process.env.OPENAI_API_KEY;
if (!openAIApiKey) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

const resolvedTelegramApiKey = telegramApiKey as string;
const resolvedOpenAIApiKey = openAIApiKey as string;

const targetLanguage = process.env.TARGET_LANG ?? "English";
const nativeLanguage = process.env.NATIVE_LANG ?? "Spanish";
const markAsReply = process.env.MARK_AS_REPLY === "true";

const llmModel = process.env.LLM_MODEL ?? "gpt-5-mini";
const llmPrompt = (process.env.LLM_PROMPT ?? "").trim();

export {
  resolvedTelegramApiKey as telegramApiKey,
  resolvedOpenAIApiKey as openAIApiKey,
  targetLanguage,
  nativeLanguage,
  markAsReply,
  llmModel,
  llmPrompt,
};
