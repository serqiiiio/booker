import { authMessages } from "@/lib/auth/errors";

type Failure = { ok: false; error: string };

// Calls a Server Action from a client form. Without connection it returns the
// offline message instead of throwing, so the form keeps what was typed (RF-026).
export async function callAction<T>(action: () => Promise<T>): Promise<T | Failure> {
  if (!navigator.onLine) return { ok: false, error: authMessages.offline };
  try {
    return await action();
  } catch {
    return {
      ok: false,
      error: navigator.onLine ? authMessages.unexpected : authMessages.offline,
    };
  }
}
