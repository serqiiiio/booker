import { describe, expect, it } from "vitest";
import {
  INVITATION_TTL_MS,
  generateInvitationToken,
  hashInvitationToken,
  invitationExpiresAt,
  invitationState,
} from "@/lib/invitations";

const now = new Date("2026-10-15T14:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("invitationExpiresAt (RF-004)", () => {
  it("expires 7 days after it is sent", () => {
    expect(INVITATION_TTL_MS).toBe(7 * DAY);
    expect(invitationExpiresAt(now)).toEqual(new Date("2026-10-22T14:00:00Z"));
  });
});

describe("invitationState (RF-004, RF-007)", () => {
  const expiresAt = invitationExpiresAt(now);

  it("is valid while pending and before it expires", () => {
    expect(invitationState({ status: "pending", expiresAt }, now)).toBe("valid");
    const lastMoment = new Date(expiresAt.getTime() - 1);
    expect(invitationState({ status: "pending", expiresAt }, lastMoment)).toBe("valid");
  });

  it("is expired from the exact expiry moment on", () => {
    expect(invitationState({ status: "pending", expiresAt }, expiresAt)).toBe("expired");
    const later = new Date(expiresAt.getTime() + DAY);
    expect(invitationState({ status: "pending", expiresAt }, later)).toBe("expired");
  });

  it("cannot be used twice: an accepted invitation is no longer valid", () => {
    expect(invitationState({ status: "accepted", expiresAt }, now)).toBe("accepted");
  });

  it("is no longer valid once cancelled or re-sent (RF-016)", () => {
    expect(invitationState({ status: "cancelled", expiresAt }, now)).toBe("cancelled");
  });

  it("reports accepted/cancelled even after the expiry date", () => {
    const later = new Date(expiresAt.getTime() + DAY);
    expect(invitationState({ status: "accepted", expiresAt }, later)).toBe("accepted");
    expect(invitationState({ status: "cancelled", expiresAt }, later)).toBe("cancelled");
  });
});

describe("invitation tokens", () => {
  it("generates unique, URL-safe tokens", () => {
    const a = generateInvitationToken();
    const b = generateInvitationToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("hashes a token deterministically, without exposing it", () => {
    const token = generateInvitationToken();
    const hash = hashInvitationToken(token);
    expect(hash).toBe(hashInvitationToken(token));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashInvitationToken(generateInvitationToken())).not.toBe(hash);
  });
});
