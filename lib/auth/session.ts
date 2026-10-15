import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Current staff session for Server Components and Server Actions, or null.
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
