import type { Bot, Context } from "grammy";
import type { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import { clearReactions } from "../../utils/messages";
import { buildEvaluationSystemPrompt, buildEvaluationUserMessage } from "../../llm/prompts";
import { parseLlmEvaluation } from "../../llm/evaluation";

type OpenAIClient = ReturnType<typeof createOpenAI>;

interface RegisterHandlerParams {
  bot: Bot<Context>;
  llmModel: string;
  openai: OpenAIClient;
  markAsReply: boolean;
}

function registerTextMessageHandler({
  bot,
  llmModel,
  openai,
  markAsReply,
}: RegisterHandlerParams): void {
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
        model: openai(llmModel),
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
