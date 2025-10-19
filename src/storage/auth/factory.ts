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

const DEFAULT_TYPEORM_PROVIDER: TypeOrmDatabaseProvider = "postgres";

const resolveDriver = ({ driver, url }: AuthStorageFactoryOptions): AuthStorageDriver =>
  driver ?? (url ? "typeorm" : "memory");

const resolveProvider = (candidate?: AuthStorageFactoryOptions["provider"]): TypeOrmDatabaseProvider => {
  if (candidate == null || candidate === "") {
    return DEFAULT_TYPEORM_PROVIDER;
  }

  const normalized = candidate.toString().toLowerCase() as TypeOrmDatabaseProvider;
  if (SUPPORTED_TYPEORM_DATABASE_PROVIDERS.includes(normalized)) {
    return normalized;
  }

  console.warn(`Unsupported database provider "${candidate}". Falling back to PostgreSQL.`);
  return DEFAULT_TYPEORM_PROVIDER;
};

export const resolveAuthStorage = async (
  options: AuthStorageFactoryOptions = {},
): Promise<AuthStorage> => {
  const driver = resolveDriver(options);

  if (driver !== "typeorm") {
    console.log(
      options.url
        ? "Auth storage: in-memory (driver forced)."
        : "Auth storage: in-memory (no DATABASE_URL provided).",
    );
    return new InMemoryAuthStorage();
  }

  const { url, logging, synchronize } = options;

  if (!url) {
    throw new Error("TypeORM auth storage requires a connection URL.");
  }

  const provider = resolveProvider(options.provider);

  try {
    const storage = await TypeOrmAuthStorage.initialize({
      provider,
      url,
      logging,
      synchronize,
    });
    console.log(`Auth storage: ${provider} via TypeORM.`);
    return storage;
  } catch (error) {
    console.error(`Failed to initialize ${provider} storage. Falling back to in-memory storage.`);
    console.error(error);
    console.log("Auth storage: in-memory fallback.");
    return new InMemoryAuthStorage();
  }
};

export { InMemoryAuthStorage, TypeOrmAuthStorage };
export type { AuthStorage } from "./types";
export type { TypeOrmDatabaseProvider } from "../adapters/database";
