import { z } from "zod";
import { memberRoles } from "@/lib/roles";

// Shared by forms and Server Actions (constitution III.1). UI messages in es-BO.

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Ingresa un email válido." }));

export const passwordSchema = z
  .string()
  .min(8, { error: "La contraseña debe tener al menos 8 caracteres." })
  .max(128, { error: "La contraseña puede tener como máximo 128 caracteres." });

export const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "Ingresa tu nombre." })
  .max(100, { error: "El nombre puede tener como máximo 100 caracteres." });

export const roleSchema = z.enum(memberRoles, { error: "Elige un rol válido." });

export const restaurantIdSchema = z.uuid();

// Sign-in does not apply the password rules: it must reveal nothing (RF-009).
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Ingresa tu contraseña." }),
});

export const acceptInvitationSchema = z.object({
  name: nameSchema,
  password: passwordSchema,
});

export const inviteSchema = z.object({
  email: emailSchema,
  role: roleSchema,
});

export const changeRoleSchema = z.object({
  membershipId: z.uuid(),
  role: roleSchema,
});

export const createRestaurantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Ingresa el nombre del restaurante." })
    .max(100, { error: "El nombre puede tener como máximo 100 caracteres." }),
  ownerEmail: emailSchema,
});
