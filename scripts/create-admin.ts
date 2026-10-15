// Creates the founder (platform admin) account, or promotes an existing one.
// Usage: pnpm admin:create <email> "<name>"
// The password is read from ADMIN_PASSWORD; if missing, a random one is
// generated and printed once.
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { createUserWithPassword } from "@/lib/auth/users";
import { client, db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/schemas/auth";

async function main() {
  const [rawEmail, rawName] = process.argv.slice(2);
  const email = emailSchema.safeParse(rawEmail ?? "");
  const name = nameSchema.safeParse(rawName ?? "");
  if (!email.success || !name.success) {
    console.error('Uso: pnpm admin:create <email> "<nombre>"');
    process.exitCode = 1;
    return;
  }

  const [existing] = await db.select().from(user).where(eq(user.email, email.data));
  if (existing) {
    await db.update(user).set({ isPlatformAdmin: true }).where(eq(user.id, existing.id));
    console.log(`${email.data} ya tenía cuenta: ahora es administrador de Booker.`);
    return;
  }

  const generated = !process.env.ADMIN_PASSWORD;
  const password = passwordSchema.parse(
    process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url"),
  );
  await createUserWithPassword({
    name: name.data,
    email: email.data,
    password,
    isPlatformAdmin: true,
  });

  console.log(`Administrador creado: ${email.data}`);
  if (generated) console.log(`Contraseña (guárdala, no se vuelve a mostrar): ${password}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
