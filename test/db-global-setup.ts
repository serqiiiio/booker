import { resetTestDatabase } from "./reset-test-db";

export default async function setup() {
  await resetTestDatabase();
}
