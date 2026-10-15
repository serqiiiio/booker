import { describe, expect, it } from "vitest";
import {
  acceptInvitationSchema,
  changeRoleSchema,
  createRestaurantSchema,
  emailSchema,
  inviteSchema,
  loginSchema,
  passwordSchema,
  restaurantIdSchema,
} from "@/lib/schemas/auth";

const uuid = "3f1c2b9e-8a4d-4c1e-9b2a-6d5e4f3a2b1c";

function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe("emailSchema", () => {
  it("trims and lowercases the email", () => {
    expect(emailSchema.parse("  Mesero@Gmail.COM ")).toBe("mesero@gmail.com");
  });

  it("rejects an invalid email with a message in Spanish", () => {
    const result = emailSchema.safeParse("mesero@");
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe("Ingresa un email válido.");
  });
});

describe("passwordSchema (RF-005)", () => {
  it("accepts 8 characters or more", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });

  it("rejects fewer than 8 characters", () => {
    const result = passwordSchema.safeParse("1234567");
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe("La contraseña debe tener al menos 8 caracteres.");
  });

  it("rejects more than 128 characters", () => {
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });
});

describe("loginSchema (RF-009)", () => {
  it("does not apply the password length rule, so it reveals nothing about the policy", () => {
    expect(loginSchema.safeParse({ email: "ana@example.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "ana@example.com", password: "" }).success).toBe(false);
  });
});

describe("acceptInvitationSchema (RF-005)", () => {
  it("requires a name and a valid password", () => {
    expect(
      acceptInvitationSchema.parse({ name: "  Ana Quispe ", password: "secreta123" }),
    ).toEqual({ name: "Ana Quispe", password: "secreta123" });

    const blankName = acceptInvitationSchema.safeParse({ name: "   ", password: "secreta123" });
    expect(blankName.success).toBe(false);
    expect(firstError(blankName)).toBe("Ingresa tu nombre.");
  });
});

describe("inviteSchema (RF-013)", () => {
  it("accepts an owner or staff invitation and normalizes the email", () => {
    expect(inviteSchema.parse({ email: "Ana@Example.com", role: "owner" })).toEqual({
      email: "ana@example.com",
      role: "owner",
    });
  });

  it("rejects an unknown role", () => {
    expect(inviteSchema.safeParse({ email: "ana@example.com", role: "manager" }).success).toBe(
      false,
    );
  });
});

describe("changeRoleSchema (RF-025)", () => {
  it("requires a membership id and a valid role", () => {
    expect(changeRoleSchema.safeParse({ membershipId: uuid, role: "staff" }).success).toBe(true);
    expect(changeRoleSchema.safeParse({ membershipId: "1", role: "staff" }).success).toBe(false);
  });
});

describe("createRestaurantSchema (RF-001, RF-002)", () => {
  it("requires the restaurant name and the owner's email", () => {
    expect(
      createRestaurantSchema.parse({ name: " La Casona ", ownerEmail: "Dueno@Example.com" }),
    ).toEqual({ name: "La Casona", ownerEmail: "dueno@example.com" });

    const blank = createRestaurantSchema.safeParse({ name: "", ownerEmail: "dueno@example.com" });
    expect(firstError(blank)).toBe("Ingresa el nombre del restaurante.");
  });
});

describe("restaurantIdSchema (RF-022)", () => {
  it("only accepts a UUID", () => {
    expect(restaurantIdSchema.safeParse(uuid).success).toBe(true);
    expect(restaurantIdSchema.safeParse("../admin").success).toBe(false);
  });
});
