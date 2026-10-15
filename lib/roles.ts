// Shared by the DB schema, Zod schemas and the UI (safe to import on the client).
export const memberRoles = ["owner", "staff"] as const;
export type MemberRole = (typeof memberRoles)[number];
