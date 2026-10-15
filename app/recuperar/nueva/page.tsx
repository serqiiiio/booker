import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { passwordResetMessages } from "@/lib/auth/errors";
import { isResetTokenValid } from "@/lib/auth/password-reset";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña · Booker",
  // The URL carries a secret token: keep it out of search engines and referrers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function NewPasswordPage({ searchParams }: PageProps<"/recuperar/nueva">) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && token.length > 0 && (await isResetTokenValid(token));

  if (!valid) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
        <p role="status" className="text-lg font-medium">
          {passwordResetMessages.invalidLink}
        </p>
        <Button asChild size="lg" className="h-11">
          <Link href="/recuperar">Pedir un link nuevo</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Crea tu nueva contraseña</h1>
      <NewPasswordForm token={token} />
    </main>
  );
}
