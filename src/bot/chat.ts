import type { Chat } from "grammy";

export type ChatType = "chat" | "group" | "channel";

export interface MinimalChat {
  id: number;
  type?: Chat["type"] | string;
}

export const resolveChatType = (chat: MinimalChat): ChatType => {
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
