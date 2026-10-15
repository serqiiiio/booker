import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "@/lib/email";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "booker-emails-"));
  vi.stubEnv("EMAIL_TRANSPORT", "file");
  vi.stubEnv("EMAIL_DIR", dir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dir, { recursive: true, force: true });
});

describe("sendEmail with the file transport (dev and tests)", () => {
  it("writes each email as JSON so tests can read the link", async () => {
    await sendEmail({ to: "Ana@Example.com", subject: "Hola", html: "<p>Hola</p>", text: "Hola" });

    const files = await readdir(dir);
    expect(files).toHaveLength(1);
    const saved = JSON.parse(await readFile(join(dir, files[0]), "utf8"));
    expect(saved).toMatchObject({ to: "ana@example.com", subject: "Hola", text: "Hola" });
  });

  it("refuses the file transport in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      sendEmail({ to: "ana@example.com", subject: "Hola", html: "", text: "" }),
    ).rejects.toThrow(/production/);
  });
});
