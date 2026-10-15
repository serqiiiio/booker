import type { MemberRole } from "@/lib/roles";

// RF-018: only the owner manages the team and the restaurant settings; staff
// only operates the day's panel.
export type Action = "team.manage" | "settings.manage" | "panel.operate";

const allowed: Record<MemberRole, ReadonlySet<Action>> = {
  owner: new Set(["team.manage", "settings.manage", "panel.operate"]),
  staff: new Set(["panel.operate"]),
};

export function can(role: MemberRole, action: Action): boolean {
  return allowed[role].has(action);
}
