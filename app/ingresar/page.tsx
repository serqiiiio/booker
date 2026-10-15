import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar · Booker" };

export default async function LoginPage() {
  if (await getSession()) redirect("/panel");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Ingresar a Booker</h1>
        <p className="text-sm text-muted-foreground">Con el email y la contraseña de tu cuenta.</p>
      </div>
      <LoginForm />
    </main>
  );
}
