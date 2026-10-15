import { createHash, randomBytes } from "node:crypto";

// RF-004: an invitation can be used once and expires 7 days after it is sent.
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InvitationState = "valid" | "expired" | "accepted" | "cancelled";

export function invitationExpiresAt(now: Date): Date {
  return new Date(now.getTime() + INVITATION_TTL_MS);
}

// "Expired" is never stored: it is derived from expiresAt and now.
export function invitationState(
  invitation: { status: "pending" | "accepted" | "cancelled"; expiresAt: Date },
  now: Date,
): InvitationState {
  if (invitation.status !== "pending") return invitation.status;
  return now.getTime() < invitation.expiresAt.getTime() ? "valid" : "expired";
}

// The plain token only travels in the link; the database keeps its SHA-256.
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
