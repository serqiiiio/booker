"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Shows an invitation link once (it is not stored), with a copy button so it
// can also be sent by WhatsApp (RF-003).
export function InvitationLink({
  link,
  email,
  emailSent,
}: {
  link: string;
  email: string;
  emailSent: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard blocked: the field below is selectable by hand.
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
      <p role="status" className="text-sm">
        {emailSent
          ? `Le enviamos la invitación a ${email}.`
          : `No pudimos enviar el email a ${email}. Copia el link y mándaselo por WhatsApp.`}
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Link de invitación
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full rounded-lg border bg-background px-3 font-mono text-xs"
        />
      </label>
      <Button type="button" size="lg" className="h-11" onClick={copy}>
        {copied ? "Link copiado" : "Copiar link"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Este link se muestra una sola vez. Para verlo de nuevo, reenvía la invitación.
      </p>
    </div>
  );
}
