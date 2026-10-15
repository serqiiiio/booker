import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { memberRoles } from "@/lib/roles";

export { memberRoles, type MemberRole } from "@/lib/roles";

// Constitution II.5: every date is stored as timestamptz (UTC).
const tstz = (name: string) => timestamp(name, { withTimezone: true });

// ---------------------------------------------------------------------------
// Identity (Better Auth). Generated with `pnpm dlx auth generate`, then adapted
// to timestamptz. These are not business tables: a user can belong to several
// restaurants, so they have no restaurant_id (plan 001, "Modelo de datos").
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  isPlatformAdmin: boolean("is_platform_admin").default(false).notNull(),
  createdAt: tstz("created_at").defaultNow().notNull(),
  updatedAt: tstz("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: tstz("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: tstz("access_token_expires_at"),
    refreshTokenExpiresAt: tstz("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: tstz("expires_at").notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Failed sign-in attempts per email (RF-010). Keyed by email, existing or not,
// so the lockout does not reveal who has an account.
export const loginLockouts = pgTable(
  "login_lockouts",
  {
    email: text("email").primaryKey(),
    failedCount: integer("failed_count").default(0).notNull(),
    lockedUntil: tstz("locked_until"),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [check("login_lockouts_email_lowercase", sql`${table.email} = lower(${table.email})`)],
);

// ---------------------------------------------------------------------------
// Tenancy: restaurants, who belongs to them, and invitations.
// ---------------------------------------------------------------------------

export const restaurantStatuses = ["active", "suspended"] as const;
export type RestaurantStatus = (typeof restaurantStatuses)[number];

export const invitationStatuses = ["pending", "accepted", "cancelled"] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    status: text("status", { enum: restaurantStatuses }).default("active").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: tstz("created_at").defaultNow().notNull(),
    suspendedAt: tstz("suspended_at"),
  },
  (table) => [
    check("restaurants_status_valid", sql`${table.status} in ('active', 'suspended')`),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: memberRoles }).notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("memberships_restaurant_user_unique").on(table.restaurantId, table.userId),
    index("memberships_user_idx").on(table.userId),
    check("memberships_role_valid", sql`${table.role} in ('owner', 'staff')`),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role", { enum: memberRoles }).notNull(),
    // SHA-256 of the token; the plain token only lives in the link, shown once
    // when the invitation is created or re-sent (RF-003).
    tokenHash: text("token_hash").notNull().unique(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id),
    status: text("status", { enum: invitationStatuses }).default("pending").notNull(),
    // "Expired" is not stored: it is derived from expires_at and now.
    expiresAt: tstz("expires_at").notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    acceptedAt: tstz("accepted_at"),
  },
  (table) => [
    // Only one pending invitation per email and restaurant.
    uniqueIndex("invitations_pending_unique")
      .on(table.restaurantId, table.email)
      .where(sql`${table.status} = 'pending'`),
    check("invitations_email_lowercase", sql`${table.email} = lower(${table.email})`),
    check("invitations_role_valid", sql`${table.role} in ('owner', 'staff')`),
    check(
      "invitations_status_valid",
      sql`${table.status} in ('pending', 'accepted', 'cancelled')`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Relations (for Drizzle's query API)
// ---------------------------------------------------------------------------

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(memberships),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const restaurantRelations = relations(restaurants, ({ many }) => ({
  memberships: many(memberships),
  invitations: many(invitations),
}));

export const membershipRelations = relations(memberships, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [memberships.restaurantId],
    references: [restaurants.id],
  }),
  user: one(user, { fields: [memberships.userId], references: [user.id] }),
}));

export const invitationRelations = relations(invitations, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [invitations.restaurantId],
    references: [restaurants.id],
  }),
  invitedBy: one(user, { fields: [invitations.invitedBy], references: [user.id] }),
}));
