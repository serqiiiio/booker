import { emailLayout, escapeHtml } from "@/lib/emails/layout";

// Spec 001, "Textos y avisos": email sent when someone is invited.
export function invitationEmail({ restaurantName, link }: { restaurantName: string; link: string }) {
  const subject = `Te invitaron a ${restaurantName} en Booker`;
  const name = escapeHtml(restaurantName);
  const href = escapeHtml(link);

  return {
    subject,
    html: emailLayout({
      heading: `Te invitaron a ${name} en Booker`,
      body: "Crea tu contraseña para entrar al panel de reservas del restaurante.",
      button: { label: "Crear mi contraseña", href },
      footer: `Este link vence en 7 días y sirve una sola vez. Si no esperabas esta invitación, ignora este email.`,
    }),
    text: [
      `Te invitaron a ${restaurantName} en Booker.`,
      "",
      `Crea tu contraseña aquí: ${link}`,
      "",
      "Este link vence en 7 días y sirve una sola vez.",
    ].join("\n"),
  };
}
