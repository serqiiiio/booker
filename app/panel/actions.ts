"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// RF-012: ends the session on this device only.
export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/ingresar");
}
