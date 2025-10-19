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

export { addAuthorizedChat, getAuthorizationSnapshot, isChatAuthorized };
