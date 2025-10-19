import type { Context, MiddlewareFn } from "grammy";

import type { AuthStorage, AuthorizeResult, AuthorizationSnapshot } from "../storage";
import { resolveChatType, type MinimalChat } from "./chat";

interface ResolveAuthOptions {
  activationCode: string | null;
  storage: AuthStorage;
}

export interface ResolvedAuth {
  activationCode: string | null;
  required: boolean;
  middleware: MiddlewareFn<Context>;
  authorize: (chat: MinimalChat) => Promise<AuthorizeResult>;
  isAuthorized: (chat: MinimalChat | null | undefined) => Promise<boolean>;
  snapshot: () => Promise<AuthorizationSnapshot>;
  storage: AuthStorage;
}

const toMinimalChat = (chat: MinimalChat | null | undefined): MinimalChat | null => {
  if (!chat || typeof chat.id !== "number") {
    return null;
  }

  return {
    id: chat.id,
    type: chat.type,
  };
};

const resolveAuth = (options: ResolveAuthOptions): ResolvedAuth => {
  const activationCode = options.activationCode ?? null;
  const required = Boolean(activationCode);
  const { storage } = options;

  const authorize: ResolvedAuth["authorize"] = async (chat) => {
    const normalized = toMinimalChat(chat);
    if (!normalized) {
      throw new Error("Cannot authorize chat without a numeric chat id.");
    }

    return storage.authorize(normalized);
  };

  const isAuthorized: ResolvedAuth["isAuthorized"] = async (chat) => {
    const normalized = toMinimalChat(chat);
    if (!normalized) {
      return false;
    }

    return storage.isAuthorized(normalized);
  };

  const snapshot: ResolvedAuth["snapshot"] = async () => {
    return storage.snapshot();
  };

  const middleware: MiddlewareFn<Context> = async (ctx, next) => {
    if (!required) {
      await next();
      return;
    }

    if (ctx.hasCommand?.("activate")) {
      await next();
      return;
    }

    const normalizedChat = toMinimalChat(ctx.chat ?? undefined);
    if (!normalizedChat) {
      await next();
      return;
    }

    const authorized = await isAuthorized(normalizedChat);
    if (authorized) {
      await next();
      return;
    }

    const chatType = resolveChatType(normalizedChat);
    console.warn("Blocking message from unauthorized chat", {
      chat_id: normalizedChat.id,
      chat_type: chatType,
    });

    if (typeof ctx.reply === "function") {
      await ctx.reply("🔐 This bot is locked. Ask an admin to run /activate <code>.");
    }
  };

  return {
    activationCode,
    required,
    middleware,
    authorize,
    isAuthorized,
    snapshot,
    storage,
  };
};

export { resolveAuth };
