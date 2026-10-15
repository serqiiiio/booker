import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
      <p className="text-muted-foreground">Revisa el link o vuelve al inicio.</p>
      <Link href="/" className="underline underline-offset-4">
        Ir al inicio
      </Link>
    </main>
  );
}
