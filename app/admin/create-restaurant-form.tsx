"use client";

import { type FormEvent, useState, useTransition } from "react";
import { InvitationLink } from "@/components/invitation-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callAction } from "@/lib/client/call-action";
import { type InvitationResult, createRestaurant } from "./actions";

export function CreateRestaurantForm() {
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [result, setResult] = useState<InvitationResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const response = await callAction(() => createRestaurant({ name, ownerEmail }));
      setResult(response);
      if (response.ok) {
        setName("");
        setOwnerEmail("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="restaurant-name">Nombre del restaurante</Label>
          <Input
            id="restaurant-name"
            required
            className="h-11"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="owner-email">Email del dueño</Label>
          <Input
            id="owner-email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            required
            className="h-11"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
        </div>
        {result && !result.ok && (
          <p role="alert" className="text-sm text-destructive">
            {result.error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11" disabled={pending}>
          {pending ? "Creando…" : "Crear restaurante e invitar"}
        </Button>
      </form>
      {result?.ok && (
        <InvitationLink link={result.link} email={result.email} emailSent={result.emailSent} />
      )}
    </div>
  );
}
