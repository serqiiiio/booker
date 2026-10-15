"use client";

import { useState, useTransition } from "react";
import { InvitationLink } from "@/components/invitation-link";
import { Button } from "@/components/ui/button";
import type { AdminRestaurant } from "@/lib/admin";
import { callAction } from "@/lib/client/call-action";
import { type InvitationResult, changeRestaurantStatus, resendOwnerInvitation } from "./actions";

export function RestaurantActions({ restaurant }: { restaurant: AdminRestaurant }) {
  const [resent, setResent] = useState<InvitationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const suspended = restaurant.status === "suspended";

  function toggleStatus() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() =>
        changeRestaurantStatus({
          restaurantId: restaurant.id,
          status: suspended ? "active" : "suspended",
        }),
      );
      if (!result.ok) setError(result.error);
    });
  }

  function resend(invitationId: string) {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() =>
        resendOwnerInvitation({ restaurantId: restaurant.id, invitationId }),
      );
      if (result.ok) setResent(result);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {restaurant.pendingOwnerInvitation && (
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={pending}
            onClick={() => resend(restaurant.pendingOwnerInvitation!.id)}
          >
            Reenviar invitación
          </Button>
        )}
        <Button
          type="button"
          variant={suspended ? "default" : "destructive"}
          className="h-11 flex-1"
          disabled={pending}
          onClick={toggleStatus}
        >
          {suspended ? "Reactivar" : "Suspender"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {resent?.ok && (
        <InvitationLink link={resent.link} email={resent.email} emailSent={resent.emailSent} />
      )}
    </div>
  );
}
