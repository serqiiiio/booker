import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Rebuilds the test database from the Drizzle migrations before the db suite,
// so tests always run against exactly what `pnpm db:migrate` would create.
export default async function setup() {
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
