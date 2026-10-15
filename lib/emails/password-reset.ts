import { emailLayout, escapeHtml } from "@/lib/emails/layout";

// Spec 001, "Textos y avisos": email sent when someone asks to reset their password.
export function passwordResetEmail({ link }: { link: string }) {
  return {
    subject: "Cambia tu contraseña de Booker",
    html: emailLayout({
      heading: "Cambia tu contraseña de Booker",
      body: "Pediste crear una contraseña nueva para tu cuenta de Booker.",
      button: { label: "Crear nueva contraseña", href: escapeHtml(link) },
      footer:
        "Este link vence en 1 hora y sirve una sola vez. Si no lo pediste, ignora este email: tu contraseña no cambia.",
    }),
    text: [
      "Pediste crear una contraseña nueva para tu cuenta de Booker.",
      "",
      `Créala aquí: ${link}`,
      "",
      "Este link vence en 1 hora y sirve una sola vez. Si no lo pediste, ignora este email.",
    ].join("\n"),
  };
}
