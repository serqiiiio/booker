import type { Metadata } from "next";
import Link from "next/link";
import { RequestResetForm } from "./request-form";

export const metadata: Metadata = { title: "Recuperar contraseña · Booker" };

export default function RequestResetPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Te enviamos un link a tu email para crear una contraseña nueva.
        </p>
      </div>
      <RequestResetForm />
      <Link href="/ingresar" className="text-sm underline underline-offset-4">
        Volver a ingresar
      </Link>
    </main>
  );
}
