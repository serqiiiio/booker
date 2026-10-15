import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { hashInvitationToken } from "@/lib/invitations";
import {
  createRestaurantWithOwnerInvitation,
  resendInvitation,
  setRestaurantStatus,
} from "@/lib/invitations-store";
import { createUser, db, resetDb, schema } from "@/test/db";

beforeEach(resetDb);

const now = new Date("2026-10-15T14:00:00Z");

describe("createRestaurantWithOwnerInvitation (RF-001, RF-002, RF-004)", () => {
  it("creates the restaurant and a pending owner invitation that stores only the token's hash", async () => {
    const founder = await createUser("fundador@example.com");

    const { restaurant, invitation, token } = await createRestaurantWithOwnerInvitation({
      name: "La Casona",
      ownerEmail: "dueno@example.com",
      createdBy: founder.id,
      now,
    });

    expect(restaurant).toMatchObject({ name: "La Casona", status: "active" });
    expect(invitation).toMatchObject({
      restaurantId: restaurant.id,
      email: "dueno@example.com",
      role: "owner",
      status: "pending",
      invitedBy: founder.id,
      expiresAt: new Date("2026-10-22T14:00:00Z"),
    });
    expect(invitation.tokenHash).toBe(hashInvitationToken(token));
    expect(invitation.tokenHash).not.toContain(token);
  });
});

describe("resendInvitation (RF-003, RF-016)", () => {
  it("cancels the old link and returns a new one with a fresh 7-day expiry", async () => {
    const founder = await createUser("fundador@example.com");
    const first = await createRestaurantWithOwnerInvitation({
      name: "La Casona",
      ownerEmail: "dueno@example.com",
      createdBy: founder.id,
      now,
    });

    const later = new Date("2026-10-18T10:00:00Z");
    const second = await resendInvitation({
      invitationId: first.invitation.id,
      restaurantId: first.restaurant.id,
      invitedBy: founder.id,
      now: later,
    });

    expect(second.token).not.toBe(first.token);
    const [old] = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.id, first.invitation.id));
    expect(old.status).toBe("cancelled");
    expect(second.invitation).toMatchObject({
      email: "dueno@example.com",
      role: "owner",
      status: "pending",
      expiresAt: new Date("2026-10-25T10:00:00Z"),
    });
  });

  it("does not resend an invitation of another restaurant (II.1)", async () => {
    const founder = await createUser("fundador@example.com");
    const casona = await createRestaurantWithOwnerInvitation({
      name: "La Casona",
      ownerEmail: "dueno@example.com",
      createdBy: founder.id,
      now,
    });
    const patio = await createRestaurantWithOwnerInvitation({
      name: "El Patio",
      ownerEmail: "otro@example.com",
      createdBy: founder.id,
      now,
    });

    await expect(
      resendInvitation({
        invitationId: casona.invitation.id,
        restaurantId: patio.restaurant.id,
        invitedBy: founder.id,
        now,
      }),
    ).rejects.toThrow(/not found/i);
  });
});

describe("setRestaurantStatus (RF-023)", () => {
  it("suspends and reactivates without touching the restaurant's data", async () => {
    const founder = await createUser("fundador@example.com");
    const { restaurant } = await createRestaurantWithOwnerInvitation({
      name: "La Casona",
      ownerEmail: "dueno@example.com",
      createdBy: founder.id,
      now,
    });

    const suspended = await setRestaurantStatus(restaurant.id, "suspended", now);
    expect(suspended).toMatchObject({ name: "La Casona", status: "suspended", suspendedAt: now });

    const active = await setRestaurantStatus(restaurant.id, "active", now);
    expect(active).toMatchObject({ name: "La Casona", status: "active", suspendedAt: null });
    const pending = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.restaurantId, restaurant.id));
    expect(pending).toHaveLength(1);
  });
});
