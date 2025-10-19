import { InMemoryAuthStorage } from "../adapters/memory";
import {
  TypeOrmAuthStorage,
  SUPPORTED_TYPEORM_DATABASE_PROVIDERS,
  type TypeOrmAuthStorageOptions,
  type TypeOrmDatabaseProvider,
} from "../adapters/database";
import type { AuthStorage } from "./types";

export type AuthStorageDriver = "memory" | "typeorm";

export interface AuthStorageFactoryOptions {
  driver?: AuthStorageDriver;
  provider?: TypeOrmDatabaseProvider | string | null;
  url?: string | null;
  logging?: boolean;
  synchronize?: TypeOrmAuthStorageOptions["synchronize"];
}

const resolveDriver = (options: AuthStorageFactoryOptions): AuthStorageDriver => {
  if (options.driver) {
    return options.driver;
  }

  return options.url ? "typeorm" : "memory";
};

const resolveProvider = (provider?: AuthStorageFactoryOptions["provider"]): TypeOrmDatabaseProvider => {
  if (provider) {
    const normalized = provider.toString().toLowerCase() as TypeOrmDatabaseProvider;
    if (SUPPORTED_TYPEORM_DATABASE_PROVIDERS.includes(normalized)) {
      return normalized;
    }

    console.warn(
      `Unsupported database provider "${provider}". Falling back to PostgreSQL.`,
    );
  }

  return "postgres";
};

export const resolveAuthStorage = async (
  options: AuthStorageFactoryOptions = {},
): Promise<AuthStorage> => {
  const driver = resolveDriver(options);

  if (driver === "typeorm") {
    if (!options.url) {
      throw new Error("TypeORM auth storage requires a connection URL.");
    }

    const provider = resolveProvider(options.provider);

    try {
      const storage = await TypeOrmAuthStorage.initialize({
        provider,
        url: options.url,
        logging: options.logging,
        synchronize: options.synchronize,
      });
      console.log(`Auth storage: ${provider} via TypeORM.`);
      return storage;
    } catch (error) {
      console.error(`Failed to initialize ${provider} storage. Falling back to in-memory storage.`);
      console.error(error);
      console.log("Auth storage: in-memory fallback.");
      return new InMemoryAuthStorage();
    }
  }

  if (options.url) {
    console.log("Auth storage: in-memory (driver forced).");
  } else {
    console.log("Auth storage: in-memory (no DATABASE_URL provided).");
  }
  return new InMemoryAuthStorage();
};

export { InMemoryAuthStorage, TypeOrmAuthStorage };
export type { AuthStorage } from "./types";
export type { TypeOrmDatabaseProvider } from "../adapters/database";
