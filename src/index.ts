import { Bot } from "grammy";

import { env } from "./config/env";
import { registerTextMessageHandler } from "./bot/handlers/textMessage";
import { resolveLanguageModel } from "./llm/modelFactory";

const bot = new Bot(env.telegramApiKey);
const { model, providerLabel, baseUrl } = resolveLanguageModel();

const options = { markAsReply: env.markAsReply };
registerTextMessageHandler(bot, model, options);

bot.start();

console.log(`LLM Model: ${env.llmModel}`);
console.log(`LLM Provider: ${providerLabel}`);
console.log(`LLM Base URL: ${baseUrl}`);
console.log("Bot is up and running...");
