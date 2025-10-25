import { Bot } from "grammy";

import { registerActivateCommandHandler } from "./bot/handlers/activateCommand";
import { registerTextMessageHandler } from "./bot/handlers/textMessage";
import { env } from "./config/env";
import { resolveAuthStorage } from "./storage";
import { resolveAuth } from "./bot/auth";
import { resolveLanguageModel } from "./llm/modelFactory";

const bootstrap = async () => {
  const { model, providerLabel, baseUrl } = resolveLanguageModel({
    modelId: env.LLM_MODEL,
    provider: env.LLM_PROVIDER,
    baseUrl: env.LLM_BASE_URL,
    apiKey: env.LLM_API_KEY,
  });

  const authStorage = await resolveAuthStorage({
    url: env.DATABASE_URL,
    provider: env.DATABASE_PROVIDER,
  });

  const auth = resolveAuth({
    activationCode: env.BOT_AUTH_CODE,
    storage: authStorage,
  });

  const bot = new Bot(env.TELERGRAM_API_KEY);

  bot.use(auth.middleware);

  registerActivateCommandHandler(bot, auth);
  registerTextMessageHandler(bot, model, {
    markAsReply: env.MARK_AS_REPLY,
  });

  console.log(`LLM Model: ${env.LLM_MODEL}`);
  console.log(`LLM Provider: ${providerLabel}`);
  console.log(`LLM Base URL: ${baseUrl}`);
  console.log("Bot is up and running...");

  bot.start().catch((error) => {
    console.error("Bot stopped due to an unrecoverable error.");
    console.error(error);
    process.exitCode = 1;
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start bot with persistent auth storage.");
  console.error(error);
  process.exit(1);
});
