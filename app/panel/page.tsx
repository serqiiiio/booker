import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listUserRestaurants } from "@/lib/auth/access";
import { accessMessages } from "@/lib/auth/errors";
import { requireSession } from "@/lib/auth/guard";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Panel · Booker" };

const roleLabel = { owner: "Dueño", staff: "Staff" } as const;

// RF-021: one restaurant → straight in; several → choose; none → say so.
export default async function PanelPage() {
  const session = await requireSession();
  const restaurants = await listUserRestaurants(session.user.id);

  if (restaurants.length === 1) redirect(`/panel/${restaurants[0].id}`);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Hola, {session.user.name}</h1>

      {restaurants.length === 0 ? (
        <p role="status" className="text-muted-foreground">
          {accessMessages.noRestaurants}
        </p>
      ) : (
        <nav aria-label="Tus restaurantes" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Elige un local</h2>
          <ul className="flex flex-col gap-2">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/panel/${r.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 py-3 active:bg-muted"
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {r.status === "suspended" ? "Suspendido" : roleLabel[r.role]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <SignOutButton />
    </main>
  );
}
