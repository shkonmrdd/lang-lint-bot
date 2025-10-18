import { Bot } from "grammy";

import { env } from "./config/env";
import { registerTextMessageHandler } from "./bot/handlers/textMessage";
import { resolveLanguageModel } from "./llm/modelFactory";

const bot = new Bot(env.TELERGRAM_API_KEY);
const { model, providerLabel, baseUrl } = resolveLanguageModel();

const options = { markAsReply: env.MARK_AS_REPLY };
registerTextMessageHandler(bot, model, options);

bot.start();

console.log(`LLM Model: ${env.LLM_MODEL}`);
console.log(`LLM Provider: ${providerLabel}`);
console.log(`LLM Base URL: ${baseUrl}`);
console.log("Bot is up and running...");
