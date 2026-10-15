import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const ignored = ["node_modules/**", "e2e/**", ".next/**", ".agents/**", ".claude/**"];

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: [...ignored, "**/*.db.test.ts"],
        },
      },
      {
        // Integration tests against the disposable test database (*.db.test.ts).
        extends: true,
        test: {
          name: "db",
          include: ["**/*.db.test.ts"],
          exclude: ignored,
          globalSetup: ["./test/db-global-setup.ts"],
          // App code reads DATABASE_URL: point it at the test database.
          env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
          fileParallelism: false,
        },
      },
    ],
  },
});
