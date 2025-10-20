import type { Bot, Context } from "grammy";
import type { LanguageModel } from "ai";
import { generateText } from "ai";

import { clearReactions } from "../../utils/messages";
import { buildEvaluationSystemPrompt, buildEvaluationUserMessage } from "../../llm/prompts";
import { parseLlmEvaluation } from "../../llm/evaluation";

interface RegisterHandlerOptions {
  markAsReply?: boolean;
}

function registerTextMessageHandler(
  bot: Bot<Context>,
  model: LanguageModel,
  options: RegisterHandlerOptions = {},
): void {
  const { markAsReply = false } = options;

  bot.on("message:text", async (ctx) => {
    console.log("Received message", {
      message_id: ctx.message.message_id,
      text: ctx.message.text,
    });

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
