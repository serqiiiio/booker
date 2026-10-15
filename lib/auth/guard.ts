import { redirect } from "next/navigation";
import { type AccessDenied, checkMemberAccess, isPlatformAdmin } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";
import type { Action } from "@/lib/permissions";

// Every page and Server Action of the panel goes through these (constitution
// III.2): session, membership, role and restaurant status are checked on the
// server on each request.

export class AccessError extends Error {
  constructor(readonly reason: AccessDenied) {
    super(`Access denied: ${reason}`);
    this.name = "AccessError";
  }
}

// Without a session, pages send the user to sign in.
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/ingresar");
  return session;
}

// For pages: returns the denial so the page can show the matching screen.
export async function getMemberAccess(restaurantId: string, action: Action = "panel.operate") {
  const session = await requireSession();
  const access = await checkMemberAccess(session.user.id, restaurantId, action);
  return { session, access };
}

// For Server Actions: throws AccessError when the user may not do `action`.
export async function requireMember(restaurantId: string, action: Action = "panel.operate") {
  const { session, access } = await getMemberAccess(restaurantId, action);
  if (!access.ok) throw new AccessError(access.reason);
  return { session, role: access.role, restaurant: access.restaurant };
}

export async function requirePlatformAdmin() {
  const session = await requireSession();
  if (!(await isPlatformAdmin(session.user.id))) throw new AccessError("forbidden");
  return session;
}
