"use client";

import { Button } from "@/components/ui/button";

// Replaces Next's default (English) error screen (constitution II.7).
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="text-muted-foreground">
        No pudimos cargar esta página. Revisa tu conexión e intenta de nuevo.
      </p>
      <Button type="button" size="lg" className="h-11" onClick={reset}>
        Intentar de nuevo
      </Button>
    </main>
  );
}
