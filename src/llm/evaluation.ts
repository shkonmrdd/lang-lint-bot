type LlmDecision = "NO_ISSUES" | "CORRECTION";

interface LlmEvaluation {
  decision: LlmDecision;
  correction?: string;
}

const allowedDecisions = new Set<LlmDecision>([
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

  if (decision === "CORRECTION") {
    if (!isNonEmptyString(parsed.correction)) {
      return null;
    }

    const correction = parsed.correction.trim();
    if (!correction) {
      return null;
    }

    return { decision, correction };
  }

  return { decision };
}

export { parseLlmEvaluation };
export type { LlmDecision, LlmEvaluation };
