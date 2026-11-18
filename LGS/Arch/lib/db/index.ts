import "server-only";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;

const globalStore = globalThis as unknown as { __lgsDb?: Promise<Db> };

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    // prepare: false нужен для пулера Supabase в режиме транзакций
    const client = postgres(url, { prepare: false, max: 5 });
    await client.unsafe(schema.DDL);
    return drizzle(client, { schema }) as unknown as Db;
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL не задан: на Vercel нужна внешняя база Postgres");
  }

  // Локальная разработка и тесты без внешней базы: встроенный Postgres (PGlite)
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR || ".data/pglite";
  if (dir !== "memory://") mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await client.exec(schema.DDL);
  return drizzle(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  if (!globalStore.__lgsDb) {
    globalStore.__lgsDb = connect().catch((error) => {
      globalStore.__lgsDb = undefined;
      throw error;
    });
  }
  return globalStore.__lgsDb;
}

export { schema };
