import { fileURLToPath } from "node:url";

import { DataSource, EntitySchema, type DataSourceOptions, type ValueTransformer } from "typeorm";

import { resolveChatType, type ChatType, type MinimalChat } from "../../bot/chat";
import type { AuthStorage, AuthorizeResult, AuthorizationSnapshot } from "../auth/types";

interface AuthorizedChatEntity {
  chatId: number;
  chatType: ChatType;
}

const numericIdTransformer: ValueTransformer = {
  to: (value?: number | null) => value ?? null,
  from: (value: string | number | null) => {
    if (value == null) {
      return value;
    }
    return typeof value === "string" ? Number.parseInt(value, 10) : value;
  },
};

const AuthorizedChatSchema = new EntitySchema<AuthorizedChatEntity>({
  name: "AuthorizedChat",
  tableName: "authorized_chats",
  columns: {
    chatId: {
      name: "chat_id",
      type: "bigint",
      primary: true,
      transformer: numericIdTransformer,
    },
    chatType: {
      name: "chat_type",
      type: String,
      primary: true,
      length: 16,
    },
  },
});

const SUPPORTED_PROVIDER_VALUES = [
  "better-sqlite3",
  "cockroachdb",
  "mariadb",
  "mssql",
  "mysql",
  "postgres",
  "sqlite",
] as const;

type SupportedDatabaseType = Extract<DataSourceOptions["type"], (typeof SUPPORTED_PROVIDER_VALUES)[number]>;

export type TypeOrmDatabaseProvider = SupportedDatabaseType;
export const SUPPORTED_TYPEORM_DATABASE_PROVIDERS: readonly TypeOrmDatabaseProvider[] =
  SUPPORTED_PROVIDER_VALUES;

export interface TypeOrmAuthStorageOptions {
  provider: TypeOrmDatabaseProvider;
  url: string;
  logging?: boolean;
  synchronize?: boolean;
}

const normalizeFileDatabase = (target: string) => {
  if (!target.startsWith("file:")) {
    return target;
  }

  try {
    return fileURLToPath(new URL(target));
  } catch {
    return target.replace(/^file:(\/\/)?/, "");
  }
};

const buildDataSourceOptions = (options: TypeOrmAuthStorageOptions): DataSourceOptions => {
  const { provider, url, logging, synchronize } = options;
  const common = {
    logging: logging ?? false,
    entities: [AuthorizedChatSchema],
    synchronize: synchronize ?? true,
  };

  if (provider === "sqlite" || provider === "better-sqlite3") {
    return {
      type: provider,
      database: normalizeFileDatabase(url),
      ...common,
    } as DataSourceOptions;
  }

  return {
    type: provider,
    url,
    ...common,
  } as DataSourceOptions;
};

export class TypeOrmAuthStorage implements AuthStorage {
  static async initialize(options: TypeOrmAuthStorageOptions) {
    const dataSource = new DataSource(buildDataSourceOptions(options));
    await dataSource.initialize();
    return new TypeOrmAuthStorage(dataSource);
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
