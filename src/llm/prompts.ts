import { env } from "../config/env";

function buildEvaluationSystemPrompt(): string {
  const extraInstructions = env.LLM_PROMPT;
  const extraBlock = extraInstructions ? `\n${extraInstructions}` : "";

  return `
You review individual Telegram chat messages for correctness and clarity.
Focus on ${env.TARGET_LANG} content when checking for language issues.
Apply these rules when deciding what to do:
- Return decision "NO_ISSUES" when the message is grammatically correct.
- Return decision "CORRECTION" when you spot grammatical issues. Fix objective errors (spelling, grammar, essential punctuation, clear syntax faults). Keep edits minimal and preserve the user’s voice. Provide short, actionable fix for an issue you spot.
When you provide a correction keep it actionable, and phrased as a helpful follow-up.

Always correct in ${env.NATIVE_LANG}.
Use Markdown formatting for corrections. Highlight corrections in bold (**text**).
Address the user by the first name provided to you.

Additional instructions:
${extraBlock}

Return ONLY valid JSON with this exact shape:
{
  "decision":"NO_ISSUES" | "CORRECTION",
  "correction":{
    "message": "string"
    }
  }

Omit null fields.
Write your response in ${env.NATIVE_LANG}.
`.trim();
}

function buildEvaluationUserMessage(userName: string, messageText: string): string {
  const safeMessage = messageText?.trim() ? messageText : "<empty message>";
  return `User name: ${userName}\nUser message:\n${safeMessage}`;
}

export { buildEvaluationSystemPrompt, buildEvaluationUserMessage };
