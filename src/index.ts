import chalk from "chalk";
import { Bot } from "grammy";

import { env } from "./config/env";
import { registerTextMessageHandler } from "./bot/handlers/textMessage";
import { resolveLanguageModel } from "./llm/modelFactory";
import { addAuthorizedChat, isChatAuthorized } from "./bot/auth";

const activationCode = env.BOT_AUTH_CODE;
const authRequired = Boolean(activationCode);

if (!authRequired) {
  const warningLines = [
    "========================================",
    "WARNING: BOT AUTHENTICATION DISABLED",
    "The bot is insecure and can be used by anyone.",
    "Please set BOT_AUTH_CODE in production environments.",
    "========================================",
  ];

  console.warn(chalk.yellow(warningLines.join("\n")));
}

const bot = new Bot(env.TELERGRAM_API_KEY);
const { model, providerLabel, baseUrl } = resolveLanguageModel();

bot.command("activate", async (ctx) => {
  const code = (ctx.match ?? "").trim();
  if (!code) {
    return ctx.reply("Usage: /activate <code>");
  }

  if (!activationCode) {
    return ctx.reply("Server has no BOT_AUTH_CODE configured.");
  }

  if (code !== activationCode) {
    return ctx.reply("❌ Invalid code.");
  }

  const chatId = ctx.chat?.id;
  if (typeof chatId !== "number") {
    return ctx.reply("Cannot read chat id here.");
  }

  const { alreadyAuthorized, chatType } = addAuthorizedChat({
    id: chatId,
    type: ctx.chat?.type,
  });

  if (alreadyAuthorized) {
    return ctx.reply("✅ Already activated for this chat.");
  }

  console.log("Activated chat", {
    chatType,
    chatId,
    title: ctx.chat?.title,
  });

  return ctx.reply("✅ Activated for this chat. You're good to go.");
});

const options = {
  markAsReply: env.MARK_AS_REPLY,
  auth: {
    required: authRequired,
    isAuthorized: isChatAuthorized,
  },
};
registerTextMessageHandler(bot, model, options);

bot.start();

console.log(`LLM Model: ${env.LLM_MODEL}`);
console.log(`LLM Provider: ${providerLabel}`);
console.log(`LLM Base URL: ${baseUrl}`);
console.log("Bot is up and running...");
