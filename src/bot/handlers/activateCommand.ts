import type { Bot, Context } from "grammy";
import type { ResolvedAuth } from "../auth";

type ActivateCommandAuth = Pick<ResolvedAuth, "activationCode" | "authorize">;

function registerActivateCommandHandler(
  bot: Bot<Context>,
  auth: ActivateCommandAuth,
): void {
  const { activationCode, authorize } = auth;

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

    const { alreadyAuthorized, chatType } = await authorize({
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
}

export type { ActivateCommandAuth };
export { registerActivateCommandHandler };
