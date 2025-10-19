import chalk from "chalk";
import { Bot } from "grammy";

import { env } from "./config/env";
import { registerTextMessageHandler } from "./bot/handlers/textMessage";
import { resolveLanguageModel } from "./llm/modelFactory";
import { addAuthorizedChat, isChatAuthorized } from "./bot/auth";
import { registerActivateCommandHandler } from "./bot/handlers/activateCommand";

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

registerActivateCommandHandler(bot, {
  activationCode,
  authorizeChat: addAuthorizedChat,
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
