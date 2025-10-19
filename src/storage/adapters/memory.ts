import { resolveChatType, type ChatType, type MinimalChat } from "../../bot/chat";
import type { AuthStorage, AuthorizeResult } from "../auth/types";

export class InMemoryAuthStorage implements AuthStorage {
  private readonly allowedRegistry: Record<ChatType, Set<number>> = {
    chat: new Set<number>(),
    group: new Set<number>(),
    channel: new Set<number>(),
  };

  async authorize(chat: MinimalChat): Promise<AuthorizeResult> {
    const chatType = resolveChatType(chat);
    const registry = this.allowedRegistry[chatType];
    const alreadyAuthorized = registry.has(chat.id);

    if (!alreadyAuthorized) {
      registry.add(chat.id);
    }

    return { alreadyAuthorized, chatType };
  }

  async isAuthorized(chat: MinimalChat) {
    const chatType = resolveChatType(chat);
    return this.allowedRegistry[chatType].has(chat.id);
  }

  async snapshot() {
    return {
      chat: Array.from(this.allowedRegistry.chat),
      group: Array.from(this.allowedRegistry.group),
      channel: Array.from(this.allowedRegistry.channel),
    };
  }
}
