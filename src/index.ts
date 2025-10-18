import { Bot } from "grammy";
import { createOpenAI } from "@ai-sdk/openai";

import {
  telegramApiKey,
  openAIApiKey,
  llmModel,
  markAsReply,
} from "./config/env";
import { registerTextMessageHandler } from "./bot/handlers/textMessage";

const bot = new Bot(telegramApiKey);
const openai = createOpenAI({ apiKey: openAIApiKey });

registerTextMessageHandler({ bot, llmModel, openai, markAsReply });

bot.start();

console.log(`LLM Model: ${llmModel}`);
console.log("Bot is up and running...");
