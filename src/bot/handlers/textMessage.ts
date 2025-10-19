import type { Bot, Context } from "grammy";
import type { LanguageModel } from "ai";
import { generateText } from "ai";

import { clearReactions } from "../../utils/messages";
import { buildEvaluationSystemPrompt, buildEvaluationUserMessage } from "../../llm/prompts";
import { parseLlmEvaluation } from "../../llm/evaluation";

interface RegisterHandlerOptions {
  markAsReply?: boolean;
  auth?: {
    required: boolean;
    isAuthorized: (chat: { id: number; type?: string } | null | undefined) => boolean;
  };
}

function registerTextMessageHandler(
  bot: Bot<Context>,
  model: LanguageModel,
  options: RegisterHandlerOptions = {},
): void {
  const { markAsReply = false, auth } = options;

  bot.on("message:text", async (ctx) => {
    console.log("Received message", {
      message_id: ctx.message.message_id,
      text: ctx.message.text,
    });

    const authRequired = auth?.required ?? false;
    const authorized =
      !authRequired || (auth?.isAuthorized ? auth.isAuthorized(ctx.chat ?? undefined) : true);

    if (!authorized) {
      console.warn("Blocking message from unauthorized chat", {
        chat_id: ctx.chat?.id,
        chat_type: ctx.chat?.type,
        message_id: ctx.message.message_id,
      });

      await ctx.reply("🔐 This bot is locked. Ask an admin to run /activate <code>.");
      return;
    }

    ctx.react("👀");

    const messageText = ctx.message.text ?? "";
    const fullName = [ctx.from?.first_name, ctx.from?.last_name]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(" ");
    const userName = (fullName || ctx.from?.username || "Usuario").trim();

    try {
      const { text: rawResponse } = await generateText({
        model,
        messages: [
          { role: "system", content: buildEvaluationSystemPrompt() },
          {
            role: "user",
            content: buildEvaluationUserMessage(userName, messageText),
          },
        ],
      });

      const evaluation = parseLlmEvaluation(rawResponse.trim());

      if (!evaluation) {
        console.warn("LLM response did not match schema, ignoring message.", {
          rawResponse,
        });
        return;
      }

      if (evaluation.decision === "IGNORE") {
        console.info("LLM chose to ignore message", {
          message_id: ctx.message.message_id,
        });

        await clearReactions(ctx);
        return;
      }

      if (evaluation.decision === "NO_ISSUES") {
        await clearReactions(ctx);
        return;
      }

      if (evaluation.decision === "CORRECTION" && evaluation.correction) {
        const replyParameters = markAsReply
          ? { message_id: ctx.message.message_id }
          : undefined;

        await clearReactions(ctx);
        await ctx.reply(evaluation.correction.message, {
          reply_parameters: replyParameters,
          parse_mode: "Markdown",
        });
        return;
      }
    } catch (error) {
      console.error("Failed to run LLM evaluation", error);
    }
  });
}

export { registerTextMessageHandler };
