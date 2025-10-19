import type { ChatType, MinimalChat } from "../../bot/chat";

export interface AuthorizeResult {
  alreadyAuthorized: boolean;
  chatType: ChatType;
}

export type AuthorizationSnapshot = Record<ChatType, number[]>;

export interface AuthStorage {
  authorize(chat: MinimalChat): Promise<AuthorizeResult>;
  isAuthorized(chat: MinimalChat): Promise<boolean>;
  snapshot(): Promise<AuthorizationSnapshot>;
}
