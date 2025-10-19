import { Bot } from "grammy";

import { env } from "./config/env";
import { registerTextMessageHandler } from "./bot/handlers/textMessage";
import { resolveLanguageModel } from "./llm/modelFactory";
import { resolveAuth } from "./bot/auth";
import { registerActivateCommandHandler } from "./bot/handlers/activateCommand";

const { model, providerLabel, baseUrl } = resolveLanguageModel();

const auth = resolveAuth({ activationCode: env.BOT_AUTH_CODE });
const bot = new Bot(env.TELERGRAM_API_KEY);

bot.use(auth.middleware);

registerActivateCommandHandler(bot, auth);
registerTextMessageHandler(bot, model, {
  markAsReply: env.MARK_AS_REPLY,
});

bot.start();

console.log(`LLM Model: ${env.LLM_MODEL}`);
console.log(`LLM Provider: ${providerLabel}`);
console.log(`LLM Base URL: ${baseUrl}`);
console.log("Bot is up and running...");
