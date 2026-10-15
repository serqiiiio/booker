import { resetTestDatabase } from "../test/reset-test-db";
import { clearEmails } from "./emails";

export default async function globalSetup() {
  await Promise.all([resetTestDatabase(), clearEmails()]);
}
