import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

type ResolvedModel = string | LanguageModel;

interface ModelResolution {
  model: ResolvedModel;
  providerLabel: string;
  baseUrl: string;
}

interface LanguageModelConfig {
  modelId: string;
  provider: "openai";
  baseUrl?: string | null;
  apiKey: string;
}

function resolveOpenAICompatibleModel(options: {
  modelId: string;
  apiKey: string;
  baseUrl?: string | null;
  provider?: string | null;
}): Pick<ModelResolution, "model" | "baseUrl"> {
  const client = createOpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseUrl ?? undefined,
    name: options.provider ?? undefined,
  });
  const resolvedModel = client(options.modelId);
  const resolvedBaseUrl = options.baseUrl ?? null;

  return {
    model: resolvedModel,
    baseUrl: resolvedBaseUrl ?? "default",
  };
}

function resolveLanguageModel(config: LanguageModelConfig): ModelResolution {
  if (config.provider === "openai") {
    const hasCustomBaseUrl = Boolean(config.baseUrl);

    const { model, baseUrl } = resolveOpenAICompatibleModel(config);

    return {
      model,
      baseUrl,
      providerLabel: hasCustomBaseUrl ? "openai-compatible" : "openai",
    };
  }

  throw new Error(`Unsupported LLM provider "${config.provider}".`);
}

export { resolveLanguageModel };
export type { ResolvedModel, ModelResolution, LanguageModelConfig };
