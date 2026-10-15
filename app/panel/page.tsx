import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Panel · Booker" };

// Placeholder until T5 adds the restaurant selector and the access guard.
export default async function PanelPage() {
  const session = await getSession();
  if (!session) redirect("/ingresar");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Hola, {session.user.name}</h1>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="lg" className="h-11 w-full">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
