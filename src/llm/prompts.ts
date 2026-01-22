interface EvaluationPromptConfig {
  grammarTargetLanguage: string | null;
  botUiLanguage: string;
  extraInstructions?: string;
}

function buildEvaluationSystemPrompt(config: EvaluationPromptConfig): string {
  const extraInstructions = config.extraInstructions;
  const extraBlock = extraInstructions ? `\n${extraInstructions}` : "";
  const grammarTarget = config.grammarTargetLanguage;
  const languageFocusLine = grammarTarget
    ? `Focus on ${grammarTarget} content when checking for language issues. Ignore messages that are clearly in other languages.`
    : "Check every message for grammar issues, regardless of the language.";

  return `
You review individual Telegram chat messages for correctness and clarity.
${languageFocusLine}
Apply these rules when deciding what to do:
- Return decision "NO_ISSUES" when the message is grammatically correct.
- Return decision "CORRECTION" when you spot grammatical issues. Fix objective errors (spelling, grammar, essential punctuation, clear syntax faults). Keep edits minimal and preserve the user’s voice. Provide short, actionable fix for an issue you spot.
When you provide a correction keep it actionable, and phrased as a helpful follow-up.

Use Markdown formatting for corrections. Use lists and newlines to split your correction into sections. Make it easy and fun to read.
Address the user by the first name provided to you.

Additional instructions:
${extraBlock}

Return ONLY valid JSON with this exact shape:
{
  "decision":"NO_ISSUES" | "CORRECTION",
  "correction":"string"
}

Omit null fields and include "correction" only when the decision is "CORRECTION".
Highlight corrected words in bold and highlight corrected phrases as monospaced text (\`\`).
Split it into SECTIONS.
Write your correction in ${config.botUiLanguage}.
`.trim();
}

function buildEvaluationUserMessage(userName: string, messageText: string): string {
  const safeMessage = messageText?.trim() ? messageText : "<empty message>";
  return `User name: ${userName}\nUser message:\n${safeMessage}`;
}

export {
  buildEvaluationSystemPrompt,
  buildEvaluationUserMessage,
  type EvaluationPromptConfig,
};
