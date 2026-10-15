import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type AdminRestaurant, listRestaurantsForAdmin } from "@/lib/admin";
import { AccessError, requirePlatformAdmin } from "@/lib/auth/guard";
import { CreateRestaurantForm } from "./create-restaurant-form";
import { RestaurantActions } from "./restaurant-actions";

export const metadata: Metadata = { title: "Administración · Booker" };

const dateFormat = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeZone: "America/La_Paz",
});

// RF-027: only the founder. Anyone else gets a 404, which reveals nothing.
export default async function AdminPage() {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const restaurants = await listRestaurantsForAdmin();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Administración</h1>
        <Link href="/panel" className="text-sm underline underline-offset-4">
          Ir al panel
        </Link>
      </header>

      <section aria-labelledby="new-restaurant" className="flex flex-col gap-4">
        <h2 id="new-restaurant" className="text-lg font-medium">
          Nuevo restaurante
        </h2>
        <CreateRestaurantForm />
      </section>

      <section aria-labelledby="restaurants" className="flex flex-col gap-4">
        <h2 id="restaurants" className="text-lg font-medium">
          Restaurantes ({restaurants.length})
        </h2>
        {restaurants.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay restaurantes.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {restaurants.map((r) => (
              <li key={r.id} aria-label={r.name} className="flex flex-col gap-3 rounded-lg border p-4">
                <RestaurantSummary restaurant={r} />
                <RestaurantActions restaurant={r} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function RestaurantSummary({ restaurant: r }: { restaurant: AdminRestaurant }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{r.name}</span>
        <span
          className={
            r.status === "suspended"
              ? "text-sm font-medium text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {r.status === "suspended" ? "Suspendido" : "Activo"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {r.owners === 1 ? "1 dueño" : `${r.owners} dueños`}
        {r.pendingOwnerInvitation &&
          ` · Invitación pendiente a ${r.pendingOwnerInvitation.email} (vence el ${dateFormat.format(
            r.pendingOwnerInvitation.expiresAt,
          )})`}
      </p>
    </div>
  );
}
