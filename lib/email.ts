import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";

// Transactional email. Two transports:
// - "resend": production (needs RESEND_API_KEY and EMAIL_FROM);
// - "file": dev and tests, writes each email as JSON to EMAIL_DIR (.emails/)
//   so Playwright can read the links. Never allowed in production.

export type Email = { to: string; subject: string; html: string; text: string };

function transport(): "resend" | "file" {
  const configured = process.env.EMAIL_TRANSPORT;
  if (configured === "resend" || configured === "file") return configured;
  return process.env.RESEND_API_KEY ? "resend" : "file";
}

export async function sendEmail(email: Email): Promise<void> {
  const message = { ...email, to: email.to.trim().toLowerCase() };

  if (transport() === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) throw new Error("RESEND_API_KEY and EMAIL_FROM must be set");
    const { error } = await new Resend(apiKey).emails.send({ from, ...message });
    if (error) throw new Error(`Resend failed: ${error.message}`);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("The file email transport cannot be used in production");
  }
  const dir = process.env.EMAIL_DIR ?? ".emails";
  await mkdir(dir, { recursive: true });
  const file = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}.json`;
  await writeFile(join(dir, file), JSON.stringify({ ...message, sentAt: new Date() }, null, 2));
}
