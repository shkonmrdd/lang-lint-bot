import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { env } from "../config/env";

type ResolvedModel = string | LanguageModel;

interface ModelResolution {
  model: ResolvedModel;
  providerLabel: string;
  baseUrl: string;
}

function resolveOpenAICompatibleModel(options: {
  apiKey?: string | null;
  baseUrl?: string | null;
  providerLabel: string;
  clientName?: string | null;
}): ModelResolution {
  const client = createOpenAI({
    apiKey: options.apiKey ?? undefined,
    baseURL: options.baseUrl ?? undefined,
    name: options.clientName ?? undefined,
  });
  const resolvedModel = client(env.llmModel);
  const resolvedBaseUrl = options.baseUrl ?? null;

  return {
    model: resolvedModel,
    providerLabel: options.providerLabel,
    baseUrl: resolvedBaseUrl ?? "default",
  };
}

function resolveLanguageModel(): ModelResolution {
  if (env.llmBaseUrl) {
    return resolveOpenAICompatibleModel({
      apiKey: env.llmApiKey,
      baseUrl: env.llmBaseUrl,
      providerLabel: env.llmProvider ?? "openai-compatible",
      clientName: env.llmProvider,
    });
  }

  if (!env.llmProvider || env.llmProvider === "openai") {
    if (!env.llmApiKey) {
      throw new Error(
        "No API key found for the configured LLM provider. Set OPENAI_API_KEY, LLM_API_KEY, or an appropriate <PROVIDER>_API_KEY.",
      );
    }

    return resolveOpenAICompatibleModel({
      apiKey: env.llmApiKey,
      providerLabel: "openai",
    });
  }

  return {
    model: env.llmModel,
    providerLabel: env.llmProvider,
    baseUrl: "default",
  };
}

export { resolveLanguageModel };
export type { ResolvedModel, ModelResolution };
