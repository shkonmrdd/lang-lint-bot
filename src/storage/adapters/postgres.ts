import { DataSource, EntitySchema } from "typeorm";

import { resolveChatType, type ChatType, type MinimalChat } from "../../bot/chat";
import type { AuthStorage, AuthorizeResult, AuthorizationSnapshot } from "../auth/types";

interface AuthorizedChatEntity {
  chatId: number;
  chatType: ChatType;
}

const AuthorizedChatSchema = new EntitySchema<AuthorizedChatEntity>({
  name: "AuthorizedChat",
  tableName: "authorized_chats",
  columns: {
    chatId: {
      name: "chat_id",
      type: Number,
      primary: true,
    },
    chatType: {
      name: "chat_type",
      type: String,
      primary: true,
      length: 16,
    },
  },
});

export interface PostgresAuthStorageOptions {
  url: string;
  logging?: boolean;
}

export class PostgresAuthStorage implements AuthStorage {
  static async initialize(options: PostgresAuthStorageOptions) {
    const dataSource = new DataSource({
      type: "postgres",
      url: options.url,
      logging: options.logging ?? false,
      entities: [AuthorizedChatSchema],
      synchronize: true,
    });

    await dataSource.initialize();
    return new PostgresAuthStorage(dataSource);
  }

  private constructor(private readonly dataSource: DataSource) {}

  private get repository() {
    return this.dataSource.getRepository(AuthorizedChatSchema);
  }

  async authorize(chat: MinimalChat): Promise<AuthorizeResult> {
    const chatType = resolveChatType(chat);
    const repository = this.repository;

    const existing = await repository.findOne({
      where: { chatId: chat.id, chatType },
    });

    if (existing) {
      return { alreadyAuthorized: true, chatType };
    }

    await repository.insert({ chatId: chat.id, chatType });
    return { alreadyAuthorized: false, chatType };
  }

  async isAuthorized(chat: MinimalChat) {
    const chatType = resolveChatType(chat);
    const repository = this.repository;

    return repository.exist({
      where: { chatId: chat.id, chatType },
    });
  }

  async snapshot(): Promise<AuthorizationSnapshot> {
    const repository = this.repository;
    const rows = await repository.find();

    const snapshot: AuthorizationSnapshot = {
      chat: [],
      group: [],
      channel: [],
    };

    for (const row of rows) {
      snapshot[row.chatType].push(row.chatId);
    }

    return snapshot;
  }
}
