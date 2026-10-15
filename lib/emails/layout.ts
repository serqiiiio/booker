export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Minimal, inline-styled layout that renders well in Gmail and Outlook on a
// phone. Every value must already be escaped.
export function emailLayout({
  heading,
  body,
  button,
  footer,
}: {
  heading: string;
  body: string;
  button: { label: string; href: string };
  footer: string;
}): string {
  return `<!doctype html>
<html lang="es-BO">
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#171717">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px">
      <h1 style="margin:0 0 12px;font-size:20px">${heading}</h1>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.5">${body}</p>
      <a href="${button.href}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">${button.label}</a>
      <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#737373">${footer}</p>
    </div>
  </body>
</html>`;
}
