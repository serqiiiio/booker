import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listUserRestaurants } from "@/lib/auth/access";
import { getMemberAccess } from "@/lib/auth/guard";
import { can } from "@/lib/permissions";
import { AccessDenied } from "../access-denied";
import { SignOutButton } from "../sign-out-button";

export const metadata: Metadata = { title: "Panel · Booker" };

const roleLabel = { owner: "Dueño", staff: "Staff" } as const;

// Placeholder home of a restaurant's panel; the day's panel arrives with spec 005.
export default async function RestaurantPanelPage({
  params,
}: PageProps<"/panel/[restaurantId]">) {
  const { restaurantId } = await params;
  const { session, access } = await getMemberAccess(restaurantId);
  if (!access.ok) return <AccessDenied reason={access.reason} />;

  const hasOtherRestaurants = (await listUserRestaurants(session.user.id)).length > 1;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{access.restaurant.name}</h1>
        <p className="text-sm text-muted-foreground">
          {session.user.name} · {roleLabel[access.role]}
        </p>
      </header>

      <p className="text-muted-foreground">El panel del día llega pronto.</p>

      <div className="flex flex-col gap-3">
        {can(access.role, "team.manage") && (
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link href={`/panel/${access.restaurant.id}/equipo`}>Equipo</Link>
          </Button>
        )}
        {hasOtherRestaurants && (
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link href="/panel">Cambiar de local</Link>
          </Button>
        )}
        <SignOutButton />
      </div>
    </main>
  );
}
