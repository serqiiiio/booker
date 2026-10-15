import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/emails/invitation";
import { invitationLink } from "@/lib/url";

export async function restaurantName(restaurantId: string): Promise<string> {
  const [row] = await db
    .select({ name: restaurants.name })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId));
  return row?.name ?? "tu restaurante";
}

// Sends the invitation email. A failed email must not lose the invitation:
// the link is still shown to copy and send by WhatsApp (RF-003).
export async function sendInvitationEmail(input: {
  to: string;
  restaurantName: string;
  token: string;
}): Promise<{ link: string; emailSent: boolean }> {
  const link = invitationLink(input.token);
  try {
    await sendEmail({ to: input.to, ...invitationEmail({ restaurantName: input.restaurantName, link }) });
    return { link, emailSent: true };
  } catch (error) {
    console.error("Invitation email failed", error);
    return { link, emailSent: false };
  }
}
