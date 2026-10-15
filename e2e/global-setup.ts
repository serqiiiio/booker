import { resetTestDatabase } from "../test/reset-test-db";

export default async function globalSetup() {
  await resetTestDatabase();
}
