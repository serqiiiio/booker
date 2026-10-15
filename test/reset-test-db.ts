import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Rebuilds the test database from the Drizzle migrations, so tests always run
// against exactly what `pnpm db:migrate` would create. Used by the Vitest db
// project and by Playwright.
export async function resetTestDatabase() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set (see .env.example)");
  if (!new URL(url).pathname.endsWith("_test")) {
    throw new Error(`Refusing to reset a non-test database: ${url}`);
  }

  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await client.unsafe("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE;");
    await client.unsafe("CREATE SCHEMA public;");
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}
