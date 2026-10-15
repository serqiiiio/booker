"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { InvitationLink } from "@/components/invitation-link";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/client/call-action";
import type { TeamInvitationRow, TeamMemberRow } from "@/lib/team";
import { type InviteResult, type TeamResult, cancel, changeRole, remove, resend } from "./actions";

const roleLabel = { owner: "Dueño", staff: "Staff" } as const;

const dateFormat = new Intl.DateTimeFormat("es-BO", {
  day: "numeric",
  month: "short",
  timeZone: "America/La_Paz",
});

function useTeamAction() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<TeamResult>, onLeft?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await callAction(action);
      if (!result.ok) setError(result.error);
      else if (result.leftRestaurant) onLeft?.();
      else router.refresh();
    });
  }
  return { error, pending, run, router };
}

function ActionError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  );
}

export function MemberItem({
  restaurantId,
  member,
  isMe,
}: {
  restaurantId: string;
  member: TeamMemberRow;
  isMe: boolean;
}) {
  const { error, pending, run, router } = useTeamAction();
  const [confirming, setConfirming] = useState(false);
  const otherRole = member.role === "owner" ? "staff" : "owner";

  return (
    <li aria-label={member.name} className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">
            {member.name}
            {isMe && <span className="text-muted-foreground"> (tú)</span>}
          </span>
          <span className="truncate text-sm text-muted-foreground">{member.email}</span>
        </div>
        <span className="text-sm text-muted-foreground">{roleLabel[member.role]}</span>
      </div>

      {confirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {isMe
              ? "¿Salir de este restaurante? Ya no podrás entrar a su panel."
              : `¿Quitar a ${member.name}? Ya no podrá entrar a este restaurante.`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              className="h-11 flex-1"
              disabled={pending}
              onClick={() =>
                run(
                  () => remove(restaurantId, member.membershipId),
                  () => router.replace("/panel"),
                )
              }
            >
              {isMe ? "Sí, salir" : "Sí, quitar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={() => setConfirming(false)}
            >
              No
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const result = await changeRole(restaurantId, {
                  membershipId: member.membershipId,
                  role: otherRole,
                });
                // An owner who makes themself staff can no longer see this screen.
                return result.ok && isMe ? { ok: true, leftRestaurant: true } : result;
              }, () => router.replace(`/panel/${restaurantId}`))
            }
          >
            {otherRole === "owner" ? "Hacer dueño" : "Hacer staff"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={pending}
            onClick={() => setConfirming(true)}
          >
            {isMe ? "Salir" : "Quitar"}
          </Button>
        </div>
      )}
      <ActionError error={error} />
    </li>
  );
}

export function InvitationItem({
  restaurantId,
  invitation,
}: {
  restaurantId: string;
  invitation: TeamInvitationRow;
}) {
  const { error, pending, run } = useTeamAction();
  const [resent, setResent] = useState<InviteResult | null>(null);
  const [resending, startResend] = useTransition();
  const [resendError, setResendError] = useState<string | null>(null);

  function onResend() {
    setResendError(null);
    startResend(async () => {
      const result = await callAction(() => resend(restaurantId, invitation.id));
      if (result.ok) setResent(result);
      else setResendError(result.error);
    });
  }

  return (
    <li aria-label={invitation.email} className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{invitation.email}</span>
          <span className="text-sm text-muted-foreground">
            {invitation.state === "expired"
              ? "Invitación vencida"
              : `Invitación pendiente · vence el ${dateFormat.format(invitation.expiresAt)}`}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">{roleLabel[invitation.role]}</span>
      </div>
      {!resent?.ok && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={pending || resending}
            onClick={onResend}
          >
            Reenviar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={pending || resending}
            onClick={() => run(() => cancel(restaurantId, invitation.id))}
          >
            Cancelar
          </Button>
        </div>
      )}
      <ActionError error={error ?? resendError} />
      {resent?.ok && (
        <InvitationLink link={resent.link} email={resent.email} emailSent={resent.emailSent} />
      )}
    </li>
  );
}
