import { describe, expect, it } from "vitest";
import { invitationEmail } from "@/lib/emails/invitation";

const link = "https://booker.bo/invitacion/abc123";

describe("invitationEmail (spec 001, Textos y avisos)", () => {
  it("names the restaurant in the subject", () => {
    const email = invitationEmail({ restaurantName: "La Casona", link });
    expect(email.subject).toBe("Te invitaron a La Casona en Booker");
  });

  it("has the 'Crear mi contraseña' button with the link and says it expires in 7 days", () => {
    const email = invitationEmail({ restaurantName: "La Casona", link });
    expect(email.html).toContain(`href="${link}"`);
    expect(email.html).toContain("Crear mi contraseña");
    expect(email.html).toContain("7 días");
    expect(email.text).toContain(link);
    expect(email.text).toContain("7 días");
  });

  it("escapes the restaurant name in the HTML", () => {
    const email = invitationEmail({ restaurantName: "Tom & <Jerry>", link });
    expect(email.html).toContain("Tom &amp; &lt;Jerry&gt;");
    expect(email.html).not.toContain("<Jerry>");
  });
});
