"use client";

import { type FormEvent, useState, useTransition } from "react";
import { InvitationLink } from "@/components/invitation-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callAction } from "@/lib/client/call-action";
import type { MemberRole } from "@/lib/roles";
import { type InviteResult, invite } from "./actions";

const roles: { value: MemberRole; label: string; hint: string }[] = [
  { value: "staff", label: "Staff", hint: "Opera el panel del día." },
  { value: "owner", label: "Dueño", hint: "Además maneja el equipo y la configuración." },
];

// RF-013. Controlled fields keep what was typed if the request fails (RF-026).
export function InviteForm({ restaurantId }: { restaurantId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("staff");
  const [result, setResult] = useState<InviteResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const response = await callAction(() => invite(restaurantId, { email, role }));
      setResult(response);
      if (response.ok) setEmail("");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            required
            className="h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Rol</legend>
          {roles.map((r) => (
            <label
              key={r.value}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 has-[:checked]:border-foreground"
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="mt-1 size-4"
              />
              <span className="flex flex-col">
                <span className="font-medium">{r.label}</span>
                <span className="text-sm text-muted-foreground">{r.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {result && !result.ok && (
          <p role="alert" className="text-sm text-destructive">
            {result.error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11" disabled={pending}>
          {pending ? "Invitando…" : "Invitar"}
        </Button>
      </form>
      {result?.ok && (
        <InvitationLink link={result.link} email={result.email} emailSent={result.emailSent} />
      )}
    </div>
  );
}
