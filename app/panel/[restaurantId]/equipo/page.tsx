import type { Metadata } from "next";
import Link from "next/link";
import { getMemberAccess } from "@/lib/auth/guard";
import { listTeam } from "@/lib/team";
import { AccessDenied } from "../../access-denied";
import { InviteForm } from "./invite-form";
import { InvitationItem, MemberItem } from "./team-list";

export const metadata: Metadata = { title: "Equipo · Booker" };

// HU-4: only owners (RF-018); staff gets "Solo el dueño puede hacer esto."
export default async function TeamPage({ params }: PageProps<"/panel/[restaurantId]/equipo">) {
  const { restaurantId } = await params;
  const { session, access } = await getMemberAccess(restaurantId, "team.manage");
  if (!access.ok) return <AccessDenied reason={access.reason} />;

  const team = await listTeam(access.restaurant.id, new Date());

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-1">
        <Link href={`/panel/${access.restaurant.id}`} className="text-sm underline underline-offset-4">
          ← {access.restaurant.name}
        </Link>
        <h1 className="text-2xl font-semibold">Equipo</h1>
      </header>

      <section aria-labelledby="invite" className="flex flex-col gap-4">
        <h2 id="invite" className="text-lg font-medium">
          Invitar a alguien
        </h2>
        <InviteForm restaurantId={access.restaurant.id} />
      </section>

      <section aria-labelledby="members" className="flex flex-col gap-3">
        <h2 id="members" className="text-lg font-medium">
          Personas ({team.members.length})
        </h2>
        <ul className="flex flex-col gap-3">
          {team.members.map((m) => (
            <MemberItem
              key={m.membershipId}
              restaurantId={access.restaurant.id}
              member={m}
              isMe={m.userId === session.user.id}
            />
          ))}
        </ul>
      </section>

      {team.invitations.length > 0 && (
        <section aria-labelledby="invitations" className="flex flex-col gap-3">
          <h2 id="invitations" className="text-lg font-medium">
            Invitaciones ({team.invitations.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {team.invitations.map((i) => (
              // Keyed by email (one pending invitation per email): re-sending
              // replaces the row's id, and the new link shown once must survive.
              <InvitationItem key={i.email} restaurantId={access.restaurant.id} invitation={i} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
