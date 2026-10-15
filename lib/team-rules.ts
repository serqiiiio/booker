import type { MemberRole } from "@/lib/roles";

export type TeamMember = { userId: string; role: MemberRole };

export type TeamChange =
  | { type: "remove"; userId: string }
  | { type: "changeRole"; userId: string; role: MemberRole };

export type TeamChangeCheck = { ok: true } | { ok: false; reason: "last_owner" | "not_member" };

// RF-017: a restaurant always keeps at least one owner. The caller must pass
// the members read inside the same transaction that applies the change (with
// the owners locked), so two owners cannot remove each other at once.
export function checkTeamChange(members: TeamMember[], change: TeamChange): TeamChangeCheck {
  const target = members.find((m) => m.userId === change.userId);
  if (!target) return { ok: false, reason: "not_member" };

  const after = members.flatMap((m): TeamMember[] => {
    if (m.userId !== change.userId) return [m];
    return change.type === "remove" ? [] : [{ ...m, role: change.role }];
  });

  return after.some((m) => m.role === "owner") ? { ok: true } : { ok: false, reason: "last_owner" };
}
