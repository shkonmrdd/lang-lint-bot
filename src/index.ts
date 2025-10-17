import { Bot } from "grammy";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const telegramApiKey = process.env.TG_API_KEY;
if (!telegramApiKey) {
  throw new Error("TG_API_KEY is not set in environment variables");
}

const openAIApiKey = process.env.OPENAI_API_KEY;
if (!openAIApiKey) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

const targetLanguage = process.env.TARGET_LANG ?? "English";
const nativeLanguage = process.env.NATIVE_LANG ?? "Spanish";
const markAsReply = process.env.MARK_AS_REPLY === "true";

const llmModel = process.env.LLM_MODEL ?? "gpt-5-mini";

const bot = new Bot(telegramApiKey);
const openai = createOpenAI({ apiKey: openAIApiKey });

type LlmDecision = "IGNORE" | "NO_ISSUES" | "CORRECTION";

interface LlmCorrectionPayload {
  message: string;
}

interface LlmEvaluation {
  decision: LlmDecision;
  correction?: LlmCorrectionPayload;
}

// Prompt used to instruct the model to issue structured moderation decisions.
function buildEvaluationSystemPrompt(): string {
  const extraInstructions = (process.env.LLM_PROMPT ?? "").trim();
  const extraBlock = extraInstructions ? `\n${extraInstructions}` : "";

  return `
You review individual Telegram chat messages for correctness and clarity.
Focus on ${targetLanguage} content when checking for language issues.
Apply these rules when deciding what to do:
- Return decision "IGNORE" when the content is chit-chat, non-actionable, or outside your scope.
- Return decision "NO_ISSUES" when the message is correct and needs a positive acknowledgement.
- Return decision "CORRECTION" only when you can provide a short, actionable fix for an issue you spot.
When you provide a correction keep it under 320 characters, actionable, and phrased as a helpful follow-up.

Always respond in ${nativeLanguage}.
Use Markdown formatting for corrections.
Address the user by the first name provided to you.

Additional instructions:
${extraBlock}

Return ONLY valid JSON with this exact shape:
{
  "decision":"IGNORE" | "NO_ISSUES" | "CORRECTION",
  "correction":{
    "message":string
    }
  }
Omit null fields.
`.trim();
}

function buildEvaluationUserMessage(userName: string, messageText: string): string {
  const safeMessage = messageText?.trim() ? messageText : "<empty message>";
  return `User name: ${userName}\nUser message:\n${safeMessage}`;
}

const allowedDecisions = new Set<LlmDecision>([
  "IGNORE",
  "NO_ISSUES",
  "CORRECTION",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLlmDecision(value: unknown): value is LlmDecision {
  return (
    typeof value === "string" && allowedDecisions.has(value as LlmDecision)
  );
}

function extractJsonPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

// Validates and normalises the structured response coming back from the LLM.
function parseLlmEvaluation(raw: string): LlmEvaluation | null {
  const candidate = extractJsonPayload(raw);
  if (!candidate) {
    console.warn("LLM response empty or missing JSON payload", { raw });
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    console.error("Failed to parse LLM response", { raw, candidate, error });
    return null;
  }

  if (!isPlainObject(parsed)) {
    return null;
  }

  const decision = parsed.decision;
  if (!isLlmDecision(decision)) {
    return null;
  }

  const evaluation: LlmEvaluation = { decision };

  if (evaluation.decision === "CORRECTION") {
    if (
      !isPlainObject(parsed.correction) ||
      !isNonEmptyString(parsed.correction.message)
    ) {
      return null;
    }

    const message = parsed.correction.message.trim();
    if (!message) {
      return null;
    }

    evaluation.correction = { message };
  }

  return evaluation;
}

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
        { role: "user", content: buildEvaluationUserMessage(userName, messageText) },
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
      // Clear reaction
      await ctx.api.setMessageReaction(ctx.chat.id, ctx.msg!.message_id, []);
      return;
    }

    if (evaluation.decision === "NO_ISSUES") {
      await ctx.react("👍");
      return;
    }

    if (evaluation.decision === "CORRECTION" && evaluation.correction) {
      const replyParameters = markAsReply
        ? { message_id: ctx.message.message_id }
        : undefined;

      await ctx.react("👎");
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

bot.start();

console.log(`LLM Model: ${llmModel}`);
console.log("Bot is up and running...");
