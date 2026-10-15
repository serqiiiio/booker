import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";

// Where the e2e server's "file" email transport writes (see playwright.config.ts).
export const E2E_EMAIL_DIR = ".emails/e2e";

export type SentEmail = { to: string; subject: string; html: string; text: string; sentAt: string };

export async function clearEmails() {
  await rm(E2E_EMAIL_DIR, { recursive: true, force: true });
  await mkdir(E2E_EMAIL_DIR, { recursive: true });
}

export async function emailsTo(to: string): Promise<SentEmail[]> {
  const files = await readdir(E2E_EMAIL_DIR).catch(() => []);
  const emails = await Promise.all(
    files.map(async (f) => JSON.parse(await readFile(join(E2E_EMAIL_DIR, f), "utf8")) as SentEmail),
  );
  return emails
    .filter((e) => e.to === to.toLowerCase())
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

// Waits for the `count`-th email to `to` and returns it.
export async function waitForEmail(to: string, count = 1): Promise<SentEmail> {
  let found: SentEmail[] = [];
  await expect
    .poll(async () => (found = await emailsTo(to)).length, { timeout: 10_000 })
    .toBeGreaterThanOrEqual(count);
  return found[count - 1];
}

export function invitationLinkIn(email: SentEmail): string {
  const match = email.text.match(/https?:\/\/\S+\/invitacion\/[\w-]+/);
  if (!match) throw new Error(`No invitation link in email to ${email.to}`);
  return match[0];
}
