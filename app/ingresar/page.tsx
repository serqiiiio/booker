import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { passwordResetMessages } from "@/lib/auth/errors";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar · Booker" };

export default async function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  if (await getSession()) redirect("/panel");
  const { cambiada } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Ingresar a Booker</h1>
        <p className="text-sm text-muted-foreground">Con el email y la contraseña de tu cuenta.</p>
      </div>
      {cambiada === "1" && (
        <p role="status" className="rounded-lg border bg-muted/40 p-4 text-sm">
          {passwordResetMessages.changed}
        </p>
      )}
      <LoginForm />
      <Link href="/recuperar" className="text-sm underline underline-offset-4">
        ¿Olvidaste tu contraseña?
      </Link>
    </main>
  );
}
