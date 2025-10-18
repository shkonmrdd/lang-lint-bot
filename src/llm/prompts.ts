import { env } from "../config/env";

function buildEvaluationSystemPrompt(): string {
  const extraInstructions = env.LLM_PROMPT;
  const extraBlock = extraInstructions ? `\n${extraInstructions}` : "";

  return `
You review individual Telegram chat messages for correctness and clarity.
Focus on ${env.TARGET_LANG} content when checking for language issues.
Apply these rules when deciding what to do:
- Return decision "IGNORE" when the content is chit-chat, non-actionable, or outside your scope.
- Return decision "NO_ISSUES" when the message is correct and needs a positive acknowledgement.
- Return decision "CORRECTION" only when you can provide a short, actionable fix for an issue you spot.
When you provide a correction keep it under 320 characters, actionable, and phrased as a helpful follow-up.

Always respond in ${env.NATIVE_LANG}.
Use Markdown formatting for corrections. Make it easy and fun to read. Highlight corrections in bold or monospaced text (\`\`).
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

export { buildEvaluationSystemPrompt, buildEvaluationUserMessage };
