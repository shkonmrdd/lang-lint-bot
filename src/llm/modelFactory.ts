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
  const resolvedModel = client(env.LLM_MODEL);
  const resolvedBaseUrl = options.baseUrl ?? null;

  return {
    model: resolvedModel,
    providerLabel: options.providerLabel,
    baseUrl: resolvedBaseUrl ?? "default",
  };
}

function resolveLanguageModel(): ModelResolution {
  if (env.LLM_BASE_URL) {
    return resolveOpenAICompatibleModel({
      apiKey: env.LLM_API_KEY,
      baseUrl: env.LLM_BASE_URL,
      providerLabel: env.LLM_PROVIDER ?? "openai-compatible",
      clientName: env.LLM_PROVIDER,
    });
  }

  if (!env.LLM_PROVIDER || env.LLM_PROVIDER === "openai") {
    if (!env.LLM_API_KEY) {
      throw new Error(
        "No API key found for the configured LLM provider. Set OPENAI_API_KEY, LLM_API_KEY, or an appropriate <PROVIDER>_API_KEY.",
      );
    }

    return resolveOpenAICompatibleModel({
      apiKey: env.LLM_API_KEY,
      providerLabel: "openai",
    });
  }

  return {
    model: env.LLM_MODEL,
    providerLabel: env.LLM_PROVIDER,
    baseUrl: "default",
  };
}

export { resolveLanguageModel };
export type { ResolvedModel, ModelResolution };
