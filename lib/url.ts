// Public base URL of the app, for links sent by email (no trailing slash).
export function appUrl(path = ""): string {
  const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path}`;
}

export function passwordResetLink(token: string): string {
  return appUrl(`/recuperar/nueva?token=${encodeURIComponent(token)}`);
}

export function invitationLink(token: string): string {
  return appUrl(`/invitacion/${token}`);
}
