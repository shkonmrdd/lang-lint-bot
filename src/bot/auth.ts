import type { Context, MiddlewareFn } from "grammy";

export type ChatType = "chat" | "group" | "channel";

interface MinimalChat {
  id: number;
  type?: string;
}

const allowedRegistry: Record<ChatType, Set<number>> = {
  chat: new Set<number>(),
  group: new Set<number>(),
  channel: new Set<number>(),
};

const resolveChatType = (chat: MinimalChat): ChatType => {
  switch (chat.type) {
    case "group":
    case "supergroup":
      return "group";
    case "channel":
      return "channel";
    default:
      return "chat";
  }
};

const addAuthorizedChat = (chat: MinimalChat): { alreadyAuthorized: boolean; chatType: ChatType } => {
  const chatType = resolveChatType(chat);
  const registry = allowedRegistry[chatType];

  const alreadyAuthorized = registry.has(chat.id);
  if (!alreadyAuthorized) {
    registry.add(chat.id);
  }

  return { alreadyAuthorized, chatType };
};

const isChatAuthorized = (chat: MinimalChat | null | undefined): boolean => {
  if (!chat || typeof chat.id !== "number") {
    return false;
  }

  const chatType = resolveChatType(chat);
  return allowedRegistry[chatType].has(chat.id);
};

const getAuthorizationSnapshot = (): Record<ChatType, number[]> => ({
  chat: Array.from(allowedRegistry.chat),
  group: Array.from(allowedRegistry.group),
  channel: Array.from(allowedRegistry.channel),
});

interface ResolveAuthOptions {
  activationCode: string | null;
}

interface ResolvedAuth {
  activationCode: string | null;
  required: boolean;
  middleware: MiddlewareFn<Context>;
  authorizeChat: typeof addAuthorizedChat;
  isAuthorized: typeof isChatAuthorized;
  getSnapshot: typeof getAuthorizationSnapshot;
}

const resolveAuth = (options: ResolveAuthOptions): ResolvedAuth => {
  const activationCode = options.activationCode ?? null;
  const required = Boolean(activationCode);

  const middleware: MiddlewareFn<Context> = async (ctx, next) => {
    if (!required) {
      await next();
      return;
    }

    if (ctx.hasCommand?.("activate")) {
      await next();
      return;
    }

    const chat = ctx.chat ?? undefined;
    if (!chat) {
      await next();
      return;
    }

    if (isChatAuthorized(chat)) {
      await next();
      return;
    }

    console.warn("Blocking message from unauthorized chat", {
      chat_id: chat.id,
      chat_type: chat.type,
    });

    if (typeof ctx.reply === "function") {
      await ctx.reply("🔐 This bot is locked. Ask an admin to run /activate <code>.");
    }

    return;
  };

  return {
    activationCode,
    required,
    middleware,
    authorizeChat: addAuthorizedChat,
    isAuthorized: isChatAuthorized,
    getSnapshot: getAuthorizationSnapshot,
  };
};

export { addAuthorizedChat, getAuthorizationSnapshot, isChatAuthorized, resolveAuth };
export type { ResolvedAuth };
