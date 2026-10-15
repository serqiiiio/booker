"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callAction } from "@/lib/client/call-action";
import { type AcceptResult, acceptAsExistingUser, acceptAsNewUser } from "./actions";

function useAccept() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<AcceptResult>) {
    setError(null);
    startTransition(async () => {
      const result = await callAction(action);
      if (result.ok) {
        router.replace(result.redirectTo);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return { error, pending, run };
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  );
}

// RF-005: name + password. Controlled fields keep what was typed (RF-026).
export function NewUserForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { error, pending, run } = useAccept();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(() => acceptAsNewUser({ token, name, password }));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Tu nombre</Label>
        <Input
          id="name"
          autoComplete="name"
          required
          className="h-11"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Crea tu contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="password-hint"
          className="h-11"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Al menos 8 caracteres.
        </p>
      </div>
      <FormError error={error} />
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Creando tu cuenta…" : "Crear mi cuenta"}
      </Button>
    </form>
  );
}

// RF-006: joins with the existing account; no new password.
export function ExistingUserForm({
  token,
  restaurantName,
  signedInAsInvitee,
}: {
  token: string;
  restaurantName: string;
  signedInAsInvitee: boolean;
}) {
  const [password, setPassword] = useState("");
  const { error, pending, run } = useAccept();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(() => acceptAsExistingUser({ token, password: signedInAsInvitee ? undefined : password }));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {!signedInAsInvitee && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Tu contraseña de Booker</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}
      <FormError error={error} />
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Uniéndote…" : `Unirme a ${restaurantName}`}
      </Button>
    </form>
  );
}
