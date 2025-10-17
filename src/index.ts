import { Bot } from "grammy";

if (!process.env.TG_API_KEY) {
  throw new Error("TG_API_KEY is not set in environment variables");
}

const bot = new Bot(process.env.TG_API_KEY);

bot.on("message:text", async (ctx) => {
  const shouldApprove = Math.random() < 0.5;

  if (shouldApprove) {
    await ctx.react("👍");
    return;
  }

  await ctx.reply("There is a mistake");
});

bot.start();

console.log("Bot is up and running...");
