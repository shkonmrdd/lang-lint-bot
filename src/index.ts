import { Bot } from "grammy";

if (!process.env.TG_API_KEY) {
  throw new Error("TG_API_KEY is not set in environment variables");
}

// Create a bot object
const bot = new Bot(process.env.TG_API_KEY); // <-- place your bot token in this string

// Register listeners to handle messages
bot.on("message:text", (ctx) => ctx.reply("Echo: " + ctx.message.text));

// Start the bot (using long polling)
bot.start();

console.log("Bot is up and running...");