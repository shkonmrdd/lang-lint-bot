import { InMemoryAuthStorage } from "../adapters/memory";
import { PostgresAuthStorage } from "../adapters/postgres";
import type { AuthStorage } from "./types";

export type AuthStorageDriver = "memory" | "postgres";

export interface AuthStorageFactoryOptions {
  driver?: AuthStorageDriver;
  url?: string | null;
  logging?: boolean;
}

const resolveDriver = (options: AuthStorageFactoryOptions): AuthStorageDriver => {
  if (options.driver) {
    return options.driver;
  }

  return options.url ? "postgres" : "memory";
};

export const resolveAuthStorage = async (
  options: AuthStorageFactoryOptions = {},
): Promise<AuthStorage> => {
  const driver = resolveDriver(options);

  if (driver === "postgres") {
    if (!options.url) {
      throw new Error("Postgres auth storage requires a connection URL.");
    }

    try {
      const storage = await PostgresAuthStorage.initialize({
        url: options.url,
        logging: options.logging,
      });
      console.log("Auth storage: PostgreSQL via TypeORM.");
      return storage;
    } catch (error) {
      console.error("Failed to initialize PostgreSQL storage. Falling back to in-memory storage.");
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

export { InMemoryAuthStorage, PostgresAuthStorage };
export type { AuthStorage } from "./types";
