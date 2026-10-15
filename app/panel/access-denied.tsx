import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AccessDenied as Reason } from "@/lib/auth/access";
import { accessMessages } from "@/lib/auth/errors";
import { SignOutButton } from "./sign-out-button";

const messages: Record<Reason, string> = {
  not_member: accessMessages.notMember,
  forbidden: accessMessages.forbidden,
  suspended: accessMessages.suspended,
};

export function AccessDenied({ reason }: { reason: Reason }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <p role="status" className="text-lg font-medium">
        {messages[reason]}
      </p>
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="h-11">
          <Link href="/panel">Ver mis restaurantes</Link>
        </Button>
        <SignOutButton />
      </div>
    </main>
  );
}
