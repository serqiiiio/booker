import { describe, expect, it } from "vitest";
import { passwordResetEmail } from "@/lib/emails/password-reset";

const link = "https://booker.bo/recuperar/nueva?token=abc123";

describe("passwordResetEmail (spec 001, Textos y avisos)", () => {
  it("has the subject, the 'Crear nueva contraseña' button and says it expires in 1 hour", () => {
    const email = passwordResetEmail({ link });
    expect(email.subject).toBe("Cambia tu contraseña de Booker");
    expect(email.html).toContain(`href="${link}"`);
    expect(email.html).toContain("Crear nueva contraseña");
    expect(email.html).toContain("1 hora");
    expect(email.text).toContain(link);
    expect(email.text).toContain("1 hora");
  });
});
