import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { invitationMessages } from "@/lib/auth/errors";
import { getSession } from "@/lib/auth/session";
import { lookupInvitation } from "@/lib/invitations-accept";
import { ExistingUserForm, NewUserForm } from "./accept-forms";

export const metadata: Metadata = {
  title: "Invitación · Booker",
  // The URL carries a secret token: keep it out of search engines and referrers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const roleLabel = { owner: "dueño", staff: "staff" } as const;

export default async function InvitationPage({ params }: PageProps<"/invitacion/[token]">) {
  const { token } = await params;
  const invitation = await lookupInvitation(token, new Date());

  if (invitation.state === "invalid") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
        <p role="status" className="text-lg font-medium">
          {invitationMessages.invalid}
        </p>
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link href="/ingresar">Ir a ingresar</Link>
        </Button>
      </main>
    );
  }

  const session = invitation.hasAccount ? await getSession() : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Te invitaron a {invitation.restaurantName}</h1>
        <p className="text-sm text-muted-foreground">
          Como {roleLabel[invitation.role]} · {invitation.email}
        </p>
      </div>

      {invitation.hasAccount ? (
        <>
          <p className="text-sm">
            Ya tienes una cuenta en Booker con este email. Úsala para unirte; no necesitas otra
            contraseña.
          </p>
          <ExistingUserForm
            token={token}
            restaurantName={invitation.restaurantName}
            signedInAsInvitee={session?.user.email === invitation.email}
          />
        </>
      ) : (
        <NewUserForm token={token} />
      )}
    </main>
  );
}
