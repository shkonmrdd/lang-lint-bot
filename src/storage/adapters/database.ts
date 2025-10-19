import { fileURLToPath } from "node:url";

import {
  DataSource,
  EntitySchema,
  type DataSourceOptions,
  type Repository,
  type ValueTransformer,
} from "typeorm";

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

export const SUPPORTED_TYPEORM_DATABASE_PROVIDERS = [
  "better-sqlite3",
  "cockroachdb",
  "mariadb",
  "mssql",
  "mysql",
  "postgres",
  "sqlite",
] as const satisfies readonly DataSourceOptions["type"][];

export type TypeOrmDatabaseProvider = (typeof SUPPORTED_TYPEORM_DATABASE_PROVIDERS)[number];

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

const buildDataSourceOptions = ({
  provider,
  url,
  logging,
  synchronize,
}: TypeOrmAuthStorageOptions): DataSourceOptions => {
  const common = {
    logging: logging ?? false,
    entities: [AuthorizedChatSchema],
    synchronize: synchronize ?? true,
  };

  if (provider === "sqlite" || provider === "better-sqlite3") {
    return {
      ...common,
      type: provider,
      database: normalizeFileDatabase(url),
    } as DataSourceOptions;
  }

  return {
    ...common,
    type: provider,
    url,
  } as DataSourceOptions;
};

export class TypeOrmAuthStorage implements AuthStorage {
  static async initialize(options: TypeOrmAuthStorageOptions) {
    const dataSource = new DataSource(buildDataSourceOptions(options));
    await dataSource.initialize();
    return new TypeOrmAuthStorage(dataSource);
  }

  private constructor(private readonly dataSource: DataSource) {}

  private get repository(): Repository<AuthorizedChatEntity> {
    return this.dataSource.getRepository(AuthorizedChatSchema);
  }

  async authorize(chat: MinimalChat): Promise<AuthorizeResult> {
    const chatType = resolveChatType(chat);
    const repository = this.repository;

    const record = { chatId: chat.id, chatType };
    const alreadyAuthorized = await repository.exist({ where: record });

    if (!alreadyAuthorized) {
      await repository.insert(record);
    }

    return { alreadyAuthorized, chatType };
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
